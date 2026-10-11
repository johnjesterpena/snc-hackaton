import type { Metadata } from "next";
import { Coffee } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Staff sign in | SNC SmartResto",
  description: "Sign in to SNC SmartResto staff operations.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Coffee aria-hidden="true" className="size-7" />
          </div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            SNC 2018 Cafe &amp; Resto
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Staff sign in</CardTitle>
            <CardDescription>
              Sign in with the account provided by your restaurant administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          For authorized restaurant staff only.
        </p>
      </div>
    </main>
  );
}
