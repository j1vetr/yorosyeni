import { useState } from "react";
import { MapPin, Wifi, X, Copy, ExternalLink } from "lucide-react";
import { useMenu } from "@/contexts/menu-context";

type Panel = "location" | "wifi" | null;

export default function FloatingInfo() {
  const { menu, lang, accent } = useMenu();
  const [open, setOpen] = useState<Panel>(null);

  if (!menu) return null;

  const r = menu.restaurant;
  const locationText = r.locationNotes?.[lang] || r.locationNotes?.["tr"] || r.address;
  const hasLocation = !!(locationText || r.mapsUrl);
  const hasWifi = !!(r.wifiName);

  if (!hasLocation && !hasWifi) return null;

  function copyText(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <>
      {/* ── Floating buttons ── */}
      <div className="fixed left-3 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2.5">
        {hasLocation && (
          <button
            onClick={() => setOpen(open === "location" ? null : "location")}
            className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
            style={{
              background: open === "location" ? accent : "rgba(20,20,20,0.92)",
              border: `1.5px solid ${open === "location" ? accent : "rgba(255,255,255,0.12)"}`,
              color: open === "location" ? "#000" : "rgba(255,255,255,0.75)",
            }}
          >
            <MapPin className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
          </button>
        )}
        {hasWifi && (
          <button
            onClick={() => setOpen(open === "wifi" ? null : "wifi")}
            className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
            style={{
              background: open === "wifi" ? accent : "rgba(20,20,20,0.92)",
              border: `1.5px solid ${open === "wifi" ? accent : "rgba(255,255,255,0.12)"}`,
              color: open === "wifi" ? "#000" : "rgba(255,255,255,0.75)",
            }}
          >
            <Wifi className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
          </button>
        )}
      </div>

      {/* ── Popup panel ── */}
      {open && (
        <>
          {/* Backdrop (mobile tap-away) */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(null)}
          />

          <div
            className="fixed left-16 top-1/2 -translate-y-1/2 z-50 w-64 rounded-2xl shadow-2xl p-4 space-y-3"
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {open === "location"
                  ? <MapPin className="w-4 h-4" style={{ color: accent }} />
                  : <Wifi className="w-4 h-4" style={{ color: accent }} />}
                <span className="text-sm font-semibold text-white">
                  {open === "location" ? (lang === "tr" ? "Konum" : lang === "en" ? "Location" : lang === "ar" ? "الموقع" : lang === "ru" ? "Адрес" : "Konum")
                    : (lang === "tr" ? "WiFi" : "WiFi")}
                </span>
              </div>
              <button onClick={() => setOpen(null)} className="text-neutral-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Location panel */}
            {open === "location" && (
              <div className="space-y-3">
                {locationText && (
                  <p className="text-sm text-neutral-300 leading-relaxed">{locationText}</p>
                )}
                {r.mapsUrl && (
                  <a
                    href={r.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 w-full justify-center py-2 rounded-xl text-sm font-medium transition-colors"
                    style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}44` }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {lang === "tr" ? "Haritada Aç" : lang === "en" ? "Open in Maps" : lang === "ar" ? "افتح الخريطة" : lang === "ru" ? "Открыть карту" : "Haritada Aç"}
                  </a>
                )}
              </div>
            )}

            {/* WiFi panel */}
            {open === "wifi" && (
              <div className="space-y-2">
                <div className="bg-neutral-800 rounded-xl p-3 space-y-2">
                  <div>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-0.5">
                      {lang === "tr" ? "Ağ Adı" : lang === "en" ? "Network" : lang === "ar" ? "الشبكة" : lang === "ru" ? "Сеть" : "Ağ Adı"}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{r.wifiName}</p>
                      <button onClick={() => copyText(r.wifiName!)} className="text-neutral-500 hover:text-white transition-colors flex-shrink-0">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {r.wifiPassword && (
                    <div className="border-t border-neutral-700 pt-2">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-0.5">
                        {lang === "tr" ? "Şifre" : lang === "en" ? "Password" : lang === "ar" ? "كلمة المرور" : lang === "ru" ? "Пароль" : "Şifre"}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-mono text-white">{r.wifiPassword}</p>
                        <button onClick={() => copyText(r.wifiPassword!)} className="text-neutral-500 hover:text-white transition-colors flex-shrink-0">
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
