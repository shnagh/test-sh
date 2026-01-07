--
-- PostgreSQL database dump
--

\restrict dBEe57BpbOAFXKnKfPDAW3HUTU7MFF039AYflVFzaQYSv5vLrKqLhV5zUqtxfna

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-01-07 10:32:22

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 16466)
-- Name: groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.groups (
    group_id bigint NOT NULL,
    group_name text NOT NULL,
    semester integer NOT NULL,
    number_of_students integer NOT NULL,
    CONSTRAINT groups_number_of_students_check CHECK ((number_of_students >= 0)),
    CONSTRAINT groups_semester_check CHECK ((semester > 0))
);


ALTER TABLE public.groups OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16465)
-- Name: groups_group_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.groups ALTER COLUMN group_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.groups_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 219 (class 1259 OID 16432)
-- Name: lecturers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lecturers (
    lecturer_id integer NOT NULL,
    numberoflecturers integer NOT NULL,
    workingavailablity character(1) NOT NULL,
    workinghours integer NOT NULL,
    campus_mode text NOT NULL,
    modulesharing character(1),
    teachingdays date NOT NULL,
    moduletype character(1),
    classduration integer NOT NULL,
    parttime_fulltime text NOT NULL,
    CONSTRAINT lecturers_campus_mode_check CHECK ((campus_mode = ANY (ARRAY['online'::text, 'offline'::text]))),
    CONSTRAINT lecturers_parttime_fulltime_check CHECK ((parttime_fulltime = ANY (ARRAY['parttime'::text, 'fulltime'::text])))
);


ALTER TABLE public.lecturers OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16449)
-- Name: modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.modules (
    module_id bigint NOT NULL,
    module_code text,
    module_name text NOT NULL,
    credit_score integer NOT NULL,
    lecture_hours integer NOT NULL,
    emodule_type text NOT NULL,
    assessment_type text NOT NULL,
    semester integer NOT NULL
);


ALTER TABLE public.modules OWNER TO postgres;

--
-- TOC entry 5026 (class 0 OID 16466)
-- Dependencies: 222
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.groups (group_id, group_name, semester, number_of_students) FROM stdin;
\.


--
-- TOC entry 5023 (class 0 OID 16432)
-- Dependencies: 219
-- Data for Name: lecturers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lecturers (lecturer_id, numberoflecturers, workingavailablity, workinghours, campus_mode, modulesharing, teachingdays, moduletype, classduration, parttime_fulltime) FROM stdin;
\.


--
-- TOC entry 5024 (class 0 OID 16449)
-- Dependencies: 220
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.modules (module_id, module_code, module_name, credit_score, lecture_hours, emodule_type, assessment_type, semester) FROM stdin;
\.


--
-- TOC entry 5032 (class 0 OID 0)
-- Dependencies: 221
-- Name: groups_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.groups_group_id_seq', 1, false);


--
-- TOC entry 4875 (class 2606 OID 16478)
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (group_id);


--
-- TOC entry 4869 (class 2606 OID 16448)
-- Name: lecturers lecturers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lecturers
    ADD CONSTRAINT lecturers_pkey PRIMARY KEY (lecturer_id);


--
-- TOC entry 4871 (class 2606 OID 16464)
-- Name: modules modules_module_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_module_code_key UNIQUE (module_code);


--
-- TOC entry 4873 (class 2606 OID 16462)
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (module_id);


-- Completed on 2026-01-07 10:32:22

--
-- PostgreSQL database dump complete
--

\unrestrict dBEe57BpbOAFXKnKfPDAW3HUTU7MFF039AYflVFzaQYSv5vLrKqLhV5zUqtxfna

