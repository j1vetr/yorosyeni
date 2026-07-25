import { useRoute, useLocation } from "wouter";
import { useMenu, formatPrice } from "@/contexts/menu-context";
import MenuHeader from "@/components/menu/menu-header";
import BottomNav from "@/components/menu/bottom-nav";
import PageTransition from "@/components/menu/page-transition";
import { MenuLoadingScreen, MenuErrorScreen } from "@/components/menu/menu-states";
import { t } from "@/lib/i18n";

export default function CategoryDetailPage() {
  const { menu, lang, accent, loading, error, reload } = useMenu();
  const [, params] = useRoute("/categories/:categorySlug");
  const [, navigate] = useLocation();
  const tr = t(lang);

  const categorySlug = params?.categorySlug;
  const category = menu?.categories.find((c) => c.slug === categorySlug);

  if (loading) return <MenuLoadingScreen accent={accent} />;
  if (error) return <MenuErrorScreen error={error} reload={reload} accent={accent} />;

  if (!menu || !category) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="text-center text-white/40">
          <div className="text-4xl mb-3">🍽️</div>
          <p>{tr.categoryNotFound}</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="luna-menu min-h-screen pb-24">
        <MenuHeader showBack />

        {/* ── Horizontal category scroll ── */}
        <div className="overflow-x-auto scrollbar-none border-b border-white/6">
          <div className="flex gap-3 px-4 py-3 w-max">
            {menu.categories.map((cat) => {
              const isActive = cat.slug === categorySlug;
              const thumb =
                (cat as { imageUrl?: string }).imageUrl ??
                cat.products.find((p) => p.imageUrl)?.imageUrl;
              return (
                <button
                  key={cat.slug}
                  onClick={() => navigate(`/categories/${cat.slug}`)}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16"
                >
                  <div
                    className="w-16 h-16 rounded-xl relative overflow-hidden transition-all"
                    style={{
                      border: isActive
                        ? `2px solid ${accent}`
                        : "2px solid transparent",
                    }}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-2xl"
                        style={{
                          background: isActive
                            ? `${accent}20`
                            : "rgba(255,255,255,0.07)",
                        }}
                      >
                        {(cat as { emoji?: string }).emoji || "🍽️"}
                      </div>
                    )}
                  </div>
                  <span
                    className="text-[10px] font-medium leading-tight text-center w-full line-clamp-2"
                    style={{
                      color: isActive ? accent : "rgba(255,255,255,0.5)",
                    }}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Page content ── */}
        <div className="max-w-xl mx-auto px-4 pt-4">
          <h1 className="text-2xl font-bold text-white tracking-tight mb-4">
            {category.name}
          </h1>

          {/* Category note */}
          {(category as { note?: string }).note && (
            <div className="bg-white/8 border border-white/12 rounded-2xl px-5 py-4 mb-5 text-center">
              <p className="text-white/80 text-sm leading-relaxed">
                {(category as { note?: string }).note}
              </p>
            </div>
          )}

          {/* 2-column product grid */}
          {category.products.length === 0 && (
            <p className="mt-6 text-center text-sm text-white/40">{tr.noResults}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            {category.products.map((product) => (
              <button
                key={product.id}
                onClick={() =>
                  navigate(`/categories/${categorySlug}/${product.slug}`)
                }
                className="bg-[#141414] rounded-2xl overflow-hidden border border-white/5 hover:bg-[#1a1a1a] transition-colors text-left"
              >
                {/* 4:3 image */}
                <div className="w-full aspect-[4/3] bg-[#1C1C1C] overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-3xl"
                      style={{ background: `${accent}11` }}
                    >
                      🍽️
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="px-3 py-2.5">
                  <h3 className="font-bold text-white text-xs leading-snug mb-1.5 line-clamp-2">
                    {product.name}
                  </h3>
                  <span className="text-sm font-bold" style={{ color: accent }}>
                    {formatPrice(product.price, product.currency)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <BottomNav />
      </div>
    </PageTransition>
  );
}
