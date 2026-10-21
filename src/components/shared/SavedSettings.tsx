import React, { useEffect, useId, useState } from 'react';
import { Bookmark, Trash2 } from 'lucide-react';

const labels: Record<string, string[]> = {
  en: ['My recipes', 'Save settings for other files. Only settings stay in this browser.', 'Recipe name', 'Save settings', 'Apply', 'Delete recipe', 'Saved', 'Browser storage is unavailable.', 'Recipe'],
  es: ['Mis recetas', 'Guarda ajustes para otros archivos. Solo los ajustes se guardan en este navegador.', 'Nombre de la receta', 'Guardar ajustes', 'Aplicar', 'Borrar receta', 'Guardado', 'El almacenamiento del navegador no está disponible.', 'Receta'],
  fr: ['Mes recettes', 'Enregistrez les réglages pour d’autres fichiers. Seuls les réglages restent dans ce navigateur.', 'Nom de la recette', 'Enregistrer les réglages', 'Appliquer', 'Supprimer la recette', 'Enregistré', 'Le stockage du navigateur est indisponible.', 'Recette'],
  de: ['Meine Rezepte', 'Einstellungen für andere Dateien speichern. Nur die Einstellungen bleiben in diesem Browser.', 'Name des Rezepts', 'Einstellungen speichern', 'Anwenden', 'Rezept löschen', 'Gespeichert', 'Der Browserspeicher ist nicht verfügbar.', 'Rezept'],
  pt: ['As minhas receitas', 'Guarde ajustes para outros ficheiros. Apenas os ajustes ficam neste navegador.', 'Nome da receita', 'Guardar ajustes', 'Aplicar', 'Apagar receita', 'Guardado', 'O armazenamento do navegador não está disponível.', 'Receita'],
  ru: ['Мои рецепты', 'Сохраните настройки для других файлов. В этом браузере остаются только настройки.', 'Название рецепта', 'Сохранить настройки', 'Применить', 'Удалить рецепт', 'Сохранено', 'Хранилище браузера недоступно.', 'Рецепт'],
  hi: ['मेरी रेसिपी', 'अन्य फ़ाइलों के लिए सेटिंग सहेजें। इस ब्राउज़र में केवल सेटिंग रहती हैं।', 'रेसिपी का नाम', 'सेटिंग सहेजें', 'लागू करें', 'रेसिपी हटाएँ', 'सहेजा गया', 'ब्राउज़र संग्रह उपलब्ध नहीं है।', 'रेसिपी'],
  ja: ['マイレシピ', '他のファイルにも使えるよう設定を保存します。このブラウザーには設定のみ保存されます。', 'レシピ名', '設定を保存', '適用', 'レシピを削除', '保存しました', 'ブラウザーの保存領域を利用できません。', 'レシピ'],
  zh: ['我的配方', '保存设置用于其他文件。此浏览器仅保留设置。', '配方名称', '保存设置', '应用', '删除配方', '已保存', '浏览器存储不可用。', '配方'],
};
interface Recipe<T> { id: string; name: string; value: T }

export function SavedSettings<T>({ tool, lang, value, validate, onApply, disabled = false }: {
  tool: string; lang: string; value: T; validate: (value: unknown) => value is T; onApply: (value: T) => void; disabled?: boolean;
}) {
  const t = labels[lang] || labels.en;
  const key = `olove:recipes:${tool}:v1`, nameId = useId();
  const [recipes, setRecipes] = useState<Recipe<T>[]>([]);
  const [name, setName] = useState('');
  const [feedback, setFeedback] = useState('');
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      const data = raw && raw.length < 65_536 ? JSON.parse(raw) : [];
      setRecipes(Array.isArray(data) ? data.filter(r => r && typeof r.id === 'string' && r.id.length < 80 && typeof r.name === 'string' && r.name.length <= 40 && validate(r.value)).slice(0, 8) : []);
    } catch { setRecipes([]); }
  }, [key, validate]);
  useEffect(() => { if (!feedback) return; const timer = setTimeout(() => setFeedback(''), 3500); return () => clearTimeout(timer); }, [feedback]);
  const persist = (next: Recipe<T>[]) => {
    try { localStorage.setItem(key, JSON.stringify(next)); setRecipes(next); return true; }
    catch { setFeedback(t[7]); return false; }
  };
  return <details className="rounded-2xl border border-white/10 bg-white/[0.025] text-slate-200">
    <summary className="flex items-center gap-2 cursor-pointer p-4 text-xs font-bold"><Bookmark className="w-4 h-4 text-indigo-300" />{t[0]}{recipes.length > 0 && <span className="text-slate-500">{recipes.length} / 8</span>}</summary>
    <div className="px-4 pb-4 space-y-3">
      <p className="text-[11px] text-slate-400 leading-relaxed">{t[1]}</p>
      <div className="flex flex-wrap gap-2">
        <label htmlFor={nameId} className="sr-only">{t[2]}</label>
        <input id={nameId} value={name} onChange={e => setName(e.target.value)} maxLength={40} placeholder={t[2]} className="min-w-0 flex-1 basis-32 border border-white/10 bg-black/20 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-400" />
        <button type="button" disabled={disabled || recipes.length >= 8 || !validate(value)} onClick={() => {
          const next = [...recipes, { id: crypto.randomUUID(), name: name.trim() || `${t[8]} ${recipes.length + 1}`, value: structuredClone(value) }];
          if (persist(next)) { setName(''); setFeedback(t[6]); }
        }} className="rounded-xl bg-indigo-500/20 border border-indigo-400/20 px-3 py-2 text-xs font-bold text-indigo-200 disabled:opacity-40">{t[3]}</button>
      </div>
      {recipes.length > 0 && <ul className="space-y-2">{recipes.map(recipe => <li key={recipe.id} className="flex gap-2 items-center min-w-0 rounded-xl border border-white/5 px-3 py-2">
        <span className="text-xs truncate flex-1" title={recipe.name}>{recipe.name}</span>
        <button type="button" disabled={disabled} onClick={() => { if (validate(recipe.value)) onApply(structuredClone(recipe.value)); }} className="text-xs text-indigo-300 disabled:opacity-40">{t[4]}</button>
        <button type="button" aria-label={`${t[5]}: ${recipe.name}`} onClick={() => persist(recipes.filter(r => r.id !== recipe.id))} className="p-1 text-slate-500 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
      </li>)}</ul>}
      {feedback && <p role="status" className="text-xs text-indigo-200">{feedback}</p>}
    </div>
  </details>;
}
