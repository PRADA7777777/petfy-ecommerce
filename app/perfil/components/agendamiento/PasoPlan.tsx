"use client";

import { Plan } from "../../../lib/api";

interface Props {
    planes: Plan[];
    selected: number | null;
    onChange: (id: number) => void;
    onNext: () => void;
    onBack: () => void;
    esPrimeraVez?: boolean;
}

function fmt(n: number) {
    return "$" + n.toLocaleString("es-CO");
}

const ICONOS: Record<number, string> = { 1: "⚡", 2: "✨", 3: "🔥" };
const BADGES: Record<number, { text: string; cls: string }> = {
    1: { text: "SIN SUSCRIPCIÓN", cls: "pfa-badge-verde" },
    2: { text: "MÁS POPULAR", cls: "pfa-badge-naranja" },
    3: { text: "RECOMENDADO", cls: "pfa-badge-amarillo" },
};

export default function PasoPlan({
    planes,
    selected,
    onChange,
    onNext,
    onBack,
    esPrimeraVez = false,
}: Props) {
    // ─── MODO PRIMERA VEZ ──────────────────────────────
    if (esPrimeraVez) {
        const planBienvenida = planes.find((p) => p.dias_permitidos === 1) || planes[0];
        return (
            <>
                <h2 className="pfa-title">¡Tu primer paseo es gratis! 🎉</h2>
                <p className="pfa-sub">
                    Antes de que elijas un plan, queremos que un paseador conozca a tu
                    peludo. Este paseo de bienvenida corre por nuestra cuenta.
                </p>

                {planBienvenida && (
                    <div className="pfa-plan-card pfa-selected">
                        <div className="pfa-plan-icono">🎁</div>
                        <h3 className="pfa-plan-nombre">{planBienvenida.nom_plan}</h3>
                        <span className="pfa-plan-badge pfa-badge-verde">
                            GRATIS · PRIMER PASEO
                        </span>
                        <div className="pfa-plan-precio">
                            <span className="pfa-precio-num" style={{ fontSize: "2.2rem" }}>$0</span>
                            <span className="pfa-precio-unit" style={{ textDecoration: "line-through", marginLeft: "0.4rem" }}>
                                {fmt(planBienvenida.precio_actual)}
                            </span>
                        </div>
                        <ul className="pfa-plan-features">
                            <li><span className="pfa-check">✓</span>1 hora de paseo</li>
                            <li><span className="pfa-check">✓</span>El paseador conoce a tu mascota</li>
                            <li><span className="pfa-check">✓</span>Evaluación de comportamiento</li>
                            <li><span className="pfa-check">✓</span>GPS en vivo y fotos</li>
                        </ul>
                        <p className="pfa-plan-duracion">
                            *Duración: {planBienvenida.duracion_minutos ?? 55} minutos
                        </p>
                    </div>
                )}

                <div className="pfa-actions">
                    <button className="btn-perfil btn-outline" onClick={onBack}>Atrás</button>
                    <button className="btn-perfil btn-primary" onClick={onNext} disabled={!planBienvenida}>
                        Continuar
                    </button>
                </div>
            </>
        );
    }

    // ─── MODO NORMAL: ACORDEÓN ─────────────────────────
    return (
        <>
            <h2 className="pfa-title">Elige tu plan</h2>
            <p className="pfa-sub">
                Los planes de más de 1 día por semana funcionan como suscripción mensual.
            </p>

            <div className="pfa-planes-accordion">
                {planes.map((p) => {
                    const abierto = selected === p.id_plan;
                    const badge = BADGES[p.dias_permitidos];
                    return (
                        <div
                            key={p.id_plan}
                            className={`pfa-accordion ${abierto ? "open" : ""}`}
                        >
                            <button
                                type="button"
                                className="pfa-accordion-header"
                                onClick={() => onChange(p.id_plan)}
                                aria-expanded={abierto}
                            >
                                <span className="pfa-accordion-icon">
                                    {ICONOS[p.dias_permitidos] ?? "🐾"}
                                </span>
                                <div className="pfa-accordion-title">
                                    <strong>{p.nom_plan}</strong>
                                    <small>
                                        {p.dias_permitidos === 1
                                            ? "Paseo único"
                                            : `${p.dias_permitidos} días por semana`}
                                    </small>
                                </div>
                                <div className="pfa-accordion-price">
                                    <strong>{fmt(p.precio_actual)}</strong>
                                    <small>
                                        {p.dias_permitidos === 1 ? "por paseo" : "/mes"}
                                    </small>
                                </div>
                                <i className={`fas fa-chevron-${abierto ? "up" : "down"}`} />
                            </button>

                            {abierto && (
                                <div className="pfa-accordion-body">
                                    {badge && (
                                        <span className={`pfa-plan-badge ${badge.cls}`}>
                                            {badge.text}
                                        </span>
                                    )}
                                    {p.descripcion && (
                                        <p className="pfa-accordion-desc">{p.descripcion}</p>
                                    )}
                                    <ul className="pfa-plan-features">
                                        <li><span className="pfa-check">✓</span>1 hora por sesión</li>
                                        <li><span className="pfa-check">✓</span>GPS en vivo</li>
                                        <li><span className="pfa-check">✓</span>Fotos del paseo</li>
                                        <li><span className="pfa-check">✓</span>Paseador certificado</li>
                                        <li><span className="pfa-check">✓</span>Seguro incluido</li>
                                    </ul>
                                    <p className="pfa-plan-duracion">
                                        *Duración: {p.duracion_minutos ?? 55} min por sesión
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="pfa-actions">
                <button className="btn-perfil btn-outline" onClick={onBack}>Atrás</button>
                <button className="btn-perfil btn-primary" onClick={onNext} disabled={!selected}>
                    Continuar
                </button>
            </div>
        </>
    );
}