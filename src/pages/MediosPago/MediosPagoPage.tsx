import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Card,
  CardContent,
  Alert,
  Switch,
  FormControlLabel,
  Paper,
  InputAdornment,
  Tabs,
  Tab,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  AccountBalance as BankIcon,
  CreditCard as CardIcon,
  LocalAtm as CashIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  CheckCircle as CheckCircleIcon,
  Percent as PercentIcon,
  Info as InfoIcon,
  ViewList,
  BarChart,
} from '@mui/icons-material';
import { FiltrosAccordion } from '../../components/common/FiltrosAccordion';
import { EstadisticasCards, EstadisticaItem } from '../../components/common/EstadisticasCards';
import { SeccionPaginaTitulo } from '../../components/common/SeccionPaginaTitulo';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';

interface MedioPago {
  id: number;
  nombre: string;
  tipo: 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Cheque' | 'Otro';
  descripcion?: string;
  activo: boolean;
  requiereReferencia: boolean;
  comision?: number;
  observaciones?: string;
}

const MediosPagoPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [mediosPago, setMediosPago] = useState<MedioPago[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMedio, setSelectedMedio] = useState<MedioPago | null>(null);
  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('');
  const [filterActivo, setFilterActivo] = useState<string>('');
  const [filtrosExpanded, setFiltrosExpanded] = useState(false);
  const [mainTab, setMainTab] = useState(0);
  const [verTodos, setVerTodos] = useState(false);

  const [formData, setFormData] = useState<Partial<MedioPago>>({
    nombre: '',
    tipo: 'Efectivo',
    descripcion: '',
    activo: true,
    requiereReferencia: false,
    comision: 0,
    observaciones: ''
  });

  const tiposMedioPago = ['Efectivo', 'Transferencia', 'Tarjeta', 'Cheque', 'Otro'] as const;

  useEffect(() => {
    // Datos de ejemplo - en producción vendría de la API
    setMediosPago([
      {
        id: 1,
        nombre: 'Efectivo',
        tipo: 'Efectivo',
        descripcion: 'Pago en efectivo',
        activo: true,
        requiereReferencia: false
      },
      {
        id: 2,
        nombre: 'Transferencia Bancaria',
        tipo: 'Transferencia',
        descripcion: 'Transferencia a cuenta bancaria',
        activo: true,
        requiereReferencia: true,
        observaciones: 'Cuenta: 1234567890 - Banco Nacional'
      },
      {
        id: 3,
        nombre: 'Tarjeta de Débito',
        tipo: 'Tarjeta',
        descripcion: 'Pago con tarjeta de débito',
        activo: true,
        requiereReferencia: true,
        comision: 2.5
      },
      {
        id: 4,
        nombre: 'Tarjeta de Crédito',
        tipo: 'Tarjeta',
        descripcion: 'Pago con tarjeta de crédito',
        activo: true,
        requiereReferencia: true,
        comision: 3.5
      },
      {
        id: 5,
        nombre: 'Cheque',
        tipo: 'Cheque',
        descripcion: 'Pago con cheque',
        activo: false,
        requiereReferencia: true,
        observaciones: 'Temporalmente deshabilitado'
      }
    ]);
  }, []);

  const handleOpenDialog = (medio?: MedioPago) => {
    if (medio) {
      setSelectedMedio(medio);
      setFormData(medio);
    } else {
      setSelectedMedio(null);
      setFormData({
        nombre: '',
        tipo: 'Efectivo',
        descripcion: '',
        activo: true,
        requiereReferencia: false,
        comision: 0,
        observaciones: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMedio(null);
    setFormData({});
  };

  const handleSave = () => {
    if (selectedMedio) {
      // Actualizar medio existente
      setMediosPago(prev => prev.map(medio =>
        medio.id === selectedMedio.id ? { ...formData as MedioPago } : medio
      ));
    } else {
      // Crear nuevo medio
      const newMedio: MedioPago = {
        ...formData as MedioPago,
        id: Date.now()
      };
      setMediosPago(prev => [...prev, newMedio]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id: number) => {
    setMediosPago(prev => prev.filter(medio => medio.id !== id));
  };

  const handleToggleActivo = (id: number) => {
    setMediosPago(prev => prev.map(medio =>
      medio.id === id ? { ...medio, activo: !medio.activo } : medio
    ));
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'Efectivo':
        return <CashIcon color="success" />;
      case 'Transferencia':
        return <BankIcon color="primary" />;
      case 'Tarjeta':
        return <CardIcon color="info" />;
      default:
        return <PaymentIcon color="action" />;
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'nombre',
      headerName: 'Nombre',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getTipoIcon(params.row.tipo)}
          {params.value}
        </Box>
      )
    },
    {
      field: 'tipo',
      headerName: 'Tipo',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} variant="outlined" size="small" />
      )
    },
    { field: 'descripcion', headerName: 'Descripción', width: 250 },
    {
      field: 'requiereReferencia',
      headerName: 'Requiere Ref.',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Sí' : 'No'}
          color={params.value ? 'info' : 'default'}
          variant="outlined"
          size="small"
        />
      )
    },
    {
      field: 'comision',
      headerName: 'Comisión (%)',
      width: 100,
      renderCell: (params) => params.value ? `${params.value}%` : '-'
    },
    {
      field: 'activo',
      headerName: 'Estado',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Activo' : 'Inactivo'}
          color={params.value ? 'success' : 'error'}
          variant="outlined"
          size="small"
        />
      )
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Acciones',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Editar"
          onClick={() => handleOpenDialog(params.row)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Eliminar"
          onClick={() => handleDelete(params.row.id)}
        />
      ]
    }
  ];

  // Función para limpiar filtros
  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterTipo('');
    setFilterActivo('');
  };

  // Estadísticas para cards
  const estadisticas = useMemo<EstadisticaItem[]>(() => {
    const total = mediosPago.length;
    const activos = mediosPago.filter(m => m.activo).length;
    const conComision = mediosPago.filter(m => m.comision && m.comision > 0).length;
    const requierenRef = mediosPago.filter(m => m.requiereReferencia).length;

    return [
      {
        label: 'Total Medios',
        value: total,
        icon: PaymentIcon,
        color: 'primary',
        formato: 'numero',
      },
      {
        label: 'Activos',
        value: activos,
        icon: CheckCircleIcon,
        color: 'success',
        formato: 'numero',
      },
      {
        label: 'Con Comisión',
        value: conComision,
        icon: PercentIcon,
        color: 'warning',
        formato: 'numero',
      },
      {
        label: 'Requieren Ref.',
        value: requierenRef,
        icon: InfoIcon,
        color: 'info',
        formato: 'numero',
      },
    ];
  }, [mediosPago]);

  // Contar filtros activos
  const filtrosActivos = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (filterTipo) count++;
    if (filterActivo) count++;
    return count;
  }, [searchTerm, filterTipo, filterActivo]);

  // Aplicar filtros
  const filteredMediosPago = mediosPago.filter((medio) => {
    // Filtro de búsqueda (nombre, descripción)
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' ||
      medio.nombre.toLowerCase().includes(searchLower) ||
      (medio.descripcion && medio.descripcion.toLowerCase().includes(searchLower));

    // Filtro por tipo
    const matchesTipo = filterTipo === '' || medio.tipo === filterTipo;

    // Filtro por activo
    const matchesActivo = filterActivo === '' ||
      (filterActivo === 'activo' && medio.activo) ||
      (filterActivo === 'inactivo' && !medio.activo);

    return matchesSearch && matchesTipo && matchesActivo;
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <SeccionPaginaTitulo
        titulo="Medios de Pago"
        subtitulo="Los medios de pago configurados aquí estarán disponibles al registrar pagos de cuotas y recibos"
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Configuración', href: '/configuracion' },
          { label: 'Medios de Pago' },
        ]}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nuevo Medio de Pago
          </Button>
        }
      />

      {/* Tabs Principal: Vista General | Estadísticas */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={mainTab} onChange={(_, newValue) => setMainTab(newValue)}>
          <Tab icon={<ViewList />} label="Vista General" iconPosition="start" />
          <Tab icon={<BarChart />} label="Estadísticas" iconPosition="start" />
        </Tabs>
      </Box>

      {/* TAB 0: Vista General - Filtros + Tabla */}
      {mainTab === 0 && (
        <>
          {/* Filtros con Accordion */}
          <FiltrosAccordion
            expanded={filtrosExpanded}
            onToggle={() => setFiltrosExpanded(!filtrosExpanded)}
            activeCount={filtrosActivos}
            onClearFilters={handleClearFilters}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Buscar por nombre o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={filterTipo}
                    onChange={(e) => setFilterTipo(e.target.value)}
                    label="Tipo"
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {tiposMedioPago.map((tipo) => (
                      <MenuItem key={tipo} value={tipo}>
                        {tipo}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filterActivo}
                    onChange={(e) => setFilterActivo(e.target.value)}
                    label="Estado"
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="activo">Activos</MenuItem>
                    <MenuItem value="inactivo">Inactivos</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  {filteredMediosPago.length} de {mediosPago.length} medios
                </Typography>
              </Grid>
            </Grid>
          </FiltrosAccordion>

          {/* Tabla de medios de pago */}
          <Box display="flex" alignItems="center" mb={1}>
            <Button
              variant={verTodos ? 'contained' : 'outlined'}
              size="small"
              color="secondary"
              onClick={() => setVerTodos(prev => !prev)}
              startIcon={<ViewList />}
            >
              {verTodos ? `Mostrando todos (${filteredMediosPago.length} medios)` : 'Ver todos'}
            </Button>
          </Box>
          <Box sx={{ height: verTodos ? 'auto' : 600, minHeight: 200, width: '100%' }}>
            <DataGrid
              rows={filteredMediosPago}
              columns={columns}
              paginationModel={verTodos
                ? { pageSize: filteredMediosPago.length || 100, page: 0 }
                : { pageSize: 10, page: 0 }
              }
              pageSizeOptions={verTodos ? [filteredMediosPago.length || 100] : [10, 25, 50]}
              disableRowSelectionOnClick
              autoHeight={verTodos}
              sx={{
                '& .MuiDataGrid-cell': {
                  padding: '8px',
                },
              }}
            />
          </Box>
        </>
      )}

      {/* TAB 1: Panel de Estadísticas */}
      {mainTab === 1 && (
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
          <Stack spacing={4}>
            <Box>
              <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PaymentIcon /> Estadísticas de Medios de Pago
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <PaymentIcon color="primary" sx={{ fontSize: 40 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Total Medios
                          </Typography>
                          <Typography variant="h4" color="primary">
                            {mediosPago.length}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Activos
                          </Typography>
                          <Typography variant="h4" color="success.main">
                            {mediosPago.filter(m => m.activo).length}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <PercentIcon color="warning" sx={{ fontSize: 40 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Con Comisión
                          </Typography>
                          <Typography variant="h4" color="warning.main">
                            {mediosPago.filter(m => m.comision && m.comision > 0).length}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <InfoIcon color="info" sx={{ fontSize: 40 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Requieren Ref.
                          </Typography>
                          <Typography variant="h4" color="info.main">
                            {mediosPago.filter(m => m.requiereReferencia).length}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* Dialog para crear/editar medio de pago */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedMedio ? 'Editar Medio de Pago' : 'Nuevo Medio de Pago'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Nombre"
                value={formData.nombre || ''}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formData.tipo || 'Efectivo'}
                  label="Tipo"
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as MedioPago['tipo'] })}
                >
                  {tiposMedioPago.map((tipo) => (
                    <MenuItem key={tipo} value={tipo}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getTipoIcon(tipo)}
                        {tipo}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Descripción"
                value={formData.descripcion || ''}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Comisión (%)"
                type="number"
                value={formData.comision || ''}
                onChange={(e) => setFormData({ ...formData, comision: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.activo || false}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    />
                  }
                  label="Medio de pago activo"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.requiereReferencia || false}
                      onChange={(e) => setFormData({ ...formData, requiereReferencia: e.target.checked })}
                    />
                  }
                  label="Requiere número de referencia"
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Observaciones"
                value={formData.observaciones || ''}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                multiline
                rows={3}
                placeholder="Información adicional, número de cuenta, etc."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            {selectedMedio ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MediosPagoPage;