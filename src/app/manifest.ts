import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "갓생 OS",
    short_name: "갓생 OS",
    description: "일·삶·돈 세 기둥으로 목표와 진척을 한눈에",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#171717",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
