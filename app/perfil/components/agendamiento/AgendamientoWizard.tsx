"use client";

import { useEffect, useMemo, useState } from "react";
import { Mascota, Plan, planesAPI, citasAPI, sesion } from "../../../lib/api";
import Stepper from "./Stepper";
import PasoMascota from "./PasoMascota";
import PasoPlan from "./PasoPlan";
import PasoDetalle, { DetalleForm } from "./PasoDetalle";
import PasoResumen from "./PasoResumen";
import "./agendamiento.css";

interface Props {
  onClose: () => void;
  mascotas: Mascota[];
  onExito: () => void;
  mascotaPreseleccionada?: number | null;
}

const FORM_INICIAL: DetalleForm = {
  fecha: "",
  hora: "",
  diasSemana: [],
  zona: "",
  direccion: "",
  esConjunto: false,
  torre: "",
  apto: "",
  complemento: "",
  personaEntrega: "",
  personaRecibe: "",
};

export default function AgendamientoWizard({
  onClose,
  mascotas,
  onExito,
  mascotaPreseleccionada = null,
}: Props) {
  const [step, setStep] = useState(1);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loadingPlanes, setLoadingPlanes] = useState(true);
  const [mascotaId, setMascotaId] = useState<number | null>(mascotaPreseleccionada);
  const [planId, setPlanId] = useState<number | null>(null);
  const [detalle, setDetalle] = useState<DetalleForm>(FORM_INICIAL);

  // ¿La mascota seleccionada tiene disponible su paseo de bienvenida?
  const [esPaseoBienvenida, setEsPaseoBienvenida] = useState(false);
  const [cargandoPrueba, setCargandoPrueba] = useState(false);

  // ─── Cargar planes ──────────────────────────────────────────
  useEffect(() => {
    let cancelado = false;

    async function cargarPlanes() {
      try {
        const data = await planesAPI.listar("paseos");
        if (!cancelado) setPlanes(data);
      } catch (e) {
        console.error("Error cargando planes:", e);
      } finally {
        if (!cancelado) setLoadingPlanes(false);
      }
    }

    cargarPlanes();
    return () => {
      cancelado = true;
    };
  }, []);

  // ─── Detectar si la mascota tiene paseo de bienvenida ───────
  useEffect(() => {
    let cancelado = false;

    async function verificarPaseoBienvenida() {
      // Sin mascota → no hay nada que consultar
      if (!mascotaId) {
        if (!cancelado) {
          setEsPaseoBienvenida(false);
          setCargandoPrueba(false);
        }
        return;
      }

      const token = sesion.obtenerToken();
      if (!token) {
        if (!cancelado) {
          setEsPaseoBienvenida(false);
          setCargandoPrueba(false);
        }
        return;
      }

      if (!cancelado) setCargandoPrueba(true);

      try {
        const r = await citasAPI.paseoPruebaDisponible(mascotaId, token);
        if (!cancelado) setEsPaseoBienvenida(r.disponible);
      } catch {
        if (!cancelado) setEsPaseoBienvenida(false);
      } finally {
        if (!cancelado) setCargandoPrueba(false);
      }
    }

    verificarPaseoBienvenida();
    return () => {
      cancelado = true;
    };
  }, [mascotaId]);

  // ─── Plan de bienvenida (Paseo Único, días=1) ───────────────
  const planBienvenida = useMemo<Plan | null>(() => {
    if (!esPaseoBienvenida || planes.length === 0) return null;
    return planes.find((p) => p.dias_permitidos === 1) || planes[0];
  }, [esPaseoBienvenida, planes]);

  // ─── Plan efectivo ──────────────────────────────────────────
  const planEfectivo = useMemo<Plan | null>(() => {
    if (esPaseoBienvenida) return planBienvenida;
    return planes.find((p) => p.id_plan === planId) || null;
  }, [esPaseoBienvenida, planBienvenida, planes, planId]);

  const mascotaSeleccionada = mascotas.find((m) => m.id_mascota === mascotaId) || null;

  return (
    <div className="modal-overlay active">
      <div className="modal-container modal-mascota">
        <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
          &times;
        </button>

        <div className="modal-mascota-header" style={{ marginBottom: "0.5rem" }}>
          <div className="modal-mascota-icon">
            <i className="fas fa-paw" />
          </div>
          <h2>{esPaseoBienvenida ? "Paseo de bienvenida" : "Agendar paseo"}</h2>
          <p>Paso {step} de 4</p>
        </div>

        <Stepper step={step} />

        {step === 1 && (
          <PasoMascota
            mascotas={mascotas}
            selected={mascotaId}
            onChange={setMascotaId}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 &&
          (loadingPlanes || cargandoPrueba ? (
            <p className="pfa-sub" style={{ textAlign: "center", padding: "2rem 0" }}>
              Cargando planes…
            </p>
          ) : (
            <PasoPlan
              planes={planes}
              selected={esPaseoBienvenida ? planBienvenida?.id_plan ?? null : planId}
              onChange={setPlanId}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
              esPrimeraVez={esPaseoBienvenida}
            />
          ))}

        {step === 3 && planEfectivo && (
          <PasoDetalle
            plan={planEfectivo}
            form={detalle}
            setForm={setDetalle}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
            esPrimeraVez={esPaseoBienvenida}
          />
        )}

        {step === 4 && planEfectivo && mascotaSeleccionada && (
          <PasoResumen
            mascota={mascotaSeleccionada}
            plan={planEfectivo}
            form={detalle}
            onBack={() => setStep(3)}
            onClose={onClose}
            onExito={onExito}
            esPrimeraVez={esPaseoBienvenida}
          />
        )}
      </div>
    </div>
  );
}