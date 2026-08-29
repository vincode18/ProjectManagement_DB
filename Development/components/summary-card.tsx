import { Card, CardContent } from './ui';

export function SummaryCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="label">{label}</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <p className="text-2xl font-bold text-ink">{value}</p>
          {hint ? <p className="text-xs text-muted">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
