import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecaudacionCategoriaChart } from '../RecaudacionCategoriaChart';

describe('RecaudacionCategoriaChart', () => {
  const mockData = {
    ACTIVO: { cantidad: 30, monto: 150000 },
    ESTUDIANTE: { cantidad: 15, monto: 75000 },
    GENERAL: { cantidad: 5, monto: 25000 }
  };

  it('should render without crashing with valid data', () => {
    const { container } = render(<RecaudacionCategoriaChart data={mockData} />);

    // Component should render
    expect(container.firstChild).toBeTruthy();
  });

  it('should display message when no data is available', () => {
    render(<RecaudacionCategoriaChart data={{}} />);

    expect(screen.getByText(/No hay datos para mostrar/i)).toBeInTheDocument();
  });

  it('should display message when all values are zero', () => {
    const dataWithZeros = {
      ACTIVO: { cantidad: 0, monto: 0 },
      ESTUDIANTE: { cantidad: 0, monto: 0 }
    };

    render(<RecaudacionCategoriaChart data={dataWithZeros} />);

    expect(screen.getByText(/No hay datos para mostrar/i)).toBeInTheDocument();
  });

  it('should render with mixed zero and non-zero values', () => {
    const dataWithZeros = {
      ACTIVO: { cantidad: 0, monto: 0 },
      ESTUDIANTE: { cantidad: 15, monto: 75000 }
    };

    const { container } = render(<RecaudacionCategoriaChart data={dataWithZeros} />);

    // Should filter out zero values and render chart
    expect(container.firstChild).toBeTruthy();
    expect(screen.queryByText(/No hay datos para mostrar/i)).not.toBeInTheDocument();
  });

  it('should handle data sorting internally', () => {
    const unsortedData = {
      GENERAL: { cantidad: 5, monto: 25000 },
      ACTIVO: { cantidad: 30, monto: 150000 },
      ESTUDIANTE: { cantidad: 15, monto: 75000 }
    };

    const { container } = render(<RecaudacionCategoriaChart data={unsortedData} />);

    // Chart should be rendered (data is sorted internally by component)
    expect(container.firstChild).toBeTruthy();
  });
});
