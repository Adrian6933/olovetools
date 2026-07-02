import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderArchive, 
  Upload, 
  Trash2, 
  Plus, 
  Search, 
  File, 
  Folder, 
  ChevronRight, 
  ChevronDown, 
  Download, 
  DownloadCloud, 
  Info, 
  Sparkles, 
  X,
  FileCheck
} from 'lucide-react';
import { useTranslation, Language } from '../../locales/dictionary';
import { AdBanner } from '../../components/shared/AdBanner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { legalTranslations } from '../../locales/legal';
import JSZip from 'jszip';

interface ZipFlowProps {
  lang: string;
  dictionary: any;
}

interface CompressFileItem {
  id: string;
  file: File;
  relativePath: string;
}

interface FileTreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: Record<string, FileTreeNode>;
  zipObject?: JSZip.JSZipObject;
}

export const ZipFlow: React.FC<ZipFlowProps> = ({ lang, dictionary }) => {
  const { t } = useTranslation(lang as Language, 'zip-flow');

  // Tabs
  const [activeTab, setActiveTab] = useState<'compress' | 'extract'>('compress');

  // Modals
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'privacy' | 'terms' | 'cookies'>('privacy');

  // --- COMPRESS STATE ---
  const [compressFiles, setCompressFiles] = useState<CompressFileItem[]>([]);
  const [zipFileName, setZipFileName] = useState<string>('');
  const [compressionLevel, setCompressionLevel] = useState<'STORE' | 'DEFLATE'>('DEFLATE');
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [dragOverCompress, setDragOverCompress] = useState<boolean>(false);
  
  // Stats
  const [originalTotalSize, setOriginalTotalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  
  const compressFileInputRef = useRef<HTMLInputElement>(null);

  // --- EXTRACT STATE ---
  const [extractZipFile, setExtractZipFile] = useState<File | null>(null);
  const [zipObjects, setZipObjects] = useState<Record<string, JSZip.JSZipObject>>({});
  const [fileTree, setFileTree] = useState<FileTreeNode | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [dragOverExtract, setDragOverExtract] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [totalFilesCount, setTotalFilesCount] = useState<number>(0);
  const [totalFoldersCount, setTotalFoldersCount] = useState<number>(0);
  
  const extractFileInputRef = useRef<HTMLInputElement>(null);

  // --- STATS UTILS ---
  useEffect(() => {
    const total = compressFiles.reduce((acc, curr) => acc + curr.file.size, 0);
    setOriginalTotalSize(total);
    // Reset compressed size if files change
    setCompressedSize(null);
  }, [compressFiles]);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // --- COMPRESS HANDLERS ---
  const handleCompressFileAdd = (files: FileList | null) => {
    if (!files) return;
    const newItems: CompressFileItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Check if already exists to prevent duplicate entries
      newItems.push({
        id: `${file.name}-${file.size}-${Date.now()}-${i}`,
        file,
        relativePath: file.name
      });
    }
    setCompressFiles(prev => [...prev, ...newItems]);
  };

  const handleRemoveCompressFile = (id: string) => {
    setCompressFiles(prev => prev.filter(item => item.id !== id));
  };

  const handleClearCompress = () => {
    setCompressFiles([]);
    setZipFileName('');
    setCompressedSize(null);
  };

  const triggerCompressFileSelect = () => {
    compressFileInputRef.current?.click();
  };

  const handleCompressDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCompress(true);
  };

  const handleCompressDragLeave = () => {
    setDragOverCompress(false);
  };

  const handleCompressDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCompress(false);
    if (e.dataTransfer.files) {
      handleCompressFileAdd(e.dataTransfer.files);
    }
  };

  const handleCreateZip = async () => {
    if (compressFiles.length === 0) return;
    setIsCompressing(true);
    setCompressedSize(null);

    const zip = new JSZip();
    compressFiles.forEach(item => {
      zip.file(item.relativePath, item.file);
    });

    try {
      const blob = await zip.generateAsync({
        type: 'blob',
        compression: compressionLevel,
        compressionOptions: {
          level: 6 // Deflate standard compression balance level
        }
      });

      setCompressedSize(blob.size);

      // Trigger Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = zipFileName.trim() 
        ? (zipFileName.toLowerCase().endsWith('.zip') ? zipFileName.trim() : `${zipFileName.trim()}.zip`) 
        : (t.compress_output_filename_placeholder || 'archive.zip');
      
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate ZIP archive:', err);
      alert('Error compressing files.');
    } finally {
      setIsCompressing(false);
    }
  };

  // --- EXTRACT HANDLERS ---
  const handleExtractFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.name.toLowerCase().endsWith('.zip') && file.type !== 'application/zip') {
      alert('Please select a valid .zip file.');
      return;
    }
    setExtractZipFile(file);
    loadZipContent(file);
  };

  const triggerExtractFileSelect = () => {
    extractFileInputRef.current?.click();
  };

  const handleExtractDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverExtract(true);
  };

  const handleExtractDragLeave = () => {
    setDragOverExtract(false);
  };

  const handleExtractDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverExtract(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleExtractFileSelect(e.dataTransfer.files);
    }
  };

  const loadZipContent = async (file: File) => {
    setIsExtracting(true);
    setSearchQuery('');
    setExpandedNodes({});

    try {
      const zip = await JSZip.loadAsync(file);
      setZipObjects(zip.files);

      // Calculate totals
      let filesCount = 0;
      let foldersCount = 0;
      Object.keys(zip.files).forEach(path => {
        if (zip.files[path].dir) {
          foldersCount++;
        } else {
          filesCount++;
        }
      });
      setTotalFilesCount(filesCount);
      setTotalFoldersCount(foldersCount);

      // Build Tree
      const tree = buildTreeStructure(zip.files);
      setFileTree(tree);
      
      // Auto expand root children
      const autoExpanded: Record<string, boolean> = {};
      Object.keys(tree.children).forEach(k => {
        if (tree.children[k].isDir) {
          autoExpanded[tree.children[k].path] = true;
        }
      });
      setExpandedNodes(autoExpanded);
    } catch (err) {
      console.error('Failed to parse ZIP archive:', err);
      alert('Could not open ZIP file. It might be corrupted or password-protected.');
      setExtractZipFile(null);
      setZipObjects({});
      setFileTree(null);
    } finally {
      setIsExtracting(false);
    }
  };

  const buildTreeStructure = (zipFiles: Record<string, JSZip.JSZipObject>): FileTreeNode => {
    const root: FileTreeNode = { name: 'root', path: '', isDir: true, children: {} };
    
    Object.keys(zipFiles).forEach(path => {
      const parts = path.split('/').filter(Boolean);
      let current = root;
      let curPath = '';

      parts.forEach((part, index) => {
        curPath = curPath ? `${curPath}/${part}` : part;
        const isLast = index === parts.length - 1;
        const isDir = zipFiles[path].dir || (!isLast);

        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            path: curPath,
            isDir,
            children: {}
          };
        }
        
        if (isLast) {
          current.children[part].zipObject = zipFiles[path];
        }
        
        current = current.children[part];
      });
    });

    return root;
  };

  const handleDownloadSingleFile = async (zipObject: JSZip.JSZipObject, path: string) => {
    try {
      const blob = await zipObject.async('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Get the last item in the path as filename
      const filename = path.split('/').filter(Boolean).pop() || 'file';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to extract file:', err);
      alert('Error extracting file.');
    }
  };

  const handleDownloadAllFiles = async () => {
    const filesToExtract = Object.keys(zipObjects).filter(path => !zipObjects[path].dir);
    if (filesToExtract.length === 0) return;
    
    const confirmExtract = window.confirm(
      lang === 'es' 
        ? `Esto descargará ${filesToExtract.length} archivos individualmente. ¿Deseas continuar?`
        : `This will download ${filesToExtract.length} files individually. Do you want to continue?`
    );
    if (!confirmExtract) return;

    for (const path of filesToExtract) {
      const obj = zipObjects[path];
      await handleDownloadSingleFile(obj, path);
      // Small sleep to prevent browser from blocking concurrent file downloads
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };

  const toggleNodeExpanded = (path: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const handleCloseExtract = () => {
    setExtractZipFile(null);
    setZipObjects({});
    setFileTree(null);
    setSearchQuery('');
  };

  // --- RENDER TREE HELPER ---
  const renderTreeNode = (node: FileTreeNode) => {
    const hasChildren = Object.keys(node.children).length > 0;
    const isExpanded = !!expandedNodes[node.path];

    if (node.path === '') {
      // Root Node container (render all top-level children)
      return (
        <div className="pl-1 space-y-1">
          {Object.keys(node.children).map(key => (
            <div key={node.children[key].path}>
              {renderTreeNode(node.children[key])}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        <div className="flex items-center group py-1.5 px-3 rounded-xl hover:bg-white/[0.04] transition-colors gap-2 text-sm text-slate-300">
          {node.isDir ? (
            <button 
              onClick={() => toggleNodeExpanded(node.path)}
              className="flex items-center text-slate-500 hover:text-white border-none bg-transparent outline-none p-0 cursor-pointer shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-amber-500" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-4" /> // Spacing matching chevron width
          )}

          {node.isDir ? (
            <Folder className="w-4 h-4 text-amber-500 shrink-0" />
          ) : (
            <File className="w-4 h-4 text-slate-400 shrink-0" />
          )}

          <span className="font-medium truncate flex-1">{node.name}</span>

          {!node.isDir && node.zipObject && (
            <button
              onClick={() => handleDownloadSingleFile(node.zipObject!, node.path)}
              className="px-2.5 py-1 text-xs font-black uppercase text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg hover:bg-amber-500/25 hover:text-white transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>{t.extract_single_download || 'Download'}</span>
            </button>
          )}
        </div>

        {node.isDir && isExpanded && hasChildren && (
          <div className="pl-6 border-l border-white/5 ml-5 mt-1 space-y-1">
            {Object.keys(node.children).map(key => (
              <div key={node.children[key].path}>
                {renderTreeNode(node.children[key])}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // --- RENDER SEARCH RESULTS ---
  const renderSearchResults = () => {
    const query = searchQuery.toLowerCase().trim();
    const matchingFiles = Object.keys(zipObjects).filter(path => {
      const isFile = !zipObjects[path].dir;
      const matchesSearch = path.toLowerCase().includes(query);
      return isFile && matchesSearch;
    });

    if (matchingFiles.length === 0) {
      return (
        <div className="py-12 text-center text-slate-500 text-sm">
          {t.extract_empty || 'No files found in the archive'}
        </div>
      );
    }

    return (
      <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
        {matchingFiles.map(path => {
          const zipObject = zipObjects[path];
          const parts = path.split('/');
          const filename = parts[parts.length - 1];
          const folderPath = parts.slice(0, -1).join('/');

          return (
            <div key={path} className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-colors gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-slate-400 shrink-0">
                  <File className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-sm font-bold text-white truncate">{filename}</span>
                  {folderPath && (
                    <span className="text-[10px] text-slate-500 font-mono truncate">{folderPath}/</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDownloadSingleFile(zipObject, path)}
                className="px-3.5 py-1.5 text-xs font-black uppercase text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/25 hover:text-white transition-all cursor-pointer flex items-center gap-1 shrink-0 outline-none"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.extract_single_download || 'Download'}</span>
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  // --- REBUILD CENTRAL HUB HANDLER ---
  const handleOpenLegal = (type: 'privacy' | 'terms' | 'cookies') => {
    setModalType(type);
    setModalOpen(true);
  };

  const handleReset = () => {
    if (activeTab === 'compress') {
      handleClearCompress();
    } else {
      handleCloseExtract();
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0802] text-amber-100/90 font-sans flex flex-col">
      <Header
        currentLang={lang}
        onLanguageChange={(newLang) => {
          window.location.href = `/${newLang.toLowerCase()}/zip-flow`;
        }}
        onReset={handleReset}
        t={t}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-12 pt-36 pb-24 relative z-10 flex flex-col justify-center select-none">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-zip-flow-top" />
        {/* Title SEO Hero Banner */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-4xl md:text-6xl font-black font-outfit tracking-tight text-white mb-4">
            {t.seoHeroTitle || '100% Local Browser-Based ZIP Compressor & Extractor'}
          </h1>
          <p className="text-slate-400 text-lg max-w-3xl mx-auto leading-relaxed font-medium">
            {t.seoHeroText || 'Compress files into local ZIP files, or unpack folder trees directly in RAM. Zero network bandwidth wasted.'}
          </p>
        </div>

        {/* Tab Selection Switch */}
        <div className="flex justify-center mb-8 max-w-md mx-auto">
          <div className="w-full grid grid-cols-2 gap-2 p-1.5 bg-black/40 border border-white/10 rounded-2xl">
            <button
              onClick={() => setActiveTab('compress')}
              className={`py-3 px-4 text-sm font-black uppercase rounded-xl transition-all cursor-pointer border-none outline-none flex items-center justify-center gap-2 ${
                activeTab === 'compress'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FolderArchive className="w-4 h-4" />
              <span>{t.tab_compress || 'Compress Files'}</span>
            </button>
            <button
              onClick={() => setActiveTab('extract')}
              className={`py-3 px-4 text-sm font-black uppercase rounded-xl transition-all cursor-pointer border-none outline-none flex items-center justify-center gap-2 ${
                activeTab === 'extract'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <DownloadCloud className="w-4 h-4" />
              <span>{t.tab_extract || 'Extract Archive'}</span>
            </button>
          </div>
        </div>

        {/* WORKSPACE */}
        <div className="w-full bg-[#120a02]/40 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 md:p-8 shadow-2xl relative glow-amber">
          {activeTab === 'compress' ? (
            // ===================================
            // --- COMPRESSOR WORKSPACE PANEL ---
            // ===================================
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Left Column: Dropzone & File List */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleCompressDragOver}
                  onDragLeave={handleCompressDragLeave}
                  onDrop={handleCompressDrop}
                  onClick={triggerCompressFileSelect}
                  className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4 cursor-pointer transition-all hover:bg-white/[0.02] group relative min-h-[180px] ${
                    dragOverCompress 
                      ? 'border-amber-500 bg-amber-500/5 text-amber-300' 
                      : 'border-white/10 text-slate-400'
                  }`}
                >
                  <input
                    type="file"
                    ref={compressFileInputRef}
                    onChange={(e) => handleCompressFileAdd(e.target.files)}
                    multiple
                    className="hidden"
                  />
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-amber-500/20 group-hover:border-amber-500/40 group-hover:scale-110 transition-all">
                    <Upload className="w-6 h-6 text-amber-500 animate-pulse" />
                  </div>
                  <div className="flex flex-col gap-1.5 max-w-sm">
                    <span className="text-base font-bold text-white">
                      {dragOverCompress 
                        ? (t.compress_drop_active || 'Drop the files to add...')
                        : (t.compress_drop_inactive || 'Drag & drop files here, or click to browse files')}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Select multiple files (images, text files, folders) to package.
                    </span>
                  </div>
                </div>

                {/* File List Grid */}
                {compressFiles.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-white/5">
                      <span>Files selected ({compressFiles.length})</span>
                      <button 
                        onClick={handleClearCompress}
                        className="text-red-400 hover:text-red-300 border-none bg-transparent outline-none flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t.compress_clear_all || 'Clear All'}</span>
                      </button>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                      {compressFiles.map((item) => (
                        <div 
                          key={item.id}
                          className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-colors gap-4"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-slate-400 shrink-0">
                              <File className="w-4 h-4 text-amber-500/60" />
                            </div>
                            <div className="flex flex-col min-w-0 text-left">
                              <span className="text-sm font-bold text-white truncate">{item.file.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono font-bold">{formatBytes(item.file.size)}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveCompressFile(item.id)}
                            className="p-2 text-slate-500 hover:text-red-400 border-none bg-transparent outline-none transition-colors cursor-pointer rounded-lg hover:bg-white/5"
                            title="Remove file"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Settings & Stats */}
              <div className="lg:col-span-4 flex flex-col gap-6 bg-black/20 p-6 rounded-3xl border border-white/5 justify-between">
                <div className="flex flex-col gap-6">
                  <h3 className="text-sm font-black uppercase tracking-wider text-amber-500 border-b border-white/5 pb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Archive Settings
                  </h3>

                  {/* ZIP Filename Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t.compress_output_filename || 'ZIP File Name'}
                    </label>
                    <input
                      type="text"
                      placeholder={t.compress_output_filename_placeholder || 'archive.zip'}
                      value={zipFileName}
                      onChange={(e) => setZipFileName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none transition-colors"
                    />
                  </div>

                  {/* Compression Level Selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t.compress_level || 'Compression Level'}
                    </label>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setCompressionLevel('DEFLATE')}
                        className={`w-full py-2.5 px-4 text-xs font-black uppercase border rounded-xl transition-all cursor-pointer outline-none text-left ${
                          compressionLevel === 'DEFLATE'
                            ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                            : 'border-white/10 hover:border-white/20 text-slate-300'
                        }`}
                      >
                        {t.compress_level_deflate || 'Deflate (Standard Compression)'}
                      </button>
                      <button
                        onClick={() => setCompressionLevel('STORE')}
                        className={`w-full py-2.5 px-4 text-xs font-black uppercase border rounded-xl transition-all cursor-pointer outline-none text-left ${
                          compressionLevel === 'STORE'
                            ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                            : 'border-white/10 hover:border-white/20 text-slate-300'
                        }`}
                      >
                        {t.compress_level_store || 'Store (No Compression - Fast)'}
                      </button>
                    </div>
                  </div>

                  {/* Compression Stats Panel */}
                  {compressFiles.length > 0 && (
                    <div className="flex flex-col gap-3 border-t border-white/5 pt-4">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {t.compress_stats_title || 'Compression Stats'}
                      </label>
                      <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">{t.compress_stats_original || 'Original Size'}</span>
                          <span className="text-white font-mono font-bold">{formatBytes(originalTotalSize)}</span>
                        </div>
                        {compressedSize !== null && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-medium">{t.compress_stats_compressed || 'Compressed Size'}</span>
                              <span className="text-amber-400 font-mono font-bold">{formatBytes(compressedSize)}</span>
                            </div>
                            <div className="flex justify-between border-t border-white/5 pt-2.5 mt-2.5">
                              <span className="text-slate-400 font-medium">{t.compress_stats_savings || 'Space Saved'}</span>
                              <span className="text-emerald-400 font-mono font-bold">
                                {originalTotalSize > 0 
                                  ? `${Math.max(0, (originalTotalSize - compressedSize) / originalTotalSize * 100).toFixed(1)}%`
                                  : '0%'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* COMPRESS CTA */}
                <div className="border-t border-white/5 pt-4">
                  <button
                    onClick={handleCreateZip}
                    disabled={compressFiles.length === 0 || isCompressing}
                    className={`w-full py-4 rounded-2xl font-black text-sm uppercase transition-all flex items-center justify-center gap-3 active:scale-95 duration-200 outline-none shadow-lg ${
                      compressFiles.length === 0 || isCompressing
                        ? 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/10 cursor-pointer'
                    }`}
                  >
                    <FolderArchive className="w-4 h-4" />
                    <span>
                      {isCompressing 
                        ? 'Creating ZIP...' 
                        : (t.compress_btn || 'Create ZIP Archive')}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // =================================
            // --- EXTRACTOR WORKSPACE PANEL ---
            // =================================
            <div className="flex flex-col gap-6">
              {!extractZipFile ? (
                /* Unselected State: Upload ZIP file */
                <div
                  onDragOver={handleExtractDragOver}
                  onDragLeave={handleExtractDragLeave}
                  onDrop={handleExtractDrop}
                  onClick={triggerExtractFileSelect}
                  className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-4 cursor-pointer transition-all hover:bg-white/[0.02] group relative min-h-[260px] ${
                    dragOverExtract 
                      ? 'border-amber-500 bg-amber-500/5 text-amber-300' 
                      : 'border-white/10 text-slate-400'
                  }`}
                >
                  <input
                    type="file"
                    ref={extractFileInputRef}
                    onChange={(e) => handleExtractFileSelect(e.target.files)}
                    accept=".zip,application/zip"
                    className="hidden"
                  />
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-amber-500/20 group-hover:border-amber-500/40 group-hover:scale-110 transition-all">
                    <DownloadCloud className="w-8 h-8 text-amber-500 animate-pulse" />
                  </div>
                  <div className="flex flex-col gap-1.5 max-w-sm">
                    <span className="text-base font-bold text-white">
                      {dragOverExtract 
                        ? (t.extract_drop_active || 'Drop the ZIP file to extract...')
                        : (t.extract_drop_inactive || 'Drag & drop a ZIP file here, or click to select')}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Select a standard ZIP archive to unpack. Size limit depends on local tab RAM.
                    </span>
                  </div>
                </div>
              ) : (
                /* Selected State: Browser Explorer panel */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  
                  {/* Left Column: Search & Folder Tree Explorer */}
                  <div className="lg:col-span-8 flex flex-col gap-4">
                    {/* Toolbar Search */}
                    <div className="relative group w-full">
                      <input
                        type="text"
                        placeholder={t.extract_search_placeholder || 'Search files by name or path...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-focus-within:text-amber-500 transition-colors">
                        <Search className="w-4 h-4" />
                      </div>
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white border-none bg-transparent outline-none cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Tree View Box */}
                    <div className="flex-1 bg-black/20 border border-white/5 rounded-3xl p-6 min-h-[350px] max-h-[450px] overflow-y-auto">
                      {isExtracting ? (
                        <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-500 text-sm">
                          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                          <span>{t.extract_loading || 'Parsing ZIP file structure...'}</span>
                        </div>
                      ) : searchQuery.trim() ? (
                        /* Flat Search list results */
                        renderSearchResults()
                      ) : fileTree ? (
                        /* Directory Tree rendering */
                        <div className="text-left">
                          {renderTreeNode(fileTree)}
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                          {t.extract_empty || 'No files found in the archive'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: ZIP Info & Actions */}
                  <div className="lg:col-span-4 flex flex-col gap-6 bg-black/20 p-6 rounded-3xl border border-white/5 justify-between">
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <h3 className="text-sm font-black uppercase tracking-wider text-amber-500 flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          {t.extract_info_title || 'ZIP Information'}
                        </h3>
                        <button 
                          onClick={handleCloseExtract}
                          className="p-1 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer border-none outline-none"
                          title="Close archive"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Info Details List */}
                      <div className="space-y-4 text-sm text-left">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Archive Name</span>
                          <span className="text-white font-bold truncate">{extractZipFile.name}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Archive Size</span>
                          <span className="text-white font-bold font-mono">{formatBytes(extractZipFile.size)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t.extract_info_files || 'Total Files'}</span>
                            <span className="text-amber-500 font-black text-lg font-mono">{totalFilesCount}</span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t.extract_info_folders || 'Total Folders'}</span>
                            <span className="text-amber-500 font-black text-lg font-mono">{totalFoldersCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CTA Extract All */}
                    <div className="border-t border-white/5 pt-4">
                      <button
                        onClick={handleDownloadAllFiles}
                        disabled={totalFilesCount === 0 || isExtracting}
                        className={`w-full py-4 rounded-2xl font-black text-sm uppercase transition-all flex items-center justify-center gap-3 active:scale-95 duration-200 outline-none shadow-lg ${
                          totalFilesCount === 0 || isExtracting
                            ? 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
                            : 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/10 cursor-pointer'
                        }`}
                      >
                        <FileCheck className="w-4 h-4" />
                        <span>{t.extract_btn_all || 'Extract & Download All'}</span>
                      </button>
                    </div>

                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-zip-flow-bottom" />
      </main>

      <Footer
        lang={lang}
        t={t}
        onOpenModal={handleOpenLegal}
      />

      <LegalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          modalType === 'privacy' 
            ? (legalTranslations[lang]?.privacy.title || 'Privacy Policy')
            : modalType === 'terms'
            ? (legalTranslations[lang]?.terms.title || 'Terms of Service')
            : (legalTranslations[lang]?.cookies.title || 'Cookie Policy')
        }
        content={
          modalType === 'privacy' 
            ? (legalTranslations[lang]?.privacy.content || '')
            : modalType === 'terms'
            ? (legalTranslations[lang]?.terms.content || '')
            : (legalTranslations[lang]?.cookies.content || '')
        }
        t={t}
      />
    </div>
  );
};
export default ZipFlow;
