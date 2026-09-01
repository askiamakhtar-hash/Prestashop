"use server";

import { redirect } from "next/navigation";
import { findUserByEmail } from "@/lib/repositories/users";
import { logAudit } from "@/lib/repositories/users";
import { verifyPassword } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";

export type LoginState = { error?: string };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/dashboard");

  if (!email || !password) {
    return { error: "Veuillez renseigner votre email et votre mot de passe." };
  }

  const user = findUserByEmail(email);
  if (!user || !user.active) {
    return { error: "Identifiants incorrects." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Identifiants incorrects." };
  }

  if (!user.storeId) {
    return { error: "Ce compte n'est rattaché à aucune boutique." };
  }

  await setSessionCookie({
    userId: user.id,
    storeId: user.storeId,
    role: user.role,
    name: user.name,
  });

  logAudit(user.id, user.storeId, "LOGIN", `Connexion de ${user.name}`);

  redirect(next.startsWith("/") ? next : "/dashboard");
}
