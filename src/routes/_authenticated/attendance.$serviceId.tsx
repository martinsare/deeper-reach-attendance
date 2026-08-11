import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Check, ChevronDown, X, ArrowLeft, Search, Copy } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import {
  CATEGORY_LABELS,
  buildHouseholds,
  fetchAttendance,
  fetchService,
  membersQuery,
  type Member,
} from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeading } from "@/components/app/AppShell";
import { buildAttendanceSummary } from "@/lib/summary";

export const Route = createFileRoute("/_authenticated/attendance/$serviceId")({
  head: () => ({
    meta: [
      { title: "Take Attendance | Deeper Life Attendance" },
      { name: "description", content: "Mark households present or absent for this service." },
      { property: "og:title", content: "Take Attendance | Deeper Life Attendance" },
      { property: "og:description", content: "Mark households present or absent for this service." },
    ],
  }),
  component: AttendancePage,
});

type Status = "present" | "absent";

function AttendancePage() {
  const { serviceId } = Route.useParams();
  const queryClient = useQueryClient();
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const service = useQuery({
    queryKey: ["service", serviceId],
    queryFn: () => fetchService(serviceId),
  });
  const members = useQuery(membersQuery);
  const existing = useQuery({
    queryKey: ["attendance", serviceId],
    queryFn: () => fetchAttendance(serviceId),
  });

  const baseline = useMemo(() => {
    const map: Record<string, Status> = {};
    for (const record of existing.data ?? []) map[record.member_id] = record.status;
    return map;
  }, [existing.data]);

  const statusOf = (memberId: string): Status =>
    statuses[memberId] ?? baseline[memberId] ?? "absent";

  const households = useMemo(() => buildHouseholds(members.data ?? []), [members.data]);
  const query = search.trim().toLowerCase();
  const visible = query
    ? households.filter((h) => h.members.some((m) => m.name.toLowerCase().includes(query)))
    : households;

  const allMembers = members.data ?? [];
  const presentCount = allMembers.filter((m) => statusOf(m.id) === "present").length;
  const total = allMembers.length;
  const pct = total ? Math.round((presentCount / total) * 100) : 0;

  const setMany = (ids: string[], status: Status) =>
    setStatuses((prev) => {
      const next = { ...prev };
      for (const id of ids) next[id] = status;
      return next;
    });

  const submit = useMutation({
    mutationFn: async () => {
      const { data: session } = await supabase.auth.getUser();
      const rows = allMembers.map((member) => ({
        service_id: serviceId,
        member_id: member.id,
        status: statusOf(member.id),
        recorded_by: session.user?.id ?? null,
      }));
      const { error } = await supabase
        .from("attendance_records")
        .upsert(rows, { onConflict: "service_id,member_id" });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      setSubmitted(true);
      toast.success("Attendance submitted");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const absentees = allMembers.filter((m) => statusOf(m.id) === "absent");

  if (submitted) {
    return (
      <ServiceOverview
        title={service.data?.name ?? "Service"}
        date={service.data?.date}
        all={allMembers}
        statusOf={statusOf}
        absentees={absentees}
        households={households}
        onEdit={() => setSubmitted(false)}
      />
    );
  }

  return (
    <>
      <Link
        to="/dashboard"
        className="text-muted-foreground mb-3 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="h-4 w-4" /> All services
      </Link>
      <PageHeading
        title={service.data?.name ?? "Taking attendance"}
        subtitle={
          service.data ? format(parseISO(service.data.date), "EEEE d MMMM yyyy") : undefined
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search a name"
            className="h-12 pl-9"
          />
        </div>
        <Button
          variant="secondary"
          size="lg"
          className="h-12"
          onClick={() => setMany(allMembers.map((m) => m.id), "present")}
        >
          All present
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="h-12"
          onClick={() => setMany(allMembers.map((m) => m.id), "absent")}
        >
          Clear
        </Button>
      </div>

      <ul className="space-y-3 pb-32">
        {visible.map((household) => {
          const ids = household.members.map((m) => m.id);
          const presentInHouse = household.members.filter(
            (m) => statusOf(m.id) === "present",
          ).length;
          const single = household.dependents.length === 0;
          const expanded = single ? false : (open[household.id] ?? false);
          const head = household.head!;
          return (
            <li key={household.id} className="surface overflow-hidden">
              <div className="flex items-center gap-3 p-3 sm:p-4">
                <button
                  type="button"
                  onClick={() => setOpen((prev) => ({ ...prev, [household.id]: !expanded }))}
                  className="min-w-0 flex-1 text-left"
                  disabled={single}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="truncate">{household.label}</span>
                    {!single && (
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
                      />
                    )}
                  </div>
                  <div className="text-muted-foreground mt-0.5 text-xs">
                    {single
                      ? CATEGORY_LABELS[head.category]
                      : `${presentInHouse}/${household.members.length} present`}
                  </div>
                </button>
                <div className="flex shrink-0 gap-2">
                  <IconToggle
                    kind="present"
                    active={presentInHouse === household.members.length}
                    label={`Mark ${household.label} present`}
                    onClick={() => setMany(ids, "present")}
                  />
                  <IconToggle
                    kind="absent"
                    active={presentInHouse === 0}
                    label={`Mark ${household.label} absent`}
                    onClick={() => setMany(ids, "absent")}
                  />
                </div>
              </div>

              {expanded && !single && (
                <ul className="border-border divide-border divide-y border-t">
                  {household.members.map((member) => (
                    <li key={member.id} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{member.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {CATEGORY_LABELS[member.category]}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <IconToggle
                          kind="present"
                          active={statusOf(member.id) === "present"}
                          label={`Mark ${member.name} present`}
                          onClick={() => setMany([member.id], "present")}
                        />
                        <IconToggle
                          kind="absent"
                          active={statusOf(member.id) === "absent"}
                          label={`Mark ${member.name} absent`}
                          onClick={() => setMany([member.id], "absent")}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
        {visible.length === 0 && (
          <li className="surface text-muted-foreground p-8 text-center text-sm">
            No matches.
          </li>
        )}
      </ul>

      <div className="border-border bg-background/95 fixed inset-x-0 bottom-0 border-t backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex-1">
            <div className="font-display text-xl font-semibold">
              {presentCount}
              <span className="text-muted-foreground text-sm font-normal"> / {total} present</span>
            </div>
            <div className="text-muted-foreground text-xs">{pct}% attendance</div>
          </div>
          <Button
            size="lg"
            className="h-13 flex-1 py-4 text-base sm:flex-none sm:px-10"
            onClick={() => submit.mutate()}
            disabled={submit.isPending || total === 0}
          >
            Submit attendance
          </Button>
        </div>
      </div>
    </>
  );
}

function IconToggle({
  kind,
  active,
  label,
  onClick,
}: {
  kind: Status;
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  const base =
    "grid h-11 w-11 place-items-center rounded-xl border transition-colors active:scale-95";
  const styles = active
    ? kind === "present"
      ? "border-transparent bg-success text-success-foreground"
      : "border-transparent bg-destructive text-destructive-foreground"
    : "border-border text-muted-foreground";
  return (
    <button type="button" aria-label={label} onClick={onClick} className={`${base} ${styles}`}>
      {kind === "present" ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
    </button>
  );
}

function ServiceOverview({
  title,
  date,
  all,
  statusOf,
  absentees,
  households,
  onEdit,
}: {
  title: string;
  date?: string | undefined;
  all: Member[];
  statusOf: (id: string) => Status;
  absentees: Member[];
  households: ReturnType<typeof buildHouseholds>;
  onEdit: () => void;
}) {
  const householdOf = (memberId: string) =>
    households.find((h) => h.members.some((m) => m.id === memberId))?.label ?? "—";

  const summarise = (rows: Member[]) => {
    const present = rows.filter((m) => statusOf(m.id) === "present").length;
    return {
      present,
      absent: rows.length - present,
      pct: rows.length ? Math.round((present / rows.length) * 100) : 0,
    };
  };
  const everyone = summarise(all);
  const workers = summarise(all.filter((m) => m.is_worker));
  const hasWorkers = all.some((m) => m.is_worker);

  return (
    <>
      <PageHeading
        title={title}
        subtitle={date ? format(parseISO(date), "EEEE d MMMM yyyy") : undefined}
        action={
          <Button variant="secondary" size="lg" className="h-12" onClick={onEdit}>
            Edit
          </Button>
        }
      />
      <h2 className="mb-2 text-sm font-semibold tracking-[0.16em] uppercase">Everyone</h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Present" value={everyone.present} tone="success" />
        <Stat label="Absent" value={everyone.absent} tone="destructive" />
        <Stat label="Attendance" value={`${everyone.pct}%`} tone="primary" />
      </div>
      {hasWorkers && (
        <>
          <h2 className="mb-2 text-sm font-semibold tracking-[0.16em] uppercase">Workers</h2>
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <Stat label="Present" value={workers.present} tone="success" />
            <Stat label="Absent" value={workers.absent} tone="destructive" />
            <Stat label="Attendance" value={`${workers.pct}%`} tone="primary" />
          </div>
        </>
      )}
      <div className="surface p-5">
        <h2 className="text-lg font-semibold">Absentees</h2>
        {absentees.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">None.</p>
        ) : (
          <ul className="divide-border mt-3 divide-y">
            {absentees.map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {member.name}
                  {member.is_worker && (
                    <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase">
                      Worker
                    </span>
                  )}
                </span>
                <span className="text-muted-foreground text-xs">{householdOf(member.id)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-6">
        <Link to="/dashboard" className="text-primary text-sm font-semibold">
          ← Services
        </Link>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "success" | "destructive" | "primary";
}) {
  const color =
    tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : "text-primary";
  return (
    <div className="surface p-5">
      <div className="text-muted-foreground text-xs tracking-[0.18em] uppercase">{label}</div>
      <div className={`font-display mt-1 text-4xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}