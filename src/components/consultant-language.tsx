"use client";

import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import { consultantLocale, consultantTranslator, type ConsultantLocale, saveConsultantLanguage } from "@/lib/consultant-locale";
import s from "./consultant.module.css";

type LanguageState = {
  locale: ConsultantLocale;
  setLocale: (locale: ConsultantLocale) => void;
  t: ReturnType<typeof consultantTranslator>;
};

const localeContext = createContext<LanguageState | null>(null);

export function ConsultantLocaleProvider({ children, initialLocale }: { children: ReactNode; initialLocale: ConsultantLocale }) {
  const [locale, updateLocale] = useState(initialLocale);
  const value = useMemo(() => ({
    locale,
    t: consultantTranslator(locale),
    setLocale: (next: ConsultantLocale) => {
      saveConsultantLanguage(next);
      updateLocale(next);
    },
  }), [locale]);
  return <localeContext.Provider value={value}>{children}</localeContext.Provider>;
}

export function useConsultantLocale() {
  const value = useContext(localeContext);
  if (!value) throw new Error("Consultant language provider is required");
  return value;
}

export function ConsultantLanguageSelect() {
  const { locale, setLocale } = useConsultantLocale();
  return (
    <select
      className={s.languageSelect}
      aria-label={locale === "en" ? "Display language" : "Bahasa tampilan"}
      value={locale}
      onChange={(event) => setLocale(consultantLocale(event.target.value))}
    >
      <option value="id" lang="id">ID</option>
      <option value="en" lang="en">EN</option>
    </select>
  );
}
