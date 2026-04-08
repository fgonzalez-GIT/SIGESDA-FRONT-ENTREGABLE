import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Tooltip,
    Divider,
    CircularProgress
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchDesgloseCuota, fetchItemsCuota, recalcularCuota, deleteCuota, fetchCuotaById } from '../../store/slices/cuotasSlice';
import { Cuota, ItemCuota } from '../../types/cuota.types';
import { FEATURES } from '../../config/features';
import AgregarItemModal from './AgregarItemModal';
import BloqueAccordeonCuota from './BloqueAccordeonCuota';
import {
    getTipoPersonaActivo,
    getCategoriaSocio,
    getNombreCompletoReceptor,
    formatearPeriodoCuota,
    decimalToNumber
} from '../../utils/cuota.helpers';

interface DetalleCuotaModalProps {
    open: boolean;
    onClose: () => void;
    cuota: Cuota | null;
}

const DetalleCuotaModal: React.FC<DetalleCuotaModalProps> = ({ open, onClose, cuota }) => {
    const dispatch = useAppDispatch();
    const { itemsCuota, desgloseCuota, loading } = useAppSelector(state => state.cuotas);
    const [openAgregarItem, setOpenAgregarItem] = useState(false);
    const [expandedAccordion, setExpandedAccordion] = useState<string | false>(false);

    const handleAccordionChange = (panel: string) => (
        event: React.SyntheticEvent,
        isExpanded: boolean
    ) => {
        setExpandedAccordion(isExpanded ? panel : false);
    };

    useEffect(() => {
        if (open && cuota) {
            // V2: Siempre cargar desglose e ítems
            dispatch(fetchDesgloseCuota(cuota.id));
            dispatch(fetchItemsCuota(cuota.id));
        }
    }, [open, cuota, dispatch]);

    const handleRecalcular = async () => {
        if (cuota) {
            // Recalcular con todas las opciones activas
            await dispatch(recalcularCuota({
                id: cuota.id,
                options: { aplicarAjustes: true, aplicarDescuentos: true, aplicarExenciones: true }
            }));
            // Re-fetch the complete cuota so recibo.receptor is always populated
            await dispatch(fetchCuotaById(cuota.id));
            // Refresh desglose
            dispatch(fetchDesgloseCuota(cuota.id));
        }
    };

    const handleAgregarItem = () => {
        setOpenAgregarItem(true);
    };

    const handleCloseAgregarItem = () => {
        setOpenAgregarItem(false);
    };

    const handleItemAgregado = () => {
        setOpenAgregarItem(false);
        // Refresh desglose después de agregar ítem
        if (cuota) {
            dispatch(fetchDesgloseCuota(cuota.id));
            dispatch(fetchItemsCuota(cuota.id));
        }
    };

    if (!cuota) return null;

    // Guard: recibo may be absent briefly after recalculation while re-fetch is in progress
    if (!cuota.recibo) return null;

    // V2: Obtener información del receptor usando helpers
    const tipoPersona = getTipoPersonaActivo(cuota.recibo.receptor);
    const categoriaSocio = getCategoriaSocio(cuota.recibo.receptor);
    const nombreCompleto = getNombreCompletoReceptor(cuota);
    const periodo = formatearPeriodoCuota(cuota);

    // Renderiza una sección de la tabla con su título y subtotal
    const renderTableSection = (items: ItemCuota[], title: string, showDivider: boolean = true) => {
        if (!items || items.length === 0) return null;

        // V2: Usar decimalToNumber para convertir string a number
        const subtotal = items.reduce((acc, item) => {
            return acc + (decimalToNumber(item.monto) * decimalToNumber(item.cantidad));
        }, 0);

        return (
            <React.Fragment>
                {showDivider && <TableRow><TableCell colSpan={5} sx={{ p: 0 }}><Divider /></TableCell></TableRow>}
                <TableRow>
                    <TableCell colSpan={5} sx={{ bgcolor: 'grey.50', py: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold">{title}</Typography>
                    </TableCell>
                </TableRow>
                {items.map((item) => {
                    // V2: Convertir string a number para cálculos
                    const montoTotal = decimalToNumber(item.monto) * decimalToNumber(item.cantidad);
                    const esPositivo = montoTotal >= 0;
                    return (
                        <TableRow key={item.id}>
                            <TableCell>{item.concepto}</TableCell>
                            <TableCell align="right">
                                {esPositivo ? (
                                    <Typography color="success.dark" fontWeight="medium">
                                        ${Math.abs(montoTotal).toFixed(2)}
                                    </Typography>
                                ) : (
                                    <Typography color="text.disabled">-</Typography>
                                )}
                            </TableCell>
                            <TableCell align="right">
                                {!esPositivo ? (
                                    <Typography color="error.main" fontWeight="medium">
                                        ${Math.abs(montoTotal).toFixed(2)}
                                    </Typography>
                                ) : (
                                    <Typography color="text.disabled">-</Typography>
                                )}
                            </TableCell>
                            <TableCell align="center">
                                <Typography variant="body2">{decimalToNumber(item.cantidad)}</Typography>
                            </TableCell>
                            <TableCell align="center">
                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                                    {item.esAutomatico ? (
                                        <Chip size="small" label="Auto" color="primary" variant="outlined" />
                                    ) : (
                                        <Chip size="small" label="Manual" color="secondary" variant="outlined" />
                                    )}
                                    {item.porcentaje && <Chip size="small" label={`${decimalToNumber(item.porcentaje)}%`} color="info" variant="outlined" />}
                                </Box>
                            </TableCell>
                        </TableRow>
                    );
                })}
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell colSpan={4}>
                        <Typography variant="body2" fontWeight="bold">Subtotal {title}</Typography>
                    </TableCell>
                    <TableCell align="center">
                        <Typography variant="body2" fontWeight="bold" color={subtotal >= 0 ? 'success.dark' : 'error.main'}>
                            ${Math.abs(subtotal).toFixed(2)}
                        </Typography>
                    </TableCell>
                </TableRow>
            </React.Fragment>
        );
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Detalle de Cuota #{cuota.recibo.numero}
                <Typography variant="subtitle2" color="text.secondary">
                    {nombreCompleto}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                    {periodo} | {tipoPersona?.tipoPersona.nombre || 'Sin tipo'}
                    {categoriaSocio && ` - ${categoriaSocio.nombre}`}
                </Typography>
            </DialogTitle>
            <DialogContent dividers>
                {/* Vista V2 con desglose detallado de ítems */}
                {loading || !desgloseCuota ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
                ) : (
                        <Box>
                            {/* Acordeones con 3 bloques */}
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                {/* BLOQUE 1: Monto Base */}
                                <BloqueAccordeonCuota
                                    panel="base"
                                    title="MONTO BASE"
                                    tipoBloque="BASE"
                                    items={desgloseCuota.desglose['BASE']?.items || []}
                                    expanded={expandedAccordion === 'base'}
                                    onChange={handleAccordionChange('base')}
                                />

                                {/* BLOQUE 2: Actividades */}
                                <BloqueAccordeonCuota
                                    panel="actividad"
                                    title="ACTIVIDADES"
                                    tipoBloque="ACTIVIDAD"
                                    items={desgloseCuota.desglose['ACTIVIDAD']?.items || []}
                                    expanded={expandedAccordion === 'actividad'}
                                    onChange={handleAccordionChange('actividad')}
                                />

                                {/* BLOQUE 3: Recargos y Adicionales */}
                                <BloqueAccordeonCuota
                                    panel="recargos"
                                    title="RECARGOS Y ADICIONALES"
                                    tipoBloque="RECARGO"
                                    items={[
                                        ...(desgloseCuota.desglose['RECARGO']?.items || []),
                                        ...(desgloseCuota.desglose['ADICIONAL']?.items || []),
                                        ...(desgloseCuota.desglose['OTRO']?.items.filter((item) => item.monto >= 0) || [])
                                    ]}
                                    expanded={expandedAccordion === 'recargos'}
                                    onChange={handleAccordionChange('recargos')}
                                />

                                {/* BLOQUE 4: Descuentos y Beneficios */}
                                <BloqueAccordeonCuota
                                    panel="descuentos"
                                    title="DESCUENTOS Y BENEFICIOS"
                                    tipoBloque="DESCUENTO"
                                    items={[
                                        ...(desgloseCuota.desglose['DESCUENTO']?.items || []),
                                        ...(desgloseCuota.desglose['OTRO']?.items.filter((item) => item.monto < 0) || [])
                                    ]}
                                    expanded={expandedAccordion === 'descuentos'}
                                    onChange={handleAccordionChange('descuentos')}
                                />
                            </Box>

                            {/* Total final */}
                            <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText', mt: 2 }}>
                                <Grid container alignItems="center">
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="h6">TOTAL A PAGAR</Typography>
                                    </Grid>
                                    <Grid size={{ xs: 6 }} textAlign="right">
                                        <Typography variant="h4" fontWeight="bold">
                                            ${desgloseCuota.totales.total.toFixed(2)}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Box>
                    )
                }
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cerrar</Button>
                {FEATURES.RECALCULO_CUOTAS && cuota.recibo.estado !== 'PAGADO' && (
                    <>
                        <Button onClick={handleRecalcular} color="warning">Recalcular</Button>
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={handleAgregarItem}
                        >
                            Agregar Ítem Manual
                        </Button>
                    </>
                )}
            </DialogActions>

            {/* Modal para agregar ítem manual */}
            <AgregarItemModal
                open={openAgregarItem}
                onClose={handleCloseAgregarItem}
                cuotaId={cuota.id}
                onSuccess={handleItemAgregado}
            />
        </Dialog>
    );
};

export default DetalleCuotaModal;
