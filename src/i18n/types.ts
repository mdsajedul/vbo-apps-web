export type SupportedLocale = 'en' | 'bn' | 'ar' | 'hi';

export type LocaleDirection = 'ltr' | 'rtl';

export interface LocaleMetadata {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  flag: string;
  dir: LocaleDirection;
  enabled: boolean;
}

export type TranslationParams = Record<string, string | number>;

export type TranslationDictionary = {
  common: Record<string, string>;
  nav: Record<string, string>;
  auth: Record<string, string>;
  pos: Record<string, string>;
  header: Record<string, string>;
  [namespace: string]: Record<string, string>;
};
