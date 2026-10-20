# The Less Edit

The Less Edit is a static editorial comparison prototype for menswear. The current catalogue is illustrative seed content; it does not contain verified retailer listings.

## Run locally

Requires Node.js 18 or newer. No package installation or backend is needed.

Run `npm start`, then open http://127.0.0.1:4173. Direct routes include `/edit/the-olive-knit-polo` and `/saved`.

## Build and preview

Run `npm run build` to create the static Vercel output in `dist/`, then `npm run preview` to serve that output locally. The build validates the catalogue before copying the app and its optimized AVIF images.

## Catalogue model

Records live in `data.js` as `products` and `comparisons`. Add and edit records by hand; this prototype has no scraping, ingestion, or automatic product-matching process.

Each product includes the stable `id`, `brand`, `exactName`, `retailer`, `productUrl`, `imageUrl`, `priceAmount`, `currency`, `lastCheckedAt`, `availabilityStatus`, `colour`, `materialComposition`, `category`, `fitNotes`, `visibleTraits`, `editorialNotes`, and `isReference` fields. `isIllustrative` marks sample content so the interface can disclose it and switch to the real-catalogue copy when verified records are added. `presentation.backdrop` is optional display metadata used by the current image stage. Product images can use an `http(s)` image URL or a local file under `assets/garments/`; the build checks only images actually referenced by product records.

Use `null` for an unknown scalar value, and empty arrays for traits or notes that have not been documented. Do not fill gaps with estimates. A price requires a three-letter ISO currency code. `lastCheckedAt` is a date in `YYYY-MM-DD` form. `availabilityStatus` accepts `available`, `limited`, `out_of_stock`, `discontinued`, or `unknown`.

Each comparison includes `id`, `slug`, `title`, `referenceProductId`, `alternativeProductIds`, `featuredAlternativeId`, `styleTags`, `matches`, `differences`, `editorialReason`, `confidenceLevel`, and `sourceCompleteness`. The current UI also uses `sortOrder` for editorial ordering and optional `alternativeEditorialNotes` when an alternative needs its own match and difference notes. `cataloguePresentation.featuredComparisonId` selects the opening edit; the sample-only `illustrativeHome` copy is used while that edit is still marked illustrative. All comparison content is authored by a person; no similarity score or match is generated.

Set `isIllustrative` to `false` only when the record is grounded in an actual product listing. Keep details that the listing does not confirm as `null`, and set the comparison's `sourceCompleteness` to reflect how much was checked: `incomplete` means key listing details or sources are missing, `partial` means some details are documented but gaps remain, and `complete` means the comparison's cited product facts and sources were checked. Use `illustrative` only for seed content. `confidenceLevel` records the editor's judgment (`unrated`, `low`, `medium`, or `high`); it is not calculated by the app. Product source links, checked dates, availability, and missing-information labels appear on comparison detail pages. The price filter creates separate thresholds for each recorded currency, and savings are only calculated when both prices use the same currency. The UI says that prices and availability may change and does not calculate a price difference when either price is unknown or the currencies differ.

## Preserved product behavior

The existing homepage, edit cards, detail routes, filters, alternative selection, and saved edits remain in place. Saved edits store comparison IDs and selected alternative IDs in browser local storage. When replacing catalogue records, preserve those IDs where practical so existing saved entries continue to resolve.
