
const WIC_RULE_GROUPS={
milk:['Whole Milk','Low/Fat-Free Milk','Dry/Evaporated Milk'],
cheese:['Cheese'],eggs:['Eggs'],yogurt:['Whole Milk Yogurt','Low-Fat Yogurt'],
cereal:['Cold Cereal','Hot Cereal'],wholegrains:['Bread/Whole Grains','Tortillas','Brown Rice','Quinoa','Oats','Whole-Grain Pasta','Corn Masa/Cornmeal'],
peanutbutter:['Peanut Butter'],beans:['Dried Beans/Legumes','Canned Beans'],
fruit:['Fruit'],vegetables:['Vegetables'],fish:['Fish'],juice:['Juice']
};
function addShoppingRules(recipe){
 const modal=document.querySelector('#modalContent .modal-inner');
 if(!modal)return;
 const box=document.createElement('section');
 box.className='shopping-reference';
 const h=document.createElement('h3');h.textContent='WV WIC shopping guidance';box.appendChild(h);
 const p=document.createElement('p');
 p.textContent='Category guidance only — products, sizes and benefits must be checked against the current approved list. The imported rules and ingredient matches still need WIC staff verification.';
 box.appendChild(p);
 const list=document.createElement('ul');
 const names=[...new Set(recipe.wic.flatMap(k=>WIC_RULE_GROUPS[k]||[]))];
 (window.WIC_SHOPPING_RULES||[]).filter(x=>names.includes(x.WIC_Category)).forEach(rule=>{
  const li=document.createElement('li');
  const title=document.createElement('strong');title.textContent=rule.WIC_Category+': ';li.appendChild(title);
  li.appendChild(document.createTextNode((rule.Approved_Varieties||'')+'. Sizes: '+(rule.Package_Size||'check guide')+'. Exclusions: '+(rule.Excluded_Varieties||'see guide')+'.'));
  list.appendChild(li);
 });
 box.appendChild(list);
 const link=document.createElement('a');
 link.href='https://ebtshopper.com/banners/west-virginia-wic-approved-food-list/';
 link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open WV WIC Approved Food List ↗';
 box.appendChild(link);
 modal.insertBefore(box,modal.querySelector('.modal-actions'));
}

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={step:1,foods:new Set(),meal:new Set(),audience:new Set(),avoid:new Set(),time:null,equipment:new Set(),pantry:'',moreWic:true,quick:false};
const labels={1:'Your WIC Foods',2:'Preferences',3:'Your Kitchen',4:'Recipe Ideas'};
function build(){

$('#foodGrid').innerHTML = WIC_FOODS.map(f => `
  <button
    class="choice-card editorial-food-card"
    type="button"
    data-food="${f.id}"
    aria-pressed="false"
  >
    <span class="food-photo-wrap">
      <img
        src="assets/foods/${f.id}.jpg"
        alt=""
        class="food-photo"
        loading="lazy"
        onerror="this.style.display='none'"
      >
      <span class="food-selected-check" aria-hidden="true">
        ✓
      </span>
    </span>

    <span class="food-card-details">
      <strong>${f.name}</strong>
      <small>${f.sub}</small>
    </span>
  </button>
`).join('');

 makePills('#mealGrid',WIC_OPTIONS.meals,'meal',true); makePills('#audienceGrid',WIC_OPTIONS.audiences,'audience',true); makePills('#avoidGrid',WIC_OPTIONS.avoids,'avoid',true); makePills('#timeGrid',WIC_OPTIONS.times,'time',false); makePills('#equipmentGrid',WIC_OPTIONS.equipment,'equipment',true);
}
function makePills(sel,items,key,multi){$(sel).innerHTML=items.map(x=>`<button type="button" class="pill" data-key="${key}" data-value="${x}" data-multi="${multi}" aria-pressed="false">${x}</button>`).join('')}
function showBuilder(){ $('#hero').classList.add('hidden'); $('#builder').classList.remove('hidden'); go(1); window.scrollTo({top:60,behavior:'smooth'}); }
function go(n){state.step=n; $$('.step').forEach(x=>x.classList.toggle('active',+x.dataset.step===n)); $('#stepLabel').textContent=`Step ${n} of 4`; $('#stepName').textContent=labels[n]; $('#progressBar').style.width=`${n*25}%`; window.scrollTo({top:60,behavior:'smooth'});}
function reset(){state.foods.clear();state.meal.clear();state.audience.clear();state.avoid.clear();state.time=null;state.equipment.clear();state.pantry='';state.moreWic=true;state.quick=false;$$('.selected').forEach(x=>x.classList.remove('selected'));$$('[aria-pressed="true"]').forEach(x=>x.setAttribute('aria-pressed','false'));$('#pantryInput').value='';$('#builder').classList.add('hidden');$('#hero').classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'});}
function toggleFood(btn){let v=btn.dataset.food;if(state.foods.has(v))state.foods.delete(v);else state.foods.add(v);btn.classList.toggle('selected');btn.setAttribute('aria-pressed',btn.classList.contains('selected'));}
function togglePill(btn){const k=btn.dataset.key,v=btn.dataset.value,multi=btn.dataset.multi==='true';if(!multi){$$(`[data-key="${k}"]`).forEach(x=>{x.classList.remove('selected');x.setAttribute('aria-pressed','false')});state[k]=v;btn.classList.add('selected');btn.setAttribute('aria-pressed','true');return;} const set=state[k];if(k==='avoid'&&v==='No preference'){set.clear();$$(`[data-key="avoid"]`).forEach(x=>{x.classList.remove('selected');x.setAttribute('aria-pressed','false')})}else if(k==='avoid'){set.delete('No preference');$('[data-value="No preference"]')?.classList.remove('selected')}if(set.has(v))set.delete(v);else set.add(v);btn.classList.toggle('selected');btn.setAttribute('aria-pressed',btn.classList.contains('selected'));}
function timeLimit(){if(!state.time)return 999;if(state.time.startsWith('10'))return 10;if(state.time.startsWith('20'))return 20;return 999}
function allowed(r){const txt=r.ingredients.map(x=>String(x[0]).toLowerCase()).join(' ');if(state.meal.size&&!r.meal.some(x=>state.meal.has(x)))return false;if(state.audience.size&&!r.audience.some(x=>state.audience.has(x)))return false;if(state.equipment.size&&!r.equipment.some(x=>state.equipment.has(x)))return false;if(r.time>timeLimit())return false;if(state.quick&&r.time>15)return false;for(const a of state.avoid){if(a==='No peanut butter'&&(r.wic.includes('peanutbutter')||/peanut|groundnut/.test(txt)))return false;if(a==='No dairy'&&(r.wic.includes('milk')||r.wic.includes('cheese')||r.wic.includes('yogurt')||/milk|cheese|yogurt|butter|cream|whey/.test(txt)))return false;if(a==='No fish'&&(r.wic.includes('fish')||/tuna|salmon|fish|anchov|mackerel/.test(txt)))return false;if(a==='Vegetarian'&&(r.wic.includes('fish')||/chicken|beef|pork|tuna|salmon|fish|broth/.test(txt)))return false}return true}
function score(r){const match=r.wic.filter(x=>state.foods.has(x)).length;const missing=r.wic.filter(x=>!state.foods.has(x)).length;return match*10-(missing*2)+(state.moreWic?r.wic.length:0)-r.time/100}
function generate(){state.pantry=$('#pantryInput').value.trim();go(4);renderRecipes()}
function renderRecipes(shuffle=false){let rs=WIC_RECIPES.filter(allowed).map(r=>({...r,_score:score(r),_match:r.wic.filter(x=>state.foods.has(x)).length}));if(state.foods.size)rs=rs.filter(r=>r._match>0);rs.sort((a,b)=>b._score-a._score);if(shuffle){for(let i=rs.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[rs[i],rs[j]]=[rs[j],rs[i]];}}rs=rs.slice(0,12);$('#recipeGrid').innerHTML=rs.map(card).join('');$('#emptyState').classList.toggle('hidden',rs.length>0);const selected=[...state.foods].map(id=>WIC_FOODS.find(f=>f.id===id)?.name).filter(Boolean);$('#resultSummary').textContent=selected.length?`Using your selections: ${selected.join(', ')}.`:'Showing flexible WIC-friendly ideas. Choose foods to personalize your matches.';}
function card(r){const tags=r.wic.map(id=>`<span class="wic-tag">${WIC_FOODS.find(f=>f.id===id)?.name||id}</span>`).join('');const pct=state.foods.size?Math.round(r._match/r.wic.length*100):100;return `<article class="recipe-card"><div class="recipe-top"><span class="recipe-emoji">${r.emoji}</span><span class="match-badge">${pct}% WIC match</span></div><div class="recipe-body"><h3>${r.title}</h3><p class="recipe-desc">${r.desc}</p><div class="recipe-meta"><span>⏱ ${r.time} min</span><span>🍽 ${r.servings} servings</span></div><div class="wic-used">${tags}</div><button class="button secondary view-recipe" data-id="${r.id}" type="button">View recipe</button></div></article>`}
function openRecipe(id){const r=WIC_RECIPES.find(x=>x.id===id);if(!r)return;const foodName=id=>WIC_FOODS.find(f=>f.id===id)?.name||id;$('#modalContent').innerHTML=`<div class="modal-inner"><div class="recipe-emoji">${r.emoji}</div><span class="eyebrow">USES ${r.wic.length} WIC FOOD ${r.wic.length===1?'GROUP':'GROUPS'}</span><h2>${r.title}</h2><p>${r.desc}</p><div class="recipe-meta"><span>⏱ ${r.time} minutes</span><span>🍽 ${r.servings} servings</span><span>🍳 ${r.equipment.join(' / ')}</span></div><h3>Ingredients</h3><ul class="ingredient-list">${r.ingredients.map(([x,w])=>`<li class="${w?'wic-ingredient':''}">${x}${w?` <small>— WIC: ${foodName(w)}</small>`:''}</li>`).join('')}</ul><h3>Directions</h3><ol class="direction-list">${r.steps.map(x=>`<li>${x}</li>`).join('')}</ol><div class="wic-used">${r.wic.map(x=>`<span class="wic-tag">✓ ${foodName(x)}</span>`).join('')}</div><p class="microcopy"><strong>Shopping note:</strong> Choose products allowed by your current WV WIC benefits and Approved Product List. Your benefit package may not include every food shown.</p><div class="modal-actions"><button class="button primary" onclick="window.print()">Print recipe</button><button class="button ghost copy-recipe" data-id="${r.id}">Copy recipe</button></div></div>`;addShoppingRules(r);$('#recipeModal').showModal();}
function copyRecipe(id){const r=WIC_RECIPES.find(x=>x.id===id);const t=`${r.title}\n\nIngredients:\n${r.ingredients.map(x=>'• '+x[0]).join('\n')}\n\nDirections:\n${r.steps.map((x,i)=>`${i+1}. ${x}`).join('\n')}`;navigator.clipboard?.writeText(t).then(()=>alert('Recipe copied!'));}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.go)showBuilder();if(b.id==='surpriseBtn'){state.foods=new Set(WIC_FOODS.map(x=>x.id));showBuilder();go(4);renderRecipes(true)}if(b.matches('.choice-card'))toggleFood(b);if(b.matches('.pill'))togglePill(b);if(b.matches('.next'))go(state.step+1);if(b.matches('.back'))go(state.step-1);if(b.id==='generateBtn')generate();if(b.matches('.view-recipe'))openRecipe(b.dataset.id);if(b.matches('.modal-close'))$('#recipeModal').close();if(b.matches('.copy-recipe'))copyRecipe(b.dataset.id);if(['restartTop','restartBottom'].includes(b.id))reset();if(['editChoices','emptyEdit'].includes(b.id))go(1);if(b.id==='moreWic'){state.moreWic=!state.moreWic;b.classList.toggle('active',state.moreWic);renderRecipes()}if(b.id==='quickOnly'){state.quick=!state.quick;b.classList.toggle('active',state.quick);renderRecipes()}if(b.id==='shuffleResults')renderRecipes(true)});
$('#recipeModal').addEventListener('click',e=>{if(e.target===$('#recipeModal'))$('#recipeModal').close()});build();
