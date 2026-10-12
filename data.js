const makeProduct = (id, brand, name, category, retailer, priceAmount, colour, fitDescription, materialComposition, styleTags, illustration, imagePrompt, isReference) => ({
  id,
  brand,
  name,
  category,
  retailer,
  priceAmount,
  currency: "EUR",
  colour,
  fitDescription,
  materialComposition,
  styleTags,
  illustration,
  imagePrompt,
  isReference
});

export const products = [
  makeProduct("ref-valmere-knit-polo-01", "Valmere", "Sea-Island Knit Polo", "knit-polo", "Valmere House", 395, "Deep olive", "Trim through the body with a softly open collar", "Cotton and silk", ["Quiet Luxury", "Old Money"], { kind: "polo", tone: "olive", stage: "sage", pattern: "plain", sheetCell: 0 }, "A deep olive, fine-gauge short-sleeve polo with an open collar and clean placket, shown as a restrained front-view garment illustration.", true),
  makeProduct("alt-northline-knit-polo-01", "Northline", "Fine-Gauge Cotton Polo", "knit-polo", "Northline Direct", 98, "Forest green", "Neat regular fit with a compact open collar", "Long-staple cotton", ["Quiet Luxury", "Old Money"], { kind: "polo", tone: "forest", stage: "sage", pattern: "plain", sheetCell: 1 }, "A forest-green cotton knit polo with a compact open collar and narrow placket, shown as a restrained front-view garment illustration.", false),
  makeProduct("alt-harbor-knit-polo-01", "Harbor & Mill", "Ribbed Open-Collar Polo", "knit-polo", "Harbor & Mill Studio", 145, "Dark olive", "Easy fit with a wider collar and straight hem", "Cotton and linen", ["Quiet Luxury", "Riviera"], { kind: "polo", tone: "olive", stage: "sage", pattern: "ribbed", sheetCell: 2 }, "A dark-olive cotton-linen polo with a broad open collar and fine rib texture, shown as a restrained front-view garment illustration.", false),

  makeProduct("ref-alderrow-knit-polo-02", "Alder Row", "Soft Merino Polo", "knit-polo", "Alder Row Collection", 320, "Warm ivory", "Close but unrestrictive through the chest", "Extra-fine merino wool", ["Old Money", "Smart Casual"], { kind: "polo", tone: "cream", stage: "clay", pattern: "plain", sheetCell: 3 }, "A warm-ivory merino short-sleeve polo with a soft collar and three-button placket, shown as a restrained front-view garment illustration.", true),
  makeProduct("alt-mercer-knit-polo-02", "Mercer Field", "Short-Sleeve Merino Polo", "knit-polo", "Mercer Field Store", 89, "Oatmeal", "Regular fit, clean shoulder, straight hem", "Merino wool blend", ["Old Money", "Smart Casual"], { kind: "polo", tone: "stone", stage: "clay", pattern: "plain", sheetCell: 4 }, "An oatmeal merino-blend polo with a compact collar and three-button placket, shown as a restrained front-view garment illustration.", false),
  makeProduct("alt-oakcivic-knit-polo-02", "Oak Civic", "Linen-Blend Open Polo", "knit-polo", "Oak Civic Online", 72, "Ecru", "Relaxed shoulder with a short open placket", "Cotton and linen", ["Riviera", "Smart Casual"], { kind: "polo", tone: "cream", stage: "stone", pattern: "ribbed", sheetCell: 5 }, "An ecru cotton-linen polo with a relaxed shoulder and open placket, shown as a restrained front-view garment illustration.", false),

  makeProduct("ref-cavour-shirt-01", "Cavour Lane", "Washed Linen Shirt", "shirt", "Cavour Lane Atelier", 345, "Natural flax", "Easy straight fit with a long, soft point collar", "European linen", ["Riviera", "Old Money"], { kind: "shirt", tone: "stone", stage: "clay", pattern: "plain", sheetCell: 6 }, "A natural flax linen shirt with a softly rolled point collar, button cuffs and a straight hem, shown as a restrained front-view garment illustration.", true),
  makeProduct("alt-harbor-shirt-01", "Harbor & Mill", "Linen-Cotton Shirt", "shirt", "Harbor & Mill Studio", 118, "Sand", "Relaxed regular fit with a balanced collar", "Linen and organic cotton", ["Riviera", "Old Money"], { kind: "shirt", tone: "taupe", stage: "clay", pattern: "plain", sheetCell: 7 }, "A sand-coloured linen-cotton shirt with a balanced point collar and simple front placket, shown as a restrained front-view garment illustration.", false),
  makeProduct("alt-oakcivic-shirt-01", "Oak Civic", "Garment-Washed Oxford", "shirt", "Oak Civic Online", 78, "Pale blue", "A little roomier through the body", "Cotton oxford cloth", ["Smart Casual", "Riviera"], { kind: "shirt", tone: "sky", stage: "blue", pattern: "plain", sheetCell: 8 }, "A pale-blue washed oxford shirt with a button-down collar and relaxed body, shown as a restrained front-view garment illustration.", false),

  makeProduct("ref-montclair-shirt-02", "Montclair House", "Blue Pencil-Stripe Shirt", "shirt", "Montclair House Collection", 280, "Blue and ivory", "Slim, long-line cut with a crisp spread collar", "Two-ply cotton poplin", ["Quiet Luxury", "Smart Casual"], { kind: "shirt", tone: "blue", stage: "blue", pattern: "stripe", sheetCell: 9 }, "A blue and ivory fine-stripe cotton poplin shirt with a crisp spread collar and narrow cuffs, shown as a restrained front-view garment illustration.", true),
  makeProduct("alt-northline-shirt-02", "Northline", "Fine-Stripe Poplin Shirt", "shirt", "Northline Direct", 74, "Blue and white", "Classic straight fit with a slightly wider collar", "Cotton poplin", ["Quiet Luxury", "Smart Casual"], { kind: "shirt", tone: "sky", stage: "blue", pattern: "stripe", sheetCell: 10 }, "A blue and white fine-stripe cotton shirt with a classic collar and straight hem, shown as a restrained front-view garment illustration.", false),

  makeProduct("ref-leonvaret-trouser-01", "Leon Varet", "Soft-Twill Pleated Trouser", "trousers", "Leon Varet Salon", 560, "Warm charcoal", "High rise with a double pleat and a gentle taper", "Wool twill", ["Old Money", "Quiet Luxury"], { kind: "trousers", tone: "charcoal", stage: "stone", pattern: "plain", sheetCell: 11 }, "A warm-charcoal high-rise wool trouser with two forward pleats, a clean waistband and a gentle taper, shown as a front-view garment illustration.", true),
  makeProduct("alt-ashford-trouser-01", "Ashford Standard", "Tailored Two-Pleat Trouser", "trousers", "Ashford Standard Shop", 138, "Soft charcoal", "Mid-high rise with a tapered straight leg", "Cotton and recycled wool", ["Old Money", "Quiet Luxury"], { kind: "trousers", tone: "charcoal", stage: "stone", pattern: "plain", sheetCell: 12 }, "A soft-charcoal two-pleat trouser with a tapered straight leg and clean waistband, shown as a front-view garment illustration.", false),
  makeProduct("alt-mercer-trouser-01", "Mercer Field", "Cotton-Wool Pleat Trouser", "trousers", "Mercer Field Store", 124, "Slate", "Relaxed top block with a fuller leg", "Cotton and wool", ["Smart Casual", "Old Money"], { kind: "trousers", tone: "navy", stage: "blue", pattern: "plain", sheetCell: 13 }, "A slate-blue cotton-wool trouser with a fuller leg and single pleat, shown as a front-view garment illustration.", false),

  makeProduct("ref-alderrow-trouser-02", "Alder Row", "Natural Gabardine Chino", "trousers", "Alder Row Collection", 295, "Olive drab", "Mid rise with a straight, tailored leg", "Italian cotton gabardine", ["Smart Casual", "Old Money"], { kind: "trousers", tone: "olive", stage: "sage", pattern: "plain", sheetCell: 14 }, "An olive-drab gabardine chino with a clean mid-rise waist and straight leg, shown as a front-view garment illustration.", true),
  makeProduct("alt-mercer-trouser-02", "Mercer Field", "Pleat-Front Cotton Chino", "trousers", "Mercer Field Store", 96, "Olive", "Room through the thigh with a quiet taper", "Cotton twill", ["Smart Casual", "Old Money"], { kind: "trousers", tone: "forest", stage: "sage", pattern: "plain", sheetCell: 15 }, "An olive cotton-twill chino with a single pleat, room through the thigh and a gentle taper, shown as a front-view garment illustration.", false),

  makeProduct("ref-cavour-loafer-01", "Cavour Lane", "Suede Penny Loafer", "loafer", "Cavour Lane Atelier", 640, "Tobacco", "Low-profile apron toe with a hand-finished saddle", "Calf suede with leather sole", ["Riviera", "Old Money"], { kind: "loafer", tone: "tan", stage: "clay", pattern: "plain", sheetCell: 16 }, "A tobacco suede penny loafer with a low apron toe, slim saddle strap and leather sole, shown as a side-view product illustration.", true),
  makeProduct("alt-oakcivic-loafer-01", "Oak Civic", "Unlined Suede Penny Loafer", "loafer", "Oak Civic Online", 148, "Warm brown", "Easy slip-on shape with a rounded almond toe", "Suede upper with stacked sole", ["Riviera", "Smart Casual"], { kind: "loafer", tone: "rust", stage: "clay", pattern: "plain", sheetCell: 17 }, "A warm-brown suede penny loafer with an almond toe, plain saddle and low stacked sole, shown as a side-view product illustration.", false),

  makeProduct("ref-montclair-knit-01", "Montclair House", "Brushed Cashmere Crewneck", "knitwear", "Montclair House Collection", 780, "Burgundy brown", "Relaxed shoulder with a close, clean hem", "Two-ply cashmere", ["Quiet Luxury", "Old Money"], { kind: "knitwear", tone: "burgundy", stage: "clay", pattern: "plain", sheetCell: 18 }, "A deep burgundy-brown cashmere crewneck with a softly brushed surface, set-in sleeves and ribbed trim, shown as a restrained front-view garment illustration.", true),
  makeProduct("alt-northline-knit-01", "Northline", "Fine Merino Crewneck", "knitwear", "Northline Direct", 156, "Dark red-brown", "Relaxed regular fit with neat ribbing", "Extra-fine merino wool", ["Quiet Luxury", "Old Money"], { kind: "knitwear", tone: "burgundy", stage: "clay", pattern: "plain", sheetCell: 19 }, "A dark red-brown fine-merino crewneck with a clean shoulder and narrow ribbed trim, shown as a restrained front-view garment illustration.", false),
  makeProduct("alt-harbor-knit-01", "Harbor & Mill", "Wool-Cashmere Crew", "knitwear", "Harbor & Mill Studio", 160, "Deep plum", "Easy straight fit with a slightly fuller sleeve", "Wool and cashmere", ["Quiet Luxury", "Smart Casual"], { kind: "knitwear", tone: "burgundy", stage: "stone", pattern: "plain", sheetCell: 20 }, "A deep-plum wool-cashmere crewneck with a fuller sleeve and traditional rib finish, shown as a restrained front-view garment illustration.", false)
];

export const comparisons = [
  {
    id: "edit-knit-polo-01",
    slug: "the-olive-knit-polo",
    title: "The olive knit polo",
    referenceProductId: "ref-valmere-knit-polo-01",
    alternativeProductIds: ["alt-northline-knit-polo-01", "alt-harbor-knit-polo-01"],
    featuredAlternativeId: "alt-northline-knit-polo-01",
    editTags: ["Quiet Luxury", "Old Money"],
    matches: ["A compact, straight silhouette", "A quiet olive palette with no visible logo", "An open collar and fine-gauge surface"],
    differences: ["Cotton replaces the reference’s cotton-silk blend", "The alternative has a firmer hand and less fluid drape", "Its collar and hem are finished more simply"],
    alternativeNotes: {
      "alt-harbor-knit-polo-01": {
        matches: ["The dark olive tone stays close to the reference", "A relaxed open collar keeps the same easy formality", "Fine ribbing gives the surface similar depth"],
        differences: ["Linen adds a drier, more open texture", "The collar is wider and the fit more relaxed", "Rib detail makes the knit read more casual"]
      }
    },
    editorialReason: "The colour and collar do most of the work here. The more affordable knit keeps that relaxed, polished outline and gives up some silk-like fluidity.",
    editorialOrder: 1
  },
  {
    id: "edit-knit-polo-02",
    slug: "the-ivory-knit-polo",
    title: "The ivory knit polo",
    referenceProductId: "ref-alderrow-knit-polo-02",
    alternativeProductIds: ["alt-mercer-knit-polo-02", "alt-oakcivic-knit-polo-02"],
    featuredAlternativeId: "alt-mercer-knit-polo-02",
    editTags: ["Old Money", "Smart Casual"],
    matches: ["Soft ivory shades sit in the same palette", "A short sleeve and neat body keep the line clean", "The collar gives a simple knit a little structure"],
    differences: ["The alternative blend is less soft against skin", "The placket is more plainly finished", "The Oak Civic option is linen-rich and more relaxed"],
    alternativeNotes: {
      "alt-oakcivic-knit-polo-02": {
        matches: ["The ecru colour keeps the light, tonal look", "A short sleeve and straight hem preserve the shape", "The open neck keeps it relaxed rather than sporty"],
        differences: ["Linen makes the knit more open and textured", "The shoulder is looser than the reference", "A simple open placket replaces the buttoned finish"]
      }
    },
    editorialReason: "A pale knit polo is an easy stand-in for a dressed shirt on warm days. The Mercer Field version holds the shape and colour, with a plainer finish.",
    editorialOrder: 2
  },
  {
    id: "edit-shirt-01",
    slug: "the-washed-linen-shirt",
    title: "The washed linen shirt",
    referenceProductId: "ref-cavour-shirt-01",
    alternativeProductIds: ["alt-harbor-shirt-01", "alt-oakcivic-shirt-01"],
    featuredAlternativeId: "alt-harbor-shirt-01",
    editTags: ["Riviera", "Old Money"],
    matches: ["A soft, pale neutral works with the same wardrobe", "A relaxed straight body feels easy rather than oversized", "A classic collar keeps the shirt adaptable"],
    differences: ["The linen-cotton blend creases less freely", "The collar is a little firmer and less fluid", "Oak Civic’s oxford has a cooler blue colour and denser weave"],
    alternativeNotes: {
      "alt-oakcivic-shirt-01": {
        matches: ["The washed surface feels lived-in from the start", "A relaxed body has a similar easy proportion", "The button-down collar keeps the mood casual"],
        differences: ["Blue shifts the palette away from natural flax", "Oxford cloth is denser than open-weave linen", "The button-down collar reads more informal"]
      }
    },
    editorialReason: "The washed surface and easy proportion matter more than a pristine finish. The linen-cotton cloth is slightly steadier through a long day.",
    editorialOrder: 3
  },
  {
    id: "edit-shirt-02",
    slug: "the-fine-stripe-shirt",
    title: "The fine-stripe shirt",
    referenceProductId: "ref-montclair-shirt-02",
    alternativeProductIds: ["alt-northline-shirt-02"],
    featuredAlternativeId: "alt-northline-shirt-02",
    editTags: ["Quiet Luxury", "Smart Casual"],
    matches: ["Fine blue stripes keep the same measured rhythm", "Crisp poplin gives the shirt a clean surface", "A straight cut sits easily under a jacket"],
    differences: ["The collar is wider and less sharply pressed", "The cotton has a lighter, less dense hand", "The stripe repeat is a little more noticeable"],
    alternativeNotes: {},
    editorialReason: "A restrained stripe gives a plain outfit a little direction. Northline keeps the narrow blue repeat and clean poplin surface, with a softer collar.",
    editorialOrder: 4
  },
  {
    id: "edit-trouser-01",
    slug: "the-charcoal-pleated-trouser",
    title: "The charcoal pleated trouser",
    referenceProductId: "ref-leonvaret-trouser-01",
    alternativeProductIds: ["alt-ashford-trouser-01", "alt-mercer-trouser-01"],
    featuredAlternativeId: "alt-ashford-trouser-01",
    editTags: ["Old Money", "Quiet Luxury"],
    matches: ["A high, clean waist keeps the same tailored start", "Two pleats add room without a loose silhouette", "Charcoal stays easy to pair across seasons"],
    differences: ["The alternative uses a cotton-wool cloth, not pure wool", "Its crease and taper are less sharply defined", "The Mercer Field option has a fuller leg and cooler slate tone"],
    alternativeNotes: {
      "alt-mercer-trouser-01": {
        matches: ["A pleated waist adds the same relaxed tailoring", "The darker blue-grey works with the same palette", "A longer line still reads smart with a tucked shirt"],
        differences: ["The leg is fuller and less tapered", "The cotton-wool blend feels more casual", "Slate blue shifts the colour from warm charcoal"]
      }
    },
    editorialReason: "Pleats and a higher rise set the proportion. Ashford Standard keeps both, while the cotton-wool cloth softens the formality.",
    editorialOrder: 5
  },
  {
    id: "edit-trouser-02",
    slug: "the-olive-cotton-chino",
    title: "The olive cotton chino",
    referenceProductId: "ref-alderrow-trouser-02",
    alternativeProductIds: ["alt-mercer-trouser-02"],
    featuredAlternativeId: "alt-mercer-trouser-02",
    editTags: ["Smart Casual", "Old Money"],
    matches: ["Olive cotton keeps the same grounded palette", "A straight leg works with loafers or clean trainers", "A clean waistband avoids visible hardware"],
    differences: ["The alternative adds a front pleat", "Cotton twill feels softer and less crisp than gabardine", "The taper is more pronounced below the knee"],
    alternativeNotes: {},
    editorialReason: "The colour and straight leg make this a useful everyday trouser. A single pleat lends the Mercer Field version a slightly softer outline.",
    editorialOrder: 6
  },
  {
    id: "edit-loafer-01",
    slug: "the-tobacco-suede-loafer",
    title: "The tobacco suede loafer",
    referenceProductId: "ref-cavour-loafer-01",
    alternativeProductIds: ["alt-oakcivic-loafer-01"],
    featuredAlternativeId: "alt-oakcivic-loafer-01",
    editTags: ["Riviera", "Old Money"],
    matches: ["A warm tobacco tone works with the same neutral wardrobe", "A penny saddle keeps the vamp simple", "The low profile slips beneath a straight trouser hem"],
    differences: ["The toe is rounder and less elongated", "The sole is stacked rather than a slim leather construction", "The suede has a more even, less brushed finish"],
    alternativeNotes: {},
    editorialReason: "Colour and toe shape set the character of a suede loafer. Oak Civic keeps the warm tone and penny detail, with a rounder toe and sturdier sole.",
    editorialOrder: 7
  },
  {
    id: "edit-knitwear-01",
    slug: "the-deep-burgundy-crewneck",
    title: "The deep burgundy crewneck",
    referenceProductId: "ref-montclair-knit-01",
    alternativeProductIds: ["alt-northline-knit-01", "alt-harbor-knit-01"],
    featuredAlternativeId: "alt-northline-knit-01",
    editTags: ["Quiet Luxury", "Old Money"],
    matches: ["A deep red-brown shade gives the same quiet colour note", "A clean crewneck works on its own or under a coat", "Ribbed edges keep the outline neat"],
    differences: ["Merino is smoother and less plush than cashmere", "The knit has a firmer surface and slightly more sheen", "The Harbor & Mill option has a fuller sleeve and wool blend"],
    alternativeNotes: {
      "alt-harbor-knit-01": {
        matches: ["A dark, muted colour keeps the same low-key presence", "The crewneck shape layers beneath a coat", "Wool and cashmere keep a soft hand"],
        differences: ["The plum tone is cooler than burgundy brown", "A fuller sleeve changes the shoulder line", "The rib finish reads more traditional"]
      }
    },
    editorialReason: "The colour and simple crew shape carry the edit. Fine merino trades the brushed cashmere surface for a smoother, more resilient knit.",
    editorialOrder: 8
  }
];

export const productById = Object.fromEntries(products.map((product) => [product.id, product]));
export const comparisonBySlug = Object.fromEntries(comparisons.map((comparison) => [comparison.slug, comparison]));
export const categoryLabels = {
  "knit-polo": "Knit polo",
  shirt: "Shirt",
  trousers: "Trousers",
  loafer: "Loafer",
  knitwear: "Knitwear"
};
export const styleEdits = ["Old Money", "Quiet Luxury", "Riviera", "Smart Casual"];
