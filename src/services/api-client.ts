export function buildApiUrl(base: string, path: string): string {
	if (import.meta.env.DEV) return path;
	return `${base}${path}`;
}

export async function fetchWithRetry(
	url: string,
	options?: RequestInit,
): Promise<Response> {
	let lastError: Error | null = null;

	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			const resp = await fetch(url, options);
			if (resp.ok) return resp;
			if (resp.status === 429 || resp.status >= 500) {
				await new Promise((r) =>
					setTimeout(r, (attempt + 1) * 1000 + Math.random() * 500),
				);
				continue;
			}
			throw new Error(`HTTP ${resp.status}`);
		} catch (err) {
			if (err instanceof TypeError) {
				lastError = err;
				await new Promise((r) => setTimeout(r, (attempt + 1) * 1000));
				continue;
			}
			throw err;
		}
	}

	throw lastError ?? new Error("Request failed after 3 retries");
}
