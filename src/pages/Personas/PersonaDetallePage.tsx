import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  ContactPhone as ContactIcon,
  FamilyRestroom as FamilyIcon,
} from '@mui/icons-material';
import { PersonaHeader, ContactosTab, PersonaFormV2 } from '../../components/personas/v2';
import { usePersona, useCatalogosPersonas } from '../../hooks/usePersonas';
import { TipoItem } from '../../components/personas/v2/tipos';
import { AsignarTipoModal } from '../../components/personas/v2/tipos/AsignarTipoModal';
import { FamiliaresTab } from '../../components/personas/v2/familiares';
import { personasApi } from '../../services/personasApi';
import { useAppDispatch } from '../../hooks/redux';
import { setTiposAsignados, removerTipo } from '../../store/slices/personasSlice';
import { showNotification } from '../../store/slices/uiSlice';
import type { CreatePersonaDTO } from '../../types/persona.types';
import { formatDateES } from '@/utils/dateHelpers';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`persona-tabpanel-${index}`}
      aria-labelledby={`persona-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * Página de detalle de una persona
 * Incluye tabs para: Datos Generales, Tipos, Contactos, Familiares
 */
const PersonaDetallePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const personaId = id ? parseInt(id) : undefined;

  const [tabValue, setTabValue] = useState(0);
  const [asignarTipoOpen, setAsignarTipoOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  // Cargar persona y catálogos
  const { persona, loading, error, refetch } = usePersona(personaId);
  const { catalogos, loading: catalogosLoading } = useCatalogosPersonas();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBack = () => {
    navigate('/personas');
  };

  const handleEdit = () => {
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
  };

  const handleFormSubmit = async (data: CreatePersonaDTO) => {
    if (!personaId) return;

    try {
      // Separar contactos y tipos del resto de datos
      const { contactos, tipos, ...personaData } = data;

      // Actualizar datos básicos de la persona
      await personasApi.update(personaId, personaData);

      // Actualizar tipos específicos (especialidadId, categoriaId, etc.)
      if (tipos && tipos.length > 0 && persona?.tipos) {
        const updatePromises = tipos.map(async (tipoFormData) => {
          // Buscar el PersonaTipo correspondiente en los datos actuales de la persona
          const personaTipo = persona.tipos?.find(
            t => t.tipoPersonaId === tipoFormData.tipoPersonaId
          );

          if (personaTipo && personaTipo.id) {
            // Preparar datos a actualizar (solo campos específicos del tipo)
            const updateData: any = {};

            if (tipoFormData.especialidadId !== undefined) {
              updateData.especialidadId = tipoFormData.especialidadId;
            }
            if (tipoFormData.categoriaId !== undefined) {
              updateData.categoriaId = tipoFormData.categoriaId;
            }
            if (tipoFormData.honorariosPorHora !== undefined) {
              updateData.honorariosPorHora = tipoFormData.honorariosPorHora;
            }
            if (tipoFormData.numeroSocio !== undefined) {
              updateData.numeroSocio = tipoFormData.numeroSocio;
            }
            if (tipoFormData.fechaIngreso !== undefined) {
              updateData.fechaIngreso = tipoFormData.fechaIngreso;
            }
            if (tipoFormData.cuit !== undefined) {
              updateData.cuit = tipoFormData.cuit;
            }
            if (tipoFormData.razonSocialId !== undefined) {
              updateData.razonSocialId = tipoFormData.razonSocialId;
            }
            if (tipoFormData.observaciones !== undefined) {
              updateData.observaciones = tipoFormData.observaciones;
            }

            // Solo actualizar si hay cambios
            if (Object.keys(updateData).length > 0) {
              await personasApi.actualizarTipo(personaId, personaTipo.id, updateData);
            }
          }
        });

        await Promise.all(updatePromises);
      }

      // Agregar contactos nuevos (si hay)
      if (contactos && contactos.length > 0) {
        await Promise.all(
          contactos.map(contacto =>
            personasApi.addContacto(personaId, contacto)
          )
        );
      }

      dispatch(
        showNotification({
          message: 'Persona actualizada exitosamente',
          severity: 'success',
        })
      );

      setFormOpen(false);
      refetch(); // Recargar datos de la persona
    } catch (error: any) {
      console.error('Error al actualizar persona:', error);
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

  const handleAsignarTipo = () => {
    setAsignarTipoOpen(true);
  };

  const handleAsignarTipoSuccess = () => {
    dispatch(
      showNotification({
        message: 'Tipo asignado exitosamente',
        severity: 'success',
      })
    );
    refetch(); // Recargar persona completa con nuevos tipos
  };

  const handleEliminarTipo = async (tipoId: number) => {
    if (!personaId || !persona) return;

    const confirmacion = window.confirm('¿Estás seguro de desasignar este tipo?');
    if (!confirmacion) return;

    setLoadingAction(true);
    try {
      await personasApi.desasignarTipo(personaId, tipoId);
      dispatch(removerTipo(tipoId));
      dispatch(
        showNotification({
          message: 'Tipo desasignado exitosamente',
          severity: 'success',
        })
      );
      refetch();
    } catch (err: any) {
      console.error('Error al desasignar tipo:', err);
      dispatch(
        showNotification({
          message: 'No es posible realizar la acción en este momento',
          severity: 'error',
        })
      );
    } finally {
      setLoadingAction(false);
    }
  };

  const handleToggleTipo = async (tipoId: number) => {
    if (!personaId) return;

    setLoadingAction(true);
    try {
      await personasApi.toggleTipo(tipoId);
      dispatch(
        showNotification({
          message: 'Tipo actualizado exitosamente',
          severity: 'success',
        })
      );
      refetch();
    } catch (err: any) {
      console.error('Error al actualizar tipo:', err);
      dispatch(
        showNotification({
          message: 'No es posible realizar la acción en este momento',
          severity: 'error',
        })
      );
    } finally {
      setLoadingAction(false);
    }
  };

  if (loading || catalogosLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Volver al listado
        </Button>
      </Box>
    );
  }

  if (!persona) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          No se encontró la persona
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Volver al listado
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body1"
          onClick={handleBack}
          sx={{ cursor: 'pointer', textDecoration: 'none' }}
        >
          Personas
        </Link>
        <Typography color="text.primary">
          {persona.nombre} {persona.apellido}
        </Typography>
      </Breadcrumbs>

      {/* Header con botones */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Volver
        </Button>
        <Button variant="contained" startIcon={<EditIcon />} onClick={handleEdit}>
          Editar Persona
        </Button>
      </Box>

      {/* Header de la persona */}
      <Box mb={3}>
        <PersonaHeader persona={persona} showContactInfo showDates />
      </Box>

      {/* Tabs */}
      <Paper>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<PersonIcon />} label="Datos Generales" iconPosition="start" />
          <Tab icon={<CategoryIcon />} label="Tipos" iconPosition="start" />
          <Tab icon={<ContactIcon />} label="Contactos" iconPosition="start" />
          <Tab icon={<FamilyIcon />} label="Familiares" iconPosition="start" />
        </Tabs>

        {/* Tab Panel: Datos Generales */}
        <TabPanel value={tabValue} index={0}>
          <Box p={2}>
            <Typography variant="h6" gutterBottom>
              Información Personal
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Nombre Completo
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {persona.nombre} {persona.apellido}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  DNI
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {persona.dni}
                </Typography>
              </Box>
              {persona.fechaNacimiento && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Fecha de Nacimiento
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formatDateES(persona.fechaNacimiento)}
                  </Typography>
                </Box>
              )}
              {persona.observaciones && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Observaciones
                  </Typography>
                  <Typography variant="body1">{persona.observaciones}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </TabPanel>

        {/* Tab Panel: Tipos */}
        <TabPanel value={tabValue} index={1}>
          <Box p={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Tipos Asignados ({persona.tipos?.length || 0})
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<CategoryIcon />}
                onClick={handleAsignarTipo}
                disabled={loadingAction}
              >
                Asignar Tipo
              </Button>
            </Box>

            {persona.tipos && persona.tipos.length > 0 ? (
              <Box display="flex" flexDirection="column" gap={2}>
                {persona.tipos.map((tipo) => (
                  <TipoItem
                    key={tipo.id}
                    tipo={tipo}
                    showActions={true}
                    compact={false}
                    onDelete={() => handleEliminarTipo(tipo.id)}
                    onToggle={() => handleToggleTipo(tipo.id)}
                  />
                ))}
              </Box>
            ) : (
              <Alert severity="info">
                No hay tipos asignados a esta persona
              </Alert>
            )}
          </Box>
        </TabPanel>

        {/* Tab Panel: Contactos */}
        <TabPanel value={tabValue} index={2}>
          <Box p={2}>
            <ContactosTab personaId={persona.id} catalogos={catalogos} />
          </Box>
        </TabPanel>

        {/* Tab Panel: Familiares */}
        <TabPanel value={tabValue} index={3}>
          <Box p={2}>
            <FamiliaresTab
              personaId={persona.id}
              personaNombre={persona.nombre}
              personaApellido={persona.apellido}
              personaPrincipal={persona}
            />
          </Box>
        </TabPanel>
      </Paper>

      {/* Modal de asignación de tipos */}
      {persona && (
        <AsignarTipoModal
          open={asignarTipoOpen}
          onClose={() => setAsignarTipoOpen(false)}
          personaId={persona.id}
          personaNombre={`${persona.nombre} ${persona.apellido}`}
          catalogos={catalogos}
          tiposAsignados={persona.tipos?.map(t => t.tipoPersona?.codigo).filter((c): c is string => !!c) || []}
          onSuccess={handleAsignarTipoSuccess}
        />
      )}

      {/* Formulario de edición de persona */}
      {persona && (
        <PersonaFormV2
          open={formOpen}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
          persona={persona}
          catalogos={catalogos}
          loading={loadingAction}
        />
      )}
    </Box>
  );
};

export default PersonaDetallePage;
