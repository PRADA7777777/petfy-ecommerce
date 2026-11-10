"use client";
import { useMemo, useState } from "react";
import { CitaResumen, Mascota } from "@/lib/api";

interface Props {
    citas: CitaResumen[];
    mascotas: Mascota[];
}

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const COLORES = ["#E0633F", "#064F56", "#F59E0B", "#3B82F6", "#8B5CF6", "#EC4899"];

const fmtHoraAMPM = (horaStr: string | null | undefined) => {
    if (!horaStr) return "";
    const [h, m] = horaStr.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
};

export default function CalendarioPaseos({ citas, mascotas }: Props) {
    const hoy = new Date();
    const [mes, setMes] = useState(hoy.getMonth());
    const [anio, setAnio] = useState(hoy.getFullYear());
    const [diaSel, setDiaSel] = useState<string | null>(null);

    const isSinglePet = mascotas.length === 1;

    const petColors = useMemo(() => {
        const map = new Map<number, string>();
        mascotas.forEach((m, i) => map.set(m.id_mascota, COLORES[i % COLORES.length]));
        return map;
    }, [mascotas]);

    const porFecha = useMemo(() => {
        const map = new Map<string, CitaResumen[]>();
        citas.forEach((c) => {
            if (!map.has(c.fecha)) map.set(c.fecha, []);
            map.get(c.fecha)!.push(c);
        });
        return map;
    }, [citas]);

    const celdas = useMemo(() => {
        const primero = new Date(anio, mes, 1);
        const ultimo = new Date(anio, mes + 1, 0).getDate();
        const offset = (primero.getDay() + 6) % 7;
        const arr = [];
        for (let i = 0; i < offset; i++) arr.push({ iso: null, dia: null });
        for (let d = 1; d <= ultimo; d++) {
            const iso = `${anio}-${String(mes + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            arr.push({ iso, dia: d });
        }
        return arr;
    }, [mes, anio]);

    const hoyIso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
    const citasDiaSel = diaSel ? porFecha.get(diaSel) || [] : [];

    return (
        <div className="vp-calendario">
            <div className="vp-cal-header">
                <button onClick={() => { if (mes === 0) { setMes(11); setAnio(anio - 1); } else setMes(mes - 1); }}>‹</button>
                <span>{MESES[mes]} {anio}</span>
                <button onClick={() => { if (mes === 11) { setMes(0); setAnio(anio + 1); } else setMes(mes + 1); }}>›</button>
            </div>

            <div className="vp-cal-semana">
                {DIAS.map((d) => <span key={d}>{d}</span>)}
            </div>

            <div className="vp-cal-grid">
                {celdas.map((c, i) => {
                    if (!c.iso) return <div key={i} className="vp-cal-dia vacio" />;
                    const eventos = porFecha.get(c.iso) || [];
                    const mascotasUnicas = Array.from(new Set(eventos.map(e => e.id_mascota))).slice(0, 4);

                    return (
                        <button
                            key={c.iso}
                            type="button"
                            className={`vp-cal-dia ${c.iso === hoyIso ? "hoy" : ""} ${c.iso === diaSel ? "sel" : ""}`}
                            onClick={() => setDiaSel(c.iso === diaSel ? null : c.iso)}
                        >
                            <span className="vp-cal-num">{c.dia}</span>
                            {eventos.length > 0 && (
                                <div className="vp-cal-avatares">
                                    {mascotasUnicas.map((idMasc, idx) => (
                                        <div 
                                            key={idx} 
                                            className="vp-cal-dot" 
                                            style={{ background: petColors.get(idMasc) || "var(--teal)" }}
                                        />
                                    ))}
                                    {eventos.length > 4 && <span className="vp-cal-mas">+{eventos.length - 4}</span>}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* 🔥 Leyenda de colores agregada */}
            {!isSinglePet && mascotas.length > 1 && (
                <div className="vp-leyenda">
                    {mascotas.map(m => (
                        <div key={m.id_mascota} className="vp-leyenda-item">
                            <div className="vp-leyenda-dot" style={{ background: petColors.get(m.id_mascota) }} />
                            <span>{m.nom_mascota}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Panel de detalles sin la X ni el título */}
            {diaSel && (
                <div className="vp-cal-detalle">
                    {citasDiaSel.length === 0 ? (
                        <p className="vp-empty-text">Día libre, sin paseos agendados.</p>
                    ) : (
                        <div className="vp-cal-lista">
                            {citasDiaSel.map((c) => {
                                const color = petColors.get(c.id_mascota) || "var(--teal)";
                                return (
                                    <div 
                                        key={c.id_cita} 
                                        className="vp-cal-evento" 
                                        style={{ 
                                            backgroundColor: `${color}15`, // Fondo pastel dinámico (15 es el nivel de opacidad)
                                            borderLeft: `3px solid ${color}` 
                                        }}
                                    >
                                        <span 
                                            className="vp-cal-evento-hora" 
                                            style={{ color: color, backgroundColor: `${color}25` }}
                                        >
                                            {fmtHoraAMPM(c.hora)}
                                        </span>
                                        <span className="vp-cal-evento-info">
                                            {c.nom_mascota} <span className="vp-cal-plan">({c.nom_plan})</span>
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}