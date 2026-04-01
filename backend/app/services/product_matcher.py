import math

from ..database import fetch_all

# Priority order for budget trimming: primary products are kept longest
_ROLE_PRIORITY = {"primary": 0, "secondary": 1, "accessory": 2}


async def match_products(
    spaces: list[dict], budget: float | None = None
) -> list[dict]:
    """Match products to a space breakdown and calculate quantities.

    Args:
        spaces: List of dicts with keys: space_type (str), count (int), capacity (int | None)
        budget: Optional max total cost. When set, low-priority products are trimmed to fit.

    Returns:
        List of dicts with keys: product_code (str), quantity (int), space_type (str)
    """
    selections: dict[str, dict] = {}  # product_code -> {quantity, space_type, ...}

    for space in spaces:
        space_type = space["space_type"]
        count = space["count"]
        requested_capacity = space.get("capacity")

        # Fetch products whose space_type array contains the requested space type
        rows = await fetch_all(
            """SELECT product_code, product_role, capacity, quantity_rule,
                      price, markup_percent
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

            unit_price = float(product["price"] or 0) * (
                1 + float(product["markup_percent"] or 0) / 100
            )

            code = product["product_code"]
            if code in selections:
                selections[code]["quantity"] += qty
            else:
                selections[code] = {
                    "product_code": code,
                    "quantity": qty,
                    "space_type": space_type,
                    "unit_price": unit_price,
                    "product_role": product["product_role"],
                }

    results = list(selections.values())

    if budget is not None and budget > 0:
        results = _trim_to_budget(results, budget)

    # Strip internal fields before returning
    for r in results:
        r.pop("unit_price", None)
        r.pop("product_role", None)

    return results


def _trim_to_budget(selections: list[dict], budget: float) -> list[dict]:
    """Remove lowest-priority products until total cost fits within budget.

    Priority order: primary (kept longest) > secondary > accessory (removed first).
    Within the same priority, the most expensive line item is removed first.
    """

    def total_cost(items: list[dict]) -> float:
        return sum(item["unit_price"] * item["quantity"] for item in items)

    if total_cost(selections) <= budget:
        return selections

    # Sort so the first item is the best candidate for removal:
    # highest role priority number (accessories first), then most expensive line
    selections.sort(
        key=lambda x: (
            -_ROLE_PRIORITY.get(x.get("product_role", "accessory"), 2),
            -(x["unit_price"] * x["quantity"]),
        )
    )

    while selections and total_cost(selections) > budget:
        selections.pop(0)

    return selections


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
