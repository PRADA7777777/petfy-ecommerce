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
          <div key={n} className="pfa-step-item">
            <div className={`pfa-dot ${cls}`}>
              {n < step ? <i className="fas fa-check"></i> : n}
            </div>
            {n < total && <div className="pfa-dot-line" />}
          </div>
        );
      })}
    </div>
  );
}