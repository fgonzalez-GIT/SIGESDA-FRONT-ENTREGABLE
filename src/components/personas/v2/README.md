# Módulo Personas V2

Sistema completo de gestión de personas con tipos dinámicos, contactos y catálogos administrables.

## 📋 Índice

- [Características](#características)
- [Arquitectura](#arquitectura)
- [Estructura de Archivos](#estructura-de-archivos)
- [Uso](#uso)
- [API y Hooks](#api-y-hooks)
- [Componentes](#componentes)
- [Redux Integration](#redux-integration)
- [Validación](#validación)
- [Rutas](#rutas)

## ✨ Características

### Sistema de Tipos Dinámicos
- **Múltiples tipos por persona**: Una persona puede ser SOCIO, DOCENTE, PROVEEDOR simultáneamente
- **Catálogos administrables**: Los tipos se gestionan desde la interfaz de administración
- **Campos específicos por tipo**:
  - **SOCIO**: Requiere categoría (categoriaId, numeroSocio auto-generado)
  - **DOCENTE**: Requiere especialidad (especialidadId, honorariosPorHora)
  - **PROVEEDOR**: Requiere CUIT (cuit, razonSocial)
  - **NO_SOCIO**: Sin campos adicionales

### Gestión de Contactos
- Múltiples contactos por persona
- Tipos de contacto dinámicos (WhatsApp, Email, Instagram, Facebook, etc.)
- Un contacto principal por persona
- URLs inteligentes (auto-detección para WhatsApp, email, redes sociales)
- Iconos personalizables por tipo de contacto

### Panel de Administración
- **Tipos de Persona**: Crear, editar, activar/desactivar tipos
- **Especialidades Docentes**: Gestionar especialidades (Danza, Música, Teatro, etc.)
- **Tipos de Contacto**: Configurar tipos de contacto con iconos MUI

### Validación Robusta
- Esquemas Zod v4 para toda la validación
- Validación en tiempo real con React Hook Form
- Mensajes de error descriptivos
- Validación de campos específicos por tipo

## 🏗️ Arquitectura

### Patrón de Diseño
El módulo sigue una arquitectura modular y escalable:

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │  Components  │  │    Forms     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      State Management                        │
│  ┌──────────────┐           ┌──────────────┐               │
│  │ Redux Slice  │←──────────│  Hooks       │               │
│  └──────────────┘           └──────────────┘               │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      Business Logic                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ API Service  │  │  Validation  │  │    Types     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                       Backend API                            │
└─────────────────────────────────────────────────────────────┘
```

### Capas

1. **UI Layer**: Componentes React reutilizables
2. **State Management**: Redux + Custom Hooks (2 opciones)
3. **Business Logic**: Servicios, validación, tipos TypeScript
4. **Backend API**: REST API con NestJS

## 📁 Estructura de Archivos

```
src/
├── components/personas/v2/
│   ├── README.md                    # Este archivo
│   ├── index.ts                     # Exportaciones principales
│   │
│   ├── admin/                       # Componentes de administración
│   │   ├── CatalogoTable.tsx        # Tabla genérica reutilizable
│   │   ├── CatalogoFormDialog.tsx   # Formulario genérico
│   │   └── index.ts
│   │
│   ├── tipos/                       # Componentes de tipos
│   │   ├── TipoBadge.tsx           # Badge individual de tipo
│   │   ├── TipoItem.tsx            # Item expandible de tipo
│   │   ├── TiposBadges.tsx         # Grupo de badges
│   │   └── index.ts
│   │
│   ├── contactos/                   # Componentes de contactos
│   │   ├── ContactoBadge.tsx       # Badge de contacto
│   │   ├── ContactoItem.tsx        # Item de contacto con URL
│   │   ├── AgregarContactoModal.tsx # Modal para agregar contacto
│   │   ├── ContactosTab.tsx        # Tab de contactos en detalle
│   │   └── index.ts
│   │
│   ├── PersonaHeader.tsx            # Header con info de persona
│   ├── PersonaFormV2.tsx            # Formulario principal
│   ├── PersonasTable.tsx            # Tabla de personas
│   ├── PersonasFilters.tsx          # Filtros de búsqueda
│   └── LoadingSkeleton.tsx          # Skeleton loading
│
├── pages/Personas/
│   ├── PersonasPageV2.tsx           # Página principal (lista)
│   ├── PersonaDetallePageV2.tsx     # Página de detalle
│   │
│   └── Admin/                       # Páginas de administración
│       ├── TiposPersonaAdminPage.tsx
│       ├── EspecialidadesDocenteAdminPage.tsx
│       └── TiposContactoAdminPage.tsx
│
├── hooks/
│   ├── usePersonasV2.ts             # Hooks con estado local
│   └── usePersonasV2Redux.ts        # Hooks con Redux
│
├── services/
│   └── personasV2Api.ts             # Cliente API (22+ métodos)
│
├── store/slices/
│   └── personasV2Slice.ts           # Redux slice
│
├── schemas/
│   └── personaV2.schema.ts          # Esquemas Zod
│
└── types/
    └── personaV2.types.ts           # Tipos TypeScript
```

## 🚀 Uso

### Uso Básico

#### 1. Página de Lista de Personas

```tsx
import { PersonasPageV2 } from './pages/Personas/PersonasPageV2';

// En App.tsx o router
<Route path="/personas-v2" element={<PersonasPageV2 />} />
```

#### 2. Página de Detalle de Persona

```tsx
import { PersonaDetallePageV2 } from './pages/Personas/PersonaDetallePageV2';

// En App.tsx o router
<Route path="/personas-v2/:id" element={<PersonaDetallePageV2 />} />
```

#### 3. Páginas de Administración

```tsx
import { TiposPersonaAdminPage } from './pages/Personas/Admin/TiposPersonaAdminPage';
import { EspecialidadesDocenteAdminPage } from './pages/Personas/Admin/EspecialidadesDocenteAdminPage';
import { TiposContactoAdminPage } from './pages/Personas/Admin/TiposContactoAdminPage';

// En App.tsx
<Route path="/personas-v2/admin/tipos-persona" element={<TiposPersonaAdminPage />} />
<Route path="/personas-v2/admin/especialidades" element={<EspecialidadesDocenteAdminPage />} />
<Route path="/personas-v2/admin/tipos-contacto" element={<TiposContactoAdminPage />} />
```

### Uso de Hooks

#### Opción 1: Hooks con Estado Local (Recomendado para componentes independientes)

```tsx
import { usePersonasV2, useCatalogosPersonas } from '../hooks/usePersonasV2';

function MiComponente() {
  const { personas, loading, pagination, fetchPersonas } = usePersonasV2({
    page: 1,
    limit: 20,
    includeTipos: true,
  });

  const { catalogos } = useCatalogosPersonas();

  return (
    // Tu UI aquí
  );
}
```

#### Opción 2: Hooks con Redux (Recomendado para estado compartido)

```tsx
import { usePersonasV2WithRedux, useCatalogosPersonasV2WithRedux } from '../hooks/usePersonasV2Redux';

function MiComponente() {
  const {
    personas,
    loading,
    pagination,
    filters,
    updateFilters,
    createPersona,
    updatePersona,
    deletePersona,
  } = usePersonasV2WithRedux();

  const { catalogos } = useCatalogosPersonasV2WithRedux();

  return (
    // Tu UI aquí
  );
}
```

### Uso de Componentes

#### Tabla de Personas

```tsx
import { PersonasTable } from '../components/personas/v2';

<PersonasTable
  personas={personas}
  onView={(persona) => navigate(`/personas-v2/${persona.id}`)}
  onEdit={(persona) => handleEdit(persona)}
  onDelete={(persona) => handleDelete(persona)}
  expandable
/>
```

#### Formulario de Persona

```tsx
import { PersonaFormV2 } from '../components/personas/v2';

<PersonaFormV2
  open={formOpen}
  onClose={() => setFormOpen(false)}
  onSubmit={handleSubmit}
  persona={selectedPersona} // Para editar, null para crear
  catalogos={catalogos}
  loading={loading}
/>
```

#### Filtros de Personas

```tsx
import { PersonasFilters } from '../components/personas/v2';

<PersonasFilters
  filters={filters}
  catalogos={catalogos}
  onFilterChange={handleFilterChange}
  onClearFilters={handleClearFilters}
  resultCount={personas.length}
  totalCount={pagination?.total || 0}
/>
```

## 🔌 API y Hooks

### API Service (`personasV2Api.ts`)

El servicio API proporciona 22+ métodos para interactuar con el backend:

```typescript
// Personas
personasV2Api.getAll(params?: PersonasV2QueryParams)
personasV2Api.getById(id: number)
personasV2Api.create(data: CreatePersonaV2DTO)
personasV2Api.update(id: number, data: UpdatePersonaV2DTO)
personasV2Api.delete(id: number)
personasV2Api.validateDni(dni: string)
personasV2Api.validateEmail(email: string)

// Catálogos
personasV2Api.getCatalogos()

// Tipos de Persona
personasV2Api.getTiposPersona()
personasV2Api.getTipoPersonaById(id: number)
personasV2Api.createTipoPersona(data: CreateTipoPersonaDTO)
personasV2Api.updateTipoPersona(id: number, data: UpdateTipoPersonaDTO)
personasV2Api.deleteTipoPersona(id: number)
personasV2Api.reorderTiposPersona(items: ReorderDTO)

// Tipos asignados a personas
personasV2Api.asignarTipo(personaId: number, data: CreatePersonaTipoDTO)
personasV2Api.updateTipoAsignado(personaId: number, tipoId: number, data: UpdatePersonaTipoDTO)
personasV2Api.removeTipo(personaId: number, tipoId: number)

// Contactos
personasV2Api.addContacto(personaId: number, data: CreateContactoDTO)
personasV2Api.updateContacto(personaId: number, contactoId: number, data: UpdateContactoDTO)
personasV2Api.deleteContacto(personaId: number, contactoId: number)
personasV2Api.setContactoPrincipal(personaId: number, contactoId: number)

// Especialidades Docentes
personasV2Api.getEspecialidadesDocentes()
personasV2Api.createEspecialidadDocente(data: CreateEspecialidadDocenteDTO)
personasV2Api.updateEspecialidadDocente(id: number, data: UpdateEspecialidadDocenteDTO)
personasV2Api.deleteEspecialidadDocente(id: number)

// Tipos de Contacto
personasV2Api.getTiposContacto()
personasV2Api.createTipoContacto(data: CreateTipoContactoDTO)
personasV2Api.updateTipoContacto(id: number, data: UpdateTipoContactoDTO)
personasV2Api.deleteTipoContacto(id: number)
```

### Hooks Disponibles

#### Con Estado Local

```typescript
// Hook principal para lista de personas
usePersonasV2(params?: PersonasV2QueryParams): {
  personas: PersonaV2[];
  pagination: PaginationInfo;
  loading: boolean;
  error: string | null;
  fetchPersonas: (params?: PersonasV2QueryParams) => Promise<void>;
  refetch: () => void;
}

// Hook para una persona específica
usePersonaV2(id?: number): {
  persona: PersonaV2 | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Hook para catálogos
useCatalogosPersonas(): {
  catalogos: CatalogosPersonas | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Hook para tipos de una persona
usePersonaTipos(personaId?: number): {
  tipos: PersonaTipo[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Hook para contactos de una persona
usePersonaContactos(personaId?: number): {
  contactos: Contacto[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}
```

#### Con Redux

```typescript
// Hook principal con Redux
usePersonasV2WithRedux(): {
  personas: PersonaV2[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo;
  filters: PersonasV2QueryParams;
  selectedPersona: PersonaV2 | null;
  selectedPersonaLoading: boolean;
  updateFilters: (filters: PersonasV2QueryParams) => void;
  resetFilters: () => void;
  selectPersona: (id: number) => void;
  createPersona: (data: CreatePersonaV2DTO) => Promise<PersonaV2>;
  updatePersona: (id: number, data: UpdatePersonaV2DTO) => Promise<PersonaV2>;
  deletePersona: (id: number) => Promise<void>;
  refetch: () => void;
  clearErrors: () => void;
}

// Hook para catálogos con Redux
useCatalogosPersonasV2WithRedux(): {
  catalogos: CatalogosPersonas | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Hook para persona específica con Redux
usePersonaV2WithRedux(personaId?: number): {
  persona: PersonaV2 | null;
  loading: boolean;
  error: string | null;
  loadPersona: (id: number) => void;
  clearSelection: () => void;
}
```

## 🧩 Componentes

### Componentes de Administración

#### `CatalogoTable<T>`
Tabla genérica y reutilizable para cualquier catálogo.

**Props:**
```typescript
{
  items: T[];
  columns: CatalogoColumn<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onReorder?: (items: T[]) => void;
  loading?: boolean;
  emptyMessage?: string;
  showActions?: boolean;
  showDragHandle?: boolean;
}
```

**Ejemplo:**
```tsx
<CatalogoTable
  items={tiposPersona}
  columns={[
    { id: 'codigo', label: 'Código', width: '150px' },
    { id: 'nombre', label: 'Nombre' },
    { id: 'activo', label: 'Estado', align: 'center' },
  ]}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

#### `CatalogoFormDialog<T>`
Formulario genérico para crear/editar catálogos.

**Props:**
```typescript
{
  open: boolean;
  onClose: () => void;
  onSubmit: (data: T) => Promise<void>;
  title: string;
  fields: CatalogoField[];
  schema: ZodSchema;
  defaultValues?: Partial<T>;
  isEdit?: boolean;
  loading?: boolean;
}
```

**Ejemplo:**
```tsx
<CatalogoFormDialog
  open={formOpen}
  onClose={() => setFormOpen(false)}
  onSubmit={handleSubmit}
  title="Tipo de Persona"
  fields={[
    { name: 'codigo', label: 'Código', type: 'text', required: true },
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'textarea' },
    { name: 'activo', label: 'Activo', type: 'switch' },
  ]}
  schema={createTipoPersonaSchema}
/>
```

### Componentes de Tipos

#### `TipoBadge`
Badge compacto para mostrar un tipo de persona.

```tsx
<TipoBadge tipo={tipo} showIcon size="small" />
```

#### `TipoItem`
Item expandible con detalles completos del tipo.

```tsx
<TipoItem
  tipo={tipo}
  showActions
  onEdit={() => handleEdit(tipo)}
  onDelete={() => handleDelete(tipo)}
/>
```

#### `TiposBadges`
Grupo de badges para mostrar todos los tipos de una persona.

```tsx
<TiposBadges tipos={persona.tipos} max={3} />
```

### Componentes de Contactos

#### `ContactoBadge`
Badge para mostrar un contacto de forma compacta.

```tsx
<ContactoBadge contacto={contacto} showIcon />
```

#### `ContactoItem`
Item de contacto con URL inteligente (clic para abrir).

```tsx
<ContactoItem
  contacto={contacto}
  showActions
  onEdit={() => handleEdit(contacto)}
  onDelete={() => handleDelete(contacto)}
  onSetPrincipal={() => handleSetPrincipal(contacto)}
/>
```

#### `ContactosTab`
Tab completo para gestionar contactos de una persona.

```tsx
<ContactosTab personaId={persona.id} catalogos={catalogos} />
```

## 🔐 Redux Integration

### Redux Slice

El slice de Redux proporciona gestión de estado global para el módulo:

```typescript
// Estado inicial
{
  personas: PersonaV2[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo;
  filters: PersonasV2QueryParams;
  selectedPersona: PersonaV2 | null;
  selectedPersonaLoading: boolean;
  catalogos: CatalogosPersonas | null;
  catalogosLoading: boolean;
  catalogosError: string | null;
}

// Async Thunks
fetchCatalogosPersonasV2();
fetchPersonasV2(params);
fetchPersonaV2ById(id);
createPersonaV2(data);
updatePersonaV2({ id, data });
deletePersonaV2(id);

// Reducers
setFilters(filters);
resetFilters();
setSelectedPersona(persona);
clearError();
clearState();
```

### Integración en el Store

El slice está integrado en el store principal:

```typescript
// src/store/index.ts
export const store = configureStore({
  reducer: {
    personasV2: personasV2Reducer,
    // ... otros reducers
  },
});

// Tipos TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## ✅ Validación

### Esquemas Zod

Todos los formularios usan Zod v4 para validación:

```typescript
// Persona
createPersonaV2Schema
updatePersonaV2Schema

// Tipos de Persona
createTipoPersonaSchema
updateTipoPersonaSchema

// Tipos asignados
createPersonaTipoSchema (discriminated union)
updatePersonaTipoSchema

// Contactos
createContactoSchema
updateContactoSchema

// Especialidades
createEspecialidadDocenteSchema
updateEspecialidadDocenteSchema

// Tipos de Contacto
createTipoContactoSchema
updateTipoContactoSchema
```

### Validaciones Personalizadas

El esquema de persona incluye validaciones complejas:

```typescript
createPersonaV2Schema.refine(
  data => data.tipos && data.tipos.length > 0,
  { message: 'Debe asignar al menos un tipo a la persona', path: ['tipos'] }
).refine(
  data => {
    const contactosPrincipales = data.contactos?.filter(c => c.esPrincipal);
    return contactosPrincipales.length <= 1;
  },
  { message: 'Solo puede haber un contacto principal', path: ['contactos'] }
);
```

## 🛣️ Rutas

```
/personas-v2                                    → Lista de personas
/personas-v2/:id                                → Detalle de persona
/personas-v2/admin/tipos-persona                → Admin Tipos de Persona
/personas-v2/admin/especialidades               → Admin Especialidades
/personas-v2/admin/tipos-contacto               → Admin Tipos de Contacto
```

## 📚 Recursos Adicionales

- **Backend API**: Consultar GUIA_PARA_FRONTEND.md en el backend
- **Tipos TypeScript**: Ver `src/types/personaV2.types.ts`
- **Esquemas Zod**: Ver `src/schemas/personaV2.schema.ts`
- **Ejemplos de Uso**: Ver páginas en `src/pages/Personas/`

## 🚧 Próximas Mejoras

- [ ] Drag & drop para reordenar catálogos
- [ ] Importación masiva de personas desde CSV/Excel
- [ ] Exportación de datos a PDF/Excel
- [ ] Historial de cambios (audit log)
- [ ] Foto de perfil para personas
- [ ] Búsqueda avanzada con múltiples criterios
- [ ] Integración con módulo de Familiares
- [ ] Integración con módulo de Cuotas
- [ ] Reportes y estadísticas avanzadas

---

**Versión**: 2.0.0
**Última actualización**: Octubre 2025
**Autor**: SIGESDA Team
