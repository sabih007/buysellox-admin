import Link from "next/link";
import { EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md pt-16">
      <EmptyState title="Not found" description="That record doesn't exist or was deleted." />
      <div className="mt-4 text-center">
        <Link href="/" className="btn-secondary">
          Back to overview
        </Link>
      </div>
    </div>
  );
}
