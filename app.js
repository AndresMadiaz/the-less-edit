import { comparisons, products, productById, comparisonBySlug, categoryLabels, styleEdits, catalogueMode, catalogueDisclosures, cataloguePresentation, availabilityStatuses } from "./data.js";

const STORAGE_KEY = "the-less-edit:saved-comparisons:v1";
const appRoot = document.getElementById("app");
const toastRegion = document.getElementById("toast-region");
const preferredCategoryOrder = ["knit-polo", "shirt", "trousers", "loafer", "knitwear"];
const catalogueCategories = [...new Set(products.map((product) => product.category))];
const categoryOrder = preferredCategoryOrder.filter((category) => catalogueCategories.includes(category))
  .concat(catalogueCategories.filter((category) => !preferredCategoryOrder.includes(category)));
const alternativeProducts = products.filter((product) => !product.isReference && Number.isFinite(product.priceAmount) && /^[A-Z]{3}$/.test(product.currency || ""));
const pricesByCurrency = new Map();
alternativeProducts.forEach((product) => {
  if (!pricesByCurrency.has(product.currency)) pricesByCurrency.set(product.currency, []);
  pricesByCurrency.get(product.currency).push(product.priceAmount);
});
const priceCeilings = catalogueMode === "illustrative"
  ? [75, 100, 125, 160].map((amount) => ({ currency: "EUR", amount }))
  : [...pricesByCurrency.entries()].flatMap(([currency, prices]) => {
    const sorted = prices.sort((a, b) => a - b);
    const amounts = [...new Set(sorted.length <= 4 ? sorted : [0.25, 0.5, 0.75, 1].map((quantile) => sorted[Math.ceil(quantile * sorted.length) - 1]))];
    return amounts.map((amount) => ({ currency, amount }));
  });
const defaultPriceFilter = catalogueMode === "illustrative" && priceCeilings.length
  ? priceCeilings[priceCeilings.length - 1].currency + ":" + priceCeilings[priceCeilings.length - 1].amount
  : null;
const filterState = { category: "all", maxPrice: defaultPriceFilter, style: "all", search: "", sort: "editorial" };
const detailSelections = {};

function readSaved() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.comparisonId === "string" && typeof item.selectedAlternativeId === "string");
  } catch {
    return [];
  }
}

let savedItems = readSaved();
let undoTimer = null;
let undoEntry = null;

function writeSaved() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedItems));
  } catch {
    showToast("Your browser could not keep this edit. Check its local storage settings.");
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function displayValue(value, fallback = "Not supplied") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function money(amount, currency) {
  if (!Number.isFinite(amount) || !/^[A-Z]{3}$/.test(currency || "")) return "Price not listed";
  const fractionDigits = new Intl.NumberFormat("en-IE", { style: "currency", currency }).resolvedOptions().maximumFractionDigits;
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(amount);
}

function savingsFor(reference, alternative) {
  if (!Number.isFinite(reference.priceAmount) || !Number.isFinite(alternative.priceAmount) || reference.currency !== alternative.currency || reference.priceAmount <= 0) {
    return null;
  }
  const amount = reference.priceAmount - alternative.priceAmount;
  return { amount, percent: Math.round((amount / reference.priceAmount) * 100), currency: reference.currency };
}

function passesPriceCeiling(product) {
  if (filterState.maxPrice === null) return true;
  const [currency, amountText] = filterState.maxPrice.split(":");
  const ceiling = Number(amountText);
  return Number.isFinite(product.priceAmount) && product.currency === currency && product.priceAmount <= ceiling;
}

function compareByPrice(a, b) {
  const aKnown = Number.isFinite(a.priceAmount) && a.currency;
  const bKnown = Number.isFinite(b.priceAmount) && b.currency;
  if (!aKnown || !bKnown) return aKnown === bKnown ? 0 : (aKnown ? -1 : 1);
  if (a.currency !== b.currency) return 0;
  return a.priceAmount - b.priceAmount;
}

function priceDeltaCopy(saving, compact = false) {
  if (!saving) return "Price difference unavailable";
  if (saving.amount > 0) return compact
    ? "Save " + money(saving.amount, saving.currency) + "<br>" + saving.percent + "% less"
    : money(saving.amount, saving.currency) + " saved · " + saving.percent + "% less";
  if (saving.amount < 0) return compact
    ? money(Math.abs(saving.amount), saving.currency) + " more<br>" + Math.abs(saving.percent) + "% higher"
    : money(Math.abs(saving.amount), saving.currency) + " more · " + Math.abs(saving.percent) + "% higher";
  return "Same listed price";
}

function availabilityLabel(status) {
  const labels = {
    available: "Available when checked",
    limited: "Limited availability when checked",
    out_of_stock: "Out of stock when checked",
    discontinued: "Discontinued",
    unknown: "Availability not confirmed"
  };
  return availabilityStatuses.includes(status) ? labels[status] : "Availability not recorded";
}

function checkedDate(value) {
  if (!value || Number.isNaN(Date.parse(value))) return "Check date not recorded";
  return "Checked " + new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}

function productSourceNote(product, role) {
  const label = escapeHtml(role + " · " + displayValue(product.brand, "Brand not listed") + " " + displayValue(product.exactName, "Product name not supplied"));
  if (product.isIllustrative) {
    return "<p><strong>" + label + ".</strong> Illustrative entry · source not supplied · price and availability are unverified.</p>";
  }
  const source = product.productUrl
    ? "<a href=\"" + escapeHtml(product.productUrl) + "\" target=\"_blank\" rel=\"noopener noreferrer\">Source: " + escapeHtml(displayValue(product.retailer, "retailer page")) + "</a>"
    : "<span>Source not supplied</span>";
  return "<p><strong>" + label + ".</strong> " + escapeHtml(checkedDate(product.lastCheckedAt)) + " · " + escapeHtml(availabilityLabel(product.availabilityStatus)) + " · " + source + "</p>";
}

function sourceCompletenessLabel(status) {
  const labels = {
    illustrative: "Illustrative source record",
    incomplete: "Source details incomplete",
    partial: "Some source details recorded",
    complete: "Source details recorded"
  };
  return labels[status] || "Source completeness not recorded";
}

function isSaved(comparisonId) {
  return savedItems.some((item) => item.comparisonId === comparisonId);
}

function savedEntry(comparisonId) {
  return savedItems.find((item) => item.comparisonId === comparisonId);
}

function selectedAlternative(comparison) {
  const selected = detailSelections[comparison.id] || (savedEntry(comparison.id) && savedEntry(comparison.id).selectedAlternativeId) || comparison.featuredAlternativeId;
  return comparison.alternativeProductIds.includes(selected) ? selected : comparison.featuredAlternativeId;
}

function cardAlternative(comparison) {
  const allowed = comparison.alternativeProductIds
    .map((id) => productById[id])
    .filter((product) => product && passesPriceCeiling(product));
  if (allowed.length === 0) return null;
  if (filterState.sort === "price" || filterState.sort === "saving") {
    return allowed.sort(compareByPrice)[0];
  }
  const preferred = productById[comparison.featuredAlternativeId];
  if (preferred && passesPriceCeiling(preferred)) return preferred;
  return allowed.sort(compareByPrice)[0];
}

function currentRoute() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/saved") return { page: "saved" };
  if (path === "/") return { page: "home" };
  const match = path.match(/^\/edit\/([^/]+)$/);
  if (match) return { page: "detail", slug: decodeURIComponent(match[1]) };
  return { page: "not-found" };
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function renderWithTransition() {
  if (document.startViewTransition && !reducedMotion()) document.startViewTransition(render);
  else render();
}

let revealObserver = null;

function observeReveals(scope = document) {
  if (reducedMotion() || !("IntersectionObserver" in window)) return;
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove("is-reveal-pending");
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
  }
  scope.querySelectorAll("[data-reveal]").forEach((element) => {
    if (element.dataset.revealObserved) return;
    element.dataset.revealObserved = "true";
    if (element.getBoundingClientRect().top > window.innerHeight) element.classList.add("is-reveal-pending");
    revealObserver.observe(element);
  });
}

function navigate(path, moveFocus) {
  if (window.location.pathname !== path) window.history.pushState({}, "", path);
  renderWithTransition();
  if (moveFocus) {
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      const heading = appRoot.querySelector("main h1");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
      }
    });
  }
}

function iconHeart() {
  return "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M20.2 8.7c0 5-8.2 10-8.2 10s-8.2-5-8.2-10A4.2 4.2 0 0 1 12 6.5a4.2 4.2 0 0 1 8.2 2.2Z\"/></svg>";
}

function saveButton(comparison, alternativeId, context) {
  const saved = isSaved(comparison.id);
  const label = context === "saved" ? "Remove" : (saved ? "Saved" : "Save");
  const actionLabel = context === "saved"
    ? "Remove " + comparison.title + " from saved edits"
    : (saved ? "Remove " + comparison.title + " from saved edits" : "Save " + comparison.title);
  return "<button class=\"save-button\" type=\"button\" data-action=\"toggle-save\" data-comparison-id=\"" + escapeHtml(comparison.id) + "\" data-alternative-id=\"" + escapeHtml(alternativeId) + "\" aria-pressed=\"" + String(saved) + "\" aria-label=\"" + escapeHtml(actionLabel) + "\">" + iconHeart() + "<span data-save-label>" + label + "</span></button>";
}

function stageClass(product) {
  const validBackdrops = ["sage", "blue", "clay", "stone"];
  const backdrop = product.presentation && validBackdrops.includes(product.presentation.backdrop) ? product.presentation.backdrop : "stone";
  return "product-stage product-stage--" + backdrop;
}

function garmentImage(product, eager = false) {
  const loading = eager ? "eager" : "lazy";
  const priority = eager ? " fetchpriority=\"high\"" : "";
  if (!product.imageUrl) return "<span class=\"product-stage__missing\">Image not supplied</span>";
  const alt = [product.colour, product.brand, product.exactName].filter(Boolean).join(" ");
  return "<img class=\"product-stage__art\" src=\"" + escapeHtml(product.imageUrl) + "\" alt=\"" + escapeHtml(alt || "Menswear product image") + "\" width=\"626\" height=\"468\" decoding=\"async\" loading=\"" + loading + "\"" + priority + ">";
}

function productArt(product, role, slug, eager = false) {
  return "<a class=\"" + stageClass(product) + "\" href=\"/edit/" + escapeHtml(slug) + "\" data-link aria-label=\"" + escapeHtml(role + ": " + displayValue(product.brand) + " " + displayValue(product.exactName)) + "\">" + garmentImage(product, eager) + "</a>";
}

function productArtStatic(product, role, eager = false) {
  return "<div class=\"" + stageClass(product) + "\" aria-label=\"" + escapeHtml(role + ": " + displayValue(product.brand) + " " + displayValue(product.exactName)) + "\">" + garmentImage(product, eager) + "</div>";
}

function productMeta(product, compact, role) {
  const brand = displayValue(product.brand, "Brand not listed");
  const name = displayValue(product.exactName, "Product name not supplied");
  const colour = displayValue(product.colour, "Colour not listed");
  const composition = displayValue(product.materialComposition, "Composition not listed");
  if (compact) {
    return "<div class=\"pair-art__meta\"><div class=\"pair-art__byline\"><span class=\"pair-art__role\">" + escapeHtml(role) + "</span><span class=\"pair-art__brand\">" + escapeHtml(brand) + "</span></div><span class=\"pair-art__name\">" + escapeHtml(name) + "</span><div class=\"pair-art__subline\"><span class=\"pair-art__price\">" + money(product.priceAmount, product.currency) + "</span><span class=\"pair-art__detail\">" + escapeHtml(colour) + "</span></div></div>";
  }
  return "<div class=\"detail-product__meta\"><div><div class=\"detail-product__byline\"><span class=\"detail-product__role\">" + escapeHtml(role) + "</span><span class=\"detail-product__brand\">" + escapeHtml(brand) + "</span></div><h2>" + escapeHtml(name) + "</h2><div class=\"detail-product__facts\"><span>" + escapeHtml(colour) + "</span><span>" + escapeHtml(displayValue(product.fitNotes, "Fit notes not supplied")) + "</span><span>" + escapeHtml(composition) + "</span><span>" + escapeHtml(availabilityLabel(product.availabilityStatus)) + "</span></div></div><span class=\"detail-product__price\">" + money(product.priceAmount, product.currency) + "</span></div>";
}

function pairArt(comparison, alternative, linked, eager = false) {
  const reference = productById[comparison.referenceProductId];
  const alt = typeof alternative === "string" ? productById[alternative] : alternative;
  const draw = linked ? productArt : productArtStatic;
  const drawProduct = (product, role) => linked ? draw(product, role, comparison.slug, eager) : draw(product, role, eager);
  return "<div class=\"pair-art\"><div class=\"pair-art__item\">" + drawProduct(reference, "Reference") + productMeta(reference, true, "Reference") + "</div><div class=\"pair-art__item\">" + drawProduct(alt, "Alternative") + productMeta(alt, true, "Alternative") + "</div></div>";
}

function comparisonCard(comparison, alternative, context) {
  const reference = productById[comparison.referenceProductId];
  const saving = savingsFor(reference, alternative);
  const tags = comparison.styleTags.slice(0, 2).map((tag) => "<span>" + escapeHtml(tag) + "</span>").join("");
  const action = context === "saved" ? saveButton(comparison, alternative.id, "saved") : saveButton(comparison, alternative.id, "feed");
  const savingLabel = priceDeltaCopy(saving, true);
  return "<article class=\"comparison-card\" data-reveal><div class=\"comparison-card__art\">" + pairArt(comparison, alternative, true) + "<div class=\"comparison-card__save\">" + action + "</div></div><div class=\"comparison-card__meta\"><div><span class=\"comparison-card__category\">" + escapeHtml(categoryLabels[reference.category] || "Category not listed") + " · " + escapeHtml(displayValue(reference.brand, "Brand not listed")) + "</span><h3><a class=\"comparison-card__title\" href=\"/edit/" + escapeHtml(comparison.slug) + "\" data-link>" + escapeHtml(comparison.title) + "</a></h3><p class=\"comparison-card__summary\">" + escapeHtml(comparison.editorialReason) + "</p></div><div class=\"comparison-card__savings\">" + savingLabel + "</div></div><div class=\"comparison-card__actions\"><div class=\"comparison-card__tags\">" + tags + "</div><a class=\"text-link\" href=\"/edit/" + escapeHtml(comparison.slug) + "\" data-link>Read the edit <span aria-hidden=\"true\">→</span></a></div></article>";
}

function filteredComparisons() {
  const search = filterState.search.trim().toLowerCase();
  const filtered = comparisons.filter((comparison) => {
    const reference = productById[comparison.referenceProductId];
    if (filterState.category !== "all" && reference.category !== filterState.category) return false;
    if (!comparison.alternativeProductIds.some((id) => productById[id] && passesPriceCeiling(productById[id]))) return false;
    if (filterState.style !== "all" && !comparison.styleTags.includes(filterState.style)) return false;
    if (search) {
      const haystack = [reference.brand, reference.exactName, reference.colour, categoryLabels[reference.category]]
        .concat(comparison.alternativeProductIds.flatMap((id) => [productById[id].brand, productById[id].exactName, productById[id].colour]))
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
  if (filterState.sort === "price") filtered.sort((a, b) => compareByPrice(cardAlternative(a), cardAlternative(b)) || a.sortOrder - b.sortOrder);
  else if (filterState.sort === "saving") filtered.sort((a, b) => (savingsFor(productById[b.referenceProductId], cardAlternative(b))?.percent ?? Number.NEGATIVE_INFINITY) - (savingsFor(productById[a.referenceProductId], cardAlternative(a))?.percent ?? Number.NEGATIVE_INFINITY) || a.sortOrder - b.sortOrder);
  else filtered.sort((a, b) => a.sortOrder - b.sortOrder);
  return filtered;
}

function filterMarkup() {
  const categoryOptions = ["all"].concat(categoryOrder).map((category) => {
    const label = category === "all" ? "All categories" : categoryLabels[category] || category.replace(/-/g, " ");
    return "<option value=\"" + category + "\"" + (filterState.category === category ? " selected" : "") + ">" + escapeHtml(label) + "</option>";
  }).join("");
  const priceOptions = [{ value: "all", label: "Any listed price" }]
    .concat(priceCeilings.map(({ currency, amount }) => ({ value: currency + ":" + amount, label: "Up to " + money(amount, currency) })))
    .map((item) => {
      const selected = item.value === "all" ? filterState.maxPrice === null : filterState.maxPrice === item.value;
      return "<option value=\"" + item.value + "\"" + (selected ? " selected" : "") + ">" + escapeHtml(item.label) + "</option>";
    }).join("");
  const sortOptions = [
    { value: "editorial", label: "Editorial picks" },
    { value: "price", label: "Lowest alternative price" },
    { value: "saving", label: "Biggest saving" }
  ].map((item) => "<option value=\"" + item.value + "\"" + (filterState.sort === item.value ? " selected" : "") + ">" + item.label + "</option>").join("");
  const tags = ["all"].concat(styleEdits).map((style) => {
    const label = style === "all" ? "All edits" : style;
    return "<button class=\"tag-button style-filter\" type=\"button\" data-style=\"" + escapeHtml(style) + "\" aria-pressed=\"" + String(filterState.style === style) + "\">" + escapeHtml(label) + "</button>";
  }).join("");
  return "<div class=\"filter-controls\"><div class=\"field\"><label for=\"search-filter\">Search by brand, item or category</label><input id=\"search-filter\" name=\"search\" type=\"search\" autocomplete=\"off\" placeholder=\"Try linen, merino, or shirt\" value=\"" + escapeHtml(filterState.search) + "\"></div><div class=\"field\"><label for=\"category-filter\">Category</label><select id=\"category-filter\" name=\"category\">" + categoryOptions + "</select></div><div class=\"field\"><label for=\"price-filter\">Alternative price</label><select id=\"price-filter\" name=\"maxPrice\">" + priceOptions + "</select></div><div class=\"field\"><label for=\"sort-filter\">Sort by</label><select id=\"sort-filter\" name=\"sort\">" + sortOptions + "</select></div></div><div class=\"filter-tags\"><span class=\"filter-label\">Style edit</span><div class=\"tag-list\">" + tags + "</div></div>";
}

function updateFeed() {
  const grid = document.getElementById("comparison-grid");
  if (!grid) return;
  if (revealObserver) grid.querySelectorAll("[data-reveal]").forEach((element) => revealObserver.unobserve(element));
  const matching = filteredComparisons();
  const status = document.getElementById("filter-status");
  if (status) status.textContent = matching.length + (matching.length === 1 ? " edit" : " edits");
  if (matching.length === 0) {
    grid.innerHTML = "<div class=\"empty-results\"><h3>No edits match those filters.</h3><p>Try a broader price ceiling, another category, or a shorter search.</p><button class=\"button button--quiet\" type=\"button\" data-action=\"reset-filters\">Reset filters</button></div>";
    return;
  }
  grid.innerHTML = matching.map((comparison) => comparisonCard(comparison, cardAlternative(comparison), "feed")).join("");
  observeReveals(grid);
}

function featuredComparison() {
  return comparisons.find((comparison) => comparison.id === cataloguePresentation.featuredComparisonId) || comparisons[0];
}

function featureMarkup(comparison) {
  const reference = productById[comparison.referenceProductId];
  const alternative = productById[comparison.featuredAlternativeId];
  const saving = savingsFor(reference, alternative);
  const savingLabel = priceDeltaCopy(saving);
  return "<div class=\"feature-edit feature-edit--hero\"><div class=\"feature-edit__topline\"><span>Opening edit · " + escapeHtml(categoryLabels[reference.category] || "Menswear") + "</span>" + saveButton(comparison, alternative.id, "feed") + "</div>" + pairArt(comparison, alternative, true, true) + "<div class=\"feature-edit__bottomline\"><span>" + escapeHtml(savingLabel) + "</span><a href=\"/edit/" + escapeHtml(comparison.slug) + "\" data-link>See why it works <span aria-hidden=\"true\">→</span></a></div></div>";
}

function homePage() {
  const featured = featuredComparison();
  const initial = filteredComparisons();
  const initialCards = initial.map((comparison) => comparisonCard(comparison, cardAlternative(comparison), "feed")).join("");
  const illustrativeCopy = featured.sourceCompleteness === "illustrative" ? cataloguePresentation.illustrativeHome : null;
  const title = illustrativeCopy ? illustrativeCopy.title : featured.title;
  const lede = illustrativeCopy ? illustrativeCopy.lede : featured.editorialReason;
  const countLabel = comparisons.length + (comparisons.length === 1 ? " comparison" : " comparisons");
  return "<main class=\"page-shell\"><section class=\"hero\" aria-labelledby=\"home-title\"><div class=\"hero__copy\"><p class=\"eyebrow\">Expensive taste. Smarter prices.</p><h1 id=\"home-title\">" + escapeHtml(title) + "</h1><p class=\"hero__lede\">" + escapeHtml(lede) + "</p><a class=\"text-link\" href=\"#browse\">Browse the edits <span aria-hidden=\"true\">↓</span></a></div><div class=\"hero__pair\">" + featureMarkup(featured) + "</div></section><section class=\"content-section\" id=\"browse\" aria-labelledby=\"browse-title\"><div class=\"section-head\"><h2 id=\"browse-title\">The edit, in detail</h2><p class=\"section-head__note\">" + escapeHtml(countLabel) + " across the menswear catalogue</p></div><div class=\"filter-panel\" role=\"search\" aria-label=\"Filter menswear edits\">" + filterMarkup() + "<p class=\"filter-status\" id=\"filter-status\" aria-live=\"polite\">" + initial.length + (initial.length === 1 ? " edit" : " edits") + "</p></div><div class=\"comparison-grid\" id=\"comparison-grid\">" + (initialCards || "<div class=\"empty-results\"><h3>No edits match those filters.</h3><p>Try a broader price ceiling, another category, or a shorter search.</p><button class=\"button button--quiet\" type=\"button\" data-action=\"reset-filters\">Reset filters</button></div>") + "</div></section><section class=\"how-it-works\" aria-labelledby=\"how-title\"><div class=\"how-it-works__head\"><h2 id=\"how-title\">What makes a useful comparison?</h2><p>Price matters after shape, cloth and finish have been weighed against each other.</p></div><div class=\"steps\"><article class=\"step\"><span class=\"step__number\">01</span><div><h3>Read the line</h3><p>Rise, shoulder, collar and hem determine how the piece sits.</p></div></article><article class=\"step\"><span class=\"step__number\">02</span><div><h3>Feel the cloth</h3><p>Fibre, weight and finish change the drape and the way a garment wears.</p></div></article><article class=\"step\"><span class=\"step__number\">03</span><div><h3>Weigh the trade-off</h3><p>Each edit sets the saving beside the detail that gives way.</p></div></article></div></section></main>";
}

function savedPage() {
  const valid = savedItems
    .map((item) => {
      const comparison = comparisons.find((entry) => entry.id === item.comparisonId);
      const selectedAlternativeId = comparison && comparison.alternativeProductIds.includes(item.selectedAlternativeId)
        ? item.selectedAlternativeId
        : comparison && comparison.featuredAlternativeId;
      return { item: { ...item, selectedAlternativeId }, comparison };
    })
    .filter((row) => row.comparison && productById[row.item.selectedAlternativeId])
    .sort((a, b) => a.comparison.sortOrder - b.comparison.sortOrder);
  if (!valid.length) {
    return "<main class=\"page-shell saved-page\"><div class=\"page-title\"><div><p class=\"eyebrow\">Your edit book</p><h1>Saved for later.</h1></div><p>Comparisons you save on this device will collect here, along with the alternative you selected.</p></div><section class=\"saved-empty\" aria-labelledby=\"saved-empty-title\"><div class=\"saved-empty__mark\">" + iconHeart() + "</div><h2 id=\"saved-empty-title\">No saved edits yet.</h2><p>Save a comparison while you browse and it will be easy to find again here.</p><a class=\"button\" href=\"/\" data-link>Browse the edits</a></section></main>";
  }
  return "<main class=\"page-shell saved-page\" id=\"saved-content\"><div class=\"page-title\"><div><p class=\"eyebrow\">Your edit book</p><h1>Saved for later.</h1></div><p>" + valid.length + (valid.length === 1 ? " comparison" : " comparisons") + " kept in this browser, with your selected alternative." + "</p></div><div class=\"comparison-grid\" id=\"saved-grid\">" + valid.map((row) => comparisonCard(row.comparison, productById[row.item.selectedAlternativeId], "saved")).join("") + "</div></main>";
}

function detailProduct(product, role) {
  return "<article class=\"detail-product\">" + productMeta(product, false, role) + "</article>";
}

function detailPair(reference, alternative) {
  return "<div class=\"detail-pair\"><figure class=\"compare-reveal\" style=\"--reveal:50%\"><div class=\"compare-reveal__layer compare-reveal__layer--alternative\">" + garmentImage(alternative, true) + "</div><div class=\"compare-reveal__layer compare-reveal__layer--reference\">" + garmentImage(reference, true) + "</div><figcaption class=\"compare-reveal__labels\"><span>Reference</span><span>Alternative</span></figcaption><input class=\"compare-reveal__range\" type=\"range\" min=\"0\" max=\"100\" value=\"50\" aria-label=\"Move the comparison reveal between the reference and alternative\"></figure><div class=\"detail-pair__meta\">" + detailProduct(reference, "Reference") + detailProduct(alternative, "Selected alternative") + "</div></div>";
}

function detailAnalysis(comparison, alternativeId) {
  const reference = productById[comparison.referenceProductId];
  const alternative = productById[alternativeId];
  const saving = savingsFor(reference, alternative);
  const notes = comparison.alternativeEditorialNotes && comparison.alternativeEditorialNotes[alternativeId];
  const matches = (notes && notes.matches) || comparison.matches;
  const differences = (notes && notes.differences) || comparison.differences;
  const alternatives = comparison.alternativeProductIds.map((id) => {
    const product = productById[id];
    const pressed = product.id === alternativeId;
    return "<button class=\"alternative-option\" type=\"button\" data-action=\"select-alternative\" data-comparison-id=\"" + escapeHtml(comparison.id) + "\" data-alternative-id=\"" + escapeHtml(product.id) + "\" aria-pressed=\"" + String(pressed) + "\"><span>" + escapeHtml(displayValue(product.brand, "Brand not listed")) + "</span><span>" + money(product.priceAmount, product.currency) + "</span></button>";
  }).join("");
  const picker = comparison.alternativeProductIds.length > 1
    ? "<div class=\"alternative-picker\"><span class=\"alternative-picker__label\" id=\"alternative-picker-label\">Choose an alternative</span><div class=\"alternative-options\" role=\"group\" aria-labelledby=\"alternative-picker-label\">" + alternatives + "</div></div>"
    : "";
  const matchList = matches.length ? matches.map((line) => "<li>" + escapeHtml(line) + "</li>").join("") : "<li>Not documented yet.</li>";
  const differenceList = differences.length ? differences.slice(0, 3).map((line) => "<li>" + escapeHtml(line) + "</li>").join("") : "<li>Not documented yet.</li>";
  const savedButton = saveButton(comparison, alternative.id, "detail");
  const priceDifference = saving
    ? money(reference.priceAmount, reference.currency) + " reference · " + money(alternative.priceAmount, alternative.currency) + " alternative"
    : (!Number.isFinite(reference.priceAmount) || !Number.isFinite(alternative.priceAmount)
      ? "A listed price is missing, so a saving is not calculated."
      : reference.currency !== alternative.currency
        ? "The prices use different currencies; no conversion or saving is calculated."
        : "A saving is not calculated for this price pair.");
  const savingAmount = saving ? money(saving.amount, saving.currency) : "—";
  const savingPercent = saving ? (saving.amount < 0 ? Math.abs(saving.percent) + "% more" : saving.amount > 0 ? saving.percent + "% less" : "Same listed price") : "Not comparable";
  const disclosure = catalogueDisclosures[catalogueMode].detail;
  const sourceNotes = productSourceNote(reference, "Reference") + productSourceNote(alternative, "Alternative");
  return picker + "<div class=\"detail-value\"><div class=\"detail-value__copy\"><strong>Price difference</strong>" + escapeHtml(priceDifference) + "</div><div class=\"saving-block\"><strong>" + escapeHtml(savingAmount) + "</strong><span>" + escapeHtml(savingPercent) + "</span></div></div><div class=\"editorial-notes\"><section class=\"editorial-notes__column\" aria-labelledby=\"matches-title\"><h2 id=\"matches-title\">What matches</h2><ul>" + matchList + "</ul></section><section class=\"editorial-notes__column\" aria-labelledby=\"changes-title\"><h2 id=\"changes-title\">What changes</h2><ul>" + differenceList + "</ul></section></div><p class=\"editorial-reason\">" + escapeHtml(comparison.editorialReason) + "</p><div class=\"detail-actions\"><div class=\"detail-actions__sources\"><p>" + escapeHtml(disclosure) + "</p><p>" + escapeHtml(sourceCompletenessLabel(comparison.sourceCompleteness)) + "</p>" + sourceNotes + "</div>" + savedButton + "</div>";
}

function relatedItems(comparison) {
  const reference = productById[comparison.referenceProductId];
  const related = comparisons
    .filter((item) => item.id !== comparison.id)
    .map((item) => ({ item, product: productById[item.referenceProductId] }))
    .sort((a, b) => {
      const aSameCategory = a.product.category === reference.category ? 1 : 0;
      const bSameCategory = b.product.category === reference.category ? 1 : 0;
      const aSameStyle = a.item.styleTags.some((tag) => comparison.styleTags.includes(tag)) ? 1 : 0;
      const bSameStyle = b.item.styleTags.some((tag) => comparison.styleTags.includes(tag)) ? 1 : 0;
      return (bSameCategory - aSameCategory) || (bSameStyle - aSameStyle) || (a.item.sortOrder - b.item.sortOrder);
    })
    .slice(0, 3);
  return related.map(({ item, product }) => "<a class=\"related-item\" href=\"/edit/" + escapeHtml(item.slug) + "\" data-link><span class=\"related-item__art\">" + garmentImage(product) + "</span><span><strong>" + escapeHtml(item.title) + "</strong><span>" + escapeHtml(categoryLabels[product.category] || "Menswear") + " · " + escapeHtml(item.styleTags[0] || "Editorial edit") + "</span></span></a>").join("");
}

function detailPage(comparison) {
  const reference = productById[comparison.referenceProductId];
  const alternativeId = selectedAlternative(comparison);
  const alternative = productById[alternativeId];
  const category = categoryLabels[reference.category] || "Menswear";
  const topTags = comparison.styleTags.map((tag) => "<span class=\"detail-tag\">" + escapeHtml(tag) + "</span>").join("");
  return "<main class=\"page-shell detail-page\"><nav class=\"detail-breadcrumb\" aria-label=\"Breadcrumb\"><a href=\"/\" data-link>All edits</a><span aria-hidden=\"true\">/</span><span>" + escapeHtml(category) + "</span></nav><header class=\"detail-intro\"><div><p class=\"eyebrow\">" + escapeHtml(category) + " · The comparison</p><h1>" + escapeHtml(comparison.title) + "</h1></div><p class=\"detail-intro__summary\">" + escapeHtml(comparison.editorialReason) + "</p></header><div class=\"detail-tags\">" + topTags + "</div><section class=\"detail-comparison\" id=\"detail-comparison\" aria-label=\"Price and editorial comparison\">" + detailPair(reference, alternative) + "<div class=\"detail-analysis\" id=\"detail-analysis\">" + detailAnalysis(comparison, alternativeId) + "</div></section><section class=\"related-section\" aria-labelledby=\"related-title\"><div class=\"section-head\"><h2 id=\"related-title\">A related edit</h2><p class=\"section-head__note\">Another comparison from the same point of view</p></div><div class=\"related-list\">" + relatedItems(comparison) + "</div></section></main>";
}

function notFoundPage() {
  return "<main class=\"page-shell not-found\"><p class=\"eyebrow\">That edit is not in the book</p><h1>We could not find this comparison.</h1><a class=\"button\" href=\"/\" data-link>Browse the edits</a></main>";
}

function masthead(active) {
  const homeCurrent = active === "home" ? " aria-current=\"page\"" : "";
  const savedCurrent = active === "saved" ? " aria-current=\"page\"" : "";
  const edition = catalogueMode === "illustrative"
    ? comparisons.length + (comparisons.length === 1 ? " illustrative edit" : " illustrative edits")
    : catalogueMode === "mixed" ? "Mixed catalogue · " + comparisons.length + " edits" : "Curated catalogue · " + comparisons.length + " edits";
  return "<header class=\"masthead page-shell\"><div class=\"masthead__meta\"><span>Independent style comparisons</span><span>" + escapeHtml(edition) + "</span></div><a class=\"masthead__brand\" href=\"/\" data-link aria-label=\"The Less Edit home\">The Less <span>Edit</span></a><nav class=\"masthead__nav\" aria-label=\"Primary\"><a href=\"/\"" + homeCurrent + " data-link>Browse the edits</a><a href=\"/saved\"" + savedCurrent + " data-link>Saved <span class=\"saved-count\" id=\"saved-count\">" + savedItems.length + "</span></a></nav><hr class=\"masthead__double-rule\" aria-hidden=\"true\"></header>";
}

function footer() {
  return "<footer class=\"site-footer page-shell\"><div class=\"site-footer__top\"><a class=\"site-footer__brand\" href=\"/\" data-link>The Less Edit</a><span class=\"site-footer__statement\">Expensive taste. Smarter prices.</span></div><p class=\"site-footer__note\">" + escapeHtml(catalogueDisclosures[catalogueMode].footer) + "</p></footer>";
}

function render() {
  if (revealObserver) {
    revealObserver.disconnect();
    revealObserver = null;
  }
  const route = currentRoute();
  let page = "";
  let active = "home";
  if (route.page === "home") page = homePage();
  else if (route.page === "saved") {
    page = savedPage();
    active = "saved";
  } else if (route.page === "detail") {
    const comparison = comparisonBySlug[route.slug];
    if (comparison) {
      page = detailPage(comparison);
      document.title = comparison.title + " — The Less Edit";
    } else {
      page = notFoundPage();
      document.title = "Edit not found — The Less Edit";
    }
  } else {
    page = notFoundPage();
    document.title = "Edit not found — The Less Edit";
  }
  if (route.page !== "detail") document.title = route.page === "saved" ? "Saved edits — The Less Edit" : "The Less Edit — Expensive taste. Smarter prices.";
  appRoot.innerHTML = masthead(active) + page + footer();
  observeReveals(appRoot);
}

function syncSavedButtons(comparisonId) {
  const saved = isSaved(comparisonId);
  const comparison = comparisons.find((item) => item.id === comparisonId);
  document.querySelectorAll("[data-comparison-id=\"" + comparisonId + "\"][data-action=\"toggle-save\"]").forEach((button) => {
    button.setAttribute("aria-pressed", String(saved));
    button.setAttribute("aria-label", (saved ? "Remove " : "Save ") + comparison.title + " from saved edits");
    const label = button.querySelector("[data-save-label]");
    if (label) label.textContent = button.closest(".comparison-card") && currentRoute().page === "saved" ? "Remove" : (saved ? "Saved" : "Save");
  });
  const count = document.getElementById("saved-count");
  if (count) count.textContent = String(savedItems.length);
}

function toggleSaved(comparisonId, alternativeId) {
  const index = savedItems.findIndex((item) => item.comparisonId === comparisonId);
  if (index >= 0) savedItems.splice(index, 1);
  else {
    const comparison = comparisons.find((item) => item.id === comparisonId);
    const validAlternative = comparison && comparison.alternativeProductIds.includes(alternativeId)
      ? alternativeId
      : (comparison && comparison.featuredAlternativeId);
    savedItems.push({ comparisonId, selectedAlternativeId: validAlternative });
  }
  writeSaved();
  syncSavedButtons(comparisonId);
  if (currentRoute().page === "saved") renderSavedList();
}

function renderSavedList() {
  const content = document.getElementById("saved-content");
  if (!content) {
    if (currentRoute().page === "saved") render();
    return;
  }
  if (revealObserver) {
    revealObserver.disconnect();
    revealObserver = null;
  }
  const savedPageMarkup = savedPage();
  appRoot.innerHTML = masthead("saved") + savedPageMarkup + footer();
  observeReveals(appRoot);
}

function showToast(message, undo) {
  if (!toastRegion) return;
  if (undoTimer) window.clearTimeout(undoTimer);
  toastRegion.innerHTML = "<div class=\"toast\"><span>" + escapeHtml(message) + "</span>" + (undo ? "<button type=\"button\" data-action=\"undo-remove\">Undo</button>" : "") + "</div>";
  if (undo) undoTimer = window.setTimeout(() => {
    undoEntry = null;
    toastRegion.innerHTML = "";
  }, 6500);
  else window.setTimeout(() => { toastRegion.innerHTML = ""; }, 4800);
}

function removeSavedWithUndo(comparisonId) {
  const index = savedItems.findIndex((item) => item.comparisonId === comparisonId);
  if (index < 0) return;
  undoEntry = savedItems[index];
  const comparison = comparisons.find((item) => item.id === comparisonId);
  savedItems.splice(index, 1);
  writeSaved();
  renderSavedList();
  showToast("Removed “" + comparison.title + "” from your saved edits.", true);
}

function undoRemoval() {
  if (!undoEntry) return;
  if (!isSaved(undoEntry.comparisonId)) savedItems.push(undoEntry);
  undoEntry = null;
  if (undoTimer) window.clearTimeout(undoTimer);
  writeSaved();
  renderSavedList();
  toastRegion.innerHTML = "";
}

function updateDetailAlternative(comparisonId, alternativeId, clickedButton) {
  const comparison = comparisons.find((item) => item.id === comparisonId);
  if (!comparison || !comparison.alternativeProductIds.includes(alternativeId)) return;
  detailSelections[comparisonId] = alternativeId;
  const currentSaved = savedEntry(comparisonId);
  if (currentSaved) {
    currentSaved.selectedAlternativeId = alternativeId;
    writeSaved();
  }
  const panel = document.getElementById("detail-comparison");
  if (!panel) {
    navigate("/edit/" + comparison.slug, false);
    return;
  }
  panel.classList.add("is-switching");
  window.setTimeout(() => {
    const reference = productById[comparison.referenceProductId];
    const alternative = productById[alternativeId];
    panel.innerHTML = detailPair(reference, alternative) + "<div class=\"detail-analysis\" id=\"detail-analysis\">" + detailAnalysis(comparison, alternativeId) + "</div>";
    panel.classList.remove("is-switching");
    syncSavedButtons(comparisonId);
    const selected = panel.querySelector(".alternative-option[aria-pressed=\"true\"]");
    if (selected && clickedButton) selected.focus({ preventScroll: true });
  }, 105);
}

function updateFeedControls() {
  const category = document.getElementById("category-filter");
  const price = document.getElementById("price-filter");
  const sort = document.getElementById("sort-filter");
  const search = document.getElementById("search-filter");
  if (category) filterState.category = category.value;
  if (price) filterState.maxPrice = price.value === "all" ? null : price.value;
  if (sort) filterState.sort = sort.value;
  if (search) filterState.search = search.value;
  updateFeed();
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-link]");
  if (link && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) {
    event.preventDefault();
    if (link.getAttribute("href").startsWith("#")) {
      const target = document.querySelector(link.getAttribute("href"));
      if (target) target.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
      return;
    }
    navigate(link.getAttribute("href"), true);
    return;
  }
  const styleButton = event.target.closest(".style-filter");
  if (styleButton) {
    filterState.style = styleButton.dataset.style;
    document.querySelectorAll(".style-filter").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.style === filterState.style)));
    updateFeed();
    return;
  }
  const action = event.target.closest("[data-action]");
  if (!action) return;
  if (action.dataset.action === "toggle-save") {
    if (currentRoute().page === "saved" && isSaved(action.dataset.comparisonId)) {
      removeSavedWithUndo(action.dataset.comparisonId);
    } else {
      toggleSaved(action.dataset.comparisonId, action.dataset.alternativeId);
    }
  } else if (action.dataset.action === "select-alternative") {
    updateDetailAlternative(action.dataset.comparisonId, action.dataset.alternativeId, true);
  } else if (action.dataset.action === "undo-remove") {
    undoRemoval();
  } else if (action.dataset.action === "reset-filters") {
    filterState.category = "all";
    filterState.maxPrice = defaultPriceFilter;
    filterState.style = "all";
    filterState.search = "";
    filterState.sort = "editorial";
    navigate("/", false);
    const browse = document.getElementById("browse");
    if (browse) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      browse.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }
  }
});

document.addEventListener("input", (event) => {
  if (event.target && event.target.matches(".compare-reveal__range")) {
    const reveal = event.target.closest(".compare-reveal");
    if (reveal) reveal.style.setProperty("--reveal", event.target.value + "%");
    return;
  }
  if (event.target && event.target.id === "search-filter") {
    filterState.search = event.target.value;
    updateFeed();
  }
});

document.addEventListener("change", (event) => {
  if (event.target && ["category-filter", "price-filter", "sort-filter"].includes(event.target.id)) updateFeedControls();
});

window.addEventListener("popstate", () => renderWithTransition());

render();
