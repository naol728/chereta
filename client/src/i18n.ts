import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import am from "./locales/am.json";
import om from "./locales/om.json";

const savedLanguage = localStorage.getItem("app-language");

const supportedLanguages = ["en", "am", "om"];

const initialLanguage =
  savedLanguage && supportedLanguages.includes(savedLanguage)
    ? savedLanguage
    : "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    am: { translation: am },
    om: { translation: om },
  },
  lng: initialLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
