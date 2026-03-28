import { ProfileView } from "./ProfileView";

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <ProfileView userId={userId} />;
}
