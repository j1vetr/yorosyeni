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

export function getAllergenIcon(allergen: string): string {
  const lower = allergen.trim().toLowerCase();
  for (const [key, icon] of Object.entries(ALLERGEN_ICONS)) {
    if (lower === key || lower.includes(key)) return icon;
  }
  return "⚠️";
}

export function getAllergenLabel(key: string, lang: string): string {
  const normalized = key.trim().toLowerCase();
  const labels = ALLERGEN_LABELS[normalized];
  if (!labels) return key.charAt(0).toUpperCase() + key.slice(1);
  return labels[lang] ?? labels["tr"] ?? key;
}
