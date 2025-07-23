import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import tr from '../locales/tr.json';

i18next
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3', // React Native uyumluluğu için
    lng: 'tr', // Varsayılan dil
    fallbackLng: 'en', // Eğer bir çeviri bulunamazsa kullanılacak dil
    resources: {
      en: en,
      tr: tr,
    },
    interpolation: {
      escapeValue: false // React zaten XSS'e karşı koruma sağlar
    }
  });

export default i18next;