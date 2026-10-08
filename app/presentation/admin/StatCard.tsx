export interface StatCardProps {
  label: string;
  value: string;
  /** Optional supporting line, e.g. "12 payments" */
  hint?: string;
}

/******************************
 * StatCard component
 * A single headline figure. Used in grids (.grid-250) so it reflows to one
 * column on a phone.
 */
export function StatCard({
  label,
  value,
  hint,
}: StatCardProps) {
  return (
    <div className="boxed outline p-20 col gap-5">
      <p className="start">{label}</p>
      <h2 className="start">{value}</h2>
      {hint && <p className="start">{hint}</p>}
    </div>
  );
}
