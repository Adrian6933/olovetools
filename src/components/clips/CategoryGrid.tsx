import React from 'react';
import { Category } from './types';
import { Sparkles } from 'lucide-react';

import ProgressiveImage from './ProgressiveImage';
import { AdSlot } from '../shared/AdSlot';

/** Cada cuántas categorías se cuela una franja de anuncio (6 columnas x 2 filas). */
const CATEGORY_AD_EVERY = 12;

/** Ancho al que se pinta la carátula en cada corte, para elegir del srcset. */
const ART_SIZES = '(min-width: 1800px) 260px, (min-width: 1400px) 14vw, (min-width: 1280px) 15vw, (min-width: 1024px) 18vw, (min-width: 768px) 30vw, 46vw';

interface CategoryGridProps {
  categories: Category[];
  onCategoryClick: (category: Category) => void;
  isLoading: boolean;
  t: (key: string) => string;
  showRank: boolean;
}

const CategoryCard: React.FC<{
  category: Category;
  rank?: number;
  onClick: () => void;
  t: (key: string) => string;
  showRank: boolean;
  index: number;
}> = ({ category, rank, onClick, t, showRank, index }) => {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer flex flex-col gap-3 md:gap-6"
    >
      <div
        style={{ isolation: 'isolate', transform: 'translateZ(0)' }}
        className="relative aspect-[3/4] glass rounded-3xl sm:rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-white/5 transition-premium transform group-hover:-translate-y-3 group-hover:border-twitch-base/20 group-hover:shadow-[0_40px_80px_-20px_rgba(var(--color-accent-rgb),0.12)]"
      >
        <ProgressiveImage
          src={category.box_art_url}
          alt={category.name || 'Category artwork'}
          className="w-full h-full transition-transform duration-1000 group-hover:scale-105 will-change-transform"
          isCategory={true}
          sizes={ART_SIZES}
        />

        {/* Ranking Badge - Only shown on initial load/popular categories */}
        {showRank && rank && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 md:left-6 md:translate-x-0 md:top-6 z-20 whitespace-nowrap">
              <div className="bg-twitch-base text-[var(--color-accent-ink)] px-2 py-1 md:px-4 md:py-1.5 rounded-lg md:rounded-xl text-[10px] md:text-[11px] font-black shadow-[0_4px_20px_rgba(var(--color-accent-rgb),0.5)] border border-white/20 flex items-center gap-1 md:gap-1.5 animate-in slide-in-from-top-4 duration-500">
                  <span>{t('trending_rank')}</span>
                  <span className="text-xs md:text-sm">#{rank}</span>
              </div>
          </div>
        )}




      </div>

      <div className="flex flex-col min-w-0 px-1 sm:px-2 md:px-4">
        <h2 className="font-black text-sm sm:text-base md:text-xl text-gray-200 truncate group-hover:text-twitch-base transition-colors tracking-tight leading-tight mb-1.5 md:mb-2" title={category.name}>
          {category.name}
        </h2>
        {/* Los espectadores sólo salen cuando se saben de verdad: una búsqueda
            por texto no trae ese dato y un "0 espectadores" sería mentira. */}
        {category.viewer_count > 0 && (
          <p className="mb-1.5 truncate text-[11px] font-bold text-twitch-base/80 md:text-xs">
            {formatoEspectadores(category.viewer_count)} {t('ui_viewers')}
          </p>
        )}
        <div className="flex min-w-0">
            {/* truncate + min-w-0: en móvil la tarjeta mide ~160px y la etiqueta
                traducida ("Categoría de Twitch", "Twitch-Kategorie"...) es más
                larga que eso en varios idiomas. */}
            <span className="text-[9px] uppercase font-black bg-white/5 px-2.5 md:px-4 py-1 md:py-1.5 rounded-full text-gray-500 border border-white/5 tracking-[0.15em] md:tracking-[0.2em] opacity-40 truncate">
              {showRank ? t('tag_top_category') : t('tag_twitch_category')}
            </span>
        </div>
      </div>
    </div>
  );
};

/**
 * 44418 -> "44.4K". Con idioma FIJO a propósito: leer document.documentElement
 * .lang aquí haría que el servidor formatease en inglés y el navegador en el
 * idioma de la página, y React aborta la hidratación de la isla entera cuando
 * el texto no coincide. La palabra que acompaña al número sí está traducida.
 */
const formatoEspectadores = (n: number): string => {
  try {
    return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  } catch {
    return String(n);
  }
};

const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, onCategoryClick, isLoading, t, showRank }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-10">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="flex flex-col gap-3 md:gap-6">
             <div className="aspect-[3/4] glass animate-pulse rounded-3xl sm:rounded-[2rem] md:rounded-[2.5rem]"></div>
             <div className="h-6 bg-white/5 rounded-xl w-3/4 animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-10 pb-10">
      {categories.map((cat, index) => (
        <React.Fragment key={cat.id}>
          <CategoryCard
              category={cat}
              rank={index + 1}
              onClick={() => onCategoryClick(cat)}
              t={t}
              showRank={showRank}
              index={index}
          />
          {/* A todo el ancho y no en una celda: con 6 columnas cada celda mide
              ~240px y un in-feed ahí sale apretado. Cada 2 filas de la rejilla
              más ancha (12 = 6 x 2) y nunca detrás de la última tarjeta. */}
          {(index + 1) % CATEGORY_AD_EVERY === 0 && index < categories.length - 1 && (
            <div className="col-span-full flex items-center justify-center py-2">
              <AdSlot position="content" size="leaderboard" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default CategoryGrid;
