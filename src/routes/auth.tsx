import { createFileRoute } from "@tanstack/react-router";
import { LoginScreen } from "@/components/app/LoginScreen";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In | Deeper Life Bible Church, Pontypridd" },
      {
        name: "description",
        content: "Staff sign in for the Deeper Life Bible Church, Pontypridd attendance app.",
      },
      { property: "og:title", content: "Sign In | Deeper Life Bible Church, Pontypridd" },
      { property: "og:description", content: "Attendance for our services, taken in seconds." },
    ],
  }),
  component: LoginScreen,
});