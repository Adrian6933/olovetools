import React, { useState, useEffect, useRef } from 'react';
import { Images, Film, Upload, Video, Trash2, ArrowLeft, ArrowRight, Play, Pause, Download, History, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { useTranslation, Language } from '../../locales/dictionary';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { legalTranslations } from '../../locales/legal';

interface GIFBoltProps {
  lang: string;
  dictionary: any;
}

interface ImageFrame {
  id: string;
  file: File;
  url: string;
}

interface GeneratedGIFMeta {
  id: string;
  url: string;
  name: string;
  size: string;
  date: string;
  type: 'video' | 'images';
}

export const GIFBolt: React.FC<GIFBoltProps> = ({ lang, dictionary }) => {
  const { t } = useTranslation(lang as Language, 'gif-bolt');

  const [activeTab, setActiveTab] = useState<'video' | 'images'>('video');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'privacy' | 'terms' | 'cookies'>('privacy');

  // Video Tab States
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(5);
  const [videoWidth, setVideoWidth] = useState<number>(320);
  const [videoHeight, setVideoHeight] = useState<number>(240);
  const [fps, setFps] = useState<number>(10);
  const [qualityPreset, setQualityPreset] = useState<'high' | 'medium' | 'low'>('medium');

  // Images Tab States
  const [imageFiles, setImageFiles] = useState<ImageFrame[]>([]);
  const [frameDelay, setFrameDelay] = useState<number>(200); // ms
  const [imageWidth, setImageWidth] = useState<number>(320);
  const [imageHeight, setImageHeight] = useState<number>(240);

  // Common Compilation States
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [progressText, setProgressText] = useState<string>('');
  const [gifResult, setGifResult] = useState<string | null>(null);
  const [resultMeta, setResultMeta] = useState<{ size: string; reduction?: string } | null>(null);
  const [history, setHistory] = useState<GeneratedGIFMeta[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  // Cleanup Object URLs when tab changes or files change
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      imageFiles.forEach(img => URL.revokeObjectURL(img.url));
    };
  }, []);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }

    setVideoFile(file);
    setGifResult(null);
    setResultMeta(null);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);

    // Temp video to get metadata
    const tempVideo = document.createElement('video');
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      setVideoDuration(tempVideo.duration);
      setStartTime(0);
      setEndTime(Math.min(5, tempVideo.duration));
      setVideoWidth(tempVideo.videoWidth);
      setVideoHeight(tempVideo.videoHeight);
    };
  };

  const handleImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFrames: ImageFrame[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      newFrames.push({
        id: Math.random().toString(36).substring(7),
        file,
        url: URL.createObjectURL(file)
      });
    }

    setImageFiles(prev => [...prev, ...newFrames]);
    setGifResult(null);
    setResultMeta(null);
  };

  const moveFrame = (index: number, direction: 'left' | 'right') => {
    const newFiles = [...imageFiles];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFiles.length) return;

    const temp = newFiles[index];
    newFiles[index] = newFiles[targetIndex];
    newFiles[targetIndex] = temp;
    setImageFiles(newFiles);
  };

  const removeFrame = (index: number) => {
    const fileToRemove = imageFiles[index];
    URL.revokeObjectURL(fileToRemove.url);
    setImageFiles(imageFiles.filter((_, i) => i !== index));
    setGifResult(null);
  };

  // Canvas Frame Extractor for Video
  const extractFramesFromVideo = async (
    fileUrl: string,
    start: number,
    end: number,
    fpsVal: number,
    targetWidth: number,
    targetHeight: number
  ): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = fileUrl;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        const totalDuration = end - start;
        const frameInterval = 1 / fpsVal;
        const totalFrames = Math.max(1, Math.floor(totalDuration * fpsVal));
        const extracted: string[] = [];

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not create Canvas context'));
          return;
        }

        let currentFrame = 0;

        const capture = () => {
          if (currentFrame >= totalFrames) {
            resolve(extracted);
            return;
          }

          const targetTime = start + currentFrame * frameInterval;
          video.currentTime = targetTime;

          const onSeeked = () => {
            video.removeEventListener('seeked', onSeeked);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            extracted.push(canvas.toDataURL('image/jpeg', 0.85));

            currentFrame++;
            setProgress(Math.round((currentFrame / totalFrames) * 100));
            capture();
          };

          video.addEventListener('seeked', onSeeked);
        };

        capture();
      };

      video.onerror = () => reject(new Error('Error loading video file'));
    });
  };

  const generateGIF = async () => {
    setIsProcessing(true);
    setProgress(0);
    setGifResult(null);
    setResultMeta(null);

    try {
      // Dynamic import to prevent Node SSR build errors in Astro
      const { default: gifshot } = await import('gifshot');

      let frames: string[] = [];
      let gifW = 320;
      let gifH = 240;
      let delaySec = 0.1;

      if (activeTab === 'video') {
        if (!videoUrl) return;
        setProgressText(t.text_progress_extract || 'Extracting frames...');
        
        // Calculate aspect ratio
        const aspect = videoWidth / videoHeight;
        gifW = videoWidth > 480 ? 480 : videoWidth; // cap width at 480 for browser memory safety
        gifH = Math.round(gifW / aspect);
        
        frames = await extractFramesFromVideo(videoUrl, startTime, endTime, fps, gifW, gifH);
        delaySec = 1 / fps;
      } else {
        if (imageFiles.length === 0) return;
        setProgressText(t.text_progress_compile || 'Compiling frames...');
        frames = imageFiles.map(img => img.url);
        gifW = imageWidth;
        gifH = imageHeight;
        delaySec = frameDelay / 1000;
        setProgress(50);
      }

      setProgressText(t.text_progress_compile || 'Compiling frames...');

      // Map quality preset to sampleInterval (lower is better, higher is faster)
      const sampleInterval = qualityPreset === 'high' ? 5 : qualityPreset === 'medium' ? 10 : 20;

      gifshot.createGIF(
        {
          images: frames,
          gifWidth: gifW,
          gifHeight: gifH,
          interval: delaySec,
          numWorkers: 2,
          sampleInterval: sampleInterval,
        },
        (obj: any) => {
          if (obj.error) {
            console.error(obj.error);
            alert('Failed to compile GIF: ' + obj.error);
            setIsProcessing(false);
            return;
          }

          const base64Data = obj.image;
          setGifResult(base64Data);
          setIsProcessing(false);
          setProgress(100);

          // Estimate file size of base64 data
          const stringLength = base64Data.length - 'data:image/gif;base64,'.length;
          const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383812; // approximate conversion
          const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
          setResultMeta({ size: `${sizeInMB} MB` });

          // Add to session history
          const newHistoryItem: GeneratedGIFMeta = {
            id: Date.now().toString(),
            url: base64Data,
            name: activeTab === 'video' ? (videoFile?.name || 'video.mp4') : 'images_gif.gif',
            size: `${sizeInMB} MB`,
            date: new Date().toLocaleDateString(),
            type: activeTab
          };

          setHistory(prev => [newHistoryItem, ...prev].slice(0, 10));
        }
      );
    } catch (err) {
      console.error(err);
      alert('Compilation error occurred.');
      setIsProcessing(false);
    }
  };

  const handleStartTimeChange = (val: number) => {
    const start = Math.max(0, Math.min(val, endTime - 0.5));
    setStartTime(parseFloat(start.toFixed(1)));
    if (videoRef.current) {
      videoRef.current.currentTime = start;
    }
  };

  const handleEndTimeChange = (val: number) => {
    const end = Math.max(startTime + 0.5, Math.min(val, videoDuration));
    setEndTime(parseFloat(end.toFixed(1)));
    if (videoRef.current) {
      videoRef.current.currentTime = end;
    }
  };

  return (
    <div className="min-h-screen bg-[#060406] text-slate-200 font-sans flex flex-col">
      <Header
        currentLang={lang}
        onLanguageChange={(newLang) => {
          window.location.href = `/${newLang.toLowerCase()}/gif-bolt`;
        }}
        onReset={() => {
          setVideoFile(null);
          setVideoUrl(null);
          setImageFiles([]);
          setGifResult(null);
          setResultMeta(null);
        }}
        t={t}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-12 pt-36 pb-24 relative z-10 flex flex-col justify-center">
        {/* Hero title */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-4xl md:text-6xl font-black font-outfit tracking-tight text-white mb-4">
            {t.seoHeroTitle || 'Convert Videos and Images to Animated GIFs Locally'}
          </h1>
          <p className="text-slate-400 text-lg max-w-3xl mx-auto leading-relaxed font-medium">
            {t.seoHeroText || 'Create optimized GIFs entirely in your browser.'}
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-1.5 flex gap-1.5 backdrop-blur-md">
            <button
              onClick={() => {
                setActiveTab('video');
                setGifResult(null);
                setResultMeta(null);
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'video'
                  ? 'bg-fuchsia-500 text-black shadow-lg shadow-fuchsia-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>{t.tab_video || 'Video to GIF'}</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('images');
                setGifResult(null);
                setResultMeta(null);
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'images'
                  ? 'bg-fuchsia-500 text-black shadow-lg shadow-fuchsia-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Images className="w-4 h-4" />
              <span>{t.tab_images || 'Images to GIF'}</span>
            </button>
          </div>
        </div>

        {/* Workspace grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto w-full">
          
          {/* Left Area: Upload & Controls */}
          <div className="lg:col-span-7 bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
            
            {activeTab === 'video' ? (
              /* VIDEO UPLOAD WORKSPACE */
              <div className="flex flex-col gap-6">
                {!videoUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 hover:border-fuchsia-500/40 rounded-2xl p-12 text-center flex flex-col items-center gap-4 cursor-pointer transition-all bg-black/20 hover:bg-black/40 group"
                  >
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-fuchsia-500/10 group-hover:border-fuchsia-500/30 transition-all">
                      <Video className="w-8 h-8 text-fuchsia-400" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-wider mb-1">
                        {t.label_upload_video || 'Upload Video'}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        {t.drop_zone_video || 'Drag & drop your video here (MP4, WebM)'}
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/webm"
                      className="hidden"
                      onChange={handleVideoUpload}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {/* Video preview with seek ability */}
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                      <video
                        ref={videoRef}
                        src={videoUrl}
                        controls
                        muted
                        className="w-full max-h-96 object-contain"
                      />
                    </div>

                    {/* Time range trimming */}
                    <div className="flex flex-col gap-4 border-t border-white/5 pt-6">
                      <label className="text-xs font-black uppercase text-slate-400 tracking-wider">
                        {t.label_trim || 'Trimming Range'}
                      </label>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide flex justify-between">
                            <span>{t.label_start || 'Start Time'}</span>
                            <span className="text-fuchsia-400 font-mono">{startTime}s</span>
                          </span>
                          <input
                            type="range"
                            min="0"
                            max={videoDuration}
                            step="0.1"
                            value={startTime}
                            onChange={(e) => handleStartTimeChange(parseFloat(e.target.value))}
                            className="w-full accent-fuchsia-500 cursor-pointer"
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide flex justify-between">
                            <span>{t.label_end || 'End Time'}</span>
                            <span className="text-fuchsia-400 font-mono">{endTime}s</span>
                          </span>
                          <input
                            type="range"
                            min="0"
                            max={videoDuration}
                            step="0.1"
                            value={endTime}
                            onChange={(e) => handleEndTimeChange(parseFloat(e.target.value))}
                            className="w-full accent-fuchsia-500 cursor-pointer"
                          />
                        </div>
                      </div>
                      <div className="text-[10px] text-fuchsia-400 font-bold uppercase tracking-wider">
                        Duration: {(endTime - startTime).toFixed(1)}s (Max recommended: 8s for memory safety)
                      </div>
                    </div>

                    {/* Compression variables */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-white/5 pt-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between">
                          <label className="text-xs font-black uppercase text-slate-400 tracking-wider">
                            {t.label_fps || 'Frame Rate (FPS)'}
                          </label>
                          <span className="text-xs font-bold text-fuchsia-400 font-mono">{fps} FPS</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="15"
                          step="1"
                          value={fps}
                          onChange={(e) => setFps(parseInt(e.target.value))}
                          className="w-full accent-fuchsia-500 cursor-pointer"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-black uppercase text-slate-400 tracking-wider">
                          {t.label_quality || 'Compression Quality'}
                        </label>
                        <select
                          value={qualityPreset}
                          onChange={(e) => setQualityPreset(e.target.value as any)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-fuchsia-500 transition-colors font-medium text-sm"
                        >
                          <option value="high" className="bg-[#050508]">{t.quality_high || 'High Quality'}</option>
                          <option value="medium" className="bg-[#050508]">{t.quality_medium || 'Medium Quality'}</option>
                          <option value="low" className="bg-[#050508]">{t.quality_low || 'Low Quality'}</option>
                        </select>
                      </div>
                    </div>

                    {/* Reset Button */}
                    <button
                      onClick={() => {
                        setVideoFile(null);
                        setVideoUrl(null);
                        setGifResult(null);
                      }}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer outline-none border border-white/5"
                    >
                      Change Video
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* IMAGES SEQUENCE WORKSPACE */
              <div className="flex flex-col gap-6">
                <div
                  onClick={() => imagesInputRef.current?.click()}
                  className="border-2 border-dashed border-white/10 hover:border-fuchsia-500/40 rounded-2xl p-8 text-center flex flex-col items-center gap-3 cursor-pointer transition-all bg-black/20 hover:bg-black/40 group"
                >
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:bg-fuchsia-500/10 group-hover:border-fuchsia-500/30 transition-all animate-pulse">
                    <Upload className="w-6 h-6 text-fuchsia-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white uppercase tracking-wider mb-0.5">
                      {t.label_upload_images || 'Upload Images'}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      {t.drop_zone_images || 'Drag & drop image sequence (PNG, JPG, WebP)'}
                    </p>
                  </div>
                  <input
                    ref={imagesInputRef}
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleImagesUpload}
                  />
                </div>

                {imageFiles.length > 0 && (
                  <div className="flex flex-col gap-6">
                    {/* Reorderable frame list */}
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                        Frames ({imageFiles.length})
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto pr-1">
                        {imageFiles.map((frame, index) => (
                          <div
                            key={frame.id}
                            className="bg-black/40 border border-white/10 rounded-xl p-2.5 flex flex-col gap-2 relative group"
                          >
                            <img
                              src={frame.url}
                              alt={`Frame ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <div className="flex items-center justify-between mt-1 text-[10px] font-black tracking-wide text-slate-400">
                              <span>FRAME #{index + 1}</span>
                              <button
                                onClick={() => removeFrame(index)}
                                className="text-red-400 hover:text-red-300 transition-colors border-none bg-transparent outline-none cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            
                            {/* Move controls */}
                            <div className="flex justify-between gap-1.5 mt-1.5">
                              <button
                                onClick={() => moveFrame(index, 'left')}
                                disabled={index === 0}
                                className="flex-1 bg-white/5 hover:bg-white/10 disabled:opacity-20 py-1.5 rounded flex items-center justify-center cursor-pointer border-none outline-none"
                              >
                                <ArrowLeft className="w-3 h-3 text-slate-300" />
                              </button>
                              <button
                                onClick={() => moveFrame(index, 'right')}
                                disabled={index === imageFiles.length - 1}
                                className="flex-1 bg-white/5 hover:bg-white/10 disabled:opacity-20 py-1.5 rounded flex items-center justify-center cursor-pointer border-none outline-none"
                              >
                                <ArrowRight className="w-3 h-3 text-slate-300" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delay settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-white/5 pt-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between">
                          <label className="text-xs font-black uppercase text-slate-400 tracking-wider">
                            {t.label_duration || 'Frame Delay (ms)'}
                          </label>
                          <span className="text-xs font-bold text-fuchsia-400 font-mono">{frameDelay} ms</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="1000"
                          step="50"
                          value={frameDelay}
                          onChange={(e) => setFrameDelay(parseInt(e.target.value))}
                          className="w-full accent-fuchsia-500 cursor-pointer"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-black uppercase text-slate-400 tracking-wider">
                          Dimensions
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            value={imageWidth}
                            onChange={(e) => setImageWidth(parseInt(e.target.value) || 320)}
                            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-fuchsia-500 text-xs font-mono"
                            placeholder="Width"
                          />
                          <input
                            type="number"
                            value={imageHeight}
                            onChange={(e) => setImageHeight(parseInt(e.target.value) || 240)}
                            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-fuchsia-500 text-xs font-mono"
                            placeholder="Height"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Clear all frames button */}
                    <button
                      onClick={() => {
                        imageFiles.forEach(img => URL.revokeObjectURL(img.url));
                        setImageFiles([]);
                        setGifResult(null);
                      }}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer outline-none border border-white/5"
                    >
                      Clear All Frames
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Area: Status, result, download, history */}
          <div className="lg:col-span-5 flex flex-col gap-8 w-full">
            {/* Generate Action Control Card */}
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md flex flex-col gap-6 relative overflow-hidden">
              <div className="flex flex-col items-center gap-4">
                <div className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-fuchsia-500" />
                  GIF Compiler
                </div>

                {!isProcessing && !gifResult && (
                  <div className="text-slate-500 text-sm font-medium py-6 text-center">
                    Upload assets on the left to start compiling your animated GIF.
                  </div>
                )}

                {/* Progress rendering */}
                {isProcessing && (
                  <div className="w-full flex flex-col gap-3.5">
                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400">
                      <span>{progressText}</span>
                      <span className="text-fuchsia-400 font-mono">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-600 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-center mt-2">
                      <RefreshCw className="w-6 h-6 text-fuchsia-400 animate-spin" />
                    </div>
                  </div>
                )}

                {/* Result render */}
                {gifResult && (
                  <div className="w-full flex flex-col gap-4">
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 max-h-64 flex justify-center items-center">
                      <img src={gifResult} alt="Compiled GIF" className="max-h-64 object-contain" />
                    </div>

                    <div className="flex flex-col gap-1 text-xs text-slate-400 font-bold uppercase tracking-wider border-t border-white/5 pt-3">
                      <div className="flex justify-between">
                        <span>File Size</span>
                        <span className="text-fuchsia-400 font-mono">{resultMeta?.size}</span>
                      </div>
                      <div className="flex justify-between mt-1 text-[10px] text-slate-500">
                        <span>Type</span>
                        <span>{activeTab === 'video' ? 'Video Extract' : 'Image Sequence'}</span>
                      </div>
                    </div>

                    {/* Download */}
                    <a
                      href={gifResult}
                      download={`gif-bolt-${Date.now()}.gif`}
                      className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-black font-black text-sm uppercase rounded-2xl transition-all cursor-pointer active:scale-95 duration-200 border-none outline-none shadow-lg shadow-fuchsia-500/10 hover:shadow-fuchsia-500/20"
                    >
                      <Download className="w-5 h-5" />
                      <span>{t.btn_download || 'Download GIF'}</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Main Compile Button */}
              {((activeTab === 'video' && videoUrl) || (activeTab === 'images' && imageFiles.length > 0)) && !isProcessing && (
                <button
                  onClick={generateGIF}
                  className="w-full py-4 bg-fuchsia-500 hover:bg-fuchsia-600 text-black font-black text-sm uppercase tracking-wider rounded-2xl transition-all cursor-pointer active:scale-95 duration-200 border-none outline-none shadow-lg shadow-fuchsia-500/20"
                >
                  {t.btn_generate || 'Generate GIF'}
                </button>
              )}
            </div>

            {/* Session History Card */}
            {history.length > 0 && (
              <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-fuchsia-500" />
                    {t.history_title || 'Recent History'}
                  </div>
                  <button
                    onClick={() => {
                      setHistory([]);
                    }}
                    className="text-xs font-bold text-red-400 hover:text-red-300 border-none bg-transparent outline-none cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.clear_history || 'Clear'}</span>
                  </button>
                </div>

                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setGifResult(item.url);
                        setResultMeta({ size: item.size });
                        setActiveTab(item.type);
                      }}
                      className="flex items-center gap-3 p-3 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-fuchsia-500/30 rounded-xl transition-all cursor-pointer group text-left"
                    >
                      <img src={item.url} alt="thumbnail" className="w-12 h-12 object-cover rounded-lg border border-white/10 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-300 text-sm font-medium truncate">
                          {item.name}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                          <span className="group-hover:text-fuchsia-400 transition-colors">
                            {item.size}
                          </span>
                          <span>{item.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </main>

      <Footer
        lang={lang}
        t={t}
        onOpenModal={(type) => {
          setModalType(type);
          setModalOpen(true);
        }}
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

export default GIFBolt;
