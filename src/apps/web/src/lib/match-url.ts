const matchPath = /^\/match\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/?$/i;

export function matchIdFromPath(pathname: string): string | undefined {
  return matchPath.exec(pathname)?.[1].toLowerCase();
}

export function matchPathFor(id: string): string {
  if (!matchPath.test(`/match/${id}`)) throw new Error('Identificador de partida inválido.');
  return `/match/${id.toLowerCase()}`;
}

export function replaceMatchPath(id?: string): void {
  const target = id ? matchPathFor(id) : '/';
  if (window.location.pathname !== target) window.history.replaceState({ matchId: id }, '', target);
}

export function absoluteMatchUrl(id: string): string {
  return new URL(matchPathFor(id), window.location.origin).toString();
}
