type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function CustomerAuthPanel({ title, subtitle, children }: Props) {
  return (
    <div className="tenant-auth-panel">
      <h1>{title}</h1>
      <p className="tenant-auth-subtitle">{subtitle}</p>
      {children}
    </div>
  );
}
