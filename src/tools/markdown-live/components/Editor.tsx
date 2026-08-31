import React, { useCallback, useImperativeHandle, useRef } from 'react';
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Table as TableIcon,
  Terminal,
  Undo2,
} from 'lucide-react';
import {
  indent,
  insertBlock,
  insertLink,
  linePrefix,
  newline,
  pasteOverSelection,
  renumberLists,
  wrap,
  type EditResult,
} from '../lib/editing';

export interface EditorHandle {
  focus: () => void;
  scrollTo: (ratio: number) => void;
  element: () => HTMLTextAreaElement | null;
}

interface EditorProps {
  value: string;
  /** `label` is a dictionary key, used to name the step in the undo stack. */
  onChange: (next: string, options?: { coalesce?: boolean; label?: string }) => void;
  onScrollRatio: (ratio: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  t: any;
  className?: string;
}

interface ToolButton {
  id: string;
  icon: React.ReactNode;
  labelKey: string;
  fallback: string;
  hint?: string;
  run: (text: string, sel: { start: number; end: number }) => EditResult;
}

export const Editor = React.forwardRef<EditorHandle, EditorProps>(
  ({ value, onChange, onScrollRatio, onUndo, onRedo, canUndo, canRedo, t, className = '' }, ref) => {
    const areaRef = useRef<HTMLTextAreaElement>(null);
    // Where to put the caret after React has re-rendered with the new text.
    const pendingSelection = useRef<{ start: number; end: number } | null>(null);

    useImperativeHandle(ref, () => ({
      focus: () => areaRef.current?.focus(),
      scrollTo: (ratio: number) => {
        const area = areaRef.current;
        if (!area) return;
        area.scrollTop = ratio * (area.scrollHeight - area.clientHeight);
      },
      element: () => areaRef.current,
    }));

    // A layout effect would fight the browser's own caret restoration; setting
    // the range right after the value lands is both simpler and flicker-free.
    React.useEffect(() => {
      const pending = pendingSelection.current;
      const area = areaRef.current;
      if (!pending || !area) return;
      pendingSelection.current = null;
      area.focus();
      area.setSelectionRange(pending.start, pending.end);
    }, [value]);

    const apply = useCallback(
      (result: EditResult | null, label?: string) => {
        if (!result) return;
        pendingSelection.current = { start: result.start, end: result.end };
        onChange(result.text, { label });
      },
      [onChange]
    );

    const selection = () => {
      const area = areaRef.current;
      return { start: area ? area.selectionStart : 0, end: area ? area.selectionEnd : 0 };
    };

    const buttons: ToolButton[][] = [
      [
        {
          id: 'h1',
          icon: <Heading1 className="w-4 h-4" />,
          labelKey: 'tooltip_h1',
          fallback: 'Heading 1',
          run: (text, sel) => linePrefix(text, sel, 'heading', () => '# '),
        },
        {
          id: 'h2',
          icon: <Heading2 className="w-4 h-4" />,
          labelKey: 'tooltip_h2',
          fallback: 'Heading 2',
          run: (text, sel) => linePrefix(text, sel, 'heading', () => '## '),
        },
        {
          id: 'bold',
          icon: <Bold className="w-4 h-4" />,
          labelKey: 'tooltip_bold',
          fallback: 'Bold',
          hint: 'Ctrl+B',
          run: (text, sel) => wrap(text, sel, '**', t.sample_bold || 'bold text'),
        },
        {
          id: 'italic',
          icon: <Italic className="w-4 h-4" />,
          labelKey: 'tooltip_italic',
          fallback: 'Italic',
          hint: 'Ctrl+I',
          run: (text, sel) => wrap(text, sel, '*', t.sample_italic || 'italic text'),
        },
        {
          id: 'strike',
          icon: <Strikethrough className="w-4 h-4" />,
          labelKey: 'tooltip_strike',
          fallback: 'Strikethrough',
          run: (text, sel) => wrap(text, sel, '~~', t.sample_strike || 'struck through'),
        },
        {
          id: 'mark',
          icon: <Highlighter className="w-4 h-4" />,
          labelKey: 'tooltip_mark',
          fallback: 'Highlight',
          run: (text, sel) => wrap(text, sel, '==', t.sample_mark || 'highlighted'),
        },
      ],
      [
        {
          id: 'link',
          icon: <LinkIcon className="w-4 h-4" />,
          labelKey: 'tooltip_link',
          fallback: 'Link',
          hint: 'Ctrl+K',
          run: (text, sel) => insertLink(text, sel, 'https://', t.sample_link || 'link text'),
        },
        {
          id: 'image',
          icon: <ImageIcon className="w-4 h-4" />,
          labelKey: 'tooltip_image',
          fallback: 'Image',
          run: (text, sel) => {
            const result = insertLink(text, sel, 'https://', t.sample_image || 'image description');
            return { ...result, text: result.text.slice(0, sel.start) + '!' + result.text.slice(sel.start), start: result.start + 1, end: result.end + 1 };
          },
        },
        {
          id: 'code',
          icon: <Code className="w-4 h-4" />,
          labelKey: 'tooltip_code',
          fallback: 'Inline code',
          run: (text, sel) => wrap(text, sel, '`', t.sample_code || 'code'),
        },
        {
          id: 'codeblock',
          icon: <Terminal className="w-4 h-4" />,
          labelKey: 'tooltip_codeblock',
          fallback: 'Code block',
          run: (text, sel) => {
            const selected = text.slice(sel.start, sel.end) || (t.sample_codeblock || 'const answer = 42;');
            return insertBlock(text, sel, '```js\n' + selected + '\n```');
          },
        },
      ],
      [
        {
          id: 'ul',
          icon: <List className="w-4 h-4" />,
          labelKey: 'tooltip_ul',
          fallback: 'Bulleted list',
          run: (text, sel) => linePrefix(text, sel, 'ul', () => '- '),
        },
        {
          id: 'ol',
          icon: <ListOrdered className="w-4 h-4" />,
          labelKey: 'tooltip_ol',
          fallback: 'Numbered list',
          run: (text, sel) => {
            const result = linePrefix(text, sel, 'ol', index => `${index + 1}. `);
            return { ...result, text: renumberLists(result.text) };
          },
        },
        {
          id: 'task',
          icon: <ListTodo className="w-4 h-4" />,
          labelKey: 'tooltip_task',
          fallback: 'Task list',
          run: (text, sel) => linePrefix(text, sel, 'task', () => '- [ ] '),
        },
        {
          id: 'quote',
          icon: <Quote className="w-4 h-4" />,
          labelKey: 'tooltip_quote',
          fallback: 'Blockquote',
          run: (text, sel) => linePrefix(text, sel, 'quote', () => '> '),
        },
        {
          id: 'table',
          icon: <TableIcon className="w-4 h-4" />,
          labelKey: 'tooltip_table',
          fallback: 'Table',
          run: (text, sel) =>
            insertBlock(
              text,
              sel,
              `| ${t.sample_col1 || 'Column'} | ${t.sample_col2 || 'Value'} |\n| :--- | ---: |\n| ${
                t.sample_cell || 'Row'
              } | 1 |`
            ),
        },
        {
          id: 'hr',
          icon: <Minus className="w-4 h-4" />,
          labelKey: 'tooltip_hr',
          fallback: 'Divider',
          run: (text, sel) => insertBlock(text, sel, '---'),
        },
      ],
    ];

    const runButton = (button: ToolButton) => {
      const area = areaRef.current;
      if (!area) return;
      apply(button.run(value, selection()), button.labelKey);
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const sel = selection();
      const mod = event.ctrlKey || event.metaKey;

      if (mod && !event.altKey) {
        const key = event.key.toLowerCase();
        if (key === 'z' && !event.shiftKey) {
          event.preventDefault();
          onUndo();
          return;
        }
        if (key === 'y' || (key === 'z' && event.shiftKey)) {
          event.preventDefault();
          onRedo();
          return;
        }
        if (key === 'b') {
          event.preventDefault();
          apply(wrap(value, sel, '**', t.sample_bold || 'bold text'), 'tooltip_bold');
          return;
        }
        if (key === 'i') {
          event.preventDefault();
          apply(wrap(value, sel, '*', t.sample_italic || 'italic text'), 'tooltip_italic');
          return;
        }
        if (key === 'k') {
          event.preventDefault();
          apply(insertLink(value, sel, 'https://', t.sample_link || 'link text'), 'tooltip_link');
          return;
        }
        if (key === 'e') {
          event.preventDefault();
          apply(wrap(value, sel, '`', t.sample_code || 'code'), 'tooltip_code');
          return;
        }
      }

      if (event.key === 'Tab') {
        event.preventDefault();
        apply(indent(value, sel, event.shiftKey), 'tooltip_indent');
        return;
      }

      if (event.key === 'Enter' && !event.shiftKey && !mod) {
        const result = newline(value, sel);
        if (result) {
          event.preventDefault();
          apply(result);
        }
      }
    };

    const onPaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const pasted = event.clipboardData.getData('text/plain');
      const result = pasteOverSelection(value, selection(), pasted);
      if (!result) return;
      event.preventDefault();
      apply(result, 'tooltip_link');
    };

    const onScroll = () => {
      const area = areaRef.current;
      if (!area) return;
      const range = area.scrollHeight - area.clientHeight;
      onScrollRatio(range > 0 ? area.scrollTop / range : 0);
    };

    return (
      <div className={`flex flex-col min-h-0 ${className}`}>
        {/* toolbar — wraps rather than overflowing on a phone */}
        <div className="flex flex-wrap items-center gap-1 px-2.5 py-2 border-b border-white/5 bg-black/20">
          {buttons.map((group, groupIndex) => (
            <React.Fragment key={groupIndex}>
              {groupIndex > 0 && <span className="hidden sm:block w-px h-5 bg-white/10 mx-0.5" />}
              {group.map(button => (
                <button
                  key={button.id}
                  type="button"
                  onClick={() => runButton(button)}
                  title={`${t[button.labelKey] || button.fallback}${button.hint ? ` (${button.hint})` : ''}`}
                  aria-label={t[button.labelKey] || button.fallback}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 hover:bg-violet-500/20 hover:border-violet-500/30 text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  {button.icon}
                </button>
              ))}
            </React.Fragment>
          ))}

          <span className="hidden sm:block w-px h-5 bg-white/10 mx-0.5" />

          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title={`${t.tooltip_undo || 'Undo'} (Ctrl+Z)`}
            aria-label={t.tooltip_undo || 'Undo'}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 hover:bg-violet-500/20 hover:border-violet-500/30 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/5"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title={`${t.tooltip_redo || 'Redo'} (Ctrl+Y)`}
            aria-label={t.tooltip_redo || 'Redo'}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 hover:bg-violet-500/20 hover:border-violet-500/30 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/5"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <textarea
          ref={areaRef}
          value={value}
          onChange={event => onChange(event.target.value, { coalesce: true })}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onScroll={onScroll}
          spellCheck
          placeholder={t.editorPlaceholder || 'Write markdown here…'}
          aria-label={t.editorLabel || 'Markdown source'}
          className="flex-1 min-h-0 w-full p-4 sm:p-6 bg-transparent text-slate-300 font-mono text-[13px] sm:text-sm leading-relaxed resize-none border-none outline-none scrollbar-thin"
        />
      </div>
    );
  }
);

Editor.displayName = 'Editor';

export default Editor;
