import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  CircularProgress,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
  Badge,
  Typography
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  Room as RoomIcon
} from '@mui/icons-material';

// Hooks personalizados
import {
  useActividad,
  useHorariosActividad,
  useDocentesActividad,
  useParticipantesActividad,
  useEstadisticasActividad
} from '../../hooks/useActividades';
import { useAulasActividad } from '../../hooks/useActividadesAulas';

// Componentes V2
import { ActividadHeader } from '../../components/actividades/v2/ActividadHeader';
import { ActividadInfoCards } from '../../components/actividades/v2/ActividadInfoCards';
import { HorariosTab } from '../../components/actividades/v2/horarios/HorariosTab';
import { DocentesTab } from '../../components/actividades/v2/docentes/DocentesTab';
import { ParticipantesTab } from '../../components/actividades/v2/participantes/ParticipantesTab';
import AulasTab from '../../components/actividades/v2/aulas/AulasTab';

// Tipos
import type {
  TabValue,
  ActividadClasificacion,
  ActividadFechas,
  ActividadCupos,
  ActividadCosto
} from '../../types/actividadV2.types';

/**
 * Página de detalle de actividad - Versión 2 (Mejorada)
 *
 * Características:
 * - 4 cards de información visual
 * - Sistema de pestañas mejorado con contadores
 * - Gestión de horarios, docentes y participantes
 * - Inscripción masiva e individual
 * - Proyección de cupos en tiempo real
 */
export const ActividadDetallePageV2: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabValue>('participantes');

  // Hooks de datos
  const { actividad, loading: actividadLoading, error: actividadError, refetch: refetchActividad } = useActividad(Number(id));
  const { horarios, loading: horariosLoading, refetch: refetchHorarios } = useHorariosActividad(Number(id));
  const { docentes, loading: docentesLoading, refetch: refetchDocentes } = useDocentesActividad(Number(id));
  const { participantes, loading: participantesLoading, refetch: refetchParticipantes } = useParticipantesActividad(Number(id));
  const { aulas, loading: aulasLoading, refetch: refetchAulas } = useAulasActividad(Number(id));
  const { estadisticas, refetch: refetchEstadisticas } = useEstadisticasActividad(Number(id));

  // ============================================
  // HANDLERS
  // ============================================

  const handleVolver = () => {
    navigate('/actividades');
  };

  const handleChangeTab = (_event: React.SyntheticEvent, newValue: TabValue) => {
    setActiveTab(newValue);
  };

  const handleRefreshData = async () => {
    // Refrescar datos cuando se modifiquen horarios/docentes/participantes/aulas
    await Promise.all([
      refetchActividad(),
      refetchHorarios(),
      refetchDocentes(),
      refetchParticipantes(),
      refetchAulas(),
      refetchEstadisticas(),
    ]);
  };

  // ============================================
  // CÁLCULOS Y TRANSFORMACIONES
  // ============================================

  // Datos de clasificación
  const clasificacion: ActividadClasificacion | null = actividad
    ? {
        tipo: {
          id: actividad.tipoActividadId,
          nombre: actividad.tiposActividades?.nombre || 'Sin tipo',
          codigo: actividad.tiposActividades?.codigo || ''
        },
        categoria: {
          id: actividad.categoriaId,
          nombre: actividad.categoriasActividades?.nombre || 'Sin categoría',
          codigo: actividad.categoriasActividades?.codigo || ''
        }
      }
    : null;

  // Datos de fechas
  const fechas: ActividadFechas | null = actividad
    ? {
        desde: actividad.fechaDesde,
        hasta: actividad.fechaHasta
      }
    : null;

  // Datos de cupos
  const cupoActual = estadisticas?.totalParticipantes || 0;
  const cupoMaximo = actividad?.capacidadMaxima || null;
  const cuposDisponibles = cupoMaximo ? cupoMaximo - cupoActual : null;
  const porcentajeOcupacion = cupoMaximo ? (cupoActual / cupoMaximo) * 100 : 0;

  const cupos: ActividadCupos | null = actividad
    ? {
        actual: cupoActual,
        maximo: cupoMaximo,
        disponibles: cuposDisponibles,
        porcentaje: porcentajeOcupacion
      }
    : null;

  // Datos de costo
  const costo: ActividadCosto | null = actividad
    ? {
        monto: actividad.costo,
        esGratuita: actividad.costo === 0,
        moneda: 'ARS'
      }
    : null;

  // Contadores para las pestañas
  const contadorHorarios = horarios?.filter(h => h.activo).length || 0;
  const contadorDocentes = docentes?.filter(d => d.activo).length || 0;
  const contadorParticipantes = participantes?.filter(p => p.activa).length || 0;
  const contadorAulas = aulas?.filter(a => a.activa).length || 0;

  // ============================================
  // ESTADOS DE CARGA Y ERROR
  // ============================================

  if (actividadLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (actividadError || !actividad) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          <AlertTitle>Error al cargar la actividad</AlertTitle>
          {actividadError || 'No se encontró la actividad solicitada'}
        </Alert>
      </Container>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header con título, estado y botón volver */}
      <ActividadHeader
        actividadId={Number(id)}
        nombre={actividad.nombre}
        codigo={actividad.codigoActividad}
        estado={
          actividad.estadosActividades || {
            id: actividad.estadoId,
            codigo: 'ACTIVA' as const,
            nombre: 'Activa',
            descripcion: null,
            activo: true,
            orden: 0
          }
        }
        onVolver={handleVolver}
        actividad={actividad}
      />

      {/* Cards de información */}
      {clasificacion && fechas && cupos && costo && (
        <ActividadInfoCards
          clasificacion={clasificacion}
          fechas={fechas}
          cupos={cupos}
          costo={costo}
        />
      )}

      {/* Sistema de Pestañas */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleChangeTab}
          aria-label="Pestañas de gestión de actividad"
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.95rem'
            }
          }}
        >
          <Tab
            value="horarios"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon fontSize="small" />
                Horarios
                <Badge
                  badgeContent={contadorHorarios}
                  color="primary"
                  sx={{ ml: 1 }}
                />
              </Box>
            }
          />
          <Tab
            value="docentes"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon fontSize="small" />
                Docentes
                <Badge
                  badgeContent={contadorDocentes}
                  color="primary"
                  sx={{ ml: 1 }}
                />
              </Box>
            }
          />
          <Tab
            value="participantes"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleIcon fontSize="small" />
                Participantes
                <Badge
                  badgeContent={contadorParticipantes}
                  color="primary"
                  sx={{ ml: 1 }}
                />
              </Box>
            }
          />
          <Tab
            value="aulas"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RoomIcon fontSize="small" />
                Aulas
                <Badge
                  badgeContent={contadorAulas}
                  color="primary"
                  sx={{ ml: 1 }}
                />
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* Contenido de las pestañas */}
      <Box sx={{ py: 2 }}>
        {/* Pestaña: Horarios */}
        {activeTab === 'horarios' && (
          <HorariosTab
            actividadId={Number(id)}
            actividadNombre={actividad.nombre}
            horarios={horarios || []}
            loading={horariosLoading}
            onRefresh={handleRefreshData}
          />
        )}

        {/* Pestaña: Docentes */}
        {activeTab === 'docentes' && (
          <DocentesTab
            actividadId={Number(id)}
            actividadNombre={actividad.nombre}
            docentes={docentes as any || []}
            loading={docentesLoading}
            onRefresh={handleRefreshData}
          />
        )}

        {/* Pestaña: Participantes */}
        {activeTab === 'participantes' && (
          <ParticipantesTab
            actividadId={Number(id)}
            actividadNombre={actividad.nombre}
            costoActividad={actividad.costo}
            fechaInicioActividad={actividad.fechaDesde}
            participantes={participantes as any || []}
            loading={participantesLoading}
            cupoMaximo={cupoMaximo}
            cupoActual={cupoActual}
            onRefresh={handleRefreshData}
          />
        )}

        {/* Pestaña: Aulas */}
        {activeTab === 'aulas' && (
          <AulasTab
            actividadId={Number(id)}
            actividadNombre={actividad.nombre}
            tieneHorarios={horarios && horarios.length > 0}
            aulas={aulas || []}
            loading={aulasLoading}
            onRefresh={handleRefreshData}
          />
        )}
      </Box>

      {/* Observaciones de la actividad (si existen) */}
      {actividad.observaciones && (
        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Observaciones
          </Typography>
          <Typography variant="body2">
            {actividad.observaciones}
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default ActividadDetallePageV2;
