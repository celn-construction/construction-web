import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { LoadingProvider } from "@/components/providers/LoadingProvider";
import ThemeRegistry from "@/components/providers/ThemeRegistry";
import { SnackbarProvider } from "@/hooks/useSnackbar";


export const metadata: Metadata = {
  title: "BuildTrack Pro",
  description: "Construction project management",
  icons: [
    { rel: "icon", url: "/favicon.svg", type: "image/svg+xml" },
    { rel: "icon", url: "/favicon.ico", sizes: "32x32" },
  ],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${jetbrainsMono.variable}`}>
      <body>
        <TRPCReactProvider>
          <ThemeRegistry>
            <SnackbarProvider>
              <LoadingProvider>{children}</LoadingProvider>
            </SnackbarProvider>
          </ThemeRegistry>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
