/**
 * @deprecated
 * Este componente está deprecado desde v1.18.0 (Marzo 2026)
 *
 * Usar en su lugar:
 * - `GeneracionCuotasModal` con tab "Masivo"
 *
 * Este archivo se mantendrá por compatibilidad pero será removido
 * en una versión futura (estimado: v2.0.0)
 *
 * @see /src/components/Cuotas/GeneracionCuotasModal.tsx
 */

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stepper,
    Step,
    StepLabel,
    Typography,
    Box,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    FormControlLabel,
    Switch,
    Alert,
    CircularProgress,
    Paper,
    Divider,
    Chip,
    FormHelperText,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Error as ErrorIcon
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch, useAppSelector } from '../../store';
import { generarCuotasMasivas, regenerarCuotas, validarGeneracion, clearValidacion } from '../../store/slices/cuotasSlice';
import { fetchCategorias } from '../../store/slices/categoriasSlice';
import { GenerarCuotasRequest } from '../../types/cuota.types';
import { FEATURES } from '../../config/features';
import { generarCuotasV2Schema, type GenerarCuotasV2FormData } from '../../schemas';
import { getCategoriaSocio } from '../../utils/cuota.helpers';
import cuotasService from '../../services/cuotasService';

interface GeneracionMasivaModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const steps = ['Configuración', 'Validación', 'Generación'];

/**
 * V2: Helper function to group socios by category
 * Usa getCategoriaSocio() para obtener la categoría desde tipos[]
 */
const getCategoriaBreakdown = (detallesSocios: any[] = []) => {
    const breakdown: Record<string, number> = {};

    detallesSocios.forEach((socio) => {
        // V2: Usar helper para obtener categoría desde tipos[]
        const categoria = getCategoriaSocio(socio);
        const categoriaNombre = categoria?.nombre || 'Sin Categoría';
        breakdown[categoriaNombre] = (breakdown[categoriaNombre] || 0) + 1;
    });

    return breakdown;
};

const GeneracionMasivaModal: React.FC<GeneracionMasivaModalProps> = ({ open, onClose, onSuccess }) => {
    const dispatch = useAppDispatch();
    const { categorias } = useAppSelector(state => state.categorias);
    const { validacionGeneracion, loading, error, operationLoading } = useAppSelector(state => state.cuotas);

    const [activeStep, setActiveStep] = useState(0);
    const [resultData, setResultData] = useState<any>(null);
    const [showConfirmRegenerar, setShowConfirmRegenerar] = useState(false);
    // Estado para personas seleccionadas (IDs)
    const [personasSeleccionadas, setPersonasSeleccionadas] = useState<number[]>([]);

    // React Hook Form con Zod
    const { control, handleSubmit, watch, reset, formState: { errors, isValid } } = useForm<GenerarCuotasV2FormData>({
        resolver: zodResolver(generarCuotasV2Schema),
        mode: 'onChange',
        defaultValues: {
            mes: new Date().getMonth() + 1,
            anio: new Date().getFullYear(),
            categoriaIds: undefined,
            aplicarDescuentos: true,
            aplicarMotorReglas: true,
            incluirInactivos: false,
            soloNuevas: true,
            observaciones: ''
        }
    });

    // Watch form values for validation step
    const formValues = watch();

    useEffect(() => {
        if (open) {
            // Warning de deprecación
            console.warn(
                '[DEPRECATION] GeneracionMasivaModal está deprecado desde v1.18.0. ' +
                'Usar GeneracionCuotasModal con tab "Masivo".'
            );

            dispatch(fetchCategorias({}));
            dispatch(clearValidacion());
            setActiveStep(0);
            setResultData(null);
            setPersonasSeleccionadas([]);
            reset(); // Reset form on open
        }
    }, [open, dispatch, reset]);

    // Inicializar selección cuando llega la validación
    useEffect(() => {
        if (validacionGeneracion?.detallesSocios && personasSeleccionadas.length === 0) {
            // Por defecto, seleccionar todas las personas
            const todosLosIds = validacionGeneracion.detallesSocios.map(s => s.id);
            setPersonasSeleccionadas(todosLosIds);
        }
    }, [validacionGeneracion, personasSeleccionadas.length]);

    const handleNext = async () => {
        if (activeStep === 0) {
            // Ir a validación
            dispatch(validarGeneracion({
                mes: formValues.mes,
                anio: formValues.anio,
                categoriaIds: formValues.categoriaIds && formValues.categoriaIds.length > 0 ? formValues.categoriaIds : undefined
            }));
            setActiveStep(1);
        } else if (activeStep === 1) {
            // Ejecutar generación usando endpoint batch con personas seleccionadas
            try {
                // Usar endpoint batch moderno con personas seleccionadas
                const result = await cuotasService.generarCuotasBatch({
                    mes: formValues.mes,
                    anio: formValues.anio,
                    personaIds: personasSeleccionadas.length > 0 ? personasSeleccionadas : undefined,
                    observaciones: formValues.observaciones
                });

                // Transformar resultado al formato esperado por la UI
                setResultData({
                    generated: result.cuotasGeneradas,
                    errors: result.errores,
                    cuotas: result.cuotas,
                    performance: result.performance
                });

                setActiveStep(2);
                if (onSuccess) onSuccess();
            } catch (err: any) {
                console.error('Error en generación batch:', err);
                // Fallback al método anterior si falla batch
                const payload = {
                    ...formValues,
                    categoriaIds: formValues.categoriaIds && formValues.categoriaIds.length > 0 ? formValues.categoriaIds : undefined
                };
                const result = await dispatch(generarCuotasMasivas(payload as any)).unwrap();
                setResultData(result);
                setActiveStep(2);
                if (onSuccess) onSuccess();
            }
        } else {
            onClose();
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleRegenerar = () => {
        setShowConfirmRegenerar(true);
    };

    const handleConfirmRegenerar = async () => {
        setShowConfirmRegenerar(false);
        const payload = {
            ...formValues,
            categoriaIds: formValues.categoriaIds && formValues.categoriaIds.length > 0 ? formValues.categoriaIds : undefined,
            confirmarRegeneracion: true
        };
        const result = await dispatch(regenerarCuotas(payload as any)).unwrap();
        setResultData(result);
        setActiveStep(2);
        if (onSuccess) onSuccess();
    };

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0: // Configuración
                return (
                    <Box sx={{ mt: 2 }}>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="mes"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth error={!!errors.mes}>
                                            <InputLabel>Mes</InputLabel>
                                            <Select {...field} label="Mes">
                                                {[...Array(12)].map((_, i) => (
                                                    <MenuItem key={i + 1} value={i + 1}>
                                                        {new Date(0, i).toLocaleString('es-ES', { month: 'long' }).toUpperCase()}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                            {errors.mes && <FormHelperText>{errors.mes.message}</FormHelperText>}
                                        </FormControl>
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="anio"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            label="Año"
                                            type="number"
                                            error={!!errors.anio}
                                            helperText={errors.anio?.message}
                                            onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="categoriaIds"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth error={!!errors.categoriaIds}>
                                            <InputLabel>Categorías (Opcional - Vacío para todas)</InputLabel>
                                            <Select
                                                {...field}
                                                multiple
                                                label="Categorías (Opcional - Vacío para todas)"
                                                value={field.value || []}
                                                renderValue={(selected) => (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {(selected as number[]).map((value) => (
                                                            <Chip key={value} label={categorias.find(c => c.id === value)?.nombre} />
                                                        ))}
                                                    </Box>
                                                )}
                                            >
                                                {categorias.map((cat) => (
                                                    <MenuItem key={cat.id} value={cat.id}>
                                                        {cat.nombre}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                            {errors.categoriaIds && <FormHelperText>{errors.categoriaIds.message}</FormHelperText>}
                                        </FormControl>
                                    )}
                                />
                            </Grid>
                            {FEATURES.MOTOR_DESCUENTOS && (
                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="aplicarDescuentos"
                                        control={control}
                                        render={({ field }) => (
                                            <Box>
                                                <FormControlLabel
                                                    control={<Switch checked={field.value} onChange={field.onChange} />}
                                                    label="Aplicar Motor de Descuentos Automáticamente"
                                                />
                                                <Typography variant="caption" display="block" color="text.secondary">
                                                    Si se desactiva, se generarán las cuotas base + actividades sin calcular descuentos.
                                                </Typography>
                                            </Box>
                                        )}
                                    />
                                </Grid>
                            )}
                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="observaciones"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            multiline
                                            rows={2}
                                            label="Observaciones"
                                            error={!!errors.observaciones}
                                            helperText={errors.observaciones?.message}
                                            value={field.value || ''}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                );
            case 1: // Validación
                if (loading) {
                    return (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    );
                }
                if (!validacionGeneracion) return <Typography>No se pudo validar.</Typography>;

                return (
                    <Box sx={{ mt: 2 }}>
                        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: validacionGeneracion.cuotasExistentes > 0 ? 'warning.light' : 'success.light' }}>
                            <Typography variant="h6" gutterBottom>
                                {validacionGeneracion.cuotasExistentes > 0 ? 'Cuotas Duplicadas' : 'Listo para Generar'}
                            </Typography>
                            <Typography variant="body1">
                                <strong>Socios pendientes:</strong> {validacionGeneracion.sociosPendientes}
                            </Typography>
                            {validacionGeneracion.cuotasExistentes > 0 && (
                                <>
                                    <Typography variant="body2" color="warning.dark" sx={{ mt: 1 }}>
                                        <strong>Ya existen {validacionGeneracion.cuotasExistentes} cuotas generadas para este período.</strong>
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        Para continuar, puede usar la opción "Regenerar" que eliminará las cuotas existentes y generará nuevas.
                                    </Typography>
                                </>
                            )}
                        </Paper>

                        {/* Category Breakdown Section */}
                        {validacionGeneracion.detallesSocios && validacionGeneracion.detallesSocios.length > 0 && (() => {
                            const categoriaBreakdown = getCategoriaBreakdown(validacionGeneracion.detallesSocios);
                            const totalSocios = Object.values(categoriaBreakdown).reduce((sum, count) => sum + count, 0);

                            return (
                                <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'info.lighter' }}>
                                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                                        📊 Distribución por Categoría
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                                        {Object.entries(categoriaBreakdown)
                                            .sort(([, countA], [, countB]) => countB - countA)
                                            .map(([categoria, count]) => (
                                                <Chip
                                                    key={categoria}
                                                    label={`${categoria}: ${count}`}
                                                    color="primary"
                                                    variant="outlined"
                                                    size="medium"
                                                />
                                            ))}
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                                        Total verificado: {totalSocios} socios
                                    </Typography>

                                    {/* Warning if filter doesn't match breakdown (backend bug indicator) */}
                                    {formValues.categoriaIds && formValues.categoriaIds.length > 0 && Object.keys(categoriaBreakdown).length > formValues.categoriaIds.length && (
                                        <Alert severity="warning" sx={{ mt: 1.5 }}>
                                            <Typography variant="body2">
                                                <strong>⚠️ Advertencia:</strong> Se detectaron {Object.keys(categoriaBreakdown).length} categorías diferentes,
                                                pero solo se filtraron {formValues.categoriaIds.length} categoría(s).
                                                Esto puede indicar un problema con el filtro del backend.
                                            </Typography>
                                        </Alert>
                                    )}
                                </Paper>
                            );
                        })()}

                        {/* Tabla de Selección de Personas */}
                        {validacionGeneracion.detallesSocios && validacionGeneracion.detallesSocios.length > 0 && (
                            <Paper variant="outlined" sx={{ mb: 2 }}>
                                <Box sx={{ p: 2, bgcolor: 'primary.lighter', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                        ✓ Seleccionar Personas a Generar
                                    </Typography>
                                    <Box>
                                        <Button
                                            size="small"
                                            onClick={() => setPersonasSeleccionadas(validacionGeneracion.detallesSocios.map(s => s.id))}
                                        >
                                            Todas
                                        </Button>
                                        <Button
                                            size="small"
                                            onClick={() => setPersonasSeleccionadas([])}
                                        >
                                            Ninguna
                                        </Button>
                                    </Box>
                                </Box>
                                <TableContainer sx={{ maxHeight: 400 }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={personasSeleccionadas.length === validacionGeneracion.detallesSocios.length}
                                                        indeterminate={
                                                            personasSeleccionadas.length > 0 &&
                                                            personasSeleccionadas.length < validacionGeneracion.detallesSocios.length
                                                        }
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setPersonasSeleccionadas(validacionGeneracion.detallesSocios.map(s => s.id));
                                                            } else {
                                                                setPersonasSeleccionadas([]);
                                                            }
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>Nombre</TableCell>
                                                <TableCell>N° Socio</TableCell>
                                                <TableCell>Categoría</TableCell>
                                                <TableCell align="right">Monto Total</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {validacionGeneracion.detallesSocios.map((socio) => {
                                                const isSelected = personasSeleccionadas.includes(socio.id);
                                                return (
                                                    <TableRow
                                                        key={socio.id}
                                                        hover
                                                        selected={isSelected}
                                                    >
                                                        <TableCell padding="checkbox">
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onChange={() => {
                                                                    if (isSelected) {
                                                                        setPersonasSeleccionadas(prev => prev.filter(id => id !== socio.id));
                                                                    } else {
                                                                        setPersonasSeleccionadas(prev => [...prev, socio.id]);
                                                                    }
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>{socio.nombre}</TableCell>
                                                        <TableCell>{socio.numeroSocio || '-'}</TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={socio.categoria?.nombre || 'Sin categoría'}
                                                                size="small"
                                                                color="primary"
                                                                variant="outlined"
                                                            />
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            ${socio.montoTotal.toLocaleString()}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>{personasSeleccionadas.length}</strong> de <strong>{validacionGeneracion.detallesSocios.length}</strong> personas seleccionadas
                                    </Typography>
                                </Box>
                            </Paper>
                        )}

                        {/* Resumen de Totales */}
                        {validacionGeneracion.detallesSocios && validacionGeneracion.detallesSocios.length > 0 && (() => {
                            const sociosSeleccionados = validacionGeneracion.detallesSocios.filter(s => personasSeleccionadas.includes(s.id));
                            const totalBase = sociosSeleccionados.reduce((sum, s) => sum + s.montoBase, 0);
                            const totalActividades = sociosSeleccionados.reduce((sum, s) => sum + s.montoActividades, 0);
                            const totalGeneral = sociosSeleccionados.reduce((sum, s) => sum + s.montoTotal, 0);

                            return (
                                <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'success.lighter' }}>
                                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                                        💰 Resumen de Totales
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <Typography variant="caption" color="text.secondary">Monto Base (Cuotas)</Typography>
                                            <Typography variant="h6">${totalBase.toLocaleString()}</Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <Typography variant="caption" color="text.secondary">Monto Actividades</Typography>
                                            <Typography variant="h6">${totalActividades.toLocaleString()}</Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <Typography variant="caption" color="text.secondary">Total General</Typography>
                                            <Typography variant="h6" color="primary.main">${totalGeneral.toLocaleString()}</Typography>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            );
                        })()}

                        {validacionGeneracion.warnings && validacionGeneracion.warnings.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" color="warning.main">Advertencias:</Typography>
                                {validacionGeneracion.warnings.map((w, i) => (
                                    <Alert severity="warning" key={i} sx={{ mb: 1 }}>{w}</Alert>
                                ))}
                            </Box>
                        )}

                        <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
                            Se generarán las cuotas para {validacionGeneracion.sociosPendientes} socios.
                            {formValues.aplicarDescuentos && ' Se aplicarán las reglas de descuento configuradas.'}
                        </Typography>
                    </Box>
                );
            case 2: // Resultado
                if (operationLoading) {
                    return (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
                            <CircularProgress sx={{ mb: 2 }} />
                            <Typography>Generando cuotas masivamente, por favor espere...</Typography>
                        </Box>
                    );
                }
                if (error) {
                    return (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                            <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
                            <Typography variant="h6" color="error">Error en la generación</Typography>
                            <Typography>{error}</Typography>
                        </Box>
                    );
                }
                return (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
                        <Typography variant="h5" gutterBottom>¡Generación Completa!</Typography>
                        <Typography variant="body1">
                            Se han generado <strong>{resultData?.generated}</strong> cuotas exitosamente.
                        </Typography>

                        {FEATURES.MOTOR_DESCUENTOS && resultData?.resumenDescuentos && (
                            <Paper variant="outlined" sx={{ mt: 3, p: 2, textAlign: 'left' }}>
                                <Typography variant="subtitle2" gutterBottom>Resumen de Descuentos:</Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="caption">Socios beneficiados</Typography>
                                        <Typography variant="h6">{resultData.resumenDescuentos.totalSociosConDescuento}</Typography>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="caption">Total descontado</Typography>
                                        <Typography variant="h6">${resultData.resumenDescuentos.montoTotalDescuentos}</Typography>
                                    </Grid>
                                </Grid>
                            </Paper>
                        )}
                    </Box>
                );
            default:
                return 'Paso desconocido';
        }
    };

    return (
        <>
        <Dialog open={open} onClose={activeStep === 2 ? onClose : undefined} maxWidth="md" fullWidth>
            <DialogTitle>Generación Masiva de Cuotas</DialogTitle>
            <DialogContent>
                <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 2 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
                <Divider />
                {renderStepContent(activeStep)}
            </DialogContent>
            <DialogActions>
                {activeStep === 0 && (
                    <Button onClick={onClose}>Cancelar</Button>
                )}
                {activeStep === 1 && (
                    <Button onClick={handleBack}>Atrás</Button>
                )}
                {activeStep === 0 && (
                    <Button variant="contained" onClick={handleNext} disabled={!isValid}>
                        Validar
                    </Button>
                )}
                {activeStep === 1 && validacionGeneracion && (
                    <>
                        {validacionGeneracion.cuotasExistentes > 0 ? (
                            <Button
                                variant="contained"
                                onClick={handleRegenerar}
                                disabled={loading || operationLoading}
                                color="warning"
                            >
                                Regenerar Cuotas
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                onClick={handleNext}
                                disabled={!validacionGeneracion.puedeGenerar || loading}
                            >
                                Generar Cuotas
                            </Button>
                        )}
                    </>
                )}
                {activeStep === 2 && !operationLoading && (
                    <Button variant="contained" onClick={onClose} color="primary">
                        Finalizar
                    </Button>
                )}
            </DialogActions>
        </Dialog>

        {/* Diálogo de Confirmación para Regenerar */}
        <Dialog
            open={showConfirmRegenerar}
            onClose={() => setShowConfirmRegenerar(false)}
        >
            <DialogTitle>Confirmar Regeneración de Cuotas</DialogTitle>
            <DialogContent>
                <Typography gutterBottom>
                    ¿Está seguro de que desea <strong>eliminar las {validacionGeneracion?.cuotasExistentes || 0} cuotas existentes</strong> y generar nuevas cuotas para este período?
                </Typography>
                <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                    Esta acción no se puede deshacer.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setShowConfirmRegenerar(false)}>
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    color="warning"
                    onClick={handleConfirmRegenerar}
                    disabled={operationLoading}
                >
                    Confirmar Regeneración
                </Button>
            </DialogActions>
        </Dialog>
        </>
    );
};

export default GeneracionMasivaModal;
