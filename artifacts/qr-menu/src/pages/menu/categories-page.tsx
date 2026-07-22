import { useLocation } from "wouter";
import { useMenu } from "@/contexts/menu-context";
import MenuHeader from "@/components/menu/menu-header";
import BottomNav from "@/components/menu/bottom-nav";
import PageTransition from "@/components/menu/page-transition";
import { MenuLoadingScreen, MenuErrorScreen } from "@/components/menu/menu-states";
import { t } from "@/lib/i18n";

const CATEGORY_ICONS: Record<string, string> = {
  baslangiclar: "🥗", salatalar: "🥙", corbalar: "🍲",
  "ana-yemekler": "🥩", tatlilar: "🍮", icecekler: "🥤",
  pizzalar: "🍕", burgerler: "🍔", makarnalar: "🍝",
  deniz: "🦞", vejetaryen: "🌱", vegan: "🌿", ozel: "⭐",
};

function getCategoryIcon(slug: string): string {
  const lower = slug.toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "🍽️";
}

export default function CategoriesPage() {
  const { menu, lang, accent, loading, error, reload } = useMenu();
  const [, navigate] = useLocation();
  const tr = t(lang);

  if (loading) return <MenuLoadingScreen accent={accent} />;
  if (error)   return <MenuErrorScreen error={error} reload={reload} accent={accent} />;
  if (!menu)   return null;

  return (
    <PageTransition>
      <div className="luna-menu min-h-screen pb-28">
        <MenuHeader showBack />

        <div className="max-w-xl mx-auto px-4 pt-6">
          <h1 className="text-4xl font-bold text-white tracking-tight mb-1">{tr.categories}</h1>
          <div className="w-10 h-0.5 mb-3 rounded-full" style={{ background: accent }} />
          <p className="text-sm text-white/40 mb-6">{tr.categoriesSubtitle}</p>

          <div className="grid grid-cols-2 gap-3">
            {menu.categories.map((cat) => {
              const thumb = cat.imageUrl ?? cat.products.find((p) => p.imageUrl)?.imageUrl;
              const icon  = cat.emoji || getCategoryIcon(cat.slug);

              return (
                <button
                  key={cat.slug}
                  onClick={() => navigate(`/categories/${cat.slug}`)}
                  className="relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#141414] active:scale-[0.97] transition-transform text-left"
                >
                  {/* Thumbnail / colour block */}
                  <div className="w-full aspect-[4/3] relative overflow-hidden">
                    {thumb ? (
                      /* Fotoğraf varsa: sadece fotoğraf, ikon yok */
                      <img
                        src={thumb}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      /* Fotoğraf yoksa: renkli arka plan + büyük emoji ortada */
                      <div
                        className="w-full h-full flex items-center justify-center text-5xl"
                        style={{ background: `${accent}18` }}
                      >
                        {icon}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="px-3 py-2.5">
                    <p className="text-white font-semibold text-sm leading-snug line-clamp-2 mb-0.5">
                      {cat.name}
                    </p>
                    <p className="text-xs" style={{ color: `${accent}cc` }}>
                      {tr.items(cat.products.length)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <BottomNav />
      </div>
    </PageTransition>
  );
}
