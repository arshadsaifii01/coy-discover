import "./globals.css";

export const metadata = {
  title: "Coy · Discover",
  description: "Swipe-based discovery with mutual-only matching.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ff4f78",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
