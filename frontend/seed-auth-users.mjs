/**
 * Nexus Acadêmico – Seed de usuários no Supabase Auth via Admin API
 *
 * Uso:
 *   node backend/scripts/seed-auth-users.mjs
 *
 * Pré-requisito: service role key no arquivo backend/.env
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Lê o .env manualmente (sem dependência extra)
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../backend/.env");
const env = Object.fromEntries(
  readFileSync(envPath, "utf-8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => l.split("=").map((s) => s.trim())),
);

const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "❌ Adicione SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY ao backend/.env",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const usuarios = [
  {
    email: "pedro.medeiros@nexus.edu.br",
    senha: "123456",
    nome: "Pedro Medeiros",
    perfil: "usuario",
  },
  {
    email: "gustavo.gobira@nexus.edu.br",
    senha: "123456",
    nome: "Gustavo Gobira",
    perfil: "usuario",
  },
  {
    email: "felipe.santos@nexus.edu.br",
    senha: "123456",
    nome: "Felipe Santos",
    perfil: "usuario",
  },
  {
    email: "lucas.sobrinho@nexus.edu.br",
    senha: "123456",
    nome: "Lucas Sobrinho",
    perfil: "usuario",
  },
  {
    email: "fatima.costa@nexus.edu.br",
    senha: "123456",
    nome: "Fátima Costa",
    perfil: "usuario",
  },
  {
    email: "rui.barbosa@nexus.edu.br",
    senha: "123456",
    nome: "Rui Barbosa",
    perfil: "usuario",
  },
  {
    email: "luciana.matos@nexus.edu.br",
    senha: "123456",
    nome: "Luciana Matos",
    perfil: "usuario",
  },
  {
    email: "maria.silva@nexus.edu.br",
    senha: "123456",
    nome: "Maria Silva",
    perfil: "usuario",
  },
  {
    email: "moacir.schmidt@nexus.edu.br",
    senha: "123456",
    nome: "Moacir Schmidt",
    perfil: "staff",
  },
  {
    email: "ana.lima@nexus.edu.br",
    senha: "123456",
    nome: "Ana Paula Lima",
    perfil: "staff",
  },
  {
    email: "joao.carvalho@nexus.edu.br",
    senha: "123456",
    nome: "João Carvalho",
    perfil: "staff",
  },
];

async function seed() {
  console.log("🔄 Iniciando seed de usuários via Admin API...\n");

  // Busca todos os usuários existentes de uma vez
  const { data: existentes } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });
  const mapaExistentes = Object.fromEntries(
    (existentes?.users ?? []).map((u) => [u.email, u.id]),
  );

  for (const u of usuarios) {
    const idExistente = mapaExistentes[u.email];

    if (idExistente) {
      // Já existe — atualiza senha e metadata
      const { error } = await supabase.auth.admin.updateUserById(idExistente, {
        password: u.senha,
        email_confirm: true,
        user_metadata: { nome: u.nome, perfil: u.perfil },
      });
      if (error) {
        console.error(`  ❌ Erro ao atualizar ${u.email}: ${error.message}`);
      } else {
        console.log(`  ✅ Atualizado: ${u.email}`);
      }
    } else {
      // Não existe — cria novo
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.senha,
        email_confirm: true,
        user_metadata: { nome: u.nome, perfil: u.perfil },
      });
      if (error) {
        console.error(`  ❌ Erro ao criar ${u.email}: ${error.message}`);
      } else {
        console.log(`  ✅ Criado: ${u.email} (id: ${data.user.id})`);
      }
    }
  }

  console.log("\n✅ Seed concluído!");
  console.log("\n⚠️  Execute agora no Supabase SQL Editor:");
  console.log(`
UPDATE usuarios u
SET auth_id = a.id
FROM auth.users a
WHERE a.email = u.email;
  `);
}

seed().catch(console.error);
