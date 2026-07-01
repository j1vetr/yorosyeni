import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { ChevronDown } from "lucide-react";
import { useMenu, formatPrice } from "@/contexts/menu-context";
import MenuHeader from "@/components/menu/menu-header";
import PageTransition from "@/components/menu/page-transition";
import { MenuLoadingScreen, MenuErrorScreen } from "@/components/menu/menu-states";
import { apiFetch } from "@/lib/api";

const ALLERGEN_ICONS: Record<string, string> = {
  gluten: "🌾",
  süt: "🥛",
  "süt ürünleri": "🥛",
  yumurta: "🥚",
  yer_fıstığı: "🥜",
  fındık: "🌰",
  balık: "🐟",
  kabuklu: "🦐",
  soya: "🫘",
  kereviz: "🌿",
  hardal: "🌻",
  susam: "🫙",
  kükürt: "⚗️",
  "lupin": "🌼",
  "molluscs": "🦪",
};

function getAllergenIcon(allergen: string): string {
  const lower = allergen.toLowerCase();
  for (const [key, icon] of Object.entries(ALLERGEN_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "⚠️";
}

export default function ProductDetailPage() {
  const { menu, lang, accent, loading, error, reload } = useMenu();
  const [, params] = useRoute("/categories/:categorySlug/:productSlug");
  const [, navigate] = useLocation();
  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  const tracked = { current: false };

  const categorySlug = params?.categorySlug;
  const productSlug = params?.productSlug;

  const category = menu?.categories.find((c) => c.slug === categorySlug);
  const product = category?.products.find((p) => p.slug === productSlug);

  useEffect(() => {
    if (product && !tracked.current) {
      tracked.current = true;
      apiFetch(`/products/${product.id}/view`, {
        method: "POST",
        body: JSON.stringify({ lang }),
      }).catch(() => {});
    }
  }, [product?.id]);

  if (loading) return <MenuLoadingScreen accent={accent} />;
  if (error) return <MenuErrorScreen error={error} reload={reload} accent={accent} />;

  if (!product || !category) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="text-center text-white/40">
          <div className="text-4xl mb-3">🍽️</div>
          <p>Ürün bulunamadı</p>
        </div>
      </div>
    );
  }

  const nf = product.nutritionFacts;
  const kcal = product.calories ?? nf?.energy;
  const kj = kcal ? Math.round(kcal * 4.184) : null;

  const maxMacro = Math.max(nf?.protein ?? 0, nf?.carbs ?? 0, nf?.fat ?? 0, 1);

  return (
    <PageTransition>
    <div className="luna-menu min-h-screen pb-8">
      <MenuHeader showBack />

      {/* Hero Image */}
      <div className="w-full" style={{ height: "52vw", maxHeight: "280px", minHeight: "180px" }}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: `linear-gradient(180deg, ${accent}22 0%, #0A0A0A 100%)` }}
          />
        )}
      </div>

      <div className="max-w-xl mx-auto px-4 pt-4 space-y-5">
        {/* Title + Price */}
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{product.name}</h1>
          {product.allergenNote && (
            <p className="text-sm font-medium mb-2" style={{ color: accent }}>
              {product.allergenNote}
            </p>
          )}
          {product.description && (
            <p className="text-sm text-white/50 leading-relaxed">{product.description}</p>
          )}
          <div className="flex items-center justify-between mt-3">
            <span className="text-2xl font-bold" style={{ color: accent }}>
              {formatPrice(product.price, product.currency)}
            </span>
          </div>
        </div>

        {/* Nutrition card */}
        {(kcal || kj) && (
          <div
            className="rounded-2xl p-4 flex items-center gap-4"
            style={{
              background: `linear-gradient(135deg, ${accent}18 0%, ${accent}06 100%)`,
              border: `1px solid ${accent}30`,
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: `${accent}20` }}
            >
              🔥
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-white/35 uppercase tracking-widest mb-1">
                Enerji Değeri
              </div>
              <div className="flex items-baseline gap-3 flex-wrap">
                {kcal && (
                  <span className="text-2xl font-bold text-white leading-none">
                    {kcal}{" "}
                    <span className="text-sm font-normal text-white/45">kcal</span>
                  </span>
                )}
                {kcal && kj && <span className="text-white/20 text-lg leading-none">·</span>}
                {kj && (
                  <span className="text-base font-semibold leading-none" style={{ color: `${accent}CC` }}>
                    {kj}{" "}
                    <span className="text-xs font-normal" style={{ color: `${accent}80` }}>kJ</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Allergens */}
        {product.allergens && product.allergens.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-white mb-3">Alerjenler</h2>
            <div className="grid grid-cols-4 gap-3">
              {product.allergens.map((a) => (
                <div key={a} className="flex flex-col items-center gap-1">
                  <div
                    className="w-12 h-12 rounded-full bg-[#1C1C1C] flex items-center justify-center text-xl border border-white/5"
                  >
                    {getAllergenIcon(a)}
                  </div>
                  <span className="text-[10px] text-white/40 text-center leading-tight capitalize">{a.charAt(0).toUpperCase() + a.slice(1)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ingredients accordion */}
        {product.ingredients && (
          <div className="bg-[#141414] rounded-2xl border border-white/5 overflow-hidden">
            <button
              onClick={() => setIngredientsOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-4"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">İçindekiler</span>
              </div>
              <ChevronDown
                className="w-4 h-4 text-white/40 transition-transform"
                style={{ transform: ingredientsOpen ? "rotate(180deg)" : "none" }}
              />
            </button>
            {ingredientsOpen && (
              <div className="px-4 pb-4">
                <p className="text-sm text-white/50 leading-relaxed">{product.ingredients}</p>
              </div>
            )}
          </div>
        )}

        {/* Nutrition bars */}
        {nf && (nf.protein || nf.carbs || nf.fat) ? (
          <div>
            <h2 className="text-base font-bold text-white mb-4">Besin Değerleri (Porsiyon)</h2>
            <div className="flex gap-6">
              {[
                { label: "Protein", value: nf.protein },
                { label: "Karbonhidrat", value: nf.carbs },
                { label: "Yağ", value: nf.fat },
              ].map(({ label, value }) =>
                value != null ? (
                  <div key={label} className="flex-1">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-xs text-white/50">{label}</span>
                      <span className="text-xs font-bold text-white">{value} g</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(value / maxMacro) * 100}%`, background: accent }}
                      />
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </div>
        ) : null}

        {/* Back button */}
        <button
          onClick={() => navigate(`/categories/${categorySlug}`)}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border text-sm font-bold tracking-widest transition-colors hover:bg-white/5"
          style={{ borderColor: `${accent}44`, color: accent }}
        >
          ← MENÜYE DÖN
        </button>

      </div>
    </div>
    </PageTransition>
  );
}
