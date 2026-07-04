# Insights Discovery Profiler

## Lokalni razvoj

```bash
npm install
npm run build
node server.cjs
```

Odpri http://localhost:3131/launcher

## Railway Deployment

1. Pushaš na GitHub
2. Poveži GitHub repo z Railway
3. Nastavi environment variable:
   - `ANTHROPIC_API_KEY` = tvoj Anthropic API ključ
   - `ADMIN_PASSWORD` = geslo za admin panel (opcijsko, default: insights2024)
4. Railway samodejno zažene `npm run build && node server.cjs`

## URLs
- `/launcher` - izbira načina
- `/admin` - admin panel (geslo zaščiten)
- `/oddaj` - vprašalnik za stranke
- `/` - direktni profiler
