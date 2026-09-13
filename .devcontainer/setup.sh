#!/bin/bash
set -e

echo "Installing Claude Code..."
# --proto/--proto-redir pin the transport to HTTPS for the request and for any
# redirect it follows, so the piped-to-bash payload cannot be served over plain
# HTTP. --tlsv1.2 rules out downgraded TLS.
curl --proto '=https' --proto-redir '=https' --tlsv1.2 -fsSL \
  https://claude.ai/install.sh | bash

# Make sure the install location is on PATH for future shells in this Codespace
if ! grep -q '.local/bin' ~/.bashrc; then
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
fi

echo "Claude Code install complete. Run 'claude' from any project folder to start."
