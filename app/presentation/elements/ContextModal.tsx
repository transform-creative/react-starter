import IonIcon from "@reacticons/ionicons";
import React, { useRef } from "react";
import { useEffect, useState } from "react";
import type { ContextModalElement } from "~/data/CommonTypes";
import { contextModalPosition } from "~/presentation/elements/ContextModalBL";

export interface ContextModalProps extends ContextModalElement {
  x: number;
  y: number;
  z?: number;
  children: any;
  width?: number | string;
  height?: number | string;
  onRight?: boolean;
  onTop?: boolean;
  noBlur?: boolean;
  autoHide?: boolean;
  onClose: () => void;
}

/******************************
 * ContextModal component
 * Positioned pop-over modal that auto-adjusts its coordinates to stay on-screen
 */
export function ContextModal({
  x = 0,
  y = 0,
  z = 15,
  active,
  onClose,
  children,
  width = "auto",
  height = "auto",
  onRight = false,
  onTop = false,
  noBlur = false,
  autoHide = false,
}: ContextModalProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const [customX, setCustomX] = useState(x);
  const [customY, setCustomY] = useState(y);

  // Window is only read inside the effect, never during render, so the modal
  // is safe to mount unconditionally under SSR / prerender.
  useEffect(() => {
    const position = contextModalPosition(
      { x, y },
      {
        width: menuRef.current?.clientWidth || 0,
        height:
          menuRef.current?.clientHeight || 0,
      },
      {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    );
    setCustomX(position.x);
    setCustomY(position.y);
  }, [active, x, y]);

  /**********************
   * Handle when close is clicked
   * @param e
   * @param forceClose
   */
  function updateIsActive(
    e: React.MouseEvent<HTMLDivElement>,
    forceClose = false,
  ) {
    if (
      /*@ts-ignore*/
      e.target.id == "close" ||
      (forceClose == true && autoHide == true)
    )
      onClose();
  }

  if (active) {
    return (
      <div
        id="close"
        className={`${
          !noBlur && "modal-bkg"
        } fade-sm`}
        onClick={(e) => updateIsActive(e, true)}
      >
        <div
          ref={menuRef}
          className="boxed outline p0"
          style={{
            width: width,
            height: height,
            marginLeft: customX,
            marginTop: customY,
            zIndex: z,
          }}
        >
          {autoHide && (
            <div className="boxed">
              <IonIcon
                className="buttonIcon"
                name="close"
                onClick={(e) =>
                  updateIsActive(e, true)
                }
              />
            </div>
          )}
          {children}
        </div>
      </div>
    );
  }
}
