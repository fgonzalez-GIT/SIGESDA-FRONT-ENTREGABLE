import React from 'react';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { toggleSidebar } from '../../store/slices/uiSlice';
import Sidebar from './Sidebar';
import Header from './Header';
import GlobalNotification from '../common/GlobalNotification';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { sidebarOpen } = useAppSelector((state) => state.ui);

  const handleSidebarToggle = () => {
    dispatch(toggleSidebar());
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Header
        sidebarOpen={sidebarOpen}
        onSidebarToggle={handleSidebarToggle}
      />
      <Sidebar open={sidebarOpen} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          transition: (theme) =>
            theme.transitions.create('margin', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          marginLeft: sidebarOpen ? 0 : '-280px',
        }}
      >
        <Toolbar />
        {children}
      </Box>
      <GlobalNotification />
    </Box>
  );
};

export default DashboardLayout;