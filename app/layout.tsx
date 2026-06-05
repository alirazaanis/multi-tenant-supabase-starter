import type { Metadata } from "next";
import { EnvBanner } from "@/components/EnvBanner";
import { PRODUCT_NAME } from "@/lib/constants";
import { isEnvConfigured } from "@/lib/env";
import "./globals.css";
import "./tenant-sites.css";

export const metadata: Metadata = {
  title: PRODUCT_NAME,
  description:
    "Multi-Tenant Supabase Starter — org sites with isolated customer auth, same email per org, separate sessions per tenant.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const configured = isEnvConfigured();

  return (
    <html lang="en">
      <body>
        {!configured && <EnvBanner />}
        {children}
      </body>
    </html>
  );
}
