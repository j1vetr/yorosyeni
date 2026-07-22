import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Save, Copy, ExternalLink, Upload, ImageIcon, X, Wifi, MapPin } from "lucide-react";

interface Settings {
  id?: number;
  slug: string;
  restaurantName: string;
  logoUrl?: string;
  logoWidth?: number;
  tagline?: string;
  primaryColor: string;
  currency: string;
  defaultLanguage: string;
  openAiKey?: string;
  priceUpdatedAt?: string;
  wifiName?: string;
  wifiPassword?: string;
  mapsUrl?: string;
  locationNotes?: Record<string, string>;
}

interface Language {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

const LANG_FLAGS: Record<string, string> = { tr: "🇹🇷", en: "🇬🇧", ru: "🇷🇺", ar: "🇸🇦" };

const PRESET_COLORS = [
  { label: "Altın", value: "#C9A84C" },
  { label: "Amber", value: "#D97706" },
  { label: "Bakır", value: "#B45309" },
  { label: "Gül", value: "#E11D48" },
  { label: "Mor", value: "#7C3AED" },
  { label: "Mavi", value: "#2563EB" },
  { label: "Yeşil", value: "#16A34A" },
  { label: "Beyaz", value: "#F5F5F5" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-neutral-400 uppercase tracking-widest mb-2">{label}</label>
      {children}
    </div>
  );
}

async function compressToTarget(img: HTMLImageElement, maxWidth: number, targetBytes: number): Promise<Blob> {
  const scale = Math.min(1, maxWidth / img.width);
  const canvas = document.createElement("canvas");
  canvas.width  = Math.round(img.width  * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blobAt = (q: number) =>
    new Promise<Blob>((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej(new Error("Canvas blob boş"))), "image/jpeg", q)
    );
  let quality = 0.85;
  const MIN_QUALITY = 0.50;
  const STEP = 0.10;
  while (true) {
    const blob = await blobAt(quality);
    if (blob.size <= targetBytes || quality <= MIN_QUALITY) return blob;
    quality = Math.max(MIN_QUALITY, quality - STEP);
  }
}

async function compressImage(file: File, maxWidth = 1200, targetBytes = 200 * 1024): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new globalThis.Image();
    const url = URL.createObjectURL(file);
    img.onload  = () => { URL.revokeObjectURL(url); compressToTarget(img, maxWidth, targetBytes).then(resolve).catch(reject); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Görsel yüklenemedi")); };
    img.src = url;
  });
}

async function uploadBlob(blob: Blob, filename: string, contentType = "image/jpeg"): Promise<string> {
  const { uploadURL, objectPath } = await apiFetch<{ uploadURL: string; objectPath: string }>(
    "/storage/uploads/request-url",
    { method: "POST", body: JSON.stringify({ name: filename, size: blob.size, contentType }) }
  );
  await fetch(uploadURL, { method: "PUT", headers: { "Content-Type": contentType }, body: blob });
  const { servingUrl } = await apiFetch<{ servingUrl: string }>("/storage/uploads/confirm", {
    method: "POST", body: JSON.stringify({ objectPath }),
  });
  return servingUrl;
}

async function uploadImage(file: File): Promise<string> {
  const blob = await compressImage(file);
  return uploadBlob(blob, file.name.replace(/\.[^.]+$/, ".jpg"), "image/jpeg");
}

/** Logo yükleme: PNG ise şeffaflık korunur (JPEG dönüşümü yok). */
async function uploadLogo(file: File): Promise<string> {
  if (file.type === "image/png") {
    // PNG → doğrudan yükle, şeffaflık bozulmaz
    return uploadBlob(file, file.name, "image/png");
  }
  if (file.type === "image/svg+xml") {
    return uploadBlob(file, file.name, "image/svg+xml");
  }
  // Diğer formatlar → JPEG sıkıştır
  const blob = await compressImage(file);
  return uploadBlob(blob, file.name.replace(/\.[^.]+$/, ".jpg"), "image/jpeg");
}

export default function AdminSettings() {
  const { toast } = useToast();
  const [form, setForm] = useState<Settings>({
    slug: "",
    restaurantName: "",
    primaryColor: "#C9A84C",
    currency: "TRY",
    defaultLanguage: "tr",
    logoWidth: 120,
  });
  const [languages, setLanguages] = useState<Language[]>([]);
  const [newLang, setNewLang] = useState({ code: "", name: "" });
  const [saving, setSaving] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [qrImg, setQrImg] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const qrRef = useRef<HTMLImageElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch<Settings>("/settings")
      .then((s) => {
        setForm({ ...s, logoWidth: s.logoWidth ?? 120 });
        updateQr();
      })
      .catch(() => {});
    loadLanguages();
  }, []);

  function updateQr() {
    const base = window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, "");
    const url = `${base}/`;
    setQrUrl(url);
    setQrImg(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&format=png&data=${encodeURIComponent(url)}`);
  }

  async function loadLanguages() {
    apiFetch<Language[]>("/languages").then(setLanguages);
  }

  function set<K extends keyof Settings>(field: K, value: Settings[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await apiFetch("/settings", { method: "PATCH", body: JSON.stringify(form) });
      updateQr();
      toast({ title: "Ayarlar kaydedildi" });
    } catch (err) {
      toast({ title: "Hata", description: String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const url = await uploadLogo(file);
      set("logoUrl", url);
      toast({ title: "Logo yüklendi" });
    } catch (err) {
      toast({ title: "Logo yükleme hatası", description: String(err), variant: "destructive" });
    } finally {
      setLogoUploading(false);
      if (logoFileRef.current) logoFileRef.current.value = "";
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
      method: "PATCH",
      body: JSON.stringify({ isActive: !lang.isActive }),
    });
    loadLanguages();
  }

  async function deleteLanguage(id: number) {
    if (!confirm("Bu dili silmek istediğinizden emin misiniz?")) return;
    await apiFetch(`/languages/${id}`, { method: "DELETE" });
    loadLanguages();
  }

  function copyUrl() {
    navigator.clipboard.writeText(qrUrl).then(() => {
      toast({ title: "Link kopyalandı" });
    });
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
          <p className="mt-1 text-xs text-neutral-500">📱 WhatsApp, Instagram ve arama motorlarında bu isim görünür. Kaydet'e bastıktan sonra ~5 dakika içinde güncellenir.</p>
        </Field>
        <Field label="Slug (Sistem Tanımlayıcı)">
          <input value={form.slug} onChange={(e) => set("slug", e.target.value)} className={inputCls} placeholder="restoran-adi" />
        </Field>
        <Field label="Alt Başlık (Tagline)">
          <input
            value={form.tagline ?? ""}
            onChange={(e) => set("tagline", e.target.value)}
            className={inputCls}
            placeholder="Boş bırakılırsa gösterilmez"
          />
          <p className="mt-1 text-xs text-neutral-500">Header'da logo altında görünür. Örn: "Kitchen &amp; Bar"</p>
        </Field>
        <Field label="Fiyat Güncelleme Tarihi">
          <input
            value={form.priceUpdatedAt ?? ""}
            onChange={(e) => set("priceUpdatedAt", e.target.value)}
            className={inputCls}
            placeholder="Örn: 15.07.2025"
          />
          <p className="mt-1 text-xs text-neutral-500">Müşteri menüsünde kategori çubuğunun altında gösterilir. Boş bırakılırsa görünmez.</p>
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
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-medium text-white uppercase tracking-widest">Logo</h2>

        <Field label="Logo Görseli">
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                value={form.logoUrl ?? ""}
                onChange={(e) => set("logoUrl", e.target.value)}
                className={inputCls}
                placeholder="https://... veya dosya yükleyin"
              />
              <button
                type="button"
                onClick={() => logoFileRef.current?.click()}
                disabled={logoUploading}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-neutral-800 border border-neutral-700 text-white text-sm rounded-lg hover:border-neutral-500 disabled:opacity-50 transition-colors"
              >
                {logoUploading ? (
                  <span className="text-xs">Yükleniyor…</span>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span className="text-xs">Yükle</span>
                  </>
                )}
              </button>
              <input
                ref={logoFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoFileChange}
              />
            </div>

            {form.logoUrl ? (
              <div className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg border border-neutral-700">
                <img
                  src={form.logoUrl}
                  alt="Logo önizleme"
                  className="h-10 object-contain rounded"
                  style={{ maxWidth: `${form.logoWidth ?? 120}px` }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-400 truncate">{form.logoUrl}</p>
                </div>
                <button
                  type="button"
                  onClick={() => set("logoUrl", "")}
                  className="text-neutral-500 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-16 bg-neutral-800 rounded-lg border border-dashed border-neutral-700">
                <div className="flex items-center gap-2 text-neutral-500 text-xs">
                  <ImageIcon className="w-4 h-4" />
                  <span>Henüz logo yüklenmedi</span>
                </div>
              </div>
            )}
          </div>
        </Field>

        <Field label={`Logo Genişliği — ${form.logoWidth ?? 120}px`}>
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500 w-8">60</span>
            <input
              type="range"
              min={60}
              max={300}
              step={10}
              value={form.logoWidth ?? 120}
              onChange={(e) => set("logoWidth", Number(e.target.value))}
              className="flex-1 accent-[#C9A84C]"
            />
            <span className="text-xs text-neutral-500 w-10 text-right">300</span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">Header'daki logo görseli maksimum genişliğini ayarlar</p>
        </Field>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-medium text-white uppercase tracking-widest">Menü Vurgu Rengi</h2>
        <p className="text-xs text-neutral-500">Müşteri menüsündeki altın/amber tonları bu renkle değişir. Siyah arka plan sabittir.</p>

        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="color"
              value={form.primaryColor}
              onChange={(e) => set("primaryColor", e.target.value)}
              className="w-12 h-12 rounded-xl border-2 border-neutral-700 cursor-pointer bg-transparent p-0.5"
            />
          </div>
          <div>
            <div className="text-white text-sm font-medium">Seçili Renk</div>
            <div className="text-neutral-400 text-xs font-mono uppercase">{form.primaryColor}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => set("primaryColor", c.value)}
              title={c.label}
              className={`w-8 h-8 rounded-full border-2 transition-all ${form.primaryColor === c.value ? "border-white scale-110" : "border-transparent hover:border-neutral-500"}`}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg border border-neutral-700" style={{ background: "#0A0A0A" }}>
          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: form.primaryColor }} />
          <div className="text-xs" style={{ color: form.primaryColor }}>Önizleme: Fiyat ve Vurgu Elementleri</div>
          <div className="ml-auto text-xs text-neutral-600">Menüde bu renk kullanılır</div>
        </div>
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
          <p className="mt-1 text-xs text-neutral-500">Ürün açıklama, içerik, besin değerleri ve AI görsel üretimi için kullanılır</p>
        </Field>
      </div>

      {/* ── Konum & WiFi ── */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-medium text-white uppercase tracking-widest flex items-center gap-2">
          <MapPin className="w-4 h-4 text-neutral-400" /> Konum &amp; WiFi
        </h2>
        <p className="text-xs text-neutral-500">Müşteri menüsünde solda sabit ikon olarak görünür. Sadece doldurduğunuz alanlar gösterilir.</p>

        {/* Konum */}
        <div className="space-y-3">
          <p className="text-xs text-neutral-400 uppercase tracking-widest flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Konum Bilgisi (Dil bazlı)</p>
          {languages.filter((l) => l.isActive).map((lang) => (
            <div key={lang.code} className="flex items-start gap-2">
              <span className="mt-2.5 text-base w-6 text-center flex-shrink-0">{LANG_FLAGS[lang.code] ?? "🌐"}</span>
              <textarea
                rows={2}
                value={form.locationNotes?.[lang.code] ?? ""}
                onChange={(e) => setForm((prev) => ({
                  ...prev,
                  locationNotes: { ...(prev.locationNotes ?? {}), [lang.code]: e.target.value },
                }))}
                placeholder={`Konum bilgisi (${lang.name})`}
                className="flex-1 bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white resize-none"
              />
            </div>
          ))}
          <Field label="Google Maps Linki">
            <input
              value={form.mapsUrl ?? ""}
              onChange={(e) => set("mapsUrl", e.target.value)}
              placeholder="https://maps.google.com/..."
              className={inputCls}
            />
          </Field>
        </div>

        {/* WiFi */}
        <div className="space-y-3 pt-3 border-t border-neutral-800">
          <p className="text-xs text-neutral-400 uppercase tracking-widest flex items-center gap-1.5"><Wifi className="w-3 h-3" /> WiFi Bilgisi</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ağ Adı (SSID)">
              <input
                value={form.wifiName ?? ""}
                onChange={(e) => set("wifiName", e.target.value)}
                placeholder="RestaurantWifi"
                className={inputCls}
              />
            </Field>
            <Field label="Şifre">
              <input
                value={form.wifiPassword ?? ""}
                onChange={(e) => set("wifiPassword", e.target.value)}
                placeholder="••••••••"
                className={inputCls}
              />
            </Field>
          </div>
        </div>
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
          <h2 className="text-sm font-medium text-white uppercase tracking-widest mb-4">Menü QR Kodu</h2>
          <div className="flex items-start gap-6 flex-wrap">
            <div className="bg-white p-3 rounded-xl flex-shrink-0">
              <img
                ref={qrRef}
                src={qrImg}
                alt="QR Kod"
                width={160}
                height={160}
                className="block"
              />
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <p className="text-xs text-neutral-400 uppercase tracking-widest mb-1">Menü Linki</p>
                <p className="text-sm text-neutral-300 break-all">{qrUrl}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={copyUrl}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 text-neutral-300 text-xs rounded-full hover:text-white border border-neutral-700 hover:border-neutral-500 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  Linki Kopyala
                </button>
                <a
                  href={qrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 text-neutral-300 text-xs rounded-full hover:text-white border border-neutral-700 hover:border-neutral-500 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Menüyü Aç
                </a>
                <a
                  href={qrImg}
                  download="qr-menu.png"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-xs rounded-full hover:bg-neutral-100 font-semibold transition-colors"
                >
                  QR İndir
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
