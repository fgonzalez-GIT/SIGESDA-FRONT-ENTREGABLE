import React, { useEffect, useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Slider,
  Autocomplete,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  InputAdornment,
  Chip,
  Checkbox,
  Tooltip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Groups,
  Person,
  Percent,
  Save,
  Close,
  AttachMoney,
  Settings,
  FamilyRestroom,
  Warning,
  Info,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  crearGrupoFamiliar,
  actualizarGrupo,
  GrupoFamiliar,
  CrearGrupoFamiliarRequest,
  fetchSuggestedMembers,
  clearGrupoWarnings,
} from '../../store/slices/familiaresSlice';
import {
  grupoFamiliarFormSchema,
  type GrupoFamiliarFormData,
} from '../../schemas/grupoFamiliar.schema';
import type { SuggestedMember } from '../../types/grupoFamiliar.types';

interface GrupoFamiliarDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  grupoToEdit?: GrupoFamiliar | null;
}

const GrupoFamiliarDialog: React.FC<GrupoFamiliarDialogProps> = ({
  open,
  onClose,
  onSuccess,
  grupoToEdit,
}) => {
  const dispatch = useAppDispatch();
  const { personas } = useAppSelector((state) => state.personas);
  const { loading, suggestedMembers, loadingSuggestions, grupoWarnings } = useAppSelector(
    (state) => state.familiares
  );

  const isEditing = !!grupoToEdit;
  const [error, setError] = useState<string | null>(null);
  const [personasOptions, setPersonasOptions] = useState<any[]>([]);
  const errorRef = useRef<HTMLDivElement>(null);

  // NUEVO (v2026-02-26): Estado para nuevas características
  const [selectedMiembros, setSelectedMiembros] = useState<number[]>([]);
  const [skipFamilyValidation, setSkipFamilyValidation] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<GrupoFamiliarFormData | null>(null);

  // Auto-scroll al error cuando aparece
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [error]);

  // React Hook Form con Zod
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<GrupoFamiliarFormData>({
    resolver: zodResolver(grupoFamiliarFormSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      personaReferenteId: 0,
      descuentoGrupal: 0,
      activo: true,
      facturacionConjunta: false,
      descuentoProgresivo: false,
      limiteCuotas: 0,
      miembros: [],
      skipFamilyValidation: false,
    },
  });

  // Watch para valores dependientes
  const descuentoGrupal = watch('descuentoGrupal');
  const descuentoProgresivo = watch('descuentoProgresivo');
  const limiteCuotas = watch('limiteCuotas');
  const personaReferenteId = watch('personaReferenteId');

  // Cargar personas para Autocomplete
  useEffect(() => {
    if (open) {
      setPersonasOptions(
        personas.map((p) => ({
          id: p.id,
          label: `${p.nombre} ${p.apellido}`,
          nombre: p.nombre,
          apellido: p.apellido,
        }))
      );
    }
  }, [open, personas]);

  // Inicializar formulario
  useEffect(() => {
    if (open) {
      if (grupoToEdit) {
        // Modo edición: cargar datos existentes
        reset({
          nombre: grupoToEdit.nombre,
          descripcion: grupoToEdit.descripcion || '',
          personaReferenteId: grupoToEdit.personaReferente,
          descuentoGrupal: grupoToEdit.descuentoGrupal,
          activo: grupoToEdit.activo,
          facturacionConjunta: grupoToEdit.configuracion.facturacionConjunta,
          descuentoProgresivo: grupoToEdit.configuracion.descuentoProgresivo,
          limiteCuotas: grupoToEdit.configuracion.limiteCuotas,
          miembros: grupoToEdit.miembros || [],
          skipFamilyValidation: false,
        });
      } else {
        // Modo creación: formulario vacío
        reset({
          nombre: '',
          descripcion: '',
          personaReferenteId: 0,
          descuentoGrupal: 0,
          activo: true,
          facturacionConjunta: false,
          descuentoProgresivo: false,
          limiteCuotas: 0,
          miembros: [],
          skipFamilyValidation: false,
        });
        setSelectedMiembros([]);
        setSkipFamilyValidation(false);
      }
      setError(null);
      dispatch(clearGrupoWarnings());
    }
  }, [open, grupoToEdit, reset, dispatch]);

  // NUEVO (v2026-02-26): Cargar sugerencias de miembros cuando se selecciona referente
  useEffect(() => {
    if (open && personaReferenteId && personaReferenteId > 0 && !isEditing) {
      dispatch(
        fetchSuggestedMembers({
          referenteId: personaReferenteId,
          includeDetails: true,
          includeParentesco: true,
        })
      );
    }
  }, [open, personaReferenteId, isEditing, dispatch]);

  const onSubmit = async (data: GrupoFamiliarFormData, retryWithSkip: boolean = false) => {
    try {
      setError(null);
      dispatch(clearGrupoWarnings());

      if (isEditing && grupoToEdit) {
        // Modo edición
        // Crear objeto limpio sin referencias circulares
        await dispatch(
          actualizarGrupo({
            id: grupoToEdit.id,
            data: {
              nombre: String(data.nombre),
              descripcion: data.descripcion ? String(data.descripcion) : undefined,
              personaReferenteId: Number(data.personaReferenteId),
              descuentoGrupal: Number(data.descuentoGrupal),
              activo: Boolean(data.activo),
              facturacionConjunta: Boolean(data.facturacionConjunta),
              descuentoProgresivo: Boolean(data.descuentoProgresivo),
              limiteCuotas: Number(data.limiteCuotas),
              skipFamilyValidation: Boolean(retryWithSkip || skipFamilyValidation),
            },
          })
        ).unwrap();
      } else {
        // Modo creación
        // IMPORTANTE: NO incluir el referente en miembros (backend lo agrega automáticamente)
        // Crear objeto limpio sin referencias circulares
        const request: CrearGrupoFamiliarRequest = {
          nombre: String(data.nombre),
          descripcion: data.descripcion ? String(data.descripcion) : undefined,
          personaReferenteId: Number(data.personaReferenteId),
          miembros: [...selectedMiembros], // Copia del array para evitar referencias
          descuentoGrupal: Number(data.descuentoGrupal),
          facturacionConjunta: Boolean(data.facturacionConjunta),
          descuentoProgresivo: Boolean(data.descuentoProgresivo),
          limiteCuotas: Number(data.limiteCuotas),
          activo: Boolean(data.activo),
          skipFamilyValidation: Boolean(retryWithSkip || skipFamilyValidation),
        };

        await dispatch(crearGrupoFamiliar(request)).unwrap();
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      const errorMessage = err.message || 'Error al guardar el grupo familiar';

      // Detectar error de relación familiar no encontrada
      if (errorMessage.includes('no tiene relación familiar')) {
        setPendingSubmitData(data);
        setShowConfirmDialog(true);
      } else {
        setError(errorMessage);
      }
    }
  };

  // NUEVO (v2026-02-26): Manejar confirmación de skip validation
  const handleConfirmSkipValidation = async () => {
    setShowConfirmDialog(false);
    if (pendingSubmitData) {
      await onSubmit(pendingSubmitData, true); // Retry con skipFamilyValidation=true
      setPendingSubmitData(null);
    }
  };

  const handleCancelSkipValidation = () => {
    setShowConfirmDialog(false);
    setPendingSubmitData(null);
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Groups color="primary" />
          <Typography variant="h6">
            {isEditing ? 'Editar Grupo Familiar' : 'Crear Nuevo Grupo Familiar'}
          </Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          {error && (
            <Alert ref={errorRef} severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* NUEVO (v2026-02-26): Display de warnings */}
          {grupoWarnings.length > 0 && (
            <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }} onClose={() => dispatch(clearGrupoWarnings())}>
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

          <Stack spacing={3}>
            {/* Información Básica */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Información Básica
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="nombre"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Nombre del Grupo"
                        placeholder="Ej: Familia Pérez"
                        required
                        error={!!errors.nombre}
                        helperText={errors.nombre?.message}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Groups />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="descripcion"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Descripción"
                        placeholder="Descripción opcional del grupo"
                        multiline
                        rows={2}
                        error={!!errors.descripcion}
                        helperText={errors.descripcion?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="personaReferenteId"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <Autocomplete
                        {...field}
                        options={personasOptions}
                        value={personasOptions.find((p) => p.id === value) || null}
                        onChange={(_, newValue) => onChange(newValue?.id || 0)}
                        getOptionLabel={(option) => option.label}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Persona Referente (Titular)"
                            required
                            error={!!errors.personaReferenteId}
                            helperText={
                              errors.personaReferenteId?.message ||
                              'Persona responsable del grupo'
                            }
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: (
                                <>
                                  <InputAdornment position="start">
                                    <Person />
                                  </InputAdornment>
                                  {params.InputProps.startAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                      />
                    )}
                  />
                </Grid>

                {/* NUEVO (v2026-02-26): Miembros Sugeridos */}
                {!isEditing && personaReferenteId > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        <FamilyRestroom sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: 18 }} />
                        Miembros Sugeridos
                      </Typography>
                      <Divider sx={{ mb: 1.5 }} />

                      {loadingSuggestions ? (
                        <Box display="flex" alignItems="center" gap={1} py={2}>
                          <CircularProgress size={20} />
                          <Typography variant="body2" color="text.secondary">
                            Buscando familiares del referente...
                          </Typography>
                        </Box>
                      ) : suggestedMembers.length > 0 ? (
                        <>
                          <Alert severity="info" icon={<Info />} sx={{ mb: 2 }}>
                            <Typography variant="body2">
                              <strong>Nota:</strong> El referente se incluirá automáticamente como miembro del grupo.
                              Selecciona otros familiares para agregarlos.
                            </Typography>
                          </Alert>
                          <Box display="flex" flexWrap="wrap" gap={1}>
                            {suggestedMembers.map((member) => (
                              <Chip
                                key={member.id}
                                label={`${member.nombre} ${member.apellido} (${member.parentesco})`}
                                onClick={() => {
                                  setSelectedMiembros((prev) =>
                                    prev.includes(member.id)
                                      ? prev.filter((id) => id !== member.id)
                                      : [...prev, member.id]
                                  );
                                }}
                                color={selectedMiembros.includes(member.id) ? 'primary' : 'default'}
                                variant={selectedMiembros.includes(member.id) ? 'filled' : 'outlined'}
                                clickable
                              />
                            ))}
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            {selectedMiembros.length} miembro(s) seleccionado(s)
                          </Typography>
                        </>
                      ) : (
                        <Alert severity="warning" icon={<Warning />}>
                          <Typography variant="body2">
                            No se encontraron relaciones familiares declaradas para este referente.
                            Puedes crear el grupo y agregar miembros posteriormente.
                          </Typography>
                        </Alert>
                      )}

                      {/* Checkbox para permitir miembros sin relación familiar */}
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={skipFamilyValidation}
                            onChange={(e) => setSkipFamilyValidation(e.target.checked)}
                          />
                        }
                        label={
                          <Tooltip
                            title="Permite agregar personas sin relación familiar declarada. Se mostrarán advertencias."
                            arrow
                          >
                            <Typography variant="body2" sx={{ cursor: 'help' }}>
                              Permitir miembros sin relación familiar
                            </Typography>
                          </Tooltip>
                        }
                        sx={{ mt: 1.5 }}
                      />
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>

            {/* Descuento Grupal */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Descuento Grupal
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Controller
                    name="descuentoGrupal"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type="number"
                        fullWidth
                        label="Descuento (%)"
                        error={!!errors.descuentoGrupal}
                        helperText={errors.descuentoGrupal?.message}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Percent />
                            </InputAdornment>
                          ),
                          inputProps: { min: 0, max: 100, step: 0.5 },
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                  <Box sx={{ px: 2, pt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Ajustar descuento
                    </Typography>
                    <Controller
                      name="descuentoGrupal"
                      control={control}
                      render={({ field }) => (
                        <Slider
                          {...field}
                          value={typeof field.value === 'number' ? field.value : 0}
                          min={0}
                          max={100}
                          step={5}
                          marks={[
                            { value: 0, label: '0%' },
                            { value: 25, label: '25%' },
                            { value: 50, label: '50%' },
                            { value: 75, label: '75%' },
                            { value: 100, label: '100%' },
                          ]}
                          valueLabelDisplay="auto"
                          valueLabelFormat={(value) => `${value}%`}
                        />
                      )}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Configuración Avanzada */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                <Settings fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                Configuración Avanzada
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="facturacionConjunta"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label={
                          <Box>
                            <Typography variant="body2">Facturación Conjunta</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Todo se factura al referente
                            </Typography>
                          </Box>
                        }
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="descuentoProgresivo"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            {...field}
                            checked={field.value}
                            disabled={descuentoGrupal === 0}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2">Descuento Progresivo</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Aumenta por cantidad de miembros
                            </Typography>
                          </Box>
                        }
                      />
                    )}
                  />
                  {errors.descuentoProgresivo && (
                    <Typography variant="caption" color="error">
                      {errors.descuentoProgresivo.message}
                    </Typography>
                  )}
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="limiteCuotas"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type="number"
                        fullWidth
                        label="Límite de Cuotas con Descuento"
                        disabled={descuentoGrupal === 0}
                        error={!!errors.limiteCuotas}
                        helperText={
                          errors.limiteCuotas?.message ||
                          '0 = sin límite'
                        }
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <AttachMoney />
                            </InputAdornment>
                          ),
                          inputProps: { min: 0, max: 999 },
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="activo"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label={
                          <Box>
                            <Typography variant="body2">Estado Activo</Typography>
                            <Typography variant="caption" color="text.secondary">
                              El grupo está activo y operativo
                            </Typography>
                          </Box>
                        }
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Resumen */}
            {descuentoGrupal > 0 && (
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Resumen:</strong> Este grupo tendrá un descuento del{' '}
                  <strong>{descuentoGrupal}%</strong>
                  {descuentoProgresivo && ' que aumentará progresivamente'}
                  {limiteCuotas > 0 && ` limitado a ${limiteCuotas} cuotas`}.
                </Typography>
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading} startIcon={<Close />}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Save />}
          >
            {isEditing ? 'Actualizar' : 'Crear Grupo'}
          </Button>
        </DialogActions>
      </form>

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
              <strong>Opción 1:</strong> Crear primero la relación familiar en el módulo de Familiares.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              <strong>Opción 2:</strong> Permitir agregar el miembro sin relación familiar (se generarán advertencias).
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

export default GrupoFamiliarDialog;
