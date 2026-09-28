// app/perfil/components/ModalMascota.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { mascotasAPI, sesion, MascotaData, Mascota, CatalogoItem } from "../../lib/api";

interface ModalMascotaProps {
  isOpen: boolean;
  onClose: () => void;
  onGuardado: (mascota?: Mascota) => void;
  mascotaEditar?: Mascota | null;
}

function getInitialForm(mascotaEditar?: Mascota | null): MascotaData {
  if (mascotaEditar) {
    return {
      nommascota: mascotaEditar.nom_mascota || "",
      raza: mascotaEditar.raza || "",
      id_raza: mascotaEditar.id_raza,
      peso: mascotaEditar.peso ?? undefined,
      edad: mascotaEditar.edad ?? undefined,
      carne_vacunacion: mascotaEditar.carne_vacunacion || "",
      otras_indicaciones: mascotaEditar.otras_indicaciones || "",
      observar_condicion: mascotaEditar.observar_condicion || "",
      observar_comportamiento: mascotaEditar.observar_comportamiento || "",
      img_masc: mascotaEditar.img_masc || "",
      id_comportamiento: mascotaEditar.id_comportamiento,
      id_condicion_medica: mascotaEditar.id_condicion_medica,
    };
  }
  return {
    nommascota: "",
    raza: "",
    id_raza: undefined,
    peso: undefined,
    edad: undefined,
    carne_vacunacion: "",
    otras_indicaciones: "",
    observar_condicion: "",
    observar_comportamiento: "",
    img_masc: "",
    id_comportamiento: undefined,
    id_condicion_medica: undefined,
  };
}

export default function ModalMascota({
  isOpen,
  onClose,
  onGuardado,
  mascotaEditar,
}: ModalMascotaProps) {
  const [formData, setFormData] = useState<MascotaData>(() => getInitialForm(mascotaEditar));

  const [usarOtroComportamiento, setUsarOtroComportamiento] = useState<boolean>(
    () => !!(mascotaEditar && !mascotaEditar.id_comportamiento && mascotaEditar.observar_comportamiento)
  );
  const [usarOtraCondicion, setUsarOtraCondicion] = useState<boolean>(
    () => !!(mascotaEditar && !mascotaEditar.id_condicion_medica && mascotaEditar.observar_condicion)
  );

  const [usarOtraRaza, setUsarOtraRaza] = useState<boolean>(false);
  const [comportamientos, setComportamientos] = useState<CatalogoItem[]>([]);
  const [condiciones, setCondiciones] = useState<CatalogoItem[]>([]);
  const [razas, setRazas] = useState<CatalogoItem[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const carneInputRef = useRef<HTMLInputElement>(null);

  // estado específico para el carné (imagen o PDF)
  const [archivoCarne, setArchivoCarne] = useState<File | null>(null);
  const [previewCarne, setPreviewCarne] = useState<string>(
    () => mascotaEditar?.carne_vacunacion || ""
  );

  // ¿El archivo actual es un PDF?
  const esPdf = (() => {
    // Caso 1: el usuario acaba de subir un archivo
    if (archivoCarne) {
      return (
        archivoCarne.type === "application/pdf" ||
        archivoCarne.name.toLowerCase().endsWith(".pdf")
      );
    }
    // Caso 2: estamos editando y viene del backend (dataURL o URL)
    const carne = previewCarne || formData.carne_vacunacion;
    if (!carne) return false;
    if (carne.startsWith("data:application/pdf")) return true;
    return /\.pdf($|\?)/i.test(carne);
  })();
  // Cargar catálogos al abrir
  useEffect(() => {
    if (!isOpen) return;
    let cancelado = false;

    Promise.all([
      mascotasAPI.getComportamientos(),
      mascotasAPI.getCondiciones(),
      mascotasAPI.getRazas(),
    ])
      .then(([comp, cond, rz]) => {
        if (cancelado) return;
        setComportamientos(comp);
        setCondiciones(cond);
        setRazas(rz);

        if (mascotaEditar) {
          if (mascotaEditar.id_raza) {
            const r = rz.find((x) => x.id === mascotaEditar.id_raza);
            const esOtraDelCatalogo = r && r.nombre.trim().toLowerCase() === "otra";
            const textoNoCoincide =
              r && mascotaEditar.raza && mascotaEditar.raza.trim() !== r.nombre.trim();

            if (esOtraDelCatalogo || textoNoCoincide) {
              setUsarOtraRaza(true);
            }
          } else if (mascotaEditar.raza) {
            setUsarOtraRaza(true);
          }
        }
      })
      .catch((e) => {
        if (!cancelado) console.error("Error cargando catálogos:", e);
      });

    return () => {
      cancelado = true;
    };
  }, [isOpen, mascotaEditar]);


  // Limpieza de object URLs al desmontar/cerrar
  useEffect(() => {
    return () => {
      if (previewCarne && previewCarne.startsWith("blob:")) {
        URL.revokeObjectURL(previewCarne);
      }
    };
  }, [previewCarne]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]:
        id === "peso" || id === "edad"
          ? value === ""
            ? undefined
            : Number(value)
          : value,
    }));
  };

  const handleRazaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    if (value === "otra_raza") {
      setUsarOtraRaza(true);
      setFormData((prev) => ({ ...prev, id_raza: undefined, raza: "" }));
      return;
    }

    const idSeleccionado = value ? Number(value) : undefined;
    const razaSel = razas.find((r) => r.id === idSeleccionado);

    setUsarOtraRaza(false);
    setFormData((prev) => ({
      ...prev,
      id_raza: idSeleccionado,
      raza: razaSel?.nombre || "",
    }));
  };

  const handleComportamiento = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "otro") {
      setUsarOtroComportamiento(true);
      setFormData((prev) => ({
        ...prev,
        id_comportamiento: undefined,
        observar_comportamiento: "",
      }));
    } else {
      setUsarOtroComportamiento(false);
      setFormData((prev) => ({
        ...prev,
        id_comportamiento: value ? Number(value) : undefined,
        observar_comportamiento: "",
      }));
    }
  };

  const handleCondicion = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "otra") {
      setUsarOtraCondicion(true);
      setFormData((prev) => ({
        ...prev,
        id_condicion_medica: undefined,
        observar_condicion: "",
      }));
    } else {
      setUsarOtraCondicion(false);
      setFormData((prev) => ({
        ...prev,
        id_condicion_medica: value ? Number(value) : undefined,
        observar_condicion: "",
      }));
    }
  };

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setError("La imagen no puede superar los 3 MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, img_masc: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // ============================================================
  // 🆕 Handler del carné (imagen o PDF)
  // ============================================================
  const handleCambioCarne = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    if (file.size > 5 * 1024 * 1024) {
      setError("El carné no puede superar los 5 MB");
      return;
    }

    // Limpiamos el object URL anterior si existía
    if (previewCarne && previewCarne.startsWith("blob:")) {
      URL.revokeObjectURL(previewCarne);
    }

    setArchivoCarne(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewCarne(objectUrl);

    // Guardamos en el formData (como dataURL para enviar al backend)
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, carne_vacunacion: reader.result as string }));
    };
    reader.readAsDataURL(file);

    // Permitir volver a seleccionar el mismo archivo
    e.target.value = "";
  };

  const quitarCarne = () => {
    if (previewCarne && previewCarne.startsWith("blob:")) {
      URL.revokeObjectURL(previewCarne);
    }
    setArchivoCarne(null);
    setPreviewCarne("");
    setFormData((prev) => ({ ...prev, carne_vacunacion: "" }));
    if (carneInputRef.current) carneInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.nommascota) {
      setError("El nombre es obligatorio");
      return;
    }
    if (!usarOtraRaza && !formData.id_raza) {
      setError("Debes seleccionar una raza");
      return;
    }
    if (usarOtraRaza && !formData.raza?.trim()) {
      setError("Escribe el nombre de la raza");
      return;
    }

    setCargando(true);
    try {
      const token = sesion.obtenerToken();
      if (!token) throw new Error("Sesión expirada");

      let resultado: Mascota;
      if (mascotaEditar?.id_mascota) {
        resultado = await mascotasAPI.actualizar(mascotaEditar.id_mascota, formData, token);
      } else {
        resultado = await mascotasAPI.crear(formData, token);
      }
      onGuardado(resultado);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setCargando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active">
      <div className="modal-container modal-mascota">
        <button className="modal-close-btn" onClick={onClose}>
          &times;
        </button>

        <div className="modal-mascota-header">
          <div className="modal-mascota-icon">
            <i className="fas fa-paw"></i>
          </div>
          <h2>{mascotaEditar ? "Editar Mascota" : "Nueva Mascota"}</h2>
          <p>Cuéntanos sobre tu peludo</p>
        </div>

        {error && <div className="modal-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          {/* FOTO Y DOCUMENTOS */}
          <div className="form-seccion">
            <h4 className="form-seccion-titulo">
              <i className="fas fa-camera"></i> Foto y documentos
            </h4>

            <div className="form-row-uploads">
              {/* Foto */}
              <div className="form-group">
                <label>Foto de tu mascota</label>
                <div className="foto-upload" onClick={() => fileInputRef.current?.click()}>
                  {formData.img_masc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={formData.img_masc} alt="Foto mascota" className="foto-preview" />
                  ) : (
                    <div className="foto-placeholder">
                      <span className="foto-icon">📸</span>
                      <p>Sube una foto</p>
                      <small>JPG · PNG · máx 3 MB</small>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFoto}
                />
              </div>

              {/* Carné */}
              <div className="form-group">
                <label>Carné de vacunación</label>
                <div
                  className={`carne-upload ${previewCarne ? "con-archivo" : ""}`}
                  onClick={() => carneInputRef.current?.click()}
                >
                  {!previewCarne && (
                    <div className="foto-placeholder">
                      <span className="foto-icon">📋</span>
                      <p>Sube el carné</p>
                      <small>JPG · PNG · PDF · máx 5 MB</small>
                    </div>
                  )}

                  {previewCarne && !esPdf && (
                    <div className="carne-img-wrap">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewCarne}
                        alt="Carné de vacunación"
                        className="carne-img-preview"
                      />
                    </div>
                  )}

                  {previewCarne && esPdf && (
                    <div className="carne-pdf-card" onClick={(e) => e.stopPropagation()}>
                      <div className="carne-pdf-icon">📄</div>
                      <div className="carne-pdf-info">
                        <strong>PDF</strong>
                        <small>{archivoCarne?.name ?? "Documento"}</small>
                      </div>
                      <a
                        className="carne-pdf-ver"
                        href={previewCarne}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver PDF
                      </a>
                    </div>
                  )}

                  <input
                    ref={carneInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    style={{ display: "none" }}
                    onChange={handleCambioCarne}
                  />
                </div>

                {previewCarne && (
                  <button type="button" className="btn-quitar-carne" onClick={quitarCarne}>
                    🗑️ Quitar carné
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ═══════════════ SECCIÓN 2: DATOS BÁSICOS ═══════════════ */}
          <div className="form-seccion">
            <h4 className="form-seccion-titulo">
              <i className="fas fa-dog"></i> Datos básicos
            </h4>

            {/* Nombre y Raza */}
            <div className="form-row">
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  id="nommascota"
                  value={formData.nommascota}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Max"
                />
              </div>
              <div className="form-group">
                <label>Raza *</label>
                <select
                  id="id_raza"
                  value={usarOtraRaza ? "otra_raza" : formData.id_raza?.toString() || ""}
                  onChange={handleRazaChange}
                  required={!usarOtraRaza}
                >
                  <option value="">Selecciona una raza</option>
                  {razas
                    .filter((r) => r.nombre.trim().toLowerCase() !== "otra")
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre}
                      </option>
                    ))}
                  <option value="otra_raza">Otra (especificar)</option>
                </select>

                {usarOtraRaza && (
                  <input
                    type="text"
                    id="raza"
                    value={formData.raza || ""}
                    onChange={handleChange}
                    placeholder="Escribe la raza (ej: Crestado Chino)"
                    style={{ marginTop: "0.4rem" }}
                    required
                    autoFocus
                  />
                )}
              </div>
            </div>

            {/* Edad y Peso */}
            <div className="form-row">
              <div className="form-group">
                <label>Edad (años)</label>
                <input
                  type="number"
                  id="edad"
                  value={formData.edad ?? ""}
                  onChange={handleChange}
                  placeholder="Ej: 2"
                  min={0}
                />
              </div>
              <div className="form-group">
                <label>Peso (kg)</label>
                <input
                  type="number"
                  id="peso"
                  step="0.1"
                  min={0}
                  className="input-no-spinner"
                  value={formData.peso ?? ""}
                  onChange={handleChange}
                  placeholder="Ej: 15.5"
                />
              </div>
            </div>
          </div>

          {/* ═══════════════ SECCIÓN 3: SALUD Y COMPORTAMIENTO ═══════════════ */}
          <div className="form-seccion">
            <h4 className="form-seccion-titulo">
              <i className="fas fa-heartbeat"></i> Salud y comportamiento
            </h4>

            {/* Comportamiento */}
            <div className="form-group">
              <label>Comportamiento</label>
              <select
                value={usarOtroComportamiento ? "otro" : formData.id_comportamiento?.toString() || ""}
                onChange={handleComportamiento}
              >
                <option value="">Selecciona una opción</option>
                {comportamientos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
                <option value="otro">Otro (especificar)</option>
              </select>
              {usarOtroComportamiento && (
                <input
                  type="text"
                  id="observar_comportamiento"
                  value={formData.observar_comportamiento}
                  onChange={handleChange}
                  placeholder="Describe el comportamiento"
                  style={{ marginTop: "0.4rem" }}
                />
              )}
            </div>

            {/* Condición Médica */}
            <div className="form-group">
              <label>Condición médica</label>
              <select
                value={usarOtraCondicion ? "otra" : formData.id_condicion_medica?.toString() || ""}
                onChange={handleCondicion}
              >
                <option value="">Selecciona una opción</option>
                {condiciones.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
                <option value="otra">Otra (especificar)</option>
              </select>
              {usarOtraCondicion && (
                <input
                  type="text"
                  id="observar_condicion"
                  value={formData.observar_condicion}
                  onChange={handleChange}
                  placeholder="Describe la condición"
                  style={{ marginTop: "0.4rem" }}
                />
              )}
            </div>

            {/* Indicaciones */}
            <div className="form-group">
              <label>Indicaciones adicionales</label>
              <textarea
                id="otras_indicaciones"
                value={formData.otras_indicaciones}
                onChange={handleChange}
                rows={2}
                placeholder="Alergias, cuidados especiales, etc."
              />
            </div>
          </div>

          {/* Botón guardar (sticky al fondo) */}
          <div className="modal-mascota-footer">
            <button type="submit" className="btn-perfil btn-primary btn-full" disabled={cargando}>
              {cargando ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Guardando...
                </>
              ) : (
                <>
                  <i className="fas fa-check"></i>{" "}
                  {mascotaEditar ? "Actualizar Mascota" : "Guardar Mascota"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}