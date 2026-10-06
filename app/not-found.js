import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-5xl font-semibold text-zinc-300">404</p>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-zinc-500">The page you are looking for doesn&apos;t exist.</p>
      <Link href="/" className="text-sm font-medium text-indigo-600 hover:underline">
        Back to home
      </Link>
    </div>
  );
}
