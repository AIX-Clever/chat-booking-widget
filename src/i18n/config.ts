import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import es from './translations/es.json';
import en from './translations/en.json';
import pt from './translations/pt.json';

i18n
    .use(LanguageDetector) // Detect user language
    .use(initReactI18next) // Pass i18n to react-i18next
    .init({
        resources: {
            es: { translation: es },
            en: { translation: en },
            pt: { translation: pt }
        },
        fallbackLng: 'es',
        supportedLngs: ['es', 'en', 'pt'],
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'lucia-widget-language'
        },
        interpolation: {
            escapeValue: false // React already escapes
        }
    });

export default i18n;
