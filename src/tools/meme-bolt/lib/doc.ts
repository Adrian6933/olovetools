// ============================================================================
// Document factories
// ============================================================================

import type { BackdropSource, MemeDoc, StickerLayer, TextLayer } from '../types';
import { STICKERS } from './stickers';
import { getTemplate, type MemeTemplate } from './templates';

let counter = 0;
export const nextId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${(counter++).toString(36)}`;

export const DEFAULT_TEXT: Omit<TextLayer, 'id' | 'text' | 'x' | 'y'> = {
  kind: 'text',
  fontSize: 8,
  boxWidth: 88,
  lineHeight: 1.1,
  align: 'center',
  color: '#ffffff',
  strokeColor: '#000000',
  strokeWidth: 8,
  shadow: 0,
  fontFamily: 'impact',
  uppercase: true,
  letterSpacing: 0,
  rotation: 0,
  opacity: 1,
  locked: false,
};

export function makeText(text: string, x = 50, y = 12, overrides: Partial<TextLayer> = {}): TextLayer {
  return { ...DEFAULT_TEXT, id: nextId('t'), text, x, y, ...overrides } as TextLayer;
}

export function makeSticker(sticker: string, x = 50, y = 50): StickerLayer {
  const def = STICKERS[sticker];
  return {
    kind: 'sticker',
    id: nextId('s'),
    sticker,
    x,
    y,
    size: def?.size ?? 24,
    color: '#f0abfc',
    flipX: false,
    rotation: 0,
    opacity: 1,
    locked: false,
  };
}

/** Where a new caption should land so it does not cover the previous one. */
export function nextCaptionY(doc: MemeDoc): number {
  const used = doc.layers.filter(l => l.kind === 'text').length;
  return [12, 88, 50, 30, 70][used % 5];
}

export function docFromTemplate(template: MemeTemplate): MemeDoc {
  return {
    width: template.width,
    height: Math.round(template.width / template.ratio),
    captionBar: 0,
    padColor: '#ffffff',
    fit: 'cover',
    layers: template.captions.map(c =>
      makeText(c.text, c.x, c.y, {
        fontSize: c.fontSize,
        boxWidth: c.boxWidth,
        align: c.align ?? 'center',
        color: c.color ?? '#ffffff',
        strokeWidth: c.strokeWidth ?? 8,
      })
    ),
  };
}

export interface ImageDocOptions {
  /** White meme bar on top, as a percentage of the picture height. */
  captionBar: number;
  /** Seeds the classic top/bottom captions. */
  withCaptions: boolean;
}

export function docFromImage(width: number, height: number, options: ImageDocOptions): MemeDoc {
  const capped = Math.min(width, 2400);
  const scale = capped / width;
  const doc: MemeDoc = {
    width: Math.round(capped),
    height: Math.round(height * scale),
    captionBar: options.captionBar,
    padColor: '#ffffff',
    fit: 'cover',
    layers: [],
  };

  if (options.captionBar > 0) {
    const barCentre = (options.captionBar / (100 + options.captionBar)) * 100 * 0.5;
    doc.layers.push(
      makeText('When it just works', 50, barCentre, {
        color: '#0b0b0f',
        strokeWidth: 0,
        fontSize: Math.max(3, options.captionBar * 0.34),
        fontFamily: 'sans',
        uppercase: false,
      })
    );
  } else if (options.withCaptions) {
    doc.layers.push(makeText('Top text', 50, 11), makeText('Bottom text', 50, 89));
  }

  return doc;
}

export function blankDoc(width: number, height: number, color: string): MemeDoc {
  return {
    width,
    height,
    captionBar: 0,
    padColor: color,
    fit: 'cover',
    layers: [makeText('Your text here', 50, 50, { fontSize: 9 })],
  };
}

export const templateSource = (id: string): BackdropSource => {
  const template = getTemplate(id);
  return { kind: 'template', id: template.id, name: template.name, svg: template.svg, ratio: template.ratio };
};
