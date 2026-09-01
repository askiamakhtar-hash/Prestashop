"use server";

import { redirect } from "next/navigation";
import { getSession, clearSessionCookie } from "@/lib/session";
import { logAudit } from "@/lib/repositories/users";

export async function logoutAction() {
  const session = await getSession();
  if (session) {
    logAudit(session.userId, session.storeId, "LOGOUT", `Déconnexion de ${session.name}`);
  }
  await clearSessionCookie();
  redirect("/login");
}
