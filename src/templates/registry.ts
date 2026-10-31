export const TEMPLATES = [{ key: "melati", label: "Melati" }] as const;

export type TemplateKey = (typeof TEMPLATES)[number]["key"];
