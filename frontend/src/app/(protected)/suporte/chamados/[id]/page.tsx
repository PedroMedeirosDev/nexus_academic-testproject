import { ChamadoFormPage } from "@/domains/suporte/chamados/components/ChamadoFormPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChamadoFormPage id={Number(id)} />;
}
