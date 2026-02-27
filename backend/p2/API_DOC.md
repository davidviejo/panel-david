# API Documentation

## Analyze Page

Analyze a webpage for various SEO metrics.

**Endpoint:** `POST /api/analyze`

**Request Body:**

```json
{
  "pageId": "optional-id",
  "url": "https://example.com",
  "kwPrincipal": "example keyword",
  "pageType": "Blog",
  "geoTarget": "Madrid",
  "cluster": "SEO Tools"
}
```

**Response:**

Returns a JSON object containing 15 analysis points.

**Example Usage:**

```bash
curl -X POST http://127.0.0.1:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "kwPrincipal": "example",
    "pageType": "Landing",
    "geoTarget": "Spain"
  }'
```
