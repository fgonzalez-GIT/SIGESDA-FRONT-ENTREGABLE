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
  Tabs,
  Tab,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Groups as GroupsIcon,
  SelectAll as SelectAllIcon,
} from '@mui/icons-material';
import { TabPorPersonas } from './shared/TabPorPersonas';
import { TabMasivo } from './shared/TabMasivo';
import { Cuota } from '@/types/cuota.types';

/**
 * Tipo de respuesta del endpoint generarCuotasBatch
 */
export interface GenerarCuotasBatchResponse {
  cuotasGeneradas: number;
  cuotas: Cuota[];
  errores: string[];
  performance: { tiempoSegundos: string };
}

/**
 * Props del modal unificado de generación de cuotas
 */
interface GeneracionCuotasModalProps {
  /** Controla si el modal está abierto */
  open: boolean;
  /** Callback al cerrar el modal */
  onClose: () => void;
  /** Tab inicial a mostrar */
  tabInicial?: 'personas' | 'masivo';
  /** Callback cuando la generación es exitosa */
  onSuccess?: (resultado: GenerarCuotasBatchResponse) => void;
}

/**
 * Tipos de tabs
 */
type TabType = 'personas' | 'masivo';

/**
 * Pasos del wizard
 */
const PASOS = ['Configuración', 'Selección', 'Resultado'];

/**
 * Configuración compartida entre tabs
 */
export interface ConfiguracionCompartida {
  mes: number;
  anio: number;
  observaciones: string;
}

/**
 * Modal unificado para generación de cuotas
 *
 * Características:
 * - Dos tabs: "Por Personas" (selectivo) y "Masivo" (todos los socios)
 * - Wizard de 3 pasos: Configuración → Selección → Resultado
 * - Uso exclusivo de endpoint generarCuotasBatch
 * - Sin descuentos automáticos (solo manual)
 *
 * @example
 * ```tsx
 * <GeneracionCuotasModal
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   tabInicial="personas"
 *   onSuccess={(resultado) => {
 *     console.log('Cuotas generadas:', resultado.cuotasGeneradas);
 *   }}
 * />
 * ```
 */
export const GeneracionCuotasModal: React.FC<GeneracionCuotasModalProps> = ({
  open,
  onClose,
  tabInicial = 'personas',
  onSuccess,
}) => {
  // ============================================================================
  // HOOKS
  // ============================================================================
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  // ============================================================================
  // STATE
  // ============================================================================
  const [tabActual, setTabActual] = useState<TabType>(tabInicial);
  const [pasoActual, setPasoActual] = useState(0);
  const [configuracion, setConfiguracion] = useState<ConfiguracionCompartida>({
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
    observaciones: '',
  });

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Resetear estado al abrir el modal
   */
  useEffect(() => {
    if (open) {
      setTabActual(tabInicial);
      setPasoActual(0);
      setConfiguracion({
        mes: new Date().getMonth() + 1,
        anio: new Date().getFullYear(),
        observaciones: '',
      });
    }
  }, [open, tabInicial]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Cambiar de tab
   */
  const handleTabChange = (_event: React.SyntheticEvent, newTab: TabType) => {
    setTabActual(newTab);
    setPasoActual(0); // Resetear a paso 1 al cambiar tab
  };

  /**
   * Avanzar paso
   */
  const handleNextStep = () => {
    if (pasoActual < PASOS.length - 1) {
      setPasoActual(pasoActual + 1);
    }
  };

  /**
   * Retroceder paso
   */
  const handleBackStep = () => {
    if (pasoActual > 0) {
      setPasoActual(pasoActual - 1);
    }
  };

  /**
   * Actualizar configuración compartida
   */
  const handleConfiguracionChange = (newConfig: Partial<ConfiguracionCompartida>) => {
    setConfiguracion((prev) => ({ ...prev, ...newConfig }));
  };

  /**
   * Cerrar modal con confirmación si hay cambios
   */
  const handleClose = () => {
    // TODO: Agregar confirmación si hay cambios sin guardar
    onClose();
  };

  /**
   * Éxito en generación
   */
  const handleGeneracionExitosa = (resultado: GenerarCuotasBatchResponse) => {
    if (onSuccess) {
      onSuccess(resultado);
    }
    // Avanzar al paso de resultado
    setPasoActual(2);
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  /**
   * Renderizar contenido del tab activo
   */
  const renderTabContent = () => {
    if (tabActual === 'personas') {
      return (
        <TabPorPersonas
          pasoActual={pasoActual}
          configuracion={configuracion}
          onConfiguracionChange={handleConfiguracionChange}
          onNextStep={handleNextStep}
          onBackStep={handleBackStep}
          onGeneracionExitosa={handleGeneracionExitosa}
          onClose={handleClose}
        />
      );
    }

    if (tabActual === 'masivo') {
      return (
        <TabMasivo
          pasoActual={pasoActual}
          configuracion={configuracion}
          onConfiguracionChange={handleConfiguracionChange}
          onNextStep={handleNextStep}
          onBackStep={handleBackStep}
          onGeneracionExitosa={handleGeneracionExitosa}
          onClose={handleClose}
        />
      );
    }

    return null;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
      aria-labelledby="generacion-cuotas-modal-title"
    >
      {/* Header */}
      <DialogTitle id="generacion-cuotas-modal-title">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>Generación de Cuotas</Box>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            aria-label="cerrar"
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs
          value={tabActual}
          onChange={handleTabChange}
          aria-label="Tipo de generación de cuotas"
          variant="fullWidth"
        >
          <Tab
            value="personas"
            label="Por Personas"
            icon={<GroupsIcon />}
            iconPosition="start"
            disabled={pasoActual === 2} // No cambiar tab en resultado
          />
          <Tab
            value="masivo"
            label="Masivo"
            icon={<SelectAllIcon />}
            iconPosition="start"
            disabled={pasoActual === 2} // No cambiar tab en resultado
          />
        </Tabs>
      </Box>

      {/* Stepper */}
      <Box sx={{ px: 3, pt: 3 }}>
        <Stepper activeStep={pasoActual} alternativeLabel>
          {PASOS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Content */}
      <DialogContent sx={{ pt: 3, minHeight: 400 }}>
        {renderTabContent()}
      </DialogContent>

      {/* Footer - Los botones los maneja cada tab */}
    </Dialog>
  );
};
