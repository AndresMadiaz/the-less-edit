# The Less Edit

A fictional menswear comparison prototype with a curated feed, category/price/style filters, search, sorting, comparison detail pages, alternative selection and locally saved edits.

## Run locally

Requires Node.js 18 or newer. No package installation or backend is needed.

Run `npm start`, then open http://127.0.0.1:4173. The local server serves direct routes such as `/edit/the-olive-knit-polo` and `/saved`.

## Production preview

Run `npm run build` to create the static Vercel output in `dist/`, then `npm run preview` to serve that output locally. Direct comparison routes use the same single-page fallback as the deployment.

## Prototype notes

- The catalogue lives in data.js as products and comparisons.
- Garment visuals are optimized AVIF crops from one consistent, fictional studio shoot. The source atlas is kept in `assets/garment-editorial-atlas.png`.
- Saving stores the comparison ID and selected alternative ID in browser local storage.
- Brand names, products, retailers and prices are fictional. The app has no purchase links, affiliate links or backend.
