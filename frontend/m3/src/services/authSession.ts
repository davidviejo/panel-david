const AUTH_REDIRECT_GUARD_KEY = 'portal_auth_redirect_ts';
const AUTH_REDIRECT_WINDOW_MS = 1500;

const canRedirectNow = (): boolean => {
  const now = Date.now();
  const last = Number(window.sessionStorage.getItem(AUTH_REDIRECT_GUARD_KEY) || 0);
  if (Number.isFinite(last) && now - last < AUTH_REDIRECT_WINDOW_MS) {
    return false;
  }
  window.sessionStorage.setItem(AUTH_REDIRECT_GUARD_KEY, String(now));
  return true;
};

export const redirectToLoginForExpiredSession = (): void => {
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (currentPath.includes('/clientes') && !currentPath.includes('/dashboard')) {
    return;
  }

  if (!canRedirectNow()) {
    return;
  }

  window.sessionStorage.setItem('portal_auth_message', 'session_expired');
  window.location.assign('/clientes');
};

export const consumeAuthMessage = (): string | null => {
  const value = window.sessionStorage.getItem('portal_auth_message');
  if (!value) {
    return null;
  }
  window.sessionStorage.removeItem('portal_auth_message');
  return value;
};
