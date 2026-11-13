import type { WabaConfig } from "./config";

export interface WabaTemplateItem {
  id: string;
  name: string;
  category: "UTILITY" | "AUTHENTICATION" | "MARKETING";
  language: string;
  headerFormat?: "NONE" | "TEXT" | "IMAGE" | "DOCUMENT";
  bodyText: string;
  footerText?: string | null;
  buttons?: Array<{
    type: string;
    text?: string;
    url?: string;
  }>;
  status: "APPROVED" | "PENDING" | "REJECTED";
  rejectionReason?: string | null;
  isGlobal?: boolean;
}

export interface SendWabaOptions {
  to: string;
  recipientName?: string;
  template: string;
  language?: string;
  referenceId?: string;
  parameters?: {
    header?: {
      type: "text" | "image" | "document";
      text?: string;
      mediaUrl?: string;
      mediaId?: string;
      id?: string;
      filename?: string;
    };
    body?: string[];
    buttons?: Array<{
      index: number;
      type: "quick_reply" | "url";
      payload?: string;
      parameter?: string;
    }>;
  };
}

export interface WabaSendResult {
  id: string;
  to: string;
  template: string;
  status: string;
  referenceId?: string;
}

export interface WabaStatusResult {
  id: string;
  recipientPhone: string;
  templateName: string;
  status: "pending" | "processing" | "sent" | "delivered" | "read" | "failed";
  wamid?: string | null;
  lastError?: string | null;
  referenceId?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
}

export async function fetchWabaTemplates(
  config: WabaConfig,
): Promise<{ ok: true; templates: WabaTemplateItem[] } | { ok: false; error: string }> {
  if (!config.apiKey) {
    return { ok: false, error: "API Key WABA belum diatur di database atau .env" };
  }
  try {
    const url = `${config.baseUrl}/api/v1/waba/templates`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.success) {
      return {
        ok: false,
        error: body?.message || `Gagal memuat template WABA (HTTP ${res.status})`,
      };
    }

    return {
      ok: true,
      templates: Array.isArray(body.data) ? body.data : [],
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Gagal terhubung ke WABA Gateway",
    };
  }
}

export async function sendWabaNotification(
  config: WabaConfig,
  options: SendWabaOptions,
): Promise<{ ok: true; data: WabaSendResult } | { ok: false; error: string }> {
  if (!config.apiKey) {
    return { ok: false, error: "API Key WABA belum dikonfigurasi" };
  }
  try {
    const url = `${config.baseUrl}/api/v1/waba/send`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...options,
        language: options.language || config.language || "id",
      }),
    });

    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.success) {
      return {
        ok: false,
        error: body?.message || `Pengiriman WABA gagal (HTTP ${res.status})`,
      };
    }

    return {
      ok: true,
      data: body.data,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Gagal menghubungi WABA Gateway",
    };
  }
}

export async function getWabaDeliveryStatus(
  config: WabaConfig,
  idOrReference: string,
): Promise<{ ok: true; data: WabaStatusResult } | { ok: false; error: string }> {
  if (!config.apiKey) {
    return { ok: false, error: "API Key WABA belum dikonfigurasi" };
  }
  try {
    const url = `${config.baseUrl}/api/v1/waba/status/${encodeURIComponent(idOrReference)}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
      cache: "no-store",
    });

    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.success) {
      return {
        ok: false,
        error: body?.message || `Gagal memeriksa status WABA (HTTP ${res.status})`,
      };
    }

    return {
      ok: true,
      data: body.data,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Koneksi ke gateway WABA bermasalah",
    };
  }
}

export interface CreateWabaTemplatePayload {
  name: string;
  category?: "UTILITY" | "AUTHENTICATION" | "MARKETING";
  language?: string;
  headerFormat?: "NONE" | "TEXT" | "IMAGE" | "DOCUMENT";
  headerContent?: string;
  bodyText: string;
  footerText?: string;
  buttons?: Array<{
    type: string;
    text: string;
    url?: string;
    example?: string[];
  }>;
}

export async function submitWabaTemplate(
  config: WabaConfig,
  payload: CreateWabaTemplatePayload,
): Promise<{ ok: true; data: WabaTemplateItem } | { ok: false; error: string }> {
  if (!config.apiKey) {
    return { ok: false, error: "API Key WABA belum diatur" };
  }
  try {
    const url = `${config.baseUrl}/api/v1/waba/templates`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        category: payload.category || "UTILITY",
        language: payload.language || config.language || "id",
      }),
    });

    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.success) {
      return {
        ok: false,
        error: body?.message || `Gagal mengajukan template (${res.status})`,
      };
    }

    return {
      ok: true,
      data: body.data,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Gagal menghubungi WABA Gateway",
    };
  }
}

export interface UploadWabaMediaPayload {
  data: Buffer;
  contentType: string;
  fileName: string;
}

/**
 * Mengunggah media (gambar/dokumen) ke WhatsApp via WABA Gateway
 * untuk mendapatkan mediaId resmi. Mengatasi kendala domain yang berada
 * di balik Cloudflare agar Meta tidak perlu melakukan download via URL publik.
 */
export async function uploadWabaMedia(
  config: WabaConfig,
  file: UploadWabaMediaPayload,
): Promise<{ ok: true; mediaId: string } | { ok: false; error: string }> {
  if (!config.apiKey) {
    return { ok: false, error: "API Key WABA belum diatur" };
  }

  try {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(file.data)], { type: file.contentType });
    formData.append("file", blob, file.fileName);
    formData.append("type", file.contentType);

    let res = await fetch(`${config.baseUrl}/api/v1/waba/media`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: formData,
    });

    if (res.status === 404) {
      // Fallback ke endpoint alternatif /upload jika /media belum didefinisikan
      const fallbackFormData = new FormData();
      const fallbackBlob = new Blob([new Uint8Array(file.data)], { type: file.contentType });
      fallbackFormData.append("file", fallbackBlob, file.fileName);
      fallbackFormData.append("type", file.contentType);

      res = await fetch(`${config.baseUrl}/api/v1/waba/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: fallbackFormData,
      });
    }

    const body = await res.json().catch(() => null);
    if (!res.ok || (body && body.success === false)) {
      return {
        ok: false,
        error: body?.message || `Gagal mengunggah media ke WhatsApp (HTTP ${res.status})`,
      };
    }

    const mediaId =
      body?.data?.mediaId ||
      body?.data?.id ||
      body?.mediaId ||
      body?.id;

    if (!mediaId || typeof mediaId !== "string") {
      return {
        ok: false,
        error: "Gateway WABA tidak mengembalikan Media ID yang valid.",
      };
    }

    return {
      ok: true,
      mediaId,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Gagal terhubung saat mengunggah media ke WhatsApp",
    };
  }
}



