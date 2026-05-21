export function isPublicMockMode(): boolean {
	return process.env.NEXT_PUBLIC_PULSE_MOCK_MODE === "1";
}
