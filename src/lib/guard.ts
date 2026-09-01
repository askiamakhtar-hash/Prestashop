import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/lib/session";
import { canAccess, ROLE_PERMISSIONS } from "@/lib/auth";

export async function requireSection(section: string): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canAccess(session.role, section)) {
    const fallback = ROLE_PERMISSIONS[session.role]?.[0];
    redirect(fallback ? `/${fallback}` : "/login");
  }
  return session;
}
