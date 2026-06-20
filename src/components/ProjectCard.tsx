import React from 'react';
import { ArrowRight, Film, Music, Image, Code, MessageSquare, Box, ExternalLink, Zap, Download, Repeat, Palette, Volume2, FileText, Video, QrCode, Crop, Images, PenTool, GitCompare, Tag, Shield, Smile, FolderArchive } from 'lucide-react';
import { Project, LanguageCode as Language } from '../types';
import { useTranslation } from '../locales/dictionary';

interface ProjectCardProps {
  project: Project;
  categoryLabel: string;
  buttonLabel: string;
  lang: string;
}

const IconMap: Record<string, React.ElementType> = {
  'Film': Film,
  'Music': Music,
  'Image': Image,
  'Code': Code,
  'Message': MessageSquare,
  'Box': Box,
  'Zap': Zap,
  'Download': Download,
  'Repeat': Repeat,
  'Palette': Palette,
  'Volume2': Volume2,
  'FileText': FileText,
  'Video': Video,
  'QrCode': QrCode,
  'Crop': Crop,
  'Images': Images,
  'PenTool': PenTool,
  'GitCompare': GitCompare,
  'Tag': Tag,
  'Shield': Shield,
  'Smile': Smile,
  'FolderArchive': FolderArchive
};

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, categoryLabel, buttonLabel, lang }) => {
  const { t } = useTranslation(lang as Language, 'hub');
  const IconComponent = IconMap[project.icon] || Box;

  return (
    <a 
      href={`/${lang}/${project.slug}`}
      className="group relative bg-[#0c0c10] backdrop-blur-xl rounded-3xl p-8 border border-white/[0.08] hover:border-indigo-500/40 transition-all duration-500 flex flex-col h-full hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 overflow-hidden cursor-pointer shadow-lg"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 ${project.color} opacity-10 blur-[50px] group-hover:opacity-20 transition-opacity duration-500 rounded-full`} />

      <div className="flex items-start justify-between mb-8 relative z-10">
        <div className={`p-4 rounded-2xl ${project.color} text-white shadow-lg shadow-black/50 group-hover:scale-110 transition-transform duration-500`}>
          <IconComponent size={28} strokeWidth={2} />
        </div>
        <span className="px-4 py-1.5 bg-white/10 text-slate-200 text-xs font-bold uppercase tracking-wider rounded-full border border-white/15 backdrop-blur-sm">
          {categoryLabel}
        </span>
      </div>

      <div className="flex-1 relative z-10">
        <h2 className="text-2xl font-bold text-white mb-3 font-outfit tracking-tight group-hover:text-indigo-300 transition-colors flex items-center gap-2">
          {project.name}
          <ExternalLink className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-slate-400" />
        </h2>
        <p className="text-slate-300 text-sm leading-relaxed mb-8 font-medium">
          {project.description}
        </p>
      </div>
      
      <div className="pt-6 border-t border-white/5 flex flex-col gap-5 relative z-10">
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => {
            const translatedTag = t(`tags.${tag}`);
            return (
              <span 
                key={tag} 
                className="text-[10px] font-bold tracking-wider uppercase text-slate-300 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-all duration-300 hover:bg-indigo-500/20 hover:text-indigo-300 hover:border-indigo-500/30 cursor-default"
              >
                {translatedTag !== `tags.${tag}` ? translatedTag : tag}
              </span>
            );
          })}
        </div>
        
        <div className="flex items-center text-indigo-400 text-sm font-bold uppercase tracking-wide group-hover:translate-x-2 transition-transform duration-300">
          {buttonLabel}
          <ArrowRight className="w-4 h-4 ml-2" />
        </div>
      </div>
    </a>
  );
};