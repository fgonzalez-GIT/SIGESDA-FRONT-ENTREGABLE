import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkDeleteConfirmDialog } from '../BulkDeleteConfirmDialog';

describe('BulkDeleteConfirmDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dialog when open=true', () => {
    render(
      <BulkDeleteConfirmDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        selectedCount={5}
        entityName="recibos"
      />
    );

    expect(screen.getByText('Confirmar Eliminación Masiva')).toBeInTheDocument();
    expect(screen.getByText('Esta acción no se puede deshacer')).toBeInTheDocument();
    expect(screen.getByText(/5 recibos/i)).toBeInTheDocument();
  });

  it('should not render dialog when open=false', () => {
    render(
      <BulkDeleteConfirmDialog
        open={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        selectedCount={5}
        entityName="recibos"
      />
    );

    expect(screen.queryByText('Confirmar Eliminación Masiva')).not.toBeInTheDocument();
  });

  it('should display correct selectedCount and entityName', () => {
    render(
      <BulkDeleteConfirmDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        selectedCount={10}
        entityName="pagos de actividades"
      />
    );

    expect(screen.getByText(/10 pagos de actividades/i)).toBeInTheDocument();
  });

  it('should display singular entityName for 1 item', () => {
    render(
      <BulkDeleteConfirmDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        selectedCount={1}
        entityName="recibo"
      />
    );

    expect(screen.getByText(/1 recibo/i)).toBeInTheDocument();
  });

  it('should call onClose when Cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <BulkDeleteConfirmDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        selectedCount={3}
        entityName="recibos"
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should call onConfirm when Eliminar button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <BulkDeleteConfirmDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        selectedCount={5}
        entityName="recibos"
      />
    );

    const deleteButton = screen.getByRole('button', { name: /eliminar 5/i });
    await user.click(deleteButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should disable buttons when loading=true', () => {
    render(
      <BulkDeleteConfirmDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        selectedCount={5}
        entityName="recibos"
        loading={true}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    const deleteButton = screen.getByRole('button', { name: /eliminando/i });

    expect(cancelButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();
  });

  it('should show "Eliminando..." text when loading=true', () => {
    render(
      <BulkDeleteConfirmDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        selectedCount={5}
        entityName="recibos"
        loading={true}
      />
    );

    expect(screen.getByRole('button', { name: /eliminando/i })).toBeInTheDocument();
  });

  it('should display warningMessage when provided', () => {
    const warningMessage = 'Algunos registros pueden no eliminarse si están pagados';

    render(
      <BulkDeleteConfirmDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        selectedCount={5}
        entityName="recibos"
        warningMessage={warningMessage}
      />
    );

    expect(screen.getByText(warningMessage)).toBeInTheDocument();
  });

  it('should not display warning alert when warningMessage is not provided', () => {
    render(
      <BulkDeleteConfirmDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        selectedCount={5}
        entityName="recibos"
      />
    );

    // Check there's only 1 alert (the "Esta acción no se puede deshacer" one)
    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(1);
  });

  it('should display business rule information', () => {
    render(
      <BulkDeleteConfirmDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        selectedCount={5}
        entityName="recibos"
      />
    );

    expect(
      screen.getByText(/Solo se eliminarán registros en estado PENDIENTE, VENCIDO o CANCELADO/i)
    ).toBeInTheDocument();
  });

  it('should display warning icon in title', () => {
    render(
      <BulkDeleteConfirmDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        selectedCount={5}
        entityName="recibos"
      />
    );

    // MUI WarningIcon has data-testid="WarningIcon"
    const warningIcon = document.querySelector('[data-testid="WarningIcon"]');
    expect(warningIcon).toBeInTheDocument();
  });

  it('should handle multiple clicks on buttons when not loading', async () => {
    const user = userEvent.setup();

    render(
      <BulkDeleteConfirmDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        selectedCount={3}
        entityName="recibos"
      />
    );

    const deleteButton = screen.getByRole('button', { name: /eliminar 3/i });

    // Simulate rapid clicks
    await user.click(deleteButton);
    await user.click(deleteButton);
    await user.click(deleteButton);

    // Should call onConfirm 3 times (no debounce protection in component)
    expect(mockOnConfirm).toHaveBeenCalledTimes(3);
  });

  it('should render correctly with 100 selected items (max)', () => {
    render(
      <BulkDeleteConfirmDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        selectedCount={100}
        entityName="recibos"
      />
    );

    expect(screen.getByText(/100 recibos/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /eliminar 100/i })).toBeInTheDocument();
  });

  it('should show error color chip for selected items', () => {
    const { container } = render(
      <BulkDeleteConfirmDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        selectedCount={5}
        entityName="recibos"
      />
    );

    // MUI Chip with color="error" has specific class
    const errorChip = container.querySelector('.MuiChip-colorError');
    expect(errorChip).toBeInTheDocument();
  });
});
