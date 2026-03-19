// Este arquivo não deve ser acessado diretamente — o root "/" é tratado por app/page.tsx.
// Mantido apenas para evitar erro de rota inexistente no route group (protected).
import { redirect } from "next/navigation";

export default function Page() {
  redirect("/dashboard");
}
