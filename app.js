
const WIC_RULE_GROUPS = {
  milk: ['Whole Milk', 'Low/Fat-Free Milk', 'Dry/Evaporated Milk'],
  cheese: ['Cheese'],
  eggs: ['Eggs'],
  yogurt: ['Whole Milk Yogurt', 'Low-Fat Yogurt'],
  cereal: ['Cold Cereal', 'Hot Cereal'],
  wholegrains: [
    'Bread/Whole Grains', 'Tortillas', 'Brown Rice',
    'Quinoa', 'Oats', 'Whole-Grain Pasta', 'Corn Masa/Cornmeal'
  ],
  peanutbutter: ['Peanut Butter'],
  beans: ['Dried Beans/Legumes', 'Canned Beans'],
  fruit: ['Fruit'],
  vegetables: ['Vegetables'],
  fish: ['Fish'],
  juice: ['Juice']
};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const state = {
  step: 1,
  foods: new Set(),
  meal: new Set(),
  audience: new Set(),
  avoid: new Set(),
  time: null,
  equipment: new Set(),
  pantry: '',
  moreWic: true,
  quick: false
};

const labels = {
  1: 'Your WIC Foods',
  2: 'Preferences',
  3: 'Your Kitchen',
  4: 'Recipe Ideas'
};

/* PROFESSIONAL ICONS */

const ICONS = {
  clock: '<i data-lucide="clock" aria-hidden="true"></i>',
  servings: '<i data-lucide="users" aria-hidden="true"></i>',
  cooking: '<i data-lucide="cooking-pot" aria-hidden="true"></i>',
  image: '<i data-lucide="image" aria-hidden="true"></i>',
  check: '<i data-lucide="check" aria-hidden="true"></i>'
};

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/* SAFE HTML OUTPUT */

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

/* RECIPE PHOTOGRAPHY */

function recipeImage(recipe) {
  // Supports an optional image property in recipes.js.
  // Otherwise uses assets/recipes/RECIPE-ID.jpg.
  return recipe.image ||
    `assets/recipes/${encodeURIComponent(recipe.id)}.jpg`;
}

function photoMarkup(recipe, className = 'recipe-photo') {
  const title = escapeHTML(recipe.title);
  const src = escapeHTML(recipeImage(recipe));

  return `
    <div class="recipe-photo-container">
      <div class="recipe-photo-placeholder">
        ${ICONS.image}
        <span>Photo coming soon</span>
      </div>
      <img
        src="${src}"
        alt="${title}"
        class="${className}"
        loading="lazy"
        onerror="this.hidden=true"
        onload="this.previousElementSibling.hidden=true"
      >
    </div>
  `;
}

/* PHOTO AND ICON STYLES */

function addVisualStyles() {
  if (document.getElementById('wic-visual-styles')) return;

  const style = document.createElement('style');
  style.id = 'wic-visual-styles';

  style.textContent = `
    .recipe-photo-container {
      position: relative;
      width: 100%;
      height: 210px;
      overflow: hidden;
      background: #f0f5f4;
      border-radius: 14px;
    }

    .recipe-photo-container .recipe-photo {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      border-radius: inherit;
    }

    .recipe-photo-container .recipe-photo[hidden] {
      display: none;
    }

    .recipe-photo-placeholder {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 10px;
      color: #52777b;
      background: #eaf3f0;
      font-family: Nunito, sans-serif;
      font-weight: 700;
      font-size: 13px;
    }

    .recipe-photo-placeholder[hidden] {
      display: none;
    }

    .recipe-photo-placeholder svg {
      width: 34px;
      height: 34px;
      stroke-width: 1.5;
    }

    .recipe-top {
      position: relative;
    }

    .recipe-top .match-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 2;
      background: rgba(255,255,255,.96);
      border-radius: 30px;
      padding: 7px 12px;
      font-size: 12px;
      font-weight: 800;
      color: #00657F;
    }

    .recipe-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
    }

    .recipe-meta span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .recipe-meta svg {
      width: 16px;
      height: 16px;
      stroke: #00657F;
      stroke-width: 1.8;
      flex-shrink: 0;
    }

    .modal-inner > .recipe-photo-container {
      height: 260px;
      margin-bottom: 20px;
    }

    .food-photo-wrap {
      position: relative;
      display: block;
      overflow: hidden;
    }

    .food-photo {
      width: 100%;
      height: 115px;
      object-fit: cover;
    }

    @media (max-width: 600px) {
      .recipe-photo-container {
        height: 180px;
      }

      .modal-inner > .recipe-photo-container {
        height: 200px;
      }

      .food-photo {
        height: 95px;
      }
    }
  `;

  document.head.appendChild(style);
}

/* WIC SHOPPING GUIDANCE */

function addShoppingRules(recipe) {
  const modal = document.querySelector('#modalContent .modal-inner');
  if (!modal) return;

  const box = document.createElement('section');
  box.className = 'shopping-reference';

  const heading = document.createElement('h3');
  heading.textContent = 'WV WIC shopping guidance';
  box.appendChild(heading);

  const description = document.createElement('p');
  description.textContent =
    'Category guidance only — products, sizes and benefits must be checked against the current approved list. The imported rules and ingredient matches still need WIC staff verification.';

  box.appendChild(description);

  const list = document.createElement('ul');

  const names = [
    ...new Set(
      recipe.wic.flatMap(key => WIC_RULE_GROUPS[key] || [])
    )
  ];

  (window.WIC_SHOPPING_RULES || [])
    .filter(rule => names.includes(rule.WIC_Category))
    .forEach(rule => {
      const li = document.createElement('li');
      const strong = document.createElement('strong');

      strong.textContent = rule.WIC_Category + ': ';
      li.appendChild(strong);

      li.appendChild(document.createTextNode(
        (rule.Approved_Varieties || '') +
        '. Sizes: ' +
        (rule.Package_Size || 'check guide') +
        '. Exclusions: ' +
        (rule.Excluded_Varieties || 'see guide') +
        '.'
      ));

      list.appendChild(li);
    });

  box.appendChild(list);

  const link = document.createElement('a');
  link.href =
    'https://ebtshopper.com/banners/west-virginia-wic-approved-food-list/';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Open WV WIC Approved Food List ↗';

  box.appendChild(link);

  modal.insertBefore(
    box,
    modal.querySelector('.modal-actions')
  );
}

/* BUILD FOOD AND PREFERENCE CARDS */

function build() {
  $('#foodGrid').innerHTML = WIC_FOODS.map(food => `
    <button
      class="choice-card editorial-food-card"
      type="button"
      data-food="${escapeHTML(food.id)}"
      aria-pressed="false"
    >
      <span class="food-photo-wrap">
        <img
          src="assets/${encodeURIComponent(food.id)}.jpg"
          alt=""
          class="food-photo"
          loading="lazy"
          onerror="this.style.display='none'"
        >
        <span
          class="food-selected-check"
          aria-hidden="true"
        >✓</span>
      </span>

      <span class="food-card-details">
        <strong>${escapeHTML(food.name)}</strong>
        <small>${escapeHTML(food.sub)}</small>
      </span>
    </button>
  `).join('');

  makePills('#mealGrid', WIC_OPTIONS.meals, 'meal', true);
  makePills('#audienceGrid', WIC_OPTIONS.audiences, 'audience', true);
  makePills('#avoidGrid', WIC_OPTIONS.avoids, 'avoid', true);
  makePills('#timeGrid', WIC_OPTIONS.times, 'time', false);
  makePills('#equipmentGrid', WIC_OPTIONS.equipment, 'equipment', true);

  refreshIcons();
}

function makePills(selector, items, key, multi) {
  $(selector).innerHTML = items.map(value => `
    <button
      type="button"
      class="pill"
      data-key="${key}"
      data-value="${escapeHTML(value)}"
      data-multi="${multi}"
      aria-pressed="false"
    >${escapeHTML(value)}</button>
  `).join('');
}

/* NAVIGATION */

function showBuilder() {
  $('#hero').classList.add('hidden');
  $('#builder').classList.remove('hidden');
  go(1);
}

function go(number) {
  state.step = number;

  $$('.step').forEach(step => {
    step.classList.toggle(
      'active',
      Number(step.dataset.step) === number
    );
  });

  $('#stepLabel').textContent = `Step ${number} of 4`;
  $('#stepName').textContent = labels[number];
  $('#progressBar').style.width = `${number * 25}%`;

  window.scrollTo({
    top: 60,
    behavior: 'smooth'
  });
}

function reset() {
  state.foods.clear();
  state.meal.clear();
  state.audience.clear();
  state.avoid.clear();
  state.time = null;
  state.equipment.clear();
  state.pantry = '';
  state.moreWic = true;
  state.quick = false;

  $$('.selected').forEach(element => {
    element.classList.remove('selected');
  });

  $$('[aria-pressed="true"]').forEach(element => {
    element.setAttribute('aria-pressed', 'false');
  });

  $('#pantryInput').value = '';

  $('#moreWic').classList.add('active');
  $('#quickOnly').classList.remove('active');

  $('#builder').classList.add('hidden');
  $('#hero').classList.remove('hidden');

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

/* SELECTIONS */

function toggleFood(button) {
  const value = button.dataset.food;

  if (state.foods.has(value)) {
    state.foods.delete(value);
  } else {
    state.foods.add(value);
  }

  button.classList.toggle('selected');

  button.setAttribute(
    'aria-pressed',
    button.classList.contains('selected')
  );
}

function togglePill(button) {
  const key = button.dataset.key;
  const value = button.dataset.value;
  const multi = button.dataset.multi === 'true';

  if (!multi) {
    $$(`[data-key="${key}"]`).forEach(element => {
      element.classList.remove('selected');
      element.setAttribute('aria-pressed', 'false');
    });

    state[key] = value;
    button.classList.add('selected');
    button.setAttribute('aria-pressed', 'true');
    return;
  }

  const selected = state[key];

  if (key === 'avoid' && value === 'No preference') {
    selected.clear();

    $$('[data-key="avoid"]').forEach(element => {
      element.classList.remove('selected');
      element.setAttribute('aria-pressed', 'false');
    });
  } else if (key === 'avoid') {
    selected.delete('No preference');

    const noPreference = $(
      '[data-key="avoid"][data-value="No preference"]'
    );

    if (noPreference) {
      noPreference.classList.remove('selected');
      noPreference.setAttribute('aria-pressed', 'false');
    }
  }

  if (selected.has(value)) {
    selected.delete(value);
  } else {
    selected.add(value);
  }

  button.classList.toggle('selected');

  button.setAttribute(
    'aria-pressed',
    button.classList.contains('selected')
  );
}

/* RECIPE FILTERING */

function timeLimit() {
  if (!state.time) return 999;
  if (state.time.startsWith('10')) return 10;
  if (state.time.startsWith('20')) return 20;
  return 999;
}

function allowed(recipe) {
  const ingredients = recipe.ingredients
    .map(item => String(item[0]).toLowerCase())
    .join(' ');

  if (
    state.meal.size &&
    !recipe.meal.some(value => state.meal.has(value))
  ) return false;

  if (
    state.audience.size &&
    !recipe.audience.some(value => state.audience.has(value))
  ) return false;

  if (
    state.equipment.size &&
    !recipe.equipment.some(value => state.equipment.has(value))
  ) return false;

  if (recipe.time > timeLimit()) return false;
  if (state.quick && recipe.time > 15) return false;

  for (const avoid of state.avoid) {
    if (
      avoid === 'No peanut butter' &&
      (
        recipe.wic.includes('peanutbutter') ||
        /peanut|groundnut/.test(ingredients)
      )
    ) return false;

    if (
      avoid === 'No dairy' &&
      (
        recipe.wic.some(value =>
          ['milk', 'cheese', 'yogurt'].includes(value)
        ) ||
        /milk|cheese|yogurt|butter|cream|whey/.test(ingredients)
      )
    ) return false;

    if (
      avoid === 'No fish' &&
      (
        recipe.wic.includes('fish') ||
        /tuna|salmon|fish|anchov|mackerel/.test(ingredients)
      )
    ) return false;

    if (
      avoid === 'Vegetarian' &&
      (
        recipe.wic.includes('fish') ||
        /chicken|beef|pork|tuna|salmon|fish|broth/.test(ingredients)
      )
    ) return false;
  }

  return true;
}

function score(recipe) {
  const match = recipe.wic.filter(
    value => state.foods.has(value)
  ).length;

  const missing = recipe.wic.filter(
    value => !state.foods.has(value)
  ).length;

  return (
    match * 10 -
    missing * 2 +
    (state.moreWic ? recipe.wic.length : 0) -
    recipe.time / 100
  );
}

/* GENERATE RECIPES */

function generate() {
  state.pantry = $('#pantryInput').value.trim();
  go(4);
  renderRecipes();
}

function renderRecipes(shuffle = false) {
  let recipes = WIC_RECIPES
    .filter(allowed)
    .map(recipe => ({
      ...recipe,
      _score: score(recipe),
      _match: recipe.wic.filter(
        value => state.foods.has(value)
      ).length
    }));

  if (state.foods.size) {
    recipes = recipes.filter(recipe => recipe._match > 0);
  }

  recipes.sort((a, b) => b._score - a._score);

  if (shuffle) {
    for (let i = recipes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [recipes[i], recipes[j]] = [recipes[j], recipes[i]];
    }
  }

  recipes = recipes.slice(0, 12);

  $('#recipeGrid').innerHTML = recipes.map(card).join('');

  $('#emptyState').classList.toggle(
    'hidden',
    recipes.length > 0
  );

  const selected = [...state.foods]
    .map(id => WIC_FOODS.find(food => food.id === id)?.name)
    .filter(Boolean);

  $('#resultSummary').textContent = selected.length
    ? `Using your selections: ${selected.join(', ')}.`
    : 'Showing flexible WIC-friendly ideas. Choose foods to personalize your matches.';

  refreshIcons();
}

/* RECIPE CARDS WITH REAL PHOTOGRAPHY */

function card(recipe) {
  const tags = recipe.wic.map(id => {
    const name = WIC_FOODS.find(food => food.id === id)?.name || id;

    return `<span class="wic-tag">${escapeHTML(name)}</span>`;
  }).join('');

  const percent = state.foods.size
    ? Math.round(recipe._match / recipe.wic.length * 100)
    : 100;

  return `
    <article class="recipe-card">

      <div class="recipe-top">
        ${photoMarkup(recipe)}

        <span class="match-badge">
          ${percent}% WIC match
        </span>
      </div>

      <div class="recipe-body">

        <h3>${escapeHTML(recipe.title)}</h3>

        <p class="recipe-desc">
          ${escapeHTML(recipe.desc)}
        </p>

        <div class="recipe-meta">

          <span>
            ${ICONS.clock}
            ${recipe.time} min
          </span>

          <span>
            ${ICONS.servings}
            ${recipe.servings} servings
          </span>

        </div>

        <div class="wic-used">
          ${tags}
        </div>

        <button
          class="button secondary view-recipe"
          data-id="${escapeHTML(recipe.id)}"
          type="button">
          View recipe
        </button>

      </div>

    </article>
  `;
}

/* FULL RECIPE MODAL */

function openRecipe(id) {
  const recipe = WIC_RECIPES.find(item => item.id === id);
  if (!recipe) return;

  const foodName = id =>
    WIC_FOODS.find(food => food.id === id)?.name || id;

  const ingredients = recipe.ingredients.map(([item, wic]) => `
    <li class="${wic ? 'wic-ingredient' : ''}">
      ${escapeHTML(item)}
      ${wic
        ? `<small>— WIC: ${escapeHTML(foodName(wic))}</small>`
        : ''}
    </li>
  `).join('');

  const directions = recipe.steps.map(step =>
    `<li>${escapeHTML(step)}</li>`
  ).join('');

  const tags = recipe.wic.map(id => `
    <span class="wic-tag">
      ${ICONS.check}
      ${escapeHTML(foodName(id))}
    </span>
  `).join('');

  $('#modalContent').innerHTML = `
    <div class="modal-inner">

      ${photoMarkup(recipe)}

      <span class="eyebrow">
        USES ${recipe.wic.length} WIC FOOD
        ${recipe.wic.length === 1 ? 'GROUP' : 'GROUPS'}
      </span>

      <h2>${escapeHTML(recipe.title)}</h2>

      <p>${escapeHTML(recipe.desc)}</p>

      <div class="recipe-meta">

        <span>
          ${ICONS.clock}
          ${recipe.time} minutes
        </span>

        <span>
          ${ICONS.servings}
          ${recipe.servings} servings
        </span>

        <span>
          ${ICONS.cooking}
          ${escapeHTML(recipe.equipment.join(' / '))}
        </span>

      </div>

      <h3>Ingredients</h3>

      <ul class="ingredient-list">
        ${ingredients}
      </ul>

      <h3>Directions</h3>

      <ol class="direction-list">
        ${directions}
      </ol>

      <div class="wic-used">
        ${tags}
      </div>

      <p class="microcopy">
        <strong>Shopping note:</strong>
        Choose products allowed by your current WV WIC benefits
        and Approved Product List. Your benefit package may not
        include every food shown.
      </p>

      <div class="modal-actions">

        <button
          class="button primary"
          type="button"
          onclick="window.print()">
          Print recipe
        </button>

        <button
          class="button ghost copy-recipe"
          data-id="${escapeHTML(recipe.id)}"
          type="button">
          Copy recipe
        </button>

      </div>

    </div>
  `;

  addShoppingRules(recipe);
  refreshIcons();

  $('#recipeModal').showModal();
}

/* COPY RECIPE */

function copyRecipe(id) {
  const recipe = WIC_RECIPES.find(item => item.id === id);
  if (!recipe) return;

  const text = `
${recipe.title}

Ingredients:
${recipe.ingredients.map(item => '• ' + item[0]).join('\n')}

Directions:
${recipe.steps.map((step, index) =>
  `${index + 1}. ${step}`
).join('\n')}
  `.trim();

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => alert('Recipe copied!'))
      .catch(() => alert('Unable to copy recipe.'));
  }
}

/* BUTTON EVENTS */

document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;

  if (button.dataset.go) {
    showBuilder();
  }

  if (button.id === 'surpriseBtn') {
    state.foods = new Set(WIC_FOODS.map(food => food.id));
    showBuilder();
    go(4);
    renderRecipes(true);
  }

  if (button.matches('.choice-card')) {
    toggleFood(button);
  }

  if (button.matches('.pill')) {
    togglePill(button);
  }

  if (button.matches('.next')) {
    go(state.step + 1);
  }

  if (button.matches('.back')) {
    go(state.step - 1);
  }

  if (button.id === 'generateBtn') {
    generate();
  }

  if (button.matches('.view-recipe')) {
    openRecipe(button.dataset.id);
  }

  if (button.matches('.modal-close')) {
    $('#recipeModal').close();
  }

  if (button.matches('.copy-recipe')) {
    copyRecipe(button.dataset.id);
  }

  if (['restartTop', 'restartBottom'].includes(button.id)) {
    reset();
  }

  if (['editChoices', 'emptyEdit'].includes(button.id)) {
    go(1);
  }

  if (button.id === 'moreWic') {
    state.moreWic = !state.moreWic;
    button.classList.toggle('active', state.moreWic);
    renderRecipes();
  }

  if (button.id === 'quickOnly') {
    state.quick = !state.quick;
    button.classList.toggle('active', state.quick);
    renderRecipes();
  }

  if (button.id === 'shuffleResults') {
    renderRecipes(true);
  }
});

/* CLOSE MODAL */

$('#recipeModal').addEventListener('click', event => {
  if (event.target === $('#recipeModal')) {
    $('#recipeModal').close();
  }
});

/* INITIALIZE */

addVisualStyles();
build();
refreshIcons();
