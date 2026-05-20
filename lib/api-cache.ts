// lib/api-cache.ts
// File-based cache for Pulse API responses that depend only on the input PDF.
// /form/clear and /extract always produce identical output for identical input,
// so we cache them to disk and skip the API call on repeat runs.
// /form/fill is never cached — it depends on user-edited field values.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const CACHE_DIR = resolve(process.cwd(), ".pulse-cache");

function ensureDir() {
	if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
}

function cachePath(key: string) {
	return resolve(CACHE_DIR, key);
}

export function readCacheBytes(key: string): Uint8Array | null {
	const p = cachePath(key);
	if (!existsSync(p)) return null;
	return new Uint8Array(readFileSync(p));
}

export function writeCacheBytes(key: string, data: Uint8Array) {
	ensureDir();
	writeFileSync(cachePath(key), data);
}

export function readCacheJson<T>(key: string): T | null {
	const p = cachePath(key);
	if (!existsSync(p)) return null;
	try {
		return JSON.parse(readFileSync(p, "utf8")) as T;
	} catch {
		return null;
	}
}

export function writeCacheJson<T>(key: string, data: T) {
	ensureDir();
	writeFileSync(cachePath(key), JSON.stringify(data), "utf8");
}
