Set-Location "D:\USUARIO\Escritorio\petfy-ecommerce"
$utf8 = New-Object System.Text.UTF8Encoding $false

$vistaFile = Get-ChildItem -Path "petfy-frontend\app" -Recurse -Filter "VistaMascotas.tsx" -ErrorAction SilentlyContinue | Select-Object -First 1
Write-Host "Modificando: $($vistaFile.FullName)" -ForegroundColor Cyan

$vistaContent = @'
// app/perfil/components/VistaMascotas.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Mascota, mascotasAPI, sesion, CatalogoItem } from "@/lib/api";
import ActivarPlacaModal from "./ActivarPlacaModal";
import ReportarPerdidoModal from "./ReportarPerdidoModal";

interface VistaMascotasProps {
  mascotas: Mascota[];
  onAgregar: () => void;
  onEditar: (mascota: Mascota) => void;
  onRecargar: () => void;
  nombreDueno?: string;
  telefonoDueno?: string;
}

export default function VistaMascotas({
  mascotas,
  onAgregar,
  onEditar,
  onRecargar,
  nombreDueno,
  telefonoDueno,
}: VistaMascotasProps) {
  const [comportamientos, setComportamientos] = useState<CatalogoItem[]>([]);
  const [condiciones, setCondiciones] = useState<CatalogoItem[]>([]);
  const [copiadoId, setCopiadoId] = useState<number | null>(null);
  const [mascotaParaPlaca, setMascotaParaPlaca] = useState<Mascota | null>(null);
  const [mascotaParaPerdido, setMascotaParaPerdido] = useState<Mascota | null>(null);

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

  const handleCopiarLink = async (id: number) => {
    const url = `${window.location.origin}/pet/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiadoId(id);
      setTimeout(() => setCopiadoId(null), 2000);
    } catch {
      prompt("Copia este link para tu chip NFC:", url);
    }
  };

  const handleDesmarcarPerdido = async (mascota: Mascota) => {
    if (!confirm(`¿Marcar a ${mascota.nom_mascota} como encontrada?`)) return;
    const token = sesion.obtenerToken();
    if (!token) return;
    try {
      await mascotasAPI.marcarPerdida(mascota.id_mascota, { perdido: false }, token);
      onRecargar();
    } catch (e: any) {
      alert(e.message || "No se pudo actualizar");
    }
  };

  return (
    <div className="perfil-vista active">
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
            const estaPerdida = !!m.modo_perdido;

            return (
              <div
                key={m.id_mascota}
                className={`mascota-card ${estaPerdida ? "mascota-card-perdida" : ""}`}
              >
                {/* Badge PERDIDA flotante */}
                {estaPerdida && (
                  <div className="mascota-badge-perdida">
                    <span className="mascota-badge-dot" />
                    🚨 PERDIDA
                  </div>
                )}

                <div className="mascota-card-foto">
                  {m.img_masc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.img_masc} alt={m.nom_mascota} />
                  ) : (
                    <div className="mascota-card-foto-placeholder">🐕</div>
                  )}
                </div>

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
                  {/* PERDIDO / ENCONTRADA */}
                  {estaPerdida ? (
                    <button
                      className="btn-icon btn-encontrada"
                      onClick={() => handleDesmarcarPerdido(m)}
                      title="Marcar como encontrada"
                      aria-label="Marcar como encontrada"
                    >
                      <i className="fas fa-check-circle"></i>
                    </button>
                  ) : (
                    <button
                      className="btn-icon btn-perdida"
                      onClick={() => setMascotaParaPerdido(m)}
                      title="Reportar como perdida"
                      aria-label="Reportar como perdida"
                    >
                      <i className="fas fa-exclamation-triangle"></i>
                    </button>
                  )}

                  <button
                    className="btn-icon btn-placa"
                    onClick={() => setMascotaParaPlaca(m)}
                    title="Activar placa Petfy"
                    aria-label="Activar placa Petfy"
                  >
                    <i className="fas fa-tag"></i>
                  </button>

                  <a
                    className="btn-icon btn-public"
                    href={`/pet/${m.id_mascota}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Ver perfil público"
                    aria-label="Ver perfil público"
                  >
                    <i className="fas fa-id-card"></i>
                  </a>

                  <button
                    className="btn-icon btn-share"
                    onClick={() => handleCopiarLink(m.id_mascota)}
                    title={copiadoId === m.id_mascota ? "¡Copiado!" : "Copiar link"}
                    aria-label="Copiar link"
                  >
                    <i
                      className={
                        copiadoId === m.id_mascota
                          ? "fas fa-check"
                          : "fas fa-link"
                      }
                    ></i>
                  </button>

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

      {mascotaParaPlaca && (
        <ActivarPlacaModal
          mascota={mascotaParaPlaca}
          onClose={() => setMascotaParaPlaca(null)}
          onActivada={onRecargar}
        />
      )}

      {mascotaParaPerdido && (
        <ReportarPerdidoModal
          mascota={mascotaParaPerdido}
          nombreDueno={nombreDueno}
          telefonoDueno={telefonoDueno}
          onClose={() => setMascotaParaPerdido(null)}
          onActualizada={onRecargar}
        />
      )}
    </div>
  );
}
'@
[IO.File]::WriteAllText($vistaFile.FullName, $vistaContent, $utf8)
Write-Host "✅ VistaMascotas.tsx actualizado" -ForegroundColor Green