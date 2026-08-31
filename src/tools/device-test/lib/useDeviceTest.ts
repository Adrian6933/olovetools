// ============================================================================
// Estado del probador
// ----------------------------------------------------------------------------
// Nada arranca solo: ni la cámara, ni el micrófono, ni el sondeo de
// resoluciones. Cada prueba tiene su botón, porque pedir la webcam nada más
// entrar en una página es exactamente lo que no hay que hacer.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { createMeter } from './audio';
import type { MeterHandle } from './audio';
import { enumerate, onDeviceChange, probeResolutions, readCameraCapabilities, readCameraSettings } from './devices';
import { readSystemInfo, watchSystemInfo } from './system';
import type { AudioLevels, CameraSettings, DeviceLists, ResolutionProbe, SystemInfo } from './types';

export type Status = 'idle' | 'active' | 'busy' | 'error';

const EMPTY_LISTS: DeviceLists = { cameras: [], microphones: [], speakers: [], labelled: false };

export interface Labels {
  unknown: string;
  yes: string;
  no: string;
}

export function useDeviceTest(labels: Labels) {
  const [devices, setDevices] = useState<DeviceLists>(EMPTY_LISTS);
  const [system, setSystem] = useState<SystemInfo | null>(null);

  // --- Cámara ---------------------------------------------------------------
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStream = useRef<MediaStream | null>(null);
  const [cameraId, setCameraId] = useState('');
  const [cameraStatus, setCameraStatus] = useState<Status>('idle');
  const [cameraError, setCameraError] = useState('');
  const [cameraSettings, setCameraSettings] = useState<CameraSettings | null>(null);
  const [cameraCaps, setCameraCaps] = useState<{ maxWidth: number; maxHeight: number; maxFps: number } | null>(null);
  const [probes, setProbes] = useState<ResolutionProbe[] | null>(null);
  const [probeStep, setProbeStep] = useState<{ done: number; total: number } | null>(null);

  // --- Micrófono ------------------------------------------------------------
  const micStream = useRef<MediaStream | null>(null);
  const meter = useRef<MeterHandle | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [micId, setMicId] = useState('');
  const [micStatus, setMicStatus] = useState<Status>('idle');
  const [micError, setMicError] = useState('');
  const [levels, setLevels] = useState<AudioLevels | null>(null);
  const [micInfo, setMicInfo] = useState<{ sampleRate: number; latency: number | null } | null>(null);

  // --- Grabación ------------------------------------------------------------
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const recordingUrl = useRef<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [recordUrl, setRecordUrl] = useState<string | null>(null);
  const [recordBlob, setRecordBlob] = useState<Blob | null>(null);

  const refresh = useCallback(() => { enumerate().then(setDevices); }, []);

  useEffect(() => {
    refresh();
    // Enchufar o quitar una webcam ya no deja la lista vieja.
    const off = onDeviceChange(refresh);
    return off;
  }, [refresh]);

  useEffect(() => {
    const read = () => setSystem(readSystemInfo(labels.unknown, labels.yes, labels.no));
    read();
    return watchSystemInfo(read);
  }, [labels.unknown, labels.yes, labels.no]);

  // --- Cámara ---------------------------------------------------------------

  const stopCamera = useCallback(() => {
    if (cameraStream.current) cameraStream.current.getTracks().forEach(track => track.stop());
    cameraStream.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraStatus('idle');
    setCameraSettings(null);
    setCameraCaps(null);
  }, []);

  const startCamera = useCallback(
    async (deviceId?: string) => {
      setCameraStatus('busy');
      setCameraError('');
      if (cameraStream.current) cameraStream.current.getTracks().forEach(track => track.stop());
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId } } : true,
        });
        cameraStream.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setCameraSettings(readCameraSettings(stream));
        setCameraCaps(readCameraCapabilities(stream));
        setCameraStatus('active');
        // Ahora sí hay permiso, así que los aparatos ya tienen nombre.
        refresh();
      } catch (error: any) {
        setCameraStatus('error');
        setCameraError(error && error.name ? error.name : 'error');
      }
    },
    [refresh]
  );

  const runProbe = useCallback(async () => {
    setProbes(null);
    setProbeStep({ done: 0, total: 5 });
    const wasActive = cameraStatus === 'active';
    // El sondeo abre y cierra la cámara cinco veces; hay que soltarla antes.
    stopCamera();
    const results = await probeResolutions(cameraId, (done, total) => setProbeStep({ done, total }));
    setProbes(results);
    setProbeStep(null);
    if (wasActive) await startCamera(cameraId);
  }, [cameraId, cameraStatus, stopCamera, startCamera]);

  // --- Micrófono ------------------------------------------------------------

  const stopMic = useCallback(async () => {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
    if (recorder.current && recorder.current.state !== 'inactive') recorder.current.stop();
    recorder.current = null;
    if (meter.current) { await meter.current.close(); meter.current = null; }
    if (micStream.current) micStream.current.getTracks().forEach(track => track.stop());
    micStream.current = null;
    setMicStatus('idle');
    setLevels(null);
    setMicInfo(null);
    setRecording(false);
    setRecordProgress(0);
  }, []);

  const startMic = useCallback(
    async (deviceId?: string) => {
      setMicStatus('busy');
      setMicError('');
      if (micStream.current) micStream.current.getTracks().forEach(track => track.stop());
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        });
        micStream.current = stream;
        const handle = await createMeter(stream);
        meter.current = handle;
        setMicInfo({ sampleRate: handle.sampleRate, latency: handle.baseLatencyMs });
        setMicStatus('active');
        refresh();

        // setInterval y no requestAnimationFrame: un medidor tiene que seguir
        // dando números aunque la pestaña no esté al frente (el navegador ya lo
        // frena a 1 Hz en segundo plano, que es la degradación correcta),
        // mientras que rAF se detiene del todo y el medidor se congela.
        if (timer.current) clearInterval(timer.current);
        timer.current = setInterval(() => {
          if (meter.current) setLevels(meter.current.read());
        }, 33);
      } catch (error: any) {
        setMicStatus('error');
        setMicError(error && error.name ? error.name : 'error');
      }
    },
    [refresh]
  );

  const startRecording = useCallback((seconds = 5) => {
    const stream = micStream.current;
    if (!stream || recording) return;
    chunks.current = [];
    if (recordingUrl.current) {
      URL.revokeObjectURL(recordingUrl.current);
      recordingUrl.current = null;
    }
    setRecordUrl(null);
    setRecordBlob(null);
    setRecordProgress(0);

    let mime = '';
    for (const candidate of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(candidate)) {
        mime = candidate;
        break;
      }
    }

    const instance = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    recorder.current = instance;
    instance.ondataavailable = event => { if (event.data && event.data.size > 0) chunks.current.push(event.data); };
    instance.onstop = () => {
      const blob = new Blob(chunks.current, { type: mime || 'audio/webm' });
      const url = URL.createObjectURL(blob);
      recordingUrl.current = url;
      setRecordUrl(url);
      setRecordBlob(blob);
      setRecording(false);
      setRecordProgress(1);
    };

    instance.start();
    setRecording(true);
    const started = Date.now();
    const tick = setInterval(() => {
      const elapsed = (Date.now() - started) / 1000;
      setRecordProgress(Math.min(1, elapsed / seconds));
      if (elapsed >= seconds) {
        clearInterval(tick);
        if (recorder.current && recorder.current.state !== 'inactive') recorder.current.stop();
      }
    }, 100);
  }, [recording]);

  const clearRecording = useCallback(() => {
    if (recordingUrl.current) {
      URL.revokeObjectURL(recordingUrl.current);
      recordingUrl.current = null;
    }
    setRecordUrl(null);
    setRecordBlob(null);
    setRecordProgress(0);
  }, []);

  // --- Limpieza -------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
      if (meter.current) meter.current.close();
      if (cameraStream.current) cameraStream.current.getTracks().forEach(track => track.stop());
      if (micStream.current) micStream.current.getTracks().forEach(track => track.stop());
      if (recordingUrl.current) URL.revokeObjectURL(recordingUrl.current);
    };
  }, []);

  return {
    devices, refresh, system,
    videoRef, cameraId, setCameraId, cameraStatus, cameraError, cameraSettings, cameraCaps,
    startCamera, stopCamera, cameraStream,
    probes, probeStep, runProbe,
    micId, setMicId, micStatus, micError, levels, micInfo, startMic, stopMic,
    recording, recordProgress, recordUrl, recordBlob, startRecording, clearRecording,
  };
}
