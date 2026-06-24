# scripts/build_vsix.sh
#!/usr/bin/env bash





set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
VERSION="$(node -p "require('${ROOT_DIR}/package.json').version")"
DIST_DIR="${ROOT_DIR}/dist"

mkdir -p "${DIST_DIR}"

cd "${ROOT_DIR}"
npm install

npx @vscode/vsce package --out "${DIST_DIR}/utree-codehelper-${VERSION}.vsix"

echo "[OK] build complete  ->  dist/utree-codehelper-${VERSION}.vsix"