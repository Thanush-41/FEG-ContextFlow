import {
  type ApiError,
  type DemoTicket,
  type PlaceDemoBet,
  type OfferResponse,
  type OfferTimeFilter,
  type SportsEvent,
} from '@feg/contracts';

export class ContextFlowClient {
  constructor(
    private readonly baseUrl: string,
    private readonly getAccessToken: () => Promise<string | undefined>,
  ) {}

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  getEvents(status?: 'scheduled' | 'live'): Promise<SportsEvent[]> {
    return this.get(`/api/sports/events${status ? `?status=${status}` : ''}`);
  }

  getEvent(eventId: string): Promise<SportsEvent> {
    return this.get(`/api/sports/events/${eventId}`);
  }

  getOffer(timeFilter: OfferTimeFilter, cursor = 0, limit = 100): Promise<OfferResponse> {
    return this.get(`/api/offer?timeFilter=${timeFilter}&cursor=${cursor}&limit=${limit}`);
  }

  placeDemoBet(input: PlaceDemoBet): Promise<DemoTicket> {
    return this.post('/api/bets', input);
  }

  getTickets(): Promise<DemoTicket[]> {
    return this.get('/api/bets');
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const token = await this.getAccessToken();
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (token) headers.authorization = `Bearer ${token}`;
    const response = await fetch(new URL(path, this.baseUrl), { ...init, headers });
    if (!response.ok) {
      const candidate: unknown = await response.json();
      throw new ContextFlowApiError(
        isApiError(candidate)
          ? candidate
          : { error: { code: 'INVALID_ERROR_RESPONSE', message: 'Request failed.' } },
      );
    }
    return (await response.json()) as T;
  }
}

function isApiError(candidate: unknown): candidate is ApiError {
  if (!candidate || typeof candidate !== 'object' || !('error' in candidate)) return false;
  const error = candidate.error;
  return Boolean(
    error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' &&
    'message' in error && typeof error.message === 'string',
  );
}

export class ContextFlowApiError extends Error {
  constructor(readonly payload: ApiError) {
    super(payload.error.message);
    this.name = 'ContextFlowApiError';
  }
}
