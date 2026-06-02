import type { SharedContextProps } from "~/data/CommonTypes";
import { useOutletContext } from "react-router";

export interface LoadingProps {
  loadingText: string;
}

/******************************
 * Loading component
 * @todo Create description
 */
export function Loading({ loadingText }: LoadingProps) {
  const context: SharedContextProps = useOutletContext();

  return (
    <div
      className="w-100 col middle center fade-md"
      style={{ minHeight: "100vh", position: "sticky", top: 0 }}
    >
      <div className="ball"></div>
      <h3>{loadingText}</h3>
    </div>
  );
}
