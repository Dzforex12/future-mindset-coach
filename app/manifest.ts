import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Future Mindset Coach",
        short_name: "FutureMindset",
        description: "Trade with discipline. Build your future.",
        start_url: "/dashboard",
        display: "standalone",
        orientation: "portrait-primary",
        theme_color: "#050b14",
        background_color: "#050b14",
        icons: [
            {
                src: "/icon.svg",
                sizes: "any",
                type: "image/svg+xml",
                purpose: "any",
            },
            {
                src: "/icon-maskable.svg",
                sizes: "any",
                type: "image/svg+xml",
                purpose: "maskable",
            },
        ],
    };
}