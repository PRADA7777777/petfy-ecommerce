// app/perfil/components/VistaMascotas.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Mascota, mascotasAPI, sesion, CatalogoItem } from "../../lib/api";

interface VistaMascotasProps {
  mascotas: Mascota[];
  onAgregar: () => void;
  onEditar: (mascota: Mascota) => void;
  onRecargar: () => void;
}

export default function VistaMascotas({
  mascotas,
  onAgregar,
  onEditar,
  onRecargar,
}: VistaMascotasProps) {
  const [comportamientos, setComportamientos] = useState<CatalogoItem[]>([]);
  const [condiciones, setCondiciones] = useState<CatalogoItem[]>([]);

  useEffect(() => {
    let cancelado = false;
    Promise.all([
      mascotasAPI.getComportamientos(),
      mascotasAPI.getCondiciones(),
    ])
      .then(([comp, cond]) => {
        if (cancelado) return;
        setComportamientos(comp);
        setCondiciones(cond);
      })
      .catch((e) => console.error("Error cargando catálogos:", e));

    return () => {
      cancelado = true;
    };
  }, []);

  const getNombreComportamiento = (
    id?: number | null,
    textoLibre?: string | null
  ) => {
    if (id) {
      const c = comportamientos.find((x) => x.id === id);
      if (c) return c.nombre;
    }
    return textoLibre || "";
  };

  const getNombreCondicion = (
    id?: number | null,
    textoLibre?: string | null
  ) => {
    if (id) {
      const c = condiciones.find((x) => x.id === id);
      if (c) return c.nombre;
    }
    return textoLibre || "";
  };

  const handleEliminar = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar a ${nombre}? Esta acción no se puede deshacer.`)) return;

    const token = sesion.obtenerToken();
    if (!token) return;

    try {
      await mascotasAPI.eliminar(id, token);
      onRecargar();
    } catch (e) {
      console.error("Error eliminando mascota:", e);
      alert("No se pudo eliminar la mascota");
    }
  };

  return (
    <div className="perfil-vista active">
      {/* Header centrado */}
<div className="mascotas-header">
  <div className="mascotas-header-icon">
    <Image
      src="/assets/img/huellaCorazon.png"
      alt=""
      width={50}
      height={50}
      priority
    />
  </div>
  <h2 className="mascotas-titulo">Mis Mascotas</h2>
</div>

      {/* Estado vacío */}
      {mascotas.length === 0 ? (
        <div className="perfil-empty-mascotas">
          <div className="empty-mascotas-icon">🐾</div>
          <h4>¡Aún no tienes mascotas registradas!</h4>
          <p>
            Registra a tu peludo para empezar a agendar paseos, baños y más
            servicios personalizados.
          </p>
          <button className="btn-perfil btn-primary" onClick={onAgregar}>
            🐕 Crear mi primera Mascota
          </button>
        </div>
      ) : (
        <div className="mascotas-grid">
          {mascotas.map((m) => {
            const comp = getNombreComportamiento(
              m.id_comportamiento,
              m.observar_comportamiento
            );
            const cond = getNombreCondicion(
              m.id_condicion_medica,
              m.observar_condicion
            );

            return (
              <div key={m.id_mascota} className="mascota-card">
                {/* Foto */}
                <div className="mascota-card-foto">
                  {m.img_masc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.img_masc} alt={m.nom_mascota} />
                  ) : (
                    <div className="mascota-card-foto-placeholder">🐕</div>
                  )}
                </div>

                {/* Info */}
                <div className="mascota-card-info">
                  <h4 className="mascota-card-nombre">{m.nom_mascota}</h4>

                  <div className="mascota-card-meta">
                    {(m.nom_raza || m.raza) && (
                      <span className="mascota-badge">
                        {m.nom_raza || m.raza}
                      </span>
                    )}
                    {m.edad !== undefined && m.edad !== null && (
                      <span className="mascota-badge">
                        {m.edad} {m.edad === 1 ? "año" : "años"}
                      </span>
                    )}
                    {m.peso && (
                      <span className="mascota-badge">{m.peso} kg</span>
                    )}
                  </div>

                  {/* Detalles opcionales con íconos */}
                  {comp && (
                    <p className="mascota-card-detail">
                      <span className="mascota-detail-icon">🎾</span>
                      <span className="mascota-detail-text">
                        <strong>Comportamiento:</strong> {comp}
                      </span>
                    </p>
                  )}
                  {cond && (
                    <p className="mascota-card-detail">
                      <span className="mascota-detail-icon">💊</span>
                      <span className="mascota-detail-text">
                        <strong>Condición:</strong> {cond}
                      </span>
                    </p>
                  )}
                  {m.otras_indicaciones && (
                    <p className="mascota-card-detail">
                      <span className="mascota-detail-icon">📝</span>
                      <span className="mascota-detail-text">
                        <strong>Notas:</strong> {m.otras_indicaciones}
                      </span>
                    </p>
                  )}
                </div>

                {/* Acciones */}
                <div className="mascota-card-actions">
                  <button
                    className="btn-icon btn-edit"
                    onClick={() => onEditar(m)}
                    title="Editar mascota"
                    aria-label="Editar mascota"
                  >
                    <i className="fas fa-pen"></i>
                  </button>
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => handleEliminar(m.id_mascota, m.nom_mascota)}
                    title="Eliminar mascota"
                    aria-label="Eliminar mascota"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Card agregar — llamativa */}
          <button
            className="mascota-card-add"
            onClick={onAgregar}
            type="button"
            aria-label="Agregar otra mascota"
          >
            <span className="mascota-card-add-plus">+</span>
            <span className="mascota-card-add-text">Agregar otra mascota</span>
            <span className="mascota-card-add-sub">
              Suma un nuevo peludo a la familia
            </span>
          </button>
        </div>
      )}
    </div>
  );
}