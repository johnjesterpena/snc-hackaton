import { redirect } from "next/navigation";
import { assertPermission, hasPermission, type Permission } from "./business/roles";
import type { Role } from "./business/status";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data as Profile;
}

export async function requireProfile() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requirePermission(permission: Permission) {
  const profile = await requireProfile();
  if (!hasPermission(profile.role as Role, permission)) {
    redirect(profile.role === "kitchen" ? "/kitchen" : "/tables");
  }
  return profile;
}

export async function requireActionPermission(permission: Permission) {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new Error("You must be signed in");
  }
  assertPermission(profile.role as Role, permission);
  return profile;
}
