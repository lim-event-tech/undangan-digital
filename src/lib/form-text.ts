function raw(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function singleLine(formData: FormData, name: string): string {
  return raw(formData, name).replace(/\s+/g, " ").trim();
}

export function multiLine(formData: FormData, name: string): string {
  return raw(formData, name)
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
