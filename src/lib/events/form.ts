import { parseAgenda, type AgendaItem } from "./agenda";
import {
  isDateString,
  isTimeString,
  isZone,
  todayInZone,
  type Zone,
} from "@/lib/datetime";
import { multiLine, singleLine } from "@/lib/form-text";
import { isGoogleMapsUrl } from "@/lib/maps";
import type { FieldErrors } from "@/lib/save-result";

export const MAX_EVENTS = 8;

export const EVENT_LIMITS = {
  name: 60,
  venue: 100,
  address: 300,
  maps: 500,
} as const;

export type EventInput = {
  name: string;
  date: string | null;
  time: string | null;
  endTime: string | null;
  agenda: AgendaItem[];
  timezone: Zone;
  venueName: string | null;
  address: string | null;
  mapsUrl: string | null;
};

export type ParsedEventForm =
  | { ok: true; input: EventInput }
  | { ok: false; errors: FieldErrors };

export const MAPS_ERROR =
  "Ini bukan link Google Maps. Buka lokasi di Google Maps, ketuk Bagikan, lalu tempel link-nya di sini.";

export type ParsedEventName = { name: string } | { error: string };

export function parseEventName(formData: FormData, field = "nama"): ParsedEventName {
  const name = singleLine(formData, field);
  if (!name) return { error: "Nama acara wajib diisi" };
  if (name.length > EVENT_LIMITS.name) {
    return { error: `Nama acara maksimal ${EVENT_LIMITS.name} karakter` };
  }
  return { name };
}

export function parseEventForm(
  formData: FormData,
  currentEvent: Pick<EventInput, "date" | "timezone"> | null = null,
): ParsedEventForm {
  const errors: FieldErrors = {};

  const parsedName = parseEventName(formData);
  if ("error" in parsedName) errors.nama = parsedName.error;

  const date = singleLine(formData, "tanggal");
  if (date && !isDateString(date)) errors.tanggal = "Tanggal tidak valid";

  const time = singleLine(formData, "jam");
  if (time && !isTimeString(time)) errors.jam = "Jam tidak valid";

  const endTime = singleLine(formData, "jamSelesai");
  if (endTime && (!isTimeString(endTime) || !time || endTime <= time)) {
    errors.jamSelesai = "Jam selesai harus setelah jam mulai pada tanggal yang sama";
  }
  const parsedAgenda = parseAgenda(formData, time, endTime);
  Object.assign(errors, parsedAgenda.errors);

  const zone = singleLine(formData, "zona") || "WIB";
  if (!isZone(zone)) errors.zona = "Pilih WIB, WITA, atau WIT";
  if (
    date &&
    isDateString(date) &&
    isZone(zone) &&
    date < todayInZone(zone) &&
    (date !== currentEvent?.date || zone !== currentEvent?.timezone)
  ) {
    errors.tanggal = "Tanggal acara tidak boleh sebelum hari ini";
  }

  const venue = singleLine(formData, "tempat");
  if (venue.length > EVENT_LIMITS.venue) {
    errors.tempat = `Nama tempat maksimal ${EVENT_LIMITS.venue} karakter`;
  }

  const address = multiLine(formData, "alamat");
  if (address.length > EVENT_LIMITS.address) {
    errors.alamat = `Alamat maksimal ${EVENT_LIMITS.address} karakter`;
  }

  const maps = singleLine(formData, "maps");
  if (maps) {
    if (maps.length > EVENT_LIMITS.maps) errors.maps = MAPS_ERROR;
    else if (!isGoogleMapsUrl(maps)) errors.maps = MAPS_ERROR;
  }

  if (Object.keys(errors).length > 0 || "error" in parsedName || !isZone(zone)) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    input: {
      name: parsedName.name,
      date: date || null,
      time: time || null,
      endTime: endTime || null,
      agenda: parsedAgenda.agenda,
      timezone: zone,
      venueName: venue || null,
      address: address || null,
      mapsUrl: maps || null,
    },
  };
}
