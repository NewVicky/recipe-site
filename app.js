/* Shared by index.html and recipe.html.
   Whichever container exists on the page decides what gets drawn. */

const listBox = document.getElementById("recipe-list");
const oneBox  = document.getElementById("recipe");

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

function renderList(recipes) {
  listBox.innerHTML = recipes.map(r => `
    <a class="card" href="recipe.html?r=${r.slug}">
      <h2>${r.title}</h2>
      <p class="meta">${r.time} &middot; ${r.serves}</p>
      <p class="blurb">${r.blurb}</p>
    </a>
  `).join("");
}

function renderOne(recipes) {
  const slug = new URLSearchParams(location.search).get("r");
  const r = recipes.find(x => x.slug === slug);

  if (!r) {
    oneBox.innerHTML = `<p class="error">No recipe called "${slug}".
      <a href="index.html">Back to all recipes</a>.</p>`;
    return;
  }

  document.title = `${r.title} — My Recipes`;

  oneBox.innerHTML = `
    <article class="recipe">
      <h2>${r.title}</h2>
      <p class="meta">${r.time} &middot; ${r.serves}</p>

      <h3>Ingredients</h3>
      <ul>${r.ingredients.map(i => `<li>${i}</li>`).join("")}</ul>

      <h3>Method</h3>
      <ol>${r.method.map(s => `<li>${s}</li>`).join("")}</ol>

      <p class="back"><a href="index.html">&larr; All recipes</a></p>
    </article>
  `;
}
