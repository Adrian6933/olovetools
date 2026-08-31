import React, { useMemo } from 'react';
import { formatBytes, HEX_MAX_BYTES } from '../lib/format';

interface HexViewProps {
  bytes: Uint8Array;
  /** Total payload size, which may be larger than `bytes` when truncated. */
  totalBytes: number;
  /** How many leading bytes belong to the format signature, highlighted. */
  signatureLength?: number;
  t: any;
}

const ROW = 16;

/** The printable-ASCII column, with a middle dot standing in for everything else. */
function asciiOf(byte: number): string {
  return byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : '·';
}

/**
 * A hex dump of the *intermediate* bytes.
 *
 * This is the pane the old tool could not have: it only ever held a flattened
 * `data:` string, so "what is actually in this payload" was unanswerable. With
 * the bytes in hand the magic number is visible, the padding is visible, and a
 * truncated file announces itself as a signature with nothing behind it.
 *
 * Only the first kilobyte is rendered. A megabyte of <span>s is 65 000 DOM
 * nodes and a locked-up tab for a view nobody scrolls past the first screen of.
 */
export const HexView: React.FC<HexViewProps> = ({ bytes, totalBytes, signatureLength = 0, t }) => {
  const shown = useMemo(() => bytes.subarray(0, HEX_MAX_BYTES), [bytes]);

  const rows = useMemo(() => {
    const out: { offset: number; cells: number[] }[] = [];
    for (let i = 0; i < shown.length; i += ROW) {
      out.push({ offset: i, cells: Array.from(shown.subarray(i, i + ROW)) });
    }
    return out;
  }, [shown]);

  if (!bytes.length) {
    return (
      <div className="p-5 text-xs text-slate-600 font-mono">{t.hexEmpty || 'No bytes yet.'}</div>
    );
  }

  return (
    <div className="overflow-auto scrollbar-thin">
      <table className="font-mono text-[11px] leading-relaxed border-collapse">
        <tbody>
          {rows.map(row => (
            <tr key={row.offset} className="hover:bg-blue-500/5">
              <td className="sticky left-0 z-10 bg-[#020a1e] px-3 py-0.5 text-slate-600 select-none tabular-nums">
                {row.offset.toString(16).padStart(8, '0')}
              </td>
              <td className="px-2 py-0.5 whitespace-nowrap">
                {row.cells.map((byte, i) => {
                  const absolute = row.offset + i;
                  const isSignature = absolute < signatureLength;
                  return (
                    <span
                      key={i}
                      className={`inline-block w-[1.55em] text-center ${
                        isSignature ? 'text-blue-300 font-bold' : byte === 0 ? 'text-slate-700' : 'text-slate-300'
                      }`}
                    >
                      {byte.toString(16).padStart(2, '0')}
                    </span>
                  );
                })}
              </td>
              <td className="px-3 py-0.5 whitespace-pre text-slate-500 border-l border-white/5">
                {row.cells.map(asciiOf).join('')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalBytes > shown.length && (
        <p className="px-3 py-2 text-[10px] text-slate-600 font-medium">
          {(t.hexTruncated || 'Showing the first {0} of {1}.')
            .replace('{0}', formatBytes(shown.length))
            .replace('{1}', formatBytes(totalBytes))}
        </p>
      )}
    </div>
  );
};

export default HexView;
