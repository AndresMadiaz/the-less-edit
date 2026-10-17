# The Less Edit design system

## Point of view

An editorial menswear comparison: expensive references are read through silhouette, cloth, finish and price. The visual language is a warm paper catalogue with enough room around the garments for material and proportion to lead.

## Palette

- Paper: warm cream (`--color-paper`).
- Ink: warm near-black (`--color-ink`), with muted ink for supporting details.
- Garment stage: one quiet stone backdrop, matched to the studio photography.
- Accent: oxblood only for savings, the primary action and the active comparison reveal.
- Rules: thin warm-grey lines; no card outlines, gradients, glow or decorative color fields.

## Typography

- Display: Cormorant Garamond for headlines, product names and the saving amount.
- Interface: Manrope for navigation, metadata, controls and editorial notes.
- Use uppercase tracking only for small labels. Keep product names and editorial observations in sentence case.

## Product imagery

Use one front-facing, softly lit studio treatment with warm neutral framing for every product. Each 4:3 AVIF is a crop from the shared atlas, with explicit intrinsic dimensions. The reference and alternative share equal visual weight; names, labels and prices identify the difference below the image.

## Layout

- Keep the existing route and content hierarchy.
- Let the home comparison lead; give the catalog room to breathe beneath it.
- Use hairlines and whitespace in place of boxed components.
- On detail pages, lead with a large image reveal, then product facts, the alternative selector, savings and the two quiet editorial lists.
- Let mobile layouts stack naturally without shrinking controls below comfortable touch sizes.

## Motion

- Reveal catalog entries with IntersectionObserver and opacity/transform only.
- Use the View Transition API for route changes when supported and motion is allowed.
- Keep the comparison reveal direct-manipulation: range input updates clipping without a transition or layout animation.
- Give the saved heart a short transform response. Respect `prefers-reduced-motion` throughout.
