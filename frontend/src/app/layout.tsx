import type { Metadata, Viewport } from "next";
import { Cinzel, Poppins } from "next/font/google";
import { Background } from "@/components/Background";
import { Providers } from "@/components/Providers";
import { SoundControls } from "@/components/SoundControls";
import "./globals.css";

const display = Cinzel({ variable: "--font-display", subsets: ["latin"], weight: ["700", "900"] });
const body = Poppins({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Chor Police — Royal Night",
  description: "The classic childhood game of Raja, Mantri, Sipahi and Chor. Now play with your friends online.",
};

export const viewport: Viewport = {
  themeColor: "#080D1B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <Background />
        <Providers>
          {children}
          <SoundControls />
        </Providers>
      </body>
    </html>
  );
}
