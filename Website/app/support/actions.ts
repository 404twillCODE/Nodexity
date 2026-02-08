"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureCategories } from "@/lib/forum";

export async function createThread(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: "You must be logged in to create a thread." };

  const title = formData.get("title") as string | null;
  const body = formData.get("body") as string | null;
  const categorySlug = formData.get("categorySlug") as string | null;

  if (!title?.trim() || !body?.trim() || !categorySlug?.trim()) {
    return { error: "Title, body, and category are required." };
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return { error: "User not found." };

  const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
  if (!category) return { error: "Category not found." };

  await prisma.thread.create({
    data: {
      title: title.trim().slice(0, 500),
      body: body.trim().slice(0, 10000),
      categoryId: category.id,
      authorId: user.id,
    },
  });

  revalidatePath("/support");
  revalidatePath(`/support/category/${categorySlug}`);
  revalidatePath("/profile");
  return { ok: true };
}

export async function createReply(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: "You must be logged in to reply." };

  const threadId = formData.get("threadId") as string | null;
  const body = formData.get("body") as string | null;

  if (!threadId?.trim() || !body?.trim()) return { error: "Thread and body are required." }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return { error: "User not found." };

  const thread = await prisma.thread.findUnique({ where: { id: threadId }, include: { category: true } });
  if (!thread) return { error: "Thread not found." };

  await prisma.reply.create({
    data: {
      threadId: thread.id,
      authorId: user.id,
      body: body.trim().slice(0, 10000),
    },
  });

  await prisma.thread.update({
    where: { id: thread.id },
    data: { updatedAt: new Date() },
  });

  revalidatePath("/support");
  revalidatePath(`/support/category/${thread.category.slug}`);
  revalidatePath(`/support/thread/${threadId}`);
  revalidatePath("/profile");
  return { ok: true };
}
