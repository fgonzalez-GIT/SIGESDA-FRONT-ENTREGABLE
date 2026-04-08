import React, { useRef } from 'react';
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
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Print,
  Download,
  Close,
  Send,
  Visibility,
} from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';
import { Recibo } from '../../store/slices/recibosSlice';
import { formatDateLongES } from '@/utils/dateHelpers';
import { LOCALE, CURRENCY_FORMAT } from '@/constants/formats';
import { generarTituloRecibo } from '@/utils/recibo.helpers';

interface ReciboViewerProps {
  open: boolean;
  onClose: () => void;
  recibo: Recibo | null;
  onDownload?: (reciboId: number) => void;
  onSend?: (reciboId: number) => void;
  loading?: boolean;
}

export const ReciboViewer: React.FC<ReciboViewerProps> = ({
  open,
  onClose,
  recibo,
  onDownload,
  onSend,
  loading = false,
}) => {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: recibo ? `Recibo-${recibo.numero}` : 'Recibo',
    pageStyle: `
      @page {
        size: A4;
        margin: 1cm;
      }
      @media print {
        body {
          font-family: 'Roboto', sans-serif;
          font-size: 12px;
          line-height: 1.4;
        }
        .no-print {
          display: none !important;
        }
        .print-break {
          page-break-before: always;
        }
      }
    `,
  });

  if (!recibo) return null;

  // Usar constantes centralizadas para formato consistente
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(LOCALE, CURRENCY_FORMAT).format(amount);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <Visibility color="primary" />
            <Typography variant="h6">
              Recibo {recibo.numero}
            </Typography>
            <Chip
              label={recibo.estado}
              color={
                recibo.estado === 'pagado' ? 'success' :
                recibo.estado === 'vencido' ? 'error' :
                recibo.estado === 'cancelado' ? 'default' : 'warning'
              }
              size="small"
            />
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box
          ref={componentRef}
          sx={{
            p: 4,
            bgcolor: 'white',
            minHeight: '100%',
            maxWidth: '210mm', // A4 width
            mx: 'auto'
          }}
        >
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="start" mb={4}>
            <Box>
              <Typography variant="h4" fontWeight="bold" color="primary">
                SIGESDA
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Sistema de Gestión de Socios y Actividades
              </Typography>
              <Typography variant="body2" mt={1}>
                Dirección: Av. Principal 123<br />
                Ciudad, Provincia (CP)<br />
                Tel: (011) 1234-5678<br />
                Email: info@sigesda.com
              </Typography>
            </Box>
            <Box textAlign="right">
              <Typography variant="h5" fontWeight="bold">
                RECIBO
              </Typography>
              <Typography variant="h6" color="primary">
                N° {recibo.numero}
              </Typography>
              <Box mt={2}>
                <Typography variant="body2">
                  <strong>Fecha de Emisión:</strong><br />
                  {formatDateLongES(recibo.fechaEmision)}
                </Typography>
                <Typography variant="body2" mt={1}>
                  <strong>Fecha de Vencimiento:</strong><br />
                  {formatDateLongES(recibo.fechaVencimiento)}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Datos del cliente */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom color="primary">
              Datos del Cliente
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={4}>
              <Box flex={1} minWidth={200}>
                <Typography variant="body2">
                  <strong>Nombre:</strong><br />
                  {recibo.personaNombre} {recibo.personaApellido}
                </Typography>
              </Box>
              <Box flex={1} minWidth={200}>
                <Typography variant="body2">
                  <strong>Tipo:</strong><br />
                  {recibo.personaTipo.charAt(0).toUpperCase() + recibo.personaTipo.slice(1)}
                </Typography>
              </Box>
              {recibo.personaEmail && (
                <Box flex={1} minWidth={200}>
                  <Typography variant="body2">
                    <strong>Email:</strong><br />
                    {recibo.personaEmail}
                  </Typography>
                </Box>
              )}
              {recibo.personaTelefono && (
                <Box flex={1} minWidth={200}>
                  <Typography variant="body2">
                    <strong>Teléfono:</strong><br />
                    {recibo.personaTelefono}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Título Representativo */}
          <Box
            sx={{
              mb: 3,
              p: 2,
              bgcolor: 'primary.lighter',
              borderRadius: 1,
              textAlign: 'center',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {generarTituloRecibo(recibo)}
            </Typography>
          </Box>

          {/* Detalle de conceptos */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom color="primary">
              Detalle de Conceptos
            </Typography>
            <Table size="small" sx={{ border: 1, borderColor: 'grey.300' }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell><strong>Concepto</strong></TableCell>
                  <TableCell align="center"><strong>Cantidad</strong></TableCell>
                  <TableCell align="right"><strong>Precio Unit.</strong></TableCell>
                  <TableCell align="right"><strong>Subtotal</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recibo.conceptos.map((concepto) => (
                  <TableRow key={concepto.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{concepto.concepto}</Typography>
                        {concepto.tipoItem && (
                          <Typography variant="caption" color="text.secondary">
                            {concepto.tipoItem.nombre}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">{concepto.cantidad}</TableCell>
                    <TableCell align="right">{formatCurrency(concepto.precio)}</TableCell>
                    <TableCell align="right">{formatCurrency(concepto.subtotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          {/* Totales */}
          <Box display="flex" justifyContent="flex-end" mb={4}>
            <Box minWidth={300}>
              <Box display="flex" justifyContent="space-between" py={1}>
                <Typography variant="body1">Subtotal:</Typography>
                <Typography variant="body1">{formatCurrency(recibo.subtotal)}</Typography>
              </Box>
              {recibo.descuentos > 0 && (
                <Box display="flex" justifyContent="space-between" py={1}>
                  <Typography variant="body1" color="success.main">Descuentos:</Typography>
                  <Typography variant="body1" color="success.main">
                    -{formatCurrency(recibo.descuentos)}
                  </Typography>
                </Box>
              )}
              {recibo.recargos > 0 && (
                <Box display="flex" justifyContent="space-between" py={1}>
                  <Typography variant="body1" color="error.main">Recargos:</Typography>
                  <Typography variant="body1" color="error.main">
                    +{formatCurrency(recibo.recargos)}
                  </Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between" py={1}>
                <Typography variant="h6" fontWeight="bold">TOTAL:</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {formatCurrency(recibo.total)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Estado de pago */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom color="primary">
              Estado de Pago
            </Typography>
            <Box display="flex" gap={4} flexWrap="wrap">
              <Box>
                <Typography variant="body2">
                  <strong>Estado:</strong><br />
                  {recibo.estado.charAt(0).toUpperCase() + recibo.estado.slice(1)}
                </Typography>
              </Box>
              {recibo.montoPagado > 0 && (
                <Box>
                  <Typography variant="body2">
                    <strong>Monto Pagado:</strong><br />
                    {formatCurrency(recibo.montoPagado)}
                  </Typography>
                </Box>
              )}
              {recibo.fechaPago && (
                <Box>
                  <Typography variant="body2">
                    <strong>Fecha de Pago:</strong><br />
                    {formatDateLongES(recibo.fechaPago)}
                  </Typography>
                </Box>
              )}
              {recibo.metodoPago && (
                <Box>
                  <Typography variant="body2">
                    <strong>Método de Pago:</strong><br />
                    {recibo.metodoPago.replace('_', ' ').charAt(0).toUpperCase() +
                     recibo.metodoPago.replace('_', ' ').slice(1)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Observaciones */}
          {recibo.observaciones && (
            <Box mb={4}>
              <Typography variant="h6" gutterBottom color="primary">
                Observaciones
              </Typography>
              <Typography variant="body2">
                {recibo.observaciones}
              </Typography>
            </Box>
          )}

          {/* Footer */}
          <Box mt={6} pt={4} borderTop={1} borderColor="grey.300">
            <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
              Este recibo fue generado automáticamente por SIGESDA el {formatDateLongES(recibo.fechaEmision)}
            </Typography>
            <Typography variant="caption" color="text.secondary" textAlign="center" display="block" mt={1}>
              Para consultas, contactarse a info@sigesda.com o al (011) 1234-5678
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions className="no-print">
        <Button
          startIcon={<Print />}
          onClick={handlePrint}
          variant="outlined"
        >
          Imprimir
        </Button>
        {onDownload && (
          <Button
            startIcon={<Download />}
            onClick={() => onDownload(recibo.id)}
            variant="outlined"
            disabled={loading}
          >
            Descargar PDF
          </Button>
        )}
        {onSend && (
          <Button
            startIcon={<Send />}
            onClick={() => onSend(recibo.id)}
            variant="outlined"
            disabled={loading}
          >
            Enviar por Email
          </Button>
        )}
        <Button onClick={onClose}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReciboViewer;