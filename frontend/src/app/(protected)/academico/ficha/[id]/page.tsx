import { FichaAcademicaPage } from "@/domains/academico/ficha/components/FichaAcademicaPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FichaAcademicaPage id={parseInt(id, 10)} />;
}
