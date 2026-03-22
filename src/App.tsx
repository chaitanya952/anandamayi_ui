import { useState, useEffect, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import QRCode from "qrcode";
import natarajImage from "@/assets/nataraj.png";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Globe, Monitor, Plane, MapPin, Building2, Phone, Mail,
  CheckCircle2, ChevronRight, Calendar, CreditCard,
  Users, FileText, AlertCircle, Menu, X,
  Flower2, BookOpen, Heart, MessageCircle, Loader2, Sparkles
} from "lucide-react";

// -- Color Palette (extracted from your logo) ----------------------------------
const C = {
  parchment:   "#F2D9B8",   // warm sandy background
  sandLight:   "#F7EDD8",   // lighter parchment
  sand:        "#EAC99A",   // mid sand
  cream:       "#FBF3E8",   // near-white cream
  white:       "#FFFDF8",
  maroon:      "#6B1A2A",   // deep maroon (from logo text)
  maroonMid:   "#8B2535",
  maroonLight: "#A84050",
  bronze:      "#7A4828",   // warm brown
  bronzeLight: "#B06838",
  deep:        "#3D0A12",   // near-black maroon
} as const;

// -- Types ---------------------------------------------------------------------
interface Batch {
  id: number; name: string; teluguName: string; fee: number;
  Icon: React.ElementType; schedule: string;
  mode: string; tag: string; teacher?: string; danceIcon: React.ReactNode;
}
interface BatchApi {
  id: number;
  batch_name: string;
  type: string;
  trainer?: string;
  days: string;
  start_time: string;
  end_time: string;
  fee: number | string;
  mode: string;
}
interface Message { id: string; text: string; from: "bot"|"user"; extra?: string; }
interface FormData { name: string; accountName: string; phone: string; email: string; batch: string; transactionId: string; }
interface StudentSession {
  studentId?: number;
  name: string;
  phone: string;
  email?: string;
  batch: Batch | null;
  studentType?: StudentType;
}
interface ActiveQrCode {
  id?: number;
  label?: string;
  upi_id?: string;
  batch_name?: string;
  amount?: number | string | null;
  active?: boolean;
  audience?: "all" | "new" | "existing";
}
type Tab = "Home"|"Batches"|"Register"|"Payment"|"Contact";
type Step = "welcome"|"batch_select"|"guidelines"|"student_type"|"form";
type StudentType = "new"|"existing";

// -- Custom SVG Dance Icons ----------------------------------------------------
const BharatanatyamIcon = ({ size=32, color=C.maroon }:{size?:number;color?:string}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="6.5" r="3.2" fill={color} opacity="0.9"/>
    {/* Crown */}
    <path d="M17.5 4.5 L20 2 L22.5 4.5" stroke={color} strokeWidth="1" strokeLinecap="round"/>
    {/* Torso */}
    <path d="M20 9.7 L19 21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    {/* Left arm raised with bent wrist */}
    <path d="M19.5 12 L12 7.5 L9.5 5" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.5 5 L8 6.5" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    {/* Right arm extended */}
    <path d="M19.5 12 L28 15.5 L31 13.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M31 13.5 L32.5 15" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    {/* Left leg (aramandi � wide stance bent) */}
    <path d="M19 21 L13.5 28 L11 34.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Right leg extended */}
    <path d="M19 21 L25.5 27.5 L28.5 32.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Ankle bells */}
    <circle cx="11" cy="34.5" r="1.3" fill={color}/>
    <circle cx="28.5" cy="32.5" r="1.3" fill={color}/>
    {/* Mudra dots */}
    <circle cx="8" cy="6.5" r="1" fill={color} opacity="0.7"/>
    <circle cx="32.5" cy="15" r="1" fill={color} opacity="0.7"/>
  </svg>
);

const KuchipudiIcon = ({ size=32, color=C.maroon }:{size?:number;color?:string}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="21" cy="6" r="3.2" fill={color} opacity="0.9"/>
    {/* Mukuta (crown) */}
    <path d="M18.5 3.8 L21 1 L23.5 3.8" stroke={color} strokeWidth="1" strokeLinecap="round"/>
    <path d="M19.5 3.2 L21 1.5 L22.5 3.2" stroke={color} strokeWidth="0.7" strokeLinecap="round"/>
    {/* Torso lean */}
    <path d="M21 9.2 L19 20.5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    {/* Left arm out curved */}
    <path d="M20.5 11.5 L11 9.5 L8 11" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 11 L6.5 9.5" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    {/* Right arm raised gracefully */}
    <path d="M20.5 11.5 L28 6 L30 4" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M30 4 L31.5 5.5" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    {/* Standing leg */}
    <path d="M19 20.5 L17 29 L15.5 37" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Raised leg tarangam */}
    <path d="M19 20.5 L25.5 24.5 L29.5 21" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Ankle bells */}
    <circle cx="15.5" cy="37" r="1.3" fill={color}/>
    {/* Tarangam plate */}
    <ellipse cx="21" cy="2.5" rx="3.5" ry="0.9" stroke={color} strokeWidth="0.8" fill="none" opacity="0.45"/>
    {/* Mudra dots */}
    <circle cx="6.5" cy="9.5" r="1" fill={color} opacity="0.7"/>
    <circle cx="31.5" cy="5.5" r="1" fill={color} opacity="0.7"/>
  </svg>
);

const NatarajaLogo = ({ size=48, color=C.maroon }:{size?:number;color?:string}) => (
  <svg width={size} height={size} viewBox="0 0 52 52" fill="none">
    {/* Prabhavali ring */}
    <circle cx="26" cy="26" r="22" stroke={color} strokeWidth="1.3" opacity="0.25"/>
    <circle cx="26" cy="26" r="18" stroke={color} strokeWidth="0.6" opacity="0.15"/>
    {/* Flame petals */}
    {[0,30,60,90,120,150,180,210,240,270,300,330].map((a,i)=>{
      const rad=(a*Math.PI)/180;
      return <ellipse key={i} cx={26+20*Math.cos(rad)} cy={26+20*Math.sin(rad)} rx="2.8" ry="1.1"
        transform={`rotate(${a} ${26+20*Math.cos(rad)} ${26+20*Math.sin(rad)})`} fill={color} opacity="0.3"/>;
    })}
    {/* Head */}
    <circle cx="26" cy="11.5" r="3.8" fill={color} opacity="0.85"/>
    {/* Crown */}
    <path d="M23 9.5 L26 6.5 L29 9.5" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    {/* Torso */}
    <path d="M26 15.3 L26 27" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
    {/* Upper left arm raised */}
    <path d="M26 17.5 L17 12 L14 9" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    {/* Upper right arm */}
    <path d="M26 17.5 L35 21" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    {/* Lower left arm */}
    <path d="M26 20 L16 23" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    {/* Lower right arm */}
    <path d="M26 20 L36 16" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    {/* Standing leg */}
    <path d="M26 27 L23 35 L21 43" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    {/* Raised leg */}
    <path d="M26 27 L33 32 L37 29" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    {/* Ankle bell */}
    <circle cx="21" cy="43" r="1.5" fill={color}/>
    {/* Mudra tips */}
    <circle cx="14" cy="9" r="1.2" fill={color}/>
    <circle cx="35" cy="21" r="1.2" fill={color}/>
    {/* Lotus base */}
    <ellipse cx="22" cy="44.5" rx="5" ry="1.8" fill={color} opacity="0.18"/>
  </svg>
);

// Mandala background
const MandalaBg = ({ size=560, op=0.07 }:{size?:number;op?:number}) => (
  <svg width={size} height={size} viewBox="0 0 560 560" style={{opacity:op}}>
    {[28,55,85,115,148,180,210].map((r,i)=>(
      <circle key={r} cx="280" cy="280" r={r} fill="none" stroke={C.maroon} strokeWidth={i%2===0?1:0.5}/>
    ))}
    {Array.from({length:16},(_,i)=>{
      const a=(i*360/16)*Math.PI/180;
      return <line key={i} x1="280" y1="280" x2={280+210*Math.cos(a)} y2={280+210*Math.sin(a)} stroke={C.maroon} strokeWidth="0.5"/>;
    })}
    {Array.from({length:8},(_,i)=>{
      const a=(i*45)*Math.PI/180;
      const cx=280+100*Math.cos(a),cy=280+100*Math.sin(a);
      return <ellipse key={i} cx={cx} cy={cy} rx="20" ry="7" fill="none" stroke={C.maroon} strokeWidth="0.6" transform={`rotate(${i*45} ${cx} ${cy})`}/>;
    })}
    {Array.from({length:12},(_,i)=>{
      const a=(i*30)*Math.PI/180;
      return <circle key={i} cx={280+170*Math.cos(a)} cy={280+170*Math.sin(a)} r="5" fill="none" stroke={C.maroon} strokeWidth="0.6"/>;
    })}
    {Array.from({length:8},(_,i)=>{
      const a=(i*45+22.5)*Math.PI/180;
      return <path key={i} d={`M ${280+130*Math.cos(a)} ${280+130*Math.sin(a)} Q 280 280 ${280+130*Math.cos(a+(22.5*Math.PI/180))} ${280+130*Math.sin(a+(22.5*Math.PI/180))}`} fill={C.maroon} opacity="0.12"/>;
    })}
  </svg>
);

// Scroll corner ornament
const Corner = ({ flip=false }:{flip?:boolean}) => (
  <svg width="64" height="64" viewBox="0 0 64 64" style={{transform:flip?"scaleX(-1)":"none",opacity:0.3}}>
    <path d="M6 6 Q6 32 32 32 Q58 32 58 58" stroke={C.maroon} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M6 16 Q11 11 16 6" stroke={C.maroon} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    <circle cx="6" cy="6" r="3" stroke={C.maroon} strokeWidth="1.2" fill="none"/>
    <circle cx="58" cy="58" r="3" stroke={C.maroon} strokeWidth="1.2" fill="none"/>
  </svg>
);

// -- Data ----------------------------------------------------------------------
export const FALLBACK_BATCHES: Batch[] = [
  { id:1, name:"Online Weekend", teluguName:"???????? ???????", fee:2500, Icon:Monitor,   schedule:"Sat & Sun",     mode:"Online",        tag:"Popular",       danceIcon:<BharatanatyamIcon size={30}/> },
  { id:2, name:"Online Weekday", teluguName:"???????? ???????",  fee:2500, Icon:Globe,     schedule:"Mon, Fri",     mode:"Online",        tag:"Flexible",      danceIcon:<KuchipudiIcon size={30}/> },
  { id:3, name:"Traya Abroad",   teluguName:"???? ??????",        fee:5000, Icon:Plane,     schedule:"Flexible",      mode:"Hybrid",        tag:"Premium",       danceIcon:<BharatanatyamIcon size={30}/> },
  { id:4, name:"Traya India",    teluguName:"???? ?????",          fee:3200, Icon:MapPin,    schedule:"Tue, Thu, Sat", mode:"Offline",       tag:"Intensive",     danceIcon:<KuchipudiIcon size={30}/> },
  { id:5, name:"Offline",        teluguName:"????????",            fee:1500, Icon:Building2, schedule:"Mon, Wed, Fri", mode:"In-Person",     tag:"Best Value",    danceIcon:<BharatanatyamIcon size={30}/> },
  { id:6, name:"Abroad",         teluguName:"?????? ??????",       fee:4000, Icon:Globe,     schedule:"Weekends",      mode:"International", tag:"International", danceIcon:<KuchipudiIcon size={30}/> },
];

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const GUIDELINES = [
  "???????? ????? ????????? ????? ?????? � Attend classes regularly; inform in advance if unable.",
  "????????? ???? ???????????? ????? ???????? ???????? � Wear appropriate dance attire.",
  "?????? ????? ???????????? ?????????? � Respect the Guru and fellow students at all times.",
  "?????? ???? ????? ????? ??????????? � Complete course fee payment by the first day.",
  "?????? ??????? ????????? ???????? ???????? � No recording of sessions without prior permission.",
  "??????? ???? ?????? ???? ?????? � Practice at home between sessions for best progress.",
  "?????? ????????? ????????? ?????????? � Course materials remain property of Anandamayi.",
];

// -- Helpers -------------------------------------------------------------------
async function apiPost(ep: string, data: unknown) {
  try {
    const r=await fetch(`${API}/${ep}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
    const json = await r.json().catch(()=>({}));
    return { ok:r.ok, status:r.status, ...json };
  } catch { return { ok:false, status:500, error:"Unable to reach server" }; }
}
async function apiGet<T>(ep: string): Promise<T> {
  const r = await fetch(`${API}/${ep}`);
  if (!r.ok) throw new Error("Failed to fetch");
  return r.json() as Promise<T>;
}

function buildUpiPaymentLink({
  upiId,
  amount,
  batchName,
}: {
  upiId: string;
  amount: number;
  batchName: string;
}) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: "Anandamayi Nrityalaya",
    tn: `${batchName} fee payment`,
    am: amount.toFixed(2),
    cu: "INR",
  });
  return `upi://pay?${params.toString()}`;
}

function titleCase(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function pickBatchIcon(mode: string) {
  const upperMode = mode.toUpperCase();
  if (upperMode === "ONLINE") return { Icon: Monitor, danceIcon: <KuchipudiIcon size={30}/> };
  if (upperMode === "OFFLINE") return { Icon: Building2, danceIcon: <BharatanatyamIcon size={30}/> };
  if (upperMode === "HYBRID") return { Icon: Globe, danceIcon: <KuchipudiIcon size={30}/> };
  return { Icon: Globe, danceIcon: <BharatanatyamIcon size={30}/> };
}

function mapBatchFromApi(batch: BatchApi): Batch {
  const visuals = pickBatchIcon(batch.mode || "ONLINE");
  return {
    id: batch.id,
    name: batch.batch_name,
    teluguName: batch.batch_name,
    fee: Number(batch.fee || 0),
    Icon: visuals.Icon,
    schedule: batch.days || "Schedule to be announced",
    mode: titleCase(batch.mode || "ONLINE"),
    tag: titleCase(batch.type || "POPULAR"),
    teacher: String(batch.trainer || "").trim(),
    danceIcon: visuals.danceIcon,
  };
}

// -- Ornament Divider ----------------------------------------------------------
function OrnamentDivider() {
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,margin:"14px 0"}}>
      <div style={{height:1,flex:1,background:`linear-gradient(to right,transparent,${C.maroon}45)`}}/>
      <Flower2 size={13} style={{color:C.maroon,opacity:0.5}}/>
      <div style={{height:1,flex:1,background:`linear-gradient(to left,transparent,${C.maroon}45)`}}/>
    </div>
  );
}

// -- Navbar --------------------------------------------------------------------
const TABS: Tab[] = ["Home","Batches","Register","Contact"];

function NavBar({ active, set }:{active:Tab;set:(t:Tab)=>void}) {
  const [open, setOpen] = useState(false);
  return (
    <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:50,padding:"12px 16px 0",pointerEvents:"none"}}>
      <div style={{maxWidth:1120,margin:"0 auto",padding:"0 1.25rem",display:"flex",alignItems:"center",justifyContent:"space-between",height:76,background:"linear-gradient(180deg, rgba(255,253,248,0.96), rgba(247,237,216,0.93))",backdropFilter:"blur(18px)",border:`1px solid ${C.maroon}18`,borderRadius:24,boxShadow:`0 14px 40px ${C.maroon}12`,pointerEvents:"auto"}}>
        {/* Brand */}
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:54,height:54,borderRadius:"50%",border:`1.5px solid ${C.maroon}32`,background:`radial-gradient(circle at 30% 30%, ${C.parchment}, ${C.cream})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`inset 0 1px 0 rgba(255,255,255,0.75), 0 6px 16px ${C.maroon}12`,overflow:"hidden"}}>
            <img
              src={natarajImage}
              alt="Nataraj"
              style={{width:"82%",height:"82%",objectFit:"contain",filter:"drop-shadow(0 4px 8px rgba(61,10,18,0.18))"}}
            />
          </div>
          <div>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,fontWeight:400,color:C.maroon,letterSpacing:"0.12em",lineHeight:1}}>ANANDAMAYI</div>
            <div style={{fontFamily:"'Noto Serif Telugu',serif",fontSize:12,color:C.maroonLight,lineHeight:1.15}}>Nrityalaya</div>
            <div style={{fontSize:8,color:C.bronzeLight,letterSpacing:"0.42em",textTransform:"uppercase",fontWeight:700,marginTop:2}}>Dance Academy</div>
          </div>
        </div>
        {/* Desktop tabs */}
        <div style={{display:"flex",gap:8,alignItems:"center",padding:"6px",background:"rgba(255,255,255,0.46)",border:`1px solid ${C.maroon}12`,borderRadius:999}} className="hidden md:flex">
          {TABS.map(t=>(
            <button key={t} onClick={()=>set(t)} style={{padding:"10px 18px",border:`1px solid ${active===t?`${C.maroon}26`:"transparent"}`,borderRadius:999,background:active===t?`linear-gradient(135deg, ${C.maroon}18, ${C.maroon}0b)`:"transparent",color:active===t?C.maroon:C.bronze,fontFamily:"'DM Serif Display',serif",fontSize:12,letterSpacing:"0.12em",cursor:"pointer",transition:"all 0.2s",boxShadow:active===t?`0 8px 18px ${C.maroon}12`:"none"}}>{t}</button>
          ))}
        </div>
        <button className="md:hidden" onClick={()=>setOpen(p=>!p)} style={{width:44,height:44,background:"rgba(255,255,255,0.54)",border:`1px solid ${C.maroon}18`,borderRadius:14,cursor:"pointer",color:C.maroon,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 8px 18px ${C.maroon}10`}}>
          {open?<X size={22}/>:<Menu size={22}/>}
        </button>
      </div>
      {open&&(
        <div style={{maxWidth:1120,margin:"10px auto 0",padding:"0 1.25rem",pointerEvents:"auto"}}>
          <div style={{background:"linear-gradient(180deg, rgba(255,253,248,0.98), rgba(247,237,216,0.95))",border:`1px solid ${C.maroon}16`,borderRadius:22,padding:"0.85rem",display:"flex",flexDirection:"column",gap:6,boxShadow:`0 16px 36px ${C.maroon}12`}}>
            {TABS.map(t=><button key={t} onClick={()=>{set(t);setOpen(false);}} style={{textAlign:"left",padding:"11px 14px",borderRadius:14,background:active===t?`${C.maroon}10`:"transparent",color:active===t?C.maroon:C.bronze,fontFamily:"'DM Serif Display',serif",fontSize:13,border:"none",cursor:"pointer",letterSpacing:"0.08em"}}>{t}</button>)}
          </div>
        </div>
      )}
    </nav>
  );
}

// -- Hero ----------------------------------------------------------------------
function HeroSection({ setTab }:{setTab:(t:Tab)=>void;batchCount:number}) {
  return (
    <section style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden",paddingTop:80,background:`linear-gradient(155deg,${C.sandLight} 0%,${C.parchment} 50%,${C.sand} 100%)`}}>
      <div
        style={{
          position:"absolute",
          inset:0,
          pointerEvents:"none",
          backgroundImage:`url(${natarajImage})`,
          backgroundRepeat:"no-repeat",
          backgroundPosition:"center 54%",
          backgroundSize:"min(42vw, 420px)",
          opacity:0.08,
          filter:"sepia(1) hue-rotate(-18deg) saturate(1.3)",
          mixBlendMode:"multiply",
        }}
      />
      {/* Mandala */}
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-52%)",pointerEvents:"none"}}>
        <MandalaBg size={620} op={0.09}/>
      </div>
      <div style={{position:"absolute",inset:0,pointerEvents:"none",background:`radial-gradient(ellipse 60% 50% at 50% 42%,${C.maroon}07 0%,transparent 70%)`}}/>
      {/* Corner ornaments */}
      <div style={{position:"absolute",top:70,left:12,pointerEvents:"none"}}><Corner/></div>
      <div style={{position:"absolute",top:70,right:12,pointerEvents:"none"}}><Corner flip/></div>
      <div style={{position:"absolute",bottom:12,left:12,pointerEvents:"none",transform:"scaleY(-1)"}}><Corner/></div>
      <div style={{position:"absolute",bottom:12,right:12,pointerEvents:"none",transform:"scale(-1,-1)"}}><Corner/></div>
      {/* Side dance figures */}
      <div style={{position:"absolute",left:"4%",top:"50%",transform:"translateY(-50%)",opacity:0.11,pointerEvents:"none"}}>
        <BharatanatyamIcon size={160} color={C.maroon}/>
      </div>
      <div style={{position:"absolute",right:"4%",top:"50%",transform:"translateY(-50%)",opacity:0.11,pointerEvents:"none"}}>
        <KuchipudiIcon size={160} color={C.maroon}/>
      </div>

      <div style={{position:"relative",zIndex:1,textAlign:"center",padding:"0 1.5rem",maxWidth:780}}>
        {/* Eyebrow */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:14,marginBottom:28}}>
          <div style={{height:1,width:44,background:`linear-gradient(to right,transparent,${C.maroon})`}}/>
          <span style={{fontSize:9,letterSpacing:"0.5em",color:C.maroonLight,textTransform:"uppercase",fontFamily:"'DM Serif Display',serif"}}>Kuchipudi  Classical Arts</span>
          <div style={{height:1,width:44,background:`linear-gradient(to left,transparent,${C.maroon})`}}/>
        </div>

        {/* Telugu title */}
        
        <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(3rem,8.5vw,6.5rem)",fontWeight:900,color:C.deep,lineHeight:1,marginBottom:4}}>
          Anandamayi <span style={{color:C.maroon}}>Nrityalaya</span>
        </h1>

        {/* Tagline with dance icons */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:20,margin:"16px 0 22px",flexWrap:"wrap"}}>
          <BharatanatyamIcon size={38} color={C.maroon}/>
          <div style={{textAlign:"center"}}>
            <p style={{fontFamily:"'Manrope','Segoe UI',sans-serif",fontStyle:"italic",fontSize:"clamp(0.9rem,1.8vw,1.25rem)",color:C.bronze,letterSpacing:"0.1em"}}>A graceful home for Kuchipudi.</p>
            
          </div>
          <KuchipudiIcon size={38} color={C.maroon}/>
        </div>

        <OrnamentDivider/>

        {/* CTAs */}
        <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
          <Button onClick={()=>setTab("Register")} style={{background:`linear-gradient(135deg,${C.maroon},${C.maroonMid})`,color:C.cream,fontFamily:"'DM Serif Display',serif",letterSpacing:"0.14em",fontSize:13,fontWeight:700,padding:"12px 32px",borderRadius:2,border:"none",boxShadow:`0 4px 20px ${C.maroon}35`,cursor:"pointer",transition:"all 0.2s"}}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.transform="translateY(-2px)";(e.currentTarget as HTMLButtonElement).style.boxShadow=`0 8px 28px ${C.maroon}45`;}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.transform="";(e.currentTarget as HTMLButtonElement).style.boxShadow=`0 4px 20px ${C.maroon}35`;}}>
             Register <ChevronRight size={14} style={{marginLeft:4}}/>
          </Button>
          <Button onClick={()=>setTab("Batches")} style={{background:"transparent",color:C.maroon,border:`1.5px solid ${C.maroon}55`,fontFamily:"'DM Serif Display',serif",letterSpacing:"0.14em",fontSize:13,padding:"12px 32px",borderRadius:2,cursor:"pointer"}}
            onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background=`${C.maroon}0e`}
            onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background="transparent"}>            View Batches
          </Button>
        </div>
      </div>

      <div style={{position:"absolute",bottom:28,left:"50%",transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",opacity:0.28,animation:"bounce 2s ease-in-out infinite"}}>
        <div style={{width:1,height:44,background:`linear-gradient(to bottom,${C.maroon},transparent)`}}/>
      </div>
    </section>
  );
}

// -- Batch Card ----------------------------------------------------------------
function BatchCard({b,selected,onSelect}:{b:Batch;selected:boolean;onSelect:(x:Batch)=>void}) {
  return (
    <Card onClick={()=>onSelect(b)} style={{cursor:"pointer",transition:"all 0.25s",borderRadius:10,background:selected?`linear-gradient(180deg, ${C.white}, ${C.parchment})`:C.white,border:`1.5px solid ${selected?C.maroon:C.maroon+"20"}`,transform:selected?"translateY(-6px)":"",boxShadow:selected?`0 18px 40px ${C.maroon}22`:`0 8px 20px rgba(61,10,18,0.07)`,overflow:"hidden"}}
      onMouseEnter={e=>{if(!selected){(e.currentTarget as HTMLElement).style.borderColor=`${C.maroon}50`;(e.currentTarget as HTMLElement).style.transform="translateY(-2px)";}}}
      onMouseLeave={e=>{if(!selected){(e.currentTarget as HTMLElement).style.borderColor=`${C.maroon}20`;(e.currentTarget as HTMLElement).style.transform="";}}}>
      <div style={{height:5,background:`linear-gradient(90deg, ${C.maroon}, ${C.bronzeLight})`,opacity:selected?1:0.75}}/>
      <CardHeader style={{padding:"16px 16px 8px"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
          <div style={{width:52,height:52,borderRadius:8,border:`1px solid ${C.maroon}18`,background:`linear-gradient(135deg, ${C.parchment}, ${C.cream})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`inset 0 1px 0 ${C.white}`}}>
            {b.danceIcon}
          </div>
          <Badge style={{fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",background:selected?`${C.maroon}10`:"transparent",border:`1px solid ${C.maroon}28`,color:C.maroonLight,borderRadius:999,padding:"4px 10px"}}>
            {b.tag}
          </Badge>
        </div>
        <div style={{marginTop:10}}>
          <CardTitle style={{fontFamily:"'DM Serif Display',serif",color:C.deep,fontSize:16,marginBottom:2}}>{b.name}</CardTitle>
          <p style={{fontFamily:"'Noto Serif Telugu',serif",fontSize:12,color:C.maroonLight,lineHeight:1.5}}>{b.teluguName}</p>
          <p style={{fontSize:9,letterSpacing:"0.28em",color:C.bronzeLight,textTransform:"uppercase",marginTop:5}}>{b.mode}</p>
        </div>
      </CardHeader>
      <CardContent style={{padding:"0 16px 18px"}}>
        <Separator style={{background:`${C.maroon}14`,marginBottom:12}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:8,marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:C.bronze,background:`${C.maroon}05`,border:`1px solid ${C.maroon}10`,borderRadius:8,padding:"9px 10px"}}>
            <Calendar size={11} style={{color:C.maroonLight}}/>{b.schedule}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:C.bronze,background:`${C.maroon}05`,border:`1px solid ${C.maroon}10`,borderRadius:8,padding:"9px 10px"}}>
            <Users size={11} style={{color:C.maroonLight}}/>{b.teacher || "Teacher will be announced"}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"end",justifyContent:"space-between",gap:10}}>
          <div style={{display:"flex",alignItems:"baseline",gap:2}}>
            <span style={{fontFamily:"'DM Serif Display',serif",fontSize:13,color:C.maroon}}>?</span>
            <span style={{fontFamily:"'DM Serif Display',serif",fontSize:34,fontWeight:700,color:C.maroon,lineHeight:1}}>{b.fee.toLocaleString()}</span>
            <span style={{fontSize:10,color:C.bronzeLight}}>/course</span>
          </div>
          {selected&&<div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:C.maroon,background:`${C.maroon}08`,padding:"6px 8px",borderRadius:999}}><CheckCircle2 size={12}/>Selected</div>}
        </div>
      </CardContent>
    </Card>
  );
}

// -- Batches Page --------------------------------------------------------------
function BatchesSection({onRegister,batches}:{onRegister:(b:Batch)=>void;batches:Batch[]}) {
  const [sel,setSel]=useState<Batch|null>(null);
  const lowestFee = batches.length ? Math.min(...batches.map((b)=>b.fee || 0)) : 0;
  return (
    <section style={{paddingTop:108,paddingBottom:80,padding:"108px 1rem 80px",background:`linear-gradient(180deg,${C.sandLight},${C.cream})`,minHeight:"100vh"}}>
      <div style={{maxWidth:1100,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:48}}>
          <div style={{display:"flex",justifyContent:"center",gap:28,marginBottom:14,opacity:0.6}}>
            <BharatanatyamIcon size={44} color={C.maroon}/><KuchipudiIcon size={44} color={C.maroon}/>
          </div>
          <p style={{fontSize:9,letterSpacing:"0.5em",color:C.bronze,textTransform:"uppercase",marginBottom:8}}>Choose Your Path</p>
          <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(2rem,5vw,3rem)",color:C.deep}}>Our <span style={{color:C.maroon}}>Batches</span></h2>
                    <OrnamentDivider/>
          <p style={{color:C.bronze,maxWidth:480,margin:"0 auto",fontSize:13,lineHeight:1.8,fontFamily:"'Manrope','Segoe UI',sans-serif"}}>
            Kuchipudi - Classical Indian Dance<br/>
            <span style={{fontFamily:"'Noto Serif Telugu',serif",fontSize:12,color:C.maroonLight}}>Traditional - Graceful - Classical Dance</span>
          </p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:28}}>
          {[
            {label:"Live Batches", value:String(batches.length)},
            {label:"Starting Fee", value:`Rs. ${lowestFee.toLocaleString()}`},
            {label:"Modes", value:Array.from(new Set(batches.map((b)=>b.mode))).length.toString()},
          ].map((item)=>(
            <div key={item.label} style={{background:`linear-gradient(135deg, ${C.white}, ${C.parchment})`,border:`1px solid ${C.maroon}16`,borderRadius:10,padding:"14px 16px",boxShadow:`0 8px 20px ${C.maroon}08`}}>
              <p style={{fontSize:10,letterSpacing:"0.24em",textTransform:"uppercase",color:C.bronzeLight,marginBottom:6}}>{item.label}</p>
              <p style={{fontFamily:"'DM Serif Display',serif",fontSize:24,color:C.maroon}}>{item.value}</p>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(268px,1fr))",gap:16,marginBottom:36}}>
          {batches.map(b=><BatchCard key={b.id} b={b} selected={sel?.id===b.id} onSelect={setSel}/>)}
        </div>
        {sel&&(
          <div style={{display:"flex",justifyContent:"center"}}>
            <Button onClick={()=>onRegister(sel)} style={{background:`linear-gradient(135deg,${C.maroon},${C.maroonMid})`,color:C.cream,fontFamily:"'DM Serif Display',serif",letterSpacing:"0.14em",fontSize:13,fontWeight:700,padding:"14px 42px",borderRadius:999,border:"none",boxShadow:`0 10px 24px ${C.maroon}32`,cursor:"pointer"}}>
               Register for {sel.name} <ChevronRight size={15} style={{marginLeft:6}}/>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

// -- Chat Bubble ---------------------------------------------------------------
function Bubble({msg}:{msg:Message}) {
  const u=msg.from==="user";
  return (
    <div style={{display:"flex",justifyContent:u?"flex-end":"flex-start"}}>
      {!u&&(
        <div style={{width:28,height:28,borderRadius:"50%",border:`1px solid ${C.maroon}28`,background:C.parchment,display:"flex",alignItems:"center",justifyContent:"center",marginRight:8,flexShrink:0,marginTop:2}}>
          <NatarajaLogo size={22} color={C.maroon}/>
        </div>
      )}
      <div style={{maxWidth:"78%",padding:"10px 14px",fontSize:13,lineHeight:1.7,borderRadius:u?"12px 12px 3px 12px":"12px 12px 12px 3px",whiteSpace:"pre-line",fontFamily:"'Manrope','Segoe UI',sans-serif",boxShadow:"0 1px 5px rgba(0,0,0,0.06)",background:u?`linear-gradient(135deg,${C.maroon},${C.maroonMid})`:C.white,color:u?C.cream:C.deep,border:u?"none":`1px solid ${C.maroon}14`}}>
        {msg.text}
      </div>
    </div>
  );
}

// -- Registration Chatbot ------------------------------------------------------
function ChatBot({
  initialBatch,
  onProceedToPayment,
  floating=false,
  batches,
}:{initialBatch:Batch|null;onProceedToPayment:(session:StudentSession)=>void;floating?:boolean;batches:Batch[]}) {
  const [step,setStep]=useState<Step>("welcome");
  const [messages,setMessages]=useState<Message[]>([]);
  const [batch,setBatch]=useState<Batch|null>(initialBatch);
  const [agreed,setAgreed]=useState(false);
  const [loading,setLoading]=useState(false);
  const [studentType,setStudentType]=useState<StudentType>("new");
  const [error,setError]=useState("");
  const [open,setOpen]=useState(false);
  const [form,setForm]=useState<FormData>({name:"",accountName:"",phone:"",email:"",batch:initialBatch?.name??"",transactionId:""});
  const endRef=useRef<HTMLDivElement>(null);
  const bootedRef=useRef(false);

  const add = useCallback((text:string,from:"bot"|"user"="bot",extra?:string) => {
    setMessages(p=>[...p,{id:`${Date.now()}-${Math.random()}`,text,from,extra}]);
  }, []);

  const handleBatchSelect = useCallback((b:Batch)=>{
    setError("");
    setBatch(b);setForm(f=>({...f,batch:b.name}));
    add(`${b.teluguName} ${b.name} (?${b.fee.toLocaleString()})`, "user");
    setTimeout(()=>{
      add(`${b.name} / ${b.teluguName} ???????:\n\n?? Schedule: ${b.schedule}\n?? Fee: ?${b.fee.toLocaleString()}\n?? Mode: ${b.mode}`);
      setTimeout(()=>{add(" Please review our guidelines:","bot","guidelines");setStep("guidelines");},900);
    },600);
  }, [add]);

  useEffect(()=>{
    if (floating && !open) {
      bootedRef.current = false;
      return;
    }
    if (bootedRef.current) return;
    bootedRef.current = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    setMessages([]);
    setStep("welcome");
    setAgreed(false);
    timers.push(setTimeout(()=>add("?? ??????! Anandamayi Nrityalaya ?? ???????!\nWelcome! I'm here to guide you through registration."),300));
    timers.push(setTimeout(()=>{
      add(" Please choose your batch:","bot","batch_picker");
      setStep("batch_select");
      if (initialBatch) {
        timers.push(setTimeout(()=>handleBatchSelect(initialBatch),200));
      }
    },1200));
    return () => { timers.forEach(clearTimeout); };
  },[add, handleBatchSelect, initialBatch, floating, open]);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);

  const handleAgree=()=>{
    setAgreed(true);
    add("???? ????? Payment Received??  I agree to all guidelines.","user");
    setTimeout(()=>add("Are you a new student or an existing student?","bot","student_type"),500);
    setStep("student_type");
  };

  const handleFormSubmit=async()=>{
    if(!batch){return;}
    if(!form.phone || (studentType==="new" && !form.name)){alert("Please fill required fields.");return;}
    setError("");
    setLoading(true);
    const response = studentType==="existing"
      ? await apiPost("student/login",{ phone:form.phone, batch_name:batch.name })
      : await apiPost("register",{ name:form.name, phone:form.phone, email:form.email, batch_name:batch.name });
    setLoading(false);
    if (!response.ok) {
      setError(response.error || "Unable to continue. Please try again.");
      return;
    }
    const studentName = response.student?.name || form.name || "Student";
    add(`Name: ${studentName} | Phone: ${form.phone}`,"user");
    add("Redirecting you to the payment page now.");
    onProceedToPayment({
      studentId: response.studentId || response.student?.id,
      name: studentName,
      phone: response.student?.phone || form.phone,
      email: response.student?.email || form.email,
      batch,
      studentType,
    });
  };

  const cardContent = (
    <>
      {!floating&&(
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:10,opacity:0.65}}><BharatanatyamIcon size={40} color={C.maroon}/></div>
          <p style={{fontSize:9,letterSpacing:"0.5em",color:C.bronze,textTransform:"uppercase",marginBottom:6}}> Registration Portal</p>
          <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:28,color:C.deep}}>Join <span style={{color:C.maroon}}>Anandamayi Nrityalayaya</span></h2>
                  </div>
      )}
      <Card style={{background:C.white,border:`1.5px solid ${C.maroon}18`,borderRadius:4,boxShadow:`0 4px 24px ${C.maroon}10`,width:"100%"}}>
          <CardContent style={{padding:0}}>
            <div style={{padding:"10px 18px",borderBottom:`1px solid ${C.maroon}10`,background:`${C.parchment}55`,display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:C.maroon,opacity:0.7,animation:"pulse 2s infinite"}}/>
              <span style={{fontSize:10,letterSpacing:"0.28em",color:C.maroonLight,textTransform:"uppercase",fontFamily:"'DM Serif Display',serif",flex:1}}>Live Registration </span>
              {floating&&<button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:C.maroon,cursor:"pointer"}}><X size={16}/></button>}
            </div>
            <ScrollArea style={{height:470,padding:"18px"}}>
              <div style={{display:"flex",flexDirection:"column",gap:14,paddingRight:4}}>
                {messages.map(msg=>(
                  <div key={msg.id} style={{animation:"fadeSlideIn 0.3s ease"}}>
                    <Bubble msg={msg}/>
                    {msg.extra==="batch_picker"&&step==="batch_select"&&(
                      <div style={{marginTop:10,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                        {batches.map(b=>(
                          <button key={b.id} onClick={()=>handleBatchSelect(b)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:`${C.parchment}80`,border:`1px solid ${C.maroon}1e`,borderRadius:3,textAlign:"left",cursor:"pointer",transition:"all 0.18s"}}
                            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=`${C.maroon}0e`;(e.currentTarget as HTMLElement).style.borderColor=`${C.maroon}40`;}}
                            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background=`${C.parchment}80`;(e.currentTarget as HTMLElement).style.borderColor=`${C.maroon}1e`;}}>
                            {b.danceIcon}
                            <div>
                              <p style={{fontFamily:"'DM Serif Display',serif",fontSize:11,color:C.deep,lineHeight:1.2}}>{b.name}</p>
                <p style={{fontSize:10,color:C.maroonLight}}>{b.mode} - {b.schedule}</p>
                              <p style={{fontSize:11,color:C.maroon,fontWeight:600,fontFamily:"'DM Serif Display',serif"}}>?{b.fee.toLocaleString()}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {msg.extra==="guidelines"&&step==="guidelines"&&(
                      <div style={{marginTop:10,background:`${C.parchment}65`,border:`1px solid ${C.maroon}18`,borderRadius:4,padding:"14px 16px"}}>
                        <p style={{fontSize:9,letterSpacing:"0.4em",color:C.bronze,textTransform:"uppercase",marginBottom:10,display:"flex",alignItems:"center",gap:6}}><BookOpen size={10} style={{color:C.maroon}}/>Guidelines</p>
                        <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:14}}>
                          {GUIDELINES.map((g,i)=>(
                            <div key={i} style={{display:"flex",gap:7,fontSize:12,color:C.deep,lineHeight:1.65,fontFamily:"'Manrope','Segoe UI',sans-serif"}}>
                              <Sparkles size={9} style={{color:C.maroon,flexShrink:0,marginTop:3}}/><span>{g}</span>
                            </div>
                          ))}
                        </div>
                        {!agreed&&<Button onClick={handleAgree} size="sm" style={{background:`linear-gradient(135deg,${C.maroon},${C.maroonMid})`,color:C.cream,border:"none",borderRadius:2,fontFamily:"'DM Serif Display',serif",letterSpacing:"0.1em",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><CheckCircle2 size={11}/> I Agree</Button>}
                      </div>
                    )}
                    {msg.extra==="student_type"&&step==="student_type"&&(
                      <div style={{marginTop:10,display:"flex",gap:10,flexWrap:"wrap"}}>
                        <Button size="sm" onClick={()=>{setStudentType("new");add("New student registration","user");setTimeout(()=>{add(" Registration Form:","bot","form");setStep("form");},400);}} style={{background:`linear-gradient(135deg,${C.maroon},${C.maroonMid})`,color:C.cream,border:"none",borderRadius:2,fontFamily:"'DM Serif Display',serif",letterSpacing:"0.1em",fontSize:11,cursor:"pointer"}}>
                          New Student
                        </Button>
                        <Button size="sm" onClick={()=>{setStudentType("existing");add("Existing student login","user");setTimeout(()=>{add(" Continue with your registered phone number.","bot","form");setStep("form");},400);}} style={{background:C.white,color:C.maroon,border:`1px solid ${C.maroon}35`,borderRadius:2,fontFamily:"'DM Serif Display',serif",letterSpacing:"0.1em",fontSize:11,cursor:"pointer"}}>
                          Existing Student
                        </Button>
                      </div>
                    )}
                    {msg.extra==="form"&&step==="form"&&(
                      <div style={{marginTop:10,background:`${C.parchment}65`,border:`1px solid ${C.maroon}18`,borderRadius:4,padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
                        {([
                          ...(studentType==="new" ? [[" Name *","name","text"],["Email","email","email"]] : []),
                          ["Phone*","phone","tel"],
                        ] as [string,keyof FormData,string][]).map(([label,key,type])=>(
                          <div key={key}>
                            <Label style={{fontSize:9,letterSpacing:"0.28em",color:C.bronze,textTransform:"uppercase"}}>{label}</Label>
                            <Input type={type} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={{marginTop:3,height:36,background:C.white,border:`1px solid ${C.maroon}22`,borderRadius:2,color:C.deep,fontSize:13}}/>
                          </div>
                        ))}
                        <div>
                          <Label style={{fontSize:9,letterSpacing:"0.28em",color:C.bronze,textTransform:"uppercase"}}>Batch</Label>
                          <div style={{marginTop:3,padding:"8px 12px",background:`${C.maroon}07`,border:`1px solid ${C.maroon}1e`,borderRadius:2,fontFamily:"'DM Serif Display',serif",color:C.maroon,fontSize:13,display:"flex",justifyContent:"space-between"}}>
                            <span>{batch?.name}</span><span style={{fontWeight:700}}>?{batch?.fee?.toLocaleString()}</span>
                          </div>
                        </div>
                        <Button onClick={handleFormSubmit} disabled={loading} style={{height:38,background:`linear-gradient(135deg,${C.maroon},${C.maroonMid})`,color:C.cream,border:"none",borderRadius:2,fontFamily:"'DM Serif Display',serif",letterSpacing:"0.1em",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                          {loading?<Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/>:<FileText size={13}/>}
                          {studentType==="existing" ? "Login & Continue" : "Register & Continue"}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={endRef}/>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        {error&&<div style={{marginTop:14,padding:"12px 14px",border:`1px solid ${C.maroon}28`,borderRadius:4,background:`${C.maroon}08`,color:C.maroon,fontSize:13}}>{error}</div>}
    </>
  );

  if (floating) {
    return (
      <div style={{position:"fixed",right:20,bottom:20,zIndex:60}}>
        {open?(
          <div style={{width:"min(380px, calc(100vw - 24px))"}}>
            {cardContent}
          </div>
        ):(
          <Button onClick={()=>setOpen(true)} style={{background:`linear-gradient(135deg,${C.maroon},${C.maroonMid})`,color:C.cream,border:"none",borderRadius:999,fontFamily:"'DM Serif Display',serif",letterSpacing:"0.08em",fontSize:12,padding:"12px 18px",boxShadow:`0 10px 24px ${C.maroon}35`}}>
            <MessageCircle size={15} style={{marginRight:8}}/>Live Registration
          </Button>
        )}
      </div>
    );
  }

  return (
    <section style={{paddingTop:108,paddingBottom:80,padding:"108px 1rem 80px",background:`linear-gradient(180deg,${C.sandLight},${C.cream})`,minHeight:"100vh"}}>
      <div style={{maxWidth:640,margin:"0 auto"}}>
        {cardContent}
      </div>
    </section>
  );
}

function RegisterSection({
  initialBatch,
  onProceedToPayment,
  batches,
}:{initialBatch:Batch|null;onProceedToPayment:(session:StudentSession)=>void;batches:Batch[]}) {
  const [selectedBatch,setSelectedBatch]=useState<Batch|null>(initialBatch);
  const [studentType,setStudentType]=useState<StudentType>("new");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [form,setForm]=useState<FormData>({name:"",accountName:"",phone:"",email:"",batch:initialBatch?.name??"",transactionId:""});

  useEffect(()=>{
    if (!initialBatch) return;
    setSelectedBatch(initialBatch);
    setForm(f=>({...f,batch:initialBatch.name}));
  },[initialBatch]);

  const submit = async()=>{
    if(!selectedBatch) { setError("Please select a batch."); return; }
    if(!form.phone || (studentType==="new" && !form.name)) {
      setError("Please fill the required fields.");
      return;
    }

    setError("");
    setLoading(true);
    const response = studentType==="existing"
      ? await apiPost("student/login",{ phone:form.phone, batch_name:selectedBatch.name })
      : await apiPost("register",{ name:form.name, phone:form.phone, email:form.email, batch_name:selectedBatch.name });
    setLoading(false);

    if (!response.ok) {
      setError(response.error || "Unable to continue.");
      return;
    }

    const studentName = response.student?.name || form.name || "Student";
    onProceedToPayment({
      studentId: response.studentId || response.student?.id,
      name: studentName,
      phone: response.student?.phone || form.phone,
      email: response.student?.email || form.email,
      batch: selectedBatch,
      studentType,
    });
  };

  return (
    <section style={{paddingTop:108,paddingBottom:80,padding:"108px 1rem 80px",background:`linear-gradient(180deg,${C.sandLight},${C.cream})`,minHeight:"100vh",position:"relative"}}>
      <div style={{maxWidth:1100,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <p style={{fontSize:9,letterSpacing:"0.5em",color:C.bronze,textTransform:"uppercase",marginBottom:6}}>Register Login</p>
          <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(2rem,5vw,2.8rem)",color:C.deep}}>Student <span style={{color:C.maroon}}>Access</span></h2>
          <p style={{fontSize:13,color:C.maroonLight,marginTop:4}}>Continue with the standard form.</p>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:24,alignItems:"start"}}>
          <Card style={{background:C.white,border:`1.5px solid ${C.maroon}18`,borderRadius:4}}>
            <CardHeader>
              <CardTitle style={{fontFamily:"'DM Serif Display',serif",color:C.maroon,fontSize:18}}>Choose Batch</CardTitle>
            </CardHeader>
            <CardContent style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {batches.map(b=>{const active=selectedBatch?.id===b.id;return(
                <button key={b.id} onClick={()=>{setSelectedBatch(b);setForm(f=>({...f,batch:b.name}));}} style={{padding:"12px 10px",borderRadius:3,textAlign:"left",background:active?`${C.maroon}0d`:C.parchment,border:`1px solid ${active?C.maroon:C.maroon+"22"}`,cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    {b.danceIcon}
                    <span style={{fontFamily:"'DM Serif Display',serif",fontSize:12,color:C.deep}}>{b.name}</span>
                  </div>
                  <p style={{fontSize:11,color:C.maroon}}>?{b.fee.toLocaleString()}</p>
                </button>
              );})}
            </CardContent>
          </Card>

          <Card style={{background:C.white,border:`1.5px solid ${C.maroon}18`,borderRadius:4}}>
            <CardHeader>
              <CardTitle style={{fontFamily:"'DM Serif Display',serif",color:C.maroon,fontSize:18}}>Register Or Login</CardTitle>
            </CardHeader>
            <CardContent style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{display:"flex",gap:10}}>
                <Button onClick={()=>setStudentType("new")} style={{flex:1,background:studentType==="new"?`linear-gradient(135deg,${C.maroon},${C.maroonMid})`:C.white,color:studentType==="new"?C.cream:C.maroon,border:studentType==="new"?"none":`1px solid ${C.maroon}30`,borderRadius:2}}>New Student</Button>
                <Button onClick={()=>setStudentType("existing")} style={{flex:1,background:studentType==="existing"?`linear-gradient(135deg,${C.maroon},${C.maroonMid})`:C.white,color:studentType==="existing"?C.cream:C.maroon,border:studentType==="existing"?"none":`1px solid ${C.maroon}30`,borderRadius:2}}>Existing Student</Button>
              </div>
              {studentType==="new"&&(
                <>
                  <div>
                    <Label style={{fontSize:9,letterSpacing:"0.28em",color:C.bronze,textTransform:"uppercase"}}>Student Name *</Label>
                    <Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={{marginTop:3,height:36,background:C.sandLight,border:`1px solid ${C.maroon}22`,borderRadius:2}}/>
                  </div>
                  <div>
                    <Label style={{fontSize:9,letterSpacing:"0.28em",color:C.bronze,textTransform:"uppercase"}}>Email</Label>
                    <Input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={{marginTop:3,height:36,background:C.sandLight,border:`1px solid ${C.maroon}22`,borderRadius:2}}/>
                  </div>
                </>
              )}
              <div>
                <Label style={{fontSize:9,letterSpacing:"0.28em",color:C.bronze,textTransform:"uppercase"}}>Phone *</Label>
                <Input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} style={{marginTop:3,height:36,background:C.sandLight,border:`1px solid ${C.maroon}22`,borderRadius:2}}/>
              </div>
              <div style={{padding:"10px 12px",background:`${C.maroon}07`,border:`1px solid ${C.maroon}1e`,borderRadius:2,fontSize:13,color:C.maroon}}>
                {selectedBatch ? `${selectedBatch.name} ${selectedBatch.fee.toLocaleString()}` : "Select a batch to continue"}
              </div>
              <Button onClick={submit} disabled={loading} style={{height:40,background:`linear-gradient(135deg,${C.maroon},${C.maroonMid})`,color:C.cream,border:"none",borderRadius:2,fontFamily:"'DM Serif Display',serif",letterSpacing:"0.12em",fontSize:13}}>
                {loading?<Loader2 size={14} style={{animation:"spin 1s linear infinite"}}/>:<FileText size={14} style={{marginRight:6}}/>}
                {studentType==="existing" ? "Login & Go To Payment" : "Register & Go To Payment"}
              </Button>
              {error&&<p style={{fontSize:12,color:C.maroon}}>{error}</p>}
            </CardContent>
          </Card>
        </div>
      </div>
      <ChatBot initialBatch={selectedBatch} onProceedToPayment={onProceedToPayment} floating batches={batches} />
    </section>
  );
}

// -- Payment -------------------------------------------------------------------
function PaymentSection({ initialSession, batches }:{ initialSession:StudentSession|null;batches:Batch[] }) {
  const [sel,setSel]=useState<Batch|null>(initialSession?.batch ?? null);
  const [form,setForm]=useState<FormData>({
    name:initialSession?.name ?? "",
    accountName:initialSession?.name ?? "",
    phone:initialSession?.phone ?? "",
    email:initialSession?.email ?? "",
    batch:initialSession?.batch?.name ?? "",
    transactionId:"",
  });
  const [submitted,setSubmitted]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [activeQr,setActiveQr]=useState<ActiveQrCode|null>(null);
  const [qrImageUrl,setQrImageUrl]=useState("");

  useEffect(()=>{
    if (!initialSession) return;
    setSel(initialSession.batch);
    setForm(f=>({
      ...f,
      name: initialSession.name || f.name,
      accountName: initialSession.name || f.accountName,
      phone: initialSession.phone || f.phone,
      email: initialSession.email || f.email,
      batch: initialSession.batch?.name || f.batch,
    }));
  },[initialSession]);

  useEffect(()=>{
    let live = true;
    const loadQr = async () => {
      if (!sel?.name) {
        if (live) {
          setActiveQr(null);
          setQrImageUrl("");
        }
        return;
      }

      try {
        const audience = initialSession?.studentType || "all";
        const qr = await apiGet<ActiveQrCode | null>(`qr/active?batch=${encodeURIComponent(sel.name)}&audience=${encodeURIComponent(audience)}`);
        if (!live) return;
        setActiveQr(qr);

        const upiId = qr?.upi_id || "anandamayi@upi";
        const qrAmount = Number(qr?.amount || sel.fee || 0);
        const upiLink = buildUpiPaymentLink({
          upiId,
          amount: qrAmount,
          batchName: sel.name,
        });
        const dataUrl = await QRCode.toDataURL(upiLink, {
          width: 320,
          margin: 1,
          color: { dark: "#3D0A12", light: "#FFFFFF" },
        });
        if (live) setQrImageUrl(dataUrl);
      } catch {
        if (!live) return;
        setActiveQr(null);
        setQrImageUrl("");
      }
    };

    loadQr();
    return () => {
      live = false;
    };
  },[initialSession?.studentType, sel]);

  const handleSubmit=async()=>{
    if(!sel||!form.name||!form.phone||!form.transactionId.trim()){alert("Please select a batch and fill all required fields, including Transaction ID.");return;}
    setError("");
    setLoading(true);
    const response = await apiPost("payment/confirm",{
      studentId: initialSession?.studentId,
      phone: form.phone,
      amount: sel.fee,
      transactionId: form.transactionId.trim(),
      batch_name: sel.name,
    });
    setLoading(false);
    if (!response.ok) {
      setError(response.error || "Unable to confirm payment.");
      return;
    }
    setError("");
    setSubmitted(true);
  };

  const upiId = activeQr?.upi_id || "anandamayi@upi";
  const payableAmount = Number(activeQr?.amount || sel?.fee || 0);
  const upiPaymentLink = sel
    ? buildUpiPaymentLink({ upiId, amount: payableAmount, batchName: sel.name })
    : "";

  if(submitted) return (
    <section style={{paddingTop:108,paddingBottom:80,textAlign:"center",background:`linear-gradient(180deg,${C.sandLight},${C.cream})`,minHeight:"100vh",padding:"108px 1rem 80px"}}>
      <div style={{maxWidth:520,margin:"0 auto"}}>
        <div style={{width:88,height:88,borderRadius:"50%",border:`2px solid ${C.maroon}38`,background:`${C.maroon}0c`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
          <Heart size={36} style={{color:C.maroon}}/>
        </div>
        <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:30,color:C.maroon,marginBottom:4}}>Payment Received</h2>
        <p style={{fontSize:14,color:C.maroonLight,marginBottom:16}}>Payment received successfully.</p>
        <OrnamentDivider/>
        <p style={{color:C.bronze,lineHeight:1.9,marginBottom:32,fontSize:14,fontFamily:"'Manrope','Segoe UI',sans-serif"}}>
          Thank you, <strong style={{color:C.deep}}>{form.name}</strong>!<br/>
          Rs. <strong style={{color:C.maroon}}>{sel?.fee?.toLocaleString()}</strong> for <strong style={{color:C.deep}}>{sel?.name}</strong> has been recorded.
        </p>
        <Button onClick={()=>{setSubmitted(false);setSel(null);setForm({name:"",accountName:"",phone:"",email:"",batch:"",transactionId:""}); }} style={{background:`linear-gradient(135deg,${C.maroon},${C.maroonMid})`,color:C.cream,border:"none",borderRadius:2,fontFamily:"'DM Serif Display',serif",letterSpacing:"0.12em",fontSize:13,padding:"10px 28px",cursor:"pointer"}}>
          New Payment
        </Button>
      </div>
    </section>
  );

  return (
    <section style={{paddingTop:108,paddingBottom:80,padding:"108px 1rem 80px",background:`linear-gradient(180deg,${C.sandLight},${C.cream})`,minHeight:"100vh"}}>
      <div style={{maxWidth:980,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{display:"flex",justifyContent:"center",gap:24,marginBottom:12,opacity:0.6}}>
            <KuchipudiIcon size={38} color={C.maroon}/><BharatanatyamIcon size={38} color={C.maroon}/>
          </div>
          <p style={{fontSize:9,letterSpacing:"0.5em",color:C.bronze,textTransform:"uppercase",marginBottom:6}}>Secure Payment</p>
          <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(2rem,5vw,2.8rem)",color:C.deep}}>Course <span style={{color:C.maroon}}>Fee Payment</span></h2>
          <p style={{fontSize:13,color:C.maroonLight,marginTop:4}}>Complete your course fee payment.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(228px,1fr))",gap:10,marginBottom:32}}>
          {batches.map(b=>{const s=sel?.id===b.id;return(
            <button key={b.id} onClick={()=>{setSel(b);setForm(f=>({...f,batch:b.name}));}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:s?`${C.maroon}0c`:C.white,border:`1.5px solid ${s?C.maroon:C.maroon+"1e"}`,borderRadius:3,textAlign:"left",cursor:"pointer",transition:"all 0.2s",boxShadow:s?`0 4px 16px ${C.maroon}18`:`0 1px 4px rgba(0,0,0,0.05)`}}>
              <div style={{width:40,height:40,border:`1px solid ${C.maroon}22`,background:C.parchment,borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {b.danceIcon}
              </div>
              <div>
                <p style={{fontFamily:"'DM Serif Display',serif",fontSize:12,color:s?C.deep:C.bronze}}>{b.name}</p>
                <p style={{fontSize:10,color:C.maroonLight}}>{b.mode} - {b.schedule}</p>
                <p style={{fontFamily:"'DM Serif Display',serif",fontSize:20,fontWeight:700,color:s?C.maroon:C.bronzeLight,lineHeight:1.2}}>Rs. {b.fee.toLocaleString()}</p>
              </div>
              {s&&<CheckCircle2 size={15} style={{color:C.maroon,marginLeft:"auto"}}/>}
            </button>
          );})}
        </div>
        {sel&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:24}}>
            <Card style={{background:C.white,border:`1.5px solid ${C.maroon}18`,borderRadius:4}}>
              <CardHeader style={{paddingBottom:8}}>
                <CardTitle style={{fontFamily:"'DM Serif Display',serif",color:C.maroon,fontSize:17,display:"flex",alignItems:"center",gap:8}}>
                  <FileText size={15} style={{color:C.maroonLight}}/>Student Details
                </CardTitle>
              </CardHeader>
              <CardContent style={{display:"flex",flexDirection:"column",gap:14}}>
                {([["Student Name *","name","text"],["Account Holder Name *","accountName","text"],["Phone *","phone","tel"],["Transaction ID *","transactionId","text"]] as [string,keyof FormData,string][]).map(([label,key,type])=>(
                  <div key={key}>
                    <Label style={{fontSize:9,letterSpacing:"0.28em",color:C.bronze,textTransform:"uppercase"}}>{label}</Label>
                    <Input type={type} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={{marginTop:3,height:36,background:C.sandLight,border:`1px solid ${C.maroon}22`,borderRadius:2,color:C.deep,fontSize:13}}/>
                  </div>
                ))}
                <div>
                  <Label style={{fontSize:9,letterSpacing:"0.28em",color:C.bronze,textTransform:"uppercase"}}>Batch</Label>
                  <div style={{marginTop:3,padding:"8px 12px",background:`${C.maroon}07`,border:`1px solid ${C.maroon}1e`,borderRadius:2,fontFamily:"'DM Serif Display',serif",color:C.maroon,fontSize:13,display:"flex",justifyContent:"space-between"}}>
                    <span>{sel.name}</span><span style={{fontWeight:700}}>Rs. {sel.fee.toLocaleString()}</span>
                  </div>
                </div>
                <Button onClick={handleSubmit} disabled={loading} style={{height:40,background:`linear-gradient(135deg,${C.maroon},${C.maroonMid})`,color:C.cream,border:"none",borderRadius:2,fontFamily:"'DM Serif Display',serif",letterSpacing:"0.12em",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  {loading?<Loader2 size={14} style={{animation:"spin 1s linear infinite"}}/>:<CreditCard size={14}/>}Confirm Payment
                </Button>
                {error&&<p style={{fontSize:12,color:C.maroon}}>{error}</p>}
              </CardContent>
            </Card>
            <Card style={{background:C.white,border:`1.5px solid ${C.maroon}18`,borderRadius:4,textAlign:"center"}}>
              <CardHeader style={{paddingBottom:8}}>
                <CardTitle style={{fontFamily:"'DM Serif Display',serif",color:C.maroon,fontSize:17,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  <CreditCard size={15} style={{color:C.maroonLight}}/>Scan & Pay
                </CardTitle>
              </CardHeader>
              <CardContent style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                <div style={{width:168,height:168,background:"#fff",border:`2px solid ${C.maroon}22`,borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14,boxShadow:`0 2px 12px ${C.maroon}10`,overflow:"hidden"}}>
                  {qrImageUrl ? (
                    <img src={qrImageUrl} alt="UPI payment QR" style={{width:"100%",height:"100%",objectFit:"contain"}} />
                  ) : (
                    <div style={{fontSize:12,color:C.bronze}}>Preparing QR...</div>
                  )}
                </div>
                <p style={{fontSize:9,letterSpacing:"0.4em",color:C.bronze,textTransform:"uppercase",marginBottom:2}}>UPI ID</p>
                <p style={{fontFamily:"'DM Serif Display',serif",color:C.maroon,fontSize:14,marginBottom:12}}>{upiId}</p>
                <div style={{width:"100%",background:`${C.maroon}07`,border:`1px solid ${C.maroon}18`,borderRadius:3,padding:"14px"}}>
                  <p style={{color:C.bronze,fontSize:11,marginBottom:2}}>Amount</p>
                  <p style={{fontFamily:"'DM Serif Display',serif",fontSize:42,fontWeight:700,color:C.maroon,lineHeight:1}}>Rs. {payableAmount.toLocaleString()}</p>
                  <p style={{fontSize:12,color:C.maroonLight,marginTop:3}}>{sel.mode} - {sel.schedule}</p>
                </div>
                <a href={upiPaymentLink} style={{marginTop:12,width:"100%",textDecoration:"none"}}>
                  <Button style={{width:"100%",height:38,background:C.white,color:C.maroon,border:`1px solid ${C.maroon}30`,borderRadius:2,fontFamily:"'DM Serif Display',serif",letterSpacing:"0.08em",fontSize:12,cursor:"pointer"}}>
                    Open UPI App
                  </Button>
                </a>
                <div style={{marginTop:12,display:"flex",alignItems:"flex-start",gap:6,fontSize:11,color:C.bronze,textAlign:"left"}}>
                  <AlertCircle size={11} style={{flexShrink:0,marginTop:1,color:C.maroonLight}}/>
                  <span>Scanning this QR or opening the UPI app will prefill the exact batch amount automatically.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}

// -- Contact -------------------------------------------------------------------
function ContactSection() {
  const items=[
    {Icon:MapPin,title:"Location",detail:"Anandamayi Nrityalaya\nHyderabad, Telangana\n9849299953"},
    {Icon:Phone,title:"Instagram",detail:"https://www.instagram.com/anandamayi_nrityalaya?igsh=MWV3ZHNkdzZjZ3JxbA%3D%3D"},
    {Icon:Mail,title:"Email",detail:"Anandamayinrityalaya@gmail.com"},
    {Icon:MessageCircle,title:"DM",detail:"Instagram / WhatsApp"},
  ];
  return (
    <section style={{paddingTop:108,paddingBottom:80,padding:"108px 1rem 80px",background:`linear-gradient(180deg,${C.sandLight},${C.cream})`,minHeight:"100vh"}}>
      <div style={{maxWidth:980,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:44}}>
          <div style={{display:"flex",justifyContent:"center",gap:24,marginBottom:14,opacity:0.6}}>
            <BharatanatyamIcon size={42} color={C.maroon}/><KuchipudiIcon size={42} color={C.maroon}/>
          </div>
          <p style={{fontSize:9,letterSpacing:"0.5em",color:C.bronze,textTransform:"uppercase",marginBottom:6}}> Get in Touch</p>
          <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(2rem,5vw,2.8rem)",color:C.deep}}>Contact <span style={{color:C.maroon}}>Us</span></h2>
          <p style={{fontSize:13,color:C.maroonLight,marginTop:4}}>Visit, message, or email Anandamayi Nrityalayaya in Nagole, Hyderabad.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14,marginBottom:44}}>
          {items.map(({Icon:I,title,detail})=>(
            <Card key={title} style={{background:C.white,border:`1.5px solid ${C.maroon}14`,borderRadius:4,textAlign:"center",transition:"all 0.22s",cursor:"default"}}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(-3px)";(e.currentTarget as HTMLElement).style.boxShadow=`0 8px 24px ${C.maroon}12`;}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="";(e.currentTarget as HTMLElement).style.boxShadow="";}}>
              <CardContent style={{paddingTop:22,paddingBottom:18}}>
                <div style={{width:40,height:40,borderRadius:3,border:`1px solid ${C.maroon}22`,background:C.parchment,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}><I size={18} style={{color:C.maroon}}/></div>
                <p style={{fontFamily:"'DM Serif Display',serif",color:C.maroon,fontSize:12,marginBottom:4}}>{title}</p>
                <p style={{color:C.bronze,fontSize:12,lineHeight:1.75,whiteSpace:"pre-line"}}>{detail}</p>
                
              </CardContent>
            </Card>
          ))}
        </div>
        <OrnamentDivider/>
        <div style={{marginTop:40,textAlign:"center",background:`${C.maroon}05`,border:`1.5px solid ${C.maroon}14`,borderRadius:4,padding:"40px 24px"}}>
          <div style={{display:"flex",justifyContent:"center",gap:28,marginBottom:18,opacity:0.75}}>
            <BharatanatyamIcon size={50} color={C.maroon}/>
            <NatarajaLogo size={60} color={C.maroon}/>
            <KuchipudiIcon size={50} color={C.maroon}/>
          </div>
          <p style={{fontFamily:"'DM Serif Display',serif",color:C.maroon,fontSize:20,marginBottom:4}}>Anandamayi Nrityalaya</p>
                    <OrnamentDivider/>
          <p style={{fontStyle:"italic",color:C.bronze,fontSize:13,fontFamily:"'Manrope','Segoe UI',sans-serif",marginTop:8}}>Thank you for being a part of Anandamayi Nrityalaya.</p>
          <p style={{fontSize:12,color:C.maroonLight,marginTop:4}}>Every step carries devotion, discipline, and joy.</p>
        </div>
      </div>
    </section>
  );
}

// -- Root ----------------------------------------------------------------------
export default function App() {
  const [activeTab,setActiveTab]=useState<Tab>("Home");
  const [regBatch,setRegBatch]=useState<Batch|null>(null);
  const [studentSession,setStudentSession]=useState<StudentSession|null>(null);
  const [batches,setBatches]=useState<Batch[]>([]);

  useEffect(()=>{
    let live = true;
    const loadBatches = async () => {
      try {
        const data = await apiGet<BatchApi[]>("batches");
        if (!live) return;
        setBatches(Array.isArray(data) ? data.map(mapBatchFromApi) : []);
      } catch {
        if (live) setBatches([]);
      }
    };

    loadBatches();
    const intervalId = window.setInterval(loadBatches, 60000);
    return () => {
      live = false;
      window.clearInterval(intervalId);
    };
  },[]);

  const handleRegister=(b:Batch)=>{setRegBatch(b);setActiveTab("Register");};
  const handleProceedToPayment=(session:StudentSession)=>{
    setStudentSession(session);
    setRegBatch(session.batch);
    setActiveTab("Payment");
  };
  return (
    <div style={{minHeight:"100vh",background:C.sandLight,fontFamily:"'Manrope','Segoe UI',sans-serif"}}>
      <style>{`
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:${C.sandLight};}
        ::-webkit-scrollbar-thumb{background:${C.maroon}28;border-radius:2px;}
        input:focus{border-color:${C.maroon}55!important;outline:none!important;box-shadow:0 0 0 2px ${C.maroon}10!important;}
        input,textarea,select{color:#111111!important;}
        input::placeholder,textarea::placeholder{color:rgba(17,17,17,0.42)!important;}
        @keyframes fadeSlideIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
        @keyframes bounce{0%,100%{transform:translateX(-50%) translateY(0);}50%{transform:translateX(-50%) translateY(-8px);}}
        @keyframes pulse{0%,100%{opacity:0.7;}50%{opacity:0.25;}}
        @keyframes spin{to{transform:rotate(360deg);}}
        .hidden{display:none!important;}
        @media(min-width:768px){.hidden{display:flex!important;}}
      `}</style>
      <NavBar active={activeTab} set={setActiveTab}/>
      <main>
        {activeTab==="Home"    &&<HeroSection    setTab={setActiveTab} batchCount={batches.length}/>}
        {activeTab==="Batches" &&<BatchesSection onRegister={handleRegister} batches={batches}/>}
        {activeTab==="Register"&&<RegisterSection initialBatch={regBatch} onProceedToPayment={handleProceedToPayment} batches={batches}/>}
        {activeTab==="Payment" &&<PaymentSection initialSession={studentSession} batches={batches}/>}
        {activeTab==="Contact" &&<ContactSection/>}
      </main>
      <footer style={{borderTop:`1px solid ${C.maroon}16`,padding:"20px 1rem",textAlign:"center",background:C.parchment}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:4}}>
          <BharatanatyamIcon size={18} color={C.maroon}/>
          <span style={{fontSize:9,letterSpacing:"0.4em",color:`${C.maroon}55`,textTransform:"uppercase",fontFamily:"'DM Serif Display',serif"}}>Anandamayi  Kuchipudi</span>
          <KuchipudiIcon size={18} color={C.maroon}/>
        </div>
        <p style={{marginBottom:8}}>
          <a href="/privacy-policy" style={{fontSize:12,color:C.maroon,textDecoration:"none",fontWeight:700}}>
            Privacy Policy
          </a>
        </p>
        <p style={{fontSize:10,color:`${C.maroon}40`}}>� {new Date().getFullYear()} Anandamayi Nrityalaya  All rights reserved</p>
      </footer>
    </div>
  );
}
