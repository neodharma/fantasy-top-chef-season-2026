import type { Metadata } from "next";
import { Outfit, Fira_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const firaMono = Fira_Mono({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Fantasy Top Chef — Draft Submission",
  description: "Submit your chef draft preferences for Fantasy Top Chef",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${firaMono.className} antialiased`}
      >
        <Nav />
        {children}
      </body>
    </html>
  );
}
