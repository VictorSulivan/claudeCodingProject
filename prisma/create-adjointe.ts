import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const email = process.argv[2];
  const name = process.argv[3] ?? "Adjointe";

  if (!email) {
    console.error("Usage : npm run create-adjointe <email> [nom]");
    console.error('Exemple : npm run create-adjointe adjointe@maville.fr "Marie Dupont"');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error(`Un compte existe déjà pour ${email}`);
    process.exit(1);
  }

  const password = randomBytes(12).toString("base64url");
  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashed,
      role: "ADJOINTE",
      organization: "Mairie",
    },
  });

  console.log("\n✓ Compte adjointe créé\n");
  console.log(`  Nom          : ${user.name}`);
  console.log(`  Email        : ${user.email}`);
  console.log(`  Mot de passe : ${password}`);
  console.log("\n  Conservez ce mot de passe, il ne sera plus affiché.\n");
}

main()
  .catch((e) => { console.error(e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
