import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Translation {
  languageCode: string;
  name: string;
  description?: string;
}

interface Category {
  id: number;
  slug: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  translations: Translation[];
}

interface Language {
  id: number;
  code: string;
  name: string;
}

const LANG_FLAGS: Record<string, string> = { tr: "🇹🇷", en: "🇬🇧", ru: "🇷🇺", ar: "🇸🇦" };

function SortableRow({
  cat,
  onEdit,
  onDelete,
}: {
  cat: Category;
  onEdit: (c: Category) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: cat.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const trName = cat.translations.find((t) => t.languageCode === "tr")?.name ?? cat.slug;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3"
    >
      <button {...attributes} {...listeners} className="text-neutral-600 hover:text-neutral-400 cursor-grab">
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{trName}</div>
        <div className="text-xs text-neutral-500">{cat.slug}</div>
      </div>
      <div className="flex items-center gap-1">
        <span className={`text-xs px-2 py-0.5 rounded-full ${cat.isActive ? "bg-emerald-900/40 text-emerald-400" : "bg-neutral-800 text-neutral-500"}`}>
          {cat.isActive ? "Aktif" : "Pasif"}
        </span>
      </div>
      <button onClick={() => onEdit(cat)} className="text-neutral-500 hover:text-white transition-colors p-1">
        <Pencil className="w-4 h-4" />
      </button>
      <button onClick={() => onDelete(cat.id)} className="text-neutral-500 hover:text-red-400 transition-colors p-1">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function CategoryModal({
  category,
  languages,
  onClose,
  onSave,
}: {
  category: Partial<Category> | null;
  languages: Language[];
  onClose: () => void;
  onSave: () => void;
}) {
  const { toast } = useToast();
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [translations, setTranslations] = useState<Translation[]>(
    languages.map((l) => ({
      languageCode: l.code,
      name: category?.translations?.find((t) => t.languageCode === l.code)?.name ?? "",
      description: category?.translations?.find((t) => t.languageCode === l.code)?.description ?? "",
    }))
  );
  const [saving, setSaving] = useState(false);

  function updateTr(code: string, field: "name" | "description", value: string) {
    setTranslations((prev) =>
      prev.map((t) => (t.languageCode === code ? { ...t, [field]: value } : t))
    );
  }

  async function handleSave() {
    if (!slug) { toast({ title: "Slug zorunlu", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const payload = {
        slug,
        isActive,
        translations: translations.filter((t) => t.name),
      };
      if (category?.id) {
        await apiFetch(`/categories/${category.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/categories", { method: "POST", body: JSON.stringify(payload) });
      }
      onSave();
      onClose();
    } catch (err) {
      toast({ title: "Hata", description: String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h2 className="text-white font-semibold">{category?.id ? "Kategori Düzenle" : "Yeni Kategori"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-neutral-400" /></button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs text-neutral-400 uppercase tracking-widest mb-2">Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="ana-yemekler"
              className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-neutral-300">Aktif</label>
            <button
              onClick={() => setIsActive(!isActive)}
              className={`w-10 h-5 rounded-full transition-colors relative ${isActive ? "bg-white" : "bg-neutral-700"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-neutral-900 rounded-full transition-transform ${isActive ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
          <div>
            <label className="block text-xs text-neutral-400 uppercase tracking-widest mb-3">Çeviriler</label>
            <div className="space-y-4">
              {languages.map((lang) => {
                const tr = translations.find((t) => t.languageCode === lang.code)!;
                return (
                  <div key={lang.code} className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                      <span>{LANG_FLAGS[lang.code] ?? "🌐"}</span>
                      <span className="uppercase font-medium">{lang.name}</span>
                    </div>
                    <input
                      value={tr.name}
                      onChange={(e) => updateTr(lang.code, "name", e.target.value)}
                      placeholder="Kategori adı"
                      className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white"
                    />
                    <input
                      value={tr.description ?? ""}
                      onChange={(e) => updateTr(lang.code, "description", e.target.value)}
                      placeholder="Açıklama (isteğe bağlı)"
                      className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-neutral-800">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-full border border-neutral-700 text-neutral-300 text-sm hover:border-white transition-colors">
            İptal
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-neutral-100 transition-colors disabled:opacity-50">
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCategories() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [editing, setEditing] = useState<Partial<Category> | null | false>(false);

  const sensors = useSensors(useSensor(PointerSensor));

  async function load() {
    const [cats, langs] = await Promise.all([
      apiFetch<Category[]>("/categories"),
      apiFetch<Language[]>("/languages"),
    ]);
    setCategories(cats.sort((a, b) => a.sortOrder - b.sortOrder));
    setLanguages(langs);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: number) {
    if (!confirm("Bu kategoriyi silmek istediğinizden emin misiniz?")) return;
    await apiFetch(`/categories/${id}`, { method: "DELETE" });
    toast({ title: "Kategori silindi" });
    load();
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);
    setCategories(reordered);
    await apiFetch("/categories/reorder", {
      method: "POST",
      body: JSON.stringify({ ids: reordered.map((c) => c.id) }),
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Kategoriler</h1>
          <p className="text-neutral-400 text-sm mt-1">Sürükleyerek sıralayabilirsiniz</p>
        </div>
        <button
          onClick={() => setEditing({})}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-semibold rounded-full hover:bg-neutral-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Kategori
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16 text-neutral-600">Henüz kategori yok</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {categories.map((cat) => (
                <SortableRow key={cat.id} cat={cat} onEdit={setEditing} onDelete={handleDelete} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {editing !== false && (
        <CategoryModal
          category={editing}
          languages={languages}
          onClose={() => setEditing(false)}
          onSave={load}
        />
      )}
    </div>
  );
}
