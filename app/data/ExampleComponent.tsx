import type { SharedContextProps } from "~/data/CommonTypes";
import { useOutletContext } from "react-router";

export interface ExampleComponentProps {}

/******************************
 * ExampleComponent component
 * Comments should follow this structure with an 'asterisk line' across the top.
 * Use this file as the template for every new component in the app.
 */
export function ExampleComponent({}: ExampleComponentProps) {
  const context: SharedContextProps = useOutletContext();

  return (
    <div>
      <h1>ExampleComponent</h1>
    </div>
  );
}
