import React from 'react';
import { Category } from '../types';
import { Sparkles } from 'lucide-react';

import ProgressiveImage from './ProgressiveImage';

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
        className="relative aspect-[3/4] glass rounded-[2.5rem] overflow-hidden border border-white/5 transition-premium transform group-hover:-translate-y-3 group-hover:border-twitch-base/20 group-hover:shadow-[0_40px_80px_-20px_rgba(145,70,255,0.12)]"
      >
        <ProgressiveImage
          src={category.box_art_url}
          alt={category.name || 'Category artwork'}
          className="w-full h-full transition-transform duration-1000 group-hover:scale-105 will-change-transform"
          isCategory={true}
        />
        
        {/* Ranking Badge - Only shown on initial load/popular categories */}
        {showRank && rank && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 md:left-6 md:translate-x-0 md:top-6 z-20 whitespace-nowrap">
              <div className="bg-twitch-base text-white px-2 py-1 md:px-4 md:py-1.5 rounded-lg md:rounded-xl text-[10px] md:text-[11px] font-black shadow-[0_4px_20px_rgba(145,70,255,0.5)] border border-white/20 flex items-center gap-1 md:gap-1.5 animate-in slide-in-from-top-4 duration-500">
                  <span>{t('trending_rank')}</span>
                  <span className="text-xs md:text-sm">#{rank}</span>
              </div>
          </div>
        )}




      </div>

      <div className="flex flex-col px-4">
        <h2 className="font-black text-lg md:text-xl text-gray-200 truncate group-hover:text-twitch-base transition-colors tracking-tight leading-tight mb-2" title={category.name}>
          {category.name}
        </h2>
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-10">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="flex flex-col gap-3 md:gap-6">
             <div className="aspect-[3/4] glass animate-pulse rounded-[2.5rem]"></div>
             <div className="h-6 bg-white/5 rounded-xl w-3/4 animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-10 pb-10">
      {categories.map((cat, index) => (
          <CategoryCard 
              key={cat.id} 
              category={cat} 
              rank={index + 1}
              onClick={() => onCategoryClick(cat)} 
              t={t}
              showRank={showRank}
              index={index}
          />
      ))}
    </div>
  );
};

export default CategoryGrid;