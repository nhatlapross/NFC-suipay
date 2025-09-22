import type { Metadata } from "next";
import { Geist_Mono, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Layout from "@/components/layout/Layout";

const geistIBMPlexMono = IBM_Plex_Mono({
    variable: "--font-ibm-plex-mono",
    subsets: ["latin"],
    weight: ["100", "200", "300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Panda Pay App",
    description: "Secure NFC Payment Solution",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${geistIBMPlexMono.variable} ${geistMono.variable} antialiased`}
            >
                <Layout>{children}</Layout>
            </body>
        </html>
    );
}
