import englishMessages from "./consultant-messages.en.json";

export type ConsultantLocale = "id" | "en";
export const consultantLanguageCookie = "binahub_language";

export function consultantLocale(value: string | undefined): ConsultantLocale {
  return value === "en" ? "en" : "id";
}

const english: Readonly<Record<string, string>> = englishMessages;

export function consultantTranslator(locale: ConsultantLocale) {
  return function translate<T>(message: T, values: readonly unknown[] = []): T extends string ? string : T {
    type Output = T extends string ? string : T;
    if (typeof message !== "string") return message as Output;
    const text = locale === "en" && Object.hasOwn(english, message) ? english[message] : message;
    return (values.length ? text.replace(/\{(\d+)\}/g, (_, index) => String(values[Number(index)] ?? "")) : text) as Output;
  };
}

export function saveConsultantLanguage(locale: ConsultantLocale) {
  const host = window.location.hostname;
  const domain = host.endsWith(".binahub.id") || host === "binahub.id" ? "; Domain=binahub.id" : "";
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${consultantLanguageCookie}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${domain}${secure}`;
}
