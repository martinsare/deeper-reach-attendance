import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, UserCog } from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/hooks/use-session";
import { fetchAccounts, setAccountRole, type AccountRole } from "@/lib/accounts.functions";
import { PageHeading } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";

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
      <PageHeading title="Accounts" subtitle="Manage roles for registered users." />

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
