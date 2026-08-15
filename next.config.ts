import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite는 WASM을 로드하므로 번들링하지 않고 Node에서 직접 require해야 한다
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
