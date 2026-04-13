import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Plus, Trash2, RefreshCw,
  CheckCircle2, Clock, Phone, Globe2, FileText, Database,
  BarChart3, MapPin, DollarSign, Activity, Info, Printer,
  ArrowUpRight, Loader2, AlertCircle, Wifi, WifiOff,
  Users, Stethoscope, BadgeCheck, Zap, ChevronDown, ChevronUp,
  Shield, TrendingUp, Building2, FlaskConical
} from "lucide-react";

// ─── Occu-Med Occ Health Reference Database ───────────────────────────────────

const OCC_HEALTH_SERVICES = [
  { name:"Pre-Employment Physical",           cpt:"99455",           usAvg:"$110", range:"$65–$220",   category:"Physical Exams",   notes:"Most common Occ Med service. Employer-paid. Can include drug screen, vision, audiogram." },
  { name:"DOT Physical (FMCSA)",              cpt:"FMCSA Form",      usAvg:"$110", range:"$75–$175",   category:"Physical Exams",   notes:"Federally mandated. FMCSA-certified examiner (CME) required — searchable on FMCSA NRCME." },
  { name:"FAA Aviation Medical – Class 1",    cpt:"FAA 8500-8",      usAvg:"$175", range:"$110–$290",  category:"Physical Exams",   notes:"AME designation required. Very limited supply. Airline pilots. Annual/6-month cycle." },
  { name:"FAA Aviation Medical – Class 2",    cpt:"FAA 8500-8",      usAvg:"$145", range:"$85–$220",   category:"Physical Exams",   notes:"Commercial pilots. AME required. Annual cycle." },
  { name:"FAA Aviation Medical – Class 3",    cpt:"FAA 8500-8",      usAvg:"$120", range:"$75–$200",   category:"Physical Exams",   notes:"Private pilots. AME required. Biennial." },
  { name:"Fit-for-Duty Evaluation",           cpt:"99455-99456",     usAvg:"$225", range:"$150–$500",  category:"Physical Exams",   notes:"Job-specific functional assessment. ADA compliance critical." },
  { name:"Return-to-Work Evaluation",         cpt:"99456",           usAvg:"$180", range:"$100–$375",  category:"Physical Exams",   notes:"Post-injury clearance. Workers comp context common." },
  { name:"Independent Medical Exam (IME)",    cpt:"99456",           usAvg:"$425", range:"$275–$850",  category:"Physical Exams",   notes:"Dispute resolution — high variability by state WC fee schedule." },
  { name:"Drug Screen – 5-Panel Urine",       cpt:"80305",           usAvg:"$55",  range:"$25–$95",    category:"Drug & Alcohol",   notes:"Standard pre-employment. Collection fee often separate." },
  { name:"Drug Screen – 10-Panel Urine",      cpt:"80307",           usAvg:"$75",  range:"$40–$150",   category:"Drug & Alcohol",   notes:"DOT-mandated must use SAMHSA-certified lab." },
  { name:"Drug Screen – Oral Fluid",          cpt:"80305",           usAvg:"$65",  range:"$35–$120",   category:"Drug & Alcohol",   notes:"Increasingly accepted. Shorter detection window." },
  { name:"Breath Alcohol Test (BAT)",         cpt:"80320",           usAvg:"$35",  range:"$20–$75",    category:"Drug & Alcohol",   notes:"DOT programs require certified BAT technician." },
  { name:"MRO Review (Drug Test)",            cpt:"N/A",             usAvg:"$30",  range:"$15–$65",    category:"Drug & Alcohol",   notes:"Medical Review Officer required for all DOT drug tests." },
  { name:"Audiogram – Pure Tone",             cpt:"92557",           usAvg:"$75",  range:"$40–$155",   category:"Occupational Testing", notes:"OSHA-mandated for 85+ dB noise-exposed workers. Annual." },
  { name:"Pulmonary Function Test (PFT)",     cpt:"94010",           usAvg:"$135", range:"$70–$260",   category:"Occupational Testing", notes:"Required for respirator clearance (OSHA 1910.134)." },
  { name:"Respirator Medical Clearance",      cpt:"99211+94010",     usAvg:"$190", range:"$100–$375",  category:"Occupational Testing", notes:"OSHA 29 CFR 1910.134. Physician or PLHCP required." },
  { name:"Vision Screen (Titmus/Keystone)",   cpt:"92102",           usAvg:"$45",  range:"$20–$95",    category:"Occupational Testing", notes:"CDL drivers, crane operators, safety-sensitive roles." },
  { name:"Chest X-Ray (B-Read)",              cpt:"71046+",          usAvg:"$185", range:"$90–$380",   category:"Occupational Testing", notes:"NIOSH B-reader required for asbestos/coal/silica surveillance." },
  { name:"Lead / Heavy Metal Panel",          cpt:"83655+99456",     usAvg:"$295", range:"$180–$560",  category:"Surveillance",     notes:"OSHA Lead Standard 1910.1025. BLL monitoring required." },
  { name:"Asbestos Medical Surveillance",     cpt:"99456+71046",     usAvg:"$350", range:"$200–$625",  category:"Surveillance",     notes:"OSHA 1910.1001. Chest X-ray + PFT + physician review." },
  { name:"HAZWOPER Medical Surveillance",     cpt:"99455",           usAvg:"$200", range:"$120–$400",  category:"Surveillance",     notes:"29 CFR 1910.120. Hazardous waste workers." },
  { name:"Ergonomic Job Analysis",            cpt:"99456",           usAvg:"$475", range:"$300–$950",  category:"Surveillance",     notes:"On-site component usually required. Injury prevention." },
  { name:"Travel Medicine Consult",           cpt:"99213",           usAvg:"$180", range:"$90–$360",   category:"Occupational Testing", notes:"Pre-travel vaccines extra. International programs." },
  { name:"Occupational Health Nurse Visit",   cpt:"99211",           usAvg:"$55",  range:"$30–$110",   category:"Physical Exams",   notes:"Routine follow-up, case management, first aid." },
];

const OCC_HEALTH_REGULATIONS = [
  { code:"OSHA 29 CFR 1910.134",  title:"Respiratory Protection",        requirement:"Medical clearance before respirator use",               frequency:"Annual or per change in status" },
  { code:"OSHA 29 CFR 1910.95",   title:"Occupational Noise Exposure",   requirement:"Annual audiogram for workers at 85+ dB",               frequency:"Annual" },
  { code:"OSHA 29 CFR 1910.1025", title:"Lead Standard",                 requirement:"Medical surveillance at 30 μg/m³ action level",        frequency:"Annual (semi-annual if elevated BLL)" },
  { code:"OSHA 29 CFR 1910.1001", title:"Asbestos",                      requirement:"Medical surveillance at action level (0.1 f/cc)",      frequency:"Annual" },
  { code:"OSHA 29 CFR 1910.120",  title:"HAZWOPER",                      requirement:"Medical surveillance for hazardous waste workers",       frequency:"Annual + baseline + exit" },
  { code:"FMCSA 49 CFR 391.41",   title:"DOT Physical (CMV Drivers)",    requirement:"Physical exam by FMCSA-certified examiner",            frequency:"Every 1–2 years" },
  { code:"FAA 14 CFR Part 67",    title:"Aviation Medical Certificate",  requirement:"Class 1/2/3 medical by FAA-designated AME",            frequency:"Class 1: 12mo/6mo; Class 3: 24/60mo" },
  { code:"DOT 49 CFR Part 40",    title:"Workplace Drug & Alcohol",      requirement:"Pre-employment, random, post-accident, RTD testing",   frequency:"Ongoing program management" },
  { code:"ADA / EEOC",            title:"Disability / FFD Compliance",   requirement:"Exams must be job-related and consistent with business necessity", frequency:"As needed" },
  { code:"NIOSH B-Reader",        title:"Pneumoconiosis Surveillance",   requirement:"B-reader interpretation for chest X-rays",             frequency:"Per exposure standard" },
];

const OCC_HEALTH_MARKET = {
  nationalNetworks: [
    { name:"Concentra", locations:600, notes:"Largest US Occ Med chain. Employer contracts. No walk-in pricing typically." },
    { name:"MedExpress (UHC)", locations:250, notes:"Urgent care / Occ Med hybrid. Good geographic spread." },
    { name:"WorkCare", locations:null, notes:"Telephonic case management + clinic referrals. Specialty in absence mgmt." },
    { name:"Premise Health", locations:null, notes:"On-site employer clinics. Rarely accessible for external network." },
    { name:"Matrix Medical Network", locations:null, notes:"Mobile health + in-home assessments. Strong rural reach." },
    { name:"Axiom Medical", locations:null, notes:"Case management + telehealth. Occ Health specialty." },
    { name:"OccMed / Independent Clinics", locations:null, notes:"Thousands of independent Occ Med physicians — harder to contract but price-competitive." },
  ],
  certifications: [
    "FMCSA Certified Medical Examiner (CME) — NRCME registry",
    "FAA Aviation Medical Examiner (AME) — FAA AME Locator",
    "NIOSH B-Reader (Chest X-ray interpretation)",
    "Medical Review Officer (MRO) — AAMRO / MROCC certified",
    "Certified Occupational Health Nurse (COHN-S) — ABOHN",
    "Board Certified Occ Med Physician (ABPM)",
    "CAOHC-Certified Audiometric Technician",
    "Certified Occupational Health Nurse Specialist (COHN-S)",
  ],
  registries: [
    { name:"FMCSA NRCME Registry", url:"https://nationalregistry.fmcsa.dot.gov/", notes:"Find DOT-certified examiners by zip code" },
    { name:"FAA AME Locator", url:"https://amsrvs.registry.faa.gov/ameLocator/", notes:"Find Aviation Medical Examiners by location" },
    { name:"ABPM Diplomate Finder", url:"https://www.abpm.org/", notes:"Board-certified Occ Med physicians" },
    { name:"CMS NPI Registry", url:"https://npiregistry.cms.hhs.gov/", notes:"All licensed US providers by taxonomy" },
  ],
  pricingContext: "Occupational medicine pricing is almost entirely employer-negotiated. Posted prices are rare — most providers operate on Master Service Agreements (MSAs) with employers or TPAs. Self-pay walk-in pricing (when available) is typically 15–40% higher than contract rates. Pre-employment physicals are the most commonly posted service. DOT physicals have the most price transparency (~$75–$175 range). FAA AME fees are set by individual examiners with no federal fee schedule.",
  demandDrivers: [
    "OSHA medical surveillance mandates drive predictable recurring volume",
    "DOT/FMCSA compliance affects ~7 million commercial motor vehicle drivers nationally",
    "FAA medical certificates affect ~600,000 active pilots in the US",
    "Workers compensation creates high-volume, state-regulated exam demand",
    "Employer wellness & return-to-work programs creating growing demand",
    "Drug & alcohol testing programs: ~55 million tests annually in the US",
    "Healthcare deserts compound difficulty — rural areas often 0–2 Occ Med providers per county",
  ],
};


// ── Types ─────────────────────────────────────────────────────────────────────
interface ContactAttempt {
  id:string; organizationName:string; contactMethod:"phone"|"email"|"web"|"in-person"|"fax";
  date:string; outcome:"no_response"|"declined"|"pending"|"partial"|"confirmed"|"referral";
  notes:string; contactedBy:string; priceConfirmed?:string; followUpRequired:boolean;
}
interface PriorSearch {
  id:string; searchDate:string; searchedBy:string; region:string; providerType:string;
  outcome:"successful"|"partial"|"unsuccessful"|"ongoing";
  providersFound:number; avgPriceFound:string; notes:string;
}
interface ReportRequest {
  requestId:string; requestDate:string; requestedBy:string; requestingDept:string;
  priority:string; dueDate:string; providerType:string; serviceDescription:string;
  targetRegion:string; targetCountry:string; targetState:string; targetCity:string;
  searchRadiusMiles:string; isInternational:boolean;
  contactAttempts:ContactAttempt[]; priorSearches:PriorSearch[];
  internalNotes:string; confirmedAvgPrice:string; priceRange:string;
  specialRequirements:string; searchStatus:string; assignedTo:string;
  estimatedCompletion:string; occHealthServices:string[];
}
interface IntelligenceData {
  fetchedAt:string; countryMeta?:Record<string,unknown>; worldBankData?:Record<string,number|null>;
  whoData?:Record<string,unknown>; osmProviderData?:Record<string,unknown>;
  npiData?:Record<string,unknown>; censusData?:Record<string,unknown>;
  healthAccessData?:Record<string,unknown>;
  sources:Array<{name:string;url:string;status:string;dataPoints:string[]}>;
}

const PROVIDER_DIFFICULTY:Record<string,{base:number;label:string;taxonomy:string}> = {
  "Occupational Medicine":    {base:72,label:"High",taxonomy:"Occupational Medicine"},
  "FAA Aviation Medical":     {base:88,label:"Very High",taxonomy:"Aerospace Medicine"},
  "DOT Physical Examiner":    {base:68,label:"High",taxonomy:"Occupational Medicine"},
  "Urgent Care":              {base:28,label:"Low",taxonomy:"Urgent Care"},
  "Primary Care / GP":        {base:22,label:"Low",taxonomy:"Family Medicine"},
  "Cardiology / Stress Test": {base:55,label:"Moderate",taxonomy:"Cardiovascular Disease"},
  "Radiology / Mammogram":    {base:42,label:"Moderate",taxonomy:"Diagnostic Radiology"},
  "Dental":                   {base:30,label:"Low-Moderate",taxonomy:"Dentist"},
  "Drug Screening / Lab":     {base:35,label:"Low-Moderate",taxonomy:"Clinical Laboratory"},
  "Audiology":                {base:60,label:"Moderate-High",taxonomy:"Audiology"},
  "Physical Therapy":         {base:38,label:"Low-Moderate",taxonomy:"Physical Therapist"},
  "Mental Health":            {base:65,label:"High",taxonomy:"Psychiatry & Neurology"},
  "Specialist (Other)":       {base:58,label:"Moderate-High",taxonomy:"Internal Medicine"},
};

function computeScores(req:ReportRequest, intel:IntelligenceData|null) {
  const provBase = PROVIDER_DIFFICULTY[req.providerType]?.base ?? 55;
  let provDiff = provBase;
  const npi = intel?.npiData as Record<string,unknown>|undefined;
  if (npi) {
    const c = Number(npi.resultCount??0);
    if (c>50000) provDiff=Math.max(provBase-15,10);
    else if (c>10000) provDiff=Math.max(provBase-8,15);
    else if (c<500) provDiff=Math.min(provBase+18,96);
    else if (c<2000) provDiff=Math.min(provBase+10,92);
  }
  const wb = intel?.worldBankData as Record<string,number|null>|undefined;
  const uhcVals = ((intel?.whoData as Record<string,unknown>|undefined)?.uhcIndexValues as Array<Record<string,unknown>>|undefined)??[];
  let countryDiff = req.isInternational ? 62 : 32;
  if (wb) {
    if (wb.physiciansper1k!=null) { if(wb.physiciansper1k>3.5)countryDiff-=20; else if(wb.physiciansper1k>2)countryDiff-=10; else if(wb.physiciansper1k<0.5)countryDiff+=25; else if(wb.physiciansper1k<1)countryDiff+=15; }
    if (wb.healthExpPctGDP!=null) { if(wb.healthExpPctGDP>10)countryDiff-=10; else if(wb.healthExpPctGDP<3)countryDiff+=15; }
    if (uhcVals[0]?.value!=null) { const u=Number(uhcVals[0].value); if(u>80)countryDiff-=12; else if(u<50)countryDiff+=18; }
    countryDiff=Math.max(5,Math.min(countryDiff,95));
  }
  const osm = intel?.osmProviderData as Record<string,unknown>|undefined;
  let desertScore = 52;
  if (osm) {
    const f=Number(osm.totalMedicalFacilities??0);
    if(f>300)desertScore=15; else if(f>150)desertScore=28; else if(f>50)desertScore=42; else if(f>20)desertScore=62; else if(f>5)desertScore=78; else desertScore=91;
  }
  const failedContacts=req.contactAttempts.filter(c=>c.outcome==="no_response"||c.outcome==="declined").length;
  const contactPenalty=Math.min(failedContacts*6,30);
  const priorSuccess=req.priorSearches.some(p=>p.outcome==="successful");
  const priorBonus=priorSuccess?-12:0;
  const intlMult=req.isInternational?1.30:1.0;
  const raw=((provDiff*0.38)+(countryDiff*0.30)+(desertScore*0.22)+contactPenalty+priorBonus)*intlMult;
  const overallDifficulty=Math.min(Math.round(raw),99);
  const baseDays=req.isInternational?Math.round(5+(overallDifficulty/100)*55):Math.round(2+(overallDifficulty/100)*28);
  const difficultyLabel=overallDifficulty>=80?"Critical":overallDifficulty>=65?"Very High":overallDifficulty>=50?"High":overallDifficulty>=35?"Moderate":"Low";
  const difficultyColor=overallDifficulty>=80?"#ef4444":overallDifficulty>=65?"#f97316":overallDifficulty>=50?"#eab308":overallDifficulty>=35?"#22d3ee":"#22c55e";
  return {overallDifficulty,difficultyLabel,difficultyColor,baseDays,failedContacts,priorSuccess,provDiff,countryDiff,desertScore};
}

function uid(){return Math.random().toString(36).slice(2,9);}

function GC({children,className=""}:{children:React.ReactNode;className?:string}){
  return <div className={`rounded-2xl border border-[rgba(99,179,237,0.1)] bg-[rgba(10,18,36,0.65)] backdrop-blur-2xl shadow-[0_4px_32px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06),0_0_1px_rgba(99,179,237,0.08)] intel-card-hover transition-all duration-300 ${className}`}>{children}</div>;
}
function SH({icon:Icon,title,subtitle}:{icon:React.ElementType;title:string;subtitle?:string}){
  return <div className="flex items-start gap-3 mb-5"><div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center shrink-0 mt-0.5"><Icon className="w-4 h-4 text-sky-400"/></div><div><h3 className="text-sm font-semibold text-white/90 tracking-tight">{title}</h3>{subtitle&&<p className="text-xs text-white/40 mt-0.5">{subtitle}</p>}</div></div>;
}
function Field({label,children}:{label:string;children:React.ReactNode}){
  return <div className="flex flex-col gap-1.5"><label className="intel-label">{label}</label>{children}</div>;
}
function Inp({value,onChange,placeholder,type="text"}:{value:string;onChange:(v:string)=>void;placeholder?:string;type?:string}){
  return <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="intel-input"/>;
}
function Sel({value,onChange,options}:{value:string;onChange:(v:string)=>void;options:{value:string;label:string}[]}){
  return <select value={value} onChange={e=>onChange(e.target.value)} className="intel-select">{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>;
}
function TA({value,onChange,placeholder,rows=3}:{value:string;onChange:(v:string)=>void;placeholder?:string;rows?:number}){
  return <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} className="intel-input resize-none"/>;
}
function Stat({label,value,sub,color="text-white/90"}:{label:string;value:string|number|null;sub?:string;color?:string}){
  return <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-4 flex flex-col gap-1"><p className="text-[10px] font-bold text-white/35 uppercase tracking-widest">{label}</p><p className={`text-xl font-bold leading-tight ${color}`}>{value??'—'}</p>{sub&&<p className="text-[10px] text-white/30">{sub}</p>}</div>;
}
function ScoreGauge({score,color,label}:{score:number;color:string;label:string}){
  const r=52,circ=2*Math.PI*r,dash=(score/100)*circ;
  return <div className="flex flex-col items-center gap-2"><svg width="136" height="136" viewBox="0 0 136 136"><circle cx="68" cy="68" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12"/><circle cx="68" cy="68" r={r} fill="none" stroke={color} strokeWidth="12" strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={circ/4} strokeLinecap="round" style={{filter:`drop-shadow(0 0 10px ${color})drop-shadow(0 0 22px ${color}60)`}}/><text x="68" y="64" textAnchor="middle" fill="white" fontSize="26" fontWeight="700" fontFamily="system-ui">{score}</text><text x="68" y="80" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="system-ui">/ 100</text></svg><span className="text-xs font-bold tracking-widest uppercase" style={{color}}>{label}</span></div>;
}
function LB({status}:{status:string}){
  const ok=status.startsWith("✅");
  return <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ok?"text-green-400 bg-green-500/10 border-green-500/25":"text-yellow-400 bg-yellow-500/10 border-yellow-500/25"}`}>{ok?<CheckCircle2 className="w-2.5 h-2.5"/>:<AlertCircle className="w-2.5 h-2.5"/>}{ok?"Live":"Partial"}</span>;
}

const OC:Record<string,string>={no_response:"text-red-400 bg-red-500/10 border-red-500/25",declined:"text-red-400 bg-red-500/10 border-red-500/25",pending:"text-yellow-400 bg-yellow-500/10 border-yellow-500/25",partial:"text-blue-400 bg-blue-500/10 border-blue-500/25",confirmed:"text-green-400 bg-green-500/10 border-green-500/25",referral:"text-purple-400 bg-purple-500/10 border-purple-500/25",successful:"text-green-400 bg-green-500/10 border-green-500/25",unsuccessful:"text-red-400 bg-red-500/10 border-red-500/25",ongoing:"text-yellow-400 bg-yellow-500/10 border-yellow-500/25"};
const PC:Record<string,string>={routine:"text-blue-300 bg-blue-500/10 border-blue-500/25",urgent:"text-orange-300 bg-orange-500/10 border-orange-500/25",critical:"text-red-300 bg-red-500/10 border-red-500/25"};
const SC:Record<string,string>={not_started:"text-slate-400 bg-slate-500/10 border-slate-500/25",in_progress:"text-cyan-400 bg-cyan-500/10 border-cyan-500/25",on_hold:"text-yellow-400 bg-yellow-500/10 border-yellow-500/25",completed:"text-green-400 bg-green-500/10 border-green-500/25",escalated:"text-red-400 bg-red-500/10 border-red-500/25"};

const US_STATES=["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming","Other"];
const COUNTRIES=["United States","Canada","United Kingdom","Germany","Australia","France","Japan","Netherlands","Sweden","Norway","Denmark","Switzerland","Spain","Italy","Brazil","Mexico","Colombia","Argentina","India","China","South Korea","Singapore","Thailand","Philippines","Indonesia","South Africa","Nigeria","Kenya","Egypt","Saudi Arabia","UAE","Israel","Turkey","Russia","Poland","New Zealand","Remote/Rural Area","Other"];

const EMPTY:ReportRequest={
  requestId:`OM-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`,
  requestDate:new Date().toISOString().split("T")[0],
  requestedBy:"",requestingDept:"network",priority:"routine",dueDate:"",
  providerType:"Occupational Medicine",serviceDescription:"",targetRegion:"",
  targetCountry:"United States",targetState:"California",targetCity:"",
  searchRadiusMiles:"25",isInternational:false,
  contactAttempts:[],priorSearches:[],internalNotes:"",confirmedAvgPrice:"",
  priceRange:"",specialRequirements:"",searchStatus:"not_started",assignedTo:"",
  estimatedCompletion:"",occHealthServices:[],
};


export default function ReportPage() {
  const [,navigate]=useLocation();
  const [req,setReq]=useState<ReportRequest>({...EMPTY});
  const [activeTab,setActiveTab]=useState<"intake"|"intelligence"|"report">("intake");
  const [expandSources,setExpandSources]=useState(false);
  const [showAllSvc,setShowAllSvc]=useState(false);
  const [intel,setIntel]=useState<IntelligenceData|null>(null);
  const [scoreData,setScoreData]=useState<Record<string,unknown>|null>(null);
  const [loading,setLoading]=useState(false);
  const [fetchErr,setFetchErr]=useState<string|null>(null);
  const [reportReady,setReportReady]=useState(false);
  const reportRef=useRef<HTMLDivElement>(null);

  const set=(k:keyof ReportRequest,v:unknown)=>setReq(r=>({...r,[k]:v}));

  const addContact=()=>{set("contactAttempts",[...req.contactAttempts,{id:uid(),organizationName:"",contactMethod:"phone",date:new Date().toISOString().split("T")[0],outcome:"pending",notes:"",contactedBy:"",priceConfirmed:"",followUpRequired:false}]);};
  const upContact=(id:string,k:keyof ContactAttempt,v:unknown)=>set("contactAttempts",req.contactAttempts.map(c=>c.id===id?{...c,[k]:v}:c));
  const delContact=(id:string)=>set("contactAttempts",req.contactAttempts.filter(c=>c.id!==id));
  const addPrior=()=>{set("priorSearches",[...req.priorSearches,{id:uid(),searchDate:"",searchedBy:"",region:req.targetRegion,providerType:req.providerType,outcome:"unsuccessful",providersFound:0,avgPriceFound:"",notes:""}]);};
  const upPrior=(id:string,k:keyof PriorSearch,v:unknown)=>set("priorSearches",req.priorSearches.map(p=>p.id===id?{...p,[k]:v}:p));
  const delPrior=(id:string)=>set("priorSearches",req.priorSearches.filter(p=>p.id!==id));
  const toggleSvc=(name:string)=>{const c=req.occHealthServices;set("occHealthServices",c.includes(name)?c.filter(s=>s!==name):[...c,name]);};

  const fetchIntel=useCallback(async()=>{
    setLoading(true);setFetchErr(null);
    try{
      const base=import.meta.env.VITE_API_URL||"";
      const p=new URLSearchParams({country:req.targetCountry,state:req.targetState,city:req.targetCity,providerType:req.providerType});
      const r=await fetch(`${base}/api/report/intelligence?${p}`,{signal:AbortSignal.timeout(60000)});
      if(!r.ok)throw new Error(`Server error: ${r.status}`);
      setIntel(await r.json() as IntelligenceData);
    }catch(e){setFetchErr((e as Error).message);}
    finally{setLoading(false);}
  },[req.targetCountry,req.targetState,req.targetCity,req.providerType]);

  const fetchScore=useCallback(async(intelData: IntelligenceData)=>{
    try{
      const base=import.meta.env.VITE_API_URL||"";
      const r=await fetch(`${base}/api/report/score`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          intel: intelData,
          providerType: req.providerType,
          country: req.targetCountry,
          state: req.targetState,
          city: req.targetCity,
          radius: parseInt(req.searchRadiusMiles)||25,
          services: req.occHealthServices,
          isInternational: req.isInternational,
        }),
        signal:AbortSignal.timeout(30000),
      });
      if(r.ok)setScoreData(await r.json());
    }catch(e){console.warn("Score fetch failed",(e as Error).message);}
  },[req.providerType,req.targetCountry,req.targetState,req.targetCity,req.searchRadiusMiles,req.occHealthServices,req.isInternational]);

  const generate=async()=>{
    let intelResult=intel;
    if(!intelResult){
      setLoading(true);setFetchErr(null);
      try{
        const base=import.meta.env.VITE_API_URL||"";
        const p=new URLSearchParams({country:req.targetCountry,state:req.targetState,city:req.targetCity,providerType:req.providerType});
        const r=await fetch(`${base}/api/report/intelligence?${p}`,{signal:AbortSignal.timeout(60000)});
        if(!r.ok)throw new Error(`Server error: ${r.status}`);
        intelResult=await r.json() as IntelligenceData;
        setIntel(intelResult);
      }catch(e){setFetchErr((e as Error).message);}
      finally{setLoading(false);}
    }
    if(intelResult) await fetchScore(intelResult);
    setReportReady(true);
    setActiveTab("report");
  };

  const wb=intel?.worldBankData as Record<string,number|null>|undefined;
  const npi=intel?.npiData as Record<string,unknown>|undefined;
  const osm=intel?.osmProviderData as Record<string,unknown>|undefined;
  const census=intel?.censusData as Record<string,unknown>|undefined;
  const meta=intel?.countryMeta as Record<string,unknown>|undefined;
  const uhcVals=((intel?.whoData as Record<string,unknown>|undefined)?.uhcIndexValues as Array<Record<string,unknown>>|undefined)??[];
  const scores=computeScores(req,intel);
  const isOcc=["Occupational Medicine","DOT Physical Examiner","FAA Aviation Medical"].includes(req.providerType);
  const selSvcs=OCC_HEALTH_SERVICES.filter(s=>req.occHealthServices.includes(s.name));
  const svcCategories=[...new Set(OCC_HEALTH_SERVICES.map(s=>s.category))];

  const TABS=[{id:"intake",label:"Request Intake",icon:FileText},{id:"intelligence",label:"Field Intelligence",icon:Database},{id:"report",label:"Report",icon:BarChart3}] as const;

  return (
    <div className="atmo-bg min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="glass-sidebar border-b border-white/[0.06] sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={()=>navigate("/")} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all text-xs font-medium"><ChevronLeft className="w-3.5 h-3.5"/>Hub</button>
            <div className="w-px h-4 bg-white/10"/>
            <span className="text-sm font-semibold text-white/90">Provider Search Intelligence Report</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {intel&&<div className="flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full"><Wifi className="w-2.5 h-2.5"/>{intel.sources.filter(s=>s.status.startsWith("✅")).length}/{intel.sources.length} live</div>}
            <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border ${PC[req.priority]}`}>{req.priority}</span>
            <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border ${SC[req.searchStatus]}`}>{req.searchStatus.replace("_"," ")}</span>
            <button onClick={generate} disabled={loading} className="generate-btn flex items-center gap-2">
              {loading
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin text-sky-300"/>
                    <span className="text-sky-200">Fetching Intel…</span></>
                : <><Zap className="w-3.5 h-3.5"/>
                    <span>Generate Report</span></>}
            </button>
          </div>
        </div>
      </header>

      {/* ── Tabs ── */}
      <div className="border-b border-white/[0.06] bg-black/20 sticky top-14 z-40">
        <div className="max-w-screen-xl mx-auto px-4 flex gap-1 py-2">
          {TABS.map(t=>{const A=activeTab===t.id;const I=t.icon;return(
            <button key={t.id} onClick={()=>setActiveTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${A?"bg-sky-500/15 text-sky-300 border border-sky-500/25":"text-white/40 hover:text-white/70 hover:bg-white/[0.04]"}`}>
              <I className="w-3.5 h-3.5"/>{t.label}{t.id==="report"&&reportReady&&<span className="w-1.5 h-1.5 rounded-full bg-green-400"/>}
            </button>
          );})}
        </div>
      </div>

      <div className="flex-1 max-w-screen-xl mx-auto w-full px-4 py-8">
        <AnimatePresence mode="wait">

        {/* ═══════ TAB 1 — INTAKE ═══════ */}
        {activeTab==="intake"&&(
          <motion.div key="intake" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.3}} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <GC className="p-6">
              <SH icon={FileText} title="Request Identity" subtitle="Who asked, when, how urgent"/>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Request ID"><Inp value={req.requestId} onChange={v=>set("requestId",v)}/></Field>
                <Field label="Request Date"><Inp type="date" value={req.requestDate} onChange={v=>set("requestDate",v)}/></Field>
                <Field label="Requested By"><Inp value={req.requestedBy} onChange={v=>set("requestedBy",v)} placeholder="Name"/></Field>
                <Field label="Department"><Sel value={req.requestingDept} onChange={v=>set("requestingDept",v)} options={[{value:"operations",label:"Operations"},{value:"finance",label:"Finance"},{value:"network",label:"Network Development"},{value:"clinical",label:"Clinical"},{value:"executive",label:"Executive"}]}/></Field>
                <Field label="Priority"><Sel value={req.priority} onChange={v=>set("priority",v)} options={[{value:"routine",label:"Routine"},{value:"urgent",label:"Urgent"},{value:"critical",label:"Critical"}]}/></Field>
                <Field label="Due Date"><Inp type="date" value={req.dueDate} onChange={v=>set("dueDate",v)}/></Field>
                <Field label="Assigned To"><Inp value={req.assignedTo} onChange={v=>set("assignedTo",v)} placeholder="Staff name"/></Field>
                <Field label="Status"><Sel value={req.searchStatus} onChange={v=>set("searchStatus",v)} options={[{value:"not_started",label:"Not Started"},{value:"in_progress",label:"In Progress"},{value:"on_hold",label:"On Hold"},{value:"completed",label:"Completed"},{value:"escalated",label:"Escalated"}]}/></Field>
              </div>
            </GC>

            <GC className="p-6">
              <SH icon={MapPin} title="Provider & Location"/>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Provider Type"><Sel value={req.providerType} onChange={v=>set("providerType",v)} options={Object.keys(PROVIDER_DIFFICULTY).map(k=>({value:k,label:k}))}/></Field>
                <Field label="Radius (miles)"><Inp value={req.searchRadiusMiles} onChange={v=>set("searchRadiusMiles",v)} placeholder="25"/></Field>
                <Field label="Country"><Sel value={req.targetCountry} onChange={v=>{set("targetCountry",v);set("isInternational",v!=="United States");}} options={COUNTRIES.map(k=>({value:k,label:k}))}/></Field>
                <Field label="State"><Sel value={req.targetState} onChange={v=>set("targetState",v)} options={US_STATES.map(k=>({value:k,label:k}))}/></Field>
                <Field label="City"><Inp value={req.targetCity} onChange={v=>set("targetCity",v)} placeholder="City"/></Field>
                <Field label="Zone"><Inp value={req.targetRegion} onChange={v=>set("targetRegion",v)} placeholder="Rural, Metro…"/></Field>
                <div className="col-span-2"><Field label="Service Description"><TA value={req.serviceDescription} onChange={v=>set("serviceDescription",v)} placeholder="Exact services needed…" rows={2}/></Field></div>
                <div className="col-span-2"><Field label="Special Requirements / Certifications Needed"><TA value={req.specialRequirements} onChange={v=>set("specialRequirements",v)} placeholder="e.g. FMCSA CME, FAA AME, MRO, B-reader, bilingual, on-site capable…" rows={2}/></Field></div>
              </div>
            </GC>

            {/* Occ Health services selector */}
            {isOcc&&(
              <GC className="p-6 lg:col-span-2">
                <SH icon={Stethoscope} title="Occupational Health Services Required" subtitle="Select all that apply — pricing benchmarks and regulatory context auto-populate in the report"/>
                {svcCategories.map(cat=>{
                  const catSvcs=OCC_HEALTH_SERVICES.filter(s=>s.category===cat);
                  const visible=showAllSvc?catSvcs:catSvcs.slice(0,6);
                  return(
                    <div key={cat} className="mb-5">
                      <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-2">{cat}</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {visible.map(svc=>{
                          const sel=req.occHealthServices.includes(svc.name);
                          return(
                            <button key={svc.name} onClick={()=>toggleSvc(svc.name)} className={`text-left p-3 rounded-xl border text-xs transition-all ${sel?"bg-sky-500/15 border-sky-500/30 text-sky-300":"bg-white/[0.03] border-white/[0.07] text-white/55 hover:border-white/15 hover:text-white/75"}`}>
                              <div className="font-semibold leading-snug mb-1">{svc.name}</div>
                              <div className="text-[10px] opacity-60">{svc.usAvg} · {svc.cpt}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <button onClick={()=>setShowAllSvc(!showAllSvc)} className="text-xs text-sky-400/60 hover:text-sky-400 flex items-center gap-1 transition-colors mt-1">
                  {showAllSvc?<><ChevronUp className="w-3 h-3"/>Show less</>:<><ChevronDown className="w-3 h-3"/>Show all {OCC_HEALTH_SERVICES.length} services</>}
                </button>
                {req.occHealthServices.length>0&&(
                  <div className="mt-3 rounded-xl bg-sky-500/5 border border-sky-500/15 p-3">
                    <p className="text-[10px] font-bold text-sky-400/60 uppercase tracking-widest mb-2">{req.occHealthServices.length} selected</p>
                    <div className="flex flex-wrap gap-1.5">{req.occHealthServices.map(s=><span key={s} className="text-xs bg-sky-500/15 border border-sky-500/25 text-sky-300 px-2 py-0.5 rounded-full">{s}</span>)}</div>
                  </div>
                )}
              </GC>
            )}

            <GC className="p-6">
              <SH icon={DollarSign} title="Pricing — What We've Confirmed"/>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Confirmed Avg Price"><Inp value={req.confirmedAvgPrice} onChange={v=>set("confirmedAvgPrice",v)} placeholder="$0.00"/></Field>
                <Field label="Range Observed"><Inp value={req.priceRange} onChange={v=>set("priceRange",v)} placeholder="$XXX – $XXX"/></Field>
              </div>
            </GC>

            <GC className="p-6">
              <SH icon={Activity} title="Internal Notes" subtitle="Operations & Finance only"/>
              <TA value={req.internalNotes} onChange={v=>set("internalNotes",v)} placeholder="Background, client sensitivity, escalation history, timeline pressures…" rows={6}/>
            </GC>
          </motion.div>
        )}

        {/* ═══════ TAB 2 — FIELD INTEL ═══════ */}
        {activeTab==="intelligence"&&(
          <motion.div key="intel" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.3}} className="flex flex-col gap-6">
            <GC className="p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div><SH icon={Wifi} title="Live Intelligence Fetch" subtitle="World Bank · WHO · CMS NPI Registry · US Census · OpenStreetMap · REST Countries · ExchangeRate-API"/><p className="text-xs text-white/40 ml-11 -mt-2">Target: <strong className="text-white/60">{req.targetCity||req.targetState}, {req.targetCountry}</strong> · <strong className="text-white/60">{req.providerType}</strong></p></div>
                <button onClick={fetchIntel} disabled={loading} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-300 text-sm font-semibold hover:bg-sky-500/30 transition-all disabled:opacity-50 shrink-0">
                  {loading?<><Loader2 className="w-4 h-4 animate-spin"/>Fetching…</>:intel?<><RefreshCw className="w-4 h-4"/>Refresh</>:<><Zap className="w-4 h-4"/>Fetch Live Data</>}
                </button>
              </div>
              {fetchErr&&<div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3"><AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5"/><p className="text-xs text-red-400/80">{fetchErr}</p></div>}
              {intel&&(
                <div className="mt-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-semibold text-white/60">Sources queried:</span>
                    <span className="text-[10px] text-green-400">{intel.sources.filter(s=>s.status.startsWith("✅")).length} live</span>
                    <span className="text-white/20">·</span>
                    <span className="text-[10px] text-yellow-400">{intel.sources.filter(s=>s.status.startsWith("⚠️")).length} partial</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {intel.sources.map(src=>(
                      <div key={src.name} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-xs font-semibold text-white/75">{src.name}</span>
                          <div className="flex items-center gap-1.5 shrink-0"><LB status={src.status}/>{src.url&&src.url!=="&"&&<a href={src.url} target="_blank" rel="noopener noreferrer" className="text-sky-400/40 hover:text-sky-400"><ArrowUpRight className="w-3 h-3"/></a>}</div>
                        </div>
                        {src.dataPoints.length>0&&<div className="flex flex-wrap gap-1">{src.dataPoints.map(dp=><span key={dp} className="text-[9px] bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded text-white/35">{dp}</span>)}</div>}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-white/20 mt-3">Fetched: {new Date(intel.fetchedAt).toLocaleString()}</p>
                </div>
              )}
              {!intel&&!loading&&!fetchErr&&<div className="mt-4 rounded-xl bg-white/[0.02] border border-white/[0.06] p-6 text-center"><WifiOff className="w-8 h-8 text-white/15 mx-auto mb-2"/><p className="text-sm text-white/30">Click "Fetch Live Data" to query 10 external databases in real time</p></div>}
            </GC>

            {/* Contact log */}
            <GC className="p-6">
              <div className="flex items-center justify-between mb-5"><SH icon={Phone} title="Contact Attempts Log" subtitle={`${req.contactAttempts.length} recorded`}/><button onClick={addContact} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 border border-sky-500/25 text-sky-300 text-xs font-semibold hover:bg-sky-500/25 transition-all"><Plus className="w-3.5 h-3.5"/>Add</button></div>
              {req.contactAttempts.length===0&&<div className="text-center py-10 text-white/25 text-sm">No contacts logged</div>}
              <div className="flex flex-col gap-4">
                {req.contactAttempts.map((c,i)=>(
                  <div key={c.id} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                    <div className="flex items-center justify-between mb-3"><span className="text-xs font-bold text-white/50 uppercase tracking-widest">Contact #{i+1}</span><button onClick={()=>delContact(c.id)} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button></div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="col-span-2 md:col-span-1"><Field label="Organization"><Inp value={c.organizationName} onChange={v=>upContact(c.id,"organizationName",v)} placeholder="Clinic / provider"/></Field></div>
                      <Field label="Method"><Sel value={c.contactMethod} onChange={v=>upContact(c.id,"contactMethod",v)} options={[{value:"phone",label:"Phone"},{value:"email",label:"Email"},{value:"web",label:"Web"},{value:"in-person",label:"In Person"},{value:"fax",label:"Fax"}]}/></Field>
                      <Field label="Date"><Inp type="date" value={c.date} onChange={v=>upContact(c.id,"date",v)}/></Field>
                      <Field label="Outcome"><Sel value={c.outcome} onChange={v=>upContact(c.id,"outcome",v)} options={[{value:"pending",label:"Pending"},{value:"no_response",label:"No Response"},{value:"declined",label:"Declined"},{value:"partial",label:"Partial"},{value:"confirmed",label:"Confirmed"},{value:"referral",label:"Referred"}]}/></Field>
                      <Field label="Contacted By"><Inp value={c.contactedBy} onChange={v=>upContact(c.id,"contactedBy",v)} placeholder="Staff"/></Field>
                      <Field label="Price Confirmed"><Inp value={c.priceConfirmed??""} onChange={v=>upContact(c.id,"priceConfirmed",v)} placeholder="$0.00"/></Field>
                      <div className="col-span-2 md:col-span-3"><Field label="Notes"><TA value={c.notes} onChange={v=>upContact(c.id,"notes",v)} rows={2}/></Field></div>
                    </div>
                  </div>
                ))}
              </div>
            </GC>

            {/* Prior searches */}
            <GC className="p-6">
              <div className="flex items-center justify-between mb-5"><SH icon={Clock} title="Prior Search History" subtitle="Has this been searched before?"/><button onClick={addPrior} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 border border-sky-500/25 text-sky-300 text-xs font-semibold hover:bg-sky-500/25 transition-all"><Plus className="w-3.5 h-3.5"/>Add</button></div>
              {req.priorSearches.length===0&&<div className="text-center py-10 text-white/25 text-sm">No prior history</div>}
              <div className="flex flex-col gap-4">
                {req.priorSearches.map((p,i)=>(
                  <div key={p.id} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                    <div className="flex items-center justify-between mb-3"><span className="text-xs font-bold text-white/50 uppercase tracking-widest">Prior #{i+1}</span><button onClick={()=>delPrior(p.id)} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button></div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <Field label="Date"><Inp type="date" value={p.searchDate} onChange={v=>upPrior(p.id,"searchDate",v)}/></Field>
                      <Field label="By"><Inp value={p.searchedBy} onChange={v=>upPrior(p.id,"searchedBy",v)} placeholder="Staff"/></Field>
                      <Field label="Outcome"><Sel value={p.outcome} onChange={v=>upPrior(p.id,"outcome",v)} options={[{value:"successful",label:"Successful"},{value:"partial",label:"Partial"},{value:"unsuccessful",label:"Unsuccessful"},{value:"ongoing",label:"Ongoing"}]}/></Field>
                      <Field label="Providers Found"><Inp type="number" value={String(p.providersFound)} onChange={v=>upPrior(p.id,"providersFound",parseInt(v)||0)}/></Field>
                      <Field label="Avg Price"><Inp value={p.avgPriceFound} onChange={v=>upPrior(p.id,"avgPriceFound",v)} placeholder="$0.00"/></Field>
                      <div className="col-span-2 md:col-span-3"><Field label="Notes"><TA value={p.notes} onChange={v=>upPrior(p.id,"notes",v)} rows={2}/></Field></div>
                    </div>
                  </div>
                ))}
              </div>
            </GC>
          </motion.div>
        )}

        {/* ═══════ TAB 3 — REPORT ═══════ */}
        {activeTab==="report"&&(
          <motion.div key="report" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.3}}>
            {!reportReady?(
              <div className="flex flex-col items-center justify-center py-32 gap-4 text-white/30"><BarChart3 className="w-12 h-12 opacity-30"/><p className="text-sm">Fill intake form → click <strong className="text-white/50">Generate Report</strong></p></div>
            ):(
              <div ref={reportRef} className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div><h2 className="text-lg font-bold text-white/90">Provider Search Intelligence Report</h2><p className="text-xs text-white/35 mt-0.5">{req.requestId} · {new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}{intel&&<> · <span className="text-green-400">{intel.sources.filter(s=>s.status.startsWith("✅")).length} live sources</span></>}</p></div>
                  <button onClick={()=>window.print()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-white/50 text-xs hover:text-white/80 hover:bg-white/[0.09] transition-all"><Printer className="w-3.5 h-3.5"/>Print</button>
                </div>

                {!intel&&<div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4 flex items-start gap-3"><AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5"/><p className="text-xs text-yellow-400/80">Using static reference data. Go to <strong>Field Intelligence</strong> → <strong>Fetch Live Data</strong> to enrich with real-time external databases.</p></div>}

                {/* Executive Summary */}
                <GC className="p-7">
                  {/* Live score banner — shown when /api/report/score returned data */}
                  {scoreData&&(
                    <div className="mb-6 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5 relative overflow-hidden">
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/50 to-transparent"/>
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center shrink-0">
                          <Database className="w-4 h-4 text-sky-400"/>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-sky-200 tracking-tight">Live Intelligence Assessment</h3>
                          <p className="text-xs text-white/40 mt-0.5">{(scoreData.scores as Record<string,Record<string,string>>)?.providerScarcity?.source}</p>
                        </div>
                        <div className="ml-auto text-right">
                          <div className="text-2xl font-bold" style={{color: scoreData.difficultyColor as string}}>{scoreData.timeline as string}</div>
                          <div className="text-[10px] text-white/40 mt-0.5">estimated search timeline</div>
                        </div>
                      </div>
                      {/* Key findings */}
                      {(scoreData.keyFindings as string[])?.length>0&&(
                        <div className="mb-4">
                          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Key Findings</p>
                          <div className="space-y-1.5">
                            {(scoreData.keyFindings as string[]).map((f,i)=>(
                              <div key={i} className="flex items-start gap-2 text-xs text-white/65">
                                <span className="text-sky-400 mt-0.5 shrink-0">▸</span>{f}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Recommendations */}
                      {(scoreData.recommendations as string[])?.length>0&&(
                        <div>
                          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Recommended Actions</p>
                          <div className="space-y-1.5">
                            {(scoreData.recommendations as string[]).map((r,i)=>(
                              <div key={i} className="flex items-start gap-2 text-xs text-orange-300/80">
                                <span className="text-orange-400 mt-0.5 shrink-0">→</span>{r}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-start gap-8 flex-wrap">
                    <div className="score-gauge-glow"><ScoreGauge score={scoreData?(scoreData.overallDifficulty as number):scores.overallDifficulty} color={scoreData?(scoreData.difficultyColor as string):scores.difficultyColor} label={`${scoreData?(scoreData.difficultyLabel as string):scores.difficultyLabel} Difficulty`}/></div>
                    <div className="flex-1 min-w-[280px]">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border ${PC[req.priority]}`}>{req.priority}</span>
                        <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border ${SC[req.searchStatus]}`}>{req.searchStatus.replace("_"," ")}</span>
                        {intel&&<span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">Live data enriched</span>}
                      </div>
                      <h3 className="text-lg font-bold text-white/90 mb-2">{req.providerType} — {req.targetCity&&`${req.targetCity}, `}{req.targetState}{req.isInternational?`, ${req.targetCountry}`:""}</h3>
                      <p className="text-sm text-white/55 leading-relaxed mb-4">
                        This request presents a <strong style={{color:scores.difficultyColor}}>{scores.difficultyLabel.toLowerCase()} difficulty</strong> search scenario.
                        {npi?<> The CMS NPI Registry shows <strong className="text-white/70">{(npi.resultCount as number).toLocaleString()} active licensed {String(npi.taxonomySearched)} providers</strong> in {req.targetState}.</>:""}
                        {osm?<> OpenStreetMap maps <strong className="text-white/70">{String(osm.totalMedicalFacilities)} medical facilities</strong> within 50km of {req.targetCity||req.targetState}.</>:""}
                        {wb?.physiciansper1k?<> Country-level physician density: <strong className="text-white/70">{wb.physiciansper1k.toFixed(2)}/1,000</strong>.</>:""}
                        {scores.failedContacts>0?<> <span className="text-red-400">{scores.failedContacts} failed contact attempt{scores.failedContacts>1?"s":""} on record.</span></>:""}
                        {" "}Estimated resolution: <strong className="text-white/75">{scores.baseDays}–{Math.round(scores.baseDays*1.4)} business days</strong>.
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Stat label="Est. Timeline" value={`${scores.baseDays}–${Math.round(scores.baseDays*1.4)}d`} sub="business days"/>
                        <Stat label="Contacts Attempted" value={req.contactAttempts.length} sub={`${scores.failedContacts} failed`}/>
                        <Stat label="Prior Searches" value={req.priorSearches.length} sub={scores.priorSuccess?"prior success":"none succeeded"} color={scores.priorSuccess?"text-green-400":"text-white/90"}/>
                        {npi&&<Stat label="NPI Providers" value={(npi.resultCount as number).toLocaleString()} sub={req.targetState} color="text-sky-300"/>}
                      </div>
                    </div>
                  </div>
                </GC>

                {/* ── Occ Health Deep Dive ── */}
                {isOcc&&(
                  <GC className="p-6">
                    <SH icon={Stethoscope} title="Occupational Health Market Intelligence" subtitle="Pricing · Regulations · Certifications · National Networks — Occu-Med context"/>

                    {/* Pricing context banner */}
                    <div className="rounded-xl bg-sky-500/5 border border-sky-500/15 p-4 mb-5">
                      <p className="text-[10px] font-bold text-sky-400/70 uppercase tracking-widest mb-2 flex items-center gap-1.5"><TrendingUp className="w-3 h-3"/>Pricing Market Context</p>
                      <p className="text-xs text-white/55 leading-relaxed">{OCC_HEALTH_MARKET.pricingContext}</p>
                    </div>

                    {/* Demand drivers */}
                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 mb-5">
                      <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-3 flex items-center gap-1.5"><BarChart3 className="w-3 h-3"/>Demand Drivers — Why This is Hard</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {OCC_HEALTH_MARKET.demandDrivers.map((d,i)=>(
                          <div key={i} className="flex items-start gap-2 text-xs text-white/50">
                            <span className="text-sky-400/60 shrink-0 mt-0.5">▸</span>{d}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Selected services */}
                    {selSvcs.length>0&&(
                      <div className="mb-5">
                        <p className="text-[10px] font-bold text-sky-400/60 uppercase tracking-widest mb-2">Services Selected for This Request</p>
                        <div className="space-y-2">
                          {selSvcs.map(svc=>(
                            <div key={svc.name} className="rounded-xl bg-sky-500/8 border border-sky-500/20 p-3 flex items-start justify-between gap-4 flex-wrap">
                              <div><p className="text-sm font-semibold text-sky-300">{svc.name}</p><p className="text-[10px] text-white/35 font-mono">{svc.cpt}</p><p className="text-xs text-white/40 mt-0.5">{svc.notes}</p></div>
                              <div className="text-right shrink-0"><p className="text-xl font-bold text-sky-300">{svc.usAvg}</p><p className="text-[10px] text-white/35">{svc.range}</p></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Full fee schedule by category */}
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Full Occupational Health Fee Schedule</p>
                    {svcCategories.map(cat=>(
                      <div key={cat} className="mb-4">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 pl-1">{cat}</p>
                        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                          <table className="w-full text-xs">
                            <thead><tr className="border-b border-white/[0.07] bg-white/[0.02]">{["Service","CPT / Code","US Avg","Range","Notes"].map(h=><th key={h} className="text-left py-2 px-3 text-[10px] font-bold text-white/30 uppercase tracking-widest">{h}</th>)}</tr></thead>
                            <tbody>
                              {OCC_HEALTH_SERVICES.filter(s=>s.category===cat).map(svc=>{
                                const sel=req.occHealthServices.includes(svc.name);
                                return <tr key={svc.name} className={`border-b border-white/[0.04] last:border-0 ${sel?"bg-sky-500/5":""}`}>
                                  <td className={`py-2 px-3 font-medium ${sel?"text-sky-300":"text-white/70"}`}>{svc.name}{sel&&<span className="ml-1 text-[9px] text-sky-400/60">✓</span>}</td>
                                  <td className="py-2 px-3 text-white/35 font-mono text-[10px]">{svc.cpt}</td>
                                  <td className="py-2 px-3 text-sky-300 font-bold">{svc.usAvg}</td>
                                  <td className="py-2 px-3 text-white/45">{svc.range}</td>
                                  <td className="py-2 px-3 text-white/30 max-w-[220px] text-[10px]">{svc.notes}</td>
                                </tr>;
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}

                    {/* Regulations */}
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3 mt-5 flex items-center gap-1.5"><Shield className="w-3 h-3"/>Applicable Regulatory Framework</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-5">
                      {OCC_HEALTH_REGULATIONS.map(reg=>(
                        <div key={reg.code} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                          <div className="flex items-start justify-between gap-2 mb-1"><span className="text-[10px] font-bold text-sky-400/70 font-mono">{reg.code}</span><span className="text-[9px] text-white/25 bg-white/[0.04] px-1.5 py-0.5 rounded shrink-0">{reg.frequency}</span></div>
                          <p className="text-xs font-semibold text-white/75">{reg.title}</p>
                          <p className="text-[10px] text-white/40 mt-0.5">{reg.requirement}</p>
                        </div>
                      ))}
                    </div>

                    {/* National Networks */}
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Building2 className="w-3 h-3"/>National Network Players</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-5">
                      {OCC_HEALTH_MARKET.nationalNetworks.map(n=>(
                        <div key={n.name} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                          <div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold text-white/80">{n.name}</span>{n.locations&&<span className="text-[9px] text-sky-400/60 bg-sky-500/10 px-1.5 py-0.5 rounded-full">{n.locations}+ locations</span>}</div>
                          <p className="text-[10px] text-white/40">{n.notes}</p>
                        </div>
                      ))}
                    </div>

                    {/* Registries */}
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3 flex items-center gap-1.5"><BadgeCheck className="w-3 h-3"/>Provider Certification Registries (Searchable)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-5">
                      {OCC_HEALTH_MARKET.registries.map(r=>(
                        <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 hover:border-sky-500/25 hover:bg-sky-500/5 transition-all group">
                          <div className="flex items-center justify-between mb-1"><span className="text-xs font-bold text-white/80 group-hover:text-sky-300 transition-colors">{r.name}</span><ArrowUpRight className="w-3 h-3 text-white/20 group-hover:text-sky-400 transition-colors"/></div>
                          <p className="text-[10px] text-white/40">{r.notes}</p>
                        </a>
                      ))}
                    </div>

                    {/* Required certs */}
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 flex items-center gap-1.5"><FlaskConical className="w-3 h-3"/>Certifications & Designations Required</p>
                    <div className="flex flex-wrap gap-1.5">
                      {OCC_HEALTH_MARKET.certifications.map(c=><span key={c} className="text-[10px] bg-white/[0.04] border border-white/[0.08] text-white/50 px-2 py-1 rounded-lg">{c}</span>)}
                    </div>
                  </GC>
                )}

                {/* Global health data */}
                {intel&&(wb||uhcVals.length>0)&&(
                  <GC className="p-6">
                    <SH icon={Globe2} title="Global Health System Intelligence" subtitle="World Bank Open Data + WHO GHO — live"/>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
                      <Stat label="Physicians / 1,000" value={wb?.physiciansper1k?.toFixed(2)??'—'} sub="World Bank" color={wb?.physiciansper1k&&wb.physiciansper1k>2.5?"text-green-400":wb?.physiciansper1k&&wb.physiciansper1k<0.8?"text-red-400":"text-sky-300"}/>
                      <Stat label="Hospital Beds / 1k" value={wb?.hospitalBedsPer1k?.toFixed(1)??'—'} sub="World Bank"/>
                      <Stat label="Health Exp % GDP" value={wb?.healthExpPctGDP?`${wb.healthExpPctGDP.toFixed(1)}%`:'—'} sub="World Bank"/>
                      <Stat label="Health Exp / Capita" value={wb?.healthExpPerCapita?`$${Math.round(wb.healthExpPerCapita).toLocaleString()}`:'—'} sub="USD" color="text-sky-300"/>
                      <Stat label="GDP / Capita" value={wb?.gdpPerCapita?`$${Math.round(wb.gdpPerCapita).toLocaleString()}`:'—'} sub="USD"/>
                      <Stat label="Life Expectancy" value={wb?.lifeExpectancy?`${wb.lifeExpectancy.toFixed(1)} yrs`:'—'} sub="World Bank"/>
                      <Stat label="Urban Population" value={wb?.urbanPopPct?`${wb.urbanPopPct.toFixed(1)}%`:'—'} sub="World Bank"/>
                      <Stat label="UHC Coverage Index" value={uhcVals[0]?.value?`${Number(uhcVals[0].value).toFixed(1)}/100`:'—'} sub={`WHO ${uhcVals[0]?.year??""}`} color={uhcVals[0]?.value&&Number(uhcVals[0].value)>75?"text-green-400":"text-orange-400"}/>
                      <Stat label="Medicine Access" value={(intel.healthAccessData as Record<string,unknown>)?.medicineAccessPct?`${Number((intel.healthAccessData as Record<string,unknown>).medicineAccessPct).toFixed(1)}%`:'—'} sub="SDG"/>
                    </div>
                    {meta&&<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3"><p className="text-[10px] text-white/35 mb-1">Country</p><p className="text-sm font-semibold text-white/80">{String(meta.officialName)}</p><p className="text-[10px] text-white/35">{String(meta.region)} · {String(meta.subregion)}</p></div>
                      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3"><p className="text-[10px] text-white/35 mb-1">Population</p><p className="text-sm font-semibold text-sky-300">{Number(meta.population).toLocaleString()}</p></div>
                      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3"><p className="text-[10px] text-white/35 mb-1">Languages</p><p className="text-sm font-semibold text-white/80">{(meta.languages as string[]).slice(0,3).join(", ")}</p></div>
                      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3"><p className="text-[10px] text-white/35 mb-1">Area</p><p className="text-sm font-semibold text-white/80">{Number(meta.areaSqKm).toLocaleString()} km²</p></div>
                    </div>}
                  </GC>
                )}

                {/* NPI + OSM density */}
                {intel&&(npi||osm)&&(
                  <GC className="p-6">
                    <SH icon={Stethoscope} title="Provider Density — Live Data" subtitle="CMS NPI Registry + OpenStreetMap Overpass"/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {npi&&<div>
                        <p className="text-xs font-bold text-sky-400/70 uppercase tracking-widest mb-3 flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5"/>CMS NPI Registry</p>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <Stat label="Active Providers" value={(npi.resultCount as number).toLocaleString()} sub={req.targetState} color="text-sky-300"/>
                          <Stat label="Taxonomy" value={String(npi.taxonomySearched)} sub="NPI-1 individual"/>
                        </div>
                        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3"><p className="text-[10px] text-white/30 leading-relaxed">Most authoritative US provider density signal. Active, licensed individuals only.{(npi.resultCount as number)<500&&<span className="text-red-400"> ⚠ Very low supply.</span>}{(npi.resultCount as number)>20000&&<span className="text-green-400"> ✓ Strong supply.</span>}</p></div>
                      </div>}
                      {osm&&<div>
                        <p className="text-xs font-bold text-sky-400/70 uppercase tracking-widest mb-3 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/>OpenStreetMap (50km radius)</p>
                        <div className="grid grid-cols-2 gap-3"><Stat label="Medical Facilities" value={String(osm.totalMedicalFacilities??'—')} sub="hospitals + clinics" color="text-sky-300"/><Stat label="Radius" value={String(osm.searchRadius)} sub="from city center"/></div>
                      </div>}
                    </div>
                  </GC>
                )}

                {/* Census */}
                {intel&&census&&(
                  <GC className="p-6">
                    <SH icon={Users} title="Census & Demographics" subtitle="US Census Bureau ACS 5-Year Estimates"/>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Stat label="Total Population" value={Number(census.totalPopulation).toLocaleString()} sub={String(census.stateName)} color="text-sky-300"/>
                      <Stat label="Median HH Income" value={`$${Number(census.medianHouseholdIncome).toLocaleString()}`} sub="ACS 2022"/>
                      <Stat label="Uninsured Est." value={Number(census.noHealthInsuranceEstimate).toLocaleString()} sub="no health insurance" color={Number(census.noHealthInsuranceEstimate)>100000?"text-red-400":"text-white/90"}/>
                      <Stat label="Source" value="ACS 5-Year" sub="2022 Census"/>
                    </div>
                  </GC>
                )}

                {/* Difficulty breakdown */}
                <GC className="p-6">
                  <SH icon={BarChart3} title="Difficulty Factor Analysis" subtitle={scoreData?"✅ Calibrated with live NPI, World Bank, OSM & Census data":intel?"Calibrated with live external data":"Static reference — fetch live data to enrich"}/>
                  <div className="space-y-3">
                    {(scoreData?[
                      {label:"Provider Type Scarcity",val:(scoreData.scores as Record<string,Record<string,number>>).providerScarcity.score,note:(scoreData.scores as Record<string,Record<string,string>>).providerScarcity.source,weight:"38%",src:"CMS NPI Registry (live)"},
                      {label:"Geographic Access",val:(scoreData.scores as Record<string,Record<string,number>>).geographicAccess.score,note:(scoreData.scores as Record<string,Record<string,string>>).geographicAccess.source,weight:"22%",src:"OpenStreetMap (live)"},
                      {label:"Health System Quality",val:(scoreData.scores as Record<string,Record<string,number>>).healthSystem.score,note:(scoreData.scores as Record<string,Record<string,string>>).healthSystem.source,weight:"22%",src:"World Bank + WHO (live)"},
                      {label:"Pricing Transparency",val:(scoreData.scores as Record<string,Record<string,number>>).pricingTransparency.score,note:(scoreData.scores as Record<string,Record<string,string>>).pricingTransparency.source,weight:"18%",src:"Occu-Med reference"},
                    ]:[
                      {label:"Provider Type Scarcity",val:scores.provDiff,note:`${req.providerType} — ${PROVIDER_DIFFICULTY[req.providerType]?.label??'Moderate'} national scarcity${npi?` · NPI: ${(npi.resultCount as number).toLocaleString()} in ${req.targetState}`:" (static ref)"}`,weight:"38%",src:npi?"CMS NPI Registry (live)":"Static reference"},
                      {label:"Country / Market Access",val:scores.countryDiff,note:`${req.targetCountry}${wb?.physiciansper1k?` · ${wb.physiciansper1k.toFixed(2)} physicians/1k`:""}${wb?.healthExpPctGDP?` · ${wb.healthExpPctGDP.toFixed(1)}% GDP on health`:""}`,weight:"30%",src:wb?"World Bank + WHO (live)":"Static reference"},
                      {label:"Regional Provider Density",val:scores.desertScore,note:osm?`${osm.totalMedicalFacilities} facilities within 50km (OpenStreetMap)`:"Regional infrastructure estimate",weight:"22%",src:osm?"OpenStreetMap (live)":"Static reference"},
                      {label:"Failed Contact Penalty",val:scores.failedContacts*6,note:`${scores.failedContacts} no-response/declined contacts`,weight:"+additive",src:"Internal log"},
                      {label:"Prior Search Adjustment",val:scores.priorSuccess?-12:0,note:scores.priorSuccess?"Prior success reduces cold-start effort":"No prior successful search — starting cold",weight:"+/-",src:"Internal log"},
                    ]).map(f=>(
                      <div key={f.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                          <div className="flex items-center gap-2"><span className="text-sm font-semibold text-white/80">{f.label}</span><span className="text-[10px] text-white/25 bg-white/[0.04] px-1.5 py-0.5 rounded-full">weight {f.weight}</span><span className="text-[9px] text-sky-400/50 bg-sky-500/5 border border-sky-500/10 px-1.5 py-0.5 rounded-full">{f.src}</span></div>
                          <span className="text-sm font-bold" style={{color:f.val>60?"#ef4444":f.val>40?"#eab308":f.val<0?"#22c55e":"#22d3ee"}}>{f.val>0?"+":""}{f.val}</span>
                        </div>
                        <div className="w-full bg-white/[0.05] rounded-full h-1.5 mb-2"><div className="h-1.5 rounded-full" style={{width:`${Math.abs(Math.min(f.val,100))}%`,background:f.val<0?"#22c55e":f.val>60?"#ef4444":f.val>40?"#eab308":"#22d3ee"}}/></div>
                        <p className="text-xs text-white/35">{f.note}</p>
                      </div>
                    ))}
                  </div>
                </GC>

                {/* Contact log */}
                {req.contactAttempts.length>0&&(
                  <GC className="p-6">
                    <SH icon={Phone} title="Outreach Documentation" subtitle={`${req.contactAttempts.length} attempts · ${scores.failedContacts} failed/no-response`}/>
                    <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b border-white/[0.07]">{["#","Organization","Method","Date","By","Outcome","Price","Notes"].map(h=><th key={h} className="text-left py-2 px-3 text-[10px] font-bold text-white/30 uppercase tracking-widest">{h}</th>)}</tr></thead>
                    <tbody>{req.contactAttempts.map((c,i)=><tr key={c.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="py-2 px-3 text-white/40">{i+1}</td>
                      <td className="py-2 px-3 text-white/75 font-medium">{c.organizationName||"—"}</td>
                      <td className="py-2 px-3 text-white/55 capitalize">{c.contactMethod}</td>
                      <td className="py-2 px-3 text-white/55">{c.date||"—"}</td>
                      <td className="py-2 px-3 text-white/55">{c.contactedBy||"—"}</td>
                      <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold capitalize ${OC[c.outcome]}`}>{c.outcome.replace("_"," ")}</span></td>
                      <td className="py-2 px-3 text-sky-300">{c.priceConfirmed||"—"}</td>
                      <td className="py-2 px-3 text-white/40 max-w-[140px] truncate">{c.notes||"—"}</td>
                    </tr>)}</tbody></table></div>
                  </GC>
                )}

                {/* Prior searches */}
                {req.priorSearches.length>0&&(
                  <GC className="p-6">
                    <SH icon={Clock} title="Prior Search Record"/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {req.priorSearches.map((p,i)=>(
                        <div key={p.id} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                          <div className="flex items-start justify-between mb-2"><span className="text-xs font-bold text-white/60">Prior #{i+1}</span><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${OC[p.outcome]}`}>{p.outcome}</span></div>
                          <div className="grid grid-cols-2 gap-2 text-xs"><div><span className="text-white/35">Date: </span><span className="text-white/70">{p.searchDate||"—"}</span></div><div><span className="text-white/35">By: </span><span className="text-white/70">{p.searchedBy||"—"}</span></div><div><span className="text-white/35">Found: </span><span className="text-white/70">{p.providersFound}</span></div><div><span className="text-white/35">Price: </span><span className="text-sky-300">{p.avgPriceFound||"—"}</span></div></div>
                          {p.notes&&<p className="text-xs text-white/40 mt-2 pt-2 border-t border-white/[0.05]">{p.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </GC>
                )}

                {/* Internal notes */}
                {req.internalNotes&&(
                  <GC className="p-6"><SH icon={Info} title="Internal Notes" subtitle="Operations & Finance only"/><div className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-4"><p className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap">{req.internalNotes}</p></div></GC>
                )}

                {/* Data sources */}
                <GC className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <SH icon={Database} title="Data Sources & Methodology" subtitle={intel?`${intel.sources.length} databases queried — all publicly verifiable`:"Reference databases"}/>
                    <button onClick={()=>setExpandSources(!expandSources)} className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1">{expandSources?<ChevronUp className="w-3.5 h-3.5"/>:<ChevronDown className="w-3.5 h-3.5"/>}{expandSources?"Collapse":"Expand"}</button>
                  </div>
                  {intel?(
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                      {intel.sources.map(src=>(
                        <div key={src.name} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 flex flex-col gap-1.5">
                          <div className="flex items-start justify-between gap-2"><span className="text-xs font-semibold text-white/80 leading-snug">{src.name}</span><div className="flex items-center gap-1 shrink-0"><LB status={src.status}/>{src.url&&src.url!=="&"&&<a href={src.url} target="_blank" rel="noopener noreferrer" className="text-sky-400/40 hover:text-sky-400"><ArrowUpRight className="w-3 h-3"/></a>}</div></div>
                          {expandSources&&src.dataPoints.length>0&&<div className="flex flex-wrap gap-1">{src.dataPoints.map(dp=><span key={dp} className="text-[9px] bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded text-white/35">{dp}</span>)}</div>}
                        </div>
                      ))}
                    </div>
                  ):<div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center text-xs text-white/30">Fetch live data to populate</div>}
                  <p className="text-[10px] text-white/20 leading-relaxed">Report incorporates real-time data from federal health registries, international databases, and Occu-Med internal records. All sources publicly accessible and independently verifiable. Generated: {new Date().toLocaleString()}.</p>
                </GC>

              </div>
            )}
          </motion.div>
        )}

        </AnimatePresence>
      </div>
    </div>
  );
}

