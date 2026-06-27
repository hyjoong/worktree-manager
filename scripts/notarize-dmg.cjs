/**
 * electron-builder `afterAllArtifactBuild` hook.
 *
 * electron-builder의 `notarize: true`는 .app 번들만 공증한다. ZIP 안의 앱은
 * 공증/스테이플되지만, 첫 설치에 쓰는 DMG 껍데기는 서명만 되고 공증되지 않아
 * 사용자가 DMG를 열 때 Gatekeeper 경고가 뜬다.
 *
 * 이 hook은 빌드된 .dmg를 notarytool로 제출(--wait)하고 stapler로 티켓을 박은 뒤,
 * 달라진 해시/크기를 latest-mac.yml에 반영한다.
 *
 * 자격증명은 아래 중 하나로 제공한다 (electron-builder가 .app 공증에 쓰는 것과 동일):
 *   - APPLE_KEYCHAIN_PROFILE                                   (가장 간단, 권장)
 *   - APPLE_API_KEY + APPLE_API_KEY_ID + APPLE_API_ISSUER      (App Store Connect API key)
 *   - APPLE_ID + APPLE_APP_SPECIFIC_PASSWORD + APPLE_TEAM_ID
 *
 * 자격증명이 없거나 unsigned 빌드면 조용히 건너뛴다.
 */
const { spawnSync } = require("node:child_process");
const { createHash } = require("node:crypto");
const { readFileSync, writeFileSync, statSync } = require("node:fs");

function notarytoolAuthArgs() {
  if (process.env.WORKTREE_MANAGER_UNSIGNED === "1") return null;
  if (process.env.CSC_IDENTITY_AUTO_DISCOVERY === "false") return null;

  if (process.env.APPLE_KEYCHAIN_PROFILE) {
    return ["--keychain-profile", process.env.APPLE_KEYCHAIN_PROFILE];
  }
  if (
    process.env.APPLE_API_KEY &&
    process.env.APPLE_API_KEY_ID &&
    process.env.APPLE_API_ISSUER
  ) {
    return [
      "--key",
      process.env.APPLE_API_KEY,
      "--key-id",
      process.env.APPLE_API_KEY_ID,
      "--issuer",
      process.env.APPLE_API_ISSUER,
    ];
  }
  if (
    process.env.APPLE_ID &&
    process.env.APPLE_APP_SPECIFIC_PASSWORD &&
    process.env.APPLE_TEAM_ID
  ) {
    return [
      "--apple-id",
      process.env.APPLE_ID,
      "--password",
      process.env.APPLE_APP_SPECIFIC_PASSWORD,
      "--team-id",
      process.env.APPLE_TEAM_ID,
    ];
  }
  return null;
}

function run(args) {
  const result = spawnSync("xcrun", args, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    throw new Error(`xcrun ${args[0]} 실패 (exit ${result.status})`);
  }
}

function sha512Base64(filePath) {
  return createHash("sha512").update(readFileSync(filePath)).digest("base64");
}

/** latest-mac.yml의 해당 dmg sha512/size를 stapling 이후 값으로 갱신 */
function updateLatestYml(ymlPath, dmgPath) {
  const fileName = dmgPath.split("/").pop();
  const newHash = sha512Base64(dmgPath);
  const newSize = statSync(dmgPath).size;

  const lines = readFileSync(ymlPath, "utf8").split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`url: ${fileName}`)) {
      // 바로 다음 두 줄이 sha512/size (electron-builder 출력 형식)
      for (let j = i + 1; j < lines.length && j <= i + 2; j++) {
        lines[j] = lines[j].replace(/sha512:.*/, `sha512: ${newHash}`);
        lines[j] = lines[j].replace(/size:.*/, `size: ${newSize}`);
      }
    }
  }
  writeFileSync(ymlPath, lines.join("\n"));
}

exports.default = async function notarizeDmg(context) {
  if (process.platform !== "darwin") return;

  const artifacts = context.artifactPaths || [];
  const dmgs = artifacts.filter((p) => p.endsWith(".dmg"));
  if (dmgs.length === 0) return;

  const authArgs = notarytoolAuthArgs();
  if (!authArgs) {
    console.warn(
      "[notarize-dmg] 자격증명이 없어 DMG 공증을 건너뜁니다. " +
        "APPLE_KEYCHAIN_PROFILE 또는 APPLE_ID/APPLE_APP_SPECIFIC_PASSWORD/APPLE_TEAM_ID를 설정하세요."
    );
    return;
  }

  const ymls = artifacts.filter((p) => p.endsWith("latest-mac.yml"));

  for (const dmg of dmgs) {
    console.log(`[notarize-dmg] notarytool 제출: ${dmg}`);
    run(["notarytool", "submit", dmg, ...authArgs, "--wait"]);
    console.log(`[notarize-dmg] stapler staple: ${dmg}`);
    run(["stapler", "staple", dmg]);
    for (const yml of ymls) updateLatestYml(yml, dmg);
  }
};
