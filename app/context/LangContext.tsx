"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Lang, t, TranslationKey } from "../lib/translations";

type LangContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  tr: (key: TranslationKey) => string;
};

const LangContext = createContext<LangContextType>({
  lang: "fr",
  setLang: () => {},
  tr: (key) => t.fr[key],
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    const saved = localStorage.getItem("cashly_lang") as Lang | null;
    if (saved && ["fr", "en", "nl"].includes(saved)) setLangState(saved);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("cashly_lang", l);
  }

  function tr(key: TranslationKey): string {
    return t[lang][key] ?? t.fr[key];
  }

  return <LangContext.Provider value={{ lang, setLang, tr }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
