import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dattix",
  description:
    "Local-first hierarchical research data collector for Facebook posts, comments, and replies.",
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
          <div className="container header-inner">
            <Link href="/" className="header-brand">
              <span className="brand-badge">Research</span>
              <span className="header-title">Dattix</span>
            </Link>
            <nav className="header-nav">
              <Link href="/" className="btn btn-outline btn-sm">
                Dashboard
              </Link>
              <Link href="/collect" className="btn btn-primary btn-sm">
                + New Post
              </Link>
            </nav>
          </div>
        </header>
        <main className="container" style={{ paddingBottom: "4rem", paddingTop: "1.75rem" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
