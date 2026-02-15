import type { Metadata } from "next";
import { ReactNode } from "react";
import "../index.css";
import RootLayoutClient from "./layout-client";

export const metadata: Metadata = {
  title: "BrainBuddy -- Your AI Friend for Learning and Problem Solving",
  description: "Chat, learn, and grow with your AI study partner. Get instant problem solving, smart notes, and interactive quizzes.",
  keywords: ["AI study friend", "learning platform", "problem solving", "study notes", "interactive quizzes", "education technology"],
  authors: [{ name: "BrainBuddy" }],
  metadataBase: new URL("https://brainbuddy.app"),
  icons: {
    icon: "/brainbuddy-logo.svg",
    apple: "/public/brainbuddy-logo.png",
  },
  openGraph: {
    type: "website",
    title: "BrainBuddy -- Your AI Friend for Learning and Problem Solving",
    description: "Chat, learn, and grow with your AI study partner. Get instant problem solving, smart notes, and interactive quizzes.",
    url: "https://brainbuddy.app",
    siteName: "BrainBuddy",
    images: [
      {
        url: "https://storage.googleapis.com/gpt-engineer-file-uploads/VHO29qhoMlcxH78RFVHshGnhhFm2/social-images/social-1767268814336-grok_image_c4exzx.jpg",
        width: 1200,
        height: 630,
        alt: "BrainBuddy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@BrainBuddy",
    creator: "@BrainBuddy",
    title: "BrainBuddy -- Your AI Friend for Learning and Problem Solving",
    description: "Chat, learn, and grow with your AI study partner. Get instant problem solving, smart notes, and interactive quizzes.",
    images: [
      "https://storage.googleapis.com/gpt-engineer-file-uploads/VHO29qhoMlcxH78RFVHshGnhhFm2/social-images/social-1767268814336-grok_image_c4exzx.jpg",
    ],
  },
  canonical: "https://brainbuddy.app",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
