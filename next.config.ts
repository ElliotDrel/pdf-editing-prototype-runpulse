import withBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
};

const nextConfigWithAnalyzer = withBundleAnalyzer({
	enabled: process.env.ANALYZE === "true",
})(nextConfig);

export default nextConfigWithAnalyzer;
