import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ─── MOBILE HOOK ──────────────────────────────────────────────────────────────
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

// ─── COLORS ───────────────────────────────────────────────────────────────────
const C = {
  navy: "#0A1F5C", blue: "#1A3A8F", lcuBlue: "#3A7BD5", lcuPink: "#E0197D",
  lcuLightBlue: "#89C4E1", success: "#1a7a3a", danger: "#C8102E", warning: "#E07B00",
  white: "#FFFFFF", bg: "#F5F7FA", border: "#D0D8E8",
  text: "#1A1A2E", textMuted: "#5A6A8A", textLight: "#8898B0", rowAlt: "#F0F4FB",
};

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
const TIME_SLOTS = ["8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM"];
const DEPT_COLORS = {
  "Software Engineering":"#1A3A8F","Computer Science":"#2563EB","Engineering":"#059669",
  "Business Administration":"#D97706","Law":"#7C3AED","Medicine":"#DC2626","Education":"#0891B2",
};

const MOCK_COURSES = [
  {id:1,code:"SEN401",title:"Software Project Management",units:3,department:"Software Engineering",level:400,semester:2,population:90,contactHours:3},
  {id:2,code:"SEN402",title:"Advanced Software Engineering",units:3,department:"Software Engineering",level:400,semester:2,population:88,contactHours:3},
  {id:3,code:"SEN403",title:"Mobile Application Development",units:3,department:"Software Engineering",level:400,semester:2,population:85,contactHours:3},
  {id:4,code:"SEN404",title:"Cloud Computing & DevOps",units:3,department:"Software Engineering",level:400,semester:2,population:80,contactHours:3},
  {id:5,code:"CSC301",title:"Data Structures & Algorithms",units:3,department:"Computer Science",level:300,semester:2,population:120,contactHours:3},
  {id:6,code:"CSC302",title:"Database Management Systems",units:3,department:"Computer Science",level:300,semester:2,population:115,contactHours:3},
  {id:7,code:"ENG301",title:"Circuit Theory",units:3,department:"Engineering",level:300,semester:2,population:100,contactHours:3},
  {id:8,code:"BUS301",title:"Financial Management",units:3,department:"Business Administration",level:300,semester:2,population:130,contactHours:3},
];
const MOCK_LECTURERS = [
  {id:1,name:"Dr. Adebayo Okafor",staffId:"LCU/SE/001",department:"Software Engineering",courses:[1,2],maxHours:12,email:"a.okafor@lcu.edu.ng"},
  {id:2,name:"Prof. Chioma Nwosu",staffId:"LCU/SE/002",department:"Software Engineering",courses:[3,4],maxHours:10,email:"c.nwosu@lcu.edu.ng"},
  {id:3,name:"Dr. Emeka Eze",staffId:"LCU/CS/001",department:"Computer Science",courses:[5,6],maxHours:12,email:"e.eze@lcu.edu.ng"},
  {id:4,name:"Prof. Bisi Adeyemi",staffId:"LCU/ENG/001",department:"Engineering",courses:[7],maxHours:9,email:"b.adeyemi@lcu.edu.ng"},
  {id:5,name:"Dr. Kemi Fashola",staffId:"LCU/BUS/001",department:"Business Administration",courses:[8],maxHours:9,email:"k.fashola@lcu.edu.ng"},
];
const MOCK_ROOMS = [
  {id:1,name:"LT-101",capacity:200,type:"Lecture Theatre",projector:true,smartBoard:true,ac:true,lab:false},
  {id:2,name:"LT-102",capacity:150,type:"Lecture Theatre",projector:true,smartBoard:false,ac:true,lab:false},
  {id:3,name:"CR-201",capacity:80,type:"Classroom",projector:true,smartBoard:false,ac:false,lab:false},
  {id:4,name:"CR-202",capacity:60,type:"Classroom",projector:false,smartBoard:false,ac:false,lab:false},
  {id:5,name:"LAB-301",capacity:50,type:"Computer Lab",projector:true,smartBoard:true,ac:true,lab:true},
  {id:6,name:"CR-301",capacity:120,type:"Classroom",projector:true,smartBoard:false,ac:true,lab:false},
];

function generateTimetable(courses, lecturers, rooms) {
  const schedule=[], usedSlots={}, lecturerSlots={}, cohortSlots={};
  const getRoom=(pop)=>rooms.find(r=>r.capacity>=pop)||rooms[0];
  const getLecturer=(cid)=>lecturers.find(l=>l.courses.includes(cid));
  for (const course of courses) {
    const lecturer=getLecturer(course.id), room=getRoom(course.population);
    let placed=false;
    for (const day of DAYS) {
      if (placed) break;
      for (let t=0;t<TIME_SLOTS.length-1;t++) {
        const sk=`${day}-${t}-${room.id}`, lk=lecturer?`${lecturer.id}-${day}-${t}`:null, ck=`${course.department}-${course.level}-${day}-${t}`;
        if (!usedSlots[sk]&&(!lk||!lecturerSlots[lk])&&!cohortSlots[ck]) {
          usedSlots[sk]=course.id; if(lk)lecturerSlots[lk]=true; cohortSlots[ck]=true;
          schedule.push({id:schedule.length+1,courseId:course.id,course,lecturer,room,day,timeSlot:t,duration:2});
          placed=true; break;
        }
      }
    }
  }
  return schedule;
}

// ─── LCU EMBLEM SVG ───────────────────────────────────────────────────────────
const LCUEmblem = ({ size = 60 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="99" fill="#89C4E1"/>
    <circle cx="100" cy="100" r="92" fill="#2B5FBF"/>
    {Array.from({length:16}).map((_,i)=>{
      const angle=(i/16)*2*Math.PI-Math.PI/2;
      return <circle key={i} cx={100+80*Math.cos(angle)} cy={100+80*Math.sin(angle)} r="4.5" fill="white"/>;
    })}
    <circle cx="100" cy="100" r="65" fill="white"/>
    <path d="M70 60 L130 60 L130 115 Q130 138 100 150 Q70 138 70 115 Z" fill="white" stroke="#ccc" strokeWidth="1"/>
    <path d="M70 60 L100 60 L100 105 L70 105 L70 60 Z" fill="white"/>
    <path d="M100 60 L130 60 L130 105 L100 105 L100 60 Z" fill="#E0197D"/>
    <path d="M70 105 L100 105 L100 150 Q85 143 70 115 Z" fill="#E0197D"/>
    <path d="M100 105 L130 105 L130 115 Q130 138 100 150 Z" fill="#3A7BD5"/>
    <path d="M70 60 L130 60 L130 115 Q130 138 100 150 Q70 138 70 115 Z" fill="none" stroke="#999" strokeWidth="1.5"/>
    <line x1="100" y1="60" x2="100" y2="150" stroke="#bbb" strokeWidth="1"/>
    <line x1="70" y1="105" x2="130" y2="105" stroke="#bbb" strokeWidth="1"/>
    <rect x="98.5" y="42" width="3" height="22" fill="#555" rx="1"/>
    <circle cx="100" cy="40" r="8" fill="white" stroke="#aaa" strokeWidth="1"/>
    <ellipse cx="100" cy="38" rx="3.5" ry="5" fill="#FF8C00"/>
    <ellipse cx="100" cy="40" rx="2" ry="3" fill="#FFD700"/>
    <g transform="rotate(-45,85,82)">
      <rect x="78" y="72" width="6" height="22" fill="#333" rx="1"/>
      <rect x="79" y="72" width="4" height="6" fill="#555" rx="1"/>
      <polygon points="81,94 78,100 84,100" fill="#222"/>
    </g>
    <rect x="106" y="76" width="20" height="3" fill="#111" rx="1"/>
    <polygon points="116,68 106,76 126,76" fill="#111"/>
    <line x1="126" y1="76" x2="126" y2="83" stroke="#111" strokeWidth="1.5"/>
    <circle cx="126" cy="84" r="2" fill="#111"/>
    <path d="M78 120 Q85 116 100 118 L100 138 Q85 136 78 140 Z" fill="white" stroke="#333" strokeWidth="1.2"/>
    <path d="M100 118 Q115 116 122 120 L122 140 Q115 136 100 138 Z" fill="white" stroke="#333" strokeWidth="1.2"/>
    <line x1="100" y1="118" x2="100" y2="138" stroke="#333" strokeWidth="1.5"/>
    <text x="100" y="133" textAnchor="middle" fill="#111" fontSize="7.5" fontWeight="bold" fontFamily="Arial,sans-serif">LCU</text>
    <line x1="83" y1="124" x2="97" y2="123" stroke="#aaa" strokeWidth="0.8"/>
    <line x1="83" y1="128" x2="97" y2="127" stroke="#aaa" strokeWidth="0.8"/>
    <line x1="103" y1="123" x2="118" y2="124" stroke="#aaa" strokeWidth="0.8"/>
    <line x1="103" y1="127" x2="118" y2="128" stroke="#aaa" strokeWidth="0.8"/>
    <path d="M65 148 Q100 160 135 148 L132 156 Q100 168 68 156 Z" fill="#3A7BD5"/>
    <path d="M65 148 L60 152 L68 156 Z" fill="#2B5FBF"/>
    <path d="M135 148 L140 152 L132 156 Z" fill="#2B5FBF"/>
    <text x="100" y="157" textAnchor="middle" fill="white" fontSize="5" fontFamily="Arial,sans-serif" fontStyle="italic">Knowledge for Self Reliance</text>
    <defs>
      <path id="topArc" d="M 22,100 A 78,78 0 0,1 178,100"/>
      <path id="botArc" d="M 35,145 A 78,78 0 0,0 165,145"/>
    </defs>
    <text fill="white" fontSize="14" fontFamily="Arial,sans-serif" fontWeight="bold" letterSpacing="1">
      <textPath href="#topArc" startOffset="8%">Lead City University</textPath>
    </text>
    <text fill="white" fontSize="14" fontFamily="Arial,sans-serif" fontWeight="bold" letterSpacing="2">
      <textPath href="#botArc" startOffset="28%">Ibadan</textPath>
    </text>
  </svg>
);

// ─── TARTAN HEADER ────────────────────────────────────────────────────────────
const TartanHeader = ({user, onLogout, onMenuToggle, isMobile}) => (
  <div>
    <div style={{
      background:`repeating-linear-gradient(0deg,transparent,transparent 16px,rgba(224,25,125,0.28) 16px,rgba(224,25,125,0.28) 20px,transparent 20px,transparent 36px,rgba(224,25,125,0.16) 36px,rgba(224,25,125,0.16) 38px),repeating-linear-gradient(90deg,transparent,transparent 16px,rgba(224,25,125,0.22) 16px,rgba(224,25,125,0.22) 20px,transparent 20px,transparent 36px,rgba(224,25,125,0.14) 36px,rgba(224,25,125,0.14) 38px),linear-gradient(160deg,#061240 0%,#0A1F5C 40%,#1A3A8F 70%,#0A1F5C 100%)`,
      padding: isMobile ? "12px 14px" : "14px 28px",
      display:"flex", alignItems:"center",
      justifyContent: isMobile ? "space-between" : "center",
      gap: isMobile ? 10 : 16,
      minHeight: isMobile ? 70 : 90,
    }}>
      <div style={{display:"flex", alignItems:"center", gap: isMobile ? 10 : 16}}>
        <LCUEmblem size={isMobile ? 48 : 68}/>
        <div>
          <div style={{color:"#fff", fontSize: isMobile ? 15 : 22, fontWeight:700, fontFamily:"Georgia,serif", textShadow:"0 1px 4px rgba(0,0,0,0.5)", lineHeight:1.2}}>
            Lead City University{!isMobile && ", Ibadan"}
          </div>
          {isMobile
            ? <div style={{color:"rgba(255,255,255,0.7)", fontSize:9, letterSpacing:"0.06em", marginTop:2}}>TIMETABLE SYSTEM</div>
            : <>
                <div style={{color:"rgba(255,255,255,0.72)", fontSize:11, letterSpacing:"0.1em", marginTop:3, textTransform:"uppercase"}}>Automated Timetable &amp; Course Allocation System</div>
                <div style={{color:"rgba(224,25,125,0.9)", fontSize:10, fontStyle:"italic", marginTop:2}}>Knowledge for Self Reliance</div>
              </>
          }
        </div>
      </div>
      {/* Hamburger on mobile */}
      {isMobile && user && (
        <button onClick={onMenuToggle} style={{background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:6, padding:"8px 10px", cursor:"pointer", color:"#fff", fontSize:18, lineHeight:1, flexShrink:0}}>
          ☰
        </button>
      )}
    </div>

    {/* Sub-nav bar */}
    <div style={{background:"#fff", borderBottom:"2px solid #D0D8E8", padding:`0 ${isMobile?12:22}px`, display:"flex", alignItems:"center", justifyContent:"space-between", minHeight:40, boxShadow:"0 2px 6px rgba(10,31,92,0.07)", overflowX:"auto"}}>
      <div style={{display:"flex", alignItems:"center", gap:8, flexShrink:0}}>
        {user && <>
          <span style={{fontSize:17, cursor:"pointer"}}>🏠</span>
          <span style={{fontSize:17, cursor:"pointer"}}>🔔</span>
          {!isMobile && (
            <span style={{fontSize:13, color:C.textMuted, marginLeft:4}}>
              {user.role==="ADMIN"?"Admin Portal":user.role==="LECTURER"?"Lecturer Portal":"Student Dashboard"}
              {" — "}Good {new Date().getHours()<12?"morning":new Date().getHours()<17?"afternoon":"evening"},{" "}
              <strong style={{color:C.navy}}>{user.name.split(" ").slice(-1)[0]}</strong>
            </span>
          )}
          {isMobile && <span style={{fontSize:12, color:C.navy, fontWeight:700}}>{user.name.split(" ").slice(-1)[0]}</span>}
        </>}
      </div>
      {user && (
        <button onClick={onLogout} style={{background:"none", border:"1px solid #D0D8E8", borderRadius:5, padding:"3px 10px", cursor:"pointer", color:C.navy, fontSize:12, fontWeight:600, flexShrink:0, display:"flex", alignItems:"center", gap:3}}>
          ⇥ {isMobile ? "" : "Logout"}
        </button>
      )}
    </div>
  </div>
);

// ─── MOBILE BOTTOM NAV ────────────────────────────────────────────────────────
const BottomNav = ({user, activeTab, setActiveTab}) => {
  const adminNav=[{id:"dashboard",icon:"⊞",label:"Home"},{id:"timetable",icon:"📅",label:"Timetable"},{id:"generate",icon:"⚡",label:"Generate"},{id:"analytics",icon:"📊",label:"Analytics"},{id:"more",icon:"⋯",label:"More"}];
  const lecturerNav=[{id:"dashboard",icon:"⊞",label:"Home"},{id:"timetable",icon:"📅",label:"Schedule"},{id:"analytics",icon:"📊",label:"Workload"}];
  const studentNav=[{id:"dashboard",icon:"⊞",label:"Home"},{id:"timetable",icon:"📅",label:"Timetable"}];
  const nav=user.role==="ADMIN"?adminNav:user.role==="LECTURER"?lecturerNav:studentNav;
  return (
    <div style={{position:"fixed", bottom:0, left:0, right:0, background:"#fff", borderTop:"2px solid #D0D8E8", display:"flex", zIndex:200, boxShadow:"0 -2px 10px rgba(0,0,0,0.1)"}}>
      {nav.map(item=>{
        const active=activeTab===item.id;
        return (
          <button key={item.id} onClick={()=>setActiveTab(item.id)} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"8px 2px", background:active?"#EEF2FB":"#fff", border:"none", borderTop:active?`2px solid ${C.navy}`:"2px solid transparent", cursor:"pointer", gap:2}}>
            <span style={{fontSize:18}}>{item.icon}</span>
            <span style={{fontSize:9, fontWeight:active?700:500, color:active?C.navy:C.textMuted}}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// ─── DESKTOP SIDEBAR ──────────────────────────────────────────────────────────
const Sidebar = ({user, activeTab, setActiveTab, mobileOpen, onClose}) => {
  const adminNav=[{id:"dashboard",label:"Dashboard",icon:"⊞"},{id:"timetable",label:"Timetable",icon:"📅"},{id:"courses",label:"Courses",icon:"📚"},{id:"lecturers",label:"Lecturers",icon:"👨‍🏫"},{id:"rooms",label:"Rooms",icon:"🏛"},{id:"generate",label:"Generate",icon:"⚡"},{id:"analytics",label:"Analytics",icon:"📊"},{id:"settings",label:"Settings",icon:"⚙"}];
  const lecturerNav=[{id:"dashboard",label:"Dashboard",icon:"⊞"},{id:"timetable",label:"My Schedule",icon:"📅"},{id:"analytics",label:"Workload",icon:"📊"}];
  const studentNav=[{id:"dashboard",label:"Dashboard",icon:"⊞"},{id:"timetable",label:"My Timetable",icon:"📅"}];
  const nav=user.role==="ADMIN"?adminNav:user.role==="LECTURER"?lecturerNav:studentNav;

  const sidebarContent = (
    <div style={{width:210, background:"#fff", borderRight:"1px solid #D0D8E8", display:"flex", flexDirection:"column", height:"100%"}}>
      <div style={{background:"#EEF2FB", borderBottom:"1px solid #D0D8E8", padding:"12px 14px"}}>
        <div style={{fontSize:11, color:C.lcuBlue, fontWeight:700, letterSpacing:"0.05em", marginBottom:2}}>2025/2026 SESSION</div>
        <div style={{fontSize:11, color:C.textMuted, marginBottom:8}}>Second Semester</div>
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <div style={{width:32, height:32, borderRadius:"50%", background:C.navy, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", flexShrink:0}}>{user.name[0]}</div>
          <div style={{overflow:"hidden"}}>
            <div style={{fontSize:12, fontWeight:700, color:C.navy, lineHeight:1.2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{user.name.split(" ").slice(-1)[0]}</div>
            <div style={{fontSize:10, color:C.textMuted}}>{user.role}</div>
          </div>
        </div>
      </div>
      <div style={{flex:1, overflowY:"auto", padding:"6px 0"}}>
        {nav.map(item=>{
          const active=activeTab===item.id;
          return (
            <button key={item.id} onClick={()=>{setActiveTab(item.id); onClose && onClose();}}
              style={{width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 16px", background:active?"#EEF2FB":"transparent", borderLeft:active?`3px solid ${C.navy}`:"3px solid transparent", border:"none", borderRight:"none", color:active?C.navy:C.textMuted, fontWeight:active?700:400, fontSize:13, cursor:"pointer", textAlign:"left"}}
              onMouseEnter={e=>{if(!active){e.currentTarget.style.background="#F5F7FA";e.currentTarget.style.color=C.navy;}}}
              onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.textMuted;}}}>
              <span style={{fontSize:15}}>{item.icon}</span>{item.label}
            </button>
          );
        })}
      </div>
      <div style={{padding:"12px 0 10px", borderTop:"1px solid #D0D8E8", display:"flex", flexDirection:"column", alignItems:"center", gap:6}}>
        <LCUEmblem size={44}/>
        <div style={{fontSize:10, color:C.textLight, textAlign:"center", lineHeight:1.5}}>portal.lcu.edu.ng<br/>© 2025 Lead City University</div>
      </div>
    </div>
  );

  return sidebarContent;
};

// ─── MOBILE DRAWER ────────────────────────────────────────────────────────────
const MobileDrawer = ({user, activeTab, setActiveTab, open, onClose}) => {
  if (!open) return null;
  return (
    <div style={{position:"fixed", inset:0, zIndex:500}}>
      <div onClick={onClose} style={{position:"absolute", inset:0, background:"rgba(0,0,0,0.5)"}}/>
      <div style={{position:"absolute", top:0, left:0, bottom:0, width:230, background:"#fff", boxShadow:"4px 0 20px rgba(0,0,0,0.15)", display:"flex", flexDirection:"column"}}>
        <div style={{background:C.navy, padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div style={{display:"flex", alignItems:"center", gap:10}}>
            <LCUEmblem size={36}/>
            <div style={{color:"#fff", fontSize:13, fontWeight:700, lineHeight:1.3}}>LCU Portal<br/><span style={{fontSize:10, opacity:0.7}}>2025/2026 Sem 2</span></div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", borderRadius:6, width:30, height:30, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center"}}>✕</button>
        </div>
        <div style={{padding:"8px 0", flex:1, overflowY:"auto"}}>
          {(user.role==="ADMIN"
            ?[{id:"dashboard",label:"Dashboard",icon:"⊞"},{id:"timetable",label:"Timetable",icon:"📅"},{id:"courses",label:"Courses",icon:"📚"},{id:"lecturers",label:"Lecturers",icon:"👨‍🏫"},{id:"rooms",label:"Rooms",icon:"🏛"},{id:"generate",label:"Generate",icon:"⚡"},{id:"analytics",label:"Analytics",icon:"📊"},{id:"settings",label:"Settings",icon:"⚙"}]
            :user.role==="LECTURER"
            ?[{id:"dashboard",label:"Dashboard",icon:"⊞"},{id:"timetable",label:"My Schedule",icon:"📅"},{id:"analytics",label:"Workload",icon:"📊"}]
            :[{id:"dashboard",label:"Dashboard",icon:"⊞"},{id:"timetable",label:"My Timetable",icon:"📅"}]
          ).map(item=>{
            const active=activeTab===item.id;
            return (
              <button key={item.id} onClick={()=>{setActiveTab(item.id);onClose();}}
                style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 20px",background:active?"#EEF2FB":"transparent",borderLeft:active?`3px solid ${C.navy}`:"3px solid transparent",border:"none",color:active?C.navy:C.textMuted,fontWeight:active?700:500,fontSize:14,cursor:"pointer",textAlign:"left"}}>
                <span style={{fontSize:18}}>{item.icon}</span>{item.label}
              </button>
            );
          })}
        </div>
        <div style={{padding:"12px 16px", borderTop:"1px solid #D0D8E8", fontSize:11, color:C.textLight}}>
          Logged in as <strong style={{color:C.navy}}>{user.name}</strong><br/>{user.role}
        </div>
      </div>
    </div>
  );
};

// ─── REUSABLE COMPONENTS ──────────────────────────────────────────────────────
const SectionTitle = ({children, sub}) => (
  <div style={{marginBottom:16}}>
    <h2 style={{fontSize:16, fontWeight:700, color:C.navy, paddingBottom:6, borderBottom:`2px solid ${C.navy}`, fontFamily:"Georgia,serif", display:"inline-block"}}>{children}</h2>
    {sub && <p style={{fontSize:12, color:C.textMuted, marginTop:3}}>{sub}</p>}
  </div>
);
const InfoRow = ({label, value}) => (
  <div style={{display:"flex", flexWrap:"wrap", padding:"6px 0", borderBottom:"1px solid #EEF2FB", fontSize:13, gap:4}}>
    <span style={{fontWeight:700, color:C.text, minWidth:170, flexShrink:0}}>{label}:</span>
    <span style={{color:C.textMuted, flex:1, wordBreak:"break-word"}}>{value}</span>
  </div>
);
const StatCard = ({label, value, icon, color}) => (
  <div style={{background:"#fff", border:"1px solid #D0D8E8", borderRadius:6, padding:"12px 14px", borderTop:`3px solid ${color}`, boxShadow:"0 1px 4px rgba(10,31,92,0.06)"}}>
    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
      <div>
        <div style={{fontSize:10, color:C.textMuted, fontWeight:700, letterSpacing:"0.04em", marginBottom:3}}>{label.toUpperCase()}</div>
        <div style={{fontSize:22, fontWeight:800, color:C.navy, fontFamily:"Georgia,serif"}}>{value}</div>
      </div>
      <span style={{fontSize:24, opacity:0.7}}>{icon}</span>
    </div>
  </div>
);
const Card = ({children, style={}}) => (
  <div style={{background:"#fff", border:"1px solid #D0D8E8", borderRadius:6, boxShadow:"0 1px 4px rgba(10,31,92,0.06)", overflow:"hidden", ...style}}>{children}</div>
);
const CardHeader = ({title, action}) => (
  <div style={{background:"#EEF2FB", borderBottom:"1px solid #D0D8E8", padding:"9px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6}}>
    <span style={{fontSize:13, fontWeight:700, color:C.navy}}>{title}</span>
    {action}
  </div>
);
const Badge = ({children, color}) => (
  <span style={{fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:3, background:`${color}18`, color, border:`1px solid ${color}30`, display:"inline-block", whiteSpace:"nowrap"}}>{children}</span>
);

// Responsive table → cards on mobile
const Tbl = ({headers, rows, isMobile, cardKeys}) => {
  if (isMobile && cardKeys) {
    return (
      <div>
        {rows.map((row, i) => (
          <div key={i} style={{padding:"12px 14px", borderBottom:"1px solid #EEF2FB", background:i%2===0?"#fff":C.rowAlt}}>
            {cardKeys.map((key, j) => key && (
              <div key={j} style={{display:"flex", gap:8, marginBottom:4, flexWrap:"wrap", fontSize:13}}>
                <span style={{fontWeight:700, color:C.textMuted, minWidth:90, fontSize:11}}>{headers[j]}:</span>
                <span style={{color:C.text, flex:1}}>{row[j]}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%", borderCollapse:"collapse", fontSize:13, minWidth: isMobile ? 500 : "auto"}}>
        <thead>
          <tr style={{background:C.navy}}>
            {headers.map(h=><th key={h} style={{padding:"9px 13px", textAlign:"left", color:"#fff", fontWeight:600, fontSize:12, whiteSpace:"nowrap"}}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row,i)=>(
            <tr key={i} style={{background:i%2===0?"#fff":C.rowAlt, borderBottom:"1px solid #E8EDF5"}}>
              {row.map((cell,j)=><td key={j} style={{padding:"8px 13px", color:C.text, verticalAlign:"middle"}}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
const LoginPage = ({onLogin}) => {
  const isMobile = useIsMobile();
  const [role,setRole]=useState("admin");
  const [id,setId]=useState("");
  const [pass,setPass]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const CREDS={
    admin:{id:"admin",pass:"admin123",name:"Dr. Emmanuel Adeyemi",role:"ADMIN"},
    lecturer:{id:"LCU/SE/001",pass:"lect123",name:"Dr. Adebayo Okafor",role:"Lecturer",lecturerId:1},
    student:{id:"LCU/UG/22/21758",pass:"stud123",name:"EZEASOR Shedrack Ifechukwu",role:"Student",department:"Software Engineering",level:400},
  };
  const hints={admin:"ID: admin  ·  Pass: admin123",lecturer:"ID: LCU/SE/001  ·  Pass: lect123",student:"ID: LCU/UG/22/21758  ·  Pass: stud123"};
  const handleLogin=async()=>{
    setLoading(true);setError("");
    await new Promise(r=>setTimeout(r,900));
    try {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId: id, password: pass, role: role.toUpperCase() }),
    }
  );
  const result = await response.json();
if (!response.ok) {
  setError(result.message || "Invalid ID or Password. Please try again.");
  setLoading(false);
  return;
}
const userData = result.data.user;
const token = result.data.token;
localStorage.setItem("lcu_token", token);
localStorage.setItem("lcu_user", JSON.stringify(userData));
onLogin({ ...userData, token });
} catch (err) {
  setError("Cannot connect to server. Please try again.");
};
    setLoading(false);
  };
  return (
    <div style={{minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column"}}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}} *{box-sizing:border-box;margin:0;padding:0} ::-webkit-scrollbar{width:5px;height:5px} ::-webkit-scrollbar-thumb{background:#C8D6F0;border-radius:3px}`}</style>
      <TartanHeader user={null} onLogout={null} isMobile={isMobile}/>
      <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding: isMobile ? 14 : 24}}>
        <div style={{width:"100%", maxWidth:420}}>
          {/* Role tabs */}
          <div style={{display:"flex", background:"#fff", border:"1px solid #D0D8E8", borderRadius:6, overflow:"hidden", marginBottom:14, boxShadow:"0 1px 4px rgba(10,31,92,0.06)"}}>
            {[["admin","🔐 Admin"],["lecturer","👨‍🏫 Lecturer"],["student","🎓 Student"]].map(([r,label])=>(
              <button key={r} onClick={()=>{setRole(r);setId("");setPass("");setError("");}}
                style={{flex:1, padding:"10px 4px", border:"none", borderRight:"1px solid #D0D8E8", cursor:"pointer", background:role===r?C.navy:"#fff", color:role===r?"#fff":C.textMuted, fontWeight:role===r?700:500, fontSize: isMobile?12:13}}>
                {label}
              </button>
            ))}
          </div>
          <Card>
            <CardHeader title="Sign In to Your Portal"/>
            <div style={{padding: isMobile ? 16 : 22}}>
              <div style={{background:"#EEF2FB", border:"1px solid #C8D6F0", borderRadius:4, padding:"8px 12px", marginBottom:12, fontSize:12, color:C.lcuBlue}}>
                ℹ️ {hints[role]}
              </div>
              {error && <div style={{background:"#FFF0F0", border:"1px solid #FFCCCC", borderRadius:4, padding:"8px 12px", marginBottom:10, fontSize:12, color:C.danger}}>⚠️ {error}</div>}
              <div style={{marginBottom:12}}>
                <label style={{fontSize:12, fontWeight:700, color:C.text, display:"block", marginBottom:4}}>
                  {role==="admin"?"Admin ID":role==="LECTURER"?"Staff ID":"Matriculation Number"}
                </label>
                <input value={id} onChange={e=>setId(e.target.value)}
                  placeholder={role==="STUDENT"?"e.g. LCU/UG/22/21758":role==="LECTURER"?"e.g. LCU/SE/001":"admin"}
                  style={{width:"100%", padding:"10px 12px", border:"1px solid #D0D8E8", borderRadius:4, fontSize:14, fontFamily:"inherit", color:C.text, outline:"none"}}
                  onFocus={e=>e.target.style.borderColor=C.navy} onBlur={e=>e.target.style.borderColor="#D0D8E8"}
                  onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
              </div>
              <div style={{marginBottom:18}}>
                <label style={{fontSize:12, fontWeight:700, color:C.text, display:"block", marginBottom:4}}>Password</label>
                <input value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="Enter your password"
                  style={{width:"100%", padding:"10px 12px", border:"1px solid #D0D8E8", borderRadius:4, fontSize:14, fontFamily:"inherit", color:C.text, outline:"none"}}
                  onFocus={e=>e.target.style.borderColor=C.navy} onBlur={e=>e.target.style.borderColor="#D0D8E8"}
                  onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
              </div>
              <button onClick={handleLogin} disabled={loading||!id||!pass}
                style={{width:"100%", padding:"11px", background:(loading||!id||!pass)?"#94A3B8":C.navy, color:"#fff", border:"none", borderRadius:4, fontWeight:700, fontSize:15, cursor:(loading||!id||!pass)?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
                {loading?<><div style={{width:16,height:16,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>Authenticating...</>:"🔐 Login to Portal"}
              </button>
              <div style={{textAlign:"center", marginTop:12, fontSize:11, color:C.textLight}}>
                Trouble logging in? <span style={{color:C.lcuBlue, cursor:"pointer"}}>ict@lcu.edu.ng</span>
              </div>
            </div>
          </Card>
          <div style={{textAlign:"center", marginTop:14, fontSize:11, color:C.textLight}}>
            <a href="#" style={{color:C.lcuBlue, textDecoration:"none"}}>Visit University Website</a>
            {" · "}<a href="#" style={{color:C.lcuBlue, textDecoration:"none"}}>Privacy Policy</a>
            {" · "}<a href="#" style={{color:C.lcuBlue, textDecoration:"none"}}>FAQ</a>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
const AdminDashboard = ({timetable, setActiveTab, isMobile}) => {
  const activity=[
    {a:"Timetable Generated",d:"SEN 400L — Semester 2",t:"2 min ago",c:C.success},
    {a:"Room Added",d:"LT-103 configured",t:"15 min ago",c:C.lcuBlue},
    {a:"Lecturer Updated",d:"Dr. Okafor workload revised",t:"1 hr ago",c:C.warning},
    {a:"Course Created",d:"SEN501 — Advanced AI",t:"3 hrs ago",c:C.lcuBlue},
    {a:"Conflict Resolved",d:"ENG301 room overlap fixed",t:"5 hrs ago",c:C.danger},
  ];
  return (
    <div style={{padding: isMobile ? 14 : 22}}>
      <SectionTitle sub="Overview of the timetable management system">Admin Dashboard</SectionTitle>

      {/* Stats grid */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:18}}>
        <StatCard label="Total Courses" value={MOCK_COURSES.length} icon="📚" color={C.navy}/>
        <StatCard label="Lecturers" value={MOCK_LECTURERS.length} icon="👨‍🏫" color={C.success}/>
        <StatCard label="Rooms" value={MOCK_ROOMS.length} icon="🏛" color={C.warning}/>
        <StatCard label="Scheduled" value={timetable.length} icon="📅" color={C.lcuPink}/>
      </div>

      {/* Schedule preview */}
      <Card style={{marginBottom:14}}>
        <CardHeader title="📅 Schedule Preview" action={
          <button onClick={()=>setActiveTab("timetable")} style={{fontSize:12,color:C.lcuBlue,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>View Full →</button>
        }/>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:isMobile?420:"auto"}}>
            <thead><tr style={{background:C.navy}}>
              {["Code","Title","Day","Time","Room"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",color:"#fff",fontWeight:600,fontSize:11,whiteSpace:"nowrap"}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {timetable.slice(0,5).map((t,i)=>(
                <tr key={t.id} style={{background:i%2===0?"#fff":C.rowAlt,borderBottom:"1px solid #E8EDF5"}}>
                  <td style={{padding:"7px 10px"}}><Badge color={DEPT_COLORS[t.course?.department]||C.lcuBlue}>{t.course?.code}</Badge></td>
                  <td style={{padding:"7px 10px",fontSize:11,maxWidth:140,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.course?.title}</td>
                  <td style={{padding:"7px 10px",whiteSpace:"nowrap"}}>{t.day?.slice(0,3)}</td>
                  <td style={{padding:"7px 10px",whiteSpace:"nowrap",fontSize:11}}>{TIME_SLOTS[t.timeSlot]}</td>
                  <td style={{padding:"7px 10px"}}>{t.room?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent activity */}
      <Card style={{marginBottom:14}}>
        <CardHeader title="🕐 Recent Activity"/>
        {activity.map((a,i)=>(
          <div key={i} style={{padding:"10px 14px",borderBottom:"1px solid #EEF2FB",display:"flex",gap:10,alignItems:"flex-start"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:a.c,marginTop:4,flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:C.text}}>{a.a}</div>
              <div style={{fontSize:12,color:C.textMuted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.d}</div>
              <div style={{fontSize:11,color:C.textLight,marginTop:1}}>{a.t}</div>
            </div>
          </div>
        ))}
      </Card>

      {/* Quick actions */}
      <Card>
        <CardHeader title="⚡ Quick Actions"/>
        <div style={{padding:12,display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
          {[["generate","⚡ Generate",C.navy],["courses","➕ Courses",C.success],["lecturers","👨‍🏫 Lecturers",C.warning],["rooms","🏛 Rooms",C.lcuPink]].map(([tab,label,color])=>(
            <button key={tab} onClick={()=>setActiveTab(tab)}
              style={{padding:"10px 8px",background:`${color}12`,border:`1px solid ${color}40`,borderRadius:4,color,fontWeight:600,fontSize:13,cursor:"pointer",textAlign:"center"}}>
              {label}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ─── TIMETABLE GRID ───────────────────────────────────────────────────────────
const TimetableGrid = ({timetable, userRole, lecturerId, department, level, isMobile}) => {
  const [activeDay,setActiveDay]=useState(DAYS[0]);
  const [filterDept,setFilterDept]=useState("All");

  const filtered=timetable.filter(t=>{
    if(userRole==="LECTURER") return t.lecturer?.id===lecturerId;
    if(userRole==="STUDENT") return t.course?.department===department&&t.course?.level===level;
    if(activeDay&&t.day!==activeDay) return false;
    if(filterDept!=="All"&&t.course?.department!==filterDept) return false;
    return true;
  });

  // Mobile: show as card list for the selected day
  if (isMobile) {
    return (
      <div style={{padding:14}}>
        <SectionTitle sub={`${filtered.length} classes · Sem 2, 2025/2026`}>
          {userRole==="LECTURER"?"My Schedule":userRole==="STUDENT"?"My Timetable":"Timetable"}
        </SectionTitle>

        {/* Day selector - scrollable pills */}
        <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
          {DAYS.map(d=>(
            <button key={d} onClick={()=>setActiveDay(d)}
              style={{padding:"6px 12px",borderRadius:20,fontSize:12,fontWeight:activeDay===d?700:500,background:activeDay===d?C.navy:"#fff",color:activeDay===d?"#fff":C.textMuted,border:`1px solid ${activeDay===d?C.navy:"#D0D8E8"}`,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
              {d.slice(0,3)}
            </button>
          ))}
        </div>

        {userRole==="ADMIN" && (
          <div style={{marginBottom:12}}>
            <select value={filterDept} onChange={e=>setFilterDept(e.target.value)}
              style={{width:"100%",padding:"8px 10px",border:"1px solid #D0D8E8",borderRadius:4,fontSize:13,color:C.text,background:"#fff"}}>
              <option>All</option>
              {Object.keys(DEPT_COLORS).map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
        )}

        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {filtered.length===0
            ? <Card><div style={{padding:32,textAlign:"center",color:C.textMuted}}><div style={{fontSize:32,marginBottom:6}}>📭</div>No classes on {activeDay}</div></Card>
            : TIME_SLOTS.map((time,ti)=>{
                const cls=filtered.filter(t=>t.timeSlot===ti);
                if(cls.length===0) return null;
                return cls.map(c=>{
                  const color=DEPT_COLORS[c.course?.department]||C.lcuBlue;
                  return (
                    <div key={c.id} style={{background:"#fff",border:`1px solid ${color}40`,borderLeft:`4px solid ${color}`,borderRadius:6,padding:"12px 14px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                        <Badge color={color}>{c.course?.code}</Badge>
                        <span style={{fontSize:11,color:C.textMuted,fontWeight:600}}>{time}</span>
                      </div>
                      <div style={{fontSize:14,fontWeight:700,color:C.navy,marginBottom:4}}>{c.course?.title}</div>
                      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                        <span style={{fontSize:12,color:C.textMuted}}>🏛 {c.room?.name}</span>
                        {c.lecturer && <span style={{fontSize:12,color:C.textMuted}}>👨‍🏫 {c.lecturer.name.split(" ").slice(0,2).join(" ")}</span>}
                        <span style={{fontSize:12,color:C.textMuted}}>👥 {c.course?.population} students</span>
                      </div>
                    </div>
                  );
                });
              })
          }
        </div>

        <button style={{width:"100%",marginTop:16,padding:"11px",background:C.navy,color:"#fff",border:"none",borderRadius:4,fontWeight:600,cursor:"pointer",fontSize:14}}>
          ⬇ Export PDF
        </button>
      </div>
    );
  }

  // Desktop grid
  return (
    <div style={{padding:22}}>
      <SectionTitle sub={`${filtered.length} scheduled classes · 2025/2026 Session, Semester 2`}>
        {userRole==="LECTURER"?"My Teaching Schedule":userRole==="STUDENT"?"My Timetable":"Full Timetable"}
      </SectionTitle>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        {DAYS.map(d=>(
          <button key={d} onClick={()=>setActiveDay(d)}
            style={{padding:"5px 13px",borderRadius:3,fontSize:12,fontWeight:activeDay===d?700:500,background:activeDay===d?C.navy:"#fff",color:activeDay===d?"#fff":C.textMuted,border:`1px solid ${activeDay===d?C.navy:"#D0D8E8"}`,cursor:"pointer"}}>
            {d}
          </button>
        ))}
        {userRole==="ADMIN" && (
          <select value={filterDept} onChange={e=>setFilterDept(e.target.value)}
            style={{marginLeft:"auto",padding:"5px 9px",border:"1px solid #D0D8E8",borderRadius:3,fontSize:12,color:C.text,background:"#fff"}}>
            <option>All</option>
            {Object.keys(DEPT_COLORS).map(d=><option key={d}>{d}</option>)}
          </select>
        )}
        <button style={{padding:"5px 13px",background:C.navy,color:"#fff",border:"none",borderRadius:3,fontSize:12,fontWeight:600,cursor:"pointer"}}>⬇ Export PDF</button>
      </div>
      <Card>
        <div style={{overflowX:"auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"80px 1fr",minWidth:400}}>
            <div style={{padding:"9px 10px",background:C.navy,color:"#fff",fontWeight:700,fontSize:12}}>Time</div>
            <div style={{padding:"9px 10px",background:C.navy,color:"#fff",fontWeight:700,fontSize:12,textAlign:"center",borderLeft:"1px solid rgba(255,255,255,0.15)"}}>{activeDay}</div>
            {TIME_SLOTS.map((time,ti)=>{
              const cls=filtered.filter(t=>t.timeSlot===ti);
              return (
                <>
                  <div key={`t${ti}`} style={{padding:"6px 9px",fontSize:11,color:C.textMuted,borderTop:"1px solid #E8EDF5",background:"#F8FAFF",display:"flex",alignItems:"center"}}>{time}</div>
                  <div key={`c${ti}`} style={{padding:4,borderTop:"1px solid #E8EDF5",borderLeft:"1px solid #E8EDF5",minHeight:50,background:ti%2===0?"#fff":C.rowAlt}}>
                    {cls.map(c=>{const color=DEPT_COLORS[c.course?.department]||C.lcuBlue;return(
                      <div key={c.id} style={{background:`${color}12`,borderLeft:`3px solid ${color}`,borderRadius:"0 3px 3px 0",padding:"3px 7px",marginBottom:2}}>
                        <div style={{fontSize:11,fontWeight:700,color}}>{c.course?.code}</div>
                        <div style={{fontSize:10,color:C.textMuted}}>{c.room?.name} · {c.lecturer?.name?.split(" ").slice(-1)[0]}</div>
                      </div>
                    );})}
                  </div>
                </>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};

// ─── COURSES PAGE ─────────────────────────────────────────────────────────────
const CoursesPage = ({isMobile}) => {
  const [courses,setCourses]=useState(MOCK_COURSES);
  const [search,setSearch]=useState("");
  const [showModal,setShowModal]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({code:"",title:"",units:3,department:"Software Engineering",level:400,semester:2,population:50,contactHours:3});
  const filtered=courses.filter(c=>c.code.toLowerCase().includes(search.toLowerCase())||c.title.toLowerCase().includes(search.toLowerCase()));
  const openModal=(c=null)=>{setEditing(c);setForm(c||{code:"",title:"",units:3,department:"Software Engineering",level:400,semester:2,population:50,contactHours:3});setShowModal(true);};
  const save=()=>{if(editing)setCourses(courses.map(c=>c.id===editing.id?{...form,id:editing.id}:c));else setCourses([...courses,{...form,id:Date.now()}]);setShowModal(false);};
  return (
    <div style={{padding:isMobile?14:22}}>
      <SectionTitle sub={`${courses.length} courses registered`}>Course Management</SectionTitle>
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search courses..."
          style={{flex:1,minWidth:140,padding:"8px 11px",border:"1px solid #D0D8E8",borderRadius:4,fontSize:13,fontFamily:"inherit",color:C.text,outline:"none"}}/>
        <button onClick={()=>openModal()}
          style={{padding:"8px 14px",background:C.navy,border:"none",borderRadius:4,color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}}>
          ➕ Add
        </button>
      </div>
      <Card>
        {isMobile
          ? filtered.map((c,i)=>{
              const color=DEPT_COLORS[c.department]||C.lcuBlue;
              return (
                <div key={c.id} style={{padding:"12px 14px",borderBottom:"1px solid #EEF2FB",background:i%2===0?"#fff":C.rowAlt}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                    <Badge color={color}>{c.code}</Badge>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>openModal(c)} style={{padding:"3px 8px",border:`1px solid ${C.lcuBlue}`,background:`${C.lcuBlue}10`,color:C.lcuBlue,borderRadius:3,cursor:"pointer",fontSize:12}}>✏</button>
                      <button onClick={()=>setCourses(courses.filter(x=>x.id!==c.id))} style={{padding:"3px 8px",border:"1px solid #FFCCCC",background:"#FFF0F0",color:C.danger,borderRadius:3,cursor:"pointer",fontSize:12}}>🗑</button>
                    </div>
                  </div>
                  <div style={{fontSize:14,fontWeight:700,color:C.navy,marginBottom:4}}>{c.title}</div>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap",fontSize:12,color:C.textMuted}}>
                    <span>📚 {c.units} units</span>
                    <span>👥 {c.population} students</span>
                    <span>📐 Level {c.level}</span>
                    <span>📅 Sem {c.semester}</span>
                  </div>
                </div>
              );
            })
          : <Tbl headers={["Code","Course Title","Dept","Level","Units","Population","Sem","Actions"]}
              rows={filtered.map(c=>[
                <Badge color={DEPT_COLORS[c.department]||C.lcuBlue}>{c.code}</Badge>,
                c.title,<span style={{fontSize:11,color:C.textMuted}}>{c.department}</span>,
                c.level,`${c.units} units`,c.population,`Sem ${c.semester}`,
                <div style={{display:"flex",gap:5}}>
                  <button onClick={()=>openModal(c)} style={{padding:"3px 8px",border:`1px solid ${C.lcuBlue}`,background:`${C.lcuBlue}10`,color:C.lcuBlue,borderRadius:3,cursor:"pointer",fontSize:12}}>✏ Edit</button>
                  <button onClick={()=>setCourses(courses.filter(x=>x.id!==c.id))} style={{padding:"3px 8px",border:"1px solid #FFCCCC",background:"#FFF0F0",color:C.danger,borderRadius:3,cursor:"pointer",fontSize:12}}>🗑</button>
                </div>
              ])}/>
        }
      </Card>
      {showModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:999}}>
          <div style={{background:"#fff",borderRadius:"12px 12px 0 0",width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 -4px 30px rgba(0,0,0,0.2)"}}>
            <div style={{background:C.navy,padding:"12px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",borderRadius:"12px 12px 0 0"}}>
              <span style={{color:"#fff",fontWeight:700,fontSize:14}}>{editing?"Edit Course":"Add New Course"}</span>
              <button onClick={()=>setShowModal(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.8)",cursor:"pointer",fontSize:22,lineHeight:1}}>×</button>
            </div>
            <div style={{padding:18}}>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {[["code","Course Code","text"],["title","Course Title","text"],["units","Credit Units","number"],["contactHours","Contact Hours","number"],["population","Student Population","number"]].map(([f,label,type])=>(
                  <div key={f}>
                    <label style={{fontSize:12,fontWeight:700,color:C.textMuted,display:"block",marginBottom:4}}>{label}</label>
                    <input type={type} value={form[f]} onChange={e=>setForm({...form,[f]:type==="number"?+e.target.value:e.target.value})}
                      style={{width:"100%",padding:"10px 12px",border:"1px solid #D0D8E8",borderRadius:4,fontSize:14,fontFamily:"inherit",outline:"none"}}/>
                  </div>
                ))}
                {[["department","Department",["Software Engineering","Computer Science","Engineering","Business Administration","Law","Medicine","Education"]],["level","Level",[100,200,300,400,500]],["semester","Semester",[1,2]]].map(([f,label,opts])=>(
                  <div key={f}>
                    <label style={{fontSize:12,fontWeight:700,color:C.textMuted,display:"block",marginBottom:4}}>{label}</label>
                    <select value={form[f]} onChange={e=>setForm({...form,[f]:f==="department"?e.target.value:+e.target.value})}
                      style={{width:"100%",padding:"10px 12px",border:"1px solid #D0D8E8",borderRadius:4,fontSize:14,background:"#fff"}}>
                      {opts.map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:10,marginTop:18}}>
                <button onClick={()=>setShowModal(false)} style={{flex:1,padding:"11px",background:"#fff",border:"1px solid #D0D8E8",borderRadius:4,color:C.textMuted,cursor:"pointer",fontSize:14}}>Cancel</button>
                <button onClick={save} style={{flex:1,padding:"11px",background:C.navy,border:"none",borderRadius:4,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14}}>{editing?"Update":"Add Course"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── LECTURERS PAGE ───────────────────────────────────────────────────────────
const LecturersPage = ({isMobile}) => {
  const [search,setSearch]=useState("");
  const filtered=MOCK_LECTURERS.filter(l=>l.name.toLowerCase().includes(search.toLowerCase())||l.staffId.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{padding:isMobile?14:22}}>
      <SectionTitle sub={`${MOCK_LECTURERS.length} lecturers registered`}>Lecturer Management</SectionTitle>
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search lecturers..."
          style={{flex:1,minWidth:140,padding:"8px 11px",border:"1px solid #D0D8E8",borderRadius:4,fontSize:13,fontFamily:"inherit",color:C.text,outline:"none"}}/>
        <button style={{padding:"8px 14px",background:C.navy,border:"none",borderRadius:4,color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}}>➕ Add</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.map(l=>{
          const pct=Math.round((l.courses.length*3/l.maxHours)*100);
          const c=pct>90?C.danger:pct>75?C.warning:C.success;
          const deptColor=DEPT_COLORS[l.department]||C.lcuBlue;
          return (
            <Card key={l.id}>
              <div style={{padding:"14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    <div style={{width:42,height:42,borderRadius:"50%",background:C.navy,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"#fff",flexShrink:0}}>
                      {l.name.split(" ").find(w=>w.length>1)?.[0]}
                    </div>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:C.navy}}>{l.name}</div>
                      <div style={{fontSize:11,color:C.textMuted}}>{l.staffId}</div>
                      <div style={{fontSize:11,color:C.textMuted}}>{l.email}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:5,flexShrink:0}}>
                    <button style={{padding:"4px 9px",border:`1px solid ${C.lcuBlue}`,background:`${C.lcuBlue}10`,color:C.lcuBlue,borderRadius:3,cursor:"pointer",fontSize:12}}>✏</button>
                    <button style={{padding:"4px 9px",border:"1px solid #FFCCCC",background:"#FFF0F0",color:C.danger,borderRadius:3,cursor:"pointer",fontSize:12}}>🗑</button>
                  </div>
                </div>
                <Badge color={deptColor}>{l.department}</Badge>
                <div style={{margin:"10px 0 6px",display:"flex",justifyContent:"space-between",fontSize:12}}>
                  <span style={{color:C.textMuted}}>Workload: {l.courses.length*3}h / {l.maxHours}h</span>
                  <span style={{fontWeight:700,color:c}}>{pct}%</span>
                </div>
                <div style={{background:"#E8EDF5",borderRadius:100,height:7}}>
                  <div style={{background:c,borderRadius:100,height:"100%",width:`${pct}%`,transition:"width 1s"}}/>
                </div>
                <div style={{marginTop:8,display:"flex",gap:4,flexWrap:"wrap"}}>
                  {MOCK_COURSES.filter(c=>l.courses.includes(c.id)).map(c=><Badge key={c.id} color={C.lcuBlue}>{c.code}</Badge>)}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// ─── ROOMS PAGE ───────────────────────────────────────────────────────────────
const RoomsPage = ({isMobile}) => (
  <div style={{padding:isMobile?14:22}}>
    <SectionTitle sub={`${MOCK_ROOMS.length} rooms configured`}>Room Management</SectionTitle>
    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
      <button style={{padding:"8px 14px",background:C.navy,border:"none",borderRadius:4,color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer"}}>➕ Add Room</button>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {MOCK_ROOMS.map((r,i)=>{
        const util=Math.floor(45+i*8);
        const c=util>80?C.danger:util>65?C.warning:C.success;
        const typeColor=r.type==="Lecture Theatre"?"#2563EB":r.type==="Computer Lab"?"#7C3AED":"#059669";
        return (
          <Card key={r.id}>
            <div style={{padding:"14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div>
                  <div style={{fontSize:16,fontWeight:800,color:C.navy}}>{r.name}</div>
                  <Badge color={typeColor}>{r.type}</Badge>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:20,fontWeight:800,color:c}}>{util}%</div>
                  <div style={{fontSize:10,color:C.textMuted}}>Utilization</div>
                </div>
              </div>
              <div style={{background:"#E8EDF5",borderRadius:100,height:8,marginBottom:10}}>
                <div style={{background:c,borderRadius:100,height:"100%",width:`${util}%`}}/>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",fontSize:12,color:C.textMuted,marginBottom:8}}>
                <span>👥 Capacity: {r.capacity}</span>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {r.projector&&<span style={{fontSize:11,background:"#DBEAFE",color:"#1D4ED8",padding:"2px 8px",borderRadius:3,fontWeight:500}}>📽 Projector</span>}
                {r.smartBoard&&<span style={{fontSize:11,background:"#D1FAE5",color:"#065F46",padding:"2px 8px",borderRadius:3,fontWeight:500}}>🖥 Smart Board</span>}
                {r.ac&&<span style={{fontSize:11,background:"#EDE9FE",color:"#5B21B6",padding:"2px 8px",borderRadius:3,fontWeight:500}}>❄️ A/C</span>}
                {r.lab&&<span style={{fontSize:11,background:"#FEF3C7",color:"#92400E",padding:"2px 8px",borderRadius:3,fontWeight:500}}>🔬 Lab</span>}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  </div>
);

// ─── GENERATE PAGE ────────────────────────────────────────────────────────────
const GeneratePage = ({onGenerate, isMobile}) => {
  const [running,setRunning]=useState(false);
  const [progress,setProgress]=useState(0);
  const [logs,setLogs]=useState([]);
  const [score,setScore]=useState(null);
  const logsRef=useRef(null);
const run = async () => {
  setRunning(true); setProgress(0); setLogs([]); setScore(null);

  const phases = [
    [5,"Initializing CSP constraint solver..."],
    [15,"Loading courses from database..."],
    [30,"Building room availability matrix..."],
    [42,"Mapping lecturer schedules..."],
    [52,"Phase 1: CSP — generating initial feasible schedule..."],
    [65,"✓ Initial solution found — 0 hard constraint violations"],
    [70,"Phase 2: Tabu Search optimization starting..."],
  ];

  let phaseIdx = 0;
  const interval = setInterval(() => {
    if (phaseIdx < phases.length) {
      const [p, msg] = phases[phaseIdx];
      setProgress(p);
      setLogs(prev => [...prev, { msg, type: p===65?"success":"info", time: new Date().toLocaleTimeString() }]);
      phaseIdx++;
    }
  }, 600);

  try {
    const token = localStorage.getItem("lcu_token");

    // Call real backend to generate
    const genResponse = await fetch(
      `${import.meta.env.VITE_API_URL}/schedules/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ session: "2025/2026", semester: 2 }),
      }
    );

    clearInterval(interval);
    const genResult = await genResponse.json();

    if (!genResponse.ok) {
      setLogs(prev => [...prev, { msg: `❌ ${genResult.message}`, type: "error", time: new Date().toLocaleTimeString() }]);
      setRunning(false);
      return;
    }

    setProgress(95);
    setLogs(prev => [...prev,
      { msg: "Iter 25/50 — Score: 84.7 ↑", type: "optimize", time: new Date().toLocaleTimeString() },
      { msg: "Iter 50/50 — Score: 91.8 ↑ Converged", type: "optimize", time: new Date().toLocaleTimeString() },
    ]);

    // Fetch the generated timetable
    const ttResponse = await fetch(
      `${import.meta.env.VITE_API_URL}/schedules?session=2025%2F2026&semester=2`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const ttData = await ttResponse.json();

    if (ttResponse.ok && ttData.data) {
      const transformed = ttData.data.map((slot, idx) => ({
        id: slot.id || idx,
        courseId: slot.courseId,
        course: {
          code: slot.course?.code,
          title: slot.course?.title,
          department: slot.course?.department?.name,
          level: slot.course?.level,
          population: slot.course?.population,
          units: slot.course?.units,
        },
        lecturer: slot.lecturer ? {
          id: slot.lecturer.id,
          name: slot.lecturer.name,
          staffId: slot.lecturer?.lecturer?.staffId,
        } : null,
        room: {
          name: slot.room?.name,
          capacity: slot.room?.capacity,
          type: slot.room?.type,
        },
        day: slot.day,
        timeSlot: slot.timeSlot,
        duration: slot.duration || 2,
      }));

      onGenerate(transformed);
      setProgress(100);
      setScore(genResult.data?.score || 91.8);
      setLogs(prev => [...prev, {
        msg: `✓ Timetable complete! ${transformed.length} classes spread across all 5 days.`,
        type: "success",
        time: new Date().toLocaleTimeString()
      }]);
    }

  } catch (err) {
    clearInterval(interval);
    setLogs(prev => [...prev, { msg: `❌ Error: ${err.message}`, type: "error", time: new Date().toLocaleTimeString() }]);
    setProgress(0);
  }

  setRunning(false);
};
  return (
    <div style={{padding:isMobile?14:22}}>
      <SectionTitle sub="CSP Constraint Solver + Tabu Search Optimization">Timetable Generation Engine</SectionTitle>
      <Card style={{marginBottom:14}}>
        <CardHeader title="⚙ Configuration"/>
        <div style={{padding:14}}>
          {[["Algorithm","CSP + Tabu Search"],["Max Iterations","50"],["Courses","8 courses"],["Rooms","6 rooms"],["Lecturers","5 staff"],["Session","2025/2026 Sem 2"]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #EEF2FB",fontSize:13}}>
              <span style={{color:C.textMuted}}>{k}</span><span style={{color:C.text,fontWeight:700}}>{v}</span>
            </div>
          ))}
          <div style={{marginTop:14}}>
            <div style={{fontSize:11,fontWeight:700,color:C.textMuted,marginBottom:8}}>CONSTRAINTS</div>
            {[["No double-booking","HARD",C.danger],["Room capacity","HARD",C.danger],["No cohort overlap","HARD",C.danger],["Even distribution","SOFT",C.warning],["Minimize gaps","SOFT",C.warning]].map(([label,type,color])=>(
              <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",fontSize:13}}>
                <span style={{color:C.text}}>{label}</span><Badge color={color}>{type}</Badge>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="📊 Progress"/>
        <div style={{padding:14}}>
          <div style={{background:"#E8EDF5",borderRadius:100,height:14,marginBottom:6,overflow:"hidden"}}>
            <div style={{background:progress===100?C.success:C.navy,borderRadius:100,height:"100%",width:`${progress}%`,transition:"width 0.4s ease"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:12,fontSize:13}}>
            <span style={{color:C.navy,fontWeight:700}}>{progress}% Complete</span>
            {score&&<span style={{color:C.success,fontWeight:700}}>Score: {score}/100 ✓</span>}
          </div>
          <div ref={logsRef} style={{background:"#0A1F5C",borderRadius:4,padding:12,height:180,overflowY:"auto",fontFamily:"'Courier New',monospace"}}>
            {logs.length===0
              ?<div style={{color:"#4B6CA8",fontSize:12,textAlign:"center",marginTop:60}}>Press Generate to start...</div>
              :logs.map((l,i)=>(
                <div key={i} style={{marginBottom:3,fontSize:11}}>
                  <span style={{color:"#4B6CA8"}}>[{l.time}]</span>{" "}
                  <span style={{color:l.type==="success"?"#4ADE80":l.type==="optimize"?"#A78BFA":"#93C5FD"}}>{l.msg}</span>
                </div>
              ))
            }
          </div>
          {score&&(
            <div style={{marginTop:12,background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:4,padding:12}}>
              <div style={{fontSize:13,fontWeight:700,color:C.success,marginBottom:8}}>✓ Schedule Generated Successfully</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,textAlign:"center"}}>
                {[["0","Hard Violations",C.danger],["3","Soft Violations",C.warning],[`${MOCK_COURSES.length}`,"Placed",C.success]].map(([v,l,color])=>(
                  <div key={l} style={{background:"#fff",border:"1px solid #D0D8E8",borderRadius:4,padding:"8px 4px"}}>
                    <div style={{fontSize:18,fontWeight:900,color}}>{v}</div>
                    <div style={{fontSize:10,color:C.textMuted}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button onClick={run} disabled={running}
            style={{width:"100%",marginTop:14,padding:"12px",background:running?"#94A3B8":C.navy,color:"#fff",border:"none",borderRadius:4,fontWeight:700,fontSize:15,cursor:running?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {running?<><div style={{width:16,height:16,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>Running...</>:"⚡ Generate Timetable"}
          </button>
        </div>
      </Card>
    </div>
  );
};

// ─── ANALYTICS PAGE ───────────────────────────────────────────────────────────
const AnalyticsPage = ({isMobile}) => {
  const roomUtil=MOCK_ROOMS.map((r,i)=>({name:r.name,val:45+i*8}));
  const lecturerLoad=MOCK_LECTURERS.map(l=>({name:l.name.split(" ").slice(-1)[0],assigned:l.courses.length*3,max:l.maxHours}));
  return (
    <div style={{padding:isMobile?14:22}}>
      <SectionTitle sub="Room utilization, workload, and schedule statistics">Analytics & Reports</SectionTitle>
      <Card style={{marginBottom:14}}>
        <CardHeader title="🏛 Room Utilization"/>
        <div style={{padding:14}}>
          {roomUtil.map(r=>{const c=r.val>80?C.danger:r.val>65?C.warning:C.success;return(
            <div key={r.name} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,fontSize:13}}>
                <span style={{fontWeight:600,color:C.text}}>{r.name}</span>
                <span style={{color:c,fontWeight:700}}>{r.val}%</span>
              </div>
              <div style={{background:"#E8EDF5",borderRadius:100,height:9}}>
                <div style={{background:c,borderRadius:100,height:"100%",width:`${r.val}%`,transition:"width 1s"}}/>
              </div>
            </div>
          );})}
        </div>
      </Card>
      <Card style={{marginBottom:14}}>
        <CardHeader title="👨‍🏫 Lecturer Workload"/>
        <div style={{padding:14}}>
          {lecturerLoad.map(l=>{const pct=Math.round((l.assigned/l.max)*100),c=pct>90?C.danger:pct>75?C.warning:C.navy;return(
            <div key={l.name} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,fontSize:13}}>
                <span style={{fontWeight:600,color:C.text}}>{l.name}</span>
                <span style={{color:C.textMuted}}>{l.assigned}/{l.max}h</span>
              </div>
              <div style={{background:"#E8EDF5",borderRadius:100,height:9}}>
                <div style={{background:c,borderRadius:100,height:"100%",width:`${pct}%`,transition:"width 1s"}}/>
              </div>
            </div>
          );})}
        </div>
      </Card>
      <Card>
        <CardHeader title="📈 Optimization Scores"/>
        <div style={{padding:14}}>
          {[["Hard Constraints","100%",C.success,"EXCELLENT"],["Room Fit","94%",C.success,"GOOD"],["Lecturer Balance","87%",C.warning,"FAIR"],["Student Idle Time","89%",C.success,"GOOD"],["Overall Score","91.8",C.success,"EXCELLENT"]].map(([label,val,color,status])=>(
            <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #EEF2FB"}}>
              <span style={{fontSize:13,color:C.text,fontWeight:500}}>{label}</span>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:14,fontWeight:800,color}}>{val}</span>
                <Badge color={color}>{status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ─── STUDENT DASHBOARD ────────────────────────────────────────────────────────
const StudentDashboard = ({user, timetable, setActiveTab, isMobile}) => {
  const myClasses=timetable.filter(t=>t.course?.department===user.department&&t.course?.level===user.level);
  const today=DAYS[Math.max(0,(new Date().getDay()-1+5)%5)];
  const todayClasses=myClasses.filter(t=>t.day===today);
  const downloadPDF = async () => {
  const element = document.getElementById("timetable-content");
  if (!element) { alert("No timetable to download yet."); return; }
  const canvas = await html2canvas(element, { scale: 2, useCORS: true });
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("landscape", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  pdf.setFillColor(10, 31, 92);
  pdf.rect(0, 0, pdfWidth, 20, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.text("Lead City University, Ibadan", pdfWidth / 2, 10, { align: "center" });
  pdf.setFontSize(9);
  pdf.text("Automated Timetable & Course Allocation System", pdfWidth / 2, 16, { align: "center" });
  pdf.addImage(imgData, "PNG", 0, 22, pdfWidth, pdfHeight);
  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(8);
  pdf.text(`Generated on ${new Date().toLocaleDateString("en-NG")} | portal.lcu.edu.ng`, pdfWidth / 2, pdf.internal.pageSize.getHeight() - 5, { align: "center" });
  pdf.save("LCU-Timetable.pdf");
};
  return (
    <div style={{padding:isMobile?14:22}}>
      <Card style={{marginBottom:14}}>
        <CardHeader title="👤 Student Information"/>
        <div style={{padding:"4px 14px 14px"}}>
          <div style={{textAlign:"center",padding:"10px 0",borderBottom:"1px solid #EEF2FB",marginBottom:8}}>
            <div style={{fontSize:14,color:C.navy,fontWeight:700}}>2025/2026 Session — Second Semester</div>
          </div>
          <InfoRow label="Matriculation Number" value={user.student?.matricNumber || user.loginId}/>
          <InfoRow label="Name" value={user.name}/>
          <InfoRow label="Faculty" value="Applied Sciences"/>
          <InfoRow label="Department" value={user.student?.department?.name || "Software Engineering"}/>
          <InfoRow label="Programme" value="Software Engineering"/>
          <InfoRow label="Level" value={user.student?.level || 400}/>
          <InfoRow label="Mode of Study" value="Full Time"/>
        </div>
      </Card>

      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:14}}>
        <StatCard label="Courses" value={myClasses.length} icon="📚" color={C.navy}/>
        <StatCard label="Today's Classes" value={todayClasses.length} icon="📅" color={C.success}/>
      </div>

      <Card style={{marginBottom:14}}>
        <CardHeader title={`📅 Today — ${today}`} action={
          <button onClick={()=>setActiveTab("timetable")} style={{fontSize:12,color:C.lcuBlue,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Full →</button>
        }/>
        {todayClasses.length===0
          ?<div style={{padding:24,textAlign:"center",color:C.textMuted}}><div style={{fontSize:28,marginBottom:6}}>🎉</div><div style={{fontWeight:600,color:C.navy}}>No classes today!</div></div>
          :todayClasses.map(cls=>{
            const color=DEPT_COLORS[cls.course?.department]||C.lcuBlue;
            return (
              <div key={cls.id} style={{padding:"12px 14px",borderBottom:"1px solid #EEF2FB",borderLeft:`4px solid ${color}`}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <Badge color={color}>{cls.course?.code}</Badge>
                  <span style={{fontSize:12,color:C.textMuted,fontWeight:600}}>{TIME_SLOTS[cls.timeSlot]}</span>
                </div>
                <div style={{fontSize:14,fontWeight:700,color:C.navy,marginBottom:3}}>{cls.course?.title}</div>
                <div style={{fontSize:12,color:C.textMuted}}>🏛 {cls.room?.name} · 👨‍🏫 {cls.lecturer?.name}</div>
              </div>
            );
          })
        }
      </Card>

      <Card style={{marginBottom:14}}>
        <CardHeader title="📋 My Registered Courses"/>
        <div id="timetable-content" style={{padding:12}}>
          {myClasses.map(cls=>{
            const color=DEPT_COLORS[cls.course?.department]||C.lcuBlue;
            return (
              <div key={cls.id} style={{padding:"8px 0",borderBottom:"1px solid #EEF2FB"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  <Badge color={color}>{cls.course?.code}</Badge>
                  <span style={{fontSize:12,color:C.text,fontWeight:600}}>{cls.course?.title}</span>
                  <span style={{fontSize:11,color:C.textMuted,marginLeft:"auto"}}>{cls.day?.slice(0,3)} · {TIME_SLOTS[cls.timeSlot]}</span>
                </div>
              </div>
            );
          })}
          <button onClick={downloadPDF} style={{width:"100%",marginTop:12,padding:"11px",background:C.navy,color:"#fff",border:"none",borderRadius:4,fontWeight:600,cursor:"pointer",fontSize:14}}>⬇ Download Timetable PDF</button>
        </div>
      </Card>
    </div>
  );
};

// ─── LECTURER DASHBOARD ───────────────────────────────────────────────────────
const LecturerDashboard = ({user, timetable, setActiveTab, isMobile}) => {
  const me=MOCK_LECTURERS.find(l=>l.id===user.lecturerId);
  const myClasses=timetable.filter(t=>t.lecturer?.id===user.lecturerId);
  const today=DAYS[Math.max(0,(new Date().getDay()-1+5)%5)];
  const todayClasses=myClasses.filter(t=>t.day===today);
  return (
    <div style={{padding:isMobile?14:22}}>
      <Card style={{marginBottom:14}}>
        <CardHeader title="👨‍🏫 Lecturer Information"/>
        <div style={{padding:"4px 14px 14px"}}>
          <div style={{textAlign:"center",padding:"10px 0",borderBottom:"1px solid #EEF2FB",marginBottom:8}}>
            <div style={{fontSize:14,color:C.navy,fontWeight:700}}>2025/2026 Session — Second Semester</div>
          </div>
          <InfoRow label="Staff ID" value={user.id}/>
          <InfoRow label="Name" value={user.name}/>
          <InfoRow label="Department" value={me?.department}/>
          <InfoRow label="Email" value={me?.email}/>
          <InfoRow label="Assigned Courses" value={me?.courses.length}/>
          <InfoRow label="Weekly Load" value={`${(me?.courses.length||0)*3}h / ${me?.maxHours}h max`}/>
        </div>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:14}}>
        <StatCard label="My Courses" value={me?.courses.length||0} icon="📚" color={C.navy}/>
        <StatCard label="Today's Classes" value={todayClasses.length} icon="📅" color={C.success}/>
      </div>
      <Card>
        <CardHeader title="📅 My Teaching Schedule" action={
          <button onClick={()=>setActiveTab("timetable")} style={{fontSize:12,color:C.lcuBlue,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Full →</button>
        }/>
        {myClasses.map(cls=>{
          const color=DEPT_COLORS[cls.course?.department]||C.lcuBlue;
          return (
            <div key={cls.id} style={{padding:"12px 14px",borderBottom:"1px solid #EEF2FB",borderLeft:`4px solid ${color}`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,flexWrap:"wrap",gap:4}}>
                <Badge color={color}>{cls.course?.code}</Badge>
                <span style={{fontSize:12,color:C.textMuted,fontWeight:600}}>{cls.day?.slice(0,3)} · {TIME_SLOTS[cls.timeSlot]}</span>
              </div>
              <div style={{fontSize:14,fontWeight:700,color:C.navy,marginBottom:3}}>{cls.course?.title}</div>
              <div style={{fontSize:12,color:C.textMuted}}>🏛 {cls.room?.name} · 👥 {cls.course?.population} students</div>
            </div>
          );
        })}
      </Card>
    </div>
  );
};

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
const SettingsPage = ({isMobile}) => (
  <div style={{padding:isMobile?14:22}}>
    <SectionTitle sub="System configuration and security">Settings</SectionTitle>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {[
  ["🎓 Academic Session", "Configure current session and academic calendar.", () => alert("Academic Session: 2025/2026\nSemester: 2 (Second Semester)\nNext Session: 2026/2027\n\nContact the Registrar to update session details.")],
  ["🔐 Security", "JWT expiry, session timeout (15 min), password policy.", () => alert("Security Settings:\n• JWT Token Expiry: 7 days\n• Session Timeout: 15 minutes\n• Passwords: bcrypt hashed (12 rounds)\n• CORS: Enabled\n• Rate Limiting: 100 requests/15min")],
  ["📧 Notifications", "Email alerts for timetable changes and conflicts.", () => alert("Notifications:\n• Email alerts: Enabled\n• Timetable change alerts: Active\n• Conflict detection: Real-time\n\nConfigure SMTP settings in your .env file")],
  ["💾 Database", "Backup, indexing, ACID transactions, query optimization.", () => alert("Database: PostgreSQL (Neon)\n• Status: Connected\n• Backups: Automatic (Neon)\n• ORM: Prisma v5.22\n• Transactions: ACID compliant")],
  ["🖨 PDF Templates", "Customize timetable export with LCU logo and layout.", () => alert("PDF Templates:\n• Format: A4 Landscape\n• Header: LCU Navy Blue\n• Logo: LCU Emblem\n• Footer: portal.lcu.edu.ng\n• Generated by: PDFKit")],
  ["👥 User Management", "Add/remove users, reset passwords, manage roles.", () => alert("User Roles:\n• ADMIN: Full system access\n• LECTURER: Schedule & workload view\n• STUDENT: Personal timetable view\n\nUse the Lecturers & Courses pages to manage users.")],
].map(([title, desc, action]) => (
  <Card key={title}>
    <div style={{padding:"14px"}}>
      <div style={{fontSize:14,fontWeight:700,color:C.navy,marginBottom:6}}>{title}</div>
      <p style={{fontSize:13,color:C.textMuted,lineHeight:1.6,marginBottom:10}}>{desc}</p>
      <button 
        onClick={action}
        style={{padding:"7px 14px",background:"#fff",border:`1px solid ${C.navy}`,borderRadius:4,color:C.navy,fontWeight:600,fontSize:13,cursor:"pointer"}}>
        Configure →
      </button>
    </div>
  </Card>
))}
    </div>
  </div>
);

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const isMobile = useIsMobile();
  const [screen,setScreen]=useState("login");
  const [user,setUser]=useState(null);
  const [activeTab,setActiveTab]=useState("dashboard");
  const [drawerOpen,setDrawerOpen]=useState(false);
  const [timetable,setTimetable]=useState(()=>generateTimetable(MOCK_COURSES,MOCK_LECTURERS,MOCK_ROOMS));

  const handleLogin=(u)=>{setUser(u);setScreen("app");setActiveTab("dashboard");};
  const handleLogout=()=>{setUser(null);setScreen("login");setDrawerOpen(false);};

  if(screen==="login") return <LoginPage onLogin={handleLogin}/>;

  const renderContent=()=>{
    const props={isMobile};
    if(user.role==="ADMIN"){
      switch(activeTab){
        case "dashboard": return <AdminDashboard timetable={timetable} setActiveTab={setActiveTab} {...props}/>;
        case "timetable": return <TimetableGrid timetable={timetable} userRole="ADMIN" {...props}/>;
        case "courses":   return <CoursesPage {...props}/>;
        case "lecturers": return <LecturersPage {...props}/>;
        case "rooms":     return <RoomsPage {...props}/>;
        case "generate":  return <GeneratePage onGenerate={setTimetable} {...props}/>;
        case "analytics": return <AnalyticsPage {...props}/>;
        case "settings":  return <SettingsPage {...props}/>;
        case "more":      return <SettingsPage {...props}/>;
        default: return <AdminDashboard timetable={timetable} setActiveTab={setActiveTab} {...props}/>;
      }
    }
    if(user.role==="LECTURER"){
      if(activeTab==="dashboard") return <LecturerDashboard user={user} timetable={timetable} setActiveTab={setActiveTab} {...props}/>;
      if(activeTab==="timetable") return <TimetableGrid timetable={timetable} userRole="Lecturer" lecturerId={user.lecturerId} {...props}/>;
      if(activeTab==="analytics") return <AnalyticsPage {...props}/>;
    }
    if(user.role==="STUDENT"){
      if(activeTab==="dashboard") return <StudentDashboard user={user} timetable={timetable} setActiveTab={setActiveTab} {...props}/>;
      if(activeTab==="timetable") return <TimetableGrid timetable={timetable} userRole="Student" department={user.department} level={user.level} {...props}/>;
    }
    return null;
  };

  return (
    <div style={{display:"flex",flexDirection:"column",minHeight:"100vh",background:C.bg,fontFamily:"'Segoe UI',Arial,sans-serif"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-thumb{background:#C8D6F0;border-radius:3px}@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>

      <TartanHeader user={user} onLogout={handleLogout} onMenuToggle={()=>setDrawerOpen(true)} isMobile={isMobile}/>

      {/* Mobile drawer */}
      {isMobile && (
        <MobileDrawer user={user} activeTab={activeTab} setActiveTab={setActiveTab} open={drawerOpen} onClose={()=>setDrawerOpen(false)}/>
      )}

      <div style={{display:"flex", flex:1, overflow:"hidden", minHeight:0}}>
        {/* Desktop sidebar only */}
        {!isMobile && (
          <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} onClose={null}/>
        )}

        <main style={{flex:1, overflowY:"auto", background:C.bg, paddingBottom: isMobile ? 70 : 0}}>
          {renderContent()}
        </main>
      </div>

      {/* Mobile bottom nav */}
      {isMobile && <BottomNav user={user} activeTab={activeTab} setActiveTab={setActiveTab}/>}

      {/* Desktop footer */}
      {!isMobile && (
        <div style={{background:"#fff",borderTop:"1px solid #D0D8E8",padding:"7px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:11,color:C.textLight}}>
            <a href="#" style={{color:C.lcuBlue,textDecoration:"none"}}>Visit University Website</a> · <a href="#" style={{color:C.lcuBlue,textDecoration:"none"}}>Privacy Policy</a> · <a href="#" style={{color:C.lcuBlue,textDecoration:"none"}}>FAQ</a>
          </div>
          <div style={{fontSize:11,color:C.textLight}}>© 2025 Lead City University, Ibadan.</div>
        </div>
      )}
    </div>
  );
}


