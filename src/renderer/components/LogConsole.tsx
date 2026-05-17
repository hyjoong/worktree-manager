import { Terminal } from 'lucide-react';

type LogConsoleProps = {
  logs: string[];
};

export function LogConsole({ logs }: LogConsoleProps) {
  return (
    <section className="border-t border-border bg-console">
      <div className="flex h-8 items-center gap-2 border-b border-border px-3 text-xs font-medium text-muted-foreground">
        <Terminal className="size-3.5" />
        Console
      </div>
      <div className="h-[104px] overflow-auto px-3 py-2 font-mono text-[11px] leading-5 text-muted-foreground">
        {logs.length === 0 ? (
          <div className="text-muted-foreground/70">$ waiting for git commands...</div>
        ) : (
          logs.map((log, index) => <div key={`${log}-${index}`}>{log}</div>)
        )}
      </div>
    </section>
  );
}
