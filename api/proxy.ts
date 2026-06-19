const TARGETS: Record<string, string> = {
	word: "https://api2.hanzii.net",
	kanji: "https://api2.hanzii.net",
	suggest: "https://suggest.hanzii.net",
	chatgpt: "https://api.hanzii.net",
} as const;

export async function GET(request: Request): Promise<Response> {
	const { searchParams } = new URL(request.url);
	const target = searchParams.get("to");
	const path = searchParams.get("path");

	const base = target ? TARGETS[target] : undefined;
	if (!base || !path) {
		return new Response("Missing `to` or `path` parameter", { status: 400 });
	}

	try {
		const resp = await fetch(`${base}${path}`, {
			method: request.method,
			headers: { "Content-Type": "application/json" },
		});
		const data = await resp.json();
		return Response.json(data, { status: resp.status });
	} catch {
		return new Response("Proxy failed", { status: 502 });
	}
}
