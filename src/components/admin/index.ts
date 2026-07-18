// Admin data-view primitive library — barrel export.
//
// Specialized primitives for the platform admin console's dense data views
// (audit logs, sessions & devices, support-ticket triage). These provide
// server-paginated tables, a log viewer, filter bars and confirm dialogs —
// capabilities not present in the shared `ui/` set — while composing the same
// design tokens and reusing `ui/Button` + `ui/Modal` underneath, so the admin
// console reads as one product with the rest of the platform.

export { Badge } from './Badge';

export { AdminDataTable } from './table/AdminDataTable';
export type { AdminTableColumn } from './table/AdminDataTable';
export { AdminPagination } from './table/AdminPagination';
export { FilterBar } from './FilterBar';
export type { FilterDef, FilterOption } from './FilterBar';

export { AdminDialog } from './AdminDialog';
export { LogsViewer } from './LogsViewer';
export type { AuditLogRow } from './LogsViewer';
