import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DistribucionEstadoChart } from '../DistribucionEstadoChart';

describe('DistribucionEstadoChart', () => {
  const mockData = {
    PAGADO: { cantidad: 40, monto: 200000 },
    PENDIENTE: { cantidad: 8, monto: 40000 },
    VENCIDO: { cantidad: 2, monto: 10000 }
  };

  it('should render without crashing with valid data', () => {
    const { container } = render(<DistribucionEstadoChart data={mockData} />);

    // Component should render
    expect(container.firstChild).toBeTruthy();
  });

  it('should display message when no data is available', () => {
    render(<DistribucionEstadoChart data={{}} />);

    expect(screen.getByText(/No hay datos para mostrar/i)).toBeInTheDocument();
  });

  it('should display message when all values are zero', () => {
    const dataWithZeros = {
      PAGADO: { cantidad: 0, monto: 0 },
      PENDIENTE: { cantidad: 0, monto: 0 }
    };

    render(<DistribucionEstadoChart data={dataWithZeros} />);

    expect(screen.getByText(/No hay datos para mostrar/i)).toBeInTheDocument();
  });

  it('should render with mixed zero and non-zero values', () => {
    const dataWithZeros = {
      PAGADO: { cantidad: 0, monto: 0 },
      PENDIENTE: { cantidad: 8, monto: 40000 }
    };

    const { container } = render(<DistribucionEstadoChart data={dataWithZeros} />);

    // Should filter out zero values and render chart
    expect(container.firstChild).toBeTruthy();
    expect(screen.queryByText(/No hay datos para mostrar/i)).not.toBeInTheDocument();
  });
});
