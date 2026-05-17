import { ipcMain } from 'electron';
import type { z } from 'zod';
import { assertAllowedIpcSender } from '../security';

type ErrorResult = {
  ok: false;
  error: string;
};

type IpcResult = ErrorResult | { ok: true };

export function handleValidatedIpc<TSchema extends z.ZodType, TResult extends IpcResult>(
  channel: string,
  schema: TSchema,
  handler: (input: z.infer<TSchema>) => Promise<TResult>,
) {
  ipcMain.handle(channel, async (event, input: unknown): Promise<TResult | ErrorResult> => {
    try {
      assertAllowedIpcSender(event.sender);
      const parsed = schema.safeParse(input);

      if (!parsed.success) {
        return {
          ok: false,
          error: parsed.error.issues.map((issue) => issue.message).join(', '),
        };
      }

      return await handler(parsed.data);
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'IPC command failed',
      };
    }
  });
}
