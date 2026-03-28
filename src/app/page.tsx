import { redirect } from "next/navigation";

// Root → redirect to feed or login (middleware handles auth)
export default function RootPage() {
  redirect("/home");
}
