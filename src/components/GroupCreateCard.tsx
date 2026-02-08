"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createGroup } from "@/app/actions/groups";

export default function GroupCreateCard() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError("Group name must be at least 2 characters.");
      return;
    }

    startTransition(async () => {
      const result = await createGroup(trimmedName);

      if (!result.success) {
        setError(result.error ?? "Unable to create group.");
        return;
      }

      setName("");
      router.refresh();
    });
  };

  return (
    <Card className="border-black bg-white">
      <CardHeader>
        <CardTitle className="text-black">Create a group</CardTitle>
        <CardDescription className="text-gray-600">
          Start a new leaderboard for your friends.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder="Group name"
              className="border-black/20"
              disabled={isPending}
            />
            <Button
              type="submit"
              className="bg-black text-white hover:bg-gray-800"
              disabled={isPending || name.trim().length < 2}
            >
              {isPending ? "Creating..." : "Create"}
            </Button>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
