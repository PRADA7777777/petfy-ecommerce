"use client";

interface Props {
  step: number;
  total?: number;
}

export default function Stepper({ step, total = 4 }: Props) {
  return (
    <div className="pfa-stepper">
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        const cls = n === step ? "pfa-active" : n < step ? "pfa-done" : "";
        return (
          <div key={n} style={{ display: "flex", alignItems: "center", flex: n < total ? 1 : 0 }}>
            <div className={`pfa-dot ${cls}`}>{n < step ? "✓" : n}</div>
            {n < total && <div className="pfa-dot-line" />}
          </div>
        );
      })}
    </div>
  );
}