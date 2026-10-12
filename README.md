# The Less Edit

A local, fictional menswear comparison prototype. The app has a curated feed, category/price/style filters, search, sorting, comparison detail pages, alternative selection and locally saved edits.

## Run locally

Requires Node.js 18 or newer. No package installation or backend is needed.

Run npm start, then open http://127.0.0.1:4173. The local server serves direct routes such as /edit/the-olive-knit-polo and /saved.

## Prototype notes

- The catalogue lives in data.js as products and comparisons.
- Product art is drawn as small inline SVG garment illustrations; no retailer imagery is used.
- Saving stores the comparison ID and selected alternative ID in browser local storage.
- Brand names, products, retailers and prices are fictional. The app has no purchase links, affiliate links or backend.
