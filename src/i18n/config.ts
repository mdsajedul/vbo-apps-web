import { LocaleMetadata, SupportedLocale } from './types';

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export const SUPPORTED_LOCALES: Record<SupportedLocale, LocaleMetadata> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'ENG',
    flag: '🇺🇸',
    dir: 'ltr',
    enabled: true,
  },
  bn: {
    code: 'bn',
    name: 'Bangla',
    nativeName: 'বাংলা',
    flag: '🇧🇩',
    dir: 'ltr',
    enabled: true,
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    dir: 'rtl',
    enabled: false, // Future phase
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    dir: 'ltr',
    enabled: false, // Future phase
  },
};

export const ACTIVE_LOCALES: LocaleMetadata[] = Object.values(SUPPORTED_LOCALES).filter(
  (locale) => locale.enabled
);
