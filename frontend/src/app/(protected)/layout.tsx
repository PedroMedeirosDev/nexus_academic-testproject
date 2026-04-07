// Server Component — impede pré-renderização estática em build time
// (páginas protegidas exigem autenticação e env vars em runtime)
export const dynamic = "force-dynamic";

import ProtectedLayoutClient from "./_ProtectedLayoutClient";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayoutClient>{children}</ProtectedLayoutClient>;
}
