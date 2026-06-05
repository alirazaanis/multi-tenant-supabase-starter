import { redirect } from "next/navigation";
import { PlatformConsole } from "@/components/platform/PlatformConsole";
import { isPlatformOwner } from "@/lib/auth/platform-owner";
import { createClient } from "@/lib/supabase/server";

export default async function ConsolePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isPlatformOwner(user.id, supabase))) {
    redirect("/login");
  }

  return <PlatformConsole />;
}
