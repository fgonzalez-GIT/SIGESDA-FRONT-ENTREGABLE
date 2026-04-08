import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Typography,
    Box,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    Chip,
    Alert
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch } from '../../store';
import { ajustesCuotaService } from '../../services/ajustesCuotaService';
import { AjusteCuotaSocio } from '../../types/cuota.types';
import { createAjusteSchema, type CreateAjusteFormData } from '../../schemas';

interface GestionAjustesModalProps {
    open: boolean;
    onClose: () => void;
    personaId: number | null;
    nombrePersona?: string;
}

const GestionAjustesModal: React.FC<GestionAjustesModalProps> = ({ open, onClose, personaId, nombrePersona }) => {
    const dispatch = useAppDispatch();
    const [ajustes, setAjustes] = useState<AjusteCuotaSocio[]>([]);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // React Hook Form con Zod Resolver
    const { control, handleSubmit, formState: { errors }, reset, watch } = useForm<CreateAjusteFormData>({
        resolver: zodResolver(createAjusteSchema),
        defaultValues: {
            personaId: personaId || 0,
            tipoAjuste: 'DESCUENTO_PORCENTAJE',
            valor: 0,
            concepto: '',
            motivo: '',
            fechaInicio: new Date().toISOString(),
            fechaFin: null,
            aplicaA: 'TOTAL_CUOTA',
            itemsEspecificos: [],
            activo: true
        }
    });

    const watchTipoAjuste = watch('tipoAjuste');
    const watchAplicaA = watch('aplicaA');

    useEffect(() => {
        if (open && personaId) {
            loadAjustes();
            // Update personaId in form when modal opens
            reset(prev => ({ ...prev, personaId }));
        }
    }, [open, personaId, reset]);

    const loadAjustes = async () => {
        if (!personaId) return;
        setLoading(true);
        try {
            const data = await ajustesCuotaService.getAjustesPorPersona(personaId, false); // Get all (active and inactive)
            setAjustes(data);
        } catch (err) {
            console.error(err);
            setError('Error al cargar ajustes');
        } finally {
            setLoading(false);
        }
    };

    const onFormSubmit = async (data: CreateAjusteFormData) => {
        if (!personaId) return;
        try {
            await ajustesCuotaService.createAjuste({
                ...data,
                personaId,
            });
            setIsEditing(false);
            loadAjustes();
            // Reset form
            reset({
                personaId,
                tipoAjuste: 'DESCUENTO_PORCENTAJE',
                valor: 0,
                concepto: '',
                motivo: '',
                fechaInicio: new Date().toISOString(),
                fechaFin: null,
                aplicaA: 'TOTAL_CUOTA',
                itemsEspecificos: [],
                activo: true
            });
        } catch (err: any) {
            console.error(err);
            setError(err?.response?.data?.error || 'Error al crear ajuste');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Eliminar este ajuste?')) {
            try {
                await ajustesCuotaService.deleteAjuste(id);
                loadAjustes();
            } catch (err) {
                console.error(err);
                setError('Error al eliminar ajuste');
            }
        }
    };

    const getTipoLabel = (tipo: string) => {
        switch (tipo) {
            case 'DESCUENTO_PORCENTAJE': return 'Desc. %';
            case 'DESCUENTO_FIJO': return 'Desc. Fijo';
            case 'RECARGO_PORCENTAJE': return 'Recargo %';
            case 'RECARGO_FIJO': return 'Recargo Fijo';
            case 'MONTO_FIJO_TOTAL': return 'Monto Fijo Total';
            default: return tipo;
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        reset({
            personaId: personaId || 0,
            tipoAjuste: 'DESCUENTO_PORCENTAJE',
            valor: 0,
            concepto: '',
            motivo: '',
            fechaInicio: new Date().toISOString(),
            fechaFin: null,
            aplicaA: 'TOTAL_CUOTA',
            itemsEspecificos: [],
            activo: true
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Ajustes de Cuota
                {nombrePersona && <Typography variant="subtitle2" color="text.secondary">Socio: {nombrePersona}</Typography>}
            </DialogTitle>
            <DialogContent dividers>
                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

                {!isEditing ? (
                    <Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6">Ajustes Activos</Typography>
                            <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => setIsEditing(true)}>
                                Nuevo Ajuste
                            </Button>
                        </Box>
                        <List>
                            {ajustes.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" align="center">No hay ajustes registrados.</Typography>
                            ) : (
                                ajustes.map((ajuste) => (
                                    <ListItem key={ajuste.id} divider>
                                        <ListItemText
                                            primary={
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    {ajuste.concepto}
                                                    {!ajuste.activo && <Chip size="small" label="Inactivo" />}
                                                </Box>
                                            }
                                            secondary={`${getTipoLabel(ajuste.tipoAjuste)}: ${ajuste.valor} - ${ajuste.aplicaA}`}
                                        />
                                        <ListItemSecondaryAction>
                                            <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(ajuste.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))
                            )}
                        </List>
                    </Box>
                ) : (
                    <form onSubmit={handleSubmit(onFormSubmit)}>
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            {/* Concepto */}
                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="concepto"
                                    control={control}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            label="Concepto"
                                            required
                                            error={!!error}
                                            helperText={error?.message}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Tipo de Ajuste */}
                            <Grid size={{ xs: 6 }}>
                                <Controller
                                    name="tipoAjuste"
                                    control={control}
                                    render={({ field, fieldState: { error } }) => (
                                        <FormControl fullWidth required error={!!error}>
                                            <InputLabel>Tipo de Ajuste</InputLabel>
                                            <Select {...field} label="Tipo de Ajuste">
                                                <MenuItem value="DESCUENTO_PORCENTAJE">Descuento %</MenuItem>
                                                <MenuItem value="DESCUENTO_FIJO">Descuento Fijo</MenuItem>
                                                <MenuItem value="RECARGO_PORCENTAJE">Recargo %</MenuItem>
                                                <MenuItem value="RECARGO_FIJO">Recargo Fijo</MenuItem>
                                                <MenuItem value="MONTO_FIJO_TOTAL">Monto Fijo Total</MenuItem>
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

                            {/* Valor */}
                            <Grid size={{ xs: 6 }}>
                                <Controller
                                    name="valor"
                                    control={control}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            label={watchTipoAjuste?.includes('PORCENTAJE') ? 'Porcentaje (%)' : 'Valor ($)'}
                                            type="number"
                                            required
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            error={!!error}
                                            helperText={error?.message}
                                            inputProps={{
                                                min: 0,
                                                max: watchTipoAjuste?.includes('PORCENTAJE') ? 100 : undefined,
                                                step: watchTipoAjuste?.includes('PORCENTAJE') ? 1 : 0.01
                                            }}
                                        />
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

                            {/* Fecha Fin (opcional) */}
                            <Grid size={{ xs: 6 }}>
                                <Controller
                                    name="fechaFin"
                                    control={control}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            label="Fecha Fin (opcional)"
                                            type="date"
                                            slotProps={{ inputLabel: { shrink: true } }}
                                            value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
                                            error={!!error}
                                            helperText={error?.message || 'Dejar vacío para ajuste permanente'}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Aplica A */}
                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="aplicaA"
                                    control={control}
                                    render={({ field, fieldState: { error } }) => (
                                        <FormControl fullWidth required error={!!error}>
                                            <InputLabel>Aplica A</InputLabel>
                                            <Select {...field} label="Aplica A">
                                                <MenuItem value="TOTAL_CUOTA">Total Cuota</MenuItem>
                                                <MenuItem value="BASE">Solo Base</MenuItem>
                                                <MenuItem value="ACTIVIDADES">Solo Actividades</MenuItem>
                                                <MenuItem value="ITEMS_ESPECIFICOS">Ítems Específicos</MenuItem>
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

                            {/* Ítems Específicos - mostrar solo si aplicaA es ITEMS_ESPECIFICOS */}
                            {watchAplicaA === 'ITEMS_ESPECIFICOS' && (
                                <Grid size={{ xs: 12 }}>
                                    <Alert severity="info" sx={{ mt: 1 }}>
                                        Nota: Deberá especificar los ítems al editar este ajuste
                                    </Alert>
                                </Grid>
                            )}

                            {/* Motivo */}
                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="motivo"
                                    control={control}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            multiline
                                            rows={2}
                                            label="Motivo (Opcional)"
                                            error={!!error}
                                            helperText={error?.message || 'Explicación interna del ajuste'}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </form>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={() => isEditing ? handleCancelEdit() : onClose()}>
                    {isEditing ? 'Cancelar' : 'Cerrar'}
                </Button>
                {isEditing && (
                    <Button variant="contained" onClick={handleSubmit(onFormSubmit)}>
                        Guardar
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default GestionAjustesModal;
