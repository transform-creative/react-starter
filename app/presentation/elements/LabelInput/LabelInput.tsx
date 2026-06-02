import {
  CSSProperties,
  HTMLInputAutoCompleteAttribute,
  Ref,
  useRef,
  useState,
} from "react";
import { InputOption } from "~/data/CommonTypes";
import { TypeInput } from "../TypeInput";
import { Icon } from "../Icon";

export interface LabelInputProps {
  id?: string;
  type?: string;
  placeholder?: string;
  error?: string | undefined;
  errorColor?: string;
  name: string;
  value: any;
  defaultValue?: string;
  className?: string;
  autoComplete?: HTMLInputAutoCompleteAttribute;
  autoFocus?: boolean;
  disabled?: boolean;
  isTextArea?: boolean;
  style?: CSSProperties;
  options?: InputOption[];
  inlineLabel?: boolean;
  outline?: boolean;
  step?: number;
  onChange: (newValue: React.ChangeEvent<any>) => void;
  onInputChange?: (newValue: React.ChangeEvent<any>) => void;
  onKeyDown?: (e: React.KeyboardEvent<any>) => void;
}

/******************************
 * LabelInput component
 * Labelled text input that supports plain text, textarea, and react-select dropdown modes
 */
export function LabelInput ({
  id = "",
  name,
  value,
  defaultValue,
  error,
  errorColor="var(--danger)",
  placeholder,
  type,
  className,
  autoComplete,
  autoFocus,
  disabled,
  step = 1,
  isTextArea = false,
  options,
  inlineLabel = false,
  outline = false,
  style,
  onInputChange,
  onChange,
}: LabelInputProps) {
  const [selected, setSelected] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(
    null,
  );
  const wrapperRef = useRef<HTMLDivElement>(null);

  function handleFocus () {
    if (inputRef.current?.disabled) return;

    setSelected(true);
    inputRef.current?.focus();
  }

  function handleBlur () {
    setSelected(false);
    wrapperRef.current?.blur();
  }

  return (
    <div className="w-100 r-default"  >
      <div
        className={`${selected && ""
          } ${className}`}
        onClick={() => handleFocus()}
        role={disabled ? "disabled" : "none"}
      >
        {!inlineLabel && (
          <div className="mt-5 pt-5 mb-5">
            <label
              className="ml-5 bold"
              htmlFor={id || name}
              style={{
                color: `${error ? errorColor : style?.color || "var(--txt)"}`,
               
              }}
            >
              {name}
            </label>
          </div>
        )}
        <div className="row " >
          <div className="w-100 row middle" >
            {inlineLabel && <h3 className="mr-5 ml-5">{name}</h3>}
            {isTextArea ? (
              <textarea
                ref={inputRef as Ref<HTMLTextAreaElement>}
                id={id || name}
                name={name}
                className={`p-10 m-0 w-100 labelInput fade-sm ${selected && "labelInputSelected"
                  } ${outline ? "outline-secondary" : ""} ${className}`}
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
                  background: "var(--bkg-gradient)",
                }}
              />
            ) : options ? (
              <TypeInput
                id={id || name}
                value={value}
                defaultValue={defaultValue}
                disabled={disabled}
                /**@ts-ignore */
                onChange={(val) => onChange(val)}
                /**@ts-ignore */
                onInputChange={(val) => onInputChange?.(val)}
                options={options}
                className={`w-100 labelInput fade-sm ${selected && "labelInputSelected"
                  } ${outline ? "outline" : ""} ${className}`}
                placeholder={placeholder || ""}
              />
            ) : (
              <input
                id={id || name}
                name={name}
                step={step}
                ref={inputRef as Ref<HTMLInputElement>}
                className={`p-10 m-0 w-100 labelInput fade-sm ${selected && "labelInputSelected"
                  } ${outline ? "outline" : ""} ${className}`}
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
                  color: `${error ? errorColor : "var(--txt)"}`,
                                    background: "var(--bkg-gradient)",

                }}
              />
            )}
          </div>
        </div>
      </div>
      {error && (
        <div className="row middle gap-5">
          <Icon name="alert-circle-outline" color={errorColor} />
          <p style={{ color: errorColor }}>{error}</p>
        </div>
      )}
    </div>
  );
}
