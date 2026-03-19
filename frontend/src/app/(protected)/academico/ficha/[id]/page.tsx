import { FichaAcademicaPage } from "@/domains/academico/ficha/components/FichaAcademicaPage";

export default function Page({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  return <FichaAcademicaPage id={id} />;
}
