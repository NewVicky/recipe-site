# My Recipes

A personal recipe collection. Static site — no build step, no framework.

## Files

| File | What it does |
|---|---|
| `index.html` | The list of recipes |
| `recipe.html` | Template for a single recipe (`?r=slug`) |
| `app.js` | Loads `recipes.json` and renders whichever page it's on |
| `recipes.json` | All the recipes |
| `style.css` | Styling |

## Adding a recipe

Add an object to `recipes.json`, then:

```bash
git add recipes.json
git commit -m "Add <recipe name>"
git push
```

Live a minute or so later. `slug` must be unique and URL-safe (lowercase, hyphens).

## Running it locally

```bash
python3 -m http.server 8000
```

Then http://localhost:8000 — needs `http://` rather than opening the file
directly, because `app.js` fetches `recipes.json`.

## Note

All paths are relative (`recipes.json`, not `/recipes.json`). GitHub Pages
serves project sites from a subfolder, so leading slashes break there while
still working locally.
