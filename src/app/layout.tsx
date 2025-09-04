import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Figma to User Stories",
  description: "Convert Figma designs into comprehensive user stories using AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-warm-50">
          <header className="bg-white border-b border-warm-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-warm-700">
                    Figma → User Stories
                  </h1>
                </div>
                <nav className="flex space-x-4">
                  <a href="#" className="text-warm-600 hover:text-warm-700">
                    Dashboard
                  </a>
                  <a href="#" className="text-warm-600 hover:text-warm-700">
                    History
                  </a>
                </nav>
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
