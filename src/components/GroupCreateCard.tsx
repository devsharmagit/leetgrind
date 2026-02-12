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
    <Card className="border-neutral-800 bg-neutral-900">
      <CardHeader>
        <CardTitle className="text-white">Create a group</CardTitle>
        <CardDescription className="text-neutral-400">
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
              className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:ring-neutral-600"
              disabled={isPending}
            />
            <Button
              type="submit"
              className="bg-yellow-500 text-black hover:bg-yellow-400 font-semibold"
              disabled={isPending || name.trim().length < 2}
            >
              {isPending ? "Creating..." : "Create"}
            </Button>
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
