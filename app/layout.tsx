import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Padel Tournament Manager",
  description: "Manage your padel tournaments, rankings, and players",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-blue-600 text-white shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-2xl font-bold">
                Padel Tournament Manager
              </Link>
              <div className="flex gap-6">
                <Link href="/players" className="hover:underline">
                  Players
                </Link>
                <Link href="/tournaments" className="hover:underline">
                  Tournaments
                </Link>
                <Link href="/rankings" className="hover:underline">
                  Rankings
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
