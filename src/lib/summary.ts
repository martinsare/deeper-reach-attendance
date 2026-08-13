import { format, parseISO } from "date-fns";

import { normalizeMemberCategory, type Member, type MemberCategory } from "./data";

const GROUPS: { label: string; categories: MemberCategory[] }[] = [
  { label: "Adult", categories: ["adult"] },
  { label: "Youth", categories: ["youth"] },
  { label: "Children", categories: ["child"] },
];

function lines(rows: Member[]) {
  const out: string[] = [];
  let total = 0;
  for (const group of GROUPS) {
    const inGroup = rows.filter((m) =>
      group.categories.includes(normalizeMemberCategory(m.category)),
    );
    if (inGroup.length === 0) continue;
    const male = inGroup.filter((m) => m.gender === "male").length;
    const female = inGroup.filter((m) => m.gender === "female").length;
    out.push(`${group.label} (M=${male}; F=${female})`);
    total += inGroup.length;
  }
  out.push("");
  out.push(`Total = ${total}`);
  return out;
}

export function buildAttendanceSummary({
  date,
  present,
}: {
  date?: string | undefined;
  present: Member[];
}) {
  const day = date ? parseISO(date) : new Date();
  const heading = `${format(day, "EEEE")} Attendance for ${format(day, "dd/MM/yy")}`;
  const workers = present.filter((m) => m.is_worker);
  const blocks = [heading, "", ...lines(present)];
  if (workers.length > 0) {
    blocks.push("", "Workers", "", ...lines(workers));
  }
  return blocks.join("\n");
}
