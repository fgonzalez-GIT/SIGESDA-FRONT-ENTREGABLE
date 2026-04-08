import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Alert,
  Paper,
  Chip,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Info, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';

interface EditorFormulaJSONProps {
  value: Record<string, any> | null;
  onChange: (value: Record<string, any> | null) => void;
  disabled?: boolean;
  helperText?: string;
}

/**
 * Editor JSON para fórmulas de cálculo de tipos de ítems
 * Incluye validación de sintaxis y previsualización estructurada
 */
export const EditorFormulaJSON: React.FC<EditorFormulaJSONProps> = ({
  value,
  onChange,
  disabled = false,
  helperText,
}) => {
  const [jsonText, setJsonText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(true);

  // Sincronizar valor inicial con el texto
  useEffect(() => {
    if (value) {
      setJsonText(JSON.stringify(value, null, 2));
      setIsValid(true);
      setError(null);
    } else {
      setJsonText('');
      setIsValid(true);
      setError(null);
    }
  }, [value]);

  /**
   * Validar y parsear JSON ingresado
   */
  const handleJsonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setJsonText(newText);

    // Si está vacío, es válido (null)
    if (!newText.trim()) {
      setIsValid(true);
      setError(null);
      onChange(null);
      return;
    }

    // Intentar parsear JSON
    try {
      const parsed = JSON.parse(newText);

      // Validar que sea un objeto
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('La fórmula debe ser un objeto JSON, no un array o primitivo');
      }

      // Validar estructura mínima (debe tener al menos una clave)
      if (Object.keys(parsed).length === 0) {
        throw new Error('La fórmula no puede estar vacía');
      }

      setIsValid(true);
      setError(null);
      onChange(parsed);
    } catch (err: any) {
      setIsValid(false);
      setError(err.message || 'JSON inválido');
      onChange(null);
    }
  };

  /**
   * Generar plantilla de ejemplo
   */
  const generarEjemplo = () => {
    const ejemploFormula = {
      tipo: 'multiplicacion',
      variables: {
        base: 'categoriaBase',
        factor: 1.0
      },
      condiciones: {
        aplicarDescuento: false,
        redondeo: 'ceil'
      }
    };
    const ejemploJSON = JSON.stringify(ejemploFormula, null, 2);
    setJsonText(ejemploJSON);
    onChange(ejemploFormula);
    setIsValid(true);
    setError(null);
  };

  /**
   * Renderizar información de estructura
   */
  const renderInfoEstructura = () => {
    if (!value || !isValid) return null;

    const claves = Object.keys(value);

    return (
      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
        <Typography variant="caption" color="textSecondary">
          Propiedades:
        </Typography>
        {claves.map((clave) => (
          <Chip
            key={clave}
            label={`${clave}: ${typeof value[clave]}`}
            size="small"
            variant="outlined"
            color="primary"
          />
        ))}
      </Stack>
    );
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="subtitle2">
          Fórmula de Cálculo (JSON)
        </Typography>
        <Tooltip title="La fórmula define cómo se calcula automáticamente el monto del ítem">
          <IconButton size="small">
            <Info fontSize="small" />
          </IconButton>
        </Tooltip>
        {isValid && value && (
          <CheckCircle fontSize="small" color="success" />
        )}
        {!isValid && (
          <ErrorIcon fontSize="small" color="error" />
        )}
      </Stack>

      <TextField
        fullWidth
        multiline
        rows={8}
        value={jsonText}
        onChange={handleJsonChange}
        disabled={disabled}
        placeholder='{\n  "tipo": "multiplicacion",\n  "variables": {\n    "base": 1000,\n    "factor": 1.0\n  }\n}'
        error={!isValid}
        helperText={error || helperText}
        sx={{
          '& .MuiInputBase-input': {
            fontFamily: 'monospace',
            fontSize: '0.875rem',
          },
        }}
      />

      {renderInfoEstructura()}

      {/* Alertas de ayuda */}
      <Stack spacing={1} sx={{ mt: 2 }}>
        {!value && (
          <Alert severity="info" sx={{ py: 0.5 }}>
            <Typography variant="caption">
              Ingresa un objeto JSON válido para definir la fórmula de cálculo.{' '}
              <Typography
                component="span"
                variant="caption"
                sx={{ textDecoration: 'underline', cursor: 'pointer' }}
                onClick={generarEjemplo}
              >
                Ver ejemplo
              </Typography>
            </Typography>
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ py: 0.5 }}>
            <Typography variant="caption">
              <strong>Error de sintaxis:</strong> {error}
            </Typography>
          </Alert>
        )}

        {isValid && value && (
          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'success.50' }}>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
              <strong>Fórmula válida</strong> - Esta configuración se usará para calcular automáticamente el monto del ítem.
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Asegúrate de que el backend pueda interpretar esta estructura correctamente.
            </Typography>
          </Paper>
        )}
      </Stack>

      {/* Documentación de estructura esperada */}
      <Paper variant="outlined" sx={{ mt: 2, p: 1.5, bgcolor: 'grey.50' }}>
        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>
          Estructura esperada del JSON:
        </Typography>
        <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', m: 0 }}>
{`{
  "tipo": "multiplicacion" | "suma" | "porcentaje" | "custom",
  "variables": {
    "base": number | string (referencia),
    "factor": number,
    ...
  },
  "condiciones": {
    "aplicarDescuento": boolean,
    "redondeo": "floor" | "ceil" | "round",
    ...
  }
}`}
        </Typography>
      </Paper>
    </Box>
  );
};

export default EditorFormulaJSON;
