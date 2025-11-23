import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";

import { AnalyticsBootstrap } from "@/components/analytics/analytics-bootstrap";

import "./globals.css";

const cleanEnvValue = (value?: string | null): string | undefined => {
  if (value == null) {
    return undefined;
  }
  const cleaned = value
    .replace(/\r?\n/g, "")
    .replace(/\\n/g, "")
    .replace(/"/g, "")
    .trim();
  return cleaned.length === 0 ? undefined : cleaned;
};

const segmentWriteKey = cleanEnvValue(process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY);
const previewFlag = cleanEnvValue(process.env.NEXT_PUBLIC_SEGMENT_PREVIEW_ONLY);
const sink =
  cleanEnvValue(process.env.NEXT_PUBLIC_ANALYTICS_SINK) === "segment";
const segmentSinkEnabled =
  sink &&
  Boolean(segmentWriteKey) &&
  previewFlag !== "1" &&
  previewFlag?.toLowerCase() !== "true";

const sans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const mono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SnapCase - Custom Phone Cases",
  description: "Design and order custom phone cases online. Turn your photos into premium phone cases with our Get started by editing AI-powered design tool.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sans.variable} ${mono.variable} antialiased`}
      >
        <AnalyticsBootstrap />
        {segmentSinkEnabled ? (
          <script
            id="segment-snippet"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: `!function(){var analytics=window.analytics=window.analytics||[];if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Segment snippet included twice.");else{analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","debug","page","screen","once","off","on","addSourceMiddleware","addIntegrationMiddleware","setAnonymousId","addDestinationMiddleware","register"];analytics.factory=function(t){return function(){if(window.analytics.initialized)return window.analytics[t].apply(window.analytics,arguments);var e=Array.prototype.slice.call(arguments);["track","screen","alias","group","page","identify"].indexOf(t)>-1&&e.push({__t:"bpc",p:location.pathname,u:location.href,s:location.search,t:document.title,r:document.referrer});e.unshift(t);analytics.push(e);return analytics}};for(var key=0;key<analytics.methods.length;key++){var method=analytics.methods[key];analytics[method]=analytics.factory(method)}analytics.load=function(key,e){var t=document.createElement("script");t.type="text/javascript";t.async=!0;t.setAttribute("data-global-segment-analytics-key","analytics");t.src="https://cdn.segment.com/analytics.js/v1/"+key+"/analytics.min.js";var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(t,n);analytics._loadOptions=e};analytics._writeKey="${segmentWriteKey}";analytics.SNIPPET_VERSION="5.2.0";analytics.load("${segmentWriteKey}");analytics.page();}}();`,
            }}
          />
        ) : null}
        {children}
      </body>
    </html>
  );
}
