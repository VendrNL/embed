#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOTNET_DIR="$REPO_ROOT/.dotnet"
DOTNET_BIN="$DOTNET_DIR/dotnet"
INSTALL_SCRIPT="$DOTNET_DIR/dotnet-install.sh"
SDK_VERSION="${DOTNET_SDK_VERSION:-}"
SDK_CHANNEL="${DOTNET_SDK_CHANNEL:-8.0}"

ensure_dotnet() {
  if [ -x "$DOTNET_BIN" ]; then
    return
  fi

  mkdir -p "$DOTNET_DIR"
  if [ ! -f "$INSTALL_SCRIPT" ]; then
    curl -sSL https://dot.net/v1/dotnet-install.sh -o "$INSTALL_SCRIPT"
    chmod +x "$INSTALL_SCRIPT"
  fi

  if [ -n "$SDK_VERSION" ]; then
    "$INSTALL_SCRIPT" --version "$SDK_VERSION" --install-dir "$DOTNET_DIR" --no-path
  else
    "$INSTALL_SCRIPT" --channel "$SDK_CHANNEL" --install-dir "$DOTNET_DIR" --no-path
  fi
}

ensure_dotnet
exec "$DOTNET_BIN" "$@"
