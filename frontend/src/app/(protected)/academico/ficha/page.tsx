import { redirect } from "next/navigation";
import { FichaListaPage } from "@/domains/academico/ficha/components/FichaListaPage";

export default function Page() {
  if (process.env.NEXT_PUBLIC_DEMO === "true") redirect("/dashboard");
  return <FichaListaPage />;
}
