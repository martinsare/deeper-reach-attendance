import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { usernameToEmail } from "@/lib/username";
import { createFirstAdmin, getSetupState } from "@/lib/accounts.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLockup } from "./Brand";

export function LoginScreen() {
  const navigate = useNavigate();
  const setupFn = useServerFn(getSetupState);
  const firstAdminFn = useServerFn(createFirstAdmin);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
      else setChecking(false);
    });
  }, [navigate]);

  const setup = useQuery({ queryKey: ["setup-state"], queryFn: () => setupFn({}) });
  const needsSetup = setup.data?.needsSetup === true;

  const signIn = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email: usernameToEmail(username),
        password,
      });
      if (error) throw new Error("Wrong username or password.");
    },
    onSuccess: () => navigate({ to: "/dashboard", replace: true }),
    onError: (error: Error) => toast.error(error.message),
  });

  const createAdmin = useMutation({
    mutationFn: async () => {
      await firstAdminFn({ data: { username, password, name } });
      const { error } = await supabase.auth.signInWithPassword({
        email: usernameToEmail(username),
        password,
      });
      if (error) throw new Error("Account created — please sign in.");
    },
    onSuccess: () => {
      toast.success("Admin account created");
      navigate({ to: "/dashboard", replace: true });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const pending = signIn.isPending || createAdmin.isPending || checking;

  return (
    <main className="min-h-screen bg-depth-gradient text-depth-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 lg:flex-row lg:items-center lg:gap-16 lg:py-16">
        <div className="flex-1">
          <BrandLockup />
          <h1 className="mt-12 max-w-xl text-4xl leading-[1.05] font-semibold sm:text-5xl">
            Every name counted. Every household known.
          </h1>
          <p className="mt-5 max-w-md text-base opacity-75">
            Attendance for our services — taken in seconds during the meeting, and turned into
            month-by-month insight for follow-up and care.
          </p>
          <div className="mt-10 hidden gap-8 sm:flex">
            {[
              ["Households", "Families grouped, not a flat list"],
              ["One tap", "Mark a whole family at once"],
              ["Monthly view", "Spot absentee streaks early"],
            ].map(([title, copy]) => (
              <div key={title} className="max-w-[10rem]">
                <div className="text-sidebar-primary font-display text-lg">{title}</div>
                <div className="mt-1 text-xs opacity-70">{copy}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 w-full lg:mt-0 lg:max-w-md">
          <div className="bg-card text-card-foreground shadow-lift rounded-3xl p-7 sm:p-8">
            <h2 className="text-2xl font-semibold">
              {needsSetup ? "Create the first admin" : "Sign in"}
            </h2>
            <p className="text-muted-foreground mt-1.5 text-sm">
              {needsSetup
                ? "No accounts exist yet. Set up the church administrator to begin."
                : "Use the username and password given to you by the church admin."}
            </p>

            <form
              className="mt-7 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (needsSetup) createAdmin.mutate();
                else signIn.mutate();
              }}
            >
              {needsSetup && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Pastor's name"
                    required
                    className="h-12"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  autoCapitalize="none"
                  autoComplete="username"
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin"
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  autoComplete={needsSetup ? "new-password" : "current-password"}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-12"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={pending}>
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {needsSetup ? "Create admin account" : "Sign in"}
              </Button>
            </form>

            {!needsSetup && (
              <p className="text-muted-foreground mt-5 text-xs">
                Forgotten your password? Ask a church admin to set a new one for you.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}