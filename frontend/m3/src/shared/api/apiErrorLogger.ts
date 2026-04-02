export interface ApiErrorLogEvent {
  endpoint: string;
  code: string;
  message: string;
  status?: number;
  traceId?: string;
  requestId?: string;
}

interface StructuredApiErrorLog extends ApiErrorLogEvent {
  level: 'error';
  timestamp: string;
}

export const logApiError = (event: ApiErrorLogEvent): StructuredApiErrorLog => {
  const payload: StructuredApiErrorLog = {
    level: 'error',
    timestamp: new Date().toISOString(),
    ...event,
    traceId: event.traceId || event.requestId,
  };

  console.error('[api-error]', payload);
  return payload;
};
