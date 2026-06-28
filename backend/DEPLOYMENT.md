# CareerBridge Production Deployment & Incident Response Guide

This document maps variables configurations, rollout steps, database backup mechanisms, and rollback disaster recovery steps.

---

## 1. Environment Configuration

The following variables must be defined on Neon and Railway hosting dashboards:

| Parameter Name | Target Format | Key Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...` | Connection String for Neon Database |
| `REDIS_URL` | `redis://...` | Connection String for Upstash Redis |
| `JWT_ACCESS_SECRET` | String | JWT access verification key |
| `CLOUDINARY_URL` | `cloudinary://...` | Cloudinary Storage credentials |

---

## 2. Automated Rollout Pipeline

Always promote updates following this lifecycle sequence:

1. **Deploy Backend Build** ➔ Push backend bundle to Railway/Render.
2. **Execute Database Migrations** ➔ Run `npx prisma migrate deploy`.
3. **Execute Smoke Tests (Staging)** ➔ Run `npx ts-node src/tests/smoke.ts`.
4. **Deploy Frontend Build** ➔ Push React client bundle to Vercel.
5. **Re-Run Frontend Smoke Tests** ➔ Validate route health and sockets handshakes.
6. **Mark Release Completed** ➔ Register deployment completion.

---

## 3. Disaster Recovery & Rollback Guide

If a staging/production rollout fails any assertion checkpoints:

### Immediate Rollback
1. Stop the active release rollout process on the hosting provider dashboard.
2. Revert the repository head to the last known healthy commit hash.
3. Promote the reverted build to redeploy the previous container.

### Database Recovery
To restore a snapshot in the Neon database:
1. Navigate to the Neon Console, choose the target database project, and click **Branches**.
2. Select **Restore to Point in Time** and select the timestamp before the deployment occurred.
3. Restore tables configuration and run verification checks: `npx ts-node src/tests/smoke.ts`.
