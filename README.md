# Worktree Manager

로컬 Git worktree를 관리하기 위한 macOS 데스크톱 앱입니다.

하나의 Git 레포에서 여러 작업 폴더를 만들어 브랜치별 작업, 리뷰, 실험, 기능 개발을 병렬로 진행하는 흐름을 더 편하게 관리하려고 만든 개발자용 생산성 앱입니다.

## 주요 기능

- 로컬 Git 프로젝트 등록
- `git worktree list --porcelain` 기반 worktree 목록 표시
- worktree path, branch, status, dirty 여부, 마지막 commit 표시
- 새 worktree 생성
- worktree 삭제
- Cursor 또는 VS Code로 worktree 열기
- `Cmd+K` Raycast 스타일 command palette
- 프로젝트/워크트리/액션 검색
- 프로젝트 목록 로컬 저장
- Git 명령 실행 로그 콘솔
- 다크모드/라이트모드

## 다운로드

최신 릴리즈:

https://github.com/hyjoong/worktree-manager/releases/latest

macOS Apple Silicon용 파일:

- `Worktree.Manager-*-mac-arm64.dmg`
- `Worktree.Manager-*-mac-arm64.zip`

현재 빌드는 아직 Apple Developer ID 서명과 notarization을 하지 않은 상태입니다. 처음 실행할 때 macOS 보안 경고가 뜰 수 있습니다.

## 요구사항

- macOS Apple Silicon
- Git
- Cursor 또는 VS Code

Git은 터미널에서 실행 가능한 상태여야 합니다.

```bash
git --version
```

## 개발

의존성 설치:

```bash
pnpm install
```

Electron 개발 환경 실행:

```bash
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

macOS 배포 파일 생성:

```bash
pnpm dist:mac
```

생성된 파일은 아래 경로에 저장됩니다.

```text
release/<version>/
```

## 프로젝트 구조

```text
src/
  main/
    git/
    ipc/
    settings/
  preload/
  renderer/
    components/
    hooks/
    lib/
    stores/
    types/
  shared/
```

## 구현 메모

- Electron main, preload, renderer를 분리합니다.
- renderer에서는 Node API에 직접 접근하지 않습니다.
- preload에서 타입이 지정된 API만 노출합니다.
- IPC input은 `zod`로 검증합니다.
- Git 명령은 `execa`로 실행합니다.
- shell 문자열 조합 대신 args 배열 방식으로 실행합니다.
- 등록한 프로젝트 목록은 Electron app data에 저장합니다.

## 보안 메모

- `contextIsolation` 활성화
- `nodeIntegration` 비활성화
- Electron sandbox 활성화
- IPC sender 검증
- renderer navigation 제한
- 외부 window open 차단

## 패키징

`electron-builder`를 사용합니다.

- `asar: true`
- macOS `dmg`, `zip` target
- custom `build/icon.icns`
- 현재는 unsigned local distribution

외부 사용자에게 자연스럽게 배포하려면 다음 단계로 Apple Developer ID signing과 notarization을 추가해야 합니다.
