import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
} from '@mui/material';
import { LoginOutlined } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import {
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  setLoading,
  setError,
  loginSuccess,
} from '@/store/slices/authSlice';
import { loginSchema, LoginFormData } from '@/schemas/auth.schema';
import { loginThunk } from '@/services/authApi';

/**
 * Página de Login
 * Formulario de autenticación con validación Zod
 */
export const LoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);

  // Obtener la ruta de origen (para redirigir después del login)
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Si ya está autenticado, redirigir
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Configurar formulario
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Handler de submit
  const onSubmit = async (data: LoginFormData) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const user = await loginThunk(data);

      dispatch(loginSuccess(user));

      // La redirección se maneja en el useEffect
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
      dispatch(setError(message));
      dispatch(setLoading(false));
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 2,
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <LoginOutlined sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              SIGESDA
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Inicia sesión para continuar
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Email */}
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    type="email"
                    fullWidth
                    autoFocus
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    disabled={loading}
                  />
                )}
              />

              {/* Password */}
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Contraseña"
                    type="password"
                    fullWidth
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    disabled={loading}
                  />
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                sx={{ mt: 2, py: 1.5 }}
                startIcon={loading ? <CircularProgress size={20} /> : <LoginOutlined />}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </Box>
          </form>

          {/* Usuarios de prueba */}
          <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Usuarios de prueba:
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              • admin@sigesda.com / admin123
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              • socio@sigesda.com / socio123
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              • docente@sigesda.com / docente123
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
