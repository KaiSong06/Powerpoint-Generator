import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Envirotech Presentation Generator",
  description: "Generate branded PowerPoint presentations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-envirotech-gray-light min-h-screen">
        <AuthProvider>
          <NavBar />
          <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
