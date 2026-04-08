import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAppSelector } from '@/hooks/redux';
import type { AulaEquipamiento } from '@/types/aula.types';
import type { Equipamiento } from '@/types/equipamiento.types';
import {
  getCategoriaLabel,
  getCategoriaColor,
  puedeAsignarse,
  isEstadoBloqueado,
  getEstadoLabel,
  getEstadoColor,
} from '@/types/equipamiento.types';
import { DisponibilidadInfo } from '@/components/equipamientos/DisponibilidadInfo';

interface AulaEquipamientoManagerProps {
  value: AulaEquipamiento[];
  onChange: (equipamientos: AulaEquipamiento[]) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}

export const AulaEquipamientoManager: React.FC<AulaEquipamientoManagerProps> = ({
  value,
  onChange,
  error = false,
  helperText,
  disabled = false,
}) => {
  const { items: equipamientosDisponibles } = useAppSelector((state) => state.equipamientos);

  // State para formulario de agregar/editar
  const [selectedEquipamientoId, setSelectedEquipamientoId] = useState<number | ''>('');
  const [cantidad, setCantidad] = useState<number>(1);
  const [observaciones, setObservaciones] = useState<string>('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string>('');

  // Filtrar equipamientos activos
  const equipamientosActivos = equipamientosDisponibles.filter((eq) => eq.activo);

  // Obtener equipamiento por ID
  const getEquipamientoById = (id: number): Equipamiento | undefined => {
    return equipamientosActivos.find((eq) => eq.id === id);
  };

  // Validar si el equipamiento ya está agregado (excepto si estamos editando)
  const isEquipamientoDuplicado = (equipamientoId: number): boolean => {
    return value.some(
      (item, index) => item.equipamientoId === equipamientoId && index !== editingIndex
    );
  };

  // Handler para agregar equipamiento
  const handleAgregar = () => {
    setValidationError('');

    // Validaciones
    if (!selectedEquipamientoId) {
      setValidationError('Debe seleccionar un equipamiento');
      return;
    }

    if (cantidad < 1) {
      setValidationError('La cantidad debe ser al menos 1');
      return;
    }

    if (isEquipamientoDuplicado(selectedEquipamientoId as number)) {
      setValidationError('Este equipamiento ya fue agregado');
      return;
    }

    // NUEVO: Validar que el equipamiento pueda asignarse (no esté bloqueado)
    const equipamiento = getEquipamientoById(selectedEquipamientoId as number);
    if (equipamiento && !puedeAsignarse(equipamiento)) {
      const estado = equipamiento.estadoEquipamiento;
      const estadoTexto = estado ? getEstadoLabel(estado) : 'no disponible';
      setValidationError(
        `No se puede asignar este equipamiento porque está en estado "${estadoTexto}"`
      );
      return;
    }

    // Agregar nuevo equipamiento
    const nuevoEquipamiento: AulaEquipamiento = {
      equipamientoId: selectedEquipamientoId as number,
      cantidad,
      observaciones: observaciones.trim() || undefined,
    };

    onChange([...value, nuevoEquipamiento]);

    // Limpiar formulario
    setSelectedEquipamientoId('');
    setCantidad(1);
    setObservaciones('');
  };

  // Handler para iniciar edición
  const handleEditar = (index: number) => {
    const item = value[index];
    setSelectedEquipamientoId(item.equipamientoId);
    setCantidad(item.cantidad);
    setObservaciones(item.observaciones || '');
    setEditingIndex(index);
    setValidationError('');
  };

  // Handler para guardar edición
  const handleGuardarEdicion = () => {
    setValidationError('');

    // Validaciones
    if (!selectedEquipamientoId) {
      setValidationError('Debe seleccionar un equipamiento');
      return;
    }

    if (cantidad < 1) {
      setValidationError('La cantidad debe ser al menos 1');
      return;
    }

    if (isEquipamientoDuplicado(selectedEquipamientoId as number)) {
      setValidationError('Este equipamiento ya fue agregado');
      return;
    }

    // NUEVO: Validar que el equipamiento pueda asignarse (no esté bloqueado)
    const equipamiento = getEquipamientoById(selectedEquipamientoId as number);
    if (equipamiento && !puedeAsignarse(equipamiento)) {
      const estado = equipamiento.estadoEquipamiento;
      const estadoTexto = estado ? getEstadoLabel(estado) : 'no disponible';
      setValidationError(
        `No se puede asignar este equipamiento porque está en estado "${estadoTexto}"`
      );
      return;
    }

    // Actualizar equipamiento
    const nuevosEquipamientos = [...value];
    nuevosEquipamientos[editingIndex!] = {
      equipamientoId: selectedEquipamientoId as number,
      cantidad,
      observaciones: observaciones.trim() || undefined,
    };

    onChange(nuevosEquipamientos);

    // Limpiar formulario y salir de modo edición
    setSelectedEquipamientoId('');
    setCantidad(1);
    setObservaciones('');
    setEditingIndex(null);
  };

  // Handler para cancelar edición
  const handleCancelarEdicion = () => {
    setSelectedEquipamientoId('');
    setCantidad(1);
    setObservaciones('');
    setEditingIndex(null);
    setValidationError('');
  };

  // Handler para eliminar equipamiento
  const handleEliminar = (index: number) => {
    const nuevosEquipamientos = value.filter((_, i) => i !== index);
    onChange(nuevosEquipamientos);

    // Si estábamos editando este item, cancelar edición
    if (editingIndex === index) {
      handleCancelarEdicion();
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
        Equipamientos del Aula
      </Typography>

      {/* Formulario de Agregar/Editar */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Selector de Equipamiento */}
          <FormControl fullWidth disabled={disabled}>
            <InputLabel id="equipamiento-select-label">Equipamiento</InputLabel>
            <Select
              labelId="equipamiento-select-label"
              id="equipamiento-select"
              label="Equipamiento"
              value={selectedEquipamientoId}
              onChange={(e) => setSelectedEquipamientoId(e.target.value === '' ? '' as '' : Number(e.target.value))}
            >
              <MenuItem value="">
                <em>Seleccione un equipamiento</em>
              </MenuItem>
              {equipamientosActivos.map((eq) => (
                <MenuItem key={eq.id} value={eq.id}>
                  {eq.nombre} - {getCategoriaLabel(eq.categoriaEquipamiento)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* Cantidad */}
            <TextField
              label="Cantidad"
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={disabled}
              sx={{ width: 150 }}
              inputProps={{ min: 1 }}
            />

            {/* Observaciones */}
            <TextField
              label="Observaciones (opcional)"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              disabled={disabled}
              fullWidth
              placeholder="ej: 5 sillas nuevas"
              inputProps={{ maxLength: 500 }}
            />
          </Box>

          {/* NUEVO: Mostrar disponibilidad del equipamiento seleccionado */}
          {selectedEquipamientoId && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
              <DisponibilidadInfo
                equipamientoId={selectedEquipamientoId as number}
                compact={false}
                showProgress={true}
              />
              {cantidad && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Vas a asignar <strong>{cantidad} unidades</strong> de este equipamiento al aula.
                  Verifica que haya disponibilidad suficiente.
                </Alert>
              )}
            </Paper>
          )}

          {/* Botones de Acción */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {editingIndex !== null ? (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleGuardarEdicion}
                  disabled={disabled}
                >
                  Guardar Cambios
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancelarEdicion}
                  disabled={disabled}
                >
                  Cancelar
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAgregar}
                disabled={disabled}
              >
                Agregar Equipamiento
              </Button>
            )}
          </Box>

          {/* Mensajes de Error */}
          {validationError && (
            <Alert severity="error" onClose={() => setValidationError('')}>
              {validationError}
            </Alert>
          )}

          {error && helperText && (
            <Alert severity="error">{helperText}</Alert>
          )}
        </Box>
      </Paper>

      {/* Tabla de Equipamientos Agregados */}
      {value.length > 0 ? (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Equipamiento</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Categoría</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Cantidad</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Observaciones</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {value.map((item, index) => {
                const equipamiento = getEquipamientoById(item.equipamientoId);
                const isEditing = editingIndex === index;

                return (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor: isEditing ? 'action.hover' : 'transparent',
                    }}
                  >
                    <TableCell>
                      {equipamiento ? equipamiento.nombre : `ID: ${item.equipamientoId}`}
                    </TableCell>
                    <TableCell>
                      {equipamiento && (
                        <Chip
                          label={getCategoriaLabel(equipamiento.categoriaEquipamiento)}
                          size="small"
                          color={getCategoriaColor(equipamiento.categoriaEquipamiento)}
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={item.cantidad} size="small" color="primary" />
                    </TableCell>
                    <TableCell>
                      {item.observaciones || (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                          Sin observaciones
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleEditar(index)}
                          disabled={disabled || editingIndex !== null}
                          color={isEditing ? 'primary' : 'default'}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => handleEliminar(index)}
                          disabled={disabled}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info" sx={{ mt: 1 }}>
          No se han agregado equipamientos. Use el formulario superior para agregar.
        </Alert>
      )}
    </Box>
  );
};

export default AulaEquipamientoManager;
