/**
 * dsh-dl-pulse — browser half: mounts a plain-text, real-time download
 * readout at the left of the composer via the official
 * `conversation.input.dock` slot band. The host pushes every progress change
 * over SSE the instant a .progress file is written; this side only renders
 * (plus derives a per-download transfer rate from consecutive events). No
 * polling anywhere. Renders nothing while no download is in flight.
 *
 * Failure policy: every wiring failure is logged, never thrown — the web
 * shell fails the whole boot when a plugin apply throws.
 * @module dsh-dl-pulse/client
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type DlPulseKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        'dsh-dl-pulse': DlPulseKey;
    }
}
/** Required services: the slot registry, the conversation input facade, locale. */
export declare const inject: string[];
/** Apply the browser half. */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map