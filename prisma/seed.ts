import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("Seeding database...");

  // Créer les utilisateurs
  const password = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@highlands.fr" },
    update: {},
    create: {
      email: "admin@highlands.fr",
      name: "Marie Admin",
      password,
      role: "ADMIN",
      organization: "Mairie des Highlands",
    },
  });

  const maire = await prisma.user.upsert({
    where: { email: "maire@highlands.fr" },
    update: {},
    create: {
      email: "maire@highlands.fr",
      name: "Jean Dupont",
      password,
      role: "MAIRE",
      organization: "Mairie des Highlands",
    },
  });

  const adjointe = await prisma.user.upsert({
    where: { email: "adjointe@highlands.fr" },
    update: {},
    create: {
      email: "adjointe@highlands.fr",
      name: "Sophie Martin",
      password,
      role: "ADJOINTE",
      organization: "Mairie des Highlands",
    },
  });

  const eusebe = await prisma.user.upsert({
    where: { email: "eusebe@highlands.fr" },
    update: {},
    create: {
      email: "eusebe@highlands.fr",
      name: "Eusèbe Dot",
      password,
      role: "EMPLOYEE",
      organization: "Logistique Highlands",
    },
  });

  const marty = await prisma.user.upsert({
    where: { email: "marty@highlands.fr" },
    update: {},
    create: {
      email: "marty@highlands.fr",
      name: "Marty Vidal",
      password,
      role: "CONTRACTANT",
      organization: "Prestataires Associés",
    },
  });

  console.log("Users created.");

  // Créer des événements
  const festivalDate = new Date();
  festivalDate.setDate(festivalDate.getDate() + 30);

  const festival = await prisma.event.create({
    data: {
      title: "Festival des Highlands — Édition Angleterre",
      description: "Grand festival culturel annuel réunissant les associations partenaires des Highlands et de la région anglaise. Défilé, concerts, expositions.",
      startDate: new Date(festivalDate.getFullYear(), festivalDate.getMonth(), festivalDate.getDate(), 10, 0),
      endDate: new Date(festivalDate.getFullYear(), festivalDate.getMonth(), festivalDate.getDate() + 2, 22, 0),
      location: "Place centrale des Highlands",
      isPublic: true,
      creatorId: maire.id,
    },
  });

  const reunionDate = new Date();
  reunionDate.setDate(reunionDate.getDate() + 7);

  const reunion = await prisma.event.create({
    data: {
      title: "Réunion de préparation logistique",
      description: "Coordination des équipes pour le festival. Point sur les ressources, attribution des tâches.",
      startDate: new Date(reunionDate.getFullYear(), reunionDate.getMonth(), reunionDate.getDate(), 14, 0),
      endDate: new Date(reunionDate.getFullYear(), reunionDate.getMonth(), reunionDate.getDate(), 17, 0),
      location: "Salle de réunion B — Mairie",
      isPublic: false,
      creatorId: adjointe.id,
    },
  });

  // Partager la réunion avec Eusèbe
  await prisma.eventShare.create({
    data: { eventId: reunion.id, userId: eusebe.id },
  });

  console.log("Events created.");

  // Créer des tâches pour le festival
  const tasks = [
    { title: "Réserver le système sonore", description: "Contacter le prestataire Son & Lumière, vérifier dispo pour 3 jours", assigneeId: eusebe.id, eventId: festival.id, status: "IN_PROGRESS" as const },
    { title: "Commander les barrières de sécurité", description: "300 mètres linéaires minimum, livraison J-2", assigneeId: eusebe.id, eventId: festival.id, status: "TODO" as const },
    { title: "Préparer les badges bénévoles", assigneeId: adjointe.id, eventId: festival.id, status: "TODO" as const },
    { title: "Valider le plan de circulation", description: "Coordination avec la police municipale", assigneeId: adjointe.id, eventId: festival.id, status: "DONE" as const },
    { title: "Récupérer les tables et chaises", description: "Entrepôt municipal, 50 tables + 200 chaises", assigneeId: marty.id, eventId: festival.id, status: "TODO" as const },
  ];

  for (const task of tasks) {
    await prisma.task.create({ data: task });
  }

  console.log("Tasks created.");

  // Créer des ressources pour le festival
  const potions = await prisma.resource.create({
    data: {
      name: "Potions de soin",
      description: "Bouteilles de sirop d'herbes locales à distribuer — prévoir pour les bénévoles et participants",
      quantityNeeded: 150,
      unit: "bouteilles",
      eventId: festival.id,
    },
  });

  const barrieres = await prisma.resource.create({
    data: {
      name: "Barrières de sécurité",
      description: "Barrières Vauban pour délimiter le périmètre et les scènes",
      quantityNeeded: 80,
      unit: "unités",
      eventId: festival.id,
    },
  });

  const generateurs = await prisma.resource.create({
    data: {
      name: "Générateurs électriques",
      description: "Groupes électrogènes 10kW pour les scènes secondaires",
      quantityNeeded: 3,
      unit: "unités",
      eventId: festival.id,
    },
  });

  // Entrées d'approvisionnement (Marty a récupéré des potions)
  await prisma.resourceEntry.create({
    data: {
      resourceId: potions.id,
      quantity: 2,
      procuredById: marty.id,
      location: "Coffre numéro 7 — Entrepôt A",
      notes: "Récupérées chez l'herboriste du village. 2 caisses de 12, une entamée.",
    },
  });

  await prisma.resourceEntry.create({
    data: {
      resourceId: potions.id,
      quantity: 48,
      procuredById: eusebe.id,
      location: "Réserve de la mairie — Armoire froide",
      notes: "Commande en ligne livrée ce matin. 4 cartons de 12 bouteilles.",
    },
  });

  await prisma.resourceEntry.create({
    data: {
      resourceId: barrieres.id,
      quantity: 30,
      procuredById: eusebe.id,
      location: "Parking arrière mairie",
      notes: "Lot récupéré au dépôt municipal. Les 50 restantes commandées.",
    },
  });

  // Agendas personnels
  await prisma.agendaEntry.create({
    data: { userId: eusebe.id, eventId: festival.id, note: "Prévoir d'arriver à 8h pour la mise en place" },
  });
  await prisma.agendaEntry.create({
    data: { userId: eusebe.id, eventId: reunion.id, note: "Apporter les devis sonorisation" },
  });
  await prisma.agendaEntry.create({
    data: { userId: adjointe.id, eventId: festival.id },
  });

  console.log("Resources and agenda entries created.");
  console.log("\n✓ Seed terminé !\n");
  console.log("Comptes disponibles (mot de passe : password123) :");
  console.log("  admin@highlands.fr       — ADMIN");
  console.log("  maire@highlands.fr       — MAIRE");
  console.log("  adjointe@highlands.fr    — ADJOINTE");
  console.log("  eusebe@highlands.fr      — EMPLOYEE");
  console.log("  marty@highlands.fr       — CONTRACTANT");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
