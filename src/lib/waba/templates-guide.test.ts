import { describe, expect, it } from "vitest";
import {
  WABA_TEMPLATE_PRESETS,
  buildWabaBodyParameters,
  defaultWabaVariableMappings,
  extractWabaVariableIndices,
  renderTemplatePreview,
  renderWabaVariableExpression,
  type TemplateVariableContext,
} from "./templates-guide";

const SAMPLE_CONTEXT: TemplateVariableContext = {
  guestName: "Bapak Hendra",
  eventTitle: "Rapat Tahunan 2026",
  deadlinePhrase: "sebelum 20 November 2026",
  link: "https://rsvp.lingkaride.com/abc123",
  token: "abc123",
  organizerName: "Lingkar Ide",
  eventType: "Rapat Kerja",
  guestGroup: "VIP",
};

describe("WABA Templates Guide & Variable Mapping", () => {
  it("menyertakan preset undangan resmi 4 variabel dengan tombol URL", () => {
    const preset = WABA_TEMPLATE_PRESETS.find((p) => p.id === "undangan_resmi_tombol");
    expect(preset).toBeDefined();
    expect(preset?.payload.bodyText).toContain("Halo {{1}},");
    expect(preset?.payload.bodyText).toContain("acara {{2}}.");
    expect(preset?.payload.bodyText).toContain("Konfirmasi kehadiran {{3}}.");
    expect(preset?.payload.bodyText).toContain("{{4}}. Semoga berkenan dan terimakasih.");
    expect(preset?.payload.buttons?.[0]).toMatchObject({ type: "URL" });
  });

  it("mengekstrak indeks variabel secara terurut", () => {
    expect(extractWabaVariableIndices("Halo {{1}}, acara {{2}}, batas {{3}}, {{4}}.")).toEqual([1, 2, 3, 4]);
    expect(extractWabaVariableIndices("{{1}}")).toEqual([1]);
  });

  it("merender campuran variabel aplikasi dan teks manual tanpa line break", () => {
    const rendered = renderWabaVariableExpression(
      "Yth. {nama}\n({grup}) di {event} oleh {penyelenggara}",
      SAMPLE_CONTEXT,
    );
    expect(rendered).toBe("Yth. Bapak Hendra (VIP) di Rapat Tahunan 2026 oleh Lingkar Ide");
  });

  it("membangun 4 parameter body sesuai mapping pemilik undangan", () => {
    const bodyText =
      "Halo {{1}},\n\nKami bermaksud mengundang Bapak/Ibu di acara {{2}}.\n\nKonfirmasi kehadiran {{3}}.\n\n{{4}}. Semoga berkenan dan terimakasih.";
    const params = buildWabaBodyParameters(bodyText, {
      ...SAMPLE_CONTEXT,
      variableMappings: {
        "1": "Bapak/Ibu {nama}",
        "2": "{jenis_acara} {event} bersama {penyelenggara}",
        "3": "paling lambat {batas_rsvp}",
        "4": "Silakan buka tombol di bawah ({link})",
      },
    });

    expect(params).toEqual([
      "Bapak/Ibu Bapak Hendra",
      "Rapat Kerja Rapat Tahunan 2026 bersama Lingkar Ide",
      "paling lambat sebelum 20 November 2026",
      "Silakan buka tombol di bawah (https://rsvp.lingkaride.com/abc123)",
    ]);
  });

  it("memakai default mapping bila pemilik belum menyimpan custom mapping pada template 4 variabel", () => {
    const bodyText = "Halo {{1}}, {{2}}, {{3}}, {{4}}";
    const defaults = defaultWabaVariableMappings(4);
    expect(Object.keys(defaults)).toEqual(["1", "2", "3", "4"]);

    const params = buildWabaBodyParameters(bodyText, SAMPLE_CONTEXT);
    expect(params).toHaveLength(4);
    expect(params[0]).toBe("Bapak Hendra");
    expect(params[1]).toBe("Rapat Tahunan 2026");
    expect(params[2]).toBe("sebelum 20 November 2026");
  });

  it("merender pratinjau lengkap beserta tombol CTA", () => {
    const preview = renderTemplatePreview(
      "Halo {{1}}, {{2}}, {{3}}, {{4}}",
      SAMPLE_CONTEXT,
      undefined,
      "LIM-RSVP",
      "IMAGE",
      "Buka Undangan",
    );
    expect(preview.isImageHeader).toBe(true);
    expect(preview.body).toContain("Bapak Hendra");
    expect(preview.footer).toBe("LIM-RSVP");
    expect(preview.buttonText).toBe("Buka Undangan");
  });
});

