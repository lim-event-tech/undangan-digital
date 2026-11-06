import Image from "next/image";

const LOGO_RATIO = 600 / 329;

export function BrandLogo({ height = 44, className = "" }: { height?: number; className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center ${className}`}>
      <Image
        src="/brand/logolim.png"
        alt="LingkarIDE Manajemen"
        width={Math.round(height * LOGO_RATIO)}
        height={height}
        draggable={false}
        className="block max-w-full object-contain"
        style={{ height, width: "auto" }}
      />
    </span>
  );
}
