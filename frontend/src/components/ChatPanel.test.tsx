import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatPanel from './ChatPanel';
import * as chatApi from '../api/chat';

// Mock the API
vi.mock('../api/chat', () => ({
  postChatMessage: vi.fn(),
}));

describe('ChatPanel Component', () => {
  it('renders initial welcome message', () => {
    render(<ChatPanel sessionId="test-session" />);
    expect(screen.getByText(/deterministic FinResilience agent/i)).toBeInTheDocument();
  });

  it('handles sending a message and displaying the response', async () => {
    const mockResponse = {
      reply: 'Your health score is 85.',
      tool_calls_made: ['run_health_score'],
      tool_results: [{ tool: 'run_health_score', score: 85 }],
      fallback_used: false,
    };
    
    vi.mocked(chatApi.postChatMessage).mockResolvedValueOnce(mockResponse);

    render(<ChatPanel sessionId="test-session" />);
    
    const input = screen.getByPlaceholderText(/Ask a question/i);
    const sendButton = screen.getByRole('button', { name: /Send message/i });

    // Type and send
    fireEvent.change(input, { target: { value: 'What is my score?' } });
    fireEvent.click(sendButton);

    // Check user message is displayed
    expect(screen.getByText('What is my score?')).toBeInTheDocument();

    // Check loading state triggers
    expect(sendButton).toBeDisabled();

    // Wait for response
    await waitFor(() => {
      expect(screen.getByText('Your health score is 85.')).toBeInTheDocument();
    });

    // Check tool disclosure
    expect(screen.getByText(/Tools used: run_health_score/i)).toBeInTheDocument();
  });
});
