import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Grid2X2, Search, Star, X } from 'lucide-react';

const copy: Record<string, string[]> = {
  en: ['Tools', 'Find your next tool', 'Search by name or task…', 'Favorites', 'All tools', 'No matching tools.', 'Close', 'Add to favorites', 'Remove from favorites', 'Opens in a new tab so your current work stays here.'],
  es: ['Herramientas', 'Encuentra tu próxima herramienta', 'Busca por nombre o tarea…', 'Favoritas', 'Todas', 'No hay herramientas que coincidan.', 'Cerrar', 'Añadir a favoritas', 'Quitar de favoritas', 'Se abren en otra pestaña para conservar tu trabajo actual.'],
  fr: ['Outils', 'Trouvez votre prochain outil', 'Rechercher un nom ou une tâche…', 'Favoris', 'Tous', 'Aucun outil correspondant.', 'Fermer', 'Ajouter aux favoris', 'Retirer des favoris', 'Ouverture dans un nouvel onglet pour conserver votre travail.'],
  de: ['Tools', 'Das nächste Werkzeug finden', 'Nach Name oder Aufgabe suchen…', 'Favoriten', 'Alle', 'Keine passenden Tools.', 'Schließen', 'Zu Favoriten hinzufügen', 'Aus Favoriten entfernen', 'Öffnet in einem neuen Tab, damit Ihre aktuelle Arbeit erhalten bleibt.'],
  pt: ['Ferramentas', 'Encontre a próxima ferramenta', 'Pesquise por nome ou tarefa…', 'Favoritas', 'Todas', 'Nenhuma ferramenta corresponde.', 'Fechar', 'Adicionar às favoritas', 'Remover das favoritas', 'Abrem noutra aba para manter o trabalho atual.'],
  ru: ['Инструменты', 'Найдите следующий инструмент', 'Поиск по названию или задаче…', 'Избранное', 'Все', 'Подходящих инструментов нет.', 'Закрыть', 'Добавить в избранное', 'Убрать из избранного', 'Открывается в новой вкладке, сохраняя текущую работу.'],
  hi: ['टूल', 'अगला टूल खोजें', 'नाम या काम से खोजें…', 'पसंदीदा', 'सभी', 'कोई मेल खाता टूल नहीं।', 'बंद करें', 'पसंदीदा में जोड़ें', 'पसंदीदा से हटाएँ', 'आपका मौजूदा काम बचाने के लिए नए टैब में खुलता है।'],
  ja: ['ツール', '次に使うツールを探す', '名前や作業内容で検索…', 'お気に入り', 'すべて', '一致するツールはありません。', '閉じる', 'お気に入りに追加', 'お気に入りから削除', '作業内容を残すため、新しいタブで開きます。'],
  zh: ['工具', '查找下一个工具', '按名称或任务搜索…', '收藏', '全部', '没有匹配的工具。', '关闭', '添加收藏', '取消收藏', '在新标签页打开，保留当前工作。'],
};
export interface NavigatorTool { slug: string; name: string; description: string }
const normalize = (s: string) => s.toLocaleLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
const FAVORITES_KEY = 'olovetools_favorites';

export function ToolNavigator({ lang, tools, current }: { lang: string; tools: NavigatorTool[]; current: string }) {
  const t = copy[lang] || copy.en;
  const dialog = useRef<HTMLDialogElement>(null), search = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(''), [favorites, setFavorites] = useState<string[]>([]), [onlyFavorites, setOnlyFavorites] = useState(false);
  const [active, setActive] = useState(0);
  const readFavorites = () => {
    try { const raw = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); setFavorites(Array.isArray(raw) ? raw.filter(s => typeof s === 'string' && tools.some(t => t.slug === s)) : []); }
    catch { setFavorites([]); }
  };
  const open = () => {
    if (!dialog.current || dialog.current.open) return;
    readFavorites(); setQuery(''); setActive(0); dialog.current.showModal(); search.current?.focus();
  };
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 'k') { event.preventDefault(); open(); }
    };
    document.addEventListener('keydown', shortcut);
    return () => { document.removeEventListener('keydown', shortcut); dialog.current?.close(); };
  }, []);
  const shown = useMemo(() => {
    const words = normalize(query).split(/\s+/).filter(Boolean);
    return tools.filter(tool => {
      if (onlyFavorites && !favorites.includes(tool.slug)) return false;
      const haystack = normalize(`${tool.name} ${tool.description} ${tool.slug}`);
      const tokens = haystack.split(/[^\p{L}\p{N}]+/u);
      // Inflections such as "comprimir imágenes" should also find "comprime
      // imágenes". Exact short terms (QR, PDF, CSS…) retain exact matching.
      return words.every(word => haystack.includes(word) || (word.length >= 6 && tokens.some(token => token.startsWith(word.slice(0, 6)))));
    }).sort((a, b) => Number(b.slug === current) - Number(a.slug === current) || Number(favorites.includes(b.slug)) - Number(favorites.includes(a.slug)) || a.name.localeCompare(b.name, lang));
  }, [query, tools, current, favorites, onlyFavorites]);
  const toggleFavorite = (slug: string) => {
    const next = favorites.includes(slug) ? favorites.filter(s => s !== slug) : [...favorites, slug];
    setFavorites(next);
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); } catch { /* Session favorites still work in private browsing. */ }
  };
  return <>
    <button type="button" onClick={open} aria-haspopup="dialog" aria-label={`${t[1]} · Alt+K`} title={`${t[1]} · Alt+K`} className="group fixed left-3 sm:left-5 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-[110] flex items-center gap-2 rounded-2xl border border-indigo-300/25 bg-[#131329]/95 px-3 py-3 text-xs font-bold text-indigo-100 shadow-xl shadow-black/40 backdrop-blur-xl hover:bg-indigo-900 focus-visible:outline-2 focus-visible:outline-indigo-300"><Grid2X2 className="w-4 h-4" /><span className="hidden sm:group-hover:inline sm:group-focus-visible:inline">{t[0]}</span></button>
    <dialog ref={dialog} aria-labelledby="tool-navigator-title" onClick={e => { if (e.target === e.currentTarget) dialog.current?.close(); }} className="m-auto w-[calc(100%_-_1.5rem)] max-w-2xl max-h-[85dvh] rounded-3xl border border-indigo-300/20 bg-[#0c0c19] p-0 text-slate-100 shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm">
      <div className="p-5 sm:p-6 border-b border-white/10 space-y-4">
        <div className="flex gap-3 justify-between items-center"><h2 id="tool-navigator-title" className="text-lg font-bold">{t[1]}</h2><button type="button" aria-label={t[6]} onClick={() => dialog.current?.close()} className="p-2 rounded-xl hover:bg-white/10"><X className="w-5 h-5" /></button></div>
        <label className="flex gap-3 items-center rounded-xl border border-white/15 bg-white/5 px-3"><Search className="w-4 h-4 shrink-0 text-indigo-300" /><input ref={search} aria-label={t[2]} value={query} onChange={e => { setQuery(e.target.value); setActive(0); }} placeholder={t[2]} className="w-full min-w-0 bg-transparent py-3 text-sm outline-none" onKeyDown={e => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const next = Math.max(0, Math.min(shown.length - 1, active + (e.key === 'ArrowDown' ? 1 : -1))); setActive(next); dialog.current?.querySelectorAll<HTMLAnchorElement>('a[data-tool]')[next]?.scrollIntoView({ block: 'nearest' }); }
          if (e.key === 'Enter') { e.preventDefault(); dialog.current?.querySelectorAll<HTMLAnchorElement>('a[data-tool]')[Math.min(active, shown.length - 1)]?.click(); }
        }} /></label>
        <div className="flex gap-2"><button type="button" onClick={() => { setOnlyFavorites(false); setActive(0); }} aria-pressed={!onlyFavorites} className={`rounded-lg px-3 py-1.5 text-xs ${!onlyFavorites ? 'bg-indigo-500/20 text-indigo-200' : 'text-slate-400'}`}>{t[4]}</button><button type="button" onClick={() => { setOnlyFavorites(true); setActive(0); }} aria-pressed={onlyFavorites} className={`rounded-lg px-3 py-1.5 text-xs ${onlyFavorites ? 'bg-indigo-500/20 text-indigo-200' : 'text-slate-400'}`}>{t[3]} · {favorites.length}</button></div>
        <p className="text-[11px] text-slate-500">{t[9]}</p>
      </div>
      <ul className="overflow-y-auto max-h-[50dvh] p-2" aria-label={t[0]}>{shown.map((tool, i) => <li key={tool.slug} className={`flex gap-2 rounded-2xl items-center ${i === active ? 'bg-indigo-500/10' : ''}`}>
        <a data-tool href={`/${lang}/${tool.slug}/`} aria-current={tool.slug === current ? 'page' : undefined} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 px-4 py-3 focus-visible:outline-indigo-300"><span className="block text-sm font-bold text-slate-100">{tool.name}</span><span className="block text-xs text-slate-500 leading-relaxed mt-1">{tool.description}</span></a>
        <button type="button" aria-label={`${favorites.includes(tool.slug) ? t[8] : t[7]}: ${tool.name}`} aria-pressed={favorites.includes(tool.slug)} onClick={() => toggleFavorite(tool.slug)} className="shrink-0 p-3 mr-2 text-indigo-300 hover:bg-white/5 rounded-xl"><Star className={`w-4 h-4 ${favorites.includes(tool.slug) ? 'fill-indigo-300' : ''}`} /></button>
      </li>)}</ul>
      {!shown.length && <p role="status" className="p-6 text-center text-sm text-slate-400">{t[5]}</p>}
    </dialog>
  </>;
}
