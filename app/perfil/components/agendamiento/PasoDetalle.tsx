"use client";

import { useEffect, useMemo, useState } from "react";
import { Plan, planesAPI, DisponibilidadPlan } from "../../../lib/api";
import {
    formatearFechaLarga,
    formatearHora12,
    NOMBRES_MESES,
    DIAS_CORTOS,
} from "../../../lib/fechas";

export interface DetalleForm {
    fecha: string;
    hora: string;
    diasSemana: string[];
    zona: string;
    direccion: string;
    esConjunto: boolean;
    torre: string;
    apto: string;
    complemento: string;
    personaEntrega: string;
    personaRecibe: string;
}

interface Props {
    plan: Plan;
    form: DetalleForm;
    setForm: (f: DetalleForm) => void;
    onNext: () => void;
    onBack: () => void;
    esPrimeraVez?: boolean;
}

const DIAS_CHIP = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Mapa ISO day (0=Dom..6=Sáb) → label del backend
const LABEL_POR_ISO = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const ABREV_A_IDX: Record<string, number> = {
    Lun: 0, Mar: 1, Mié: 2, Jue: 3, Vie: 4, Sáb: 5, Dom: 6,
};

const toISO = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function PasoDetalle({ plan, form, setForm, onNext, onBack, esPrimeraVez }: Props) {
    const [disp, setDisp] = useState<DisponibilidadPlan | null>(null);
    const [loadedPlanId, setLoadedPlanId] = useState<number | null>(null);
    const loadingDisp = loadedPlanId !== plan.id_plan;

    const showDias = plan.dias_permitidos > 1;

    useEffect(() => {
        let cancelado = false;
        planesAPI
            .disponibilidad(plan.id_plan)
            .then((d) => {
                if (!cancelado) {
                    setDisp(d);
                    setLoadedPlanId(plan.id_plan);
                }
            })
            .catch((e) => console.error("Error disponibilidad:", e));
        return () => { cancelado = true; };
    }, [plan.id_plan]);

    const diasHabilitados = useMemo(
        () => new Set((disp?.dias_disponibles ?? []).map((d) => d.label)),
        [disp]
    );

    const fechasBloqueadas = useMemo(() => {
        const set = new Set<string>();
        (disp?.excepciones ?? []).forEach((e) => {
            if (!e.es_laborable) set.add(e.fecha);
        });
        return set;
    }, [disp]);

    const horasDisponibles = useMemo(() => {
        if (!disp || disp.dias_disponibles.length === 0) return [];
        const { hora_inicio, hora_fin } = disp.dias_disponibles[0];
        const [hIni] = hora_inicio.split(":").map(Number);
        const [hFin] = hora_fin.split(":").map(Number);
        const arr: { value: string; label: string }[] = [];
        for (let h = hIni; h < hFin; h++) {
            const value = `${String(h).padStart(2, "0")}:00`;
            arr.push({ value, label: formatearHora12(value) });
        }
        return arr;
    }, [disp]);

    // ── Fechas que caen en la rutina dentro de la vigencia ──
    const fechasDestacadas = useMemo(() => {
        const out = new Set<string>();
        if (!showDias || !form.fecha || form.diasSemana.length === 0) return out;
        const [y, m, d] = form.fecha.split("-").map(Number);
        const start = new Date(y, m - 1, d);
        const end = new Date(start.getTime() + 30 * 86400000);
        const idx = new Set(
            form.diasSemana
                .map((x) => ABREV_A_IDX[x])
                .filter((n): n is number => n !== undefined)
        );
        const cur = new Date(start);
        while (cur <= end) {
            const pyWeekday = (cur.getDay() + 6) % 7;
            if (idx.has(pyWeekday)) out.add(toISO(cur));
            cur.setDate(cur.getDate() + 1);
        }
        return out;
    }, [form.fecha, form.diasSemana, showDias]);

    // ── Auto-marcar chip al elegir fecha (solo primera vez) ──
    const onSelectFecha = (iso: string) => {
        if (!showDias) {
            setForm({ ...form, fecha: iso });
            return;
        }
        const [y, m, d] = iso.split("-").map(Number);
        const label = LABEL_POR_ISO[new Date(y, m - 1, d).getDay()];
        const set = new Set(form.diasSemana);
        // Si el día de la nueva fecha no está marcado y aún hay cupo → se auto-marca
        if (!set.has(label) && set.size < plan.dias_permitidos) {
            set.add(label);
        }
        setForm({
            ...form,
            fecha: iso,
            diasSemana: DIAS_CHIP.filter((x) => set.has(x)),
        });
    };

    const toggleDia = (d: string) => {
        if (!diasHabilitados.has(d)) return;
        const set = new Set(form.diasSemana);
        if (set.has(d)) set.delete(d);
        else {
            if (set.size >= plan.dias_permitidos) return;
            set.add(d);
        }
        setForm({ ...form, diasSemana: DIAS_CHIP.filter((x) => set.has(x)) });
    };

    const errorFecha = useMemo(() => {
        if (!form.fecha) return "";
        if (fechasBloqueadas.has(form.fecha)) {
            const motivo = disp?.excepciones.find((e) => e.fecha === form.fecha)?.motivo;
            return `No hay servicio ese día${motivo ? ` (${motivo})` : ""}.`;
        }
        const [y, m, d] = form.fecha.split("-").map(Number);
        const fecha = new Date(y, m - 1, d);
        const label = LABEL_POR_ISO[fecha.getDay()];
        if (!diasHabilitados.has(label)) {
            return `El servicio no opera los ${label}.`;
        }
        return "";
    }, [form.fecha, fechasBloqueadas, diasHabilitados, disp]);

    const valido =
        form.fecha &&
        form.hora &&
        form.direccion.trim().length > 0 &&
        !errorFecha &&
        (!showDias || form.diasSemana.length === plan.dias_permitidos);

    return (
        <>
            <h2 className="pfa-title">Fecha, hora y dirección</h2>
            <p className="pfa-sub">Aquí nos dices cuándo y dónde recogemos a tu peludo.</p>

            {loadingDisp && (
                <p style={{ fontSize: "0.85rem", color: "#6B7280" }}>
                    Verificando disponibilidad…
                </p>
            )}

            {/* Fecha */}
            <div className="form-group">
                <label>Fecha *</label>
                {disp && (
                    <MiniCalendario
                        value={form.fecha}
                        onChange={onSelectFecha}
                        diasHabilitados={diasHabilitados}
                        fechasBloqueadas={fechasBloqueadas}
                        fechasDestacadas={fechasDestacadas}
                    />
                )}
                {form.fecha && (
                    <small className="form-help">
                        Seleccionaste: <strong>{formatearFechaLarga(form.fecha)}</strong>
                    </small>
                )}
                {errorFecha && (
                    <small style={{ color: "#dc2626", fontSize: "0.75rem", display: "block", marginTop: 4 }}>
                        ⚠️ {errorFecha}
                    </small>
                )}
            </div>

            {/* Hora */}
            <div className="form-group">
                <label>Hora *</label>
                <select
                    className="pfa-hora-select"
                    value={form.hora}
                    onChange={(e) => setForm({ ...form, hora: e.target.value })}
                    disabled={!disp}
                >
                    <option value="">-- Selecciona una hora --</option>
                    {horasDisponibles.map((h) => (
                        <option key={h.value} value={h.value}>{h.label}</option>
                    ))}
                </select>
                <small className="form-help">
                    Horario del servicio: 06:00 AM – 05:00 PM
                </small>
            </div>

            {/* Días chips */}
            {showDias && (
                <div className="form-group">
                    <label>Días de la semana * (elige {plan.dias_permitidos})</label>
                    <div className="pfa-dias">
                        {DIAS_CHIP.map((d) => {
                            const habilitado = diasHabilitados.has(d);
                            return (
                                <button
                                    key={d}
                                    type="button"
                                    disabled={!habilitado}
                                    className={`pfa-dia-chip ${form.diasSemana.includes(d) ? "pfa-selected" : ""} ${!habilitado ? "pfa-disabled" : ""}`}
                                    onClick={() => toggleDia(d)}
                                >
                                    {d}
                                </button>
                            );
                        })}
                    </div>
                    <small className="form-help">
                        {form.diasSemana.length} / {plan.dias_permitidos} seleccionados
                    </small>
                </div>
            )}

            {/* Dirección */}
            <div className="form-group">
                <label>Dirección *</label>
                <input
                    type="text"
                    placeholder="Calle 63 # 11-25"
                    value={form.direccion}
                    onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Zona / Barrio</label>
                    <input
                        type="text"
                        placeholder="Chapinero"
                        value={form.zona}
                        onChange={(e) => setForm({ ...form, zona: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>Complemento</label>
                    <input
                        type="text"
                        placeholder="Apto 301, torre B…"
                        value={form.complemento}
                        onChange={(e) => setForm({ ...form, complemento: e.target.value })}
                    />
                </div>
            </div>

            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                    type="checkbox"
                    id="pfa-es-conjunto"
                    checked={form.esConjunto}
                    onChange={(e) => setForm({ ...form, esConjunto: e.target.checked })}
                    style={{ width: "auto" }}
                />
                <label htmlFor="pfa-es-conjunto" style={{ margin: 0 }}>
                    Es un conjunto residencial
                </label>
            </div>

            {form.esConjunto && (
                <div className="form-row">
                    <div className="form-group">
                        <label>Torre</label>
                        <input type="text" value={form.torre}
                            onChange={(e) => setForm({ ...form, torre: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Apartamento</label>
                        <input type="text" value={form.apto}
                            onChange={(e) => setForm({ ...form, apto: e.target.value })} />
                    </div>
                </div>
            )}

            <div className="form-row">
                <div className="form-group">
                    <label>Quién entrega la mascota</label>
                    <input type="text" value={form.personaEntrega}
                        onChange={(e) => setForm({ ...form, personaEntrega: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Quién la recibe</label>
                    <input type="text" value={form.personaRecibe}
                        onChange={(e) => setForm({ ...form, personaRecibe: e.target.value })} />
                </div>
            </div>

            <div className="pfa-actions">
                <button className="btn-perfil btn-outline" onClick={onBack}>Atrás</button>
                <button className="btn-perfil btn-primary" onClick={onNext} disabled={!valido}>
                    Continuar
                </button>
            </div>
        </>
    );
}

// Mini calendario
export function MiniCalendario({
    value,
    onChange,
    diasHabilitados,
    fechasBloqueadas,
    fechasDestacadas,
    slotDisponibleEn,
    modoLectura = false,

}: {
    value: string;
    onChange: (iso: string) => void;
    diasHabilitados: Set<string>;
    fechasBloqueadas: Set<string>;
    fechasDestacadas?: Set<string>;
    slotDisponibleEn?: (iso: string) => boolean;
    modoLectura?: boolean;
}) {
    const hoy = new Date();
    const [mes, setMes] = useState({
        year: hoy.getFullYear(),
        month: hoy.getMonth(),
    });

    const primerDia = new Date(mes.year, mes.month, 1).getDay();
    const diasEnMes = new Date(mes.year, mes.month + 1, 0).getDate();

    const celdas: (number | null)[] = [];
    for (let i = 0; i < primerDia; i++) celdas.push(null);
    for (let d = 1; d <= diasEnMes; d++) celdas.push(d);


    const toISOstr = (y: number, m: number, d: number) =>
        `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    const esValida = (dia: number) => {
        if (modoLectura) return true;
        const fecha = new Date(mes.year, mes.month, dia);
        const hoyLimpio = new Date();
        hoyLimpio.setHours(0, 0, 0, 0);
        if (fecha < hoyLimpio) return false;

        const label = LABEL_POR_ISO[fecha.getDay()];
        if (!diasHabilitados.has(label)) return false;

        const iso = toISOstr(mes.year, mes.month, dia);
        if (fechasBloqueadas.has(iso)) return false;
        if (slotDisponibleEn && !slotDisponibleEn(iso)) return false;

        return true;
    };

    const mesAnterior = () =>
        setMes((m) =>
            m.month === 0
                ? { year: m.year - 1, month: 11 }
                : { year: m.year, month: m.month - 1 }
        );

    const mesSiguiente = () =>
        setMes((m) =>
            m.month === 11
                ? { year: m.year + 1, month: 0 }
                : { year: m.year, month: m.month + 1 }
        );

    return (
        <div className="mini-calendario">
            <div className="mini-calendario-header">
                <button type="button" onClick={mesAnterior}>‹</button>
                <span>
                    {NOMBRES_MESES[mes.month]} {mes.year}
                </span>
                <button type="button" onClick={mesSiguiente}>›</button>
            </div>
            <div className="mini-calendario-semana">
                {DIAS_CORTOS.map((d, i) => (
                    <span key={i}>{d}</span>
                ))}
            </div>
            <div className="mini-calendario-grid">
                {celdas.map((dia, i) => {
                    if (dia === null) return <span key={i} />;
                    const iso = toISOstr(mes.year, mes.month, dia);
                    const valida = esValida(dia);
                    const seleccionada = value === iso;
                    const destacada = !!fechasDestacadas?.has(iso);

                    const clases = [
                        "mini-calendario-dia",
                        seleccionada ? "seleccionado" : "",
                        destacada ? "destacado" : "",
                        !valida ? "disabled" : "",
                    ].filter(Boolean).join(" ");

                    return (
                        <button
                            key={i}
                            type="button"
                            disabled={!valida}
                            className={clases}
                            onClick={() => onChange(iso)}
                        >
                            {dia}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}