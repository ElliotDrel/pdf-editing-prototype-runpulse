export function HtmlExtractPlaceholder() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[280px] px-6 py-12 text-center rounded-lg border border-dashed border-danger/30 bg-bg-elev">
			<div className="font-mono text-[10px] uppercase tracking-widest text-danger mb-2">
				/extract failed
			</div>
			<p className="text-sm text-fg-dim max-w-xs leading-relaxed">
				Pulse could not return an editable HTML form for this PDF. Field review
				is unavailable.
			</p>
		</div>
	);
}
