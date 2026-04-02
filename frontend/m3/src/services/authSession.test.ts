import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_MESSAGES, consumeAuthFlashMessage, handleUnauthorizedSession, setAuthFlashMessage } from './authSession';

describe('authSession', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('stores and consumes flash messages once', () => {
    setAuthFlashMessage(AUTH_MESSAGES.sessionExpired);
    expect(consumeAuthFlashMessage()).toBe(AUTH_MESSAGES.sessionExpired);
    expect(consumeAuthFlashMessage()).toBeUndefined();
  });

  it('redirects /c/:slug routes to matching project login', () => {
    const assignSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '/c/acme/overview', assign: assignSpy },
    });

    handleUnauthorizedSession();

    expect(assignSpy).toHaveBeenCalledWith('/p/acme');
    expect(consumeAuthFlashMessage()).toBe(AUTH_MESSAGES.sessionExpired);
  });

  it('avoids redirects when user is already on login screens', () => {
    const assignSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '/clientes', assign: assignSpy },
    });

    handleUnauthorizedSession();

    expect(assignSpy).not.toHaveBeenCalled();
  });
});
