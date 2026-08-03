export type QrMode = 'url' | 'text' | 'wifi' | 'email' | 'sms' | 'tel' | 'vcard' | 'geo';

export type DotType = 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'extra-rounded';

export type CornerType = 'square' | 'dot' | 'rounded' | 'extra-rounded';

export type CornerDotType = 'square' | 'dot' | 'rounded';

export type ColorType = 'solid' | 'gradient';

export type GradientType = 'linear' | 'radial';

/**
 * Recovery capacity of the code. `auto` is the useful default: it picks H when a
 * logo covers part of the pattern and M otherwise, so the modules stay as large
 * as they can be without making the code unreadable.
 */
export type EccLevel = 'auto' | 'L' | 'M' | 'Q' | 'H';

export interface WiFiConfig {
  ssid: string;
  password?: string;
  security: 'WEP' | 'WPA' | 'nopass';
}

export interface EmailConfig {
  address: string;
  subject?: string;
  body?: string;
}

export interface SmsConfig {
  number: string;
  message?: string;
}

export interface VCardConfig {
  firstName: string;
  lastName: string;
  organization: string;
  jobTitle: string;
  phone: string;
  email: string;
  website: string;
  address: string;
}

/** Result of decoding the rendered code back with jsQR. */
export interface ScanCheck {
  state: 'idle' | 'checking' | 'pass' | 'fail';
  /** What the decoder actually read back, so you can compare it with the input. */
  decoded?: string;
  /** WCAG-style contrast ratio between the darkest module and the background. */
  contrast?: number;
  reason?: 'undecodable' | 'mismatch' | 'lowContrast' | 'inverted';
}
