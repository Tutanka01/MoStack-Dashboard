import { AlertTriangle, CheckCircle2, Loader2, Lock, Play, Plus, Save, Trash2 } from 'lucide-react';
import { FormEvent, ReactNode, useState } from 'react';
import { apiRequest } from '../api/client';

export type OperatorProps = {
  writeMode: boolean;
  canWrite: boolean;
  onMutated: () => void;
};

type MutationState = {
  busy: boolean;
  message?: string;
  error?: string;
};

export function useMutation(onMutated: () => void) {
  const [state, setState] = useState<MutationState>({ busy: false });

  async function run(path: string, method: string, body?: unknown, success = 'Operation queued.') {
    setState({ busy: true });
    try {
      await apiRequest(path, { method, body });
      setState({ busy: false, message: success });
      onMutated();
    } catch (error) {
      setState({ busy: false, error: error instanceof Error ? error.message : 'Operation failed.' });
    }
  }

  return { ...state, run };
}

export function OperatorNotice({ writeMode, canWrite }: Pick<OperatorProps, 'writeMode' | 'canWrite'>) {
  if (writeMode && canWrite) {
    return (
      <div className="mb-5 border-l-2 border-[#DD2A1C] bg-[#DD2A1C]/[0.07] px-4 py-3 text-sm text-[#2A2722]">
        Write mode active. Mutations are executed by the FastAPI backend only.
      </div>
    );
  }
  if (writeMode && !canWrite) {
    return (
      <div className="mb-5 border-l-2 border-[#B36B00] bg-[#B36B00]/10 px-4 py-3 text-sm text-[#2A2722]">
        Browser write mode is selected, but the backend is locked by DASHBOARD_READ_ONLY=true.
      </div>
    );
  }
  return null;
}

export function OperationPanel({
  title,
  children,
  state
}: {
  title: string;
  children: ReactNode;
  state?: MutationState;
}) {
  return (
    <div className="border border-[#11100D]/12 bg-[#EFE9D9]/55 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-display text-base font-semibold text-[#11100D]">{title}</h3>
        {state?.busy && <Loader2 className="h-4 w-4 animate-spin text-[#1535C7]" />}
      </div>
      {children}
      {state?.message && (
        <p className="mt-3 flex items-center gap-2 text-xs text-[#07683C]">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {state.message}
        </p>
      )}
      {state?.error && (
        <p className="mt-3 flex items-center gap-2 text-xs text-[#DD2A1C]">
          <AlertTriangle className="h-3.5 w-3.5" />
          {state.error}
        </p>
      )}
    </div>
  );
}

export function Field({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="label-compact">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  'w-full border border-[#11100D]/20 bg-[#F7F2E2] px-3 py-2 text-sm text-[#11100D] outline-none transition focus:border-[#DD2A1C]';

export function SubmitButton({
  children,
  disabled,
  busy,
  icon = 'plus'
}: {
  children: ReactNode;
  disabled?: boolean;
  busy?: boolean;
  icon?: 'plus' | 'save' | 'play' | 'trash' | 'lock';
}) {
  const Icon = busy ? Loader2 : { plus: Plus, save: Save, play: Play, trash: Trash2, lock: Lock }[icon];
  return (
    <button
      type="submit"
      disabled={disabled || busy}
      className="inline-flex items-center justify-center gap-2 border border-[#11100D] bg-[#11100D] px-3 py-2 font-mono text-xs font-medium uppercase tracking-[0.08em] text-[#EFE9D9] transition hover:border-[#DD2A1C] hover:bg-[#DD2A1C] disabled:cursor-not-allowed disabled:border-[#11100D]/20 disabled:bg-[#11100D]/20"
    >
      <Icon className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} />
      {children}
    </button>
  );
}

export function bindSubmit(handler: () => void) {
  return (event: FormEvent) => {
    event.preventDefault();
    handler();
  };
}
