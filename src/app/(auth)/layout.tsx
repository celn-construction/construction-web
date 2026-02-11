export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] dark:bg-[var(--bg-primary)] transition-colors">
      {children}
    </div>
  );
}
