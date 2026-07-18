
export type LanguageCode = 'GB' | 'ES' | 'IN' | 'DE' | 'FR' | 'BR' | 'RU' | 'JP' | 'CN';

export interface FeatureTranslation {
  title: string;
  text: string;
}

export interface SEOBlock {
  title: string;
  text: string;
  list?: string[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface TranslationSet {
  title: string;
  description: string;
  pastePrompt: string;
  downloadBtn: string;
  downloadAllBtn: string;
  clearBtn: string;
  convertBtn: string;
  moreFormats?: string;
  dropHere?: string;
  noImageFound: string;
  pastedAt: string;
  onlineClipboardUtility: string;
  autoPasteActive: string;
  windowInactive: string;
  waitingForImage: string;
  imagesInCollection: string;
  pasteMore: string;
  features: FeatureTranslation[];
  footerCredit: string;
  // New informational translations
  seoHeroTitle: string;
  seoHeroText: string;
  seoHeroList: string[];
  seoBrowserSpeedTitle: string;
  seoBrowserSpeedText: string;
  seoSecondaryTitle: string;
  seoKeywordsTitle: string;
  seoKeywords: string[];
  seoUseCaseTitle: string;
  seoUseCaseText: string;
  seoPrivacyTitle: string;
  seoPrivacyText: string;
  faqTitle: string;
  faq: FAQItem[];
  footerTagline: string;
  privacyPolicy: string;
  termsOfService: string;
  cookiePolicy: string;
  cookieConsentMessage: string;
  acceptCookies: string;
  contactForIdeas: string;
  emailCopied: string;
  emailAddress: string;
  privacyContent: string;
  termsContent: string;
  cookiesContent: string;
  contact: string;
}

export interface PastedImage {
  id: string;
  url: string;
  blob: Blob;
  name: string;
  timestamp: Date;
  width?: number;
  height?: number;
  size?: number;
  type?: string;
}
