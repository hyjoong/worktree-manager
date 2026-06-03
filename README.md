# Worktree Manager

로컬 Git worktree를 편하게 관리하려고 만든 macOS 데스크톱 앱입니다.

하나의 레포에서 여러 브랜치를 동시에 다루다 보면 `git worktree` 명령을 자주 쓰게 됩니다. 기능 개발, 리뷰, 실험 작업을 각각 다른 폴더에서 열어두고 싶을 때 터미널 명령을 반복하지 않고, 현재 worktree 상태를 한 화면에서 보기 위해 만들었습니다.

## 이런 용도로 씁니다

- 같은 프로젝트에서 여러 기능 브랜치를 동시에 작업할 때
- 리뷰용 브랜치와 개발 중인 브랜치를 분리해서 열어두고 싶을 때
- Cursor 또는 VS Code에서 worktree 폴더를 바로 열고 싶을 때
- worktree가 dirty인지, 어떤 브랜치인지, 마지막 커밋이 무엇인지 빠르게 확인하고 싶을 때

## 주요 기능

- Git 프로젝트 등록 및 최근 프로젝트 저장
- Finder에서 프로젝트 폴더 드롭 등록
- `git worktree list --porcelain` 기반 worktree 목록 표시
- branch, path, HEAD, clean/dirty/detached/bare 상태, 마지막 커밋 표시
- 새 브랜치 또는 기존 브랜치로 worktree 생성
- 브랜치 이름 기반 worktree 경로 자동 추천
- clean 상태의 non-main worktree 삭제
- Cursor 또는 VS Code로 worktree 열기
- worktree path 복사
- `Cmd+K` 커맨드 팔레트
- Git 명령 실행 로그 콘솔
- 우측 `App` 탭에서 GitHub Releases 기반 업데이트 확인
- 다크모드/라이트모드

## 다운로드

최신 릴리즈는 아래에서 받을 수 있습니다.

https://github.com/hyjoong/worktree-manager-releases/releases/latest

현재 배포 대상은 macOS Apple Silicon입니다. 처음 설치할 때는 `dmg` 파일을 사용하면 됩니다.

v0.1.8 이후 배포 빌드는 Apple Developer ID signing과 notarization을 적용합니다. 이전 unsigned 빌드는 처음 실행할 때 macOS 보안 경고가 표시될 수 있습니다.

## 요구사항

- macOS Apple Silicon
- Git
- Cursor 또는 Visual Studio Code

Git은 터미널에서 실행 가능한 상태여야 합니다.

```bash
git --version
```

## 기본 사용 흐름

1. `Add Project`로 Git 프로젝트 폴더를 등록합니다.
2. 중앙 목록에서 현재 프로젝트의 worktree 상태를 확인합니다.
3. `New`를 눌러 새 worktree를 만듭니다.
4. 새 브랜치를 만들 때는 `New branch`, 기존 브랜치를 체크아웃할 때는 `Existing branch`를 선택합니다.
5. 필요한 worktree를 Cursor 또는 VS Code로 엽니다.

예를 들어 `/Users/me/Desktop/my-app` 프로젝트에서 `feature/login` 브랜치를 입력하면 기본 경로는 `/Users/me/Desktop/my-app-feature-login` 형태로 제안됩니다.

## 개발

```bash
pnpm install
pnpm dev
```

검증:

```bash
pnpm typecheck
pnpm test
pnpm build
```

macOS 앱 아이콘 재생성:

```bash
pnpm icon:mac
```

## 배포 메모

macOS 배포 파일 생성:

```bash
pnpm dist:mac
```

로컬 unsigned 빌드:

```bash
pnpm dist:mac:unsigned
```

GitHub Releases 업로드:

```bash
GH_TOKEN=<github-token> pnpm dist:publish
```

산출물은 `release/<version>/` 아래에 생성됩니다. 앱 업데이트는 `electron-updater`를 사용하고, 배포 파일은 public release 저장소인 `hyjoong/worktree-manager-releases`에 업로드합니다.

## 기술 메모

- Electron main, preload, renderer를 분리합니다.
- renderer는 Node API에 직접 접근하지 않습니다.
- preload에서 타입이 지정된 `worktreeApi`만 노출합니다.
- IPC 입력은 `zod`로 검증합니다.
- Git 명령은 `execa`로 실행합니다.
- shell 문자열 조합 대신 args 배열 방식으로 실행합니다.
- 등록한 프로젝트 목록은 Electron app data에 저장합니다.

## 프로젝트 구조

```text
src/
  main/       Electron main process, Git command, IPC, settings, updates
  preload/    renderer에 노출하는 안전한 API
  renderer/   React UI, components, hooks, stores
  shared/     main/renderer가 함께 쓰는 타입과 정책
```
