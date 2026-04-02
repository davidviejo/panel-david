const AUTH_FLASH_KEY = 'portal_auth_flash';

export const AUTH_MESSAGES = {
  sessionExpired: 'Tu sesión expiró. Inicia sesión nuevamente.',
  forbidden: 'No tienes permisos para realizar esta acción.',
} as const;

const isLoginRoute = (pathname: string): boolean => {
  return pathname === '/clientes' || pathname.startsWith('/p/') || pathname === '/operator';
};

const resolveLoginRoute = (pathname: string): string => {
  if (pathname.startsWith('/c/')) {
    const parts = pathname.split('/').filter(Boolean);
    const slug = parts[1];
    if (slug) {
      return `/p/${slug}`;
    }
    return '/clientes';
  }

  if (pathname.startsWith('/operator')) {
    return '/operator';
  }

  return '/clientes';
};

export const setAuthFlashMessage = (message: string): void => {
  try {
    sessionStorage.setItem(AUTH_FLASH_KEY, message);
  } catch {
    // noop
  }
};

export const consumeAuthFlashMessage = (): string | undefined => {
  try {
    const value = sessionStorage.getItem(AUTH_FLASH_KEY);
    if (!value) {
      return undefined;
    }
    sessionStorage.removeItem(AUTH_FLASH_KEY);
    return value;
  } catch {
    return undefined;
  }
};

export const handleUnauthorizedSession = (): void => {
  const { pathname } = window.location;

  if (isLoginRoute(pathname)) {
    return;
  }

  const redirectTo = resolveLoginRoute(pathname);
  setAuthFlashMessage(AUTH_MESSAGES.sessionExpired);
  window.location.assign(redirectTo);
};
