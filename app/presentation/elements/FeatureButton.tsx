import type { SharedContextProps } from "~/data/CommonTypes";
import { useOutletContext } from "react-router";
import {
  CSSProperties,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import gsap from "gsap";
import { isMobileBrowser } from "~/data/Objects";

export interface FeatureButtonProps {
  id?: string;
  onClick?: (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => void;
  children?: ReactNode;
  className?: string;
  accent?: boolean;
  disabled?: boolean;
  outline?: boolean;
  outlineSecondary?: boolean;
  type?: "button" | "submit";
  style?: CSSProperties;
}

/******************************
 * FeatureButton component
 * @todo Create description
 */
export function FeatureButton({
  id,
  style,
  className,
  disabled = false,
  onClick,
  children,
  type = "submit",
  accent = false,
  outline = false,
  outlineSecondary = false,
}: FeatureButtonProps) {
  const context: SharedContextProps =
    useOutletContext();
  const buttonRef = useRef(null);
  const bkgStartRef = useRef(null);
  const bkgEndRef = useRef(null);
  const mainRef = useRef(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const pendingOutRef = useRef(false);

  const [isMobile, setIsMobile] = useState(false);

  const ease = "power5.out";
  const duration = 0.3;

  useEffect(() => {
    setIsMobile(isMobileBrowser());
  }, []);

  function runHoverOut() {
    const defaultColor = accent
      ? "var(--accent-sm)"
      : "var(--txt)";

    gsap.to(bkgEndRef.current, {
      autoAlpha: 0,
      width: "0%",
      ease: ease,
      duration: duration,
    });
    gsap.to(bkgStartRef.current, {
      autoAlpha: 1,
      width: "100%",
      ease: ease,
      duration: duration,
    });
    gsap.to(buttonRef.current, {
      color: defaultColor,
      duration: duration,
      onComplete: () => {
        gsap.set(buttonRef.current, { clearProps: "boxShadow" });
      },
    });
    const svgEls = (
      buttonRef.current as unknown as HTMLButtonElement
    )?.querySelectorAll("svg, svg *");
    if (svgEls?.length)
      gsap.to(svgEls, {
        color: defaultColor,
        fill: defaultColor,
        stroke: defaultColor,
        duration: duration,
      });
  }

  function onMouseOver(
    e: React.MouseEvent<HTMLDivElement>,
  ) {
    if (disabled) return;
    pendingOutRef.current = false;
    if (tlRef.current) tlRef.current.kill();

    const hoverColor = accent
      ? "var(--accent)"
      : "var(--accent-sm)";

    const svgEls = (
      buttonRef.current as unknown as HTMLButtonElement
    )?.querySelectorAll("svg, svg *");

    const tl = gsap.timeline({
      onComplete: () => {
        if (pendingOutRef.current) {
          pendingOutRef.current = false;
          runHoverOut();
        }
      },
    });
    tlRef.current = tl;

    tl.to(bkgEndRef.current, { autoAlpha: 1, width: "100%", ease, duration }, 0)
      .to(bkgStartRef.current, { autoAlpha: 0, transformOrigin: "right", width: "0%", ease, duration }, 0)
      .to(buttonRef.current, { color: hoverColor, boxShadow: `0 0 0 1px ${hoverColor}`, opacity: 1, duration }, 0);

    if (svgEls?.length)
      tl.to(svgEls, { color: hoverColor, fill: hoverColor, stroke: hoverColor, duration }, 0);
  }

  function onMouseOut(
    _e: React.MouseEvent<HTMLDivElement>,
  ) {
    if (tlRef.current?.isActive()) {
      pendingOutRef.current = true;
    } else {
      runHoverOut();
    }
  }

  if (isMobile)
    return (
      <div
        id={id}
        ref={mainRef}
        className="w-100 relative r-lg"
        style={{ ...style, zIndex: 1, pointerEvents: disabled ? 'none' : undefined }}
      >
        <div
          id="feature-button-bkg-normal"
          ref={bkgEndRef}
          className="absolute w-100 h-100  r-lg"
          style={{
            background: accent
              ? "var(--accent-sm)"
              : "var(--accent)",
            width: 0,
          }}
        />

        <div className="w-100 absolute h-100 end">
          <div
            ref={bkgStartRef}
            id="feature-button-bkg-accent"
            className="absolute w-100 h-100  r-lg"
            style={{
              background: accent
                ? "var(--accent-gradient)"
                : "var(--accent-sm)",
              zIndex: 2,
            }}
          />
        </div>

        <button
          id="feature-button-button"
          ref={buttonRef}
          disabled={disabled}
          type={type}
          className={`${className ? className : "w-100"}${outline ? " outline-secondary" : ""}${outlineSecondary ? " outline-bkg" : ""}`}
          onClick={(e) => {
            onClick && onClick(e);
          }}
          style={{
            transition: "none",
            background: "none",
            color: accent
              ? "var(--accent-sm)"
              : "var(--txt)",
          }}
        >
          {children}
        </button>
      </div>
    );

  return (
    <div
      onMouseEnter={(e) => onMouseOver(e)}
      onMouseLeave={(e) => onMouseOut(e)}
      onMouseUp={(e) => onMouseOut(e)}
      id={id}
      ref={mainRef}
      className="w-100 relative r-lg"
      style={{ ...style, zIndex: 1, pointerEvents: disabled ? 'none' : undefined }}
    >
      <div
        id="feature-button-bkg-normal"
        ref={bkgEndRef}
        className="absolute w-100 h-100  r-lg"
        style={{
          background: accent
            ? "var(--accent-sm)"
            : "var(--accent)",
          width: 0,
        }}
      />

      <div className="w-100 absolute h-100 end">
        <div
          ref={bkgStartRef}
          id="feature-button-bkg-accent"
          className="absolute w-100 h-100  r-lg"
          style={{
            background: accent
              ? "var(--accent-gradient)"
              : "var(--accent-sm)",
            zIndex: 2,
          }}
        />
      </div>

      <button
        id="feature-button-button"
        ref={buttonRef}
        disabled={disabled}
        type={type}
        className={`${className ? className : "w-100"}${outline ? " outline-secondary" : ""}${outlineSecondary ? " outline-bkg" : ""}`}
        onClick={(e) => {
          onClick && onClick(e);
        }}
        style={{
          transition: "none",
          background: "none",
          color: accent
            ? "var(--accent-sm)"
            : "var(--txt)",
        }}
      >
        {children}
      </button>
    </div>
  );
}
