import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { MOCK_PROJECTS } from '../constants';

// Este componente solo aparece ante un slug que no existe, asi que no recibe
// diccionario de herramienta: los textos viven aqui, en los nueve idiomas.
const TXT: Record<string, { titulo: string; cuerpo: string; inicio: string; atras: string }> = {
  en: { titulo: 'Tool not found', cuerpo: 'There is no tool at this address.', inicio: 'Back to the hub', atras: 'Back' },
  es: { titulo: 'Herramienta no encontrada', cuerpo: 'En esta dirección no hay ninguna herramienta.', inicio: 'Volver al inicio', atras: 'Volver' },
  fr: { titulo: 'Outil introuvable', cuerpo: "Il n'y a aucun outil à cette adresse.", inicio: "Retour à l'accueil", atras: 'Retour' },
  de: { titulo: 'Werkzeug nicht gefunden', cuerpo: 'Unter dieser Adresse gibt es kein Werkzeug.', inicio: 'Zurück zur Startseite', atras: 'Zurück' },
  pt: { titulo: 'Ferramenta não encontrada', cuerpo: 'Não há nenhuma ferramenta neste endereço.', inicio: 'Voltar ao início', atras: 'Voltar' },
  ru: { titulo: 'Инструмент не найден', cuerpo: 'По этому адресу нет инструмента.', inicio: 'Вернуться на главную', atras: 'Назад' },
  hi: { titulo: 'टूल नहीं मिला', cuerpo: 'इस पते पर कोई टूल नहीं है।', inicio: 'मुखपृष्ठ पर लौटें', atras: 'वापस' },
  ja: { titulo: 'ツールが見つかりません', cuerpo: 'このアドレスにツールはありません。', inicio: 'ホームに戻る', atras: '戻る' },
  zh: { titulo: '未找到该工具', cuerpo: '这个地址上没有工具。', inicio: '返回首页', atras: '返回' },
};

export const ToolPlaceholder: React.FC<{ toolSlug: string; lang: string }> = ({ toolSlug, lang }) => {
  const project = MOCK_PROJECTS.find(p => p.slug === toolSlug);
  const txt = TXT[lang] || TXT.en;

  if (!project) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl font-bold text-white mb-4 font-outfit">{txt.titulo}</h1>
        <p className="text-slate-400 mb-8">{txt.cuerpo}</p>
        <a href={`/${lang}`} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> {txt.inicio}
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <a href={`/${lang}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> {txt.atras}
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
        </div>
      </div>
    </div>
  );
};
