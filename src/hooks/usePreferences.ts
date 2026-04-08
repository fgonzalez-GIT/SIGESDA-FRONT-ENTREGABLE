import { useAppDispatch, useAppSelector } from './redux';
import { setTimeFormat, type TimeFormat } from '@/store/slices/preferencesSlice';

/**
 * Hook para acceder y modificar preferencias de usuario
 *
 * @example
 * const { timeFormat, updateTimeFormat } = usePreferences();
 *
 * // Usar en TimePicker
 * <TimePicker ampm={timeFormat === '12h'} />
 *
 * // Cambiar formato
 * updateTimeFormat('12h');
 */
export const usePreferences = () => {
  const dispatch = useAppDispatch();
  const { timeFormat } = useAppSelector((state) => state.preferences);

  const updateTimeFormat = (format: TimeFormat) => {
    dispatch(setTimeFormat(format));
  };

  return {
    timeFormat,
    updateTimeFormat,
    is24Hour: timeFormat === '24h',
    is12Hour: timeFormat === '12h',
  };
};

export default usePreferences;
