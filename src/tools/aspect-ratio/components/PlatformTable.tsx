import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { simplifyRatio } from '../lib/ratio';

/**
 * Recommended sizes per platform. Brand names stay as they are; the kind of
 * placement ("video", "cover"…) is translated through `plat_*` keys.
 */
export const PLATFORMS: { brand: string; key: string; fallback: string; w: number; h: number }[] = [
  { brand: 'YouTube', key: 'plat_video', fallback: 'Video', w: 1920, h: 1080 },
  { brand: 'YouTube', key: 'plat_shorts', fallback: 'Shorts', w: 1080, h: 1920 },
  { brand: 'YouTube', key: 'plat_thumbnail', fallback: 'Thumbnail', w: 1280, h: 720 },
  { brand: 'YouTube', key: 'plat_banner', fallback: 'Channel banner', w: 2560, h: 1440 },
  { brand: 'TikTok', key: 'plat_video', fallback: 'Video', w: 1080, h: 1920 },
  { brand: 'Instagram', key: 'plat_square', fallback: 'Square post', w: 1080, h: 1080 },
  { brand: 'Instagram', key: 'plat_portrait', fallback: 'Portrait post', w: 1080, h: 1350 },
  { brand: 'Instagram', key: 'plat_stories', fallback: 'Stories and Reels', w: 1080, h: 1920 },
  { brand: 'Facebook', key: 'plat_link', fallback: 'Link / shared image', w: 1200, h: 630 },
  { brand: 'Facebook', key: 'plat_cover', fallback: 'Cover photo', w: 851, h: 315 },
  { brand: 'X (Twitter)', key: 'plat_image', fallback: 'Post image', w: 1600, h: 900 },
  { brand: 'X (Twitter)', key: 'plat_header', fallback: 'Header', w: 1500, h: 500 },
  { brand: 'LinkedIn', key: 'plat_link', fallback: 'Link / shared image', w: 1200, h: 627 },
  { brand: 'LinkedIn', key: 'plat_banner', fallback: 'Banner', w: 1584, h: 396 },
  { brand: 'Pinterest', key: 'plat_pin', fallback: 'Pin', w: 1000, h: 1500 },
  { brand: 'Twitch', key: 'plat_banner', fallback: 'Banner', w: 1200, h: 480 },
  { brand: 'Open Graph', key: 'plat_link', fallback: 'Link preview', w: 1200, h: 630 },
  { brand: 'Full HD', key: 'plat_screen', fallback: 'Screen', w: 1920, h: 1080 },
  { brand: '4K UHD', key: 'plat_screen', fallback: 'Screen', w: 3840, h: 2160 },
];

export function PlatformTable({ t, onUse }: { t: any; onUse: (w: number, h: number) => void }) {
  return (
    <div className="overflow-x-auto -mx-4 md:mx-0">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-widest text-slate-500">
            <th className="font-black py-2 px-4">{t.colPlatform || 'Platform'}</th>
            <th className="font-black py-2 px-2">{t.colUse || 'Use'}</th>
            <th className="font-black py-2 px-2">{t.colRatio || 'Ratio'}</th>
            <th className="font-black py-2 px-2">{t.colSize || 'Size (px)'}</th>
            <th className="py-2 px-4"><span className="sr-only">{t.useInCalc || 'Use in the calculator'}</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {PLATFORMS.map(p => {
            const r = simplifyRatio(p.w, p.h, 40);
            const ratio = r.exact ? `${r.w}:${r.h}` : `${r.decimal.toFixed(2)}:1`;
            return (
              <tr key={`${p.brand}-${p.key}-${p.w}`} className="hover:bg-white/[0.03]">
                <td className="py-2.5 px-4 font-bold text-white whitespace-nowrap">{p.brand}</td>
                <td className="py-2.5 px-2 text-slate-300">{t[p.key] || p.fallback}</td>
                <td className="py-2.5 px-2 font-mono font-black text-lime-300">{ratio}</td>
                <td className="py-2.5 px-2 font-mono text-slate-300 whitespace-nowrap">{p.w}×{p.h}</td>
                <td className="py-2.5 px-4 text-right">
                  <button
                    onClick={() => onUse(p.w, p.h)}
                    className="inline-flex items-center gap-1 px-2.5 h-8 rounded-lg bg-white/5 hover:bg-lime-500/20 text-xs font-bold text-slate-300 hover:text-lime-300 cursor-pointer whitespace-nowrap"
                  >
                    {t.useBtn || 'Use'}
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
