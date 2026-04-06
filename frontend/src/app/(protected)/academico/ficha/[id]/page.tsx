import { redirect } from "next/navigation";
import { FichaAcademicaPage } from "@/domains/academico/ficha/components/FichaAcademicaPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (process.env.NEXT_PUBLIC_DEMO === "true") redirect("/dashboard");
  const { id } = await params;
  return <FichaAcademicaPage id={parseInt(id, 10)} />;
}
