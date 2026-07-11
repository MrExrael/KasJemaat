/**
 * Tipe database Supabase (placeholder).
 *
 * Skema tabel (profiles, departments, cash_types, transactions,
 * weekly_reports, audit_log) akan didefinisikan pada fase migrasi.
 * Disarankan meng-generate ulang tipe ini via:
 *   supabase gen types typescript --project-id <ref> > src/types/database.ts
 */
export type Database = Record<string, never>;
