"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, LogOut, Menu, RefreshCw, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { AssessmentPanel } from "./_components/assessment-panel";
import { AcquisitionControlPanel } from "./_components/acquisition-control-panel";
import { BusinessRulesPanel } from "./_components/business-rules-panel";
import { ContactsPanel } from "./_components/contacts-panel";
import { InquiriesPanel } from "./_components/inquiries-panel";
import { MeetingsPanel } from "./_components/meetings-panel";
import { Overview } from "./_components/overview";
import { PipelinePanel } from "./_components/pipeline-panel";
import { ClientDeliveryPanel } from "./_components/client-delivery-panel";
import { OperationsControlPanel } from "./_components/operations-control-panel";
import { SmartCenterPanel } from "./_components/smart-center-panel";
import { DashboardSkeleton, NotificationBadge } from "./_components/shared";
import { TAB_META, tabs } from "./_lib/constants";
import type { DashboardData } from "./_lib/types";

type AdminTab = (typeof tabs)[number];

const ADMIN_TAB_LABELS: Partial<Record<AdminTab, string>> = {
  Overview: "Ringkasan",
  "Acquisition Control": "Kontrol Akuisisi",
  "Sales Pipeline": "Pipeline Penjualan",
  Assessment: "Assessment",
  Meeting: "Konsultasi",
  "Client & Delivery": "Klien & Pelaksanaan",
  "Operations Control": "Kontrol Operasional",
  "Automation Center": "Pusat Otomasi",
  "Katalog & Rules": "Katalog & Aturan",
};

const tabLabel = (tab: AdminTab) => ADMIN_TAB_LABELS[tab] || tab;

const ADMIN_TAB_GROUPS = [
  { id: "overview", label: "Ringkasan", tabs: ["Overview"] },
  {
    id: "growth",
    label: "Akuisisi & Penjualan",
    tabs: ["Acquisition Control", "Sales Pipeline", "Assessment", "Meeting", "Kontak & Leads", "Inquiry Masuk"],
  },
  {
    id: "delivery",
    label: "Delivery & Otomasi",
    tabs: ["Client & Delivery", "Operations Control", "Automation Center", "Katalog & Rules"],
  },
  { id: "modules", label: "Modul", tabs: ["T-BOS"] },
] satisfies ReadonlyArray<{ id: string; label: string; tabs: readonly AdminTab[] }>;

const ADMIN_LINK_GROUPS = [
  {
    id: "governance",
    label: "Manajemen & Tata Kelola",
    links: [
      { href: "/admin/users", label: "Pengguna & Peran" },
      { href: "/admin/engagements", label: "Program" },
      { href: "/admin/rbac", label: "Izin Akses" },
    ],
  },
  {
    id: "field-operations",
    label: "Operasional Lapangan",
    links: [
      { href: "/fasilitator/tbos/observations", label: "Kelola & Kunci Observasi" },
      { href: "/fasilitator/tbos", label: "Form Input Observasi" },
      { href: "/admin/lep", label: "Kelola Evaluasi LEP" },
      { href: "/peserta/dashboard", label: "Dashboard Peserta" },
    ],
  },
] as const;

function MobileAdminMenu({
  activeTab,
  onTabChange,
  newAssessmentCount,
  newInquiryCount,
}: {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  newAssessmentCount: number;
  newInquiryCount: number;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => closeRef.current?.focus(), 0);

    const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const elements = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open]);

  const selectTab = (tab: AdminTab) => {
    onTabChange(tab);
    setOpen(false);
  };

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex min-h-11 max-w-[15rem] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-xs"
      >
        <Menu size={15} aria-hidden="true" />
        <span className="truncate">Menu: {tabLabel(activeTab)}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] bg-[#071B3D]/55 backdrop-blur-sm">
          <button type="button" onClick={() => setOpen(false)} aria-label="Tutup menu admin" className="absolute inset-0 cursor-default" />
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="mobile-admin-menu-title" className="absolute inset-y-0 right-0 flex w-[min(22rem,calc(100%-2rem))] flex-col bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C79A3C]">Admin workspace</p>
                <h2 id="mobile-admin-menu-title" className="mt-1 text-lg font-bold text-slate-900">Pilih area kerja</h2>
              </div>
              <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Tutup menu admin" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5" aria-label="Menu area kerja admin">
              {ADMIN_TAB_GROUPS.map((group) => (
                <section key={group.id} aria-labelledby={`mobile-admin-group-${group.id}`}>
                  <h3 id={`mobile-admin-group-${group.id}`} className="px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{group.label}</h3>
                  <div className="mt-2 space-y-1">
                    {group.tabs.map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => selectTab(tab)}
                        aria-pressed={activeTab === tab}
                        className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-semibold transition-colors ${activeTab === tab ? "bg-[#0B2C6B] text-white" : "text-slate-700 hover:bg-slate-100"}`}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate">{tabLabel(tab)}</span>
                          {tab === "Assessment" && newAssessmentCount > 0 && <NotificationBadge count={newAssessmentCount} />}
                          {tab === "Inquiry Masuk" && newInquiryCount > 0 && <NotificationBadge count={newInquiryCount} />}
                        </span>
                        {activeTab === tab && <ArrowRight size={15} className="shrink-0 text-[#D9A441]" aria-hidden="true" />}
                      </button>
                    ))}
                  </div>
                </section>
              ))}

              {ADMIN_LINK_GROUPS.map((group) => (
                <section key={group.id} aria-labelledby={`mobile-admin-group-${group.id}`}>
                  <h3 id={`mobile-admin-group-${group.id}`} className="px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{group.label}</h3>
                  <div className="mt-2 space-y-1">
                    {group.links.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminAuthGate>
      <AdminDashboardContent />
    </AdminAuthGate>
  );
}

function AdminDashboardContent() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminName, setAdminName] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("Overview");
  const [openSidebarGroups, setOpenSidebarGroups] = useState<Set<string>>(() => new Set(["overview"]));
  const [query, setQuery] = useState("");
  const [assessmentCategory, setAssessmentCategory] = useState("Semua");
  const [assessmentEmployeeRange, setAssessmentEmployeeRange] = useState("Semua");
  const [assessmentMinScore, setAssessmentMinScore] = useState("0");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [seenState, setSeenState] = useState({ assessment: "", inquiries: "" });

  const handleTabChange = (tab: AdminTab) => {
    if (tab === "T-BOS") {
      router.push("/admin/tbos");
      return;
    }
    const targetGroup = ADMIN_TAB_GROUPS.find((group) => group.tabs.some((item) => item === tab));
    if (targetGroup) {
      setOpenSidebarGroups((current) => {
        if (current.has(targetGroup.id)) return current;
        const next = new Set(current);
        next.add(targetGroup.id);
        return next;
      });
    }
    setActiveTab(tab);
  };

  const toggleSidebarGroup = (groupId: string) => {
    setOpenSidebarGroups((current) => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json().catch(() => null);

      if (!response.ok || !json?.success) {
        if (response.status === 401 || response.status === 403) {
          router.replace(response.status === 401 ? "/login" : "/access-denied");
        }
        throw new Error(json?.error || "Gagal memuat dashboard admin.");
      }

      setData(json as DashboardData);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Gagal memuat dashboard admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => fetchDashboard());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;
        if (!session) return;
        const email = session.user?.email || "";
        const res = await fetch("/api/auth/role", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const payload = await res.json();
        if (!active || !res.ok || !payload.success) return;
        const name = payload.fullName || session.user?.user_metadata?.full_name || email.split("@")[0];
        setAdminName(name);
      } catch {
        // Greeting is non-critical; dashboard still renders without it.
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const storedSeen = {
      assessment: localStorage.getItem("binahub_admin_seen_assessment") || "",
      inquiries: localStorage.getItem("binahub_admin_seen_inquiries") || "",
    };
    void Promise.resolve().then(() => setSeenState(storedSeen));
  }, []);

  useEffect(() => {
    if (!data) return;
    const nextSeen: Partial<typeof seenState> = {};

    if (!localStorage.getItem("binahub_admin_seen_assessment")) {
      const latest = data.assessments[0]?.createdAt || new Date().toISOString();
      localStorage.setItem("binahub_admin_seen_assessment", latest);
      nextSeen.assessment = latest;
    }

    if (!localStorage.getItem("binahub_admin_seen_inquiries")) {
      const latest = data.inquiries[0]?.createdAt || new Date().toISOString();
      localStorage.setItem("binahub_admin_seen_inquiries", latest);
      nextSeen.inquiries = latest;
    }

    if (activeTab === "Assessment") {
      const latest = data.assessments[0]?.createdAt || new Date().toISOString();
      localStorage.setItem("binahub_admin_seen_assessment", latest);
      nextSeen.assessment = latest;
    }

    if (activeTab === "Inquiry Masuk") {
      const latest = data.inquiries[0]?.createdAt || new Date().toISOString();
      localStorage.setItem("binahub_admin_seen_inquiries", latest);
      nextSeen.inquiries = latest;
    }

    if (Object.keys(nextSeen).length) {
      void Promise.resolve().then(() => setSeenState((current) => ({ ...current, ...nextSeen })));
    }
  }, [activeTab, data]);

  const filteredAssessments = useMemo(() => {
    const search = query.toLowerCase();
    return (data?.assessments || []).filter((item) =>
      [item.name, item.email, item.company, item.role, item.category, item.assessmentStatus, item.proposalStatus]
        .join(" ")
        .toLowerCase()
        .includes(search) &&
      (assessmentCategory === "Semua" || item.category === assessmentCategory) &&
      (assessmentEmployeeRange === "Semua" || item.employees === assessmentEmployeeRange) &&
      item.overallScore >= Number(assessmentMinScore || 0)
    );
  }, [assessmentCategory, assessmentEmployeeRange, assessmentMinScore, data, query]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const newAssessmentCount = useMemo(() => {
    if (!data || !seenState.assessment) return data?.assessments.length || 0;
    const seenTime = new Date(seenState.assessment).getTime();
    return data.assessments.filter((item) => new Date(item.createdAt).getTime() > seenTime).length;
  }, [data, seenState.assessment]);

  const newInquiryCount = useMemo(() => {
    if (!data || !seenState.inquiries) return data?.inquiries.length || 0;
    const seenTime = new Date(seenState.inquiries).getTime();
    return data.inquiries.filter((item) => new Date(item.createdAt || 0).getTime() > seenTime).length;
  }, [data, seenState.inquiries]);

  const adminRequest = async (url: string, init?: RequestInit) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      router.replace("/login");
      throw new Error("Sesi admin tidak ditemukan.");
    }

    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers || {}),
      },
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error || "Aksi admin gagal.");
    }

    return json;
  };

  const activeMeta = TAB_META[activeTab];
  return (
    <>
      <a href="#admin-main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[#0B2C6B] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">
        Langsung ke konten utama
      </a>
      <main id="admin-main-content" className="admin-root min-h-screen bg-[#FAF8F4] text-slate-900 font-sans selection:bg-[#C79A3C]/20 selection:text-[#0B2C6B]">
        {/* Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-slate-800/60 bg-[#071B3D] px-5 py-6 text-white lg:flex">
          <div className="shrink-0">
            {/* Genuine Logo */}
            <div className="mb-5 px-2">
              <Link href="/admin" className="inline-block transition-opacity hover:opacity-90">
                <Image
                  src="/binahub_logo.webp"
                  alt="BinaHub Logo"
                  width={1574}
                  height={448}
                  loading="eager"
                  sizes="135px"
                  className="h-auto w-[135px] object-contain brightness-0 invert"
                />
              </Link>
              <div className="mt-2.5 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D9A441]">
                  Admin Workspace
                </span>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]">
            <nav className="space-y-2" aria-label="Navigasi admin">
              {ADMIN_TAB_GROUPS.map((group) => {
                const isOpen = openSidebarGroups.has(group.id);
                const containsActiveTab = group.tabs.some((tab) => tab === activeTab);
                return (
                  <div key={group.id} className="border-b border-slate-800/80 pb-2">
                    <button
                      type="button"
                      onClick={() => toggleSidebarGroup(group.id)}
                      aria-expanded={isOpen}
                      aria-controls={`admin-sidebar-${group.id}`}
                      className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-left text-[10px] font-bold uppercase tracking-wider transition-colors ${containsActiveTab ? "text-[#D9A441]" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"}`}
                    >
                      {group.label}
                      <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div id={`admin-sidebar-${group.id}`} className="mt-1 space-y-1">
                        {group.tabs.map((tab) => (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => handleTabChange(tab)}
                            aria-pressed={activeTab === tab}
                            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-left text-xs font-semibold transition-all ${
                              activeTab === tab
                                ? "bg-white text-[#0B2C6B] shadow-sm shadow-black/10"
                                : "text-slate-300 hover:bg-white/[0.08] hover:text-white"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {tabLabel(tab)}
                              {tab === "Assessment" && newAssessmentCount > 0 && <NotificationBadge count={newAssessmentCount} />}
                              {tab === "Inquiry Masuk" && newInquiryCount > 0 && <NotificationBadge count={newInquiryCount} />}
                            </span>
                            {activeTab === tab && <ArrowRight size={14} className="text-[#D9A441]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {ADMIN_LINK_GROUPS.map((group) => {
                const isOpen = openSidebarGroups.has(group.id);
                return (
                  <div key={group.id} className="border-b border-slate-800/80 pb-2">
                    <button
                      type="button"
                      onClick={() => toggleSidebarGroup(group.id)}
                      aria-expanded={isOpen}
                      aria-controls={`admin-sidebar-${group.id}`}
                      className="flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      {group.label}
                      <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div id={`admin-sidebar-${group.id}`} className="mt-1 space-y-1">
                        {group.links.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex rounded-xl px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-all hover:border-red-500/30 hover:bg-red-500/15 hover:text-red-300"
          >
            <LogOut size={14} /> Keluar dari Sesi
          </button>
        </aside>

        <section className="lg:pl-72">
          {/* Header */}
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 px-5 py-4 backdrop-blur-md md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#C79A3C]">
                  {activeMeta.eyebrow}
                </p>
                <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
                  Selamat datang{adminName ? `, ${adminName}` : " di BinaHub Admin"}
                </h1>
                <p className="mt-1 max-w-2xl text-xs text-slate-500 leading-relaxed">
                  {activeMeta.title} — {activeMeta.description}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <MobileAdminMenu activeTab={activeTab} onTabChange={handleTabChange} newAssessmentCount={newAssessmentCount} newInquiryCount={newInquiryCount} />
                <button
                  type="button"
                  onClick={fetchDashboard}
                  disabled={loading}
                  aria-label={loading ? "Sedang memperbarui dashboard" : "Perbarui dashboard"}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
                >
                  <RefreshCw size={13} className={loading ? "animate-spin text-[#C79A3C]" : "text-slate-500"} />
                  Perbarui
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Keluar dari sesi"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 shadow-xs hover:bg-red-50 lg:hidden"
                >
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          </header>

          <div className="p-5 md:p-8">
            {error && (
              <div role="alert" aria-live="assertive" className="mb-6 rounded-[12px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading || !data ? (
              <DashboardSkeleton />
            ) : (
              <>
                {activeTab === "Overview" && <Overview data={data} />}
                {activeTab === "Acquisition Control" && (
                  <AcquisitionControlPanel onAction={adminRequest} />
                )}
                {activeTab === "Sales Pipeline" && (
                  <PipelinePanel data={data} onAction={adminRequest} onRefresh={fetchDashboard} />
                )}
                {activeTab === "Client & Delivery" && (
                  <ClientDeliveryPanel data={data} onAction={adminRequest} onRefresh={fetchDashboard} />
                )}
                {activeTab === "Operations Control" && (
                  <OperationsControlPanel onAction={adminRequest} />
                )}
                {activeTab === "Automation Center" && (
                  <SmartCenterPanel data={data} onAction={adminRequest} onRefresh={fetchDashboard} />
                )}
                {activeTab === "Assessment" && (
                  <AssessmentPanel
                    data={data}
                    records={filteredAssessments}
                    query={query}
                    setQuery={setQuery}
                    category={assessmentCategory}
                    setCategory={setAssessmentCategory}
                    employeeRange={assessmentEmployeeRange}
                    setEmployeeRange={setAssessmentEmployeeRange}
                    minScore={assessmentMinScore}
                    setMinScore={setAssessmentMinScore}
                    expandedId={expandedId}
                    setExpandedId={setExpandedId}
                    onAction={adminRequest}
                    onRefresh={fetchDashboard}
                  />
                )}
                {activeTab === "Katalog & Rules" && <BusinessRulesPanel onAction={adminRequest} />}
                {activeTab === "Meeting" && <MeetingsPanel bookings={data.calendarBookings || []} />}
                {activeTab === "Kontak & Leads" && (
                  <ContactsPanel contacts={data.contacts} onAction={adminRequest} onRefresh={fetchDashboard} />
                )}
                {activeTab === "Inquiry Masuk" && (
                  <InquiriesPanel inquiries={data.inquiries} onAction={adminRequest} onRefresh={fetchDashboard} />
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
