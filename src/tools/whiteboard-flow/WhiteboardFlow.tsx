import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AdBanner } from '../../components/shared/AdBanner';
import { LegalModal } from './components/LegalModal';
import { StickyNote, Plus, Trash2, X, Check, RotateCcw, GripVertical } from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface WhiteboardFlowProps {
  lang: string;
  dictionary: any;
}

type ColumnId = 'todo' | 'inprogress' | 'done';

interface Note {
  id: string;
  text: string;
  color: string;
  column: ColumnId;
}

const STORAGE_KEY = 'whiteboard-flow-notes-v1';

const NOTE_COLORS: { id: string; bg: string; border: string; dot: string; text: string }[] = [
  { id: 'yellow', bg: 'bg-yellow-200', border: 'border-yellow-300', dot: 'bg-yellow-300', text: 'text-yellow-950' },
  { id: 'pink', bg: 'bg-pink-200', border: 'border-pink-300', dot: 'bg-pink-300', text: 'text-pink-950' },
  { id: 'green', bg: 'bg-emerald-200', border: 'border-emerald-300', dot: 'bg-emerald-300', text: 'text-emerald-950' },
  { id: 'blue', bg: 'bg-sky-200', border: 'border-sky-300', dot: 'bg-sky-300', text: 'text-sky-950' },
  { id: 'purple', bg: 'bg-violet-200', border: 'border-violet-300', dot: 'bg-violet-300', text: 'text-violet-950' },
];

const COLUMNS: { id: ColumnId; titleKey: string; fallback: string; accent: string; ring: string }[] = [
  { id: 'todo', titleKey: 'colTodo', fallback: 'To Do', accent: 'text-cyan-400', ring: 'ring-cyan-500/40' },
  { id: 'inprogress', titleKey: 'colInProgress', fallback: 'In Progress', accent: 'text-amber-400', ring: 'ring-amber-500/40' },
  { id: 'done', titleKey: 'colDone', fallback: 'Done', accent: 'text-emerald-400', ring: 'ring-emerald-500/40' },
];

const getColorClass = (colorId: string) => NOTE_COLORS.find((c) => c.id === colorId) || NOTE_COLORS[0];

const createId = () => `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const loadNotes = (): Note[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((n) => n && typeof n.id === 'string' && typeof n.text === 'string' && typeof n.column === 'string');
    }
    return [];
  } catch {
    return [];
  }
};

export default function WhiteboardFlow({ lang, dictionary }: WhiteboardFlowProps) {
  const t = dictionary || {};
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState<string>('');
  const [pickerId, setPickerId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ColumnId | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setNotes(loadNotes());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {
      // ignore
    }
  }, [notes, hydrated]);

  useEffect(() => {
    if (!pickerId) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerId]);

  const addNote = useCallback(() => {
    const note: Note = {
      id: createId(),
      text: '',
      color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)].id,
      column: 'todo',
    };
    setNotes((prev) => [note, ...prev]);
    setEditingId(note.id);
    setDraftText('');
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setEditingId((cur) => (cur === id ? null : cur));
    setPickerId((cur) => (cur === id ? null : cur));
  }, []);

  const startEdit = useCallback((note: Note) => {
    setEditingId(note.id);
    setDraftText(note.text);
    setPickerId(null);
  }, []);

  const commitEdit = useCallback((id: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text: draftText } : n)));
    setEditingId(null);
  }, [draftText]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setDraftText('');
  }, []);

  const updateColor = useCallback((id: string, colorId: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, color: colorId } : n)));
    setPickerId(null);
  }, []);

  const resetWorkspace = useCallback(() => {
    setNotes([]);
    setEditingId(null);
    setPickerId(null);
    setDragId(null);
    setDragOverCol(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const onDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const onDragEnd = useCallback(() => {
    setDragId(null);
    setDragOverCol(null);
  }, []);

  const onColumnDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, col: ColumnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(col);
  }, []);

  const onColumnDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>, col: ColumnId) => {
    if (e.currentTarget === e.target) {
      setDragOverCol((cur) => (cur === col ? null : cur));
    }
  }, []);

  const onColumnDrop = useCallback((e: React.DragEvent<HTMLDivElement>, col: ColumnId) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || dragId;
    if (id) {
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, column: col } : n)));
    }
    setDragId(null);
    setDragOverCol(null);
  }, [dragId]);

  const notesByColumn = (col: ColumnId) => notes.filter((n) => n.column === col);

  return (
    <div className="min-h-screen flex flex-col bg-[#04080a] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      
      

      <Header
        currentLang={lang}
        onLanguageChange={(l) => window.location.href = `/${l.toLowerCase()}/whiteboard-flow`}
        onReset={resetWorkspace}
        t={t}
      />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col space-y-8">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-whiteboard-flow-top" />

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <StickyNote className="w-8 h-8 text-cyan-400" />
              <span>{t.seoHeroTitle || 'Whiteboard-Flow'}</span>
            </h2>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
              {t.seoHeroText}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={resetWorkspace}
              disabled={notes.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm font-semibold"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.reset || 'Reset'}</span>
            </button>
            <button
              onClick={addNote}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-[#04080a] font-bold hover:bg-cyan-400 active:scale-95 transition-all shadow-lg shadow-cyan-500/30"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addNote || 'Add Note'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {COLUMNS.map((col) => {
            const items = notesByColumn(col.id);
            const isOver = dragOverCol === col.id;
            return (
              <div
                key={col.id}
                onDragOver={(e) => onColumnDragOver(e, col.id)}
                onDragLeave={(e) => onColumnDragLeave(e, col.id)}
                onDrop={(e) => onColumnDrop(e, col.id)}
                className={`flex flex-col rounded-2xl border bg-white/[0.02] transition-colors min-h-[320px] md:min-h-[60vh] ${
                  isOver ? `border-cyan-500/60 bg-cyan-500/[0.06] ring-2 ${col.ring}` : 'border-white/10'
                }`}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.id === 'todo' ? 'bg-cyan-400' : col.id === 'inprogress' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    <h3 className={`font-bold tracking-tight ${col.accent}`}>
                      {t[col.titleKey] || col.fallback}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                    {items.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3 p-4 flex-grow">
                  {items.length === 0 && (
                    <div className="flex-grow flex items-center justify-center text-center py-10">
                      <p className="text-slate-600 text-xs italic">
                        {t.emptyColumn || 'Drop notes here'}
                      </p>
                    </div>
                  )}

                  {items.map((note) => {
                    const c = getColorClass(note.color);
                    const isEditing = editingId === note.id;
                    const isDragging = dragId === note.id;
                    return (
                      <div
                        key={note.id}
                        draggable={!isEditing}
                        onDragStart={(e) => onDragStart(e, note.id)}
                        onDragEnd={onDragEnd}
                        className={`group relative rounded-lg border ${c.bg} ${c.border} ${c.text} shadow-lg shadow-black/30 transition-all ${
                          isDragging ? 'opacity-40 scale-95' : 'hover:shadow-xl hover:-translate-y-0.5'
                        }`}
                      >
                        <div className="flex items-start gap-2 p-3">
                          <div className="flex flex-col items-center gap-1 pt-1 opacity-60 cursor-grab active:cursor-grabbing">
                            <GripVertical className="w-4 h-4" />
                          </div>

                          <div className="flex-grow min-w-0">
                            {isEditing ? (
                              <textarea
                                autoFocus
                                value={draftText}
                                onChange={(e) => setDraftText(e.target.value)}
                                onFocus={(e) => {
                                  const val = e.target.value;
                                  e.target.value = '';
                                  e.target.value = val;
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) commitEdit(note.id);
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                rows={3}
                                className={`w-full bg-white/40 border border-black/10 rounded-md p-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-black/20 ${c.text} placeholder-black/40`}
                                placeholder={t.notePlaceholder || 'Write your note...'}
                              />
                            ) : (
                              <p
                                onDoubleClick={() => startEdit(note)}
                                onClick={() => startEdit(note)}
                                className={`text-sm leading-relaxed whitespace-pre-wrap break-words min-h-[2.5rem] cursor-text ${note.text ? '' : 'opacity-50 italic'}`}
                              >
                                {note.text || (t.notePlaceholder || 'Click to edit...')}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between px-3 pb-2 pt-1">
                          <div className="relative">
                            <button
                              onClick={() => setPickerId(pickerId === note.id ? null : note.id)}
                              className="flex items-center gap-1.5 text-[11px] font-semibold opacity-70 hover:opacity-100 transition-opacity"
                            >
                              <span className={`w-3 h-3 rounded-full border border-black/20 ${c.dot}`} />
                              <span>{t.color || 'Color'}</span>
                            </button>

                            {pickerId === note.id && (
                              <div
                                ref={pickerRef}
                                className="absolute z-30 left-0 bottom-full mb-2 bg-[#04080a] border border-cyan-500/30 rounded-xl p-2 shadow-2xl shadow-black/60 flex gap-1.5"
                              >
                                {NOTE_COLORS.map((opt) => (
                                  <button
                                    key={opt.id}
                                    onClick={() => updateColor(note.id, opt.id)}
                                    className={`w-6 h-6 rounded-md border-2 transition-transform hover:scale-110 ${opt.dot} ${
                                      note.color === opt.id ? 'border-white scale-110' : 'border-white/20'
                                    }`}
                                    aria-label={opt.id}
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => commitEdit(note.id)}
                                  className="p-1.5 rounded-md hover:bg-black/10 transition-colors"
                                  aria-label="Save"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="p-1.5 rounded-md hover:bg-black/10 transition-colors"
                                  aria-label="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : null}
                            <button
                              onClick={() => deleteNote(note.id)}
                              className="p-1.5 rounded-md hover:bg-red-500/20 hover:text-red-700 transition-colors"
                              aria-label="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-2">
          <GripVertical className="w-3.5 h-3.5 text-cyan-500/60" />
          <span>{t.dragHint || 'Drag notes between columns. Double-click to edit. Saved locally.'}</span>
        </div>

      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-whiteboard-flow-bottom" />
      </main>

      <Footer
        lang={lang}
        t={t}
        onOpenModal={(modal) => setLegalModal(modal)}
      />

      <LegalModal
        isOpen={legalModal === 'privacy'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.privacy.title || 'Privacy Policy'}
        content={legalTranslations[lang]?.privacy.content}
        t={t}
      />
      <LegalModal
        isOpen={legalModal === 'terms'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.terms.title || 'Terms of Service'}
        content={legalTranslations[lang]?.terms.content}
        t={t}
      />
      <LegalModal
        isOpen={legalModal === 'cookies'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.cookies.title || 'Cookie Policy'}
        content={legalTranslations[lang]?.cookies.content}
        t={t}
      />
    </div>
  );
}
