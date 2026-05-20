// components/PdfSelector.tsx
"use client";

import Link from "next/link";
import { editableFormHref, type PdfKey } from "@/lib/types";
import { PdfViewer } from "./PdfViewer";

const PDF_SRC: Record<PdfKey, string> = {
	"prior-auth": "/sample-prior-auth.pdf",
	referral: "/sample-referral.pdf",
};

export function PdfSelector() {
	return (
		<div className="px-8 lg:px-16 py-8 lg:flex-1 lg:overflow-y-auto">
			<div className="max-w-[1200px] mx-auto">
				<div className="grid grid-cols-2 gap-6">
					{(["prior-auth", "referral"] as const).map((key) => {
						const title =
							key === "prior-auth"
								? "Prior Authorization Form"
								: "Specialist Referral Request";
						const description =
							key === "prior-auth"
								? "Standard medical prior authorization form with a flat single-page field layout."
								: "Multi-section specialist referral request with nested groups and clinical fields.";
						return (
							<div key={key} className="flex flex-col gap-3">
								<Link
									href={editableFormHref(key)}
									className="px-1 group/header cursor-pointer block"
								>
									<h3 className="font-display text-sm text-fg font-medium group-hover/header:text-accent transition-colors">
										{title}
									</h3>
									<p className="text-fg-dim text-[10px] font-mono uppercase tracking-wider">
										{description}
									</p>
								</Link>
								<div
									className="relative bg-bg-elev border border-border rounded-xl overflow-hidden shadow-sm"
									style={{ height: "360px" }}
								>
									<PdfViewer src={PDF_SRC[key]} />
								</div>
								<Link
									href={editableFormHref(key)}
									className="w-full py-2 bg-accent/10 hover:bg-accent text-accent hover:text-bg font-mono text-[10px] uppercase tracking-widest rounded-lg border border-accent/20 hover:border-accent transition-all duration-200 text-center block"
								>
									Select & Edit Form →
								</Link>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
