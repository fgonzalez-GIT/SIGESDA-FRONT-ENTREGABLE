import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Autocomplete,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Avatar,
  Paper,
  Checkbox,
  FormControlLabel,
  Tooltip,
} from '@mui/material';
import {
  Groups,
  PersonRemove,
  PersonAdd,
  Close,
  Save,
  Person,
  Warning,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  agregarMiembroGrupo,
  removerMiembroGrupo,
  actualizarMiembrosGrupo,
  GrupoFamiliar,
  clearGrupoWarnings,
} from '../../store/slices/familiaresSlice';

interface GestionMiembrosDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  grupo: GrupoFamiliar;
}

interface PersonaOption {
  id: number;
  label: string;
  nombre: string;
  apellido: string;
  tipo?: string;
}

const GestionMiembrosDialog: React.FC<GestionMiembrosDialogProps> = ({
  open,
  onClose,
  onSuccess,
  grupo,
}) => {
  const dispatch = useAppDispatch();
  const { personas } = useAppSelector((state) => state.personas);
  const { loading, grupoWarnings } = useAppSelector((state) => state.familiares);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [miembrosActuales, setMiembrosActuales] = useState<number[]>([]);
  const [personaToAdd, setPersonaToAdd] = useState<PersonaOption | null>(null);
  const [personasOptions, setPersonasOptions] = useState<PersonaOption[]>([]);

  // NUEVO (v2026-02-26): Estado para skipFamilyValidation y confirmación
  const [skipFamilyValidation, setSkipFamilyValidation] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingPersona, setPendingPersona] = useState<PersonaOption | null>(null);

  // Inicializar miembros actuales
  useEffect(() => {
    if (open && grupo) {
      setMiembrosActuales(grupo.miembros);
      setError(null);
      setSuccess(null);
      setPersonaToAdd(null);
      setSkipFamilyValidation(false);
      dispatch(clearGrupoWarnings());
    }
  }, [open, grupo, dispatch]);

  // Preparar opciones de personas (excluir miembros actuales)
  useEffect(() => {
    if (open) {
      const disponibles = personas
        .filter((p) => !miembrosActuales.includes(p.id))
        .map((p) => ({
          id: p.id,
          label: `${p.nombre} ${p.apellido}`,
          nombre: p.nombre,
          apellido: p.apellido,
          tipo: p.tipo,
        }));

      setPersonasOptions(disponibles);
    }
  }, [open, personas, miembrosActuales]);

  // Obtener información de un miembro por ID
  const getMiembroInfo = (miembroId: number) => {
    const persona = personas.find((p) => p.id === miembroId);
    if (persona) {
      return {
        id: persona.id,
        nombre: persona.nombre,
        apellido: persona.apellido,
        tipo: persona.tipo,
        esReferente: miembroId === grupo.personaReferente,
      };
    }
    return null;
  };

  const handleAgregarMiembro = async (retryWithSkip: boolean = false) => {
    const persona = retryWithSkip ? pendingPersona : personaToAdd;

    if (!persona) {
      setError('Por favor seleccione una persona para agregar');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      dispatch(clearGrupoWarnings());

      // NUEVO (v2026-02-26): Incluir skipFamilyValidation en la request
      await dispatch(
        agregarMiembroGrupo({
          grupoId: grupo.id,
          personaId: persona.id,
          skipFamilyValidation: retryWithSkip || skipFamilyValidation,
        })
      ).unwrap();

      setMiembrosActuales([...miembrosActuales, persona.id]);
      setPersonaToAdd(null);
      setPendingPersona(null);
      setSuccess(`${persona.label} agregado al grupo exitosamente`);

      // Si hay warnings, se mostrarán automáticamente desde el estado Redux
    } catch (err: any) {
      const errorMessage = err.message || 'Error al agregar miembro';

      // NUEVO (v2026-02-26): Detectar error de relación familiar y mostrar confirmación
      if (errorMessage.includes('no tiene relación familiar')) {
        setPendingPersona(persona);
        setShowConfirmDialog(true);
      } else {
        setError(errorMessage);
      }
    }
  };

  // NUEVO (v2026-02-26): Handlers para dialog de confirmación
  const handleConfirmSkipValidation = async () => {
    setShowConfirmDialog(false);
    await handleAgregarMiembro(true); // Retry con skipFamilyValidation=true
  };

  const handleCancelSkipValidation = () => {
    setShowConfirmDialog(false);
    setPendingPersona(null);
  };

  const handleRemoverMiembro = async (miembroId: number) => {
    const miembroInfo = getMiembroInfo(miembroId);

    if (!miembroInfo) {
      setError('Miembro no encontrado');
      return;
    }

    // No permitir remover al referente
    if (miembroInfo.esReferente) {
      setError('No se puede remover al referente del grupo');
      return;
    }

    // Confirmar remoción
    const confirmar = window.confirm(
      `¿Está seguro de remover a ${miembroInfo.nombre} ${miembroInfo.apellido} del grupo?`
    );

    if (!confirmar) return;

    try {
      setError(null);
      setSuccess(null);

      await dispatch(
        removerMiembroGrupo({
          grupoId: grupo.id,
          miembroId,
        })
      ).unwrap();

      setMiembrosActuales(miembrosActuales.filter((id) => id !== miembroId));
      setSuccess(
        `${miembroInfo.nombre} ${miembroInfo.apellido} removido del grupo exitosamente`
      );
    } catch (err: any) {
      setError(err.message || 'Error al remover miembro');
    }
  };

  const handleGuardar = () => {
    if (onSuccess) {
      onSuccess();
    }
    onClose();
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Groups color="primary" />
          <Box flex={1}>
            <Typography variant="h6">Gestionar Miembros</Typography>
            <Typography variant="caption" color="text.secondary">
              Grupo: {grupo.nombre}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* NUEVO (v2026-02-26): Display de warnings */}
        {grupoWarnings.length > 0 && (
          <Alert
            severity="warning"
            icon={<Warning />}
            sx={{ mb: 2 }}
            onClose={() => dispatch(clearGrupoWarnings())}
          >
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Advertencias de validación:
            </Typography>
            {grupoWarnings.map((warning, index) => (
              <Typography key={index} variant="body2" sx={{ mt: 0.5 }}>
                • {warning}
              </Typography>
            ))}
          </Alert>
        )}

        {/* Agregar Nuevo Miembro */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            <PersonAdd fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            Agregar Nuevo Miembro
          </Typography>
          <Divider sx={{ my: 1 }} />

          <Box display="flex" gap={1} alignItems="flex-start">
            <Autocomplete
              fullWidth
              options={personasOptions}
              value={personaToAdd}
              onChange={(_, newValue) => setPersonaToAdd(newValue)}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              disabled={loading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar Persona"
                  placeholder="Escriba para buscar..."
                  size="small"
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                      <Person fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="body2">{option.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.tipo || 'Sin tipo'}
                      </Typography>
                    </Box>
                  </Box>
                </li>
              )}
            />
            <Button
              variant="contained"
              onClick={handleAgregarMiembro}
              disabled={!personaToAdd || loading}
              startIcon={loading ? <CircularProgress size={16} /> : <PersonAdd />}
            >
              Agregar
            </Button>
          </Box>

          {/* NUEVO (v2026-02-26): Checkbox para skipFamilyValidation */}
          <FormControlLabel
            control={
              <Checkbox
                checked={skipFamilyValidation}
                onChange={(e) => setSkipFamilyValidation(e.target.checked)}
              />
            }
            label={
              <Tooltip
                title="Permite agregar personas sin relación familiar declarada con el referente. Se mostrarán advertencias."
                arrow
              >
                <Typography variant="body2" sx={{ cursor: 'help' }}>
                  Permitir miembros sin relación familiar
                </Typography>
              </Tooltip>
            }
            sx={{ mt: 1.5 }}
          />
        </Paper>

        {/* Lista de Miembros Actuales */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Miembros Actuales ({miembrosActuales.length})
          </Typography>
          <Divider sx={{ mb: 1 }} />

          {miembrosActuales.length === 0 ? (
            <Alert severity="info" icon={<Warning />}>
              El grupo no tiene miembros. Agregue al menos un miembro.
            </Alert>
          ) : (
            <List>
              {miembrosActuales.map((miembroId) => {
                const miembro = getMiembroInfo(miembroId);
                if (!miembro) return null;

                return (
                  <ListItem
                    key={miembroId}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: miembro.esReferente ? 'action.selected' : 'background.paper',
                    }}
                  >
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      <Person />
                    </Avatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body1">
                            {miembro.nombre} {miembro.apellido}
                          </Typography>
                          {miembro.esReferente && (
                            <Chip label="Referente" size="small" color="primary" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {miembro.tipo || 'Sin tipo'}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoverMiembro(miembroId)}
                        disabled={miembro.esReferente || loading}
                        color="error"
                        title={
                          miembro.esReferente
                            ? 'No se puede remover al referente'
                            : 'Remover miembro'
                        }
                      >
                        <PersonRemove />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>

        {/* Información adicional */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="caption">
            <strong>Nota:</strong> El referente del grupo (
            {getMiembroInfo(grupo.personaReferente)?.nombre}{' '}
            {getMiembroInfo(grupo.personaReferente)?.apellido}) se incluye automáticamente como
            miembro y no puede ser removido. Para cambiar el referente, edite el grupo desde la
            configuración principal.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading} startIcon={<Close />}>
          Cerrar
        </Button>
        <Button
          onClick={handleGuardar}
          variant="contained"
          disabled={loading}
          startIcon={<Save />}
        >
          Guardar Cambios
        </Button>
      </DialogActions>

      {/* NUEVO (v2026-02-26): Dialog de confirmación para skip validation */}
      <Dialog open={showConfirmDialog} onClose={handleCancelSkipValidation} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Warning color="warning" />
            <Typography variant="h6">Sin Relación Familiar</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Typography variant="body1" gutterBottom>
            ¿Qué deseas hacer?
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Opción 1:</strong> Crear primero la relación familiar en el módulo de
              Familiares.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              <strong>Opción 2:</strong> Permitir agregar el miembro sin relación familiar (se
              generarán advertencias).
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelSkipValidation} startIcon={<Close />}>
            Cancelar
          </Button>
          <Button
            variant="outlined"
            color="warning"
            onClick={handleConfirmSkipValidation}
            startIcon={<Warning />}
          >
            Permitir de todos modos
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default GestionMiembrosDialog;
