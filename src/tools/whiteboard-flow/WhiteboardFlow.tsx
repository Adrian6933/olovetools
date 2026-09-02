import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, Keyboard, RotateCcw, StickyNote } from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { Canvas } from './components/Canvas';
import { Toolbar, CleanViewHint } from './components/Toolbar';
import { ExportPanel } from './components/ExportPanel';
import { StartPanel } from './components/StartPanel';
import { NextStepBar } from './components/NextStepBar';
import {
  HeroArt,
  IconCanvas,
  IconExport,
  IconHandoff,
  IconOffline,
  IconTouch,
  IconUndo,
  StepArrange,
  StepRefine,
  StepShip,
  StepStart,
} from './components/Illustrations';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { useHandoffIntake } from '../../lib/useHandoff';
import { useBoard } from './lib/useBoard';
import {
  contentBounds,
  createId,
  fitViewport,
  fromJSON,
  kanbanPositions,
  makeNote,
  spawnPoint,
  toJSON,
  toMarkdown,
} from './lib/board';
import { renderPNG, renderSVG } from './lib/render';
import { buildTemplate, type Template } from './lib/templates';
import type { BoardLayout, ColumnId, NoteColor } from './types';

interface WhiteboardFlowProps {
  lang: string;
  dictionary: any;
}

const BOARD_BG = '#050f14';

/** Hands a Blob to the browser as a download and releases the URL after. */
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoked on a timer, not immediately: Safari cancels an in-flight download
  // when the URL disappears in the same tick.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export default function WhiteboardFlow({ lang, dictionary }: WhiteboardFlowProps) {
  const t = dictionary || {};
  const board = useBoard();
  const { doc, commit, undo, redo } = board;

  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [selection, setSelection] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cleanView, setCleanView] = useState(false);
  const [linkFrom, setLinkFrom] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [toast, setToast] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [pending, setPending] = useState<{ file: File; url: string; from: string } | null>(null);
  const [pendingWidth, setPendingWidth] = useState(320);
  const [exportScale, setExportScale] = useState(2);
  const [transparent, setTransparent] = useState(false);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const didFit = useRef(false);

  // --- image object URLs ----------------------------------------------------
  // Owned here so every URL created has exactly one revoke, including when a
  // node is removed by an undo.
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    setImageUrls(prev => {
      const next: Record<string, string> = {};
      doc.nodes.forEach(n => {
        if (n.kind !== 'image' || !n.blob) return;
        next[n.id] = prev[n.id] || URL.createObjectURL(n.blob);
      });
      Object.keys(prev).forEach(id => {
        if (!next[id]) URL.revokeObjectURL(prev[id]);
      });
      return next;
    });
  }, [doc.nodes]);

  useEffect(
    () => () => {
      Object.values(imageUrls).forEach(URL.revokeObjectURL);
    },
    // Cleanup on unmount only; the effect above handles the incremental case.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const columnLabel = useCallback(
    (c: ColumnId) =>
      c === 'todo' ? t.colTodo || 'To Do' : c === 'inprogress' ? t.colInProgress || 'In Progress' : t.colDone || 'Done',
    [t]
  );

  const viewSize = () => {
    const rect = boardRef.current?.getBoundingClientRect();
    return { w: rect ? rect.width : 900, h: rect ? rect.height : 480 };
  };

  const fit = useCallback(() => {
    const { w, h } = viewSize();
    board.setViewport(fitViewport(doc.nodes, w, h));
  }, [board, doc.nodes]);

  // Frame the board once, after the stored document has loaded.
  useEffect(() => {
    if (!board.ready || didFit.current) return;
    didFit.current = true;
    if (doc.nodes.length > 0) {
      const { w, h } = viewSize();
      board.setViewport(fitViewport(doc.nodes, w, h));
    } else {
      board.setViewport({ x: 40, y: 80, scale: 1 });
    }
  }, [board, board.ready, doc.nodes]);

  // --- actions --------------------------------------------------------------

  const addNote = useCallback(() => {
    const { w, h } = viewSize();
    const p = spawnPoint(doc, w, h);
    const note = makeNote(doc, { x: p.x, y: p.y });
    commit({ t: 'add', nodes: [note] });
    setSelection([note.id]);
    setEditingId(note.id);
  }, [commit, doc]);

  const applyColor = useCallback(
    (c: NoteColor) => {
      selection.forEach(id => {
        const n = doc.nodes.find(node => node.id === id);
        if (!n || n.color === c) return;
        commit({ t: 'set', id, before: { color: n.color }, after: { color: c } });
      });
    },
    [commit, doc.nodes, selection]
  );

  const duplicate = useCallback(() => {
    const clones = doc.nodes
      .filter(n => selection.includes(n.id))
      .map(n => ({ ...n, id: createId(), x: n.x + 24, y: n.y + 24, z: n.z + 1 }));
    if (clones.length === 0) return;
    commit({ t: 'add', nodes: clones });
    setSelection(clones.map(c => c.id));
  }, [commit, doc.nodes, selection]);

  const removeSelected = useCallback(() => {
    const nodes = doc.nodes.filter(n => selection.includes(n.id));
    if (nodes.length === 0) return;
    const gone = new Set(nodes.map(n => n.id));
    const edges = doc.edges.filter(e => gone.has(e.from) || gone.has(e.to));
    commit({ t: 'del', nodes, edges });
    setSelection([]);
    setEditingId(null);
  }, [commit, doc.edges, doc.nodes, selection]);

  const setLayout = useCallback(
    (l: BoardLayout) => {
      if (l === doc.layout) return;
      if (l === 'free') {
        commit({ t: 'layout', before: doc.layout, after: l, moves: [] });
        return;
      }
      // Switching back to lanes re-stacks every note, and that has to undo in
      // one step, so the positions travel inside the command.
      const target = kanbanPositions(doc);
      const moves = target
        .map(p => {
          const n = doc.nodes.find(node => node.id === p.id);
          if (!n) return null;
          return { id: p.id, from: { x: n.x, y: n.y }, to: { x: p.x, y: p.y } };
        })
        .filter(Boolean) as { id: string; from: { x: number; y: number }; to: { x: number; y: number } }[];
      commit({ t: 'layout', before: doc.layout, after: l, moves });
      setTimeout(fit, 0);
    },
    [commit, doc, fit]
  );

  const zoomBy = useCallback(
    (dir: number) => {
      const { w, h } = viewSize();
      const next = Math.min(2.5, Math.max(0.25, doc.viewport.scale * (dir > 0 ? 1.2 : 1 / 1.2)));
      // Zoom around the middle of the visible board, not the origin.
      board.setViewport({
        scale: next,
        x: w / 2 - ((w / 2 - doc.viewport.x) / doc.viewport.scale) * next,
        y: h / 2 - ((h / 2 - doc.viewport.y) / doc.viewport.scale) * next,
      });
    },
    [board, doc.viewport]
  );

  // --- intake (drop / paste / handoff) --------------------------------------

  const queueImage = useCallback((file: File, from = '') => {
    if (!file.type.startsWith('image/')) return;
    setPending(prev => {
      if (prev) URL.revokeObjectURL(prev.url);
      return { file, url: URL.createObjectURL(file), from };
    });
    setToast(from ? '' : '');
    boardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // Receiving a file from another tool goes through the same waiting room as a
  // drop: arriving here never places anything by itself.
  useHandoffIntake((file, from) => queueImage(file, from));

  const placePending = useCallback(() => {
    if (!pending) return;
    const img = new Image();
    const url = pending.url;
    img.onload = () => {
      const ratio = img.naturalHeight / Math.max(1, img.naturalWidth);
      const { w, h } = viewSize();
      const p = spawnPoint(doc, w, h);
      commit({
        t: 'add',
        nodes: [
          {
            ...makeNote(doc, { x: p.x, y: p.y }),
            kind: 'image',
            w: pendingWidth,
            h: Math.max(60, Math.round(pendingWidth * ratio)),
            blob: pending.file,
            text: pending.file.name,
          },
        ],
      });
      setPending(null);
      // The node keeps its own URL from now on; this one is done.
      URL.revokeObjectURL(url);
      setToast(t.toastPlaced || 'Image placed on the board.');
    };
    img.onerror = () => setToast(t.toastImageError || 'That image could not be read.');
    img.src = url;
  }, [commit, doc, pending, pendingWidth, t]);

  const discardPending = useCallback(() => {
    setPending(prev => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
  }, []);

  const importJson = useCallback(
    (file: File) => {
      file.text().then(text => {
        const result = fromJSON(text);
        if (!result.doc) {
          setToast(t.toastJsonError || 'That file is not a WhiteboardFlow board.');
          return;
        }
        board.replace(result.doc);
        setSelection([]);
        setTimeout(fit, 0);
        setToast(t.toastImported || 'Board loaded.');
      });
    },
    [board, fit, t]
  );

  const applyTemplate = useCallback(
    (tpl: Template) => {
      board.replace(buildTemplate(tpl, t));
      setSelection([]);
      setTimeout(fit, 0);
      setToast(t.toastTemplate || 'Template applied — undo brings your board back.');
    },
    [board, fit, t]
  );

  // Paste and drop anywhere in the studio.
  useEffect(() => {
    const host = boardRef.current?.parentElement;
    if (!host) return;
    const onDrop = (e: DragEvent) => {
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      e.preventDefault();
      if (file.type === 'application/json' || file.name.endsWith('.json')) importJson(file);
      else queueImage(file);
    };
    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes('Files')) e.preventDefault();
    };
    const onPaste = (e: ClipboardEvent) => {
      const el = document.activeElement;
      if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) return;
      const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/'));
      const file = item?.getAsFile();
      if (file) queueImage(file);
    };
    host.addEventListener('drop', onDrop);
    host.addEventListener('dragover', onDragOver);
    window.addEventListener('paste', onPaste);
    return () => {
      host.removeEventListener('drop', onDrop);
      host.removeEventListener('dragover', onDragOver);
      window.removeEventListener('paste', onPaste);
    };
  }, [importJson, queueImage]);

  // --- keyboard -------------------------------------------------------------

  useEffect(() => {
    const typing = () => {
      const el = document.activeElement;
      return !!el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT');
    };
    const down = (e: KeyboardEvent) => {
      if (typing()) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicate();
        return;
      }
      if (mod && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setSelection(doc.nodes.map(n => n.id));
        return;
      }
      if (mod && e.key === '0') {
        e.preventDefault();
        fit();
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setCleanView(true);
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        addNote();
        return;
      }
      if (e.key === 'Escape') {
        setSelection([]);
        setMenu(null);
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selection.length === 0) return;
        e.preventDefault();
        removeSelected();
        return;
      }
      if (e.key === 'Enter' && selection.length === 1) {
        e.preventDefault();
        setEditingId(selection[0]);
        return;
      }
      if (e.key.startsWith('Arrow') && selection.length > 0) {
        e.preventDefault();
        const step = e.shiftKey ? 80 : 16;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        commit({ t: 'move', ids: selection, dx, dy });
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') setCleanView(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [addNote, commit, doc.nodes, duplicate, fit, redo, removeSelected, selection, undo]);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [menu]);

  // --- export ---------------------------------------------------------------

  const pngSize = useMemo(() => {
    const b = contentBounds(doc.nodes);
    return { w: Math.round(b.w * exportScale), h: Math.round(b.h * exportScale) };
  }, [doc.nodes, exportScale]);

  const makePng = useCallback(
    () => renderPNG(doc, { scale: exportScale, transparent, background: BOARD_BG }),
    [doc, exportScale, transparent]
  );

  const doExport = useCallback(
    async (kind: 'png' | 'svg' | 'json' | 'md') => {
      if (kind === 'png') {
        const blob = await makePng();
        if (blob) download(blob, 'whiteboard.png');
        return;
      }
      if (kind === 'svg') {
        const svg = await renderSVG(doc, { transparent, background: BOARD_BG });
        download(new Blob([svg], { type: 'image/svg+xml' }), 'whiteboard.svg');
        return;
      }
      if (kind === 'json') {
        download(new Blob([toJSON(doc)], { type: 'application/json' }), 'whiteboard.json');
        return;
      }
      const labels: Record<ColumnId, string> = {
        todo: columnLabel('todo'),
        inprogress: columnLabel('inprogress'),
        done: columnLabel('done'),
      };
      download(new Blob([toMarkdown(doc, labels)], { type: 'text/markdown' }), 'whiteboard.md');
    },
    [columnLabel, doc, makePng, transparent]
  );

  const getHandoffResult = useCallback(async () => {
    const blob = await makePng();
    return blob ? { blob, name: 'whiteboard.png' } : null;
  }, [makePng]);

  // --- sections -------------------------------------------------------------

  const steps = [
    { art: StepStart, title: t.step1Title || 'Start blank, or from a template', text: t.step1Text || 'Four starters, or an empty board. Nothing is applied until you pick one.' },
    { art: StepArrange, title: t.step2Title || 'Write, drag, connect', text: t.step2Text || 'Notes go anywhere. Drag one onto another to link them. Works with a finger too.' },
    { art: StepRefine, title: t.step3Title || 'Undo anything', text: t.step3Text || 'Every move, colour and delete is one step back. Hold H to see the board as it exports.' },
    { art: StepShip, title: t.step4Title || 'Take it with you', text: t.step4Text || 'PNG, vector SVG, JSON to reopen, Markdown to paste — or send it straight to another tool.' },
  ];

  const features = [
    { icon: IconCanvas, title: t.feat1Title || 'A real canvas', text: t.feat1Text || 'Pan, zoom to the cursor and place notes anywhere — or snap them back into lanes.' },
    { icon: IconTouch, title: t.feat2Title || 'Works with a finger', text: t.feat2Text || 'Drag, pinch to zoom and edit on a phone. No mouse-only drag-and-drop.' },
    { icon: IconUndo, title: t.feat3Title || 'Nothing is lost', text: t.feat3Text || 'Undo and redo across 200 steps, and a reset you can take back.' },
    { icon: IconExport, title: t.feat4Title || 'Four ways out', text: t.feat4Text || 'PNG at 1x-3x, real vector SVG, JSON that reopens, and Markdown checklists.' },
    { icon: IconOffline, title: t.feat5Title || 'Stays on your device', text: t.feat5Text || 'The board is stored in your browser and never uploaded anywhere.' },
    { icon: IconHandoff, title: t.feat6Title || 'Hands off to other tools', text: t.feat6Text || 'Send the board straight into Cropsnap, CompressSnap or Meme-Bolt.' },
  ];

  const faq: { question: string; answer: string }[] = Array.isArray(t.faq) ? t.faq : [];
  const empty = doc.nodes.length === 0;

  /**
   * Reinicio desde el nombre de la herramienta en la cabecera.
   * Solo el estado de la vista. El tablero NO se borra: esta guardado en el navegador y una recarga tampoco se lo llevaria.
   * El scroll arriba lo pone withScrollToTop en el propio Header.
   */
  const handleSoftReset = () => {
    setSelection([]);
    setEditingId(null);
    setCleanView(false);
    setLinkFrom(null);
    setMenu(null);
    setToast('');
  };

  return (
    // El padding superior compensa el header fijo. Por debajo de `md` el header
    // se apila en dos filas (logo + selector de idioma) y mide 133px, no los
    // 96px de la barra de escritorio: con pt-28 (112px) tapaba 21px del
    // contenido.
    <div className="min-h-screen flex flex-col bg-[#04080a] text-slate-200 font-sans relative overflow-x-hidden pt-36 md:pt-28">
      <Header
        onReset={handleSoftReset} currentLang={lang} onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/whiteboard-flow`)} t={t} />

      {/* The max width lives on <main>: AdRail measures this element to decide
          whether the fixed side rails fit, so reserving 440px from 1400px up is
          what keeps them visible instead of silently suppressed. */}
      <main className="flex-grow w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] px-4 md:px-8 py-8 relative z-10 flex flex-col gap-12 md:gap-20">
        <AdBanner id="adsense-whiteboard-flow-top" />

        {/* Hero ------------------------------------------------------------ */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/10 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300">
              <StickyNote className="w-3.5 h-3.5" />
              {t.heroBadge || 'Board, not upload'}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.1]">
              {t.seoHeroTitle || 'WhiteboardFlow'}
            </h1>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl">{t.seoHeroText}</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  boardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  addNote();
                }}
                className="px-5 py-3 rounded-xl bg-cyan-500 text-[#04080a] font-black text-sm hover:bg-cyan-400 active:scale-95 transition-all shadow-lg shadow-cyan-500/25 cursor-pointer"
              >
                {t.heroCta || 'Write your first note'}
              </button>
              <a
                href="#how-it-works"
                className="px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-cyan-500/30 font-bold text-sm transition-all"
              >
                {t.heroSecondary || 'See how it works'}
              </a>
            </div>
          </div>
          <HeroArt className="w-full h-auto max-w-lg mx-auto" />
        </section>

        {/* Studio ---------------------------------------------------------- */}
        <section className="space-y-4">
          <Toolbar
            t={t}
            layout={doc.layout}
            scale={doc.viewport.scale}
            selectionCount={selection.length}
            canUndo={board.canUndo}
            canRedo={board.canRedo}
            onAdd={addNote}
            onUndo={undo}
            onRedo={redo}
            onColor={applyColor}
            onDuplicate={duplicate}
            onDelete={removeSelected}
            onLayout={setLayout}
            onZoom={zoomBy}
            onFit={fit}
            onResetZoom={() => board.setViewport({ ...doc.viewport, scale: 1 })}
          />

          <div ref={boardRef} className="relative">
            <Canvas
              doc={doc}
              selection={selection}
              editingId={editingId}
              cleanView={cleanView}
              linkFrom={linkFrom}
              imageUrls={imageUrls}
              t={t}
              onSelect={setSelection}
              onEdit={setEditingId}
              onCommit={commit}
              onViewport={board.setViewport}
              onMenu={setMenu}
              onLinkFrom={setLinkFrom}
              columnLabel={columnLabel}
            />

            {empty && board.ready && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-6">
                <p className="text-center text-slate-500 text-sm max-w-sm leading-relaxed">
                  {t.emptyBoard || 'Empty board. Add a note, drop an image, or pick a template below.'}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <CleanViewHint t={t} />
            <div className="flex items-center gap-3">
              <span className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500">
                <Keyboard className="w-3.5 h-3.5 text-cyan-500/60" />
                {t.shortcutsHint || 'N new · Ctrl+Z undo · Alt+drag copies · Ctrl+wheel zooms'}
              </span>
              <button
                onClick={() => setConfirmReset(true)}
                disabled={empty}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-red-300 hover:border-red-500/30 text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t.reset || 'Reset'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StartPanel
              t={t}
              pending={pending}
              pendingWidth={pendingWidth}
              onPendingWidth={setPendingWidth}
              onPlacePending={placePending}
              onDiscardPending={discardPending}
              onPickImage={f => queueImage(f)}
              onImportJson={importJson}
              onTemplate={applyTemplate}
              hasBoard={!empty}
            />
            <div className="space-y-4">
              <ExportPanel
                t={t}
                empty={empty}
                scale={exportScale}
                transparent={transparent}
                onScale={setExportScale}
                onTransparent={setTransparent}
                onExport={doExport}
                pngSize={pngSize}
              />
              <NextStepBar lang={lang} t={t} disabled={empty} getResult={getHandoffResult} />
            </div>
          </div>
        </section>

        <AdBanner id="adsense-whiteboard-flow-mid" />

        {/* How it works ---------------------------------------------------- */}
        <section id="how-it-works" className="space-y-8 scroll-mt-28">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white text-center">
            {t.howTitle || 'How it works'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <div key={i} className="glass-card rounded-2xl p-4 space-y-3">
                <s.art />
                <div className="space-y-1.5">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-cyan-500/15 text-cyan-300 text-[11px] font-black flex items-center justify-center">
                      {i + 1}
                    </span>
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features -------------------------------------------------------- */}
        <section className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white text-center">
            {t.featuresTitle || 'What it actually does'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 space-y-3">
                <div className="w-10 h-10">
                  <f.icon />
                </div>
                <h3 className="text-sm font-black text-white">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ ------------------------------------------------------------- */}
        {faq.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white text-center">
              {t.faqTitle || 'Frequently Asked Questions'}
            </h2>
            <div className="space-y-3 max-w-3xl mx-auto w-full">
              {faq.map((item, i) => (
                <details key={i} className="group glass-card rounded-2xl overflow-hidden">
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none text-sm font-bold text-white hover:text-cyan-300 transition-colors">
                    <span>{item.question}</span>
                    <span className="text-cyan-400 text-lg leading-none shrink-0 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <AdBanner id="adsense-whiteboard-flow-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={m => setLegalModal(m)} />

      {/* Context menu ------------------------------------------------------ */}
      {menu && (
        <div
          className="fixed z-[200] w-44 rounded-xl border border-cyan-500/30 bg-[#04080a]/95 backdrop-blur-xl p-1.5 shadow-2xl shadow-black/60"
          style={{ left: Math.min(menu.x, window.innerWidth - 190), top: Math.min(menu.y, window.innerHeight - 190) }}
          onPointerDown={e => e.stopPropagation()}
        >
          {[
            { label: t.editNote || 'Edit text', run: () => setEditingId(menu.id) },
            { label: t.duplicate || 'Duplicate', run: duplicate },
            {
              label: t.bringFront || 'Bring to front',
              run: () => {
                const n = doc.nodes.find(node => node.id === menu.id);
                if (!n) return;
                const top = doc.nodes.reduce((m, node) => Math.max(m, node.z), 0);
                commit({ t: 'set', id: n.id, before: { z: n.z }, after: { z: top + 1 } });
              },
            },
            { label: t.deleteNote || 'Delete', run: removeSelected },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => {
                item.run();
                setMenu(null);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-300 hover:bg-cyan-500/15 hover:text-white transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Reset confirmation ------------------------------------------------ */}
      {confirmReset && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#04080a] p-6 space-y-4">
            <h3 className="text-base font-black text-white">{t.resetTitle || 'Clear the board?'}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {(t.resetBody || 'This removes all {n} notes. You can still undo it with Ctrl+Z.').replace(
                '{n}',
                String(doc.nodes.length)
              )}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-xs font-bold hover:text-white transition-all cursor-pointer"
              >
                {t.cancel || 'Cancel'}
              </button>
              <button
                onClick={() => {
                  board.reset();
                  setSelection([]);
                  setEditingId(null);
                  setConfirmReset(false);
                  setToast(t.toastReset || 'Board cleared — Ctrl+Z brings it back.');
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500/90 text-white text-xs font-black hover:bg-red-500 transition-all cursor-pointer"
              >
                {t.resetConfirm || 'Clear it'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[220] px-4 py-2.5 rounded-xl border border-cyan-500/30 bg-[#04080a]/95 text-xs font-bold text-cyan-100 shadow-2xl shadow-black/60">
          {toast}
        </div>
      )}

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t.scrollTop || 'Back to top'}
          className="fixed bottom-6 right-6 z-[190] w-11 h-11 rounded-full bg-cyan-500 text-[#04080a] flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:bg-cyan-400 transition-all cursor-pointer"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

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
