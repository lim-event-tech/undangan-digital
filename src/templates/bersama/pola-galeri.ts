export const RASIO_BAWAAN = { lebar: 3, tinggi: 4 };

export const RASIO_CONTOH = [
  { lebar: 3, tinggi: 4 },
  { lebar: 4, tinggi: 3 },
  { lebar: 1, tinggi: 1 },
  { lebar: 4, tinggi: 5 },
  { lebar: 3, tinggi: 2 },
  { lebar: 2, tinggi: 3 },
];

export type Rasio = { lebar: number; tinggi: number };

const JARAK_RELATIF = 0.06;

export function rasioFoto(lebar: number | null | undefined, tinggi: number | null | undefined): Rasio {
  if (!lebar || !tinggi || lebar <= 0 || tinggi <= 0) return RASIO_BAWAAN;
  return { lebar, tinggi };
}

export function jumlahLajur(total: number): number {
  return total <= 1 ? 1 : 2;
}

export function susunLajur(rasio: Rasio[]): number[][] {
  const lajur = Array.from({ length: jumlahLajur(rasio.length) }, () => [] as number[]);
  const tinggi = lajur.map(() => 0);
  rasio.forEach((r, i) => {
    let pilih = 0;
    for (let n = 1; n < tinggi.length; n++) {
      if (tinggi[n] < tinggi[pilih] - 1e-9) pilih = n;
    }
    lajur[pilih].push(i);
    tinggi[pilih] += r.tinggi / r.lebar + JARAK_RELATIF;
  });
  return lajur;
}
