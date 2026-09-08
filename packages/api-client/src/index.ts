import { ApiErrorSchema, type ApiError } from '@feg/contracts';

export class ContextFlowClient {
  constructor(
    private readonly baseUrl: string,
    private readonly getAccessToken: () => Promise<string | undefined>,
  ) {}

  async get<T>(path: string): Promise<T> {
    const token = await this.getAccessToken();
    const headers = token ? { authorization: `Bearer ${token}` } : {};
    const response = await fetch(new URL(path, this.baseUrl), { headers });
    if (!response.ok) {
      const parsed = ApiErrorSchema.safeParse(await response.json());
      throw new ContextFlowApiError(
        parsed.success
          ? parsed.data
          : { error: { code: 'INVALID_ERROR_RESPONSE', message: 'Request failed.' } },
      );
    }
    return (await response.json()) as T;
  }
}

export class ContextFlowApiError extends Error {
  constructor(readonly payload: ApiError) {
    super(payload.error.message);
    this.name = 'ContextFlowApiError';
  }
}
