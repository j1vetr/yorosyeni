import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { apiFetch } from "@/lib/api";
import { ChevronDown, Info } from "lucide-react";

interface ProductData {
  id: number;
  slug: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  imageUrl?: string;
  calories?: number;
  allergens?: string[];
}

interface CategoryData {
  id: number;
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  products: ProductData[];
}

interface MenuData {
  restaurant: {
    name: string;
    logoUrl?: string;
    primaryColor?: string;
    currency?: string;
  };
  languages: { code: string; name: string }[];
  currentLanguage: string;
  categories: CategoryData[];
}

const LANG_FLAGS: Record<string, string> = { tr: "🇹🇷", en: "🇬🇧", ru: "🇷🇺", ar: "🇸🇦" };
const RTL_LANGS = ["ar", "he", "fa"];

function formatPrice(price: number, currency: string) {
  const symbols: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€", GBP: "£" };
  const sym = symbols[currency] ?? currency;
  return `${sym}${price.toFixed(2)}`;
}

function ProductCard({
  product,
  lang,
  slug,
}: {
  product: ProductData;
  lang: string;
  slug: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [tracked, setTracked] = useState(false);

  function handleExpand() {
    setExpanded((v) => !v);
    if (!tracked) {
      setTracked(true);
      apiFetch(`/products/${product.id}/view`, {
        method: "POST",
        body: JSON.stringify({ lang }),
      }).catch(() => {});
    }
  }

  return (
    <div className="border-b border-neutral-100 last:border-0">
      <button
        className="w-full flex items-center gap-4 py-4 text-left hover:bg-neutral-50 transition-colors px-1 -mx-1 rounded-lg"
        onClick={handleExpand}
      >
        {product.imageUrl && (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-neutral-900 text-sm leading-snug">{product.name}</h3>
            {product.calories && (
              <span className="text-xs text-neutral-400 flex-shrink-0">{product.calories} kcal</span>
            )}
          </div>
          {product.description && !expanded && (
            <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{product.description}</p>
          )}
          <div className="mt-1.5 font-bold text-neutral-900 text-sm">
            {formatPrice(product.price, product.currency)}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="pb-4 px-1 space-y-2">
          {product.description && (
            <p className="text-sm text-neutral-600 leading-relaxed">{product.description}</p>
          )}
          {product.allergens && product.allergens.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Info className="w-3 h-3 text-amber-500" />
              {product.allergens.map((a) => (
                <span key={a} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MenuPage() {
  const { slug } = useParams<{ slug: string }>();
  const [menu, setMenu] = useState<MenuData | null>(null);
  const [lang, setLang] = useState("tr");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const trackedView = useRef(false);
  const categoryRefs = useRef<Record<number, HTMLDivElement | null>>({});

  async function loadMenu(language: string) {
    try {
      const data = await apiFetch<MenuData>(`/menu/${slug}?lang=${language}`);
      setMenu(data);
      if (data.categories[0]) setActiveCategory(data.categories[0].id);
    } catch {
      setError("Menü bulunamadı");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMenu(lang);
  }, [slug, lang]);

  useEffect(() => {
    if (menu && !trackedView.current) {
      trackedView.current = true;
      apiFetch(`/menu/${slug}/view`, {
        method: "POST",
        body: JSON.stringify({ lang }),
      }).catch(() => {});
    }
  }, [menu]);

  function scrollToCategory(id: number) {
    setActiveCategory(id);
    categoryRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const isRtl = RTL_LANGS.includes(lang);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-neutral-400 text-sm">Yükleniyor...</div>
      </div>
    );
  }

  if (error || !menu) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🍽️</div>
          <h1 className="text-xl font-bold text-neutral-900">Menü bulunamadı</h1>
          <p className="text-neutral-500 mt-2 text-sm">Bu QR kod geçersiz olabilir</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-white ${isRtl ? "rtl" : "ltr"}`} dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-neutral-100">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {menu.restaurant.logoUrl && (
              <img src={menu.restaurant.logoUrl} alt={menu.restaurant.name} className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
            )}
            <h1 className="font-bold text-neutral-900 text-sm truncate">{menu.restaurant.name}</h1>
          </div>
          {/* Language switcher */}
          {menu.languages.length > 1 && (
            <div className="flex items-center gap-1">
              {menu.languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  title={l.name}
                  className={`w-8 h-8 rounded-full text-sm transition-all ${lang === l.code ? "bg-black text-white" : "text-neutral-500 hover:bg-neutral-100"}`}
                >
                  {LANG_FLAGS[l.code] ?? l.code.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category nav */}
        {menu.categories.length > 1 && (
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-1 px-4 pb-2 w-max">
              {menu.categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => scrollToCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                    activeCategory === cat.id
                      ? "bg-black text-white"
                      : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Categories */}
      <main className="max-w-xl mx-auto px-4 pb-16">
        {menu.categories.map((cat) => (
          <section
            key={cat.id}
            ref={(el) => { categoryRefs.current[cat.id] = el; }}
            className="pt-8"
          >
            <div className="mb-4">
              <h2 className="text-xl font-bold text-neutral-900">{cat.name}</h2>
              {cat.description && <p className="text-sm text-neutral-500 mt-1">{cat.description}</p>}
            </div>
            {cat.imageUrl && (
              <img src={cat.imageUrl} alt={cat.name} className="w-full h-40 object-cover rounded-2xl mb-4" />
            )}
            <div>
              {cat.products.length === 0 ? (
                <p className="text-sm text-neutral-400 py-4">Bu kategoride ürün bulunmuyor</p>
              ) : (
                cat.products.map((product) => (
                  <ProductCard key={product.id} product={product} lang={lang} slug={slug!} />
                ))
              )}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
