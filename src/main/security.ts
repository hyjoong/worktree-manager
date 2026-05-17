export function isAllowedRendererUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);

    if (url.protocol === 'file:') {
      return true;
    }

    return url.protocol === 'http:' && url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

type IpcSenderLike = {
  getURL(): string;
};

export function assertAllowedIpcSender(sender: IpcSenderLike): void {
  if (!isAllowedRendererUrl(sender.getURL())) {
    throw new Error('Blocked IPC call from unexpected renderer URL');
  }
}
