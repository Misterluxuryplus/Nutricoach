"use strict";

/*
  Repas spéciaux de MyCoachNutri : raclette, fast-food, restaurant, apéro…
  On choisit un repas (ou on le compose), on règle les quantités, et les calories sont calculées.
  Les valeurs sont des estimations moyennes (à ±20 %) : les restaurants et les marques varient beaucoup.

  Ce fichier se charge APRÈS plan.js (il réutilise ses fonctions d'arrondi) et AVANT app.js.
  Les noms commencent par "special" / "SPECIAL" pour éviter tout conflit.
*/

const SPECIAL_CATEGORIES = [
  { key: "montagne", label: "Raclette, fondue, tartiflette" },
  { key: "fastfood", label: "Fast-food" },
  { key: "snacking", label: "Pizza, kebab, tacos" },
  { key: "japonais", label: "Sushi, ramen" },
  { key: "resto", label: "Restaurant" },
  { key: "apero", label: "Apéro et boissons" },
  { key: "dessert", label: "Desserts et viennoiseries" }
];

/*
  Aliments par unité. n = nom, u = unité, k = kcal par unité, c = catégorie,
  v = [protéines g, glucides g, dont sucres g, lipides g, dont saturés g, fibres g, sel g, calcium mg, fer mg, vitamine C mg]
  (même ordre que PLAN_NUTRIENT_KEYS dans plan.js).
*/
const SPECIAL_ITEMS = {
  // Raclette, fondue, tartiflette
  raclette: { n: "Fromage à raclette", u: "tranche (30 g)", k: 100, c: "montagne", v: [7, 0, 0, 8, 5, 0, 0.5, 200, 0.1, 0] },
  charcut: { n: "Charcuterie (jambon cru, coppa…)", u: "tranche", k: 40, c: "montagne", v: [4, 0, 0, 2.5, 1, 0, 0.5, 3, 0.3, 0] },
  pdt100: { n: "Pommes de terre", u: "100 g", k: 85, c: "montagne", v: [2, 18, 1, 0.1, 0, 2, 0, 8, 0.8, 13] },
  fondue: { n: "Fondue au fromage", u: "100 g", k: 330, c: "montagne", v: [20, 2, 1, 27, 17, 0, 1.2, 600, 0.3, 0] },
  painTr: { n: "Pain", u: "tranche (30 g)", k: 75, c: "montagne", v: [2.5, 14, 1, 0.6, 0.1, 1, 0.35, 10, 0.7, 0] },
  tartif: { n: "Tartiflette", u: "100 g", k: 190, c: "montagne", v: [8, 12, 1, 12, 6.5, 1, 1, 110, 0.6, 5] },
  saladeV: { n: "Salade verte", u: "portion", k: 15, c: "montagne", v: [1, 2, 1, 0.2, 0, 1.2, 0.02, 35, 0.9, 8] },
  // Fast-food
  hamb: { n: "Hamburger", u: "1", k: 250, c: "fastfood", v: [12, 30, 6, 9, 3.5, 1.5, 1.3, 120, 2, 1] },
  cheese: { n: "Cheeseburger", u: "1", k: 300, c: "fastfood", v: [15, 33, 7, 12, 6, 2, 1.7, 200, 2.2, 1] },
  bigb: { n: "Burger double (type « Big »)", u: "1", k: 550, c: "fastfood", v: [28, 45, 9, 28, 10, 3, 2.5, 250, 4, 2] },
  burgP: { n: "Burger poulet pané", u: "1", k: 480, c: "fastfood", v: [22, 48, 6, 22, 3.5, 3, 2.2, 100, 2, 2] },
  nugget: { n: "Nuggets", u: "pièce", k: 50, c: "fastfood", v: [3, 3, 0, 3, 0.5, 0.2, 0.2, 5, 0.2, 0] },
  frites50: { n: "Frites", u: "50 g", k: 160, c: "fastfood", v: [2, 20, 0.3, 8, 0.8, 2, 0.15, 8, 0.6, 6] },
  wrap: { n: "Wrap ou sandwich au poulet", u: "1", k: 500, c: "fastfood", v: [24, 55, 5, 20, 5, 3, 2.3, 100, 2.5, 3] },
  sandJB: { n: "Sandwich jambon-beurre", u: "1", k: 450, c: "fastfood", v: [17, 50, 3, 18, 9, 3, 2.5, 80, 2, 0] },
  salCompo: { n: "Salade composée (poulet, fromage…)", u: "1", k: 350, c: "fastfood", v: [22, 15, 6, 22, 7, 4, 1.8, 200, 2, 25] },
  soda: { n: "Soda", u: "canette (33 cl)", k: 140, c: "fastfood", v: [0, 35, 35, 0, 0, 0, 0, 5, 0, 0] },
  milkshake: { n: "Milkshake", u: "1", k: 430, c: "fastfood", v: [10, 65, 60, 14, 9, 0, 0.4, 300, 0.3, 2] },
  // Pizza, kebab, tacos
  pizza4: { n: "Pizza margherita", u: "1/4 de pizza", k: 220, c: "snacking", v: [9, 27, 3, 8, 3.8, 1.5, 1, 150, 1.3, 2] },
  pizzaF: { n: "Pizza 4 fromages ou chorizo", u: "1/4 de pizza", k: 300, c: "snacking", v: [13, 28, 3, 15, 8, 1.5, 1.4, 280, 1.4, 2] },
  kebab: { n: "Kebab (sandwich)", u: "1", k: 750, c: "snacking", v: [35, 70, 8, 35, 13, 5, 3.2, 150, 4, 8] },
  tacos: { n: "Tacos (taille M)", u: "1", k: 900, c: "snacking", v: [40, 80, 6, 45, 18, 5, 4, 400, 4, 5] },
  // Sushi, ramen
  maki: { n: "Maki", u: "pièce", k: 40, c: "japonais", v: [1.5, 7, 1, 0.6, 0.1, 0.3, 0.15, 5, 0.2, 0] },
  nigiri: { n: "Sushi nigiri", u: "pièce", k: 55, c: "japonais", v: [3, 8, 1, 1, 0.2, 0.2, 0.2, 5, 0.3, 0] },
  sashimi: { n: "Sashimi", u: "pièce", k: 35, c: "japonais", v: [6, 0, 0, 1.2, 0.3, 0, 0.1, 5, 0.2, 0] },
  ramen: { n: "Bol de ramen", u: "1", k: 550, c: "japonais", v: [25, 70, 4, 18, 6, 3, 5, 70, 3, 5] },
  // Restaurant
  entreeR: { n: "Entrée (salade, terrine…)", u: "1", k: 350, c: "resto", v: [10, 20, 4, 25, 8, 2, 1.5, 100, 1.5, 10] },
  platP: { n: "Plat de pâtes (carbonara, bolognaise…)", u: "assiette", k: 800, c: "resto", v: [30, 95, 8, 30, 13, 5, 3, 200, 3, 6] },
  platV: { n: "Viande ou poisson avec accompagnement", u: "assiette", k: 700, c: "resto", v: [40, 45, 4, 35, 12, 5, 2.5, 100, 3.5, 10] },
  steakF: { n: "Steak-frites", u: "assiette", k: 800, c: "resto", v: [40, 60, 2, 40, 14, 5, 2, 40, 4, 10] },
  couscous: { n: "Couscous", u: "assiette", k: 850, c: "resto", v: [45, 100, 10, 28, 8, 12, 3, 120, 5, 15] },
  dessertR: { n: "Dessert de restaurant", u: "1", k: 400, c: "resto", v: [5, 45, 30, 22, 12, 1, 0.4, 100, 1, 2] },
  // Apéro et boissons
  chips: { n: "Chips", u: "30 g", k: 160, c: "apero", v: [2, 15, 0.4, 10, 1, 1.2, 0.5, 6, 0.6, 4] },
  cacah: { n: "Cacahuètes salées", u: "30 g", k: 180, c: "apero", v: [7.5, 3, 1, 15, 2.5, 2.5, 0.4, 20, 0.8, 0] },
  saucisson: { n: "Saucisson", u: "tranche", k: 35, c: "apero", v: [2, 0, 0, 3, 1.2, 0, 0.3, 3, 0.2, 0] },
  fromageD: { n: "Fromage à pâte dure (comté, cantal, emmental…)", u: "portion (30 g)", k: 120, c: "apero", v: [8.5, 0.2, 0.2, 9.6, 6.3, 0, 0.5, 330, 0.1, 0] },
  biere: { n: "Bière", u: "verre (25 cl)", k: 105, c: "apero", v: [0.8, 8, 0, 0, 0, 0, 0, 5, 0, 0], alcohol: true },
  vin: { n: "Vin", u: "verre (12 cl)", k: 85, c: "apero", v: [0, 1, 0.5, 0, 0, 0, 0, 8, 0.4, 0], alcohol: true },
  cocktail: { n: "Cocktail", u: "verre", k: 200, c: "apero", v: [0, 20, 18, 0, 0, 0, 0.02, 10, 0.1, 10], alcohol: true },
  // Desserts et viennoiseries
  glace: { n: "Glace", u: "boule", k: 70, c: "dessert", v: [1.2, 8, 7.5, 3.5, 2.2, 0, 0.05, 50, 0.1, 0] },
  crepe: { n: "Crêpe sucrée", u: "1", k: 150, c: "dessert", v: [4, 22, 8, 5, 2, 0.6, 0.3, 70, 0.6, 0] },
  gaufre: { n: "Gaufre", u: "1", k: 330, c: "dessert", v: [5, 45, 18, 14, 7, 1, 0.4, 60, 1, 0] },
  gateau: { n: "Part de gâteau", u: "1", k: 400, c: "dessert", v: [5, 45, 30, 22, 12, 1, 0.4, 60, 1, 0] },
  choco: { n: "Chocolat", u: "carré (10 g)", k: 55, c: "dessert", v: [0.7, 3.5, 3, 3.5, 2, 0.5, 0, 10, 0.5, 0] },
  croiss: { n: "Croissant", u: "1", k: 230, c: "dessert", v: [5, 26, 6, 12, 7, 1.5, 0.5, 30, 1, 0] },
  painCh: { n: "Pain au chocolat", u: "1", k: 280, c: "dessert", v: [5, 31, 10, 15, 9, 2, 0.5, 40, 1.5, 0] }
};

// Repas déjà composés : on les choisit, puis on ajuste les quantités.
const SPECIAL_PRESETS = [
  { key: "raclette", label: "🧀 Raclette", items: { raclette: 5, charcut: 4, pdt100: 3, saladeV: 1 } },
  { key: "fondue", label: "🫕 Fondue savoyarde", items: { fondue: 2, painTr: 5, vin: 1 } },
  { key: "tartiflette", label: "🥔 Tartiflette", items: { tartif: 4, saladeV: 1 } },
  { key: "burger", label: "🍔 Menu burger", items: { bigb: 1, frites50: 2, soda: 1 } },
  { key: "nuggets", label: "🍗 Menu nuggets", items: { nugget: 6, frites50: 2, soda: 1 } },
  { key: "pizza", label: "🍕 Pizza", items: { pizza4: 4 } },
  { key: "kebab", label: "🥙 Kebab et frites", items: { kebab: 1, frites50: 2, soda: 1 } },
  { key: "tacos", label: "🌮 Tacos", items: { tacos: 1, soda: 1 } },
  { key: "sushi", label: "🍣 Sushi (12 pièces)", items: { maki: 6, nigiri: 6 } },
  { key: "ramen", label: "🍜 Ramen", items: { ramen: 1 } },
  { key: "resto", label: "🍽️ Restaurant (entrée, plat, dessert)", items: { entreeR: 1, platV: 1, dessertR: 1 } },
  { key: "apero", label: "🥂 Apéro", items: { chips: 2, cacah: 1, saucisson: 4, biere: 2 } },
  { key: "crepes", label: "🥞 Crêpes", items: { crepe: 3 } },
  { key: "viennoiseries", label: "🥐 Viennoiseries", items: { croiss: 2 } }
];

const SPECIAL_SLOTS = [
  { value: "pleasure", label: "Un extra (en plus du plan)" },
  { value: "breakfast", label: "Le petit-déjeuner" },
  { value: "lunch", label: "Le déjeuner" },
  { value: "dinner", label: "Le dîner" },
  { value: "snack", label: "La collation" }
];

/* ------------------------------------------------------------------ */
/* Calcul (fonctions pures)                                            */
/* ------------------------------------------------------------------ */

// quantities = { idAliment: nombre d'unités }. Retourne calories, apports et texte des quantités.
function specialCompute(quantities) {
  let kcal = 0;
  const total = {};
  const parts = [];
  PLAN_NUTRIENT_KEYS.forEach((key) => { total[key] = 0; });

  Object.entries(quantities).forEach(([id, rawQty]) => {
    const item = SPECIAL_ITEMS[id];
    const qty = Number(rawQty);
    if (!item || !Number.isFinite(qty) || qty <= 0) return;
    kcal += item.k * qty;
    PLAN_NUTRIENT_KEYS.forEach((key, index) => { total[key] += item.v[index] * qty; });
    parts.push(`${qty.toLocaleString("fr-FR")} × ${item.n.toLowerCase()}`);
  });

  return { kcal: Math.round(kcal), nut: planRoundNutrition(total), parts: parts.join(", ") };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { SPECIAL_ITEMS, SPECIAL_PRESETS, SPECIAL_CATEGORIES, SPECIAL_SLOTS, specialCompute };
}

/* ------------------------------------------------------------------ */
/* Interface                                                           */
/* ------------------------------------------------------------------ */

const specialUi = { name: "", quantities: {}, slot: null };

// Moment proposé par défaut : les repas salés se prennent le midi ou le soir, les sucreries le matin ou l'après-midi.
function specialDefaultSlot(presetKey) {
  const hour = new Date().getHours();
  if (presetKey === "crepes" || presetKey === "viennoiseries") {
    if (hour < 11) return "breakfast";
    return hour < 19 ? "snack" : "dinner";
  }
  if (presetKey && presetKey !== "custom") return hour >= 10 && hour < 15 ? "lunch" : "dinner";
  if (hour < 10) return "breakfast";
  if (hour < 15) return "lunch";
  if (hour < 18) return "snack";
  return "dinner";
}

function bindSpecial() {
  const root = document.querySelector("#special-meal");
  if (!root) return;

  root.querySelector("#special-presets").innerHTML =
    SPECIAL_PRESETS.map((preset) => `<button type="button" class="plan-chip" data-special-preset="${preset.key}">${escapeHtml(preset.label)}</button>`).join("") +
    '<button type="button" class="plan-chip" data-special-preset="custom">➕ Autre repas</button>';

  root.querySelector("#special-extra").innerHTML =
    '<option value="">Ajouter un aliment…</option>' +
    SPECIAL_CATEGORIES.map((category) => `
      <optgroup label="${escapeHtml(category.label)}">
        ${Object.entries(SPECIAL_ITEMS)
          .filter(([, item]) => item.c === category.key)
          .map(([id, item]) => `<option value="${id}">${escapeHtml(item.n)} (${escapeHtml(item.u)})</option>`)
          .join("")}
      </optgroup>`).join("");

  root.querySelector("#special-slot").innerHTML = SPECIAL_SLOTS
    .map((slot) => `<option value="${slot.value}">${escapeHtml(slot.label)}</option>`)
    .join("");

  root.addEventListener("click", (event) => {
    const preset = event.target.closest("[data-special-preset]");
    if (preset) return specialChoosePreset(preset.dataset.specialPreset);

    const step = event.target.closest("[data-special-step]");
    if (step) {
      const [id, delta] = step.dataset.specialStep.split(":");
      specialSetQuantity(id, (Number(specialUi.quantities[id]) || 0) + Number(delta));
      return specialRender();
    }

    const remove = event.target.closest("[data-special-remove]");
    if (remove) {
      delete specialUi.quantities[remove.dataset.specialRemove];
      return specialRender();
    }
    return undefined;
  });

  root.addEventListener("input", (event) => {
    const input = event.target.closest("[data-special-qty]");
    if (input) {
      specialSetQuantity(input.dataset.specialQty, Number(input.value));
      specialRenderTotal();
    } else if (event.target.id === "special-manual") {
      specialRenderTotal();
    }
  });

  root.querySelector("#special-extra").addEventListener("change", (event) => {
    const id = event.target.value;
    if (!id) return;
    specialSetQuantity(id, (Number(specialUi.quantities[id]) || 0) + 1);
    event.target.value = "";
    specialRender();
  });

  root.querySelector("#special-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const later = event.submitter && event.submitter.dataset.specialMode === "later";
    specialAddToDay(later ? "later" : "now");
  });
}

function specialSetQuantity(id, value) {
  if (!SPECIAL_ITEMS[id]) return;
  const qty = Math.max(0, Math.round(value * 2) / 2);
  if (qty > 0) specialUi.quantities[id] = Math.min(qty, 99);
  else delete specialUi.quantities[id];
}

function specialChoosePreset(key) {
  const form = document.querySelector("#special-form");
  const preset = SPECIAL_PRESETS.find((entry) => entry.key === key);
  specialUi.name = preset ? preset.label.replace(/^\S+\s/, "") : "Repas spécial";
  specialUi.quantities = preset ? { ...preset.items } : {};
  document.querySelector("#special-manual").value = "";
  document.querySelector("#special-slot").value = specialUi.slot || specialDefaultSlot(key);
  document.querySelector("#special-later").hidden = !(state.nutritionPlan && state.nutritionPlan.plan);
  document.querySelector("#special-status").textContent = "";
  form.hidden = false;
  specialRender();
  form.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function specialRender() {
  document.querySelector("#special-name").textContent = specialUi.name;
  const entries = Object.entries(specialUi.quantities);
  document.querySelector("#special-items").innerHTML = entries.length
    ? entries.map(([id, qty]) => {
        const item = SPECIAL_ITEMS[id];
        return `
        <li class="special-row">
          <div class="special-row-name">
            <strong>${escapeHtml(item.n)}</strong>
            <small>${escapeHtml(item.u)} · ${item.k} kcal</small>
          </div>
          <div class="special-stepper">
            <button type="button" data-special-step="${id}:-1" aria-label="Retirer une unité de ${escapeHtml(item.n)}">−</button>
            <input type="number" data-special-qty="${id}" min="0" max="99" step="0.5" inputmode="decimal" value="${qty}" aria-label="Quantité de ${escapeHtml(item.n)}" />
            <button type="button" data-special-step="${id}:1" aria-label="Ajouter une unité de ${escapeHtml(item.n)}">+</button>
          </div>
          <button type="button" class="special-remove" data-special-remove="${id}" aria-label="Enlever ${escapeHtml(item.n)}">✕</button>
        </li>`;
      }).join("")
    : '<li class="helper-text">Aucun aliment : ajoutez-en un ci-dessous, ou indiquez directement les calories.</li>';
  specialRenderTotal();
}

function specialRenderTotal() {
  const manual = Number(document.querySelector("#special-manual").value);
  const useManual = Number.isFinite(manual) && manual > 0;
  const result = specialCompute(specialUi.quantities);
  const total = document.querySelector("#special-total");
  total.innerHTML = useManual
    ? `<strong>${Math.round(manual).toLocaleString("fr-FR")} kcal</strong> <small>(calories que vous avez indiquées)</small>`
    : `<strong>${result.kcal.toLocaleString("fr-FR")} kcal</strong> <small>estimation à ±20 %</small>`;
}

// mode "now" : repas déjà mangé. mode "later" : repas prévu aujourd'hui, le reste de la journée s'allège.
function specialAddToDay(mode) {
  const manual = Number(document.querySelector("#special-manual").value);
  const useManual = Number.isFinite(manual) && manual > 0;
  const result = specialCompute(specialUi.quantities);
  const calories = Math.round(useManual ? manual : result.kcal);
  const status = document.querySelector("#special-status");

  if (!calories) {
    status.textContent = "Ajoutez au moins un aliment, ou indiquez les calories du repas.";
    return;
  }

  const slot = document.querySelector("#special-slot").value;
  const detail = useManual || !result.parts ? "" : ` : ${result.parts}`;
  const entry = {
    id: createId(),
    mealType: slot,
    description: `${specialUi.name}${detail}`.slice(0, 220),
    calories,
    source: "special",
    estimateDetails: useManual ? "Calories indiquées par vous." : "Repas spécial : estimation à ±20 %.",
    usedAveragePortion: !useManual,
    recognitionWarning: useManual ? "" : "Estimation approximative (±20 %).",
    nutrients: useManual ? undefined : result.nut,
    createdAt: new Date().toISOString()
  };

  let message = `✓ Ajouté à votre journée : ${calories.toLocaleString("fr-FR")} kcal.`;
  if (mode === "later" && state.nutritionPlan && state.nutritionPlan.plan) {
    state.reserved = [...(state.reserved || []), { ...entry, dayKey: getTodayKey(), name: specialUi.name }];
    const plan = state.nutritionPlan.plan;
    const adjustment = planAdjustDay(plan, planDayIndexFor(plan, getTodayKey()), state.meals, planReservedToday(), planSkippedToday());
    message = `📅 Prévu aujourd'hui : ${specialUi.name} (≈ ${calories.toLocaleString("fr-FR")} kcal).` +
      (adjustment.status === "lighter"
        ? ` J'ai allégé le reste de la journée d'environ ${Math.abs(adjustment.deltaKcal).toLocaleString("fr-FR")} kcal : vous en profiterez sans vous priver.`
        : " Pas besoin de vous priver : c'est déjà prévu dans votre journée.");
  } else {
    state.meals.unshift(entry);
  }

  saveState();
  render();
  document.querySelector("#special-form").hidden = true;
  specialUi.quantities = {};
  specialUi.slot = null;
  document.querySelector("#special-manual").value = "";
  status.textContent = message;
}
