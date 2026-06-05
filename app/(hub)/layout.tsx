import { Nav } from "@/components/Nav";

export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="hub-shell">
      <Nav />
      <main className="hub-main">{children}</main>
    </div>
  );
}
