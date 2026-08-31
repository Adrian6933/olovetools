// ============================================================================
// Emitters
// ----------------------------------------------------------------------------
// Nine formats out. The interesting part is not the timestamps, it is what
// happens to the markup: the old build copied cue text verbatim, so a WebVTT
// `<v Narrator>` or `<c.loud>` landed inside an SRT where neither is valid and
// players show the tag as literal text. Each target declares which tags it can
// actually render, and the rest is converted or removed on the way out.
// ============================================================================

import type { Cue, Format, Track } from './model';
import {
  toAssTime, toLrcTime, toSbvTime, toSrtTime, toTtmlTime, toVttTime,
} from './model';

/** What each target can render. */
const RICH_TEXT: Record<Format, boolean> = {
  srt: true,   // players honour <i> <b> <u> <font color>
  vtt: true,
  ass: true,   // uses its own {\i1} syntax
  ttml: true,  // uses <span tts:fontStyle>
  sbv: false,
  lrc: false,
  txt: false,
  json: false,
  csv: false,
};

const VOICE = /<v(?:\.[^\s>]+)*\s+([^>]+)>/i;

/**
 * Normalises a cue's text for a target format.
 * `speakerNames` keeps `<v Narrator>` as a readable "Narrator: " prefix rather
 * than deleting information the source went to the trouble of recording.
 */
export function renderLines(cue: Cue, target: Format, speakerNames: boolean): string[] {
  const rich = RICH_TEXT[target];
  const voice = VOICE.exec(cue.lines.join('\n'));
  const speaker = cue.speaker || (voice ? voice[1].trim() : '');

  let lines = cue.lines.map(line =>
    line
      // WebVTT karaoke timestamps carry no meaning outside VTT.
      .replace(/<\d{1,2}:\d{2}:\d{2}\.\d{3}>/g, '')
      .replace(/<\/?v(?:\.[^\s>]+)*(?:\s+[^>]*)?>/gi, '')
      .replace(/<\/?c(?:\.[^\s>]+)*>/gi, '')
      .replace(/<\/?ruby[^>]*>|<\/?rt[^>]*>/gi, '')
  );

  if (!rich) lines = lines.map(line => line.replace(/<[^>]+>/g, '').replace(/\{[^}]*\}/g, ''));

  if (speakerNames && speaker) {
    lines = [...lines];
    lines[0] = `${speaker}: ${lines[0]}`.trim();
  }

  return lines.map(l => l.replace(/\s{2,}/g, ' ').trim()).filter((l, i, a) => l !== '' || a.length === 1);
}

export interface EmitOptions {
  /** Fold `<v Speaker>` / ASS Name into the text as "Speaker: ". */
  speakerNames: boolean;
  /** Reuse the source header (WEBVTT blocks, ASS [Script Info]) when possible. */
  keepHeader: boolean;
}

export const EMIT_DEFAULTS: EmitOptions = { speakerNames: false, keepHeader: true };

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeCsv(text: string): string {
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// ----------------------------------------------------------------------------

function emitSrt(track: Track, o: EmitOptions): string {
  return (
    track.cues
      .map((cue, i) =>
        [`${i + 1}`, `${toSrtTime(cue.start)} --> ${toSrtTime(cue.end)}`, ...renderLines(cue, 'srt', o.speakerNames)].join('\n')
      )
      .join('\n\n') + '\n'
  );
}

function emitVtt(track: Track, o: EmitOptions): string {
  const header =
    o.keepHeader && track.header && /^WEBVTT/i.test(track.header) ? track.header : 'WEBVTT';
  const body = track.cues
    .map(cue => {
      const timing = `${toVttTime(cue.start)} --> ${toVttTime(cue.end)}${cue.settings ? ` ${cue.settings}` : ''}`;
      const rows = cue.id ? [cue.id, timing] : [timing];
      return [...rows, ...renderLines(cue, 'vtt', o.speakerNames)].join('\n');
    })
    .join('\n\n');
  return `${header}\n\n${body}\n`;
}

function emitSbv(track: Track, o: EmitOptions): string {
  return (
    track.cues
      .map(cue => [`${toSbvTime(cue.start)},${toSbvTime(cue.end)}`, ...renderLines(cue, 'sbv', o.speakerNames)].join('\n'))
      .join('\n\n') + '\n'
  );
}

const ASS_HEADER = `[Script Info]
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: None

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,48,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,1,2,10,10,20,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;

function emitAss(track: Track, o: EmitOptions): string {
  const header =
    o.keepHeader && track.header && /\[Script Info\]/i.test(track.header)
      ? track.header.replace(/\n{3,}/g, '\n\n')
      : ASS_HEADER;
  const events = track.cues
    .map(cue => {
      const text = renderLines(cue, 'ass', false).join('\\N').replace(/\n/g, '\\N');
      const style = cue.style || 'Default';
      const name = o.speakerNames ? '' : cue.speaker || '';
      return `Dialogue: 0,${toAssTime(cue.start)},${toAssTime(cue.end)},${style},${name},0,0,0,,${text}`;
    })
    .join('\n');
  // The header already ends with the Events Format: line when it came from a
  // real ASS file, so it is not repeated.
  const needsEvents = !/\[Events\]/i.test(header);
  return `${header}${needsEvents ? `\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text` : ''}\n${events}\n`;
}

function emitTtml(track: Track, o: EmitOptions): string {
  const body = track.cues
    .map(cue => {
      const text = renderLines(cue, 'ttml', o.speakerNames).map(escapeXml).join('<br/>');
      const region = cue.style ? ` region="${escapeXml(cue.style)}"` : '';
      return `      <p begin="${toTtmlTime(cue.start)}" end="${toTtmlTime(cue.end)}"${region}>${text}</p>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="utf-8"?>
<tt xmlns="http://www.w3.org/ns/ttml" xmlns:tts="http://www.w3.org/ns/ttml#styling" xml:lang="">
  <head/>
  <body>
    <div>
${body}
    </div>
  </body>
</tt>
`;
}

function emitLrc(track: Track, o: EmitOptions): string {
  const header = o.keepHeader && track.header && /^\[[a-z]{2,}:/im.test(track.header) ? `${track.header}\n` : '';
  const body = track.cues
    .map(cue => `[${toLrcTime(cue.start)}]${renderLines(cue, 'lrc', o.speakerNames).join(' ')}`)
    .join('\n');
  return `${header}${body}\n`;
}

function emitTxt(track: Track, o: EmitOptions): string {
  return track.cues.map(cue => renderLines(cue, 'txt', o.speakerNames).join(' ')).join('\n') + '\n';
}

function emitJson(track: Track, o: EmitOptions): string {
  return (
    JSON.stringify(
      track.cues.map((cue, i) => ({
        index: i + 1,
        start: cue.start,
        end: cue.end,
        lines: renderLines(cue, 'json', o.speakerNames),
        ...(cue.speaker && !o.speakerNames ? { speaker: cue.speaker } : {}),
      })),
      null,
      2
    ) + '\n'
  );
}

function emitCsv(track: Track, o: EmitOptions): string {
  const rows = track.cues.map(cue =>
    [
      toSrtTime(cue.start),
      toSrtTime(cue.end),
      escapeCsv(renderLines(cue, 'csv', o.speakerNames).join('\n')),
      escapeCsv(cue.speaker || ''),
    ].join(',')
  );
  return ['start,end,text,speaker', ...rows].join('\n') + '\n';
}

// ----------------------------------------------------------------------------

export function emit(track: Track, target: Format, options?: Partial<EmitOptions>): string {
  const o = { ...EMIT_DEFAULTS, ...(options || {}) };
  if (track.cues.length === 0) return '';
  switch (target) {
    case 'srt': return emitSrt(track, o);
    case 'vtt': return emitVtt(track, o);
    case 'sbv': return emitSbv(track, o);
    case 'ass': return emitAss(track, o);
    case 'ttml': return emitTtml(track, o);
    case 'lrc': return emitLrc(track, o);
    case 'txt': return emitTxt(track, o);
    case 'json': return emitJson(track, o);
    case 'csv': return emitCsv(track, o);
    default: return '';
  }
}

export const FILE_EXTENSION: Record<Format, string> = {
  srt: 'srt', vtt: 'vtt', sbv: 'sbv', ass: 'ass', ttml: 'ttml',
  lrc: 'lrc', txt: 'txt', json: 'json', csv: 'csv',
};

export const MIME_TYPE: Record<Format, string> = {
  srt: 'application/x-subrip',
  vtt: 'text/vtt',
  sbv: 'text/plain',
  ass: 'text/plain',
  ttml: 'application/ttml+xml',
  lrc: 'text/plain',
  txt: 'text/plain',
  json: 'application/json',
  csv: 'text/csv',
};

export const FORMAT_LABEL: Record<Format, string> = {
  srt: 'SRT', vtt: 'WebVTT', sbv: 'SBV', ass: 'ASS/SSA', ttml: 'TTML',
  lrc: 'LRC', txt: 'Text', json: 'JSON', csv: 'CSV',
};

/** Import order in the UI: the ones people actually paste come first. */
export const INPUT_FORMATS: Format[] = ['srt', 'vtt', 'sbv', 'ass', 'ttml', 'lrc', 'json', 'csv', 'txt'];
export const OUTPUT_FORMATS: Format[] = ['srt', 'vtt', 'sbv', 'ass', 'ttml', 'lrc', 'json', 'csv', 'txt'];
