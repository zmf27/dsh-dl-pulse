/**
 * Locale strings for the dsh-dl-pulse surfaces (zh/en). The client registers
 * the dictionary through the locale service like the sibling plugins; the
 * visible progress line is data-only (numbers and universal symbols), so only
 * the tooltip carries copy.
 * @module dsh-dl-pulse/client/locales
 */
declare const zh: {
    readonly 'dl.tooltip': "下载中";
    readonly 'dl.rate': "速率";
};
export type DlPulseKey = keyof typeof zh;
/** The dictionary namespace this plugin owns. */
export declare const NS = "dsh-dl-pulse";
/** Dictionary table for the locale service (zh/en by the host locale). */
export declare const dictionaries: Record<'zh' | 'en', Record<DlPulseKey, string>>;
export {};
//# sourceMappingURL=locales.d.ts.map