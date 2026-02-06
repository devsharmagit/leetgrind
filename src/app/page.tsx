import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold text-black">Welcome to Our Application</h1>
      <div className="flex gap-4">
        <Link href="/login">
          <Button className="bg-black text-white hover:bg-gray-800 px-8">
            Login
          </Button>
        </Link>
        <Link href="/signup">
          <Button variant="outline" className="border-black text-black hover:bg-gray-100 px-8">
            Sign Up
          </Button>
        </Link>
      </div>
    </div>
  );
}
