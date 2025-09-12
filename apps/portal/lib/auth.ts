import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  organizations: Organization[];
  currentOrganization: Organization | null;
  setAuth: (data: { user: User; token: string; organizations: Organization[] }) => void;
  setCurrentOrganization: (org: Organization) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      organizations: [],
      currentOrganization: null,
      setAuth: (data) => set({ 
        user: data.user, 
        token: data.token, 
        organizations: data.organizations,
        currentOrganization: data.organizations[0] || null,
      }),
      setCurrentOrganization: (org) => set({ currentOrganization: org }),
      logout: () => set({ 
        user: null, 
        token: null, 
        organizations: [], 
        currentOrganization: null,
      }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

export const apiClient = {
  get: async (url: string) => {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${url}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
  },
  
  post: async (url: string, data?: any) => {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
  },
  
  delete: async (url: string) => {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${url}`, {
      method: 'DELETE',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
  },
};