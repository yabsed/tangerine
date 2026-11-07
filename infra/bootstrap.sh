#!/bin/sh
set -eu

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y docker.io docker-compose-v2
systemctl enable --now docker
usermod -aG docker ubuntu

install -d -m 700 -o ubuntu -g ubuntu /opt/dangeun

if ! swapon --show=NAME --noheadings | grep -q .; then
    fallocate -l 1G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

cat > /etc/docker/daemon.json <<'JSON'
{
  "log-driver": "local",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
JSON

systemctl restart docker

cat > /etc/cron.d/dangeun-backup <<'CRON'
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
15 17 * * * ubuntu test ! -f /opt/dangeun/current-image || bash /opt/dangeun/backup.sh >> /opt/dangeun/backup.log 2>&1
CRON
chmod 644 /etc/cron.d/dangeun-backup
