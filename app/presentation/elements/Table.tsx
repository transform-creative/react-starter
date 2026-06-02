import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  useEffect,
  useState,
  useRef,
} from "react";
import { useOutletContext } from "react-router";
import {
  InputOption,
  SharedContextProps,
} from "~/data/CommonTypes";
import { LabelInput } from "./LabelInput/LabelInput";

export interface TableProps {
  col_keys: string[];
  col_values: string[];
  data: Record<string, any>[];
  onClick: (rowData: any) => void;
  actionButton?: (
    rowData: any,
  ) => React.ReactNode;
  actionButtonHeaderText?: string;
  showHeader?: boolean;
  totalItems?: number;
  isGraphColumn: boolean;
  onTotalItemsChange?: (count: number) => void;
  tableOptions: InputOption[];
  onOptionChange?: (option: string) => void;
  headerAction?: React.ReactNode;
  getRowKey?: (
    row: Record<string, any>,
    index: number,
  ) => string;
}

const DEFAULT_IMAGE =
  "https://egixfwkawhrysjzycbcv.supabase.co/storage/v1/object/public/profile_images/bat.png";

function isImageUrl(value: string): boolean {
  return (
    (value.startsWith("http") ||
      value.startsWith("/")) &&
    (/\.(jpg|jpeg|png|gif|svg|webp)$/i.test(
      value,
    ) ||
      /thumbnail/i.test(value) ||
      /image/i.test(value))
  );
}

function renderCell(
  col_key: string,
  cellValue: any,
  colIndex: number,
  isGraphColumn: boolean,
  rowData: Record<string, any>,
) {
  // Composite cell: { image, text }
  if (
    cellValue &&
    typeof cellValue === "object" &&
    "image" in cellValue &&
    "text" in cellValue
  ) {
    const imgSrc =
      typeof cellValue.image === "string" &&
      cellValue.image
        ? cellValue.image
        : DEFAULT_IMAGE;

    return (
      <div
        key={colIndex}
        className="row middle gap-10"
      >
        <img
          src={imgSrc}
          alt=""
          loading="lazy"
          style={{
            width: 40,
            height: 40,
            minWidth: 40,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
        <p>{cellValue.text}</p>
      </div>
    );
  }

  // Standalone image column
  const isImageCol = /image/i.test(col_key);
  if (isImageCol) {
    const src =
      typeof cellValue === "string" &&
      isImageUrl(cellValue)
        ? cellValue
        : DEFAULT_IMAGE;

    return (
      <div key={colIndex}>
        <img
          src={src}
          alt=""
          loading="lazy"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      </div>
    );
  }

  // Standalone Graph column
  if (
    isGraphColumn &&
    col_key === "donation_total"
  ) {
    return (
      <DonationScore
        key={colIndex}
        percentage={rowData.graph_percentage || 0}
        value={cellValue}
      />
    );
  }
  // Default text cell
  return <p key={colIndex}>{cellValue}</p>;
}

/******************************
 * Table component
 * Sortable data grid with image detection, graph columns, and per-row action buttons
 */
export function Table({
  col_keys = [],
  col_values = [],
  data,
  onClick,
  actionButton,
  actionButtonHeaderText,
  showHeader = true,
  totalItems = 10,
  isGraphColumn = true,
  onTotalItemsChange,
  tableOptions,
  onOptionChange,
  headerAction,
  getRowKey,
}: TableProps) {
  const gridTemplateColumns =
    col_keys.map(() => "1fr").join(" ") +
    (actionButton ? " auto" : "");

  const [tableTypeSearch, setTableTypeSearch] =
    useState("");
  const [
    selectedTableOption,
    setSelectedTableOption,
  ] = useState("");

  return (
    <div
      className="w-100"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      <div
        className="row middle between gap-10 mb-10"
        style={{ flexShrink: 0 }}
      >
        <div style={{ width: 200 }}>
          <LabelInput
            outline
            name="Table Type"
            options={tableOptions}
            value={selectedTableOption}
            defaultValue="Donations"
            onInputChange={(e) =>
              setTableTypeSearch(e.target.value)
            }
            onChange={(e) => {
              setSelectedTableOption(
                e.target.value,
              );
              onOptionChange?.(e.target.value);
            }}
          />
        </div>
        {headerAction}
        {onTotalItemsChange && (
          <select
            className="accent"
            value={totalItems}
            onChange={(e) =>
              onTotalItemsChange(
                Number(e.target.value),
              )
            }
          >
            {[5, 10, 20, 50].map((n) => (
              <option
                className="bkg"
                key={n}
                value={n}
              >
                {n}
              </option>
            ))}
            <option className="bkg" value={0}>
              All
            </option>
          </select>
        )}
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
        }}
      >
        {showHeader && (
          <div
            className="r-default"
            style={{
              background: "#eeeeee",
              display: "grid",
              gridTemplateColumns,
              alignItems: "center",
              padding: 10,
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            {col_values.map(
              (col_value, index) => (
                <h4 key={col_keys[index]}>
                  {col_value}
                </h4>
              ),
            )}
            {actionButton && (
              <h4>{actionButtonHeaderText}</h4>
            )}
          </div>
        )}
        <div className="w-100">
          {data.map((d, rowIndex) => (
            <div
              key={
                getRowKey
                  ? getRowKey(d, rowIndex)
                  : String(rowIndex)
              }
              className="p-5 clickable mt-5"
              style={{
                display: "grid",
                gridTemplateColumns,
                alignItems: "center",
                background: "#eeeeee55",
              }}
              onClick={() => onClick(d)}
            >
              {col_keys.map((col_key, colIndex) =>
                renderCell(
                  col_key,
                  d[col_key],
                  colIndex,
                  isGraphColumn,
                  d, // Pass the entire row data
                ),
              )}
              {actionButton && (
                <div
                  onClick={(e) =>
                    e.stopPropagation()
                  }
                >
                  {actionButton(d)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DonationScore({
  percentage,
  value,
}: {
  percentage: number;
  value: string;
}) {
  const barRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (barRef.current) {
      gsap.fromTo(
        barRef.current,
        { width: 0 },
        {
          width: `${percentage}%`,
          delay: 0.5,
          duration: 1,
          ease: "back.out",
        },
      );
    }
  }, [percentage]);

  return (
    <div
      className="w-100 outline r-lg"
      style={{ position: "relative" }}
    >
      <div
        className={`p-10 r-lg row ${percentage < 50 ? "end" : "start"}`}
        style={{
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          ref={barRef}
          className="accent r-lg"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
          }}
        />
        <h4
          style={{
            position: "relative",
            zIndex: 1,
            color:
              percentage > 50
                ? "var(--accent-sm)"
                : "var(--txt)",
          }}
        >
          {value}
        </h4>
      </div>
    </div>
  );
}
