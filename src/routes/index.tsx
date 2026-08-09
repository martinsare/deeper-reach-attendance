import { createFileRoute } from "@tanstack/react-router";
import { LoginScreen } from "@/components/app/LoginScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Attendance Sign In | Deeper Life Bible Church, Pontypridd" },
      {
        name: "description",
        content:
          "Sign in to record and review attendance for Deeper Life Bible Church, Pontypridd.",
      },
      { property: "og:title", content: "Attendance | Deeper Life Bible Church, Pontypridd" },
      {
        property: "og:description",
        content: "Every name counted. Every household known.",
      },
    ],
  }),
  component: LoginScreen,
});
