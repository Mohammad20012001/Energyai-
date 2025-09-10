export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout is a simple pass-through for auth pages like login/signup
  // It ensures they don't inherit the main dashboard layout
  return <>{children}</>;
}
