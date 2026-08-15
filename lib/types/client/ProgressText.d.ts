/**
 * Composer dock readout: subscribes to the host SSE stream
 * (/dsh-dl-pulse/events, event "progress") and renders one line of plain
 * text — name, percent, bytes, live rate — for every in-flight download.
 * Hidden while idle; reconnects are handled by the EventSource.
 * @module dsh-dl-pulse/client/ProgressText
 */
import { type ReactElement } from 'react';
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
/** Composed props: the dock's runtime share + the locale `t` seat. */
export type DownloadProgressProps = PropsRuntime<'conversation.input.dock'> & PropsLocale<'dsh-dl-pulse'>;
/**
 * The input-dock entry: pure text, no bar, updated the instant the host
 * pushes a change (real-time by construction, never a timer).
 * @param props - the composed dock entry props (t for the tooltip).
 */
export declare function ProgressText(props: DownloadProgressProps): ReactElement | null;
//# sourceMappingURL=ProgressText.d.ts.map