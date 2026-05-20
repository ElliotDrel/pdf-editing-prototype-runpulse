import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
	weight: "400",
	style: ["normal", "italic"],
	subsets: ["latin"],
	variable: "--font-instrument-serif",
});
const dmSans = DM_Sans({
	weight: ["300", "400", "500", "600", "700"],
	subsets: ["latin"],
	variable: "--font-dm-sans",
});
const jetbrains = JetBrains_Mono({
	weight: ["400", "500", "600"],
	subsets: ["latin"],
	variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
	metadataBase: new URL("https://example.com"),
	title: "Pulse Form Fill demo",
	description: "Select a PDF, edit the fields, get a filled PDF back.",
	openGraph: {
		title: "Pulse Form Fill demo",
		description: "Select a PDF, edit the fields, get a filled PDF back.",
		images: ["/og-image.png"],
		type: "website",
	},
	twitter: { card: "summary_large_image" },
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html
			lang="en"
			className={`${instrumentSerif.variable} ${dmSans.variable} ${jetbrains.variable}`}
		>
			<body className="font-body bg-bg text-fg">{children}</body>
		</html>
	);
}
