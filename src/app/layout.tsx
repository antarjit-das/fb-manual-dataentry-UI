import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Facebook Data Collector",
  description:
    "Local-first hierarchical data-entry tool for manual Facebook post, comment, and reply collection",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="app-header">
          <div className="container">
            <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
              <h1>Facebook Data Collector</h1>
            </Link>
            <nav>
              <Link href="/" className="btn btn-outline btn-sm">
                Dashboard
              </Link>
              <Link href="/collect" className="btn btn-primary btn-sm">
                + Insert New Post
              </Link>
            </nav>
          </div>
        </header>
        <main className="container" style={{ paddingBottom: "3rem" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
