import { CheckCircle2, ChevronDown, ChevronUp, Clipboard, Terminal, Trash2, XCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

type LogConsoleProps = {
  logs: string[];
  onClear(): void;
};

type ParsedLogLine = {
  raw: string;
  timestamp: string | null;
  body: string;
  kind: 'command' | 'error' | 'success' | 'output';
};

export function LogConsole({ logs, onClear }: LogConsoleProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const parsedLogs = useMemo(() => logs.map(parseLogLine), [logs]);
  const latestCommand = parsedLogs.find((log) => log.kind === 'command')?.body.replace(/^\$\s*/, '') ?? null;

  useEffect(() => {
    if (!isCollapsed) {
      scrollRef.current?.scrollTo({ top: 0 });
    }
  }, [isCollapsed, logs]);

  return (
    <section className="border-t border-border/80 bg-console">
      <div className="flex h-8 items-center justify-between px-2.5 text-xs font-medium text-muted-foreground">
        <div className="flex min-w-0 items-center gap-2">
          <Terminal className="size-3.5 text-muted-foreground/80" />
          <span className="text-[11px] font-semibold uppercase tracking-wide">Console</span>
          <span className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {logs.length} lines
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={latestCommand === null}
            onClick={() => {
              if (latestCommand !== null) {
                void navigator.clipboard.writeText(latestCommand);
              }
            }}
            title="Copy latest command"
          >
            <Clipboard className="size-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-7" onClick={onClear} disabled={logs.length === 0} title="Clear console">
            <Trash2 className="size-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => setIsCollapsed((value) => !value)} title="Toggle console">
            {isCollapsed ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </Button>
        </div>
      </div>
      {!isCollapsed ? (
        <div
          ref={scrollRef}
          className="h-[108px] overflow-auto border-t border-border/60 bg-zinc-950/35 px-2.5 py-1.5 font-mono text-[11px] leading-[17px]"
        >
          {parsedLogs.length === 0 ? (
            <div className="text-muted-foreground/60">$ waiting for git commands...</div>
          ) : (
            parsedLogs.map((log, index) => <ConsoleLine key={`${log.raw}-${index}`} log={log} />)
          )}
        </div>
      ) : null}
    </section>
  );
}

function ConsoleLine({ log }: { log: ParsedLogLine }) {
  const Icon = log.kind === 'success' ? CheckCircle2 : log.kind === 'error' ? XCircle : null;

  return (
    <div className="group grid grid-cols-[64px_14px_minmax(0,1fr)] items-start gap-1.5 py-px">
      <span className="select-none text-[10px] text-muted-foreground/55">{log.timestamp ?? ''}</span>
      <span className="pt-[2px]">
        {Icon !== null ? (
          <Icon className={cn('size-3', log.kind === 'success' ? 'text-emerald-400/90' : 'text-red-400/90')} />
        ) : log.kind === 'command' ? (
          <span className="text-blue-400/90">$</span>
        ) : (
          <span className="text-muted-foreground/35">·</span>
        )}
      </span>
      <span
        className={cn(
          'min-w-0 truncate',
          log.kind === 'command' && 'font-medium text-blue-300',
          log.kind === 'error' && 'text-red-300',
          log.kind === 'success' && 'text-emerald-300',
          log.kind === 'output' && 'text-zinc-400',
        )}
        title={log.body}
      >
        {log.kind === 'command' ? log.body.replace(/^\$\s*/, '') : log.body}
      </span>
    </div>
  );
}

function parseLogLine(raw: string): ParsedLogLine {
  const match = raw.match(/^\[(?<timestamp>[^\]]+)\]\s(?<body>.*)$/);
  const timestamp = match?.groups?.timestamp ?? null;
  const body = match?.groups?.body ?? raw;

  if (body.startsWith('$')) {
    return { raw, timestamp, body, kind: 'command' };
  }

  if (body.startsWith('error:')) {
    return { raw, timestamp, body, kind: 'error' };
  }

  if (body.startsWith('listed ') || body.startsWith('loaded ') || body.includes('created') || body.includes('removed')) {
    return { raw, timestamp, body, kind: 'success' };
  }

  return { raw, timestamp, body, kind: 'output' };
}
