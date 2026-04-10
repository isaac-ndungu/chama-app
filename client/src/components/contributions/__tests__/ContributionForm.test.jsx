import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContributionForm from '../ContributionForm';

// Mock the API module — don't make real HTTP calls in component tests
vi.mock('../../../api/contributions', () => ({
  recordContribution: vi.fn().mockResolvedValue({ data: { contribution: {} } })
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() }
}));

const mockMembers = [
  { userId: { _id: 'user1', name: 'Kamau' }, role: 'chairperson' },
  { userId: { _id: 'user2', name: 'Wanjiru' }, role: 'treasurer' }
];

describe('ContributionForm', () => {
  it('renders all required fields', () => {
    render(<ContributionForm chamaId="chama1" members={mockMembers} cycleId="cycle1" />);
    expect(screen.getByLabelText(/Member/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/M-Pesa Reference/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Payment Date/i)).toBeInTheDocument();
  });

  it('shows error toast when amount is not a whole number', async () => {
    const toast = await import('react-hot-toast');
    const { container } = render(<ContributionForm chamaId="chama1" members={mockMembers} cycleId="cycle1" />);

    await userEvent.selectOptions(screen.getByRole('combobox'), 'user1');
    await userEvent.type(screen.getByLabelText(/Amount/i), '5000.50');
    await userEvent.type(screen.getByLabelText(/M-Pesa Reference/i), 'ABC123');

    // Submit the form directly
    const form = container.querySelector('form');
    fireEvent.submit(form);

    // The toast should be called immediately
    expect(toast.default.error).toHaveBeenCalledWith('Amount must be a whole number in KES');
  });

  it('does not call API when member is not selected', async () => {
    const { recordContribution } = await import('../../../api/contributions');
    render(<ContributionForm chamaId="chama1" members={mockMembers} cycleId="cycle1" />);
    // Don't select a member
    await userEvent.type(screen.getByLabelText(/Amount/i), '5000');
    await userEvent.click(screen.getByRole('button', { name: /record contribution/i }));
    expect(recordContribution).not.toHaveBeenCalled();
  });
});