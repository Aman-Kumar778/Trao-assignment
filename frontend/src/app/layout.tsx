import "./globals.css";
import React from "react";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "Traq — AI Interview Prep Kit",
  description: "AI-powered interview preparation kit generator, customized per job description and company."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b0f19] text-gray-100 antialiased min-h-screen">
        <AuthProvider>
          <main className="min-h-screen flex flex-col">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
