import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Is This a Scam? · A second look, with care",
  description:
    "A local screenshot checker that helps you pause, understand a message, and choose a cautious next step.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
