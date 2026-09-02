import React, { useState, useMemo } from 'react';
import { Clip } from './types';
import { Trash2, Search, X, ShieldAlert, Plus, Download, Upload } from 'lucide-react';

interface BlocklistManagerProps {
  categoryId: string;
  categoryName: string;
  blockedStreamers: Record<string, { id: string; name: string; image?: string }[]>;
  onBlockStreamer: (id: string, name: string, image?: string) => void;
  onUnblockStreamer: (id: string) => void;
  onClearBlocklist: () => void;
  onImportBlocklist: (newBlocklist: Record<string, { id: string; name: string; image?: string }[]>) => void;
  showToast?: (message: string, type?: 'success' | 'info') => void;
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
  onImportBlocklist,
  showToast,
  loadedClips,
  t
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(blockedStreamers, null, 2);
      const blob = new Blob([dataStr], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', url);
      linkElement.setAttribute('download', 'clipy_blocked_streamers.txt');
      linkElement.click();
      
      URL.revokeObjectURL(url);
      
      if (showToast) {
        showToast(t('export_success') || 'Lista exportada con éxito');
      }
    } catch (e) {
      console.error(e);
      if (showToast) {
        showToast(t('export_error') || 'Error al exportar la lista', 'info');
      }
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      fileReader.readAsText(file, "UTF-8");
      fileReader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          if (!content) return;

          let parsedData: Record<string, { id: string; name: string; image?: string }[]> = {};
          
          if (content.trim().startsWith('{')) {
            parsedData = JSON.parse(content);
            
            // Validar la estructura del JSON importado
            let isValid = true;
            for (const key in parsedData) {
              if (!Array.isArray(parsedData[key])) {
                isValid = false;
                break;
              }
              for (const item of parsedData[key]) {
                if (!item.id || !item.name) {
                  isValid = false;
                  break;
                }
              }
            }

            if (!isValid) {
              if (showToast) showToast(t('import_invalid_format') || 'Formato de archivo no válido', 'info');
              return;
            }
          } else {
            // Si es TXT plano (uno por línea), asumimos formato "id,name" o solo "name" o "id"
            // Lo importamos en la categoría actual
            const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
            const importedStreamers: { id: string; name: string; image?: string }[] = [];
            
            for (const line of lines) {
              const parts = line.split(/[,;]/);
              if (parts.length >= 2) {
                importedStreamers.push({
                  id: parts[0].trim(),
                  name: parts[1].trim(),
                  image: parts[2]?.trim() || undefined
                });
              } else if (line) {
                importedStreamers.push({
                  id: line,
                  name: line
                });
              }
            }

            if (importedStreamers.length === 0) {
              if (showToast) showToast(t('import_empty') || 'No se encontraron streamers para importar', 'info');
              return;
            }

            // Mezclar con la lista existente de la categoría actual
            const currentList = blockedStreamers[categoryId] || [];
            const mergedList = [...currentList];
            
            for (const streamer of importedStreamers) {
              if (!mergedList.some(s => s.id === streamer.id)) {
                mergedList.push(streamer);
              }
            }

            parsedData = {
              ...blockedStreamers,
              [categoryId]: mergedList
            };
          }

          onImportBlocklist(parsedData);
          if (showToast) showToast(t('import_success') || 'Lista importada con éxito');
        } catch (error) {
          console.error(error);
          if (showToast) showToast(t('import_error') || 'Error al importar el archivo', 'info');
        }
      };
      e.target.value = '';
    }
  };

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
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="font-black text-sm uppercase tracking-widest text-red-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>{t('blocked_in') || 'Streamers ocultos en'} {categoryName}</span>
          </h3>
          <div className="flex items-center gap-3.5 flex-wrap">
            <button
              onClick={handleExport}
              className="text-[11px] text-gray-400 hover:text-white font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
              title={t('export_blocked') || 'Exportar ocultos'}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('export_blocked') || 'Exportar'}</span>
            </button>
            
            <label
              className="text-[11px] text-gray-400 hover:text-white font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
              title={t('import_blocked') || 'Importar ocultos'}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{t('import_blocked') || 'Importar'}</span>
              <input
                type="file"
                accept=".json,.txt"
                onChange={handleImport}
                className="hidden"
              />
            </label>

            {currentBlocked.length > 0 && (
              <button
                onClick={onClearBlocklist}
                className="text-[11px] text-red-500/60 hover:text-red-500 font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('clear_all') || 'Vaciar lista'}</span>
              </button>
            )}
          </div>
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
