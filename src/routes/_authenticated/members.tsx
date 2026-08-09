import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronDown, Search, UserPlus, Users2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  buildHouseholds,
  initials,
  membersQuery,
  type MemberCategory,
} from "@/lib/data";
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

export const Route = createFileRoute("/_authenticated/members")({
  head: () => ({
    meta: [
      { title: "Members | Deeper Life Attendance" },
      { name: "description", content: "Members of the church grouped by household." },
      { property: "og:title", content: "Members | Deeper Life Attendance" },
      { property: "og:description", content: "Members of the church grouped by household." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(membersQuery);
  },
  component: MembersPage,
});

function MembersPage() {
  const { data: members } = useSuspenseQuery(membersQuery);
  const { isAdmin } = useSession();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const households = useMemo(() => buildHouseholds(members), [members]);
  const query = search.trim().toLowerCase();
  const visible = query
    ? households.filter((h) => h.members.some((m) => m.name.toLowerCase().includes(query)))
    : households;

  return (
    <>
      <PageHeading
        title="Members"
        subtitle={`${members.length} members across ${households.length} households`}
        action={isAdmin ? <AddMemberDialog /> : undefined}
      />

      <div className="relative mb-4">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members"
          className="h-12 pl-9"
        />
      </div>

      {members.length === 0 ? (
        <div className="surface p-10 text-center">
          <Users2 className="text-accent mx-auto h-6 w-6" />
          <p className="font-display mt-3 text-lg">No members yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {isAdmin ? "Add your first member to begin." : "An admin needs to add members."}
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {visible.map((household) => {
            const head = household.head!;
            const expanded = open[household.id] ?? false;
            return (
              <li key={household.id} className="surface overflow-hidden">
                <div className="flex items-start gap-3 p-4">
                  <div className="bg-primary/10 text-primary font-display grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-semibold">
                    {initials(head.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{head.name}</div>
                    <div className="text-muted-foreground mt-0.5 truncate text-xs">
                      {CATEGORY_LABELS[head.category]}
                      {head.contact ? ` · ${head.contact}` : ""}
                    </div>
                    {household.dependents.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setOpen((prev) => ({ ...prev, [household.id]: !expanded }))
                        }
                        className="text-primary mt-2 inline-flex items-center gap-1 text-xs font-semibold"
                      >
                        {household.dependents.length} dependent
                        {household.dependents.length > 1 ? "s" : ""}
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
                        />
                      </button>
                    )}
                  </div>
                </div>
                {expanded && household.dependents.length > 0 && (
                  <ul className="divide-border bg-secondary/40 divide-y">
                    {household.dependents.map((dependent) => (
                      <li key={dependent.id} className="px-4 py-2.5 pl-[4.25rem]">
                        <div className="text-sm font-medium">{dependent.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {CATEGORY_LABELS[dependent.category]}
                          {dependent.contact ? ` · ${dependent.contact}` : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
          {visible.length === 0 && (
            <li className="surface text-muted-foreground p-8 text-center text-sm sm:col-span-2">
              No members match that search.
            </li>
          )}
        </ul>
      )}
    </>
  );
}

function AddMemberDialog() {
  const queryClient = useQueryClient();
  const { data: members } = useSuspenseQuery(membersQuery);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [category, setCategory] = useState<MemberCategory>("adult");
  const [guardianId, setGuardianId] = useState<string | null>(null);
  const [guardianSearch, setGuardianSearch] = useState("");

  const adults = members.filter((m) => m.category === "adult");
  const guardianMatches = guardianSearch.trim()
    ? adults.filter((m) => m.name.toLowerCase().includes(guardianSearch.trim().toLowerCase()))
    : adults.slice(0, 6);
  const guardian = adults.find((m) => m.id === guardianId);

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("members").insert({
        name: name.trim(),
        contact: contact.trim() || null,
        category,
        guardian_id: category === "adult" ? null : guardianId,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Member added");
      setOpen(false);
      setName("");
      setContact("");
      setCategory("adult");
      setGuardianId(null);
      setGuardianSearch("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="h-12">
          <UserPlus className="mr-2 h-4 w-4" /> Add member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add member</DialogTitle>
          <DialogDescription>
            Dependents can be linked to an adult to form a household.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="member-name">Full name</Label>
            <Input
              id="member-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="member-contact">Contact (optional)</Label>
            <Input
              id="member-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Phone or email"
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORY_ORDER.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCategory(option)}
                  className={`rounded-xl border px-3 py-3 text-sm transition-colors ${
                    category === option
                      ? "border-primary bg-primary/8 text-primary font-semibold"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {CATEGORY_LABELS[option]}
                </button>
              ))}
            </div>
          </div>

          {category !== "adult" && (
            <div className="bg-secondary/50 space-y-2 rounded-xl p-3">
              <Label htmlFor="guardian">Link to guardian (optional)</Label>
              {guardian ? (
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{guardian.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setGuardianId(null)}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    id="guardian"
                    value={guardianSearch}
                    onChange={(e) => setGuardianSearch(e.target.value)}
                    placeholder="Search adult members"
                    className="h-11"
                  />
                  <ul className="max-h-40 overflow-y-auto">
                    {guardianMatches.map((adult) => (
                      <li key={adult.id}>
                        <button
                          type="button"
                          onClick={() => setGuardianId(adult.id)}
                          className="hover:bg-background w-full rounded-lg px-2 py-2 text-left text-sm"
                        >
                          {adult.name}
                        </button>
                      </li>
                    ))}
                    {guardianMatches.length === 0 && (
                      <li className="text-muted-foreground px-2 py-2 text-xs">
                        No adult members match.
                      </li>
                    )}
                  </ul>
                </>
              )}
            </div>
          )}

          <Button type="submit" size="lg" className="h-12 w-full" disabled={create.isPending}>
            Add member
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}