# SIGESDA - Guía de Setup Completa para Desarrolladores

**Sistema de Gestión Integral de Asociaciones Musicales**

> Una solución completa para gestionar personas, actividades, cuotas, pagos y mucho más en conservatorios y asociaciones musicales.

---

## 📋 Tabla de Contenidos

1. [¿Qué es SIGESDA?](#qué-es-sigesda)
2. [Requisitos Previos](#requisitos-previos)
3. [Paso 1: Clonar y Configurar](#paso-1-clonar-y-configurar)
4. [Paso 2: Configurar Variables de Entorno (.env)](#paso-2-configurar-variables-de-entorno-env)
5. [Paso 3: Base de Datos](#paso-3-base-de-datos)
6. [Paso 4: Levantar Backend y Frontend](#paso-4-levantar-backend-y-frontend)
7. [Validación y Health Check](#validación-y-health-check)
8. [Troubleshooting](#troubleshooting)

---

## ¿Qué es SIGESDA?

SIGESDA es un sistema de gestión integral diseñado para **conservatorios y asociaciones musicales**. Permite:

### Funcionalidades Principales

- **Gestión de Personas**: Registrar socios, no-socios, docentes, proveedores
- **Actividades**: Crear clases, talleres, conciertos con horarios y docentes
- **Sistema de Cuotas**: Generación automática de cuotas mensuales con descuentos y ajustes
- **Pagos**: Recibos, medios de pago, estados de pago (PENDIENTE, PAGADO, VENCIDO, CANCELADO)
- **Relaciones Familiares**: Crear grupos familiares para descuentos conjuntos y facturación agrupada
- **Equipamiento**: Gestionar aulas e instrumentos del conservatorio
- **Reportes**: Exportar datos a Excel/PDF
- **Backup/Restore**: Sistema de backup sin SSH vía REST API

### Stack Tecnológico

```
Backend:    Node.js 20 + Express + TypeScript + Prisma ORM
Base Datos: PostgreSQL 16
Frontend:   React 18 + TypeScript 5 + Vite 5 + Material-UI v7
Validación: Zod schemas
Testing:    Jest
Documentación: OpenAPI 3.0 / Swagger
```

---

## Requisitos Previos

Antes de empezar, verifica tener instalado:

| Herramienta | Versión | Verificar |
|-----------|---------|-----------|
| **Node.js** | 20.0.0+ | `node --version` |
| **npm** | 10.0.0+ | `npm --version` |
| **PostgreSQL** | 16+ | `psql --version` |
| **Git** | Cualquiera | `git --version` |

### Instalación Rápida

#### En Ubuntu/Debian:
```bash
# Node.js (recomendado: usar nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# PostgreSQL
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Iniciar PostgreSQL
sudo systemctl start postgresql
```

#### En macOS:
```bash
# Node.js
brew install nvm
nvm install 20

# PostgreSQL
brew install postgresql@16
brew services start postgresql@16
```

#### En Windows:
- Descargar [Node.js 20](https://nodejs.org/)
- Descargar [PostgreSQL 16](https://www.postgresql.org/download/windows/)
- Ejecutar instaladores

---

## Paso 1: Clonar y Configurar

### 1.1 Clonar Backend

```bash
# Clonar repositorio
git clone <URL_REPOSITORIO_BACKEND>
cd SIGESDA-BACKEND

# Instalar versión de Node
nvm install 20
nvm use 20

# Instalar dependencias
npm install
```

**Resultado esperado:**
```
✅ node_modules/ creado
✅ npm packages instalados (~500 paquetes)
```

### 1.2 Crear archivo .env

```bash
# Copiar archivo base
cp .env.example .env

# Editar con tu editor favorito
nano .env  # (o vi, code, etc.)
```

---

## Paso 2: Configurar Variables de Entorno (.env)

Abre `.env` y configura según tu ambiente:

### 2.1 Variables Esenciales (Requeridas)

```bash
# ============================================================================
# BASE DE DATOS
# ============================================================================
DATABASE_URL="postgresql://sigesda_user:SiGesda2024!@localhost:5432/asociacion_musical?schema=public"
# Formato: postgresql://USUARIO:PASSWORD@HOST:PUERTO/NOMBRE_BD?schema=public
# 
# Desglose:
#   USUARIO = sigesda_user (crear si no existe)
#   PASSWORD = SiGesda2024! (cambiar en PRODUCCIÓN)
#   HOST = localhost (o IP del servidor PostgreSQL)
#   PUERTO = 5432 (puerto por defecto PostgreSQL)
#   NOMBRE_BD = asociacion_musical (crear si no existe)

# ============================================================================
# SERVIDOR
# ============================================================================
PORT=8000
# Puerto en el que escucha el backend (http://localhost:8000)

NODE_ENV=development
# Valores: development, staging, production
# En desarrollo: logs detallados, auto-reload
# En producción: logs minimizados, validaciones estrictas

# ============================================================================
# LOGGING
# ============================================================================
LOG_LEVEL="info"
# Niveles: debug (muy detallado), info (información), warn (advertencias), error

# ============================================================================
# PAGINACIÓN
# ============================================================================
DEFAULT_PAGE_SIZE=20
# Registros por página en listados (si no especifica cliente)

MAX_PAGE_SIZE=100
# Máximo de registros permitido por página

# ============================================================================
# BACKUP
# ============================================================================
BACKUPS_DIR="./backups"
# Directorio donde se guardan backups de BD
# Se crea automáticamente si no existe

BACKUP_TIMEOUT_MS=300000
# Timeout para operaciones de backup (en milisegundos = 5 minutos)

# ============================================================================
# CONFIGURACIÓN DE NEGOCIO
# ============================================================================
CUOTA_VENCIMIENTO_DIAS=10
# Días después del vencimiento para marcar cuota como VENCIDA

RECIBO_NUMERACION_INICIO=1000
# Número inicial para recibos (incrementa en cada nuevo recibo)
```

### 2.2 Variables Opcionales (Futuro/Producción)

```bash
# JWT (para autenticación futura)
JWT_SECRET="your_super_secret_jwt_key_here_change_in_production"
JWT_EXPIRES_IN="7d"

# Email (para notificaciones futuras)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password"

# File Upload
MAX_FILE_SIZE_MB=5
UPLOAD_PATH="uploads/"
```

### 2.3 Verificar .env

```bash
# Ver archivo creado
cat .env

# Resultado esperado:
# DATABASE_URL=postgresql://sigesda_user:...
# PORT=8000
# NODE_ENV=development
# ... etc
```

---

## Paso 3: Base de Datos

### 3.1 Crear Usuario y BD en PostgreSQL

```bash
# Conectar a PostgreSQL como superuser
sudo -u postgres psql

# Dentro de psql, ejecutar:
CREATE USER sigesda_user WITH PASSWORD 'SiGesda2024!';
CREATE DATABASE asociacion_musical OWNER sigesda_user;
GRANT ALL PRIVILEGES ON DATABASE asociacion_musical TO sigesda_user;

# Salir de psql
\q
```

**Verificar conexión:**
```bash
# Desde la terminal del proyecto
psql postgresql://sigesda_user:SiGesda2024!@localhost:5432/asociacion_musical -c "SELECT 1"

# Resultado esperado:
#  ?column?
# ----------
#         1
```

### 3.2 Configurar Prisma y Migraciones

```bash
# Desde el directorio del proyecto

# 1. Generar cliente Prisma
npm run db:generate

# 2. Ejecutar migraciones (crear tablas)
npm run db:migrate
# Selecciona "dev" cuando pregunte por el nombre
```

**Resultado esperado:**
```
✅ Prisma Client generated
✅ Migrations applied successfully
✅ Tablas creadas en asociacion_musical
```

### 3.3 Cargar Datos Iniciales (Seeds)

```bash
# Ejecutar seed principal
npm run db:seed

# Este comando popula:
# ✅ Catálogos: Tipos de persona, estados, categorías, etc.
# ✅ Usuarios de prueba:
#    - SOCIO: Juan Pérez (ID: 1000)
#    - SOCIO: María García (ID: 1001)
#    - DOCENTE: Carlos López (ID: 2000)
#    - NO_SOCIO: Ana Martínez (ID: 3000)
#    - PROVEEDOR: TechSound (ID: 4000)
# ✅ Actividades de ejemplo
# ✅ Aulas y equipamiento
# ✅ Configuración del sistema
```

**Verificar seed:**
```bash
# Conectar a BD y verificar datos
psql postgresql://sigesda_user:SiGesda2024!@localhost:5432/asociacion_musical

# Ver personas creadas:
SELECT id, nombre_completo, tipo_documento, numero_documento FROM personas LIMIT 10;

# Resultado esperado: ~5 personas de prueba

# Salir
\q
```

### 3.4 Datos de Prueba Incluidos

#### Usuarios Creados:

| ID | Nombre | Tipo | Email | Teléfono |
|----|--------|------|-------|----------|
| 1000 | Juan Pérez Gutiérrez | SOCIO | juan.perez@example.com | +34 600 111 000 |
| 1001 | María García López | SOCIO | maria.garcia@example.com | +34 600 222 111 |
| 2000 | Carlos López Martín | DOCENTE | carlos.lopez@example.com | +34 600 333 222 |
| 3000 | Ana Martínez Rodríguez | NO_SOCIO | ana.martinez@example.com | +34 600 444 333 |
| 4000 | TechSound SL | PROVEEDOR | info@techsound.com | +34 600 555 444 |

#### Actividades Creadas:
- Clase de Guitarra (3x/semana)
- Clase de Piano (2x/semana)
- Taller de Composición (1x/semana)
- Concierto Trimestral

#### Aulas:
- Aula 1: Guitarra (10 plazas)
- Aula 2: Piano (8 plazas)
- Aula 3: Composición (12 plazas)

---

## Paso 4: Levantar Backend y Frontend

### 4.1 Iniciar Backend

```bash
# En terminal 1 (desde SIGESDA-BACKEND)
npm run dev

# Resultado esperado:
# 🚀 Server running on http://localhost:8000
# 📝 Log level: info
# ✅ Database connected
```

### 4.2 Clonar y Configurar Frontend

```bash
# En terminal 2 (desde carpeta padre de SIGESDA-BACKEND)
cd ..
git clone <URL_REPOSITORIO_FRONTEND>
cd SIGESDA-FRONTEND

# Instalar dependencias
npm install

# Crear archivo .env
cp .env.example .env
```

### 4.3 Configurar Frontend .env

```bash
# En SIGESDA-FRONTEND/.env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_NODE_ENV=development
```

### 4.4 Iniciar Frontend

```bash
# En terminal 2 (desde SIGESDA-FRONTEND)
npm start

# Resultado esperado:
# ✅ Webpack compiled successfully
# ✅ Application running on http://localhost:3000
```

### Resultado Final

Ambas aplicaciones corriendo:
```
Backend:  http://localhost:8000
Frontend: http://localhost:3000
BD:       postgresql://localhost:5432/asociacion_musical
```

---

## Validación y Health Check

### 5.1 Verificar Backend

```bash
# Test 1: Health Check
curl http://localhost:8000/api/health

# Resultado esperado (si está implementado):
# {"status":"ok","database":"connected","timestamp":"2026-04-08T..."}

# Test 2: Listar personas creadas
curl http://localhost:8000/api/personas?page=1&limit=10

# Resultado esperado:
# {
#   "success": true,
#   "data": [
#     {
#       "id": 1000,
#       "nombre_completo": "Juan Pérez Gutiérrez",
#       "tipo_documento": "DNI",
#       "numero_documento": "12345678A"
#     },
#     ...
#   ],
#   "pagination": {
#     "page": 1,
#     "limit": 10,
#     "total": 5
#   }
# }
```

### 5.2 Verificar Frontend

- Abrir http://localhost:3000 en navegador
- Debería mostrar login o dashboard
- Intentar listar personas, ver que viene del backend

### 5.3 Verificar BD

```bash
# Conectar a PostgreSQL
psql postgresql://sigesda_user:SiGesda2024!@localhost:5432/asociacion_musical

# Ver tablas creadas
\dt

# Ver estadísticas
SELECT tablename FROM pg_tables WHERE schemaname='public' LIMIT 20;

# Salir
\q
```

---

## Comandos Útiles

### Desarrollo

```bash
# Iniciar backend en modo desarrollo (con auto-reload)
npm run dev

# Ejecutar tests
npm run test
npm run test:watch     # Modo watch (rerun en cambios)
npm run test:coverage  # Reporte de cobertura

# Ejecutar tests integración
npm run test:integration
```

### Base de Datos

```bash
# Abrir Prisma Studio (UI visual de BD)
npm run db:studio

# Verificar conexión a BD
npm run db:check

# Reset completo (elimina todo y reseed)
npm run db:reset

# Seed de pruebas adicionales
npm run db:seed:test
```

### Build para Producción

```bash
# Compilar TypeScript
npm run build

# Ejecutar desde compilado
npm start
```

---

## Troubleshooting

### Error: "Cannot connect to database"

**Problema:** PostgreSQL no está corriendo o credenciales incorrectas

**Solución:**
```bash
# 1. Verificar PostgreSQL está corriendo
sudo systemctl status postgresql    # Linux
brew services list                 # macOS

# 2. Verificar credenciales en .env
cat .env | grep DATABASE_URL

# 3. Probar conexión manual
psql postgresql://sigesda_user:SiGesda2024!@localhost:5432/asociacion_musical

# 4. Si falla, recrear BD
sudo -u postgres psql -c "DROP DATABASE IF EXISTS asociacion_musical;"
sudo -u postgres psql -c "DROP USER IF EXISTS sigesda_user;"
# Luego ejecutar Step 3.1 nuevamente
```

### Error: "Port 8000 already in use"

**Problema:** Otro proceso está usando el puerto 8000

**Solución:**
```bash
# Encontrar proceso en puerto 8000
lsof -i :8000           # Linux/macOS
netstat -ano | grep 8000 # Windows

# Matar proceso
kill -9 <PID>           # Linux/macOS
taskkill /PID <PID> /F  # Windows

# O cambiar puerto en .env
echo "PORT=8001" >> .env
```

### Error: "npm ERR! code ERESOLVE"

**Problema:** Conflicto de versiones de dependencias

**Solución:**
```bash
# Limpiar caché npm
npm cache clean --force

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Si persiste, usar legacy resolver
npm install --legacy-peer-deps
```

### Error: "Prisma migration failed"

**Problema:** Migraciones previas inconsistentes

**Solución:**
```bash
# 1. Ver estado de migraciones
npx prisma migrate status

# 2. Reset completo (eliminará datos)
npm run db:reset

# 3. Si aún falla, resetear Prisma
rm -rf prisma/migrations
npx prisma migrate deploy
```
---


**Versión:** 1.0.0  
