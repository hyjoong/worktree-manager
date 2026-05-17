import { useState } from 'react';

export function useAppLog() {
  const [logs, setLogs] = useState<string[]>([]);

  function appendLog(message: string) {
    const time = new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date());
    setLogs((current) => [`[${time}] ${message}`, ...current].slice(0, 80));
  }

  function clearLogs() {
    setLogs([]);
  }

  return { logs, appendLog, clearLogs };
}
