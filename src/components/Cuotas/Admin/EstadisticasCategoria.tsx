import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  Category as CategoryIcon,
  Assignment,
  CheckCircle,
  Block,
} from '@mui/icons-material';
import {
  catalogosItemsAdminApi,
  EstadisticasCategoriaDTO,
  EstadisticasTipoDTO,
} from '@/services/catalogosItemsAdminApi';

interface EstadisticasProps {
  tipo: 'categorias' | 'tipos';
}

/**
 * Componente para mostrar estadísticas de uso de categorías y tipos de ítems
 */
export const EstadisticasCategoria: React.FC<EstadisticasProps> = ({ tipo }) => {
  const [estadisticasCategorias, setEstadisticasCategorias] = useState<EstadisticasCategoriaDTO[]>([]);
  const [estadisticasTipos, setEstadisticasTipos] = useState<EstadisticasTipoDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarEstadisticas();
  }, [tipo]);

  const cargarEstadisticas = async () => {
    setLoading(true);
    setError(null);

    try {
      if (tipo === 'categorias') {
        const response = await catalogosItemsAdminApi.getEstadisticasCategorias();
        if (response.success && response.data) {
          setEstadisticasCategorias(response.data);
        }
      } else {
        const response = await catalogosItemsAdminApi.getEstadisticasTipos();
        if (response.success && response.data) {
          setEstadisticasTipos(response.data);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar estadísticas');
      console.error('Error al cargar estadísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  /**
   * Renderizar estadísticas de categorías
   */
  const renderEstadisticasCategorias = () => {
    if (estadisticasCategorias.length === 0) {
      return (
        <Alert severity="info">
          No hay estadísticas disponibles para categorías de ítems
        </Alert>
      );
    }

    const totalUsosGlobal = estadisticasCategorias.reduce((sum, cat) => sum + cat.totalUsosEnCuotas, 0);

    return (
      <Grid container spacing={2}>
        {estadisticasCategorias.map((cat) => {
          const porcentajeActivos = cat.totalTipos > 0
            ? Math.round((cat.tiposActivos / cat.totalTipos) * 100)
            : 0;
          const porcentajeUso = totalUsosGlobal > 0
            ? Math.round((cat.totalUsosEnCuotas / totalUsosGlobal) * 100)
            : 0;

          return (
            <Grid item xs={12} sm={6} md={4} key={cat.categoriaId}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CategoryIcon color="primary" />
                      <Typography variant="h6" component="div">
                        {cat.categoria}
                      </Typography>
                    </Stack>
                    <Chip
                      label={`${porcentajeUso}%`}
                      color="primary"
                      size="small"
                      icon={<TrendingUp />}
                    />
                  </Stack>

                  <Divider sx={{ mb: 2 }} />

                  <Stack spacing={1.5}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="body2" color="textSecondary">
                          Tipos totales
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {cat.totalTipos}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="body2" color="textSecondary">
                          Tipos activos
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          {cat.tiposActivos}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={porcentajeActivos}
                        color={porcentajeActivos > 70 ? 'success' : porcentajeActivos > 40 ? 'warning' : 'error'}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>

                    <Box>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="textSecondary">
                          Usos en cuotas
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {cat.totalUsosEnCuotas}
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  /**
   * Renderizar estadísticas de tipos
   */
  const renderEstadisticasTipos = () => {
    if (estadisticasTipos.length === 0) {
      return (
        <Alert severity="info">
          No hay estadísticas disponibles para tipos de ítems
        </Alert>
      );
    }

    const tiposPorCategoria = estadisticasTipos.reduce((acc, tipo) => {
      if (!acc[tipo.categoria]) {
        acc[tipo.categoria] = [];
      }
      acc[tipo.categoria].push(tipo);
      return acc;
    }, {} as Record<string, EstadisticasTipoDTO[]>);

    return (
      <Stack spacing={3}>
        {Object.entries(tiposPorCategoria).map(([categoria, tipos]) => (
          <Box key={categoria}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CategoryIcon color="primary" />
              {categoria}
              <Chip label={`${tipos.length} tipos`} size="small" />
            </Typography>

            <Grid container spacing={2}>
              {tipos.map((tipo) => (
                <Grid item xs={12} sm={6} md={4} key={tipo.tipoId}>
                  <Card variant="outlined" sx={{ bgcolor: tipo.activo ? 'background.paper' : 'grey.50' }}>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {tipo.tipo}
                        </Typography>
                        {tipo.activo ? (
                          <CheckCircle fontSize="small" color="success" />
                        ) : (
                          <Block fontSize="small" color="disabled" />
                        )}
                      </Stack>

                      <Stack spacing={1}>
                        <Chip
                          label={tipo.esCalculado ? 'Calculado' : 'Manual'}
                          size="small"
                          color={tipo.esCalculado ? 'primary' : 'default'}
                          icon={<Assignment />}
                        />

                        <Box>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="textSecondary">
                              Usos en cuotas
                            </Typography>
                            <Typography variant="caption" fontWeight="bold">
                              {tipo.totalUsosEnCuotas}
                            </Typography>
                          </Stack>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="textSecondary">
                              Ítems generados
                            </Typography>
                            <Typography variant="caption" fontWeight="bold">
                              {tipo.totalUsosEnItems}
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
      </Stack>
    );
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <TrendingUp color="primary" />
        <Typography variant="h5">
          Estadísticas de {tipo === 'categorias' ? 'Categorías' : 'Tipos de Ítems'}
        </Typography>
      </Stack>

      {tipo === 'categorias' ? renderEstadisticasCategorias() : renderEstadisticasTipos()}
    </Box>
  );
};

export default EstadisticasCategoria;
