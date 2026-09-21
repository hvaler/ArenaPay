const matchPath = /^\/match\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/?$/i;

export function matchIdFromPath(pathname: string): string | undefined {
  return matchPath.exec(pathname)?.[1].toLowerCase();
}

export function matchPathFor(id: string): string {
  if (!matchPath.test(`/match/${id}`)) throw new Error('Identificador de partida inválido.');
  return `/match/${id.toLowerCase()}`;
}

// La demo de GitHub Pages cuelga de un subdirectorio, así que la raíz de la aplicación no es '/'.
// Resolver contra la base del build evita que limpiar la ruta saque al visitante fuera de la demo.
const appRoot = (href: string) => new URL(import.meta.env.BASE_URL, href);

export function replaceMatchPath(id?: string, href = window.location.href): void {
  const root = appRoot(href);
  const target = id ? new URL(matchPathFor(id).slice(1), root) : root;
  if (new URL(href).pathname !== target.pathname) window.history.replaceState({ matchId: id }, '', target.pathname);
}

export function absoluteMatchUrl(id: string, href = window.location.href): string {
  return new URL(matchPathFor(id).slice(1), appRoot(href)).toString();
}
