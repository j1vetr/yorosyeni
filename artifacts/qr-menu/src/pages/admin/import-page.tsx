import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  Download, CheckCircle, AlertCircle, Loader2, Play,
  Sparkles, Globe, Flame,
} from "lucide-react";

/* ── shared SSE XHR hook ─────────────────────────────────────── */

type SseEvent =
  | { type: "log"; msg: string }
  | { type: "progress"; done: number; total: number; label: string }
  | { type: "done"; [k: string]: unknown }
  | { type: "error"; msg: string };

type RunStatus = "idle" | "running" | "done" | "error";

function useSseXhr(path: string) {
  const [status, setStatus] = useState<RunStatus>("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number; label: string } | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const logBoxRef = useRef<HTMLDivElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  function addLog(msg: string) {
    setLogs((prev) => {
      const next = [...prev, msg];
      setTimeout(() => {
        if (logBoxRef.current) logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
      }, 20);
      return next;
    });
  }

  function start(body: object) {
    if (status === "running") return;
    setStatus("running");
    setLogs([]);
    setProgress(null);
    setResult(null);
    setFatal(null);

    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("POST", `${base}${path}`, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Accept", "text/event-stream");

    let buffer = "";
    xhr.onprogress = () => {
      const chunk = xhr.responseText.slice(buffer.length);
      buffer = xhr.responseText;
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        try {
          const ev = JSON.parse(line.slice(6)) as SseEvent;
          if (ev.type === "log") addLog(ev.msg);
          if (ev.type === "progress") setProgress({ done: ev.done, total: ev.total, label: ev.label });
          if (ev.type === "done") { setResult(ev as Record<string, unknown>); setStatus("done"); }
          if (ev.type === "error") { setFatal(ev.msg); setStatus("error"); }
        } catch { /* partial */ }
      }
    };
    xhr.onerror = () => { setFatal("Ağ hatası"); setStatus("error"); };
    xhr.send(JSON.stringify(body));
  }

  function reset() { setStatus("idle"); setLogs([]); setProgress(null); setResult(null); setFatal(null); }

  return { status, logs, progress, result, fatal, logBoxRef, start, reset };
}

/* ── sub-components ──────────────────────────────────────────── */

function ProgressBar({ done, total, label }: { done: number; total: number; label: string }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-neutral-400">
        <span className="truncate max-w-xs">{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
        <div className="h-full bg-[#C9A84C] transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LogBox({ logs, ref: logRef }: { logs: string[]; ref: React.RefObject<HTMLDivElement | null> }) {
  if (!logs.length) return null;
  return (
    <div
      ref={logRef}
      className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 h-52 overflow-y-auto font-mono text-xs text-neutral-300 space-y-0.5"
    >
      {logs.map((l, i) => (
        <div
          key={i}
          className={
            l.includes("❌") ? "text-red-400"
            : l.includes("✓") || l.includes("✅") ? "text-green-400"
            : l.startsWith("  ⏭") ? "text-neutral-500"
            : ""
          }
        >{l}</div>
      ))}
    </div>
  );
}

/* ── Import from site ────────────────────────────────────────── */

function ImportSection() {
  const [siteUrl, setSiteUrl] = useState("https://yoros.dijita.com.tr");
  const { status, logs, progress, result, fatal, logBoxRef, start, reset } = useSseXhr("/api/import/scrape");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <Download className="w-5 h-5 text-[#C9A84C]" />
          Siteden İçe Aktar
        </h2>
        <p className="text-sm text-neutral-400">
          Dijita tabanlı herhangi bir menü sitesinin URL'sini girin. Tüm kategoriler, ürünler ve görseller çekilir.
          Mevcut kayıtlara dokunulmaz — sadece yeni olanlar eklenir.
        </p>
      </div>

      {/* URL input */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Kaynak Site URL</label>
        <input
          type="url"
          value={siteUrl}
          onChange={(e) => setSiteUrl(e.target.value)}
          disabled={status === "running"}
          placeholder="https://example.dijita.com.tr"
          className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#C9A84C] disabled:opacity-50 transition-colors"
        />
        <p className="text-xs text-neutral-600">
          Site yapısı: Dijita Restoran Sistemi tabanlı (/categories sayfası olan siteler)
        </p>
      </div>

      {status === "idle" && (
        <button
          onClick={() => start({ siteUrl })}
          disabled={!siteUrl.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] hover:bg-[#b8963e] text-black font-semibold rounded-lg transition-colors disabled:opacity-40"
        >
          <Play className="w-4 h-4" />
          İçe Aktarmayı Başlat
        </button>
      )}

      {status === "running" && (
        <div className="flex items-center gap-3 text-sm text-neutral-300">
          <Loader2 className="w-4 h-4 animate-spin text-[#C9A84C]" />
          Aktarılıyor… lütfen sayfayı kapatmayın.
        </div>
      )}

      {progress && status === "running" && <ProgressBar {...progress} />}
      <LogBox logs={logs} ref={logBoxRef} />

      {status === "done" && result && (
        <div className="bg-green-950/40 border border-green-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-green-400 font-semibold">
            <CheckCircle className="w-5 h-5" /> Aktarım tamamlandı
          </div>
          <div className="text-sm text-green-300">
            {String(result.categories)} kategori ve {String(result.products)} ürün eklendi.
          </div>
          {Array.isArray(result.errors) && result.errors.length > 0 && (
            <div className="text-xs text-yellow-400">
              {result.errors.length} hata:
              <ul className="list-disc list-inside mt-1">
                {(result.errors as string[]).slice(0, 8).map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
          <button onClick={reset} className="mt-2 px-4 py-1.5 text-sm bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors">
            Tekrar Çalıştır
          </button>
        </div>
      )}

      {status === "error" && fatal && (
        <div className="bg-red-950/40 border border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400 font-semibold mb-1">
            <AlertCircle className="w-5 h-5" /> Hata
          </div>
          <div className="text-sm text-red-300 font-mono">{fatal}</div>
          <button onClick={reset} className="mt-3 px-4 py-1.5 text-sm bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors">
            Tekrar Dene
          </button>
        </div>
      )}
    </div>
  );
}

/* ── AI Enrichment ───────────────────────────────────────────── */

interface EnrichStatus { total: number; withEn: number; withRu: number; withAr: number }

function EnrichSection() {
  const [stats, setStats] = useState<EnrichStatus | null>(null);
  const [langs, setLangs] = useState({ en: true, ru: true, ar: true });
  const [nutrition, setNutrition] = useState(true);
  const { status, logs, progress, result, fatal, logBoxRef, start, reset } = useSseXhr("/api/import/ai-enrich");

  useEffect(() => {
    apiFetch<EnrichStatus>("/import/enrich-status").then(setStats).catch(() => {});
  }, []);

  const selectedLangs = Object.entries(langs).filter(([, v]) => v).map(([k]) => k);

  const missingEn = stats ? stats.total - stats.withEn : null;
  const missingRu = stats ? stats.total - stats.withRu : null;
  const missingAr = stats ? stats.total - stats.withAr : null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#C9A84C]" />
          AI ile Zenginleştir
        </h2>
        <p className="text-sm text-neutral-400">
          Eksik dil çevirilerini ve besin değerlerini (kalori, protein, karbonhidrat, yağ) OpenAI ile otomatik doldurur.
          OpenAI API anahtarı Ayarlar sayfasında tanımlı olmalıdır.
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-neutral-900 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-white">{stats.total}</div>
            <div className="text-xs text-neutral-400 mt-0.5">Toplam Ürün</div>
          </div>
          {[
            { label: "İngilizce", missing: missingEn, flag: "🇬🇧" },
            { label: "Rusça", missing: missingRu, flag: "🇷🇺" },
            { label: "Arapça", missing: missingAr, flag: "🇸🇦" },
          ].map(({ label, missing, flag }) => (
            <div key={label} className="bg-neutral-900 rounded-lg p-3 text-center">
              <div className={`text-xl font-bold ${missing === 0 ? "text-green-400" : "text-yellow-400"}`}>
                {missing === 0 ? "✓" : missing}
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">{flag} {label} eksik</div>
            </div>
          ))}
        </div>
      )}

      {/* Options */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-3">
        <div className="text-sm font-medium text-white mb-2">Zenginleştirme seçenekleri</div>

        <div className="flex flex-wrap gap-3">
          {[
            { key: "en", flag: "🇬🇧", label: "İngilizce" },
            { key: "ru", flag: "🇷🇺", label: "Rusça" },
            { key: "ar", flag: "🇸🇦", label: "Arapça" },
          ].map(({ key, flag, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={langs[key as keyof typeof langs]}
                onChange={(e) => setLangs((p) => ({ ...p, [key]: e.target.checked }))}
                disabled={status === "running"}
                className="accent-[#C9A84C]"
              />
              <span className="text-sm text-neutral-300">{flag} {label} çevirisi</span>
            </label>
          ))}
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={nutrition}
            onChange={(e) => setNutrition(e.target.checked)}
            disabled={status === "running"}
            className="accent-[#C9A84C]"
          />
          <span className="text-sm text-neutral-300 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            Kalori ve besin değerleri (kalori, enerji kJ, protein, karbonhidrat, yağ)
          </span>
        </label>

        <p className="text-xs text-neutral-500">
          Sadece eksik olanlar doldurulur — mevcut çeviriler ve değerler değiştirilmez.
        </p>
      </div>

      {status === "idle" && (
        <button
          onClick={() => start({ languages: selectedLangs, nutrition })}
          disabled={selectedLangs.length === 0 && !nutrition}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] hover:bg-[#b8963e] text-black font-semibold rounded-lg transition-colors disabled:opacity-40"
        >
          <Sparkles className="w-4 h-4" />
          Zenginleştirmeyi Başlat
        </button>
      )}

      {status === "running" && (
        <div className="flex items-center gap-3 text-sm text-neutral-300">
          <Loader2 className="w-4 h-4 animate-spin text-[#C9A84C]" />
          AI işliyor… lütfen sayfayı kapatmayın.
        </div>
      )}

      {progress && status === "running" && <ProgressBar {...progress} />}
      <LogBox logs={logs} ref={logBoxRef} />

      {status === "done" && result && (
        <div className="bg-green-950/40 border border-green-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-green-400 font-semibold">
            <CheckCircle className="w-5 h-5" /> Zenginleştirme tamamlandı
          </div>
          <div className="text-sm text-green-300">{String(result.enriched)} ürün zenginleştirildi.</div>
          {Array.isArray(result.errors) && result.errors.length > 0 && (
            <div className="text-xs text-yellow-400">
              {result.errors.length} hata:
              <ul className="list-disc list-inside mt-1">
                {(result.errors as string[]).slice(0, 8).map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
          <button onClick={() => { reset(); apiFetch<EnrichStatus>("/import/enrich-status").then(setStats).catch(() => {}); }}
            className="mt-2 px-4 py-1.5 text-sm bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors">
            Tekrar Çalıştır
          </button>
        </div>
      )}

      {status === "error" && fatal && (
        <div className="bg-red-950/40 border border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400 font-semibold mb-1">
            <AlertCircle className="w-5 h-5" /> Hata
          </div>
          <div className="text-sm text-red-300 font-mono">{fatal}</div>
          <button onClick={reset} className="mt-3 px-4 py-1.5 text-sm bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors">
            Tekrar Dene
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */

export default function ImportPage() {
  const [tab, setTab] = useState<"import" | "enrich">("import");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white mb-1">İçe Aktarma & Zenginleştirme</h1>
        <p className="text-sm text-neutral-400">Dış siteden veri çekme ve AI ile otomatik doldurma araçları.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-900 rounded-lg p-1 w-fit">
        {[
          { key: "import", label: "Siteden Aktar", icon: Download },
          { key: "enrich", label: "AI Zenginleştir", icon: Sparkles },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === key ? "bg-white text-black" : "text-neutral-400 hover:text-white"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-neutral-800" />

      {tab === "import" ? <ImportSection /> : <EnrichSection />}
    </div>
  );
}
