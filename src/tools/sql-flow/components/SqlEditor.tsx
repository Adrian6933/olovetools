import React, { useEffect, useMemo, useRef, useState } from 'react';
import { tokenize, type Token } from '../lib/tokenizer';

// ============================================================================
// Editor SQL: textarea real con una capa espejo de resaltado detrás.
// ----------------------------------------------------------------------------
// El diccionario prometía "syntax highlighting" desde el primer día y la
// herramienta no coloreaba absolutamente nada. Aquí el color lo pinta un <pre>
// idéntico al textarea (misma fuente, mismo interlineado, mismo padding) que
// vive justo detrás; el textarea queda con el texto transparente y sólo se le
// ve el cursor y la selección.
//
// Reglas que hacen que las dos capas no se desalineen nunca:
//   · `wrap="off"` en ambas: con ajuste de línea las líneas visuales y las
//     lógicas dejan de coincidir y los números del margen mienten.
//   · El espejo NO tiene barras de scroll propias: se desplaza por transform
//     con el scroll del textarea, así que su ancho no se ve recortado.
//   · Los `tabSize` y el `padding` se declaran en los dos sitios a la vez.
// ============================================================================

export const LINE_HEIGHT = 21;
/** Por encima de esto se deja de colorear: el coste del DOM supera el valor. */
const HIGHLIGHT_LIMIT = 120_000;

const TOKEN_CLASS: Record<string, string> = {
  keyword: 'text-amber-300 font-semibold',
  type: 'text-orange-300',
  function: 'text-yellow-200',
  identifier: 'text-amber-50',
  'quoted-identifier': 'text-amber-100 underline decoration-amber-500/30 underline-offset-2',
  string: 'text-emerald-300',
  number: 'text-sky-300',
  comment: 'text-stone-500 italic',
  param: 'text-fuchsia-300 font-semibold',
  variable: 'text-fuchsia-200',
  operator: 'text-amber-500/90',
  punctuation: 'text-stone-400',
  whitespace: '',
};

export interface EditorFocus {
  offset: number;
  line: number;
  /** Lo sube quien llama para repetir el salto a la misma posición. */
  nonce: number;
}

interface SqlEditorProps {
  value: string;
  onChange: (next: string, options?: { checkpoint?: boolean }) => void;
  placeholder?: string;
  errorLine?: number | null;
  focus?: EditorFocus | null;
  readOnly?: boolean;
  ariaLabel?: string;
  /** Texto que se enseña mientras se mantenga pulsado "ver original". */
  overrideText?: string | null;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

function renderTokens(tokens: Token[]): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.kind === 'whitespace') {
      nodes.push(token.text);
      continue;
    }
    const extra = token.unterminated ? ' bg-rose-500/20 rounded-sm' : '';
    nodes.push(
      <span key={i} className={(TOKEN_CLASS[token.kind] || '') + extra}>
        {token.text}
      </span>
    );
  }
  return nodes;
}

export const SqlEditor: React.FC<SqlEditorProps> = ({
  value,
  onChange,
  placeholder,
  errorLine,
  focus,
  readOnly,
  ariaLabel,
  overrideText,
  onKeyDown,
}) => {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLPreElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [viewport, setViewport] = useState(420);

  const shown = overrideText ?? value;

  const lineCount = useMemo(() => {
    let count = 1;
    for (let i = 0; i < shown.length; i++) if (shown.charCodeAt(i) === 10) count++;
    return count;
  }, [shown]);

  const highlighted = useMemo(() => {
    if (shown.length > HIGHLIGHT_LIMIT) return null;
    return renderTokens(tokenize(shown).tokens);
  }, [shown]);

  // ResizeObserver no dispara con el documento oculto (pestaña en segundo
  // plano), así que la altura se lee a mano al montar y al redimensionar.
  useEffect(() => {
    const measure = () => {
      const height = boxRef.current?.clientHeight;
      if (height && height > 0) setViewport(height);
    };
    measure();
    const id = window.setTimeout(measure, 60);
    window.addEventListener('resize', measure);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('resize', measure);
    };
  }, []);

  useEffect(() => {
    if (!focus) return;
    const area = areaRef.current;
    if (!area) return;
    area.focus();
    area.setSelectionRange(focus.offset, focus.offset);
    area.scrollTop = Math.max(0, (focus.line - 1) * LINE_HEIGHT - area.clientHeight / 2);
    setScrollTop(area.scrollTop);
    // `value` fuera de las dependencias a propósito: volver a saltar en cada
    // pulsación pelearía con el cursor del usuario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.nonce]);

  const firstVisible = Math.max(1, Math.floor(scrollTop / LINE_HEIGHT) - 2);
  const lastVisible = Math.min(lineCount, Math.ceil((scrollTop + viewport) / LINE_HEIGHT) + 2);
  const numbers: number[] = [];
  for (let n = firstVisible; n <= lastVisible; n++) numbers.push(n);

  const typography: React.CSSProperties = {
    lineHeight: `${LINE_HEIGHT}px`,
    fontSize: '12.5px',
    tabSize: 2,
  };

  return (
    <div ref={boxRef} className="flex-1 flex min-h-0 overflow-hidden relative">
      <div
        aria-hidden="true"
        className="relative w-11 shrink-0 bg-black/40 border-r border-amber-900/20 overflow-hidden select-none"
      >
        <div style={{ transform: `translateY(${-scrollTop}px)` }} className="absolute inset-x-0 top-0">
          {numbers.map(n => (
            <div
              key={n}
              className={`absolute right-0 w-full pr-2 text-right font-mono text-[11px] ${
                n === errorLine ? 'text-rose-400 font-black bg-rose-500/10' : 'text-stone-600'
              }`}
              style={{ top: (n - 1) * LINE_HEIGHT + 12, height: LINE_HEIGHT, lineHeight: `${LINE_HEIGHT}px` }}
            >
              {n}
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex-1 min-w-0">
        {errorLine != null && errorLine >= 1 && (
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 bg-rose-500/10 border-y border-rose-500/25 pointer-events-none z-10"
            style={{ top: (errorLine - 1) * LINE_HEIGHT + 12 - scrollTop, height: LINE_HEIGHT }}
          />
        )}

        <pre
          ref={mirrorRef}
          aria-hidden="true"
          className="absolute inset-0 m-0 py-3 px-3 font-mono overflow-hidden pointer-events-none whitespace-pre"
          style={{ ...typography, transform: `translate(${-scrollLeft}px, ${-scrollTop}px)` }}
        >
          {highlighted ?? <span className="text-amber-50">{shown}</span>}
        </pre>

        <textarea
          ref={areaRef}
          value={shown}
          readOnly={readOnly || overrideText != null}
          aria-label={ariaLabel}
          onChange={e => onChange(e.target.value)}
          onScroll={e => {
            setScrollTop((e.target as HTMLTextAreaElement).scrollTop);
            setScrollLeft((e.target as HTMLTextAreaElement).scrollLeft);
          }}
          onKeyDown={onKeyDown}
          wrap="off"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          placeholder={placeholder}
          className="absolute inset-0 w-full h-full bg-transparent py-3 px-3 font-mono text-transparent caret-amber-300 selection:bg-amber-500/25 outline-none resize-none overflow-auto placeholder:text-stone-600"
          style={typography}
        />

        {scrollLeft > 0 && (
          <span className="absolute bottom-1 right-2 text-[10px] font-mono text-stone-500 bg-[#0c0802]/85 px-1.5 rounded pointer-events-none">
            +{Math.round(scrollLeft)}px
          </span>
        )}
      </div>
    </div>
  );
};
