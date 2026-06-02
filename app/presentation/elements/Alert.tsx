import IonIcon from "@reacticons/ionicons";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { Transition, TransitionGroup } from "react-transition-group";
import type { ActivatableElement } from "~/data/CommonTypes";
import { Icon } from "./Icon";

export interface SavedModalProps extends ActivatableElement {
  timeout?: number;
  header?: string;
  body?: string;
  state?: "success" | "fail";
}

/******************************
 * Alert component
 * Displays a timed toast notification that auto-dismisses after 5 seconds
 */
export function Alert({
  active,
  onClose,
  timeout = 5,
  header,
  body,
  state = "success",
}: SavedModalProps) {
  const transitionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active == true) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Update every 1 second

      // Cleanup function to clear the timeout if the component unmounts before 5 seconds
      return () => clearTimeout(timer);
    }
  }, [active]);

  const handleEnter = () => {
    gsap.from(transitionRef?.current, {
      opacity: 0,
      duration: 0.5,
      y: -100,
      ease: "back",
    });
  };

  const handleExit = () => {
    gsap.to(transitionRef?.current, {
      opacity: 0,
      y: -100,
      duration: 1,
      ease: "power1",
    });
  };
  return (
    <Transition
      nodeRef={transitionRef}
      in={active}
      timeout={500}
      onEnter={handleEnter}
      onExit={handleExit}
      unmountOnExit
    >
      <div
        ref={transitionRef}
        className="row middle center w-100 clickable"
        onClick={() => onClose()}
        style={{ position: "fixed", zIndex: 100, top: 10 }}
      >
        <div
          className="boxed w-50 p-0 m-10"
          style={{
            background: ` ${
              state == "fail" ? "var(--danger)" : "var(--accent)"
            }`,

            height: "auto",
            top: 10,
          }}
        >
          <div className="row between middle p-5">
            <Icon
              className=""
              name={`${
                state == "success"
                  ? "checkmark-circle-outline"
                  : "close-circle-outline"
              }`}
              size={30}
              color={state == "fail" ? "var(--accemt-sm)" : "var(--accent-md)"}
            />
            <div className="center col middle">
              {header && (
                <h3
                  style={{ color: "var(--accent-sm)" }}
                  className="m-51 center"
                >
                  {header}
                </h3>
              )}
              {body && (
                <p
                  style={{ color: "var(--accent-sm)" }}
                  className="m-5 textCencenterter"
                >
                  {body}
                </p>
              )}
            </div>
            <Icon
            size={30}
              className="buttonIcon m0"
              color="var(--accent-md)"
              name="close-circle"
              onClick={() => onClose()}
            />
          </div>
        </div>
      </div>
    </Transition>
  );
}
