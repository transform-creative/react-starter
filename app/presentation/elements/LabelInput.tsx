import {
  HTMLInputAutoCompleteAttribute,
  Ref,
  useRef,
  useState,
} from "react";
import TypeInput from "./TypeInput";
import { ErrorLabelType, InputOption } from "~/data/CommonTypes";

interface LabelInputProps {
  id?: string;
  type?: string;
  placeholder?: string;
  errorLabel?: ErrorLabelType;
  label: string;
  value: string;
  className?: string;
  autoComplete?: HTMLInputAutoCompleteAttribute;
  autoFocus?: boolean;
  disabled?: boolean;
  isTextArea?: boolean;
  style?: HTMLStyleElement;
  options?: InputOption[];
  onChange: (newValue: string) => void;
}

export default function LabelInput({
  id = "",
  label,
  value,
  errorLabel,
  placeholder,
  type,
  className,
  autoComplete,
  autoFocus,
  disabled,
  isTextArea = false,
  options,
  onChange,
}: LabelInputProps) {
  const [selected, setSelected] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(
    null
  );
  const wrapperRef = useRef<HTMLDivElement>(null);

  function handleFocus() {
    if (inputRef.current?.disabled) return;

    setSelected(true);
    inputRef.current?.focus();
  }

  function handleBlur() {
    setSelected(false);
    wrapperRef.current?.blur();
  }

  return (
    <div
      className={`labelInput mediumFade pt1 ${
        selected && "labelInputSelected"
      } ${className}`}
      style={{
        boxShadow: `${
          errorLabel?.selector === id
            ? "0 0 0px 2px var(--dangerColor)"
            : "none"
        }`,
      }}
      onClick={() => handleFocus()}
      role={disabled ? "disabled" : "none"}
    >
      <label
        className="ml3 bold"
        htmlFor={id || label}
        style={{
          color: `${
            errorLabel?.selector == id
              ? "var(--dangerColor)"
              : "var(--txt)"
          }`,
        }}
      >
        {label}
      </label>
      <div className="row">
        <div className="w100 row pl2 pr2">
          {isTextArea ? (
            <textarea
              ref={inputRef as Ref<HTMLTextAreaElement>}
              className="p2 m0 w100"
              placeholder={placeholder || ""}
              role="labelInput"
              autoComplete={autoComplete}
              disabled={disabled}
              autoFocus={autoFocus}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={() => handleBlur()}
              style={{
                color: `${
                  errorLabel?.selector == id
                    ? "var(--dangerColor)"
                    : "var(--txt)"
                }`,
              }}
            />
          ) : options ? (
            <TypeInput
              value={value}
              onChange={(val) => onChange(val)}
              onInputChange={(val) => {}}
              options={options}
              placeholder={placeholder || ""}
            />
          ) : (
            <input
              id={id || label}
              ref={inputRef as Ref<HTMLInputElement>}
              className="p0 m0 w100"
              placeholder={placeholder || ""}
              role="labelInput"
              type={type || "text"}
              autoComplete={autoComplete}
              disabled={disabled}
              autoFocus={autoFocus}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={() => handleBlur()}
              style={{
                color: `${
                  errorLabel?.selector == id
                    ? "var(--dangerColor)"
                    : "var(--txt)"
                }`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
