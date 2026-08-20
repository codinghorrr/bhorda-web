/**
 * Admin panel mount point (`/vedmata`).
 * Screens and auth are implemented in a later phase — PRD §7.
 */
export async function handleAdmin(_request: Request, _env: Env, _ctx: ExecutionContext): Promise<Response> {
	return Response.json({ error: 'not implemented' }, { status: 501 });
}
