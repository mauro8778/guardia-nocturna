# 🌙 Guardia Nocturna — Plataforma Fullstack de Clases y Guardias Educativas

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io/)
[![Google Gemini](https://img.shields.io/badge/Gemini_AI-2.0-8E75C4?style=flat-square&logo=google-gemini&logoColor=white)](https://ai.google.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

**Guardia Nocturna** es una solución monorepo fullstack empresarial para la gestión, reserva y ejecución de clases particulares y guardias académicas en tiempo real. Integra un asistente pedagógico con Inteligencia Artificial, calendario interactivo sincronizado por WebSockets, gestión multi-rol con **Modo Fantasma (Ghost Mode)** para auditoría administrativa y exportación directa de planificaciones a formato Word (.docx).

---

## 🏛️ Arquitectura del Sistema

```mermaid
flowchart TD
    subgraph Clients["💻 Capa Cliente (Frontend Vite + React 18)"]
        UI_Student["👨‍🎓 Portal Alumno\n(Reservas, Onboarding, Clases)"]
        UI_Teacher["👩‍🏫 Dashboard Docente\n(Agenda, Tarifas, Asistente IA)"]
        UI_Admin["🛡️ Panel SuperAdmin\n(Auditoría, Ghost Mode)"]
    end

    subgraph Gateway["🔌 Capa de Comunicación en Tiempo Real"]
        WS["⚡ Socket.IO Gateway\n(Alertas, Notificaciones, Estado de Turnos)"]
        HTTP["🌐 REST API (NestJS + Express)\n(Endpoints seguros con JWT Guards)"]
    end

    subgraph CoreBackend["⚙️ Backend Core (NestJS)"]
        AuthMod["Módulo Auth & Roles (RBAC)"]
        AppointMod["Módulo Turnos & Disponibilidad"]
        AIMod["Módulo Asistente IA (Gemini 2.0 / Word Export)"]
        PayMod["Módulo Pagos & Comisiones"]
    end

    subgraph DataStore["💾 Persistencia & Servicios"]
        PrismaORM["Prisma ORM"]
        DB[(PostgreSQL / Supabase)]
        DocxEngine["docx Generator Engine"]
    end

    Clients -->|HTTP REST| HTTP
    Clients <-->|WebSockets Bidireccional| WS
    HTTP --> CoreBackend
    WS --> AppointMod
    CoreBackend --> PrismaORM --> DB
    AIMod --> DocxEngine
```

---

## 🌟 Características Principales

### 1. 🤖 Asistente Docente con Inteligencia Artificial & Exportación DOCX
- Motor de generación de secuencias didácticas y evaluaciones impulsado por Google Gemini.
- Latencia optimizada (~1.3 segundos por generación).
- Exportación automática con formato universitario estructurado a documentos **Microsoft Word (.docx)** listos para imprimir o compartir.

### 2. 👻 SuperAdmin "Ghost Mode" (Modo Fantasma)
- Permite a los administradores impersonar y navegar la plataforma desde la perspectiva exacta de cualquier docente o alumno.
- Auditoría instantánea sin alterar sesiones de producción ni requerir contraseñas de los usuarios.

### 3. ⚡ Reservas & Disponibilidad en Tiempo Real
- Sincronización bidireccional mediante **WebSockets** (Socket.io) para evitar colisiones de turnos.
- Soporte para modalidades presenciales (a domicilio del alumno o en el aula del docente) y virtuales.
- Geocodificación y cálculo de zonas de cobertura para clases a domicilio.
- Configuración flexible de clases individuales o grupales con límites dinámicos de participantes.

### 4. 💬 Integración Directa con WhatsApp & Aula Virtual
- Acceso directo para contacto telefónico/WhatsApp con mensajes precargados para confirmación inmediata de asistencia.
- Lanzador de aulas virtuales embebido para clases online.

---

## 🚀 Estructura del Proyecto

```
guardia-nocturna/
├── backend/                  # API REST & WebSockets (NestJS + TypeScript)
│   ├── src/
│   │   ├── ai/               # Asistente IA & Generador de Documentos DOCX
│   │   ├── appointments/     # Lógica y controlador de reservas
│   │   ├── auth/             # Autenticación JWT y estrategias de seguridad
│   │   ├── availability/     # Horarios, días y tarifas por materia
│   │   ├── events/           # Gateway de WebSockets para tiempo real
│   │   ├── payments/         # Integración de pagos y liquidaciones
│   │   └── users/            # Gestión de usuarios, perfiles y seeds demo
│   ├── prisma/               # Esquema de base de datos relacional
│   └── Dockerfile            # Construcción multi-stage de producción
│
├── frontend/                 # Aplicación Web SPA (React 18 + Vite + Tailwind)
│   ├── src/
│   │   ├── components/       # Dashboards (Docente, Admin, Alumno, Modales)
│   │   ├── context/          # Estados globales (Auth, Ghost Mode)
│   │   └── services/         # Clientes Axios y conexión de sockets
│   └── vite.config.ts
│
└── docker-compose.yml        # Orquestación lista para 1-click run
```

---

## 🛠️ Instalación y Puesta en Marcha

### Opción A: Despliegue con Docker Compose (Recomendado)

```bash
# 1. Clonar el repositorio
git clone https://github.com/mauro8778/guardia-nocturna.git
cd guardia-nocturna

# 2. Levantar base de datos y backend
docker compose up --build -d

# 3. Iniciar el frontend
cd frontend
npm install
npm run dev
```

### Opción B: Ejecución en Desarrollo Local

#### Requisitos
- **Node.js:** >= 20.x
- **PostgreSQL:** >= 15.x

#### 1. Configurar Backend
```bash
cd backend
npm install
cp .env.example .env
# Configura tu DATABASE_URL en .env
npx prisma db push
npm run start:dev
```
El servidor backend iniciará en `http://localhost:3050`.

#### 2. Configurar Frontend
```bash
cd ../frontend
npm install
npm run dev
```
La aplicación web estará disponible en `http://localhost:5173`.

---

## 👤 Cuentas Demo Precargadas

El backend inicializa automáticamente semillas para pruebas inmediatas:

| Rol | Correo Electrónico | Contraseña | Capacidades |
| :--- | :--- | :--- | :--- |
| **Docente Demo** | `docente@guardia.local` | `Docente1234` | Agenda activa (8 a 23 hs), tarifas de Matemática y Física, Asistente IA |
| **Alumno Demo** | `alumno@guardia.local` | `Alumno1234` | Reserva de turnos, visualización de historial y aula virtual |

---

## 🔒 Seguridad y Buenas Prácticas

- **Cero Fuga de Datos:** Manejo global de excepciones HTTP para ocultar stack traces en producción.
- **Validación Estricta:** DTOs tipados con `class-validator` y `class-transformer`.
- **RBAC (Role Based Access Control):** Guards nativos de NestJS para proteger rutas por privilegios de usuario.
- **Tipado Estricto:** Código libre de `any` garantizado mediante reglas de ESLint y TypeScript.

---

## 📄 Licencia

Este proyecto está licenciado bajo los términos de la licencia MIT.
