import Image from "next/image";
import Link from "next/link";

interface VayoLogoProps {
  /** Height of the logo in pixels (width scales automatically) */
  height?: number;
  /** Use the dark/footer variant (vayo-trans.png) */
  onDark?: boolean;
  /** Use the transparent variant (vayo-log-trans.png) */
  transparent?: boolean;
  className?: string;
}

export function VayoLogo({ height = 40, onDark = false, transparent = false, className = "" }: VayoLogoProps) {
  const src = (onDark || transparent) ? "/assets/vayo-trans.png" : "/assets/vayologo.png";

  return (
    <Link
      href="/"
      className={`inline-flex items-center flex-shrink-0 ${className}`}
    >
      <Image
        src={src}
        alt="VAYO"
        width={Math.round(height * 2.5)}
        height={height}
        style={{ height, width: "auto" }}
        priority
      />
    </Link>
  );
}
