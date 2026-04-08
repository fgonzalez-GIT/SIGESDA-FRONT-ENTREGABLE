// @ts-nocheck
// LEGACY: Este componente no se usa. Utiliza interfaz Cuota V1 obsoleta.
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Close,
  AccountBalance,
  FamilyRestroom,
  LocalOffer,
  ExpandMore,
  CheckCircle,
  Info,
  Warning,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';

interface DescuentoDetalle {
  concepto: string;
  porcentaje: number;
  monto: number;
}

interface CalculoDescuento {
  personaId: number;
  persona: {
    id: number;
    nombre: string;
    apellido: string;
    tipo: string;
  };
  montoBase: number;
  descuentoIndividual: number;
  descuentoGrupal: number;
  descuentoTotal: number;
  detalles: DescuentoDetalle[];
  cuotasAfectadas: number[];
}

interface DescuentosFamiliaresDialogProps {
  open: boolean;
  onClose: () => void;
  personaSeleccionada?: number;
  cuotasSeleccionadas?: number[];
}

const DescuentosFamiliaresDialog: React.FC<DescuentosFamiliaresDialogProps> = ({
  open,
  onClose,
  personaSeleccionada,
  cuotasSeleccionadas = [],
}) => {
  const dispatch = useAppDispatch();
  const { personasConFamiliares, grupos } = useAppSelector((state) => state.familiares);
  const { cuotas } = useAppSelector((state) => state.cuotas);

  const [calculosDescuentos, setCalculosDescuentos] = useState<CalculoDescuento[]>([]);
  const [loading, setLoading] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [montoBasePorDefecto, setMontoBasePorDefecto] = useState(50000);
  const [aplicarAutomaticamente, setAplicarAutomaticamente] = useState(true);
  const [soloPersonaSeleccionada, setSoloPersonaSeleccionada] = useState(!!personaSeleccionada);

  useEffect(() => {
    if (open) {
      calcularDescuentos();
    }
  }, [open, personaSeleccionada, cuotasSeleccionadas]);

  const calcularDescuentos = async () => {
    setLoading(true);
    setError(null);

    try {
      const calculos: CalculoDescuento[] = [];

      const personasACalcular = soloPersonaSeleccionada && personaSeleccionada
        ? personasConFamiliares.filter(p => p.id === personaSeleccionada)
        : personasConFamiliares;

      for (const persona of personasACalcular) {
        const cuotasPersona = cuotas.filter(c =>
          c.personaId === persona.id &&
          c.estado === 'pendiente' &&
          (cuotasSeleccionadas.length === 0 || cuotasSeleccionadas.includes(c.id))
        );

        if (cuotasPersona.length === 0) continue;

        const montoBase = cuotasPersona.reduce((sum, c) => sum + c.monto, 0);
        const resultado = await calcularDescuentoPersona(persona.id, montoBase);

        calculos.push({
          personaId: persona.id,
          persona: {
            id: persona.id,
            nombre: persona.nombre,
            apellido: persona.apellido,
            tipo: persona.tipo,
          },
          montoBase,
          descuentoIndividual: resultado.descuentoIndividual,
          descuentoGrupal: resultado.descuentoGrupal,
          descuentoTotal: resultado.descuentoTotal,
          detalles: resultado.detalles,
          cuotasAfectadas: cuotasPersona.map(c => c.id),
        });
      }

      setCalculosDescuentos(calculos);
    } catch (error) {
      setError('Error al calcular descuentos familiares');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calcularDescuentoPersona = async (personaId: number, montoBase: number) => {
    // Simulación del cálculo de descuentos
    await new Promise(resolve => setTimeout(resolve, 300));

    const persona = personasConFamiliares.find(p => p.id === personaId);
    if (!persona) throw new Error('Persona no encontrada');

    const detalles: DescuentoDetalle[] = [];
    let descuentoIndividual = 0;
    let descuentoGrupal = 0;

    // Descuentos por relaciones familiares individuales
    for (const familiar of persona.familiares) {
      if (familiar.relacion.porcentajeDescuento) {
        const descuento = (montoBase * familiar.relacion.porcentajeDescuento) / 100;
        descuentoIndividual += descuento;
        detalles.push({
          concepto: `Descuento por ${familiar.relacion.tipoRelacion}: ${familiar.familiar.nombre}`,
          porcentaje: familiar.relacion.porcentajeDescuento,
          monto: descuento,
        });
      }
    }

    // Descuento grupal
    if (persona.grupoFamiliar && persona.grupoFamiliar.activo) {
      const grupo = persona.grupoFamiliar;
      let porcentajeGrupal = grupo.descuentoGrupal;

      // Descuento progresivo si está habilitado
      if (grupo.configuracion.descuentoProgresivo) {
        const cantidadMiembros = grupo.miembros.length;
        const incremento = Math.floor(cantidadMiembros / 2) * 2; // 2% adicional por cada 2 miembros
        porcentajeGrupal += incremento;
        porcentajeGrupal = Math.min(porcentajeGrupal, 40); // Máximo 40%
      }

      descuentoGrupal = (montoBase * porcentajeGrupal) / 100;
      detalles.push({
        concepto: `Descuento grupal: ${grupo.nombre}`,
        porcentaje: porcentajeGrupal,
        monto: descuentoGrupal,
      });
    }

    // Descuentos adicionales por cantidad de familiares
    const cantidadFamiliares = persona.familiares.length;
    if (cantidadFamiliares >= 3) {
      const porcentajeAdicional = Math.min(cantidadFamiliares * 1, 10); // 1% por familiar, máximo 10%
      const descuentoAdicional = (montoBase * porcentajeAdicional) / 100;
      descuentoIndividual += descuentoAdicional;
      detalles.push({
        concepto: `Descuento por cantidad de familiares (${cantidadFamiliares})`,
        porcentaje: porcentajeAdicional,
        monto: descuentoAdicional,
      });
    }

    const descuentoTotal = descuentoIndividual + descuentoGrupal;

    return {
      descuentoIndividual,
      descuentoGrupal,
      descuentoTotal,
      detalles,
    };
  };

  const aplicarDescuentos = async () => {
    setAplicando(true);
    setError(null);

    try {
      const cuotasAAplicar = calculosDescuentos.flatMap(c => c.cuotasAfectadas);

      // Simulación de aplicación de descuentos
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Aquí iría la llamada real al API
      console.log('Aplicando descuentos a cuotas:', cuotasAAplicar);

      onClose();
    } catch (error) {
      setError('Error al aplicar descuentos familiares');
      console.error(error);
    } finally {
      setAplicando(false);
    }
  };

  const totalDescuentos = calculosDescuentos.reduce((sum, c) => sum + c.descuentoTotal, 0);
  const totalMontoBase = calculosDescuentos.reduce((sum, c) => sum + c.montoBase, 0);
  const porcentajePromedioDescuento = totalMontoBase > 0 ? (totalDescuentos / totalMontoBase) * 100 : 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <LocalOffer color="primary" />
            <Typography variant="h6">
              Cálculo de Descuentos Familiares
            </Typography>
          </Box>
          <Button onClick={onClose} color="inherit">
            <Close />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Configuración */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Configuración
            </Typography>
            <Box display="flex" gap={3} flexWrap="wrap" alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={soloPersonaSeleccionada}
                    onChange={(e) => setSoloPersonaSeleccionada(e.target.checked)}
                    disabled={!personaSeleccionada}
                  />
                }
                label="Solo persona seleccionada"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={aplicarAutomaticamente}
                    onChange={(e) => setAplicarAutomaticamente(e.target.checked)}
                  />
                }
                label="Aplicar automáticamente"
              />
              <TextField
                label="Monto base por defecto"
                value={montoBasePorDefecto}
                onChange={(e) => setMontoBasePorDefecto(Number(e.target.value))}
                type="number"
                size="small"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
              <Button
                variant="outlined"
                onClick={calcularDescuentos}
                disabled={loading}
              >
                Recalcular
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Resumen general */}
        {calculosDescuentos.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resumen General
              </Typography>
              <Box display="flex" gap={4} flexWrap="wrap">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Monto Base
                  </Typography>
                  <Typography variant="h6">
                    ${totalMontoBase.toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Descuentos
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    ${totalDescuentos.toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Porcentaje Promedio
                  </Typography>
                  <Typography variant="h6" color="primary.main">
                    {porcentajePromedioDescuento.toFixed(1)}%
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Personas Afectadas
                  </Typography>
                  <Typography variant="h6">
                    {calculosDescuentos.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Calculando descuentos familiares...
            </Typography>
          </Box>
        ) : calculosDescuentos.length === 0 ? (
          <Alert severity="info">
            No se encontraron personas con cuotas pendientes para aplicar descuentos familiares.
          </Alert>
        ) : (
          <Box>
            {calculosDescuentos.map((calculo) => (
              <Accordion key={calculo.personaId} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                    <Box display="flex" alignItems="center" gap={2}>
                      <FamilyRestroom color="primary" />
                      <Box>
                        <Typography variant="subtitle1">
                          {calculo.persona.nombre} {calculo.persona.apellido}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {calculo.cuotasAfectadas.length} cuotas pendientes
                        </Typography>
                      </Box>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="h6" color="success.main">
                        ${calculo.descuentoTotal.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {((calculo.descuentoTotal / calculo.montoBase) * 100).toFixed(1)}% descuento
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box display="flex" gap={3} mb={3}>
                    <Card variant="outlined" sx={{ flex: 1 }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Monto Base
                        </Typography>
                        <Typography variant="h6">
                          ${calculo.montoBase.toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                    <Card variant="outlined" sx={{ flex: 1 }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Descuento Individual
                        </Typography>
                        <Typography variant="h6" color="info.main">
                          ${calculo.descuentoIndividual.toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                    <Card variant="outlined" sx={{ flex: 1 }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Descuento Grupal
                        </Typography>
                        <Typography variant="h6" color="warning.main">
                          ${calculo.descuentoGrupal.toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                    <Card variant="outlined" sx={{ flex: 1 }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Total Final
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          ${(calculo.montoBase - calculo.descuentoTotal).toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>

                  <Typography variant="subtitle2" gutterBottom>
                    Detalle de Descuentos
                  </Typography>
                  <List dense>
                    {calculo.detalles.map((detalle, index) => (
                      <ListItem key={index} divider>
                        <ListItemIcon>
                          <CheckCircle color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={detalle.concepto}
                          secondary={`${detalle.porcentaje}% - $${detalle.monto.toLocaleString()}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={aplicando}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={aplicarDescuentos}
          disabled={loading || calculosDescuentos.length === 0 || aplicando}
          startIcon={aplicando ? <CircularProgress size={20} /> : <AccountBalance />}
        >
          {aplicando ? 'Aplicando...' : `Aplicar Descuentos (${calculosDescuentos.length})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DescuentosFamiliaresDialog;