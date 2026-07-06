import React, { useState } from 'react';
import { useTranslation, Language } from '../../../locales/dictionary';
import { legalTranslations } from '../../../locales/legal';
import { Mail, Search, ArrowRight, Tag, Layers, Globe, Zap, Shield } from 'lucide-react';

interface FooterProps {
  lang: string;
  onOpenLegal: (type: 'privacy' | 'terms' | 'cookies') => void;
}

const Footer: React.FC<FooterProps> = ({ lang, onOpenLegal }) => {
  const [copied, setCopied] = useState(false);
  
  const { dictionary } = useTranslation(lang as Language, 'twitchbolt');
  const t = dictionary;
  const tl = t.legal || {};

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("adrian.contact.me.69@gmail.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="bg-[#070708] border-t border-white/5 pt-32 pb-16 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[600px] bg-twitch/5 blur-[160px] rounded-full pointer-events-none opacity-40"></div>
      
      <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
              {/* Brand Section */}
              <div className="space-y-10">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-twitch rounded-2xl flex items-center justify-center shadow-2xl">
                          <Zap className="w-7 h-7 text-white fill-current" />
                      </div>
                      <span className="text-3xl font-[900] italic uppercase text-white tracking-tight">TwitchBolt</span>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed font-medium">{t.footerDesc}</p>
              </div>

              {/* Quick Searches */}
              <div className="space-y-10">
                  <h4 className="text-white font-black uppercase text-xs flex items-center gap-3 tracking-widest italic">
                    <Search className="w-4 h-4 text-twitch" /> {t.quickSearches || 'QUICK SEARCHES'}
                  </h4>
                  <ul className="space-y-5 text-sm text-gray-500 font-bold">
                      {(t.quickLinks || ['Twitch to MP4', 'Download Clips', 'Bulk Downloader', 'Clip Saver', '1080p Download', 'Stream Tools']).map(link => (
                        <li key={link} className="hover:text-twitch transition-colors cursor-pointer flex items-center gap-3 group">
                           <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -ml-5 group-hover:ml-0 transition-all" /> {link}
                        </li>
                      ))}
                  </ul>
              </div>
 
              {/* SEO Tags */}
              <div className="space-y-10">
                  <h4 className="text-white font-black uppercase text-xs flex items-center gap-3 tracking-widest italic">
                    <Tag className="w-4 h-4 text-twitch" /> {t.seoKeywords || 'SEO KEYWORDS'}
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                      {(t.seoTags || [
                        'TWITCH DOWNLOADER', 'MP4 HD', 'BULK DOWNLOAD', 'NO LOGIN', 'FREE TOOL', '1080P', 'TWITCH CLIPS', 'EDITOR KIT',
                        'TIKTOK CONVERTER', 'GAMING VIDEO', 'REELS MAKER', 'STREAMING KIT', 'HIGH DEFINITION', 'DIRECT DOWNLOAD'
                      ]).map(tag => (
                          <span key={tag} className="px-4 py-2 bg-[#111114] border border-white/5 rounded-xl text-[10px] font-black text-gray-500 uppercase tracking-tighter hover:border-twitch/40 hover:text-white transition-all cursor-default">
                              {tag}
                          </span>
                      ))}
                  </div>
              </div>

              {/* Download Trends */}
              <div className="space-y-10">
                  <h4 className="text-white font-black uppercase text-xs flex items-center gap-3 tracking-widest italic">
                    <Layers className="w-4 h-4 text-twitch" /> {t.downloadTrends || 'DOWNLOAD TRENDS'}
                  </h4>
                  <div className="p-8 bg-[#111114] border border-white/5 rounded-[2rem] relative overflow-hidden">
                      <p className="text-[11px] text-gray-500 leading-relaxed italic font-medium">
                          {t.footerSeoPara}
                      </p>
                  </div>
              </div>
          </div>

          {/* Legal Bar & Bottom Footer */}
          <div className="pt-12 border-t border-white/5 space-y-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex flex-col items-center md:items-start gap-4">
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.25em]">
                          © {new Date().getFullYear()} TwitchBolt • Twitch Downloader
                      </p>
                      
                      {/* Click to Copy Email */}
                      <div className="relative group/copy">
                        <button 
                          onClick={handleCopyEmail}
                          className="flex items-center gap-2 text-[10px] font-bold text-gray-500 hover:text-twitch transition-all cursor-pointer hover:scale-105 active:scale-95 bg-white/5 px-4 py-2 rounded-lg"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          adrian.contact.me.69@gmail.com
                        </button>
                        {copied && (
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-twitch text-white text-[10px] font-black px-3 py-1.5 rounded-lg animate-bounce shadow-lg whitespace-nowrap">
                            {t.copied}
                          </div>
                        )}
                      </div>
                  </div>

                   <nav className="flex flex-col md:flex-row items-center gap-y-2 md:gap-8 w-full md:w-auto">
                       <a 
                        href={`/${lang}/privacy`}
                        className="w-full md:w-auto py-4 md:py-0 text-[11px] font-[900] text-gray-500 hover:text-twitch uppercase tracking-[0.3em] transition-all cursor-pointer whitespace-nowrap active:bg-white/5 active:scale-95 rounded-2xl text-center"
                      >
                        {legalTranslations[lang]?.nav.privacy || 'Privacy Policy'}
                      </a>
                      <a 
                        href={`/${lang}/terms`}
                        className="w-full md:w-auto py-4 md:py-0 text-[11px] font-[900] text-gray-500 hover:text-twitch uppercase tracking-[0.3em] transition-all cursor-pointer whitespace-nowrap active:bg-white/5 active:scale-95 rounded-2xl text-center"
                      >
                        {legalTranslations[lang]?.nav.terms || 'Terms of Service'}
                      </a>
                      <a 
                        href={`/${lang}/cookies`}
                        className="w-full md:w-auto py-4 md:py-0 text-[11px] font-[900] text-gray-500 hover:text-twitch uppercase tracking-[0.3em] transition-all cursor-pointer whitespace-nowrap active:bg-white/5 active:scale-95 rounded-2xl text-center"
                      >
                        {legalTranslations[lang]?.nav.cookies || 'Cookie Policy'}
                      </a>
                      <a 
                        href={`/${lang}/about`}
                        className="w-full md:w-auto py-4 md:py-0 text-[11px] font-[900] text-gray-500 hover:text-twitch uppercase tracking-[0.3em] transition-all cursor-pointer whitespace-nowrap active:bg-white/5 active:scale-95 rounded-2xl text-center"
                      >
                        {legalTranslations[lang]?.nav.about || 'About'}
                      </a>
                  </nav>
              </div>

              <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                  <div className="flex flex-wrap justify-center gap-10 text-[11px] font-[900] uppercase text-gray-700 tracking-[0.2em]">
                      <span className="flex items-center gap-2 hover:text-white transition-all cursor-pointer hover:scale-110 active:scale-95"><Globe className="w-4 h-4" /> {t.globalAccess || 'GLOBAL ACCESS'}</span>
                      <span className="flex items-center gap-2 hover:text-white transition-all cursor-pointer hover:scale-110 active:scale-95"><Zap className="w-4 h-4" /> {t.instantMp4 || 'INSTANT MP4'}</span>
                      <span className="flex items-center gap-2 hover:text-white transition-all cursor-pointer hover:scale-110 active:scale-95"><Shield className="w-4 h-4" /> {t.dmcaSafe || 'DMCA SAFE'}</span>
                  </div>
                  <p className="text-gray-600 text-xs font-bold tracking-tight">
                      Built by <a href={`/${lang}`} className="text-twitch hover:underline">oLoveTools</a>
                  </p>
              </div>
          </div>
      </div>
    </footer>
  );
};

export default Footer;