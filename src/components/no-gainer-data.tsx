import { Clock, BarChart3 } from 'lucide-react';

export function NoGainerData() {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-4">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800">
          <BarChart3 className="h-5 w-5 text-neutral-500" />
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800">
          <Clock className="h-5 w-5 text-neutral-500" />
        </div>
      </div>
      <div>
        <p className="text-neutral-300 font-medium text-sm">
          Not enough data yet
        </p>
        <p className="text-neutral-500 text-xs mt-1 max-w-xs">
          Top gainer stats require at least 7 days of tracked data. Check back soon!
        </p>
      </div>
    </div>
  );
}
