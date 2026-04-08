import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Card,
  CardContent,
  Alert,
  Autocomplete,
  FormControlLabel,
  Switch,
  Tooltip,
  CircularProgress,
  Paper,
  InputAdornment,
  Tabs,
  Tab,
  Divider,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  MusicNote as ActivityIcon,
  DateRange as DateIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  School as SchoolIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Groups as GroupsIcon,
  TrendingUp,
  Warning as WarningIcon,
  Block as BlockIcon,
  ViewList,
  BarChart,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchPersonas } from '../../store/slices/personasSlice';
import { useActividades } from '../../hooks/useActividades';
import {
  participacionApi,
  type Participacion as ParticipacionAPI,
  type CreateParticipacionDTO
} from '../../services/participacionApi';
import { showNotification } from '../../store/slices/uiSlice';
// import seccionesApi from '../../services/seccionesApi'; // REMOVED: Secciones module deleted
import { SeccionPaginaTitulo } from '@/components/common/SeccionPaginaTitulo';
import { EstadisticasCards, type EstadisticaItem } from '@/components/common/EstadisticasCards';
import { FiltrosAccordion } from '@/components/common/FiltrosAccordion';

interface Participacion {
  id: number;
  personaId: string;
  personaNombre: string;
  actividadId: number;
  actividadNombre: string;
  seccionId?: number;
  seccionNombre?: string;
  fechaInscripcion: Date;
  fechaBaja?: Date;
  estado: 'Activo' | 'Inactivo' | 'Suspendido';
  observaciones?: string;
}

// Usar tipos de Redux para Persona
import type { Persona } from '../../types/persona.types';
import type { Actividad } from '../../types/actividad.types';

const ParticipacionPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const personaIdParam = searchParams.get('personaId');

  // Obtener personas desde Redux
  const { personas: personasRedux, loading: loadingPersonas } = useAppSelector((state) => state.personas);

  // Obtener actividades desde el hook useActividades
  const { actividades: actividades, loading: loadingActividades } = useActividades({
    page: 1,
    limit: 100, // Obtener todas las actividades disponibles
    incluirRelaciones: false
  });

  const [participaciones, setParticipaciones] = useState<Participacion[]>([]);
  const [loadingParticipaciones, setLoadingParticipaciones] = useState(false);
  const [seccionesPorPersona, setSeccionesPorPersona] = useState<{ [key: number]: any[] }>({});
  const [loadingSecciones, setLoadingSecciones] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedParticipacion, setSelectedParticipacion] = useState<Participacion | null>(null);
  const [formData, setFormData] = useState<Partial<Participacion>>({
    personaId: personaIdParam || '',
    actividadId: 0,
    fechaInscripcion: new Date(),
    estado: 'Activo',
    observaciones: ''
  });

  // Estados para Tabs y Accordion
  // Tab principal (Vista General | Estadísticas)
  const [mainTab, setMainTab] = useState(0);

  // Acordeón de filtros (solo en Vista General)
  const [filtrosExpanded, setFiltrosExpanded] = useState(false);

  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('');

  const estadosParticipacion = ['Activo', 'Inactivo', 'Suspendido'] as const;

  // Cargar datos reales desde APIs
  useEffect(() => {
    // Cargar personas desde Redux
    dispatch(fetchPersonas({}));
  }, [dispatch]);

  // Cargar participaciones desde la API
  const cargarParticipaciones = async () => {
    try {
      setLoadingParticipaciones(true);

      // Por ahora, mostrar mensaje que deben seleccionar una actividad
      // TODO: Implementar carga de todas las participaciones cuando esté disponible el endpoint
      setParticipaciones([]);

      if (personaIdParam) {
        dispatch(showNotification({
          message: 'Filtrado por persona no disponible aún. Selecciona una actividad específica.',
          severity: 'info'
        }));
      }
    } catch (error) {
      console.error('Error al cargar participaciones:', error);
      dispatch(showNotification({
        message: 'Error al cargar participaciones',
        severity: 'error'
      }));
    } finally {
      setLoadingParticipaciones(false);
    }
  };

  useEffect(() => {
    cargarParticipaciones();
  }, [personaIdParam]);

  // Cargar secciones para cada persona
  // NOTA: Deshabilitado porque esta página usa datos mock con IDs numéricos
  // que no existen en el backend (que usa IDs tipo string/cuid)
  // La funcionalidad de secciones está disponible en PersonasPageSimple con datos reales
  useEffect(() => {
    // Comentado para evitar errores 400 con datos mock
    // En producción, esta funcionalidad debería integrarse con datos reales de la API
    /*
    const loadSeccionesPorPersona = async () => {
      setLoadingSecciones(true);
      const secciones: { [key: number]: any[] } = {};

      // Obtener IDs únicos de personas
      const personasIds = Array.from(new Set(participaciones.map(p => p.personaId)));

      for (const personaId of personasIds) {
        try {
          const response = await seccionesApi.getSeccionesPorPersona(personaId.toString(), true);
          secciones[personaId] = response.data;
        } catch (error) {
          console.error(`Error al cargar secciones para persona ${personaId}:`, error);
          secciones[personaId] = [];
        }
      }

      setSeccionesPorPersona(secciones);
      setLoadingSecciones(false);
    };

    if (participaciones.length > 0) {
      loadSeccionesPorPersona();
    }
    */
    setLoadingSecciones(false);
  }, [participaciones]);

  const handleOpenDialog = (participacion?: Participacion) => {
    if (participacion) {
      setSelectedParticipacion(participacion);
      setFormData(participacion);
    } else {
      setSelectedParticipacion(null);
      setFormData({
        personaId: '',
        actividadId: 0,
        fechaInscripcion: new Date(),
        estado: 'Activo',
        observaciones: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedParticipacion(null);
    setFormData({});
  };

  const handleSave = async () => {
    const persona = personasRedux.find(p => String(p.id) === String(formData.personaId));
    const actividad = actividades.find(a => a.id === formData.actividadId);

    if (!persona || !actividad) {
      dispatch(showNotification({
        message: 'Debe seleccionar una persona y una actividad',
        severity: 'warning'
      }));
      return;
    }

    try {
      if (selectedParticipacion) {
        // Actualizar participación existente - NO DISPONIBLE en Actividades
        dispatch(showNotification({
          message: 'La edición de participaciones no está disponible aún. Por favor, elimine y cree una nueva.',
          severity: 'warning'
        }));
        return;
      } else {
        // Crear nueva participación usando endpoint de Actividades
        const createData: CreateParticipacionDTO = {
          persona_id: String(persona.id),
          actividad_id: actividad.id,
          fecha_inicio: formData.fechaInscripcion?.toISOString() || new Date().toISOString(),
          observaciones: formData.observaciones
        };

        await participacionApi.crear(createData);

        dispatch(showNotification({
          message: `Participación creada: ${persona.nombre} ${persona.apellido} inscrito en ${actividad.nombre}`,
          severity: 'success'
        }));
      }

      // Recargar participaciones
      await cargarParticipaciones();
      handleCloseDialog();
    } catch (error) {
      console.error('Error al guardar participación:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar participación';
      dispatch(showNotification({
        message: errorMessage,
        severity: 'error'
      }));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta participación?')) {
      return;
    }

    try {
      // Eliminar participación - NO DISPONIBLE en Actividades
      dispatch(showNotification({
        message: 'La eliminación de participaciones no está disponible aún.',
        severity: 'warning'
      }));
    } catch (error) {
      console.error('Error al eliminar participación:', error);
      dispatch(showNotification({
        message: error instanceof Error ? error.message : 'Error al eliminar participación',
        severity: 'error'
      }));
    }
  };

  const handleCambiarEstado = async (id: number, nuevoEstado: Participacion['estado']) => {
    try {
      // Cambiar estado - NO DISPONIBLE en Actividades
      dispatch(showNotification({
        message: 'El cambio de estado no está disponible aún.',
        severity: 'warning'
      }));
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      dispatch(showNotification({
        message: error instanceof Error ? error.message : 'Error al cambiar estado',
        severity: 'error'
      }));
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Activo':
        return 'success';
      case 'Inactivo':
        return 'error';
      case 'Suspendido':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Filtrar participaciones (MOVED BEFORE estadísticas to fix dependency)
  const filteredParticipaciones = participaciones.filter((participacion) => {
    // Filtro por personaId de URL
    const matchesPersonaParam = !personaIdParam || participacion.personaId === parseInt(personaIdParam);

    // Filtro de búsqueda (nombre persona, nombre actividad)
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' ||
      participacion.personaNombre.toLowerCase().includes(searchLower) ||
      participacion.actividadNombre.toLowerCase().includes(searchLower);

    // Filtro por estado
    const matchesEstado = filterEstado === '' || participacion.estado === filterEstado;

    return matchesPersonaParam && matchesSearch && matchesEstado;
  });

  // TAB 1 - Estadísticas Generales
  const estadisticasGenerales = useMemo<EstadisticaItem[]>(() => {
    const totalParticipaciones = filteredParticipaciones.length;
    const activas = filteredParticipaciones.filter((p) => p.estado === 'Activo').length;
    const suspendidas = filteredParticipaciones.filter((p) => p.estado === 'Suspendido').length;
    const inactivas = filteredParticipaciones.filter((p) => p.estado === 'Inactivo').length;

    return [
      {
        label: 'Total Participaciones',
        value: totalParticipaciones,
        icon: GroupsIcon,
        color: 'primary',
        formato: 'numero',
        subtitle: 'En total',
      },
      {
        label: 'Activas',
        value: activas,
        icon: ActiveIcon,
        color: 'success',
        formato: 'numero',
        subtitle: 'En curso',
      },
      {
        label: 'Suspendidas',
        value: suspendidas,
        icon: WarningIcon,
        color: 'warning',
        formato: 'numero',
        subtitle: 'Temporalmente',
      },
      {
        label: 'Inactivas',
        value: inactivas,
        icon: BlockIcon,
        color: 'error',
        formato: 'numero',
        subtitle: 'Finalizadas',
      },
    ];
  }, [filteredParticipaciones]);

  // TAB 2 - Por Estado
  const estadisticasPorEstado = useMemo<EstadisticaItem[]>(() => {
    const activas = filteredParticipaciones.filter((p) => p.estado === 'Activo');
    const suspendidas = filteredParticipaciones.filter((p) => p.estado === 'Suspendido');
    const inactivas = filteredParticipaciones.filter((p) => p.estado === 'Inactivo');

    return [
      {
        label: 'Activas',
        value: activas.length,
        icon: ActiveIcon,
        color: 'success',
        formato: 'numero',
        subtitle: `${activas.length > 0 ? ((activas.length / filteredParticipaciones.length) * 100).toFixed(1) : 0}%`,
      },
      {
        label: 'Suspendidas',
        value: suspendidas.length,
        icon: WarningIcon,
        color: 'warning',
        formato: 'numero',
        subtitle: `${suspendidas.length > 0 ? ((suspendidas.length / filteredParticipaciones.length) * 100).toFixed(1) : 0}%`,
      },
      {
        label: 'Inactivas',
        value: inactivas.length,
        icon: BlockIcon,
        color: 'error',
        formato: 'numero',
        subtitle: `${inactivas.length > 0 ? ((inactivas.length / filteredParticipaciones.length) * 100).toFixed(1) : 0}%`,
      },
    ];
  }, [filteredParticipaciones]);

  // TAB 3 - Por Actividad (Top 4)
  const estadisticasPorActividad = useMemo<EstadisticaItem[]>(() => {
    const actividadesCount: Record<string, { nombre: string; count: number }> = {};
    filteredParticipaciones.forEach((p) => {
      const actNombre = p.actividadNombre || 'Sin actividad';
      if (!actividadesCount[actNombre]) {
        actividadesCount[actNombre] = { nombre: actNombre, count: 0 };
      }
      actividadesCount[actNombre].count++;
    });

    return Object.values(actividadesCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
      .map((act) => ({
        label: act.nombre,
        value: act.count,
        icon: ActivityIcon,
        color: 'secondary',
        formato: 'numero',
        subtitle: 'Participantes',
      }));
  }, [filteredParticipaciones]);

  // Contador de filtros activos
  const filtrosActivos = (searchTerm ? 1 : 0) + (filterEstado !== '' ? 1 : 0);

  const columns: GridColDef[] = [
    {
      field: 'personaNombre',
      headerName: 'Persona',
      width: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" />
          {params.value}
        </Box>
      )
    },
    {
      field: 'actividadNombre',
      headerName: 'Actividad',
      width: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ActivityIcon color="secondary" />
          {params.value}
        </Box>
      )
    },
    {
      field: 'secciones',
      headerName: 'Secciones',
      width: 150,
      renderCell: (params) => {
        const personaId = params.row.personaId;
        const secciones = seccionesPorPersona[personaId] || [];

        if (loadingSecciones && !seccionesPorPersona[personaId]) {
          return <CircularProgress size={20} />;
        }

        if (secciones.length === 0) {
          return (
            <Chip
              label="Sin secciones"
              size="small"
              color="default"
              variant="outlined"
            />
          );
        }

        return (
          <Tooltip title={secciones.map(s => s.nombre).join(', ')}>
            <Chip
              label={`${secciones.length} ${secciones.length === 1 ? 'sección' : 'secciones'}`}
              size="small"
              color="success"
              variant="outlined"
              icon={<SchoolIcon />}
              onClick={() => {
                // Si hay solo una sección, navegar directamente
                if (secciones.length === 1) {
                  navigate(`/secciones/${secciones[0].id}`);
                } else {
                  // Si hay múltiples, ir a la lista filtrada
                  navigate(`/secciones?personaId=${personaId}`);
                }
              }}
              sx={{ cursor: 'pointer' }}
            />
          </Tooltip>
        );
      }
    },
    {
      field: 'fechaInscripcion',
      headerName: 'Fecha Inscripción',
      width: 130,
      renderCell: (params) => new Date(params.value).toLocaleDateString()
    },
    {
      field: 'fechaBaja',
      headerName: 'Fecha Baja',
      width: 110,
      renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString() : '-'
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 120,
      renderCell: (params) => (
        <Chip
          icon={params.value === 'Activo' ? <ActiveIcon /> : <InactiveIcon />}
          label={params.value}
          color={getEstadoColor(params.value) as any}
          variant="outlined"
          size="small"
        />
      )
    },
    {
      field: 'observaciones',
      headerName: 'Observaciones',
      width: 150,
      renderCell: (params) => params.value || '-'
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Acciones',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Editar"
          onClick={() => handleOpenDialog(params.row)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Eliminar"
          onClick={() => handleDelete(params.row.id)}
        />
      ]
    }
  ];

  // Función para limpiar filtros
  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterEstado('');
  };

  // Obtener nombre de la persona si hay filtro
  const personaFiltrada = personaIdParam
    ? personasRedux.find(p => String(p.id) === personaIdParam)
    : null;

  return (
    <Box>
      {/* Header */}
      <SeccionPaginaTitulo
        titulo="Participación en Actividades"
        subtitulo="Gestiona las inscripciones de personas en las diferentes actividades del conservatorio"
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Participación' },
        ]}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Nueva Participación
          </Button>
        }
      />

      {personaFiltrada && (
        <Box sx={{ mb: 2 }}>
          <Chip
            label={`Filtrando por: ${personaFiltrada.nombre} ${personaFiltrada.apellido}`}
            onDelete={() => navigate('/participacion')}
            color="primary"
          />
        </Box>
      )}

      {/* Tabs Principal: Vista General | Estadísticas */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={mainTab} onChange={(_, newValue) => setMainTab(newValue)}>
          <Tab icon={<ViewList />} label="Vista General" iconPosition="start" />
          <Tab icon={<BarChart />} label="Estadísticas" iconPosition="start" />
        </Tabs>
      </Box>

      {/* TAB 0: Vista General - Filtros + Tabla */}
      {mainTab === 0 && (
        <>
          <Alert severity="info" sx={{ mb: 3 }}>
            Gestiona las inscripciones de personas en las diferentes actividades del conservatorio.
          </Alert>

          {/* Sección de Búsqueda y Filtros */}
      <FiltrosAccordion
        expanded={filtrosExpanded}
        onToggle={() => setFiltrosExpanded(!filtrosExpanded)}
        activeCount={filtrosActivos}
        onClearFilters={handleClearFilters}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por persona o actividad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} label="Estado">
                <MenuItem value="">Todos</MenuItem>
                {estadosParticipacion.map((estado) => (
                  <MenuItem key={estado} value={estado}>
                    {estado}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ pt: 1 }}>
              {filteredParticipaciones.length} de {participaciones.length} participaciones
            </Typography>
          </Grid>
        </Grid>
      </FiltrosAccordion>

      {/* Tabla de participaciones */}
      <Box sx={{ height: 600, width: '100%' }}>
        {loadingParticipaciones ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={filteredParticipaciones}
            columns={columns}
            paginationModel={{ pageSize: 10, page: 0 }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-cell': {
                padding: '8px',
              },
            }}
          />
        )}
      </Box>
        </>
      )}

      {/* TAB 1: Panel de Estadísticas (Pantalla Completa) */}
      {mainTab === 1 && (
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
          <Stack spacing={4}>
            {/* BLOQUE 1: Estadísticas Generales */}
            <Box>
              <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupsIcon /> Estadísticas Generales
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <GroupsIcon color="primary" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      {filteredParticipaciones.length}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Total Participaciones
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      En total
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <ActiveIcon color="success" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {filteredParticipaciones.filter((p) => p.estado === 'Activo').length}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Activas
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      En curso
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <WarningIcon color="warning" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="warning.main">
                      {filteredParticipaciones.filter((p) => p.estado === 'Suspendido').length}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Suspendidas
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      Temporalmente
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <BlockIcon color="error" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="error.main">
                      {filteredParticipaciones.filter((p) => p.estado === 'Inactivo').length}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Inactivas
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      Finalizadas
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* BLOQUE 2: Distribución por Estado */}
            <Box>
              <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BarChart /> Distribución por Estado
              </Typography>
              <Grid container spacing={2}>
                {estadisticasPorEstado.map((stat, index) => (
                  <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                      <Box display="flex" justifyContent="center" mb={1}>
                        {React.createElement(stat.icon, {
                          color: stat.color,
                          sx: { fontSize: 36 }
                        })}
                      </Box>
                      <Typography variant="h3" fontWeight="bold" color={`${stat.color}.main`}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {stat.label}
                      </Typography>
                      {stat.subtitle && (
                        <Typography variant="caption" color="text.disabled">
                          {stat.subtitle}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Divider />

            {/* BLOQUE 3: Top 4 Actividades */}
            <Box>
              <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp /> Top Actividades
              </Typography>
              <Grid container spacing={2}>
                {estadisticasPorActividad.map((stat, index) => (
                  <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                      <Box display="flex" justifyContent="center" mb={1}>
                        {React.createElement(stat.icon, {
                          color: stat.color,
                          sx: { fontSize: 36 }
                        })}
                      </Box>
                      <Typography variant="h3" fontWeight="bold" color={`${stat.color}.main`}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {stat.label}
                      </Typography>
                      {stat.subtitle && (
                        <Typography variant="caption" color="text.disabled">
                          {stat.subtitle}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* Dialog para crear/editar participación */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedParticipacion ? 'Editar Participación' : 'Nueva Participación'}
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={personasRedux}
                loading={loadingPersonas}
                getOptionLabel={(option) => `${option.nombre} ${option.apellido} (${option.tipo.toUpperCase()})`}
                value={personasRedux.find(p => String(p.id) === String(formData.personaId)) || null}
                onChange={(_, newValue) => {
                  setFormData({ ...formData, personaId: newValue?.id ? String(newValue.id) : '' });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Persona"
                    required
                    helperText={`${personasRedux.length} personas disponibles`}
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <Box component="li" key={key} {...otherProps}>
                      <PersonIcon sx={{ mr: 1 }} />
                      {option.nombre} {option.apellido} ({option.tipo.toUpperCase()})
                    </Box>
                  );
                }}
                noOptionsText={loadingPersonas ? "Cargando personas..." : "No hay personas disponibles"}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={actividades}
                loading={loadingActividades}
                getOptionLabel={(option) => `${option.nombre} - ${option.codigo_actividad}`}
                value={actividades.find(a => a.id === formData.actividadId) || null}
                onChange={(_, newValue) => {
                  setFormData({ ...formData, actividadId: newValue?.id || 0 });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Actividad"
                    required
                    helperText={`${actividades.length} actividades disponibles`}
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <Box component="li" key={key} {...otherProps}>
                      <ActivityIcon sx={{ mr: 1 }} />
                      {option.nombre} - {option.codigo_actividad}
                    </Box>
                  );
                }}
                noOptionsText={loadingActividades ? "Cargando actividades..." : "No hay actividades disponibles"}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label="Fecha de Inscripción"
                value={formData.fechaInscripcion || new Date()}
                onChange={(newValue) => {
                  setFormData({ ...formData, fechaInscripcion: newValue || new Date() });
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.estado || 'Activo'}
                  label="Estado"
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value as Participacion['estado'] })}
                >
                  {estadosParticipacion.map((estado) => (
                    <MenuItem key={estado} value={estado}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {estado === 'Activo' ? <ActiveIcon color="success" /> : <InactiveIcon color="error" />}
                        {estado}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {formData.estado === 'Inactivo' && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="Fecha de Baja"
                  value={formData.fechaBaja || null}
                  onChange={(newValue) => {
                    setFormData({ ...formData, fechaBaja: newValue || undefined });
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true
                    }
                  }}
                />
              </Grid>
            )}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Observaciones"
                value={formData.observaciones || ''}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                multiline
                rows={3}
                placeholder="Motivo de baja, suspensión, o cualquier observación relevante"
              />
            </Grid>
          </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            {selectedParticipacion ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ParticipacionPage;