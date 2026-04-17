import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Smash Buddies: Pickleball Partner Matching",
  description: "Pickleball Partner Matching App - Generate balanced teams and track games",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="min-h-full flex flex-col antialiased" style={{ fontFamily: 'var(--font-poppins), sans-serif' }}>
        {children}
      </body>
    </html>
  );
}