export function suggestWorktreePath(projectPath: string, branchName: string): string {
  const normalizedProjectPath = projectPath.trim().replace(/\/+$/, '');
  const safeBranchName = branchName
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (normalizedProjectPath.length === 0 || safeBranchName.length === 0) {
    return '';
  }

  const lastSlashIndex = normalizedProjectPath.lastIndexOf('/');

  if (lastSlashIndex === -1) {
    return `${normalizedProjectPath}-${safeBranchName}`;
  }

  const parentPath = normalizedProjectPath.slice(0, lastSlashIndex);
  const projectName = normalizedProjectPath.slice(lastSlashIndex + 1);

  return `${parentPath}/${projectName}-${safeBranchName}`;
}
