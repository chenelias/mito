import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // Allow other devices on the LAN (e.g. phones acting as remote-control
  // targets) to reach the dev server at http://192.168.1.101:3000
  allowedDevOrigins: ["192.168.1.101"],
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
