import { ImageResponse } from "next/og";

export const size = {
    width: 180,
    height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
    return new ImageResponse(
        (
            <div
                style={{
                    alignItems: "center",
                    background: "#050b14",
                    display: "flex",
                    height: "100%",
                    justifyContent: "center",
                    width: "100%",
                }}
            >
                <div
                    style={{
                        alignItems: "center",
                        background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                        borderRadius: 38,
                        color: "white",
                        display: "flex",
                        fontFamily: "sans-serif",
                        fontSize: 64,
                        fontWeight: 800,
                        height: 112,
                        justifyContent: "center",
                        width: 112,
                    }}
                >
                    FM
                </div>
            </div>
        ),
        size,
    );
}