/* Shared by index.html and recipe.html.
   Whichever container exists on the page decides what gets drawn. */

const listBox = document.getElementById("recipe-list");
const oneBox  = document.getElementById("recipe");

const UNCATEGORISED = "Other";

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

/* ---------------------------------------------------------
   List page: tabs + filtered cards
   --------------------------------------------------------- */
function renderList(recipes) {
  // Which tab is selected? Comes from the URL, so tabs are bookmarkable
  // and the back button works.
  const active = new URLSearchParams(location.search).get("c");

  // Tabs are DERIVED from the recipes — never maintained by hand.
  const categories = [...new Set(recipes.map(r => r.category || UNCATEGORISED))].sort();

  const shown = active
    ? recipes.filter(r => (r.category || UNCATEGORISED) === active)
    : recipes;

  renderTabs(categories, active, recipes);

  if (shown.length === 0) {
    listBox.innerHTML = `<p class="error">Nothing in "${active}" yet.</p>`;
    return;
  }

  listBox.innerHTML = shown.map(r => `
    <a class="card" href="recipe.html?r=${r.slug}">
      <h2>${r.title}</h2>
      <p class="meta">${r.category || UNCATEGORISED} &middot; ${r.time} &middot; ${r.serves}</p>
      <p class="blurb">${r.blurb}</p>
    </a>
  `).join("");
}

function renderTabs(categories, active, recipes) {
  const tabBox = document.getElementById("tabs");
  if (!tabBox) return;

  // Only worth showing tabs once there's more than one category.
  if (categories.length < 2) return;

  const count = cat => recipes.filter(r => (r.category || UNCATEGORISED) === cat).length;

  const tab = (label, href, isActive, n) =>
    `<a class="tab${isActive ? " tab-active" : ""}" href="${href}">${label} <span class="tab-count">${n}</span></a>`;

  tabBox.innerHTML =
    tab("All", "index.html", !active, recipes.length) +
    categories.map(c => tab(c, `index.html?c=${encodeURIComponent(c)}`, c === active, count(c))).join("");
}

/* ---------------------------------------------------------
   Single recipe page
   --------------------------------------------------------- */
function renderOne(recipes) {
  const slug = new URLSearchParams(location.search).get("r");
  const r = recipes.find(x => x.slug === slug);

  if (!r) {
    oneBox.innerHTML = `<p class="error">No recipe called "${slug}".
      <a href="index.html">Back to all recipes</a>.</p>`;
    return;
  }

  document.title = `${r.title} — My Recipes`;

  const cat = r.category || UNCATEGORISED;

  oneBox.innerHTML = `
    <article class="recipe">
      <h2>${r.title}</h2>
      <p class="meta">
        <a href="index.html?c=${encodeURIComponent(cat)}">${cat}</a>
        &middot; ${r.time} &middot; ${r.serves}
      </p>

      <h3>Ingredients</h3>
      <ul>${r.ingredients.map(i => `<li>${i}</li>`).join("")}</ul>

      <h3>Method</h3>
      <ol>${r.method.map(s => `<li>${s}</li>`).join("")}</ol>

      <p class="back"><a href="index.html">&larr; All recipes</a></p>
    </article>
  `;
}
