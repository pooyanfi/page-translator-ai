const AIPT = globalThis.AIPT || {};

AIPT.LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', rtl: false, english: 'English' },
  { code: 'fa', name: 'Persian (Farsi) \u0641\u0627\u0631\u0633\u06cc', native: '\u0641\u0627\u0631\u0633\u06cc', rtl: true, english: 'Persian' },
  { code: 'ar', name: 'Arabic \u0627\u0644\u0639\u0631\u0628\u064a\u0629', native: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629', rtl: true, english: 'Arabic' },
  { code: 'he', name: 'Hebrew \u05e2\u05d1\u05e8\u05d9\u05ea', native: '\u05e2\u05d1\u05e8\u05d9\u05ea', rtl: true, english: 'Hebrew' },
  { code: 'ur', name: 'Urdu \u0627\u0631\u062f\u0648', native: '\u0627\u0631\u062f\u0648', rtl: true, english: 'Urdu' },
  { code: 'es', name: 'Spanish \u00b7 Espa\u00f1ol', native: 'Espa\u00f1ol', rtl: false, english: 'Spanish' },
  { code: 'fr', name: 'French \u00b7 Fran\u00e7ais', native: 'Fran\u00e7ais', rtl: false, english: 'French' },
  { code: 'de', name: 'German \u00b7 Deutsch', native: 'Deutsch', rtl: false, english: 'German' },
  { code: 'zh-CN', name: 'Chinese (Simplified) \u00b7 \u4e2d\u6587\u7b80\u4f53', native: '\u4e2d\u6587\u7b80\u4f53', rtl: false, english: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional) \u00b7 \u4e2d\u6587\u7e41\u9ad4', native: '\u4e2d\u6587\u7e41\u9ad4', rtl: false, english: 'Chinese (Traditional)' },
  { code: 'ja', name: 'Japanese \u00b7 \u65e5\u672c\u8a9e', native: '\u65e5\u672c\u8a9e', rtl: false, english: 'Japanese' },
  { code: 'ko', name: 'Korean \u00b7 \ud55c\uad6d\uc5b4', native: '\ud55c\uad6d\uc5b4', rtl: false, english: 'Korean' },
  { code: 'ru', name: 'Russian \u00b7 \u0420\u0443\u0441\u0441\u043a\u0438\u0439', native: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439', rtl: false, english: 'Russian' },
  { code: 'tr', name: 'Turkish \u00b7 T\u00fcrk\u00e7e', native: 'T\u00fcrk\u00e7e', rtl: false, english: 'Turkish' },
  { code: 'it', name: 'Italian \u00b7 Italiano', native: 'Italiano', rtl: false, english: 'Italian' },
  { code: 'pt', name: 'Portuguese \u00b7 Portugu\u00eas', native: 'Portugu\u00eas', rtl: false, english: 'Portuguese' },
  { code: 'nl', name: 'Dutch \u00b7 Nederlands', native: 'Nederlands', rtl: false, english: 'Dutch' },
  { code: 'pl', name: 'Polish \u00b7 Polski', native: 'Polski', rtl: false, english: 'Polish' },
  { code: 'vi', name: 'Vietnamese \u00b7 Ti\u1ebfng Vi\u1ec7t', native: 'Ti\u1ebfng Vi\u1ec7t', rtl: false, english: 'Vietnamese' },
  { code: 'th', name: 'Thai \u00b7 \u0e44\u0e17\u0e22', native: '\u0e44\u0e17\u0e22', rtl: false, english: 'Thai' },
  { code: 'hi', name: 'Hindi \u00b7 \u0939\u093f\u0928\u094d\u0926\u0940', native: '\u0939\u093f\u0928\u094d\u0926\u0940', rtl: false, english: 'Hindi' },
  { code: 'id', name: 'Indonesian \u00b7 Bahasa Indonesia', native: 'Bahasa Indonesia', rtl: false, english: 'Indonesian' }
];

AIPT.LANGUAGE_MAP = {};
for (const lang of AIPT.LANGUAGES) AIPT.LANGUAGE_MAP[lang.code] = lang;

AIPT.defaultTargetLanguage = 'fa';

AIPT.DEFAULT_SETTINGS = {
  provider: 'openai',
  apiKey: '',
  model: '',
  baseUrl: '',
  targetLanguage: 'fa',
  sourceLanguage: 'auto',
  qualityMode: false,
  glossary: {},
  autoTranslate: false,
  style: 'natural',
  sitePrefs: {}
};

AIPT.languageName = function(code) {
  const lang = AIPT.LANGUAGE_MAP[code];
  return lang ? lang.english : code;
};

/* The native name makes the prompt unambiguous for models that know a language
 * better by its own script, e.g. "Persian (Farsi) — فارسی". */
AIPT.languageNative = function(code) {
  const lang = AIPT.LANGUAGE_MAP[code];
  return lang && lang.native ? lang.native : '';
};

AIPT.languageLabel = function(code) {
  const name = AIPT.languageName(code);
  const native = AIPT.languageNative(code);
  if (!native || native === name) return name;
  return name + ' (' + native + ')';
};
