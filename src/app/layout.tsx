import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestura | AI Sign Language Interface",
  description: "Real-time sign language translation powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
