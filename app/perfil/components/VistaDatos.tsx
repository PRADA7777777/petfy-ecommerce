"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Usuario, TipoDocumento, sesion, perfilAPI } from "../../lib/api";

interface VistaDatosProps {
  usuario: Usuario;
  onUsuarioActualizado: (u: Usuario) => void;
}

interface FormState {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  direccion: string;
}

interface PassState {
  actual: string;
  nueva: string;
  confirmar: string;
}

const formDesdeUsuario = (u: Usuario): FormState => ({
  nombre: u.nombre ?? "",
  apellido: u.apellido ?? "",
  correo: u.correo ?? "",
  telefono: u.telefono ?? "",
  direccion: u.direccion ?? "",
});

const passVacio: PassState = { actual: "", nueva: "", confirmar: "" };

export default function VistaDatos({ usuario, onUsuarioActualizado }: VistaDatosProps) {
  const router = useRouter();

  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [tiposDoc, setTiposDoc] = useState<TipoDocumento[]>([]);
  const [form, setForm] = useState<FormState>(() => formDesdeUsuario(usuario));

  const [pass, setPass] = useState<PassState>(passVacio);
  const [cambiandoPass, setCambiandoPass] = useState(false);
  const [errorPass, setErrorPass] = useState<string | null>(null);
  const [exitoPass, setExitoPass] = useState<string | null>(null);
  const [mostrarPass, setMostrarPass] = useState(false);

  useEffect(() => {
    let cancelado = false;
    perfilAPI
      .tiposDocumento()
      .then((data) => { if (!cancelado) setTiposDoc(data); })
      .catch((e: unknown) => console.error("Error cargando tipos de doc:", e));
    return () => { cancelado = true; };
  }, []);

  const setCampo = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const empezarEdicion = () => {
    setForm(formDesdeUsuario(usuario));
    setError(null);
    setExito(null);
    setEditando(true);
  };

  const cancelar = () => {
    setForm(formDesdeUsuario(usuario));
    setError(null);
    setExito(null);
    setEditando(false);
  };

  const validar = (): string | null => {
    if (!form.nombre.trim()) return "El nombre es obligatorio.";
    if (!form.apellido.trim()) return "El apellido es obligatorio.";
    if (!form.correo.trim()) return "El correo es obligatorio.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim())) {
      return "El correo no tiene un formato válido.";
    }
    return null;
  };

  const guardar = async () => {
    setError(null);
    setExito(null);
    const msg = validar();
    if (msg) return setError(msg);

    const token = sesion.obtenerToken();
    if (!token) return setError("Tu sesión expiró. Vuelve a iniciar sesión.");

    setGuardando(true);
    try {
      const actualizado = await perfilAPI.actualizar(token, {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        correo: form.correo.trim().toLowerCase(),
        telefono: form.telefono.trim() || null,
        direccion: form.direccion.trim() || null,
      });
      onUsuarioActualizado(actualizado);
      setForm(formDesdeUsuario(actualizado));
      setExito("¡Datos actualizados con éxito! 🎉");
      setEditando(false);
      setTimeout(() => setExito(null), 3500);
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : "No se pudieron guardar los cambios.";
      setError(m);
    } finally {
      setGuardando(false);
    }
  };

  const coinciden =
    pass.nueva.length > 0 &&
    pass.confirmar.length > 0 &&
    pass.nueva === pass.confirmar;

  const puedeCambiarPass =
    pass.actual.length > 0 && pass.nueva.length >= 8 && coinciden;

  const cambiarPassword = async () => {
    setErrorPass(null);
    setExitoPass(null);

    if (!pass.actual) return setErrorPass("Ingresa tu contraseña actual.");
    if (pass.nueva.length < 8)
      return setErrorPass("La nueva contraseña debe tener al menos 8 caracteres.");
    if (!coinciden) return setErrorPass("Las contraseñas no coinciden.");

    const token = sesion.obtenerToken();
    if (!token) return setErrorPass("Tu sesión expiró. Vuelve a iniciar sesión.");

    setCambiandoPass(true);
    try {
      await perfilAPI.cambiarPassword(token, {
        contrasena_actual: pass.actual,
        contrasena_nueva: pass.nueva,
      });
      setExitoPass("¡Contraseña actualizada! Redirigiendo...");
      setPass(passVacio);

      setTimeout(() => {
        sesion.cerrar();
        router.replace("/");
      }, 1500);
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : "No se pudo cambiar la contraseña.";
      setErrorPass(m);
    } finally {
      setCambiandoPass(false);
    }
  };

  const inicial = (usuario.nombre?.[0] ?? "?").toUpperCase();
  const nombreTipoDoc =
    usuario.nom_tipo_doc ||
    tiposDoc.find((t) => t.id_tipo_doc === usuario.id_tipo_doc)?.nom_tipo_doc ||
    "No registrado";

  return (
    <div className="perfil-vista active">
      {/* ─── HERO ───────────────────────────────────── */}
      <div className="datos-hero">
        <div className="datos-hero-avatar">{inicial}</div>
        <div className="datos-hero-info">
          <h2>
            {usuario.nombre} {usuario.apellido}
          </h2>
          <p>{usuario.correo}</p>
          {usuario.verificado ? (
            <span className="datos-badge datos-badge-ok">✓ Verificado</span>
          ) : (
            <span className="datos-badge datos-badge-warn">Sin verificar</span>
          )}
        </div>
      </div>

      {/* ─── ALERTAS ────────────────────────────────── */}
      {error && <div className="datos-alert datos-alert-error">⚠️ {error}</div>}
      {exito && <div className="datos-alert datos-alert-success">{exito}</div>}

      {/* ─── DATOS PERSONALES ───────────────────────── */}
      <div className="perfil-section">
        <div className="perfil-section-header">
          <h3>👤 Datos personales</h3>
          {!editando ? (
            <button
              type="button"
              className="btn-perfil btn-primary"
              onClick={empezarEdicion}
            >
              ✏️ Editar
            </button>
          ) : (
            <div className="datos-acciones">
              <button
                type="button"
                className="btn-perfil btn-outline"
                onClick={cancelar}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-perfil btn-primary"
                onClick={guardar}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "💾 Guardar"}
              </button>
            </div>
          )}
        </div>

        {/* Nombre y Apellido */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              type="text"
              value={editando ? form.nombre : usuario.nombre}
              onChange={(e) => setCampo("nombre", e.target.value)}
              disabled={!editando || guardando}
              maxLength={100}
            />
          </div>
          <div className="form-group">
            <label htmlFor="apellido">Apellido</label>
            <input
              id="apellido"
              type="text"
              value={editando ? form.apellido : usuario.apellido}
              onChange={(e) => setCampo("apellido", e.target.value)}
              disabled={!editando || guardando}
              maxLength={100}
            />
          </div>
        </div>

        {/* Correo (editable) */}
        <div className="form-group">
          <label htmlFor="correo">Correo electrónico</label>
          <input
            id="correo"
            type="email"
            value={editando ? form.correo : usuario.correo}
            onChange={(e) => setCampo("correo", e.target.value)}
            disabled={!editando || guardando}
            autoComplete="email"
            maxLength={150}
          />
        </div>

        {/* Tipo doc y Num doc — SIEMPRE read-only */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="tipo_doc">Tipo de documento</label>
            <input
              id="tipo_doc"
              type="text"
              value={nombreTipoDoc}
              disabled
              title="Este dato no se puede modificar"
            />
          </div>
          <div className="form-group">
            <label htmlFor="num_doc">Número de documento</label>
            <input
              id="num_doc"
              type="text"
              value={usuario.num_doc || "No registrado"}
              disabled
              title="Este dato no se puede modificar"
            />
          </div>
        </div>

        <p className="form-help">
          🔒 El tipo y número de documento no se pueden modificar.
        </p>
      </div>

      {/* ─── CONTACTO ───────────────────────────────── */}
      <div className="perfil-section">
        <h3>📞 Información de contacto</h3>

        <div className="form-group">
          <label htmlFor="telefono">Teléfono</label>
          <input
            id="telefono"
            type="tel"
            value={editando ? form.telefono : usuario.telefono || "No registrado"}
            onChange={(e) => setCampo("telefono", e.target.value)}
            disabled={!editando || guardando}
            placeholder="+57 300 123 4567"
            maxLength={20}
          />
        </div>

        <div className="form-group">
          <label htmlFor="direccion">Dirección</label>
          <input
            id="direccion"
            type="text"
            value={editando ? form.direccion : usuario.direccion || "No registrada"}
            onChange={(e) => setCampo("direccion", e.target.value)}
            disabled={!editando || guardando}
            placeholder="Calle 123 #45-67, Bogotá"
            maxLength={200}
          />
        </div>
      </div>

      {/* ─── CAMBIAR CONTRASEÑA ─────────────────────── */}
      <div className="perfil-section">
        <div className="perfil-section-header">
          <h3>🔒 Cambiar contraseña</h3>
          <button
            type="button"
            className="btn-perfil btn-outline"
            onClick={() => setMostrarPass((v) => !v)}
          >
            {mostrarPass ? "Ocultar" : "Cambiar"}
          </button>
        </div>

        {mostrarPass && (
          <>
            {errorPass && (
              <div className="datos-alert datos-alert-error">⚠️ {errorPass}</div>
            )}
            {exitoPass && (
              <div className="datos-alert datos-alert-success">{exitoPass}</div>
            )}

            <div className="form-group">
              <label htmlFor="pass_actual">Contraseña actual</label>
              <input
                id="pass_actual"
                type="password"
                value={pass.actual}
                onChange={(e) => setPass((p) => ({ ...p, actual: e.target.value }))}
                disabled={cambiandoPass}
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            <div className="form-group">
              <label htmlFor="pass_nueva">Nueva contraseña</label>
              <input
                id="pass_nueva"
                type="password"
                value={pass.nueva}
                onChange={(e) => setPass((p) => ({ ...p, nueva: e.target.value }))}
                disabled={cambiandoPass}
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label htmlFor="pass_confirmar">Confirmar nueva contraseña</label>
              <div className="input-with-check">
                <input
                  id="pass_confirmar"
                  type="password"
                  value={pass.confirmar}
                  onChange={(e) =>
                    setPass((p) => ({ ...p, confirmar: e.target.value }))
                  }
                  disabled={cambiandoPass}
                  autoComplete="new-password"
                  placeholder="Repite la nueva contraseña"
                  className={
                    pass.confirmar.length === 0
                      ? ""
                      : coinciden
                      ? "input-ok"
                      : "input-error"
                  }
                />
                {coinciden && (
                  <span className="input-check-icon" aria-label="Coinciden">
                    ✓
                  </span>
                )}
              </div>
              {pass.confirmar.length > 0 && !coinciden && (
                <small className="form-help form-help-error">
                  Las contraseñas no coinciden.
                </small>
              )}
              {coinciden && (
                <small className="form-help form-help-ok">
                  Las contraseñas coinciden ✓
                </small>
              )}
            </div>

            <button
              type="button"
              className="btn-perfil btn-primary btn-full"
              onClick={cambiarPassword}
              disabled={!puedeCambiarPass || cambiandoPass}
            >
              {cambiandoPass ? "Actualizando..." : "🔐 Actualizar contraseña"}
            </button>

            <p className="form-help" style={{ marginTop: "0.6rem" }}>
              Al cambiar la contraseña se cerrará tu sesión y volverás al inicio.
            </p>
          </>
        )}
      </div>
    </div>
  );
}