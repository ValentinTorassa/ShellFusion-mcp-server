import api from './api';

export type ITicket = {
  _id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: {
    _id: string;
    email: string;
  } | null;
  createdBy: {
    _id: string;
    email: string;
  };
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
};

interface TicketsResponse {
  success: boolean;
  data: ITicket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface TicketResponse {
  success: boolean;
  data: ITicket;
}

export const getAllTickets = async (): Promise<ITicket[]> => {
  const response = await api.get<TicketsResponse>('/api/tickets');
  return response.data.data;
};

export const getTicketById = async (id: string): Promise<ITicket> => {
  const response = await api.get<TicketResponse>(`/api/tickets/${id}`);
  return response.data.data;
};

