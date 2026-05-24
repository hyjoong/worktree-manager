# Worktree Manager

로컬 Git worktree를 관리하기 위한 macOS 데스크톱 앱입니다.

하나의 Git 레포에서 여러 작업 폴더를 만들어 브랜치별 작업, 리뷰, 실험, 기능 개발을 병렬로 진행하는 흐름을 더 편하게 관리하려고 만든 개발자용 생산성 앱입니다.

## 주요 기능

- 로컬 Git 프로젝트 등록
- `git worktree list --porcelain` 기반 worktree 목록 표시
- worktree path, branch, status, dirty 여부, 마지막 commit 표시
- 새 브랜치 또는 기존 브랜치 기반 worktree 생성
- worktree 삭제
- Cursor 또는 VS Code로 worktree 열기
- `Cmd+K` Raycast 스타일 command palette
- 프로젝트/워크트리/액션 검색
- 프로젝트 목록 로컬 저장
- Git 명령 실행 로그 콘솔
- GitHub Releases 기반 앱 업데이트 확인
- 다크모드/라이트모드

## 다운로드

최신 릴리즈:

https://github.com/hyjoong/worktree-manager-releases/releases/latest

macOS Apple Silicon용 파일:

- `Worktree.Manager-*-mac-arm64.dmg`
- `Worktree.Manager-*-mac-arm64.zip`

v0.1.8 이후 배포 빌드는 Apple Developer ID 서명과 notarization을 적용하는 것을 목표로 합니다. 이전 unsigned 빌드는 처음 실행할 때 macOS 보안 경고가 뜰 수 있습니다.

## 요구사항

- macOS Apple Silicon
- Git
- Cursor 또는 VS Code

Git은 터미널에서 실행 가능한 상태여야 합니다.

```bash
git --version
```

## 기본 사용 흐름

1. 사이드바에서 `Add Project`를 눌러 Git 프로젝트 폴더를 등록합니다.
2. 중앙 목록에서 현재 worktree 상태를 확인합니다.
3. `New`를 눌러 worktree를 생성합니다.
4. 새 브랜치를 만들 때는 `New branch`, 이미 있는 브랜치를 다른 폴더로 체크아웃할 때는 `Existing branch`를 선택합니다.
5. branch name을 입력하면 같은 부모 폴더 기준으로 worktree path가 자동 추천됩니다.
6. 필요한 worktree를 Cursor 또는 VS Code로 엽니다.

예를 들어 `/Users/me/Desktop/teacher-gguge-front` 프로젝트에서 `feature/login` 브랜치를 입력하면 기본 경로는 `/Users/me/Desktop/teacher-gguge-front-feature-login` 형태로 제안됩니다.

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

Apple Developer ID 서명과 notarization을 적용하려면 아래 환경변수가 필요합니다.

```bash
export APPLE_ID="your-apple-account@example.com"
export APPLE_TEAM_ID="6W9KP3964C"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
pnpm dist:mac
```

로컬 unsigned 빌드가 필요할 때는 별도 스크립트를 사용합니다.

```bash
pnpm dist:mac:unsigned
```

GitHub Releases에 배포 파일 업로드:

```bash
GH_TOKEN=<github-token> pnpm dist:publish
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
- GitHub Releases publish 설정: `hyjoong/worktree-manager-releases`
- Apple Developer ID signing과 notarization 적용
- unsigned 로컬 빌드는 `pnpm dist:mac:unsigned` 사용

앱 업데이트는 `electron-updater`를 사용합니다.

- 최초 설치는 `dmg`를 사용합니다.
- 이후 앱 내부 `Update` 버튼으로 GitHub Releases의 최신 버전을 확인할 수 있습니다.
- macOS 자동 업데이트 메타데이터 생성을 위해 `zip` 타깃을 함께 유지합니다.
- 앱 업데이트 산출물은 public 저장소인 `hyjoong/worktree-manager-releases`에 업로드합니다.
- 소스 코드 저장소는 private으로 유지하고, 앱이 인증 없이 읽어야 하는 릴리즈 피드와 배포 파일만 public으로 제공합니다.

공증 상태 확인:

```bash
spctl --assess --verbose=4 "release/<version>/mac-arm64/Worktree Manager.app"
spctl --assess --verbose=4 --type open "release/<version>/Worktree Manager-<version>-mac-arm64.dmg"
```
