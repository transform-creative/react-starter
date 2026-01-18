import {
  CSSProperties,
  HTMLInputAutoCompleteAttribute,
  Ref,
  useRef,
  useState,
} from "react";
import TypeInput from "./TypeInput";
import { InputOption } from "~/data/CommonTypes";

interface LabelInputProps {
  id?: string;
  type?: string;
  placeholder?: string;
  error?: string | undefined;
  name: string;
  value: any;
  className?: string;
  autoComplete?: HTMLInputAutoCompleteAttribute;
  autoFocus?: boolean;
  disabled?: boolean;
  isTextArea?: boolean;
  style?: CSSProperties;
  options?: InputOption[];
  inlineLabel?: boolean;
  onChange: (newValue: React.ChangeEvent<any>) => void;
}

export default function LabelInput({
  id = "",
  name,
  value,
  error,
  placeholder,
  type,
  className,
  autoComplete,
  autoFocus,
  disabled,
  isTextArea = false,
  options,
  inlineLabel = false,
  style,
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
    <div className="w100">
      <div
        className={`labelInput mediumFade  ${
          selected && "labelInputSelected"
        } ${className}`}
        style={{
          border: `${
            error ? "1px solid var(--danger)" : "1px solid var(--accent-med)"
          }`,
        }}
        onClick={() => handleFocus()}
        role={disabled ? "disabled" : "none"}
      >
        {!inlineLabel && (
          <div className="mt1">
            <label
              className="ml2 bold"
              htmlFor={id || name}
              style={{
                color: `${error ? "var(--danger)" : "var(--txt)"}`,
              }}
            >
              {name}
            </label>
          </div>
        )}
        <div className="row ">
          <div className="w100 row pr2 middle">
            {inlineLabel && <h3 className="ml2">{name}</h3>}
            {isTextArea ? (
              <textarea
                ref={inputRef as Ref<HTMLTextAreaElement>}
                id={id || name}
                name={name}
                className="p2 m0 w100"
                placeholder={placeholder || ""}
                role="labelInput"
                autoComplete={autoComplete}
                disabled={disabled}
                autoFocus={autoFocus}
                value={value}
                onChange={onChange}
                onBlur={() => handleBlur()}
                style={{
                  ...style,
                  color: `${error ? "var(--danger)" : "var(--txt)"}`,
                  border: "none",
                  background: "none"
                }}
              />
            ) : options ? (
              <TypeInput
              id={id || name}
                value={value}
                /**@ts-ignore */
                onChange={(val) => onChange(val)}
                onInputChange={(val) => {}}
                options={options}
                className="w100"
                placeholder={placeholder || ""}
              />
            ) : (
              <input
                id={id || name}
                name={name}
                ref={inputRef as Ref<HTMLInputElement>}
                className="p0 m0 w100"
                placeholder={placeholder || ""}
                role="labelInput"
                type={type || "text"}
                autoComplete={autoComplete}
                disabled={disabled}
                autoFocus={autoFocus}
                value={value}
                onChange={(e) => onChange(e)}
                onBlur={() => handleBlur()}
                style={{
                  ...style,
                  color: `${error ? "var(--danger)" : "var(--txt)"}`,
                }}
              />
            )}
          </div>
        </div>
      </div>
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}