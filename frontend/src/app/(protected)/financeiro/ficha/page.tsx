import { redirect } from "next/navigation";
import { FichaFinanceiraPage } from "@/domains/financeiro/ficha/components/FichaFinanceiraPage";

export default function Page() {
  if (process.env.NEXT_PUBLIC_DEMO === "true") redirect("/dashboard");
  return <FichaFinanceiraPage />;
}
