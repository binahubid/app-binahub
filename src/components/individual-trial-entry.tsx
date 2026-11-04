"use client";
import Link from 'next/link';
import { PermissionGate, type AppRole } from './admin-auth-gate';
const roles: AppRole[] = ['admin'];
export function IndividualTrialEntry() {
  return <PermissionGate allowedRoles={roles}><p className="mt-6 text-sm leading-7 text-[#0B2C6B]">Akses admin: <Link href="/admin/assessments/individual/trial" className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">Uji coba paket PE & RM dengan simulasi pembayaran</Link></p></PermissionGate>;
}
