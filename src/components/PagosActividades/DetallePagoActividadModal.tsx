import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
  Grid,
} from '@mui/material';
import {
  Download,
  Person,
  CalendarMonth,
  Receipt,
  AttachMoney,
  CheckCircle,
  Schedule,
  Warning,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { PagoActividad } from '@/types/pagosActividades.types';
import recibosService from '@/services/recibosService';

interface DetallePagoActividadModalProps {
  open: boolean;
  pago: PagoActividad | null;
  onClose: () => void;
}

const DetallePagoActividadModal: React.FC<DetallePagoActividadModalProps> = ({
  open,
  pago,
  onClose,
}) => {
  if (!pago) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getEstadoChip = (estado: string) => {
    switch (estado) {
      case 'PAGADO':
        return <Chip label="Pagado" color="success" icon={<CheckCircle />} />;
      case 'PENDIENTE':
        return <Chip label="Pendiente" color="warning" icon={<Schedule />} />;
      case 'VENCIDO':
        return <Chip label="Vencido" color="error" icon={<Warning />} />;
      case 'CANCELADO':
        return <Chip label="Cancelado" color="default" icon={<CancelIcon />} />;
      default:
        return <Chip label={estado} />;
    }
  };

  const handleDescargarPdf = async () => {
    try {
      await recibosService.descargarPdf(pago.reciboId, `recibo-${pago.numero}.pdf`);
    } catch (error) {
      console.error('Error al descargar PDF:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6">Detalle de Pago de Actividad</Typography>
            <Typography variant="caption" color="text.secondary">
              Recibo #{pago.numero}
            </Typography>
          </Box>
          {getEstadoChip(pago.estado)}
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Información de la Persona */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person fontSize="small" />
            Información de la Persona
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Nombre Completo
              </Typography>
              <Typography variant="body1">
                {pago.personaNombre} {pago.personaApellido}
              </Typography>
            </Grid>
            {pago.personaDni && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  DNI
                </Typography>
                <Typography variant="body1">{pago.personaDni}</Typography>
              </Grid>
            )}
            {pago.personaEmail && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">{pago.personaEmail}</Typography>
              </Grid>
            )}
          </Grid>
        </Box>

        {/* Información del Recibo */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Receipt fontSize="small" />
            Información del Recibo
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Número de Recibo
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {pago.numero}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Período
              </Typography>
              <Typography variant="body1">
                {pago.mes}/{pago.anio}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Fecha de Emisión
              </Typography>
              <Typography variant="body1">{formatDate(pago.fechaEmision)}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Fecha de Vencimiento
              </Typography>
              <Typography variant="body1">{formatDate(pago.fechaVencimiento)}</Typography>
            </Grid>
            {pago.fechaPago && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Fecha de Pago
                </Typography>
                <Typography variant="body1">{formatDate(pago.fechaPago)}</Typography>
              </Grid>
            )}
            {pago.metodoPago && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Método de Pago
                </Typography>
                <Typography variant="body1">{pago.metodoPago.replace('_', ' ')}</Typography>
              </Grid>
            )}
          </Grid>
        </Box>

        {/* Ítems de Actividades */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarMonth fontSize="small" />
            Actividades del Período
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Actividad</TableCell>
                  <TableCell align="center">Cantidad</TableCell>
                  <TableCell align="right">Precio Unit.</TableCell>
                  <TableCell align="right">Subtotal</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pago.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography variant="body2">{item.actividadNombre}</Typography>
                      {item.fechaDesde && item.fechaHasta && (
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(item.fechaDesde)} - {formatDate(item.fechaHasta)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">{item.cantidad}</TableCell>
                    <TableCell align="right">{formatCurrency(item.precioUnitario)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'medium' }}>
                      {formatCurrency(item.subtotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Totales */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachMoney fontSize="small" />
            Resumen de Importes
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Subtotal:</Typography>
              <Typography variant="body2">{formatCurrency(pago.subtotal)}</Typography>
            </Box>
            {pago.descuentos > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="success.main">
                  Descuentos:
                </Typography>
                <Typography variant="body2" color="success.main">
                  -{formatCurrency(pago.descuentos)}
                </Typography>
              </Box>
            )}
            {pago.recargos > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="error.main">
                  Recargos:
                </Typography>
                <Typography variant="body2" color="error.main">
                  +{formatCurrency(pago.recargos)}
                </Typography>
              </Box>
            )}
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight="bold">
                Total:
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary">
                {formatCurrency(pago.total)}
              </Typography>
            </Box>
            {pago.estado === 'PAGADO' && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="success.main">
                  Monto Pagado:
                </Typography>
                <Typography variant="body2" color="success.main" fontWeight="medium">
                  {formatCurrency(pago.montoPagado)}
                </Typography>
              </Box>
            )}
          </Stack>

          {pago.precioEspecial && (
            <Box sx={{ mt: 2 }}>
              <Chip
                label="Este pago incluye precio especial"
                color="info"
                size="small"
                icon={<Warning />}
              />
            </Box>
          )}
        </Box>

        {/* Observaciones */}
        {pago.observaciones && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Observaciones
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
              {pago.observaciones}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button startIcon={<Download />} onClick={handleDescargarPdf} variant="outlined">
          Descargar PDF
        </Button>
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetallePagoActividadModal;
