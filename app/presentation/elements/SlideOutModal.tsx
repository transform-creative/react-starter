import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import * as spinners from "react-spinners";
import { Transition } from "react-transition-group";
import gsap from "gsap";
import type {
  ActivatableElement,
  SharedContextProps,
} from "~/data/CommonTypes";
import { Icon } from "./Icon";

export interface SlideOutModalProps extends ActivatableElement {
  children: any;
  width: number | string;
  height?: number;
  style?: React.CSSProperties;
  isLoading?: boolean;
  context: SharedContextProps | undefined;
  /** Renders a structured header: title inline with the close button */
  title?: string;
  /** Optional node rendered below the title row, before the divider (e.g. a primary action button) */
  headerButton?: ReactNode;
}

/******************************
 * SlideOutModal component
 * Right-edge drawer panel that slides in with GSAP and closes on Escape or backdrop click
 */
export function SlideOutModal({
  active,
  onClose,
  children,
  width,
  height,
  style,
  context,
  isLoading = false,
  title,
  headerButton,
}: SlideOutModalProps) {
  const transitionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [active, onClose]);

  function handleMainClick(e: any) {
    e.stopPropagation();
  }

  const handleEnter = () => {
    gsap.from(transitionRef?.current, {
      opacity: 0,
      x: 300,
      duration: 0.5,
      ease: "power3.inOut",
    });
  };

  const handleExit = () => {
    gsap.to(transitionRef?.current, {
      opacity: 0,
      x: 300,
      duration: 0.5,
      ease: "power3.inOut",
    });
  };

  return (
    <div
      style={{ position: "relative", ...style }}
    >
      {active && <div className="modal-bkg fade-sm" />}
      <Transition
        nodeRef={transitionRef}
        in={active}
        timeout={300}
        onEnter={handleEnter}
        onExit={handleExit}
        unmountOnExit
      >
        <div
          ref={transitionRef}
          className="fill-screen"
          onClick={() => onClose()}
        >
          {isLoading && (
            <spinners.HashLoader
              className=""
              style={{
                position: "fixed",
                left: "50%",
                top: "40%",
                zIndex: 15,
              }}
              color="var(--accent)"
            />
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "end",
            }}
          >
            <div
              className=""
              style={{ margin: 0, padding: 0 }}
              onClick={(e) => handleMainClick(e)}
            >
              <div
                className="boxed p-10"
                style={{
                                    borderRadius: `var(--border) 0 0 0`,
                  minWidth: width,
                  maxWidth: width,
                  minHeight: height,
                  height: "100dvh",
                  marginRight: context?.inShrink ? 0 : 0,
                }}
              >
                {title ? (
                  <>
                    {/* Structured header: title + close button inline */}
                    <div
                      className="row between middle"
                      style={{ padding: "6px 4px 8px" }}
                    >
                      <label
                        style={{
                          textTransform: "uppercase",
                          letterSpacing: "1.5px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: "var(--txt)",
                          margin: 0,
                          cursor: "default",
                        }}
                      >
                        {title}
                      </label>
                      <Icon name="close" className="clickable" onClick={onClose} />
                    </div>
                    {/* Optional action button below the title row */}
                    {headerButton && (
                      <div style={{ padding: "0 4px 8px" }}>
                        {headerButton}
                      </div>
                    )}
                    <div className="divider w-100" style={{ marginBottom: 12 }} />
                  </>
                ) : (
                  /* Legacy layout — absolute close icon, no title */
                  <div
                    style={{
                      position: "absolute",
                      right: 10,
                      zIndex: 20
                    }}
                  >
                    <Icon
                      name="close-circle"
                      size={context?.inShrink ? 30 : 20}
                      className="clickable"
                      onClick={onClose}
                    />
                  </div>
                )}

                {children}
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  );
}
