# Deployment Configuration

## Zmienne środowiskowe (NSSM / Windows Service)

Poniższe zmienne należy ustawić w NSSM w zakładce **Environment** (każda w osobnej linii) lub przez `nssm set NazwaUslugi AppEnvironmentExtra`.

```
NUXT_PUBLIC_IS_DATA_MOCKED=false
NUXT_PUBLIC_SCOPE=enterprise
NUXT_PUBLIC_GITHUB_ORG=
NUXT_PUBLIC_GITHUB_ENT=pekaocopilot
NUXT_PUBLIC_GITHUB_TEAM=
NUXT_PUBLIC_USING_GITHUB_AUTH=false
NUXT_GITHUB_TOKEN=<twój_token>
NUXT_SESSION_PASSWORD=<min_32_znaki_np_ReportCopilot2025-PekaoBank-SecretKey!!>
NUXT_OAUTH_GITHUB_CLIENT_ID=
NUXT_OAUTH_GITHUB_CLIENT_SECRET=
USE_LEGACY_API=false
NUXT_PUBLIC_ENABLE_HISTORICAL_MODE=true
ENABLE_HISTORICAL_MODE=true
DATABASE_URL=postgresql://metrics_user:<haslo>@<host>:5432/metrics_db
SYNC_ENABLED=true
SYNC_SCHEDULE=0 2 * * *
```

## Import bazy danych

Plik `metrics_backup.sql` zawiera dane historyczne od **2025-10-08** do **2026-04-09**.

### Wymagania
- PostgreSQL zainstalowany i uruchomiony
- Baza i użytkownik utworzone
- Tabele utworzone (uruchom aplikację raz przed importem — tabele tworzone są automatycznie)

### Kroki

**1. Utwórz bazę i użytkownika (jeśli nie istnieją):**
```bash
psql postgres -c "CREATE USER metrics_user WITH PASSWORD 'metrics_password';"
psql postgres -c "CREATE DATABASE metrics_db OWNER metrics_user;"
```

**2. Uruchom aplikację raz** aby utworzyć tabele, następnie zatrzymaj.

**3. Pobierz backup:**
```bash
curl -O https://raw.githubusercontent.com/MariuszGrygoruk/ReportMetricCopilot/main/metrics_backup.sql
```

**4. Importuj dane:**
```bash
psql postgresql://metrics_user:metrics_password@localhost:5432/metrics_db < metrics_backup.sql
```

Jeśli baza już zawiera dane (błąd duplikatu), najpierw wyczyść tabele:
```bash
psql postgresql://metrics_user:metrics_password@localhost:5432/metrics_db -c "TRUNCATE metrics, sync_status, user_metrics, seats RESTART IDENTITY CASCADE;"
psql postgresql://metrics_user:metrics_password@localhost:5432/metrics_db < metrics_backup.sql
```

**5. Uruchom aplikację** — dane będą dostępne od razu.

## Automatyczna synchronizacja

Przy ustawieniu `SYNC_ENABLED=true` aplikacja automatycznie pobiera dane z poprzedniego dnia codziennie o 2:00 w nocy (zgodnie z `SYNC_SCHEDULE`).

## Ręczny backfill

Jeśli potrzebujesz uzupełnić dane za konkretny zakres dat, uruchom z katalogu aplikacji (Git Bash):

```bash
TOKEN=<twój_token>
BASE="http://localhost:3000/api/admin/sync"
PARAMS="scope=enterprise&githubEnt=pekaocopilot"

for chunk in "2025-10-08 2025-11-06" "2025-11-07 2025-12-06" "2025-12-07 2026-01-05" "2026-01-06 2026-02-04" "2026-02-05 2026-03-06" "2026-03-07 2026-04-09"; do
  since=$(echo $chunk | awk '{print $1}')
  until=$(echo $chunk | awk '{print $2}')
  echo -n "=== $since → $until: "
  curl -s -X POST "$BASE?action=sync-range&$PARAMS&since=$since&until=$until" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    | grep -o '"successCount":[0-9]*\|"failureCount":[0-9]*\|"totalDays":[0-9]*' | tr '\n' ' '
  echo ""
done
```

> **Uwaga:** Najwcześniejsza dostępna data w GitHub API dla tego enterprise to **2025-10-08**.
