"use client";

import { useMemo, useState } from "react";
import { Mascota, Plan, citasAPI, sesion, WOMPI_PUBLIC_KEY } from "@/lib/api";
import type { DetalleForm } from "./PasoDetalle";
import { formatearFechaLarga, formatearHora12 } from "@/lib/fechas";

interface Props {
    mascota: Mascota;
    plan: Plan;
    form: DetalleForm;
    onBack: () => void;
    onClose: () => void;
    onExito: () => void;
    esPrimeraVez?: boolean;
}

function fmt(n: number) {
    return "$" + n.toLocaleString("es-CO");
}

const ABREV_A_IDX: Record<string, number> = {
    Lun: 0, Mar: 1, Mié: 2, Jue: 3, Vie: 4, Sáb: 5, Dom: 6,
};

const toISO = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function generarFechasRecurrentes(inicio: string, dias: string[], diasVigencia = 30): string[] {
    if (!inicio || dias.length === 0) return [];
    const [y, m, d] = inicio.split("-").map(Number);
    const start = new Date(y, m - 1, d);
    const end = new Date(start.getTime() + diasVigencia * 86400000);
    const idx = new Set(dias.map((x) => ABREV_A_IDX[x]).filter((n) => n !== undefined));
    const out: string[] = [];
    const cur = new Date(start);
    while (cur <= end) {
        const pyWeekday = (cur.getDay() + 6) % 7;
        if (idx.has(pyWeekday)) out.push(toISO(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return out;
}

export default function PasoResumen({
    mascota,
    plan,
    form,
    onBack,
    onClose,
    onExito,
    esPrimeraVez = false,
}: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [exitoData, setExitoData] = useState<{ id_cita: number; citas_generadas?: any[] } | null>(null);

    const esGratis = esPrimeraVez;
    const recurrente = plan.dias_permitidos > 1 && !esPrimeraVez;
    const total = esGratis ? 0 : plan.precio_actual;

    const citasPreview = useMemo(() => {
        if (!recurrente) return [];
        return generarFechasRecurrentes(form.fecha, form.diasSemana);
    }, [recurrente, form.fecha, form.diasSemana]);

    async function confirmarYPagar() {
        setError("");
        setLoading(true);

        try {
            const token = sesion.obtenerToken();
            if (!token) throw new Error("Sesión expirada, vuelve a iniciar sesión");

            const data = await citasAPI.crear(
                {
                    id_mascota: mascota.id_mascota,
                    id_plan: plan.id_plan,
                    fecha: form.fecha,
                    hora: form.hora,
                    zona: form.zona,
                    direccion: form.direccion,
                    complemento_direccion: form.complemento,
                    es_conjunto: form.esConjunto,
                    torre: form.torre,
                    apto: form.apto,
                    dias_semana: recurrente ? form.diasSemana : [],
                    persona_entrega: form.personaEntrega,
                    persona_recibe: form.personaRecibe,
                    es_paseo_prueba: esGratis,
                    recurrente,
                },
                token
            );

            // Si es gratis
            if (data.monto === 0) {
                setLoading(false); // Quitamos el spinner
                setExitoData(data); // Mostramos la pantalla de éxito
                
                // Esperamos 3 segundos antes de redirigir
                setTimeout(() => {
                    onExito();
                    onClose();
                }, 3000); 
                return;
            }

            // Si tiene monto (Wompi)
            const centavos = Math.round(data.monto * 100);
            const f = document.createElement("form");
            f.action = "https://checkout.wompi.co/p/";
            f.method = "GET";
            f.innerHTML = `
              <input type="hidden" name="public-key" value="${WOMPI_PUBLIC_KEY}">
              <input type="hidden" name="currency" value="COP">
              <input type="hidden" name="amount-in-cents" value="${centavos}">
              <input type="hidden" name="reference" value="${data.referencia}">
              <input type="hidden" name="signature:integrity" value="${data.firma_integridad}">
              <input type="hidden" name="redirect-url" value="${window.location.origin}/perfil?pago=exitoso">
            `;
            document.body.appendChild(f);
            f.submit();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Error al procesar");
            setLoading(false);
        }
    }

    const titulo = recurrente ? "Confirma tu suscripción" : esGratis ? "Confirma tu paseo de bienvenida" : "Confirma tu agendamiento";
    const subtitulo = recurrente ? "Se hace un solo cobro y cubre todos los paseos del mes." : esGratis ? "Este paseo corre por nuestra cuenta. Al confirmar creamos la cita al instante." : "Al confirmar creamos la cita y te llevamos a Wompi.";
    const labelBotonPagar = esGratis ? "Confirmar paseo" : "Confirmar y pagar";

    return (
        <>
            <h2 className="pfa-title">{titulo}</h2>
            <p className="pfa-sub">{subtitulo}</p>

            {error && <div className="modal-error">⚠️ {error}</div>}

            <div className="pfa-resumen">
                <div className="pfa-resumen-row"><span>Mascota</span><strong>{mascota.nom_mascota}</strong></div>
                <div className="pfa-resumen-row"><span>Plan</span><strong>{plan.nom_plan}</strong></div>
                <div className="pfa-resumen-row"><span>{recurrente ? "Inicio" : "Fecha"}</span><strong>{formatearFechaLarga(form.fecha)}</strong></div>
                <div className="pfa-resumen-row"><span>Hora</span><strong>{formatearHora12(form.hora)}</strong></div>
                {recurrente && form.diasSemana.length > 0 && (
                    <div className="pfa-resumen-row"><span>Días</span><strong>{form.diasSemana.join(" · ")}</strong></div>
                )}
                <div className="pfa-resumen-row"><span>Dirección</span><strong>{form.direccion}</strong></div>
                {form.personaEntrega && <div className="pfa-resumen-row"><span>Entrega</span><strong>{form.personaEntrega}</strong></div>}
                {form.personaRecibe && <div className="pfa-resumen-row"><span>Recibe</span><strong>{form.personaRecibe}</strong></div>}
                {esGratis && <div className="pfa-resumen-row"><span>Primer paseo (bienvenida)</span><strong className="pfa-resumen-free">Sí, gratis</strong></div>}
                <div className="pfa-resumen-row"><span>Duración</span><strong>{plan.duracion_minutos || 55} min</strong></div>

                <div className="pfa-resumen-total">
                    <span>{recurrente ? "Total del plan" : "Total"}</span>
                    <strong>{fmt(total)}</strong>
                </div>
            </div>

            <div className="pfa-actions">
                <button className="btn-perfil btn-outline" onClick={onBack} disabled={loading || !!exitoData}>Atrás</button>
                <button className="btn-perfil btn-primary" onClick={confirmarYPagar} disabled={loading || !!exitoData}>
                    {loading ? <><i className="fas fa-spinner fa-spin" /> Procesando…</> : labelBotonPagar}
                </button>
            </div>

            {/* PANTALLA DE ÉXITO */}
            {exitoData && (
                <div className="pfa-exito-overlay">
                    <div className="pfa-exito-box">
                        <div className="pfa-exito-icon">🎉</div>
                        <h2>¡Paseo Confirmado!</h2>
                        <p>
                            {exitoData.citas_generadas && exitoData.citas_generadas.length > 1
                                ? `Se han agendado ${exitoData.citas_generadas.length} paseos con éxito.`
                                : "Tu paseo ha sido agendado con éxito."}
                        </p>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                            Redirigiendo a tu agenda...
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}