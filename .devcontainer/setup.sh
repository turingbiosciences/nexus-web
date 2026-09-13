#!/bin/bash
set -e

echo "Installing Claude Code..."
curl -fsSL https://claude.ai/install.sh | bash

# Make sure the install location is on PATH for future shells in this Codespace
if ! grep -q '.local/bin' ~/.bashrc; then
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
fi

echo "Claude Code install complete. Run 'claude' from any project folder to start."
