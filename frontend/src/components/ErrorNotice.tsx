import { AlertTriangle } from 'lucide-react';

export function ErrorNotice({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-4 flex items-start gap-3 border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
