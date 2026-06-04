import type { Metadata } from "next";
import "./globals.css";
import SiteNav from "@/components/SiteNav";
import { CompareProvider } from "@/components/CompareContext";
import CompareTray from "@/components/CompareTray";

export const metadata: Metadata = {
  title: "CampusCompass — Discover & Compare Indian Colleges",
  description:
    "Search 28+ colleges, compare placements and fees side by side, predict your admission chances and join student discussions.",
  keywords: ["colleges", "admission predictor", "college comparison", "placements", "India"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CompareProvider>
          <SiteNav />
          <main>{children}</main>
          <CompareTray />
          <footer className="footer">
            <div className="container row spread">
              <span>© {new Date().getFullYear()} CampusCompass — built for students, by students.</span>
              <span>Data is illustrative and stored locally in SQLite.</span>
            </div>
          </footer>
        </CompareProvider>
      </body>
    </html>
  );
}
