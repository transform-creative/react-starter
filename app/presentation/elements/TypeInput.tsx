import { correctBorderRadius } from "framer-motion";
import Select, {
  InputActionMeta,
} from "react-select";
import Creatable from "react-select/creatable";
import { minLength } from "zod";

const colorStyles = {
  control: (
    baseStyles: any,
    {
      isDisabled,
      isFocused,
      isSelected,
    }: InputStyles,
  ) => ({
    ...baseStyles,
    boxShadow: isFocused
      ? "0 0 0 2px var(--accent) inset"
      : "0 0 0 1px var(--accent-md) inset",
    border: "none",
    height: "35px",
    cursor: "type",
    minHeight: 0,
    fontSize: "var(--text-sm)",
    fontFamily: "var(--font-secondary)",
    borderRadius: "var(--border)",
    width: "100%",
    textIndent: "10px",
    color: "var(--txt)",
    background: "var(--bkg-gradient)",
    textTransform: "Uppercase",
    fontWeight: 800,
  }),
  placeholder: (
    baseStyles: any,
    {
      isDisabled,
      isFocused,
      isSelected,
    }: InputStyles,
  ) => ({
    borderWidth: 0,
    position: "absolute",
    zindex: 20,
    top: 2,
    fontSize: "var(--text-sm)",
    fontFamily: "var(--font-secondary)",
    color: "var(--accent-lg)",
    textTransform: "Uppercase",
    fontWeight: 800,
  }),
  dataValue: () => ({
    gridArea: "none",
  }),

  singleValue: (baseStyles: any) => ({
    ...baseStyles,
    borderWidth: 0,
    //  background: "var(--accent)",
    fontSize: "var(--text-sm)",
    fontFamily: "var(--font-secondary)",
    margin: 0,
    borderRadius: "var(--border)",
    textIndent: "5px",
    display: "flex",
    justifyContent: "start",
    textTransform: "Uppercase",
    fontWeight: 800,
  }),

  valueContainer: (baseStyles: any) => ({
    ...baseStyles,
    borderWidth: 0,
    padding: "0 10px",
    margin: 0,
    fontSize: "var(--text-sm)",
    fontFamily: "var(--font-secondary)",
    borderRadius: "var(--border)",
    color: "var(--txt)",
    textTransform: "Uppercase",
    fontWeight: 800,
  }),

  input: (baseStyles: any) => ({
    ...baseStyles,
    color: "var(--txt)",
    fontFamily: "var(--font-secondary)",
    margin: 0,
    padding: 0,
    textTransform: "Uppercase",
    fontWeight: 800,
  }),

  menu: (baseStyles: any) => ({
    ...baseStyles,
    margin: 0,
    borderRadius: `var(--border)`,
    fontSize: "var(--text-sm)",
    fontFamily: "var(--font-secondary)",
    textTransform: "Uppercase",
    fontWeight: 800,
    zIndex: 9999,
  }),

  option: (
    baseStyles: any,
    {
      isDisabled,
      isFocused,
      isSelected,
    }: InputStyles,
  ) => ({
    ...baseStyles,
    fontSize: "var(--text-sm)",
    fontFamily: "var(--font-secondary)",
    display: "flex",
    padding: "10px 10px",
    justifyContent: "start",
    alignItems: "center",
    textTransform: "Uppercase",
    fontWeight: 800,
    transition: "0.2s",
    background: isFocused
      ? "#00000010"
      : undefined,
    color: isDisabled
      ? undefined
      : isSelected
        ? "var(--txt)"
        : isFocused
          ? "var(--txt)"
          : "var(--txt)",
    backgroundColor: isDisabled
      ? undefined
      : isSelected
        ? "none"
        : isFocused
          ? "none"
          : undefined,
  }),
};

export interface SelectableInputProps {
  id?: string;
  className?: string;
  options: any[];
  value: any;
  defaultValue?: string;
  onChange: (e: {
    target: {
      value: string;
      label: string;
      id: any;
    };
  }) => void;
  onInputChange: (e: {
    target: {
      value: string;
      label: string;
      id: any;
    };
  }) => void;
  disabled?: boolean;
  placeholder: string;
  width?: number;
}

interface InputStyles {
  isDisabled: boolean;
  isFocused: boolean;
  isSelected: boolean;
}
/******************************
 * TypeInput component
 * Controlled react-select dropdown wrapper with project styling
 */
export function TypeInput({
  id,
  className,
  options,
  value, // Assuming this is a string matching an option's 'value'
  onChange,
  onInputChange,
  disabled = false,
  placeholder = "select...",
}: SelectableInputProps) {
  // Find the full option object that matches your string value
  // This is the "Best Practice" for controlled components
  const selectedOption =
    options.find((opt) => opt?.value === value) ||
    null;

  return (
    <div className={className} id={id}>
      <Select
        options={options}
        // Use 'value' for the selection, not 'inputValue'
        value={selectedOption}
        onChange={(val) =>
          onChange({
            target: {
              value: val?.value,
              label: val?.label,
              id: id,
            },
          })
        }
        onInputChange={(val) => {
          onInputChange({
            target: {
              value: val,
              label: val,
              id: id,
            },
          });
        }}
        // Remove inputValue unless you are explicitly building a search-as-you-type feature
        isDisabled={disabled}
        components={{
          IndicatorSeparator: () => null,
        }}
        placeholder={placeholder}
        /*@ts-ignore*/
        styles={colorStyles}
      />
    </div>
  );
}

interface CreatableTypeInputProps {
  id?: string;
  className?: string;
  options: any[];
  value: any;
  defaultValue?: string;
  onChange: (e: {
    target: {
      value: string;
      label: string;
      id: any;
    };
  }) => void;

  onInputChange: (
    val: string,
    meta: InputActionMeta,
  ) => void;
  disabled?: boolean;
  placeholder: string;
  onCreate: (val: any) => void;
  width?: number;
}

export function CreatableTypeInput({
  id,
  className,
  options,
  value,
  defaultValue,
  onChange,
  onInputChange,
  disabled = false,
  placeholder = "select...",
  onCreate,
  width = 150,
}: CreatableTypeInputProps) {
  if (disabled) {
    return (
      <div className={className} id={id}>
        <input
          disabled
          value={defaultValue}
          onChange={() => {}}
        />
      </div>
    );
  }

  return (
    <div
      className={className}
      id={id}
      style={{ minWidth: width }}
    >
      <Creatable
        options={options}
        inputValue={value}
        value={value}
        onChange={(val) =>
          onChange({
            target: {
              value: val.value,
              label: val.label,
              id: id,
            },
          })
        }
        onInputChange={(val, meta) =>
          onInputChange(val, meta)
        }
        onCreateOption={(val) => onCreate(val)}
        isDisabled={disabled}
        components={{
          DropdownIndicator: () => null,
          IndicatorSeparator: () => null,
        }}
        placeholder={placeholder}
        defaultInputValue={defaultValue || ""}
        /*@ts-ignore*/
        styles={colorStyles}
      />
    </div>
  );
}
