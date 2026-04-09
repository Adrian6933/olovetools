import React from 'react';
import { Category } from '../types';
import { Sparkles } from 'lucide-react';

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
}> = ({ category, rank, onClick, t, showRank }) => {
  return (
    <div 
      onClick={onClick} 
      className="group cursor-pointer flex flex-col gap-6"
    >
      <div 
        style={{ isolation: 'isolate', transform: 'translateZ(0)' }}
        className="relative aspect-[3/4] glass rounded-[2.5rem] overflow-hidden border border-white/5 transition-premium transform group-hover:-translate-y-3 group-hover:border-twitch-base/20 group-hover:shadow-[0_40px_80px_-20px_rgba(145,70,255,0.12)]"
      >
        <img
          src={category.box_art_url}
          alt={category.name || 'Category artwork'}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 will-change-transform"
          loading="lazy"
        />
        
        {/* Ranking Badge - Only shown on initial load/popular categories */}
        {showRank && rank && (
          <div className="absolute top-6 left-6 z-20">
              <div className="bg-twitch-base text-white px-4 py-1.5 rounded-xl text-[11px] font-black shadow-[0_4px_20px_rgba(145,70,255,0.5)] border border-white/20 flex items-center gap-1.5 animate-in slide-in-from-left-4 duration-500">
                  <span className="opacity-60">{t('trending_rank')}</span>
                  <span className="text-sm">#{rank}</span>
              </div>
          </div>
        )}

        {/* Live Indicator - Subtle pulse for popularity mode */}
        {showRank && (
          <div className="absolute top-6 right-6 z-20">
              <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  <span className="text-[10px] font-black text-white tracking-widest">{t('live_badge')}</span>
              </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-8">
            <div className="bg-twitch-base/70 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3 transform translate-y-6 group-hover:translate-y-0 transition-transform duration-500">
                <Sparkles className="w-4 h-4" />
                {t('explore')}
            </div>
        </div>
      </div>

      <div className="flex flex-col px-4">
        <h3 className="font-black text-lg md:text-xl text-gray-200 truncate group-hover:text-twitch-base transition-colors tracking-tight leading-tight mb-2" title={category.name}>
          {category.name}
        </h3>
        <div className="flex">
            <span className="text-[9px] uppercase font-black bg-white/5 px-4 py-1.5 rounded-full text-gray-500 border border-white/5 tracking-[0.2em] opacity-40">
              {showRank ? t('tag_top_category') : t('tag_twitch_category')}
            </span>
        </div>
      </div>
    </div>
  );
};

const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, onCategoryClick, isLoading, t, showRank }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-10">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="flex flex-col gap-6">
             <div className="aspect-[3/4] glass animate-pulse rounded-[2.5rem]"></div>
             <div className="h-6 bg-white/5 rounded-xl w-3/4 animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-10 pb-10">
      {categories.map((cat, index) => (
          <CategoryCard 
              key={cat.id} 
              category={cat} 
              rank={index + 1}
              onClick={() => onCategoryClick(cat)} 
              t={t}
              showRank={showRank}
          />
      ))}
    </div>
  );
};

export default CategoryGrid;