import React from 'react';
import {
  Box,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

interface LoadingSkeletonProps {
  rows?: number;
  variant?: 'table' | 'card' | 'list';
}

/**
 * Skeleton de carga para diferentes vistas del módulo Personas
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  rows = 5,
  variant = 'table',
}) => {
  if (variant === 'table') {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 40 }}>
                <Skeleton variant="rectangular" width={20} height={20} />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width={80} />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width={80} />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width={100} />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width={60} />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width={60} />
              </TableCell>
              <TableCell align="center">
                <Skeleton variant="text" width={80} />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: rows }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton variant="rectangular" width={20} height={20} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="90%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="90%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="80%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rectangular" width={60} height={24} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rectangular" width={70} height={24} />
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1} justifyContent="center">
                    <Skeleton variant="circular" width={32} height={32} />
                    <Skeleton variant="circular" width={32} height={32} />
                    <Skeleton variant="circular" width={32} height={32} />
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  if (variant === 'card') {
    return (
      <Box display="flex" flexDirection="column" gap={2}>
        {Array.from({ length: rows }).map((_, index) => (
          <Paper key={index} sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Box flex={1}>
                <Skeleton variant="text" width="60%" height={32} />
                <Skeleton variant="text" width="40%" />
              </Box>
              <Box display="flex" gap={1}>
                <Skeleton variant="rectangular" width={60} height={24} />
                <Skeleton variant="rectangular" width={80} height={24} />
              </Box>
            </Box>
            <Box display="flex" gap={2}>
              <Skeleton variant="text" width="30%" />
              <Skeleton variant="text" width="30%" />
              <Skeleton variant="text" width="30%" />
            </Box>
          </Paper>
        ))}
      </Box>
    );
  }

  // variant === 'list'
  return (
    <Box display="flex" flexDirection="column" gap={1}>
      {Array.from({ length: rows }).map((_, index) => (
        <Paper key={index} sx={{ p: 1.5 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box flex={1}>
              <Skeleton variant="text" width="70%" />
              <Skeleton variant="text" width="50%" />
            </Box>
            <Box display="flex" gap={1}>
              <Skeleton variant="rectangular" width={60} height={24} />
              <Skeleton variant="circular" width={32} height={32} />
            </Box>
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default LoadingSkeleton;
