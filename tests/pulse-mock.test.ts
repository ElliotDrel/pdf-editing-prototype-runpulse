import { afterEach, describe, expect, it } from "vitest";
import {
	isPulseMockMode,
	mockDelayMs,
	mockExtractFields,
	mockFillDelayMs,
} from "@/lib/pulse-mock";

describe("pulse-mock", () => {
	const saved = process.env.PULSE_MOCK_MODE;

	afterEach(() => {
		if (saved === undefined) delete process.env.PULSE_MOCK_MODE;
		else process.env.PULSE_MOCK_MODE = saved;
	});

	it("is off unless PULSE_MOCK_MODE=1", () => {
		delete process.env.PULSE_MOCK_MODE;
		expect(isPulseMockMode()).toBe(false);
		process.env.PULSE_MOCK_MODE = "1";
		expect(isPulseMockMode()).toBe(true);
	});

	it("returns sample fields per template", () => {
		expect(mockExtractFields("prior-auth").length).toBeGreaterThan(0);
		expect(mockExtractFields("referral").length).toBeGreaterThan(0);
	});

	it("parses delay env vars with defaults", () => {
		delete process.env.PULSE_MOCK_DELAY_MS;
		delete process.env.PULSE_MOCK_FILL_DELAY_MS;
		expect(mockDelayMs()).toBe(1500);
		expect(mockFillDelayMs()).toBe(3000);
	});
});
