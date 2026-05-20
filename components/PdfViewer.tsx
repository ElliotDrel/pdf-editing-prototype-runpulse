// components/PdfViewer.tsx
"use client";

import type { HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
	src: string;
	className?: string;
}

export function PdfViewer({ src, className = "", ...props }: Props) {
	// Append #toolbar=1 to ensure the native browser toolbar (zoom, print, download) is loaded
	const url = src.includes("#") ? src : `${src}#toolbar=1`;

	return (
		<div className={`w-full h-full ${className}`} {...props}>
			<iframe
				src={url}
				className="w-full h-full border-none"
				title="PDF Document Viewer"
			/>
		</div>
	);
}
