"use client";

export function MockModeBanner() {
	if (process.env.NEXT_PUBLIC_PULSE_MOCK_MODE !== "1") return null;

	return (
		<div
			className="px-4 py-1.5 text-center font-mono text-[10px] uppercase tracking-widest bg-amber-500/15 text-amber-200 border-b border-amber-500/30"
			role="status"
		>
			Test mode · no Pulse API calls
		</div>
	);
}
