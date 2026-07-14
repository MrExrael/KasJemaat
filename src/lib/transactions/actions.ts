"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  transactionSchema,
  type ActionResult,
  type CreateResult,
  type TransactionFormValues,
  type TxType,
} from "@/lib/validators/transaction";

function pathFor(type: TxType): string {
  return type === "income" ? "/pemasukan" : "/pengeluaran";
}

function mapDbError(error: { code?: string; message?: string }): string {
  if (error.code === "23514") return "Nilai tidak valid (periksa jumlah).";
  if (error.code === "23503") return "Departemen atau jenis kas tidak valid.";
  if (
    error.code === "42501" ||
    error.message?.toLowerCase().includes("row-level security")
  ) {
    return "Anda tidak punya izin untuk aksi ini.";
  }
  return "Gagal menyimpan. Coba lagi.";
}

export async function createTransaction(
  type: TxType,
  raw: TransactionFormValues,
): Promise<CreateResult> {
  const parsed = transactionSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak valid." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Silakan masuk lagi." };

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      type,
      date: parsed.data.date,
      department_id: parsed.data.department_id,
      cash_type_id: parsed.data.cash_type_id,
      category: parsed.data.category,
      description: parsed.data.description,
      amount: parsed.data.amount,
      created_by: user.id,
      status: "draft",
    })
    .select("id")
    .single();
  if (error || !data) {
    return { ok: false, error: error ? mapDbError(error) : "Gagal menyimpan." };
  }

  revalidatePath(pathFor(type));
  return { ok: true, id: data.id };
}

/**
 * Set/hapus path bukti pada transaksi. Otorisasi via RLS
 * (petugas hanya miliknya & draft; staff non-approved; approved terkunci).
 */
export async function setTransactionProof(
  id: string,
  type: TxType,
  path: string | null,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Data tidak valid." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({ proof_url: path })
    .eq("id", id);
  if (error) return { ok: false, error: mapDbError(error) };

  revalidatePath(pathFor(type));
  return { ok: true };
}

export async function updateTransaction(
  id: string,
  type: TxType,
  raw: TransactionFormValues,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Data tidak valid." };

  const parsed = transactionSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak valid." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({
      date: parsed.data.date,
      department_id: parsed.data.department_id,
      cash_type_id: parsed.data.cash_type_id,
      category: parsed.data.category,
      description: parsed.data.description,
      amount: parsed.data.amount,
    })
    .eq("id", id);
  if (error) return { ok: false, error: mapDbError(error) };

  revalidatePath(pathFor(type));
  return { ok: true };
}

export async function deleteTransaction(
  id: string,
  type: TxType,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Data tidak valid." };

  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return { ok: false, error: mapDbError(error) };

  revalidatePath(pathFor(type));
  return { ok: true };
}
