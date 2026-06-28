# CareerBridge Administration Control Console Manual

This guide documents operations for admin accounts managing system setups, feature flags, audit logs, and diagnostic dashboards.

---

## 1. Feature Flag Management

Administrators can toggle system settings through REST endpoints or admin panels. Changes persist in local JSON config files surviving restarts.

- `enableAI`: Controls access to resume match calculations.
- `enableMessaging`: Toggles live messaging gateways.

---

## 2. Audit Trail Console

Every administrative action creates a detailed snapshot inside the database `AuditLog` table capturing:
- Requesting Admin ID.
- IP Address & Timestamp.
- Before/After state schema maps.

---

## 3. Operational System Diagnostics Monitor

The health status aggregator computes:
- PostgreSQL status checks (`SELECT 1`).
- Upstash Redis status fallbacks.
- Average AI query processing latencies and cache hits lookups.
- API latencies and server error logs rate metrics.
