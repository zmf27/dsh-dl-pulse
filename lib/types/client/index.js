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
import { ProgressText } from "./ProgressText.js";
import { NS, dictionaries } from "./locales.js";
/** Required services: the slot registry, the conversation input facade, locale. */
export const inject = ['slots', 'conversation', 'sessions', 'locale'];
/** Apply the browser half. */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, dictionaries), 'dsh-dl-pulse: dictionaries');
    ctx.inject(['slots', 'conversation', 'sessions'], (scope) => {
        scope.slots.inject('conversation.input.dock', () => scope.slots.register({
            name: 'conversation.input.dock',
            id: 'dsh-dl-pulse',
            order: 5,
            locale: NS,
            registrant: 'dsh-dl-pulse',
            inject: (_sessionId) => ({}),
        }, ProgressText));
    });
}
