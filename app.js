import { comparisons, products, productById, comparisonBySlug, categoryLabels, styleEdits } from "./data.js";

const STORAGE_KEY = "the-less-edit:saved-comparisons:v1";
const appRoot = document.getElementById("app");
const toastRegion = document.getElementById("toast-region");
const categoryOrder = ["knit-polo", "shirt", "trousers", "loafer", "knitwear"];
const filterState = { category: "all", maxPrice: 160, style: "all", search: "", sort: "editorial" };
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

function money(amount) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(amount);
}

function savingsFor(reference, alternative) {
  const amount = reference.priceAmount - alternative.priceAmount;
  return { amount, percent: Math.round((amount / reference.priceAmount) * 100) };
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
    .filter((product) => product && product.priceAmount <= filterState.maxPrice);
  if (allowed.length === 0) return null;
  if (filterState.sort === "price" || filterState.sort === "saving") {
    return allowed.sort((a, b) => a.priceAmount - b.priceAmount)[0];
  }
  const preferred = productById[comparison.featuredAlternativeId];
  if (preferred && preferred.priceAmount <= filterState.maxPrice) return preferred;
  return allowed.sort((a, b) => a.priceAmount - b.priceAmount)[0];
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
  const stage = product.illustration.stage;
  return "product-stage product-stage--" + escapeHtml(stage);
}

function garmentImage(product, eager = false) {
  const cell = Math.max(0, Math.min(20, Number(product.illustration.sheetCell) || 0));
  const loading = eager ? "eager" : "lazy";
  const priority = eager ? " fetchpriority=\"high\"" : "";
  return "<img class=\"product-stage__art\" src=\"/assets/garments/item-" + String(cell).padStart(2, "0") + ".avif\" alt=\"" + escapeHtml(product.colour + " " + product.name) + "\" width=\"626\" height=\"468\" decoding=\"async\" loading=\"" + loading + "\"" + priority + ">";
}

function productArt(product, role, eager = false) {
  return "<a class=\"" + stageClass(product) + "\" href=\"/edit/" + escapeHtml(product.comparisonSlug || "") + "\" data-link aria-label=\"" + escapeHtml(role + ": " + product.brand + " " + product.name) + "\">" + garmentImage(product, eager) + "</a>";
}

function productArtStatic(product, role, eager = false) {
  return "<div class=\"" + stageClass(product) + "\" aria-label=\"" + escapeHtml(role + ": " + product.brand + " " + product.name) + "\">" + garmentImage(product, eager) + "</div>";
}

function productMeta(product, compact, role) {
  if (compact) {
    return "<div class=\"pair-art__meta\"><div class=\"pair-art__byline\"><span class=\"pair-art__role\">" + escapeHtml(role) + "</span><span class=\"pair-art__brand\">" + escapeHtml(product.brand) + "</span></div><span class=\"pair-art__name\">" + escapeHtml(product.name) + "</span><div class=\"pair-art__subline\"><span class=\"pair-art__price\">" + money(product.priceAmount) + "</span><span class=\"pair-art__detail\">" + escapeHtml(product.colour) + "</span></div></div>";
  }
  return "<div class=\"detail-product__meta\"><div><div class=\"detail-product__byline\"><span class=\"detail-product__role\">" + escapeHtml(role) + "</span><span class=\"detail-product__brand\">" + escapeHtml(product.brand) + "</span></div><h2>" + escapeHtml(product.name) + "</h2><div class=\"detail-product__facts\"><span>" + escapeHtml(product.colour) + "</span><span>" + escapeHtml(product.fitDescription) + "</span><span>" + escapeHtml(product.materialComposition) + "</span></div></div><span class=\"detail-product__price\">" + money(product.priceAmount) + "</span></div>";
}

function pairArt(comparison, alternative, linked, eager = false) {
  const reference = productById[comparison.referenceProductId];
  const alt = typeof alternative === "string" ? productById[alternative] : alternative;
  reference.comparisonSlug = comparison.slug;
  alt.comparisonSlug = comparison.slug;
  const draw = linked ? productArt : productArtStatic;
  return "<div class=\"pair-art\"><div class=\"pair-art__item\">" + draw(reference, "Reference", eager) + productMeta(reference, true, "Reference") + "</div><div class=\"pair-art__item\">" + draw(alt, "Alternative", eager) + productMeta(alt, true, "Alternative") + "</div></div>";
}

function comparisonCard(comparison, alternative, context) {
  const reference = productById[comparison.referenceProductId];
  const saving = savingsFor(reference, alternative);
  const tags = comparison.editTags.slice(0, 2).map((tag) => "<span>" + escapeHtml(tag) + "</span>").join("");
  const action = context === "saved" ? saveButton(comparison, alternative.id, "saved") : saveButton(comparison, alternative.id, "feed");
  return "<article class=\"comparison-card\" data-reveal><div class=\"comparison-card__art\">" + pairArt(comparison, alternative, true) + "<div class=\"comparison-card__save\">" + action + "</div></div><div class=\"comparison-card__meta\"><div><span class=\"comparison-card__category\">" + escapeHtml(categoryLabels[reference.category]) + " · " + escapeHtml(reference.brand) + "</span><h3><a class=\"comparison-card__title\" href=\"/edit/" + escapeHtml(comparison.slug) + "\" data-link>" + escapeHtml(comparison.title) + "</a></h3><p class=\"comparison-card__summary\">" + escapeHtml(comparison.editorialReason) + "</p></div><div class=\"comparison-card__savings\">Save " + money(saving.amount) + "<br>" + saving.percent + "% less</div></div><div class=\"comparison-card__actions\"><div class=\"comparison-card__tags\">" + tags + "</div><a class=\"text-link\" href=\"/edit/" + escapeHtml(comparison.slug) + "\" data-link>Read the edit <span aria-hidden=\"true\">→</span></a></div></article>";
}

function filteredComparisons() {
  const search = filterState.search.trim().toLowerCase();
  const filtered = comparisons.filter((comparison) => {
    const reference = productById[comparison.referenceProductId];
    if (filterState.category !== "all" && reference.category !== filterState.category) return false;
    if (!comparison.alternativeProductIds.some((id) => productById[id] && productById[id].priceAmount <= filterState.maxPrice)) return false;
    if (filterState.style !== "all" && !comparison.editTags.includes(filterState.style)) return false;
    if (search) {
      const haystack = [reference.brand, reference.name, categoryLabels[reference.category]]
        .concat(comparison.alternativeProductIds.flatMap((id) => [productById[id].brand, productById[id].name]))
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
  if (filterState.sort === "price") filtered.sort((a, b) => cardAlternative(a).priceAmount - cardAlternative(b).priceAmount || a.editorialOrder - b.editorialOrder);
  else if (filterState.sort === "saving") filtered.sort((a, b) => savingsFor(productById[b.referenceProductId], cardAlternative(b)).percent - savingsFor(productById[a.referenceProductId], cardAlternative(a)).percent || a.editorialOrder - b.editorialOrder);
  else filtered.sort((a, b) => a.editorialOrder - b.editorialOrder);
  return filtered;
}

function filterMarkup() {
  const categoryOptions = ["all"].concat(categoryOrder).map((category) => {
    const label = category === "all" ? "All categories" : categoryLabels[category];
    return "<option value=\"" + category + "\"" + (filterState.category === category ? " selected" : "") + ">" + escapeHtml(label) + "</option>";
  }).join("");
  const priceOptions = [
    { value: 75, label: "Up to €75" },
    { value: 100, label: "Up to €100" },
    { value: 125, label: "Up to €125" },
    { value: 160, label: "Up to €160" }
  ].map((item) => "<option value=\"" + item.value + "\"" + (filterState.maxPrice === item.value ? " selected" : "") + ">" + item.label + "</option>").join("");
  const sortOptions = [
    { value: "editorial", label: "Editorial picks" },
    { value: "price", label: "Lowest alternative price" },
    { value: "saving", label: "Biggest saving" }
  ].map((item) => "<option value=\"" + item.value + "\"" + (filterState.sort === item.value ? " selected" : "") + ">" + item.label + "</option>").join("");
  const tags = ["all"].concat(styleEdits).map((style) => {
    const label = style === "all" ? "All edits" : style;
    return "<button class=\"tag-button style-filter\" type=\"button\" data-style=\"" + escapeHtml(style) + "\" aria-pressed=\"" + String(filterState.style === style) + "\">" + escapeHtml(label) + "</button>";
  }).join("");
  return "<div class=\"filter-controls\"><div class=\"field\"><label for=\"search-filter\">Search by brand, item or category</label><input id=\"search-filter\" name=\"search\" type=\"search\" autocomplete=\"off\" placeholder=\"Try linen, Valmere, or shirt\" value=\"" + escapeHtml(filterState.search) + "\"></div><div class=\"field\"><label for=\"category-filter\">Category</label><select id=\"category-filter\" name=\"category\">" + categoryOptions + "</select></div><div class=\"field\"><label for=\"price-filter\">Alternative price</label><select id=\"price-filter\" name=\"maxPrice\">" + priceOptions + "</select></div><div class=\"field\"><label for=\"sort-filter\">Sort by</label><select id=\"sort-filter\" name=\"sort\">" + sortOptions + "</select></div></div><div class=\"filter-tags\"><span class=\"filter-label\">Style edit</span><div class=\"tag-list\">" + tags + "</div></div>";
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

function featureMarkup() {
  const comparison = comparisons[7];
  const reference = productById[comparison.referenceProductId];
  const alternative = productById[comparison.featuredAlternativeId];
  const saving = savingsFor(reference, alternative);
  return "<div class=\"feature-edit feature-edit--hero\"><div class=\"feature-edit__topline\"><span>Opening edit · " + escapeHtml(categoryLabels[reference.category]) + "</span>" + saveButton(comparison, alternative.id, "feed") + "</div>" + pairArt(comparison, alternative, true, true) + "<div class=\"feature-edit__bottomline\"><span>" + money(saving.amount) + " saved · " + saving.percent + "% less</span><a href=\"/edit/" + escapeHtml(comparison.slug) + "\" data-link>See why it works <span aria-hidden=\"true\">→</span></a></div></div>";
}

function homePage() {
  const initial = filteredComparisons();
  const initialCards = initial.map((comparison) => comparisonCard(comparison, cardAlternative(comparison), "feed")).join("");
  return "<main class=\"page-shell\"><section class=\"hero\" aria-labelledby=\"home-title\"><div class=\"hero__copy\"><p class=\"eyebrow\">Expensive taste. Smarter prices.</p><h1 id=\"home-title\">The finer points of a knit.</h1><p class=\"hero__lede\">Brushed cashmere against fine merino: the same dark warmth, a smoother hand, and €624 between them.</p><a class=\"text-link\" href=\"#browse\">Browse the edits <span aria-hidden=\"true\">↓</span></a></div><div class=\"hero__pair\">" + featureMarkup() + "</div></section><section class=\"content-section\" id=\"browse\" aria-labelledby=\"browse-title\"><div class=\"section-head\"><h2 id=\"browse-title\">The edit, in detail</h2><p class=\"section-head__note\">Eight comparisons across knits, shirts, trousers and shoes</p></div><div class=\"filter-panel\" role=\"search\" aria-label=\"Filter menswear edits\">" + filterMarkup() + "<p class=\"filter-status\" id=\"filter-status\" aria-live=\"polite\">" + initial.length + (initial.length === 1 ? " edit" : " edits") + "</p></div><div class=\"comparison-grid\" id=\"comparison-grid\">" + (initialCards || "<div class=\"empty-results\"><h3>No edits match those filters.</h3><p>Try a broader price ceiling, another category, or a shorter search.</p><button class=\"button button--quiet\" type=\"button\" data-action=\"reset-filters\">Reset filters</button></div>") + "</div></section><section class=\"how-it-works\" aria-labelledby=\"how-title\"><div class=\"how-it-works__head\"><h2 id=\"how-title\">What makes a useful comparison?</h2><p>Price matters after shape, cloth and finish have been weighed against each other.</p></div><div class=\"steps\"><article class=\"step\"><span class=\"step__number\">01</span><div><h3>Read the line</h3><p>Rise, shoulder, collar and hem determine how the piece sits.</p></div></article><article class=\"step\"><span class=\"step__number\">02</span><div><h3>Feel the cloth</h3><p>Fibre, weight and finish change the drape and the way a garment wears.</p></div></article><article class=\"step\"><span class=\"step__number\">03</span><div><h3>Weigh the trade-off</h3><p>Each edit sets the saving beside the detail that gives way.</p></div></article></div></section></main>";
}

function savedPage() {
  const valid = savedItems
    .map((item) => ({ item, comparison: comparisons.find((comparison) => comparison.id === item.comparisonId) }))
    .filter((row) => row.comparison && productById[row.item.selectedAlternativeId])
    .sort((a, b) => a.comparison.editorialOrder - b.comparison.editorialOrder);
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
  const notes = comparison.alternativeNotes && comparison.alternativeNotes[alternativeId];
  const matches = (notes && notes.matches) || comparison.matches;
  const differences = (notes && notes.differences) || comparison.differences;
  const alternatives = comparison.alternativeProductIds.map((id) => {
    const product = productById[id];
    const pressed = product.id === alternativeId;
    return "<button class=\"alternative-option\" type=\"button\" data-action=\"select-alternative\" data-comparison-id=\"" + escapeHtml(comparison.id) + "\" data-alternative-id=\"" + escapeHtml(product.id) + "\" aria-pressed=\"" + String(pressed) + "\"><span>" + escapeHtml(product.brand) + "</span><span>" + money(product.priceAmount) + "</span></button>";
  }).join("");
  const picker = comparison.alternativeProductIds.length > 1
    ? "<div class=\"alternative-picker\"><span class=\"alternative-picker__label\" id=\"alternative-picker-label\">Choose an alternative</span><div class=\"alternative-options\" role=\"group\" aria-labelledby=\"alternative-picker-label\">" + alternatives + "</div></div>"
    : "";
  const matchList = matches.map((line) => "<li>" + escapeHtml(line) + "</li>").join("");
  const differenceList = differences.slice(0, 3).map((line) => "<li>" + escapeHtml(line) + "</li>").join("");
  const savedButton = saveButton(comparison, alternative.id, "detail");
  return picker + "<div class=\"detail-value\"><div class=\"detail-value__copy\"><strong>Price difference</strong>" + money(reference.priceAmount) + " reference · " + money(alternative.priceAmount) + " alternative</div><div class=\"saving-block\"><strong>" + money(saving.amount) + "</strong><span>" + saving.percent + "% less</span></div></div><div class=\"editorial-notes\"><section class=\"editorial-notes__column\" aria-labelledby=\"matches-title\"><h2 id=\"matches-title\">What matches</h2><ul>" + matchList + "</ul></section><section class=\"editorial-notes__column\" aria-labelledby=\"changes-title\"><h2 id=\"changes-title\">What changes</h2><ul>" + differenceList + "</ul></section></div><p class=\"editorial-reason\">" + escapeHtml(comparison.editorialReason) + "</p><div class=\"detail-actions\"><p>Fictional products and prices for a concept prototype. No purchase links.</p>" + savedButton + "</div>";
}

function relatedItems(comparison) {
  const reference = productById[comparison.referenceProductId];
  const related = comparisons
    .filter((item) => item.id !== comparison.id)
    .map((item) => ({ item, product: productById[item.referenceProductId] }))
    .sort((a, b) => {
      const aSameCategory = a.product.category === reference.category ? 1 : 0;
      const bSameCategory = b.product.category === reference.category ? 1 : 0;
      const aSameStyle = a.item.editTags.some((tag) => comparison.editTags.includes(tag)) ? 1 : 0;
      const bSameStyle = b.item.editTags.some((tag) => comparison.editTags.includes(tag)) ? 1 : 0;
      return (bSameCategory - aSameCategory) || (bSameStyle - aSameStyle) || (a.item.editorialOrder - b.item.editorialOrder);
    })
    .slice(0, 3);
  return related.map(({ item, product }) => "<a class=\"related-item\" href=\"/edit/" + escapeHtml(item.slug) + "\" data-link><span class=\"related-item__art\">" + garmentImage(product) + "</span><span><strong>" + escapeHtml(item.title) + "</strong><span>" + escapeHtml(categoryLabels[product.category]) + " · " + escapeHtml(item.editTags[0]) + "</span></span></a>").join("");
}

function detailPage(comparison) {
  const reference = productById[comparison.referenceProductId];
  const alternativeId = selectedAlternative(comparison);
  const alternative = productById[alternativeId];
  const category = categoryLabels[reference.category];
  const topTags = comparison.editTags.map((tag) => "<span class=\"detail-tag\">" + escapeHtml(tag) + "</span>").join("");
  return "<main class=\"page-shell detail-page\"><nav class=\"detail-breadcrumb\" aria-label=\"Breadcrumb\"><a href=\"/\" data-link>All edits</a><span aria-hidden=\"true\">/</span><span>" + escapeHtml(category) + "</span></nav><header class=\"detail-intro\"><div><p class=\"eyebrow\">" + escapeHtml(category) + " · The comparison</p><h1>" + escapeHtml(comparison.title) + "</h1></div><p class=\"detail-intro__summary\">" + escapeHtml(comparison.editorialReason) + "</p></header><div class=\"detail-tags\">" + topTags + "</div><section class=\"detail-comparison\" id=\"detail-comparison\" aria-label=\"Price and editorial comparison\">" + detailPair(reference, alternative) + "<div class=\"detail-analysis\" id=\"detail-analysis\">" + detailAnalysis(comparison, alternativeId) + "</div></section><section class=\"related-section\" aria-labelledby=\"related-title\"><div class=\"section-head\"><h2 id=\"related-title\">A related edit</h2><p class=\"section-head__note\">Another comparison from the same point of view</p></div><div class=\"related-list\">" + relatedItems(comparison) + "</div></section></main>";
}

function notFoundPage() {
  return "<main class=\"page-shell not-found\"><p class=\"eyebrow\">That edit is not in the book</p><h1>We could not find this comparison.</h1><a class=\"button\" href=\"/\" data-link>Browse the edits</a></main>";
}

function masthead(active) {
  const homeCurrent = active === "home" ? " aria-current=\"page\"" : "";
  const savedCurrent = active === "saved" ? " aria-current=\"page\"" : "";
  return "<header class=\"masthead page-shell\"><div class=\"masthead__meta\"><span>Independent style comparisons</span><span>Edition 01 · Eight edits</span></div><a class=\"masthead__brand\" href=\"/\" data-link aria-label=\"The Less Edit home\">The Less <span>Edit</span></a><nav class=\"masthead__nav\" aria-label=\"Primary\"><a href=\"/\"" + homeCurrent + " data-link>Browse the edits</a><a href=\"/saved\"" + savedCurrent + " data-link>Saved <span class=\"saved-count\" id=\"saved-count\">" + savedItems.length + "</span></a></nav><hr class=\"masthead__double-rule\" aria-hidden=\"true\"></header>";
}

function footer() {
  return "<footer class=\"site-footer page-shell\"><div class=\"site-footer__top\"><a class=\"site-footer__brand\" href=\"/\" data-link>The Less Edit</a><span class=\"site-footer__statement\">Expensive taste. Smarter prices.</span></div><p class=\"site-footer__note\">A concept prototype. Every brand, item, retailer and price in this catalogue is fictional. No product links or commerce.</p></footer>";
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
  if (price) filterState.maxPrice = Number(price.value);
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
    filterState.maxPrice = 160;
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
