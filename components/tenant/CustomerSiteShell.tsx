"use client";

import Link from "next/link";
import { PRODUCT_NAME } from "@/lib/constants";
import type { TenantBrand } from "@/lib/tenants";

type Props = {
  brand: TenantBrand;
  tenantName: string;
  children: React.ReactNode;
};

export function CustomerSiteShell({ brand, tenantName, children }: Props) {
  return (
    <div className={`tenant-site tenant-site--${brand.theme}`}>
      <header className="tenant-site-header">
        <div className="tenant-site-header-inner">
          <div className="tenant-site-logo">
            <span className="tenant-site-logo-mark" aria-hidden>
              {tenantName.charAt(0).toUpperCase()}
            </span>
            <div>
              <div className="tenant-site-logo-name">{tenantName}</div>
              <div className="tenant-site-logo-domain">{brand.siteDomain}</div>
            </div>
          </div>
          <p className="tenant-site-tagline">{brand.tagline}</p>
          <Link href="/" className="tenant-site-hub-link">
            {PRODUCT_NAME}
          </Link>
        </div>
      </header>

      <div
        className={
          brand.layout === "split"
            ? "tenant-site-body tenant-site-body--split"
            : "tenant-site-body tenant-site-body--centered"
        }
      >
        {brand.layout === "split" && (
          <aside className="tenant-site-hero">
            <h1>{tenantName}</h1>
            <p>{brand.tagline}</p>
            <ul>
              <li>Secure workspace</li>
              <li>Your data stays here</li>
              <li>Independent from other orgs</li>
            </ul>
          </aside>
        )}
        <div className="tenant-site-main">{children}</div>
      </div>

      <footer className="tenant-site-footer">
        <span>© {new Date().getFullYear()} {tenantName}</span>
        <Link href="/" className="tenant-site-footer-link">
          {PRODUCT_NAME}
        </Link>
      </footer>
    </div>
  );
}
