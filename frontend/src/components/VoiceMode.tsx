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
  listening: 'Listening… tap End when done speaking',
  processing: 'Thinking…',
  speaking: 'Speaking… tap to interrupt'
};

export default function VoiceMode({
  status,
  disabled = false,
  onStart,
  onStop,
  onEndTurn,
  onInterrupt
}: VoiceModeProps) {
  const isActive = status !== 'off';

  return (
    <div className="flex items-center gap-2">
      {!isActive ? (
        <button
          type="button"
          onClick={onStart}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
            bg-purple-500/15 text-purple-700 hover:bg-purple-500/25
            dark:text-purple-300 dark:hover:bg-purple-500/20 transition-colors
            disabled:opacity-50 disabled:pointer-events-none"
          title={disabled ? 'Finish mic recording first' : 'Start live voice conversation'}
        >
          <Radio size={14} />
          Live voice
        </button>
      ) : (
        <>
          <span
            className={`hidden sm:inline text-xs ${
              status === 'listening'
                ? 'text-red-600 dark:text-red-400 animate-pulse'
                : 'text-slate-600 dark:text-dark-400'
            }`}
          >
            {STATUS_LABEL[status]}
          </span>
          {status === 'listening' && (
            <button
              type="button"
              onClick={onEndTurn}
              className="px-2 py-1 rounded-lg text-xs bg-blue-500 text-white hover:bg-blue-600"
            >
              End
            </button>
          )}
          {status === 'processing' && (
            <span className="p-1.5 text-slate-600 dark:text-dark-300">
              <Loader2 size={16} className="animate-spin" />
            </span>
          )}
          {status === 'speaking' && (
            <button
              type="button"
              onClick={onInterrupt}
              className="px-2 py-1 rounded-lg text-xs text-slate-700 hover:bg-slate-100 dark:text-dark-200 dark:hover:bg-dark-600"
            >
              Interrupt
            </button>
          )}
          <button
            type="button"
            onClick={onStop}
            className="p-1.5 rounded-lg bg-red-500/15 text-red-600 hover:bg-red-500/25 dark:text-red-400"
            title="Stop live voice"
          >
            <Square size={14} />
          </button>
        </>
      )}
    </div>
  );
}
