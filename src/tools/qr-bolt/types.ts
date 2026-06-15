export type QrMode = 'url' | 'text' | 'wifi' | 'email' | 'sms';

export type DotType = 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'extra-rounded';

export type CornerType = 'square' | 'dot' | 'rounded' | 'extra-rounded';

export type CornerDotType = 'square' | 'dot' | 'rounded';

export type ColorType = 'solid' | 'gradient';

export type GradientType = 'linear' | 'radial';

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
