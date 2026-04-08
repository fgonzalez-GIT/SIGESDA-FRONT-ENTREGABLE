import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import {
  Category as CategoryIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import type { ActividadInfoCardsProps } from '../../../types/actividadV2.types';

/**
 * Componente que muestra 4 cards con información resumida de la actividad
 */
export const ActividadInfoCards: React.FC<ActividadInfoCardsProps> = ({
  clasificacion,
  fechas,
  cupos,
  costo
}) => {
  // Determinar color del cupo según porcentaje
  const getCupoColor = (porcentaje: number) => {
    if (porcentaje >= 90) return 'error.main';
    if (porcentaje >= 70) return 'warning.main';
    return 'success.main';
  };

  const cards = [
    {
      title: 'Clasificación',
      icon: <CategoryIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      content: (
        <Box>
          <Typography variant="body2" color="text.secondary">
            Tipo: <strong>{clasificacion.tipo.nombre}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Categoría: <strong>{clasificacion.categoria.nombre}</strong>
          </Typography>
        </Box>
      )
    },
    {
      title: 'Fechas',
      icon: <CalendarIcon sx={{ fontSize: 40, color: 'info.main' }} />,
      content: (
        <Box>
          <Typography variant="body2" color="text.secondary">
            Desde: <strong>{new Date(fechas.desde).toLocaleDateString('es-ES')}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Hasta: <strong>{fechas.hasta ? new Date(fechas.hasta).toLocaleDateString('es-ES') : 'Sin definir'}</strong>
          </Typography>
        </Box>
      )
    },
    {
      title: 'Cupos',
      icon: <PeopleIcon sx={{ fontSize: 40, color: getCupoColor(cupos.porcentaje) }} />,
      content: (
        <Box>
          <Typography variant="h6" fontWeight={600} sx={{ color: getCupoColor(cupos.porcentaje) }}>
            {cupos.actual} / {cupos.maximo || '∞'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {cupos.disponibles !== null
              ? `${cupos.disponibles} disponibles (${cupos.porcentaje.toFixed(0)}%)`
              : 'Sin límite'}
          </Typography>
        </Box>
      )
    },
    {
      title: 'Costo',
      icon: <MoneyIcon sx={{ fontSize: 40, color: costo.esGratuita ? 'success.main' : 'warning.main' }} />,
      content: (
        <Box>
          <Typography variant="h6" fontWeight={600}>
            {costo.esGratuita ? 'GRATUITA' : `$${Number(costo.monto).toFixed(2)}`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {costo.esGratuita ? 'Sin costo para participantes' : `Precio por participante`}
          </Typography>
        </Box>
      )
    }
  ];

  return (
    <Box
      sx={{
        mb: 3,
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(4, 1fr)'
        },
        gap: 2
      }}
    >
      {cards.map((card, index) => (
        <Card
          key={index}
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              height: '100%',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                borderColor: 'primary.main',
                boxShadow: (theme) => theme.shadows[4]
              }
            }}
          >
            <CardContent>
              {/* Icono */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
                {card.icon}
              </Box>

              {/* Título */}
              <Typography
                variant="subtitle2"
                textAlign="center"
                color="text.secondary"
                sx={{ mb: 1.5, textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}
              >
                {card.title}
              </Typography>

              {/* Contenido */}
              <Box sx={{ textAlign: 'center' }}>
                {card.content}
              </Box>
            </CardContent>
          </Card>
      ))}
    </Box>
  );
};

export default ActividadInfoCards;
