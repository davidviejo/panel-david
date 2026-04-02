import { describe, expect, it } from 'vitest';
import { HttpClientError } from '../../services/httpClient';
import {
  getApiErrorMessage,
  isApiErrorStatus,
  isUnauthorizedApiError,
  normalizeApiError,
} from './errorHandling';

describe('errorHandling', () => {
  it('traduce errores HttpClientError por status conocido', () => {
    const error = new HttpClientError({
      code: 'HTTP_401',
      status: 401,
      message: 'Unauthorized backend',
    });

    const normalized = normalizeApiError(error);

    expect(normalized.message).toBe('Tu sesión expiró. Inicia sesión nuevamente.');
    expect(normalized.status).toBe(401);
    expect(isUnauthorizedApiError(error)).toBe(true);
  });

  it('usa mensaje por defecto para status 500', () => {
    const error = new HttpClientError({
      code: 'HTTP_500',
      status: 500,
      message: 'Internal server error',
    });

    expect(getApiErrorMessage(error)).toBe(
      'Ocurrió un error interno. Intenta nuevamente en unos minutos.',
    );
  });

  it('normaliza error de negocio serializado', () => {
    const backendError = {
      code: 'RULE_VALIDATION',
      message: 'La programación no cumple reglas',
      status: 403,
    };

    const normalized = normalizeApiError(backendError);

    expect(normalized.isBusinessError).toBe(true);
    expect(normalized.code).toBe('RULE_VALIDATION');
    expect(normalized.message).toBe('La programación no cumple reglas');
    expect(isApiErrorStatus(backendError, 403)).toBe(true);
  });

  it('devuelve fallback para errores desconocidos', () => {
    expect(getApiErrorMessage(null, 'Fallback')).toBe('Fallback');
  });
});
