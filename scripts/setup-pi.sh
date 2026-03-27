#!/bin/bash
# Run once to prepare the Pi for deployments.
# After this completes you'll never need to enter the Pi password again.
set -e

# Load .env
export $(grep -v '^#' "$(dirname "$0")/../.env" | grep -E '^PI_' | xargs)

PI="${PI_USER}@${PI_HOST}"

echo "==> Setting up SSH key auth with Pi at ${PI_HOST}..."
if [ ! -f ~/.ssh/id_ed25519 ]; then
  echo "    Generating SSH key..."
  ssh-keygen -t ed25519 -C "artele-deploy" -N "" -f ~/.ssh/id_ed25519
fi
echo "    Copying public key to Pi (you'll be prompted for the Pi password once)..."
ssh-copy-id -i ~/.ssh/id_ed25519.pub ${PI}
echo "    SSH key installed."

echo ""
echo "==> Installing Node.js v20 on Pi..."
ssh ${PI} << 'REMOTE'
  if node --version 2>/dev/null | grep -q "v20"; then
    echo "    Node v20 already installed."
  else
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
  fi
  node --version
REMOTE

echo ""
echo "==> Installing pm2 on Pi..."
ssh ${PI} "sudo npm install -g pm2 2>/dev/null || true && pm2 --version"

echo ""
echo "==> Configuring pm2 to start on boot..."
ssh ${PI} "pm2 startup systemd -u pi --hp /home/pi | tail -1 | sudo bash || true"

echo ""
echo "==> Creating app directory on Pi..."
ssh ${PI} "mkdir -p ~/artele/server/data"

echo ""
echo "✓ Pi setup complete. Run 'yarn deploy' to deploy the app."
