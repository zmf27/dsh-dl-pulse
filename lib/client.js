window.__ModuleLoader__.load({
	id: "dsh-dl-pulse",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/ProgressText.tsx
		/**
		* Composer dock readout: subscribes to the host SSE stream
		* (/dsh-dl-pulse/events, event "progress") and renders one line of plain
		* text — name, percent, bytes, live rate — for every in-flight download.
		* Hidden while idle; reconnects are handled by the EventSource.
		* @module dsh-dl-pulse/client/ProgressText
		*/
		/** Human-readable byte size. */
		function fmtBytes(bytes) {
			const gb = bytes / 1024 ** 3;
			if (gb >= 1) return `${gb.toFixed(1)} GB`;
			const mb = bytes / 1024 ** 2;
			if (mb >= 1) return `${mb.toFixed(0)} MB`;
			return `${(bytes / 1024).toFixed(0)} KB`;
		}
		/**
		* The input-dock entry: pure text, no bar, updated the instant the host
		* pushes a change (real-time by construction, never a timer).
		* @param props - the composed dock entry props (t for the tooltip).
		*/
		function ProgressText(props) {
			const [downloads, setDownloads] = (0, react.useState)([]);
			const last = (0, react.useRef)(/* @__PURE__ */ new Map());
			const speeds = (0, react.useRef)(/* @__PURE__ */ new Map());
			(0, react.useEffect)(() => {
				const source = new EventSource("/dsh-dl-pulse/events");
				const onEvent = (raw) => {
					try {
						const data = JSON.parse(raw.data);
						if (data.kind !== "progress" || !Array.isArray(data.downloads)) return;
						const now = performance.now();
						const nextSpeeds = /* @__PURE__ */ new Map();
						for (const download of data.downloads) {
							const prev = last.current.get(download.name);
							if (prev !== void 0 && download.done >= prev.done && now > prev.time) {
								const delta = download.done - prev.done;
								const dt = (now - prev.time) / 1e3;
								if (dt > 0) nextSpeeds.set(download.name, delta / dt);
							}
							last.current.set(download.name, {
								time: now,
								done: download.done
							});
						}
						speeds.current = nextSpeeds;
						setDownloads(data.downloads);
					} catch {}
				};
				source.addEventListener("progress", onEvent);
				return () => {
					source.close();
				};
			}, []);
			if (downloads.length === 0) return null;
			const text = downloads.map((download) => {
				const pct = download.total > 0 ? Math.round(download.done / download.total * 100) : 0;
				const rate = speeds.current.get(download.name);
				const rateText = rate !== void 0 && rate > 0 ? ` · ${fmtBytes(rate)}/s` : "";
				return `${download.name} ${pct}% (${fmtBytes(download.done)}/${fmtBytes(download.total)}${rateText})`;
			}).join("　");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				style: {
					fontSize: 12,
					color: "var(--muted-foreground, #888)",
					fontVariantNumeric: "tabular-nums",
					whiteSpace: "nowrap",
					padding: "0 8px"
				},
				title: typeof props.t === "function" ? `${props.t("dl.tooltip")}: ${text}` : text,
				children: ["↓ ", text]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/**
		* Locale strings for the dsh-dl-pulse surfaces (zh/en). The client registers
		* the dictionary through the locale service like the sibling plugins; the
		* visible progress line is data-only (numbers and universal symbols), so only
		* the tooltip carries copy.
		* @module dsh-dl-pulse/client/locales
		*/
		const zh = {
			"dl.tooltip": "下载中",
			"dl.rate": "速率"
		};
		const en = {
			"dl.tooltip": "Downloading",
			"dl.rate": "Rate"
		};
		/** The dictionary namespace this plugin owns. */
		const NS = "dsh-dl-pulse";
		/** Dictionary table for the locale service (zh/en by the host locale). */
		const dictionaries = {
			zh,
			en
		};
		//#endregion
		//#region src/client/index.ts
		/** Required services: the slot registry, the conversation input facade, locale. */
		const inject = [
			"slots",
			"conversation",
			"sessions",
			"locale"
		];
		/** Apply the browser half. */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, dictionaries), "dsh-dl-pulse: dictionaries");
			ctx.inject([
				"slots",
				"conversation",
				"sessions"
			], (scope) => {
				scope.slots.inject("conversation.input.dock", () => scope.slots.register({
					name: "conversation.input.dock",
					id: "dsh-dl-pulse",
					order: 5,
					locale: NS,
					registrant: "dsh-dl-pulse",
					inject: (_sessionId) => ({})
				}, ProgressText));
			});
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map