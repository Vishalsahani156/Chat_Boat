import { Radio, Square, Loader2 } from 'lucide-react';
import type { LiveVoiceStatus } from '../hooks/useLiveVoice';

interface VoiceModeProps {
  status: LiveVoiceStatus;
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
  onEndTurn: () => void;
  onInterrupt: () => void;
}

const STATUS_LABEL: Record<LiveVoiceStatus, string> = {
  off: 'Live voice off',
  listening: 'Listening…',
  processing: 'Thinking…',
  speaking: 'Speaking…',
};

export default function VoiceMode({
  status,
  disabled = false,
  onStart,
  onStop,
  onEndTurn,
  onInterrupt,
}: VoiceModeProps) {
  const isActive = status !== 'off';

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {!isActive ? (
        <button
          type="button"
          onClick={onStart}
          disabled={disabled}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-brand-500/30
            bg-brand-500/10 px-2.5 py-1.5 text-xs font-semibold text-brand-700
            transition-all hover:bg-brand-500/20 active:scale-[0.98]
            disabled:pointer-events-none disabled:opacity-50
            dark:border-brand-400/30 dark:bg-brand-500/15 dark:text-brand-200 sm:px-3"
          title={disabled ? 'Finish mic recording first' : 'Start live voice conversation'}
        >
          <Radio size={14} />
          <span className="hidden sm:inline">Live</span>
        </button>
      ) : (
        <>
          <span
            className={`hidden max-w-[140px] truncate text-[11px] font-medium lg:inline xl:max-w-none ${
              status === 'listening'
                ? 'animate-pulse-soft text-red-600 dark:text-red-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {STATUS_LABEL[status]}
          </span>
          {status === 'listening' && (
            <button
              type="button"
              onClick={onEndTurn}
              className="inline-flex min-h-[36px] items-center rounded-lg bg-brand-600 px-2.5 text-xs font-semibold
                text-white transition-colors hover:bg-brand-500"
            >
              End
            </button>
          )}
          {status === 'processing' && (
            <span className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center text-brand-600 dark:text-brand-400">
              <Loader2 size={16} className="animate-spin" />
            </span>
          )}
          {status === 'speaking' && (
            <button
              type="button"
              onClick={onInterrupt}
              className="inline-flex min-h-[36px] items-center rounded-lg px-2 text-xs font-medium
                text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
            >
              Stop
            </button>
          )}
          <button
            type="button"
            onClick={onStop}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl
              bg-red-500/15 text-red-600 transition-colors hover:bg-red-500/25
              dark:text-red-400"
            title="Stop live voice"
            aria-label="Stop live voice"
          >
            <Square size={14} fill="currentColor" />
          </button>
        </>
      )}
    </div>
  );
}
