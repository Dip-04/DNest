import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "DNest", short_name: "DNest", description: "Our little place, no matter the distance.", start_url: "/home", display: "standalone", background_color: "#f7f2eb", theme_color: "#a95f69", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }] };
}
