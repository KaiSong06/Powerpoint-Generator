# pptx-engine

Node.js CLI that reads a JSON payload from stdin and produces an Envirotech-branded `.pptx` presentation.

## Usage

```bash
cat payload.json | node src/index.js
```

The process exits `0` on success and `1` on error (message written to stderr).

## JSON Payload Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `outputPath` | string | yes | File path for the generated `.pptx` |
| `clientName` | string | yes | Client name shown on cover slide |
| `officeAddress` | string | yes | Office address (cover + pricing) |
| `suiteNumber` | string | yes | Suite/unit number |
| `sqFt` | number | yes | Square footage |
| `consultant` | object | yes | `{ name, email, phone }` |
| `products` | array | yes | Array of product objects (see below) |
| `totalCost` | number | yes | Total project cost |
| `costPerSqFt` | number | yes | Cost per square foot |
| `logoPath` | string | no | Path to logo image (defaults to bundled asset) |
| `coverImagePath` | string | no | Cover slide background image |
| `floorPlanUrl` | string | no | Floor plan image URL or local path |
| `date` | string | no | Presentation date (`YYYY-MM-DD`). Defaults to today |

### Product Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `product_code` | string | yes | Unique product code |
| `name` | string | yes | Display name |
| `category` | string | yes | Category key (see below) |
| `specifications` | string | no | Comma-separated spec list |
| `image_url` | string | no | Product image URL or local path |
| `price` | number | yes | Unit price before markup |
| `markup_percent` | number | no | Markup percentage (default `0`) |
| `quantity` | number | yes | Quantity |

### Categories

| Key | Products per slide |
|-----|-------------------|
| `workstation` | 1 |
| `task_seating` | up to 3 |
| `meeting` | up to 3 |
| `lounge` | up to 3 |
| `reception` | up to 3 |
| `storage` | up to 3 |
| `table` | up to 3 |
| `accessory` | up to 3 |
| `phone_booth` | up to 3 |
| `gaming` | up to 3 |
| `planter` | up to 3 |

## Slide Order

1. **Cover** -- background image, client name, address, date, consultant info
2. **Pricing** -- project summary + product table (paginates at 14 rows)
3. **Product slides** -- grouped by category, 1/2/3-product layouts
4. **Thank You** -- closing slide

## Image Handling

All remote image URLs (`http://`, `https://`) are downloaded to temp files before generation. Local file paths are used directly. Missing or unreachable images are silently skipped.

## Performance

Generation typically completes in under 100ms for 15+ slides (excluding image downloads). The engine logs timing to stderr.

## Example

```bash
cat test/full-payload.json | node src/index.js
# Output: test/output-full.pptx (16 slides, 23 products)
```
