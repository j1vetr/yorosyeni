export const ALLERGEN_LABELS: Record<string, Record<string, string>> = {
  gluten:          { tr: "Gluten",             en: "Gluten",         ru: "Глютен",        ar: "الغلوتين" },
  süt:             { tr: "Süt",                en: "Milk",           ru: "Молоко",         ar: "الحليب" },
  "süt ürünleri":  { tr: "Süt Ürünleri",       en: "Dairy",          ru: "Молочное",       ar: "منتجات الألبان" },
  yumurta:         { tr: "Yumurta",            en: "Egg",            ru: "Яйцо",           ar: "البيض" },
  balık:           { tr: "Balık",              en: "Fish",           ru: "Рыба",           ar: "السمك" },
  kabuklu:         { tr: "Kabuklu D.Ü.",       en: "Crustaceans",    ru: "Ракообразные",   ar: "القشريات" },
  fındık:          { tr: "Fındık",             en: "Nuts",           ru: "Орехи",          ar: "المكسرات" },
  "yer fıstığı":   { tr: "Yer Fıstığı",        en: "Peanuts",        ru: "Арахис",         ar: "الفول السوداني" },
  yer_fıstığı:     { tr: "Yer Fıstığı",        en: "Peanuts",        ru: "Арахис",         ar: "الفول السوداني" },
  soya:            { tr: "Soya",               en: "Soy",            ru: "Соя",            ar: "الصويا" },
  kereviz:         { tr: "Kereviz",            en: "Celery",         ru: "Сельдерей",      ar: "الكرفس" },
  hardal:          { tr: "Hardal",             en: "Mustard",        ru: "Горчица",        ar: "الخردل" },
  susam:           { tr: "Susam",              en: "Sesame",         ru: "Кунжут",         ar: "السمسم" },
  lupin:           { tr: "Lupin",              en: "Lupin",          ru: "Люпин",          ar: "اللوبين" },
  yumuşakça:       { tr: "Yumuşakça",          en: "Molluscs",       ru: "Моллюски",       ar: "الرخويات" },
  molluscs:        { tr: "Yumuşakça",          en: "Molluscs",       ru: "Моллюски",       ar: "الرخويات" },
  sülfitler:       { tr: "Sülfitler",          en: "Sulphites",      ru: "Сульфиты",       ar: "الكبريتيت" },
  kükürt:          { tr: "Sülfitler",          en: "Sulphites",      ru: "Сульфиты",       ar: "الكبريتيت" },
};

export const ALLERGEN_ICONS: Record<string, string> = {
  gluten:          "🌾",
  süt:             "🥛",
  "süt ürünleri":  "🥛",
  yumurta:         "🥚",
  "yer fıstığı":   "🥜",
  yer_fıstığı:     "🥜",
  fındık:          "🌰",
  balık:           "🐟",
  kabuklu:         "🦐",
  soya:            "🫘",
  kereviz:         "🌿",
  hardal:          "🌻",
  susam:           "🫙",
  lupin:           "🌸",
  yumuşakça:       "🦑",
  molluscs:        "🦑",
  sülfitler:       "🧪",
  kükürt:          "🧪",
};

const ALIAS_MAP: Record<string, string> = {
  yer_fıstığı:  "yer fıstığı",
  molluscs:     "yumuşakça",
  kükürt:       "sülfitler",
  "süt ürünleri": "süt",
};

/**
 * Map legacy / synonym allergen keys to the canonical chip key used in
 * ALLERGEN_CHIPS, then lowercase+trim. This makes chip pre-selection and
 * toggle logic work regardless of which variant is stored in the DB.
 */
export function normalizeAllergenKey(key: string): string {
  const lower = key.trim().toLowerCase();
  return ALIAS_MAP[lower] ?? lower;
}

export function getAllergenIcon(allergen: string): string {
  const norm = normalizeAllergenKey(allergen);
  return ALLERGEN_ICONS[norm] ?? "⚠️";
}

export function getAllergenLabel(key: string, lang: string): string {
  const norm = normalizeAllergenKey(key);
  const labels = ALLERGEN_LABELS[norm] ?? ALLERGEN_LABELS[key.trim().toLowerCase()];
  if (!labels) return key.charAt(0).toUpperCase() + key.slice(1);
  return labels[lang] ?? labels["tr"] ?? key;
}
