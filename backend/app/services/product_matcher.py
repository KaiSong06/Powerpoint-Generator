import math

from ..database import fetch_all


async def match_products(spaces: list[dict]) -> list[dict]:
    """Match products to a space breakdown and calculate quantities.

    Args:
        spaces: List of dicts with keys: space_type (str), count (int), capacity (int | None)

    Returns:
        List of dicts with keys: product_code (str), quantity (int), space_type (str)
    """
    selections: dict[str, dict] = {}  # product_code -> {quantity, space_type}

    for space in spaces:
        space_type = space["space_type"]
        count = space["count"]
        requested_capacity = space.get("capacity")

        # Fetch products whose space_type array contains the requested space type
        rows = await fetch_all(
            """SELECT product_code, product_role, capacity, quantity_rule
               FROM products
               WHERE $1 = ANY(space_type)
                 AND product_role IS NOT NULL
                 AND quantity_rule IS NOT NULL
               ORDER BY product_role, name""",
            space_type,
        )

        if not rows:
            continue

        # If capacity is requested, prefer products closest to (but >= ) requested capacity
        # among products that share the same product_role and quantity_rule
        products = _select_best_capacity_matches(rows, requested_capacity)

        for product in products:
            qty = _calculate_quantity(
                rule=product["quantity_rule"],
                count=count,
                requested_capacity=requested_capacity,
                product_capacity=product["capacity"],
            )

            code = product["product_code"]
            if code in selections:
                selections[code]["quantity"] += qty
            else:
                selections[code] = {
                    "product_code": code,
                    "quantity": qty,
                    "space_type": space_type,
                }

    return list(selections.values())


def _select_best_capacity_matches(
    rows: list, requested_capacity: int | None
) -> list:
    """When capacity is requested, for each (product_role, quantity_rule) group,
    keep only the product with the closest capacity >= requested capacity.
    Products without a capacity value are always included.
    """
    if requested_capacity is None:
        return [dict(r) for r in rows]

    # Group by (product_role, quantity_rule)
    groups: dict[tuple, list] = {}
    no_capacity = []
    for r in rows:
        product = dict(r)
        if product["capacity"] is None:
            no_capacity.append(product)
            continue
        key = (product["product_role"], product["quantity_rule"])
        groups.setdefault(key, []).append(product)

    result = list(no_capacity)
    for _key, products in groups.items():
        # Prefer products with capacity >= requested, closest first
        suitable = [p for p in products if p["capacity"] >= requested_capacity]
        if suitable:
            best = min(suitable, key=lambda p: p["capacity"])
        else:
            # Fall back to highest capacity available
            best = max(products, key=lambda p: p["capacity"])
        result.append(best)

    return result


def _calculate_quantity(
    rule: str,
    count: int,
    requested_capacity: int | None,
    product_capacity: int | None,
) -> int:
    """Calculate quantity based on the quantity rule."""
    if rule == "per_workstation":
        return count
    elif rule == "per_room":
        return count
    elif rule == "per_capacity":
        if requested_capacity and product_capacity and product_capacity > 0:
            return count * math.ceil(requested_capacity / product_capacity)
        # Fall back to per_room if capacity info is missing
        return count
    elif rule == "per_floor":
        return 1
    else:
        return count
