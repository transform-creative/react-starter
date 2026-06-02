import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { IoniconName } from "~/data/Ionicons";

export interface PillToggleOption<T extends string = string> {
  label: string;
  value: T | number;
  icon?:IoniconName;
}

export interface PillToggleProps<T extends string = string> {
  options: PillToggleOption<T>[];
  value: T;
  ariaLabel?: string;
  className?: string;
  onChange: (value: T) => void;
}

/******************************
 * PillToggle component
 * A sliding pill-style toggle for switching between options.
 */
export function PillToggle<T extends string = string> ({
  options,
  value,
  ariaLabel = "Toggle",
  className = "",
  onChange,
}: PillToggleProps<T>) {
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [pillStyle, setPillStyle] = useState({ width: 0, x: 0 });

  useEffect(() => {
    const activeIndex = options.findIndex((o) => o.value === value);
    const activeBtn = buttonsRef.current[activeIndex];
    if (activeBtn) {
      setPillStyle({
        width: activeBtn.offsetWidth,
        x: activeBtn.offsetLeft,
      });
    }
  }, [value, options]);

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`row w-100 gap-5 r-lg  ${className}`}
      style={{ position: "relative", isolation: "isolate", border: '2px solid var(--accent-sm)' }}
    >
      <div
        className="pill"
        aria-hidden="true"
        style={{
          width: `${pillStyle.width}px`,
          transform: `translateX(${pillStyle.x}px)`,
        }}
      />
      {options.map((opt, i) => (
        <button
          key={opt.value}
          ref={(el) => { buttonsRef.current[i] = el; }}
          type="button"
          className={`w-100 col middle center`}
          role="radio"
          aria-checked={value === opt.value}
          style={{
            background: "none",
            color: value === opt.value ? "var(--accent-sm)" : "var(--txt)",
            padding: "4px 4px",
            fontSize: "var(--text-sm)"
          }}
          onClick={() => onChange(opt.value as T)}
        >
          {opt.label && opt.label}{opt.icon && <Icon name={opt.icon}/>}
        </button>
      ))}
    </div>
  );
}
