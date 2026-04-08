import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    Alert,
    Typography,
    Box,
    Paper,
    Chip
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch } from '../../store';
import { exencionesService } from '../../services/exencionesService';
import { ExencionCuota } from '../../types/cuota.types';
import { createExencionSchema, type CreateExencionFormData } from '../../schemas';

interface GestionExencionesModalProps {
    open: boolean;
    onClose: () => void;
    personaId: number | null;
    nombrePersona?: string;
}

const GestionExencionesModal: React.FC<GestionExencionesModalProps> = ({ open, onClose, personaId, nombrePersona }) => {
    const [exencionActiva, setExencionActiva] = useState<ExencionCuota | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // React Hook Form con Zod Resolver
    const { control, handleSubmit, formState: { errors }, reset, watch } = useForm<CreateExencionFormData>({
        resolver: zodResolver(createExencionSchema),
        defaultValues: {
            personaId: personaId || 0,
            tipoExencion: 'TOTAL',
            porcentajeExencion: 100,
            motivoExencion: 'SITUACION_ECONOMICA',
            descripcion: '',
            documentoRespaldo: null,
            fechaInicio: new Date().toISOString(),
            fechaFin: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString(),
            estado: 'PENDIENTE_APROBACION',
            activa: true
        }
    });

    const watchTipoExencion = watch('tipoExencion');

    useEffect(() => {
        if (open && personaId) {
            checkStatus();
            // Update personaId in form when modal opens
            reset(prev => ({ ...prev, personaId }));
        }
    }, [open, personaId, reset]);

    // Auto-update porcentajeExencion when tipoExencion changes
    useEffect(() => {
        if (watchTipoExencion === 'TOTAL') {
            reset((prev) => ({ ...prev, porcentajeExencion: 100 }));
        }
    }, [watchTipoExencion, reset]);

    const checkStatus = async () => {
        if (!personaId) return;
        setLoading(true);
        try {
            const result = await exencionesService.checkExencionActiva(personaId);
            if (result.tieneExencion && result.exencion) {
                setExencionActiva(result.exencion);
                setIsCreating(false);
            } else {
                setExencionActiva(null);
            }
        } catch (err) {
            console.error(err);
            setError('Error al verificar estado de exenciones');
        } finally {
            setLoading(false);
        }
    };

    const onFormSubmit = async (data: CreateExencionFormData) => {
        if (!personaId) return;
        try {
            await exencionesService.solicitarExencion({
                ...data,
                personaId
            });
            await checkStatus();
            setIsCreating(false);
            // Reset form
            reset({
                personaId,
                tipoExencion: 'TOTAL',
                porcentajeExencion: 100,
                motivoExencion: 'SITUACION_ECONOMICA',
                descripcion: '',
                documentoRespaldo: null,
                fechaInicio: new Date().toISOString(),
                fechaFin: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString(),
                estado: 'PENDIENTE_APROBACION',
                activa: true
            });
        } catch (err: any) {
            console.error(err);
            setError(err?.response?.data?.error || 'Error al solicitar exención');
        }
    };

    const handleRevocar = async () => {
        if (!exencionActiva) return;
        if (window.confirm('¿Revocar exención vigente?')) {
            try {
                await exencionesService.revocarExencion(exencionActiva.id, {
                    usuario: 'Current User', // Should come from auth context
                    motivoRevocacion: 'Solicitado por administrador'
                });
                checkStatus();
            } catch (err) {
                console.error(err);
                setError('Error al revocar exención');
            }
        }
    };

    const handleCancelCreating = () => {
        setIsCreating(false);
        reset({
            personaId: personaId || 0,
            tipoExencion: 'TOTAL',
            porcentajeExencion: 100,
            motivoExencion: 'SITUACION_ECONOMICA',
            descripcion: '',
            documentoRespaldo: null,
            fechaInicio: new Date().toISOString(),
            fechaFin: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString(),
            estado: 'PENDIENTE_APROBACION',
            activa: true
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Gestión de Exenciones
                {nombrePersona && <Typography variant="subtitle2" color="text.secondary">Socio: {nombrePersona}</Typography>}
            </DialogTitle>
            <DialogContent dividers>
                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

                {exencionActiva ? (
                    <Box component={Paper} variant="outlined" sx={{ p: 2, bgcolor: 'info.lighter' }}>
                        <Typography variant="h6" color="primary" gutterBottom>
                            Exención Vigente
                            <Chip size="small" label={exencionActiva.estado} color="success" sx={{ ml: 1 }} />
                        </Typography>
                        <Grid container spacing={1}>
                            <Grid size={{ xs: 6 }}>
                                <Typography variant="body2" color="text.secondary">Tipo:</Typography>
                                <Typography variant="body1">{exencionActiva.tipoExencion} ({exencionActiva.porcentaje}%)</Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <Typography variant="body2" color="text.secondary">Motivo:</Typography>
                                <Typography variant="body1">{exencionActiva.motivoExencion.replace('_', ' ')}</Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <Typography variant="body2" color="text.secondary">Vigencia:</Typography>
                                <Typography variant="body1">
                                    {new Date(exencionActiva.fechaInicio).toLocaleDateString()} -
                                    {exencionActiva.fechaFin ? new Date(exencionActiva.fechaFin).toLocaleDateString() : 'Indefinido'}
                                </Typography>
                            </Grid>
                        </Grid>
                        <Box sx={{ mt: 2 }}>
                            <Button variant="outlined" color="error" onClick={handleRevocar}>
                                Revocar Exención
                            </Button>
                        </Box>
                    </Box>
                ) : (
                    <Box>
                        {!isCreating ? (
                            <Box textAlign="center" py={3}>
                                <Typography gutterBottom>El socio no posee exenciones activas.</Typography>
                                <Button variant="contained" onClick={() => setIsCreating(true)}>
                                    Solicitar Nueva Exención
                                </Button>
                            </Box>
                        ) : (
                            <form onSubmit={handleSubmit(onFormSubmit)}>
                                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                                    <Grid size={{ xs: 12 }}>
                                        <Alert severity="info" sx={{ mb: 1 }}>
                                            La exención se creará en estado PENDIENTE_APROBACION y requerirá aprobación.
                                        </Alert>
                                    </Grid>

                                    {/* Tipo de Exención */}
                                    <Grid size={{ xs: 6 }}>
                                        <Controller
                                            name="tipoExencion"
                                            control={control}
                                            render={({ field, fieldState: { error } }) => (
                                                <FormControl fullWidth required error={!!error}>
                                                    <InputLabel>Tipo</InputLabel>
                                                    <Select {...field} label="Tipo">
                                                        <MenuItem value="TOTAL">Total (100%)</MenuItem>
                                                        <MenuItem value="PARCIAL">Parcial</MenuItem>
                                                    </Select>
                                                    {error && (
                                                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                                                            {error.message}
                                                        </Typography>
                                                    )}
                                                </FormControl>
                                            )}
                                        />
                                    </Grid>

                                    {/* Porcentaje */}
                                    <Grid size={{ xs: 6 }}>
                                        <Controller
                                            name="porcentajeExencion"
                                            control={control}
                                            render={({ field, fieldState: { error } }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label="Porcentaje (%)"
                                                    type="number"
                                                    required
                                                    disabled={watchTipoExencion === 'TOTAL'}
                                                    value={watchTipoExencion === 'TOTAL' ? 100 : field.value}
                                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                                    error={!!error}
                                                    helperText={error?.message}
                                                    inputProps={{
                                                        min: 1,
                                                        max: 100,
                                                        step: 1
                                                    }}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    {/* Motivo */}
                                    <Grid size={{ xs: 12 }}>
                                        <Controller
                                            name="motivoExencion"
                                            control={control}
                                            render={({ field, fieldState: { error } }) => (
                                                <FormControl fullWidth required error={!!error}>
                                                    <InputLabel>Motivo</InputLabel>
                                                    <Select {...field} label="Motivo">
                                                        <MenuItem value="BECA">Beca</MenuItem>
                                                        <MenuItem value="SOCIO_FUNDADOR">Socio Fundador</MenuItem>
                                                        <MenuItem value="SOCIO_HONORARIO">Socio Honorario</MenuItem>
                                                        <MenuItem value="SITUACION_ECONOMICA">Situación Económica</MenuItem>
                                                        <MenuItem value="MERITO_ACADEMICO">Mérito Académico</MenuItem>
                                                        <MenuItem value="COLABORACION_INSTITUCIONAL">Colaboración Institucional</MenuItem>
                                                        <MenuItem value="EMERGENCIA_FAMILIAR">Emergencia Familiar</MenuItem>
                                                        <MenuItem value="OTRO">Otro</MenuItem>
                                                    </Select>
                                                    {error && (
                                                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                                                            {error.message}
                                                        </Typography>
                                                    )}
                                                </FormControl>
                                            )}
                                        />
                                    </Grid>

                                    {/* Fecha Inicio */}
                                    <Grid size={{ xs: 6 }}>
                                        <Controller
                                            name="fechaInicio"
                                            control={control}
                                            render={({ field, fieldState: { error } }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label="Fecha Inicio"
                                                    type="date"
                                                    required
                                                    slotProps={{ inputLabel: { shrink: true } }}
                                                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                                    onChange={(e) => field.onChange(new Date(e.target.value).toISOString())}
                                                    error={!!error}
                                                    helperText={error?.message}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    {/* Fecha Fin */}
                                    <Grid size={{ xs: 6 }}>
                                        <Controller
                                            name="fechaFin"
                                            control={control}
                                            render={({ field, fieldState: { error } }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label="Fecha Fin"
                                                    type="date"
                                                    slotProps={{ inputLabel: { shrink: true } }}
                                                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
                                                    error={!!error}
                                                    helperText={error?.message || 'Período máximo: 2 años'}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    {/* Descripción / Justificación */}
                                    <Grid size={{ xs: 12 }}>
                                        <Controller
                                            name="descripcion"
                                            control={control}
                                            render={({ field, fieldState: { error } }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    multiline
                                                    rows={3}
                                                    label="Justificación / Descripción"
                                                    required
                                                    error={!!error}
                                                    helperText={error?.message || 'Explique detalladamente el motivo de la exención (mínimo 10 caracteres)'}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    {/* Documento de Respaldo */}
                                    <Grid size={{ xs: 12 }}>
                                        <Controller
                                            name="documentoRespaldo"
                                            control={control}
                                            render={({ field, fieldState: { error } }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label="Documento de Respaldo (opcional)"
                                                    placeholder="Ruta o referencia al documento"
                                                    error={!!error}
                                                    helperText={error?.message || 'Ej: /documentos/beca_2024.pdf'}
                                                />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                            </form>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={() => isCreating ? handleCancelCreating() : onClose()}>
                    {isCreating ? 'Cancelar' : 'Cerrar'}
                </Button>
                {isCreating && !exencionActiva && (
                    <Button variant="contained" onClick={handleSubmit(onFormSubmit)}>
                        Solicitar
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default GestionExencionesModal;
