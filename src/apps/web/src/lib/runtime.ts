const configuredApiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim().replace(/\/$/, '') ?? '';

if (configuredApiBase && !/^https:\/\/[a-z0-9.-]+(?::\d+)?(?:\/.*)?$/i.test(configuredApiBase)) {
  throw new Error('VITE_API_BASE_URL debe ser una dirección HTTPS válida.');
}

export const publicDemo = import.meta.env.VITE_PUBLIC_DEMO === 'true';
export const operationalPublic = import.meta.env.VITE_OPERATIONAL_PUBLIC === 'true';
export const browserPractice = publicDemo || operationalPublic || Boolean(configuredApiBase);
export const apiUrl = (path: string) => `${configuredApiBase}/api${path}`;
