const tombolDasar =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emas-muda disabled:cursor-not-allowed disabled:opacity-45";

export const tombolGelap = `${tombolDasar} bg-tinta text-white hover:bg-tinta-2`;

export const tombolTerang = `${tombolDasar} border border-garis-input bg-white text-tinta hover:bg-kertas`;

export const tombolBahaya = `${tombolDasar} border border-galat/40 bg-white text-galat hover:bg-galat-bg`;

export const kolom =
  "min-h-11 w-full rounded-md border border-garis-input bg-white px-3 text-[15px] text-tinta placeholder:text-redup/70 focus:border-emas-muda focus:outline-none focus:ring-3 focus:ring-emas-muda/20 aria-invalid:border-galat aria-invalid:ring-3 aria-invalid:ring-galat/15";

export const labelKolom = "flex flex-col gap-1.5 text-[13px] font-medium";

export const kartu = "rounded-[10px] border border-garis bg-white";

export const judulHalaman =
  "font-judul text-[34px] font-medium leading-tight text-tinta";

export const pesanGalat = "text-[13px] font-medium text-galat";
