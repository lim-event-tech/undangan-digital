export type WabaConfig = {
  aktif: boolean;
  baseUrl: string;
  apiKey: string;
  defaultTemplate: string;
  language: string;
};

export const DEFAULT_WABA_CONFIG: WabaConfig = {
  aktif: false,
  baseUrl: "https://event.lingkaridemanajemen.id",
  apiKey: "",
  defaultTemplate: "undangan_resmi",
  language: "id",
};

export function readWabaConfig(raw: unknown): WabaConfig {
  const source =
    typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const envBaseUrl = process.env.LIM_WABA_BASE_URL?.trim();
  const envApiKey = process.env.LIM_WABA_API_KEY?.trim();
  const envAktif =
    process.env.LIM_WABA_ENABLED === "true" ||
    process.env.LIM_WABA_ENABLED === "1" ||
    Boolean(envApiKey);

  const baseUrl =
    typeof source.baseUrl === "string" && source.baseUrl.trim()
      ? source.baseUrl.trim()
      : envBaseUrl || DEFAULT_WABA_CONFIG.baseUrl;

  const apiKey =
    typeof source.apiKey === "string" && source.apiKey.trim()
      ? source.apiKey.trim()
      : envApiKey || "";

  const defaultTemplate =
    typeof source.defaultTemplate === "string" && source.defaultTemplate.trim()
      ? source.defaultTemplate.trim()
      : DEFAULT_WABA_CONFIG.defaultTemplate;

  const language =
    typeof source.language === "string" && source.language.trim()
      ? source.language.trim()
      : DEFAULT_WABA_CONFIG.language;

  return {
    aktif: typeof source.aktif === "boolean" ? source.aktif : envAktif,
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiKey,
    defaultTemplate,
    language,
  };
}

