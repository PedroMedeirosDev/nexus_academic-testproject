import { redirect } from "next/navigation";
import { NovoAlunoPage } from "@/domains/academico/ficha/components/NovoAlunoPage";

export default function Page() {
  if (process.env.NEXT_PUBLIC_DEMO === "true") redirect("/dashboard");
  return <NovoAlunoPage />;
}
