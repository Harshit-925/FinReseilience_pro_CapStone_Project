import pb from "./pocketbase";
import type { HouseholdInput } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface ToolResult {
  tool: string;
  [key: string]: any;
}

export interface ChatRequestPayload {
  message: string;
  session_id: string;
  profile_snapshot?: HouseholdInput;
}

export interface ChatResponsePayload {
  reply: string;
  tool_calls_made: string[];
  tool_results: ToolResult[];
  fallback_used: boolean;
}

export interface WhatIfChange {
  type: string;
  value: number;
  extra?: any;
}

export interface WhatIfRequestPayload {
  base_profile: HouseholdInput;
  change: WhatIfChange;
}

export interface NotificationPayload {
  id: string;
  type: string;
  message: string;
  read: boolean;
  created: string;
}

export async function postChatMessage(payload: ChatRequestPayload): Promise<ChatResponsePayload> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const token = pb.authStore.token;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.statusText}`);
  }

  return response.json();
}

export async function postWhatIf(payload: WhatIfRequestPayload): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const token = pb.authStore.token;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/whatif`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`What-if request failed: ${response.statusText}`);
  }

  return response.json();
}

export async function getNotifications(): Promise<NotificationPayload[]> {
  const token = pb.authStore.token;
  if (!token) return [];

  const response = await fetch(`${API_BASE}/notifications`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.statusText}`);
  }

  return response.json();
}

export interface ChatSession {
  session_id: string;
  created: string;
}

export async function getChatSessions(): Promise<ChatSession[]> {
  const token = pb.authStore.token;
  if (!token) return [];

  const response = await fetch(`${API_BASE}/chat/sessions`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch chat sessions: ${response.statusText}`);
  }

  return response.json();
}
