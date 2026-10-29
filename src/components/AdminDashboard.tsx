"use client";

import { useState, useMemo, useEffect } from "react";
import Monogram from "./Monogram";
import Flourish from "./Flourish";
import { invitation } from "@/config/invitation";

type Rsvp = {
  id: string;
  name: string;
  attending: "yes" | "no";
  guests: number;
  message: string;
  at: string;
};

type Wish = {
  id: string;
  name: string;
  message: string;
  at: string;
  status: "pending" | "approved" | "hidden";
};

type Summary = {
  totalResponses: number;
  totalAttending: number;
  totalDeclined: number;
  totalGuests: number;
  attendanceRate: number;
};

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<"rsvps" | "wishes" | "txt">("rsvps");
  const [statusFilter, setStatusFilter] = useState<"all" | "yes" | "no">("all");
  const [search, setSearch] = useState("");

  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalResponses: 0,
    totalAttending: 0,
    totalDeclined: 0,
    totalGuests: 0,
    attendanceRate: 0,
  });
  const [rawTxt, setRawTxt] = useState("");

  const [wishes, setWishes] = useState<Wish[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Restore saved session password if available
  useEffect(() => {
    const saved = sessionStorage.getItem("admin_auth_pwd");
    if (saved) {
      setPassword(saved);
      loadAll(saved);
    }
  }, []);

  async function loadAll(pwd = password) {
    if (!pwd) return;
    setBusy(true);
    setError("");
    try {
      // 1. Fetch RSVPs
      const rsvpRes = await fetch("/api/rsvp/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd, action: "list" }),
      });
      const rsvpData = await rsvpRes.json();
      if (!rsvpRes.ok || !rsvpData.ok) {
        throw new Error(rsvpData.error || "Incorrect password.");
      }

      setRsvps(rsvpData.rsvps || []);
      setSummary(
        rsvpData.summary || {
          totalResponses: 0,
          totalAttending: 0,
          totalDeclined: 0,
          totalGuests: 0,
          attendanceRate: 0,
        }
      );
      setRawTxt(rsvpData.rawTxt || "");

      // 2. Fetch Wishes
      const wishRes = await fetch("/api/wishes/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      const wishData = await wishRes.json();
      if (wishData.ok) {
        setWishes(wishData.wishes || []);
      }

      setAuthenticated(true);
      sessionStorage.setItem("admin_auth_pwd", pwd);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authentication failed.");
      setAuthenticated(false);
      sessionStorage.removeItem("admin_auth_pwd");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    await loadAll(password);
  }

  function handleLogout() {
    setAuthenticated(false);
    setPassword("");
    sessionStorage.removeItem("admin_auth_pwd");
  }

  async function handleDeleteRsvp(id: string, name: string) {
    if (!window.confirm(`Are you sure you want to remove the RSVP for "${name}"?`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/rsvp/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, action: "delete", id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to delete.");
      setRsvps(data.rsvps || []);
      setSummary(data.summary || summary);
      setRawTxt(data.rawTxt || "");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete.");
    } finally {
      setBusy(false);
    }
  }

  async function handleWishAction(id: string, status: "approved" | "hidden") {
    setBusy(true);
    try {
      const res = await fetch("/api/wishes/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, id, status }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to update wish.");
      setWishes(data.wishes || []);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update wish.");
    } finally {
      setBusy(false);
    }
  }

  function downloadTxtFile() {
    const blob = new Blob([rawTxt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rsvps-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadCsv() {
    const headers = ["Name", "Attending", "Total Guests", "Date Submitted", "Message"];
    const rows = rsvps.map((r) => [
      `"${r.name.replace(/"/g, '""')}"`,
      r.attending === "yes" ? "ATTENDING" : "DECLINED",
      r.attending === "yes" ? r.guests : 0,
      `"${r.at.replace(/"/g, '""')}"`,
      `"${(r.message || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wedding-rsvps-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyTxt() {
    navigator.clipboard.writeText(rawTxt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Filtered RSVPs
  const filteredRsvps = useMemo(() => {
    return rsvps.filter((r) => {
      const matchesStatus =
        statusFilter === "all" ? true : r.attending === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.message.toLowerCase().includes(q) ||
        r.at.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [rsvps, statusFilter, search]);

  const pendingWishesCount = useMemo(
    () => wishes.filter((w) => w.status === "pending").length,
    [wishes]
  );

  // LOGIN SCREEN
  if (!authenticated) {
    return (
      <main className="min-h-screen bg-ivory px-4 py-16 text-wine">
        <div className="mx-auto max-w-md">
          <div className="mb-6 flex justify-center">
            <Monogram size={90} />
          </div>
          <p className="eyebrow text-center text-rose-deep">Private Access</p>
          <h1 className="mt-2 text-center font-script text-5xl text-wine sm:text-6xl">
            Admin Portal
          </h1>
          <p className="mt-3 text-center text-sm italic text-wine/75">
            RSVP guest list and wishes management for {invitation.couple.first} &amp; {invitation.couple.second}
          </p>

          <form
            onSubmit={handleLogin}
            className="mt-8 border border-rose/60 bg-blush/80 p-8 shadow-[0_20px_40px_-20px_rgba(90,64,20,0.3)] backdrop-blur-sm"
          >
            <label className="eyebrow block text-[0.7rem] text-rose-deep">
              Admin Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Enter password..."
                required
                className="mt-3 w-full border-0 border-b border-wine/30 bg-transparent px-1 py-2 text-xl text-wine placeholder:text-wine/30 focus:border-wine focus:outline-none"
              />
            </label>

            {error && (
              <p role="alert" className="mt-4 text-center text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn-rose mt-8 w-full justify-center"
            >
              {busy ? "Signing in..." : "Open Dashboard"}
            </button>

            <p className="mt-5 text-center text-xs text-wine/60">
              Default password: <code className="rounded bg-wine/10 px-1 py-0.5">admin123</code> (or your <code className="rounded bg-wine/10 px-1 py-0.5">ADMIN_PASSWORD</code>)
            </p>
          </form>
        </div>
      </main>
    );
  }

  // DASHBOARD SCREEN
  return (
    <main className="min-h-screen bg-ivory text-wine">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-rose/50 bg-ivory/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <Monogram size={46} />
            <div>
              <h1 className="font-script text-2xl leading-none text-wine sm:text-3xl">
                {invitation.couple.first} &amp; {invitation.couple.second}
              </h1>
              <p className="text-[0.65rem] uppercase tracking-[0.2em] text-rose-deep">
                Event Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadAll()}
              disabled={busy}
              className="btn-ghost py-1.5 px-3 text-xs"
              title="Refresh data"
            >
              {busy ? "Loading..." : "↻ Refresh"}
            </button>
            <button
              onClick={handleLogout}
              className="border border-wine/30 px-3 py-1.5 text-xs uppercase tracking-wider text-wine/80 hover:bg-wine hover:text-ivory"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mx-auto flex max-w-7xl border-t border-rose/30 px-4 sm:px-8">
          <button
            onClick={() => setActiveTab("rsvps")}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-sm font-medium transition ${
              activeTab === "rsvps"
                ? "border-rose text-wine font-semibold"
                : "border-transparent text-wine/60 hover:text-wine"
            }`}
          >
            <span>RSVP Guest List</span>
            <span className="rounded-full bg-rose/25 px-2 py-0.5 text-xs text-wine">
              {summary.totalAttending} coming
            </span>
          </button>

          <button
            onClick={() => setActiveTab("wishes")}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-sm font-medium transition ${
              activeTab === "wishes"
                ? "border-rose text-wine font-semibold"
                : "border-transparent text-wine/60 hover:text-wine"
            }`}
          >
            <span>Wishes Wall</span>
            {pendingWishesCount > 0 ? (
              <span className="rounded-full bg-rose px-2 py-0.5 text-xs font-bold text-wine">
                {pendingWishesCount} pending
              </span>
            ) : (
              <span className="rounded-full bg-wine/10 px-2 py-0.5 text-xs text-wine/70">
                {wishes.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("txt")}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-sm font-medium transition ${
              activeTab === "txt"
                ? "border-rose text-wine font-semibold"
                : "border-transparent text-wine/60 hover:text-wine"
            }`}
          >
            <span>Server .txt File</span>
            <span className="rounded bg-wine/10 px-1.5 py-0.5 text-xs font-mono text-wine/70">
              rsvps.txt
            </span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        {/* TAB 1: RSVPs & GUEST LIST */}
        {activeTab === "rsvps" && (
          <div className="space-y-8">
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="border border-rose/40 bg-blush/60 p-5 shadow-sm">
                <p className="eyebrow text-[0.65rem] text-rose-deep">Total Replies</p>
                <p className="mt-2 text-3xl font-semibold text-wine sm:text-4xl">
                  {summary.totalResponses}
                </p>
                <p className="mt-1 text-xs text-wine/60">Guests who responded</p>
              </div>

              <div className="border border-emerald-600/40 bg-emerald-50/70 p-5 shadow-sm">
                <p className="eyebrow text-[0.65rem] text-emerald-800">Will Come (Attending)</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-900 sm:text-4xl">
                  {summary.totalAttending}
                </p>
                <p className="mt-1 text-xs text-emerald-700/80">
                  {summary.attendanceRate}% acceptance rate
                </p>
              </div>

              <div className="border border-rose-deep/30 bg-rose/15 p-5 shadow-sm">
                <p className="eyebrow text-[0.65rem] text-rose-deep">Will Not Come</p>
                <p className="mt-2 text-3xl font-semibold text-rose-deep sm:text-4xl">
                  {summary.totalDeclined}
                </p>
                <p className="mt-1 text-xs text-rose-deep/80">Declined invitations</p>
              </div>

              <div className="border border-rose/50 bg-blush p-5 shadow-sm">
                <p className="eyebrow text-[0.65rem] text-rose-deep">Total Guest Seats</p>
                <p className="mt-2 text-3xl font-semibold text-wine sm:text-4xl">
                  {summary.totalGuests}
                </p>
                <p className="mt-1 text-xs text-wine/60">Attendees + Plus-ones</p>
              </div>
            </div>

            {/* Controls: Search, Status Filter & Download Actions */}
            <div className="flex flex-col flex-wrap items-stretch justify-between gap-4 border border-rose/40 bg-blush/40 p-4 sm:flex-row sm:items-center">
              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                    statusFilter === "all"
                      ? "bg-wine text-ivory"
                      : "bg-ivory text-wine border border-wine/20 hover:border-wine"
                  }`}
                >
                  All ({rsvps.length})
                </button>
                <button
                  onClick={() => setStatusFilter("yes")}
                  className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                    statusFilter === "yes"
                      ? "bg-emerald-800 text-white"
                      : "bg-ivory text-emerald-900 border border-emerald-600/30 hover:border-emerald-700"
                  }`}
                >
                  ✓ Coming ({summary.totalAttending})
                </button>
                <button
                  onClick={() => setStatusFilter("no")}
                  className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                    statusFilter === "no"
                      ? "bg-rose-deep text-white"
                      : "bg-ivory text-rose-deep border border-rose-deep/30 hover:border-rose-deep"
                  }`}
                >
                  ✕ Not Coming ({summary.totalDeclined})
                </button>
              </div>

              {/* Search & Exports */}
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Search guest or note..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:w-56 border border-wine/30 bg-ivory px-3 py-1.5 text-sm text-wine placeholder:text-wine/40 focus:border-wine focus:outline-none"
                />

                <button
                  onClick={downloadTxtFile}
                  className="btn-rose py-1.5 px-3 text-xs"
                  title="Download raw rsvps.txt file from server"
                >
                  📄 Download .txt
                </button>

                <button
                  onClick={downloadCsv}
                  className="btn-ghost py-1.5 px-3 text-xs"
                  title="Export results to Excel CSV"
                >
                  📊 Export CSV
                </button>
              </div>
            </div>

            {/* Responses List */}
            {filteredRsvps.length === 0 ? (
              <div className="border border-dashed border-wine/30 bg-ivory p-12 text-center text-wine/70">
                <p className="text-xl font-medium">No RSVP responses match this filter.</p>
                <p className="mt-1 text-sm italic">
                  Responses submitted on the main page will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden border border-rose/40 bg-ivory shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-wine">
                    <thead className="border-b border-rose/30 bg-blush/80 text-[0.68rem] uppercase tracking-wider text-rose-deep">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Guest Name</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold">Seats</th>
                        <th className="py-3 px-4 font-semibold">Message / Wish</th>
                        <th className="py-3 px-4 font-semibold">Submitted (Cairo Time)</th>
                        <th className="py-3 px-4 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-wine/10">
                      {filteredRsvps.map((entry) => (
                        <tr key={entry.id} className="hover:bg-blush/30 transition-colors">
                          <td className="py-3.5 px-4 font-medium text-base text-wine">
                            {entry.name}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {entry.attending === "yes" ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                                Will Come
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose/20 px-2.5 py-1 text-xs font-medium text-rose-deep border border-rose/40">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-deep"></span>
                                Cannot Attend
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {entry.attending === "yes" ? (
                              <span className="font-semibold text-wine">
                                {entry.guests} {entry.guests === 1 ? "seat" : "seats"}
                              </span>
                            ) : (
                              <span className="text-wine/40">&mdash;</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                            {entry.message ? (
                              <span className="italic text-wine/85">&ldquo;{entry.message}&rdquo;</span>
                            ) : (
                              <span className="text-wine/35 italic">No note left</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-xs text-wine/65">
                            {entry.at}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteRsvp(entry.id, entry.name)}
                              disabled={busy}
                              className="text-xs text-red-700/70 hover:text-red-800 underline decoration-red-300"
                              title="Delete this response"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: WISHES WALL MODERATION */}
        {activeTab === "wishes" && (
          <div className="space-y-6">
            <div className="border border-rose/40 bg-blush/50 p-6 text-center">
              <h2 className="font-script text-4xl text-wine">Guest Wishes Moderation</h2>
              <p className="mt-1 text-sm italic text-wine/75">
                Approved wishes are displayed on the public Wishes Wall. Pending messages require approval.
              </p>
            </div>

            {wishes.length === 0 ? (
              <div className="border border-dashed border-wine/30 bg-ivory p-12 text-center text-wine/70">
                <p className="text-xl font-medium">No wishes submitted yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {wishes.map((w) => (
                  <div
                    key={w.id}
                    className={`border p-6 shadow-sm transition ${
                      w.status === "approved"
                        ? "border-emerald-400 bg-emerald-50/30"
                        : w.status === "hidden"
                        ? "border-wine/20 bg-wine/5 opacity-60"
                        : "border-rose bg-ivory"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-lg font-semibold text-wine">{w.name}</p>
                        <p className="text-xs text-wine/60">{w.at}</p>
                      </div>
                      <span
                        className={`rounded px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                          w.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : w.status === "hidden"
                            ? "bg-wine/15 text-wine/70"
                            : "bg-rose/40 text-rose-deep"
                        }`}
                      >
                        {w.status}
                      </span>
                    </div>

                    <p className="mt-4 whitespace-pre-wrap text-base italic text-wine/90">
                      &ldquo;{w.message}&rdquo;
                    </p>

                    <div className="mt-5 flex gap-2 border-t border-wine/10 pt-4">
                      <button
                        type="button"
                        disabled={busy || w.status === "approved"}
                        onClick={() => handleWishAction(w.id, "approved")}
                        className="btn-rose py-1 px-3 text-xs"
                      >
                        ✓ Approve
                      </button>
                      <button
                        type="button"
                        disabled={busy || w.status === "hidden"}
                        onClick={() => handleWishAction(w.id, "hidden")}
                        className="btn-ghost py-1 px-3 text-xs"
                      >
                        Hide
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SERVER .TXT FILE VIEWER */}
        {activeTab === "txt" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border border-rose/40 bg-blush/50 p-4">
              <div>
                <h2 className="font-semibold text-wine">Server Text Log: data/rsvps.txt</h2>
                <p className="text-xs text-wine/70">
                  Every RSVP submission is automatically appended to this text file in real time.
                </p>
              </div>

              <div className="flex gap-2">
                <button onClick={copyTxt} className="btn-ghost py-1 px-3 text-xs">
                  {copied ? "✓ Copied!" : "Copy Text"}
                </button>
                <button onClick={downloadTxtFile} className="btn-rose py-1 px-3 text-xs">
                  Download rsvps.txt
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-wine/30 bg-[#2b2520] p-4 text-emerald-300 font-mono text-xs rounded shadow-inner">
              <pre className="whitespace-pre">{rawTxt || "No responses logged yet."}</pre>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
