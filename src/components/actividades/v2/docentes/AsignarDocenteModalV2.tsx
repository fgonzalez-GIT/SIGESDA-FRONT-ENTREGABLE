import React, { useState, useEffect, useMemo } from 'react';
import debounce from 'lodash/debounce';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Radio,
  RadioGroup,
  FormControlLabel,
  Typography,
  Alert,
  Divider,
  CircularProgress,
  InputAdornment,
  Autocomplete,
  Chip
} from '@mui/material';
import {
  School as SchoolIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { actividadesApi } from '../../../../services/actividadesApi';
import { personasApi } from '../../../../services/personasApi';
import { MAX_API_LIMIT } from '../../../../constants/api';
import type { RolDocente } from '../../../../types/actividad.types';
import type { TipoPersona, Persona } from '../../../../types/persona.types';

interface AsignarDocenteModalV2Props {
  open: boolean;
  onClose: () => void;
  actividadId: number;
  actividadNombre: string;
  onSuccess: () => void;
  docentesAsignadosIds?: number[];
}

const steps = ['Seleccionar Docente', 'Asignar Rol', 'Confirmar'];

/**
 * Modal de asignación de docente con flujo de 3 pasos
 * Paso 1: Buscar y seleccionar docente
 * Paso 2: Seleccionar rol del docente
 * Paso 3: Confirmar asignación
 */
export const AsignarDocenteModalV2: React.FC<AsignarDocenteModalV2Props> = ({
  open,
  onClose,
  actividadId,
  actividadNombre,
  onSuccess,
  docentesAsignadosIds = []
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Datos
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [roles, setRoles] = useState<RolDocente[]>([]);
  const [tiposPersona, setTiposPersona] = useState<TipoPersona[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoPersona | null>(null);

  // Selección
  const [personaSeleccionada, setPersonaSeleccionada] = useState<Persona | null>(null);
  const [rolSeleccionado, setRolSeleccionado] = useState<number | null>(null);
  const [observaciones, setObservaciones] = useState('');

  // Debounced search (300ms delay)
  const debouncedSetSearch = useMemo(
    () => debounce((value: string) => setDebouncedSearchTerm(value), 300),
    []
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [debouncedSetSearch]);

  // Cargar datos iniciales
  useEffect(() => {
    if (open) {
      cargarDatos();
    }
  }, [open]);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const [personasResponse, rolesData, tiposData] = await Promise.all([
        personasApi.getAll({
          limit: MAX_API_LIMIT,
          activo: true,
          includeTipos: true
        }),
        actividadesApi.obtenerRolesDocentes(),
        personasApi.getTiposPersona()
      ]);

      // Extraer personas del response paginado
      setPersonas(personasResponse.data || []);
      setRoles(rolesData);

      // Establecer tipos de persona y seleccionar DOCENTE por defecto
      const tipos = tiposData.data || [];
      setTiposPersona(tipos);
      const tipoDocente = tipos.find(t => t.codigo === 'DOCENTE');
      if (tipoDocente) {
        setTipoSeleccionado(tipoDocente);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleClose = () => {
    // Reset
    setActiveStep(0);
    setPersonaSeleccionada(null);
    setRolSeleccionado(null);
    setObservaciones('');
    setSearchTerm('');
    setError(null);
    setDebouncedSearchTerm('');
    // Restaurar tipo DOCENTE por defecto
    const tipoDocente = tiposPersona.find(t => t.codigo === 'DOCENTE');
    if (tipoDocente) {
      setTipoSeleccionado(tipoDocente);
    } else {
      setTipoSeleccionado(null);
    }
    onClose();
  };

  const handleAsignar = async () => {
    if (!personaSeleccionada || !rolSeleccionado) return;

    setLoading(true);
    setError(null);

    try {
      await actividadesApi.asignarDocente(actividadId, {
        docenteId: personaSeleccionada.id,
        rolDocenteId: rolSeleccionado,
        observaciones: observaciones || undefined
      });

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Error al asignar docente');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar personas: excluir ya asignados, aplicar búsqueda y tipo de persona (flexible)
  const personasFiltradas = personas.filter((persona) => {
    // Excluir personas ya asignadas a esta actividad
    if (docentesAsignadosIds.includes(persona.id)) {
      return false;
    }

    // Aplicar filtro de tipo de persona de manera FLEXIBLE
    // Solo filtra si hay un tipo seleccionado Y la persona tiene tipos asignados
    if (tipoSeleccionado && persona.tipos && persona.tipos.length > 0) {
      const tieneTipo = persona.tipos.some(
        (tipo) => tipo.tipoPersonaId === tipoSeleccionado.id && tipo.activo
      );
      // Si no tiene el tipo seleccionado, se excluye (pero permite seleccionar otros tipos)
      if (!tieneTipo) {
        return false;
      }
    }
    // Si tipoSeleccionado es null, muestra TODAS las personas activas

    // Aplicar filtro de búsqueda
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      return (
        persona.nombre.toLowerCase().includes(searchLower) ||
        persona.apellido.toLowerCase().includes(searchLower) ||
        persona.email?.toLowerCase().includes(searchLower) ||
        persona.dni?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Obtener rol seleccionado
  const rolSeleccionadoObj = roles.find((r) => r.id === rolSeleccionado);

  // PASO 1: Seleccionar Docente
  const renderPaso1 = () => (
    <Box>
      <Autocomplete
        fullWidth
        options={tiposPersona}
        getOptionLabel={(option) => option.nombre}
        value={tipoSeleccionado}
        onChange={(_, newValue) => setTipoSeleccionado(newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Tipo de Persona"
            placeholder="Seleccione un tipo..."
          />
        )}
        sx={{ mb: 2 }}
        disableClearable={false}
      />

      <TextField
        fullWidth
        placeholder="Buscar por nombre, apellido o email..."
        value={searchTerm}
        onChange={(e) => {
          const value = e.target.value;
          setSearchTerm(value);
          debouncedSetSearch(value);
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          )
        }}
        sx={{ mb: 2 }}
      />

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : personasFiltradas.length === 0 ? (
        <Alert severity="info">
          No se encontraron personas disponibles
          {searchTerm && ' con esos criterios de búsqueda'}
          {tipoSeleccionado && `. Intenta cambiar el filtro de tipo o búscalo por nombre/DNI`}
          {!tipoSeleccionado && !searchTerm && ' (puede que todas estén asignadas a esta actividad)'}
        </Alert>
      ) : (
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {personasFiltradas.map((persona) => (
            <ListItem
              key={persona.id}
              disablePadding
              sx={{
                border: '1px solid',
                borderColor:
                  personaSeleccionada?.id === persona.id
                    ? 'primary.main'
                    : 'divider',
                borderRadius: 1,
                mb: 1
              }}
            >
              <ListItemButton
                selected={personaSeleccionada?.id === persona.id}
                onClick={() => setPersonaSeleccionada(persona)}
                sx={{
                  '&:hover': {
                    borderColor: 'primary.main'
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <SchoolIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body1">
                        {`${persona.apellido}, ${persona.nombre}`}
                      </Typography>
                      {(persona.tipos || [])
                        .filter(tipo => tipo.activo)
                        .map((tipo) => (
                          <Chip
                            key={tipo.id}
                            label={tipo.tipoPersona?.nombre || 'Desconocido'}
                            size="small"
                            color={tipo.tipoPersona?.codigo === 'DOCENTE' ? 'primary' : 'default'}
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        ))}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="caption" display="block">
                        DNI: {persona.dni}
                      </Typography>
                      {persona.email && (
                        <Typography variant="caption" display="block">
                          Email: {persona.email}
                        </Typography>
                      )}
                      {persona.telefono && (
                        <Typography variant="caption" display="block">
                          Tel: {persona.telefono}
                        </Typography>
                      )}
                    </>
                  }
                />
                {personaSeleccionada?.id === persona.id && (
                  <CheckCircleIcon color="primary" />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );

  // PASO 2: Seleccionar Rol
  const renderPaso2 = () => (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Persona seleccionada:{' '}
        <strong>
          {personaSeleccionada?.apellido}, {personaSeleccionada?.nombre}
        </strong>
      </Alert>

      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
        Selecciona el rol del docente:
      </Typography>

      <RadioGroup
        value={rolSeleccionado}
        onChange={(e) => setRolSeleccionado(parseInt(e.target.value))}
      >
        {roles.map((rol) => (
          <FormControlLabel
            key={rol.id}
            value={rol.id}
            control={<Radio />}
            label={
              <Box>
                <Typography variant="body1" fontWeight={500}>
                  {rol.nombre}
                </Typography>
                {rol.descripcion && (
                  <Typography variant="caption" color="text.secondary">
                    {rol.descripcion}
                  </Typography>
                )}
              </Box>
            }
            sx={{
              border: '1px solid',
              borderColor: rolSeleccionado === rol.id ? 'primary.main' : 'divider',
              borderRadius: 1,
              mb: 1,
              p: 1.5,
              ml: 0,
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          />
        ))}
      </RadioGroup>

      <TextField
        fullWidth
        multiline
        rows={3}
        label="Observaciones (opcional)"
        value={observaciones}
        onChange={(e) => setObservaciones(e.target.value)}
        placeholder="Agrega notas o comentarios sobre esta asignación..."
        sx={{ mt: 2 }}
      />
    </Box>
  );

  // PASO 3: Confirmar
  const renderPaso3 = () => (
    <Box>
      <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 3 }}>
        Revisa los datos antes de confirmar la asignación
      </Alert>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Actividad
        </Typography>
        <Typography variant="body1" fontWeight={500}>
          {actividadNombre}
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Persona
        </Typography>
        <Typography variant="body1" fontWeight={500}>
          {personaSeleccionada?.apellido}, {personaSeleccionada?.nombre}
        </Typography>
        <Typography variant="caption" display="block" color="text.secondary">
          DNI: {personaSeleccionada?.dni}
        </Typography>
        {personaSeleccionada?.email && (
          <Typography variant="caption" display="block" color="text.secondary">
            Email: {personaSeleccionada.email}
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Rol
        </Typography>
        <Typography variant="body1" fontWeight={500}>
          {rolSeleccionadoObj?.nombre}
        </Typography>
        {rolSeleccionadoObj?.descripcion && (
          <Typography variant="caption" display="block" color="text.secondary">
            {rolSeleccionadoObj.descripcion}
          </Typography>
        )}
      </Box>

      {observaciones && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Observaciones
            </Typography>
            <Typography variant="body2">{observaciones}</Typography>
          </Box>
        </>
      )}
    </Box>
  );

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderPaso1();
      case 1:
        return renderPaso2();
      case 2:
        return renderPaso3();
      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return personaSeleccionada !== null;
      case 1:
        return rolSeleccionado !== null;
      case 2:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Asignar Docente a Actividad</DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ pt: 2, pb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {getStepContent(activeStep)}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Box sx={{ flex: 1 }} />
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Anterior
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!isStepValid() || loading}
          >
            Siguiente
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleAsignar}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Asignando...' : 'Asignar Docente'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AsignarDocenteModalV2;
