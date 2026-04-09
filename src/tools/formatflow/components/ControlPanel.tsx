import React from 'react';
import { ConversionSettings, ImageFormat, BatchImageItem } from '../types';
import { Settings2, Download, Loader2, Package, Sliders, Info, ChevronRight, CheckCircle2, FileDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation, Language } from '../../../locales/dictionary';

interface ControlPanelProps {
  settings: ConversionSettings;
  onSettingsChange: (settings: ConversionSettings) => void;
  onConvert: () => void;
  onDownloadSingle?: () => void;
  isProcessing: boolean;
  fileCount: number;
  progress?: { current: number; total: number };
  activeImage?: BatchImageItem;
  onSpecificSettingsChange: (id: string, settings: ConversionSettings | undefined) => void;
  language: Language;
}

const SettingsControls: React.FC<{
  settings: ConversionSettings;
  onChange: (s: ConversionSettings) => void;
  accentColor?: 'primary' | 'secondary';
  language: Language;
}> = ({ settings, onChange, accentColor = 'primary', language }) => {
  const { dictionary } = useTranslation(language, 'formatflow');
  const t = dictionary.controls;

  const handleFormatChange = (format: ImageFormat) => {
    onChange({ ...settings, format });
  };

  const activeClass = accentColor === 'primary' 
    ? 'bg-primary text-white border-primary shadow-[0_10px_20px_-5px_rgba(99,102,241,0.4)]'
    : 'bg-secondary text-white border-secondary shadow-[0_10px_20px_-5px_rgba(168,85,247,0.4)]';

  const textAccent = accentColor === 'primary' ? 'text-primary' : 'text-secondary';
  const bgAccent = accentColor === 'primary' ? 'bg-primary/5 border-primary/10' : 'bg-secondary/5 border-secondary/10';

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t.outputFormat}</label>
        <div className="grid grid-cols-3 gap-1 p-1.5 bg-slate-900/80 rounded-[1.25rem] border border-slate-800/80 shadow-inner">
          {Object.values(ImageFormat).map((fmt) => {
            let rawLabel = fmt.split('/')[1].toUpperCase();
            if (rawLabel === 'JPEG') rawLabel = 'JPG';
            if (rawLabel === 'SVG+XML') rawLabel = 'SVG';
            if (rawLabel === 'X-ICON') rawLabel = 'ICO';
            const label = rawLabel;
            return (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                key={fmt}
                onClick={() => handleFormatChange(fmt)}
                className={`
                  py-2.5 px-1 rounded-xl text-xs font-bold transition-all duration-300 truncate
                  ${settings.format === fmt
                    ? activeClass
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }
                `}
              >
                {label}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em]">{t.quality}</span>
        </div>
        <div className="relative pt-2 pb-10 group">
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={settings.quality}
            onChange={(e) => onChange({ ...settings, quality: parseFloat(e.target.value) })}
            className={`w-full h-2 bg-slate-900 rounded-full appearance-none cursor-pointer transition-all hover:bg-slate-800 accent-${accentColor} shadow-inner border border-slate-800 relative z-10 peer`}
          />
          <div 
            className="absolute top-10 -translate-x-1/2 flex flex-col items-center opacity-0 peer-hover:opacity-100 peer-active:opacity-100 peer-focus:opacity-100 transition-all duration-300 pointer-events-none z-30"
            style={{ left: `calc(${((settings.quality - 0.1) / 0.9) * 100}% + ${8 - (((settings.quality - 0.1) / 0.9) * 16)}px)` }}
          >
            <div className={`w-3 h-3 rotate-45 -mb-1.5 border-t-2 border-l-2 bg-slate-800 ${accentColor === 'primary' ? 'border-primary/50' : 'border-secondary/50'} z-10`}></div>
            <div className={`relative z-20 px-3 py-1.5 rounded-lg text-xs font-black font-mono bg-slate-800 border-2 ${accentColor === 'primary' ? 'border-primary/50' : 'border-secondary/50'} text-white shadow-[0_10px_25px_rgba(0,0,0,0.5)] whitespace-nowrap`}>
              {Math.round(settings.quality * 100)}%
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em]">{t.resize}</span>
        </div>
        <div className="relative pt-2 pb-10 group">
          <input
            type="range"
            min="0.1"
            max="3" 
            step="0.1"
            value={settings.scale}
            onChange={(e) => onChange({ ...settings, scale: parseFloat(e.target.value) })}
            className={`w-full h-2 bg-slate-900 rounded-full appearance-none cursor-pointer transition-all hover:bg-slate-800 accent-${accentColor} shadow-inner border border-slate-800 relative z-10 peer`}
          />
          <div 
            className="absolute top-10 -translate-x-1/2 flex flex-col items-center opacity-0 peer-hover:opacity-100 peer-active:opacity-100 peer-focus:opacity-100 transition-all duration-300 pointer-events-none z-30"
            style={{ left: `calc(${((settings.scale - 0.1) / 2.9) * 100}% + ${8 - (((settings.scale - 0.1) / 2.9) * 16)}px)` }}
          >
            <div className={`w-3 h-3 rotate-45 -mb-1.5 border-t-2 border-l-2 bg-slate-800 ${accentColor === 'primary' ? 'border-primary/50' : 'border-secondary/50'} z-10`}></div>
            <div className={`relative z-20 px-3 py-1.5 rounded-lg text-xs font-black font-mono bg-slate-800 border-2 ${accentColor === 'primary' ? 'border-primary/50' : 'border-secondary/50'} text-white shadow-[0_10px_25px_rgba(0,0,0,0.5)] whitespace-nowrap`}>
              {Math.round(settings.scale * 100)}%
            </div>
          </div>
          <div className="absolute top-10 w-full h-4 text-[10px] text-slate-600 font-black tracking-tighter pointer-events-none">
              <span className="absolute left-0">10%</span>
              <span className="absolute left-[31%] -translate-x-1/2">100%</span>
              <span className="absolute right-0">300%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  onSettingsChange,
  onConvert,
  onDownloadSingle,
  isProcessing,
  fileCount,
  progress,
  activeImage,
  onSpecificSettingsChange,
  language
}) => {
  const { dictionary } = useTranslation(language, 'formatflow');
  const t = dictionary.controls;
  const appT = dictionary.app;
  const hasSpecificSettings = activeImage && activeImage.settings !== undefined;

  const toggleSpecificSettings = () => {
    if (!activeImage) return;
    if (hasSpecificSettings) {
      onSpecificSettingsChange(activeImage.id, undefined);
    } else {
      onSpecificSettingsChange(activeImage.id, { ...settings });
    }
  };

  return (
    <div className="glass-card rounded-[2.5rem] border border-slate-800 flex flex-col h-full shadow-2xl overflow-hidden animate-fade-in-up">
      <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Settings2 className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-black text-xl text-white tracking-tight">{t.globalSettings}</h2>
          </div>

          {fileCount > 1 && (
            <div className="bg-slate-900/50 rounded-2xl p-4 text-xs text-slate-400 flex items-start gap-3 border border-slate-800 shadow-inner">
              <Package className="w-5 h-5 text-primary shrink-0 opacity-60" />
              <p className="leading-relaxed">{t.globalInfo} <strong className="text-white">{fileCount}</strong> {t.images} {t.overrideInfo}</p>
            </div>
          )}

          <SettingsControls settings={settings} onChange={onSettingsChange} accentColor="primary" language={language} />
        </div>

        {fileCount > 1 && activeImage && (
          <div className="space-y-6 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2 bg-secondary/10 rounded-xl">
                <Sliders className="w-5 h-5 text-secondary" />
              </div>
              <h2 className="font-black text-xl text-white tracking-tight">{t.specificSettings}</h2>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl flex items-start gap-3">
               <Info className="w-5 h-5 text-blue-400 shrink-0" />
               <p className="text-xs text-blue-200/70 leading-relaxed font-medium">
                 <strong className="text-blue-300 block mb-1 uppercase tracking-widest">{t.specificHintTitle}</strong> {t.specificHintText}
               </p>
            </div>

            <div className={`rounded-3xl p-6 border transition-all duration-500 ${hasSpecificSettings ? 'bg-secondary/5 border-secondary/20 shadow-lg glow-secondary' : 'bg-slate-900/50 border-slate-800'}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t.imageOverride}</span>
                  <span className="text-xs font-black text-white truncate max-w-[120px]">
                    {activeImage.file.name}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={hasSpecificSettings}
                    onChange={toggleSpecificSettings}
                  />
                  <div className="w-12 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary peer-checked:after:bg-white after:shadow-md"></div>
                </label>
              </div>

              {hasSpecificSettings ? (
                <SettingsControls 
                  settings={activeImage.settings!} 
                  onChange={(s) => onSpecificSettingsChange(activeImage.id, s)} 
                  accentColor="secondary"
                  language={language}
                />
              ) : (
                 <div className="text-center py-4 space-y-2">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">{t.usingGlobal}</p>
                    <ChevronRight className="w-4 h-4 text-slate-700 mx-auto" />
                 </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-10 border-t border-slate-800 bg-[#060a14]/95 backdrop-blur-3xl flex flex-col gap-4">
        {isProcessing && progress && (
          <div className="space-y-4 mb-2 animate-fade-in">
             <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  {appT.processing}
                </span>
                <span className="font-mono text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                  {Math.round((progress.current/progress.total)*100)}%
                </span>
             </div>
             <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden shadow-inner border border-slate-800">
                <div 
                  className="bg-gradient-to-r from-primary via-love to-secondary h-full transition-all duration-700 rounded-full relative"
                  style={{ width: `${(progress.current / progress.total) * 100}%`}}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[size:20px_20px] animate-[shine_2s_linear_infinite]"></div>
                </div>
             </div>
          </div>
        )}

        {/* Action Buttons Stack */}
        <div className="flex flex-col gap-3">
          {/* Download Single Image Button - Simple Glass style */}
          {activeImage && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={onDownloadSingle}
              disabled={isProcessing}
              className={`
                w-full py-4 rounded-2xl font-display font-bold text-slate-300 flex items-center justify-center gap-2.5 
                transition-all duration-300 border border-slate-700 bg-slate-800/50 hover:bg-slate-700 hover:text-white
                group
                ${isProcessing ? 'opacity-30 cursor-not-allowed' : ''}
              `}
            >
              <FileDown className="w-5 h-5 text-secondary group-hover:scale-110 transition-transform" />
              <span className="text-sm tracking-wide">
                {t.downloadImage}
              </span>
            </motion.button>
          )}

          {/* Download All Button - Simple and Elegant */}
          <motion.button
            whileHover={!isProcessing ? { scale: 1.02, boxShadow: "0 0 30px rgba(255,255,255,0.3)" } : {}}
            whileTap={!isProcessing ? { scale: 0.97 } : {}}
            onClick={onConvert}
            disabled={isProcessing}
            className={`
              w-full py-5 rounded-[2rem] font-display font-black flex flex-col items-center justify-center shadow-lg
              transition-all duration-500 relative overflow-hidden group
              ${isProcessing
                ? 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed' 
                : 'bg-white text-slate-900 hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.4)]'
              }
            `}
          >
            {isProcessing ? (
              <div className="flex items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="uppercase tracking-widest text-xl">{appT.processing}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 sm:gap-3 relative z-10 w-full px-4">
                <Download className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-y-1 transition-transform duration-300 shrink-0" />
                <div className="flex flex-col items-center text-center leading-tight">
                  <span className="uppercase tracking-wide sm:tracking-wider text-sm sm:text-base md:text-lg font-black">
                    {fileCount > 1 ? t.downloadAll : t.downloadImage}
                  </span>
                  {fileCount > 1 && (
                    <span className="text-[10px] opacity-70 uppercase tracking-[0.2em] mt-1 font-bold font-sans">
                      {fileCount} {t.filesReady}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {!isProcessing && (
              <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <CheckCircle2 className="w-24 h-24 rotate-12" />
              </div>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;