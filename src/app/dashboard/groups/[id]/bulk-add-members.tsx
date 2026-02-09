'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { addMembersToGroup } from '@/app/actions/groups';
import { toast } from 'sonner';

interface BulkAddMembersProps {
  groupId: number;
  existingUsernames: string[];
}

interface AddResult {
  username: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
}

export default function BulkAddMembers({ groupId, existingUsernames }: BulkAddMembersProps) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState<AddResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const parseUsernames = (text: string): string[] => {
    // Remove single/double quotes, brackets, and split by comma, newline, or space
    return text
      .replace(/['"[\]{}()]/g, '') // Remove quotes and brackets
      .split(/[\n,\s]+/)
      .map((u) => u.trim())
      .filter((u) => u.length > 0)
      .filter((u, i, arr) => arr.indexOf(u) === i); // Remove duplicates
  };

  const handleSubmit = () => {
    const usernames = parseUsernames(input);

    if (usernames.length === 0) {
      toast.error('Please enter at least one username');
      return;
    }

    if (usernames.length > 200) {
      toast.error('Maximum 200 usernames allowed at once');
      return;
    }

    setShowResults(true);
    setResults([]);

    startTransition(async () => {
      const response = await addMembersToGroup(groupId, usernames);

      if (!response.success) {
        toast.error(response.error || 'Failed to add members');
        return;
      }

      if (response.results) {
        setResults(response.results);

        const successCount = response.results.filter((r) => r.status === 'success').length;
        const skipCount = response.results.filter((r) => r.status === 'skipped').length;
        const errorCount = response.results.filter((r) => r.status === 'error').length;

        if (successCount > 0) {
          toast.success(`Added ${successCount} member${successCount > 1 ? 's' : ''}`);
        }
        if (skipCount > 0) {
          toast.info(`${skipCount} already in group`);
        }
        if (errorCount > 0) {
          toast.error(`${errorCount} failed validation`);
        }

        // Always clear input after processing
        setInput('');

        router.refresh();
      }
    });
  };

  const usernameCount = parseUsernames(input).length;

  const getStatusIcon = (status: 'success' | 'error' | 'skipped') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'skipped':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: 'success' | 'error' | 'skipped') => {
    switch (status) {
      case 'success':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'error':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'skipped':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    }
  };

  return (
    <Card className="bg-neutral-900 border-neutral-800 sticky top-8">
      <CardHeader className="border-b border-neutral-800">
        <CardTitle className="text-white flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-neutral-400" />
          Add Members
        </CardTitle>
        <CardDescription className="text-neutral-500">
          Enter LeetCode usernames (one per line, comma-separated, or space-separated)
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="space-y-2">
          <Textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowResults(false);
            }}
            placeholder="username1&#10;username2&#10;username3&#10;&#10;or: user1, user2, user3"
            className="min-h-[200px] bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 resize-none font-mono text-sm focus:border-neutral-600 focus:ring-neutral-600"
            disabled={isPending}
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-500">
              {usernameCount > 0 ? `${usernameCount} username${usernameCount > 1 ? 's' : ''}` : 'No usernames entered'}
            </span>
            <span className="text-neutral-600">Max 200 at once</span>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isPending || usernameCount === 0}
          className="w-full bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-700 disabled:text-neutral-500"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Validating & Adding...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Add {usernameCount > 0 ? usernameCount : ''} Member{usernameCount !== 1 ? 's' : ''}
            </>
          )}
        </Button>

        {/* Results */}
        {showResults && results.length > 0 && (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Results</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowResults(false);
                  setResults([]);
                }}
                className="h-6 px-2 text-xs text-neutral-500 hover:text-white hover:bg-neutral-800"
              >
                Clear
              </Button>
            </div>
            <div className="space-y-1">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 p-2 rounded border text-sm ${getStatusColor(result.status)}`}
                >
                  {getStatusIcon(result.status)}
                  <span className="font-mono flex-1 truncate">{result.username}</span>
                  <span className="text-xs opacity-75">{result.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Existing members hint */}
        {existingUsernames.length > 0 && (
          <div className="p-3 rounded bg-neutral-800/50 border border-neutral-700/50">
            <p className="text-xs text-neutral-500 mb-2">
              Already in group ({existingUsernames.length}):
            </p>
            <div className="flex flex-wrap gap-1">
              {existingUsernames.slice(0, 10).map((username) => (
                <span
                  key={username}
                  className="text-xs px-2 py-0.5 rounded bg-neutral-700 text-neutral-400"
                >
                  {username}
                </span>
              ))}
              {existingUsernames.length > 10 && (
                <span className="text-xs px-2 py-0.5 rounded bg-neutral-700 text-neutral-500">
                  +{existingUsernames.length - 10} more
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
