import { useRef } from "react";
import { HashLoader } from "react-spinners";
import { Transition } from "react-transition-group";
import gsap from "gsap";
import type { ActivatableElement } from "~/data/CommonTypes";

interface SlideOutModalProps extends ActivatableElement {
  children: any;
  width: number;
  height: number;
  isLoading?: boolean;
}

export default function SlideOutModal({
  active,
  onClose,
  children,
  width,
  height,
  isLoading = false,
}: SlideOutModalProps) {
  const transitionRef = useRef<HTMLDivElement>(null);

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
    <div>
      {active && (
        <div className="modalBackground mediumFade" />
      )}
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
          className="fillScreen"
          onClick={() => onClose()}
        >
          {isLoading && (
            <HashLoader
              className=""
              style={{
                position: "fixed",
                left: "50%",
                top: "40%",
                zIndex: 15,
              }}
              color="var(--primaryColor)"
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
                className="boxedDark p2"
                style={{
                  minWidth: width,
                  minHeight: height,
                  height: "100vh",
                  margin: "0 15px 0 0",
                }}
              >
                {children}
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  );
}