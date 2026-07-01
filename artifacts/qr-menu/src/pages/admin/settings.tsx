import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

interface Settings {
  id?: number;
  slug: string;
  restaurantName: string;
  logoUrl?: string;
  primaryColor: string;
  currency: string;
  defaultLanguage: string;
  openAiKey?: string;
}

interface Language {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

const LANG_FLAGS: Record<string, string> = { tr: "🇹🇷", en: "🇬🇧", ru: "🇷🇺", ar: "🇸🇦" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-neutral-400 uppercase tracking-widest mb-2">{label}</label>
      {children}
    </div>
  );
}

export default function AdminSettings() {
  const { toast } = useToast();
  const [form, setForm] = useState<Settings>({
    slug: "",
    restaurantName: "",
    primaryColor: "#000000",
    currency: "TRY",
    defaultLanguage: "tr",
  });
  const [languages, setLanguages] = useState<Language[]>([]);
  const [newLang, setNewLang] = useState({ code: "", name: "" });
  const [saving, setSaving] = useState(false);
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    apiFetch<Settings>("/settings")
      .then((s) => {
        setForm(s);
        if (s.slug) {
          const base = window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, "");
          setQrUrl(`${base}/menu/${s.slug}`);
        }
      })
      .catch(() => {});
    loadLanguages();
  }, []);

  async function loadLanguages() {
    apiFetch<Language[]>("/languages").then(setLanguages);
  }

  function set(field: keyof Settings, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await apiFetch("/settings", { method: "PUT", body: JSON.stringify(form) });
      if (form.slug) {
        const base = window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, "");
        setQrUrl(`${base}/menu/${form.slug}`);
      }
      toast({ title: "Ayarlar kaydedildi" });
    } catch (err) {
      toast({ title: "Hata", description: String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function addLanguage() {
    if (!newLang.code || !newLang.name) return;
    try {
      await apiFetch("/languages", {
        method: "POST",
        body: JSON.stringify({ ...newLang, isActive: true, sortOrder: languages.length }),
      });
      setNewLang({ code: "", name: "" });
      loadLanguages();
    } catch (err) {
      toast({ title: "Hata", description: String(err), variant: "destructive" });
    }
  }

  async function toggleLanguage(lang: Language) {
    await apiFetch(`/languages/${lang.id}`, {
      method: "PUT",
      body: JSON.stringify({ isActive: !lang.isActive }),
    });
    loadLanguages();
  }

  async function deleteLanguage(id: number) {
    if (!confirm("Bu dili silmek istediğinizden emin misiniz?")) return;
    await apiFetch(`/languages/${id}`, { method: "DELETE" });
    loadLanguages();
  }

  const inputCls = "w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors";

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ayarlar</h1>
          <p className="text-neutral-400 text-sm mt-1">Restoran bilgileri ve yapılandırma</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-semibold rounded-full hover:bg-neutral-100 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-medium text-white uppercase tracking-widest">Restoran Bilgileri</h2>
        <Field label="Restoran Adı">
          <input value={form.restaurantName} onChange={(e) => set("restaurantName", e.target.value)} className={inputCls} placeholder="Restoran Adı" />
        </Field>
        <Field label="Slug (Menü URL'si)">
          <input value={form.slug} onChange={(e) => set("slug", e.target.value)} className={inputCls} placeholder="restoran-adi" />
          {form.slug && (
            <p className="mt-1 text-xs text-neutral-500">Menü linki: <span className="text-neutral-300">/menu/{form.slug}</span></p>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Para Birimi">
            <select value={form.currency} onChange={(e) => set("currency", e.target.value)} className={inputCls}>
              <option value="TRY">TRY (₺)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </Field>
          <Field label="Varsayılan Dil">
            <select value={form.defaultLanguage} onChange={(e) => set("defaultLanguage", e.target.value)} className={inputCls}>
              {languages.map((l) => (
                <option key={l.code} value={l.code}>{LANG_FLAGS[l.code] ?? "🌐"} {l.name}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Logo URL">
          <input value={form.logoUrl ?? ""} onChange={(e) => set("logoUrl", e.target.value)} className={inputCls} placeholder="https://..." />
        </Field>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-medium text-white uppercase tracking-widest">AI İçerik Üretimi</h2>
        <Field label="OpenAI API Anahtarı">
          <input
            type="password"
            value={form.openAiKey ?? ""}
            onChange={(e) => set("openAiKey", e.target.value)}
            className={inputCls}
            placeholder="sk-..."
          />
          <p className="mt-1 text-xs text-neutral-500">Ürün açıklamalarını AI ile üretmek için kullanılır</p>
        </Field>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-medium text-white uppercase tracking-widest">Diller</h2>
        <div className="space-y-2">
          {languages.map((lang) => (
            <div key={lang.id} className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-0">
              <div className="flex items-center gap-3">
                <span>{LANG_FLAGS[lang.code] ?? "🌐"}</span>
                <span className="text-sm text-white">{lang.name}</span>
                <span className="text-xs text-neutral-500 uppercase">{lang.code}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleLanguage(lang)}
                  className={`text-xs px-2 py-0.5 rounded-full transition-colors ${lang.isActive ? "bg-emerald-900/40 text-emerald-400" : "bg-neutral-800 text-neutral-500"}`}
                >
                  {lang.isActive ? "Aktif" : "Pasif"}
                </button>
                <button onClick={() => deleteLanguage(lang.id)} className="text-neutral-600 hover:text-red-400 text-xs transition-colors">
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <input
            value={newLang.code}
            onChange={(e) => setNewLang((p) => ({ ...p, code: e.target.value }))}
            placeholder="Kod (tr)"
            className="flex-none w-20 bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white"
          />
          <input
            value={newLang.name}
            onChange={(e) => setNewLang((p) => ({ ...p, name: e.target.value }))}
            placeholder="Dil adı"
            className="flex-1 bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white"
          />
          <button onClick={addLanguage} className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-full hover:bg-neutral-100 transition-colors">
            Ekle
          </button>
        </div>
      </div>

      {qrUrl && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h2 className="text-sm font-medium text-white uppercase tracking-widest mb-3">Menü Bağlantısı</h2>
          <a href={qrUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-neutral-300 hover:text-white underline break-all">
            {qrUrl}
          </a>
        </div>
      )}
    </div>
  );
}
