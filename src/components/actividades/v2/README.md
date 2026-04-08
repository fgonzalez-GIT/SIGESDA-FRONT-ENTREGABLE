# Componentes V2 - ActividadDetallePage

## 📋 Descripción General

Esta carpeta contiene los componentes de la versión 2 (mejorada) de la página de detalle de actividades. La V2 presenta una interfaz completamente rediseñada con mejor UX, validaciones avanzadas, y componentes optimizados.

## 🏗️ Estructura de Componentes

### Componentes Base
- **ActividadHeader**: Header con título, código, estado y botón volver
- **ActividadInfoCards**: 4 cards informativas (Clasificación, Fechas, Cupos, Costo)
- **RolBadge**: Badge reutilizable para mostrar roles/tipos
- **LoadingSkeleton**: Skeleton loaders para mejorar percepción de velocidad

### Pestaña Horarios (`/horarios`)
- **HorariosTab**: Pestaña principal de gestión de horarios
- **HorarioItem**: Item individual optimizado con React.memo
- **AgregarHorarioModal**: Modal para crear/editar horarios con validaciones

### Pestaña Docentes (`/docentes`)
- **DocentesTab**: Pestaña principal de gestión de docentes
- **DocenteItem**: Item individual optimizado con React.memo
- **AsignarDocenteModalV2**: Modal de 3 pasos para asignar docentes

### Pestaña Participantes (`/participantes`)
- **ParticipantesTab**: Pestaña principal de gestión de participantes
- **ParticipanteItem**: Item individual optimizado con React.memo
- **ProyeccionCupo**: Componente de proyección en tiempo real
- **InscripcionUnificadaModal**: Modal único de inscripción con autocompletado (1 o N personas)

## 🎯 Características Principales

### 1. CRUD Completo
- ✅ Horarios: Crear, Leer, Actualizar, Eliminar
- ✅ Docentes: Asignar, Listar, Desasignar
- ✅ Participantes: Inscribir (1 o múltiples con autocompletado), Listar, Eliminar

### 2. UX Mejorada
- Skeleton loaders durante la carga
- Loading states en todos los botones
- Diálogos de confirmación antes de eliminar
- Mensajes de error claros y accionables
- Vista previa antes de guardar cambios
- Validaciones en tiempo real

### 3. Performance Optimizada
- React.memo en componentes de lista
- Renders optimizados
- Estados locales eficientes
- Lazy loading de modales

### 4. Validaciones
- Validación de horarios (hora fin > hora inicio)
- Validación de cupos disponibles
- Validación de datos obligatorios
- Prevención de duplicados

## 📝 Uso de Componentes

### Importar desde index
```typescript
import {
  HorariosTab,
  DocentesTab,
  ParticipantesTab,
  ActividadHeader,
  ActividadInfoCards
} from '@/components/actividades/v2';
```

### Ejemplo de uso
```tsx
<ActividadHeader
  actividadId={1}
  nombre="Yoga Principiantes"
  codigo="ACT-2024-001"
  estado={estadoActividad}
  onVolver={() => navigate('/actividades')}
/>

<HorariosTab
  actividadId={1}
  actividadNombre="Yoga Principiantes"
  horarios={horarios}
  loading={loading}
  onRefresh={handleRefresh}
/>
```

## 🔄 Flujo de Datos

1. **ActividadDetallePageV2** carga los datos usando hooks personalizados
2. Los datos se pasan como props a las pestañas correspondientes
3. Las pestañas manejan su propio estado local (modales, dialogs, etc.)
4. Al guardar/eliminar, se llama a `onRefresh()` para actualizar datos
5. Los skeleton loaders se muestran mientras `loading === true`

## 🎨 Patrones de Diseño

### Modal Pattern
Todos los modales siguen este patrón:
```typescript
interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  // ... props específicos
}
```

### Item Pattern
Todos los items de lista usan React.memo:
```typescript
export const Item = React.memo(({ data, onEdit, onDelete }) => {
  // render
});
Item.displayName = 'Item';
```

### Tab Pattern
Todas las pestañas tienen esta estructura:
```typescript
export const Tab = ({ actividadId, data, loading, onRefresh }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });

  return (
    <Box>
      {/* Header con botones */}
      {/* Loading skeleton o lista */}
      {/* Modales */}
      {/* Dialogs de confirmación */}
    </Box>
  );
};
```

## 🐛 Debugging

### Errores comunes

1. **"Cannot read property of undefined"**
   - Verificar que los datos tengan las relaciones cargadas (`personas`, `dias_semana`, etc.)
   - Usar optional chaining: `persona?.nombre`

2. **"Hook called conditionally"**
   - Los hooks deben estar al inicio del componente
   - No usar hooks dentro de condicionales

3. **"Too many re-renders"**
   - Verificar que los handlers no estén en funciones anónimas
   - Usar useCallback para handlers complejos

## 📊 Métricas

- **Componentes creados**: 20
- **Líneas de código**: ~4,500
- **APIs integradas**: 8 endpoints
- **Errores TypeScript**: 0
- **Performance**: Optimizado con React.memo

## 🔧 Mantenimiento

### Agregar nueva funcionalidad
1. Crear componente en la carpeta correspondiente
2. Exportar desde `index.ts`
3. Importar en la página principal
4. Actualizar esta documentación

### Modificar validaciones
Las validaciones están en los modales:
- Horarios: `AgregarHorarioModal.tsx` línea ~88
- Docentes: `AsignarDocenteModalV2.tsx` paso 3
- Participantes: `InscripcionUnificadaModal.tsx` líneas 195-201

### Modal Unificado de Inscripción
El modal `InscripcionUnificadaModal` consolida la funcionalidad de inscripción masiva e individual en un único componente:

**Características clave:**
- **Autocompletado inteligente**: Búsqueda en tiempo real (mín. 2 caracteres) por nombre, apellido, email o DNI
- **Navegación con teclado**: ArrowUp/ArrowDown para navegar, Enter para seleccionar, Escape para cerrar
- **Selección múltiple**: Agregar 1 o N personas a la vez
- **Tabla de roster**: Visualización clara de personas seleccionadas con roles y opciones para eliminar
- **Proyección de cupo**: Actualización en tiempo real del cupo proyectado según selección
- **Validaciones**: Previene exceder el cupo máximo y asegura al menos 1 persona seleccionada
- **Feedback visual**: Resaltado del primer resultado, estados de carga, mensajes de éxito/error

**Flujo de uso:**
1. Usuario abre modal con botón "Inscribir Participante(s)"
2. Escribe en el campo de búsqueda (ej: "Car")
3. Aparece dropdown con resultados filtrados
4. Click o Enter para agregar persona a la tabla
5. Repetir para agregar más personas (opcional)
6. Revisar tabla de roster y proyección de cupo
7. Click en "Inscribir X Persona(s)"
8. Mensaje de éxito y cierre automático del modal

## 🚀 Mejoras Futuras

- [ ] Agregar filtros en las listas de participantes, docentes y horarios
- [x] ~~Implementar búsqueda en tiempo real~~ (✅ Implementado en InscripcionUnificadaModal)
- [ ] Agregar exportación a PDF/Excel de listas
- [ ] Implementar drag & drop para ordenar horarios
- [ ] Agregar vista de calendario para horarios
- [ ] Agregar campo de precio especial por persona en modal de inscripción
- [ ] Implementar observaciones individuales por participante

## 📚 Referencias

- [Material-UI Components](https://mui.com/material-ui/getting-started/)
- [React.memo Documentation](https://react.dev/reference/react/memo)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
