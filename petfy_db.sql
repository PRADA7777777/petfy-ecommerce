--
-- PostgreSQL database dump
--

\restrict VYsjqzjMeVQrMxZAzIZi6dxJnhE2c8ZqnT1PP0sf11SMsk3mpYRzVxB45Jaz3Rd

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-09-28 12:48:04

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5 (class 2615 OID 2200)
-- Name: petfy_db; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA petfy_db;


ALTER SCHEMA petfy_db OWNER TO pg_database_owner;

--
-- TOC entry 5231 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA petfy_db; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA petfy_db IS 'standard public schema';


--
-- TOC entry 270 (class 1255 OID 25833)
-- Name: validar_duracion_paseo(); Type: FUNCTION; Schema: petfy_db; Owner: postgres
--

CREATE FUNCTION petfy_db.validar_duracion_paseo() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    duracion_real INTEGER;
    duracion_esperada INTEGER;
BEGIN
    IF NEW.fecha_fin_real IS NOT NULL AND NEW.fecha_hora_real IS NOT NULL THEN
        duracion_real := EXTRACT(EPOCH FROM (NEW.fecha_fin_real - NEW.fecha_hora_real)) / 60;
        duracion_esperada := 55; -- o traer de planes
        
        IF duracion_real > duracion_esperada * 1.5 THEN
            RAISE WARNING 'Paseo % excedió la duración esperada: % min vs % min esperados',
                NEW.id_cita, duracion_real, duracion_esperada;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION petfy_db.validar_duracion_paseo() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 224 (class 1259 OID 25361)
-- Name: cargos; Type: TABLE; Schema: petfy_db; Owner: postgres
--

CREATE TABLE petfy_db.cargos (
    id_cargo integer NOT NULL,
    nom_cargo character varying(100) NOT NULL,
    descripcion text
);


ALTER TABLE petfy_db.cargos OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 25360)
-- Name: cargos_id_cargo_seq; Type: SEQUENCE; Schema: petfy_db; Owner: postgres
--

CREATE SEQUENCE petfy_db.cargos_id_cargo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE petfy_db.cargos_id_cargo_seq OWNER TO postgres;

--
-- TOC entry 5232 (class 0 OID 0)
-- Dependencies: 223
-- Name: cargos_id_cargo_seq; Type: SEQUENCE OWNED BY; Schema: petfy_db; Owner: postgres
--

ALTER SEQUENCE petfy_db.cargos_id_cargo_seq OWNED BY petfy_db.cargos.id_cargo;


--
-- TOC entry 250 (class 1259 OID 25552)
-- Name: citas; Type: TABLE; Schema: petfy_db; Owner: postgres
--

CREATE TABLE petfy_db.citas (
    id_cita integer NOT NULL,
    fecha date NOT NULL,
    hora time without time zone NOT NULL,
    zona character varying(100),
    direccion text,
    complemento_direccion text,
    es_conjunto boolean DEFAULT false,
    torre character varying(50),
    apto character varying(50),
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    comment_admin text,
    fecha_fin_real timestamp without time zone,
    fecha_hora_real timestamp without time zone,
    fecha_asignacion timestamp without time zone,
    es_paseo_prueba boolean DEFAULT false,
    precio_final numeric(10,2),
    id_estado integer,
    id_mascota integer,
    id_usuario_cliente integer,
    id_usuario_paseador integer,
    id_plan integer,
    dias_semana character varying(100),
    persona_entrega character varying(150),
    persona_recibe character varying(150),
    id_suscripcion integer
);


ALTER TABLE petfy_db.citas OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 25551)
-- Name: citas_id_cita_seq; Type: SEQUENCE; Schema: petfy_db; Owner: postgres
--

CREATE SEQUENCE petfy_db.citas_id_cita_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE petfy_db.citas_id_cita_seq OWNER TO postgres;

--
-- TOC entry 5233 (class 0 OID 0)
-- Dependencies: 249
-- Name: citas_id_cita_seq; Type: SEQUENCE OWNED BY; Schema: petfy_db; Owner: postgres
--

ALTER SEQUENCE petfy_db.citas_id_cita_seq OWNED BY petfy_db.citas.id_cita;


--
-- TOC entry 226 (class 1259 OID 25372)
-- Name: comportamientos; Type: TABLE; Schema: petfy_db; Owner: postgres
--

CREATE TABLE petfy_db.comportamientos (
    id_comport integer NOT NULL,
    nom_comportamiento character varying(150) NOT NULL
);


ALTER TABLE petfy_db.comportamientos OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 25371)
-- Name: comportamientos_id_comport_seq; Type: SEQUENCE; Schema: petfy_db; Owner: postgres
--

CREATE SEQUENCE petfy_db.comportamientos_id_comport_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE petfy_db.comportamientos_id_comport_seq OWNER TO postgres;

--
-- TOC entry 5234 (class 0 OID 0)
-- Dependencies: 225
-- Name: comportamientos_id_comport_seq; Type: SEQUENCE OWNED BY; Schema: petfy_db; Owner: postgres
--

ALTER SEQUENCE petfy_db.comportamientos_id_comport_seq OWNED BY petfy_db.comportamientos.id_comport;


--
-- TOC entry 228 (class 1259 OID 25381)
-- Name: condiciones_medicas; Type: TABLE; Schema: petfy_db; Owner: postgres
--

CREATE TABLE petfy_db.condiciones_medicas (
    id_condicion integer NOT NULL,
    nom_condicion character varying(150) NOT NULL
);


ALTER TABLE petfy_db.condiciones_medicas OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 25380)
-- Name: condiciones_medicas_id_condicion_seq; Type: SEQUENCE; Schema: petfy_db; Owner: postgres
--

CREATE SEQUENCE petfy_db.condiciones_medicas_id_condicion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE petfy_db.condiciones_medicas_id_condicion_seq OWNER TO postgres;

--
-- TOC entry 5235 (class 0 OID 0)
-- Dependencies: 227
-- Name: condiciones_medicas_id_condicion_seq; Type: SEQUENCE OWNED BY; Schema: petfy_db; Owner: postgres
--

ALTER SEQUENCE petfy_db.condiciones_medicas_id_condicion_seq OWNED BY petfy_db.condiciones_medicas.id_condicion;


--
-- TOC entry 246 (class 1259 OID 25504)
-- Name: contratos_aceptados; Type: TABLE; Schema: petfy_db; Owner: postgres
--

CREATE TABLE petfy_db.contratos_aceptados (
    id_contrato integer NOT NULL,
    num_contrato character varying(100) NOT NULL,
    url_doc_generado text,
    fecha_aceptacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    version_contrato character varying(50),
    id_usuario integer,
    id_plan integer
);


ALTER TABLE petfy_db.contratos_aceptados OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 25503)
-- Name: contratos_aceptados_id_contrato_seq; Type: SEQUENCE; Schema: petfy_db; Owner: postgres
--

CREATE SEQUENCE petfy_db.contratos_aceptados_id_contrato_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE petfy_db.contratos_aceptados_id_contrato_seq OWNER TO postgres;

--
-- TOC entry 5236 (class 0 OID 0)
-- Dependencies: 245
-- Name: contratos_aceptados_id_contrato_seq; Type: SEQUENCE OWNED BY; Schema: petfy_db; Owner: postgres
--

ALTER SEQUENCE petfy_db.contratos_aceptados_id_contrato_seq OWNED BY petfy_db.contratos_aceptados.id_contrato;


--
-- TOC entry 254 (class 1259 OID 25612)
-- Name: devoluciones; Type: TABLE; Schema: petfy_db; Owner: postgres
--

CREATE TABLE petfy_db.devoluciones (
    id_devolucion integer NOT NULL,
    ref_wompi_dev character varying(100),
    fecha_solicitud timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    monto numeric(10,2) NOT NULL,
    motivo text,
    fecha_procesamiento timestamp without time zone,
    id_est_devo integer,
    id_pago integer
);


ALTER TABLE petfy_db.devoluciones OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 25611)
-- Name: devoluciones_id_devolucion_seq; Type: SEQUENCE; Schema: petfy_db; Owner: postgres
--

CREATE SEQUENCE petfy_db.devoluciones_id_devolucion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE petfy_db.devoluciones_id_devolucion_seq OWNER TO postgres;

--
-- TOC entry 5237 (class 0 OID 0)
-- Dependencies: 253
-- Name: devoluciones_id_devolucion_seq; Type: SEQUENCE OWNED BY; Schema: petfy_db; Owner: postgres
--

ALTER SEQUENCE petfy_db.devoluciones_id_devolucion_seq OWNED BY petfy_db.devoluciones.id_devolucion;


--
-- TOC entry 264 (class 1259 OID 25791)
-- Name: disponibilidad_servicio; Type: TABLE; Schema: petfy_db; Owner: postgres
--

CREATE TABLE petfy_db.disponibilidad_servicio (
    id_disponibilidad integer NOT NULL,
    id_servicio integer NOT NULL,
    dia_semana smallint NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    activo boolean DEFAULT true,
    CONSTRAINT chk_horario CHECK ((hora_fin > hora_inicio)),
    CONSTRAINT disponibilidad_servicio_dia_semana_check CHECK (((dia_semana >= 0) AND (dia_semana <= 6)))
);


ALTER TABLE petfy_db.disponibilidad_servicio OWNER TO postgres;

--
-- TOC entry 263 (class 1259 OID 25790)
-- Name: disponibilidad_servicio_id_disponibilidad_seq; Type: SEQUENCE; Schema: petfy_db; Owner: postgres
--

CREATE SEQUENCE petfy_db.disponibilidad_servicio_id_disponibilidad_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE petfy_db.disponibilidad_servicio_id_disponibilidad_seq OWNER TO postgres;

--
-- TOC entry 5238 (class 0 OID 0)
-- Dependencies: 263
-- Name: disponibilidad_servicio_id_disponibilidad_seq; Type: SEQUENCE OWNED BY; Schema: petfy_db; Owner: postgres
--

ALTER SEQUENCE petfy_db.disponibilidad_servicio_id_disponibilidad_seq OWNED BY petfy_db.disponibilidad_servicio.id_disponibilidad;


--
-- TOC entry 244 (class 1259 OID 25483)
-- Name: documentos_identidad; Type: TABLE; Schema: petfy_db; Owner: postgres
--

CREATE TABLE petfy_db.documentos_identidad (
    id_doc integer NOT NULL,
    num_doc character varying(50) NOT NULL,
    id_usuario integer,
    id_tipo_doc integer
);


ALTER TABLE petfy_db.documentos_identidad OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 25482)
-- Name: documentos_identidad_id_doc_seq; Type: SEQUENCE; Schema: petfy_db; Owner: postgres
--

CREATE SEQUENCE petfy_db.documentos_identidad_id_doc_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE petfy_db.documentos_identidad_id_doc_seq OWNER TO postgres;

--
-- TOC entry 5239 (class 0 OID 0)
-- Dependencies: 243
-- Name: documentos_identidad_id_doc_seq; Type: SEQUENCE OWNED BY; Schema: petfy_db; Owner: postgres
--

ALTER SEQUENCE petfy_db.documentos_identidad_id_doc_seq OWNED BY petfy_db.documentos_identidad.id_doc;


--
-- TOC entry 230 (class 1259 OID 25390)
-- Name: estados_citas; Type: TABLE; Schema: petfy_db; Owner: postgres
--

CREATE TABLE petfy_db.estados_citas (
    id_estado integer NOT NULL,
    nom_estado character varying(100) NOT NULL
);


ALTER TABLE petfy_db.estados_citas OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 25389)
-- Name: estados_citas_id_estado_seq; Type: SEQUENCE; Schema: petfy_db; Owner: postgres
--

CREATE SEQUENCE petfy_db.estados_citas_id_estado_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE petfy_db.estados_citas_id_estado_seq OWNER TO postgres;

--
-- TOC entry 5240 (class 0 OID 0)
-- Dependencies: 229
-- Name: estados_citas_id_estado_seq; Type: SEQUENCE OWNED BY; Schema: petfy_db; Owner: postgres
--

ALTER SEQUENCE petfy_db.estados_citas_id_estado_seq OWNED BY petfy_db.estados_citas.id_estado;


--
-- TOC entry 236 (class 1259 OID 25420)
-- Name: estados_devoluciones; Type: TABLE; Schema: petfy_db; Owner: postgres
--

CREATE TABLE petfy_db.estados_devoluciones (
    id_est_devo integer NOT NULL,
    nom_est_devo character varying(100) NOT NULL
);


ALTER TABLE petfy_db.estados_devoluciones OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 25419)
-- Name: estados_devoluciones_id_est_devo_seq; Type: SEQUENCE; Schema: petfy_db; Owner: postgres
--

CREATE SEQUENCE petfy_db.estados_devoluciones_id_est_devo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE petfy_db.estados_devoluciones_id_est_devo_seq OWNER TO postgres;

--
-- TOC entry 5241 (class 0 OID 0)
-- Dependencies: 235
-- Name: estados_devoluciones_id_est_devo_seq; Type: SEQUENCE OWNED BY; Schema: petfy_db; Owner: postgres
--

ALTER SEQUENCE petfy_db.estados_devoluciones_id_est_devo_seq OWNED BY petfy_db.estados_devoluciones.id_est_devo;


--
-- TOC entry 238 (class 1259 OID 25429)
-- Name: estados_facturas; Type: TABLE; Schema: petfy_db; Owner: postgres
--

CREATE TABLE petfy_db.estados_facturas (
    id_est_fact integer NOT NULL,
    nom_est_fact character varying(100) NOT NULL
);


ALTER TABLE petfy_db.estados_facturas OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 25428)
-- Name: estados_facturas_id_est_fact_seq; Type: SEQUENCE; Schema: petfy_db; Owner: postgres
--

CREATE SEQUENCE petfy_db.estados_facturas_id_est_fact_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE petfy_db.estados_facturas_id_est_fact_seq OWNER TO postgres;

--
-- TOC entry 5242 (class 0 OID 0)
-- Dependencies: 237
-- Name: estados_facturas_id_est_fact_seq; Type: SEQUENCE OWNED BY; Schema: petfy_db; Owner: postgres
--

ALTER SEQUENCE petfy_db.estados_facturas_id_est_fact_seq OWNED BY petfy_db.estados_facturas.id_est_fact;


--
-- TOC entry 234 (class 1259 OID 25411)
-- Name: estados_pago; Type: TABLE; Schema: petfy_db; Owner: postgres
--

CREATE TABLE petfy_db.estados_pago (
    id_estado_pago integer NOT NULL,
    nom_estado_pago character varying(100) NOT NULL
);


ALTER TABLE petfy_db.estados_pago OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 25410)
-- Name: estados_pago_id_estado_pago_seq; Type: SEQUENCE; Schema: petfy_db; Owner: postgres
--

CREATE SEQUENCE petfy_db.estados_pago_id_estado_pago_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE petfy_db.estados_pago_id_estado_pago_seq OWNER TO postgres;

--
-- TOC entry 5243 (class 0 OID 0)
-- Dependencies: 233
-- Name: estados_pago_id_estado_pago_seq; Type: SEQUENCE OWNED BY; Schema: petfy_db; Owner: postgres
--

ALTER SEQUENCE petfy_db.estados_pago_id_estado_pago_seq OWNED BY petfy_db.estados_pago.id_estado_pago;


--
-- TOC entry 266 (class 1259 OID 25813)
-- Name: excepciones_disponibilidad; Type: TABLE; Schema: petfy_db; Owner: postgres
--

CREATE TABLE petfy_db.excepciones_disponibilidad (
    id_excepcion integer NOT NULL,
    id_servicio integer NOT NULL,
    fecha date NOT NULL,
    motivo text,
    es_laborable boolean DEFAULT false,
    hora_inicio time without time zone,
    hora_fin time without time zone
);


ALTER TABLE petfy_db.excepciones_disponibilidad OWNER TO postgres;

--
-- TOC entry 265 (class 1259 OID 25812)
-- Name: excepciones_disponibilidad_id_excepcion_seq; Type: SEQUENCE; Schema: petfy_db; Owner: postgres
--

CREATE SEQUENCE petfy_db.excepciones_disponibilidad_id_excepcion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE petfy_db.excepciones_disponibilidad_id_excepcion_seq OWNER TO postgres;

--
-- TOC entry 5244 (class 0 OID 0)
-- Dependencies: 265
-- Name: excepciones_disponibilidad_id_excepcion_seq; Type: SEQUENCE OWNED BY; Schema: petfy_db; Owner: postgres
--

ALTER SEQUENCE petfy_db.excepciones_disponibilidad_id_excepcion_seq OWNED BY petfy_db.excepciones_disponibilidad.id_excepcion;


--
-- TOC entry 267 (class 1259 OID 25851)
-- Name: factura_consecutivo_seq; Type: SEQUENCE; Schema: petfy_db; Owner: postgres
--

CREATE SEQUENCE petfy_db.factura_consecutivo_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE petfy_db.factura_consecutivo_seq OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 25634)
-- Name: facturas; Type: TABLE; Schema: petfy_db; Owner: postgres
--

CREATE TABLE petfy_db.facturas (
    id_factura integer NOT NULL,
    num_factura character varying(100) NOT NULL,
    fecha_emision timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    total numeric(10,2) NOT NULL,
    sub_total numeric(10,2) NOT NULL,
    iva numeric(10,2) NOT NULL,
    plan_pago character varying(100),
    id_est_fact integer,
    id_cita integer,
    id_pago integer,
    moneda character varying(3) DEFAULT 'COP'::character varying,
    nombre_cliente character varying(200),
    documento_cliente character varying(50),
    correo_cliente character varying(150),
    direccion_cliente text,
    telefono_cliente character varying(20),
    fecha_vencimiento timestamp without time zone,
    observaciones text,
    cufe character varying(100)
);


ALTER TABLE petfy_db.facturas OWNER TO postgres;

--
-- TOC entry 258 (class 1259 OID 25661)
-- Name: facturas_detalle; Type: TABLE; Schema: petfy_db; Owner: postgres
--

CREATE TABLE petfy_db.facturas_detalle (
    id_fact_detalle integer NOT NULL,
    concepto text NOT NULL,
    cantidad integer NOT NULL,
    total_linea numeric(10,2) NOT NULL,
    iva numeric(10,2) NOT NULL,
    precio_uni numeric(10,2) NOT NULL,
    id_factura integer
);


ALTER TABLE petfy_db.facturas_detalle OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 25660)
-- Name: facturas_detalle_id_fact_detalle_seq; Type: SEQUENCE; Schema: petfy_db; Owner: postgres
--

CREATE SEQUENCE petfy_db.facturas_detalle_id_fact_detalle_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE petfy_db.facturas_detalle_id_fact_detalle_seq OWNER TO postgres;

--
-- TOC entry 5245 (class 0 OID 0)
-- Dependencies: 257
-- Name: facturas_detalle_id_fact_detalle_seq; Type: SEQUENCE OWNED BY; Schema: petfy_db; Owner: postgres
--

ALTER SEQUENCE petfy_db.facturas_detalle_id_fact_detalle_seq OWNED BY petfy_db.facturas_detalle.id_fact_detalle;


--
-- TOC entry 255 (class 1259 OID 25633)
-- Name: facturas_id_factura_seq; Type: SEQUENCE; Schema: petfy_db; Owner: postgres
--

CREATE SEQUENCE petfy_db.facturas_id_factura_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE petfy_db.facturas_id_factura_seq OWNER TO postgres;

--
-- TOC entry 5246 (class 0 OID 0)
-- Dependencies: 255
-- Name: facturas_id_factura_seq; Type: SEQUENCE OWNED BY; Schema: petfy_db; Owner: postgres
--

ALTER SEQUENCE petfy_db.facturas_id_factura_seq OWNED BY petfy_db.facturas.id_factura;


--
-- TOC entry 248 (class 1259 OID 25526)
-- Name: mascotas; Type: TABLE; Schema: petfy_db; Owner: postgres
--

CREATE TABLE petfy_db.mascotas (
    id_mascota integer NOT NULL,
    nom_mascota character varying(100) NOT NULL,
    peso numeric(5,2),
    edad integer,
    carne_vacunacion text,
    img_masc text,
    otras_indicaciones text,
    observar_condicion text,
    observar_comportamiento text,
    id_comportamiento integer,
    id_condicion_medica integer,
    id_usuario integer,
    id_raza integer,
    raza character varying(150)
);


ALTER TABLE petfy_db.mascotas OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 25525)
-- Name: mascotas_id_mascota_seq; Type: SEQUENCE; Schema: petfy_db; Owner: postgres
--

CREATE SEQUENCE petfy_db.mascotas_id_mascota_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE petfy_db.mascotas_id_mascota_seq OWNER TO postgres;

--
-- TOC entry 5247 (class 0 OID 0)
-- Dependencies: 247
-- Name: mascotas_id_mascota_seq; Type: SEQUENCE OWNED BY; Schema: petfy_db; Owner: postgres
--

ALTER SEQUENCE petfy_db.mascotas_id_mascota_seq OWNED BY petfy_db.mascotas.id_mascota;


--
-- TOC entry 232 (class 1259 OID 25399)
-- Name: metodos_pago; Type: TABLE; Schema: petfy_db; Owner: postgres
--

CREATE TABLE petfy_db.metodos_pago (
    id_metodo_pago integer NOT NULL,
    descripcion text,
    nom_metodo character varying(100) NOT NULL,
    activo boolean DEFAULT true
);


ALTER TABLE petfy_db.metodos_pago OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 25398)
-- Name: metodos_pago_id_metodo_pago_seq; Type: SEQUENCE; Schema: petfy_db; Owner: postgres
--

CREATE SEQUENCE petfy_db.metodos_pago_id_metodo_pago_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE petfy_db.metodos_pago_id_metodo_pago_seq OWNER TO postgres;

--
-- TOC entry 5248 (class 0 OID 0)
-- Dependencies: 231
-- Name: metodos_pago_id_metodo_pago_seq; Type: SEQUENCE OWNED BY; Schema: petfy_db; Owner: postgres
--

ALTER SEQUENCE petfy_db.metodos_pago_id_metodo_pago_seq OWNED BY petfy_db.metodos_pago.id_metodo_pago;


--
-- TOC entry 252 (class 1259 OID 25587)
-- Name: pagos; Type: TABLE; Schema: petfy_db; Owner: postgres
--

CREATE TABLE petfy_db.pagos (
    id_pago integer NOT NULL,
    monto numeric(10,2) NOT NULL,
    fecha_pago timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone,
    id_trans_wompi character varying(100),
    ref_wompi character varying(100),
    id_metodo_pago integer,
    id_estado_pago integer,
    id_cita integer,
    wompi_payload jsonb,
    payment_method_type character varying(50),
    card_last_four character varying(4),
    bank_name character varying(100),
    amount_in_cents integer,
    wompi_status character varying(50),
    customer_email character varying(150),
    wompi_finalized_at timestamp without time zone,
    wompi_sent_at timestamp without time zone
);


ALTER TABLE petfy_db.pagos OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 25586)
-- Name: pagos_id_pago_seq; Type: SEQUENCE; Schema: petfy_db; Owner: postgres
--

CREATE SEQUENCE petfy_db.pagos_id_pago_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE petfy_db.pagos_id_pago_seq OWNER TO postgres;

--
-- TOC entry 5249 (class 0 OID 0)
-- Dependencies: 251
-- Name: pagos_id_pago_seq; Type: SEQUENCE OWNED BY; Schema: petfy_db; Owner: postgres
--

ALTER SEQUENCE petfy_db.pagos_id_pago_seq OWNED BY petfy_db.pagos.id_pago;


--
-- TOC entry 240 (class 1259 OID 25438)
-- Name: planes; Type: TABLE; Schema: petfy_db; Owner: postgres
--

CREATE TABLE petfy_db.planes (
    id_plan integer NOT NULL,
    nom_plan character varying(150) NOT NULL,
    descripcion text,
    precio_actual numeric(10,2) NOT NULL,
    dias_permitidos integer DEFAULT 1,
    orden integer DEFAULT 0,
    activo boolean DEFAULT true,
    id_servicio integer NOT NULL,
    duracion_minutos integer DEFAULT 55
);


ALTER TABLE petfy_db.planes OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 25437)
-- Name: planes_id_plan_seq; Type: SEQUENCE; Schema: petfy_db; Owner: postgres
--

CREATE SEQUENCE petfy_db.planes_id_plan_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE petfy_db.planes_id_plan_seq OWNER TO postgres;

--
-- TOC entry 5250 (class 0 OID 0)
-- Dependencies: 239
-- Name: planes_id_plan_seq; Type: SEQUENCE OWNED BY; Schema: petfy_db; Owner: postgres
--

ALTER SEQUENCE petfy_db.planes_id_plan_seq OWNED BY petfy_db.planes.id_plan;


--
-- TOC entry 260 (class 1259 OID 25688)
-- Name: razas; Type: TABLE; Schema: petfy_db; Owner: postgres
--

CREATE TABLE petfy_db.razas (
    id_raza integer NOT NULL,
    nom_raza character varying(100) NOT NULL
);


ALTER TABLE petfy_db.razas OWNER TO postgres;

--
-- TOC entry 259 (class 1259 OID 25687)
-- Name: razas_id_raza_seq; Type: SEQUENCE; Schema: petfy_db; Owner: postgres
--

CREATE SEQUENCE petfy_db.razas_id_raza_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE petfy_db.razas_id_raza_seq OWNER TO postgres;

--
-- TOC entry 5251 (class 0 OID 0)
-- Dependencies: 259
-- Name: razas_id_raza_seq; Type: SEQUENCE OWNED BY; Schema: petfy_db; Owner: postgres
--

ALTER SEQUENCE petfy_db.razas_id_raza_seq OWNED BY petfy_db.razas.id_raza;


--
-- TOC entry 222 (class 1259 OID 25352)
-- Name: roles; Type: TABLE; Schema: petfy_db; Owner: postgres
--

CREATE TABLE petfy_db.roles (
    id_rol integer NOT NULL,
    nombre_rol character varying(100) NOT NULL
);


ALTER TABLE petfy_db.roles OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 25351)
-- Name: roles_id_rol_seq; Type: SEQUENCE; Schema: petfy_db; Owner: postgres
--

CREATE SEQUENCE petfy_db.roles_id_rol_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE petfy_db.roles_id_rol_seq OWNER TO postgres;

--
-- TOC entry 5252 (class 0 OID 0)
-- Dependencies: 221
-- Name: roles_id_rol_seq; Type: SEQUENCE OWNED BY; Schema: petfy_db; Owner: postgres
--

ALTER SEQUENCE petfy_db.roles_id_rol_seq OWNED BY petfy_db.roles.id_rol;


--
-- TOC entry 262 (class 1259 OID 25767)
-- Name: servicios; Type: TABLE; Schema: petfy_db; Owner: postgres
--

CREATE TABLE petfy_db.servicios (
    id_servicio integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    icono character varying(20),
    activo boolean DEFAULT true,
    orden integer DEFAULT 0
);


ALTER TABLE petfy_db.servicios OWNER TO postgres;

--
-- TOC entry 261 (class 1259 OID 25766)
-- Name: servicios_id_servicio_seq; Type: SEQUENCE; Schema: petfy_db; Owner: postgres
--

CREATE SEQUENCE petfy_db.servicios_id_servicio_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE petfy_db.servicios_id_servicio_seq OWNER TO postgres;

--
-- TOC entry 5253 (class 0 OID 0)
-- Dependencies: 261
-- Name: servicios_id_servicio_seq; Type: SEQUENCE OWNED BY; Schema: petfy_db; Owner: postgres
--

ALTER SEQUENCE petfy_db.servicios_id_servicio_seq OWNED BY petfy_db.servicios.id_servicio;


--
-- TOC entry 269 (class 1259 OID 25856)
-- Name: suscripciones; Type: TABLE; Schema: petfy_db; Owner: postgres
--

CREATE TABLE petfy_db.suscripciones (
    id_suscripcion integer NOT NULL,
    id_usuario integer NOT NULL,
    id_mascota integer NOT NULL,
    id_plan integer NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    activa boolean DEFAULT true NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    hora_preferida time without time zone,
    dias_semana character varying(50),
    CONSTRAINT chk_susc_fechas CHECK ((fecha_fin > fecha_inicio))
);


ALTER TABLE petfy_db.suscripciones OWNER TO postgres;

--
-- TOC entry 268 (class 1259 OID 25855)
-- Name: suscripciones_id_suscripcion_seq; Type: SEQUENCE; Schema: petfy_db; Owner: postgres
--

CREATE SEQUENCE petfy_db.suscripciones_id_suscripcion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE petfy_db.suscripciones_id_suscripcion_seq OWNER TO postgres;

--
-- TOC entry 5254 (class 0 OID 0)
-- Dependencies: 268
-- Name: suscripciones_id_suscripcion_seq; Type: SEQUENCE OWNED BY; Schema: petfy_db; Owner: postgres
--

ALTER SEQUENCE petfy_db.suscripciones_id_suscripcion_seq OWNED BY petfy_db.suscripciones.id_suscripcion;


--
-- TOC entry 220 (class 1259 OID 25343)
-- Name: tipos_documentos; Type: TABLE; Schema: petfy_db; Owner: postgres
--

CREATE TABLE petfy_db.tipos_documentos (
    id_tipo_doc integer NOT NULL,
    nom_tipo_doc character varying(100) NOT NULL
);


ALTER TABLE petfy_db.tipos_documentos OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 25342)
-- Name: tipos_documentos_id_tipo_doc_seq; Type: SEQUENCE; Schema: petfy_db; Owner: postgres
--

CREATE SEQUENCE petfy_db.tipos_documentos_id_tipo_doc_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE petfy_db.tipos_documentos_id_tipo_doc_seq OWNER TO postgres;

--
-- TOC entry 5255 (class 0 OID 0)
-- Dependencies: 219
-- Name: tipos_documentos_id_tipo_doc_seq; Type: SEQUENCE OWNED BY; Schema: petfy_db; Owner: postgres
--

ALTER SEQUENCE petfy_db.tipos_documentos_id_tipo_doc_seq OWNED BY petfy_db.tipos_documentos.id_tipo_doc;


--
-- TOC entry 242 (class 1259 OID 25450)
-- Name: usuarios; Type: TABLE; Schema: petfy_db; Owner: postgres
--

CREATE TABLE petfy_db.usuarios (
    id_usuario integer NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    correo character varying(150) NOT NULL,
    contrasena character varying(255) NOT NULL,
    telefono character varying(20),
    direccion text,
    cod_verif character varying(50),
    verificado boolean DEFAULT false,
    id_tipo_doc integer,
    id_rol integer,
    id_cargo integer,
    cod_expirado timestamp without time zone
);


ALTER TABLE petfy_db.usuarios OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 25449)
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE; Schema: petfy_db; Owner: postgres
--

CREATE SEQUENCE petfy_db.usuarios_id_usuario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE petfy_db.usuarios_id_usuario_seq OWNER TO postgres;

--
-- TOC entry 5256 (class 0 OID 0)
-- Dependencies: 241
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: petfy_db; Owner: postgres
--

ALTER SEQUENCE petfy_db.usuarios_id_usuario_seq OWNED BY petfy_db.usuarios.id_usuario;


--
-- TOC entry 4879 (class 2604 OID 25364)
-- Name: cargos id_cargo; Type: DEFAULT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.cargos ALTER COLUMN id_cargo SET DEFAULT nextval('petfy_db.cargos_id_cargo_seq'::regclass);


--
-- TOC entry 4899 (class 2604 OID 25555)
-- Name: citas id_cita; Type: DEFAULT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.citas ALTER COLUMN id_cita SET DEFAULT nextval('petfy_db.citas_id_cita_seq'::regclass);


--
-- TOC entry 4880 (class 2604 OID 25375)
-- Name: comportamientos id_comport; Type: DEFAULT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.comportamientos ALTER COLUMN id_comport SET DEFAULT nextval('petfy_db.comportamientos_id_comport_seq'::regclass);


--
-- TOC entry 4881 (class 2604 OID 25384)
-- Name: condiciones_medicas id_condicion; Type: DEFAULT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.condiciones_medicas ALTER COLUMN id_condicion SET DEFAULT nextval('petfy_db.condiciones_medicas_id_condicion_seq'::regclass);


--
-- TOC entry 4896 (class 2604 OID 25507)
-- Name: contratos_aceptados id_contrato; Type: DEFAULT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.contratos_aceptados ALTER COLUMN id_contrato SET DEFAULT nextval('petfy_db.contratos_aceptados_id_contrato_seq'::regclass);


--
-- TOC entry 4905 (class 2604 OID 25615)
-- Name: devoluciones id_devolucion; Type: DEFAULT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.devoluciones ALTER COLUMN id_devolucion SET DEFAULT nextval('petfy_db.devoluciones_id_devolucion_seq'::regclass);


--
-- TOC entry 4915 (class 2604 OID 25794)
-- Name: disponibilidad_servicio id_disponibilidad; Type: DEFAULT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.disponibilidad_servicio ALTER COLUMN id_disponibilidad SET DEFAULT nextval('petfy_db.disponibilidad_servicio_id_disponibilidad_seq'::regclass);


--
-- TOC entry 4895 (class 2604 OID 25486)
-- Name: documentos_identidad id_doc; Type: DEFAULT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.documentos_identidad ALTER COLUMN id_doc SET DEFAULT nextval('petfy_db.documentos_identidad_id_doc_seq'::regclass);


--
-- TOC entry 4882 (class 2604 OID 25393)
-- Name: estados_citas id_estado; Type: DEFAULT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.estados_citas ALTER COLUMN id_estado SET DEFAULT nextval('petfy_db.estados_citas_id_estado_seq'::regclass);


--
-- TOC entry 4886 (class 2604 OID 25423)
-- Name: estados_devoluciones id_est_devo; Type: DEFAULT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.estados_devoluciones ALTER COLUMN id_est_devo SET DEFAULT nextval('petfy_db.estados_devoluciones_id_est_devo_seq'::regclass);


--
-- TOC entry 4887 (class 2604 OID 25432)
-- Name: estados_facturas id_est_fact; Type: DEFAULT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.estados_facturas ALTER COLUMN id_est_fact SET DEFAULT nextval('petfy_db.estados_facturas_id_est_fact_seq'::regclass);


--
-- TOC entry 4885 (class 2604 OID 25414)
-- Name: estados_pago id_estado_pago; Type: DEFAULT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.estados_pago ALTER COLUMN id_estado_pago SET DEFAULT nextval('petfy_db.estados_pago_id_estado_pago_seq'::regclass);


--
-- TOC entry 4917 (class 2604 OID 25816)
-- Name: excepciones_disponibilidad id_excepcion; Type: DEFAULT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.excepciones_disponibilidad ALTER COLUMN id_excepcion SET DEFAULT nextval('petfy_db.excepciones_disponibilidad_id_excepcion_seq'::regclass);


--
-- TOC entry 4907 (class 2604 OID 25637)
-- Name: facturas id_factura; Type: DEFAULT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.facturas ALTER COLUMN id_factura SET DEFAULT nextval('petfy_db.facturas_id_factura_seq'::regclass);


--
-- TOC entry 4910 (class 2604 OID 25664)
-- Name: facturas_detalle id_fact_detalle; Type: DEFAULT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.facturas_detalle ALTER COLUMN id_fact_detalle SET DEFAULT nextval('petfy_db.facturas_detalle_id_fact_detalle_seq'::regclass);


--
-- TOC entry 4898 (class 2604 OID 25529)
-- Name: mascotas id_mascota; Type: DEFAULT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.mascotas ALTER COLUMN id_mascota SET DEFAULT nextval('petfy_db.mascotas_id_mascota_seq'::regclass);


--
-- TOC entry 4883 (class 2604 OID 25402)
-- Name: metodos_pago id_metodo_pago; Type: DEFAULT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.metodos_pago ALTER COLUMN id_metodo_pago SET DEFAULT nextval('petfy_db.metodos_pago_id_metodo_pago_seq'::regclass);


--
-- TOC entry 4903 (class 2604 OID 25590)
-- Name: pagos id_pago; Type: DEFAULT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.pagos ALTER COLUMN id_pago SET DEFAULT nextval('petfy_db.pagos_id_pago_seq'::regclass);


--
-- TOC entry 4888 (class 2604 OID 25441)
-- Name: planes id_plan; Type: DEFAULT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.planes ALTER COLUMN id_plan SET DEFAULT nextval('petfy_db.planes_id_plan_seq'::regclass);


--
-- TOC entry 4911 (class 2604 OID 25691)
-- Name: razas id_raza; Type: DEFAULT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.razas ALTER COLUMN id_raza SET DEFAULT nextval('petfy_db.razas_id_raza_seq'::regclass);


--
-- TOC entry 4878 (class 2604 OID 25355)
-- Name: roles id_rol; Type: DEFAULT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.roles ALTER COLUMN id_rol SET DEFAULT nextval('petfy_db.roles_id_rol_seq'::regclass);


--
-- TOC entry 4912 (class 2604 OID 25770)
-- Name: servicios id_servicio; Type: DEFAULT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.servicios ALTER COLUMN id_servicio SET DEFAULT nextval('petfy_db.servicios_id_servicio_seq'::regclass);


--
-- TOC entry 4919 (class 2604 OID 25859)
-- Name: suscripciones id_suscripcion; Type: DEFAULT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.suscripciones ALTER COLUMN id_suscripcion SET DEFAULT nextval('petfy_db.suscripciones_id_suscripcion_seq'::regclass);


--
-- TOC entry 4877 (class 2604 OID 25346)
-- Name: tipos_documentos id_tipo_doc; Type: DEFAULT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.tipos_documentos ALTER COLUMN id_tipo_doc SET DEFAULT nextval('petfy_db.tipos_documentos_id_tipo_doc_seq'::regclass);


--
-- TOC entry 4893 (class 2604 OID 25453)
-- Name: usuarios id_usuario; Type: DEFAULT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.usuarios ALTER COLUMN id_usuario SET DEFAULT nextval('petfy_db.usuarios_id_usuario_seq'::regclass);


--
-- TOC entry 5180 (class 0 OID 25361)
-- Dependencies: 224
-- Data for Name: cargos; Type: TABLE DATA; Schema: petfy_db; Owner: postgres
--

COPY petfy_db.cargos (id_cargo, nom_cargo, descripcion) FROM stdin;
\.


--
-- TOC entry 5206 (class 0 OID 25552)
-- Dependencies: 250
-- Data for Name: citas; Type: TABLE DATA; Schema: petfy_db; Owner: postgres
--

COPY petfy_db.citas (id_cita, fecha, hora, zona, direccion, complemento_direccion, es_conjunto, torre, apto, fecha_creacion, comment_admin, fecha_fin_real, fecha_hora_real, fecha_asignacion, es_paseo_prueba, precio_final, id_estado, id_mascota, id_usuario_cliente, id_usuario_paseador, id_plan, dias_semana, persona_entrega, persona_recibe, id_suscripcion) FROM stdin;
\.


--
-- TOC entry 5182 (class 0 OID 25372)
-- Dependencies: 226
-- Data for Name: comportamientos; Type: TABLE DATA; Schema: petfy_db; Owner: postgres
--

COPY petfy_db.comportamientos (id_comport, nom_comportamiento) FROM stdin;
1	Juguetón
2	Tranquilo
3	Agresivo
4	Tímido
5	Sociable
6	Miedoso
\.


--
-- TOC entry 5184 (class 0 OID 25381)
-- Dependencies: 228
-- Data for Name: condiciones_medicas; Type: TABLE DATA; Schema: petfy_db; Owner: postgres
--

COPY petfy_db.condiciones_medicas (id_condicion, nom_condicion) FROM stdin;
1	Ninguna
2	Alérgico a algún alimento
3	En tratamiento médico
4	Discapacidad física
5	Vacunas al día
\.


--
-- TOC entry 5202 (class 0 OID 25504)
-- Dependencies: 246
-- Data for Name: contratos_aceptados; Type: TABLE DATA; Schema: petfy_db; Owner: postgres
--

COPY petfy_db.contratos_aceptados (id_contrato, num_contrato, url_doc_generado, fecha_aceptacion, version_contrato, id_usuario, id_plan) FROM stdin;
\.


--
-- TOC entry 5210 (class 0 OID 25612)
-- Dependencies: 254
-- Data for Name: devoluciones; Type: TABLE DATA; Schema: petfy_db; Owner: postgres
--

COPY petfy_db.devoluciones (id_devolucion, ref_wompi_dev, fecha_solicitud, monto, motivo, fecha_procesamiento, id_est_devo, id_pago) FROM stdin;
\.


--
-- TOC entry 5220 (class 0 OID 25791)
-- Dependencies: 264
-- Data for Name: disponibilidad_servicio; Type: TABLE DATA; Schema: petfy_db; Owner: postgres
--

COPY petfy_db.disponibilidad_servicio (id_disponibilidad, id_servicio, dia_semana, hora_inicio, hora_fin, activo) FROM stdin;
1	1	1	06:00:00	17:00:00	t
2	1	2	06:00:00	17:00:00	t
3	1	3	06:00:00	17:00:00	t
4	1	4	06:00:00	17:00:00	t
5	1	5	06:00:00	17:00:00	t
6	1	6	06:00:00	17:00:00	t
\.


--
-- TOC entry 5200 (class 0 OID 25483)
-- Dependencies: 244
-- Data for Name: documentos_identidad; Type: TABLE DATA; Schema: petfy_db; Owner: postgres
--

COPY petfy_db.documentos_identidad (id_doc, num_doc, id_usuario, id_tipo_doc) FROM stdin;
\.


--
-- TOC entry 5186 (class 0 OID 25390)
-- Dependencies: 230
-- Data for Name: estados_citas; Type: TABLE DATA; Schema: petfy_db; Owner: postgres
--

COPY petfy_db.estados_citas (id_estado, nom_estado) FROM stdin;
1	Pendiente
2	Confirmada
3	En Curso
4	Completada
5	Cancelada
\.


--
-- TOC entry 5192 (class 0 OID 25420)
-- Dependencies: 236
-- Data for Name: estados_devoluciones; Type: TABLE DATA; Schema: petfy_db; Owner: postgres
--

COPY petfy_db.estados_devoluciones (id_est_devo, nom_est_devo) FROM stdin;
1	Solicitada
2	En Proceso
3	Procesada
4	Rechazada
\.


--
-- TOC entry 5194 (class 0 OID 25429)
-- Dependencies: 238
-- Data for Name: estados_facturas; Type: TABLE DATA; Schema: petfy_db; Owner: postgres
--

COPY petfy_db.estados_facturas (id_est_fact, nom_est_fact) FROM stdin;
1	Emitida
2	Pagada
3	Anulada
4	Vencida
\.


--
-- TOC entry 5190 (class 0 OID 25411)
-- Dependencies: 234
-- Data for Name: estados_pago; Type: TABLE DATA; Schema: petfy_db; Owner: postgres
--

COPY petfy_db.estados_pago (id_estado_pago, nom_estado_pago) FROM stdin;
1	Pendiente
2	Aprobado
3	Rechazado
4	Reembolsado
\.


--
-- TOC entry 5222 (class 0 OID 25813)
-- Dependencies: 266
-- Data for Name: excepciones_disponibilidad; Type: TABLE DATA; Schema: petfy_db; Owner: postgres
--

COPY petfy_db.excepciones_disponibilidad (id_excepcion, id_servicio, fecha, motivo, es_laborable, hora_inicio, hora_fin) FROM stdin;
\.


--
-- TOC entry 5212 (class 0 OID 25634)
-- Dependencies: 256
-- Data for Name: facturas; Type: TABLE DATA; Schema: petfy_db; Owner: postgres
--

COPY petfy_db.facturas (id_factura, num_factura, fecha_emision, total, sub_total, iva, plan_pago, id_est_fact, id_cita, id_pago, moneda, nombre_cliente, documento_cliente, correo_cliente, direccion_cliente, telefono_cliente, fecha_vencimiento, observaciones, cufe) FROM stdin;
\.


--
-- TOC entry 5214 (class 0 OID 25661)
-- Dependencies: 258
-- Data for Name: facturas_detalle; Type: TABLE DATA; Schema: petfy_db; Owner: postgres
--

COPY petfy_db.facturas_detalle (id_fact_detalle, concepto, cantidad, total_linea, iva, precio_uni, id_factura) FROM stdin;
\.


--
-- TOC entry 5204 (class 0 OID 25526)
-- Dependencies: 248
-- Data for Name: mascotas; Type: TABLE DATA; Schema: petfy_db; Owner: postgres
--

COPY petfy_db.mascotas (id_mascota, nom_mascota, peso, edad, carne_vacunacion, img_masc, otras_indicaciones, observar_condicion, observar_comportamiento, id_comportamiento, id_condicion_medica, id_usuario, id_raza, raza) FROM stdin;
\.


--
-- TOC entry 5188 (class 0 OID 25399)
-- Dependencies: 232
-- Data for Name: metodos_pago; Type: TABLE DATA; Schema: petfy_db; Owner: postgres
--

COPY petfy_db.metodos_pago (id_metodo_pago, descripcion, nom_metodo, activo) FROM stdin;
1	Pagos con Visa, Mastercard, etc.	Tarjeta de Crédito	t
2	Pagos desde cuenta bancaria	PSE	t
3	Pagos desde billetera digital	Nequi/Daviplata	t
4	Pago contra entrega	Efectivo	t
\.


--
-- TOC entry 5208 (class 0 OID 25587)
-- Dependencies: 252
-- Data for Name: pagos; Type: TABLE DATA; Schema: petfy_db; Owner: postgres
--

COPY petfy_db.pagos (id_pago, monto, fecha_pago, fecha_actualizacion, id_trans_wompi, ref_wompi, id_metodo_pago, id_estado_pago, id_cita, wompi_payload, payment_method_type, card_last_four, bank_name, amount_in_cents, wompi_status, customer_email, wompi_finalized_at, wompi_sent_at) FROM stdin;
\.


--
-- TOC entry 5196 (class 0 OID 25438)
-- Dependencies: 240
-- Data for Name: planes; Type: TABLE DATA; Schema: petfy_db; Owner: postgres
--

COPY petfy_db.planes (id_plan, nom_plan, descripcion, precio_actual, dias_permitidos, orden, activo, id_servicio, duracion_minutos) FROM stdin;
1	Paseo Único	Un paseo individual cuando lo necesites	19990.00	1	1	t	1	55
2	3 Días/Semana	Plan mensual de 3 paseos por semana	189990.00	3	2	t	1	55
3	5 Días/Semana	Plan mensual de 5 paseos por semana con VIP	299990.00	5	3	t	1	55
\.


--
-- TOC entry 5216 (class 0 OID 25688)
-- Dependencies: 260
-- Data for Name: razas; Type: TABLE DATA; Schema: petfy_db; Owner: postgres
--

COPY petfy_db.razas (id_raza, nom_raza) FROM stdin;
1	Golden Retriever
2	Labrador Retriever
3	Pastor Alemán
4	Bulldog Francés
5	Bulldog Inglés
6	Poodle
7	Beagle
8	Chihuahua
9	Pug
10	Husky Siberiano
11	Rottweiler
12	Doberman
13	Boxer
14	Cocker Spaniel
15	Border Collie
16	Yorkshire Terrier
17	Shih Tzu
18	Pomerania
19	Schnauzer
20	Dálmata
21	Pitbull
22	Akita
23	Caniche
24	Criollo / Mestizo
25	Otra
\.


--
-- TOC entry 5178 (class 0 OID 25352)
-- Dependencies: 222
-- Data for Name: roles; Type: TABLE DATA; Schema: petfy_db; Owner: postgres
--

COPY petfy_db.roles (id_rol, nombre_rol) FROM stdin;
1	Administrador
2	Cliente
3	Paseador
\.


--
-- TOC entry 5218 (class 0 OID 25767)
-- Dependencies: 262
-- Data for Name: servicios; Type: TABLE DATA; Schema: petfy_db; Owner: postgres
--

COPY petfy_db.servicios (id_servicio, nombre, descripcion, icono, activo, orden) FROM stdin;
1	paseos	Paseos profesionales con GPS en vivo	🐕	t	1
2	banos	Baño profesional con productos hipoalergénicos	🛁	t	2
3	guarderia	Cuidado diario con cámaras 24/7	🏠	t	3
4	entrenamiento	Adiestramiento personalizado	🎓	t	4
5	veterinaria	Atención veterinaria a domicilio	🩺	t	5
\.


--
-- TOC entry 5225 (class 0 OID 25856)
-- Dependencies: 269
-- Data for Name: suscripciones; Type: TABLE DATA; Schema: petfy_db; Owner: postgres
--

COPY petfy_db.suscripciones (id_suscripcion, id_usuario, id_mascota, id_plan, fecha_inicio, fecha_fin, activa, fecha_creacion, hora_preferida, dias_semana) FROM stdin;
\.


--
-- TOC entry 5176 (class 0 OID 25343)
-- Dependencies: 220
-- Data for Name: tipos_documentos; Type: TABLE DATA; Schema: petfy_db; Owner: postgres
--

COPY petfy_db.tipos_documentos (id_tipo_doc, nom_tipo_doc) FROM stdin;
1	Cédula de Ciudadanía
2	PPT
3	Cédula de Extranjería
4	Pasaporte
5	NIT
\.


--
-- TOC entry 5198 (class 0 OID 25450)
-- Dependencies: 242
-- Data for Name: usuarios; Type: TABLE DATA; Schema: petfy_db; Owner: postgres
--

COPY petfy_db.usuarios (id_usuario, nombre, apellido, correo, contrasena, telefono, direccion, cod_verif, verificado, id_tipo_doc, id_rol, id_cargo, cod_expirado) FROM stdin;
\.


--
-- TOC entry 5257 (class 0 OID 0)
-- Dependencies: 223
-- Name: cargos_id_cargo_seq; Type: SEQUENCE SET; Schema: petfy_db; Owner: postgres
--

SELECT pg_catalog.setval('petfy_db.cargos_id_cargo_seq', 1, false);


--
-- TOC entry 5258 (class 0 OID 0)
-- Dependencies: 249
-- Name: citas_id_cita_seq; Type: SEQUENCE SET; Schema: petfy_db; Owner: postgres
--

SELECT pg_catalog.setval('petfy_db.citas_id_cita_seq', 1, false);


--
-- TOC entry 5259 (class 0 OID 0)
-- Dependencies: 225
-- Name: comportamientos_id_comport_seq; Type: SEQUENCE SET; Schema: petfy_db; Owner: postgres
--

SELECT pg_catalog.setval('petfy_db.comportamientos_id_comport_seq', 6, true);


--
-- TOC entry 5260 (class 0 OID 0)
-- Dependencies: 227
-- Name: condiciones_medicas_id_condicion_seq; Type: SEQUENCE SET; Schema: petfy_db; Owner: postgres
--

SELECT pg_catalog.setval('petfy_db.condiciones_medicas_id_condicion_seq', 5, true);


--
-- TOC entry 5261 (class 0 OID 0)
-- Dependencies: 245
-- Name: contratos_aceptados_id_contrato_seq; Type: SEQUENCE SET; Schema: petfy_db; Owner: postgres
--

SELECT pg_catalog.setval('petfy_db.contratos_aceptados_id_contrato_seq', 1, false);


--
-- TOC entry 5262 (class 0 OID 0)
-- Dependencies: 253
-- Name: devoluciones_id_devolucion_seq; Type: SEQUENCE SET; Schema: petfy_db; Owner: postgres
--

SELECT pg_catalog.setval('petfy_db.devoluciones_id_devolucion_seq', 1, false);


--
-- TOC entry 5263 (class 0 OID 0)
-- Dependencies: 263
-- Name: disponibilidad_servicio_id_disponibilidad_seq; Type: SEQUENCE SET; Schema: petfy_db; Owner: postgres
--

SELECT pg_catalog.setval('petfy_db.disponibilidad_servicio_id_disponibilidad_seq', 6, true);


--
-- TOC entry 5264 (class 0 OID 0)
-- Dependencies: 243
-- Name: documentos_identidad_id_doc_seq; Type: SEQUENCE SET; Schema: petfy_db; Owner: postgres
--

SELECT pg_catalog.setval('petfy_db.documentos_identidad_id_doc_seq', 1, false);


--
-- TOC entry 5265 (class 0 OID 0)
-- Dependencies: 229
-- Name: estados_citas_id_estado_seq; Type: SEQUENCE SET; Schema: petfy_db; Owner: postgres
--

SELECT pg_catalog.setval('petfy_db.estados_citas_id_estado_seq', 5, true);


--
-- TOC entry 5266 (class 0 OID 0)
-- Dependencies: 235
-- Name: estados_devoluciones_id_est_devo_seq; Type: SEQUENCE SET; Schema: petfy_db; Owner: postgres
--

SELECT pg_catalog.setval('petfy_db.estados_devoluciones_id_est_devo_seq', 4, true);


--
-- TOC entry 5267 (class 0 OID 0)
-- Dependencies: 237
-- Name: estados_facturas_id_est_fact_seq; Type: SEQUENCE SET; Schema: petfy_db; Owner: postgres
--

SELECT pg_catalog.setval('petfy_db.estados_facturas_id_est_fact_seq', 4, true);


--
-- TOC entry 5268 (class 0 OID 0)
-- Dependencies: 233
-- Name: estados_pago_id_estado_pago_seq; Type: SEQUENCE SET; Schema: petfy_db; Owner: postgres
--

SELECT pg_catalog.setval('petfy_db.estados_pago_id_estado_pago_seq', 4, true);


--
-- TOC entry 5269 (class 0 OID 0)
-- Dependencies: 265
-- Name: excepciones_disponibilidad_id_excepcion_seq; Type: SEQUENCE SET; Schema: petfy_db; Owner: postgres
--

SELECT pg_catalog.setval('petfy_db.excepciones_disponibilidad_id_excepcion_seq', 1, false);


--
-- TOC entry 5270 (class 0 OID 0)
-- Dependencies: 267
-- Name: factura_consecutivo_seq; Type: SEQUENCE SET; Schema: petfy_db; Owner: postgres
--

SELECT pg_catalog.setval('petfy_db.factura_consecutivo_seq', 1, false);


--
-- TOC entry 5271 (class 0 OID 0)
-- Dependencies: 257
-- Name: facturas_detalle_id_fact_detalle_seq; Type: SEQUENCE SET; Schema: petfy_db; Owner: postgres
--

SELECT pg_catalog.setval('petfy_db.facturas_detalle_id_fact_detalle_seq', 1, false);


--
-- TOC entry 5272 (class 0 OID 0)
-- Dependencies: 255
-- Name: facturas_id_factura_seq; Type: SEQUENCE SET; Schema: petfy_db; Owner: postgres
--

SELECT pg_catalog.setval('petfy_db.facturas_id_factura_seq', 1, false);


--
-- TOC entry 5273 (class 0 OID 0)
-- Dependencies: 247
-- Name: mascotas_id_mascota_seq; Type: SEQUENCE SET; Schema: petfy_db; Owner: postgres
--

SELECT pg_catalog.setval('petfy_db.mascotas_id_mascota_seq', 1, false);


--
-- TOC entry 5274 (class 0 OID 0)
-- Dependencies: 231
-- Name: metodos_pago_id_metodo_pago_seq; Type: SEQUENCE SET; Schema: petfy_db; Owner: postgres
--

SELECT pg_catalog.setval('petfy_db.metodos_pago_id_metodo_pago_seq', 4, true);


--
-- TOC entry 5275 (class 0 OID 0)
-- Dependencies: 251
-- Name: pagos_id_pago_seq; Type: SEQUENCE SET; Schema: petfy_db; Owner: postgres
--

SELECT pg_catalog.setval('petfy_db.pagos_id_pago_seq', 1, false);


--
-- TOC entry 5276 (class 0 OID 0)
-- Dependencies: 239
-- Name: planes_id_plan_seq; Type: SEQUENCE SET; Schema: petfy_db; Owner: postgres
--

SELECT pg_catalog.setval('petfy_db.planes_id_plan_seq', 3, true);


--
-- TOC entry 5277 (class 0 OID 0)
-- Dependencies: 259
-- Name: razas_id_raza_seq; Type: SEQUENCE SET; Schema: petfy_db; Owner: postgres
--

SELECT pg_catalog.setval('petfy_db.razas_id_raza_seq', 25, true);


--
-- TOC entry 5278 (class 0 OID 0)
-- Dependencies: 221
-- Name: roles_id_rol_seq; Type: SEQUENCE SET; Schema: petfy_db; Owner: postgres
--

SELECT pg_catalog.setval('petfy_db.roles_id_rol_seq', 3, true);


--
-- TOC entry 5279 (class 0 OID 0)
-- Dependencies: 261
-- Name: servicios_id_servicio_seq; Type: SEQUENCE SET; Schema: petfy_db; Owner: postgres
--

SELECT pg_catalog.setval('petfy_db.servicios_id_servicio_seq', 5, true);


--
-- TOC entry 5280 (class 0 OID 0)
-- Dependencies: 268
-- Name: suscripciones_id_suscripcion_seq; Type: SEQUENCE SET; Schema: petfy_db; Owner: postgres
--

SELECT pg_catalog.setval('petfy_db.suscripciones_id_suscripcion_seq', 1, false);


--
-- TOC entry 5281 (class 0 OID 0)
-- Dependencies: 219
-- Name: tipos_documentos_id_tipo_doc_seq; Type: SEQUENCE SET; Schema: petfy_db; Owner: postgres
--

SELECT pg_catalog.setval('petfy_db.tipos_documentos_id_tipo_doc_seq', 5, true);


--
-- TOC entry 5282 (class 0 OID 0)
-- Dependencies: 241
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE SET; Schema: petfy_db; Owner: postgres
--

SELECT pg_catalog.setval('petfy_db.usuarios_id_usuario_seq', 1, false);


--
-- TOC entry 4930 (class 2606 OID 25370)
-- Name: cargos cargos_pkey; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.cargos
    ADD CONSTRAINT cargos_pkey PRIMARY KEY (id_cargo);


--
-- TOC entry 4960 (class 2606 OID 25565)
-- Name: citas citas_pkey; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.citas
    ADD CONSTRAINT citas_pkey PRIMARY KEY (id_cita);


--
-- TOC entry 4932 (class 2606 OID 25379)
-- Name: comportamientos comportamientos_pkey; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.comportamientos
    ADD CONSTRAINT comportamientos_pkey PRIMARY KEY (id_comport);


--
-- TOC entry 4934 (class 2606 OID 25388)
-- Name: condiciones_medicas condiciones_medicas_pkey; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.condiciones_medicas
    ADD CONSTRAINT condiciones_medicas_pkey PRIMARY KEY (id_condicion);


--
-- TOC entry 4956 (class 2606 OID 25514)
-- Name: contratos_aceptados contratos_aceptados_pkey; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.contratos_aceptados
    ADD CONSTRAINT contratos_aceptados_pkey PRIMARY KEY (id_contrato);


--
-- TOC entry 4966 (class 2606 OID 25622)
-- Name: devoluciones devoluciones_pkey; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.devoluciones
    ADD CONSTRAINT devoluciones_pkey PRIMARY KEY (id_devolucion);


--
-- TOC entry 4985 (class 2606 OID 25806)
-- Name: disponibilidad_servicio disponibilidad_servicio_id_servicio_dia_semana_key; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.disponibilidad_servicio
    ADD CONSTRAINT disponibilidad_servicio_id_servicio_dia_semana_key UNIQUE (id_servicio, dia_semana);


--
-- TOC entry 4987 (class 2606 OID 25804)
-- Name: disponibilidad_servicio disponibilidad_servicio_pkey; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.disponibilidad_servicio
    ADD CONSTRAINT disponibilidad_servicio_pkey PRIMARY KEY (id_disponibilidad);


--
-- TOC entry 4952 (class 2606 OID 25492)
-- Name: documentos_identidad documentos_identidad_id_usuario_key; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.documentos_identidad
    ADD CONSTRAINT documentos_identidad_id_usuario_key UNIQUE (id_usuario);


--
-- TOC entry 4954 (class 2606 OID 25490)
-- Name: documentos_identidad documentos_identidad_pkey; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.documentos_identidad
    ADD CONSTRAINT documentos_identidad_pkey PRIMARY KEY (id_doc);


--
-- TOC entry 4936 (class 2606 OID 25397)
-- Name: estados_citas estados_citas_pkey; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.estados_citas
    ADD CONSTRAINT estados_citas_pkey PRIMARY KEY (id_estado);


--
-- TOC entry 4942 (class 2606 OID 25427)
-- Name: estados_devoluciones estados_devoluciones_pkey; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.estados_devoluciones
    ADD CONSTRAINT estados_devoluciones_pkey PRIMARY KEY (id_est_devo);


--
-- TOC entry 4944 (class 2606 OID 25436)
-- Name: estados_facturas estados_facturas_pkey; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.estados_facturas
    ADD CONSTRAINT estados_facturas_pkey PRIMARY KEY (id_est_fact);


--
-- TOC entry 4940 (class 2606 OID 25418)
-- Name: estados_pago estados_pago_pkey; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.estados_pago
    ADD CONSTRAINT estados_pago_pkey PRIMARY KEY (id_estado_pago);


--
-- TOC entry 4989 (class 2606 OID 25826)
-- Name: excepciones_disponibilidad excepciones_disponibilidad_id_servicio_fecha_key; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.excepciones_disponibilidad
    ADD CONSTRAINT excepciones_disponibilidad_id_servicio_fecha_key UNIQUE (id_servicio, fecha);


--
-- TOC entry 4991 (class 2606 OID 25824)
-- Name: excepciones_disponibilidad excepciones_disponibilidad_pkey; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.excepciones_disponibilidad
    ADD CONSTRAINT excepciones_disponibilidad_pkey PRIMARY KEY (id_excepcion);


--
-- TOC entry 4975 (class 2606 OID 25674)
-- Name: facturas_detalle facturas_detalle_pkey; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.facturas_detalle
    ADD CONSTRAINT facturas_detalle_pkey PRIMARY KEY (id_fact_detalle);


--
-- TOC entry 4968 (class 2606 OID 25649)
-- Name: facturas facturas_id_cita_key; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.facturas
    ADD CONSTRAINT facturas_id_cita_key UNIQUE (id_cita);


--
-- TOC entry 4970 (class 2606 OID 25647)
-- Name: facturas facturas_num_factura_key; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.facturas
    ADD CONSTRAINT facturas_num_factura_key UNIQUE (num_factura);


--
-- TOC entry 4972 (class 2606 OID 25645)
-- Name: facturas facturas_pkey; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.facturas
    ADD CONSTRAINT facturas_pkey PRIMARY KEY (id_factura);


--
-- TOC entry 4958 (class 2606 OID 25535)
-- Name: mascotas mascotas_pkey; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.mascotas
    ADD CONSTRAINT mascotas_pkey PRIMARY KEY (id_mascota);


--
-- TOC entry 4938 (class 2606 OID 25409)
-- Name: metodos_pago metodos_pago_pkey; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.metodos_pago
    ADD CONSTRAINT metodos_pago_pkey PRIMARY KEY (id_metodo_pago);


--
-- TOC entry 4964 (class 2606 OID 25595)
-- Name: pagos pagos_pkey; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.pagos
    ADD CONSTRAINT pagos_pkey PRIMARY KEY (id_pago);


--
-- TOC entry 4946 (class 2606 OID 25448)
-- Name: planes planes_pkey; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.planes
    ADD CONSTRAINT planes_pkey PRIMARY KEY (id_plan);


--
-- TOC entry 4977 (class 2606 OID 25697)
-- Name: razas razas_nom_raza_key; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.razas
    ADD CONSTRAINT razas_nom_raza_key UNIQUE (nom_raza);


--
-- TOC entry 4979 (class 2606 OID 25695)
-- Name: razas razas_pkey; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.razas
    ADD CONSTRAINT razas_pkey PRIMARY KEY (id_raza);


--
-- TOC entry 4928 (class 2606 OID 25359)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id_rol);


--
-- TOC entry 4981 (class 2606 OID 25780)
-- Name: servicios servicios_nombre_key; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.servicios
    ADD CONSTRAINT servicios_nombre_key UNIQUE (nombre);


--
-- TOC entry 4983 (class 2606 OID 25778)
-- Name: servicios servicios_pkey; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.servicios
    ADD CONSTRAINT servicios_pkey PRIMARY KEY (id_servicio);


--
-- TOC entry 4994 (class 2606 OID 25871)
-- Name: suscripciones suscripciones_pkey; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.suscripciones
    ADD CONSTRAINT suscripciones_pkey PRIMARY KEY (id_suscripcion);


--
-- TOC entry 4926 (class 2606 OID 25350)
-- Name: tipos_documentos tipos_documentos_pkey; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.tipos_documentos
    ADD CONSTRAINT tipos_documentos_pkey PRIMARY KEY (id_tipo_doc);


--
-- TOC entry 4948 (class 2606 OID 25466)
-- Name: usuarios usuarios_correo_key; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.usuarios
    ADD CONSTRAINT usuarios_correo_key UNIQUE (correo);


--
-- TOC entry 4950 (class 2606 OID 25464)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario);


--
-- TOC entry 4961 (class 1259 OID 25894)
-- Name: idx_citas_fecha_hora_estado; Type: INDEX; Schema: petfy_db; Owner: postgres
--

CREATE INDEX idx_citas_fecha_hora_estado ON petfy_db.citas USING btree (fecha, hora, id_estado);


--
-- TOC entry 4973 (class 1259 OID 25849)
-- Name: idx_facturas_num; Type: INDEX; Schema: petfy_db; Owner: postgres
--

CREATE INDEX idx_facturas_num ON petfy_db.facturas USING btree (num_factura);


--
-- TOC entry 4962 (class 1259 OID 25850)
-- Name: idx_pagos_ref_wompi; Type: INDEX; Schema: petfy_db; Owner: postgres
--

CREATE INDEX idx_pagos_ref_wompi ON petfy_db.pagos USING btree (ref_wompi);


--
-- TOC entry 4992 (class 1259 OID 25887)
-- Name: idx_susc_usuario_activa; Type: INDEX; Schema: petfy_db; Owner: postgres
--

CREATE INDEX idx_susc_usuario_activa ON petfy_db.suscripciones USING btree (id_usuario, activa);


--
-- TOC entry 5027 (class 2620 OID 25834)
-- Name: citas trg_validar_duracion_paseo; Type: TRIGGER; Schema: petfy_db; Owner: postgres
--

CREATE TRIGGER trg_validar_duracion_paseo BEFORE UPDATE ON petfy_db.citas FOR EACH ROW WHEN (((new.fecha_fin_real IS NOT NULL) AND (old.fecha_fin_real IS NULL))) EXECUTE FUNCTION petfy_db.validar_duracion_paseo();


--
-- TOC entry 5007 (class 2606 OID 25566)
-- Name: citas citas_id_estado_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.citas
    ADD CONSTRAINT citas_id_estado_fkey FOREIGN KEY (id_estado) REFERENCES petfy_db.estados_citas(id_estado);


--
-- TOC entry 5008 (class 2606 OID 25571)
-- Name: citas citas_id_mascota_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.citas
    ADD CONSTRAINT citas_id_mascota_fkey FOREIGN KEY (id_mascota) REFERENCES petfy_db.mascotas(id_mascota);


--
-- TOC entry 5009 (class 2606 OID 25761)
-- Name: citas citas_id_plan_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.citas
    ADD CONSTRAINT citas_id_plan_fkey FOREIGN KEY (id_plan) REFERENCES petfy_db.planes(id_plan);


--
-- TOC entry 5010 (class 2606 OID 25888)
-- Name: citas citas_id_suscripcion_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.citas
    ADD CONSTRAINT citas_id_suscripcion_fkey FOREIGN KEY (id_suscripcion) REFERENCES petfy_db.suscripciones(id_suscripcion) ON DELETE SET NULL;


--
-- TOC entry 5011 (class 2606 OID 25576)
-- Name: citas citas_id_usuario_cliente_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.citas
    ADD CONSTRAINT citas_id_usuario_cliente_fkey FOREIGN KEY (id_usuario_cliente) REFERENCES petfy_db.usuarios(id_usuario);


--
-- TOC entry 5012 (class 2606 OID 25581)
-- Name: citas citas_id_usuario_paseador_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.citas
    ADD CONSTRAINT citas_id_usuario_paseador_fkey FOREIGN KEY (id_usuario_paseador) REFERENCES petfy_db.usuarios(id_usuario);


--
-- TOC entry 5001 (class 2606 OID 25520)
-- Name: contratos_aceptados contratos_aceptados_id_plan_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.contratos_aceptados
    ADD CONSTRAINT contratos_aceptados_id_plan_fkey FOREIGN KEY (id_plan) REFERENCES petfy_db.planes(id_plan);


--
-- TOC entry 5002 (class 2606 OID 25515)
-- Name: contratos_aceptados contratos_aceptados_id_usuario_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.contratos_aceptados
    ADD CONSTRAINT contratos_aceptados_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES petfy_db.usuarios(id_usuario) ON DELETE CASCADE;


--
-- TOC entry 5016 (class 2606 OID 25623)
-- Name: devoluciones devoluciones_id_est_devo_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.devoluciones
    ADD CONSTRAINT devoluciones_id_est_devo_fkey FOREIGN KEY (id_est_devo) REFERENCES petfy_db.estados_devoluciones(id_est_devo);


--
-- TOC entry 5017 (class 2606 OID 25628)
-- Name: devoluciones devoluciones_id_pago_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.devoluciones
    ADD CONSTRAINT devoluciones_id_pago_fkey FOREIGN KEY (id_pago) REFERENCES petfy_db.pagos(id_pago) ON DELETE CASCADE;


--
-- TOC entry 5022 (class 2606 OID 25807)
-- Name: disponibilidad_servicio disponibilidad_servicio_id_servicio_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.disponibilidad_servicio
    ADD CONSTRAINT disponibilidad_servicio_id_servicio_fkey FOREIGN KEY (id_servicio) REFERENCES petfy_db.servicios(id_servicio);


--
-- TOC entry 4999 (class 2606 OID 25498)
-- Name: documentos_identidad documentos_identidad_id_tipo_doc_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.documentos_identidad
    ADD CONSTRAINT documentos_identidad_id_tipo_doc_fkey FOREIGN KEY (id_tipo_doc) REFERENCES petfy_db.tipos_documentos(id_tipo_doc);


--
-- TOC entry 5000 (class 2606 OID 25493)
-- Name: documentos_identidad documentos_identidad_id_usuario_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.documentos_identidad
    ADD CONSTRAINT documentos_identidad_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES petfy_db.usuarios(id_usuario) ON DELETE CASCADE;


--
-- TOC entry 5023 (class 2606 OID 25827)
-- Name: excepciones_disponibilidad excepciones_disponibilidad_id_servicio_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.excepciones_disponibilidad
    ADD CONSTRAINT excepciones_disponibilidad_id_servicio_fkey FOREIGN KEY (id_servicio) REFERENCES petfy_db.servicios(id_servicio);


--
-- TOC entry 5021 (class 2606 OID 25675)
-- Name: facturas_detalle facturas_detalle_id_factura_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.facturas_detalle
    ADD CONSTRAINT facturas_detalle_id_factura_fkey FOREIGN KEY (id_factura) REFERENCES petfy_db.facturas(id_factura) ON DELETE CASCADE;


--
-- TOC entry 5018 (class 2606 OID 25655)
-- Name: facturas facturas_id_cita_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.facturas
    ADD CONSTRAINT facturas_id_cita_fkey FOREIGN KEY (id_cita) REFERENCES petfy_db.citas(id_cita) ON DELETE CASCADE;


--
-- TOC entry 5019 (class 2606 OID 25650)
-- Name: facturas facturas_id_est_fact_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.facturas
    ADD CONSTRAINT facturas_id_est_fact_fkey FOREIGN KEY (id_est_fact) REFERENCES petfy_db.estados_facturas(id_est_fact);


--
-- TOC entry 5020 (class 2606 OID 25842)
-- Name: facturas facturas_id_pago_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.facturas
    ADD CONSTRAINT facturas_id_pago_fkey FOREIGN KEY (id_pago) REFERENCES petfy_db.pagos(id_pago) ON DELETE SET NULL;


--
-- TOC entry 5003 (class 2606 OID 25536)
-- Name: mascotas mascotas_id_comportamiento_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.mascotas
    ADD CONSTRAINT mascotas_id_comportamiento_fkey FOREIGN KEY (id_comportamiento) REFERENCES petfy_db.comportamientos(id_comport);


--
-- TOC entry 5004 (class 2606 OID 25541)
-- Name: mascotas mascotas_id_condicion_medica_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.mascotas
    ADD CONSTRAINT mascotas_id_condicion_medica_fkey FOREIGN KEY (id_condicion_medica) REFERENCES petfy_db.condiciones_medicas(id_condicion);


--
-- TOC entry 5005 (class 2606 OID 25698)
-- Name: mascotas mascotas_id_raza_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.mascotas
    ADD CONSTRAINT mascotas_id_raza_fkey FOREIGN KEY (id_raza) REFERENCES petfy_db.razas(id_raza);


--
-- TOC entry 5006 (class 2606 OID 25546)
-- Name: mascotas mascotas_id_usuario_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.mascotas
    ADD CONSTRAINT mascotas_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES petfy_db.usuarios(id_usuario) ON DELETE CASCADE;


--
-- TOC entry 5013 (class 2606 OID 25606)
-- Name: pagos pagos_id_cita_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.pagos
    ADD CONSTRAINT pagos_id_cita_fkey FOREIGN KEY (id_cita) REFERENCES petfy_db.citas(id_cita) ON DELETE CASCADE;


--
-- TOC entry 5014 (class 2606 OID 25601)
-- Name: pagos pagos_id_estado_pago_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.pagos
    ADD CONSTRAINT pagos_id_estado_pago_fkey FOREIGN KEY (id_estado_pago) REFERENCES petfy_db.estados_pago(id_estado_pago);


--
-- TOC entry 5015 (class 2606 OID 25596)
-- Name: pagos pagos_id_metodo_pago_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.pagos
    ADD CONSTRAINT pagos_id_metodo_pago_fkey FOREIGN KEY (id_metodo_pago) REFERENCES petfy_db.metodos_pago(id_metodo_pago);


--
-- TOC entry 4995 (class 2606 OID 25781)
-- Name: planes planes_id_servicio_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.planes
    ADD CONSTRAINT planes_id_servicio_fkey FOREIGN KEY (id_servicio) REFERENCES petfy_db.servicios(id_servicio);


--
-- TOC entry 5024 (class 2606 OID 25877)
-- Name: suscripciones suscripciones_id_mascota_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.suscripciones
    ADD CONSTRAINT suscripciones_id_mascota_fkey FOREIGN KEY (id_mascota) REFERENCES petfy_db.mascotas(id_mascota) ON DELETE CASCADE;


--
-- TOC entry 5025 (class 2606 OID 25882)
-- Name: suscripciones suscripciones_id_plan_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.suscripciones
    ADD CONSTRAINT suscripciones_id_plan_fkey FOREIGN KEY (id_plan) REFERENCES petfy_db.planes(id_plan);


--
-- TOC entry 5026 (class 2606 OID 25872)
-- Name: suscripciones suscripciones_id_usuario_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.suscripciones
    ADD CONSTRAINT suscripciones_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES petfy_db.usuarios(id_usuario) ON DELETE CASCADE;


--
-- TOC entry 4996 (class 2606 OID 25477)
-- Name: usuarios usuarios_id_cargo_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.usuarios
    ADD CONSTRAINT usuarios_id_cargo_fkey FOREIGN KEY (id_cargo) REFERENCES petfy_db.cargos(id_cargo);


--
-- TOC entry 4997 (class 2606 OID 25472)
-- Name: usuarios usuarios_id_rol_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.usuarios
    ADD CONSTRAINT usuarios_id_rol_fkey FOREIGN KEY (id_rol) REFERENCES petfy_db.roles(id_rol);


--
-- TOC entry 4998 (class 2606 OID 25467)
-- Name: usuarios usuarios_id_tipo_doc_fkey; Type: FK CONSTRAINT; Schema: petfy_db; Owner: postgres
--

ALTER TABLE ONLY petfy_db.usuarios
    ADD CONSTRAINT usuarios_id_tipo_doc_fkey FOREIGN KEY (id_tipo_doc) REFERENCES petfy_db.tipos_documentos(id_tipo_doc);


-- Completed on 2026-09-28 12:48:04

--
-- PostgreSQL database dump complete
--

\unrestrict VYsjqzjMeVQrMxZAzIZi6dxJnhE2c8ZqnT1PP0sf11SMsk3mpYRzVxB45Jaz3Rd

