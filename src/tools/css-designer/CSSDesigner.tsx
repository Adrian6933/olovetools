import React, { useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { useTranslation, Language } from '../../locales/dictionary';
import { Copy, Check, RotateCcw, Sliders, Palette, Layout, Settings, Sparkles, Plus, Trash, Layers, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CSSDesignerProps {
  lang: string;
  dictionary?: any;
}

const hexToRgba = (hex: string, alpha: number): string => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const CSSDesigner: React.FC<CSSDesignerProps> = ({ lang, dictionary }) => {
  const { t } = useTranslation(lang as Language, 'css-designer');
  
  // Modals state
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  // Current tab: 'glassmorphism' | 'boxshadow' | 'gradients' | 'borderradius'
  const [activeTab, setActiveTab] = useState<'glassmorphism' | 'boxshadow' | 'gradients' | 'borderradius'>('glassmorphism');

  // Preview background style: 'darkGrid' | 'lightGrid' | 'mesh' | 'vibrant'
  const [bgStyle, setBgStyle] = useState<'darkGrid' | 'lightGrid' | 'mesh' | 'vibrant'>('mesh');

  // Code Tab: 'css' | 'tailwind' | 'variables'
  const [codeFormat, setCodeFormat] = useState<'css' | 'tailwind' | 'variables'>('css');
  const [isCopied, setIsCopied] = useState(false);

  // States for Glassmorphism
  const [glassBlur, setGlassBlur] = useState(16);
  const [glassOpacity, setGlassOpacity] = useState(0.3);
  const [glassSaturation, setGlassSaturation] = useState(120);
  const [glassBorderOpacity, setGlassBorderOpacity] = useState(0.15);
  const [glassBorderWidth, setGlassBorderWidth] = useState(1);
  const [glassBgColor, setGlassBgColor] = useState('#ffffff');
  const [glassBorderColor, setGlassBorderColor] = useState('#ffffff');

  // States for Box Shadow
  const [shadowInset, setShadowInset] = useState(false);
  const [shadowX, setShadowX] = useState(0);
  const [shadowY, setShadowY] = useState(12);
  const [shadowBlur, setShadowBlur] = useState(24);
  const [shadowSpread, setShadowSpread] = useState(-5);
  const [shadowColor, setShadowColor] = useState('#000000');
  const [shadowOpacity, setShadowOpacity] = useState(0.25);
  const [shadowCardBg, setShadowCardBg] = useState('#1e1b4b');

  // States for Gradients
  const [gradType, setGradType] = useState<'linear' | 'radial'>('linear');
  const [gradAngle, setGradAngle] = useState(135);
  const [gradStops, setGradStops] = useState([
    { id: 1, color: '#8b5cf6', position: 0 },
    { id: 2, color: '#ec4899', position: 100 }
  ]);

  // States for Border Radius
  const [radiusFancy, setRadiusFancy] = useState(false);
  const [radiusTL, setRadiusTL] = useState(24);
  const [radiusTR, setRadiusTR] = useState(24);
  const [radiusBR, setRadiusBR] = useState(24);
  const [radiusBL, setRadiusBL] = useState(24);
  const [fancyRadiusVal, setFancyRadiusVal] = useState('30% 70% 70% 30% / 30% 30% 70% 70%');

  // Reset tool configurations
  const handleReset = () => {
    if (activeTab === 'glassmorphism') {
      setGlassBlur(16);
      setGlassOpacity(0.3);
      setGlassSaturation(120);
      setGlassBorderOpacity(0.15);
      setGlassBorderWidth(1);
      setGlassBgColor('#ffffff');
      setGlassBorderColor('#ffffff');
    } else if (activeTab === 'boxshadow') {
      setShadowInset(false);
      setShadowX(0);
      setShadowY(12);
      setShadowBlur(24);
      setShadowSpread(-5);
      setShadowColor('#000000');
      setShadowOpacity(0.25);
      setShadowCardBg('#1e1b4b');
    } else if (activeTab === 'gradients') {
      setGradType('linear');
      setGradAngle(135);
      setGradStops([
        { id: 1, color: '#8b5cf6', position: 0 },
        { id: 2, color: '#ec4899', position: 100 }
      ]);
    } else if (activeTab === 'borderradius') {
      setRadiusFancy(false);
      setRadiusTL(24);
      setRadiusTR(24);
      setRadiusBR(24);
      setRadiusBL(24);
      setFancyRadiusVal('30% 70% 70% 30% / 30% 30% 70% 70%');
    }
  };

  // Language change helper
  const handleLanguageChange = (newLang: string) => {
    const segments = window.location.pathname.split('/');
    if (segments.length >= 3) {
      segments[1] = newLang.toLowerCase();
      window.location.pathname = segments.join('/');
    } else {
      window.location.href = `/${newLang.toLowerCase()}/css-designer`;
    }
  };

  // Helper to construct Gradient strings
  const getGradientCssString = () => {
    const sortedStops = [...gradStops].sort((a, b) => a.position - b.position);
    const stopsStr = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ');
    if (gradType === 'linear') {
      return `linear-gradient(${gradAngle}deg, ${stopsStr})`;
    }
    return `radial-gradient(circle, ${stopsStr})`;
  };

  // Helper to generate gradient tailwind utility
  const getGradientTailwindString = () => {
    const sortedStops = [...gradStops].sort((a, b) => a.position - b.position);
    const stopsStr = sortedStops.map(s => `${s.color}_${s.position}%`).join(',');
    if (gradType === 'linear') {
      return `bg-[linear-gradient(${gradAngle}deg,${stopsStr})]`;
    }
    return `bg-[radial-gradient(circle,${stopsStr})]`;
  };

  // Compute preview styles depending on current active tab
  const getPreviewStyles = (): React.CSSProperties => {
    if (activeTab === 'glassmorphism') {
      return {
        background: hexToRgba(glassBgColor, glassOpacity),
        backdropFilter: `blur(${glassBlur}px) saturate(${glassSaturation}%)`,
        WebkitBackdropFilter: `blur(${glassBlur}px) saturate(${glassSaturation}%)`,
        border: `${glassBorderWidth}px solid ${hexToRgba(glassBorderColor, glassBorderOpacity)}`,
        borderRadius: '24px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
      };
    } else if (activeTab === 'boxshadow') {
      const shadowColorRgba = hexToRgba(shadowColor, shadowOpacity);
      const shadowVal = `${shadowInset ? 'inset' : ''} ${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${shadowColorRgba}`;
      return {
        backgroundColor: shadowCardBg,
        boxShadow: shadowVal,
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.05)'
      };
    } else if (activeTab === 'gradients') {
      return {
        background: getGradientCssString(),
        borderRadius: '24px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
      };
    } else {
      // border radius
      const radStyle = radiusFancy ? fancyRadiusVal : `${radiusTL}px ${radiusTR}px ${radiusBR}px ${radiusBL}px`;
      return {
        backgroundColor: '#6366f1',
        borderRadius: radStyle,
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
      };
    }
  };

  // Code output formatting
  const getCodeString = () => {
    if (activeTab === 'glassmorphism') {
      const bgRgba = hexToRgba(glassBgColor, glassOpacity);
      const borderRgba = hexToRgba(glassBorderColor, glassBorderOpacity);
      
      if (codeFormat === 'css') {
        return `.glass-card {
  background: ${bgRgba};
  backdrop-filter: blur(${glassBlur}px) saturate(${glassSaturation}%);
  -webkit-backdrop-filter: blur(${glassBlur}px) saturate(${glassSaturation}%);
  border: ${glassBorderWidth}px solid ${borderRgba};
}`;
      } else if (codeFormat === 'tailwind') {
        return `bg-[${bgRgba}] backdrop-blur-[${glassBlur}px] backdrop-saturate-[${glassSaturation}%] border border-[${borderRgba}]`;
      } else {
        return `:root {
  --glass-bg: ${bgRgba};
  --glass-blur: ${glassBlur}px;
  --glass-saturation: ${glassSaturation}%;
  --glass-border: ${borderRgba};
}`;
      }
    } else if (activeTab === 'boxshadow') {
      const shadowColorRgba = hexToRgba(shadowColor, shadowOpacity);
      const shadowVal = `${shadowInset ? 'inset' : ''} ${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${shadowColorRgba}`;
      
      if (codeFormat === 'css') {
        return `.custom-shadow {
  box-shadow: ${shadowVal};
}`;
      } else if (codeFormat === 'tailwind') {
        const twShadow = shadowVal.replace(/\s+/g, '_');
        return `shadow-[${twShadow}]`;
      } else {
        return `:root {
  --box-shadow: ${shadowVal};
}`;
      }
    } else if (activeTab === 'gradients') {
      const gradCss = getGradientCssString();
      if (codeFormat === 'css') {
        return `.custom-gradient {
  background: ${gradCss};
}`;
      } else if (codeFormat === 'tailwind') {
        return getGradientTailwindString();
      } else {
        return `:root {
  --custom-gradient: ${gradCss};
}`;
      }
    } else {
      // border radius
      const radStyle = radiusFancy ? fancyRadiusVal : `${radiusTL}px ${radiusTR}px ${radiusBR}px ${radiusBL}px`;
      if (codeFormat === 'css') {
        return `.custom-radius {
  border-radius: ${radStyle};
}`;
      } else if (codeFormat === 'tailwind') {
        const twRad = radStyle.replace(/\s+/g, '_');
        return `rounded-[${twRad}]`;
      } else {
        return `:root {
  --border-radius: ${radStyle};
}`;
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getCodeString());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Dynamic slider input updater
  const renderSlider = (
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    onChange: (val: number) => void,
    suffix = ""
  ) => (
    <div className="flex flex-col space-y-2 mb-6">
      <div className="flex justify-between items-center text-sm font-bold text-slate-300">
        <span>{label}</span>
        <span className="text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded-lg border border-violet-500/20 text-xs">
          {value}{suffix}
        </span>
      </div>
      <div className="relative flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500 focus:outline-none"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#07060b] text-slate-200 flex flex-col justify-between overflow-x-hidden font-sans">
      <Header currentLang={lang} onLanguageChange={handleLanguageChange} onReset={handleReset} t={t} />

      <main className="max-w-7xl mx-auto px-4 md:px-12 pt-36 pb-20 w-full flex-1">
        <div className="flex flex-col space-y-12">
          
          {/* Hero Header */}
          <div className="text-center md:text-left max-w-3xl">
            <span className="px-4 py-1.5 bg-violet-500/10 text-violet-400 text-xs font-black uppercase tracking-wider rounded-full border border-violet-500/20">
              {t.title} ⚡ Playground
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-white mt-4 font-outfit tracking-tight leading-tight">
              {t.seoHeroTitle}
            </h1>
            <p className="text-slate-400 text-lg mt-4 font-medium leading-relaxed">
              {t.description}
            </p>
          </div>

          {/* Interactive Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Control Panel (Left Pane) */}
            <div className="lg:col-span-5 bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-2xl shadow-xl space-y-6">
              
              {/* Tab selectors */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-white/5">
                {[
                  { id: 'glassmorphism', label: t.tab_glassmorphism, icon: Sparkles },
                  { id: 'boxshadow', label: t.tab_box_shadow, icon: Layers },
                  { id: 'gradients', label: t.tab_gradients, icon: Palette },
                  { id: 'borderradius', label: t.tab_border_radius, icon: Sliders }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border ${
                        active 
                          ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/30' 
                          : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Reset Configuration Button */}
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-violet-400" />
                  Configurar Estilo
                </span>
                <button 
                  onClick={handleReset}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase rounded-lg transition-colors border border-white/10 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>

              {/* Dynamic Controls based on Active Tab */}
              <div className="min-h-[300px]">
                
                {/* 1. GLASSMORPHISM CONTROLS */}
                {activeTab === 'glassmorphism' && (
                  <div>
                    {renderSlider(t.backdrop_blur, glassBlur, 0, 40, 1, setGlassBlur, "px")}
                    {renderSlider(t.bg_opacity, glassOpacity, 0, 1, 0.01, setGlassOpacity)}
                    {renderSlider(t.saturation, glassSaturation, 50, 200, 5, setGlassSaturation, "%")}
                    {renderSlider(t.border_opacity, glassBorderOpacity, 0, 1, 0.01, setGlassBorderOpacity)}
                    {renderSlider(t.border_width, glassBorderWidth, 0, 8, 1, setGlassBorderWidth, "px")}

                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="flex flex-col space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.bg_color}</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={glassBgColor} 
                            onChange={(e) => setGlassBgColor(e.target.value)}
                            className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer p-0 overflow-hidden"
                          />
                          <span className="font-mono text-sm text-slate-300 uppercase">{glassBgColor}</span>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.border_color}</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={glassBorderColor} 
                            onChange={(e) => setGlassBorderColor(e.target.value)}
                            className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer p-0 overflow-hidden"
                          />
                          <span className="font-mono text-sm text-slate-300 uppercase">{glassBorderColor}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. BOX SHADOW CONTROLS */}
                {activeTab === 'boxshadow' && (
                  <div>
                    <div className="flex items-center justify-between mb-6 bg-slate-900/40 p-4 rounded-xl border border-white/5">
                      <span className="text-sm font-bold text-slate-300">{t.inset_shadow}</span>
                      <button
                        onClick={() => setShadowInset(!shadowInset)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${shadowInset ? 'bg-violet-600' : 'bg-slate-700'}`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${shadowInset ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>

                    {renderSlider(t.offset_x, shadowX, -50, 50, 1, setShadowX, "px")}
                    {renderSlider(t.offset_y, shadowY, -50, 50, 1, setShadowY, "px")}
                    {renderSlider(t.shadow_blur, shadowBlur, 0, 100, 1, setShadowBlur, "px")}
                    {renderSlider(t.spread_radius, shadowSpread, -50, 50, 1, setShadowSpread, "px")}
                    {renderSlider(t.shadow_opacity, shadowOpacity, 0, 1, 0.01, setShadowOpacity)}

                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="flex flex-col space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.shadow_color}</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={shadowColor} 
                            onChange={(e) => setShadowColor(e.target.value)}
                            className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer p-0 overflow-hidden"
                          />
                          <span className="font-mono text-sm text-slate-300 uppercase">{shadowColor}</span>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.bg_color}</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={shadowCardBg} 
                            onChange={(e) => setShadowCardBg(e.target.value)}
                            className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer p-0 overflow-hidden"
                          />
                          <span className="font-mono text-sm text-slate-300 uppercase">{shadowCardBg}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. GRADIENTS CONTROLS */}
                {activeTab === 'gradients' && (
                  <div>
                    {/* Gradient Type */}
                    <div className="flex flex-col space-y-2 mb-6">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.gradient_type}</label>
                      <div className="grid grid-cols-2 gap-2 bg-slate-900/50 p-1 rounded-xl border border-white/5">
                        <button
                          onClick={() => setGradType('linear')}
                          className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${gradType === 'linear' ? 'bg-violet-600/30 text-white border border-violet-500/30' : 'text-slate-400 border border-transparent'}`}
                        >
                          {t.linear}
                        </button>
                        <button
                          onClick={() => setGradType('radial')}
                          className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${gradType === 'radial' ? 'bg-violet-600/30 text-white border border-violet-500/30' : 'text-slate-400 border border-transparent'}`}
                        >
                          {t.radial}
                        </button>
                      </div>
                    </div>

                    {gradType === 'linear' && renderSlider(t.gradient_angle, gradAngle, 0, 360, 1, setGradAngle, "°")}

                    {/* Color Stops Manager */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.color_stops}</label>
                        <button
                          onClick={() => {
                            if (gradStops.length < 5) {
                              const newId = Date.now();
                              setGradStops([...gradStops, { id: newId, color: '#10b981', position: 50 }]);
                            }
                          }}
                          disabled={gradStops.length >= 5}
                          className="flex items-center gap-1 text-xs font-bold text-violet-400 hover:text-violet-300 disabled:opacity-40 disabled:pointer-events-none cursor-pointer bg-transparent border-none"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {t.add_stop}
                        </button>
                      </div>

                      <div className="space-y-3 bg-slate-900/20 p-4 rounded-2xl border border-white/5">
                        {gradStops.map((stop, i) => (
                          <div key={stop.id} className="flex items-center gap-4 bg-slate-950/40 p-3 rounded-xl border border-white/5">
                            <input
                              type="color"
                              value={stop.color}
                              onChange={(e) => {
                                const list = [...gradStops];
                                list[i].color = e.target.value;
                                setGradStops(list);
                              }}
                              className="w-8 h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer p-0"
                            />
                            <div className="flex-1">
                              <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1">
                                <span>{t.position}</span>
                                <span>{stop.position}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={stop.position}
                                onChange={(e) => {
                                  const list = [...gradStops];
                                  list[i].position = parseInt(e.target.value);
                                  setGradStops(list);
                                }}
                                className="w-full accent-violet-500"
                              />
                            </div>
                            {gradStops.length > 2 && (
                              <button
                                onClick={() => {
                                  setGradStops(gradStops.filter(s => s.id !== stop.id));
                                }}
                                className="text-slate-400 hover:text-red-400 cursor-pointer bg-transparent border-none outline-none p-1"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. BORDER RADIUS CONTROLS */}
                {activeTab === 'borderradius' && (
                  <div>
                    {/* Mode Toggle */}
                    <div className="flex flex-col space-y-2 mb-6">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Modo de Borde</label>
                      <div className="grid grid-cols-2 gap-2 bg-slate-900/50 p-1 rounded-xl border border-white/5">
                        <button
                          onClick={() => setRadiusFancy(false)}
                          className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${!radiusFancy ? 'bg-violet-600/30 text-white border border-violet-500/30' : 'text-slate-400 border border-transparent'}`}
                        >
                          {t.corner_radius}
                        </button>
                        <button
                          onClick={() => setRadiusFancy(true)}
                          className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${radiusFancy ? 'bg-violet-600/30 text-white border border-violet-500/30' : 'text-slate-400 border border-transparent'}`}
                        >
                          8-Point Shapes
                        </button>
                      </div>
                    </div>

                    {!radiusFancy ? (
                      <div>
                        {renderSlider(t.top_left, radiusTL, 0, 150, 1, setRadiusTL, "px")}
                        {renderSlider(t.top_right, radiusTR, 0, 150, 1, setRadiusTR, "px")}
                        {renderSlider(t.bottom_right, radiusBR, 0, 150, 1, setRadiusBR, "px")}
                        {renderSlider(t.bottom_left, radiusBL, 0, 150, 1, setRadiusBL, "px")}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.fancy_radius}</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: 'Oval Orgánico', val: '30% 70% 70% 30% / 30% 30% 70% 70%' },
                            { label: 'Hoja Curva', val: '60% 40% 30% 70% / 60% 30% 70% 40%' },
                            { label: 'Gota de Agua', val: '50% 50% 50% 50% / 10% 90% 10% 90%' },
                            { label: 'Piedra Suave', val: '69% 31% 66% 34% / 21% 30% 70% 79%' },
                            { label: 'Huevo / Oval', val: '50% 50% 50% 50% / 30% 30% 70% 70%' },
                            { label: 'Cápsula', val: '100px 100px 100px 100px' }
                          ].map((preset) => (
                            <button
                              key={preset.val}
                              onClick={() => setFancyRadiusVal(preset.val)}
                              className={`p-3 text-[11px] font-bold rounded-xl border transition-all cursor-pointer text-left ${
                                fancyRadiusVal === preset.val 
                                  ? 'bg-violet-600/20 border-violet-500 text-white' 
                                  : 'bg-slate-900/20 border-white/5 text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>

                        <div className="flex flex-col space-y-2 mt-4">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Forma Manual (CSS)</label>
                          <input
                            type="text"
                            value={fancyRadiusVal}
                            onChange={(e) => setFancyRadiusVal(e.target.value)}
                            className="bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm text-violet-300 focus:outline-none focus:border-violet-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Visual Preview Pane & Code Block (Right Pane) */}
            <div className="lg:col-span-7 flex flex-col space-y-6 lg:sticky lg:top-28">
              
              {/* Preview Box Container */}
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-2xl shadow-xl flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <span className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                    <Layout className="w-4 h-4 text-violet-400" />
                    {t.preview_title}
                  </span>
                  
                  {/* Background Presets Toggle */}
                  <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5 self-start sm:self-auto">
                    {[
                      { id: 'darkGrid', label: t.theme_dark_grid },
                      { id: 'lightGrid', label: t.theme_light_grid },
                      { id: 'mesh', label: t.theme_mesh },
                      { id: 'vibrant', label: t.theme_vibrant }
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setBgStyle(theme.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          bgStyle === theme.id 
                            ? 'bg-slate-800 text-white' 
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {theme.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Interactive Preview Container */}
                <div 
                  className={`w-full min-h-[350px] md:min-h-[400px] rounded-2xl flex items-center justify-center relative overflow-hidden transition-all duration-500 border border-white/5 ${
                    bgStyle === 'darkGrid' ? 'bg-[#0f111a] bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]' :
                    bgStyle === 'lightGrid' ? 'bg-[#f8fafc] bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:24px_24px]' :
                    bgStyle === 'vibrant' ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900' :
                    'bg-[#08060d]' // mesh
                  }`}
                >
                  {/* Mesh Gradient blobs behind cards */}
                  {bgStyle === 'mesh' && (
                    <>
                      <div className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full bg-violet-600/30 filter blur-[40px] animate-pulse" />
                      <div className="absolute bottom-1/4 right-1/4 w-52 h-52 rounded-full bg-pink-600/20 filter blur-[45px] animate-pulse" />
                    </>
                  )}

                  {/* Render styled card dynamically */}
                  <motion.div 
                    layout
                    style={getPreviewStyles()}
                    className="w-[80%] max-w-sm p-8 flex flex-col space-y-4 text-center transition-all duration-300 relative z-10 select-none shadow-2xl"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center mx-auto mb-2 text-white shadow-lg">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-black text-white font-outfit tracking-tight">{t.preview_text}</h3>
                    <p className="text-white/70 text-xs font-medium leading-relaxed">
                      {t.preview_subtext}
                    </p>
                    <div className="pt-2">
                      <button className="px-5 py-2.5 bg-white text-slate-900 font-bold text-xs uppercase rounded-xl shadow-lg border-none hover:scale-105 active:scale-95 transition-all cursor-pointer">
                        Interact Button
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Code Generator & Output Panel */}
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-2xl shadow-xl flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-violet-400" />
                    Generador de Código
                  </span>
                  
                  {/* Format selector */}
                  <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
                    {[
                      { id: 'css', label: 'CSS' },
                      { id: 'tailwind', label: 'Tailwind' },
                      { id: 'variables', label: 'Variables' }
                    ].map((format) => (
                      <button
                        key={format.id}
                        onClick={() => setCodeFormat(format.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          codeFormat === format.id 
                            ? 'bg-violet-600 text-white' 
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {format.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Code Block display */}
                <div className="relative">
                  <pre className="bg-[#040306] border border-white/10 rounded-2xl p-5 font-mono text-xs text-violet-300 overflow-x-auto min-h-[140px] flex items-center">
                    <code>{getCodeString()}</code>
                  </pre>
                  
                  {/* Copy Button */}
                  <button
                    onClick={copyToClipboard}
                    className={`absolute top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all border outline-none cursor-pointer ${
                      isCopied 
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20' 
                        : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{t.copied}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer lang={lang} t={t} onOpenModal={(m) => setActiveModal(m)} />

      {/* Modals rendering */}
      <LegalModal 
        isOpen={activeModal !== null} 
        onClose={() => setActiveModal(null)} 
        title={
          activeModal === 'privacy' ? t.privacyPolicy || 'Política de Privacidad' :
          activeModal === 'terms' ? t.termsOfService || 'Términos de Servicio' :
          t.cookiePolicy || 'Política de Cookies'
        }
        content={
          activeModal === 'privacy' ? t.privacyContent :
          activeModal === 'terms' ? t.termsContent :
          t.cookiesContent
        }
        t={t}
      />
    </div>
  );
};

export default CSSDesigner;
