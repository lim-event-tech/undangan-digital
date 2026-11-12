import Image from "next/image";

const LOGO_RATIO = 320 / 64; // 5.0

export function BrandLogo({
  height = 40,
  className = "",
  iconOnly = false,
}: {
  height?: number;
  className?: string;
  iconOnly?: boolean;
}) {
  if (iconOnly) {
    return (
      <span className={`inline-flex shrink-0 items-center ${className}`}>
        <Image
          src="/brand/icon.svg"
          alt="LIM-RSVP"
          width={height}
          height={height}
          priority
          draggable={false}
          className="block object-contain"
          style={{ height, width: height }}
        />
      </span>
    );
  }

  return (
    <span className={`inline-flex shrink-0 items-center ${className}`}>
      <Image
        src="/brand/logo.svg"
        alt="LIM-RSVP"
        width={Math.round(height * LOGO_RATIO)}
        height={height}
        priority
        draggable={false}
        className="block max-w-full object-contain"
        style={{ height, width: "auto" }}
      />
    </span>
  );
}
