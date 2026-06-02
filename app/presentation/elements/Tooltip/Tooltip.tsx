import React, { useState, ReactNode, CSSProperties } from "react";
import "./Tooltip.css"; // We will create this next

interface TooltipProps {
  children: ReactNode;      // The element you hover over
  text: string;             // The paragraph content
  position?: "top" | "bottom" | "left" | "right"; // Optional direction
  style?: CSSProperties;        // Applied to the tooltip bubble paragraph
  wrapperStyle?: CSSProperties; // Applied to the outer wrapper div
  className?: string;           // Applied to the wrapper — use "inline-block" for inline/icon contexts
}

export function Tooltip ({
  children,
  text,
  position = "top",
  style,
  wrapperStyle,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTimeout, setActiveTimeout] = useState<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    const timeout = setTimeout(() => setIsVisible(true), 200); // 200ms delay prevents flickering
    setActiveTimeout(timeout);
  };

  const hideTooltip = () => {
    if (activeTimeout) clearTimeout(activeTimeout);
    setIsVisible(false);
  };

  return (
    <div 
      className={`tooltip-wrapper${className ? ` ${className}` : ""}`}
      style={wrapperStyle}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      
      {isVisible && (
        <div className={`tooltip-box boxed-secondary p-5 tooltip-${position} outline-secondary`}>
          <h3  style={{ whiteSpace: "pre-wrap", fontSize: 'var(--text-h4)', ...style }}>{text}</h3>
          {/* A tiny triangle arrow pointing to the element */}
          <span className="tooltip-arrow" />
        </div>
      )}
    </div>
  );
};