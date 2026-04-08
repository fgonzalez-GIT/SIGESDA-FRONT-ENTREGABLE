import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkSelectionToolbar } from '../BulkSelectionToolbar';

describe('BulkSelectionToolbar', () => {
  const mockOnBulkDelete = vi.fn();
  const mockOnClearSelection = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render toolbar with selection count', () => {
    render(
      <BulkSelectionToolbar
        selectedCount={5}
        onBulkDelete={mockOnBulkDelete}
        onClearSelection={mockOnClearSelection}
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('registros seleccionados')).toBeInTheDocument();
  });

  it('should display singular text for 1 selected item', () => {
    render(
      <BulkSelectionToolbar
        selectedCount={1}
        onBulkDelete={mockOnBulkDelete}
        onClearSelection={mockOnClearSelection}
      />
    );

    expect(screen.getByText('registro seleccionado')).toBeInTheDocument();
  });

  it('should call onBulkDelete when delete button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <BulkSelectionToolbar
        selectedCount={5}
        onBulkDelete={mockOnBulkDelete}
        onClearSelection={mockOnClearSelection}
      />
    );

    const deleteButton = screen.getByLabelText('eliminar seleccionados');
    await user.click(deleteButton);

    expect(mockOnBulkDelete).toHaveBeenCalledTimes(1);
    expect(mockOnClearSelection).not.toHaveBeenCalled();
  });

  it('should call onClearSelection when clear button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <BulkSelectionToolbar
        selectedCount={5}
        onBulkDelete={mockOnBulkDelete}
        onClearSelection={mockOnClearSelection}
      />
    );

    const clearButton = screen.getByLabelText('limpiar selección');
    await user.click(clearButton);

    expect(mockOnClearSelection).toHaveBeenCalledTimes(1);
    expect(mockOnBulkDelete).not.toHaveBeenCalled();
  });

  it('should disable delete button when selectedCount is 0', () => {
    render(
      <BulkSelectionToolbar
        selectedCount={0}
        onBulkDelete={mockOnBulkDelete}
        onClearSelection={mockOnClearSelection}
      />
    );

    const deleteButton = screen.getByLabelText('eliminar seleccionados');
    expect(deleteButton).toBeDisabled();
  });

  it('should disable delete button when over maxSelection', () => {
    render(
      <BulkSelectionToolbar
        selectedCount={101}
        onBulkDelete={mockOnBulkDelete}
        onClearSelection={mockOnClearSelection}
        maxSelection={100}
      />
    );

    const deleteButton = screen.getByLabelText('eliminar seleccionados');
    expect(deleteButton).toBeDisabled();
  });

  it('should show error styling when over maxSelection', () => {
    const { container } = render(
      <BulkSelectionToolbar
        selectedCount={101}
        onBulkDelete={mockOnBulkDelete}
        onClearSelection={mockOnClearSelection}
        maxSelection={100}
      />
    );

    // Check for error color chip
    const errorChip = container.querySelector('.MuiChip-colorError');
    expect(errorChip).toBeInTheDocument();
  });

  it('should display warning message when over maxSelection', () => {
    render(
      <BulkSelectionToolbar
        selectedCount={105}
        onBulkDelete={mockOnBulkDelete}
        onClearSelection={mockOnClearSelection}
        maxSelection={100}
      />
    );

    expect(screen.getByText(/Máximo 100 registros permitidos/i)).toBeInTheDocument();
    expect(screen.getByText(/Deselecciona 5 registro\(s\)/i)).toBeInTheDocument();
  });

  it('should NOT show warning message when under maxSelection', () => {
    render(
      <BulkSelectionToolbar
        selectedCount={50}
        onBulkDelete={mockOnBulkDelete}
        onClearSelection={mockOnClearSelection}
        maxSelection={100}
      />
    );

    expect(screen.queryByText(/Máximo 100 registros permitidos/i)).not.toBeInTheDocument();
  });

  it('should use default maxSelection of 100 if not provided', () => {
    render(
      <BulkSelectionToolbar
        selectedCount={101}
        onBulkDelete={mockOnBulkDelete}
        onClearSelection={mockOnClearSelection}
      />
    );

    expect(screen.getByText(/Máximo 100 registros permitidos/i)).toBeInTheDocument();
  });

  it('should allow custom maxSelection', () => {
    render(
      <BulkSelectionToolbar
        selectedCount={51}
        onBulkDelete={mockOnBulkDelete}
        onClearSelection={mockOnClearSelection}
        maxSelection={50}
      />
    );

    expect(screen.getByText(/Máximo 50 registros permitidos/i)).toBeInTheDocument();
    expect(screen.getByText(/Deselecciona 1 registro\(s\)/i)).toBeInTheDocument();
  });

  it('should display primary color when selection is valid', () => {
    const { container } = render(
      <BulkSelectionToolbar
        selectedCount={50}
        onBulkDelete={mockOnBulkDelete}
        onClearSelection={mockOnClearSelection}
        maxSelection={100}
      />
    );

    // Check for primary color chip
    const primaryChip = container.querySelector('.MuiChip-colorPrimary');
    expect(primaryChip).toBeInTheDocument();
  });

  it('should show delete icon in delete button', () => {
    render(
      <BulkSelectionToolbar
        selectedCount={5}
        onBulkDelete={mockOnBulkDelete}
        onClearSelection={mockOnClearSelection}
      />
    );

    // MUI DeleteIcon has data-testid="DeleteIcon"
    const deleteIcon = document.querySelector('[data-testid="DeleteIcon"]');
    expect(deleteIcon).toBeInTheDocument();
  });

  it('should show close icon in clear button', () => {
    render(
      <BulkSelectionToolbar
        selectedCount={5}
        onBulkDelete={mockOnBulkDelete}
        onClearSelection={mockOnClearSelection}
      />
    );

    // MUI CloseIcon has data-testid="CloseIcon"
    const closeIcon = document.querySelector('[data-testid="CloseIcon"]');
    expect(closeIcon).toBeInTheDocument();
  });

  it('should enable delete button when exactly at maxSelection', () => {
    render(
      <BulkSelectionToolbar
        selectedCount={100}
        onBulkDelete={mockOnBulkDelete}
        onClearSelection={mockOnClearSelection}
        maxSelection={100}
      />
    );

    const deleteButton = screen.getByLabelText('eliminar seleccionados');
    expect(deleteButton).not.toBeDisabled();
  });

  it('should always enable clear button regardless of selectedCount', () => {
    const { rerender } = render(
      <BulkSelectionToolbar
        selectedCount={0}
        onBulkDelete={mockOnBulkDelete}
        onClearSelection={mockOnClearSelection}
      />
    );

    let clearButton = screen.getByLabelText('limpiar selección');
    expect(clearButton).not.toBeDisabled();

    rerender(
      <BulkSelectionToolbar
        selectedCount={101}
        onBulkDelete={mockOnBulkDelete}
        onClearSelection={mockOnClearSelection}
        maxSelection={100}
      />
    );

    clearButton = screen.getByLabelText('limpiar selección');
    expect(clearButton).not.toBeDisabled();
  });

  it('should render tooltips on hover', () => {
    render(
      <BulkSelectionToolbar
        selectedCount={5}
        onBulkDelete={mockOnBulkDelete}
        onClearSelection={mockOnClearSelection}
      />
    );

    // Tooltips are rendered by MUI
    const deleteButton = screen.getByLabelText('eliminar seleccionados');
    const clearButton = screen.getByLabelText('limpiar selección');

    expect(deleteButton).toBeInTheDocument();
    expect(clearButton).toBeInTheDocument();
  });

  it('should handle rapid clicks on clear button', async () => {
    const user = userEvent.setup();

    render(
      <BulkSelectionToolbar
        selectedCount={10}
        onBulkDelete={mockOnBulkDelete}
        onClearSelection={mockOnClearSelection}
      />
    );

    const clearButton = screen.getByLabelText('limpiar selección');

    await user.click(clearButton);
    await user.click(clearButton);
    await user.click(clearButton);

    // Should call onClearSelection 3 times (no debounce)
    expect(mockOnClearSelection).toHaveBeenCalledTimes(3);
  });
});
