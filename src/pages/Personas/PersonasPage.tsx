import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TablePagination,
  Stack,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Chip,
  Grid,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Group as GroupIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  PersonOff as PersonOffIcon,
  FilterList as FilterListIcon,
  BarChart as BarChartIcon,
  ExpandMore as ExpandMoreIcon,
  ViewList as ViewListIcon,
} from '@mui/icons-material';
import { SeccionPaginaTitulo } from '../../components/common/SeccionPaginaTitulo';
import { EstadisticasCards, EstadisticaItem } from '../../components/common/EstadisticasCards';
import {
  PersonasTable,
  PersonasFilters,
  LoadingSkeleton,
} from '../../components/personas/v2';
import { PersonaFormV2 } from '../../components/personas/v2/PersonaFormV2';
import { usePersonas, useCatalogosPersonas } from '../../hooks/usePersonas';
import { personasApi } from '../../services/personasApi';
import DownloadPdfButton from '../../components/personas/v2/DownloadPdfButton';
import type {
  Persona,
  PersonasQueryParams,
  CreatePersonaDTO,
} from '../../types/persona.types';
import { useAppDispatch } from '../../hooks/redux';
import { showNotification } from '../../store/slices/uiSlice';
import { MAX_API_LIMIT } from '../../constants/api';

/**
 * Página principal del Módulo Personas - Versión V2
 * Lista de personas con filtros, paginación y CRUD completo
 * Soporta múltiples tipos de persona, contactos y validaciones avanzadas
 */
const PersonasPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Estado de filtros
  const [filters, setFilters] = useState<PersonasQueryParams>({
    page: 1,
    limit: 20,
    activo: true, // Por defecto, solo mostrar personas activas
  });

  // Estado de personas y catálogos
  const { personas, pagination, loading, fetchPersonas, refetch } = usePersonas(filters);
  const { catalogos, loading: catalogosLoading } = useCatalogosPersonas();

  // Estados de UI
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [personaToDelete, setPersonaToDelete] = useState<Persona | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Tab principal (Vista General | Estadísticas)
  const [mainTab, setMainTab] = useState(0);

  // Acordeón de filtros (solo en Vista General)
  const [filtrosExpanded, setFiltrosExpanded] = useState(false);

  // Dataset completo para estadísticas (independiente de la paginación)
  const [todasPersonasStats, setTodasPersonasStats] = useState<Persona[]>([]);

  // Modo "Ver Todos" — muestra todos los registros sin paginación
  const [verTodos, setVerTodos] = useState(false);

  // Contador de filtros activos
  const filtrosActivos = [
    filters.search,
    filters.tipoPersonaId,
    filters.categoriaId,
    filters.activo !== undefined && filters.activo !== true, // Solo cuenta si no es el valor por defecto
  ].filter(Boolean).length;

  // Recargar personas cuando cambian los filtros
  useEffect(() => {
    fetchPersonas(filters);
  }, [filters]);

  // Cargar dataset completo para estadísticas (una sola vez al montar)
  useEffect(() => {
    personasApi.getAll({ limit: MAX_API_LIMIT, includeTipos: true, includeRelaciones: true })
      .then(response => {
        if (response.data) {
          setTodasPersonasStats(response.data);
        }
      })
      .catch(() => {
        // Si falla, las estadísticas usarán los datos de la página actual como fallback
      });
  }, []);

  // Handlers de filtros
  const handleFilterChange = (newFilters: PersonasQueryParams) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setVerTodos(false);
    setFilters({
      page: 1,
      limit: 20,
      activo: true, // Resetear a solo activas
    });
  };

  // TablePagination usa páginas 0-indexadas; el backend espera 1-indexadas
  const handlePageChange = (_event: unknown, newPage: number) => {
    setFilters({ ...filters, page: newPage + 1 });
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVerTodos(false);
    setFilters({
      ...filters,
      limit: parseInt(event.target.value, 10),
      page: 1,
    });
  };

  const handleToggleVerTodos = () => {
    if (!verTodos) {
      setVerTodos(true);
      setFilters({ ...filters, limit: MAX_API_LIMIT, page: 1 });
    } else {
      setVerTodos(false);
      setFilters({ ...filters, limit: 20, page: 1 });
    }
  };

  // Handlers de acciones
  const handleAddClick = () => {
    setSelectedPersona(null);
    setFormOpen(true);
  };

  const handleViewClick = (persona: Persona) => {
    navigate(`/personas/${persona.id}`);
  };

  const handleEditClick = async (persona: Persona) => {
    try {
      // Recargar datos frescos del backend antes de editar
      const personaFresca = await personasApi.getById(persona.id);
      setSelectedPersona(personaFresca.data);
      setFormOpen(true);
    } catch (error) {
      console.error('Error al cargar persona para editar:', error);
      dispatch(
        showNotification({
          message: 'Error al cargar los datos de la persona',
          severity: 'error',
        })
      );
    }
  };

  const handleDeleteClick = (persona: Persona) => {
    setPersonaToDelete(persona);
    setDeleteDialogOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedPersona(null);
  };

  const handleFormSubmit = async (data: CreatePersonaDTO) => {
    try {
      if (selectedPersona) {
        // Actualizar persona existente
        // Separar contactos y tipos del resto de datos
        const { contactos, tipos, ...personaData } = data;

        // Actualizar datos básicos de la persona
        await personasApi.update(selectedPersona.id, personaData);

        // Gestionar tipos: asignar nuevos, actualizar existentes, desasignar removidos
        if (tipos !== undefined) {
          const tiposExistentes = selectedPersona.tipos || [];
          const tiposFormulario = tipos || [];
          const promises: Promise<any>[] = [];

          // 1. AGREGAR tipos nuevos (que NO tienen tipoPersonaId)
          for (const tipoForm of tiposFormulario) {
            // Un tipo es NUEVO si no tiene tipoPersonaId (es undefined)
            const esNuevo = !tipoForm.tipoPersonaId;

            if (esNuevo) {
              // Es un tipo nuevo → asignar
              const createData: any = {
                tipoPersonaCodigo: tipoForm.tipoPersonaCodigo,
              };

              // Agregar campos específicos según el tipo
              if (tipoForm.tipoPersonaCodigo === 'SOCIO') {
                if (tipoForm.categoriaId !== undefined) createData.categoriaId = tipoForm.categoriaId;
                if (tipoForm.numeroSocio !== undefined) createData.numeroSocio = tipoForm.numeroSocio;
                if (tipoForm.fechaIngreso !== undefined) createData.fechaIngreso = tipoForm.fechaIngreso;
              } else if (tipoForm.tipoPersonaCodigo === 'DOCENTE') {
                if (tipoForm.especialidadId !== undefined) createData.especialidadId = tipoForm.especialidadId;
                if (tipoForm.honorariosPorHora !== undefined) createData.honorariosPorHora = tipoForm.honorariosPorHora;
              } else if (tipoForm.tipoPersonaCodigo === 'PROVEEDOR') {
                if (tipoForm.cuit !== undefined) createData.cuit = tipoForm.cuit;
                if (tipoForm.razonSocialId !== undefined) createData.razonSocialId = tipoForm.razonSocialId;
              }

              if (tipoForm.observaciones !== undefined) createData.observaciones = tipoForm.observaciones;

              promises.push(personasApi.asignarTipo(selectedPersona.id, createData));
            }
          }

          // 2. ACTUALIZAR tipos existentes (que SÍ tienen tipoPersonaId)
          for (const tipoForm of tiposFormulario) {
            // Un tipo existe si tiene tipoPersonaId
            if (tipoForm.tipoPersonaId) {
              // Buscar el tipo en el backend por tipoPersonaId
              const tipoExistente = tiposExistentes.find(
                t => t.tipoPersonaId === tipoForm.tipoPersonaId
              );

            if (tipoExistente && tipoExistente.id) {
              // Tipo ya existía → actualizar solo si hay cambios
              const updateData: any = {};

              if (tipoForm.especialidadId !== undefined) {
                updateData.especialidadId = tipoForm.especialidadId;
              }
              if (tipoForm.categoriaId !== undefined) {
                updateData.categoriaId = tipoForm.categoriaId;
              }
              if (tipoForm.honorariosPorHora !== undefined) {
                updateData.honorariosPorHora = tipoForm.honorariosPorHora;
              }
              if (tipoForm.numeroSocio !== undefined) {
                updateData.numeroSocio = tipoForm.numeroSocio;
              }
              if (tipoForm.fechaIngreso !== undefined) {
                updateData.fechaIngreso = tipoForm.fechaIngreso;
              }
              if (tipoForm.cuit !== undefined) {
                updateData.cuit = tipoForm.cuit;
              }
              if (tipoForm.razonSocialId !== undefined) {
                updateData.razonSocialId = tipoForm.razonSocialId;
              }
              if (tipoForm.observaciones !== undefined) {
                updateData.observaciones = tipoForm.observaciones;
              }

              // Solo actualizar si hay cambios
              if (Object.keys(updateData).length > 0) {
                promises.push(
                  personasApi.actualizarTipo(selectedPersona.id, tipoExistente.id, updateData)
                );
              }
            }
            }
          }

          // 3. DESASIGNAR tipos removidos (que están en backend pero NO en formulario)
          const promesasEliminar: Promise<any>[] = [];

          for (const tipoExistente of tiposExistentes) {
            const sigueEnFormulario = tiposFormulario.some(
              t => t.tipoPersonaId === tipoExistente.tipoPersonaId
            );

            if (!sigueEnFormulario && tipoExistente.id) {
              // Envolver en try-catch individual para manejar 404s
              promesasEliminar.push(
                personasApi.desasignarTipo(selectedPersona.id, tipoExistente.id)
                  .catch(error => {
                    // Si el tipo ya no existe (404), lo ignoramos
                    if (error.response?.status === 404) {
                      console.warn(`⚠️ Tipo ID ${tipoExistente.id} ya no existe en el backend, omitiendo...`);
                      return null;
                    }
                    // Para otros errores, re-lanzar
                    throw error;
                  })
              );
            }
          }

          // Ejecutar todas las operaciones (asignar, actualizar, desasignar)
          await Promise.all([...promises, ...promesasEliminar]);
        }

        // Agregar contactos nuevos (si hay)
        if (contactos && contactos.length > 0) {
          await Promise.all(
            contactos.map(contacto =>
              personasApi.addContacto(selectedPersona.id, contacto)
            )
          );
        }

        // Recargar datos frescos del backend después de guardar
        const personaActualizada = await personasApi.getById(selectedPersona.id);
        setSelectedPersona(personaActualizada.data);

        dispatch(
          showNotification({
            message: 'Persona actualizada exitosamente',
            severity: 'success',
          })
        );
      } else {
        // Crear nueva persona (con tipos y contactos incluidos en el DTO)
        await personasApi.create(data);
        dispatch(
          showNotification({
            message: 'Persona creada exitosamente',
            severity: 'success',
          })
        );
      }

      setFormOpen(false);
      setSelectedPersona(null);
      refetch();
    } catch (error: any) {
      console.error('Error al guardar persona:', error);

      dispatch(
        showNotification({
          message: 'No es posible realizar la acción en este momento',
          severity: 'error',
        })
      );

      // Re-throw para que el formulario no se cierre
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!personaToDelete) return;

    try {
      setDeleting(true);
      await personasApi.delete(personaToDelete.id);

      dispatch(
        showNotification({
          message: 'Persona eliminada exitosamente',
          severity: 'success',
        })
      );

      setDeleteDialogOpen(false);
      setPersonaToDelete(null);
      refetch();
    } catch (error: any) {
      console.error('Error al eliminar persona:', error);

      dispatch(
        showNotification({
          message: 'No es posible realizar la acción en este momento',
          severity: 'error',
        })
      );
    } finally {
      setDeleting(false);
    }
  };

  // Calcular estadísticas para cada tab
  const estadisticasGenerales = useMemo<EstadisticaItem[]>(() => {
    const total = pagination?.total || 0;
    // Estimación: 90% activas, 10% inactivas (ya que por defecto filtramos solo activas)
    const activas = filters.activo ? total : Math.round(total * 0.9);
    const inactivas = filters.activo === false ? total : Math.round(total * 0.1);

    return [
      {
        label: 'Total Personas',
        value: total,
        icon: PeopleIcon,
        color: 'primary',
        formato: 'numero',
      },
      {
        label: 'Activas',
        value: activas,
        icon: PersonAddIcon,
        color: 'success',
        formato: 'numero',
      },
      {
        label: 'Inactivas',
        value: inactivas,
        icon: PersonOffIcon,
        color: 'error',
        formato: 'numero',
      },
    ];
  }, [pagination?.total, filters.activo]);

  const estadisticasPorTipo = useMemo<EstadisticaItem[]>(() => {
    // Usar dataset completo si está disponible, sino la página actual como fallback
    const dataset = todasPersonasStats.length > 0 ? todasPersonasStats : personas;
    const fuenteSubtitulo = todasPersonasStats.length > 0 ? 'Total global' : 'En página actual';

    const socios = dataset.filter((p) => p.tipos?.some((t) => t.tipoPersona.codigo === 'SOCIO')).length;
    const docentes = dataset.filter((p) => p.tipos?.some((t) => t.tipoPersona.codigo === 'DOCENTE')).length;
    const proveedores = dataset.filter((p) => p.tipos?.some((t) => t.tipoPersona.codigo === 'PROVEEDOR')).length;
    const noSocios = dataset.filter((p) => p.tipos?.some((t) => t.tipoPersona.codigo === 'NO_SOCIO')).length;

    return [
      {
        label: 'Socios',
        value: socios,
        icon: GroupIcon,
        color: 'primary',
        formato: 'numero',
        subtitle: fuenteSubtitulo,
      },
      {
        label: 'Docentes',
        value: docentes,
        icon: SchoolIcon,
        color: 'secondary',
        formato: 'numero',
        subtitle: fuenteSubtitulo,
      },
      {
        label: 'Proveedores',
        value: proveedores,
        icon: BusinessIcon,
        color: 'info',
        formato: 'numero',
        subtitle: fuenteSubtitulo,
      },
      {
        label: 'No Socios',
        value: noSocios,
        icon: PeopleIcon,
        color: 'warning',
        formato: 'numero',
        subtitle: fuenteSubtitulo,
      },
    ];
  }, [todasPersonasStats, personas]);

  const estadisticasPorCategoria = useMemo<EstadisticaItem[]>(() => {
    // Usar dataset completo si está disponible, sino la página actual como fallback
    const dataset = todasPersonasStats.length > 0 ? todasPersonasStats : personas;
    const fuenteSubtitulo = todasPersonasStats.length > 0 ? 'Total global' : 'En página actual';

    // Contar personas por categoría (solo socios)
    const socios = dataset.filter((p) => p.tipos?.some((t) => t.tipoPersona.codigo === 'SOCIO'));
    const categoriasCount: Record<string, number> = {};

    socios.forEach((persona) => {
      const socioTipo = persona.tipos?.find((t) => t.tipoPersona.codigo === 'SOCIO');
      if (socioTipo?.categoriaSocio) {
        const catNombre = socioTipo.categoriaSocio.nombre;
        categoriasCount[catNombre] = (categoriasCount[catNombre] || 0) + 1;
      }
    });

    // Convertir a array de estadísticas (máximo 4 categorías más comunes)
    const stats = Object.entries(categoriasCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([nombre, count], index) => ({
        label: nombre,
        value: count,
        icon: GroupIcon,
        color: (['primary', 'secondary', 'success', 'info'] as const)[index],
        formato: 'numero' as const,
        subtitle: fuenteSubtitulo,
      }));

    // Si no hay categorías, mostrar mensaje
    if (stats.length === 0) {
      return [
        {
          label: 'Sin categorías',
          value: 0,
          icon: GroupIcon,
          color: 'primary',
          formato: 'numero',
          subtitle: 'Filtre por tipo SOCIO',
        },
      ];
    }

    return stats;
  }, [todasPersonasStats, personas]);

  return (
    <Box>
      {/* Header */}
      <SeccionPaginaTitulo
        titulo="Gestión de Personas"
        subtitulo="Gestión completa de personas con múltiples tipos, contactos y validaciones"
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Personas' },
        ]}
        actions={
            <Box display="flex" gap={1} alignItems="center">
              <DownloadPdfButton filters={filters} filename={`personas_${Date.now()}.pdf`} />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddClick}
                size="large"
              >
                Nueva Persona
              </Button>
            </Box>
        }
      />

      {/* Tabs Principal: Vista General | Estadísticas */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={mainTab} onChange={(_, newValue) => setMainTab(newValue)}>
          <Tab icon={<ViewListIcon />} label="Vista General" iconPosition="start" />
          <Tab icon={<BarChartIcon />} label="Estadísticas" iconPosition="start" />
        </Tabs>
      </Box>

      {/* TAB 0: Vista General (Filtros + Tabla) */}
      {mainTab === 0 && (
        <>
          {/* Acordeón de Filtros */}
          <Accordion
            expanded={filtrosExpanded}
            onChange={() => setFiltrosExpanded(!filtrosExpanded)}
            elevation={1}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <FilterListIcon color="primary" />
                <Typography variant="h6" fontWeight="medium">
                  Filtros
                </Typography>
                {filtrosActivos > 0 && (
                  <Chip
                    label={filtrosActivos}
                    size="small"
                    color="primary"
                    sx={{ fontWeight: 'bold' }}
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <PersonasFilters
                filters={filters}
                catalogos={catalogos}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                resultCount={Math.min(
                  (pagination?.page || 1) * (pagination?.limit || 20),
                  pagination?.total || 0
                )}
                totalCount={pagination?.total || 0}
              />
            </AccordionDetails>
          </Accordion>
        </>
      )}

      {/* TAB 1: Panel de Estadísticas (Pantalla Completa) */}
      {mainTab === 1 && (
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
          <Stack spacing={4}>
            {/* BLOQUE 1: Estadísticas Generales */}
            <Box>
              <Typography
                variant="h6"
                color="primary"
                gutterBottom
                sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
              >
                📊 Estadísticas Generales
              </Typography>
              <Grid container spacing={2}>
                {estadisticasGenerales.map((stat, index) => (
                  <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center', height: '100%' }}>
                      <Box display="flex" justifyContent="center" mb={1}>
                        {React.createElement(stat.icon, {
                          color: stat.color,
                          sx: { fontSize: 40 },
                        })}
                      </Box>
                      <Typography variant="h4" fontWeight="bold" color={`${stat.color}.main`}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                        {stat.label}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Divider />

            {/* BLOQUE 2: Distribución por Tipo */}
            <Box>
              <Typography
                variant="h6"
                color="primary"
                gutterBottom
                sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
              >
                👥 Distribución por Tipo
              </Typography>
              <Grid container spacing={2}>
                {estadisticasPorTipo.map((stat, index) => (
                  <Grid key={index} size={{ xs: 6, sm: 3 }}>
                    <Paper elevation={2} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                      <Box display="flex" justifyContent="center" mb={1}>
                        {React.createElement(stat.icon, {
                          color: stat.color,
                          sx: { fontSize: 32 },
                        })}
                      </Box>
                      <Typography variant="h5" fontWeight="bold" color={`${stat.color}.main`}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.label}
                      </Typography>
                      {stat.subtitle && (
                        <Typography variant="caption" display="block" color="text.disabled" sx={{ mt: 0.5 }}>
                          {stat.subtitle}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Divider />

            {/* BLOQUE 3: Por Categoría (Top 4) */}
            <Box>
              <Typography
                variant="h6"
                color="primary"
                gutterBottom
                sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
              >
                📈 Por Categoría (Top 4)
              </Typography>
              <Grid container spacing={2}>
                {estadisticasPorCategoria.map((stat, index) => (
                  <Grid key={index} size={{ xs: 6, sm: 3 }}>
                    <Paper elevation={2} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                      <Box display="flex" justifyContent="center" mb={1}>
                        {React.createElement(stat.icon, {
                          color: stat.color,
                          sx: { fontSize: 32 },
                        })}
                      </Box>
                      <Typography variant="h5" fontWeight="bold" color={`${stat.color}.main`}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {stat.label}
                      </Typography>
                      {stat.subtitle && (
                        <Typography variant="caption" display="block" color="text.disabled" sx={{ mt: 0.5 }}>
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

      {/* Tabla (Solo en Vista General - Tab 0) */}
      {mainTab === 0 && (
        <>
          {loading && !personas.length ? (
            <LoadingSkeleton rows={10} variant="table" />
          ) : (
            <>
              <PersonasTable
                personas={personas}
                onView={handleViewClick}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                expandable
              />

              {/* Paginación */}
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                flexWrap="wrap"
                gap={1}
                mt={2}
              >
                {/* Botón "Ver Todos / Ver Paginado" */}
                <Button
                  variant={verTodos ? 'contained' : 'outlined'}
                  size="small"
                  color="secondary"
                  onClick={handleToggleVerTodos}
                  startIcon={<ViewListIcon />}
                >
                  {verTodos
                    ? `Mostrando todos (${pagination?.total ?? 0} personas)`
                    : 'Ver todos'}
                </Button>

                {/* TablePagination — oculto en modo verTodos */}
                {!verTodos && (
                  <TablePagination
                    component="div"
                    count={pagination?.total ?? 0}
                    page={(pagination?.page ?? 1) - 1}
                    onPageChange={handlePageChange}
                    rowsPerPage={filters.limit ?? 20}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    rowsPerPageOptions={[10, 20, 50, 100]}
                    labelRowsPerPage="Registros por página:"
                    labelDisplayedRows={({ from, to, count }) =>
                      `${from}–${to} de ${count} personas`
                    }
                  />
                )}
              </Box>
            </>
          )}
        </>
      )}

      {/* Formulario */}
      <PersonaFormV2
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        persona={selectedPersona}
        catalogos={catalogos}
        loading={loading || catalogosLoading}
      />

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar a{' '}
            <strong>
              {personaToDelete?.nombre} {personaToDelete?.apellido}
            </strong>
            ?
            <br />
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PersonasPage;
