import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { MOCK_PROJECTS } from '../constants';

export const ToolPlaceholder: React.FC<{ toolSlug: string; lang: string }> = ({ toolSlug, lang }) => {
  const project = MOCK_PROJECTS.find(p => p.slug === toolSlug);

  if (!project) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl font-bold text-white mb-4 font-outfit">Tool Not Found</h1>
        <p className="text-slate-400 mb-8">The tool you are looking for does not exist.</p>
        <a href={`/${lang}`} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <a href={`/${lang}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </a>
      </div>

      <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-64 h-64 ${project.color} opacity-10 blur-[80px] rounded-full pointer-events-none`} />
        
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 font-outfit">{project.name}</h1>
          <p className="text-xl text-slate-300 max-w-2xl mb-8 leading-relaxed">
            {project.description}
          </p>
          
          <div className="flex flex-wrap gap-3 mb-12">
            {project.tags.map(tag => (
              <span key={tag} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-slate-300">
                {tag}
              </span>
            ))}
          </div>

          <div className="p-8 bg-black/20 rounded-2xl border border-white/5 text-center">
             <p className="text-slate-400 mb-4">Placeholder for the actual tool content.</p>
             <p className="text-sm text-slate-500">
               When you download the code, you can replace this component with the actual implementation of <strong>{project.name}</strong>.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
