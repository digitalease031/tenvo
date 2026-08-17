# 🚀 TENVO — Ultra Low-Cost AWS Startup Deployment Guide ($3.50 - $10 / month)

This guide provides step-by-step instructions to deploy TENVO on **AWS Lightsail or EC2** for **$3.50 – $10 / month**, connect your **GoDaddy domain**, configure **free wildcard SSL certificates**, and link your **GitHub Actions CI/CD pipeline**.

---

## 1. Create AWS Server (Lightsail or EC2)

### Option A: AWS Lightsail (Easiest & Fixed $3.50 – $5 / month)
1. Log into [AWS Console](https://console.aws.amazon.com/) → Search **Lightsail**.
2. Click **Create instance** → Choose **Linux/Unix** → **OS Only** → **Ubuntu 24.04 LTS**.
3. Select plan size:
   - **$3.50/month** (512 MB RAM, 1 vCPU, 20 GB SSD) — Suitable for initial testing & up to 50 active users.
   - **$5.00/month** (1 GB RAM, 1 vCPU, 40 GB SSD) — **Recommended for Launch** (supports 150+ active users).
4. Identify instance name (e.g. `tenvo-prod`) and click **Create instance**.
5. Go to **Networking** tab → Click **Create static IP** → Attach to `tenvo-prod` (ensures your IP never changes).
6. Under **IPv4 Firewall**, open ports:
   - Port 80 (HTTP)
   - Port 443 (HTTPS)
   - Port 22 (SSH)

---

## 2. Connect GoDaddy Domain

In GoDaddy Domain Control Center (DNS Management for your domain, e.g. `yourdomain.com`):

1. Add **A Record**:
   - **Name**: `@`
   - **Value**: `<YOUR_AWS_STATIC_IP>`
   - **TTL**: 600 seconds
2. Add **CNAME Record**:
   - **Name**: `www`
   - **Value**: `yourdomain.com`
   - **TTL**: 600 seconds
3. Add **Wildcard A Record** (Crucial for tenant subdomains):
   - **Name**: `*`
   - **Value**: `<YOUR_AWS_STATIC_IP>`
   - **TTL**: 600 seconds

---

## 3. Initial AWS Server Setup (One-Time)

Connect to your AWS server via SSH (`ssh ubuntu@<YOUR_AWS_STATIC_IP>`) and run:

```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install Docker & Nginx & Certbot
sudo apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx git

# 3. Enable Docker for ubuntu user
sudo usermod -aG docker ubuntu
sudo systemctl enable --now docker

# 4. Clone repository
cd /home/ubuntu
git clone https://github.com/YOUR_ORGANIZATION/tenvo-main.git
cd tenvo-main

# 5. Create production environment file
cp .env.example .env.production
nano .env.production
```

### Fill Environment Variables in `.env.production`:
- `DATABASE_URL`: Your PostgreSQL connection string (Neon / Supabase Free Tier or Managed DB).
- `DIRECT_URL`: Direct PostgreSQL connection string.
- `NEXT_PUBLIC_APP_URL`: `https://yourdomain.com`
- `BETTER_AUTH_SECRET`: Random 32+ character string (generate with `openssl rand -hex 32`).
- `BETTER_AUTH_URL`: `https://yourdomain.com`
- `RESEND_API_KEY`: Your Resend key.
- `CRON_SECRET`: Secret token for scheduled outreach/memberships.

---

## 4. Configure Nginx Reverse Proxy & Wildcard SSL

On the AWS server, create `/etc/nginx/sites-available/tenvo`:

```nginx
server {
    listen 80;
    server_name yourdomain.com *.yourdomain.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the configuration and obtain free SSL certificates:

```bash
sudo ln -s /etc/nginx/sites-available/tenvo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Issue free SSL certificate via Certbot
sudo certbot --nginx -d yourdomain.com -d *.yourdomain.com
```

---

## 5. First Manual App Launch

```bash
cd /home/ubuntu/tenvo-main

# Build standalone Docker container
docker build -t tenvo-app:latest .

# Run DB migrations
npx prisma migrate deploy

# Launch container
docker run -d \
  --name tenvo \
  --restart always \
  -p 3000:3000 \
  --env-file .env.production \
  tenvo-app:latest
```

Verify application is active: `curl http://localhost:3000/api/health` or visit `https://yourdomain.com` in your browser!

---

## 6. GitHub Actions CI/CD Pipeline Setup

In your GitHub Repository → **Settings** → **Secrets and variables** → **Actions**, add:

1. `AWS_SERVER_IP`: Your AWS Static IP (e.g. `54.x.x.x`).
2. `AWS_SSH_PRIVATE_KEY`: Content of your private SSH key (`~/.ssh/id_rsa`).

Now, every `git push origin main` will automatically run unit tests, validate Prisma schemas, build the Docker container, run database migrations, and deploy zero-downtime updates to your AWS server!
