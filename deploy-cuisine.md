# Deploy Cuisine de Chez Nous

Run these commands in sequence to deploy to production:

## 1. Sync code
```bash
rsync -avz --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.env.local' \
  /Users/omardoucoure/Documents/cuisinedecheznous/Web/ \
  root@159.223.103.16:/mnt/volume_nyc1_01/nextjs-apps/cuisine-de-chez-nous/
```

## 2. Build on server
```bash
ssh root@159.223.103.16 "cd /mnt/volume_nyc1_01/nextjs-apps/cuisine-de-chez-nous && npm run build"
```

## 3. Restart PM2
```bash
ssh root@159.223.103.16 "pm2 restart cuisine-de-chez-nous"
```

## 4. Verify deployment
```bash
ssh root@159.223.103.16 "pm2 logs cuisine-de-chez-nous --lines 20 --nostream"
```

Look for "Ready in Xms" to confirm success.
