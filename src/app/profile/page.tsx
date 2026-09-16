import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { ProfileForm } from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user?.profile) redirect("/login");
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Profile</h1>
        <p className="text-sm text-[var(--muted)]">
          Used in templates as {"{{my_*}}"} — also shaped for a future autofill extension
        </p>
      </div>
      <ProfileForm initial={JSON.parse(JSON.stringify(user.profile))} />
    </div>
  );
}
