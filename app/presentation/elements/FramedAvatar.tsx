import type { CSSProperties } from "react";
import "./FramedAvatar.css";

export interface FramedAvatarProps {
  src: string;
  size: number;
  /** Frame reward's css_class value — applied as extra class for the ring */
  cssClass?: string | null;
  /** Ring inset in px — defaults to 4. Reduce for small avatars. */
  frameInset?: number;
  alt?: string;
  /** Extra class for the outer wrapper */
  className?: string;
  style?: CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

/******************************
 * FramedAvatar
 * Renders a circular profile image with an optional CSS frame ring.
 * The ring colour and style come from the frame CSS class (e.g. "frame-ocean-wave").
 */
export function FramedAvatar({
  src,
  size,
  cssClass,
  frameInset,
  alt = "",
  className = "",
  style,
  onClick,
}: FramedAvatarProps) {
  const frameClass = cssClass || "";
  return (
    <div
      className={`framed-avatar-ring ${frameClass} ${className}`.trim()}
      style={{ width: size, height: size, ...(frameInset != null ? { '--fa-inset': `${frameInset}px` } as any : {}), ...style }}
      onClick={onClick}
    >
      <img src={src} alt={alt} loading="lazy" />
    </div>
  );
}
