export type WorktreePathSuggestion = {
  id: 'project-prefixed' | 'branch-only';
  label: string;
  path: string;
};

export function suggestWorktreePath(projectPath: string, branchName: string): string {
  return suggestWorktreePathOptions(projectPath, branchName)[0]?.path ?? '';
}

export function suggestWorktreePathOptions(projectPath: string, branchName: string): WorktreePathSuggestion[] {
  const normalizedProjectPath = projectPath.trim().replace(/\/+$/, '');
  const safeBranchName = sanitizeWorktreeName(branchName);

  if (normalizedProjectPath.length === 0 || safeBranchName.length === 0) {
    return [];
  }

  const lastSlashIndex = normalizedProjectPath.lastIndexOf('/');

  if (lastSlashIndex === -1) {
    return [
      {
        id: 'project-prefixed',
        label: 'Project prefix',
        path: `${normalizedProjectPath}-${safeBranchName}`,
      },
      {
        id: 'branch-only',
        label: 'Short name',
        path: safeBranchName,
      },
    ];
  }

  const parentPath = normalizedProjectPath.slice(0, lastSlashIndex);
  const projectName = normalizedProjectPath.slice(lastSlashIndex + 1);

  return dedupeSuggestions([
    {
      id: 'project-prefixed',
      label: 'Project prefix',
      path: `${parentPath}/${projectName}-${safeBranchName}`,
    },
    {
      id: 'branch-only',
      label: 'Short name',
      path: `${parentPath}/${safeBranchName}`,
    },
  ]);
}

function sanitizeWorktreeName(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function dedupeSuggestions(suggestions: WorktreePathSuggestion[]): WorktreePathSuggestion[] {
  const seenPaths = new Set<string>();

  return suggestions.filter((suggestion) => {
    if (seenPaths.has(suggestion.path)) {
      return false;
    }

    seenPaths.add(suggestion.path);
    return true;
  });
}
