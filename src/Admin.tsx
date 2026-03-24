import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard, Users, Calendar, CreditCard, BookOpen,
  Upload, Settings, LogOut, Search, Download,
  Plus, Edit2, Trash2, ChevronLeft, ChevronRight,
  ChevronUp, ChevronDown, X, Check, Eye, EyeOff,
  AlertCircle, CheckCircle2, Clock, TrendingUp,
  Menu, Flower2, RefreshCw, Save, QrCode
} from "lucide-react";

// ── Color palette (matches main site) ────────────────────────────────────────
const C = {
  parchment: "#F2D9B8", sandLight: "#F7EDD8", sand: "#EAC99A",
  cream: "#FBF3E8", white: "#FFFDF8",
  maroon: "#6B1A2A", maroonMid: "#8B2535", maroonLight: "#A84050",
  bronze: "#7A4828", bronzeLight: "#B06838", deep: "#3D0A12",
  sidebar: "#3D0A12", sidebarHover: "#5a1020",
  success: "#2d7a4f", warning: "#9a6b00", error: "#8b1a1a",
  gray50: "#faf9f7", gray100: "#f0ebe2", gray200: "#ddd4c4",
  gray500: "#9a8878", gray700: "#5a4a3a",
} as const;

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const defer = (fn: () => void) => Promise.resolve().then(fn);

// ── Types ─────────────────────────────────────────────────────────────────────
interface Student {
  id: number; name: string; phone: string; email: string;
  course: string; batch: string; admissionDate: string;
  paymentStatus: "Paid"|"Pending"|"Partial"; status: string;
  transactionId?: string; amount?: number;
}
interface BatchSlot {
  id: number;
  batch_name: string;
  type: string;
  trainer: string;
  days: string;
  start_time: string;
  end_time: string;
  fee: number;
  mode: string;
}
interface Payment {
  id: number; studentName: string; course: string; amount: number;
  paymentMode: string; transactionId: string; paymentDate: string;
  status: "Confirmed"|"Pending"|"Failed";
}
interface Booking {
  id: number; studentName: string; course: string; batch: string;
  bookingDate: string; status: "Confirmed"|"Cancelled"|"Waitlisted";
}
interface QrCodeRecord {
  id: number;
  label: string;
  upi_id: string;
  batch_name: string;
  amount: number | null;
  active: boolean;
  audience: "all" | "new" | "existing";
}
type AdminPage = "dashboard"|"admissions"|"bookings"|"payments"|"batches"|"qr"|"import"|"settings";

// ── API helpers ───────────────────────────────────────────────────────────────
async function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("adminToken");
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts?.headers || {}) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Reusable UI ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase();
  const cfg: Record<string, { bg: string; color: string }> = {
    paid:        { bg: "#dcf4e8", color: C.success },
    confirmed:   { bg: "#dcf4e8", color: C.success },
    pending:     { bg: "#fef3dc", color: C.warning },
    partial:     { bg: "#fef3dc", color: C.warning },
    cancelled:   { bg: "#fde8e8", color: C.error },
    failed:      { bg: "#fde8e8", color: C.error },
    waitlisted:  { bg: "#e8eef8", color: "#1a3a8b" },
  };
  const { bg, color } = cfg[s] || { bg: C.gray100, color: C.gray700 };

  return (
    <span style={{ padding:"2px 10px", borderRadius:12, fontSize:11, fontWeight:600, background:bg, color, letterSpacing:"0.05em" }}>
      {status}
    </span>
  );
}

function TableHeader({ label, sortKey, sortBy, sortDir, onSort }: { label:string; sortKey:string; sortBy:string; sortDir:"asc"|"desc"; onSort:(k:string)=>void }) {
  const active = sortBy === sortKey;
  return (
    <th onClick={() => onSort(sortKey)} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color: active ? C.maroon : C.gray500, background:C.gray50, borderBottom:`1px solid ${C.gray200}`, cursor:"pointer", whiteSpace:"nowrap", userSelect:"none", fontWeight:600 }}>
      <span style={{ display:"flex", alignItems:"center", gap:4 }}>
        {label}
        {active ? (sortDir==="asc" ? <ChevronUp size={13}/> : <ChevronDown size={13}/>) : <ChevronUp size={13} style={{opacity:0.2}}/>}
      </span>
    </th>
  );
}

function Modal({ title, onClose, children }: { title:string; onClose:()=>void; children:React.ReactNode }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(61,10,18,0.45)", display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.white, borderRadius:6, boxShadow:"0 20px 60px rgba(61,10,18,0.25)", width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ padding:"18px 22px", borderBottom:`1px solid ${C.gray200}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <h3 style={{ fontFamily:"'DM Serif Display',serif", fontSize:17, color:C.deep }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:C.gray500 }}><X size={18}/></button>
        </div>
        <div style={{ padding:"22px" }}>{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, type="text", options }: { label:string; value:string; onChange:(v:string)=>void; type?:string; options?: string[] }) {
  return (
    <div style={{ marginBottom:14 }}>
      <Label style={{ fontSize:10, letterSpacing:"0.25em", color:C.bronze, textTransform:"uppercase", display:"block", marginBottom:4 }}>{label}</Label>
      {options ? (
        <select value={value} onChange={e=>onChange(e.target.value)} style={{ width:"100%", height:36, padding:"0 10px", border:`1px solid ${C.gray200}`, borderRadius:3, background:C.white, color:C.deep, fontSize:13, outline:"none" }}>
          {options.map(o=><option key={o}>{o}</option>)}
        </select>
      ) : (
        <Input type={type} value={value} onChange={e=>onChange(e.target.value)} style={{ height:36, border:`1px solid ${C.gray200}`, borderRadius:3, background:C.white, color:C.deep, fontSize:13 }}/>
      )}
    </div>
  );
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin:(token:string)=>void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!username || !password) { setError("Please enter credentials."); return; }
    setLoading(true); setError("");
    try {
      const data = await apiFetch("/admin/login", { method:"POST", body: JSON.stringify({ username, password }) });
      if (data.token) { localStorage.setItem("adminToken", data.token); onLogin(data.token); }
      else setError(data.message || "Invalid credentials.");
    } catch { setError("Login failed. Check server."); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(155deg,${C.sandLight},${C.parchment},${C.sand})`, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
      <div style={{ width:"100%", maxWidth:400 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:56, height:56, borderRadius:"50%", border:`2px solid ${C.maroon}40`, background:`${C.maroon}10`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
            <Flower2 size={26} style={{ color:C.maroon }}/>
          </div>
          <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:26, color:C.deep, marginBottom:2 }}>Admin Panel</h1>
          <p style={{ fontFamily:"'Noto Serif Telugu',serif", fontSize:13, color:C.maroonLight }}>ఆనందమయి నృత్యాల</p>
        </div>
        <Card style={{ background:C.white, border:`1.5px solid ${C.maroon}18`, borderRadius:6, boxShadow:`0 8px 32px ${C.maroon}12` }}>
          <CardContent style={{ padding:28 }}>
            <FormField label="Username" value={username} onChange={setUsername}/>
            <div style={{ marginBottom:14 }}>
              <Label style={{ fontSize:10, letterSpacing:"0.25em", color:C.bronze, textTransform:"uppercase", display:"block", marginBottom:4 }}>Password</Label>
              <div style={{ position:"relative" }}>
                <Input type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                  style={{ height:36, border:`1px solid ${C.gray200}`, borderRadius:3, background:C.white, color:C.deep, fontSize:13, paddingRight:36 }}/>
                <button onClick={()=>setShowPw(p=>!p)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:C.gray500 }}>
                  {showPw?<EyeOff size={15}/>:<Eye size={15}/>}
                </button>
              </div>
            </div>
            {error && <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:C.error, marginBottom:12 }}><AlertCircle size={13}/>{error}</div>}
            <Button onClick={handleLogin} disabled={loading} style={{ width:"100%", height:40, background:`linear-gradient(135deg,${C.maroon},${C.maroonMid})`, color:C.cream, border:"none", borderRadius:3, fontFamily:"'DM Serif Display',serif", letterSpacing:"0.12em", fontSize:13, cursor:"pointer" }}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <p style={{ textAlign:"center", fontSize:11, color:C.gray500, marginTop:14 }}>Default: admin / admin123</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
const NAV_ITEMS: { page: AdminPage; label: string; te: string; Icon: React.ElementType }[] = [
  { page:"dashboard",  label:"Dashboard",       te:"డాష్‌బోర్డ్",     Icon:LayoutDashboard },
  { page:"admissions", label:"Admissions",      te:"చేర్పులు",          Icon:Users           },
  { page:"bookings",   label:"Bookings",        te:"బుకింగ్‌లు",       Icon:Calendar        },
  { page:"payments",   label:"Payments",        te:"చెల్లింపులు",       Icon:CreditCard      },
  { page:"batches",    label:"Batch Slots",     te:"బ్యాచ్ స్లాట్లు",  Icon:BookOpen        },
  { page:"qr",         label:"QR Payments",     te:"క్యు ఆర్ చెల్లింపులు", Icon:QrCode       },
  { page:"import",     label:"Import Students", te:"విద్యార్థులు దిగుమతి", Icon:Upload       },
  { page:"settings",   label:"Settings",        te:"సెట్టింగులు",       Icon:Settings        },
];

function Sidebar({ active, onNav, onLogout, collapsed, onToggle }: { active:AdminPage; onNav:(p:AdminPage)=>void; onLogout:()=>void; collapsed:boolean; onToggle:()=>void }) {
  return (
    <aside style={{ width: collapsed ? 72 : 256, flexShrink:0, background:`linear-gradient(180deg, ${C.sidebar} 0%, #47111b 100%)`, display:"flex", flexDirection:"column", transition:"width 0.25s", overflow:"hidden", zIndex:10, boxShadow:"18px 0 40px rgba(61,10,18,0.12)", borderRight:"1px solid rgba(255,255,255,0.06)" }}>
      {/* Logo */}
      <div style={{ padding: collapsed ? "22px 0 18px" : "22px 18px 18px", display:"flex", alignItems:"center", gap:12, borderBottom:"1px solid rgba(255,255,255,0.08)", justifyContent: collapsed ? "center" : "flex-start" }}>
        <div style={{ width:38, height:38, borderRadius:"50%", border:"1.5px solid rgba(242,217,184,0.35)", background:"radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18), rgba(242,217,184,0.08))", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"inset 0 1px 0 rgba(255,255,255,0.18)" }}>
          <Flower2 size={16} style={{ color:C.parchment }}/>
        </div>
        {!collapsed && (
          <div>
            <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:16, color:C.parchment, letterSpacing:"0.12em", lineHeight:1 }}>ANANDAMAYI</p>
            <p style={{ fontSize:9, color:"rgba(242,217,184,0.58)", letterSpacing:"0.28em", textTransform:"uppercase", fontWeight:700, marginTop:3 }}>Admin Panel</p>
          </div>
        )}
      </div>

      {/* Toggle */}
      <div style={{padding: collapsed ? "12px 8px" : "12px 12px 8px", display:"flex", justifyContent: collapsed ? "center" : "flex-end"}}>
        <button onClick={onToggle} style={{ width:34, height:34, background:"rgba(242,217,184,0.08)", border:"1px solid rgba(242,217,184,0.1)", borderRadius:10, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(242,217,184,0.64)" }}>
          <Menu size={15}/>
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:"10px 10px 14px" }}>
        {NAV_ITEMS.map(({ page, label, te, Icon:I }) => {
          const isActive = active === page;
          return (
            <button key={page} onClick={()=>onNav(page)} title={collapsed ? label : undefined}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding: collapsed ? "12px" : "12px 14px", borderRadius:16, marginBottom:6, background: isActive ? "linear-gradient(135deg, rgba(242,217,184,0.16), rgba(242,217,184,0.08))" : "transparent", border: isActive ? `1px solid rgba(242,217,184,0.18)` : "1px solid transparent", color: isActive ? C.parchment : "rgba(242,217,184,0.62)", cursor:"pointer", transition:"all 0.18s", justifyContent: collapsed ? "center" : "flex-start", textAlign:"left", boxShadow:isActive?"0 10px 24px rgba(0,0,0,0.14)":"none" }}
              onMouseEnter={e=>{ if(!isActive)(e.currentTarget as HTMLElement).style.background="rgba(242,217,184,0.07)"; }}
              onMouseLeave={e=>{ if(!isActive)(e.currentTarget as HTMLElement).style.background="transparent"; }}>
              <I size={16} style={{ flexShrink:0, opacity:isActive?1:0.82 }}/>
              {!collapsed && (
                <div>
                  <p style={{ fontSize:13, fontFamily:"'DM Serif Display',serif", letterSpacing:"0.05em", lineHeight:1 }}>{label}</p>
                  <p style={{ fontSize:9, fontFamily:"'Noto Serif Telugu',serif", opacity:0.68, marginTop:3 }}>{te}</p>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding:"14px 10px 16px", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={onLogout} title={collapsed ? "Logout" : undefined}
          style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding: collapsed ? "12px" : "12px 14px", borderRadius:16, background:"rgba(242,217,184,0.04)", border:"1px solid rgba(242,217,184,0.08)", color:"rgba(242,217,184,0.52)", cursor:"pointer", justifyContent: collapsed ? "center" : "flex-start" }}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=C.parchment}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color="rgba(242,217,184,0.4)"}>
          <LogOut size={16}/>
          {!collapsed && <span style={{ fontSize:12, fontFamily:"'DM Serif Display',serif" }}>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

// ── TOPBAR ────────────────────────────────────────────────────────────────────
function TopBar({ title, subtitle, actions }: { title:string; subtitle?:string; actions?: React.ReactNode }) {
  return (
    <div style={{ padding:"18px 24px", borderBottom:`1px solid ${C.gray200}`, background:"linear-gradient(180deg, #fffdfa 0%, #faf7f2 100%)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, boxShadow:"0 6px 18px rgba(61,10,18,0.04)" }}>
      <div>
        <p style={{fontSize:10,letterSpacing:"0.28em",textTransform:"uppercase",color:C.bronze,marginBottom:6,fontWeight:700}}>Admin Workspace</p>
        <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:24, color:C.deep, lineHeight:1 }}>{title}</h2>
        {subtitle && <p style={{ fontFamily:"'Noto Serif Telugu',serif", fontSize:12, color:C.maroonLight, marginTop:4 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display:"flex", gap:8 }}>{actions}</div>}
    </div>
  );
}

// ── STAT CARD ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, Icon:I, color }: { label:string; value:string|number; sub:string; Icon:React.ElementType; color:string }) {
  return (
    <Card style={{ background:C.white, border:`1.5px solid ${C.gray200}`, borderRadius:6, borderTop:`3px solid ${color}` }}>
      <CardContent style={{ padding:"18px 20px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
          <div>
            <p style={{ fontSize:11, letterSpacing:"0.2em", color:C.gray500, textTransform:"uppercase", marginBottom:6 }}>{label}</p>
            <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:32, fontWeight:700, color:C.deep, lineHeight:1 }}>{value}</p>
            <p style={{ fontSize:11, color:C.gray500, marginTop:4 }}>{sub}</p>
          </div>
          <div style={{ width:40, height:40, borderRadius:8, background:`${color}15`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <I size={20} style={{ color }}/>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard() {
  const [stats, setStats] = useState({ total:0, paid:0, pending:0, revenue:0, batches:0, bookings:0 });
  const [recent, setRecent] = useState<Student[]>([]);

  useEffect(() => {
    apiFetch("/admin/stats").then(d => { if(d.success) setStats(d.stats); }).catch(()=>{});
    apiFetch("/admin/admissions?limit=5").then(d => { if(d.success) setRecent(d.records); }).catch(()=>{});
  }, []);

  return (
    <div style={{ padding:24, overflowY:"auto", flex:1 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16, marginBottom:24 }}>
        <StatCard label="Total Students" value={stats.total}   sub="All admissions"         Icon={Users}       color={C.maroon}/>
        <StatCard label="Paid"           value={stats.paid}    sub="Confirmed payments"     Icon={CheckCircle2} color={C.success}/>
        <StatCard label="Pending"        value={stats.pending} sub="Awaiting payment"       Icon={Clock}       color={C.warning}/>
        <StatCard label="Revenue"        value={`₹${stats.revenue.toLocaleString()}`} sub="Total collected" Icon={TrendingUp} color={C.bronze}/>
        <StatCard label="Batch Slots"    value={stats.batches} sub="Active batches"         Icon={BookOpen}    color="#1a5a8b"/>
        <StatCard label="Bookings"       value={stats.bookings} sub="Total bookings"        Icon={Calendar}    color="#5a1a8b"/>
      </div>
      <Card style={{ background:C.white, border:`1.5px solid ${C.gray200}`, borderRadius:6 }}>
        <CardHeader style={{ padding:"16px 20px 12px", borderBottom:`1px solid ${C.gray100}` }}>
          <CardTitle style={{ fontFamily:"'DM Serif Display',serif", fontSize:15, color:C.deep }}>Recent Admissions</CardTitle>
        </CardHeader>
        <CardContent style={{ padding:0 }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:C.gray50 }}>
                {["Name","Batch","Date","Status"].map(h=>(
                  <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:C.gray500, borderBottom:`1px solid ${C.gray200}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.length===0&&<tr><td colSpan={4} style={{textAlign:"center",padding:24,color:C.gray500,fontSize:13}}>No data yet</td></tr>}
              {recent.map((r,i)=>(
                <tr key={r.id} style={{ borderBottom:`1px solid ${C.gray100}`, background:i%2===0?C.white:C.gray50 }}>
                  <td style={{ padding:"10px 16px", fontSize:13, color:C.deep, fontWeight:500 }}>{r.name}</td>
                  <td style={{ padding:"10px 16px", fontSize:13, color:C.gray700 }}>{r.batch}</td>
                  <td style={{ padding:"10px 16px", fontSize:12, color:C.gray500 }}>{r.admissionDate}</td>
                  <td style={{ padding:"10px 16px" }}><StatusBadge status={r.paymentStatus}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// ── ADMISSIONS ────────────────────────────────────────────────────────────────
function AdmissionsPage() {
  const [data, setData]         = useState<Student[]>([]);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("All");
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [sortBy, setSortBy]     = useState("admissionDate");
  const [sortDir, setSortDir]   = useState<"asc"|"desc">("desc");
  const [editing, setEditing]   = useState<Student|null>(null);
  const [loading, setLoading]   = useState(false);
  const PER_PAGE = 10;

  const load = useCallback(() => {
    defer(() => setLoading(true));
    apiFetch(`/admin/admissions?page=${page}&limit=${PER_PAGE}&search=${encodeURIComponent(search)}&status=${filter}&sortBy=${sortBy}&sortDir=${sortDir}`)
      .then(d => { if (d.success) { setData(d.records); setTotal(d.total); } })
      .catch(() => {})
      .finally(() => { defer(() => setLoading(false)); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, filter, sortBy, sortDir]);

  useEffect(() => { load(); }, [page, search, filter, sortBy, sortDir]);

  const handleSort = (k: string) => { if (sortBy===k) setSortDir(d=>d==="asc"?"desc":"asc"); else { setSortBy(k); setSortDir("asc"); } };

  const handleSave = async (s: Student) => {
    try {
      await apiFetch(`/admin/admissions/${s.id}`, { method:"PUT", body:JSON.stringify(s) });
      setEditing(null); load();
    } catch { alert("Save failed"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this admission?")) return;
    try { await apiFetch(`/admin/admissions/${id}`, { method:"DELETE" }); load(); } catch { alert("Delete failed"); }
  };

  const exportData = async () => {
    window.open(`${API}/admin/export/admissions?token=${localStorage.getItem("adminToken")}`, "_blank");
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>
      <TopBar title="Admissions" subtitle="చేర్పుల నిర్వహణ"
        actions={<>
          <Button onClick={exportData} style={{ height:34, background:C.white, border:`1px solid ${C.gray200}`, color:C.gray700, borderRadius:3, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}><Download size={13}/>Export</Button>
          <Button onClick={load} style={{ height:34, background:`linear-gradient(135deg,${C.maroon},${C.maroonMid})`, color:C.cream, border:"none", borderRadius:3, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}><RefreshCw size={13}/>Refresh</Button>
        </>}
      />

      <div style={{ padding:"14px 24px", borderBottom:`1px solid ${C.gray200}`, background:C.white, display:"flex", gap:12, flexWrap:"wrap" }}>
        <div style={{ position:"relative", flex:1, minWidth:200 }}>
          <Search size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:C.gray500 }}/>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search by name, phone, email..."
            style={{ width:"100%", height:34, paddingLeft:32, border:`1px solid ${C.gray200}`, borderRadius:3, fontSize:13, color:C.deep, background:C.white, outline:"none" }}/>
        </div>
        <select value={filter} onChange={e=>{setFilter(e.target.value);setPage(1);}} style={{ height:34, padding:"0 10px", border:`1px solid ${C.gray200}`, borderRadius:3, fontSize:13, color:C.deep, background:C.white, minWidth:130 }}>
          {["All","Paid","Pending","Partial"].map(o=><option key={o}>{o}</option>)}
        </select>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"0 24px 24px" }}>
        <Card style={{ background:C.white, border:`1px solid ${C.gray200}`, borderRadius:6, marginTop:16, overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  {[["name","Name"],["phone","Phone"],["email","Email"],["batch","Batch"],["admissionDate","Date"],["paymentStatus","Status"]].map(([k,l])=>(
                    <TableHeader key={k} label={l} sortKey={k} sortBy={sortBy} sortDir={sortDir} onSort={handleSort}/>
                  ))}
                  <th style={{ padding:"10px 14px", background:C.gray50, borderBottom:`1px solid ${C.gray200}`, fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:C.gray500 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={7} style={{textAlign:"center",padding:32,color:C.gray500}}><RefreshCw size={18} style={{animation:"spin 1s linear infinite"}}/></td></tr>}
                {!loading && data.length===0 && <tr><td colSpan={7} style={{textAlign:"center",padding:32,color:C.gray500,fontSize:13}}>No records found</td></tr>}
                {data.map((row,i)=>(
                  <tr key={row.id} style={{ borderBottom:`1px solid ${C.gray100}`, background:i%2===0?C.white:C.gray50 }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=`${C.maroon}05`}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=i%2===0?C.white:C.gray50}>
                    <td style={{ padding:"10px 14px", fontSize:13, color:C.deep, fontWeight:500, whiteSpace:"nowrap" }}>{row.name}</td>
                    <td style={{ padding:"10px 14px", fontSize:13, color:C.gray700 }}>{row.phone}</td>
                    <td style={{ padding:"10px 14px", fontSize:13, color:C.gray700 }}>{row.email||"—"}</td>
                    <td style={{ padding:"10px 14px", fontSize:13, color:C.gray700 }}>{row.batch}</td>
                    <td style={{ padding:"10px 14px", fontSize:12, color:C.gray500, whiteSpace:"nowrap" }}>{row.admissionDate}</td>
                    <td style={{ padding:"10px 14px" }}><StatusBadge status={row.paymentStatus}/></td>
                    <td style={{ padding:"10px 14px" }}>
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={()=>setEditing({...row})} style={{ width:28, height:28, borderRadius:4, border:`1px solid ${C.gray200}`, background:C.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.gray700 }}><Edit2 size={12}/></button>
                        <button onClick={()=>handleDelete(row.id)} style={{ width:28, height:28, borderRadius:4, border:`1px solid #fdd`, background:"#fff8f8", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.error }}><Trash2 size={12}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pagination */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:14, flexWrap:"wrap", gap:8 }}>
          <span style={{ fontSize:12, color:C.gray500 }}>Showing {Math.min((page-1)*PER_PAGE+1, total)}–{Math.min(page*PER_PAGE, total)} of {total}</span>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{ width:32, height:32, borderRadius:3, border:`1px solid ${C.gray200}`, background:C.white, cursor:page===1?"not-allowed":"pointer", color:page===1?C.gray200:C.gray700, display:"flex", alignItems:"center", justifyContent:"center" }}><ChevronLeft size={14}/></button>
            {Array.from({length:Math.min(5,Math.ceil(total/PER_PAGE))},(_,i)=>i+1).map(p=>(
              <button key={p} onClick={()=>setPage(p)} style={{ width:32, height:32, borderRadius:3, border:`1px solid ${page===p?C.maroon:C.gray200}`, background:page===p?C.maroon:C.white, color:page===p?C.cream:C.gray700, cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" }}>{p}</button>
            ))}
            <button onClick={()=>setPage(p=>p+1)} disabled={page*PER_PAGE>=total} style={{ width:32, height:32, borderRadius:3, border:`1px solid ${C.gray200}`, background:C.white, cursor:page*PER_PAGE>=total?"not-allowed":"pointer", color:page*PER_PAGE>=total?C.gray200:C.gray700, display:"flex", alignItems:"center", justifyContent:"center" }}><ChevronRight size={14}/></button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <Modal title={`Edit Admission — ${editing.name}`} onClose={()=>setEditing(null)}>
          <FormField label="Student Name" value={editing.name} onChange={v=>setEditing(e=>e?{...e,name:v}:e)}/>
          <FormField label="Phone" value={editing.phone} onChange={v=>setEditing(e=>e?{...e,phone:v}:e)}/>
          <FormField label="Email" value={editing.email||""} onChange={v=>setEditing(e=>e?{...e,email:v}:e)}/>
          <FormField label="Batch" value={editing.batch} onChange={v=>setEditing(e=>e?{...e,batch:v}:e)}/>
          <FormField label="Payment Status" value={editing.paymentStatus} onChange={v=>setEditing(e=>e?{...e,paymentStatus:v as Student["paymentStatus"]}:e)} options={["Paid","Pending","Partial"]}/>
          <div style={{ display:"flex", gap:10, marginTop:8 }}>
            <Button onClick={()=>setEditing(null)} style={{ flex:1, height:38, background:C.white, border:`1px solid ${C.gray200}`, color:C.gray700, borderRadius:3, cursor:"pointer" }}>Cancel</Button>
            <Button onClick={()=>editing&&handleSave(editing)} style={{ flex:1, height:38, background:`linear-gradient(135deg,${C.maroon},${C.maroonMid})`, color:C.cream, border:"none", borderRadius:3, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <Save size={13}/>Save Changes
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── BOOKINGS ──────────────────────────────────────────────────────────────────
function BookingsPage() {
  const [data, setData]       = useState<Booking[]>([]);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("All");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Booking|null>(null);

  const load = useCallback(() => {
    defer(() => setLoading(true));
    apiFetch(`/admin/bookings?search=${encodeURIComponent(search)}&status=${filter}`)
      .then(d => { if (d.success) setData(d.records); })
      .catch(() => {})
      .finally(() => { defer(() => setLoading(false)); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filter]);

  useEffect(()=>{ load(); },[search, filter]);

  const handleSave = async (b: Booking) => {
    try { await apiFetch(`/admin/bookings/${b.id}`, { method:"PUT", body:JSON.stringify(b) }); setEditing(null); load(); } catch { alert("Save failed"); }
  };
  const handleCancel = async (id: number) => {
    if (!confirm("Cancel this booking?")) return;
    try { await apiFetch(`/admin/bookings/${id}/cancel`, { method:"POST" }); load(); } catch { alert("Failed"); }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>
      <TopBar title="Bookings" subtitle="బుకింగ్‌ల నిర్వహణ"
        actions={<Button onClick={()=>window.open(`${API}/admin/export/bookings?token=${localStorage.getItem("adminToken")}`, "_blank")} style={{ height:34, background:C.white, border:`1px solid ${C.gray200}`, color:C.gray700, borderRadius:3, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}><Download size={13}/>Export</Button>}
      />
      <div style={{ padding:"14px 24px", borderBottom:`1px solid ${C.gray200}`, background:C.white, display:"flex", gap:12 }}>
        <div style={{ position:"relative", flex:1 }}>
          <Search size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:C.gray500 }}/>
          <input value={search} onChange={e=>{setSearch(e.target.value);}} placeholder="Search bookings..."
            style={{ width:"100%", height:34, paddingLeft:32, border:`1px solid ${C.gray200}`, borderRadius:3, fontSize:13, color:C.deep, background:C.white, outline:"none" }}/>
        </div>
        <select value={filter} onChange={e=>setFilter(e.target.value)} style={{ height:34, padding:"0 10px", border:`1px solid ${C.gray200}`, borderRadius:3, fontSize:13, color:C.deep, background:C.white }}>
          {["All","Confirmed","Cancelled","Waitlisted"].map(o=><option key={o}>{o}</option>)}
        </select>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"16px 24px" }}>
        <Card style={{ background:C.white, border:`1px solid ${C.gray200}`, borderRadius:6, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:C.gray50 }}>
              {["Student Name","Course","Batch","Booking Date","Status","Actions"].map(h=>(
                <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:C.gray500, borderBottom:`1px solid ${C.gray200}` }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading&&<tr><td colSpan={6} style={{textAlign:"center",padding:24,color:C.gray500}}>Loading...</td></tr>}
              {!loading&&data.length===0&&<tr><td colSpan={6} style={{textAlign:"center",padding:24,color:C.gray500,fontSize:13}}>No bookings found</td></tr>}
              {data.map((row,i)=>(
                <tr key={row.id} style={{ borderBottom:`1px solid ${C.gray100}`, background:i%2===0?C.white:C.gray50 }}>
                  <td style={{ padding:"10px 14px", fontSize:13, color:C.deep, fontWeight:500 }}>{row.studentName}</td>
                  <td style={{ padding:"10px 14px", fontSize:13, color:C.gray700 }}>{row.course}</td>
                  <td style={{ padding:"10px 14px", fontSize:13, color:C.gray700 }}>{row.batch}</td>
                  <td style={{ padding:"10px 14px", fontSize:12, color:C.gray500 }}>{row.bookingDate}</td>
                  <td style={{ padding:"10px 14px" }}><StatusBadge status={row.status}/></td>
                  <td style={{ padding:"10px 14px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={()=>setEditing({...row})} style={{ width:28, height:28, borderRadius:4, border:`1px solid ${C.gray200}`, background:C.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.gray700 }}><Edit2 size={12}/></button>
                      <button onClick={()=>handleCancel(row.id)} style={{ width:28, height:28, borderRadius:4, border:"1px solid #fdd", background:"#fff8f8", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.error }}><X size={12}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      {editing&&(
        <Modal title={`Edit Booking — ${editing.studentName}`} onClose={()=>setEditing(null)}>
          <FormField label="Student Name" value={editing.studentName} onChange={v=>setEditing(e=>e?{...e,studentName:v}:e)}/>
          <FormField label="Course" value={editing.course} onChange={v=>setEditing(e=>e?{...e,course:v}:e)}/>
          <FormField label="Batch" value={editing.batch} onChange={v=>setEditing(e=>e?{...e,batch:v}:e)}/>
          <FormField label="Status" value={editing.status} onChange={v=>setEditing(e=>e?{...e,status:v as Booking["status"]}:e)} options={["Confirmed","Cancelled","Waitlisted"]}/>
          <div style={{ display:"flex", gap:10, marginTop:8 }}>
            <Button onClick={()=>setEditing(null)} style={{ flex:1, height:38, background:C.white, border:`1px solid ${C.gray200}`, color:C.gray700, borderRadius:3, cursor:"pointer" }}>Cancel</Button>
            <Button onClick={()=>editing&&handleSave(editing)} style={{ flex:1, height:38, background:`linear-gradient(135deg,${C.maroon},${C.maroonMid})`, color:C.cream, border:"none", borderRadius:3, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}><Save size={13}/>Save</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── PAYMENTS ──────────────────────────────────────────────────────────────────
function PaymentsPage() {
  const [data, setData]       = useState<Payment[]>([]);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("All");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Payment|null>(null);

  const load = useCallback(() => {
    defer(() => setLoading(true));
    apiFetch(`/admin/payments?search=${encodeURIComponent(search)}&status=${filter}`)
      .then(d => { if (d.success) setData(d.records); })
      .catch(() => {})
      .finally(() => { defer(() => setLoading(false)); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filter]);

  useEffect(()=>{ load(); },[search, filter]);

  const handleSave = async (p: Payment) => {
    try { await apiFetch(`/admin/payments/${p.id}`, { method:"PUT", body:JSON.stringify(p) }); setEditing(null); load(); } catch { alert("Save failed"); }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>
      <TopBar title="Payments" subtitle="చెల్లింపుల నిర్వహణ"
        actions={<Button onClick={()=>window.open(`${API}/admin/export/payments?token=${localStorage.getItem("adminToken")}`, "_blank")} style={{ height:34, background:C.white, border:`1px solid ${C.gray200}`, color:C.gray700, borderRadius:3, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}><Download size={13}/>Export</Button>}
      />
      <div style={{ padding:"14px 24px", borderBottom:`1px solid ${C.gray200}`, background:C.white, display:"flex", gap:12 }}>
        <div style={{ position:"relative", flex:1 }}>
          <Search size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:C.gray500 }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search payments..."
            style={{ width:"100%", height:34, paddingLeft:32, border:`1px solid ${C.gray200}`, borderRadius:3, fontSize:13, color:C.deep, background:C.white, outline:"none" }}/>
        </div>
        <select value={filter} onChange={e=>setFilter(e.target.value)} style={{ height:34, padding:"0 10px", border:`1px solid ${C.gray200}`, borderRadius:3, fontSize:13, color:C.deep, background:C.white }}>
          {["All","Confirmed","Pending","Failed"].map(o=><option key={o}>{o}</option>)}
        </select>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"16px 24px" }}>
        <Card style={{ background:C.white, border:`1px solid ${C.gray200}`, borderRadius:6, overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr style={{ background:C.gray50 }}>
                {["Student","Course","Amount","Mode","Transaction ID","Date","Status","Actions"].map(h=>(
                  <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:C.gray500, borderBottom:`1px solid ${C.gray200}`, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {loading&&<tr><td colSpan={8} style={{textAlign:"center",padding:24,color:C.gray500}}>Loading...</td></tr>}
                {!loading&&data.length===0&&<tr><td colSpan={8} style={{textAlign:"center",padding:24,color:C.gray500,fontSize:13}}>No payments found</td></tr>}
                {data.map((row,i)=>(
                  <tr key={row.id} style={{ borderBottom:`1px solid ${C.gray100}`, background:i%2===0?C.white:C.gray50 }}>
                    <td style={{ padding:"10px 14px", fontSize:13, color:C.deep, fontWeight:500, whiteSpace:"nowrap" }}>{row.studentName}</td>
                    <td style={{ padding:"10px 14px", fontSize:13, color:C.gray700 }}>{row.course}</td>
                    <td style={{ padding:"10px 14px", fontSize:13, color:C.maroon, fontFamily:"'DM Serif Display',serif", fontWeight:600 }}>₹{row.amount?.toLocaleString()}</td>
                    <td style={{ padding:"10px 14px", fontSize:13, color:C.gray700 }}>{row.paymentMode}</td>
                    <td style={{ padding:"10px 14px", fontSize:12, color:C.gray500, maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row.transactionId||"—"}</td>
                    <td style={{ padding:"10px 14px", fontSize:12, color:C.gray500, whiteSpace:"nowrap" }}>{row.paymentDate}</td>
                    <td style={{ padding:"10px 14px" }}><StatusBadge status={row.status}/></td>
                    <td style={{ padding:"10px 14px" }}>
                      <button onClick={()=>setEditing({...row})} style={{ width:28, height:28, borderRadius:4, border:`1px solid ${C.gray200}`, background:C.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.gray700 }}><Edit2 size={12}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      {editing&&(
        <Modal title={`Edit Payment — ${editing.studentName}`} onClose={()=>setEditing(null)}>
          <FormField label="Transaction ID" value={editing.transactionId||""} onChange={v=>setEditing(e=>e?{...e,transactionId:v}:e)}/>
          <FormField label="Payment Mode" value={editing.paymentMode||""} onChange={v=>setEditing(e=>e?{...e,paymentMode:v}:e)} options={["UPI","Bank Transfer","Cash","Card","Other"]}/>
          <FormField label="Amount (₹)" value={String(editing.amount||"")} onChange={v=>setEditing(e=>e?{...e,amount:Number(v)}:e)} type="number"/>
          <FormField label="Status" value={editing.status} onChange={v=>setEditing(e=>e?{...e,status:v as Payment["status"]}:e)} options={["Confirmed","Pending","Failed"]}/>
          <div style={{ display:"flex", gap:10, marginTop:8 }}>
            <Button onClick={()=>setEditing(null)} style={{ flex:1, height:38, background:C.white, border:`1px solid ${C.gray200}`, color:C.gray700, borderRadius:3, cursor:"pointer" }}>Cancel</Button>
            <Button onClick={()=>editing&&handleSave(editing)} style={{ flex:1, height:38, background:`linear-gradient(135deg,${C.maroon},${C.maroonMid})`, color:C.cream, border:"none", borderRadius:3, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}><Save size={13}/>Save</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── BATCH SLOTS ───────────────────────────────────────────────────────────────
function BatchSlotsPage() {
  const [data, setData]       = useState<BatchSlot[]>([]);
  const [editing, setEditing] = useState<BatchSlot|null>(null);
  const [adding, setAdding]   = useState(false);
  const blankSlot: BatchSlot  = { id:0, batch_name:"", type:"POPULAR", trainer:"", days:"", start_time:"18:00", end_time:"19:00", fee:0, mode:"ONLINE" };
  const totalBatches = data.length;
  const onlineCount = data.filter((b) => b.mode === "ONLINE").length;
  const hybridCount = data.filter((b) => b.mode === "HYBRID").length;
  const avgFee = totalBatches ? Math.round(data.reduce((sum, batch) => sum + Number(batch.fee || 0), 0) / totalBatches) : 0;

  const load = () => {
    apiFetch("/batches")
      .then(d => setData(Array.isArray(d) ? d : []))
      .catch(() => {});
  };
  useEffect(()=>{ load(); },[]);

  const handleSave = async (b: BatchSlot) => {
    try {
      if (b.id === 0) await apiFetch("/batches", { method:"POST", body:JSON.stringify(b) });
      else await apiFetch(`/batches/${b.id}`, { method:"PUT", body:JSON.stringify(b) });
      setEditing(null); setAdding(false); load();
    } catch { alert("Save failed"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this batch? This will affect the main website.")) return;
    try { await apiFetch(`/batches/${id}`, { method:"DELETE" }); load(); } catch { alert("Failed"); }
  };

  const editForm = editing || (adding ? blankSlot : null);

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>
      <TopBar title="Batches" subtitle="బ్యాచ్ నిర్వహణ · Changes reflect live on main website"
        actions={<Button onClick={()=>{setAdding(true);setEditing(null);}} style={{ height:34, background:`linear-gradient(135deg,${C.maroon},${C.maroonMid})`, color:C.cream, border:"none", borderRadius:3, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}><Plus size={13}/>Add Batch</Button>}
      />
      <div style={{ flex:1, overflowY:"auto", padding:"16px 24px" }}>
        <div style={{ background:`linear-gradient(135deg, ${C.white}, ${C.parchment})`, border:`1px solid ${C.maroon}20`, borderRadius:8, padding:"18px 20px", marginBottom:18, boxShadow:`0 10px 24px ${C.maroon}10` }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:18, flexWrap:"wrap" }}>
            <div style={{ maxWidth:520 }}>
              <p style={{ fontSize:10, letterSpacing:"0.32em", color:C.bronze, textTransform:"uppercase", marginBottom:8 }}>Batch Control Center</p>
              <h3 style={{ fontFamily:"'DM Serif Display',serif", fontSize:24, color:C.deep, marginBottom:6 }}>Manage The Public Batch Experience</h3>
              <p style={{ fontSize:13, color:C.gray700, lineHeight:1.7 }}>
                Update timings, pricing, and modes here. Every published change is reflected on the student-facing website after refresh.
              </p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2, minmax(120px, 1fr))", gap:10, minWidth:"min(100%, 320px)" }}>
              {[
                { label:"Total Batches", value:String(totalBatches) },
                { label:"Online", value:String(onlineCount) },
                { label:"Hybrid", value:String(hybridCount) },
                { label:"Avg Fee", value:`₹${avgFee.toLocaleString()}` },
              ].map((item) => (
                <div key={item.label} style={{ background:`${C.maroon}08`, border:`1px solid ${C.maroon}18`, borderRadius:6, padding:"12px 14px" }}>
                  <p style={{ fontSize:10, letterSpacing:"0.18em", textTransform:"uppercase", color:C.gray500, marginBottom:4 }}>{item.label}</p>
                  <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, color:C.maroon }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background:`${C.maroon}08`, border:`1px solid ${C.maroon}20`, borderRadius:6, padding:"10px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:8, fontSize:12, color:C.maroon }}>
          <AlertCircle size={14}/>Publish clean, student-friendly batch info. The website uses this data directly.
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:18 }}>
          {data.map(b=>(
            <Card key={b.id} style={{ background:`linear-gradient(180deg, ${C.white}, ${C.gray50})`, border:`1px solid ${C.maroon}20`, borderRadius:10, boxShadow:`0 14px 28px ${C.maroon}10`, overflow:"hidden" }}>
              <div style={{ height:5, background:`linear-gradient(90deg, ${C.maroon}, ${C.bronzeLight})` }}/>
              <CardHeader style={{ padding:"18px 18px 10px" }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:8 }}>
                      <span style={{ padding:"4px 8px", borderRadius:999, background:`${C.maroon}10`, border:`1px solid ${C.maroon}18`, fontSize:10, color:C.maroon, letterSpacing:"0.16em", textTransform:"uppercase" }}>{b.type}</span>
                      <span style={{ padding:"4px 8px", borderRadius:999, background:C.white, border:`1px solid ${C.gray200}`, fontSize:10, color:C.gray700, letterSpacing:"0.16em", textTransform:"uppercase" }}>{b.mode}</span>
                    </div>
                    <CardTitle style={{ fontFamily:"'DM Serif Display',serif", fontSize:18, color:C.deep }}>{b.batch_name}</CardTitle>
                    <p style={{ fontSize:12, color:C.gray500, marginTop:4, lineHeight:1.5 }}>{b.days}</p>
                    <p style={{ fontSize:12, color:C.maroon, marginTop:6, fontWeight:600 }}>{b.trainer ? `Teacher: ${b.trainer}` : "Teacher not assigned"}</p>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={()=>{setEditing({...b});setAdding(false);}} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${C.gray200}`, background:C.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.gray700 }}><Edit2 size={13}/></button>
                    <button onClick={()=>handleDelete(b.id)} style={{ width:32, height:32, borderRadius:8, border:"1px solid #f4cfcf", background:"#fff8f8", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.error }}><Trash2 size={13}/></button>
                  </div>
                </div>
              </CardHeader>
              <CardContent style={{ padding:"0 18px 18px" }}>
                <Separator style={{ background:C.gray200, marginBottom:14 }}/>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:10 }}>
                  {[
                    { label:"Start", value:b.start_time },
                    { label:"End", value:b.end_time },
                    { label:"Mode", value:b.mode },
                    { label:"Fee", value:`₹${Number(b.fee || 0).toLocaleString()}` },
                  ].map((item)=>(
                    <div key={item.label} style={{ background:C.white, border:`1px solid ${C.gray200}`, borderRadius:8, padding:"10px 12px" }}>
                      <p style={{ fontSize:10, letterSpacing:"0.14em", textTransform:"uppercase", color:C.gray500, marginBottom:4 }}>{item.label}</p>
                      <p style={{ fontSize:13, color:C.deep, fontWeight:600 }}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:10, background:`${C.maroon}05`, border:`1px solid ${C.maroon}12`, borderRadius:8, padding:"10px 12px" }}>
                  <p style={{ fontSize:10, letterSpacing:"0.14em", textTransform:"uppercase", color:C.gray500, marginBottom:4 }}>Teacher</p>
                  <p style={{ fontSize:13, color:C.deep, fontWeight:600 }}>{b.trainer || "Not assigned"}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {editForm&&(
        <Modal title={adding?"Add New Batch":`Edit — ${editing?.batch_name}`} onClose={()=>{setEditing(null);setAdding(false);}}>
          {[["Batch Name","batch_name","text"],["Type","type","text"],["Teacher / Slot Owner","trainer","text"],["Days","days","text"]].map(([label,key])=>(
            <FormField key={key} label={label} value={(editForm as unknown as Record<string,string>)[key]||""} onChange={v=>setEditing(e=>({...(e||blankSlot), [key]:v} as BatchSlot))}/>
          ))}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <FormField label="Start Time" value={editForm.start_time} onChange={v=>setEditing(e=>({...(e||blankSlot), start_time:v}))} type="time"/>
            <FormField label="End Time" value={editForm.end_time} onChange={v=>setEditing(e=>({...(e||blankSlot), end_time:v}))} type="time"/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <FormField label="Fee" value={String(editForm.fee)} onChange={v=>setEditing(e=>({...(e||blankSlot), fee:Number(v)}))} type="number"/>
            <FormField label="Mode" value={editForm.mode} onChange={v=>setEditing(e=>({...(e||blankSlot), mode:v}))} options={["ONLINE","OFFLINE","HYBRID"]}/>
          </div>
          <div style={{ display:"flex", gap:10, marginTop:8 }}>
            <Button onClick={()=>{setEditing(null);setAdding(false);}} style={{ flex:1, height:38, background:C.white, border:`1px solid ${C.gray200}`, color:C.gray700, borderRadius:3, cursor:"pointer" }}>Cancel</Button>
            <Button onClick={()=>editForm&&handleSave(editForm)} style={{ flex:1, height:38, background:`linear-gradient(135deg,${C.maroon},${C.maroonMid})`, color:C.cream, border:"none", borderRadius:3, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}><Save size={13}/>Save & Publish</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── IMPORT ────────────────────────────────────────────────────────────────────
function QrPaymentsPage() {
  const [data, setData] = useState<QrCodeRecord[]>([]);
  const [batches, setBatches] = useState<BatchSlot[]>([]);
  const [editing, setEditing] = useState<QrCodeRecord|null>(null);
  const [adding, setAdding] = useState(false);
  const blankQr: QrCodeRecord = { id: 0, label: "", upi_id: "", batch_name: "All", amount: null, active: false, audience: "all" };

  const load = useCallback(() => {
    apiFetch("/admin/qrcodes")
      .then((d) => setData(Array.isArray(d) ? d.map((row) => ({ ...row, audience: row.audience || "all" })) : []))
      .catch(() => {});
    apiFetch("/batches")
      .then((d) => setBatches(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeCount = data.filter((row) => row.active).length;
  const batchOptions = ["All", ...Array.from(new Set(batches.map((batch) => batch.batch_name).filter(Boolean)))];
  const editForm = editing || (adding ? blankQr : null);

  const handleSave = async (record: QrCodeRecord) => {
    if (!record.label.trim() || !record.upi_id.trim()) {
      alert("Label and UPI ID are required.");
      return;
    }

    const payload = {
      label: record.label.trim(),
      upi_id: record.upi_id.trim(),
      batch_name: record.batch_name || "All",
      amount: record.amount === null || Number.isNaN(Number(record.amount)) ? null : Number(record.amount),
      active: record.active,
      audience: record.audience || "all",
    };

    try {
      if (record.id === 0) await apiFetch("/admin/qrcodes", { method: "POST", body: JSON.stringify(payload) });
      else await apiFetch(`/admin/qrcodes/${record.id}`, { method: "PUT", body: JSON.stringify(payload) });
      setEditing(null);
      setAdding(false);
      load();
    } catch {
      alert("Unable to save QR payment settings.");
    }
  };

  const handleActivate = async (record: QrCodeRecord) => {
    try {
      await apiFetch(`/admin/qrcodes/${record.id}`, { method: "PUT", body: JSON.stringify({ active: true }) });
      load();
    } catch {
      alert("Unable to activate this QR.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this QR payment option?")) return;
    try {
      await apiFetch(`/admin/qrcodes/${id}`, { method: "DELETE" });
      load();
    } catch {
      alert("Unable to delete this QR.");
    }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>
      <TopBar
        title="QR Payments"
        subtitle="Manage UPI IDs and batch-wise QR payment links"
        actions={<Button onClick={()=>{setAdding(true);setEditing(null);}} style={{ height:34, background:`linear-gradient(135deg,${C.maroon},${C.maroonMid})`, color:C.cream, border:"none", borderRadius:3, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}><Plus size={13}/>Add QR</Button>}
      />
      <div style={{ flex:1, overflowY:"auto", padding:"16px 24px" }}>
        <div style={{ background:`linear-gradient(135deg, ${C.white}, ${C.parchment})`, border:`1px solid ${C.maroon}20`, borderRadius:8, padding:"18px 20px", marginBottom:18, boxShadow:`0 10px 24px ${C.maroon}10` }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:18, flexWrap:"wrap" }}>
            <div style={{ maxWidth:560 }}>
              <p style={{ fontSize:10, letterSpacing:"0.32em", color:C.bronze, textTransform:"uppercase", marginBottom:8 }}>UPI Control Center</p>
              <h3 style={{ fontFamily:"'DM Serif Display',serif", fontSize:24, color:C.deep, marginBottom:6 }}>Assign QR Payments By Batch</h3>
              <p style={{ fontSize:13, color:C.gray700, lineHeight:1.7 }}>
                Create one fallback QR for all batches or set specific UPI IDs and amounts for individual batches. Students will see the active QR automatically on the payment page.
              </p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2, minmax(120px, 1fr))", gap:10, minWidth:"min(100%, 320px)" }}>
              {[
                { label:"QR Entries", value:String(data.length) },
                { label:"Active QR", value:String(activeCount) },
                { label:"Batch Rules", value:String(data.filter((row) => row.batch_name !== "All").length) },
                { label:"Fallback Rules", value:String(data.filter((row) => row.batch_name === "All").length) },
              ].map((item) => (
                <div key={item.label} style={{ background:`${C.maroon}08`, border:`1px solid ${C.maroon}18`, borderRadius:6, padding:"12px 14px" }}>
                  <p style={{ fontSize:10, letterSpacing:"0.18em", textTransform:"uppercase", color:C.gray500, marginBottom:4 }}>{item.label}</p>
                  <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, color:C.maroon }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background:`${C.maroon}08`, border:`1px solid ${C.maroon}20`, borderRadius:6, padding:"10px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:8, fontSize:12, color:C.maroon }}>
          <AlertCircle size={14}/>Set batch to `All` for a fallback UPI ID. Mark a QR as active to make it live for students.
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:18 }}>
          {data.map((row) => (
            <Card key={row.id} style={{ background:`linear-gradient(180deg, ${C.white}, ${C.gray50})`, border:`1px solid ${row.active ? C.maroon : C.gray200}`, borderRadius:10, boxShadow:`0 14px 28px ${C.maroon}10`, overflow:"hidden" }}>
              <div style={{ height:5, background: row.active ? `linear-gradient(90deg, ${C.maroon}, ${C.bronzeLight})` : `linear-gradient(90deg, ${C.gray200}, ${C.gray100})` }} />
              <CardHeader style={{ padding:"18px 18px 10px" }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:8 }}>
                      <span style={{ padding:"4px 8px", borderRadius:999, background: row.active ? `${C.maroon}10` : C.white, border:`1px solid ${row.active ? C.maroon + "18" : C.gray200}`, fontSize:10, color:row.active ? C.maroon : C.gray700, letterSpacing:"0.16em", textTransform:"uppercase" }}>
                        {row.active ? "Active" : "Inactive"}
                      </span>
                      <span style={{ padding:"4px 8px", borderRadius:999, background:C.white, border:`1px solid ${C.gray200}`, fontSize:10, color:C.gray700, letterSpacing:"0.16em", textTransform:"uppercase" }}>
                        {row.batch_name || "All"}
                      </span>
                    </div>
                    <CardTitle style={{ fontFamily:"'DM Serif Display',serif", fontSize:18, color:C.deep }}>{row.label}</CardTitle>
                    <p style={{ fontSize:12, color:C.gray500, marginTop:6, lineHeight:1.5 }}>{row.upi_id}</p>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    {!row.active && <button onClick={()=>handleActivate(row)} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${C.maroon}20`, background:`${C.maroon}08`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.maroon }}><Check size={13}/></button>}
                    <button onClick={()=>{setEditing({...row});setAdding(false);}} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${C.gray200}`, background:C.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.gray700 }}><Edit2 size={13}/></button>
                    <button onClick={()=>handleDelete(row.id)} style={{ width:32, height:32, borderRadius:8, border:"1px solid #f4cfcf", background:"#fff8f8", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.error }}><Trash2 size={13}/></button>
                  </div>
                </div>
              </CardHeader>
              <CardContent style={{ padding:"0 18px 18px" }}>
                <Separator style={{ background:C.gray200, marginBottom:14 }}/>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:10 }}>
                {[
                    { label:"Batch", value:row.batch_name || "All" },
                    { label:"Audience", value:row.audience === "new" ? "New students" : row.audience === "existing" ? "Registered students" : "All students" },
                    { label:"Amount", value:row.amount ? `Rs. ${Number(row.amount).toLocaleString()}` : "Use batch fee" },
                    { label:"UPI ID", value:row.upi_id },
                    { label:"Status", value:row.active ? "Live now" : "Draft" },
                  ].map((item)=>(
                    <div key={item.label} style={{ background:C.white, border:`1px solid ${C.gray200}`, borderRadius:8, padding:"10px 12px" }}>
                      <p style={{ fontSize:10, letterSpacing:"0.14em", textTransform:"uppercase", color:C.gray500, marginBottom:4 }}>{item.label}</p>
                      <p style={{ fontSize:13, color:C.deep, fontWeight:600, wordBreak:"break-word" }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {editForm && (
        <Modal title={adding ? "Add New QR" : `Edit - ${editing?.label}`} onClose={()=>{setEditing(null);setAdding(false);}}>
          <FormField label="Label" value={editForm.label} onChange={v=>setEditing(e=>({...(e||blankQr), label:v} as QrCodeRecord))}/>
          <FormField label="UPI ID" value={editForm.upi_id} onChange={v=>setEditing(e=>({...(e||blankQr), upi_id:v} as QrCodeRecord))}/>
          <FormField label="Batch" value={editForm.batch_name} onChange={v=>setEditing(e=>({...(e||blankQr), batch_name:v} as QrCodeRecord))} options={batchOptions}/>
          <FormField label="Student Type" value={editForm.audience} onChange={v=>setEditing(e=>({...(e||blankQr), audience:v as QrCodeRecord["audience"]} as QrCodeRecord))} options={["all","new","existing"]}/>
          <FormField label="Amount (optional)" value={editForm.amount === null ? "" : String(editForm.amount)} onChange={v=>setEditing(e=>({...(e||blankQr), amount:v === "" ? null : Number(v)} as QrCodeRecord))} type="number"/>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12, padding:"10px 12px", background:C.gray50, border:`1px solid ${C.gray200}`, borderRadius:6 }}>
            <input
              id="qr-active"
              type="checkbox"
              checked={editForm.active}
              onChange={e=>setEditing(prev=>({...(prev||blankQr), active:e.target.checked} as QrCodeRecord))}
            />
            <Label htmlFor="qr-active" style={{ fontSize:12, color:C.deep }}>Make this QR active immediately</Label>
          </div>
          <div style={{ display:"flex", gap:10, marginTop:8 }}>
            <Button onClick={()=>{setEditing(null);setAdding(false);}} style={{ flex:1, height:38, background:C.white, border:`1px solid ${C.gray200}`, color:C.gray700, borderRadius:3, cursor:"pointer" }}>Cancel</Button>
            <Button onClick={()=>editForm&&handleSave(editForm)} style={{ flex:1, height:38, background:`linear-gradient(135deg,${C.maroon},${C.maroonMid})`, color:C.cream, border:"none", borderRadius:3, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}><Save size={13}/>Save QR</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ImportPage() {
  const [preview, setPreview]   = useState<Student[]>([]);
  const [errors, setErrors]     = useState<string[]>([]);
  const [file, setFile]         = useState<File|null>(null);
  const [importing, setImporting] = useState(false);
  const [success, setSuccess]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    setFile(f); setPreview([]); setErrors([]); setSuccess(false);
    const formData = new FormData();
    formData.append("file", f);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API}/admin/import/preview`, { method:"POST", headers:{ Authorization:`Bearer ${token}` }, body: formData });
      const d = await res.json();
      if (d.success) { setPreview(d.records); setErrors(d.errors||[]); }
      else setErrors([d.message||"Parse failed"]);
    } catch { setErrors(["Failed to parse file. Check format."]); }
  };

  const handleImport = async () => {
    if (!preview.length) return;
    setImporting(true);
    try {
      const d = await apiFetch("/admin/import/confirm", { method:"POST", body: JSON.stringify({ records: preview }) });
      if (d.success) { setSuccess(true); setPreview([]); setFile(null); }
      else setErrors([d.message||"Import failed"]);
    } catch { setErrors(["Import failed"]); }
    setImporting(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>
      <TopBar title="Import Students" subtitle="Excel/CSV నుండి విద్యార్థులను దిగుమతి చేయండి"/>
      <div style={{ flex:1, overflowY:"auto", padding:"24px" }}>
        {success && (
          <div style={{ background:"#dcf4e8", border:"1px solid #aaddbb", borderRadius:5, padding:"14px 18px", marginBottom:20, display:"flex", alignItems:"center", gap:10, color:C.success }}>
            <CheckCircle2 size={18}/><span style={{ fontSize:14, fontWeight:500 }}>Import successful! {preview.length} records imported.</span>
          </div>
        )}

        {/* Upload zone */}
        <Card style={{ background:C.white, border:`2px dashed ${C.maroon}30`, borderRadius:6, marginBottom:20 }}>
          <CardContent style={{ padding:40, textAlign:"center" }}>
            <Upload size={36} style={{ color:C.maroon, opacity:0.5, marginBottom:12 }}/>
            <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:17, color:C.deep, marginBottom:6 }}>Upload Excel or CSV File</p>
            <p style={{ fontSize:12, color:C.gray500, marginBottom:20 }}>Supported columns: Name, Phone, Email, Course, Batch, Payment Status</p>
            <input ref={fileRef} type="file" accept=".xlsx,.csv,.xls" style={{ display:"none" }} onChange={e=>e.target.files?.[0]&&handleFile(e.target.files[0])}/>
            <Button onClick={()=>fileRef.current?.click()} style={{ height:38, background:`linear-gradient(135deg,${C.maroon},${C.maroonMid})`, color:C.cream, border:"none", borderRadius:3, fontSize:13, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6, padding:"0 24px" }}>
              <Upload size={14}/>Choose File
            </Button>
            {file && <p style={{ fontSize:12, color:C.maroonLight, marginTop:10 }}>📄 {file.name}</p>}
          </CardContent>
        </Card>

        {/* Column mapping guide */}
        <Card style={{ background:C.white, border:`1px solid ${C.gray200}`, borderRadius:6, marginBottom:20 }}>
          <CardHeader style={{ padding:"14px 18px 10px" }}>
            <CardTitle style={{ fontFamily:"'DM Serif Display',serif", fontSize:14, color:C.deep }}>Expected Excel Columns</CardTitle>
          </CardHeader>
          <CardContent style={{ padding:"0 18px 16px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:8 }}>
              {[["name","Student Name"],["phone","Phone"],["email","Email"],["course","Course"],["batch","Batch"],["paymentStatus","Payment Status"]].map(([k,l])=>(
                <div key={k} style={{ padding:"8px 12px", background:C.gray50, border:`1px solid ${C.gray200}`, borderRadius:4 }}>
                  <p style={{ fontSize:11, letterSpacing:"0.1em", color:C.gray500, textTransform:"uppercase" }}>{l}</p>
                  <p style={{ fontSize:12, color:C.deep, fontWeight:500, marginTop:2 }}>{k}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Errors */}
        {errors.length>0&&(
          <div style={{ background:"#fde8e8", border:"1px solid #f0bbbb", borderRadius:5, padding:"14px 18px", marginBottom:20 }}>
            <p style={{ fontSize:13, fontWeight:600, color:C.error, marginBottom:6, display:"flex", alignItems:"center", gap:6 }}><AlertCircle size={15}/>Validation Issues</p>
            {errors.map((e,i)=><p key={i} style={{ fontSize:12, color:C.error, marginBottom:2 }}>• {e}</p>)}
          </div>
        )}

        {/* Preview table */}
        {preview.length>0&&(
          <Card style={{ background:C.white, border:`1px solid ${C.gray200}`, borderRadius:6, overflow:"hidden" }}>
            <CardHeader style={{ padding:"14px 18px 12px", borderBottom:`1px solid ${C.gray100}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <CardTitle style={{ fontFamily:"'DM Serif Display',serif", fontSize:14, color:C.deep }}>Preview — {preview.length} records</CardTitle>
              <Button onClick={handleImport} disabled={importing} style={{ height:34, background:`linear-gradient(135deg,${C.maroon},${C.maroonMid})`, color:C.cream, border:"none", borderRadius:3, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                {importing?<RefreshCw size={12} style={{animation:"spin 1s linear infinite"}}/>:<Check size={12}/>}Confirm Import
              </Button>
            </CardHeader>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr style={{ background:C.gray50 }}>
                  {["#","Name","Phone","Email","Course","Batch","Payment Status"].map(h=>(
                    <th key={h} style={{ padding:"9px 13px", textAlign:"left", fontSize:11, letterSpacing:"0.08em", textTransform:"uppercase", color:C.gray500, borderBottom:`1px solid ${C.gray200}` }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {preview.slice(0,20).map((r,i)=>(
                    <tr key={i} style={{ borderBottom:`1px solid ${C.gray100}`, background:i%2===0?C.white:C.gray50 }}>
                      <td style={{ padding:"9px 13px", fontSize:12, color:C.gray500 }}>{i+1}</td>
                      <td style={{ padding:"9px 13px", fontSize:12, color:C.deep, fontWeight:500 }}>{r.name}</td>
                      <td style={{ padding:"9px 13px", fontSize:12, color:C.gray700 }}>{r.phone}</td>
                      <td style={{ padding:"9px 13px", fontSize:12, color:C.gray700 }}>{r.email||"—"}</td>
                      <td style={{ padding:"9px 13px", fontSize:12, color:C.gray700 }}>{r.course}</td>
                      <td style={{ padding:"9px 13px", fontSize:12, color:C.gray700 }}>{r.batch}</td>
                      <td style={{ padding:"9px 13px" }}><StatusBadge status={r.paymentStatus||"Pending"}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length>20&&<p style={{ padding:"10px 16px", fontSize:12, color:C.gray500 }}>...and {preview.length-20} more records</p>}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
export function LegacySettingsPage() {
  const [pwd, setPwd]   = useState({ current:"", newPw:"", confirm:"" });
  const [msg, setMsg]   = useState("");
  const [email, setEmail] = useState({ adminEmail:"", smtpUser:"", smtpPass:"" });

  const handlePwChange = async () => {
    if (pwd.newPw !== pwd.confirm) { setMsg("Passwords don't match."); return; }
    try {
      const d = await apiFetch("/admin/settings/password", { method:"POST", body:JSON.stringify({ current:pwd.current, newPassword:pwd.newPw }) });
      setMsg(d.success ? "✓ Password updated successfully." : (d.message||"Failed."));
    } catch { setMsg("Failed."); }
  };

  const handleEmailSave = async () => {
    try {
      const d = await apiFetch("/admin/settings/email", { method:"POST", body:JSON.stringify(email) });
      setMsg(d.success ? "✓ Email settings saved." : "Failed.");
    } catch { setMsg("Failed."); }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>
      <TopBar title="Settings" subtitle="సెట్టింగులు"/>
      <div style={{ flex:1, overflowY:"auto", padding:"24px" }}>
        {msg && <div style={{ background: msg.startsWith("✓") ? "#dcf4e8" : "#fde8e8", border:`1px solid ${msg.startsWith("✓")?"#aaddbb":"#f0bbbb"}`, borderRadius:5, padding:"10px 16px", marginBottom:20, fontSize:13, color: msg.startsWith("✓") ? C.success : C.error }}>{msg}</div>}

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(360px,1fr))", gap:20 }}>
          <Card style={{ background:C.white, border:`1.5px solid ${C.gray200}`, borderRadius:6 }}>
            <CardHeader style={{ padding:"16px 20px 12px", borderBottom:`1px solid ${C.gray100}` }}>
              <CardTitle style={{ fontFamily:"'DM Serif Display',serif", fontSize:15, color:C.deep }}>Change Password</CardTitle>
            </CardHeader>
            <CardContent style={{ padding:"20px" }}>
              <FormField label="Current Password" value={pwd.current} onChange={v=>setPwd(p=>({...p,current:v}))} type="password"/>
              <FormField label="New Password" value={pwd.newPw} onChange={v=>setPwd(p=>({...p,newPw:v}))} type="password"/>
              <FormField label="Confirm New Password" value={pwd.confirm} onChange={v=>setPwd(p=>({...p,confirm:v}))} type="password"/>
              <Button onClick={handlePwChange} style={{ width:"100%", height:38, background:`linear-gradient(135deg,${C.maroon},${C.maroonMid})`, color:C.cream, border:"none", borderRadius:3, fontSize:13, cursor:"pointer", marginTop:4 }}>Update Password</Button>
            </CardContent>
          </Card>

          <Card style={{ background:C.white, border:`1.5px solid ${C.gray200}`, borderRadius:6 }}>
            <CardHeader style={{ padding:"16px 20px 12px", borderBottom:`1px solid ${C.gray100}` }}>
              <CardTitle style={{ fontFamily:"'DM Serif Display',serif", fontSize:15, color:C.deep }}>Email & Notifications</CardTitle>
            </CardHeader>
            <CardContent style={{ padding:"20px" }}>
              <FormField label="Admin Email" value={email.adminEmail} onChange={v=>setEmail(p=>({...p,adminEmail:v}))} type="email"/>
              <FormField label="SMTP Username" value={email.smtpUser} onChange={v=>setEmail(p=>({...p,smtpUser:v}))}/>
              <FormField label="SMTP App Password" value={email.smtpPass} onChange={v=>setEmail(p=>({...p,smtpPass:v}))} type="password"/>
              <Button onClick={handleEmailSave} style={{ width:"100%", height:38, background:`linear-gradient(135deg,${C.maroon},${C.maroonMid})`, color:C.cream, border:"none", borderRadius:3, fontSize:13, cursor:"pointer", marginTop:4 }}>Save Email Settings</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  const [pwd, setPwd] = useState({ current:"", newPw:"", confirm:"" });
  const [msg, setMsg] = useState("");
  const [email, setEmail] = useState({ adminEmail:"", smtpUser:"", smtpPass:"" });
  const [instagram, setInstagram] = useState({
    instagramVerifyToken: "",
    instagramPageAccessToken: "",
    instagramGraphApiVersion: "v22.0",
    instagramPaymentLink: "",
    instagramRegistrationFormUrl: "",
    instagramPrivacyPolicyUrl: "",
    instagramFollowupNote: "30th of this month",
  });
  const [razorpay, setRazorpay] = useState({
    razorpayKeyId: "",
    razorpayKeySecret: "",
    razorpayWebhookSecret: "",
  });

  useEffect(() => {
    apiFetch("/settings")
      .then((data) => {
        setEmail({
          adminEmail: data.adminEmail || "",
          smtpUser: data.smtpUser || "",
          smtpPass: data.smtpPass || "",
        });
        setInstagram({
          instagramVerifyToken: data.instagramVerifyToken || "ananadamayi_verify_token",
          instagramPageAccessToken: data.instagramPageAccessToken || "",
          instagramGraphApiVersion: data.instagramGraphApiVersion || "v22.0",
          instagramPaymentLink: data.instagramPaymentLink || "",
          instagramRegistrationFormUrl: data.instagramRegistrationFormUrl || "",
          instagramPrivacyPolicyUrl: data.instagramPrivacyPolicyUrl || "",
          instagramFollowupNote: data.instagramFollowupNote || "30th of this month",
        });
        setRazorpay({
          razorpayKeyId: data.razorpayKeyId || "",
          razorpayKeySecret: data.razorpayKeySecret || "",
          razorpayWebhookSecret: data.razorpayWebhookSecret || "",
        });
      })
      .catch(() => {});
  }, []);

  const handlePwChange = async () => {
    if (pwd.newPw !== pwd.confirm) {
      setMsg("Passwords don't match.");
      return;
    }
    try {
      const d = await apiFetch("/admin/password", { method:"POST", body:JSON.stringify({ current:pwd.current, newPassword:pwd.newPw }) });
      setMsg(d.ok ? "✓ Password updated successfully." : (d.message || "Failed."));
    } catch {
      setMsg("Failed.");
    }
  };

  const handleEmailSave = async () => {
    try {
      await apiFetch("/admin/settings", { method:"PUT", body:JSON.stringify(email) });
      setMsg("✓ Email settings saved.");
    } catch {
      setMsg("Failed.");
    }
  };

  const handleInstagramSave = async () => {
    try {
      await apiFetch("/admin/settings", { method:"PUT", body:JSON.stringify(instagram) });
      setMsg("✓ Instagram settings saved.");
    } catch {
      setMsg("Failed.");
    }
  };

  const isSuccess = msg.startsWith("✓");


  const handleRazorpaySave = async () => {
    try {
      await apiFetch("/admin/settings", { method:"PUT", body:JSON.stringify(razorpay) });
      setMsg("✓ Razorpay settings saved.");
    } catch {
      setMsg("Failed.");
    }
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>
      <TopBar title="Settings" subtitle="సెట్టింగులు"/>
      <div style={{ flex:1, overflowY:"auto", padding:"24px" }}>
        {msg && <div style={{ background: isSuccess ? "#dcf4e8" : "#fde8e8", border:`1px solid ${isSuccess ? "#aaddbb" : "#f0bbbb"}`, borderRadius:5, padding:"10px 16px", marginBottom:20, fontSize:13, color: isSuccess ? C.success : C.error }}>{msg}</div>}

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(360px,1fr))", gap:20 }}>
          <Card style={{ background:C.white, border:`1.5px solid ${C.gray200}`, borderRadius:6 }}>
            <CardHeader style={{ padding:"16px 20px 12px", borderBottom:`1px solid ${C.gray100}` }}>
              <CardTitle style={{ fontFamily:"'DM Serif Display',serif", fontSize:15, color:C.deep }}>Change Password</CardTitle>
            </CardHeader>
            <CardContent style={{ padding:"20px" }}>
              <FormField label="Current Password" value={pwd.current} onChange={v=>setPwd(p=>({...p,current:v}))} type="password"/>
              <FormField label="New Password" value={pwd.newPw} onChange={v=>setPwd(p=>({...p,newPw:v}))} type="password"/>
              <FormField label="Confirm New Password" value={pwd.confirm} onChange={v=>setPwd(p=>({...p,confirm:v}))} type="password"/>
              <Button onClick={handlePwChange} style={{ width:"100%", height:38, background:`linear-gradient(135deg,${C.maroon},${C.maroonMid})`, color:C.cream, border:"none", borderRadius:3, fontSize:13, cursor:"pointer", marginTop:4 }}>Update Password</Button>
            </CardContent>
          </Card>

          <Card style={{ background:C.white, border:`1.5px solid ${C.gray200}`, borderRadius:6 }}>
            <CardHeader style={{ padding:"16px 20px 12px", borderBottom:`1px solid ${C.gray100}` }}>
              <CardTitle style={{ fontFamily:"'DM Serif Display',serif", fontSize:15, color:C.deep }}>Email & Notifications</CardTitle>
            </CardHeader>
            <CardContent style={{ padding:"20px" }}>
              <FormField label="Admin Email" value={email.adminEmail} onChange={v=>setEmail(p=>({...p,adminEmail:v}))} type="email"/>
              <FormField label="SMTP Username" value={email.smtpUser} onChange={v=>setEmail(p=>({...p,smtpUser:v}))}/>
              <FormField label="SMTP App Password" value={email.smtpPass} onChange={v=>setEmail(p=>({...p,smtpPass:v}))} type="password"/>
              <Button onClick={handleEmailSave} style={{ width:"100%", height:38, background:`linear-gradient(135deg,${C.maroon},${C.maroonMid})`, color:C.cream, border:"none", borderRadius:3, fontSize:13, cursor:"pointer", marginTop:4 }}>Save Email Settings</Button>
            </CardContent>
          </Card>

          <Card style={{ background:C.white, border:`1.5px solid ${C.gray200}`, borderRadius:6 }}>
            <CardHeader style={{ padding:"16px 20px 12px", borderBottom:`1px solid ${C.gray100}` }}>
              <CardTitle style={{ fontFamily:"'DM Serif Display',serif", fontSize:15, color:C.deep }}>Instagram Webhook Settings</CardTitle>
            </CardHeader>
            <CardContent style={{ padding:"20px" }}>
              <FormField label="Verify Token" value={instagram.instagramVerifyToken} onChange={v=>setInstagram(p=>({...p,instagramVerifyToken:v}))}/>
              <FormField label="Page Access Token" value={instagram.instagramPageAccessToken} onChange={v=>setInstagram(p=>({...p,instagramPageAccessToken:v}))} type="password"/>
              <FormField label="Graph API Version" value={instagram.instagramGraphApiVersion} onChange={v=>setInstagram(p=>({...p,instagramGraphApiVersion:v}))}/>
              <FormField label="Payment Link" value={instagram.instagramPaymentLink} onChange={v=>setInstagram(p=>({...p,instagramPaymentLink:v}))}/>
              <FormField label="Registration Form URL" value={instagram.instagramRegistrationFormUrl} onChange={v=>setInstagram(p=>({...p,instagramRegistrationFormUrl:v}))}/>
              <FormField label="Privacy Policy URL" value={instagram.instagramPrivacyPolicyUrl} onChange={v=>setInstagram(p=>({...p,instagramPrivacyPolicyUrl:v}))}/>
              <FormField label="Follow-up Note" value={instagram.instagramFollowupNote} onChange={v=>setInstagram(p=>({...p,instagramFollowupNote:v}))}/>
              <Button onClick={handleInstagramSave} style={{ width:"100%", height:38, background:`linear-gradient(135deg,${C.maroon},${C.maroonMid})`, color:C.cream, border:"none", borderRadius:3, fontSize:13, cursor:"pointer", marginTop:4 }}>Save Instagram Settings</Button>
            </CardContent>
          </Card>

          <Card style={{ background:C.white, border:`1.5px solid ${C.gray200}`, borderRadius:6 }}>
            <CardHeader style={{ padding:"16px 20px 12px", borderBottom:`1px solid ${C.gray100}` }}>
              <CardTitle style={{ fontFamily:"'DM Serif Display',serif", fontSize:15, color:C.deep }}>Razorpay Settings</CardTitle>
            </CardHeader>
            <CardContent style={{ padding:"20px" }}>
              <FormField label="Razorpay Key ID" value={razorpay.razorpayKeyId} onChange={v=>setRazorpay(p=>({...p,razorpayKeyId:v}))}/>
              <FormField label="Razorpay Key Secret" value={razorpay.razorpayKeySecret} onChange={v=>setRazorpay(p=>({...p,razorpayKeySecret:v}))} type="password"/>
              <FormField label="Razorpay Webhook Secret" value={razorpay.razorpayWebhookSecret} onChange={v=>setRazorpay(p=>({...p,razorpayWebhookSecret:v}))} type="password"/>
              <Button onClick={handleRazorpaySave} style={{ width:"100%", height:38, background:`linear-gradient(135deg,${C.maroon},${C.maroonMid})`, color:C.cream, border:"none", borderRadius:3, fontSize:13, cursor:"pointer", marginTop:4 }}>Save Razorpay Settings</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── ROOT ADMIN APP ────────────────────────────────────────────────────────────
export default function AdminApp() {
  const [token, setToken]       = useState<string|null>(localStorage.getItem("adminToken"));
  const [page, setPage]         = useState<AdminPage>("batches");
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { localStorage.removeItem("adminToken"); setToken(null); };

  if (!token) return <LoginPage onLogin={setToken}/>;

  const pageMap: Record<AdminPage, React.ReactNode> = {
    dashboard:  <Dashboard/>,
    admissions: <AdmissionsPage/>,
    bookings:   <BookingsPage/>,
    payments:   <PaymentsPage/>,
    batches:    <BatchSlotsPage/>,
    qr:         <QrPaymentsPage/>,
    import:     <ImportPage/>,
    settings:   <SettingsPage/>,
  };

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", fontFamily:"'Manrope','Segoe UI',sans-serif", background:C.gray100 }}>
      <style>{`
        input,textarea,select{color:#111111!important;} input::placeholder,textarea::placeholder{color:rgba(17,17,17,0.42)!important;}
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:${C.gray100};}
        ::-webkit-scrollbar-thumb{background:${C.maroon}28;border-radius:3px;}
        input:focus,select:focus{border-color:${C.maroon}55!important;outline:none!important;box-shadow:0 0 0 2px ${C.maroon}10!important;}
        @keyframes spin{to{transform:rotate(360deg);}}
        button:disabled{opacity:0.5;cursor:not-allowed!important;}
      `}</style>

      <Sidebar active={page} onNav={setPage} onLogout={handleLogout} collapsed={collapsed} onToggle={()=>setCollapsed(p=>!p)}/>

      <main style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:C.gray100 }}>
        {pageMap[page]}
      </main>
    </div>
  );
}

