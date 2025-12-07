# 🚀 TubeTime Deployment Guide

This guide covers deploying TubeTime using Docker to any VPS or home server.

---

## Prerequisites

- **Docker** 20.10+ and **Docker Compose** v2+
- A server with at least 1GB RAM
- (Optional) A domain name for HTTPS

---

## Quick Start

### 1. Clone and Configure

```bash
git clone https://github.com/yourusername/tubetime.git
cd tubetime

# Create production environment file
cp .env.example .env.prod
```

Edit `.env.prod`:

```env
JWT_SECRET=your_secure_random_string_here_min_32_chars
```

> ⚠️ **Generate a secure secret:** `openssl rand -base64 32`

### 2. Build and Start

```bash
# Build production images
docker compose -f docker-compose.prod.yml build

# Start in detached mode
docker compose -f docker-compose.prod.yml up -d
```

### 3. Initialize Database

```bash
# First-time setup: apply migrations
docker compose -f docker-compose.prod.yml exec backend \
    npx drizzle-kit migrate

# (Optional) Seed with test data
docker compose -f docker-compose.prod.yml exec backend \
    npx tsx seed.js
```

### 4. Access the Application

- **App:** http://your-server-ip:8080
- **Default login:** `testuser` / `test123`

---

## VPS Deployment (DigitalOcean, Hetzner, Linode)

### Step 1: Provision Server

Create a VPS with:
- **OS:** Ubuntu 22.04 LTS
- **Plan:** 1GB RAM minimum (2GB recommended)
- **SSH:** Add your SSH key

### Step 2: Install Docker

```bash
# Connect to your server
ssh root@your-server-ip

# Install Docker
curl -fsSL https://get.docker.com | sh

# Add your user to docker group (if not root)
usermod -aG docker $USER
```

### Step 3: Deploy

```bash
# Clone repository
git clone https://github.com/yourusername/tubetime.git
cd tubetime

# Configure environment
cp .env.example .env.prod
nano .env.prod  # Edit JWT_SECRET

# Build and start
docker compose -f docker-compose.prod.yml up -d --build
```

---

## HTTPS with Caddy (Recommended)

Caddy provides automatic HTTPS with Let's Encrypt.

### 1. Install Caddy

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

### 2. Configure Caddyfile

Create `/etc/caddy/Caddyfile`:

```
tubetime.yourdomain.com {
    reverse_proxy localhost:8080
}
```

### 3. Start Caddy

```bash
sudo systemctl restart caddy
```

That's it! Caddy automatically obtains and renews SSL certificates.

---

## Alternative: Traefik (Docker-native)

Create `docker-compose.traefik.yml`:

```yaml
services:
  traefik:
    image: traefik:v3.0
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.email=your@email.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./letsencrypt:/letsencrypt

  frontend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.tubetime.rule=Host(`tubetime.yourdomain.com`)"
      - "traefik.http.routers.tubetime.entrypoints=websecure"
      - "traefik.http.routers.tubetime.tls.certresolver=letsencrypt"
```

---

## Common Operations

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Backend only
docker compose -f docker-compose.prod.yml logs -f backend

# Frontend only
docker compose -f docker-compose.prod.yml logs -f frontend
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build
```

### Backup Database

```bash
# Create backup
docker compose -f docker-compose.prod.yml exec backend \
    cp /data/tubetime.db /data/backup-$(date +%Y%m%d).db

# Copy backup to host
docker cp tubetime-backend:/data/backup-*.db ./backups/
```

### Restore Database

```bash
# Copy backup to container
docker cp ./backup.db tubetime-backend:/data/tubetime.db

# Restart backend
docker compose -f docker-compose.prod.yml restart backend
```

### Reset to Clean State

```bash
# Stop and remove everything
docker compose -f docker-compose.prod.yml down -v

# Rebuild and start fresh
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | *required* | Secret for session encryption (32+ chars) |
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `3000` | Backend internal port |
| `DATABASE_URL` | `/data/tubetime.db` | SQLite database path |
| `FRONTEND_URL` | `http://localhost:8080` | Frontend URL for CORS |

---

## Troubleshooting

### Container won't start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs backend

# Verify health
docker compose -f docker-compose.prod.yml ps
```

### Database errors

```bash
# Ensure migrations ran
docker compose -f docker-compose.prod.yml exec backend \
    npx drizzle-kit migrate
```

### yt-dlp errors

```bash
# Update yt-dlp inside container
docker compose -f docker-compose.prod.yml exec backend \
    /venv/bin/pip install --upgrade yt-dlp
```

### Port conflicts

Change the port mapping in `docker-compose.prod.yml`:

```yaml
frontend:
  ports:
    - "3080:8080"  # Use 3080 instead
```

---

## Security Recommendations

1. **Change default credentials** immediately after deployment
2. **Use HTTPS** in production (Caddy or Traefik)
3. **Set a strong JWT_SECRET** (32+ random characters)
4. **Keep Docker updated** for security patches
5. **Use firewall** (ufw) to only allow ports 80, 443, and SSH

```bash
# Basic firewall setup
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## Architecture Overview

```
                    ┌─────────────────┐
                    │     Client      │
                    │   (Browser)     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Caddy/Traefik  │
                    │  (HTTPS:443)    │
                    └────────┬────────┘
                             │
         ┌───────────────────┴───────────────────┐
         │                                       │
┌────────▼────────┐                    ┌────────▼────────┐
│    Frontend     │                    │    Backend      │
│  (nginx:8080)   │──── /api/* ───────▶│  (node:3000)    │
│  Static Files   │──── /socket.io/ ──▶│  API + Socket   │
└─────────────────┘                    └────────┬────────┘
                                                │
                                       ┌────────▼────────┐
                                       │     SQLite      │
                                       │  (volume:data)  │
                                       └─────────────────┘
```

---


---

## Cloud Deployment: Fly.io (Free Tier Friendly)

This guide uses a single-container approach to minimize costs (1 VM, 1 Volume).

### 1. Setup

The project includes specialized configuration files:
- `fly.toml`: Configures the app and persistent storage.
- `Dockerfile.fly`: Builds frontend and backend into a single image.

### 2. Deploy

```bash
# First time setup (requires Fly CLI installed)
fly launch --no-deploy --copy-config

# Deploy the application
fly deploy
```

### 3. Initialize Database (First Run Only)

Since the persistent volume starts empty, you must run migrations manually via SSH:

```bash
# Create database tables
fly ssh console -C "npx drizzle-kit push:sqlite"

# (Optional) Seed initial data
fly ssh console -C "npx tsx seed.js"
```

### 4. Updates

To update your application after code changes (including standard cleanup):

```bash
fly deploy
```

