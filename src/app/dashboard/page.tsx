import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import GroupCreateCard from "@/components/GroupCreateCard";
import GroupList from "@/components/GroupList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const signOutAction = async () => {
  "use server";
  await signOut({ redirectTo: "/" });
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const ownedGroups = await prisma.group.findMany({
    where: {
      owner: {
        email: session.user.email,
      },
    },
    orderBy: {
      id: "desc",
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          users: true,
        },
      },
    },
  });

  const displayName = session.user.name ?? "there";

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-black">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome, {displayName}</p>
          </div>
          <form action={signOutAction}>
            <Button
              variant="outline"
              className="border-black text-black hover:bg-gray-100"
            >
              Logout
            </Button>
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <GroupCreateCard />

        <Card className="border-black bg-white">
          <CardHeader>
            <CardTitle className="text-black">Your groups</CardTitle>
            <CardDescription className="text-gray-600">
              Groups you created.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <GroupList groups={ownedGroups} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
