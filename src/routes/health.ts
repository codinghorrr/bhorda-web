export function handleHealth(): Response {
	return Response.json(
		{
			status: 'ok',
			service: 'sevatirth-bhorda',
			timestamp: new Date().toISOString(),
		},
		{ status: 200 },
	);
}
