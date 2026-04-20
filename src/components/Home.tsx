import React, { useState, useMemo } from 'react';
import { Search, Globe, Sparkles, Github, Twitter } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProjectCard } from './ProjectCard';
import { Layout } from './Layout';
import { ProjectCategory, LanguageCode } from '../types';
import { MOCK_PROJECTS } from '../constants';
import { useTranslation, Language } from '../locales/dictionary';

export const Home: React.FC<{ lang: string, dictionary?: any }> = ({ lang = 'en', dictionary }) => {
  const { t } = useTranslation(lang as Language, 'hub');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | 'All'>('All');




  const filteredProjects = useMemo(() => {
    return MOCK_PROJECTS.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || project.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const categories = ['All', ...Object.values(ProjectCategory)];

  return (
    <Layout lang={lang}>
      <div className="relative isolate min-h-screen">
        {/* Global Tech Grid Background - Increased visibility and green vibrancy */}
        <div className="absolute inset-0 pointer-events-none -z-10" 
          style={{ 
            backgroundImage: 'linear-gradient(rgba(34,197,94,0.3) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(34,197,94,0.3) 1.5px, transparent 1.5px)', 
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(circle at top center, black, rgba(0,0,0,0.5) 50%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(circle at top center, black, rgba(0,0,0,0.5) 50%, transparent 100%)',
            filter: 'blur(0.7px)'
          }} 
        />
        
        {/* Subtle atmospheric top-down glow */}
        <div className="absolute inset-x-0 top-0 h-[800px] bg-gradient-to-b from-green-500/15 to-transparent pointer-events-none -z-10" />
            
        {/* Hero Section */}
        <div className="relative pt-24 pb-20 selection:bg-indigo-500/30 selection:text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <motion.h1 
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.5, delay: 0.05, ease: "easeOut" }}
              className="text-6xl md:text-8xl font-black text-white mb-10 tracking-[-0.04em] leading-[0.95] font-outfit"
            >
              {t('heroTitle')} {t('heroHighlight')}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
              className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-14 leading-relaxed font-light"
            >
              {t('heroSubtitle')}
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
            >
              <div className="relative group max-w-2xl mx-auto z-10">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full pl-16 pr-6 py-5 bg-[#121216] border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-2xl transition-all z-10 relative"
                />
                <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none z-20">
                  <Search className="w-6 h-6 text-slate-200 group-hover:text-indigo-400 group-focus-within:text-indigo-400 transition-colors" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Projects Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pb-40 relative z-10 overflow-x-hidden">
            <div className="relative mb-8">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex overflow-x-auto -mx-10 px-10 gap-4 py-6 custom-scrollbar md:justify-center md:flex-wrap relative z-10"
                style={{
                  maskImage: 'linear-gradient(to right, transparent, black 40px, black calc(100% - 40px), transparent)',
                  WebkitMaskImage: 'linear-gradient(to right, transparent, black 40px, black calc(100% - 40px), transparent)'
                }}
              >
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category as any)}
                    className={`px-8 py-3.5 rounded-full whitespace-nowrap text-sm font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer flex-shrink-0 ${
                      selectedCategory === category
                        ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.25)] scale-105 border-white'
                        : 'bg-white/25 text-white hover:bg-white/35 hover:text-white border border-white/20 shadow-sm backdrop-blur-sm'
                    }`}
                  >
                    {t(`categories.${category}`)}
                  </button>
                ))}
              </motion.div>
            </div>

            <div className="flex items-center justify-between mb-8 text-slate-400 text-sm font-medium uppercase tracking-widest">
              <span>{t('showing')} {filteredProjects.length} {t('projectsText')}</span>
            </div>

            {filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * index, ease: "easeOut" }}
                  >
                    <ProjectCard 
                      project={{
                        ...project,
                        description: t(`projects.${project.id}.description`) !== `projects.${project.id}.description` 
                          ? t(`projects.${project.id}.description`) 
                          : project.description
                      }} 
                      categoryLabel={t(`categories.${project.category}`)}
                      buttonLabel={t('openTool')}
                      lang={lang}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-32 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 border-dashed">
                <Globe className="w-20 h-20 text-slate-600 mx-auto mb-6 opacity-50" />
                <h2 className="text-2xl font-bold text-white mb-3 tracking-tight font-outfit">{t('noProjects')}</h2>
                <p className="text-slate-400 text-lg">{t('tryAdjusting')}</p>
              </div>
            )}
          </main>
      </div>
    </Layout>
  );
};
