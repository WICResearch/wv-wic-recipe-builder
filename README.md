# WV WIC Meal & Recipe Builder

A mobile-first static GitHub Pages tool that helps participants turn WIC food groups into simple recipe ideas.

## Upload to GitHub
Upload the entire contents of this folder to the root of your GitHub Pages repository, keeping the `assets` and `data` folders intact.

Required structure:
- index.html
- styles.css
- app.js
- data/foods.js
- data/recipes.js
- assets/...

Then enable GitHub Pages under **Settings → Pages → Deploy from a branch → main / root**.

## Branding
The CSS variables at the top of `styles.css` control the palette. Current values are sampled from the provided WV WIC campaign assets:
- Deep teal: `#005671`
- WIC magenta: `#B62373`
- Green: `#009858`
- Mint: `#5AC09B`
- Dark green: `#24654F`
- Aqua: `#00A8C9`
- Orange: `#FFA500`
- Purple: `#7650A1`

## APL logic
`data/foods.js` maps participant-friendly food groups to the category sheets in the supplied WV WIC product workbook. The recipe engine does **not** independently declare a retail product WIC-approved. It tells participants to select products allowed by their current benefits and the current WV WIC APL.

Workbook categories used:
- 02 Cheese
- 03 Eggs
- 05 Breakfast Cereal
- 06 Legumes
- 08 Fish
- 16 BreadsWhole Grains
- 19 Fruits and Vegs
- 50 Yogurt
- 51 Milk Whole
- 52 Milk Low fat
- 54 Juice 64

## Editing recipes
Each recipe in `data/recipes.js` has:
- `wic`: WIC food-group IDs used for matching
- `meal`: breakfast/lunch/dinner/snack tags
- `audience`: household tags
- `time`: minutes
- `equipment`: supported equipment
- `ingredients`: ingredient + optional WIC food-group ID
- `steps`: directions

Add or remove recipes without changing `app.js`.

## Important before public launch
1. Have WV WIC nutrition/program staff review recipe wording and food-safety language.
2. Confirm the exact approved brand palette/usage rules for the supplied campaign assets.
3. Decide whether to add analytics. This version intentionally collects no participant data and sends nothing to a server.
4. Keep `data/foods.js` aligned with future APL/category changes.
5. Consider adding Spanish-language content in a later release.
