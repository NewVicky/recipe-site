/* Shared by index.html and recipe.html.
   Whichever container exists on the page decides what gets drawn. */

const listBox = document.getElementById("recipe-list");
const oneBox  = document.getElementById("recipe");

const UNCATEGORIZED = "Other";

/* Tab order. This is the one list worth keeping by hand — a meal reads in
   an order that alphabetical can't guess. Categories not named here still
   show up, sorted alphabetically, after these. */
const CATEGORY_ORDER = ["Breakfast", "Dinner", "Sides", "Drinks", "Dessert", "Basics"];

function byCategoryOrder(a, b) {
  const ia = CATEGORY_ORDER.indexOf(a);
  const ib = CATEGORY_ORDER.indexOf(b);
  if (ia === -1 && ib === -1) return a.localeCompare(b);
  if (ia === -1) return 1;
  if (ib === -1) return -1;
  return ia - ib;
}

fetch("recipes.json")
  .then(res => {
    if (!res.ok) throw new Error(`recipes.json → ${res.status}`);
    return res.json();
  })
  .then(recipes => {
    if (listBox) renderList(recipes);
    if (oneBox)  renderOne(recipes);
  })
  .catch(err => {
    document.querySelector("main").innerHTML =
      `<p class="error">Couldn't load recipes: ${err.message}</p>`;
  });

/* Only the parts that exist, joined with dots. Keeps a recipe with no
   known time or yield from rendering "undefined". */
function metaLine(parts) {
  return parts.filter(Boolean).join(" &middot; ");
}

/* notes / from may be a single string or a list of them. */
function toList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

/* ---------------------------------------------------------
   List page: tabs + filtered cards
   --------------------------------------------------------- */
function renderList(recipes) {
  const active = new URLSearchParams(location.search).get("c");

  const shown = active
    ? recipes.filter(r => (r.category || UNCATEGORIZED) === active)
    : recipes;

  renderTabs(recipes, active);

  if (shown.length === 0) {
    listBox.innerHTML = `<p class="error">Nothing in "${active}" yet.</p>`;
    return;
  }

  // Carry the current tab through, so the recipe page can send you back to it.
  const from = active ? `&c=${encodeURIComponent(active)}` : "";

  listBox.innerHTML = shown.map(r => `
    <a class="card" href="recipe.html?r=${r.slug}${from}">
      <h2>${r.title}</h2>
      <p class="meta">${metaLine([r.category || UNCATEGORIZED, r.cuisine, r.time, r.serves])}</p>
      ${r.blurb ? `<p class="blurb">${r.blurb}</p>` : ""}
    </a>
  `).join("");
}

/* Shown on both the list and a single recipe.

   markCurrent is false on a recipe page, deliberately. The filled tab means
   "this filter is applied", which only means anything against a list — on a
   recipe it just makes the most useful tab look already-selected and dead.
   The recipe's category is already named in the meta line and the back
   button, so nothing is lost by leaving every tab plainly clickable. */
function renderTabs(recipes, active, markCurrent = true) {
  const tabBox = document.getElementById("tabs");
  if (!tabBox) return;

  const categories = [...new Set(recipes.map(r => r.category || UNCATEGORIZED))].sort(byCategoryOrder);
  if (categories.length < 2) return;

  const count = cat => recipes.filter(r => (r.category || UNCATEGORIZED) === cat).length;

  const tab = (label, href, isActive, n) =>
    `<a class="tab${isActive ? " tab-active" : ""}" href="${href}">${label} <span class="tab-count">${n}</span></a>`;

  tabBox.innerHTML =
    tab("All", "index.html", markCurrent && !active, recipes.length) +
    categories.map(c => tab(c, `index.html?c=${encodeURIComponent(c)}`,
                            markCurrent && c === active, count(c))).join("");
}

/* ---------------------------------------------------------
   Single recipe page
   --------------------------------------------------------- */
function renderOne(recipes) {
  const params = new URLSearchParams(location.search);
  const slug = params.get("r");
  const r = recipes.find(x => x.slug === slug);

  if (!r) {
    oneBox.innerHTML = `<p class="error">No recipe called "${slug}".
      <a href="index.html">Back to all recipes</a>.</p>`;
    return;
  }

  document.title = `${r.title} — My Recipes`;

  const cat = r.category || UNCATEGORIZED;
  renderTabs(recipes, null, false);

  // Where to send you back to. Only trust the tab if it's a real category.
  const known = new Set(recipes.map(x => x.category || UNCATEGORIZED));
  const from = params.get("c");
  const back = from && known.has(from)
    ? { href: `index.html?c=${encodeURIComponent(from)}`, label: `Back to ${from}` }
    : { href: "index.html", label: "All recipes" };

  const catLink = `<a href="index.html?c=${encodeURIComponent(cat)}">${cat}</a>`;
  const notes = toList(r.notes).map(n => typeof n === "string" ? { text: n, src: "recipe" } : n);
  const trouble = toList(r.troubleshooting);
  const variations = r.variations || [];
  const images = r.images || [];

  oneBox.innerHTML = `
    <article class="recipe">
      <div class="recipe-head">
        <h2>${r.title}</h2>
        ${r.from ? `<p class="from">From ${r.from}</p>` : ""}
        <p class="meta">${metaLine([catLink, r.cuisine, r.time, r.serves])}</p>
        ${r.blurb ? `<p class="blurb">${r.blurb}</p>` : ""}
      </div>

      <div class="recipe-body">
        <!-- One list, two presentations: a sticky column on wide screens,
             a slide-up sheet behind a button on narrow ones. -->
        <section class="ingredients-col">
          <h3>Ingredients</h3>
          <ul>${r.ingredients.map(i => `<li>${i}</li>`).join("")}</ul>
          <button class="sheet-close" type="button">Done</button>
        </section>

        <div class="method-col">
          <h3>Method</h3>
          <ol>${r.method.map(s => `<li>${s}</li>`).join("")}</ol>

          ${trouble.length ? `
            <h3>Troubleshooting</h3>
            <ul class="notes">${trouble.map(t => `<li>${t}</li>`).join("")}</ul>
          ` : ""}

          ${variations.length ? `
            <h3>Variations</h3>
            <dl class="variations">
              ${variations.map(v => `<dt>${v.name}</dt><dd>${v.how}</dd>`).join("")}
            </dl>
          ` : ""}

          ${notes.length ? `
            <details class="notes-box">
              <summary>Notes (${notes.length})</summary>
              <ul class="notes">${notes.map(n => `
                <li${n.src === "claude" ? ' class="added"' : ""}>${n.text}${
                  n.src === "claude" ? ' <span class="added-tag">added by Claude</span>' : ""
                }</li>`).join("")}</ul>
            </details>
          ` : ""}

          ${images.length ? `
            <h3>Pictures</h3>
            <div class="shots">
              ${images.map(im => `
                <figure>
                  <img src="${im.src}" alt="${im.caption || r.title}" loading="lazy">
                  ${im.caption ? `<figcaption>${im.caption}</figcaption>` : ""}
                </figure>
              `).join("")}
            </div>
          ` : ""}
        </div>
      </div>

      <p class="back"><a href="${back.href}"><span class="arrow">&larr;</span> ${back.label}</a></p>
    </article>

    <div class="sheet-backdrop" hidden></div>
    <button class="ing-fab" type="button">Ingredients</button>
  `;

  wireIngredientSheet();
}

/* The floating button only does anything on narrow screens — CSS hides it
   above the two-column breakpoint, where both panels are visible anyway. */
function wireIngredientSheet() {
  const panel    = document.querySelector(".ingredients-col");
  const fab      = document.querySelector(".ing-fab");
  const backdrop = document.querySelector(".sheet-backdrop");
  const closeBtn = document.querySelector(".sheet-close");

  const setOpen = open => {
    panel.classList.toggle("as-sheet", open);
    backdrop.hidden = !open;
    document.body.classList.toggle("sheet-open", open);
  };

  fab.addEventListener("click", () => setOpen(!panel.classList.contains("as-sheet")));
  backdrop.addEventListener("click", () => setOpen(false));
  closeBtn.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") setOpen(false);
  });
}
