import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const BASE_URL = process.env.PULSE_BASE_URL ?? "https://api.runpulse.com";

type JobStatus = "pending" | "processing" | "completed" | "failed" | "canceled";

interface PulseJobResponse {
	job_id: string;
	status: JobStatus;
	result?: { pdf_url?: string };
	error?: string;
}

export async function GET(req: NextRequest) {
	const jobId = req.nextUrl.searchParams.get("jobId");
	if (!jobId) {
		return NextResponse.json({ error: "missing jobId" }, { status: 400 });
	}

	const apiKey = process.env.PULSE_API_KEY;
	if (!apiKey) {
		return NextResponse.json(
			{ error: "PULSE_API_KEY not set" },
			{ status: 500 },
		);
	}

	try {
		const res = await fetch(`${BASE_URL}/job/${encodeURIComponent(jobId)}`, {
			headers: { "x-api-key": apiKey },
		});

		if (!res.ok) {
			const detail = await res.text().catch(() => "");
			console.error(`pulse /job/${jobId} failed: ${res.status} ${detail}`);
			return NextResponse.json(
				{ error: "job status check failed" },
				{ status: 500 },
			);
		}

		const data = (await res.json()) as PulseJobResponse;

		if (data.status === "completed") {
			const pdfUrl = data.result?.pdf_url;
			if (!pdfUrl) {
				return NextResponse.json(
					{ error: "completed job missing pdf_url" },
					{ status: 500 },
				);
			}
			const pdfRes = await fetch(pdfUrl, {
				headers: { "x-api-key": apiKey },
			});
			if (!pdfRes.ok) {
				return NextResponse.json(
					{ error: `pdf_url fetch failed: ${pdfRes.status}` },
					{ status: 500 },
				);
			}
			if (!pdfRes.body) {
				return NextResponse.json(
					{ error: "empty pdf response" },
					{ status: 500 },
				);
			}
			return new NextResponse(pdfRes.body, {
				status: 200,
				headers: {
					"Content-Type": "application/pdf",
					"Content-Disposition": 'attachment; filename="pulse_render.pdf"',
					"Cache-Control": "no-store",
				},
			});
		}

		if (data.status === "failed" || data.status === "canceled") {
			return NextResponse.json(
				{
					error: `job ${data.status}${data.error ? `: ${data.error}` : ""}`,
				},
				{ status: 500 },
			);
		}

		return NextResponse.json({ status: data.status });
	} catch (err) {
		console.error("form-fill status route error:", err);
		return NextResponse.json({ error: "status check failed" }, { status: 500 });
	}
}
