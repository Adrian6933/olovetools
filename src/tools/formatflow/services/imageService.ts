
import { ConversionSettings, ImageFormat, BatchImageItem } from '../types';

export const readFileAsDataURL = (file: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export const processUploadedFile = async (file: File): Promise<Blob> => {
  // Check for HEIC/HEIF
  if (
    file.type.toLowerCase() === 'image/heic' || 
    file.type.toLowerCase() === 'image/heif' ||
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif')
  ) {
    try {
      console.log('Converting HEIC to JPEG for processing...');
      const heic2any = (await import('heic2any')).default;
      const result = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9
      });
      // heic2any can return an array if multiple images are in the HEIC, we just take the first one or the result if single
      return Array.isArray(result) ? result[0] : result;
    } catch (e) {
      console.error('HEIC conversion failed', e);
      throw new Error('Failed to process HEIC image');
    }
  }
  return file;
};

export const convertImage = async (
  source: Blob,
  settings: ConversionSettings
): Promise<Blob> => {
  const dataUrl = await readFileAsDataURL(source);
  const img = await loadImage(dataUrl);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  const targetWidth = Math.round(img.width * settings.scale);
  const targetHeight = Math.round(img.height * settings.scale);

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Fill background with white for transparent images converted to JPEG
  if (settings.format === ImageFormat.JPEG) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Use high quality scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  if (settings.format === ImageFormat.PDF) {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({
      orientation: targetWidth > targetHeight ? 'l' : 'p',
      unit: 'px',
      format: [targetWidth, targetHeight]
    });
    const imgData = canvas.toDataURL('image/jpeg', settings.quality);
    pdf.addImage(imgData, 'JPEG', 0, 0, targetWidth, targetHeight);
    return pdf.output('blob');
  }

  if (settings.format === ImageFormat.SVG) {
    const imgData = canvas.toDataURL('image/png');
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${targetWidth}" height="${targetHeight}">
  <image href="${imgData}" width="${targetWidth}" height="${targetHeight}" />
</svg>`;
    return new Blob([svgString], { type: 'image/svg+xml' });
  }

  if (settings.format === ImageFormat.TIFF) {
    const rgba = ctx.getImageData(0, 0, targetWidth, targetHeight).data;
    const UTIF = (await import('utif')).default || await import('utif');
    const tiffBuffer = UTIF.encodeImage(new Uint8Array(rgba.buffer), targetWidth, targetHeight);
    return new Blob([tiffBuffer], { type: 'image/tiff' });
  }

  if (settings.format === ImageFormat.EPS) {
    throw new Error('EPS conversion is not currently supported in the browser.');
  }

  if (settings.format === ImageFormat.RAW) {
    throw new Error('RAW conversion is not currently supported in the browser.');
  }

  return new Promise((resolve, reject) => {
    if (settings.format === ImageFormat.ICO) {
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return reject(new Error('Failed to create PNG for ICO'));
        pngBlob.arrayBuffer().then(pngBuffer => {
          const pngData = new Uint8Array(pngBuffer);
          const icoHeader = new Uint8Array([
            0, 0, 1, 0, 1, 0,
            targetWidth >= 256 ? 0 : targetWidth,
            targetHeight >= 256 ? 0 : targetHeight,
            0, 0, 1, 0, 32, 0,
            (pngData.length & 0xFF), ((pngData.length >> 8) & 0xFF), ((pngData.length >> 16) & 0xFF), ((pngData.length >> 24) & 0xFF),
            22, 0, 0, 0
          ]);
          resolve(new Blob([icoHeader, pngData], { type: 'image/x-icon' }));
        });
      }, 'image/png');
      return;
    }

    if (settings.format === ImageFormat.HEIC) {
      // Try native HEIC encoding, fallback to JPEG if unsupported
      canvas.toBlob((blob) => {
        if (blob && blob.type === 'image/heic') {
          resolve(blob);
        } else {
          canvas.toBlob((jpegBlob) => {
            if (jpegBlob) resolve(new Blob([jpegBlob], { type: 'image/heic' }));
            else reject(new Error('Canvas toBlob failed'));
          }, 'image/jpeg', settings.quality);
        }
      }, 'image/heic', settings.quality);
      return;
    }

    // For types that canvas supports natively
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob failed'));
        }
      },
      settings.format,
      settings.quality
    );
  });
};

export const createBatchZip = async (
  images: BatchImageItem[],
  globalSettings: ConversionSettings,
  onProgress: (current: number, total: number) => void
): Promise<Blob> => {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  
  for (let i = 0; i < images.length; i++) {
    const item = images[i];
    onProgress(i + 1, images.length);
    
    // Use specific settings if available, otherwise use global
    const settingsToUse = item.settings || globalSettings;
    let ext = settingsToUse.format.split('/')[1];
    if (ext === 'jpeg') ext = 'jpg';
    if (ext === 'svg+xml') ext = 'svg';
    if (ext === 'x-icon') ext = 'ico';
    if (ext === 'postscript') ext = 'eps';
    if (ext === 'x-raw') ext = 'raw';
    
    // Use the sourceBlob (which might be the converted HEIC) for processing
    const blob = await convertImage(item.sourceBlob, settingsToUse);
    
    // Create a clean filename: "image-name.webp"
    // Remove original extension
    const originalName = item.file.name.substring(0, item.file.name.lastIndexOf('.')) || item.file.name;
    zip.file(`${i + 1}_${originalName}.${ext}`, blob);
  }

  return zip.generateAsync({ type: 'blob' });
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
