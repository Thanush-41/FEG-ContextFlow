import {
  type ApiError,
  type DemoTicket,
  type PlaceDemoBet,
  type OfferResponse,
  type OfferTimeFilter,
  type EventDetailResponse,
  type BetBuilderValidation,
  type BetSlip,
  type LedgerEntry,
  type PlaceSlipBet,
  type SlipMode,
  type SportsEvent,
  type Wallet,
  type WalletMutation,
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

  getEventDetail(eventId: string): Promise<EventDetailResponse> {
    return this.get(`/api/events/${encodeURIComponent(eventId)}/detail`);
  }

  validateBetBuilder(eventId: string, selectionIds: string[]): Promise<BetBuilderValidation> {
    return this.post(`/api/events/${encodeURIComponent(eventId)}/betbuilder/validate`, { selectionIds });
  }

  getSlip(ownerId: string, tab: number): Promise<BetSlip> {
    return this.get(`/api/slips/${encodeURIComponent(ownerId)}/tabs/${tab}`);
  }

  addSlipSelection(ownerId: string, tab: number, input: { eventId: string; marketId: string; selectionId: string; acceptedOdds: number; expectedVersion: number }): Promise<BetSlip> {
    return this.post(`/api/slips/${encodeURIComponent(ownerId)}/tabs/${tab}/selections`, input);
  }

  removeSlipSelection(ownerId: string, tab: number, selectionId: string, expectedVersion: number): Promise<BetSlip> {
    return this.request(`/api/slips/${encodeURIComponent(ownerId)}/tabs/${tab}/selections/${encodeURIComponent(selectionId)}`, { method: 'DELETE', body: JSON.stringify({ expectedVersion }) });
  }

  updateSlip(ownerId: string, tab: number, input: { expectedVersion: number; mode?: SlipMode; systemSize?: number; stakeMinorUnits?: number; acceptOddsChanges?: boolean }): Promise<BetSlip> {
    return this.request(`/api/slips/${encodeURIComponent(ownerId)}/tabs/${tab}`, { method: 'PATCH', body: JSON.stringify(input) });
  }

  clearSlip(ownerId: string, tab: number, expectedVersion: number): Promise<BetSlip> {
    return this.request(`/api/slips/${encodeURIComponent(ownerId)}/tabs/${tab}`, { method: 'DELETE', body: JSON.stringify({ expectedVersion }) });
  }

  placeDemoBet(input: PlaceDemoBet): Promise<DemoTicket> {
    return this.post('/api/bets', input);
  }

  getTickets(): Promise<DemoTicket[]> {
    return this.get('/api/bets');
  }

  getWallet(userId: string): Promise<Wallet> {
    return this.get(`/api/wallets/${encodeURIComponent(userId)}`);
  }

  getWalletLedger(userId: string): Promise<LedgerEntry[]> {
    return this.get(`/api/wallets/${encodeURIComponent(userId)}/ledger`);
  }

  depositDemoFunds(userId: string, input: WalletMutation): Promise<{ wallet: Wallet; entry: LedgerEntry }> {
    return this.post(`/api/wallets/${encodeURIComponent(userId)}/deposit`, input);
  }

  withdrawDemoFunds(userId: string, input: WalletMutation): Promise<{ wallet: Wallet; entry: LedgerEntry }> {
    return this.post(`/api/wallets/${encodeURIComponent(userId)}/withdraw`, input);
  }

  placeSlipBet(input: PlaceSlipBet): Promise<DemoTicket> {
    return this.post('/api/tickets/place', input);
  }

  getPlacedTickets(ownerId: string): Promise<DemoTicket[]> {
    return this.get(`/api/tickets/${encodeURIComponent(ownerId)}`);
  }

  findPlacedTicket(ownerId: string, code: string): Promise<DemoTicket> {
    return this.get(`/api/tickets/${encodeURIComponent(ownerId)}/code/${encodeURIComponent(code)}`);
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
