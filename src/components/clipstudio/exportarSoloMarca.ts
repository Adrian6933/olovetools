import {
  BlobSource, BufferTarget, EncodedAudioPacketSource, EncodedPacketSink, Input, MP4,
  Mp4OutputFormat, Output, Quality, VideoSample, VideoSampleSink, VideoSampleSource, canEncodeVideo,
} from 'mediabunny';
import { mantenerPestanaActiva } from './mantenerActiva';
import { bitrateDeGrabacion } from './recorder';
import type { WatermarkConfig } from './types';
import { drawWatermarkOnCanvas, ensureWatermarkFont, type WatermarkRenderProgress } from './watermarkService';

class WatermarkCodecError extends Error {
  constructor(codec: 'avc' | 'hevc') {
    super(`This browser cannot render the watermark in ${codec === 'hevc' ? 'HEVC' : 'H.264'}.`);
    this.name = 'WatermarkCodecError';
  }
}

/** Compone solo los píxeles de la marca en el YUV del clip, sin pasar el fondo a RGB. */
async function componerMarca(sample: VideoSample, rgba: Uint8ClampedArray, width: number, height: number) {
  const { format, colorSpace } = sample;
  if (format !== 'I420' && format !== 'NV12') throw new Error(`Unsupported watermark pixel format: ${format}`);
  const data = new Uint8Array(sample.allocationSize());
  const [y, u, v] = await sample.copyTo(data);
  const intercalado = format === 'NV12';
  const matriz601 = colorSpace.matrix === 'bt470bg' || colorSpace.matrix === 'smpte170m';
  const [kr, kb] = matriz601 ? [0.299, 0.114] : [0.2126, 0.0722];
  const kg = 1 - kr - kb;
  const rangoY = (colorSpace.fullRange ? 255 : 219) / 255;
  const baseY = colorSpace.fullRange ? 0 : 16;
  const rangoUV = (colorSpace.fullRange ? 255 : 224) / 255;

  // Cada muestra de croma de 4:2:0 corresponde a cuatro píxeles de la marca.
  for (let fila = 0; fila < height; fila += 2) {
    for (let col = 0; col < width; col += 2) {
      const i = (fila * width + col) * 4;
      const siguienteFila = i + width * 4;
      if (!(rgba[i + 3] || rgba[i + 7] || rgba[siguienteFila + 3] || rgba[siguienteFila + 7])) continue;
      let sumaAlfa = 0;
      let sumaU = 0;
      let sumaV = 0;
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const p = i + (dy * width + dx) * 4;
          const alfa = rgba[p + 3] / 255;
          if (alfa === 0) continue;
          const luma = kr * rgba[p] + kg * rgba[p + 1] + kb * rgba[p + 2];
          const yIndex = y.offset + (fila + dy) * y.stride + col + dx;
          data[yIndex] = Math.round(data[yIndex] * (1 - alfa) + (baseY + luma * rangoY) * alfa);
          sumaAlfa += alfa;
          sumaU += ((rgba[p + 2] - luma) / (2 * (1 - kb))) * alfa;
          sumaV += ((rgba[p] - luma) / (2 * (1 - kr))) * alfa;
        }
      }
      const uIndex = u.offset + (fila / 2) * u.stride + (intercalado ? col : col / 2);
      const vIndex = intercalado ? uIndex + 1 : v.offset + (fila / 2) * v.stride + col / 2;
      data[uIndex] = Math.round(data[uIndex] + ((128 - data[uIndex]) * sumaAlfa + sumaU * rangoUV) / 4);
      data[vIndex] = Math.round(data[vIndex] + ((128 - data[vIndex]) * sumaAlfa + sumaV * rangoUV) / 4);
    }
  }

  return new VideoSample(data, {
    format, codedWidth: width, codedHeight: height, layout: intercalado ? [y, u] : [y, u, v],
    timestamp: sample.timestamp, duration: sample.duration, colorSpace: colorSpace.toJSON(),
  });
}

/** Mantiene el códec, el color y el ritmo de la fuente. El audio se copia comprimido. */
export async function exportarSoloMarca(
  blob: Blob,
  channelName: string,
  config: WatermarkConfig,
  onProgress?: (p: WatermarkRenderProgress) => void,
  signal?: AbortSignal,
): Promise<Blob> {
  signal?.throwIfAborted();
  const input = new Input({ source: new BlobSource(blob), formats: [MP4] });
  const soltar = mantenerPestanaActiva();
  const target = new BufferTarget();
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target });
  try {
    const video = await input.getPrimaryVideoTrack();
    const codec = await video?.getCodec();
    if (!video || (codec !== 'hevc' && codec !== 'avc')) throw new Error('Unsupported watermark video track');
    const [width, height, stats, audio, decodable] = await Promise.all([
      video.getDisplayWidth(), video.getDisplayHeight(), video.computePacketStats(240),
      input.getPrimaryAudioTrack(), video.canDecode(),
    ]);
    // Pedir margen de bitrate de forma explícita. En HEVC el codificador del navegador
    // puede quedarse por debajo si decide la calidad por su cuenta. El doble del
    // original basta: con la tabla de grabación como mínimo, un clip de 1 Mbps
    // salía a 16 Mbps (de 1,4 a 23 MB en 10 s) sin verse mejor. Sin dato, la tabla.
    const tabla = bitrateDeGrabacion(height);
    const quality = new Quality({
      bitrate: stats.averageBitrate > 0 ? Math.max(tabla / 4, Math.round(stats.averageBitrate * 2)) : tabla,
    });
    if (!decodable || !(await canEncodeVideo(codec, { width, height, quality }))) throw new WatermarkCodecError(codec);
    if (width % 2 || height % 2 || await video.hasHighDynamicRange()) throw new Error('Unsupported watermark video geometry or color');

    await ensureWatermarkFont(config);
    signal?.throwIfAborted();
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas not available');
    const fuenteVideo = new VideoSampleSource({ codec, quality });
    output.addVideoTrack(fuenteVideo);

    const audioCodec = await audio?.getCodec();
    const audioConfig = await audio?.getDecoderConfig();
    if (audio && (!audioCodec || !audioConfig)) throw new Error('Unsupported watermark audio track');
    const fuenteAudio = audioCodec ? new EncodedAudioPacketSource(audioCodec) : null;
    if (fuenteAudio) output.addAudioTrack(fuenteAudio);
    const inicioVideo = await video.getFirstTimestamp();
    const total = (await video.computeDuration()) - inicioVideo;
    await output.start();

    const copiarAudio = async () => {
      if (!audio || !fuenteAudio || !audioConfig) return;
      let metadata: EncodedAudioChunkMetadata | undefined = { decoderConfig: audioConfig };
      for await (const packet of new EncodedPacketSink(audio).packets()) {
        signal?.throwIfAborted();
        await fuenteAudio.add(packet, metadata);
        metadata = undefined;
      }
      fuenteAudio.close();
    };

    const marcarVideo = async () => {
      let frames = 0;
      for await (const sample of new VideoSampleSink(video).samples()) {
        try {
          signal?.throwIfAborted();
          if (sample.visibleRect.width !== width || sample.visibleRect.height !== height || sample.rotation || sample.flip) {
            throw new Error('Unsupported watermark video geometry');
          }
          const elapsed = sample.timestamp - inicioVideo;
          ctx.clearRect(0, 0, width, height);
          drawWatermarkOnCanvas(ctx, config, channelName, width, height, elapsed, total);
          const marcado = await componerMarca(sample, ctx.getImageData(0, 0, width, height).data, width, height);
          try {
            await fuenteVideo.add(marcado);
          } finally {
            marcado.close();
          }
          if (frames++ % 15 === 0) onProgress?.({ elapsed, total, pct: Math.round(elapsed * 100 / total) });
        } finally {
          sample.close();
        }
      }
      if (!frames) throw new Error('No video frames to watermark');
      fuenteVideo.close();
    };

    await Promise.all([marcarVideo(), copiarAudio()]);
    signal?.throwIfAborted();
    await output.finalize();
    return new Blob([target.buffer!], { type: 'video/mp4' });
  } catch (error) {
    await output.cancel().catch(() => {});
    throw error;
  } finally {
    input.dispose();
    soltar();
  }
}
