import { Icon } from "~/presentation/elements/Icon";

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

/******************************
 * Checkbox component
 * Generic toggle checkbox with an accent border and close icon when checked
 */
export function Checkbox({
  checked,
  onChange,
  label,
  className,
}: CheckboxProps) {
  return (
    <div
      className={`row gap-5 middle clickable${className ? ` ${className}` : ""}`}
      onClick={() => onChange(!checked)}
    >
      <div
        className="middle center"
        style={{
          width: 20,
          height: 20,
          border: "2px solid var(--accent)",
          borderRadius: 4,
        }}
      >
        {checked && (
          <Icon
            name="close"
            size={19}
            color="var(--accent)"
          />
        )}
      </div>
      {label && <p>{label}</p>}
    </div>
  );
}
