import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/hooks/use-session";
import {
  createStaffAccount,
  deleteAccount,
  listAccounts,
  setAccountPassword,
} from "@/lib/accounts.functions";
import { PageHeading } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const listFn = useServerFn(listAccounts);
  const deleteFn = useServerFn(deleteAccount);
  const passwordFn = useServerFn(setAccountPassword);

  const accounts = useQuery({
    queryKey: ["accounts"],
    queryFn: () => listFn({}),
    enabled: isAdmin,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { userId: id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Account removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const [resetFor, setResetFor] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const reset = useMutation({
    mutationFn: () => passwordFn({ data: { userId: resetFor!, password: newPassword } }),
    onSuccess: () => {
      toast.success("Password updated");
      setResetFor(null);
      setNewPassword("");
    },
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
        subtitle="Create attendance-taker logins and reset passwords"
        action={<NewAccountDialog />}
      />

      <ul className="space-y-3">
        {(accounts.data ?? []).map((account) => (
          <li key={account.id} className="surface flex items-center gap-3 p-4">
            <div className="bg-primary/10 text-primary grid h-10 w-10 shrink-0 place-items-center rounded-full">
              <UserCog className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{account.name}</div>
              <div className="text-muted-foreground text-xs">
                @{account.username} ·{" "}
                {account.role === "admin" ? "Admin" : "Attendance taker"}
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setResetFor(account.id)}
              className="h-10"
            >
              <KeyRound className="mr-1.5 h-3.5 w-3.5" /> Password
            </Button>
            {account.id !== userId && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${account.name}`}
                onClick={() => remove.mutate(account.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </li>
        ))}
        {accounts.data?.length === 0 && (
          <li className="surface text-muted-foreground p-8 text-center text-sm">No accounts yet.</li>
        )}
      </ul>

      <Dialog open={resetFor !== null} onOpenChange={(open) => !open && setResetFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set a new password</DialogTitle>
            <DialogDescription>Share the new password with the account holder.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              reset.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
                className="h-12"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 w-full" disabled={reset.isPending}>
              Update password
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function NewAccountDialog() {
  const queryClient = useQueryClient();
  const createFn = useServerFn(createStaffAccount);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "attendance_taker">("attendance_taker");

  const create = useMutation({
    mutationFn: () => createFn({ data: { name, username, password, role } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Account created");
      setOpen(false);
      setName("");
      setUsername("");
      setPassword("");
      setRole("attendance_taker");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="h-12">
          New account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New account</DialogTitle>
          <DialogDescription>
            Set the username and password — there is no email sign-up.
          </DialogDescription>
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
                <span className="mt-0.5 block text-xs font-normal opacity-70">
                  {option === "admin" ? "Full access" : "Attendance and reports"}
                </span>
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
            <Label htmlFor="account-username">Username</Label>
            <Input
              id="account-username"
              value={username}
              autoCapitalize="none"
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-password">Password</Label>
            <Input
              id="account-password"
              type="text"
              value={password}
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