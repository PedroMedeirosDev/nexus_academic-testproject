import { ChamadoFormPage } from "@/domains/suporte/chamados/components/ChamadoFormPage";

export default function Page({ params }: { params: { id: string } }) {
  return <ChamadoFormPage id={Number(params.id)} />;
}
