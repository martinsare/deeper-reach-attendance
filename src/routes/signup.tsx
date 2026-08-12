import { createFileRoute } from "@tanstack/react-router";
import { SignUpScreen } from "@/components/app/SignUpScreen";

export const Route = createFileRoute("/signup")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign Up | Deeper Life Bible Church, Pontypridd" },
      {
        name: "description",
        content: "Create the first attendance account for Deeper Life Bible Church, Pontypridd.",
      },
      { property: "og:title", content: "Sign Up | Deeper Life Bible Church, Pontypridd" },
      { property: "og:description", content: "Create your attendance account." },
    ],
  }),
  component: SignUpScreen,
});
