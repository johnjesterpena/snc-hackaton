import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";
import { hasPermission } from "@/lib/business/roles";
import type { Profile } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", permission: "reports.view" as const },
  { href: "/menu", label: "Menu", permission: "menu.manage" as const },
  { href: "/tables", label: "Tables", permission: "tables.manage" as const },
  { href: "/orders", label: "Orders", permission: "orders.manage" as const },
  { href: "/kitchen", label: "Kitchen", permission: "orders.viewKitchen" as const },
  { href: "/reports", label: "Reports", permission: "reports.view" as const },
];

export function StaffShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const links = LINKS.filter((link) => hasPermission(profile.role, link.permission));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              SNC 2018 Cafe & Resto
            </p>
            <Link href={profile.role === "kitchen" ? "/kitchen" : "/tables"} className="text-lg font-semibold">
              SmartResto
            </Link>
          </div>
          <nav className="flex flex-wrap gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="text-right text-sm">
              <p className="font-medium">{profile.display_name}</p>
              <p className="capitalize text-muted-foreground">{profile.role}</p>
            </div>
            <form action={logoutAction}>
              <Button type="submit" variant="outline">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
