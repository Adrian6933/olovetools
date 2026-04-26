import React, { useState, useEffect, useRef } from 'react';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  isCategory?: boolean;
}

/**
 * ProgressiveImage Component (Pixelated Loading Version)
 * Replaces blur with a sharp pixelated effect for a "low quality" retro look during load.
 */
const ProgressiveImage: React.FC<ProgressiveImageProps> = ({ src, alt, className = "", isCategory = false }) => {
  const [highResLoaded, setHighResLoaded] = useState(false);
  const [startHighRes, setStartHighRes] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Ultra-Low Resolution calculation for visible pixels
  let lowResUrl: string | null = null;
  if (src) {
    if (isCategory) {
      // Box Art: 600x800 -> 90x120 (Medium pixelation)
      lowResUrl = src.replace('600x800', '90x120');
    } else {
      // Thumbnail: 1280x720 -> 120x68 (Medium pixelation)
      lowResUrl = src.replace('1280x720', '120x68');
    }
    if (lowResUrl === src) lowResUrl = null;
  }

  useEffect(() => {
    // Delay high-res slightly
    const timer = setTimeout(() => {
      setStartHighRes(true);
    }, 150);

    if (imgRef.current?.complete) {
      setHighResLoaded(true);
    } else {
      setHighResLoaded(false);
    }

    return () => clearTimeout(timer);
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-[#0a0a0f] ${className}`}>
      {/* 1. Low-Res Placeholder: PIXELATED style */}
      {lowResUrl && (
        <img
          src={lowResUrl}
          alt=""
          aria-hidden="true"
          // @ts-ignore
          fetchPriority="high"
          className={`
            w-full h-full object-cover transition-opacity duration-700
            ${highResLoaded ? 'opacity-0' : 'opacity-100'}
            absolute inset-0
          `}
          style={{ 
            imageRendering: 'pixelated', // Forces sharp pixels
            filter: 'contrast(1.1)' // Makes pixels pop more
          }}
        />
      )}

      {/* 2. High-Res Image */}
      {startHighRes && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          // @ts-ignore
          fetchPriority="low"
          onLoad={() => setHighResLoaded(true)}
          className={`
            w-full h-full object-cover transition-all duration-1000 ease-out
            ${highResLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-100 blur-sm'}
            relative z-10
          `}
          loading="lazy"
          decoding="async"
        />
      )}

      {/* 3. Deep Fallback */}
      {!highResLoaded && !lowResUrl && (
        <div className="absolute inset-0 bg-[#15151b] animate-pulse" />
      )}
    </div>
  );
};

export default ProgressiveImage;
