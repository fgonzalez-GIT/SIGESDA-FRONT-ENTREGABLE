import axios from 'axios';
import {
  RelacionFamiliar,
  GrupoFamiliar,
  PersonaConFamiliares,
  CrearRelacionRequest,
  CrearGrupoFamiliarRequest,
  FamiliaresFilters
} from '../store/slices/familiaresSlice';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api';

const familiaresAPI = axios.create({
  baseURL: `${API_BASE_URL}/familiares`,
  headers: {
    'Content-Type': 'application/json',
  },
});

familiaresAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const familiaresService = {
  // Obtener todas las relaciones familiares con filtros
  getRelaciones: async (filters: FamiliaresFilters = {}): Promise<RelacionFamiliar[]> => {
    const response = await familiaresAPI.get('/relaciones', { params: filters });
    return response.data;
  },

  // Obtener una relación por ID
  getRelacionById: async (id: number): Promise<RelacionFamiliar> => {
    const response = await familiaresAPI.get(`/relaciones/${id}`);
    return response.data;
  },

  // Crear una nueva relación familiar
  crearRelacion: async (request: CrearRelacionRequest): Promise<RelacionFamiliar> => {
    const response = await familiaresAPI.post('/relaciones', request);
    return response.data;
  },

  // Actualizar una relación familiar
  actualizarRelacion: async (id: number, relacion: Partial<RelacionFamiliar>): Promise<RelacionFamiliar> => {
    const response = await familiaresAPI.put(`/relaciones/${id}`, relacion);
    return response.data;
  },

  // Eliminar una relación familiar
  eliminarRelacion: async (id: number): Promise<void> => {
    await familiaresAPI.delete(`/relaciones/${id}`);
  },

  // Obtener relaciones de una persona específica
  getRelacionesPorPersona: async (personaId: number): Promise<RelacionFamiliar[]> => {
    const response = await familiaresAPI.get(`/personas/${personaId}/relaciones`);
    return response.data;
  },

  // Obtener familiares de una persona con detalles completos
  getFamiliaresPorPersona: async (personaId: number): Promise<PersonaConFamiliares> => {
    const response = await familiaresAPI.get(`/personas/${personaId}/familiares`);
    return response.data;
  },

  // Obtener todas las personas con sus familiares
  getPersonasConFamiliares: async (): Promise<PersonaConFamiliares[]> => {
    const response = await familiaresAPI.get('/personas-con-familiares');
    return response.data;
  },

  // Crear relación bidireccional automática
  crearRelacionBidireccional: async (request: {
    persona1Id: number;
    persona2Id: number;
    tipoRelacion1: RelacionFamiliar['tipoRelacion'];
    tipoRelacion2: RelacionFamiliar['tipoRelacion'];
    configuracion?: Partial<RelacionFamiliar>;
  }): Promise<RelacionFamiliar[]> => {
    const response = await familiaresAPI.post('/relaciones/bidireccional', request);
    return response.data;
  },

  // Obtener árbol genealógico de una persona
  getArbolGenealogico: async (personaId: number, profundidad: number = 3): Promise<{
    persona: PersonaConFamiliares;
    arbol: any; // Estructura del árbol
  }> => {
    const response = await familiaresAPI.get(`/personas/${personaId}/arbol`, {
      params: { profundidad }
    });
    return response.data;
  },

  // GRUPOS FAMILIARES
  // Obtener todos los grupos familiares
  getGrupos: async (): Promise<GrupoFamiliar[]> => {
    const response = await familiaresAPI.get('/grupos');
    return response.data;
  },

  // Obtener un grupo familiar por ID
  getGrupoById: async (id: number): Promise<GrupoFamiliar> => {
    const response = await familiaresAPI.get(`/grupos/${id}`);
    return response.data;
  },

  // Crear un grupo familiar
  crearGrupoFamiliar: async (request: CrearGrupoFamiliarRequest): Promise<GrupoFamiliar> => {
    const response = await familiaresAPI.post('/grupos', request);
    return response.data;
  },

  // Actualizar un grupo familiar
  actualizarGrupo: async (id: number, grupo: Partial<GrupoFamiliar>): Promise<GrupoFamiliar> => {
    const response = await familiaresAPI.put(`/grupos/${id}`, grupo);
    return response.data;
  },

  // Eliminar un grupo familiar
  eliminarGrupo: async (id: number): Promise<void> => {
    await familiaresAPI.delete(`/grupos/${id}`);
  },

  // Agregar miembro a un grupo
  agregarMiembroGrupo: async (grupoId: number, personaId: number): Promise<GrupoFamiliar> => {
    const response = await familiaresAPI.post(`/grupos/${grupoId}/miembros`, { personaId });
    return response.data;
  },

  // Remover miembro de un grupo
  removerMiembroGrupo: async (grupoId: number, personaId: number): Promise<GrupoFamiliar> => {
    const response = await familiaresAPI.delete(`/grupos/${grupoId}/miembros/${personaId}`);
    return response.data;
  },

  // Obtener grupo familiar de una persona
  getGrupoPorPersona: async (personaId: number): Promise<GrupoFamiliar | null> => {
    const response = await familiaresAPI.get(`/personas/${personaId}/grupo`);
    return response.data;
  },

  // DESCUENTOS Y BENEFICIOS
  // Calcular descuentos familiares para una persona
  calcularDescuentosFamiliares: async (personaId: number, montoBase: number): Promise<{
    descuentoIndividual: number;
    descuentoGrupal: number;
    descuentoTotal: number;
    detalles: Array<{
      concepto: string;
      porcentaje: number;
      monto: number;
    }>;
  }> => {
    const response = await familiaresAPI.post('/descuentos/calcular', {
      personaId,
      montoBase
    });
    return response.data;
  },

  // Aplicar descuentos familiares a cuotas
  aplicarDescuentosFamiliares: async (cuotaIds: number[]): Promise<{
    cuotasActualizadas: number;
    montoTotalDescuentos: number;
  }> => {
    const response = await familiaresAPI.post('/descuentos/aplicar', { cuotaIds });
    return response.data;
  },

  // BÚSQUEDA Y SUGERENCIAS
  // Buscar posibles familiares por apellido o datos similares
  buscarPosiblesFamiliares: async (personaId: number): Promise<Array<{
    persona: {
      id: number;
      nombre: string;
      apellido: string;
      tipo: string;
    };
    similitud: number;
    razon: string;
  }>> => {
    const response = await familiaresAPI.get(`/personas/${personaId}/posibles-familiares`);
    return response.data;
  },

  // Sugerir relaciones basadas en datos existentes
  sugerirRelaciones: async (personaId: number): Promise<Array<{
    familiarId: number;
    tipoRelacionSugerida: RelacionFamiliar['tipoRelacion'];
    confianza: number;
    razon: string;
  }>> => {
    const response = await familiaresAPI.get(`/personas/${personaId}/sugerencias-relaciones`);
    return response.data;
  },

  // REPORTES Y ESTADÍSTICAS
  // Obtener estadísticas de relaciones familiares
  getEstadisticas: async (): Promise<{
    totalRelaciones: number;
    totalGrupos: number;
    personasConFamiliares: number;
    relacionesPorTipo: { [key: string]: number };
    gruposPorTamaño: { [key: string]: number };
    descuentoPromedio: number;
    ahorroMensual: number;
  }> => {
    const response = await familiaresAPI.get('/estadisticas');
    return response.data;
  },

  // Generar reporte de familias
  generarReporteFamilias: async (formato: 'pdf' | 'excel'): Promise<Blob> => {
    const response = await familiaresAPI.get('/reportes/familias', {
      params: { formato },
      responseType: 'blob'
    });
    return response.data;
  },

  // VALIDACIONES
  // Validar relación familiar (evitar inconsistencias)
  validarRelacion: async (request: CrearRelacionRequest): Promise<{
    valida: boolean;
    advertencias: string[];
    errores: string[];
  }> => {
    const response = await familiaresAPI.post('/relaciones/validar', request);
    return response.data;
  },

  // Detectar relaciones circulares o conflictivas
  detectarConflictos: async (personaId: number): Promise<Array<{
    tipo: 'circular' | 'inconsistente' | 'duplicada';
    descripcion: string;
    relacionesAfectadas: number[];
    solucion: string;
  }>> => {
    const response = await familiaresAPI.get(`/personas/${personaId}/conflictos`);
    return response.data;
  },

  // IMPORTACIÓN Y EXPORTACIÓN
  // Importar relaciones familiares desde archivo
  importarRelaciones: async (archivo: File): Promise<{
    exitosas: number;
    errores: Array<{ linea: number; error: string }>;
  }> => {
    const formData = new FormData();
    formData.append('archivo', archivo);

    const response = await familiaresAPI.post('/importar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Exportar relaciones familiares
  exportarRelaciones: async (formato: 'csv' | 'excel', filtros?: FamiliaresFilters): Promise<Blob> => {
    const response = await familiaresAPI.get('/exportar', {
      params: { formato, ...filtros },
      responseType: 'blob',
    });
    return response.data;
  },

  // CONTACTOS DE EMERGENCIA
  // Obtener contactos de emergencia de una persona
  getContactosEmergencia: async (personaId: number): Promise<Array<{
    contacto: PersonaConFamiliares;
    relacion: RelacionFamiliar;
    prioridad: number;
  }>> => {
    const response = await familiaresAPI.get(`/personas/${personaId}/contactos-emergencia`);
    return response.data;
  },

  // Configurar contactos de emergencia
  configurarContactosEmergencia: async (personaId: number, contactos: Array<{
    familiarId: number;
    prioridad: number;
  }>): Promise<void> => {
    await familiaresAPI.post(`/personas/${personaId}/contactos-emergencia`, { contactos });
  },

  // AUTORIZACIONES
  // Obtener personas autorizadas para retirar a un menor
  getAutorizadosRetiro: async (personaId: number): Promise<PersonaConFamiliares[]> => {
    const response = await familiaresAPI.get(`/personas/${personaId}/autorizados-retiro`);
    return response.data;
  },

  // Configurar autorizaciones de retiro
  configurarAutorizacionesRetiro: async (personaId: number, autorizados: number[]): Promise<void> => {
    await familiaresAPI.post(`/personas/${personaId}/autorizaciones-retiro`, { autorizados });
  },
};

export default familiaresService;