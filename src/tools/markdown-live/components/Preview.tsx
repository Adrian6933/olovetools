import React, { useEffect, useImperativeHandle, useRef } from 'react';
import { Check, Copy, Hash } from 'lucide-react';
import { highlight, loadPrism, normalizeLang, prismReady } from '../lib/highlight';
import { EmptyPreviewArt } from './Illustrations';
import type { PreviewMode, ThemeId, TocEntry } from '../types';

export interface PreviewHandle {
  scrollTo: (ratio: number) => void;
  /** The rendered article, for the "scroll to heading" jump. */
  element: () => HTMLDivElement | null;
}

interface PreviewProps {
  html: string;
  toc: TocEntry[];
  mode: PreviewMode;
  theme: ThemeId;
  empty: boolean;
  onScrollRatio: (ratio: number) => void;
  onCopyHtml: () => void;
  copied: boolean;
  t: any;
  className?: string;
}

export const Preview = React.forwardRef<PreviewHandle, PreviewProps>(
  ({ html, toc, mode, theme, empty, onScrollRatio, onCopyHtml, copied, t, className = '' }, ref) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      scrollTo: (ratio: number) => {
        const box = scrollRef.current;
        if (!box) return;
        box.scrollTop = ratio * (box.scrollHeight - box.clientHeight);
      },
      element: () => bodyRef.current,
    }));

    // Prism runs over the DOM after React has put the HTML in, rather than
    // inside the worker: a grammar bundle has no business crossing a postMessage
    // on every keystroke. The first document that contains code triggers the
    // lazy load, and `paint` runs again from inside the promise — painting from
    // a state bump instead would leave the very first document grey, because
    // nothing else re-renders this pane until the next keystroke.
    useEffect(() => {
      if (mode !== 'preview') return;

      // `paint` reads the ref at call time instead of closing over the node, and
      // nothing cancels it. A cancellation flag looks right and is wrong here:
      // React re-runs this effect's cleanup on the development double-mount, so
      // the flag could be set before the grammars finished loading and the very
      // first document would stay grey. Re-painting is idempotent anyway —
      // `data-highlighted` makes a second pass a no-op.
      const paint = () => {
        const body = bodyRef.current;
        if (!body) return;
        body.querySelectorAll('pre > code[class*="language-"]').forEach(node => {
          if (node.getAttribute('data-highlighted') === 'true') return;
          const language = /language-([\w+#-]+)/.exec(node.className);
          if (!language) return;
          const painted = highlight(node.textContent || '', normalizeLang(language[1]));
          if (painted === null) return;
          node.innerHTML = painted;
          node.setAttribute('data-highlighted', 'true');
        });
      };

      // No fenced block on screen means no reason to fetch a grammar bundle.
      if (!bodyRef.current?.querySelector('pre > code[class*="language-"]')) return;

      if (prismReady()) paint();
      else void loadPrism().then(loaded => loaded && paint());
    }, [html, mode]);

    const onScroll = () => {
      const box = scrollRef.current;
      if (!box) return;
      const range = box.scrollHeight - box.clientHeight;
      onScrollRatio(range > 0 ? box.scrollTop / range : 0);
    };

    const jumpTo = (slug: string) => {
      const target = bodyRef.current?.querySelector(`#${CSS.escape(slug)}`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
      <div className={`flex flex-col min-h-0 ${className}`}>
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin"
        >
          {empty ? (
            <div className="h-full min-h-[16rem] flex flex-col items-center justify-center gap-4 p-8 text-center text-violet-400/70">
              <EmptyPreviewArt className="w-32 h-auto" />
              <p className="text-sm font-bold text-slate-500 max-w-xs">
                {t.previewEmpty || 'Your rendered document will appear here.'}
              </p>
            </div>
          ) : mode === 'preview' ? (
            <div className="p-4 sm:p-6">
              <div
                ref={bodyRef}
                className={`md-body md-theme-${theme}`}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          ) : mode === 'html' ? (
            <div className="p-4 sm:p-6 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] text-slate-500 font-medium leading-snug">
                  {t.htmlHint || 'Semantic HTML with no framework classes — paste it straight into a CMS.'}
                </p>
                <button
                  type="button"
                  onClick={onCopyHtml}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-black transition-all cursor-pointer ${
                    copied
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-violet-500/15 hover:border-violet-500/30 hover:text-white'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t.copied || 'Copied!' : t.btn_copy_html || 'Copy HTML'}
                </button>
              </div>
              <pre className="bg-black/40 border border-white/5 rounded-xl p-4 text-emerald-300/90 font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap break-words select-all">
                {html}
              </pre>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              {toc.length === 0 ? (
                <p className="text-sm text-slate-500 font-medium">
                  {t.tocEmpty || 'No headings yet. Add a line starting with # and it will show up here.'}
                </p>
              ) : (
                <nav className="space-y-0.5">
                  {toc.map((entry, index) => (
                    <button
                      key={`${entry.slug}-${index}`}
                      type="button"
                      onClick={() => jumpTo(entry.slug)}
                      style={{ paddingLeft: `${(entry.depth - 1) * 0.9 + 0.5}rem` }}
                      className="w-full flex items-center gap-2 text-left py-1.5 pr-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <Hash
                        className={`shrink-0 text-violet-400/60 group-hover:text-violet-400 ${
                          entry.depth <= 2 ? 'w-3.5 h-3.5' : 'w-3 h-3'
                        }`}
                      />
                      <span
                        className={`truncate ${
                          entry.depth === 1
                            ? 'text-[13px] font-black text-slate-200'
                            : entry.depth === 2
                              ? 'text-[13px] font-bold'
                              : 'text-xs font-medium'
                        }`}
                      >
                        {entry.text}
                      </span>
                    </button>
                  ))}
                </nav>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Preview.displayName = 'Preview';

export default Preview;
