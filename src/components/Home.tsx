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
        {/* Global Tech Grid Background - Now covers whole page */}
        <div className="absolute inset-0 pointer-events-none -z-10" 
          style={{ 
            backgroundImage: 'linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.04) 1px, transparent 1px)', 
            backgroundSize: '40px 40px',
            maskImage: 'linear-gradient(to bottom, black 30%, rgba(0,0,0,0.4) 70%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 30%, rgba(0,0,0,0.4) 70%, transparent 100%)'
          }} 
        />
        
        {/* Subtle atmospheric top-down glow */}
        <div className="absolute inset-x-0 top-0 h-[800px] bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none -z-10" />
            
        {/* Hero Section */}
        <div className="relative pt-32 pb-20 selection:bg-indigo-500/30 selection:text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05, ease: "easeOut" }}
              className="text-6xl md:text-8xl font-black text-white mb-10 tracking-[-0.04em] leading-[0.95] font-outfit"
            >
              {t('heroTitle')} {t('heroHighlight')}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
              className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-14 leading-relaxed font-light"
            >
              {t('heroSubtitle')}
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
              className="max-w-2xl mx-auto relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-40 blur-lg transition duration-500" />
              <div className="relative bg-[#08080a]/90 backdrop-blur-2xl border border-white/5 rounded-2xl flex items-center p-1.5 shadow-2xl cursor-text">
                <Search className="w-6 h-6 text-slate-400 ml-4" />
                <input 
                  type="text" 
                  placeholder={t('searchPlaceholder')}
                  className="w-full bg-transparent border-none text-white placeholder-slate-500 px-4 py-4 text-lg outline-none font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Projects Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pb-40 relative z-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex overflow-x-auto -m-10 p-10 gap-3 mb-4 no-scrollbar md:justify-center md:flex-wrap"
            >
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category as any)}
                  className={`px-6 py-3 rounded-full whitespace-nowrap text-sm font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                    selectedCategory === category
                      ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                  }`}
                >
                  {t(`categories.${category}`)}
                </button>
              ))}
            </motion.div>

            <div className="flex items-center justify-between mb-8 text-slate-500 text-sm font-medium uppercase tracking-widest">
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
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight font-outfit">{t('noProjects')}</h3>
                <p className="text-slate-400 text-lg">{t('tryAdjusting')}</p>
              </div>
            )}
          </main>
      </div>
    </Layout>
  );
};
