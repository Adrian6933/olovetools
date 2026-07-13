import React, { useState, useMemo } from 'react';
import { Clip } from '../types';
import { Trash2, Search, X, ShieldAlert, Plus } from 'lucide-react';

interface BlocklistManagerProps {
  categoryId: string;
  categoryName: string;
  blockedStreamers: Record<string, { id: string; name: string; image?: string }[]>;
  onBlockStreamer: (id: string, name: string, image?: string) => void;
  onUnblockStreamer: (id: string) => void;
  onClearBlocklist: () => void;
  loadedClips: Clip[];
  t: (key: string) => string;
}

const BlocklistManager: React.FC<BlocklistManagerProps> = ({
  categoryId,
  categoryName,
  blockedStreamers,
  onBlockStreamer,
  onUnblockStreamer,
  onClearBlocklist,
  loadedClips,
  t
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const currentBlocked = useMemo(() => {
    return blockedStreamers[categoryId] || [];
  }, [blockedStreamers, categoryId]);

  const blockedIds = useMemo(() => {
    return new Set(currentBlocked.map(s => s.id));
  }, [currentBlocked]);

  // Extraer streamers únicos de los clips cargados
  const uniqueLoadedStreamers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; image?: string }>();
    loadedClips.forEach(clip => {
      if (clip.broadcaster_id && clip.broadcaster_name) {
        map.set(clip.broadcaster_id, {
          id: clip.broadcaster_id,
          name: clip.broadcaster_name,
          image: clip.broadcaster_image
        });
      }
    });
    return Array.from(map.values());
  }, [loadedClips]);

  // Filtrar streamers cargados basado en la búsqueda (empieza por)
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return uniqueLoadedStreamers.filter(streamer =>
      streamer.name.toLowerCase().startsWith(query)
    );
  }, [searchQuery, uniqueLoadedStreamers]);

  return (
    <div className="bg-[#12121a] border border-white/10 rounded-[2rem] p-6 mb-8 flex flex-col md:flex-row gap-8 animate-in slide-in-from-top-4 fade-in duration-300">
      
      {/* Panel izquierdo: Lista de ocultados actual */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-sm uppercase tracking-widest text-red-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>{t('blocked_in') || 'Streamers ocultos en'} {categoryName}</span>
          </h3>
          {currentBlocked.length > 0 && (
            <button
              onClick={onClearBlocklist}
              className="text-xs text-red-500/60 hover:text-red-500 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('clear_all') || 'Vaciar lista'}</span>
            </button>
          )}
        </div>

        {currentBlocked.length === 0 ? (
          <div className="flex-grow flex items-center justify-center border border-dashed border-white/5 rounded-2xl p-8 text-center text-gray-500 text-xs font-bold uppercase tracking-wider min-h-[120px]">
            {t('no_blocked_streamers') || 'No hay streamers ocultos en esta categoría'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {currentBlocked.map(streamer => (
              <div
                key={streamer.id}
                className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between group hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-twitch-surface border border-white/5 flex-shrink-0">
                    <img
                      src={streamer.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${streamer.name}`}
                      alt={streamer.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-black text-gray-200 truncate">{streamer.name}</span>
                </div>
                <button
                  onClick={() => onUnblockStreamer(streamer.id)}
                  className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  title={t('unblock') || 'Permitir'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Separador vertical */}
      <div className="hidden md:block w-px bg-white/5 self-stretch"></div>

      {/* Panel derecho: Añadir/Buscar streamers cargados */}
      <div className="flex-1 flex flex-col min-w-0">
        <h3 className="font-black text-sm uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
          <Search className="w-4 h-4" />
          <span>{t('search_loaded') || 'Buscar en cargados'}</span>
        </h3>

        <div className="relative mb-3">
          <input
            type="text"
            placeholder={t('search_streamer_placeholder') || 'Escribe para buscar... (ej. ibai)'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-twitch-black text-gray-200 text-sm rounded-xl border border-white/10 px-10 py-3 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 outline-none transition-all"
          />
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3.5 text-gray-500 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {searchQuery.trim() === '' ? (
          <div className="flex-grow flex items-center justify-center border border-dashed border-white/5 rounded-2xl p-8 text-center text-gray-500 text-xs font-bold uppercase tracking-wider min-h-[120px]">
            {t('type_to_search') || 'Busca streamers cargados para ocultarlos'}
          </div>
        ) : searchResults.length === 0 ? (
          <div className="flex-grow flex items-center justify-center border border-dashed border-white/5 rounded-2xl p-8 text-center text-gray-500 text-xs font-bold uppercase tracking-wider min-h-[120px]">
            {t('no_streamers_found') || 'No se encontraron streamers que coincidan'}
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {searchResults.map(streamer => {
              const isBlocked = blockedIds.has(streamer.id);
              return (
                <div
                  key={streamer.id}
                  className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-twitch-surface border border-white/5 flex-shrink-0">
                      <img
                        src={streamer.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${streamer.name}`}
                        alt={streamer.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs font-black text-gray-200 truncate">{streamer.name}</span>
                  </div>
                  {isBlocked ? (
                    <span className="text-[10px] font-black text-red-500 uppercase bg-red-500/10 px-2.5 py-1 rounded-md">
                      {t('blocked') || 'Oculto'}
                    </span>
                  ) : (
                    <button
                      onClick={() => onBlockStreamer(streamer.id, streamer.name, streamer.image)}
                      className="px-3 py-1 bg-red-600/80 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1 transition-all cursor-pointer hover:scale-105 active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t('block') || 'Ocultar'}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlocklistManager;
