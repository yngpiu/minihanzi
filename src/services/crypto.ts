const SECRET_KEY =
	"I2F6a0dYSRcybhgOVA9aM1o+ByE4GAd+Vx4MMzQWH2cDCgFlWzYWGE5bHEBRAHNSXys7Jjl/XFFSFmQaBhUJPzU0H0tdaBABMR4MBx0eBkgNHFAfBwd7GlRFAFw6UQYlMBobBg==";
const PASSWORD = "myPepper123";

let aesKey: CryptoKey | null = null;

async function getAesKey(): Promise<CryptoKey> {
	if (aesKey) return aesKey;
	const r = Uint8Array.from(atob(SECRET_KEY), (c) => c.charCodeAt(0));
	r.reverse();
	const pwd = new TextEncoder().encode(PASSWORD);
	for (let i = 0; i < r.length; i++) r[i] ^= pwd[i % pwd.length];
	const decoded = new TextDecoder().decode(r);
	const keyHash = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(decoded),
	);
	aesKey = await crypto.subtle.importKey(
		"raw",
		keyHash,
		{ name: "AES-CBC" },
		false,
		["decrypt"],
	);
	return aesKey;
}

export async function decryptData<T>(encryptedB64: string): Promise<T> {
	const key = await getAesKey();
	const enc = Uint8Array.from(atob(encryptedB64), (c) => c.charCodeAt(0));
	const iv = enc.slice(0, 16);
	const ct = enc.slice(16);
	const plain = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, ct);
	return JSON.parse(new TextDecoder().decode(plain)) as T;
}
