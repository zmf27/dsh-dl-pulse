import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync, mkdirSync, readFileSync, readdirSync, watch } from "node:fs";
//#region src/index.ts
/**
* dsh-dl-pulse — host half: watches ~/.dsh/downloads/*.progress for
* real-time download progress and pushes it to the GUI over SSE.
*
* Protocol (also announced to agents via the system-prompt band):
*   - any download task writes "<done> <total>" (bytes, space separated) to
*     ~/.dsh/downloads/<name>.progress
*   - the host fs.watch fires on every change and broadcasts instantly
*     (event-driven; no polling)
*   - deleting the file marks the download as finished/cancelled
*   - writers should write a temp file and rename over for atomic updates
*
* Routes (loopback-only, same trust fence as dsh-ssh / dsh-aionui-panel):
*   GET /dsh-dl-pulse/state   — JSON snapshot of all downloads
*   GET /dsh-dl-pulse/events  — SSE stream (event "progress")
* @module dsh-dl-pulse
*/
/** Required services: the route registry and the prompt band. */
const inject = ["webServer", "systemPrompt"];
/** Order of the announcement section within the tool-guidance band. */
const SECTION_ORDER = 220;
/** The watched progress directory (writer-side contract). */
const DOWNLOADS_DIR = join(homedir(), ".dsh", "downloads");
/** Debounce window for bursty progress writes. */
const DEBOUNCE_MS = 120;
/** SSE keep-alive comment interval (proxies drop idle connections). */
const HEARTBEAT_MS = 15e3;
/** Model-facing announcement: protocol + usage, so agents report progress. */
const DL_PULSE_GUIDANCE = "本机已安装 dsh-dl-pulse 插件（Web GUI 输入框左侧实时下载进度，纯文字，事件驱动推送）。协议：任何下载任务向 ~/.dsh/downloads/<名称>.progress 写入两个空格分隔的数字 \"done total\"（字节数），文件内容一变即实时推送到界面；下载完成或取消时删除该文件；写文件用「先写临时文件再 rename」保证原子性。用户提到「下载进度 / 进度条」时即指本插件，请据此协作。";
/**
* Snapshot every readable *.progress file in one directory, sorted by name.
* Exported for tests; the production code passes DOWNLOADS_DIR.
*/
function scanDir(dir) {
	const out = [];
	let entries;
	try {
		entries = readdirSync(dir, { withFileTypes: true });
	} catch {
		return out;
	}
	for (const entry of entries) {
		if (!entry.isFile() || !entry.name.endsWith(".progress")) continue;
		try {
			const [doneRaw, totalRaw] = readFileSync(join(dir, entry.name), "utf8").trim().split(/\s+/);
			const done = Number(doneRaw);
			const total = Number(totalRaw);
			if (!Number.isFinite(done) || !Number.isFinite(total) || total <= 0) continue;
			out.push({
				name: entry.name.slice(0, -9),
				done: Math.max(0, done),
				total
			});
		} catch {}
	}
	return out.sort((a, b) => a.name.localeCompare(b.name));
}
/**
* Loopback trust fence — the same judgment dsh-ssh / dsh-aionui-panel apply
* to their host routes: a LAN-exposed dsh web must not serve these to
* unpaired devices.
*/
function isLoopbackRequest(request) {
	const address = request.socket.remoteAddress;
	if (address !== "127.0.0.1" && address !== "::1" && address !== "::ffff:127.0.0.1") return false;
	const host = request.headers.host;
	if (typeof host !== "string") return false;
	let hostUrl;
	try {
		hostUrl = new URL(`http://${host}`);
	} catch {
		return false;
	}
	if (hostUrl.hostname !== "127.0.0.1" && hostUrl.hostname !== "localhost" && hostUrl.hostname !== "[::1]") return false;
	if (request.headers["sec-fetch-site"] === "cross-site") return false;
	const origin = request.headers.origin;
	if (origin === void 0) return true;
	try {
		return new URL(origin).host === hostUrl.host;
	} catch {
		return false;
	}
}
/**
* Mount the routes and the watcher.
* @param ctx - context carrying webServer and systemPrompt.
*/
function apply(ctx) {
	if (!existsSync(DOWNLOADS_DIR)) try {
		mkdirSync(DOWNLOADS_DIR, { recursive: true });
	} catch {}
	const subscribers = /* @__PURE__ */ new Set();
	let debounce;
	const broadcast = () => {
		const payload = JSON.stringify({
			kind: "progress",
			downloads: scanDir(DOWNLOADS_DIR)
		});
		for (const res of subscribers) try {
			res.write(`event: progress\ndata: ${payload}\n\n`);
		} catch {}
	};
	let watcher;
	try {
		watcher = watch(DOWNLOADS_DIR, () => {
			clearTimeout(debounce);
			debounce = setTimeout(broadcast, DEBOUNCE_MS);
		});
	} catch {
		ctx.logger.warn("dsh-dl-pulse: downloads dir watcher unavailable");
	}
	const sse = (req, res) => {
		if (!isLoopbackRequest(req)) {
			res.writeHead(403);
			res.end();
			return;
		}
		res.writeHead(200, {
			"content-type": "text/event-stream; charset=utf-8",
			"cache-control": "no-cache",
			connection: "keep-alive"
		});
		res.write("retry: 2000\n\n");
		res.write(`event: progress\ndata: ${JSON.stringify({
			kind: "progress",
			downloads: scanDir(DOWNLOADS_DIR)
		})}\n\n`);
		subscribers.add(res);
		const heartbeat = setInterval(() => {
			try {
				res.write(": ping\n\n");
			} catch {}
		}, HEARTBEAT_MS);
		req.on("close", () => {
			subscribers.delete(res);
			clearInterval(heartbeat);
		});
	};
	const handler = async (req, res) => {
		const url = new URL(req.url ?? "/", "http://x");
		if (url.pathname === "/dsh-dl-pulse/events") {
			sse(req, res);
			return;
		}
		if (url.pathname === "/dsh-dl-pulse/state") {
			res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
			res.end(JSON.stringify({
				ok: true,
				downloads: scanDir(DOWNLOADS_DIR)
			}));
			return;
		}
		res.writeHead(404);
		res.end();
	};
	ctx.effect(() => {
		const disposers = [
			ctx.webServer.register({
				kind: "prefix",
				path: "/dsh-dl-pulse",
				handler
			}),
			ctx.webServer.register({
				kind: "exact",
				path: "/dsh-dl-pulse/events",
				handler: sse
			}),
			ctx.systemPrompt.section({
				name: "plugin:dl-pulse",
				order: SECTION_ORDER,
				text: DL_PULSE_GUIDANCE
			})
		];
		return () => {
			for (const dispose of disposers) dispose();
			if (debounce !== void 0) clearTimeout(debounce);
			try {
				watcher?.close();
			} catch {}
			for (const res of subscribers) try {
				res.end();
			} catch {}
			subscribers.clear();
		};
	}, "dsh-dl-pulse: routes");
}
//#endregion
export { DL_PULSE_GUIDANCE, DOWNLOADS_DIR, apply, inject, scanDir };
