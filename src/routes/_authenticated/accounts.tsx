import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Mail, UserCog, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/hooks/use-session";
import {
  createAccount,
  fetchAccounts,
  sendPasswordReset,
  setAccountRole,
  type AccountRole,
} from "@/lib/accounts.functions";
import { PageHeading } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/accounts")({
  head: () => ({
    meta: [
      { title: "Accounts | Deeper Life Attendance" },
      { name: "description", content: "Manage admin and attendance-taker accounts." },
      { property: "og:title", content: "Accounts | Deeper Life Attendance" },
      { property: "og:description", content: "Manage admin and attendance-taker accounts." },
    ],
  }),
  component: AccountsPage,
});

function AccountsPage() {
  const { isAdmin, loading, userId } = useSession();
  const queryClient = useQueryClient();

  const accounts = useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
    enabled: isAdmin,
  });

  const setRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AccountRole }) =>
      setAccountRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Role updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const reset = useMutation({
    mutationFn: sendPasswordReset,
    onSuccess: () => toast.success("Reset email sent"),
    onError: (error: Error) => toast.error(error.message),
  });

  if (loading) return null;
  if (!isAdmin) {
    return (
      <div className="surface text-muted-foreground p-10 text-center text-sm">
        Only admins can manage accounts.
      </div>
    );
  }

  return (
    <>
      <PageHeading
        title="Accounts"
        subtitle="Manage roles for registered users."
        action={
          <CreateAccountDialog
            onCreated={() => queryClient.invalidateQueries({ queryKey: ["accounts"] })}
          />
        }
      />

      <ul className="space-y-3">
        {(accounts.data ?? []).map((account) => (
          <li key={account.id} className="surface flex flex-wrap items-center gap-3 p-4">
            <div className="bg-primary/10 text-primary grid h-10 w-10 shrink-0 place-items-center rounded-full">
              <UserCog className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{account.name}</div>
              <div className="text-muted-foreground text-xs">
                {account.email} · {account.role === "admin" ? "Admin" : "Attendance taker"}
              </div>
            </div>
            <Button
              variant={account.role === "admin" ? "default" : "secondary"}
              size="sm"
              className="h-10"
              disabled={account.id === userId || setRole.isPending}
              onClick={() => setRole.mutate({ userId: account.id, role: "admin" })}
            >
              <KeyRound className="mr-1.5 h-3.5 w-3.5" /> Admin
            </Button>
            <Button
              variant={account.role === "attendance_taker" ? "default" : "secondary"}
              size="sm"
              className="h-10"
              disabled={account.id === userId || setRole.isPending}
              onClick={() => setRole.mutate({ userId: account.id, role: "attendance_taker" })}
            >
              Attendance taker
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-10"
              disabled={reset.isPending}
              onClick={() => reset.mutate(account.email)}
            >
              <Mail className="mr-1.5 h-3.5 w-3.5" /> Reset password
            </Button>
          </li>
        ))}
        {accounts.data?.length === 0 && (
          <li className="surface text-muted-foreground p-8 text-center text-sm">
            No accounts yet.
          </li>
        )}
      </ul>
    </>
  );
}

function CreateAccountDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AccountRole>("attendance_taker");
  const create = useMutation({
    mutationFn: () => createAccount({ name, email, password, role }),
    onSuccess: () => {
      toast.success("Account created");
      onCreated();
      setOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setRole("attendance_taker");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="h-12">
          <UserPlus className="mr-2 h-4 w-4" /> New account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New account</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            {(["attendance_taker", "admin"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRole(option)}
                className={`rounded-xl border p-3 text-left text-sm transition-colors ${
                  role === option
                    ? "border-primary bg-primary/8 text-primary font-semibold"
                    : "border-border text-muted-foreground"
                }`}
              >
                {option === "admin" ? "Admin" : "Attendance taker"}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-name">Full name</Label>
            <Input
              id="account-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-email">Email</Label>
            <Input
              id="account-email"
              type="email"
              value={email}
              autoCapitalize="none"
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-password">Password</Label>
            <Input
              id="account-password"
              type="password"
              value={password}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-12"
            />
          </div>
          <Button type="submit" size="lg" className="h-12 w-full" disabled={create.isPending}>
            Create account
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
