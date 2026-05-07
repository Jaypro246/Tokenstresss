/**
* Canonical Web Crypto helpers for generated Cloudflare/OpenNext apps.
* Prefer these platform globals over Node crypto imports or UUID packages.
*/
export function generateId(): string {
return crypto.randomUUID();
}
