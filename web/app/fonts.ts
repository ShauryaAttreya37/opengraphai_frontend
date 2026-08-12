import { Newsreader } from "next/font/google";
import localFont from "next/font/local";

/**
 * Display face. Newsreader is variable, so display copy can sit at weight 300 —
 * the editorial register. Never bold it.
 */
export const display = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

/** Body + UI. General Sans, self-hosted from Fontshare. */
export const sans = localFont({
  src: [
    { path: "../public/fonts/GeneralSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/GeneralSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/GeneralSans-Semibold.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/GeneralSans-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

/** Code, file paths and commands only — never labels or captions. */
export const mono = localFont({
  src: [
    { path: "../public/fonts/CommitMono-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/CommitMono-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/CommitMono-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
});
