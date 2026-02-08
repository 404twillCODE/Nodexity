import { prisma } from "./prisma";

const DEFAULT_CATEGORIES = [
  { slug: "server-manager", name: "Server Manager", description: "Desktop app, setup, and usage", order: 1 },
  { slug: "launcher", name: "Launcher", description: "Launcher and game clients", order: 2 },
  { slug: "hosting", name: "Hosting", description: "Recycle and premium hosting", order: 3 },
  { slug: "general", name: "General", description: "General questions and feedback", order: 4 },
];

export async function ensureCategories() {
  const count = await prisma.category.count();
  if (count > 0) return;
  await prisma.category.createMany({ data: DEFAULT_CATEGORIES });
}
