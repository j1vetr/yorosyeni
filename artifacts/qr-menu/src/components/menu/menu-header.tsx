import { useLocation } from "wouter";
import { ArrowLeft, Globe, ChevronDown, MapPin, Wifi, X, Copy, ExternalLink } from "lucide-react";
import { useMenu } from "@/contexts/menu-context";
import { FlagImg } from "@/components/menu/flag-img";
import { useState, useRef, useEffect } from "react";

type InfoPanel = "location" | "wifi" | null;

interface MenuHeaderProps {
  showBack?: boolean;
}

export default function MenuHeader({ showBack }: MenuHeaderProps) {
  const { menu, lang, setLang, accent } = useMenu();
  const [, navigate] = useLocation();
  const [langOpen,  setLangOpen]  = useState(false);
  const [infoPanel, setInfoPanel] = useState<InfoPanel>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const r            = menu?.restaurant;
  const locationText = r?.locationNotes?.[lang] || r?.locationNotes?.["tr"] || r?.address;
  const hasLocation  = !!(locationText || r?.mapsUrl);
  const hasWifi      = !!(r?.wifiName);

  function copyText(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  /* ─── label helpers ─── */
  function t(tr: string, en: string, ru: string, ar: string) {
    if (lang === "en") return en;
    if (lang === "ru") return ru;
    if (lang === "ar") return ar;
    return tr;
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/8">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-3">

          {/* ── Left: back + info icons ── */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {showBack && (
              <button
                onClick={() => window.history.back()}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-white" />
              </button>
            )}

            {(hasLocation || hasWifi) && (
              <div className="flex items-center gap-1">
                {hasLocation && (
                  <button
                    onClick={() => setInfoPanel(infoPanel === "location" ? null : "location")}
                    className="w-8 h-8 flex items-center justify-center rounded-full border transition-colors"
                    style={{
                      background: infoPanel === "location" ? `${accent}22` : "rgba(255,255,255,0.05)",
                      borderColor: infoPanel === "location" ? `${accent}66` : "rgba(255,255,255,0.10)",
                      color: infoPanel === "location" ? accent : "rgba(255,255,255,0.55)",
                    }}
                  >
                    <MapPin style={{ width: 15, height: 15 }} />
                  </button>
                )}
                {hasWifi && (
                  <button
                    onClick={() => setInfoPanel(infoPanel === "wifi" ? null : "wifi")}
                    className="w-8 h-8 flex items-center justify-center rounded-full border transition-colors"
                    style={{
                      background: infoPanel === "wifi" ? `${accent}22` : "rgba(255,255,255,0.05)",
                      borderColor: infoPanel === "wifi" ? `${accent}66` : "rgba(255,255,255,0.10)",
                      color: infoPanel === "wifi" ? accent : "rgba(255,255,255,0.55)",
                    }}
                  >
                    <Wifi style={{ width: 15, height: 15 }} />
                  </button>
                )}
              </div>
            )}

            {/* spacer when no back & no icons — keeps logo centered */}
            {!showBack && !hasLocation && !hasWifi && <div className="w-8" />}
          </div>

          {/* ── Center: logo ── */}
          <div className="flex flex-col items-center flex-1 min-w-0">
            {r?.logoUrl ? (
              <img
                src={r.logoUrl}
                alt={r.name}
                style={{
                  maxWidth: `${r.logoWidth ?? 120}px`,
                  maxHeight: "80px",
                  width: "100%",
                  objectFit: "contain",
                  display: "block",
                  background: "transparent",
                }}
              />
            ) : (
              <span className="font-bold text-white tracking-widest text-sm uppercase">
                {r?.name ?? "LUNA"}
              </span>
            )}
            {r?.tagline && (
              <span className="text-[9px] tracking-[0.2em] text-white/30 uppercase">
                {r.tagline}
              </span>
            )}
          </div>

          {/* ── Right: language switcher ── */}
          <div ref={dropRef} className="w-auto flex-shrink-0 relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <FlagImg code={lang} size={18} />
              <ChevronDown
                className={`w-3 h-3 text-white/50 transition-transform ${langOpen ? "rotate-180" : ""}`}
              />
            </button>
            {langOpen && menu && menu.languages.length > 1 && (
              <div className="absolute right-0 top-full mt-2 min-w-[140px] bg-[#1C1C1C] rounded-xl border border-white/10 shadow-xl overflow-hidden z-50">
                {menu.languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setLangOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-white hover:bg-white/5 transition-colors"
                    style={lang === l.code ? { color: accent } : {}}
                  >
                    <FlagImg code={l.code} size={20} />
                    <span>{l.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Centered modal ── */}
      {infoPanel && r && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setInfoPanel(null)}
          />
          <div
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[88vw] max-w-sm rounded-2xl shadow-2xl p-5 space-y-4"
            style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: `${accent}22`, color: accent }}
                >
                  {infoPanel === "location"
                    ? <MapPin style={{ width: 15, height: 15 }} />
                    : <Wifi style={{ width: 15, height: 15 }} />}
                </div>
                <span className="text-sm font-semibold text-white">
                  {infoPanel === "location"
                    ? t("Konum", "Location", "Адрес", "الموقع")
                    : "WiFi"}
                </span>
              </div>
              <button
                onClick={() => setInfoPanel(null)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Location */}
            {infoPanel === "location" && (
              <div className="space-y-3">
                {locationText && (
                  <p className="text-sm text-neutral-300 leading-relaxed">{locationText}</p>
                )}
                {r.mapsUrl && (
                  <a
                    href={r.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl text-sm font-medium transition-colors"
                    style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}44` }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {t("Haritada Aç", "Open in Maps", "Открыть карту", "افتح الخريطة")}
                  </a>
                )}
              </div>
            )}

            {/* WiFi */}
            {infoPanel === "wifi" && (
              <div className="space-y-2">
                <div className="bg-neutral-800/80 rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">
                      {t("Ağ Adı", "Network", "Сеть", "الشبكة")}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{r.wifiName}</p>
                      <button
                        onClick={() => copyText(r.wifiName!)}
                        className="text-neutral-500 hover:text-white transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-white/5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {r.wifiPassword && (
                    <div className="border-t border-white/8 pt-3">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">
                        {t("Şifre", "Password", "Пароль", "كلمة المرور")}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-mono text-white tracking-wider">{r.wifiPassword}</p>
                        <button
                          onClick={() => copyText(r.wifiPassword!)}
                          className="text-neutral-500 hover:text-white transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-white/5"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
