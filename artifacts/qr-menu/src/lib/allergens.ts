export const ALLERGEN_LABELS: Record<string, Record<string, string>> = {
  // ── Kanonik Türkçe keyler ───────────────────────────────────────────
  gluten:          { tr: "Gluten",             en: "Gluten",         ru: "Глютен",        ar: "الغلوتين" },
  süt:             { tr: "Süt Ürünleri",       en: "Dairy",          ru: "Молочное",      ar: "منتجات الألبان" },
  "süt ürünleri":  { tr: "Süt Ürünleri",       en: "Dairy",          ru: "Молочное",      ar: "منتجات الألبان" },
  yumurta:         { tr: "Yumurta",            en: "Eggs",           ru: "Яйцо",          ar: "البيض" },
  balık:           { tr: "Balık",              en: "Fish",           ru: "Рыба",          ar: "السمك" },
  kabuklu:         { tr: "Kabuklu D.Ü.",       en: "Crustaceans",    ru: "Ракообразные",  ar: "القشريات" },
  fındık:          { tr: "Fındık",             en: "Tree Nuts",      ru: "Орехи",         ar: "المكسرات" },
  "yer fıstığı":   { tr: "Yer Fıstığı",        en: "Peanuts",        ru: "Арахис",        ar: "الفول السوداني" },
  yer_fıstığı:     { tr: "Yer Fıstığı",        en: "Peanuts",        ru: "Арахис",        ar: "الفول السوداني" },
  soya:            { tr: "Soya",               en: "Soy",            ru: "Соя",           ar: "الصويا" },
  kereviz:         { tr: "Kereviz",            en: "Celery",         ru: "Сельдерей",     ar: "الكرفس" },
  hardal:          { tr: "Hardal",             en: "Mustard",        ru: "Горчица",       ar: "الخردل" },
  susam:           { tr: "Susam",              en: "Sesame",         ru: "Кунжут",        ar: "السمسم" },
  lupin:           { tr: "Lupin",              en: "Lupin",          ru: "Люпин",         ar: "اللوبين" },
  yumuşakça:       { tr: "Yumuşakça",          en: "Molluscs",       ru: "Моллюски",      ar: "الرخويات" },
  sülfitler:       { tr: "Sülfitler",          en: "Sulphites",      ru: "Сульфиты",      ar: "الكبريتيت" },
  // ── İngilizce alias keyler (AI bazen İngilizce üretir) ─────────────
  dairy:           { tr: "Süt Ürünleri",       en: "Dairy",          ru: "Молочное",      ar: "منتجات الألبان" },
  milk:            { tr: "Süt Ürünleri",       en: "Dairy",          ru: "Молочное",      ar: "منتجات الألبان" },
  eggs:            { tr: "Yumurta",            en: "Eggs",           ru: "Яйцо",          ar: "البيض" },
  egg:             { tr: "Yumurta",            en: "Eggs",           ru: "Яйцо",          ar: "البيض" },
  fish:            { tr: "Balık",              en: "Fish",           ru: "Рыба",          ar: "السمك" },
  crustaceans:     { tr: "Kabuklu D.Ü.",       en: "Crustaceans",    ru: "Ракообразные",  ar: "القشريات" },
  nuts:            { tr: "Fındık",             en: "Tree Nuts",      ru: "Орехи",         ar: "المكسرات" },
  "tree nuts":     { tr: "Fındık",             en: "Tree Nuts",      ru: "Орехи",         ar: "المكسرات" },
  peanuts:         { tr: "Yer Fıstığı",        en: "Peanuts",        ru: "Арахис",        ar: "الفول السوداني" },
  peanut:          { tr: "Yer Fıstığı",        en: "Peanuts",        ru: "Арахис",        ar: "الفول السوداني" },
  soy:             { tr: "Soya",               en: "Soy",            ru: "Соя",           ar: "الصويا" },
  celery:          { tr: "Kereviz",            en: "Celery",         ru: "Сельдерей",     ar: "الكرفس" },
  mustard:         { tr: "Hardal",             en: "Mustard",        ru: "Горчица",       ar: "الخردل" },
  sesame:          { tr: "Susam",              en: "Sesame",         ru: "Кунжут",        ar: "السمسم" },
  molluscs:        { tr: "Yumuşakça",          en: "Molluscs",       ru: "Моллюски",      ar: "الرخويات" },
  mollusks:        { tr: "Yumuşakça",          en: "Molluscs",       ru: "Моллюски",      ar: "الرخويات" },
  sulphites:       { tr: "Sülfitler",          en: "Sulphites",      ru: "Сульфиты",      ar: "الكبريتيت" },
  sulfites:        { tr: "Sülfitler",          en: "Sulphites",      ru: "Сульфиты",      ar: "الكبريتيت" },
  kükürt:          { tr: "Sülfitler",          en: "Sulphites",      ru: "Сульфиты",      ar: "الكبريتيت" },
  wheat:           { tr: "Gluten",             en: "Gluten",         ru: "Глютен",        ar: "الغلوتين" },
  soybeans:        { tr: "Soya",               en: "Soy",            ru: "Соя",           ar: "الصويا" },
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
  mollusks:        "🦑",
  sülfitler:       "🧪",
  kükürt:          "🧪",
  // İngilizce alias ikonlar
  dairy:           "🥛",
  milk:            "🥛",
  eggs:            "🥚",
  egg:             "🥚",
  fish:            "🐟",
  crustaceans:     "🦐",
  nuts:            "🌰",
  "tree nuts":     "🌰",
  peanuts:         "🥜",
  peanut:          "🥜",
  soy:             "🫘",
  celery:          "🌿",
  mustard:         "🌻",
  sesame:          "🫙",
  sulphites:       "🧪",
  sulfites:        "🧪",
  wheat:           "🌾",
  soybeans:        "🫘",
};

const ALIAS_MAP: Record<string, string> = {
  // Türkçe varyantlar
  yer_fıstığı:    "yer fıstığı",
  "süt ürünleri": "süt",
  kükürt:         "sülfitler",
  molluscs:       "yumuşakça",
  mollusks:       "yumuşakça",
  // İngilizce alias → Türkçe kanonik
  dairy:          "süt",
  milk:           "süt",
  eggs:           "yumurta",
  egg:            "yumurta",
  fish:           "balık",
  crustaceans:    "kabuklu",
  nuts:           "fındık",
  "tree nuts":    "fındık",
  peanuts:        "yer fıstığı",
  peanut:         "yer fıstığı",
  soy:            "soya",
  soybeans:       "soya",
  celery:         "kereviz",
  mustard:        "hardal",
  sesame:         "susam",
  sulphites:      "sülfitler",
  sulfites:       "sülfitler",
  wheat:          "gluten",
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
