import { currentUser } from "@clerk/nextjs/server";

export default async function SettingsPage() {
  const user = await currentUser();

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-6 text-3xl font-bold">Settings</h1>
      {user && (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user.emailAddresses[0]?.emailAddress}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium">
              {user.firstName} {user.lastName}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
