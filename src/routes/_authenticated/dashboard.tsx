import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { CalendarPlus, ChevronRight, Repeat, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { attendanceQuery, membersQuery, servicesQuery, type ServiceType } from "@/lib/data";
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
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Services | Deeper Life Attendance" },
      { name: "description", content: "Create services and take attendance in real time." },
      { property: "og:title", content: "Services | Deeper Life Attendance" },
      { property: "og:description", content: "Create services and take attendance in real time." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(servicesQuery);
  },
  component: ServicesPage,
});

function ServicesPage() {
  const { data: services } = useSuspenseQuery(servicesQuery);
  const members = useQuery(membersQuery);
  const attendance = useQuery(attendanceQuery);

  const counts = useMemo(() => {
    const map = new Map<string, { present: number; total: number }>();
    for (const record of attendance.data ?? []) {
      const entry = map.get(record.service_id) ?? { present: 0, total: 0 };
      entry.total += 1;
      if (record.status === "present") entry.present += 1;
      map.set(record.service_id, entry);
    }
    return map;
  }, [attendance.data]);

  return (
    <>
      <PageHeading
        title="Services"
        subtitle={`${members.data?.length ?? 0} members on the roll · ${services.length} services recorded`}
        action={<NewServiceDialog />}
      />

      {services.length === 0 ? (
        <div className="surface p-10 text-center">
          <Sparkles className="text-accent mx-auto h-6 w-6" />
          <p className="font-display mt-3 text-lg">No services yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Create a service to start taking attendance.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {services.map((service) => {
            const count = counts.get(service.id);
            const pct = count?.total ? Math.round((count.present / count.total) * 100) : null;
            return (
              <li key={service.id}>
                <Link
                  to="/attendance/$serviceId"
                  params={{ serviceId: service.id }}
                  className="surface hover:shadow-lift flex items-center gap-4 p-4 transition-shadow sm:p-5"
                >
                  <div className="bg-secondary text-secondary-foreground grid h-14 w-14 shrink-0 place-items-center rounded-2xl">
                    <span className="text-[10px] tracking-widest uppercase opacity-70">
                      {format(parseISO(service.date), "MMM")}
                    </span>
                    <span className="font-display -mt-0.5 text-xl leading-none font-semibold">
                      {format(parseISO(service.date), "d")}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{service.name}</div>
                    <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-xs">
                      {service.type === "recurring" ? (
                        <>
                          <Repeat className="h-3 w-3" /> Recurring
                        </>
                      ) : (
                        <>One-off</>
                      )}
                      <span aria-hidden>·</span>
                      {format(parseISO(service.date), "EEEE d MMMM yyyy")}
                    </div>
                  </div>
                  <div className="text-right">
                    {pct === null ? (
                      <span className="bg-accent/15 text-accent-foreground rounded-full px-3 py-1 text-xs font-semibold">
                        Not taken
                      </span>
                    ) : (
                      <>
                        <div className="font-display text-primary text-xl font-semibold">{pct}%</div>
                        <div className="text-muted-foreground text-xs">
                          {count!.present}/{count!.total} present
                        </div>
                      </>
                    )}
                  </div>
                  <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function NewServiceDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<ServiceType>("recurring");
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [repeat, setRepeat] = useState(false);
  const [weeks, setWeeks] = useState(4);

  const create = useMutation({
    mutationFn: async () => {
      const { data: session } = await supabase.auth.getUser();
      const rows = [];
      const total = type === "recurring" && repeat ? Math.min(Math.max(weeks, 1), 26) : 1;
      const start = parseISO(date);
      for (let i = 0; i < total; i += 1) {
        const day = new Date(start);
        day.setDate(start.getDate() + i * 7);
        rows.push({
          name,
          type,
          date: format(day, "yyyy-MM-dd"),
          created_by: session.user?.id ?? null,
        });
      }
      const { error } = await supabase.from("services").insert(rows);
      if (error) throw new Error(error.message);
      return rows.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success(count > 1 ? `${count} services created` : "Service created");
      setOpen(false);
      setName("");
      setRepeat(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="h-12">
          <CalendarPlus className="mr-2 h-4 w-4" /> New service
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New service</DialogTitle>
          <DialogDescription>Pick the type, name and date of the service.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            {(["recurring", "one_off"] as ServiceType[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setType(option)}
                className={`rounded-xl border p-3 text-left text-sm transition-colors ${
                  type === option
                    ? "border-primary bg-primary/8 text-primary font-semibold"
                    : "border-border text-muted-foreground"
                }`}
              >
                {option === "recurring" ? "Recurring" : "One-off"}
                <span className="mt-0.5 block text-xs font-normal opacity-70">
                  {option === "recurring" ? "Repeats on a schedule" : "Single event"}
                </span>
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-name">Service name</Label>
            <Input
              id="service-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sunday Recruitment Service"
              required
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-date">Date</Label>
            <Input
              id="service-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="h-12"
            />
          </div>
          {type === "recurring" && (
            <div className="bg-secondary/60 space-y-3 rounded-xl p-3">
              <label className="flex items-center gap-3 text-sm">
                <Checkbox checked={repeat} onCheckedChange={(v) => setRepeat(v === true)} />
                Create weekly instances ahead of time
              </label>
              {repeat && (
                <div className="flex items-center gap-3">
                  <Label htmlFor="weeks" className="text-xs">
                    Number of weeks
                  </Label>
                  <Input
                    id="weeks"
                    type="number"
                    min={1}
                    max={26}
                    value={weeks}
                    onChange={(e) => setWeeks(Number(e.target.value))}
                    className="h-10 w-20"
                  />
                </div>
              )}
            </div>
          )}
          <Button type="submit" size="lg" className="h-12 w-full" disabled={create.isPending}>
            Create service
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}