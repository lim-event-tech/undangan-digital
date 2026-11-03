import { redirect } from "next/navigation";
import { getAdmin, getSession, type AdminUser } from "@/lib/session";
import { can, type Permission } from "./roles";

export async function requireAdmin(permission?: Permission): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) {
    const session = await getSession();
    redirect(session ? "/admin/masuk?galat=bukan" : "/admin/masuk");
  }
  if (permission && !can(admin, permission)) redirect("/admin?galat=izin");
  return admin;
}
