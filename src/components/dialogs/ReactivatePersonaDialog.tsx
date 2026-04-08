import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
  Divider,
} from '@mui/material';
import type { Persona } from '../../types/persona.types';

interface ReactivatePersonaDialogProps {
  open: boolean;
  persona: Persona | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ReactivatePersonaDialog: React.FC<ReactivatePersonaDialogProps> = ({
  open,
  persona,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!persona) return null;

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      SOCIO: 'Socio',
      socio: 'Socio',
      NO_SOCIO: 'No Socio',
      DOCENTE: 'Docente',
      docente: 'Docente',
      ESTUDIANTE: 'Estudiante',
      estudiante: 'Estudiante',
      PROVEEDOR: 'Proveedor',
    };
    return labels[tipo] || tipo;
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Persona Existente (Inactiva)</DialogTitle>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Ya existe una persona con el DNI <strong>{persona.dni}</strong> en
          estado inactivo.
        </Alert>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Datos del registro existente:
        </Typography>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            <strong>Nombre:</strong> {persona.nombre} {persona.apellido}
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            <strong>DNI:</strong> {persona.dni}
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            <strong>Email:</strong> {persona.email || 'No registrado'}
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            <strong>Teléfono:</strong> {persona.telefono || 'No registrado'}
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            <strong>Tipo:</strong> {persona.tipos?.map(t => getTipoLabel(t.tipoPersonaCodigo)).join(', ') || 'Sin tipo'}
          </Typography>
          <Typography variant="body2">
            <strong>Estado:</strong> Inactivo
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body2">
          ¿Desea reactivar este registro y actualizar sus datos con la información ingresada?
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? 'Reactivando...' : 'Reactivar Persona'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReactivatePersonaDialog;
