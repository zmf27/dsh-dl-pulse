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
import type { Context } from '@deepseek-ai/cordis';
/** Required services: the route registry and the prompt band. */
export declare const inject: string[];
/** The watched progress directory (writer-side contract). */
export declare const DOWNLOADS_DIR: string;
/** Model-facing announcement: protocol + usage, so agents report progress. */
export declare const DL_PULSE_GUIDANCE = "\u672C\u673A\u5DF2\u5B89\u88C5 dsh-dl-pulse \u63D2\u4EF6\uFF08Web GUI \u8F93\u5165\u6846\u5DE6\u4FA7\u5B9E\u65F6\u4E0B\u8F7D\u8FDB\u5EA6\uFF0C\u7EAF\u6587\u5B57\uFF0C\u4E8B\u4EF6\u9A71\u52A8\u63A8\u9001\uFF09\u3002\u534F\u8BAE\uFF1A\u4EFB\u4F55\u4E0B\u8F7D\u4EFB\u52A1\u5411 ~/.dsh/downloads/<\u540D\u79F0>.progress \u5199\u5165\u4E24\u4E2A\u7A7A\u683C\u5206\u9694\u7684\u6570\u5B57 \"done total\"\uFF08\u5B57\u8282\u6570\uFF09\uFF0C\u6587\u4EF6\u5185\u5BB9\u4E00\u53D8\u5373\u5B9E\u65F6\u63A8\u9001\u5230\u754C\u9762\uFF1B\u4E0B\u8F7D\u5B8C\u6210\u6216\u53D6\u6D88\u65F6\u5220\u9664\u8BE5\u6587\u4EF6\uFF1B\u5199\u6587\u4EF6\u7528\u300C\u5148\u5199\u4E34\u65F6\u6587\u4EF6\u518D rename\u300D\u4FDD\u8BC1\u539F\u5B50\u6027\u3002\u7528\u6237\u63D0\u5230\u300C\u4E0B\u8F7D\u8FDB\u5EA6 / \u8FDB\u5EA6\u6761\u300D\u65F6\u5373\u6307\u672C\u63D2\u4EF6\uFF0C\u8BF7\u636E\u6B64\u534F\u4F5C\u3002";
/** One live download. */
export interface DownloadState {
    name: string;
    done: number;
    total: number;
}
/**
 * Snapshot every readable *.progress file in one directory, sorted by name.
 * Exported for tests; the production code passes DOWNLOADS_DIR.
 */
export declare function scanDir(dir: string): DownloadState[];
/**
 * Mount the routes and the watcher.
 * @param ctx - context carrying webServer and systemPrompt.
 */
export declare function apply(ctx: Context): void;
//# sourceMappingURL=index.d.ts.map