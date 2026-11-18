// Run with: node tests/comms-regression.test.js
// Regression checks for the specific issues raised in DH Communications' November 10 email.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const recipesJs = fs.readFileSync(path.join(root, 'data/recipes.js'), 'utf8');
const ctx = { window: {} };
vm.runInNewContext(recipesJs, ctx);
const recipes = ctx.window.WIC_RECIPES;
const find = title => {
  const result = recipes.find(r => r.title === title);
  assert.ok(result, 'Missing recipe: ' + title);
  return result;
};
const state = {
  foods: new Set(), meal: new Set(), audience: new Set(), avoid: new Set(),
  equipment: new Set(), time: null, quick: false, pantry: '', moreWic: true
};
const logic = app.slice(app.indexOf('function timeLimit()'), app.indexOf('/* GENERATE RECIPES */'));
assert.ok(logic.startsWith('function timeLimit()'), 'Cannot find filtering logic');
const f = new Function('state', logic + '\nreturn {allowed, totalMinutes, pantryMatches};')(state);
function test(name, fn) {
  fn();
  console.log('PASS ' + name);
}
test('No dairy permits peanut butter recipes', () => {
  state.avoid = new Set(['No dairy']);
  for (const title of ['Peanut Butter Banana Toast', 'Apple Peanut Butter Dippers', 'Peanut Butter Cereal Bites']) {
    assert.ok(f.allowed(find(title)), title);
  }
});
test('Vegetarian permits bean soup', () => {
  state.avoid = new Set(['Vegetarian']);
  assert.ok(f.allowed(find('Quick Bean & Vegetable Soup')));
  state.avoid.clear();
});
test('Long-wait recipes excluded from 10-minute and Quick Ideas', () => {
  state.time = '10 minutes or less';
  for (const title of ['Overnight Cereal Cups', 'Yogurt Fruit Pops', '100% Juice Fruit Freeze']) {
    assert.equal(f.allowed(find(title)), false, title);
  }
  state.time = null;
  state.quick = true;
  assert.equal(f.allowed(find('Overnight Cereal Cups')), false);
  state.quick = false;
});
test('Slow cooker soup accounts for cooking time', () => {
  state.equipment.add('Slow cooker');
  assert.ok(f.totalMinutes(find('Quick Bean & Vegetable Soup')) >= 240);
  state.equipment.clear();
});
test('Pantry entries affect recipe matching', () => {
  state.pantry = 'peanut butter, banana';
  assert.ok(f.pantryMatches(find('Peanut Butter Banana Toast')) >= 2);
  state.pantry = '';
});
test('No unrelated peach smoothie when only grains and fish selected', () => {
  state.foods = new Set(['wholegrains', 'fish']);
  assert.equal(recipes.filter(f.allowed).some(r => /peach.*smoothie/i.test(r.title)), false);
  state.foods.clear();
});
test('Snack mix uses fresh fruit, not WIC-tagged dried fruit', () => {
  const mix = find('Fruit & Cereal Snack Mix');
  assert.ok(mix.ingredients.some(i => /fresh fruit/i.test(i[0]) && i[1] === 'fruit'));
  assert.equal(mix.ingredients.some(i => /dried fruit/i.test(i[0]) && i[1] === 'fruit'), false);
});
test('Air-fryer directions exist for both quesadillas', () => {
  for (const title of ['Bean & Cheese Quesadillas', 'Fruit & Yogurt Breakfast Quesadilla']) {
    assert.match(find(title).steps.join(' '), /air fry/i);
  }
});
test('Explore Ideas and Start Over share reset logic', () => {
  assert.match(app, /function reset\(\)\s*\{\s*clearSelections\(\)/);
  assert.match(app, /function exploreIdeas\(\)\s*\{\s*clearSelections\(\)/);
  assert.match(app, /\$\$\('\.choice-card\.selected, \.pill\.selected'\)/);
});
test('No automatic 100% WIC badge', () => {
  assert.doesNotMatch(app, /100% WIC match/i);
  assert.match(app, /state\.foods\.size\s*\?\s*`Matches/);
});
test('Pantry placeholder is visible and no embedded whitespace', () => {
  assert.match(html, /id="pantryInput"[\s\S]*?placeholder="Example:[^"]*"\s*>\s*<\/textarea>/);
});
test('Internal drafts and unverified staff notes are not downloaded', () => {
  assert.doesNotMatch(html, /WIC_CHLOE_DRAFTS|ingredient-list\.js|Needs Review \/ Not Verified/i);
  assert.doesNotMatch(app, /imported rules and ingredient matches still need WIC staff verification/i);
});
test('Every recipe has valid core data and unique ID', () => {
  assert.equal(new Set(recipes.map(r => r.id)).size, recipes.length);
  assert.ok(recipes.every(r => r.ingredients.length && r.steps.length && r.equipment.length));
});
console.log('All DH Communications regression tests passed.');
