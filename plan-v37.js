"use strict";

/*
  Plan alimentaire personnalisé de MyCoachNutri.

  Ce fichier contient :
  1. la bibliothèque d'aliments et de repas ;
  2. le moteur qui construit un plan sur 7 jours (fonctions pures, sans DOM) ;
  3. l'interface (questionnaire + affichage), appelée depuis app.js.

  Il doit être chargé AVANT app.js (voir index.html).
  Les noms de ce fichier commencent par "plan" / "PLAN" pour éviter tout conflit avec app.js.
*/

const PLAN_DAYS = 7;

const PLAN_SLOT_LABELS = {
  breakfast: "☀️ Petit-déjeuner",
  lunch: "🍽️ Déjeuner",
  dinner: "🌙 Dîner",
  snack: "🍎 Collation"
};

const PLAN_ALLERGEN_LABELS = {
  gluten: "gluten",
  lait: "lait / lactose",
  oeufs: "œufs",
  fruitscoque: "fruits à coque",
  poisson: "poisson",
  crustaces: "crustacés (crevettes)",
  soja: "soja"
};

// Types d'aliments autorisés selon le régime.
const PLAN_DIET_TYPES = {
  omni: null,
  veggie: ["plant", "dairy", "egg"],
  vegan: ["plant"]
};

// Tags de repas à éviter selon les problèmes de santé indiqués.
const PLAN_EXCLUDED_TAGS = {
  trig: ["sugar", "refined", "satfat", "processed"],
  chol: ["satfat", "redmeat", "processed"],
  gly: ["sugar", "refined"],
  tension: ["sodium", "processed"]
};

// Repas "classiques" (moins favorables) : autorisés en petite quantité si aucun problème de santé n'est indiqué.
const PLAN_CLASSIC_TAGS = ["sugar", "refined", "satfat", "processed", "sodium"];

/*
  Aliments. n = nom, k = kcal pour 100 g (poids cuit / prêt à manger),
  t = type (plant, dairy, egg, meat, fish), a = allergènes,
  fixed = quantité non ajustée (huiles, noix, etc.), u = unité "à la pièce".
*/
const PLAN_FOODS = {
  // Féculents
  avoine: { n: "Flocons d'avoine", k: 370, t: "plant", a: ["gluten"] },
  painC: { n: "Pain complet", k: 250, t: "plant", a: ["gluten"] },
  painB: { n: "Pain blanc", k: 265, t: "plant", a: ["gluten"] },
  rizC: { n: "Riz complet cuit", k: 125, t: "plant", a: [] },
  rizB: { n: "Riz basmati cuit", k: 130, t: "plant", a: [] },
  quinoa: { n: "Quinoa cuit", k: 120, t: "plant", a: [] },
  pastaC: { n: "Pâtes complètes cuites", k: 150, t: "plant", a: ["gluten"] },
  pastaB: { n: "Pâtes cuites", k: 150, t: "plant", a: ["gluten"] },
  boulgour: { n: "Boulgour cuit", k: 85, t: "plant", a: ["gluten"] },
  pdt: { n: "Pommes de terre vapeur", k: 85, t: "plant", a: [] },
  patate: { n: "Patate douce", k: 90, t: "plant", a: [] },
  sarrasin: { n: "Sarrasin cuit", k: 95, t: "plant", a: [] },
  // Légumineuses et végétal
  lentilles: { n: "Lentilles cuites", k: 112, t: "plant", a: [] },
  poischiches: { n: "Pois chiches cuits", k: 147, t: "plant", a: [] },
  harRouges: { n: "Haricots rouges cuits", k: 115, t: "plant", a: [] },
  tofu: { n: "Tofu nature", k: 125, t: "plant", a: ["soja"] },
  sojaBoisson: { n: "Boisson au soja enrichie en calcium", k: 40, t: "plant", a: ["soja"], ml: true },
  yaourtSoja: { n: "Yaourt au soja nature enrichi en calcium", k: 45, t: "plant", a: ["soja"] },
  // Légumes
  brocoli: { n: "Brocoli cuit", k: 29, t: "plant", a: [] },
  hv: { n: "Haricots verts", k: 30, t: "plant", a: [] },
  courgette: { n: "Courgettes cuites", k: 17, t: "plant", a: [] },
  carotte: { n: "Carottes", k: 35, t: "plant", a: [] },
  tomate: { n: "Tomates", k: 18, t: "plant", a: [] },
  salade: { n: "Salade verte", k: 14, t: "plant", a: [] },
  epinards: { n: "Épinards cuits", k: 25, t: "plant", a: [] },
  ratatouille: { n: "Ratatouille", k: 55, t: "plant", a: [] },
  champignons: { n: "Champignons", k: 22, t: "plant", a: [] },
  concombre: { n: "Concombre", k: 12, t: "plant", a: [] },
  legumesPoeles: { n: "Légumes poêlés", k: 70, t: "plant", a: [] },
  soupe: { n: "Soupe de légumes maison", k: 35, t: "plant", a: [] },
  sauceTomate: { n: "Sauce tomate", k: 35, t: "plant", a: [] },
  avocat: { n: "Avocat", k: 160, t: "plant", a: [] },
  // Fruits
  pomme: { n: "Pomme", k: 54, t: "plant", a: [], u: { g: 150, one: "pomme", many: "pommes" } },
  banane: { n: "Banane", k: 90, t: "plant", a: [], u: { g: 110, one: "banane", many: "bananes" } },
  orange: { n: "Orange", k: 47, t: "plant", a: [], u: { g: 180, one: "orange", many: "oranges" } },
  kiwi: { n: "Kiwi", k: 61, t: "plant", a: [], u: { g: 80, one: "kiwi", many: "kiwis" } },
  clementine: { n: "Clémentines", k: 47, t: "plant", a: [], u: { g: 70, one: "clémentine", many: "clémentines" } },
  poire: { n: "Poire", k: 57, t: "plant", a: [], u: { g: 150, one: "poire", many: "poires" } },
  fruitsRouges: { n: "Fruits rouges", k: 45, t: "plant", a: [] },
  compote: { n: "Compote sans sucre ajouté", k: 55, t: "plant", a: [] },
  jusOrange: { n: "Jus d'orange", k: 42, t: "plant", a: [], ml: true },
  // Matières grasses, graines, plaisir
  huileO: { n: "Huile d'olive", k: 900, t: "plant", a: [], fixed: true },
  huileC: { n: "Huile de colza", k: 900, t: "plant", a: [], fixed: true },
  amandes: { n: "Amandes", k: 600, t: "plant", a: ["fruitscoque"], fixed: true },
  noix: { n: "Noix", k: 690, t: "plant", a: ["fruitscoque"], fixed: true },
  grainesCourge: { n: "Graines de courge", k: 560, t: "plant", a: [], fixed: true },
  beurre: { n: "Beurre", k: 750, t: "dairy", a: ["lait"], fixed: true },
  confiture: { n: "Confiture", k: 250, t: "plant", a: [], fixed: true },
  chocolatN: { n: "Chocolat noir 70 %", k: 560, t: "plant", a: [], fixed: true },
  biscuits: { n: "Biscuits sablés", k: 450, t: "plant", a: ["gluten"] },
  pizza: { n: "Pizza margherita", k: 250, t: "dairy", a: ["gluten", "lait"] },
  // Produits animaux
  oeuf: { n: "Œufs", k: 145, t: "egg", a: ["oeufs"], u: { g: 55, one: "œuf", many: "œufs" } },
  poulet: { n: "Blanc de poulet cuit", k: 165, t: "meat", a: [] },
  dinde: { n: "Escalope de dinde cuite", k: 150, t: "meat", a: [] },
  boeufH: { n: "Steak haché 5 % cuit", k: 170, t: "meat", a: [] },
  jambon: { n: "Jambon blanc", k: 110, t: "meat", a: [] },
  saumon: { n: "Saumon cuit", k: 200, t: "fish", a: ["poisson"] },
  maquereau: { n: "Maquereau cuit", k: 240, t: "fish", a: ["poisson"] },
  sardine: { n: "Sardines (boîte, égouttées)", k: 190, t: "fish", a: ["poisson"] },
  thon: { n: "Thon au naturel", k: 116, t: "fish", a: ["poisson"] },
  cabillaud: { n: "Cabillaud cuit", k: 95, t: "fish", a: ["poisson"] },
  yaourt: { n: "Yaourt nature", k: 60, t: "dairy", a: ["lait"] },
  skyr: { n: "Skyr nature", k: 60, t: "dairy", a: ["lait"] },
  fromageBlanc: { n: "Fromage blanc 0 %", k: 50, t: "dairy", a: ["lait"] },
  lait: { n: "Lait demi-écrémé", k: 47, t: "dairy", a: ["lait"], ml: true },
  emmental: { n: "Emmental", k: 380, t: "dairy", a: ["lait"] },
  chevre: { n: "Fromage de chèvre frais", k: 250, t: "dairy", a: ["lait"] },
  comte: { n: "Fromage à pâte dure (comté, gruyère, cantal)", k: 400, t: "dairy", a: ["lait"] },
  feta: { n: "Feta", k: 260, t: "dairy", a: ["lait"] },
  mozzarella: { n: "Mozzarella", k: 250, t: "dairy", a: ["lait"] },
  // Nouveautés : légumes, légumineuses, céréales, viandes, crevettes
  crevettes: { n: "Crevettes cuites", k: 95, t: "fish", a: ["crustaces"] },
  porc: { n: "Filet de porc cuit", k: 150, t: "meat", a: [] },
  petitsPois: { n: "Petits pois cuits", k: 75, t: "plant", a: [] },
  poivron: { n: "Poivrons", k: 30, t: "plant", a: [] },
  aubergine: { n: "Aubergines cuites", k: 30, t: "plant", a: [] },
  chouFleur: { n: "Chou-fleur cuit", k: 22, t: "plant", a: [] },
  potimarron: { n: "Potimarron rôti", k: 35, t: "plant", a: [] },
  poireau: { n: "Poireaux cuits", k: 28, t: "plant", a: [] },
  mais: { n: "Maïs (boîte, égoutté)", k: 95, t: "plant", a: [] },
  harBlancs: { n: "Haricots blancs cuits", k: 100, t: "plant", a: [] },
  couscous: { n: "Couscous complet cuit", k: 115, t: "plant", a: ["gluten"] },
  wrapC: { n: "Wrap complet", k: 275, t: "plant", a: ["gluten"] },
  noixCajou: { n: "Noix de cajou", k: 580, t: "plant", a: ["fruitscoque"], fixed: true }
};

/*
  Repas. items = [aliment, grammes de base]. Les quantités sont ensuite ajustées à l'objectif calorique.
  Tags : omega3 (poisson gras), fish, legume, wholegrain, redmeat, satfat, sugar, refined, sodium, processed.
*/
const PLAN_MEALS = [
  // Petits-déjeuners
  { id: "b1", slot: "breakfast", name: "Porridge d'avoine, pomme et noix", tags: ["wholegrain"],
    items: [["avoine", 40], ["lait", 200], ["pomme", 150], ["noix", 10]] },
  { id: "b2", niche: true, slot: "breakfast", name: "Porridge au soja, fruits rouges et amandes", tags: ["wholegrain"],
    items: [["avoine", 40], ["sojaBoisson", 200], ["fruitsRouges", 100], ["amandes", 10]] },
  { id: "b3", slot: "breakfast", name: "Pain complet, œufs durs et orange", tags: ["wholegrain"],
    items: [["painC", 60], ["oeuf", 110], ["orange", 180]] },
  { id: "b4", slot: "breakfast", name: "Fromage blanc, kiwi, avoine et amandes", tags: ["wholegrain"],
    items: [["fromageBlanc", 150], ["kiwi", 160], ["avoine", 30], ["amandes", 10]] },
  { id: "b5", slot: "breakfast", name: "Skyr, banane et amandes", tags: [],
    items: [["skyr", 200], ["banane", 110], ["amandes", 20]] },
  { id: "b6", slot: "breakfast", name: "Tartines complètes, avocat et œuf", tags: ["wholegrain"],
    items: [["painC", 60], ["avocat", 70], ["oeuf", 55], ["tomate", 100]] },
  { id: "b7", slot: "breakfast", name: "Tartines beurre-confiture et lait", tags: ["sugar", "refined", "satfat"],
    items: [["painB", 60], ["beurre", 10], ["confiture", 20], ["lait", 250]] },
  { id: "b8", niche: true, slot: "breakfast", name: "Yaourt au soja, fruits rouges et banane", tags: [],
    items: [["yaourtSoja", 200], ["fruitsRouges", 100], ["banane", 110]] },
  { id: "b9", slot: "breakfast", name: "Omelette aux champignons et pain complet", tags: ["wholegrain"],
    items: [["oeuf", 110], ["champignons", 100], ["huileO", 5], ["painC", 40]] },
  { id: "b10", slot: "breakfast", name: "Porridge d'avoine à l'eau, banane et noix", tags: ["wholegrain"],
    items: [["avoine", 50], ["banane", 120], ["noix", 15]] },
  { id: "b11", slot: "breakfast", name: "Fromage blanc, fruits rouges, noix et pain complet", tags: ["wholegrain"],
    items: [["fromageBlanc", 150], ["fruitsRouges", 100], ["noix", 10], ["painC", 50]] },
  { id: "b12", slot: "breakfast", name: "Œufs brouillés, tomates et pain complet", tags: ["wholegrain"],
    items: [["oeuf", 110], ["tomate", 120], ["painC", 50], ["huileO", 5]] },
  { id: "b13", slot: "breakfast", name: "Porridge d'avoine et poire", tags: ["wholegrain"],
    items: [["avoine", 40], ["lait", 200], ["poire", 150]] },
  { id: "b14", slot: "breakfast", name: "Skyr, flocons d'avoine, clémentines et noix", tags: ["wholegrain"],
    items: [["skyr", 200], ["avoine", 30], ["clementine", 140], ["noix", 10]] },
  { id: "b15", slot: "breakfast", name: "Tartines d'avocat et tomates", tags: ["wholegrain"],
    items: [["painC", 60], ["avocat", 80], ["tomate", 100]] },
  { id: "b16", niche: true, slot: "breakfast", name: "Tofu brouillé aux champignons et pain complet", tags: ["wholegrain", "legume"],
    items: [["tofu", 120], ["champignons", 100], ["painC", 50], ["huileO", 5]] },
  { id: "b17", slot: "breakfast", name: "Tartines complètes, compote et amandes", tags: ["wholegrain"],
    items: [["painC", 60], ["compote", 150], ["amandes", 15]] },
  { id: "b18", slot: "breakfast", name: "Omelette aux champignons et orange", tags: [],
    items: [["oeuf", 110], ["champignons", 100], ["huileO", 5], ["orange", 180]] },
  { id: "b19", slot: "breakfast", name: "Salade de fruits frais et compote", tags: [],
    items: [["banane", 120], ["orange", 150], ["kiwi", 80], ["compote", 100]] },
  { id: "b20", slot: "breakfast", name: "Œufs durs, avocat et clémentines", tags: [],
    items: [["oeuf", 110], ["avocat", 60], ["clementine", 140]] },
  { id: "b21", slot: "breakfast", name: "Banane, compote et noix", tags: [],
    items: [["banane", 120], ["compote", 100], ["noix", 15]] },
  { id: "b22", slot: "breakfast", name: "Riz à la banane et à la cannelle", tags: [],
    items: [["rizB", 120], ["banane", 110], ["compote", 80]] },

  // Déjeuners
  { id: "l1", box: true, slot: "lunch", name: "Poulet rôti, riz complet et brocoli", tags: ["wholegrain"],
    items: [["poulet", 120], ["rizC", 180], ["brocoli", 150], ["huileO", 8], ["yaourt", 125]] },
  { id: "l2", slot: "lunch", name: "Saumon, riz basmati et haricots verts", tags: ["omega3", "fish"],
    items: [["saumon", 110], ["rizB", 140], ["hv", 150], ["huileO", 8], ["yaourt", 125]] },
  { id: "l3", box: true, slot: "lunch", name: "Salade de lentilles, œuf dur et tomates", tags: ["legume"],
    items: [["lentilles", 200], ["oeuf", 55], ["tomate", 120], ["salade", 50], ["huileO", 10]] },
  { id: "l4", box: true, slot: "lunch", name: "Curry de pois chiches aux épinards et riz basmati", tags: ["legume"],
    items: [["poischiches", 180], ["rizB", 150], ["epinards", 100], ["sauceTomate", 80], ["huileO", 8]] },
  { id: "l5", box: true, slot: "lunch", name: "Pâtes, thon et ratatouille", tags: ["fish"],
    items: [["pastaB", 180], ["thon", 80], ["ratatouille", 150], ["huileO", 8]] },
  { id: "l6", box: true, slot: "lunch", name: "Dinde, patate douce et haricots verts", tags: [],
    items: [["dinde", 120], ["patate", 200], ["hv", 150], ["huileO", 8], ["yaourt", 125]] },
  { id: "l7", box: true, slot: "lunch", name: "Bowl de riz, avocat, pois chiches et crudités", tags: ["legume"],
    items: [["rizB", 140], ["poischiches", 100], ["avocat", 70], ["concombre", 100], ["tomate", 100], ["huileO", 8]] },
  { id: "l8", niche: true, slot: "lunch", name: "Tofu sauté, riz complet et légumes", tags: ["legume", "wholegrain"],
    items: [["tofu", 150], ["rizC", 170], ["legumesPoeles", 200], ["huileO", 8]] },
  { id: "l9", slot: "lunch", name: "Maquereau, pommes de terre vapeur et salade", tags: ["omega3", "fish"],
    items: [["maquereau", 100], ["pdt", 250], ["salade", 80], ["huileO", 8]] },
  { id: "l10", box: true, slot: "lunch", name: "Salade de riz, poulet et légumes croquants", tags: [],
    items: [["rizB", 110], ["poulet", 100], ["tomate", 100], ["concombre", 100], ["huileO", 10], ["yaourt", 125]] },
  { id: "l11", box: true, slot: "lunch", name: "Steak haché 5 %, pommes de terre vapeur et haricots verts", tags: ["redmeat"],
    items: [["boeufH", 100], ["pdt", 250], ["hv", 150], ["huileO", 5], ["yaourt", 125]] },
  { id: "l12", box: true, slot: "lunch", name: "Pâtes bolognaise", tags: ["redmeat", "refined", "satfat"],
    items: [["pastaB", 200], ["boeufH", 100], ["sauceTomate", 100], ["emmental", 15]] },
  { id: "l13", slot: "lunch", name: "Croque-monsieur et salade", tags: ["satfat", "refined", "sodium", "processed"],
    items: [["painB", 80], ["jambon", 60], ["emmental", 40], ["salade", 100], ["huileO", 8]] },
  { id: "l14", box: true, slot: "lunch", name: "Omelette aux légumes et pommes de terre vapeur", tags: [],
    items: [["oeuf", 165], ["pdt", 200], ["champignons", 150], ["huileO", 8], ["yaourt", 125]] },
  { id: "l15", box: true, slot: "lunch", name: "Chili sin carne aux haricots rouges et riz complet", tags: ["legume", "wholegrain"],
    items: [["harRouges", 200], ["rizC", 150], ["sauceTomate", 100], ["ratatouille", 100], ["huileO", 8]] },
  { id: "l16", slot: "lunch", name: "Cabillaud, pommes de terre et courgettes", tags: ["fish"],
    items: [["cabillaud", 150], ["pdt", 200], ["courgette", 150], ["huileO", 10], ["yaourt", 125]] },
  { id: "l17", box: true, slot: "lunch", name: "Soupe de légumes, tartines complètes et chèvre frais", tags: ["wholegrain"],
    items: [["soupe", 300], ["painC", 60], ["chevre", 40], ["huileO", 5]] },
  { id: "l18", slot: "lunch", name: "Crevettes sautées aux légumes et riz basmati", tags: ["fish"],
    items: [["crevettes", 120], ["rizB", 150], ["legumesPoeles", 150], ["huileO", 8]] },
  { id: "l19", box: true, slot: "lunch", name: "Wrap complet au poulet, crudités et sauce au yaourt", tags: ["wholegrain"],
    items: [["wrapC", 80], ["poulet", 100], ["salade", 60], ["tomate", 100], ["yaourt", 50]] },
  { id: "l20", box: true, slot: "lunch", name: "Couscous complet de légumes et pois chiches", tags: ["legume", "wholegrain"],
    items: [["couscous", 150], ["poischiches", 120], ["carotte", 100], ["courgette", 100], ["huileO", 8]] },
  { id: "l21", box: true, slot: "lunch", name: "Filet de porc, haricots verts et pommes de terre vapeur", tags: ["redmeat"],
    items: [["porc", 110], ["hv", 150], ["pdt", 220], ["huileO", 8], ["yaourt", 125]] },
  { id: "l22", box: true, slot: "lunch", name: "Salade de pois chiches, poivrons et feta", tags: ["legume", "sodium"],
    items: [["poischiches", 150], ["poivron", 100], ["concombre", 100], ["feta", 40], ["huileO", 10]] },
  { id: "l23", box: true, slot: "lunch", name: "Chou-fleur rôti, lentilles et œuf", tags: ["legume"],
    items: [["chouFleur", 200], ["lentilles", 150], ["oeuf", 55], ["huileO", 8]] },
  { id: "l24", box: true, slot: "lunch", name: "Salade de thon, haricots blancs et tomates", tags: ["fish", "legume"],
    items: [["thon", 90], ["harBlancs", 150], ["tomate", 150], ["salade", 50], ["huileO", 10]] },
  { id: "l25", box: true, slot: "lunch", name: "Poulet, couscous complet et poivrons", tags: ["wholegrain"],
    items: [["poulet", 110], ["couscous", 170], ["poivron", 150], ["huileO", 8], ["yaourt", 125]] },
  { id: "l26", box: true, slot: "lunch", name: "Carottes rôties, riz et pois chiches", tags: ["legume"],
    items: [["carotte", 250], ["rizC", 115], ["poischiches", 100], ["huileO", 6]] },
  { id: "l27", box: true, slot: "lunch", name: "Aubergines gratinées à la mozzarella et riz complet", tags: ["wholegrain"],
    items: [["aubergine", 200], ["mozzarella", 50], ["sauceTomate", 100], ["rizC", 130], ["huileO", 8]] },
  { id: "l28", box: true, slot: "lunch", name: "Pâtes, saumon et petits pois", tags: ["omega3", "fish"],
    items: [["pastaB", 170], ["saumon", 90], ["petitsPois", 100], ["huileO", 8]] },
  { id: "l29", box: true, slot: "lunch", name: "Wok de poulet, légumes et amandes sur riz basmati", tags: [],
    items: [["poulet", 110], ["legumesPoeles", 200], ["rizB", 130], ["amandes", 15], ["yaourt", 125]] },
  { id: "l30", box: true, slot: "lunch", name: "Poulet, riz basmati et ratatouille", tags: [],
    items: [["poulet", 120], ["rizB", 150], ["ratatouille", 150], ["huileO", 8]] },
  { id: "l31", box: true, slot: "lunch", name: "Lentilles, carottes et riz complet", tags: ["legume", "wholegrain"],
    items: [["lentilles", 180], ["carotte", 120], ["rizC", 120], ["huileO", 8]] },

  // Dîners
  { id: "d1", slot: "dinner", name: "Cabillaud au four, patate douce et brocoli", tags: ["fish"],
    items: [["cabillaud", 150], ["patate", 200], ["brocoli", 150], ["huileO", 8], ["fromageBlanc", 125]] },
  { id: "d2", slot: "dinner", name: "Saumon, riz basmati et épinards", tags: ["omega3", "fish"],
    items: [["saumon", 110], ["rizB", 130], ["epinards", 150], ["huileO", 5], ["fromageBlanc", 125]] },
  { id: "d3", slot: "dinner", name: "Soupe de légumes, omelette aux herbes et pain complet", tags: ["wholegrain"],
    items: [["soupe", 300], ["oeuf", 110], ["painC", 40], ["huileO", 5]] },
  { id: "d4", slot: "dinner", name: "Dahl de lentilles et riz basmati", tags: ["legume"],
    items: [["lentilles", 200], ["rizB", 120], ["epinards", 100], ["sauceTomate", 50], ["huileO", 8]] },
  { id: "d5", slot: "dinner", name: "Poulet grillé, courgettes et pâtes", tags: [],
    items: [["poulet", 120], ["courgette", 200], ["pastaB", 95], ["huileO", 8], ["fromageBlanc", 125]] },
  { id: "d6", slot: "dinner", name: "Sardines, pommes de terre et salade verte", tags: ["omega3", "fish", "sodium"],
    items: [["sardine", 100], ["pdt", 200], ["salade", 100], ["huileO", 8]] },
  { id: "d7", niche: true, slot: "dinner", name: "Wok de tofu, légumes et riz basmati", tags: ["legume"],
    items: [["tofu", 150], ["legumesPoeles", 250], ["rizB", 120], ["huileO", 8]] },
  { id: "d8", slot: "dinner", name: "Dinde, haricots verts et pommes de terre vapeur", tags: [],
    items: [["dinde", 120], ["hv", 200], ["pdt", 200], ["huileO", 8], ["fromageBlanc", 125]] },
  { id: "d9", slot: "dinner", name: "Salade de pois chiches, tomates et chèvre frais", tags: ["legume"],
    items: [["poischiches", 150], ["tomate", 150], ["concombre", 100], ["chevre", 40], ["huileO", 10]] },
  { id: "d10", slot: "dinner", name: "Ratatouille, œufs au plat et riz complet", tags: ["wholegrain"],
    items: [["ratatouille", 250], ["oeuf", 110], ["rizC", 130], ["huileO", 5]] },
  { id: "d11", slot: "dinner", name: "Pizza margherita et salade", tags: ["refined", "satfat", "sodium"],
    items: [["pizza", 200], ["salade", 100], ["huileO", 5]] },
  { id: "d12", slot: "dinner", name: "Steak haché 5 %, légumes poêlés et pommes de terre", tags: ["redmeat"],
    items: [["boeufH", 100], ["legumesPoeles", 250], ["pdt", 150], ["huileO", 5]] },
  { id: "d13", slot: "dinner", name: "Maquereau au four, pommes de terre et brocoli", tags: ["omega3", "fish"],
    items: [["maquereau", 100], ["pdt", 170], ["brocoli", 150], ["huileO", 5], ["fromageBlanc", 125]] },
  { id: "d14", slot: "dinner", name: "Chili de lentilles et riz complet", tags: ["legume"],
    items: [["lentilles", 180], ["rizC", 90], ["sauceTomate", 100], ["ratatouille", 100], ["huileO", 8]] },
  { id: "d15", slot: "dinner", name: "Crevettes à l'ail, courgettes et riz complet", tags: ["fish", "wholegrain"],
    items: [["crevettes", 120], ["courgette", 200], ["rizC", 130], ["huileO", 8]] },
  { id: "d16", slot: "dinner", name: "Soupe de légumes, œufs mollets et pain complet", tags: ["wholegrain"],
    items: [["soupe", 250], ["oeuf", 110], ["painC", 40], ["huileO", 5]] },
  { id: "d17", slot: "dinner", name: "Poulet rôti, chou-fleur et pommes de terre vapeur", tags: [],
    items: [["poulet", 120], ["chouFleur", 200], ["pdt", 180], ["huileO", 8], ["fromageBlanc", 125]] },
  { id: "d18", slot: "dinner", name: "Filet de porc, carottes et riz complet", tags: ["redmeat"],
    items: [["porc", 110], ["carotte", 150], ["rizC", 115], ["huileO", 6], ["fromageBlanc", 125]] },
  { id: "d19", slot: "dinner", name: "Saumon, petits pois et pommes de terre vapeur", tags: ["omega3", "fish"],
    items: [["saumon", 110], ["petitsPois", 120], ["pdt", 200], ["huileO", 5], ["fromageBlanc", 125]] },
  { id: "d20", slot: "dinner", name: "Haricots blancs à la tomate et aux poivrons, riz basmati", tags: ["legume"],
    items: [["harBlancs", 170], ["sauceTomate", 100], ["poivron", 100], ["rizB", 120], ["huileO", 8]] },
  { id: "d21", slot: "dinner", name: "Poêlée de légumes, lentilles et œuf au plat", tags: ["legume"],
    items: [["lentilles", 150], ["legumesPoeles", 200], ["oeuf", 55], ["huileO", 6]] },
  { id: "d22", niche: true, slot: "dinner", name: "Tofu aux poivrons et riz complet", tags: ["legume"],
    items: [["tofu", 140], ["poivron", 150], ["rizC", 125], ["huileO", 8]] },
  { id: "d23", slot: "dinner", name: "Aubergines farcies à la dinde et couscous complet", tags: ["wholegrain"],
    items: [["aubergine", 250], ["dinde", 110], ["sauceTomate", 80], ["couscous", 100], ["huileO", 6]] },
  { id: "d24", slot: "dinner", name: "Omelette aux poireaux et pommes de terre vapeur", tags: [],
    items: [["oeuf", 165], ["poireau", 150], ["pdt", 150], ["huileO", 6], ["fromageBlanc", 125]] },
  { id: "d25", slot: "dinner", name: "Velouté de chou-fleur et lentilles, pain complet", tags: ["legume", "wholegrain"],
    items: [["chouFleur", 250], ["lentilles", 150], ["painC", 40], ["huileO", 6]] },
  { id: "d26", slot: "dinner", name: "Cabillaud, fondue de poireaux et riz basmati", tags: ["fish"],
    items: [["cabillaud", 150], ["poireau", 150], ["rizB", 130], ["huileO", 8]] },
  { id: "d27", slot: "dinner", name: "Dinde, patate douce et courgettes", tags: [],
    items: [["dinde", 120], ["patate", 200], ["courgette", 150], ["huileO", 8]] },
  { id: "d28", slot: "dinner", name: "Steak haché, riz et haricots verts", tags: ["redmeat"],
    items: [["boeufH", 100], ["rizB", 150], ["hv", 150], ["huileO", 8]] },
  { id: "d29", slot: "dinner", name: "Lentilles, légumes poêlés et riz complet", tags: ["legume", "wholegrain"],
    items: [["lentilles", 180], ["legumesPoeles", 150], ["rizC", 120], ["huileO", 6]] },

  // Collations
  { id: "s1", slot: "snack", name: "Pomme et poignée d'amandes", tags: [],
    items: [["pomme", 150], ["amandes", 15]] },
  { id: "s2", slot: "snack", name: "Yaourt nature et fruits rouges", tags: [],
    items: [["yaourt", 125], ["fruitsRouges", 80]] },
  { id: "s3", slot: "snack", name: "Poire et deux carrés de chocolat noir", tags: [],
    items: [["poire", 150], ["chocolatN", 20]] },
  { id: "s4", slot: "snack", name: "Fromage blanc et kiwi", tags: [],
    items: [["fromageBlanc", 150], ["kiwi", 80]] },
  { id: "s5", slot: "snack", name: "Clémentines et noix", tags: [],
    items: [["clementine", 140], ["noix", 15]] },
  { id: "s6", niche: true, slot: "snack", name: "Banane et yaourt au soja", tags: [],
    items: [["banane", 110], ["yaourtSoja", 125]] },
  { id: "s7", slot: "snack", name: "Tranche de pain complet et compote sans sucre", tags: ["wholegrain"],
    items: [["painC", 30], ["compote", 100]] },
  { id: "s8", slot: "snack", name: "Biscuits sablés et jus d'orange", tags: ["sugar", "refined"],
    items: [["biscuits", 30], ["jusOrange", 200]] },
  { id: "s9", slot: "snack", name: "Pomme et noix", tags: [],
    items: [["pomme", 150], ["noix", 15]] },
  { id: "s10", slot: "snack", name: "Œuf dur et tomates cerises", tags: [],
    items: [["oeuf", 55], ["tomate", 100]] },
  { id: "s11", slot: "snack", name: "Yaourt nature et noix", tags: [],
    items: [["yaourt", 125], ["noix", 15]] },
  { id: "s12", slot: "snack", name: "Bâtonnets de carotte et chèvre frais", tags: [],
    items: [["carotte", 120], ["chevre", 30]] },
  { id: "s13", slot: "snack", name: "Compote sans sucre ajouté et amandes", tags: [],
    items: [["compote", 100], ["amandes", 15]] },
  { id: "s14", slot: "snack", name: "Orange et amandes", tags: [],
    items: [["orange", 180], ["amandes", 15]] },
  { id: "s15", slot: "snack", name: "Banane et chocolat noir", tags: [],
    items: [["banane", 110], ["chocolatN", 15]] },
  { id: "s16", slot: "snack", name: "Tartine complète, tomate et mozzarella", tags: ["wholegrain"],
    items: [["painC", 30], ["tomate", 100], ["mozzarella", 30]] },
  { id: "s17", slot: "snack", name: "Banane et pomme", tags: [],
    items: [["banane", 110], ["pomme", 150]] },
  { id: "s18", slot: "snack", name: "Bâtonnets de carotte et concombre", tags: [],
    items: [["carotte", 120], ["concombre", 100]] },
  { id: "s19", slot: "snack", name: "Compote sans sucre ajouté et clémentines", tags: [],
    items: [["compote", 100], ["clementine", 140]] },
  { id: "s20", slot: "snack", name: "Orange et pomme", tags: [],
    items: [["orange", 180], ["pomme", 150]] }
];

/* ------------------------------------------------------------------ */
/* Valeurs nutritionnelles (estimations arrondies, pour 100 g)         */
/* ------------------------------------------------------------------ */

const PLAN_NUTRIENT_KEYS = ["p", "c", "s", "f", "sf", "fi", "sel", "ca", "fe", "vc"];

/*
  [protéines g, glucides g, dont sucres g, lipides g, dont saturés g, fibres g, sel g, calcium mg, fer mg, vitamine C mg]
  Ordre = PLAN_NUTRIENT_KEYS. Valeurs indicatives (ordre de grandeur des tables Ciqual / ANSES), sans sel ajouté à la cuisson.
*/
const PLAN_NUTRITION = {
  avoine: [13, 60, 1, 7, 1.2, 10, 0.02, 50, 4.5, 0],
  painC: [9, 44, 3, 2, 0.4, 7, 1.1, 40, 2.5, 0],
  painB: [9, 52, 3, 1.5, 0.3, 3, 1.2, 30, 1.5, 0],
  rizC: [2.7, 25, 0.3, 1, 0.2, 1.8, 0, 10, 0.5, 0],
  rizB: [2.7, 28, 0.1, 0.3, 0.1, 0.5, 0, 10, 0.2, 0],
  quinoa: [4.4, 21, 0.9, 1.9, 0.2, 2.8, 0, 17, 1.5, 0],
  pastaC: [6, 28, 1.5, 1, 0.2, 4, 0, 20, 1.5, 0],
  pastaB: [5.5, 30, 0.6, 0.9, 0.2, 1.8, 0, 10, 0.7, 0],
  boulgour: [3, 16, 0.1, 0.2, 0, 4.5, 0, 10, 1, 0],
  pdt: [2, 18, 0.8, 0.1, 0, 1.8, 0, 8, 0.8, 13],
  patate: [1.6, 20, 6.5, 0.1, 0, 3, 0.03, 30, 0.7, 12],
  sarrasin: [3.4, 20, 0.9, 0.6, 0.1, 2.7, 0, 7, 0.8, 0],
  lentilles: [9, 17, 1.8, 0.5, 0.1, 7.5, 0, 25, 3.3, 1.5],
  poischiches: [8.5, 21, 4, 3, 0.3, 7, 0.01, 50, 2.5, 1.3],
  harRouges: [8, 17, 1, 0.5, 0.1, 7, 0, 30, 2.5, 1],
  tofu: [13, 1.5, 0.5, 7.5, 1.1, 1.5, 0.02, 180, 2.5, 0],
  sojaBoisson: [3.3, 1.5, 1, 1.8, 0.3, 0.5, 0.1, 120, 0.4, 0],
  yaourtSoja: [3.5, 2, 1, 2.2, 0.4, 0.5, 0.05, 120, 0.5, 0],
  brocoli: [3, 3, 1.5, 0.4, 0.1, 3, 0.03, 45, 0.9, 55],
  hv: [2, 4, 2, 0.2, 0, 3, 0, 50, 0.9, 10],
  courgette: [1.2, 2.3, 2, 0.3, 0.1, 1.1, 0, 15, 0.4, 10],
  carotte: [0.8, 7, 5, 0.3, 0.1, 3, 0.07, 30, 0.4, 3],
  tomate: [0.9, 3, 2.6, 0.2, 0, 1.2, 0.01, 10, 0.3, 15],
  salade: [1.2, 1.5, 1, 0.2, 0, 1.2, 0.02, 35, 0.9, 8],
  epinards: [3, 1.5, 0.5, 0.4, 0.1, 2.5, 0.1, 120, 3, 15],
  ratatouille: [1.2, 5, 4, 3.2, 0.5, 2, 0.2, 20, 0.6, 15],
  champignons: [3, 1, 0.5, 0.3, 0, 1.5, 0.01, 5, 0.5, 2],
  concombre: [0.6, 2, 1.5, 0.1, 0, 0.7, 0, 15, 0.3, 3],
  legumesPoeles: [1.8, 6, 4, 4, 0.6, 2.5, 0.1, 30, 0.7, 20],
  soupe: [1, 5, 3, 1, 0.2, 1.5, 0.4, 20, 0.4, 8],
  sauceTomate: [1.3, 6, 5, 0.6, 0.1, 1.5, 0.5, 20, 0.9, 6],
  avocat: [2, 2, 0.7, 15, 2.2, 6.5, 0.01, 12, 0.6, 10],
  pomme: [0.3, 12, 11, 0.2, 0, 2, 0, 6, 0.2, 4],
  banane: [1.2, 20, 15, 0.3, 0.1, 2, 0, 6, 0.3, 9],
  orange: [0.9, 9, 8.5, 0.2, 0, 2, 0, 40, 0.1, 50],
  kiwi: [1.1, 12, 9, 0.5, 0, 3, 0, 34, 0.3, 90],
  clementine: [0.8, 9.5, 9, 0.2, 0, 1.7, 0, 30, 0.1, 45],
  poire: [0.4, 13, 10, 0.1, 0, 3, 0, 10, 0.2, 4],
  fruitsRouges: [0.8, 8, 6, 0.4, 0, 4, 0, 20, 0.6, 40],
  compote: [0.3, 12, 11, 0.1, 0, 1.5, 0, 5, 0.2, 2],
  jusOrange: [0.6, 9, 8.5, 0.1, 0, 0.2, 0, 10, 0.2, 40],
  huileO: [0, 0, 0, 100, 14, 0, 0, 0, 0, 0],
  huileC: [0, 0, 0, 100, 7, 0, 0, 0, 0, 0],
  amandes: [21, 7, 4, 53, 4, 12, 0.01, 250, 3.5, 0],
  noix: [15, 7, 3, 66, 6, 7, 0.01, 90, 2.5, 1],
  grainesCourge: [30, 5, 1, 47, 8, 6, 0.01, 50, 8, 2],
  beurre: [0.7, 0.5, 0.5, 82, 52, 0, 0.1, 20, 0, 0],
  confiture: [0.4, 60, 58, 0.1, 0, 1, 0, 10, 0.3, 3],
  chocolatN: [8, 35, 28, 40, 24, 11, 0.02, 60, 11, 0],
  biscuits: [6, 68, 25, 18, 10, 2, 0.5, 30, 1.5, 0],
  pizza: [11, 30, 3, 9, 4.5, 2, 1.2, 200, 1.5, 3],
  oeuf: [12.5, 0.7, 0.7, 10, 3, 0, 0.35, 55, 1.9, 0],
  poulet: [31, 0, 0, 3.6, 1, 0, 0.2, 12, 0.7, 0],
  dinde: [30, 0, 0, 2.5, 0.7, 0, 0.1, 12, 1, 0],
  boeufH: [28, 0, 0, 6, 2.7, 0, 0.15, 15, 2.8, 0],
  jambon: [19, 1, 1, 3.5, 1.2, 0, 1.8, 10, 0.8, 0],
  saumon: [22, 0, 0, 12, 2.5, 0, 0.15, 15, 0.5, 0],
  maquereau: [22, 0, 0, 16, 3.5, 0, 0.2, 15, 1.5, 0],
  sardine: [24, 0, 0, 10.5, 2.5, 0, 1, 350, 2.5, 0],
  thon: [26, 0, 0, 1, 0.3, 0, 1, 10, 1.2, 0],
  cabillaud: [21, 0, 0, 1, 0.2, 0, 0.2, 15, 0.5, 0],
  yaourt: [4, 5.5, 5.5, 2, 1.3, 0, 0.1, 150, 0.1, 0],
  skyr: [11, 4, 4, 0.2, 0.1, 0, 0.1, 120, 0, 0],
  fromageBlanc: [8, 4, 4, 0.2, 0.1, 0, 0.1, 120, 0, 0],
  lait: [3.3, 4.8, 4.8, 1.6, 1, 0, 0.1, 120, 0, 0],
  emmental: [28, 0.5, 0.5, 30, 19, 0, 1, 1000, 0.3, 0],
  chevre: [16, 1, 1, 21, 14, 0, 0.9, 150, 0.5, 0],
  comte: [28, 0.5, 0.5, 32, 21, 0, 1.6, 1100, 0.3, 0],
  feta: [15, 1, 1, 21, 14, 0, 2.7, 400, 0.7, 0],
  mozzarella: [18, 1, 1, 19, 12, 0, 0.6, 400, 0.3, 0],
  crevettes: [20, 0.3, 0, 1.2, 0.3, 0, 0.9, 80, 1.5, 0],
  porc: [27, 0, 0, 4, 1.4, 0, 0.15, 10, 1, 0],
  petitsPois: [5.5, 10, 4, 0.5, 0.1, 5.5, 0.03, 30, 1.5, 15],
  poivron: [1, 5, 4.5, 0.3, 0, 2, 0.01, 10, 0.4, 100],
  aubergine: [1, 5, 3, 0.3, 0.1, 3, 0.01, 12, 0.3, 2],
  chouFleur: [2, 2.5, 2, 0.3, 0.1, 2, 0.02, 20, 0.4, 45],
  potimarron: [1, 7, 4, 0.2, 0, 2, 0.01, 30, 0.5, 8],
  poireau: [1.5, 4, 3, 0.3, 0, 2.5, 0.02, 30, 1, 10],
  mais: [3, 17, 3, 1.3, 0.2, 3, 0.3, 5, 0.5, 5],
  harBlancs: [7, 15, 1, 0.5, 0.1, 6, 0.01, 60, 2, 1],
  couscous: [4.5, 21, 0.5, 0.8, 0.1, 4, 0.01, 12, 1, 0],
  wrapC: [9, 45, 3, 5.5, 1.5, 6, 1.1, 40, 2.5, 0],
  noixCajou: [18, 30, 6, 44, 8, 3, 0.03, 40, 6, 0]
};

/* ------------------------------------------------------------------ */
/* Recettes (temps total en minutes + étapes). Les quantités sont celles affichées dans le repas. */
/* ------------------------------------------------------------------ */

const PLAN_RECIPES = {
  // Petits-déjeuners
  b1: { time: 10, steps: ["Versez les flocons d'avoine et le lait dans une casserole.", "Chauffez 5 minutes à feu doux en remuant, jusqu'à obtenir une texture crémeuse.", "Coupez la pomme en dés et ajoutez-la dans le bol.", "Parsemez de noix concassées."] },
  b2: { time: 10, steps: ["Faites chauffer la boisson au soja avec les flocons d'avoine 5 minutes à feu doux.", "Versez dans un bol.", "Ajoutez les fruits rouges (frais ou décongelés).", "Terminez avec les amandes."] },
  b3: { time: 15, steps: ["Plongez les œufs dans l'eau bouillante 9 minutes, puis rafraîchissez-les sous l'eau froide.", "Écalez-les et coupez-les en deux.", "Servez avec le pain complet, éventuellement grillé.", "Accompagnez de l'orange pressée ou coupée en quartiers."] },
  b4: { time: 5, steps: ["Versez le fromage blanc dans un bol.", "Épluchez et coupez le kiwi en rondelles.", "Ajoutez le kiwi, les flocons d'avoine et les amandes concassées."] },
  b5: { time: 5, steps: ["Versez le skyr dans un bol.", "Coupez la banane en rondelles et posez-la dessus.", "Ajoutez les amandes."] },
  b6: { time: 10, steps: ["Faites cuire l'œuf au plat ou poché (3 minutes).", "Faites griller le pain complet.", "Écrasez l'avocat à la fourchette et étalez-le sur le pain.", "Posez l'œuf dessus et servez avec la tomate coupée en rondelles."] },
  b7: { time: 5, steps: ["Faites griller le pain.", "Tartinez de beurre puis de confiture.", "Servez avec le verre de lait."] },
  b8: { time: 5, steps: ["Versez le yaourt au soja dans un bol.", "Ajoutez les fruits rouges et la banane en rondelles."] },
  b9: { time: 12, steps: ["Émincez les champignons et faites-les revenir 4 minutes dans l'huile d'olive.", "Battez les œufs avec une pincée de poivre et versez-les sur les champignons.", "Laissez prendre 2 à 3 minutes, pliez l'omelette.", "Servez avec le pain complet."] },
  b10: { time: 10, steps: ["Faites cuire les flocons d'avoine 5 minutes dans de l'eau (ou du lait végétal) en remuant.", "Coupez la banane en rondelles.", "Servez dans un bol avec la banane et les noix concassées."] },
  b11: { time: 5, steps: ["Versez le fromage blanc dans un bol.", "Ajoutez les fruits rouges et les noix concassées.", "Servez avec le pain complet."] },
  b12: { time: 10, steps: ["Coupez les tomates en dés et faites-les revenir 3 minutes dans l'huile d'olive.", "Battez les œufs et versez-les dans la poêle.", "Remuez doucement à feu doux 2 minutes pour obtenir des œufs brouillés crémeux.", "Servez avec le pain complet grillé."] },
  b13: { time: 10, steps: ["Chauffez les flocons d'avoine avec le lait 5 minutes à feu doux.", "Coupez la poire en dés et ajoutez-la."] },
  b14: { time: 5, steps: ["Versez le skyr dans un bol.", "Ajoutez les flocons d'avoine et les clémentines pelées.", "Terminez avec les noix concassées."] },
  b15: { time: 8, steps: ["Faites griller le pain complet.", "Écrasez l'avocat avec un filet de citron et du poivre.", "Étalez sur le pain, ajoutez les tomates en rondelles."] },
  b16: { time: 12, steps: ["Émiettez le tofu à la fourchette.", "Faites revenir les champignons émincés 4 minutes dans l'huile d'olive.", "Ajoutez le tofu, du curcuma, du poivre, et cuisez 4 minutes.", "Servez avec le pain complet grillé."] },
  b17: { time: 5, steps: ["Faites griller le pain complet.", "Étalez la compote sans sucre ajouté sur les tartines.", "Servez avec les amandes."] },
  b18: { time: 10, steps: ["Émincez les champignons et faites-les revenir 4 minutes dans l'huile d'olive.", "Battez les œufs, versez-les dans la poêle et cuisez 3 minutes.", "Servez avec l'orange."] },
  b19: { time: 8, steps: ["Pelez et coupez la banane, l'orange et le kiwi en morceaux.", "Mélangez avec la compote sans sucre ajouté."] },
  b20: { time: 12, steps: ["Faites cuire les œufs 10 minutes dans l'eau bouillante, puis écalez-les.", "Coupez l'avocat en tranches avec un filet de citron.", "Servez avec les clémentines."] },
  b21: { time: 5, steps: ["Coupez la banane en rondelles.", "Ajoutez la compote sans sucre ajouté et les noix concassées."] },
  b22: { time: 10, steps: ["Réchauffez le riz cuit avec un peu d'eau.", "Ajoutez la banane en rondelles, la compote et un peu de cannelle."] },

  // Déjeuners
  l1: { time: 30, steps: ["Faites cuire le riz complet selon les indications du paquet (environ 25 minutes).", "Assaisonnez le poulet et faites-le dorer 5 à 6 minutes de chaque côté dans l'huile d'olive.", "Faites cuire le brocoli 6 minutes à la vapeur.", "Servez ensemble.", "Terminez par le yaourt nature en dessert."] },
  l2: { time: 25, steps: ["Faites cuire le riz basmati.", "Faites cuire les haricots verts 8 minutes à l'eau bouillante.", "Cuisez le saumon 4 minutes de chaque côté à la poêle avec l'huile d'olive.", "Servez avec un filet de citron.", "Terminez par le yaourt nature en dessert."] },
  l3: { time: 25, steps: ["Faites cuire l'œuf 9 minutes dans l'eau bouillante, écalez-le.", "Égouttez les lentilles cuites (en boîte ou cuites maison) et rincez-les.", "Coupez les tomates en dés et mélangez avec la salade et les lentilles.", "Assaisonnez avec l'huile d'olive, du vinaigre et du poivre, puis ajoutez l'œuf."] },
  l4: { time: 30, steps: ["Faites cuire le riz basmati 10 minutes.", "Dans une casserole, faites chauffer l'huile avec un peu de curry en poudre.", "Ajoutez la sauce tomate, les pois chiches et les épinards, et laissez mijoter 10 minutes.", "Servez sur le riz."] },
  l5: { time: 25, steps: ["Faites cuire les pâtes 8 à 9 minutes, bien al dente.", "Réchauffez la ratatouille à la casserole.", "Égouttez le thon et émiettez-le dans la ratatouille.", "Mélangez avec les pâtes et l'huile d'olive."] },
  l6: { time: 40, steps: ["Coupez la patate douce en cubes et faites-la rôtir au four à 200 °C pendant 25 minutes avec un peu d'huile.", "Faites cuire les haricots verts 8 minutes.", "Poêlez l'escalope de dinde 4 à 5 minutes de chaque côté.", "Servez ensemble.", "Terminez par le yaourt nature en dessert."] },
  l7: { time: 15, steps: ["Réchauffez ou rincez le riz cuit et laissez-le tiédir.", "Coupez le concombre, la tomate et l'avocat en dés.", "Disposez le riz, les pois chiches et les légumes dans un bol.", "Assaisonnez avec l'huile d'olive, du citron et du poivre."] },
  l8: { time: 30, steps: ["Faites cuire le riz complet.", "Coupez le tofu en cubes et faites-le dorer 6 minutes dans l'huile d'olive.", "Ajoutez les légumes poêlés et faites revenir 5 minutes.", "Relevez avec un peu de sauce soja ou d'épices, et servez sur le riz."] },
  l9: { time: 30, steps: ["Faites cuire les pommes de terre à la vapeur 20 minutes.", "Faites chauffer le maquereau (frais ou en filets cuits) à la poêle 3 minutes de chaque côté.", "Préparez la salade avec l'huile d'olive et du vinaigre.", "Servez ensemble."] },
  l10: { time: 20, steps: ["Faites cuire le riz basmati 10 minutes.", "Faites griller le poulet à la poêle et coupez-le en lamelles.", "Coupez la tomate et le concombre en dés.", "Mélangez le tout avec l'huile d'olive et du citron.", "Terminez par le yaourt nature en dessert."] },
  l11: { time: 35, steps: ["Faites cuire les pommes de terre à la vapeur 20 minutes.", "Faites cuire les haricots verts 8 minutes.", "Faites cuire le steak haché 3 à 4 minutes de chaque côté à la poêle, avec l'huile d'olive.", "Servez ensemble.", "Terminez par le yaourt nature en dessert."] },
  l12: { time: 30, steps: ["Faites cuire les pâtes.", "Faites revenir le steak haché émietté dans une poêle, puis ajoutez la sauce tomate et laissez mijoter 10 minutes.", "Mélangez avec les pâtes et parsemez d'emmental râpé."] },
  l13: { time: 15, steps: ["Garnissez une tranche de pain de jambon et d'emmental, refermez avec une seconde tranche.", "Faites dorer le croque-monsieur 3 minutes de chaque côté à la poêle ou au four.", "Servez avec la salade assaisonnée à l'huile d'olive."] },
  l14: { time: 25, steps: ["Faites cuire les pommes de terre à la vapeur 20 minutes.", "Faites revenir les champignons émincés dans l'huile d'olive.", "Battez les œufs, versez-les sur les champignons et laissez cuire 3 minutes.", "Servez avec les pommes de terre.", "Terminez par le yaourt nature en dessert."] },
  l15: { time: 30, steps: ["Faites cuire le riz complet.", "Faites chauffer la sauce tomate avec la ratatouille et les haricots rouges, ajoutez du paprika et du cumin.", "Laissez mijoter 15 minutes.", "Servez sur le riz."] },
  l16: { time: 30, steps: ["Faites cuire les pommes de terre à la vapeur 20 minutes.", "Faites cuire les courgettes en rondelles 6 minutes à la poêle.", "Faites cuire le cabillaud 5 à 6 minutes à la vapeur ou au four.", "Servez avec un filet d'huile d'olive et du citron.", "Terminez par le yaourt nature en dessert."] },
  l17: { time: 15, steps: ["Réchauffez la soupe de légumes.", "Faites griller le pain complet.", "Étalez le chèvre frais sur les tartines et ajoutez un filet d'huile d'olive.", "Servez avec la soupe."] },
  l18: { time: 20, steps: ["Faites cuire le riz basmati 10 minutes.", "Faites revenir les légumes poêlés 6 minutes dans l'huile d'olive.", "Ajoutez les crevettes et faites-les sauter 3 à 4 minutes, avec de l'ail et du paprika.", "Servez sur le riz."] },
  l19: { time: 15, steps: ["Faites griller le poulet et coupez-le en lamelles.", "Mélangez le yaourt avec du citron, du sel et des herbes pour faire une sauce.", "Garnissez le wrap de salade, de tomate, de poulet et de sauce, puis roulez-le."] },
  l20: { time: 30, steps: ["Faites revenir les carottes et les courgettes en dés dans l'huile d'olive 8 minutes avec du cumin.", "Ajoutez les pois chiches et un peu d'eau, laissez mijoter 10 minutes.", "Réhydratez le couscous avec de l'eau chaude (même volume), couvrez 5 minutes, puis égrenez-le.", "Servez les légumes sur le couscous."] },
  l21: { time: 40, steps: ["Faites cuire les pommes de terre à la vapeur 20 minutes.", "Faites cuire les haricots verts 8 minutes.", "Faites dorer le filet de porc 12 minutes à la poêle avec l'huile d'olive, jusqu'à ce qu'il ne soit plus rosé à cœur.", "Laissez reposer 3 minutes et coupez en tranches.", "Terminez par le yaourt nature en dessert."] },
  l22: { time: 15, steps: ["Égouttez et rincez les pois chiches.", "Coupez les poivrons et le concombre en dés.", "Mélangez avec la feta émiettée.", "Assaisonnez avec l'huile d'olive, du citron et du poivre (la feta est déjà salée)."] },
  l23: { time: 30, steps: ["Détaillez le chou-fleur en petits bouquets et faites-les rôtir 20 minutes au four à 200 °C avec l'huile d'olive.", "Faites cuire l'œuf 9 minutes, écalez-le.", "Réchauffez les lentilles.", "Servez les lentilles avec le chou-fleur rôti et l'œuf coupé en deux."] },
  l24: { time: 15, steps: ["Égouttez les haricots blancs et rincez-les.", "Égouttez le thon et émiettez-le.", "Coupez les tomates en dés.", "Mélangez le tout avec la salade, l'huile d'olive, du citron et du poivre."] },
  l25: { time: 25, steps: ["Réhydratez le couscous complet avec de l'eau chaude (même volume), couvrez 5 minutes.", "Faites dorer le poulet en dés 6 minutes dans l'huile d'olive.", "Ajoutez les poivrons en lanières et cuisez 6 minutes.", "Servez sur le couscous égrené.", "Terminez par le yaourt nature en dessert."] },
  l26: { time: 40, steps: ["Coupez les carottes en rondelles et faites-les rôtir 25 minutes à 200 °C avec l'huile d'olive.", "Faites cuire le riz complet.", "Mélangez le riz, les pois chiches et les carottes."] },
  l27: { time: 45, steps: ["Coupez les aubergines en rondelles et faites-les rôtir 20 minutes à 200 °C avec l'huile d'olive.", "Faites cuire le riz complet.", "Disposez les aubergines dans un plat avec la sauce tomate et la mozzarella en tranches.", "Gratinez 10 minutes au four et servez avec le riz."] },
  l28: { time: 25, steps: ["Faites cuire les pâtes 8 à 9 minutes, bien al dente, en ajoutant les petits pois pour les 3 dernières minutes.", "Faites cuire le saumon 4 minutes de chaque côté, puis émiettez-le.", "Mélangez le tout avec l'huile d'olive et du citron."] },
  l29: { time: 25, steps: ["Faites cuire le riz basmati.", "Faites dorer le poulet en lamelles 5 minutes dans un wok.", "Ajoutez les légumes poêlés et faites sauter 5 minutes.", "Ajoutez les noix de cajou concassées, un filet de citron et du gingembre, puis servez sur le riz.", "Terminez par le yaourt nature en dessert."] },
  l30: { time: 25, steps: ["Faites cuire le riz basmati.", "Faites griller le poulet 5 à 6 minutes de chaque côté avec l'huile d'olive.", "Réchauffez la ratatouille.", "Servez ensemble."] },
  l31: { time: 30, steps: ["Faites cuire le riz complet.", "Faites cuire les carottes en rondelles 12 minutes à la vapeur.", "Réchauffez les lentilles cuites avec un filet d'huile d'olive, du cumin et du poivre.", "Mélangez le tout."] },

  // Dîners
  d1: { time: 35, steps: ["Coupez la patate douce en cubes et faites-la rôtir 25 minutes à 200 °C.", "Déposez le cabillaud sur une feuille de papier cuisson avec un filet d'huile d'olive et du citron.", "Enfournez le poisson 12 minutes.", "Faites cuire le brocoli 6 minutes à la vapeur.", "Terminez par le fromage blanc en dessert."] },
  d2: { time: 25, steps: ["Faites cuire le riz basmati.", "Poêlez le saumon 4 minutes de chaque côté avec l'huile d'olive.", "Faites tomber les épinards à la poêle 3 minutes avec de l'ail.", "Servez ensemble.", "Terminez par le fromage blanc en dessert."] },
  d3: { time: 20, steps: ["Réchauffez la soupe de légumes.", "Battez les œufs avec des herbes et faites cuire l'omelette 3 minutes à la poêle avec l'huile d'olive.", "Servez avec le pain complet."] },
  d4: { time: 30, steps: ["Faites cuire le riz basmati.", "Faites chauffer l'huile avec du curcuma, du cumin et du gingembre.", "Ajoutez les lentilles, la sauce tomate et les épinards, puis laissez mijoter 10 minutes.", "Servez sur le riz."] },
  d5: { time: 25, steps: ["Faites cuire les pâtes 8 à 9 minutes, bien al dente.", "Faites griller le poulet 5 à 6 minutes de chaque côté.", "Faites sauter les courgettes en rondelles 6 minutes dans l'huile d'olive.", "Servez ensemble.", "Terminez par le fromage blanc en dessert."] },
  d6: { time: 25, steps: ["Faites cuire les pommes de terre à la vapeur 20 minutes.", "Égouttez les sardines et réchauffez-les à la poêle 2 minutes.", "Servez avec la salade assaisonnée à l'huile d'olive et au citron."] },
  d7: { time: 25, steps: ["Faites cuire le riz basmati.", "Coupez le tofu en cubes et faites-le dorer 6 minutes dans l'huile d'olive.", "Ajoutez les légumes poêlés et faites sauter 5 minutes.", "Relevez avec de la sauce soja et du gingembre, puis servez sur le riz."] },
  d8: { time: 30, steps: ["Faites cuire les pommes de terre à la vapeur 20 minutes.", "Faites cuire les haricots verts 8 minutes.", "Poêlez la dinde 4 à 5 minutes de chaque côté avec l'huile d'olive.", "Servez ensemble.", "Terminez par le fromage blanc en dessert."] },
  d9: { time: 15, steps: ["Égouttez et rincez les pois chiches.", "Coupez les tomates et le concombre en dés.", "Mélangez avec le chèvre frais émietté.", "Assaisonnez avec l'huile d'olive, du citron et des herbes."] },
  d10: { time: 30, steps: ["Faites cuire le riz complet.", "Réchauffez la ratatouille.", "Faites cuire les œufs au plat dans l'huile d'olive 3 minutes.", "Servez les œufs sur la ratatouille et le riz."] },
  d11: { time: 20, steps: ["Réchauffez la pizza au four 10 minutes à 200 °C.", "Préparez la salade avec l'huile d'olive et du vinaigre.", "Servez ensemble."] },
  d12: { time: 30, steps: ["Faites cuire les pommes de terre à la vapeur 20 minutes.", "Faites revenir les légumes poêlés 8 minutes.", "Faites cuire le steak haché 3 à 4 minutes de chaque côté.", "Servez ensemble."] },
  d13: { time: 30, steps: ["Faites cuire les pommes de terre à la vapeur 20 minutes.", "Déposez le maquereau sur une plaque avec l'huile d'olive et du citron, enfournez 12 minutes à 200 °C.", "Faites cuire le brocoli 6 minutes à la vapeur.", "Terminez par le fromage blanc en dessert."] },
  d14: { time: 35, steps: ["Faites cuire le riz complet.", "Faites revenir les lentilles avec la sauce tomate, la ratatouille, du paprika et du cumin.", "Laissez mijoter 15 minutes.", "Servez sur le riz."] },
  d15: { time: 25, steps: ["Faites cuire le riz complet.", "Faites revenir les courgettes en rondelles 6 minutes dans l'huile d'olive avec de l'ail.", "Ajoutez les crevettes et faites-les sauter 3 à 4 minutes.", "Servez sur le riz avec un filet de citron."] },
  d16: { time: 15, steps: ["Réchauffez la soupe de légumes.", "Faites cuire les œufs 6 minutes dans l'eau bouillante, écalez-les.", "Servez la soupe avec les œufs mollets et le pain complet."] },
  d17: { time: 40, steps: ["Faites rôtir le poulet en morceaux avec le chou-fleur en bouquets 25 minutes à 200 °C, avec l'huile d'olive.", "Faites cuire les pommes de terre à la vapeur 20 minutes.", "Servez ensemble.", "Terminez par le fromage blanc en dessert."] },
  d18: { time: 35, steps: ["Faites cuire le riz complet.", "Faites cuire les carottes en rondelles 12 minutes à la vapeur.", "Faites dorer le filet de porc 12 minutes à la poêle, jusqu'à ce qu'il ne soit plus rosé.", "Servez en tranches avec le riz et les carottes.", "Terminez par le fromage blanc en dessert."] },
  d19: { time: 30, steps: ["Faites cuire les pommes de terre à la vapeur 20 minutes.", "Faites cuire les petits pois 5 minutes.", "Poêlez le saumon 4 minutes de chaque côté avec l'huile d'olive.", "Servez ensemble.", "Terminez par le fromage blanc en dessert."] },
  d20: { time: 30, steps: ["Faites cuire le riz basmati.", "Faites revenir les poivrons en lanières 6 minutes dans l'huile d'olive.", "Ajoutez la sauce tomate et les haricots blancs, laissez mijoter 10 minutes avec du thym.", "Servez sur le riz."] },
  d21: { time: 25, steps: ["Faites revenir les légumes poêlés 8 minutes dans l'huile d'olive.", "Réchauffez les lentilles et ajoutez-les.", "Faites cuire l'œuf au plat 3 minutes.", "Servez l'œuf sur les lentilles et les légumes."] },
  d22: { time: 25, steps: ["Faites cuire le riz complet.", "Coupez le tofu en cubes et faites-le dorer 6 minutes dans l'huile d'olive.", "Ajoutez les poivrons en lanières et cuisez 6 minutes.", "Servez sur le riz avec un peu de sauce soja."] },
  d23: { time: 45, steps: ["Coupez les aubergines en deux et creusez-les, en gardant la chair.", "Faites revenir la dinde coupée en petits dés avec la chair, la sauce tomate et des herbes, 10 minutes.", "Remplissez les aubergines et enfournez 25 minutes à 200 °C.", "Servez avec le couscous complet réhydraté."] },
  d24: { time: 25, steps: ["Faites cuire les pommes de terre à la vapeur 20 minutes.", "Faites fondre les poireaux émincés 8 minutes dans l'huile d'olive.", "Battez les œufs, versez-les sur les poireaux et laissez cuire 4 minutes.", "Servez avec les pommes de terre.", "Terminez par le fromage blanc en dessert."] },
  d25: { time: 30, steps: ["Faites cuire le chou-fleur en bouquets 12 minutes dans de l'eau bouillante.", "Ajoutez les lentilles cuites et mixez avec un peu d'eau de cuisson et l'huile d'olive pour obtenir un velouté.", "Servez avec le pain complet."] },
  d26: { time: 30, steps: ["Faites cuire le riz basmati.", "Faites fondre les poireaux en rondelles 8 minutes dans l'huile d'olive.", "Déposez le cabillaud dessus, couvrez et laissez cuire 8 minutes à feu doux.", "Servez sur le riz."] },
  d27: { time: 30, steps: ["Coupez la patate douce en cubes et faites-la rôtir 25 minutes à 200 °C.", "Faites griller la dinde 5 à 6 minutes de chaque côté.", "Faites sauter les courgettes 6 minutes dans l'huile d'olive.", "Servez ensemble."] },
  d28: { time: 25, steps: ["Faites cuire le riz basmati.", "Faites cuire les haricots verts 8 minutes à l'eau bouillante.", "Faites cuire le steak haché 4 minutes de chaque côté, jusqu'à ce qu'il ne soit plus rosé.", "Servez avec un filet d'huile d'olive."] },
  d29: { time: 30, steps: ["Faites cuire le riz complet.", "Faites revenir les légumes dans l'huile d'olive 8 minutes.", "Ajoutez les lentilles cuites et réchauffez 5 minutes avec du cumin.", "Servez sur le riz."] },

  // Collations
  s1: { time: 2, steps: ["Croquez la pomme avec une poignée d'amandes."] },
  s2: { time: 3, steps: ["Versez le yaourt dans un bol.", "Ajoutez les fruits rouges."] },
  s3: { time: 2, steps: ["Coupez la poire en quartiers et dégustez-la avec le chocolat noir."] },
  s4: { time: 3, steps: ["Versez le fromage blanc dans un bol.", "Ajoutez le kiwi coupé en morceaux."] },
  s5: { time: 2, steps: ["Pelez les clémentines et dégustez-les avec les noix."] },
  s6: { time: 3, steps: ["Coupez la banane en rondelles.", "Servez-la avec le yaourt au soja."] },
  s7: { time: 3, steps: ["Faites griller le pain complet.", "Servez avec la compote."] },
  s8: { time: 2, steps: ["Servez les biscuits avec le jus d'orange. Plaisir à garder occasionnel."] },
  s9: { time: 2, steps: ["Croquez la pomme avec les noix."] },
  s10: { time: 12, steps: ["Faites cuire l'œuf 9 minutes dans l'eau bouillante et écalez-le.", "Servez avec des tomates cerises."] },
  s11: { time: 3, steps: ["Versez le yaourt dans un bol.", "Ajoutez les noix concassées."] },
  s12: { time: 5, steps: ["Coupez les carottes en bâtonnets.", "Servez avec le chèvre frais à tartiner."] },
  s13: { time: 2, steps: ["Servez la compote avec les amandes."] },
  s14: { time: 2, steps: ["Pelez l'orange et dégustez-la avec les amandes."] },
  s15: { time: 2, steps: ["Dégustez la banane avec le chocolat noir."] },
  s16: { time: 5, steps: ["Faites griller le pain complet.", "Garnissez de tomate en rondelles et de mozzarella.", "Poivrez et ajoutez un filet d'huile d'olive si vous le souhaitez."] },
  s17: { time: 2, steps: ["Dégustez la banane et la pomme."] },
  s18: { time: 5, steps: ["Coupez la carotte et le concombre en bâtonnets."] },
  s19: { time: 2, steps: ["Versez la compote dans un bol et dégustez avec les clémentines."] },
  s20: { time: 2, steps: ["Pelez l'orange et dégustez-la avec la pomme."] }
};


// Apports suivis dans l'appli, avec leur sens : "min" = viser au moins le repère, "max" = ne pas dépasser.
const PLAN_NUTRIENT_DEFS = [
  { key: "p", label: "Protéines", unit: "g", dir: "min", digits: 0 },
  { key: "fi", label: "Fibres", unit: "g", dir: "min", digits: 0 },
  { key: "sf", label: "Graisses saturées", unit: "g", dir: "max", digits: 0 },
  { key: "sel", label: "Sel", unit: "g", dir: "max", digits: 1 },
  { key: "ca", label: "Calcium", unit: "mg", dir: "min", digits: 0 },
  { key: "fe", label: "Fer", unit: "mg", dir: "min", digits: 1 },
  { key: "vc", label: "Vitamine C", unit: "mg", dir: "min", digits: 0 }
];

function planRoundNutrition(total) {
  const digits = { p: 1, c: 1, s: 1, f: 1, sf: 1, fi: 1, sel: 2, ca: 0, fe: 1, vc: 0 };
  const rounded = {};
  PLAN_NUTRIENT_KEYS.forEach((key) => {
    const factor = 10 ** digits[key];
    rounded[key] = Math.round((total[key] || 0) * factor) / factor;
  });
  return rounded;
}

function planMealNutrition(items) {
  const total = {};
  PLAN_NUTRIENT_KEYS.forEach((key) => { total[key] = 0; });
  items.forEach((item) => {
    const values = PLAN_NUTRITION[item.food];
    PLAN_NUTRIENT_KEYS.forEach((key, index) => { total[key] += (values[index] * item.grams) / 100; });
  });
  return planRoundNutrition(total);
}

function planSumNutrition(list) {
  const total = {};
  PLAN_NUTRIENT_KEYS.forEach((key) => { total[key] = 0; });
  list.forEach((nut) => PLAN_NUTRIENT_KEYS.forEach((key) => { total[key] += Number(nut?.[key] || 0); }));
  return planRoundNutrition(total);
}

// Repères journaliers adaptés à la personne (poids, objectif, sexe, âge, problèmes de santé).
const PLAN_CALCIUM_REF = 950;

// Densités visées (pour 100 kcal) d'après les repères de la journée.
function planSteerNeeds(targets, kcal) {
  return {
    ca: (targets.ca / kcal) * 100,
    p: Math.min((targets.p / kcal) * 100, 6.25),
    sf: (targets.sf / kcal) * 100
  };
}

function planNutritionTargets(profile, answers) {
  const weight = Number(profile.weight) || 70;
  // Sous traitement type Wegovy : au moins 1,2 g de protéines par kg pour limiter la perte de muscle.
  const proteinFactor = profile.goal === "muscle" ? 1.6 : profile.goal === "lose" || profile.goal === "cut" || answers.glp1 ? 1.2 : 0.83;
  const satShare = answers.health.trig || answers.health.chol ? 0.07 : 0.1;
  return {
    p: Math.round(weight * proteinFactor),
    fi: 30,
    sf: Math.round((planTarget(profile).value * satShare) / 9),
    sel: answers.health.tension ? 5 : 6,
    ca: PLAN_CALCIUM_REF,
    fe: 11,
    vc: 110
  };
}

function planNutrientStatus(dir, value, target) {
  if (dir === "max") return value <= target ? "ok" : value <= target * 1.2 ? "near" : "high";
  const ratio = value / target;
  return ratio >= 0.9 ? "ok" : ratio >= 0.7 ? "near" : "low";
}

function planNutrientRows(nut, targets) {
  return PLAN_NUTRIENT_DEFS.map((def) => ({
    ...def,
    value: Number(nut[def.key] || 0),
    target: targets[def.key],
    status: planNutrientStatus(def.dir, Number(nut[def.key] || 0), targets[def.key])
  }));
}

function planAverageNutrition(days) {
  const total = planSumNutrition(days.map((day) => day.nut));
  const average = {};
  PLAN_NUTRIENT_KEYS.forEach((key) => { average[key] = total[key] / days.length; });
  return planRoundNutrition(average);
}

/* ------------------------------------------------------------------ */
/* Aliments non aimés                                                  */
/* ------------------------------------------------------------------ */

// Choix proposés dans le questionnaire (cases à cocher).
const PLAN_DISLIKE_CHOICES = [
  { key: "poulet", label: "Poulet", foods: ["poulet"] },
  { key: "dinde", label: "Dinde", foods: ["dinde"] },
  { key: "boeuf", label: "Bœuf haché", foods: ["boeufH"] },
  { key: "saumon", label: "Saumon", foods: ["saumon"] },
  { key: "maquereau", label: "Maquereau, sardines", foods: ["maquereau", "sardine"] },
  { key: "thon", label: "Thon", foods: ["thon"] },
  { key: "crevettes", label: "Crevettes", foods: ["crevettes"] },
  { key: "porc", label: "Porc", foods: ["porc"] },
  { key: "cabillaud", label: "Cabillaud", foods: ["cabillaud"] },
  { key: "oeufs", label: "Œufs", foods: ["oeuf"] },
  { key: "tofu", label: "Tofu", foods: ["tofu"] },
  { key: "lentilles", label: "Lentilles", foods: ["lentilles"] },
  { key: "poischiches", label: "Pois chiches", foods: ["poischiches"] },
  { key: "harRouges", label: "Haricots rouges", foods: ["harRouges"] },
  { key: "harBlancs", label: "Haricots blancs", foods: ["harBlancs"] },
  { key: "brocoli", label: "Brocoli", foods: ["brocoli"] },
  { key: "epinards", label: "Épinards", foods: ["epinards"] },
  { key: "champignons", label: "Champignons", foods: ["champignons"] },
  { key: "courgette", label: "Courgettes", foods: ["courgette"] },
  { key: "ratatouille", label: "Ratatouille", foods: ["ratatouille"] },
  { key: "poivron", label: "Poivrons", foods: ["poivron", "ratatouille"] },
  { key: "aubergine", label: "Aubergines", foods: ["aubergine", "ratatouille"] },
  { key: "chouFleur", label: "Chou-fleur", foods: ["chouFleur"] },
  { key: "potimarron", label: "Potimarron", foods: ["potimarron"] },
  { key: "petitsPois", label: "Petits pois", foods: ["petitsPois"] },
  { key: "avocat", label: "Avocat", foods: ["avocat"] },
  { key: "quinoa", label: "Quinoa", foods: ["quinoa"] },
  { key: "rizC", label: "Riz complet", foods: ["rizC"] },
  { key: "sarrasin", label: "Sarrasin", foods: ["sarrasin"] },
  { key: "boulgour", label: "Boulgour", foods: ["boulgour"] },
  { key: "patate", label: "Patate douce", foods: ["patate"] },
  { key: "chevre", label: "Fromage de chèvre", foods: ["chevre"] },
  { key: "fetaMozza", label: "Feta, mozzarella", foods: ["feta", "mozzarella"] },
  { key: "laitages", label: "Yaourt, skyr, fromage blanc", foods: ["yaourt", "skyr", "fromageBlanc"] },
  { key: "avoine", label: "Flocons d'avoine", foods: ["avoine"] },
  { key: "oleagineux", label: "Noix, amandes", foods: ["noix", "amandes"] },
  { key: "graines", label: "Graines de courge", foods: ["grainesCourge"] }
];

function planFoodIds(predicate) {
  return Object.keys(PLAN_FOODS).filter((id) => predicate(PLAN_FOODS[id]));
}

// Mots génériques que l'on peut taper dans le champ libre.
const PLAN_DISLIKE_GROUPS = {
  poisson: () => planFoodIds((food) => food.t === "fish"),
  viande: () => planFoodIds((food) => food.t === "meat"),
  charcuterie: () => ["jambon"],
  fromage: () => ["emmental", "chevre", "feta", "mozzarella", "pizza"],
  laitage: () => planFoodIds((food) => food.a.includes("lait")),
  "produit laitier": () => planFoodIds((food) => food.a.includes("lait")),
  legumineuse: () => ["lentilles", "poischiches", "harRouges", "harBlancs"],
  soja: () => planFoodIds((food) => food.a.includes("soja")),
  "fruit a coque": () => planFoodIds((food) => food.a.includes("fruitscoque")),
  oleagineux: () => planFoodIds((food) => food.a.includes("fruitscoque")),
  poivron: () => ["ratatouille", "poivron"],
  aubergine: () => ["ratatouille", "aubergine"],
  crustace: () => ["crevettes"],
  "fruit de mer": () => ["crevettes"]
};

const PLAN_STOP_WORDS = ["de", "du", "des", "la", "le", "les", "au", "aux", "un", "une", "d", "l"];

function planNormalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function planSingular(word) {
  return word.length > 3 ? word.replace(/[sx]$/, "") : word;
}

function planFindSequence(haystack, needle) {
  for (let start = 0; start + needle.length <= haystack.length; start += 1) {
    if (needle.every((word, offset) => haystack[start + offset] === word)) return start;
  }
  return -1;
}

// Cherche dans la liste d'aliments ceux qui correspondent au texte tapé (séparé par virgules ou "et").
// Retourne { foods: [ids], unknown: [mots non reconnus] }.
function planMatchDislikeText(text) {
  const foods = new Set();
  const unknown = [];

  String(text || "")
    .split(/[,;\n]| et /i)
    .map((raw) => raw.trim())
    .filter(Boolean)
    .forEach((raw) => {
      const words = planNormalizeText(raw).split(" ").map(planSingular);
      const meaningful = words.filter((word) => !PLAN_STOP_WORDS.includes(word));
      if (!meaningful.length || meaningful.join("").length < 3) return;

      const key = meaningful.join(" ");
      const found = new Set(PLAN_DISLIKE_GROUPS[key] ? PLAN_DISLIKE_GROUPS[key]() : []);

      Object.keys(PLAN_FOODS).forEach((id) => {
        if (id === "huileO" || id === "huileC") return;
        const nameWords = planNormalizeText(PLAN_FOODS[id].n).split(" ").map(planSingular);
        if (planFindSequence(nameWords, words) === -1) return;
        if (key === "pomme" && nameWords.includes("terre")) return;
        found.add(id);
      });

      if (found.size) found.forEach((id) => foods.add(id));
      else unknown.push(raw);
    });

  return { foods: [...foods], unknown };
}

/* ------------------------------------------------------------------ */
/* Remplacement de repas par un repas proche                           */
/* ------------------------------------------------------------------ */

const PLAN_PROTEIN_GROUP = {
  poulet: "volaille", dinde: "volaille", boeufH: "viande", porc: "viande", jambon: "charcuterie", crevettes: "poisson",
  saumon: "poissonGras", maquereau: "poissonGras", sardine: "poissonGras", thon: "poisson", cabillaud: "poisson",
  oeuf: "oeuf", tofu: "soja", lentilles: "legumineuse", poischiches: "legumineuse", harRouges: "legumineuse", harBlancs: "legumineuse",
  chevre: "fromage", comte: "fromage", emmental: "fromage", feta: "fromage", mozzarella: "fromage", yaourt: "laitage", skyr: "laitage", fromageBlanc: "laitage"
};

const PLAN_GROUP_FAMILY = {
  volaille: "viande", viande: "viande", charcuterie: "viande",
  poissonGras: "poisson", poisson: "poisson",
  oeuf: "vegetal", soja: "vegetal", legumineuse: "vegetal",
  fromage: "laitage", laitage: "laitage"
};

function planMealDef(mealId) {
  return PLAN_MEALS.find((meal) => meal.id === mealId);
}

function planMainGroup(meal) {
  for (const [foodId] of meal.items) {
    if (PLAN_PROTEIN_GROUP[foodId]) return PLAN_PROTEIN_GROUP[foodId];
  }
  return null;
}

// Plus le score est haut, plus les deux repas se ressemblent (aliments communs, même source de protéines, mêmes tags).
function planSimilarity(a, b) {
  const foodsA = new Set(a.items.map(([foodId]) => foodId));
  let score = b.items.filter(([foodId]) => foodsA.has(foodId)).length;
  const groupA = planMainGroup(a);
  const groupB = planMainGroup(b);
  if (groupA && groupA === groupB) score += 3;
  else if (groupA && groupB && PLAN_GROUP_FAMILY[groupA] === PLAN_GROUP_FAMILY[groupB]) score += 2;
  score += b.tags.filter((tag) => a.tags.includes(tag)).length;
  return score;
}

// Remplace un repas du plan par le repas compatible le plus proche. Retourne le nouveau repas, ou null.
function planSwapMeal(plan, dayIndex, mealIndex, answers, random) {
  const day = plan.days[dayIndex];
  const current = day && day.meals[mealIndex];
  if (!current) return null;

  const currentDef = planMealDef(current.mealId);
  const inDay = new Set(day.meals.map((meal) => meal.mealId));
  const usage = new Map();
  let redMeat = 0;
  let classic = 0;

  plan.days.forEach((otherDay, otherDayIndex) => {
    otherDay.meals.forEach((meal, otherMealIndex) => {
      usage.set(meal.mealId, (usage.get(meal.mealId) || 0) + 1);
      if (otherDayIndex === dayIndex && otherMealIndex === mealIndex) return;
      const def = planMealDef(meal.mealId);
      if (def.tags.includes("redmeat")) redMeat += 1;
      if (planIsClassic(def)) classic += 1;
    });
  });

  const pool = planCandidates(currentDef.slot, answers).filter((meal) => !inDay.has(meal.id));
  if (!pool.length) return null;

  let best = null;
  let bestScore = -Infinity;
  pool.forEach((meal) => {
    let score = planSimilarity(currentDef, meal) - 1.5 * (usage.get(meal.id) || 0) + random() * 0.9;
    if (meal.tags.includes("redmeat") && redMeat >= 1) score -= 4;
    if (planIsClassic(meal) && classic >= 2) score -= 4;
    if (score > bestScore) {
      best = meal;
      bestScore = score;
    }
  });

  const defs = day.meals.map((meal, index) => (index === mealIndex ? best : planMealDef(meal.mealId)));
  plan.days[dayIndex] = planBuildDay(defs, plan.target);
  return best;
}

// Écarte un aliment : tous les repas du plan qui le contiennent sont remplacés par un repas proche.
function planDislikeFood(plan, answers, foodId, random) {
  const next = planNormalizeAnswers({ ...answers, dislikedFoods: [...(answers.dislikedFoods || []), foodId] });
  const changed = [];
  let failed = 0;

  for (let dayIndex = 0; dayIndex < plan.days.length; dayIndex += 1) {
    for (let mealIndex = 0; mealIndex < plan.days[dayIndex].meals.length; mealIndex += 1) {
      const def = planMealDef(plan.days[dayIndex].meals[mealIndex].mealId);
      if (!def.items.some(([id]) => id === foodId)) continue;
      if (planSwapMeal(plan, dayIndex, mealIndex, next, random)) changed.push(`${dayIndex}:${mealIndex}`);
      else failed += 1;
    }
  }

  return { answers: next, changed, replaced: changed.length, failed };
}

/* ------------------------------------------------------------------ */
/* Moteur (fonctions pures)                                            */
/* ------------------------------------------------------------------ */

function planRandom(seed) {
  // Petit générateur pseudo-aléatoire reproductible (mulberry32).
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/*
  Champ libre « santé / traitement » : on reconnaît quelques situations courantes.
  Le texte est comparé sans accents ni majuscules, et une phrase négative (« pas de diabète ») n'est pas retenue.
*/
const PLAN_HEALTH_RULES = [
  { key: "glp1", label: "traitement de type Wegovy : protéines en priorité, pas de rattrapage si vous mangez moins", re: /wegovy|ozempic|mounjaro|saxenda|victoza|trulicity|rybelsus|zepbound|semaglutide|tirzepatide|liraglutide|dulaglutide|glp ?-? ?1/ },
  { key: "pcos", label: "SOPK : repas riches en fibres et pauvres en sucres rapides", re: /sopk|ovaires? polykyst|polykystiques?|pcos/ },
  { key: "trig", label: "triglycérides élevés", re: /triglyc/ },
  { key: "chol", label: "cholestérol élevé", re: /cholest/ },
  { key: "gly", label: "diabète ou glycémie élevée", re: /diab|glycemie|hyperglyc|insulino|resistance a l ?insuline|metformin/ },
  { key: "tension", label: "tension élevée (sel réduit)", re: /tension|hypertens/ },
  { key: "pregnant", label: "grossesse ou allaitement", re: /enceinte|grossesse|allait/, blocking: true },
  { key: "medical", label: "situation médicale particulière", re: /\brein(s)?\b|renal|dialyse|goutte|anorex|boulimi|hyperphag|\btca\b|trouble(s)? (du comportement )?alimentaire|regime (prescrit|medical)|chimio|cancer/, blocking: true },
  { key: "celiac", label: "gluten écarté", re: /coeliaque|sansgluten|intolerance au gluten/ }
];
const PLAN_MEDS_RE = /metformin|gliclazide|diamicron|jardiance|forxiga|januvia|sitagliptin|insuline/;
const PLAN_NEGATION_RE = /\b(pas de|pas d|pas|aucun|aucune|jamais|ni|sans)\b/;
const PLAN_NONE_RE = /^(aucun|aucune|rien|non|nan|ras|neant|r a s|ok|tout va bien|rien a signaler|(je n ai |j ai )?(pas de|pas d|aucun|aucune) .*|-+)$/;

function planFold(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’`]/g, " ")
    .replace(/sans gluten/g, "sansgluten")
    .replace(/\s+/g, " ")
    .trim();
}

function planParseHealth(text) {
  const flags = {};
  const labels = [];
  const unknown = [];
  let meds = false;

  String(text || "")
    .replace(/\br\.\s?a\.\s?s\.?/gi, "aucun")
    .replace(/\bn\s?\/\s?a\b/gi, "aucun")
    .split(/[,;.\n/]+|\s+(?:et|mais)\s+/i)
    .map((clause) => clause.trim())
    .filter(Boolean)
    .forEach((original) => {
      const clause = planFold(original);
      let matched = false;
      PLAN_HEALTH_RULES.forEach((rule) => {
        const hit = rule.re.exec(clause);
        if (!hit) return;
        matched = true;
        // « pas de diabète », « aucun cholestérol » : la phrase est négative, on ne retient rien.
        if (PLAN_NEGATION_RE.test(clause.slice(0, hit.index)) && rule.key !== "celiac") return;
        if (!flags[rule.key]) {
          flags[rule.key] = true;
          if (!rule.blocking) labels.push(rule.label);
        }
      });
      const medsText = clause.replace(/resistance a l ?insuline|insulino ?-? ?resistan\w*/g, "");
      if (PLAN_MEDS_RE.test(medsText) && !PLAN_NEGATION_RE.test(clause.split(PLAN_MEDS_RE)[0])) meds = true;
      if (!matched && !PLAN_NONE_RE.test(clause) && !PLAN_NEGATION_RE.test(clause) && !PLAN_MEDS_RE.test(clause)) {
        unknown.push(original.slice(0, 60));
      }
    });

  flags.meds = meds;
  return { flags, labels, unknown };
}

function planNormalizeAnswers(raw) {
  const answers = raw || {};
  const health = answers.health || {};
  const parsedHealth = planParseHealth(answers.healthText);
  const pf = parsedHealth.flags;
  const trigValue = Number(answers.trigValue);
  const hasTrigValue = Number.isFinite(trigValue) && trigValue > 0;

  const dislikeKeys = (answers.dislikeKeys || []).filter((key) => PLAN_DISLIKE_CHOICES.some((choice) => choice.key === key));
  const dislikeText = String(answers.dislikeText || "").slice(0, 200);
  const dislikedFoods = (answers.dislikedFoods || []).filter((id) => PLAN_FOODS[id]);
  const parsed = planMatchDislikeText(dislikeText);
  const avoid = new Set(dislikedFoods);
  PLAN_DISLIKE_CHOICES.forEach((choice) => {
    if (dislikeKeys.includes(choice.key)) choice.foods.forEach((id) => avoid.add(id));
  });
  parsed.foods.forEach((id) => avoid.add(id));

  return {
    diet: PLAN_DIET_TYPES[answers.diet] !== undefined ? answers.diet : "omni",
    allergies: [...new Set([...(answers.allergies || []), ...(pf.celiac ? ["gluten"] : [])])].filter((key) => PLAN_ALLERGEN_LABELS[key]),
    health: {
      trig: Boolean(health.trig) || Boolean(pf.trig) || (hasTrigValue && trigValue >= 1.5),
      chol: Boolean(health.chol) || Boolean(pf.chol),
      gly: Boolean(health.gly) || Boolean(pf.gly) || Boolean(pf.pcos),
      tension: Boolean(health.tension) || Boolean(pf.tension)
    },
    lunchbox: Boolean(answers.lunchbox),
    month: Number.isInteger(Number(answers.month)) && answers.month >= 1 && answers.month <= 12 ? Number(answers.month) : new Date().getMonth() + 1,
    healthText: String(answers.healthText || "").slice(0, 300),
    healthLabels: parsedHealth.labels,
    unknownHealth: parsedHealth.unknown,
    treatment: Boolean(answers.treatment) || Boolean(answers.treated) || Boolean(pf.glp1) || Boolean(pf.meds),
    glp1: Boolean(answers.glp1) || Boolean(pf.glp1),
    pcos: Boolean(answers.pcos) || Boolean(pf.pcos),
    trigValue: hasTrigValue ? trigValue : null,
    alcohol: ["never", "rare", "regular", "daily"].includes(answers.alcohol) ? answers.alcohol : "never",
    sugarDrinks: ["rare", "sometimes", "often"].includes(answers.sugarDrinks) ? answers.sugarDrinks : "rare",
    snack: answers.snack !== false,
    pregnant: Boolean(answers.pregnant) || Boolean(pf.pregnant),
    // Diabète traité : diabète indiqué + traitement (case cochée, médicament cité ou traitement type Wegovy).
    treated: Boolean(answers.treated) || (Boolean(pf.gly) && (Boolean(answers.treatment) || Boolean(pf.glp1) || Boolean(pf.meds))),
    medical: Boolean(answers.medical) || Boolean(pf.medical),
    dislikeKeys,
    dislikeText,
    dislikedFoods,
    avoid: [...avoid],
    unknownDislikes: parsed.unknown
  };
}

// Saisonnalité (France) : mois pendant lesquels l'aliment frais est de saison.
// Les aliments absents de cette liste sont disponibles toute l'année.
const PLAN_FOOD_SEASON = {
  tomate: [6, 7, 8, 9], concombre: [6, 7, 8, 9], courgette: [6, 7, 8, 9, 10], poivron: [6, 7, 8, 9, 10],
  aubergine: [7, 8, 9, 10], ratatouille: [6, 7, 8, 9, 10], fruitsRouges: [5, 6, 7, 8, 9],
  petitsPois: [4, 5, 6, 7], kiwi: [11, 12, 1, 2, 3, 4], clementine: [11, 12, 1, 2], orange: [12, 1, 2, 3, 4],
  poire: [9, 10, 11, 12, 1, 2], pomme: [9, 10, 11, 12, 1, 2, 3, 4, 5], chouFleur: [10, 11, 12, 1, 2, 3],
  poireau: [9, 10, 11, 12, 1, 2, 3], brocoli: [9, 10, 11, 12, 1, 2, 3], potimarron: [9, 10, 11, 12],
  soupe: [10, 11, 12, 1, 2, 3, 4]
};
const PLAN_MONTH_NAMES = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function planFoodInSeason(foodId, month) {
  const months = PLAN_FOOD_SEASON[foodId];
  return !months || months.includes(month);
}

function planMealInSeason(meal, month) {
  return meal.items.every(([foodId]) => planFoodInSeason(foodId, month));
}

function planCandidates(slot, answers) {
  const allowedTypes = PLAN_DIET_TYPES[answers.diet];
  const avoid = answers.avoid || [];
  const excluded = new Set();
  Object.entries(PLAN_EXCLUDED_TAGS).forEach(([condition, tags]) => {
    if (answers.health[condition]) tags.forEach((tag) => excluded.add(tag));
  });

  const list = PLAN_MEALS.filter((meal) => {
    if (meal.slot !== slot) return false;
    // Repas à base de soja / tofu : réservés à l'alimentation végétalienne (aliments de base pour les autres).
    if (meal.niche && answers.diet !== "vegan") return false;
    // Déjeuner à emporter : uniquement des plats qui se mangent froids ou réchauffés.
    if (slot === "lunch" && answers.lunchbox && !meal.box) return false;
    if (meal.tags.some((tag) => excluded.has(tag))) return false;
    if (avoid.length && meal.items.some(([foodId]) => avoid.includes(foodId))) return false;
    const facts = planMealFacts(meal);
    if (answers.allergies.some((allergen) => facts.allergens.has(allergen))) return false;
    if (allowedTypes && [...facts.types].some((type) => !allowedTypes.includes(type))) return false;
    return true;
  });
  // Fruits et légumes de saison en priorité (si cela laisse assez de choix).
  const month = Number(answers.month) || new Date().getMonth() + 1;
  const seasonal = list.filter((meal) => planMealInSeason(meal, month));
  return seasonal.length >= 6 ? seasonal : list;
}

function planBuildDay(selectedMeals, target) {
  let fixedKcal = 0;
  let scalableKcal = 0;
  selectedMeals.forEach((meal) => {
    meal.items.forEach(([foodId, grams]) => {
      const food = PLAN_FOODS[foodId];
      const kcal = (food.k * grams) / 100;
      if (food.fixed) fixedKcal += kcal;
      else scalableKcal += kcal;
    });
  });

  let factor = scalableKcal > 0 ? (target - fixedKcal) / scalableKcal : 1;
  let best = null;

  // Quelques passes pour compenser les arrondis (œufs, fruits entiers, multiples de 5 g).
  for (let pass = 0; pass < 4; pass += 1) {
    factor = Math.min(2.2, Math.max(0.55, factor));
    const built = selectedMeals.map((meal) => {
      const items = meal.items.map(([foodId, grams]) => planScaleItem(foodId, grams, factor));
      return {
        slot: meal.slot,
        mealId: meal.id,
        name: meal.name,
        tags: meal.tags,
        items,
        kcal: Math.round(items.reduce((sum, item) => sum + item.kcal, 0)),
        nut: planMealNutrition(items)
      };
    });
    const total = built.reduce((sum, meal) => sum + meal.kcal, 0);
    if (!best || Math.abs(total - target) < Math.abs(best.total - target)) best = { built, total };
    if (Math.abs(total - target) <= target * 0.03) break;
    const scaledNow = total - fixedKcal;
    if (scaledNow <= 0) break;
    factor *= (target - fixedKcal) / scaledNow;
  }

  return { meals: best.built, kcal: best.total, nut: planSumNutrition(best.built.map((meal) => meal.nut)) };
}

function planBuildWarnings(answers, targetInfo, calculatedTarget, shortSlots, average, nutAverage, targets, profile) {
  const warnings = [];
  const { health } = answers;
  const hasCondition = health.trig || health.chol || health.gly || health.tension;
  const fmt = (value) => value.toLocaleString("fr-FR");

  if (hasCondition) {
    warnings.push("Vous avez indiqué un problème de santé : parlez de ce plan avec votre médecin ou un diététicien avant de changer votre alimentation.");
  }
  if (answers.glp1) {
    warnings.push("Traitement de type Wegovy / Ozempic : l'appétit baisse souvent. Votre objectif calorique est un repère, pas une obligation : ne vous forcez pas à tout manger. Priorité aux protéines (au moins 1,2 g par kg de poids, réparties sur les repas), aux légumes, à l'eau et au renforcement musculaire. Si vous mangez très peu, avez des nausées ou perdez du poids très vite, parlez-en à votre médecin ou à un diététicien.");
  } else if (answers.treatment) {
    warnings.push("Vous suivez un traitement : certains médicaments modifient l'appétit, le poids ou la glycémie. Montrez ce plan à votre médecin avant de le suivre.");
  }
  if (answers.healthLabels && answers.healthLabels.length) {
    warnings.push(`Pris en compte dans ce plan : ${answers.healthLabels.join(" ; ")}.`);
  }
  if (answers.unknownHealth && answers.unknownHealth.length) {
    warnings.push(`Je n'ai pas de règle dédiée pour : ${answers.unknownHealth.join(", ")}. Le plan reste général : parlez-en à votre médecin ou à un diététicien.`);
  }
  if (answers.trigValue !== null) {
    warnings.push(
      answers.trigValue >= 1.5
        ? `Triglycérides indiqués : ${fmt(answers.trigValue)} g/L (la valeur normale est inférieure à 1,5 g/L). Un contrôle médical reste nécessaire.`
        : `Triglycérides indiqués : ${fmt(answers.trigValue)} g/L (inférieur à 1,5 g/L).`
    );
  }
  if (health.gly && answers.treated) {
    warnings.push("Votre traitement peut demander d'adapter les doses quand vos repas changent. Demandez l'avis de votre médecin avant de suivre ce plan.");
  }
  if (answers.diet === "vegan") {
    warnings.push("Alimentation végétalienne : la vitamine B12 n'existe pas dans les végétaux. Une supplémentation est nécessaire, demandez conseil à votre médecin.");
  }
  if (targetInfo.floorApplied) {
    warnings.push(`Par sécurité, l'objectif est d'au moins ${fmt(targetInfo.value)} kcal par jour (votre profil indiquait ${fmt(calculatedTarget)} kcal).`);
  }
  if (average < targetInfo.value * 0.95) {
    warnings.push(`Le plan reste un peu sous votre objectif (environ ${fmt(average)} kcal par jour). Si vous avez faim, ajoutez des féculents complets, un fruit ou une poignée d'oléagineux.`);
  } else if (average > targetInfo.value * 1.05) {
    warnings.push(`Le plan dépasse un peu votre objectif (environ ${fmt(average)} kcal par jour). Vous pouvez réduire un peu les féculents ou les matières grasses.`);
  }

  // Écarts de nutriments (moyenne sur la semaine).
  if (profile && nutAverage.p < Number(profile.weight) * 0.83) {
    warnings.push("Protéines sous le minimum recommandé (0,83 g par kg de poids) : ajoutez une source de protéines (œuf, laitage, légumineuses, tofu, poisson) à chaque repas, ou demandez conseil à un professionnel.");
  } else if (nutAverage.p < targets.p * 0.85) {
    warnings.push("Protéines un peu basses : ajoutez une source de protéines (œuf, laitage, légumineuses, poisson) à chaque repas.");
  }
  if (nutAverage.fi < targets.fi * 0.8) warnings.push("Fibres un peu basses : ajoutez des légumes, des légumineuses ou un fruit.");
  if (nutAverage.ca < targets.ca * 0.8) warnings.push("Calcium un peu bas : pensez à un produit laitier ou à une boisson végétale enrichie en calcium.");
  if (nutAverage.fe < targets.fe * 0.8) warnings.push("Fer un peu bas : misez sur les légumineuses, les œufs ou la viande maigre, avec un fruit riche en vitamine C.");
  if (nutAverage.sel > targets.sel) warnings.push(`Le sel dépasse le repère de ${fmt(targets.sel)} g par jour (hors sel ajouté à la cuisson) : évitez d'en rajouter.`);
  if (nutAverage.sf > targets.sf * 1.15) warnings.push("Graisses saturées un peu hautes : limitez beurre, fromages et charcuterie.");

  if (profile && profile.sex === "female" && Number(profile.age) < 50) {
    warnings.push("Fer : le repère est de 11 mg par jour, mais certaines femmes (règles abondantes) ont besoin d'environ 16 mg. En cas de fatigue inhabituelle, demandez un bilan à votre médecin.");
  }
  if (answers.diet !== "omni") {
    warnings.push("Le fer des végétaux est moins bien absorbé : associez toujours les légumineuses et les céréales à un aliment riche en vitamine C (poivron, agrumes, kiwi, brocoli).");
  }
  const unknown = (answers.unknownDislikes || []).filter((word) => !planNormalizeText(word).includes("huile"));
  if (unknown.length) {
    warnings.push(`Je ne connais pas ces aliments : ${unknown.join(", ")}. Je n'en propose pas dans le plan.`);
  }
  if ((answers.unknownDislikes || []).length > unknown.length) {
    warnings.push("L'huile ne peut pas être écartée : elle sert à la cuisson et à l'assaisonnement.");
  }
  if (shortSlots.length) {
    warnings.push("Peu de repas sont compatibles avec vos contraintes : certains repas reviennent plus souvent. Vérifiez toujours les étiquettes des produits.");
  }
  warnings.push("Les apports sont des estimations (tables nutritionnelles arrondies, sans sel ajouté). Ce plan est indicatif et ne remplace pas l'avis d'un médecin ou d'un diététicien.");
  return warnings;
}

// Vérifie qu'il existe des repas pour chaque moment de la journée.
function planAnalyze(answers, slots) {
  const candidatesBySlot = {};
  const shortSlots = [];
  for (const slot of slots) {
    candidatesBySlot[slot] = planCandidates(slot, answers);
    if (!candidatesBySlot[slot].length) {
      const label = PLAN_SLOT_LABELS[slot].replace(/^\S+\s/, "").toLowerCase();
      return { error: `Aucun ${label} de ma liste n'est compatible avec toutes vos contraintes${answers.avoid.length ? " et vos aliments écartés" : ""}. Essayez d'en retirer une, ou demandez l'aide d'un diététicien.` };
    }
    if (candidatesBySlot[slot].length < 3) shortSlots.push(slot);
  }

  const fishAllowed = answers.diet === "omni" && !answers.allergies.includes("poisson");
  const fishAvailable = fishAllowed && ["lunch", "dinner"].some((slot) => (candidatesBySlot[slot] || []).some((meal) => meal.tags.includes("omega3")));
  return { candidatesBySlot, shortSlots, fishAllowed, fishAvailable };
}

// Construit l'objet "plan" complet (résumé, conseils, alertes, courses) à partir des 7 jours.
function planAssemble(days, answers, profile, meta) {
  const targetInfo = planTarget(profile);
  const analysis = planAnalyze(answers, meta.slots);
  const shortSlots = analysis.error ? [] : analysis.shortSlots;
  const fishAvailable = analysis.error ? false : analysis.fishAvailable;

  const allMeals = days.flatMap((day) => day.meals);
  const count = (tag) => allMeals.filter((meal) => meal.tags.includes(tag)).length;
  const average = Math.round(days.reduce((sum, day) => sum + day.kcal, 0) / days.length);
  const targets = planNutritionTargets(profile, answers);
  const nutAverage = planAverageNutrition(days);

  return {
    id: `${meta.seed}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
    seed: meta.seed,
    createdAt: meta.createdAt,
    startDate: meta.startDate || null,
    target: targetInfo.value,
    average,
    glp1: Boolean(answers.glp1),
    slots: meta.slots,
    days,
    highlights: { omega3: count("omega3"), fish: count("fish"), legume: count("legume"), wholegrain: count("wholegrain") },
    shopping: planBuildShopping(days),
    tips: planBuildTips(answers, fishAvailable),
    warnings: planBuildWarnings(answers, targetInfo, profile.calculations.target, shortSlots, average, nutAverage, targets, profile),
    targets,
    nutAverage
  };
}

// Recalcule résumé, conseils, alertes et courses après un remplacement de repas.
function planRefresh(plan, rawAnswers, profile) {
  return planAssemble(plan.days, planNormalizeAnswers(rawAnswers), profile, {
    seed: plan.seed,
    slots: plan.slots,
    createdAt: plan.createdAt,
    startDate: plan.startDate
  });
}

// Construit un plan complet. Retourne { error } si aucun repas n'est compatible pour un créneau.
function planBuild(rawAnswers, profile, seed) {
  const answers = planNormalizeAnswers(rawAnswers);
  const targetInfo = planTarget(profile);
  const random = planRandom(seed);
  const slots = answers.snack ? ["breakfast", "lunch", "dinner", "snack"] : ["breakfast", "lunch", "dinner"];

  const analysis = planAnalyze(answers, slots);
  if (analysis.error) return { error: analysis.error };
  const { candidatesBySlot, fishAllowed } = analysis;

  const needsMoreFish = answers.health.trig || answers.health.chol;
  // Poisson prévu : au moins un repas de poisson gras, deux (voire trois) si triglycérides ou cholestérol.
  const fishPlan = {};
  if (fishAllowed) {
    fishPlan["1:dinner"] = "oily";
    fishPlan["4:lunch"] = needsMoreFish ? "oily" : "any";
    if (needsMoreFish) fishPlan["6:dinner"] = "any";
  }

  const context = {
    usage: new Map(),
    lastDay: new Map(),
    redMeat: 0,
    classic: 0,
    fish: 0,
    preferFiber: answers.health.trig || answers.health.chol || answers.health.gly || answers.glp1,
    need: planSteerNeeds(planNutritionTargets(profile, answers), targetInfo.value),
    day: { ca: 0, p: 0, sf: 0 },
    dayKcal: 0
  };

  const days = [];
  for (let dayIndex = 0; dayIndex < PLAN_DAYS; dayIndex += 1) {
    context.day = { ca: 0, p: 0, sf: 0 };
    context.dayKcal = 0;
    const selected = slots.map((slot) => {
      let pool = candidatesBySlot[slot];
      const wanted = fishPlan[`${dayIndex}:${slot}`];
      if (wanted) {
        const fishPool = pool.filter((meal) => (wanted === "oily" ? meal.tags.includes("omega3") : meal.tags.includes("fish")));
        if (fishPool.length) pool = fishPool;
      }
      const meal = planPickMeal(pool, context, random, dayIndex, slot);
      context.usage.set(meal.id, (context.usage.get(meal.id) || 0) + 1);
      context.lastDay.set(meal.id, dayIndex);
      if (meal.tags.includes("redmeat")) context.redMeat += 1;
      if (planIsClassic(meal)) context.classic += 1;
      if (meal.tags.includes("fish")) context.fish += 1;
      const density = planMealDensity(meal);
      context.day.ca += density.ca;
      context.day.p += density.p;
      context.day.sf += density.sf;
      context.dayKcal += density.kcal;
      return meal;
    });
    days.push(planBuildDay(selected, targetInfo.value));
  }

  return {
    plan: planAssemble(days, answers, profile, { seed, slots, createdAt: new Date().toISOString() }),
    answers
  };
}

// Retourne la liste des raisons pour lesquelles un plan chiffré n'est pas proposé.
function planBlockingReasons(answers, profile) {
  const reasons = [];
  if (profile && Number(profile.age) < 18) {
    reasons.push("Avant 18 ans, les besoins changent beaucoup avec la croissance : un plan chiffré doit être établi avec un médecin ou un diététicien.");
  }
  if (answers.pregnant) {
    reasons.push("Pendant la grossesse ou l'allaitement, les besoins sont spécifiques : demandez un plan à votre médecin, votre sage-femme ou un diététicien.");
  }
  if (answers.medical) {
    reasons.push("Maladie des reins, goutte, trouble du comportement alimentaire ou régime prescrit : ces situations demandent un plan établi avec votre médecin ou un diététicien. Ce plan général pourrait ne pas vous convenir.");
  }
  if (answers.trigValue !== null && answers.trigValue >= 5) {
    reasons.push("Des triglycérides à 5 g/L ou plus sont très élevés. Un avis médical est nécessaire dans les meilleurs délais, avant de modifier votre alimentation. Ce plan n'est pas adapté dans ce cas.");
  }
  return reasons;
}

function planTarget(profile) {
  const calculated = profile.calculations.target;
  const floor = profile.sex === "male" ? 1500 : 1200;
  const value = Math.max(calculated, floor);
  return { value, floorApplied: value > calculated };
}

function planMealFacts(meal) {
  const allergens = new Set();
  const types = new Set();
  meal.items.forEach(([foodId]) => {
    const food = PLAN_FOODS[foodId];
    (food.a || []).forEach((allergen) => allergens.add(allergen));
    types.add(food.t);
  });
  return { allergens, types };
}

function planIsClassic(meal) {
  return meal.tags.some((tag) => PLAN_CLASSIC_TAGS.includes(tag));
}

function planScaleItem(foodId, baseGrams, factor) {
  const food = PLAN_FOODS[foodId];
  let grams;
  let label;

  const unit = food.ml ? "ml" : "g";

  if (food.fixed) {
    grams = baseGrams;
    label = `${grams} ${unit}`;
  } else if (food.u) {
    const count = Math.max(1, Math.round((baseGrams * factor) / food.u.g));
    grams = count * food.u.g;
    label = `${count} ${count > 1 ? food.u.many : food.u.one}`;
  } else {
    grams = Math.max(5, Math.round((baseGrams * factor) / 5) * 5);
    label = `${grams} ${unit}`;
  }

  return { food: foodId, name: food.n, grams, label, kcal: (food.k * grams) / 100 };
}

// Densité nutritionnelle d'un repas (pour 100 kcal), avec ses quantités de base : sert à choisir les repas
// qui rapprochent la journée des repères (calcium, protéines) ou qui limitent les graisses saturées.
const planDensityCache = new Map();
function planMealDensity(meal) {
  if (planDensityCache.has(meal.id)) return planDensityCache.get(meal.id);
  const total = { ca: 0, p: 0, sf: 0, kcal: 0 };
  meal.items.forEach(([foodId, grams]) => {
    const values = PLAN_NUTRITION[foodId];
    total.ca += (values[PLAN_NUTRIENT_KEYS.indexOf("ca")] * grams) / 100;
    total.p += (values[PLAN_NUTRIENT_KEYS.indexOf("p")] * grams) / 100;
    total.sf += (values[PLAN_NUTRIENT_KEYS.indexOf("sf")] * grams) / 100;
    total.kcal += (PLAN_FOODS[foodId].k * grams) / 100;
  });
  const per100 = (value) => (total.kcal ? (value / total.kcal) * 100 : 0);
  const result = { ...total, d: { ca: per100(total.ca), p: per100(total.p), sf: per100(total.sf) } };
  planDensityCache.set(meal.id, result);
  return result;
}

function planPickMeal(candidates, context, random, dayIndex, slot) {
  let pool = candidates.filter((meal) => {
    if (meal.tags.includes("redmeat") && context.redMeat >= 1) return false;
    if (planIsClassic(meal) && context.classic >= 2) return false;
    if (meal.tags.includes("fish") && context.fish >= 4) return false;
    return true;
  });
  if (!pool.length) pool = candidates;

  const weights = pool.map((meal) => {
    let weight = 1 / (1 + (context.usage.get(meal.id) || 0) * 2);
    const lastDay = context.lastDay.get(meal.id);
    if (lastDay !== undefined && dayIndex - lastDay < 3) weight *= 0.05;
    if (context.preferFiber && slot !== "breakfast" && slot !== "snack") {
      if (meal.tags.includes("legume")) weight *= 2;
      if (meal.tags.includes("wholegrain")) weight *= 1.5;
    }
    if (planIsClassic(meal)) weight *= 0.4;
    if (meal.tags.includes("redmeat")) weight *= 0.5;
    if (context.need) {
      const density = planMealDensity(meal).d;
      const so = context.dayKcal > 0 ? context.dayKcal / 100 : 0;
      const behind = (key) => so > 0 && context.day[key] / so < context.need[key];
      // Calcium et protéines : on favorise les repas assez riches pour atteindre le repère de la journée.
      weight *= Math.pow(planClamp(density.ca / context.need.ca, 0.3, 3), behind("ca") ? 2.5 : 1.5);
      weight *= Math.pow(planClamp(density.p / context.need.p, 0.5, 2), behind("p") ? 1.5 : 0.8);
      // Graisses saturées : on évite les repas qui dépassent la densité autorisée.
      if (density.sf > 0) weight *= Math.pow(planClamp(context.need.sf / density.sf, 0.3, 1.3), 1.5);
    }
    return weight;
  });

  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = random() * total;
  for (let index = 0; index < pool.length; index += 1) {
    roll -= weights[index];
    if (roll <= 0) return pool[index];
  }
  return pool[pool.length - 1];
}

function planBuildTips(answers, fishAllowed) {
  const tips = [];
  const { health } = answers;
  const nutsOk = !answers.allergies.includes("fruitscoque");

  if (health.trig) {
    tips.push(
      answers.sugarDrinks === "often"
        ? "Boissons sucrées et jus de fruits : c'est sans doute votre premier levier. Remplacez-les par de l'eau, du thé ou du café sans sucre."
        : "Limitez les boissons sucrées, les jus de fruits, les sucreries et les pâtisseries : le sucre fait monter les triglycérides."
    );
    if (answers.alcohol === "regular" || answers.alcohol === "daily") {
      tips.push("L'alcool fait monter les triglycérides. Le réduire nettement est souvent très efficace : parlez-en à votre médecin.");
    } else if (answers.alcohol === "rare") {
      tips.push("Gardez l'alcool occasionnel et en petite quantité : il fait monter les triglycérides.");
    }
    tips.push(
      fishAllowed
        ? "Poissons gras (saumon, maquereau, sardines) deux fois par semaine pour les oméga-3 : le plan en prévoit."
        : `Sans poisson, misez sur les oméga-3 végétaux : ${nutsOk ? "noix, " : ""}huile de colza en assaisonnement (le plan utilise surtout de l'huile d'olive).`
    );
    tips.push("30 minutes de marche rapide presque tous les jours aident à faire baisser les triglycérides. En cas de surpoids, perdre 5 à 10 % de son poids aide aussi.");
  }

  if (health.chol) {
    tips.push("Privilégiez les fibres : avoine, légumineuses, légumes et fruits. Elles aident à réduire le cholestérol.");
    tips.push("Limitez beurre, charcuterie, fromages gras et viennoiseries. Préférez l'huile d'olive.");
    if (nutsOk) tips.push("Une petite poignée de noix ou d'amandes par jour peut vous aider.");
  }

  if (health.gly) {
    tips.push("Choisissez des féculents complets et des légumineuses. Associez toujours des légumes et une source de protéines au repas.");
    tips.push("Évitez de sauter des repas et de grignoter des produits sucrés entre les repas.");
  }

  tips.push(`Plan de saison (${PLAN_MONTH_NAMES[(answers.month || 1) - 1]}) : les repas utilisent des fruits et légumes de saison, meilleurs et moins chers. Recréez votre plan au changement de saison.`);

  if (answers.lunchbox) {
    tips.push("Déjeuners à emporter : tous se mangent froids ou réchauffés au micro-ondes. Préparez-les la veille au soir, ou cuisinez le dîner en double portion.");
  }

  if (answers.glp1) {
    tips.push("Répartissez les protéines sur vos repas et mangez-les en premier : elles protègent vos muscles pendant la perte de poids.");
    tips.push("Mangez lentement et en petites quantités. Buvez de l'eau régulièrement et gardez des fibres (légumes, légumineuses, céréales complètes).");
    tips.push("Ajoutez du renforcement musculaire (avec l'accord de votre médecin) : c'est ce qui limite le plus la perte de muscle.");
  }

  if (answers.pcos) {
    tips.push("SOPK : il n'existe pas de régime miracle. Une alimentation équilibrée, riche en fibres, avec peu de sucres rapides, et une activité régulière aident. Une perte de poids modérée (5 à 10 %) peut améliorer les symptômes.");
  }

  if (health.tension) {
    tips.push("Limitez le sel (moins de 5 g par jour) : évitez charcuterie, plats préparés et biscuits apéritifs. Relevez vos plats avec herbes et épices.");
    tips.push("Mangez des fruits et des légumes à chaque repas : ils apportent du potassium.");
  }

  if (!health.trig && !health.chol && !health.gly && !health.tension) {
    tips.push("Ce plan équilibré privilégie légumes, féculents complets, légumineuses et poisson deux fois par semaine.");
  }

  tips.push("Buvez de l'eau tout au long de la journée. Si vous avez encore faim, ajoutez des légumes ou un fruit.");
  return tips;
}

function planBuildShopping(days) {
  const totals = new Map();
  days.forEach((day) => {
    day.meals.forEach((meal) => {
      meal.items.forEach((item) => {
        const entry = totals.get(item.food) || { name: item.name, grams: 0 };
        entry.grams += item.grams;
        totals.set(item.food, entry);
      });
    });
  });

  return [...totals.entries()]
    .map(([foodId, entry]) => {
      const food = PLAN_FOODS[foodId];
      let label = `${Math.round(entry.grams)} ${food.ml ? "ml" : "g"}`;
      if (food.u) {
        const count = Math.round(entry.grams / food.u.g);
        label = `${count} ${count > 1 ? food.u.many : food.u.one}`;
      }
      return { name: entry.name, label };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/* ------------------------------------------------------------------ */
/* Rééquilibrage de la journée                                         */
/* ------------------------------------------------------------------ */

function planClamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Recalcule les quantités d'un repas du plan pour viser un nombre de calories.
function planFitMeal(meal, targetKcal) {
  let fixedKcal = 0;
  let scalableKcal = 0;
  meal.items.forEach((item) => {
    const food = PLAN_FOODS[item.food];
    const kcal = (food.k * item.grams) / 100;
    if (food.fixed) fixedKcal += kcal;
    else scalableKcal += kcal;
  });

  let factor = scalableKcal > 0 ? (targetKcal - fixedKcal) / scalableKcal : 1;
  let best = null;
  for (let pass = 0; pass < 4; pass += 1) {
    factor = planClamp(factor, 0.3, 2.5);
    const items = meal.items.map((item) => planScaleItem(item.food, item.grams, factor));
    const kcal = Math.round(items.reduce((sum, item) => sum + item.kcal, 0));
    if (!best || Math.abs(kcal - targetKcal) < Math.abs(best.kcal - targetKcal)) best = { items, kcal };
    if (Math.abs(kcal - targetKcal) <= targetKcal * 0.03) break;
    const scaledNow = kcal - fixedKcal;
    if (scaledNow <= 0) break;
    factor *= (targetKcal - fixedKcal) / scaledNow;
  }

  return { ...meal, items: best.items, kcal: best.kcal, nut: planMealNutrition(best.items) };
}

/*
  Équivalences : 200 g de pâtes cuites et 200 g de riz cuit n'ont pas les mêmes calories (150 et 130 kcal / 100 g).
  Pour remplacer un féculent par un autre, on garde les mêmes calories et on change le poids.
*/
const PLAN_STARCH_GROUP = ["rizC", "rizB", "pastaB", "couscous", "patate", "pdt", "painC", "painB"];
// Féculents à index glycémique élevé : on ne les propose pas en remplacement si triglycérides ou glycémie à surveiller.
const PLAN_STARCH_HIGH_GI = ["pdt", "painB"];

// Aliments qui peuvent remplacer `foodId` dans un repas, selon les allergies, le régime et les aliments écartés.
// Autres familles interchangeables (mêmes calories, la quantité s'adapte) : laitages et fromages.
const PLAN_DAIRY_GROUP = ["yaourt", "skyr", "fromageBlanc"];
const PLAN_CHEESE_GROUP = ["emmental", "comte", "mozzarella", "chevre", "feta"];

function planSwapOptions(foodId, answers) {
  const group = [PLAN_STARCH_GROUP, PLAN_DAIRY_GROUP, PLAN_CHEESE_GROUP].find((g) => g.includes(foodId));
  if (!group) return [];
  const allergies = answers?.allergies || [];
  const avoid = answers?.avoid || [];
  const watchGi = Boolean(answers?.health?.trig || answers?.health?.gly);
  return group.filter((id) => {
    if (id === foodId) return false;
    const food = PLAN_FOODS[id];
    if (food.a.some((allergen) => allergies.includes(allergen))) return false;
    if (avoid.includes(id)) return false;
    if (watchGi && PLAN_STARCH_HIGH_GI.includes(id)) return false;
    return true;
  });
}

// Quantité du nouvel aliment ayant les mêmes calories que `grams` de l'ancien (arrondie à 5 g, ou à la pièce).
function planEquivalentGrams(fromId, grams, toId) {
  const from = PLAN_FOODS[fromId];
  const to = PLAN_FOODS[toId];
  const kcal = (from.k * grams) / 100;
  const raw = (kcal * 100) / to.k;
  if (to.u) return Math.max(1, Math.round(raw / to.u.g)) * to.u.g;
  return Math.max(5, Math.round(raw / 5) * 5);
}

// Repas du plan dont les quantités ont été saisies à la main (grammes, ou nombre pour les aliments à la pièce).
// `foods` (facultatif) : aliment choisi à la place de celui du plan, par position.
function planMealFromQuantities(meal, quantities, foods = []) {
  const items = [];
  meal.items.forEach((item, index) => {
    const swapped = foods[index] && PLAN_FOODS[foods[index]] ? foods[index] : item.food;
    const food = PLAN_FOODS[swapped];
    const raw = Number(quantities[index]);
    const amount = Number.isFinite(raw) && raw > 0 ? raw : 0;
    if (!amount) return;
    const count = Math.round(amount);
    const grams = food.u ? count * food.u.g : Math.round(amount);
    const label = food.u ? `${count} ${count > 1 ? food.u.many : food.u.one}` : `${grams} ${food.ml ? "ml" : "g"}`;
    items.push({ food: swapped, name: swapped === item.food ? item.name : food.n, grams, label, kcal: (food.k * grams) / 100 });
  });
  const kcal = Math.round(items.reduce((sum, item) => sum + item.kcal, 0));
  return { ...meal, items, kcal, nut: planMealNutrition(items) };
}

/*
  Compare ce qui a été mangé aujourd'hui (entries = repas notés) au total prévu pour la journée,
  et ajuste les repas restants pour rester sur l'objectif.
  Un moment de la journée est "couvert" dès qu'un repas y est noté (repas du plan ou saisie libre).
*/
function planAdjustDay(plan, dayIndex, entries, reserved = [], skipped = []) {
  const day = plan.days[dayIndex];
  const eatenKcal = entries.reduce((sum, entry) => sum + Number(entry.calories || 0), 0);
  // Repas déjà prévus pour aujourd'hui (raclette ce soir…) : leurs calories sont mises de côté
  // et le moment concerné n'est plus rempli par le repas du plan.
  const reservedKcal = reserved.reduce((sum, entry) => sum + Number(entry.calories || 0), 0);
  const covered = new Set([...entries, ...reserved].map((entry) => entry.mealType));
  // Collation sautée : ses calories sortent de l'objectif du jour, on ne les reporte pas sur les autres repas.
  const skippedMeals = day.meals.filter((meal) => skipped.includes(meal.slot) && !covered.has(meal.slot));
  const skippedKcal = skippedMeals.reduce((sum, meal) => sum + meal.kcal, 0);
  skippedMeals.forEach((meal) => covered.add(meal.slot));
  const pendingMeals = day.meals.filter((meal) => !covered.has(meal.slot));
  const plannedKcal = pendingMeals.reduce((sum, meal) => sum + meal.kcal, 0);
  const remaining = day.kcal - skippedKcal - eatenKcal - reservedKcal;
  const rawFactor = plannedKcal > 0 ? remaining / plannedKcal : 1;
  // Quand un repas plaisir est prévu, on n'allège pas en dessous de 70 % : on ne cherche pas à se priver.
  const floor = reserved.length ? 0.7 : 0.5;
  // Sous traitement type Wegovy, on n'augmente jamais les repas suivants : l'appétit est réduit.
  const factor = planClamp(rawFactor, floor, plan.glp1 ? 1 : 1.5);
  const adjusting = pendingMeals.length > 0 && Math.abs(factor - 1) >= 0.04;
  const lessOk = Boolean(plan.glp1) && pendingMeals.length > 0 && rawFactor > 1.04;

  let status = "ok";
  // "over" seulement si le dépassement est net (sinon on reste sur "plus léger").
  if (pendingMeals.length && rawFactor < floor * 0.95) status = "over";
  else if (adjusting && factor < 1) status = "lighter";
  else if (adjusting) status = "bigger";

  return {
    eatenKcal,
    reservedKcal,
    skippedKcal,
    reserved,
    lessOk,
    remaining,
    plannedKcal,
    factor,
    rawFactor,
    status,
    deltaKcal: Math.round(plannedKcal * (factor - 1)),
    pending: pendingMeals.map((meal) => ({
      slot: meal.slot,
      planned: meal,
      meal: adjusting ? planFitMeal(meal, meal.kcal * factor) : meal
    }))
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    PLAN_FOOD_SEASON, planFoodInSeason, planMealInSeason,
    PLAN_FOODS, PLAN_MEALS, PLAN_ALLERGEN_LABELS, PLAN_DIET_TYPES, PLAN_NUTRITION, PLAN_NUTRIENT_KEYS,
    PLAN_DISLIKE_CHOICES, PLAN_NUTRIENT_DEFS, PLAN_RECIPES, PLAN_SLOT_LABELS,
    planNormalizeAnswers, planBlockingReasons, planCandidates, planBuild, planTarget,
    planMatchDislikeText, planSwapMeal, planDislikeFood, planRefresh, planMealDef,
    planNutritionTargets, planNutrientRows, planRandom, planRoundNutrition,
    planFitMeal, planMealFromQuantities, planAdjustDay,
    PLAN_STARCH_GROUP, PLAN_DAIRY_GROUP, PLAN_CHEESE_GROUP, planSwapOptions, planEquivalentGrams, planParseHealth
  };
}

/* ------------------------------------------------------------------ */
/* Interface                                                           */
/* ------------------------------------------------------------------ */

const planUi = { editing: false, renderedId: null, changed: new Set(), notes: new Map(), openEditors: new Set() };

function planKcal(value) {
  return `${Math.round(value).toLocaleString("fr-FR")} kcal`;
}

function planNum(value, digits) {
  return Number(value).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: digits });
}

function planRandomSeed() {
  return Math.floor(Math.random() * 2147483647);
}

// Numéro du jour du plan (0 à 6) correspondant à une date, en comptant depuis le jour de création du plan.
function planDayIndexFor(plan, dateKey) {
  if (!plan.startDate) return 0;
  const toUtc = (key) => {
    const [year, month, day] = String(key).split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  };
  const diff = Math.round((toUtc(dateKey) - toUtc(plan.startDate)) / 86400000);
  return ((diff % PLAN_DAYS) + PLAN_DAYS) % PLAN_DAYS;
}

function bindPlan() {
  const form = document.querySelector("#plan-form");
  if (!form) return;

  document.querySelector("#plan-dislike-grid").innerHTML = PLAN_DISLIKE_CHOICES
    .map((choice) => `<label><input type="checkbox" name="dislike" value="${choice.key}" /><span>${escapeHtml(choice.label)}</span></label>`)
    .join("");

  // Le champ santé est obligatoire : on écrit « aucun » s'il n'y a rien à signaler.
  const healthField = form.elements.healthText;
  healthField.addEventListener("invalid", () => {
    healthField.setCustomValidity("Indiquez votre traitement ou vos problèmes de santé, ou écrivez « aucun ».");
  });
  healthField.addEventListener("input", () => healthField.setCustomValidity(""));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.profile) return;
    generatePlan(readPlanForm(form), planRandomSeed());
  });

  document.querySelector("#plan-regenerate").addEventListener("click", () => {
    const saved = state.nutritionPlan;
    if (!state.profile || !saved) return;
    generatePlan(saved.answers, planRandomSeed());
  });

  document.querySelector("#plan-edit").addEventListener("click", () => {
    planUi.editing = true;
    renderPlan();
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.querySelector("#plan-blocked-edit").addEventListener("click", () => {
    planUi.editing = true;
    renderPlan();
  });

  document.querySelector("#plan-days").addEventListener("click", (event) => {
    const add = event.target.closest("[data-plan-add]");
    if (add) return addPlanMealToDay(add);

    const swap = event.target.closest("[data-plan-swap]");
    if (swap) return swapPlanMeal(swap.dataset.planSwap);

    const toggle = event.target.closest("[data-plan-dislike-toggle]");
    if (toggle) {
      const picker = toggle.closest(".plan-meal").querySelector(".plan-dislike-picker");
      picker.hidden = !picker.hidden;
      return undefined;
    }

    const dislike = event.target.closest("[data-plan-dislike]");
    if (dislike) return dislikePlanFood(dislike.dataset.planDislike);
    return undefined;
  });

  document.querySelector("#plan-avoided").addEventListener("click", (event) => {
    const button = event.target.closest("[data-plan-allow]");
    if (button) allowPlanFood(button.dataset.planAllow);
  });

  const day = document.querySelector("#day");
  if (day) {
    day.addEventListener("click", (event) => {
      const eat = event.target.closest("[data-planned-eat]");
      if (eat) return eatPlannedMeal(eat.dataset.plannedEat);
      const undo = event.target.closest("[data-planned-undo]");
      if (undo) return undoPlannedMeal(undo.dataset.plannedUndo);
      const eatReserved = event.target.closest("[data-reserved-eat]");
      if (eatReserved) return eatReservedMeal(eatReserved.dataset.reservedEat);
      const cancelReserved = event.target.closest("[data-reserved-cancel]");
      if (cancelReserved) return cancelReservedMeal(cancelReserved.dataset.reservedCancel);
      return undefined;
    });

    day.addEventListener("submit", (event) => {
      const form = event.target.closest("[data-planned-form]");
      if (!form) return;
      event.preventDefault();
      eatPlannedMeal(
        form.dataset.plannedForm,
        [...form.querySelectorAll("input[data-q]")].map((input) => input.value),
        [...form.querySelectorAll("[data-q-row]")].map((row) => (row.querySelector("select[data-swap]") || {}).value || null)
      );
    });

    // Changement de féculent : la quantité est recalculée pour garder les mêmes calories.
    day.addEventListener("change", (event) => {
      const select = event.target.closest ? event.target.closest("select[data-swap]") : null;
      if (!select) return;
      const row = select.closest("[data-q-row]");
      const input = row.querySelector("input[data-q]");
      const unit = row.querySelector("em");
      const from = PLAN_FOODS[select.dataset.prev];
      const to = PLAN_FOODS[select.value];
      const entered = Number(String(input.value).replace(",", "."));
      const fromGrams = from.u ? entered * from.u.g : entered;
      if (Number.isFinite(fromGrams) && fromGrams > 0) {
        const grams = planEquivalentGrams(select.dataset.prev, fromGrams, select.value);
        input.value = to.u ? Math.round(grams / to.u.g) : grams;
      }
      unit.textContent = to.u ? to.u.many : to.ml ? "ml" : "g";
      select.dataset.prev = select.value;
      const hint = row.querySelector("[data-swap-hint]");
      if (hint) hint.hidden = false;
    });

    // On retient les "quantités" ouvertes pour qu'elles ne se referment pas quand l'écran est redessiné.
    day.addEventListener("toggle", (event) => {
      const details = event.target.closest ? event.target.closest(".planned-edit") : null;
      if (!details) return;
      const slot = details.closest("[data-planned-slot]").dataset.plannedSlot;
      if (details.open) planUi.openEditors.add(slot);
      else planUi.openEditors.delete(slot);
    }, true);
  }

  // Plan enregistré par une version précédente (sans apports nutritionnels) : on le laisse de côté, il sera recréé.
  if (state.nutritionPlan?.plan && !state.nutritionPlan.plan.nutAverage) {
    state.nutritionPlan.plan = null;
  }

  restorePlanForm();
}

function readPlanForm(form) {
  const data = new FormData(form);
  return {
    diet: data.get("diet") || "omni",
    allergies: data.getAll("allergy").map(String),
    treatment: data.get("treatment") === "yes",
    healthText: String(data.get("healthText") || "").trim(),
    alcohol: data.get("alcohol") || "never",
    sugarDrinks: data.get("sugarDrinks") || "rare",
    snack: data.get("snack") !== "no",
    pregnant: data.get("pregnant") === "yes",
    lunchbox: data.get("lunchbox") === "yes",
    dislikeKeys: data.getAll("dislike").map(String),
    dislikeText: String(data.get("dislikeText") || ""),
    // Aliments écartés depuis le plan : ils sont conservés, on les retire depuis la liste "Aliments écartés".
    dislikedFoods: state.nutritionPlan?.answers?.dislikedFoods || []
  };
}

function restorePlanForm() {
  const form = document.querySelector("#plan-form");
  const answers = state.nutritionPlan?.answers;
  if (!form || !answers) return;

  const setRadio = (name, value) => {
    const input = form.querySelector(`input[name="${name}"][value="${value}"]`);
    if (input) input.checked = true;
  };
  const setChecks = (name, values) => {
    form.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
      input.checked = values.includes(input.value);
    });
  };

  setRadio("diet", answers.diet);
  setChecks("allergy", answers.allergies || []);
  setChecks("dislike", answers.dislikeKeys || []);
  form.elements.dislikeText.value = answers.dislikeText || "";
  if ((answers.dislikeKeys || []).length || answers.dislikeText) form.querySelector(".plan-dislikes").open = true;
  form.elements.treatment.checked = Boolean(answers.treatment);
  form.elements.healthText.value = answers.healthText || "";
  form.elements.alcohol.value = answers.alcohol;
  form.elements.sugarDrinks.value = answers.sugarDrinks;
  setRadio("snack", answers.snack ? "yes" : "no");
  form.elements.pregnant.checked = Boolean(answers.pregnant);
  form.elements.lunchbox.checked = Boolean(answers.lunchbox);
}

function resetPlanUi() {
  const form = document.querySelector("#plan-form");
  if (form) form.reset();
  planUi.editing = false;
  planUi.renderedId = null;
  planUi.changed = new Set();
  planUi.notes = new Map();
}

function generatePlan(rawAnswers, seed) {
  const answers = planNormalizeAnswers(rawAnswers);
  const reasons = planBlockingReasons(answers, state.profile);

  if (reasons.length) {
    state.nutritionPlan = { answers, plan: null, blocked: { reasons } };
  } else {
    const result = planBuild(answers, state.profile, seed);
    if (result.error) {
      state.nutritionPlan = { answers, plan: null, blocked: { reasons: [result.error] } };
    } else {
      result.plan.startDate = getTodayKey();
      state.nutritionPlan = { answers, plan: result.plan, blocked: null };
    }
  }

  planUi.editing = false;
  planUi.renderedId = null;
  planUi.changed = new Set();
  planUi.notes = new Map();
  // Nouveau plan : on repart d'un affichage propre (seul le jour du jour est ouvert).
  document.querySelector("#plan-days").innerHTML = "";
  saveState();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function addPlanMealToDay(button) {
  const [dayIndex, mealIndex] = button.dataset.planAdd.split(":").map(Number);
  const meal = state.nutritionPlan?.plan?.days?.[dayIndex]?.meals?.[mealIndex];
  if (!meal) return;

  state.meals.unshift({
    id: createId(),
    mealType: meal.slot,
    description: `${meal.name} (plan alimentaire)`,
    calories: meal.kcal,
    estimateDetails: "Repas du plan alimentaire.",
    usedAveragePortion: false,
    recognitionWarning: "",
    nutrients: meal.nut,
    createdAt: new Date().toISOString()
  });

  saveState();
  render();
  button.textContent = "✓ Ajouté à ma journée";
  button.disabled = true;
}

// Remplace un repas par un repas proche (même moment de la journée, mêmes contraintes).
function swapPlanMeal(key) {
  const saved = state.nutritionPlan;
  if (!saved?.plan || !state.profile) return;

  const [dayIndex, mealIndex] = key.split(":").map(Number);
  const answers = planNormalizeAnswers(saved.answers);
  const chosen = planSwapMeal(saved.plan, dayIndex, mealIndex, answers, Math.random);

  planUi.changed = new Set();
  planUi.notes = new Map();
  if (chosen) planUi.changed.add(key);
  else planUi.notes.set(key, "Je n'ai pas d'autre repas compatible pour ce moment de la journée.");

  saved.answers = answers;
  saved.plan = planRefresh(saved.plan, answers, state.profile);
  saveState();
  render();
}

// Écarte un aliment : tous les repas de la semaine qui le contiennent sont remplacés.
function dislikePlanFood(value) {
  const saved = state.nutritionPlan;
  if (!saved?.plan || !state.profile) return;

  const [dayIndex, mealIndex, foodId] = value.split(":");
  if (!PLAN_FOODS[foodId]) return;

  const result = planDislikeFood(saved.plan, planNormalizeAnswers(saved.answers), foodId, Math.random);
  const name = PLAN_FOODS[foodId].n.toLowerCase();
  const plural = result.replaced > 1 ? "s" : "";

  planUi.changed = new Set(result.changed);
  planUi.notes = new Map();
  planUi.notes.set(
    `${dayIndex}:${mealIndex}`,
    result.failed
      ? `${name} écarté. ${result.replaced} repas remplacé${plural}, mais ${result.failed} sans repas de remplacement possible.`
      : `${name} écarté : ${result.replaced} repas remplacé${plural} dans la semaine.`
  );

  saved.answers = result.answers;
  saved.plan = planRefresh(saved.plan, result.answers, state.profile);
  saveState();
  render();
}

function allowPlanFood(foodId) {
  const saved = state.nutritionPlan;
  if (!saved) return;
  saved.answers = planNormalizeAnswers({
    ...saved.answers,
    dislikedFoods: (saved.answers.dislikedFoods || []).filter((id) => id !== foodId)
  });
  saveState();
  renderPlanAvoided();
}

function undoPlannedMeal(slot) {
  state.meals = state.meals.filter((entry) => entry.planRef !== `plan:${slot}`);
  saveState();
  render();
}

function renderPlan() {
  const view = document.querySelector("#plan");
  if (!view) return;

  const needsProfile = document.querySelector("#plan-needs-profile");
  const form = document.querySelector("#plan-form");
  const blocked = document.querySelector("#plan-blocked");
  const results = document.querySelector("#plan-results");
  const saved = state.nutritionPlan;
  const hasProfile = Boolean(state.profile);
  const showForm = hasProfile && (planUi.editing || !saved || (!saved.plan && !saved.blocked));

  needsProfile.hidden = hasProfile;
  form.hidden = !showForm;
  blocked.hidden = !(hasProfile && !showForm && saved?.blocked);
  results.hidden = !(hasProfile && !showForm && saved?.plan);

  if (!saved?.plan) planUi.renderedId = null;

  if (saved?.blocked && !blocked.hidden) {
    document.querySelector("#plan-blocked-list").innerHTML = saved.blocked.reasons
      .map((reason) => `<li>${escapeHtml(reason)}</li>`)
      .join("");
  }

  if (saved?.plan && !results.hidden && planUi.renderedId !== saved.plan.id) {
    renderPlanResults(saved.plan);
    planUi.renderedId = saved.plan.id;
  }

  renderPlannedMeals();
}

function planMacroLine(nut) {
  return `Protéines ${planNum(nut.p, 0)} g · Glucides ${planNum(nut.c, 0)} g · Lipides ${planNum(nut.f, 0)} g`;
}

function planMacroBar(nut) {
  const protein = nut.p * 4;
  const carbs = nut.c * 4;
  const fat = nut.f * 9;
  const total = protein + carbs + fat || 1;
  const share = (value) => Math.round((value / total) * 100);
  return `
    <div class="macro-bar" role="img" aria-label="Répartition des calories">
      <i class="macro-p" style="width:${share(protein)}%"></i><i class="macro-c" style="width:${share(carbs)}%"></i><i class="macro-f" style="width:${share(fat)}%"></i>
    </div>
    <p class="macro-legend"><span class="macro-p"></span>Protéines ${share(protein)} %<span class="macro-c"></span>Glucides ${share(carbs)} %<span class="macro-f"></span>Lipides ${share(fat)} %</p>
  `;
}

// Liste des apports comparés aux repères. partial = journée en cours : pas de verdict sur les minimums.
function planNutrientsHtml(nut, targets, partial) {
  const icons = { ok: "✓", near: "≈", low: "⚠", high: "⚠", neutral: "" };
  const rows = planNutrientRows(nut, targets).map((row) => {
    const status = partial && row.dir === "min" ? "neutral" : row.status;
    const percent = Math.min(100, Math.round((row.value / row.target) * 100));
    const goal = row.dir === "max"
      ? `maximum ${planNum(row.target, row.digits)} ${row.unit}`
      : `repère ${planNum(row.target, row.digits)} ${row.unit}`;
    return `
      <li class="nutri-row is-${status}">
        <div class="nutri-head"><span>${escapeHtml(row.label)}</span><strong>${planNum(row.value, row.digits)} ${row.unit} ${icons[status]}</strong></div>
        <div class="nutri-bar"><i style="width:${percent}%"></i></div>
        <small>${goal}</small>
      </li>`;
  });
  return `<ul class="nutri-list">${rows.join("")}</ul>`;
}

function renderPlanAvoided() {
  const box = document.querySelector("#plan-avoided");
  const foods = state.nutritionPlan?.answers?.dislikedFoods || [];
  box.hidden = !foods.length;
  box.innerHTML = foods.length
    ? `<p>Aliments écartés depuis le plan :</p><div class="plan-chip-list">${foods
        .filter((id) => PLAN_FOODS[id])
        .map((id) => `<button type="button" class="plan-chip" data-plan-allow="${id}" aria-label="Autoriser de nouveau ${escapeHtml(PLAN_FOODS[id].n)}">${escapeHtml(PLAN_FOODS[id].n)} ✕</button>`)
        .join("")}</div>`
    : "";
}

// Recette d'un repas du plan (dépliable).
function planRecipeHtml(mealId) {
  const recipe = PLAN_RECIPES[mealId];
  if (!recipe) return "";
  return `<details class="plan-recipe"><summary>👨‍🍳 Recette · ${recipe.time} min</summary><ol>${recipe.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol></details>`;
}

function renderPlanResults(plan) {
  const h = plan.highlights;
  const highlights = [];
  if (h.omega3) highlights.push(`${h.omega3} repas de poisson gras`);
  else if (h.fish) highlights.push(`${h.fish} repas de poisson`);
  if (h.legume) highlights.push(`${h.legume} repas riches en légumineuses`);
  if (h.wholegrain) highlights.push(`${h.wholegrain} repas avec céréales complètes`);

  const todayIndex = planDayIndexFor(plan, getTodayKey());
  // On garde les jours ouverts quand le plan est redessiné après un remplacement.
  const previous = [...document.querySelectorAll("#plan-days .plan-day")].map((details) => details.open);
  const isOpen = (index) => (previous.length === plan.days.length ? previous[index] : index === todayIndex);

  document.querySelector("#plan-summary").innerHTML = `
    <div class="plan-stat">
      <span>Objectif par jour</span>
      <strong>${escapeHtml(planKcal(plan.target))}</strong>
    </div>
    <div class="plan-stat">
      <span>Moyenne du plan</span>
      <strong>${escapeHtml(planKcal(plan.average))}</strong>
    </div>
    ${highlights.length ? `<p class="plan-highlights">Cette semaine : ${escapeHtml(highlights.join(" · "))}.</p>` : ""}
  `;

  document.querySelector("#plan-nutrition").innerHTML = `
    <summary>📊 Apports moyens par jour</summary>
    <div class="plan-nutrition-body">
      <p class="helper-text">${escapeHtml(planMacroLine(plan.nutAverage))}</p>
      ${planMacroBar(plan.nutAverage)}
      ${planNutrientsHtml(plan.nutAverage, plan.targets, false)}
    </div>
  `;

  document.querySelector("#plan-warnings").innerHTML = plan.warnings
    .map((warning) => `<li>${escapeHtml(warning)}</li>`)
    .join("");

  renderPlanAvoided();

  document.querySelector("#plan-days").innerHTML = plan.days
    .map((day, dayIndex) => `
      <details class="plan-day"${isOpen(dayIndex) ? " open" : ""}>
        <summary>
          <strong>Jour ${dayIndex + 1}${dayIndex === todayIndex ? ' <em class="plan-today">Aujourd\'hui</em>' : ""}</strong>
          <span>${escapeHtml(planKcal(day.kcal))}</span>
        </summary>
        <div class="plan-day-body">
          ${day.meals.map((meal, mealIndex) => {
            const key = `${dayIndex}:${mealIndex}`;
            const pickable = meal.items.filter((item) => item.food !== "huileO" && item.food !== "huileC");
            return `
            <article class="plan-meal${planUi.changed.has(key) ? " is-changed" : ""}">
              <div class="plan-meal-head">
                <h4>${escapeHtml(PLAN_SLOT_LABELS[meal.slot])}</h4>
                <span>${escapeHtml(planKcal(meal.kcal))}</span>
              </div>
              <p class="plan-meal-name">${escapeHtml(meal.name)}${planUi.changed.has(key) ? ' <span class="plan-badge">✓ Remplacé</span>' : ""}</p>
              ${planUi.notes.has(key) ? `<p class="plan-note" role="status">${escapeHtml(planUi.notes.get(key))}</p>` : ""}
              <ul class="plan-items">
                ${meal.items.map((item) => `<li><span>${escapeHtml(item.name)}</span><span>${escapeHtml(item.label)}</span></li>`).join("")}
              </ul>
              <p class="plan-macros">${escapeHtml(planMacroLine(meal.nut))}</p>
              ${planRecipeHtml(meal.mealId)}
              <div class="plan-meal-actions">
                <button class="secondary-action" type="button" data-plan-swap="${key}">🔄 Changer ce repas</button>
                <button class="secondary-action" type="button" data-plan-dislike-toggle="${key}">👎 Je n'aime pas…</button>
              </div>
              <div class="plan-dislike-picker" hidden>
                <p>Quel aliment ne vous plaît pas ? Il sera remplacé partout dans la semaine.</p>
                ${pickable.map((item) => `<button class="plan-chip" type="button" data-plan-dislike="${key}:${item.food}">${escapeHtml(item.name)}</button>`).join("")}
              </div>
              <button class="secondary-action" type="button" data-plan-add="${key}">＋ Ajouter à ma journée</button>
            </article>`;
          }).join("")}
          <details class="plan-nutrition">
            <summary>📊 Apports de la journée</summary>
            <div class="plan-nutrition-body">
              <p class="helper-text">${escapeHtml(planMacroLine(day.nut))}</p>
              ${planMacroBar(day.nut)}
              ${planNutrientsHtml(day.nut, plan.targets, false)}
            </div>
          </details>
        </div>
      </details>
    `)
    .join("");

  document.querySelector("#plan-tips").innerHTML = plan.tips
    .map((tip) => `<li>${escapeHtml(tip)}</li>`)
    .join("");

  document.querySelector("#plan-shopping").innerHTML = plan.shopping
    .map((item) => `<li><span>${escapeHtml(item.name)}</span><span>${escapeHtml(item.label)}</span></li>`)
    .join("");
}

// Moments sautés aujourd'hui (collation non prise).
function planSkippedToday() {
  return Array.isArray(state.skipped) ? state.skipped : [];
}

// Repas spéciaux prévus pour aujourd'hui (pas encore mangés).
function planReservedToday() {
  const today = getTodayKey();
  return (state.reserved || []).filter((entry) => entry.dayKey === today);
}

// Le repas prévu est mangé : il devient un vrai repas de la journée.
function eatReservedMeal(id) {
  const reserved = (state.reserved || []).find((entry) => entry.id === id);
  if (!reserved) return;
  const { dayKey, name, ...entry } = reserved;
  state.meals.unshift({ ...entry, id: createId(), createdAt: new Date().toISOString() });
  state.reserved = state.reserved.filter((item) => item.id !== id);
  saveState();
  render();
}

function cancelReservedMeal(id) {
  state.reserved = (state.reserved || []).filter((entry) => entry.id !== id);
  saveState();
  render();
}

// Un repas du plan est coché : avec ses quantités du moment, ou avec des quantités saisies à la main.
function eatPlannedMeal(slot, quantities, foods) {
  const plan = state.nutritionPlan?.plan;
  if (!plan) return;
  if (state.meals.some((entry) => entry.planRef === `plan:${slot}`)) return;

  const dayIndex = planDayIndexFor(plan, getTodayKey());
  const current = planAdjustDay(plan, dayIndex, state.meals, planReservedToday(), planSkippedToday()).pending.find((entry) => entry.slot === slot);
  if (!current) return;

  const meal = quantities ? planMealFromQuantities(current.meal, quantities, foods) : current.meal;
  if (!meal.kcal) return;

  state.meals.unshift({
    id: createId(),
    mealType: slot,
    description: `${meal.name} (${quantities ? "quantités modifiées" : "plan"})`,
    calories: meal.kcal,
    estimateDetails: "Repas du plan alimentaire.",
    usedAveragePortion: false,
    recognitionWarning: "",
    planRef: `plan:${slot}`,
    nutrients: meal.nut,
    createdAt: new Date().toISOString()
  });
  planUi.openEditors.delete(slot);
  saveState();
  render();
}

function planAdjustmentMessage(adjustment) {
  const kcal = `${Math.abs(adjustment.deltaKcal).toLocaleString("fr-FR")} kcal`;
  if (adjustment.reserved && adjustment.reserved.length) {
    const names = adjustment.reserved.map((entry) => entry.name || "Repas spécial").join(" + ");
    const total = `${Math.round(adjustment.reservedKcal).toLocaleString("fr-FR")} kcal`;
    if (adjustment.status === "over") return `${names} au programme (≈ ${total}) : la journée sera un peu au-dessus de votre objectif, et ce n'est pas grave. Un repas plaisir ne ruine pas une semaine : gardez des repas légers autour et reprenez le plan demain, sans culpabiliser.`;
    if (adjustment.status === "lighter") return `${names} au programme (≈ ${total}) : j'ai allégé le reste de la journée (environ −${kcal}) pour que vous en profitiez sans vous priver ni culpabiliser.`;
    return `${names} au programme (≈ ${total}) : c'est déjà prévu dans votre journée. Profitez-en !`;
  }
  if (adjustment.lessOk) return "Avec votre traitement, l'appétit baisse : manger un peu moins que prévu n'est pas un problème. Gardez la priorité aux protéines et à l'eau.";
  if (adjustment.status === "lighter") return `Vous avez déjà mangé plus que prévu : je réduis un peu les repas suivants (environ −${kcal}) pour rester sur votre objectif.`;
  if (adjustment.status === "bigger") return `Vous avez mangé moins que prévu : j'augmente un peu les repas suivants (environ +${kcal}) pour couvrir vos besoins.`;
  if (adjustment.status === "over") return "Vous avez largement dépassé le prévu pour aujourd'hui. Pour la suite, gardez des repas légers (légumes, protéines maigres). Un repas plaisir ne ruine pas une semaine : reprenez le plan demain.";
  return "";
}

// Budget de chaque repas et choix « je suis mon plan » / « je fais ma journée ».
const PLAN_DEFAULT_SHARES = { breakfast: 0.25, lunch: 0.35, dinner: 0.3, snack: 0.1 };

function renderDayMode(plan, dayIndex) {
  const day = plan ? plan.days?.[dayIndex] : null;
  const dayTarget = day ? day.kcal : state.profile?.calculations?.target || 0;
  if (!dayTarget) {
    document.querySelectorAll("[data-meal-budget]").forEach((el) => { el.hidden = true; });
    return;
  }
  const free = !plan;

  // Budget par repas : repas du plan si on le suit, sinon part de l'objectif du jour.
  const slots = day ? day.meals.map((meal) => meal.slot) : ["breakfast", "lunch", "dinner", "snack"];
  const weight = (slot) => (day ? day.meals.find((meal) => meal.slot === slot)?.kcal : PLAN_DEFAULT_SHARES[slot] * dayTarget) || 0;
  const totalWeight = slots.reduce((sum, slot) => sum + weight(slot), 0) || 1;
  document.querySelectorAll("[data-meal-budget]").forEach((el) => {
    const slot = el.dataset.mealBudget;
    const already = state.meals.some((entry) => entry.mealType === slot);
    const planBoxShown = document.querySelector(`[data-planned-slot="${slot}"]:not([hidden])`);
    if (!slots.includes(slot) || already || (!free && planBoxShown) || planSkippedToday().includes(slot)) {
      el.hidden = true;
      return;
    }
    const budget = Math.round(((weight(slot) / totalWeight) * dayTarget) / 10) * 10;
    let text = `🎯 Budget pour ce repas : environ ${budget.toLocaleString("fr-FR")} kcal`;
    if (free && (slot === "lunch" || slot === "dinner")) {
      const starch = Math.round((budget * 0.38) / 1.3 / 10) * 10;
      const protein = Math.round((budget * 0.3) / 1.65 / 10) * 10;
      text += `. Repère : la moitié de l'assiette en légumes, environ ${protein} g de viande, poisson ou 2 œufs, environ ${starch} g de féculents cuits (riz, pâtes, pommes de terre) et 1 cuillère à soupe d'huile d'olive, plus un laitage ou un fruit.`;
    }
    el.hidden = false;
    el.textContent = text;
  });
}

if (typeof document !== "undefined") {
  document.addEventListener("click", (event) => {
    const skip = event.target.closest("[data-skip-slot]");
    if (skip) {
      state.skipped = [...new Set([...planSkippedToday(), skip.dataset.skipSlot])];
      saveState();
      render();
      return;
    }
    const unskip = event.target.closest("[data-skip-undo]");
    if (unskip) {
      state.skipped = planSkippedToday().filter((slot) => slot !== unskip.dataset.skipUndo);
      saveState();
      render();
      return;
    }
    const pleasure = event.target.closest("[data-pleasure-slot]");
    if (pleasure) {
      const panel = document.querySelector("#pleasure-details");
      if (!panel) return;
      specialUi.slot = pleasure.dataset.pleasureSlot;
      panel.open = true;
      panel.hidden = false;
      const select = document.querySelector("#special-slot");
      if (select) select.value = specialUi.slot;
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (event.target.closest("[data-pleasure-close]")) {
      const panel = document.querySelector("#pleasure-details");
      if (panel) { panel.open = false; panel.hidden = true; }
      specialUi.slot = null;
    }
  });
}

// "Ma journée" : repas prévu au plan pour chaque moment (ajusté à ce qui a déjà été mangé), à cocher en un geste.
function renderPlannedMeals() {
  const boxes = document.querySelectorAll("[data-planned-slot]");
  if (!boxes.length) return;

  const plan = state.nutritionPlan?.plan;
  const dayIndex = plan ? planDayIndexFor(plan, getTodayKey()) : -1;
  const reserved = planReservedToday();
  const skipped = planSkippedToday();
  const adjustment = plan ? planAdjustDay(plan, dayIndex, state.meals, reserved, skipped) : null;
  const pending = new Map((adjustment?.pending || []).map((entry) => [entry.slot, entry]));

  boxes.forEach((box) => {
    const slot = box.dataset.plannedSlot;
    const planned = plan?.days?.[dayIndex]?.meals.find((entry) => entry.slot === slot);
    const eaten = state.meals.find((entry) => entry.planRef === `plan:${slot}`);
    const current = pending.get(slot);
    const reservedHere = reserved
      .filter((entry) => entry.mealType === slot)
      .map((entry) => `
        <div class="planned-reserved">
          <p class="planned-label">📅 Prévu aujourd'hui</p>
          <strong>${escapeHtml(entry.name || "Repas spécial")}</strong>
          <span class="planned-kcal">≈ ${escapeHtml(planKcal(entry.calories))}</span>
          <button class="primary-action" type="button" data-reserved-eat="${escapeHtml(entry.id)}">✓ Je l'ai mangé</button>
          <button class="link-action" type="button" data-reserved-cancel="${escapeHtml(entry.id)}">Annuler</button>
        </div>`)
      .join("");

    const isSnack = slot === "snack";
    const skippedHere = isSnack && skipped.includes(slot);
    const hasEntries = state.meals.some((entry) => entry.mealType === slot);
    const skipButton = () => `<button class="secondary-action" type="button" data-skip-slot="${slot}">Pas de collation</button>`;
    const showPlan = planned && (eaten || current);

    if (skippedHere && !eaten) {
      box.hidden = false;
      box.innerHTML = reservedHere + `<p class="plan-done">Pas de collation aujourd'hui <button class="link-action" type="button" data-skip-undo="${slot}">Annuler</button></p>`;
      return;
    }
    if (!showPlan && !reservedHere) {
      // Sans plan (ou sans repas prévu ici) : seule la collation propose « pas de collation ».
      if (isSnack && !hasEntries && !plan) {
        box.hidden = false;
        box.innerHTML = skipButton();
        return;
      }
      box.hidden = true;
      box.innerHTML = "";
      return;
    }

    box.hidden = false;
    if (!showPlan) {
      box.innerHTML = reservedHere;
      return;
    }
    if (eaten) {
      box.innerHTML = reservedHere + `
        <p class="plan-done">✓ <strong>${escapeHtml(planned.name)}</strong> · ${escapeHtml(planKcal(eaten.calories))}
          <button class="link-action" type="button" data-planned-undo="${slot}">Annuler</button></p>
      `;
      return;
    }

    const meal = current.meal;
    const changed = meal.kcal !== planned.kcal;
    box.innerHTML = reservedHere + `
      <strong>${escapeHtml(meal.name)}</strong>
      <span class="planned-kcal">${escapeHtml(planKcal(meal.kcal))}${changed ? ` <em>(prévu : ${escapeHtml(planKcal(planned.kcal))})</em>` : ""}</span>
      <p class="plan-items-line">${meal.items.map((item) => `<span>${escapeHtml(item.name)} <b>${escapeHtml(item.label)}</b></span>`).join(" · ")}</p>
      <div class="plan-choice">
        <button class="primary-action" type="button" data-planned-eat="${slot}">${isSnack ? "✓ Je l'ai prise" : "✓ Je suis mon plan"}</button>
        ${isSnack ? skipButton() : ""}
      </div>
      <details class="planned-edit"${planUi.openEditors.has(slot) ? " open" : ""}>
        <summary>✏️ Autre quantité ou autre aliment</summary>
        <form class="stack" data-planned-form="${slot}">
          ${meal.items.map((item, index) => {
            const food = PLAN_FOODS[item.food];
            const unit = food.u ? food.u.many : food.ml ? "ml" : "g";
            const value = food.u ? Math.round(item.grams / food.u.g) : item.grams;
            const options = planSwapOptions(item.food, state.nutritionPlan?.answers);
            const swap = options.length ? `
              <select data-swap data-prev="${item.food}" aria-label="Remplacer ${escapeHtml(item.name)}">
                <option value="${item.food}" selected>${escapeHtml(item.name)}</option>
                ${options.map((id) => `<option value="${id}">${escapeHtml(PLAN_FOODS[id].n)}</option>`).join("")}
              </select>
              <small class="planned-swap-hint" data-swap-hint hidden>Même apport en calories : la quantité s'adapte.</small>` : "";
            return `
            <${options.length ? "div" : "label"} class="planned-qty" data-q-row>
              <span>${options.length ? "" : `${escapeHtml(item.name)} `}<small>(proposé : ${escapeHtml(item.label)})</small></span>
              ${swap}
              <span class="planned-qty-field"><input type="number" data-q="${index}" min="0" max="2000" step="any" inputmode="decimal" value="${value}" aria-label="Quantité de ${escapeHtml(item.name)}" /><em>${escapeHtml(unit)}</em></span>
            </${options.length ? "div" : "label"}>`;
          }).join("")}
          <button class="secondary-action" type="submit">Valider ce que j'ai mangé</button>
          <p class="helper-text">Les repas suivants s'adaptent automatiquement.</p>
        </form>
      </details>
      ${planRecipeHtml(planned.mealId)}
    `;
  });

  renderDayMode(plan, dayIndex);

  const budget = document.querySelector("#plan-budget");
  if (budget) {
    if (!plan || !adjustment) {
      const profileTarget = state.profile?.calculations?.target;
      if (profileTarget) {
        const eatenNow = state.meals.reduce((sum, entry) => sum + Number(entry.calories || 0), 0);
        const left = profileTarget - eatenNow;
        budget.hidden = false;
        budget.innerHTML = `
          <div class="plan-budget-row">
            <span>Mangé <strong>${escapeHtml(planKcal(eatenNow))}</strong></span>
            <span>Objectif du jour <strong>${escapeHtml(planKcal(profileTarget))}</strong></span>
            <span>${left >= 0 ? "Reste" : "Dépassé de"} <strong>${escapeHtml(planKcal(Math.abs(left)))}</strong></span>
          </div>`;
      } else {
        budget.hidden = true;
      }
    } else {
      const message = planAdjustmentMessage(adjustment);
      budget.hidden = false;
      budget.innerHTML = `
        <div class="plan-budget-row">
          <span>Mangé <strong>${escapeHtml(planKcal(adjustment.eatenKcal))}</strong></span>
          ${adjustment.reservedKcal ? `<span>Déjà prévu <strong>${escapeHtml(planKcal(adjustment.reservedKcal))}</strong></span>` : ""}
          <span>Objectif du jour <strong>${escapeHtml(planKcal(plan.days[dayIndex].kcal - (adjustment.skippedKcal || 0)))}</strong></span>
          <span>${adjustment.remaining >= 0 ? "Reste" : "Dépassé de"} <strong>${escapeHtml(planKcal(Math.abs(adjustment.remaining)))}</strong></span>
        </div>
        ${message ? `<p class="plan-note" role="status">${escapeHtml(message)}</p>` : ""}
      `;
    }
  }

  const section = document.querySelector("#day-nutrients");
  if (!section) return;
  const eatenWithNutrients = state.meals.filter((entry) => entry.nutrients);
  if (!plan?.targets || !eatenWithNutrients.length) {
    section.hidden = true;
    return;
  }
  const total = planSumNutrition(eatenWithNutrients.map((entry) => entry.nutrients));
  const partial = eatenWithNutrients.length < plan.slots.length;
  section.hidden = false;
  document.querySelector("#day-nutrients-body").innerHTML = `
    <p class="helper-text">${escapeHtml(planMacroLine(total))}</p>
    ${planMacroBar(total)}
    ${planNutrientsHtml(total, plan.targets, partial)}
    <p class="helper-text">Ces apports comptent seulement les repas qui ont des valeurs détaillées (repas du plan, repas spéciaux).</p>
  `;
}
