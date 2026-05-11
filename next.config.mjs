import createNextIntlPlugin from "next-intl/plugin";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig = {
  output: "standalone",
};

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default bundleAnalyzer(withNextIntl(nextConfig));
