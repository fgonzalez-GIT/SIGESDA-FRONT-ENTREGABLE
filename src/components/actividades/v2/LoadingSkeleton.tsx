import React from 'react';
import { Box, Skeleton, Card, CardContent } from '@mui/material';

interface LoadingSkeletonProps {
  type: 'horarios' | 'docentes' | 'participantes';
}

/**
 * Skeleton loaders para las diferentes pestañas
 * Mejora la percepción de velocidad durante la carga
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type }) => {
  if (type === 'horarios') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[1, 2, 3].map((i) => (
          <Box
            key={i}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="30%" height={24} />
              <Skeleton variant="text" width="50%" height={20} />
            </Box>
            <Skeleton variant="rectangular" width={80} height={32} />
          </Box>
        ))}
      </Box>
    );
  }

  if (type === 'docentes') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Skeleton variant="circular" width={48} height={48} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="40%" height={24} />
              <Skeleton variant="text" width="30%" height={20} />
              <Skeleton variant="text" width="60%" height={18} />
            </Box>
            <Skeleton variant="rectangular" width={80} height={32} />
          </Box>
        ))}
      </Box>
    );
  }

  if (type === 'participantes') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Box
            key={i}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="35%" height={24} />
              <Skeleton variant="text" width="50%" height={20} />
            </Box>
            <Skeleton variant="rectangular" width={60} height={28} />
            <Skeleton variant="rectangular" width={80} height={32} />
          </Box>
        ))}
      </Box>
    );
  }

  return null;
};

export default LoadingSkeleton;
