import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import InputForm from './InputForm';

describe('InputForm Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<InputForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render proper heading hierarchy', () => {
    render(<InputForm />);
    expect(screen.getByRole('heading', { name: /Your Financial Snapshot/i })).toBeInTheDocument();
  });

  it('should have accessible labels for all inputs', () => {
    render(<InputForm />);
    // Check key inputs are labeled
    expect(screen.getByLabelText(/Monthly Income/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Monthly Expenses/i)).toBeInTheDocument();
  });
});
