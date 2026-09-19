import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Download,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Palette,
  Phone,
  QrCode,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Sliders,
  User,
  Wifi,
  XCircle,
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { NextStepBar } from './components/NextStepBar';
import {
  IconExport,
  IconHandoff,
  IconLocalQr,
  IconPayloads,
  IconStyling,
  IconVerify,
  QrHeroArt,
  StepCheck,
  StepDownload,
  StepPick,
  StepStyle,
} from './components/Illustrations';
import type { Language } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { useReducedMotion, fadeInUp } from '../../components/shared/motion';
import { useHandoffIntake } from '../../lib/useHandoff';
import type {
  ColorType,
  CornerDotType,
  CornerType,
  DotType,
  EccLevel,
  GradientType,
  QrMode,
  ScanCheck,
  VCardConfig,
} from './types';
import {
  buildEmail,
  buildGeo,
  buildSms,
  buildTel,
  buildVCard,
  buildWifi,
  contrastRatio,
  decodeBlob,
  isInverted,
  logoFitsEcc,
  MAX_BYTES,
  payloadBytes,
  resolveEcc,
} from './lib/qr';

// Preset Brand SVGs (encoded with %23 for '#' to render safely in browser Image objects)
const PRESET_LOGOS: Record<string, string> = {
  whatsapp: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2325D366'><path d='M12.004 0C5.372 0 0 5.372 0 12c0 2.112.552 4.164 1.596 5.976L.048 24l6.192-1.62C8.016 23.364 9.972 24 12.004 24c6.628 0 12.004-5.376 12.004-12S18.632 0 12.004 0zm0 21.996c-1.896 0-3.756-.504-5.388-1.464l-.384-.228-3.66 1.056.972-3.564-.252-.396C2.268 15.684 1.74 13.884 1.74 12c0-5.652 4.608-10.26 10.264-10.26 5.652 0 10.26 4.608 10.26 10.26s-4.608 10.26-10.26 10.26zm5.28-7.392c-.288-.144-1.716-.852-1.98-1.02-.264-.096-.456-.144-.648.144-.192.288-.744.948-.912 1.14-.168.192-.336.216-.624.072-.288-.144-1.224-.456-2.328-1.44-.864-.768-1.44-1.728-1.608-2.016-.168-.288-.024-.444.12-.588.132-.132.288-.336.432-.504.144-.168.192-.288.288-.48.096-.192.048-.36-.024-.504-.072-.144-.648-1.56-.888-2.136-.24-.564-.48-.492-.648-.504-.168-.006-.36-.006-.552-.006-.192 0-.504.072-.768.36-.264.288-1.008.984-1.008 2.4s1.032 2.784 1.176 2.976c.144.192 2.028 3.108 4.92 4.356.684.288 1.224.468 1.644.6.696.216 1.332.186 1.836.108.564-.084 1.716-.708 1.956-1.392.24-.684.24-1.272.168-1.392-.072-.12-.264-.192-.552-.336z'/></svg>",
  instagram: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23E1306C'><path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z'/></svg>",
  youtube: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FF0000'><path d='M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.528 3.545 12 3.545 12 3.545s-7.528 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.023 0 12 0 12s0 3.977.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.86.508 9.388.508 9.388.508s7.528 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.977 24 12 24 12s0-3.977-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'/></svg>",
  facebook: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%231877F2'><path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'/></svg>",
  twitter: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23000000'><path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'/></svg>",
  github: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23181717'><path d='M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'/></svg>",
  linkedin: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230A66C2'><path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'/></svg>"
};

const EMPTY_VCARD: VCardConfig = {
  firstName: '',
  lastName: '',
  organization: '',
  jobTitle: '',
  phone: '',
  email: '',
  website: '',
  address: '',
};

const ECC_LEVELS: EccLevel[] = ['auto', 'L', 'M', 'Q', 'H'];
const EXPORT_SIZES = [512, 1024, 2048];
/** Largest logo the upload accepts; anything bigger just bloats the data URL. */
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

interface QrboltProps {
  lang: Language;
  dictionary?: any;
}

export const Qrbolt: React.FC<QrboltProps> = ({ lang, dictionary }) => {
  const t = dictionary || {};
  const prefersReduced = useReducedMotion();

  const [activeTab, setActiveTab] = useState<'content' | 'design' | 'logo'>('content');

  // --- Payload ------------------------------------------------------------
  const [mode, setMode] = useState<QrMode>('url');
  const [url, setUrl] = useState('https://example.com');
  const [text, setText] = useState('');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiSecurity, setWifiSecurity] = useState<'WEP' | 'WPA' | 'nopass'>('WPA');
  const [emailAddress, setEmailAddress] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [smsNumber, setSmsNumber] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [telNumber, setTelNumber] = useState('');
  const [geoLat, setGeoLat] = useState('');
  const [geoLon, setGeoLon] = useState('');
  const [vcard, setVcard] = useState<VCardConfig>(EMPTY_VCARD);

  // --- Design -------------------------------------------------------------
  const [dotType, setDotType] = useState<DotType>('square');
  const [cornerType, setCornerType] = useState<CornerType>('square');
  const [cornerDotType, setCornerDotType] = useState<CornerDotType>('square');
  const [colorType, setColorType] = useState<ColorType>('solid');
  const [dotsColor, setDotsColor] = useState('#047857');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [bgTransparent, setBgTransparent] = useState(false);
  const [gradientType, setGradientType] = useState<GradientType>('linear');
  const [gradientColor1, setGradientColor1] = useState('#047857');
  const [gradientColor2, setGradientColor2] = useState('#022c22');
  const [gradientRotation, setGradientRotation] = useState(0);
  const [customCornerColor, setCustomCornerColor] = useState(false);
  const [cornerColor, setCornerColor] = useState('#047857');

  // --- Logo ---------------------------------------------------------------
  const [logoPreset, setLogoPreset] = useState('none');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(0.15);
  const [logoMargin, setLogoMargin] = useState(10);
  const [clearDots, setClearDots] = useState(true);
  const [logoError, setLogoError] = useState<string | null>(null);

  // --- Encoder ------------------------------------------------------------
  const [eccLevel, setEccLevel] = useState<EccLevel>('auto');
  const [exportSize, setExportSize] = useState(1024);
  const [quietZone, setQuietZone] = useState(4);

  // --- Machine ------------------------------------------------------------
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [moduleCount, setModuleCount] = useState(0);
  const [scan, setScan] = useState<ScanCheck>({ state: 'idle' });
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const qrContainerRef = useRef<HTMLDivElement | null>(null);
  const qrCodeRef = useRef<any>(null);
  const debounceRef = useRef<number | null>(null);

  const hasLogo = logoPreset !== 'none' || !!logoUrl;
  const activeLogo = logoPreset !== 'none' ? PRESET_LOGOS[logoPreset] : logoUrl;

  // ==========================================================================
  // Payload
  // ==========================================================================
  const data = useMemo(() => {
    switch (mode) {
      case 'url':
        return url || 'https://example.com';
      case 'text':
        return text || 'Plain text message';
      case 'wifi':
        return buildWifi({ ssid: wifiSsid || 'WiFi Network', password: wifiPassword, security: wifiSecurity });
      case 'email':
        return buildEmail({ address: emailAddress, subject: emailSubject, body: emailBody });
      case 'sms':
        return buildSms({ number: smsNumber, message: smsMessage });
      case 'tel':
        return buildTel(telNumber);
      case 'geo':
        return buildGeo(geoLat, geoLon);
      case 'vcard':
        return buildVCard(vcard);
      default:
        return '';
    }
  }, [
    mode, url, text, wifiSsid, wifiPassword, wifiSecurity,
    emailAddress, emailSubject, emailBody, smsNumber, smsMessage,
    telNumber, geoLat, geoLon, vcard,
  ]);

  const ecc = useMemo(() => resolveEcc(eccLevel, hasLogo, logoSize), [eccLevel, hasLogo, logoSize]);
  const bytes = useMemo(() => payloadBytes(data), [data]);
  const overflow = bytes > MAX_BYTES[ecc];

  const foreground = colorType === 'solid' ? dotsColor : gradientColor1;
  const effectiveBg = bgTransparent ? '#ffffff' : bgColor;
  const contrast = useMemo(() => contrastRatio(foreground, effectiveBg), [foreground, effectiveBg]);
  const inverted = useMemo(() => isInverted(foreground, effectiveBg), [foreground, effectiveBg]);
  const logoTooBig = hasLogo && !logoFitsEcc(logoSize, ecc);

  // ==========================================================================
  // Library
  // ==========================================================================
  useEffect(() => {
    let cancelled = false;
    import('qr-code-styling')
      .then(module => {
        if (cancelled) return;
        const QRCodeStyling = module.default;
        // 'svg' keeps the on-screen code crisp at any size; PNG/JPEG export still
        // works, the library builds a canvas on demand for those extensions.
        qrCodeRef.current = new QRCodeStyling({ type: 'svg', width: 1024, height: 1024, data: 'https://example.com' });
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !qrCodeRef.current || !qrContainerRef.current) return;
    qrContainerRef.current.innerHTML = '';
    qrCodeRef.current.append(qrContainerRef.current);
  }, [ready]);

  // Redrawing on every keystroke rasterises the whole code each time; a short
  // debounce keeps typing smooth without a perceptible lag in the preview.
  useEffect(() => {
    if (!ready || !qrCodeRef.current || overflow) return;

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      const cornerFill = customCornerColor ? cornerColor : foreground;
      try {
        qrCodeRef.current.update({
          width: exportSize,
          height: exportSize,
          // Quiet zone in real modules, not a guessed pixel count. The ISO spec
          // asks for 4; leaving it at the library default of 0 is what makes
          // codes fail against textured backgrounds.
          margin: Math.round((exportSize / Math.max(21, moduleCount || 33)) * quietZone),
          data,
          qrOptions: { errorCorrectionLevel: ecc },
          dotsOptions: {
            type: dotType,
            color: colorType === 'solid' ? dotsColor : undefined,
            gradient:
              colorType === 'gradient'
                ? {
                    type: gradientType,
                    colorStops: [
                      { offset: 0, color: gradientColor1 },
                      { offset: 1, color: gradientColor2 },
                    ],
                    rotation: (gradientRotation * Math.PI) / 180,
                  }
                : undefined,
          },
          backgroundOptions: { color: bgTransparent ? 'transparent' : bgColor },
          cornersSquareOptions: { type: cornerType, color: cornerFill },
          cornersDotOptions: { type: cornerDotType, color: cornerFill },
          image: activeLogo || undefined,
          imageOptions: {
            crossOrigin: 'anonymous',
            hideBackgroundDots: clearDots,
            imageSize: logoSize,
            margin: logoMargin,
          },
        });
        // Internal, but it is the only way to report the real version/quiet zone.
        const count = qrCodeRef.current?._qr?.getModuleCount?.();
        if (typeof count === 'number' && count !== moduleCount) setModuleCount(count);
        setScan({ state: 'idle' });
      } catch {
        // Capacity overflow and malformed colours used to escape from here and
        // take the whole island down.
        setScan({ state: 'fail', reason: 'undecodable' });
      }
    }, 180);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [
    ready, overflow, data, ecc, exportSize, quietZone, moduleCount,
    dotType, cornerType, cornerDotType, colorType, dotsColor, bgColor, bgTransparent,
    gradientType, gradientColor1, gradientColor2, gradientRotation,
    customCornerColor, cornerColor, foreground,
    activeLogo, logoSize, logoMargin, clearDots,
  ]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ==========================================================================
  // Logo intake
  // ==========================================================================
  const acceptLogo = useCallback(
    (file: File) => {
      setLogoError(null);
      if (!file.type.startsWith('image/')) return;
      if (file.size > MAX_LOGO_BYTES) {
        setLogoError(t.logoTooLarge || 'That image is over 2 MB. Use a smaller one.');
        return;
      }
      const reader = new FileReader();
      reader.onload = event => {
        if (!event.target?.result) return;
        setLogoPreset('none');
        setLogoUrl(event.target.result as string);
        setActiveTab('logo');
      };
      reader.readAsDataURL(file);
    },
    [t]
  );

  // A cutout from the background remover makes an ideal QR logo.
  useHandoffIntake(acceptLogo);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) acceptLogo(e.target.files[0]);
    e.target.value = '';
  };

  // ==========================================================================
  // Output
  // ==========================================================================
  const getBlob = useCallback(
    async (ext: 'png' | 'svg' | 'jpeg'): Promise<Blob | null> => {
      if (!qrCodeRef.current) return null;
      const raw = await qrCodeRef.current.getRawData(ext);
      return raw instanceof Blob ? raw : null;
    },
    []
  );

  const handleDownload = useCallback(
    async (ext: 'png' | 'svg' | 'jpeg') => {
      setDownloading(ext);
      try {
        const blob = await getBlob(ext);
        if (!blob) return;
        const href = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = href;
        a.download = `QRBolt-${mode}-${exportSize}.${ext === 'jpeg' ? 'jpg' : ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(href), 60_000);
      } finally {
        setDownloading(null);
      }
    },
    [getBlob, mode, exportSize]
  );

  const getHandoffResult = useCallback(async () => {
    const blob = await getBlob('png');
    return blob ? { blob, name: `QRBolt-${mode}-${exportSize}.png` } : null;
  }, [getBlob, mode, exportSize]);

  /**
   * Runs the exported PNG back through a real decoder. Deliberately manual:
   * it is the expensive step and the answer only means something once you have
   * finished styling.
   */
  const runScanCheck = useCallback(async () => {
    setScan({ state: 'checking' });
    try {
      const blob = await getBlob('png');
      if (!blob) {
        setScan({ state: 'fail', reason: 'undecodable', contrast });
        return;
      }
      const decoded = await decodeBlob(blob);
      if (decoded === null) {
        setScan({
          state: 'fail',
          contrast,
          reason: contrast < 3 ? 'lowContrast' : inverted ? 'inverted' : 'undecodable',
        });
      } else if (decoded !== data) {
        setScan({ state: 'fail', decoded, contrast, reason: 'mismatch' });
      } else if (contrast < 3) {
        // A software decoder works from a clean PNG with an adaptive threshold
        // and will happily read pale yellow on white. A phone camera in real
        // light will not, so a successful decode alone would be a lie.
        setScan({ state: 'fail', decoded, contrast, reason: 'lowContrast' });
      } else {
        setScan({ state: 'pass', decoded, contrast });
      }
    } catch {
      setScan({ state: 'fail', reason: 'undecodable', contrast });
    }
  }, [getBlob, data, contrast, inverted]);

  const handleReset = () => {
    setMode('url');
    setUrl('https://example.com');
    setText('');
    setWifiSsid('');
    setWifiPassword('');
    setWifiSecurity('WPA');
    setEmailAddress('');
    setEmailSubject('');
    setEmailBody('');
    setSmsNumber('');
    setSmsMessage('');
    setTelNumber('');
    setGeoLat('');
    setGeoLon('');
    setVcard(EMPTY_VCARD);
    setDotType('square');
    setCornerType('square');
    setCornerDotType('square');
    setColorType('solid');
    setDotsColor('#047857');
    setBgColor('#ffffff');
    setBgTransparent(false);
    setGradientColor1('#047857');
    setGradientColor2('#022c22');
    setGradientRotation(0);
    setGradientType('linear');
    setCustomCornerColor(false);
    setCornerColor('#047857');
    setLogoPreset('none');
    setLogoUrl(null);
    setLogoError(null);
    setLogoSize(0.15);
    setLogoMargin(10);
    setClearDots(true);
    setEccLevel('auto');
    setExportSize(1024);
    setQuietZone(4);
    setScan({ state: 'idle' });
    setActiveTab('content');
  };

  const handleLanguageChange = (newLang: string) => {
    window.location.href = `/${newLang.toLowerCase()}/qr-bolt`;
  };

  // ==========================================================================
  // Copy
  // ==========================================================================
  const modes = [
    { id: 'url' as QrMode, label: t.modeUrl || 'URL', icon: LinkIcon },
    { id: 'text' as QrMode, label: t.modeText || 'Text', icon: FileText },
    { id: 'wifi' as QrMode, label: t.modeWifi || 'WiFi', icon: Wifi },
    { id: 'email' as QrMode, label: t.modeEmail || 'Email', icon: Mail },
    { id: 'sms' as QrMode, label: t.modeSms || 'SMS', icon: MessageSquare },
    { id: 'tel' as QrMode, label: t.modeTel || 'Phone', icon: Phone },
    { id: 'vcard' as QrMode, label: t.modeVcard || 'Contact', icon: User },
    { id: 'geo' as QrMode, label: t.modeGeo || 'Location', icon: MapPin },
  ];

  const dotLabels: Record<DotType, string> = {
    square: t.shapeSquare || 'Square',
    rounded: t.shapeRounded || 'Rounded',
    dots: t.shapeDots || 'Dots',
    classy: t.shapeClassy || 'Classy',
    'classy-rounded': t.shapeClassyRounded || 'Classy rounded',
    'extra-rounded': t.shapeExtraRounded || 'Extra rounded',
  };

  const steps = [
    { art: StepPick, title: t.step1Title || 'Pick the payload', text: t.step1Text || 'Link, text, WiFi, contact card, phone, SMS, email or map location.' },
    { art: StepStyle, title: t.step2Title || 'Style it', text: t.step2Text || 'Shapes, gradients, transparent background and your own logo in the middle.' },
    { art: StepCheck, title: t.step3Title || 'Prove it scans', text: t.step3Text || 'The export is decoded back with a real reader and compared with your input.' },
    { art: StepDownload, title: t.step4Title || 'Export big', text: t.step4Text || 'Up to 2048 px PNG or infinite-resolution SVG, or straight to another tool.' },
  ];

  const featureIcons = [IconStyling, IconLocalQr, IconExport, IconVerify, IconPayloads, IconHandoff];
  const extraFeatures = t.extraFeatures || [
    { title: 'A readability check that is real', text: 'The exported image is decoded again with an actual QR reader, so "it scans" is a measurement, not a hope.' },
    { title: 'Every payload people ask for', text: 'vCard contacts, phone numbers, map coordinates, WiFi, SMS and email, each escaped to spec.' },
    { title: 'Chained with the suite', text: 'Send the code straight to compress, crop, convert or watermark, and drop a cutout in as its logo.' },
  ];

  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const keywords = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];

  const scanReasonText =
    scan.reason === 'lowContrast'
      ? t.scanLowContrast || 'The colours are too close together. Scanners threshold the image, so a dark pattern on a light background is what works.'
      : scan.reason === 'inverted'
        ? t.scanInverted || 'The code is light on dark. Many readers refuse inverted codes — swap the two colours.'
        : scan.reason === 'mismatch'
          ? t.scanMismatch || 'It decoded to something different from your input.'
          : t.scanUndecodable || 'No reader could find a code in the export. Shrink the logo, raise the error correction, or increase the contrast.';

  return (
    <div className="min-h-screen flex flex-col bg-[#050907] text-slate-100 selection:bg-emerald-500/30 overflow-x-hidden font-sans">
      <Header currentLang={lang} onLanguageChange={handleLanguageChange} onReset={handleReset} t={t} />

      {/* The max width lives on <main> on purpose: AdRail measures this element
          to decide whether the fixed side rails fit. */}
      <main className="flex-1 flex flex-col items-center pt-36 pb-32 px-4 md:px-12 relative z-10 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))]">
        <AdBanner id="adsense-qr-bolt-top" />

        <div className="w-full space-y-20 md:space-y-28">
          {/* ================================================================ */}
          {/* Hero                                                             */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center pt-2">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-emerald-950/40 border border-emerald-800/30 text-emerald-400 text-[11px] font-black tracking-[0.2em] uppercase shadow-[0_0_25px_rgba(16,185,129,0.15)]">
                <QrCode className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.badge || t.title}</span>
              </div>

              <h1 className="text-4xl md:text-6xl xl:text-7xl font-black tracking-tight leading-[0.95] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-400">
                {t.title}
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">{t.description}</p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {(t.seoHeroList || []).slice(0, 3).map((point: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                    {point}
                  </span>
                ))}
              </div>

              <a
                href={`/${lang.toLowerCase()}/qr-reader/`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold transition-all"
              >
                <ScanLine className="w-4 h-4" />
                {t.readerCta || 'Need to read a QR instead? Open the QR reader'}
              </a>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/10 blur-[80px] rounded-full" />
              <QrHeroArt className="relative w-full max-w-sm mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]" animated={!prefersReduced} />
            </div>
          </section>

          {/* ================================================================ */}
          {/* Workspace                                                        */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-5">
              <div className="flex p-1 rounded-2xl bg-[#0a140f]/80 border border-white/5 gap-1 w-full">
                {[
                  { id: 'content', label: t.tabContent, icon: FileText },
                  { id: 'design', label: t.tabDesign, icon: Palette },
                  { id: 'logo', label: t.tabLogo, icon: ImageIcon },
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="glass-card rounded-3xl p-5 md:p-7 text-left space-y-6 min-h-[420px]">
                {/* ---------------------------------------------------------- */}
                {activeTab === 'content' && (
                  <div className="space-y-6">
                    <Field label={t.labelMode}>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {modes.map(item => {
                          const Icon = item.icon;
                          const selected = mode === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => setMode(item.id)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 h-16 ${
                                selected
                                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400'
                                  : 'bg-[#0b120e]/40 border-white/5 text-slate-400 hover:text-white'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              <span className="text-[10px] font-bold tracking-tight truncate max-w-full">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </Field>

                    {mode === 'url' && (
                      <Field label={t.modeUrl}>
                        <TextInput value={url} onChange={setUrl} placeholder={t.placeholderUrl} />
                      </Field>
                    )}

                    {mode === 'text' && (
                      <Field label={t.modeText}>
                        <TextArea value={text} onChange={setText} placeholder={t.placeholderText} rows={5} />
                      </Field>
                    )}

                    {mode === 'wifi' && (
                      <div className="space-y-4">
                        <Field label={t.labelWifiSsid}>
                          <TextInput value={wifiSsid} onChange={setWifiSsid} placeholder={t.placeholderWifiSsid} />
                        </Field>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Field label={t.labelWifiPassword}>
                            <input
                              type="password"
                              value={wifiPassword}
                              disabled={wifiSecurity === 'nopass'}
                              onChange={e => setWifiPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full bg-[#080d0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500 font-mono disabled:opacity-40"
                            />
                          </Field>
                          <Field label={t.labelWifiSecurity}>
                            <Select value={wifiSecurity} onChange={v => setWifiSecurity(v as any)}>
                              <option value="WPA">WPA/WPA2/WPA3</option>
                              <option value="WEP">WEP</option>
                              <option value="nopass">{t.wifiOpen || 'Open (no password)'}</option>
                            </Select>
                          </Field>
                        </div>
                      </div>
                    )}

                    {mode === 'email' && (
                      <div className="space-y-4">
                        <Field label={t.labelEmailAddress}>
                          <TextInput value={emailAddress} onChange={setEmailAddress} placeholder={t.placeholderEmail} />
                        </Field>
                        <Field label={t.labelEmailSubject}>
                          <TextInput value={emailSubject} onChange={setEmailSubject} placeholder={t.placeholderSubject} />
                        </Field>
                        <Field label={t.labelEmailBody}>
                          <TextArea value={emailBody} onChange={setEmailBody} placeholder={t.placeholderBody} rows={3} />
                        </Field>
                      </div>
                    )}

                    {mode === 'sms' && (
                      <div className="space-y-4">
                        <Field label={t.labelSmsNumber}>
                          <TextInput value={smsNumber} onChange={setSmsNumber} placeholder={t.placeholderPhone} mono />
                        </Field>
                        <Field label={t.labelSmsMessage}>
                          <TextArea value={smsMessage} onChange={setSmsMessage} placeholder={t.placeholderSms} rows={3} />
                        </Field>
                      </div>
                    )}

                    {mode === 'tel' && (
                      <Field label={t.labelTelNumber || t.labelSmsNumber}>
                        <TextInput value={telNumber} onChange={setTelNumber} placeholder={t.placeholderPhone} mono />
                      </Field>
                    )}

                    {mode === 'geo' && (
                      <div className="grid grid-cols-2 gap-4">
                        <Field label={t.labelLatitude || 'Latitude'}>
                          <TextInput value={geoLat} onChange={setGeoLat} placeholder="40.4168" mono />
                        </Field>
                        <Field label={t.labelLongitude || 'Longitude'}>
                          <TextInput value={geoLon} onChange={setGeoLon} placeholder="-3.7038" mono />
                        </Field>
                      </div>
                    )}

                    {mode === 'vcard' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(
                          [
                            ['firstName', t.labelFirstName || 'First name'],
                            ['lastName', t.labelLastName || 'Last name'],
                            ['organization', t.labelOrganization || 'Organisation'],
                            ['jobTitle', t.labelJobTitle || 'Job title'],
                            ['phone', t.labelTelNumber || 'Phone'],
                            ['email', t.labelEmailAddress || 'Email'],
                            ['website', t.labelWebsite || 'Website'],
                            ['address', t.labelAddress || 'Address'],
                          ] as [keyof VCardConfig, string][]
                        ).map(([key, label]) => (
                          <Field key={key} label={label}>
                            <TextInput
                              value={vcard[key]}
                              onChange={v => setVcard(prev => ({ ...prev, [key]: v }))}
                            />
                          </Field>
                        ))}
                      </div>
                    )}

                    {/* Capacity meter */}
                    <div className="rounded-2xl border border-white/5 bg-black/30 p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-500">{t.labelCapacity || 'Payload'}</span>
                        <span className={overflow ? 'text-red-400' : 'text-emerald-400'}>
                          {bytes} / {MAX_BYTES[ecc]} {t.unitBytes || 'bytes'}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${overflow ? 'bg-red-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, (bytes / MAX_BYTES[ecc]) * 100)}%` }}
                        />
                      </div>
                      {overflow && (
                        <p className="text-[11px] font-bold text-red-400 leading-snug">
                          {t.capacityOverflow ||
                            'Too much data for a QR code at this error-correction level. Shorten it, or drop to a lower level.'}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------------- */}
                {activeTab === 'design' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Field label={t.labelDotType}>
                        <Select value={dotType} onChange={v => setDotType(v as DotType)}>
                          {(Object.keys(dotLabels) as DotType[]).map(k => (
                            <option key={k} value={k}>
                              {dotLabels[k]}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label={t.labelCornerType}>
                        <Select value={cornerType} onChange={v => setCornerType(v as CornerType)}>
                          <option value="square">{dotLabels.square}</option>
                          <option value="rounded">{dotLabels.rounded}</option>
                          <option value="dot">{t.shapeDot || 'Dot'}</option>
                          <option value="extra-rounded">{dotLabels['extra-rounded']}</option>
                        </Select>
                      </Field>
                      <Field label={t.labelCornerDotType}>
                        <Select value={cornerDotType} onChange={v => setCornerDotType(v as CornerDotType)}>
                          <option value="square">{dotLabels.square}</option>
                          <option value="rounded">{dotLabels.rounded}</option>
                          <option value="dot">{t.shapeDot || 'Dot'}</option>
                        </Select>
                      </Field>
                    </div>

                    <div className="border-t border-white/5 pt-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {t.labelColorType}
                        </span>
                        <div className="flex bg-[#080d0a] p-1 border border-white/5 rounded-xl gap-1">
                          {[
                            { id: 'solid', label: t.colorSolid },
                            { id: 'gradient', label: t.colorGradient },
                          ].map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => setColorType(opt.id as ColorType)}
                              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                colorType === opt.id ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ColorSwatch
                          label={t.labelBgColor}
                          value={bgColor}
                          onChange={setBgColor}
                          disabled={bgTransparent}
                        />
                        {colorType === 'solid' && (
                          <ColorSwatch label={t.labelMainColor} value={dotsColor} onChange={setDotsColor} />
                        )}
                      </div>

                      <label className="flex items-center gap-2.5 text-[11px] font-bold text-slate-400 hover:text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bgTransparent}
                          onChange={e => setBgTransparent(e.target.checked)}
                          className="accent-emerald-500 w-3.5 h-3.5 cursor-pointer"
                        />
                        {t.labelTransparentBg || 'Transparent background (PNG and SVG only)'}
                      </label>

                      {colorType === 'gradient' && (
                        <div className="p-4 bg-[#080d0a]/40 border border-white/5 rounded-2xl space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <ColorSwatch label={t.labelGradientColor1} value={gradientColor1} onChange={setGradientColor1} />
                            <ColorSwatch label={t.labelGradientColor2} value={gradientColor2} onChange={setGradientColor2} />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                            <Field label={t.labelGradientType}>
                              <Select value={gradientType} onChange={v => setGradientType(v as GradientType)}>
                                <option value="linear">{t.gradLinear}</option>
                                <option value="radial">{t.gradRadial}</option>
                              </Select>
                            </Field>
                            {gradientType === 'linear' && (
                              <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                  <span>{t.labelGradientRotation}</span>
                                  <span className="text-emerald-400">{gradientRotation}°</span>
                                </div>
                                <input
                                  type="range"
                                  min={0}
                                  max={360}
                                  value={gradientRotation}
                                  onChange={e => setGradientRotation(Number(e.target.value))}
                                  className="w-full accent-emerald-500 cursor-pointer"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="border-t border-white/5 pt-4 space-y-3">
                        <label className="flex items-center gap-2.5 text-[11px] font-bold text-slate-400 hover:text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={customCornerColor}
                            onChange={e => setCustomCornerColor(e.target.checked)}
                            className="accent-emerald-500 w-3.5 h-3.5 cursor-pointer"
                          />
                          {t.labelCustomCorners || 'Colour the three finder corners separately'}
                        </label>
                        {customCornerColor && (
                          <ColorSwatch label={t.labelCornerColor || 'Corner colour'} value={cornerColor} onChange={setCornerColor} />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------------- */}
                {activeTab === 'logo' && (
                  <div className="space-y-6">
                    <Field label={t.labelPresetLogo}>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {[
                          { id: 'none', label: t.logoPresetNone },
                          { id: 'whatsapp', label: 'WA' },
                          { id: 'instagram', label: 'IG' },
                          { id: 'youtube', label: 'YT' },
                          { id: 'facebook', label: 'FB' },
                          { id: 'twitter', label: 'X' },
                          { id: 'github', label: 'GH' },
                          { id: 'linkedin', label: 'IN' },
                        ].map(brand => (
                          <button
                            key={brand.id}
                            onClick={() => {
                              setLogoPreset(brand.id);
                              setLogoUrl(null);
                              setLogoError(null);
                            }}
                            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center font-black text-[11px] h-12 truncate ${
                              logoPreset === brand.id
                                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400'
                                : 'bg-[#0b120e]/40 border-white/5 text-slate-500 hover:text-white'
                            }`}
                          >
                            {brand.label}
                          </button>
                        ))}
                      </div>
                    </Field>

                    <div className="border-t border-white/5 pt-5 space-y-3">
                      <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {t.labelUploadLogo}
                      </span>
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all active:scale-95">
                          {t.browseBtn || 'Browse…'}
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                        {logoUrl && (
                          <div className="flex items-center gap-2">
                            <img src={logoUrl} alt="" className="w-10 h-10 object-contain rounded border border-white/10 bg-white/5 p-0.5" />
                            <button
                              onClick={() => setLogoUrl(null)}
                              className="text-xs text-red-400 hover:text-red-300 font-bold uppercase transition-colors cursor-pointer"
                            >
                              {t.removeBtn || 'Remove'}
                            </button>
                          </div>
                        )}
                      </div>
                      {logoError && <p className="text-[11px] font-bold text-red-400">{logoError}</p>}
                    </div>

                    {hasLogo && (
                      <div className="border-t border-white/5 pt-5 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <Slider
                            label={t.labelLogoSize}
                            value={logoSize}
                            display={`${Math.round(logoSize * 100)}%`}
                            min={0.05}
                            max={0.35}
                            step={0.01}
                            onChange={setLogoSize}
                          />
                          <Slider
                            label={t.labelLogoMargin}
                            value={logoMargin}
                            display={`${logoMargin}px`}
                            min={0}
                            max={30}
                            step={1}
                            onChange={setLogoMargin}
                          />
                        </div>

                        {logoTooBig && (
                          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-3">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] font-bold text-amber-300 leading-snug">
                              {t.logoOverEcc ||
                                'This logo covers more of the pattern than the error correction can rebuild. Raise the level to H, or shrink the logo.'}
                            </p>
                          </div>
                        )}

                        <label className="flex items-center gap-2.5 text-[11px] font-bold text-slate-400 hover:text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={clearDots}
                            onChange={e => setClearDots(e.target.checked)}
                            className="accent-emerald-500 w-3.5 h-3.5 cursor-pointer"
                          />
                          {t.labelClearDots}
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Encoder panel */}
              <div className="glass-card rounded-3xl p-5 md:p-6 space-y-5 text-left">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  {t.encoderTitle || 'Encoding'}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label={t.labelEcc || 'Error correction'}>
                    <Select value={eccLevel} onChange={v => setEccLevel(v as EccLevel)}>
                      {ECC_LEVELS.map(level => (
                        <option key={level} value={level}>
                          {level === 'auto' ? `${t.eccAuto || 'Auto'} (${ecc})` : `${level} · ${{ L: '7%', M: '15%', Q: '25%', H: '30%' }[level]}`}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={t.labelExportSize || 'Export size'}>
                    <Select value={String(exportSize)} onChange={v => setExportSize(Number(v))}>
                      {EXPORT_SIZES.map(size => (
                        <option key={size} value={size}>
                          {size} × {size} px
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={t.labelQuietZone || 'Quiet zone'}>
                    <Select value={String(quietZone)} onChange={v => setQuietZone(Number(v))}>
                      <option value="0">0 {t.unitModules || 'modules'}</option>
                      <option value="2">2 {t.unitModules || 'modules'}</option>
                      <option value="4">4 {t.unitModules || 'modules'} · ISO</option>
                      <option value="6">6 {t.unitModules || 'modules'}</option>
                    </Select>
                  </Field>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-bold text-slate-500 border-t border-white/5 pt-3">
                  {moduleCount > 0 && (
                    <span>
                      {t.statVersion || 'Version'}{' '}
                      <span className="text-slate-300 font-mono">
                        {Math.max(1, (moduleCount - 17) / 4)} · {moduleCount}×{moduleCount}
                      </span>
                    </span>
                  )}
                  <span>
                    {t.statContrast || 'Contrast'}{' '}
                    <span className={contrast >= 3 ? 'text-emerald-400 font-mono' : 'text-red-400 font-mono'}>
                      {contrast.toFixed(1)}:1
                    </span>
                  </span>
                  {inverted && <span className="text-amber-400">{t.statInverted || 'inverted'}</span>}
                </div>
              </div>
            </div>

            {/* Preview column */}
            <div className="lg:col-span-5 space-y-5">
              <div className="glass-card rounded-3xl p-5 md:p-7 space-y-6 flex flex-col items-center">
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest self-start">
                  {t.previewTitle || 'Live preview'}
                </h2>

                <div className="relative w-full flex justify-center">
                  <div className="absolute inset-0 bg-emerald-500/5 blur-xl rounded-full scale-110 pointer-events-none" />
                  <div className="p-3 bg-[#080d0a] border border-white/10 rounded-2xl relative z-10">
                    {loadError ? (
                      <div className="w-[260px] h-[260px] flex items-center justify-center text-center text-xs font-bold text-red-400 px-6">
                        {t.statusError}
                      </div>
                    ) : (
                      <div
                        ref={qrContainerRef}
                        className={`w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] rounded-lg overflow-hidden flex items-center justify-center [&>svg]:w-full [&>svg]:h-full ${
                          bgTransparent
                            ? 'bg-[repeating-conic-gradient(#1a2420_0_25%,#0f1613_0_50%)] bg-[length:16px_16px]'
                            : 'bg-white'
                        }`}
                      />
                    )}
                  </div>
                </div>

                {/* Scan check — deliberately manual */}
                <div className="w-full space-y-3">
                  <button
                    onClick={runScanCheck}
                    disabled={!ready || overflow || scan.state === 'checking'}
                    className="w-full py-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {scan.state === 'checking' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ScanLine className="w-4 h-4" />
                    )}
                    {t.checkScanBtn || 'Check that it scans'}
                  </button>

                  {scan.state === 'pass' && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-emerald-300 uppercase tracking-wider">
                          {t.scanPass || 'Decoded back correctly'}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium break-all mt-0.5 line-clamp-2">
                          {scan.decoded}
                        </p>
                      </div>
                    </div>
                  )}

                  {scan.state === 'fail' && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-3">
                      <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-red-300 uppercase tracking-wider">
                          {t.scanFail || 'It does not scan'}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-snug">{scanReasonText}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-full space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleDownload('png')}
                      disabled={!ready || overflow || downloading !== null}
                      className="py-3.5 bg-emerald-600 hover:bg-emerald-500 text-black font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {downloading === 'png' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 stroke-[2.5]" />}
                      {t.downloadBtnPng}
                    </button>
                    <button
                      onClick={() => handleDownload('svg')}
                      disabled={!ready || overflow || downloading !== null}
                      className="py-3.5 border border-white/10 hover:border-emerald-500/40 hover:bg-white/5 text-white font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {downloading === 'svg' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      {t.downloadBtnSvg}
                    </button>
                  </div>
                  <button
                    onClick={() => handleDownload('jpeg')}
                    disabled={!ready || overflow || downloading !== null || bgTransparent}
                    className="w-full py-2.5 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {t.downloadBtnJpg}
                  </button>

                  <button
                    onClick={handleReset}
                    className="w-full py-2.5 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {t.resetBtn}
                  </button>
                </div>

                <div className="w-full border-t border-white/5 pt-4 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-bold text-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/70 shrink-0" />
                  <span>{t.localNote || 'Built in your browser. No scan tracking, no redirect service.'}</span>
                </div>
              </div>

              <NextStepBar lang={lang} t={t} getResult={getHandoffResult} />
            </div>
          </section>

          {/* ================================================================ */}
          {/* How it works                                                     */}
          {/* ================================================================ */}
          <section className="space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {t.howItWorksTitle || 'How it works'}
              </h2>
              <div className="h-1 w-16 bg-emerald-500 mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step, i) => {
                const Art = step.art;
                return (
                  <div
                    key={i}
                    className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-emerald-500/20 transition-all group"
                  >
                    <span className="absolute top-5 right-6 text-5xl font-black text-white/5 group-hover:text-emerald-500/10 transition-colors">
                      {i + 1}
                    </span>
                    <Art className="w-24 h-auto text-emerald-400" />
                    <h3 className="text-base font-bold text-white leading-snug">{step.title}</h3>
                    <p className="text-slate-500 text-[13px] leading-relaxed font-medium">{step.text}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ================================================================ */}
          {/* Features                                                         */}
          {/* ================================================================ */}
          <motion.section
            initial={prefersReduced ? false : 'hidden'}
            whileInView={prefersReduced ? undefined : 'visible'}
            viewport={{ once: true, amount: 0.15 }}
            variants={fadeInUp}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[...(t.features || []), ...extraFeatures].map((feature: any, idx: number) => {
              const Icon = featureIcons[idx] || IconStyling;
              return (
                <div
                  key={idx}
                  className="p-7 glass-card rounded-3xl text-left hover:-translate-y-1.5 transition-all duration-300 group border border-white/5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 group-hover:border-emerald-500/40 transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-white text-lg font-bold mb-2.5 group-hover:text-emerald-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.text}</p>
                </div>
              );
            })}
          </motion.section>

          {/* ================================================================ */}
          {/* SEO content                                                      */}
          {/* ================================================================ */}
          <section className="space-y-24 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-center">
              <div className="space-y-7">
                <div className="inline-block px-4 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-black uppercase tracking-[0.2em] border border-emerald-500/20">
                  {keywords[0]}
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.05] tracking-tighter">
                  {t.seoHeroTitle}
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed font-medium">{t.seoHeroText}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(t.seoHeroList || []).map((point: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all"
                    >
                      <span className="w-7 h-7 shrink-0 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <span className="text-slate-300 font-bold text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative glass-card rounded-[3rem] p-10 py-16 min-h-[400px] flex flex-col items-center justify-center gap-7 text-center overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl" />
                <IconVerify className="w-20 h-20 text-emerald-400 relative" />
                <div className="space-y-3 max-w-sm relative">
                  <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
                    {t.seoBrowserSpeedTitle}
                  </h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoBrowserSpeedText}</p>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-14 rounded-3xl md:rounded-[2.5rem] bg-[#07130e] border border-white/5 space-y-10">
              <div className="max-w-4xl space-y-4">
                <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">{t.seoSecondaryTitle}</h2>
                <div className="h-1.5 w-20 bg-emerald-500 rounded-full" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                    <span className="w-6 h-px bg-white/20" />
                    {t.seoUseCaseTitle}
                  </div>
                  <p className="text-slate-400 text-base leading-relaxed font-medium">{t.seoUseCaseText}</p>
                </div>
                <div className="space-y-3">
                  <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                    <span className="w-6 h-px bg-white/20" />
                    {t.seoPrivacyTitle}
                  </div>
                  <p className="text-slate-400 text-base leading-relaxed font-medium">{t.seoPrivacyText}</p>
                </div>
              </div>

              <a
                href={`/${lang.toLowerCase()}/qr-reader/`}
                className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-black font-black text-xs uppercase tracking-wider transition-all"
              >
                <ScanLine className="w-4 h-4" />
                {t.readerCtaLong || 'Read a QR code instead'}
              </a>
            </div>

            {/* FAQ */}
            {faqs.length > 0 && (
              <div className="max-w-4xl mx-auto w-full space-y-10">
                <div className="text-center space-y-3">
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                  <div className="h-1 w-16 bg-emerald-500 mx-auto rounded-full" />
                </div>
                <div className="grid gap-3">
                  {faqs.map((faq: any, idx: number) => (
                    <details
                      key={idx}
                      className="glass-card rounded-2xl px-6 py-5 text-left border border-white/5 hover:border-emerald-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex items-start gap-3 cursor-pointer list-none text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                        <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-[11px] font-black">
                          Q
                        </span>
                        <span className="flex-1">{faq.question}</span>
                        <span className="shrink-0 text-emerald-400 transition-transform group-open:rotate-45 text-xl leading-none">
                          +
                        </span>
                      </summary>
                      <p className="text-slate-400 leading-relaxed pl-9 pt-3 text-sm">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {keywords.length > 0 && (
              <div className="max-w-4xl mx-auto w-full space-y-5 opacity-55 text-center">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                  {t.seoKeywordsTitle}
                </h2>
                <div className="flex flex-wrap justify-center gap-2">
                  {keywords.map((keyword: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400 transition-all cursor-default"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <AdBanner id="adsense-qr-bolt-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={setActiveModal} />

      <LegalModal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title={activeModal === 'privacy' ? t.privacyPolicy : activeModal === 'terms' ? t.termsOfService : t.cookiePolicy}
        content={
          activeModal === 'privacy' ? t.privacyContent : activeModal === 'terms' ? t.termsContent : t.cookiesContent
        }
        t={t}
      />

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t.scrollTopLabel || 'Back to top'}
          className="fixed bottom-8 right-8 z-[200] w-12 h-12 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-2">
    <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    {children}
  </div>
);

const TextInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}> = ({ value, onChange, placeholder, mono }) => (
  <input
    type="text"
    value={value}
    placeholder={placeholder}
    onChange={e => onChange(e.target.value)}
    className={`w-full bg-[#080d0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500 ${
      mono ? 'font-mono' : 'font-medium'
    }`}
  />
);

const TextArea: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows: number;
}> = ({ value, onChange, placeholder, rows }) => (
  <textarea
    value={value}
    rows={rows}
    placeholder={placeholder}
    onChange={e => onChange(e.target.value)}
    className="w-full bg-[#080d0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500 font-medium resize-none"
  />
);

const Select: React.FC<{
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ value, onChange, disabled, children }) => (
  <select
    value={value}
    disabled={disabled}
    onChange={e => onChange(e.target.value)}
    className="w-full bg-[#080d0a] border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-200 outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-40"
  >
    {children}
  </select>
);

const ColorSwatch: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}> = ({ label, value, onChange, disabled }) => (
  <div
    className={`p-3.5 bg-[#080d0a]/60 border border-white/5 rounded-2xl flex items-center justify-between gap-3 ${
      disabled ? 'opacity-40' : ''
    }`}
  >
    <div className="min-w-0">
      <span className="text-xs font-bold text-white block truncate">{label}</span>
      <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{value.toUpperCase()}</span>
    </div>
    <input
      type="color"
      value={value}
      disabled={disabled}
      onChange={e => onChange(e.target.value)}
      className="w-10 h-10 border-0 outline-none cursor-pointer rounded-lg bg-transparent shrink-0 disabled:cursor-not-allowed"
    />
  </div>
);

const Slider: React.FC<{
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}> = ({ label, value, display, min, max, step, onChange }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
      <span className="truncate">{label}</span>
      <span className="text-emerald-400 shrink-0">{display}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full accent-emerald-500 cursor-pointer"
    />
  </div>
);

export default Qrbolt;
