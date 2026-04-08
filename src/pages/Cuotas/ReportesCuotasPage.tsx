import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Card,
    CardContent,
    Stack,
    Divider,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    BarChart,
    PieChart,
    ShowChart,
    Download
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchDashboard } from '../../store/slices/cuotasSlice';
import { reportesService } from '../../services/reportesService';
import { DistribucionEstadoChart, RecaudacionCategoriaChart } from '../../components/Cuotas/Charts';

const ReportesCuotasPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const { dashboardData, loading } = useAppSelector(state => state.cuotas);

    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [anio, setAnio] = useState(new Date().getFullYear());
    const [formatoExportar, setFormatoExportar] = useState<'EXCEL' | 'PDF' | 'CSV'>('EXCEL');
    const [exportando, setExportando] = useState(false);
    const [errorExportacion, setErrorExportacion] = useState<string | null>(null);

    useEffect(() => {
        dispatch(fetchDashboard({ mes, anio }));
    }, [dispatch, mes, anio]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
    };

    const handleExport = async () => {
        try {
            setExportando(true);
            setErrorExportacion(null);

            const response = await reportesService.exportarReporte({
                tipoReporte: 'dashboard',
                formato: formatoExportar,
                parametros: { mes, anio }
            });

            // Crear un blob a partir de la respuesta
            const blob = new Blob([response], {
                type: formatoExportar === 'EXCEL'
                    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    : formatoExportar === 'PDF'
                    ? 'application/pdf'
                    : 'text/csv'
            });

            // Crear URL temporal y descargar
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            const extension = formatoExportar === 'EXCEL' ? 'xlsx' : formatoExportar === 'PDF' ? 'pdf' : 'csv';
            const mesFormateado = mes.toString().padStart(2, '0');
            link.download = `reporte-cuotas-${anio}-${mesFormateado}.${extension}`;

            document.body.appendChild(link);
            link.click();

            // Limpiar
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error al exportar reporte:', error);
            setErrorExportacion('Error al exportar el reporte. Por favor, intente nuevamente.');
        } finally {
            setExportando(false);
        }
    };

    if (!dashboardData) return <Box p={3}><Typography>Cargando datos...</Typography></Box>;

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" component="h1">
                    Reportes Financieros
                </Typography>

                <Stack direction="row" spacing={2}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Mes</InputLabel>
                        <Select value={mes} label="Mes" onChange={e => setMes(Number(e.target.value))}>
                            {[...Array(12)].map((_, i) => (
                                <MenuItem key={i + 1} value={i + 1}>
                                    {new Date(0, i).toLocaleString('es', { month: 'long' })}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                        <InputLabel>Año</InputLabel>
                        <Select value={anio} label="Año" onChange={e => setAnio(Number(e.target.value))}>
                            <MenuItem value={2024}>2024</MenuItem>
                            <MenuItem value={2025}>2025</MenuItem>
                            <MenuItem value={2026}>2026</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Formato</InputLabel>
                        <Select
                            value={formatoExportar}
                            label="Formato"
                            onChange={e => setFormatoExportar(e.target.value as 'EXCEL' | 'PDF' | 'CSV')}
                        >
                            <MenuItem value="EXCEL">Excel (.xlsx)</MenuItem>
                            <MenuItem value="PDF">PDF (.pdf)</MenuItem>
                            <MenuItem value="CSV">CSV (.csv)</MenuItem>
                        </Select>
                    </FormControl>
                    <Button
                        variant="outlined"
                        startIcon={exportando ? <CircularProgress size={20} /> : <Download />}
                        onClick={handleExport}
                        disabled={exportando}
                    >
                        {exportando ? 'Exportando...' : 'Exportar'}
                    </Button>
                </Stack>
            </Box>

            {/* Error de exportación */}
            {errorExportacion && (
                <Alert severity="error" onClose={() => setErrorExportacion(null)} sx={{ mb: 3 }}>
                    {errorExportacion}
                </Alert>
            )}

            {/* KPIs */}
            <Grid container spacing={3} mb={4}>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                        <CardContent>
                            <Typography variant="subtitle2">Total Recaudado</Typography>
                            <Typography variant="h4" fontWeight="bold">
                                {formatCurrency(dashboardData.metricas.totalRecaudado)}
                            </Typography>
                            <Typography variant="caption">
                                {dashboardData.metricas.totalCuotas} cuotas generadas
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                        <CardContent>
                            <Typography variant="subtitle2">Pendiente de Cobro</Typography>
                            <Typography variant="h4" fontWeight="bold">
                                {formatCurrency(dashboardData.metricas.totalPendiente)}
                            </Typography>
                            <Typography variant="caption">
                                Tasa de cobro: {dashboardData.metricas.tasaCobro.toFixed(1)}%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">Total Descuentos</Typography>
                            <Typography variant="h4" color="error.main">
                                {formatCurrency(dashboardData.metricas.totalDescuentos)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Aplicados en este período
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">Ticket Promedio</Typography>
                            <Typography variant="h4">
                                {formatCurrency(dashboardData.metricas.promedioMonto)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Proyección: {formatCurrency(dashboardData.tendencias.proyeccionRecaudacion)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                            <PieChart sx={{ mr: 1 }} /> Distribución por Estado
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <DistribucionEstadoChart data={dashboardData.distribucion.porEstado} />
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                            <BarChart sx={{ mr: 1 }} /> Recaudación por Categoría
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <RecaudacionCategoriaChart data={dashboardData.distribucion.porCategoria} />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ReportesCuotasPage;
