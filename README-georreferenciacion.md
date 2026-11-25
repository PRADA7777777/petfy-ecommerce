# Georreferenciación de los paseos (Fase 2)

Este documento explica **qué se hizo, dónde está y cómo funciona** la georreferenciación de los paseos de Petfy, para que cualquiera del equipo pueda ubicarse rápido en el código.

- **Rama:** `feature/georreferenciacion-integracion` (creada desde `main` y actualizada con `main` el 22 de noviembre de 2026).
- **Stack:** backend FastAPI + SQLAlchemy + PostgreSQL; frontend Next.js + react-query + react-leaflet.

---

## 1. Qué hace

| Quién | Qué puede hacer |
|---|---|
| **Paseador** | Marca su llegada a la casa, inicia el paseo con un código de 4 dígitos que le da el dueño, envía su ubicación GPS durante el paseo, registra novedades y finaliza. Al iniciar y al finalizar toma una foto y se la envía al dueño por WhatsApp, de forma manual (ver sección 4). |
| **Dueño** | Ve el código del paseo de hoy (y lo comparte por WhatsApp), sigue el paseo en vivo en el mapa con la ruta, el progreso, los km y el nombre del paseador. |
| **Admin** | Ve en un mapa los paseos en curso y su posición actual, y consulta el historial de paseos con su recorrido y novedades. |

### Flujo de un paseo

```
Cita confirmada (pago Wompi, paseo de prueba o el admin)
   └─> se genera el código de 4 dígitos y le llega al dueño por correo
Paseador: "Llegué a la casa"            → POST /paseos/{id}/llegada
Paseador: escribe el código del dueño   → POST /paseos/{id}/iniciar     (cita pasa a "En curso")
Paseador: foto de inicio                → la toma y la envía al dueño por WhatsApp (manual, sin backend)
Durante el paseo: GPS cada 5 s, en cola → POST /paseos/{id}/gps/lote    (cada 15 s)
Paseador: novedad (opcional)            → POST /paseos/{id}/novedades
Paseador: "Finalizar paseo"             → POST /paseos/{id}/finalizar   (cita pasa a "Completada")
Paseador: foto de entrega               → la toma y la envía al dueño por WhatsApp (manual, sin backend)
Dueño y admin: mapa en vivo             → GET  /paseos/{id}/ruta        (se consulta cada 10 s)
```

### Estados de la cita

| Código | Estado |
|---|---|
| 1 | Pendiente |
| 2 | Confirmada |
| 3 | En curso |
| 4 | Completada |
| 5 | Cancelada |

---

## 2. Dónde está (mapa de carpetas)

### Backend (`petfy-backend/`)

**Archivos nuevos, 100% de georreferenciación:**

```
petfy-backend/
├── routers/
│   └── paseos_router.py      ← todos los endpoints /paseos/... (ver sección 3)
└── services/
    ├── codigos_paseo.py      ← genera y asigna el código de 4 dígitos
    ├── paseadores.py         ← quién es paseador (staff rol 3 con el servicio "paseos")
    ├── recorrido.py          ← puntos de una cita, distancia (haversine) y minutos
    └── paginacion.py         ← paginar(consulta, page, pageSize) para el historial
```

`paseos_router.py` está ordenado por secciones, en el orden del flujo: constantes → helpers → paseador → dueño → consultas del paseo → historial.

**Archivos existentes donde solo se agregaron líneas:**

| Archivo | Qué se agregó |
|---|---|
| `main.py` | Registro del router de paseos |
| `models.py` | Sección de paseos al final: tablas de códigos, ubicaciones, novedades y eventos; columna `activo` |
| `schemas.py` | Sección "GEORREFERENCIACIÓN DEL PASEO" |
| `email_service.py` | Correo al dueño con el código |
| `routers/webhooks_router.py` | Al confirmar el pago de Wompi se genera el código |
| `routers/citas_router.py` | En `crear_cita`, el código del paseo de prueba |
| `routers/admin_router.py` | Mapa en vivo (`/admin/paseadores/activos`), agenda que también ve el paseador (solo sus paseos) y cupo de 3 perros |
| `routers/auth_router.py` | Arreglo: el login del staff daba error 500 a todo paseador |

**Base de datos:** las tablas nuevas están en `petfy_db.sql` (raíz del repo):
- `codigos_paseo`: el código de cada cita;
- `intentos_codigo`: cada intento del paseador, para el bloqueo;
- `ubicaciones_paseo`: los puntos GPS (única por cita + hora, para no duplicar);
- `novedades_paseo`: lo que reporta el paseador;
- `eventos_paseo`: llegada, inicio y fin con su hora.

### Frontend (`petfy-frontend/`)

**Paseador** (portal de Oscar, conectado al backend):

```
petfy-frontend/
├── app/(staff)/
│   ├── layout.tsx                 ← se agregó el menú ☰ para celular
│   ├── tailwind.css               ← estilos del portal del paseador
│   └── paseador/page.tsx          ← /paseador redirige al dashboard
├── app/login/page.tsx             ← /login redirige al inicio
├── components/
│   ├── ModalServicioPaseador.tsx  ← llegada, código, fotos por WhatsApp, finalizar
│   └── SidebarPaseador.tsx        ← menú lateral (se esconde en celular)
├── lib/
│   ├── seguimientoGPS.ts          ← GPS real: cola en el navegador, envío por lote, pantalla encendida
│   ├── paseoPaseador.ts           ← lógica del paseo y compartir foto por WhatsApp
│   └── auth.ts                    ← usa el AuthContext existente
└── postcss.config.mjs
```

**Dueño** ("Mis Paseos" de Jhon, conectado a datos reales):

```
petfy-frontend/app/(cliente)/_components/paseos/
├── paseoHoy.ts             ← lógica: paseos de hoy, códigos, estado, progreso, km, compartir código
├── VistaPaseos.tsx         ← se reemplazaron los datos de prueba (TODO: BACKEND) por los reales
└── MapaPaseo/              ← mapa con la ruta GPS real
```

**Admin:**

```
petfy-frontend/app/(admin)/servicios/paseos/MapaViewInner.tsx  ← modo historial con recorrido
petfy-frontend/lib/api-admin.ts                                 ← historial, detalle, agenda, planificación y staff
```

**Compartidos:**

| Archivo | Qué tiene |
|---|---|
| `components/RutaPaseo.tsx` | Dibuja el recorrido: 🏁 al inicio y 🐕 en el último punto |
| `lib/api.ts` | `paseosAPI` (sección PASEOS) y el adaptador `api` que usan las páginas del paseador |
| `lib/fechas.ts` | `horaDeFecha` |
| `lib/utils.ts`, `app/providers.tsx` | `cn` y el `<Toaster />` que usa el portal del paseador |

---

## 3. Endpoints

Todos usan el token en `Authorization: Bearer ...`.

**Paseador**

| Método | Ruta | Body |
|---|---|---|
| POST | `/paseos/{id}/llegada` | — |
| POST | `/paseos/{id}/iniciar` | `{ "codigo": "1234" }` |
| POST | `/paseos/{id}/gps` | `{ "lat", "lng", "fecha_hora"? }` |
| POST | `/paseos/{id}/gps/lote` | `{ "puntos": [ { "lat", "lng", "fecha_hora"? } ] }` (1 a 500) |
| POST | `/paseos/{id}/novedades` | `{ "texto" }` (máx. 500) |
| POST | `/paseos/{id}/finalizar` | `{ "novedad"? }` |

**Dueño:** `GET /paseos/{id}/codigo`

**Consultas** (dueño, paseador o admin, según a quién pertenezca la cita):
- `GET /paseos/{id}/ruta`
- `GET /paseos/{id}/novedades`
- `GET /paseos/{id}/detalle`
- `GET /paseos/historial` (filtros `desde`, `hasta`, `id_mascota`; `id_paseador` solo admin)

**Admin:** `GET /admin/paseadores/activos` (paseos en curso con su ruta y posición actual)

---

## 4. Cómo funciona por dentro (reglas importantes)

- **Código:** se genera cuando la cita queda confirmada. 5 intentos fallidos en 15 minutos bloquean (respuesta 429).
- **Cupo:** máximo 3 perros por franja para un paseador (`CAPACIDAD_PASEADOR` en `admin_router.py`, al asignar paseador).
- **Paseo en grupo:** cada punto GPS se guarda en todas las citas en curso del paseador, así varios perros paseados juntos tienen la misma ruta.
- **Sin señal:** cada punto lleva la hora real del celular (`fecha_hora`). Si se pierde la señal, el celular guarda los puntos en una cola y los manda juntos al volver. La ruta se ordena por esa hora, así el tramo sin señal aparece en el mapa.
- **Puntos que se aceptan:** desde el inicio del paseo hasta ahora (60 s de margen por relojes adelantados) y del mismo día de la cita. Los repetidos se ignoran sin error, para que el celular no reintente para siempre.
- **Fotos de inicio y de entrega (envío manual por WhatsApp):**
  - **Cuándo:** en el modal del paseador (`components/ModalServicioPaseador.tsx`) hay dos pasos:
    - **"Foto de inicio"** (paso 8): aparece justo después de validar el código;
    - **"Paseo finalizado"** (paso 9): aparece después de finalizar.
  - **Cómo:** el paseador toma la foto con la cámara del celular y toca **"Enviar al dueño por WhatsApp"** (en el paso 9: **"Enviar foto al dueño por WhatsApp"**). La función `compartirFotoConDueno` (`lib/paseoPaseador.ts`) abre el menú de compartir del celular con la foto ya adjunta. Si el navegador no permite compartir archivos, abre el chat de WhatsApp del dueño (`wa.me`) para que la adjunte él mismo.
  - **Es manual a propósito, por costo:** no se usa la API de WhatsApp ni se guardan las fotos en un servidor. Las fotos no pasan por el backend. El paseador elige el chat del dueño y envía él mismo, porque el navegador no deja mandar directo a un número.
  - **No bloquea el paseo:** los botones siguen activos aunque no se haya enviado la foto.
  - **Por si luego se quieren guardar:** el backend queda preparado con `GUARDAR_FOTO_ENTREGA = False` en `paseos_router.py`.
- **Paseador:** es un usuario staff (rol 3) con el servicio "paseos". Esa regla vive solo en `services/paseadores.py`.

---

## 5. Para el hosting

1. Crear las tablas nuevas de `petfy_db.sql` en la base de producción.
2. Configurar `NEXT_PUBLIC_API_URL` en el frontend y la URL del frontend en el CORS del backend.
3. El GPS y "pantalla encendida" del celular solo funcionan con **HTTPS**.
4. El fondo del mapa de "Mis Paseos" usa CARTO, que pide una API key (o se cambia el fondo del mapa).

## 6. Limitaciones conocidas

- **GPS en segundo plano:** sin señal sí se registra: mientras Petfy esté abierta, los puntos se guardan en el celular y se envían al volver la señal. Lo que no toma la web es el GPS en segundo plano: si el paseador cambia de app o apaga la pantalla, ese tramo no queda registrado. Queda para una fase futura (app nativa o PWA).
- **Placas QR/NFC y mascota perdida:** están en la rama porque venían de `main`; son otra fase y no afectan los paseos.

## 7. Ajustes en placas para que compile

El código de placas QR/NFC y mascota perdida (de `main`) tenía 14 errores de tipos que no dejaban pasar `npm run build`. **No se borró ni se cambió su funcionamiento**; solo se ajustaron los tipos:

1. `petfy-frontend/lib/api.ts`, interfaz `Mascota`: se agregaron 5 campos opcionales que sus pantallas ya usaban (`modo_perdido`, `fecha_perdida`, `ultima_ubicacion`, `recompensa`, `mensaje_perdido`). Son los mismos de `MascotaPublica`.
2. `petfy-frontend/app/(public)/p/[codigo]/page.tsx`, tipo `Resultado`: se agregó `motivo?: undefined` al caso `ok: true`, para que TypeScript permita leer `motivo`.

Antes del ajuste se guardó una copia de respaldo de los archivos de placas tal como estaban.
