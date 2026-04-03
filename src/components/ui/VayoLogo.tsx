import Image from "next/image";
import Link from "next/link";

interface VayoLogoProps {
  /** Height of the logo in pixels (width scales automatically) */
  height?: number;
  /** Wrap in a white pill — use on dark backgrounds */
  onDark?: boolean;
  className?: string;
}

export function VayoLogo({ height = 40, onDark = false, className = "" }: VayoLogoProps) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center flex-shrink-0 ${className}`}
    >
      <Image
        src={onDark ? "/assets/vayo-trans.png" : "/assets/vayologo.png"}
        alt="VAYO"
        width={Math.round(height * 2.5)}
        height={height}
        style={{ height, width: "auto" }}
        priority
      />
    </Link>
  );
}
