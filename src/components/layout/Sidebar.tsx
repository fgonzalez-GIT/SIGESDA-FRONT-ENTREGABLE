import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Toolbar,
  Collapse,
} from '@mui/material';
import {
  Dashboard,
  People,
  MusicNote,
  Room,
  Settings,
  Group,
  GroupAdd,
  CalendarToday,
  Receipt,
  Payment,
  AccountBalance,
  Category,
  ExpandLess,
  ExpandMore,
  PersonAdd,
  School,
  ContactPhone,
  AdminPanelSettings,
  Inventory,
  AttachMoney,
  BarChart,
  Backup,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const DRAWER_WIDTH = 280;

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  path?: string;
  color: string;
  subItems?: {
    title: string;
    icon: React.ReactNode;
    path: string;
  }[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
    color: '#1976d2',
  },
  {
    title: 'Personas',
    icon: <People />,
    path: '/personas',
    color: '#1565c0',
    subItems: [
      {
        title: 'Tipos de Persona',
        icon: <AdminPanelSettings fontSize="small" />,
        path: '/admin/personas/tipos',
      },
      {
        title: 'Tipos de Contacto',
        icon: <ContactPhone fontSize="small" />,
        path: '/admin/personas/tipos-contacto',
      },
      {
        title: 'Categorías de Socios',
        icon: <Category fontSize="small" />,
        path: '/categorias',
      },
      {
        title: 'Especialidades Docentes',
        icon: <School fontSize="small" />,
        path: '/admin/personas/especialidades',
      },
    ],
  },
  {
    title: 'Actividades',
    icon: <MusicNote />,
    path: '/actividades',
    color: '#ed6c02',
    subItems: [
      {
        title: 'Tipos de Actividad',
        icon: <Category fontSize="small" />,
        path: '/admin/actividades/tipos',
      },
      {
        title: 'Categorías de Actividad',
        icon: <Category fontSize="small" />,
        path: '/admin/actividades/categorias',
      },
    ],
  },
  {
    title: 'Aulas',
    icon: <Room />,
    path: '/aulas',
    color: '#9c27b0',
    subItems: [
      {
        title: 'Equipamientos',
        icon: <Inventory fontSize="small" />,
        path: '/admin/aulas/equipamientos',
      },
    ],
  },
  {
    title: 'Participación',
    icon: <Group />,
    path: '/participacion',
    color: '#d32f2f',
  },
  {
    title: 'Familiares',
    icon: <GroupAdd />,
    path: '/familiares',
    color: '#f57c00',
  },
  {
    title: 'Reservas',
    icon: <CalendarToday />,
    path: '/reservas',
    color: '#303f9f',
  },
  {
    title: 'Recibos',
    icon: <Receipt />,
    path: '/recibos',
    color: '#388e3c',
  },
  {
    title: 'Pagos de Actividades',
    icon: <AttachMoney />,
    path: '/pagos-actividades',
    color: '#2e7d32',
  },
  {
    title: 'Cuotas',
    icon: <AccountBalance />,
    path: '/cuotas',
    color: '#1976d2',
    subItems: [
      {
        title: 'Categorías de Ítems',
        icon: <Category fontSize="small" />,
        path: '/admin/cuotas/categorias-items',
      },
      {
        title: 'Tipos de Ítems',
        icon: <Inventory fontSize="small" />,
        path: '/admin/cuotas/tipos-items',
      },
    ],
  },
  {
    title: 'Medios de Pago',
    icon: <Payment />,
    path: '/medios-pago',
    color: '#7b1fa2',
  },
  {
    title: 'Configuración',
    icon: <Settings />,
    path: '/configuracion',
    color: '#616161',
    subItems: [
      {
        title: 'Días de Vencimiento',
        icon: <CalendarToday fontSize="small" />,
        path: '/configuracion/dias-vencimiento',
      },
      {
        title: 'Backups del Sistema',
        icon: <Backup fontSize="small" />,
        path: '/configuracion/backups',
      },
    ],
  }
];

interface SidebarProps {
  open: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleToggleExpand = (title: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const isItemActive = (item: MenuItem): boolean => {
    if (item.path && location.pathname === item.path) return true;
    if (item.subItems) {
      return item.subItems.some((sub) => location.pathname === sub.path);
    }
    return false;
  };

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: '#f8f9fa',
          borderRight: '1px solid #e0e0e0',
        },
      }}
    >
      <Toolbar />

      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h5" component="h1" fontWeight="bold" color="primary">
          🎵 SIGESDA
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sistema de Gestión Musical
        </Typography>
      </Box>

      <Divider />

      <List sx={{ pt: 1 }}>
        {menuItems.map((item) => (
          <React.Fragment key={item.title}>
            <ListItem disablePadding sx={{ mb: 0.5, px: 1 }}>
              <ListItemButton
                onClick={() => {
                  if (item.subItems) {
                    handleToggleExpand(item.title);
                  }
                  if (item.path) {
                    handleNavigation(item.path);
                  }
                }}
                selected={isItemActive(item)}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    backgroundColor: `${item.color}15`,
                    '& .MuiListItemIcon-root': {
                      color: item.color,
                    },
                    '& .MuiListItemText-primary': {
                      color: item.color,
                      fontWeight: 600,
                    },
                  },
                  '&:hover': {
                    backgroundColor: `${item.color}08`,
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isItemActive(item) ? 600 : 400,
                  }}
                />
                {item.subItems && (
                  expandedItems[item.title] ? <ExpandLess /> : <ExpandMore />
                )}
              </ListItemButton>
            </ListItem>

            {/* Submenú */}
            {item.subItems && (
              <Collapse in={expandedItems[item.title]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.subItems.map((subItem) => (
                    <ListItem key={subItem.path} disablePadding sx={{ pl: 2, pr: 1, mb: 0.5 }}>
                      <ListItemButton
                        onClick={() => handleNavigation(subItem.path)}
                        selected={location.pathname === subItem.path}
                        sx={{
                          borderRadius: 2,
                          pl: 3,
                          '&.Mui-selected': {
                            backgroundColor: `${item.color}20`,
                            '& .MuiListItemIcon-root': {
                              color: item.color,
                            },
                            '& .MuiListItemText-primary': {
                              color: item.color,
                              fontWeight: 600,
                            },
                          },
                          '&:hover': {
                            backgroundColor: `${item.color}10`,
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 35 }}>
                          {subItem.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={subItem.title}
                          primaryTypographyProps={{
                            fontSize: '0.85rem',
                            fontWeight: location.pathname === subItem.path ? 600 : 400,
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;