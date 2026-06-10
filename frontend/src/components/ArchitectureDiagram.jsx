import React from 'react';

export default function ArchitectureDiagram() {
  return (
    <>

<style>{`

@keyframes pulse{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes hexglow{0%,100%{opacity:.45}50%{opacity:.92}}
@keyframes flowdash{to{stroke-dashoffset:-16}}
@keyframes floatup{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
.pd{animation:pulse 2.4s ease-in-out infinite}
.hg{animation:hexglow 2s ease-in-out infinite}
.fd{animation:flowdash 1.2s linear infinite;stroke-dasharray:4 5}
.plat1{animation:floatup 5s ease-in-out infinite}
.plat2{animation:floatup 5s ease-in-out infinite;animation-delay:.8s}
.plat3{animation:floatup 5s ease-in-out infinite;animation-delay:1.6s}

`}</style>
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', padding: '0 20px' }}>
  <div style={{ flex: '1 1 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', marginRight: '20px' }}>
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', transform: 'scale(1.2)', transformOrigin: 'center center' }}>

      {/* Noventra watermark background */}
      <svg style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: '.04', pointerEvents: 'none', width: '70%', height: '70%'}} viewBox="0 0 1111 913" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(-2672 -682)">
          <path d="M2897 982.75 3056.75 823 3537 823 3537 1302.25 3377.25 1462 2897 1462ZM2897 982.75 3377.25 982.75 3537 823M3377.25 982.75 3377.25 1462" stroke="#ffffff" strokeWidth="27.5" strokeMiterlimit="8" fill="none"/>
          <path d="M2837 989.5C2837 949.459 2869.01 917 2908.5 917 2947.99 917 2980 949.459 2980 989.5 2980 1029.54 2947.99 1062 2908.5 1062 2869.01 1062 2837 1029.54 2837 989.5Z" fill="#ffffff"/>
          <path d="M2837 1462C2837 1422.24 2869.01 1390 2908.5 1390 2947.99 1390 2980 1422.24 2980 1462 2980 1501.76 2947.99 1534 2908.5 1534 2869.01 1534 2837 1501.76 2837 1462Z" fill="#ffffff"/>
          <path d="M3307 1462C3307 1422.24 3338.79 1390 3378 1390 3417.21 1390 3449 1422.24 3449 1462 3449 1501.76 3417.21 1534 3378 1534 3338.79 1534 3307 1501.76 3307 1462Z" fill="#ffffff"/>
          <path d="M3307 989.5C3307 949.459 3338.79 917 3378 917 3417.21 917 3449 949.459 3449 989.5 3449 1029.54 3417.21 1062 3378 1062 3307 1029.54 3307 989.5Z" fill="#ffffff"/>
          <path d="M2980 798C2980 758.235 3011.79 726 3051 726 3090.21 726 3122 758.235 3122 798 3122 837.765 3090.21 870 3051 870 3011.79 870 2980 837.765 2980 798Z" fill="#ffffff"/>
          <path d="M3450 798C3450 758.235 3481.79 726 3521 726 3560.21 726 3592 758.235 3592 798 3592 837.765 3560.21 870 3521 870 3481.79 870 3450 837.765 3450 798Z" fill="#ffffff"/>
          <path d="M3493 1288C3493 1248.24 3525.01 1216 3564.5 1216 3603.99 1216 3636 1248.24 3636 1288 3636 1327.76 3603.99 1360 3564.5 1360 3525.01 1360 3493 1327.76 3493 1288Z" fill="#ffffff"/>
          <path d="M2833.49 1581C2792.76 1581 2759.75 1547.98 2759.75 1507.25L2759.75 1212.25C2759.75 1171.52 2726.73 1138.5 2686 1138.5 2726.73 1138.5 2759.75 1105.48 2759.75 1064.75L2759.75 769.747C2759.75 729.018 2792.76 696 2833.49 696M3621.51 696C3662.24 696 3695.25 729.018 3695.25 769.747L3695.25 1064.75C3695.25 1105.48 3728.27 1138.5 3769 1138.5 3728.27 1138.5 3695.25 1171.52 3695.25 1212.25L3695.25 1507.25C3695.25 1547.98 3662.24 1581 3621.51 1581" stroke="#ffffff" strokeWidth="27.5" strokeMiterlimit="8" fill="none"/>
        </g>
      </svg>

      <svg width="100%" height="100%" viewBox="0 0 680 840" role="img" style={{maxHeight: '85vh', maxWidth: '100%', overflow: 'visible', filter: 'drop-shadow(0 0 30px rgba(0,0,0,0.4))'}} xmlns="http://www.w3.org/2000/svg">
<title>Noventra × Somnia isometric architecture diagram</title>
<desc>Three floating glassmorphic isometric platforms showing Somnia AI agent architecture built for Noventra.</desc>
<defs>
  <linearGradient id="pt1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3a3a45" stopOpacity=".14"/><stop offset="100%" stopColor="#15151a" stopOpacity=".04"/></linearGradient>
  <linearGradient id="pt2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2f2f38" stopOpacity=".11"/><stop offset="100%" stopColor="#101015" stopOpacity=".03"/></linearGradient>
  <linearGradient id="pt3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#252530" stopOpacity=".25"/><stop offset="100%" stopColor="#08080c" stopOpacity=".09"/></linearGradient>
  <linearGradient id="sl" x1="1" y1="0" x2="0" y2="0"><stop offset="0%" stopColor="#2a2a35" stopOpacity=".2"/><stop offset="100%" stopColor="#050508" stopOpacity=".42"/></linearGradient>
  <linearGradient id="sr" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#30303b" stopOpacity=".24"/><stop offset="100%" stopColor="#0a0a0f" stopOpacity=".48"/></linearGradient>
  <linearGradient id="sl3" x1="1" y1="0" x2="0" y2="0"><stop offset="0%" stopColor="#1f1f26" stopOpacity=".32"/><stop offset="100%" stopColor="#040406" stopOpacity=".55"/></linearGradient>
  <linearGradient id="sr3" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#26262e" stopOpacity=".36"/><stop offset="100%" stopColor="#07070a" stopOpacity=".6"/></linearGradient>
  <linearGradient id="ct" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffffff" stopOpacity=".24"/><stop offset="100%" stopColor="#888888" stopOpacity=".06"/></linearGradient>
  <linearGradient id="cl" x1="1" y1="0" x2="0" y2="0"><stop offset="0%" stopColor="#ffffff" stopOpacity=".07"/><stop offset="100%" stopColor="#000" stopOpacity=".32"/></linearGradient>
  <linearGradient id="cr" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ffffff" stopOpacity=".12"/><stop offset="100%" stopColor="#000" stopOpacity=".22"/></linearGradient>
  <linearGradient id="hexg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#cccccc" stopOpacity=".75"/><stop offset="100%" stopColor="#555555" stopOpacity=".15"/></linearGradient>
  <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#aaaaaa" stopOpacity=".55"/><stop offset="100%" stopColor="#555555" stopOpacity="0"/></linearGradient>
  <radialGradient id="fglow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#777777" stopOpacity=".4"/><stop offset="100%" stopColor="#777777" stopOpacity="0"/></radialGradient>
</defs>

{/* ══════ PLATFORM 1 — USER INTERFACE ══════ */}
<g className="plat1">
  <polygon points="116,148 116,180 340,250 340,218" fill="url(#sl)" stroke="rgba(255,255,255,0.28)" strokeWidth="0.6"/>
  <polygon points="564,148 564,180 340,250 340,218" fill="url(#sr)" stroke="rgba(255,255,255,0.32)" strokeWidth="0.6"/>
  <polygon points="340,78 564,148 340,218 116,148" fill="url(#pt1)" stroke="rgba(255,255,255,0.52)" strokeWidth="1.2"/>
  <line x1="340" y1="78" x2="564" y2="148" stroke="rgba(255,255,255,0.52)" strokeWidth="1.5"/>
  <line x1="228" y1="130" x2="452" y2="200" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"/>

  {/* User Intent cube */}
  <polygon points="340,92 386,110 340,128 294,110" fill="url(#ct)" stroke="rgba(255,255,255,0.68)" strokeWidth="1"/>
  <polygon points="294,110 294,140 340,158 340,128" fill="url(#cl)" stroke="rgba(233,233,233,0.3)" strokeWidth="0.6"/>
  <polygon points="386,110 386,140 340,158 340,128" fill="url(#cr)" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6"/>
  <line x1="340" y1="92" x2="386" y2="110" stroke="rgba(255,255,255,0.7)" strokeWidth="1"/>
  {/* chat icon */}
  <rect x="329" y="103" width="22" height="14" rx="3" fill="none" stroke="rgba(255,255,255,0.72)" strokeWidth="0.9"/>
  <circle cx="336" cy="110" r="1.4" fill="rgba(255,255,255,0.85)"/>
  <circle cx="340" cy="110" r="1.4" fill="rgba(255,255,255,0.85)"/>
  <circle cx="344" cy="110" r="1.4" fill="rgba(255,255,255,0.85)"/>

  <text style={{fontSize: '11px', fill: 'rgba(255,255,255,0.92)', fontFamily: 'sans-serif', fontWeight: '500'}} x="340" y="173" textAnchor="middle">User Intent</text>
  <text style={{fontSize: '9px', fill: 'rgba(254,254,254,0.7)', fontFamily: 'sans-serif'}} x="340" y="186" textAnchor="middle">Natural Language</text>

  <text style={{fontSize: '8.5px', fill: 'rgba(255,255,255,0.6)', fontFamily: 'sans-serif', letterSpacing: '.09em'}} x="107" y="142" textAnchor="end">USER INTERFACE</text>
  <text style={{fontSize: '8px', fill: 'rgba(180,180,180,0.48)', fontFamily: 'sans-serif'}} x="107" y="154" textAnchor="end">Intent Layer</text>
</g>

{/* connector 1→2 */}
<line x1="340" y1="250" x2="340" y2="292" stroke="rgba(255,255,255,0.7)" strokeWidth="1.3" className="fd"/>
<circle cx="340" cy="250" r="3.5" fill="rgba(255,255,255,0.92)" className="pd"/>
<circle cx="340" cy="292" r="3.5" fill="rgba(255,255,255,0.95)" className="pd" style={{animationDelay: '.5s'}}/>

{/* ══════ PLATFORM 2 — HIVE MIND ══════ */}
<g className="plat2">
  <polygon points="116,360 116,394 340,464 340,430" fill="url(#sl)" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6"/>
  <polygon points="564,360 564,394 340,464 340,430" fill="url(#sr)" stroke="rgba(255,255,255,0.28)" strokeWidth="0.6"/>
  <polygon points="340,292 564,360 340,430 116,360" fill="url(#pt2)" stroke="rgba(255,255,255,0.46)" strokeWidth="1.2"/>
  <line x1="340" y1="292" x2="564" y2="360" stroke="rgba(255,255,255,0.46)" strokeWidth="1.4"/>
  <line x1="228" y1="344" x2="452" y2="414" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>

  {/* COORDINATOR (center) */}
  <polygon points="340,306 378,322 340,338 302,322" fill="url(#ct)" stroke="rgba(255,255,255,0.72)" strokeWidth="1.1"/>
  <polygon points="302,322 302,350 340,366 340,338" fill="url(#cl)" stroke="rgba(255,255,255,0.28)" strokeWidth="0.6"/>
  <polygon points="378,322 378,350 340,366 340,338" fill="url(#cr)" stroke="rgba(255,255,255,0.33)" strokeWidth="0.6"/>
  <line x1="340" y1="306" x2="378" y2="322" stroke="rgba(255,255,255,0.65)" strokeWidth="0.9"/>
  <polygon points="340,314 347,318 347,326 340,330 333,326 333,318" fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth="1"/>
  <text style={{fontSize: '8.5px', fill: 'rgba(255,255,255,0.85)', fontFamily: 'sans-serif', fontWeight: '500'}} x="340" y="380" textAnchor="middle">Coordinator Agent</text>

  {/* SCOUT (left-top) purple */}
  <polygon points="215,322 253,338 215,354 177,338" fill="url(#ct)" stroke="rgba(255,255,255,0.72)" strokeWidth="1"/>
  <polygon points="177,338 177,366 215,382 215,354" fill="url(#cl)" stroke="rgba(255,255,255,0.27)" strokeWidth="0.6"/>
  <polygon points="253,338 253,366 215,382 215,354" fill="url(#cr)" stroke="rgba(255,255,255,0.32)" strokeWidth="0.6"/>
  <line x1="215" y1="322" x2="253" y2="338" stroke="rgba(255,255,255,0.65)" strokeWidth="0.9"/>
  <circle cx="213" cy="337" r="5.5" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1"/>
  <line x1="217" y1="341" x2="221" y2="345" stroke="rgba(255,255,255,0.75)" strokeWidth="1.1"/>
  <text style={{fontSize: '8.5px', fill: 'rgba(255,255,255,0.88)', fontFamily: 'sans-serif', fontWeight: '500'}} x="215" y="396" textAnchor="middle">Scout Agent</text>

  {/* STRATEGY (right-top) cyan */}
  <polygon points="465,322 503,338 465,354 427,338" fill="url(#ct)" stroke="rgba(52,243,255,0.68)" strokeWidth="1"/>
  <polygon points="427,338 427,366 465,382 465,354" fill="url(#cl)" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6"/>
  <polygon points="503,338 503,366 465,382 465,354" fill="url(#cr)" stroke="rgba(0,238,253,0.3)" strokeWidth="0.6"/>
  <line x1="465" y1="322" x2="503" y2="338" stroke="rgba(134,247,255,0.6)" strokeWidth="0.9"/>
  <ellipse cx="465" cy="336" rx="6" ry="5" fill="none" stroke="rgba(52,243,255,0.78)" strokeWidth="1"/>
  <line x1="465" y1="331" x2="465" y2="341" stroke="rgba(52,243,255,0.5)" strokeWidth="0.8"/>
  <text style={{fontSize: '8.5px', fill: 'rgba(52,243,255,0.88)', fontFamily: 'sans-serif', fontWeight: '500'}} x="465" y="396" textAnchor="middle">Strategy Agent</text>

  {/* RISK (left-bottom) green */}
  <polygon points="215,384 253,400 215,416 177,400" fill="url(#ct)" stroke="rgba(72,255,37,0.68)" strokeWidth="1"/>
  <polygon points="177,400 177,428 215,444 215,416" fill="url(#cl)" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6"/>
  <polygon points="253,400 253,428 215,444 215,416" fill="url(#cr)" stroke="rgba(35,226,0,0.3)" strokeWidth="0.6"/>
  <line x1="215" y1="384" x2="253" y2="400" stroke="rgba(255,255,255,0.55)" strokeWidth="0.9"/>
  <polygon points="215,392 222,395 222,404 215,408 208,404 208,395" fill="none" stroke="rgba(72,255,37,0.78)" strokeWidth="1"/>
  <polyline points="211,401 214,405 219,398" fill="none" stroke="rgba(72,255,37,0.82)" strokeWidth="1.1"/>
  <text style={{fontSize: '8.5px', fill: 'rgba(72,255,37,0.88)', fontFamily: 'sans-serif', fontWeight: '500'}} x="215" y="458" textAnchor="middle">Risk Agent</text>

  {/* EXECUTION (right-bottom) orange */}
  <polygon points="465,384 503,400 465,416 427,400" fill="url(#ct)" stroke="rgba(255,169,42,0.68)" strokeWidth="1"/>
  <polygon points="427,400 427,428 465,444 465,416" fill="url(#cl)" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6"/>
  <polygon points="503,400 503,428 465,444 465,416" fill="url(#cr)" stroke="rgba(230,138,0,0.3)" strokeWidth="0.6"/>
  <line x1="465" y1="384" x2="503" y2="400" stroke="rgba(255,255,255,0.55)" strokeWidth="0.9"/>
  <polyline points="467,392 462,401 467,401 462,410" fill="none" stroke="rgba(255,169,42,0.88)" strokeWidth="1.2"/>
  <text style={{fontSize: '8.5px', fill: 'rgba(255,169,42,0.88)', fontFamily: 'sans-serif', fontWeight: '500'}} x="465" y="458" textAnchor="middle">Execution Agent</text>

  {/* wires coordinator→agents */}
  <line x1="302" y1="324" x2="255" y2="340" stroke="rgba(255,255,255,0.48)" strokeWidth="0.9"/>
  <line x1="378" y1="324" x2="425" y2="340" stroke="rgba(255,255,255,0.48)" strokeWidth="0.9"/>
  <line x1="302" y1="340" x2="255" y2="400" stroke="rgba(255,255,255,0.48)" strokeWidth="0.9"/>
  <line x1="378" y1="340" x2="425" y2="400" stroke="rgba(255,255,255,0.48)" strokeWidth="0.9"/>
  <circle cx="278" cy="332" r="2.2" fill="rgba(255,255,255,0.82)" className="pd"/>
  <circle cx="402" cy="332" r="2.2" fill="rgba(52,243,255,0.82)" className="pd" style={{animationDelay: '.25s'}}/>
  <circle cx="278" cy="370" r="2.2" fill="rgba(72,255,37,0.82)" className="pd" style={{animationDelay: '.5s'}}/>
  <circle cx="402" cy="370" r="2.2" fill="rgba(255,169,42,0.82)" className="pd" style={{animationDelay: '.75s'}}/>

  <text style={{fontSize: '8.5px', fill: 'rgba(255,255,255,0.62)', fontFamily: 'sans-serif', letterSpacing: '.09em'}} x="107" y="354" textAnchor="end">THE HIVE MIND</text>
  <text style={{fontSize: '8px', fill: 'rgba(170,170,170,0.48)', fontFamily: 'sans-serif'}} x="107" y="366" textAnchor="end">Agent Swarm</text>
  <polygon points="98,360 106,356 106,364" fill="rgba(239,239,239,0.55)"/>
</g>

{/* connector 2→3 */}
<line x1="340" y1="464" x2="340" y2="510" stroke="rgba(239,239,239,0.78)" strokeWidth="1.4" className="fd"/>
<circle cx="340" cy="464" r="3.5" fill="rgba(255,255,255,0.92)" className="pd" style={{animationDelay: '.3s'}}/>
<circle cx="340" cy="510" r="3.5" fill="rgba(219,219,219,0.96)" className="pd" style={{animationDelay: '.7s'}}/>
<path d="M215,444 Q215,495 298,514" fill="none" stroke="rgba(72,255,37,0.36)" strokeWidth="1" className="fd"/>
<path d="M465,444 Q465,495 382,514" fill="none" stroke="rgba(255,169,42,0.4)" strokeWidth="1.1" className="fd"/>
<circle cx="382" cy="514" r="2.5" fill="rgba(255,169,42,0.82)" className="pd" style={{animationDelay: '.45s'}}/>

{/* ══════ PLATFORM 3 — SOMNIA BLOCKCHAIN ══════ */}
<g className="plat3">
  <ellipse cx="340" cy="710" rx="228" ry="52" fill="url(#fglow)"/>
  <polygon points="116,580 116,622 340,692 340,650" fill="url(#sl3)" stroke="rgba(255,255,255,0.28)" strokeWidth="0.6"/>
  <polygon points="564,580 564,622 340,692 340,650" fill="url(#sr3)" stroke="rgba(255,255,255,0.32)" strokeWidth="0.6"/>
  <polygon points="340,510 564,580 340,650 116,580" fill="url(#pt3)" stroke="rgba(255,255,255,0.56)" strokeWidth="1.3"/>
  <line x1="340" y1="510" x2="564" y2="580" stroke="rgba(255,255,255,0.58)" strokeWidth="1.6"/>
  <line x1="116" y1="622" x2="340" y2="692" stroke="rgba(255,255,255,0.22)" strokeWidth="0.6"/>
  <line x1="564" y1="622" x2="340" y2="692" stroke="rgba(177,177,177,0.2)" strokeWidth="0.6"/>

  {/* grid dots */}
  <circle cx="238" cy="558" r="1.5" fill="rgba(222,222,222,0.44)"/>
  <circle cx="288" cy="538" r="1.5" fill="rgba(222,222,222,0.38)"/>
  <circle cx="392" cy="538" r="1.5" fill="rgba(222,222,222,0.38)"/>
  <circle cx="442" cy="558" r="1.5" fill="rgba(222,222,222,0.44)"/>
  <circle cx="198" cy="576" r="1.2" fill="rgba(170,170,170,0.34)"/>
  <circle cx="482" cy="576" r="1.2" fill="rgba(170,170,170,0.34)"/>
  <circle cx="268" cy="590" r="1.1" fill="rgba(158,158,158,0.28)"/>
  <circle cx="412" cy="590" r="1.1" fill="rgba(158,158,158,0.28)"/>

  {/* beam */}
  <polygon points="328,570 352,570 368,655 312,655" fill="url(#beam)" opacity=".38"/>

  {/* hex glow */}
  <polygon points="340,526 364,539 364,565 340,578 316,565 316,539" fill="rgba(129,129,129,0.58)" stroke="rgba(255,255,255,0.78)" strokeWidth="1.4" className="hg"/>
  <polygon points="340,534 360,545 360,561 340,572 320,561 320,545" fill="rgba(156,156,156,0.35)" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8"/>
  <circle cx="340" cy="553" r="8" fill="rgba(255,255,255,0.42)" className="hg"/>
  <circle cx="340" cy="553" r="3.8" fill="rgba(255,255,255,0.92)" className="pd"/>

  {/* Somnia {"{s}"} logo */}
  <text style={{fontSize: '28px', fill: 'rgba(255,255,255,0.18)', fontFamily: 'sans-serif', fontWeight: '700', letterSpacing: '-.02em'}} x="340" y="630" textAnchor="middle">{"{s}"}</text>
  <text style={{fontSize: '11px', fill: 'rgba(255,255,255,0.78)', fontFamily: 'sans-serif', fontWeight: '600', letterSpacing: '.16em'}} x="340" y="648" textAnchor="middle">SOMNIA</text>

  <text style={{fontSize: '8.5px', fill: 'rgba(233,233,233,0.62)', fontFamily: 'sans-serif', letterSpacing: '.09em'}} x="107" y="574" textAnchor="end">SOMNIA NETWORK</text>
  <text style={{fontSize: '8px', fill: 'rgba(150,150,150,0.48)', fontFamily: 'sans-serif'}} x="107" y="586" textAnchor="end">Blockchain Layer</text>
  <polygon points="98,580 106,576 106,584" fill="rgba(197,197,197,0.55)"/>
</g>

{/* ══════ RECEIPT BOX ══════ */}
<rect x="52" y="668" width="192" height="66" rx="12" fill="rgba(30,30,30,0.58)" stroke="rgba(255,255,255,0.46)" strokeWidth="1"/>
<line x1="66" y1="668" x2="232" y2="668" stroke="rgba(255,255,255,0.28)" strokeWidth="0.6"/>
<rect x="68" y="682" width="17" height="24" rx="2" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.9"/>
<line x1="71" y1="689" x2="82" y2="689" stroke="rgba(255,255,255,0.5)" strokeWidth="0.7"/>
<line x1="71" y1="694" x2="82" y2="694" stroke="rgba(255,255,255,0.5)" strokeWidth="0.7"/>
<line x1="71" y1="699" x2="78" y2="699" stroke="rgba(255,255,255,0.5)" strokeWidth="0.7"/>
<circle cx="83" cy="701" r="4.5" fill="none" stroke="rgba(64,255,29,0.72)" strokeWidth="0.9"/>
<polyline points="80,701 82,703.5 86.5,698" fill="none" stroke="rgba(64,255,29,0.78)" strokeWidth="1"/>
<text style={{fontSize: '10.5px', fill: 'rgba(255,255,255,0.88)', fontFamily: 'sans-serif', fontWeight: '500'}} x="175" y="688" textAnchor="middle">On-Chain Receipt</text>
<text style={{fontSize: '9px', fill: 'rgba(212,212,212,0.66)', fontFamily: 'sans-serif'}} x="175" y="706" textAnchor="middle">Verifiable &amp; Immutable</text>
<path d="M228,650 Q220,659 218,668" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.9" strokeDasharray="3 3"/>

{/* Noventra logo badge top-right */}
<g opacity=".82">
  <rect x="490" y="28" width="172" height="44" rx="10" fill="rgba(20,20,20,0.75)" stroke="rgba(255,255,255,0.35)" strokeWidth="0.7"/>
  <svg x="498" y="34" width="32" height="32" viewBox="0 0 1111 913">
    <g transform="translate(-2672 -682)">
      <path d="M2897 982.75 3056.75 823 3537 823 3537 1302.25 3377.25 1462 2897 1462ZM2897 982.75 3377.25 982.75 3537 823M3377.25 982.75 3377.25 1462" stroke="#dddddd" strokeWidth="40" strokeMiterlimit="8" fill="none"/>
      <circle cx="2908.5" cy="989.5" r="72.5" fill="#dddddd"/>
      <circle cx="2908.5" cy="1462" r="72.5" fill="#dddddd"/>
      <circle cx="3378" cy="1462" r="72.5" fill="#dddddd"/>
      <circle cx="3378" cy="989.5" r="72.5" fill="#dddddd"/>
      <circle cx="3051" cy="798" r="72.5" fill="#dddddd"/>
      <circle cx="3521" cy="798" r="72.5" fill="#dddddd"/>
      <circle cx="3564.5" cy="1288" r="72.5" fill="#dddddd"/>
      <path d="M2833.49 1581C2792.76 1581 2759.75 1547.98 2759.75 1507.25L2759.75 1212.25C2759.75 1171.52 2726.73 1138.5 2686 1138.5 2726.73 1138.5 2759.75 1105.48 2759.75 1064.75L2759.75 769.747C2759.75 729.018 2792.76 696 2833.49 696M3621.51 696C3662.24 696 3695.25 729.018 3695.25 769.747L3695.25 1064.75C3695.25 1105.48 3728.27 1138.5 3769 1138.5 3728.27 1138.5 3695.25 1171.52 3695.25 1212.25L3695.25 1507.25C3695.25 1547.98 3662.24 1581 3621.51 1581" stroke="#dddddd" strokeWidth="40" strokeMiterlimit="8" fill="none"/>
    </g>
  </svg>
  <text style={{fontSize: '11px', fill: 'rgba(255,255,255,0.88)', fontFamily: 'sans-serif', fontWeight: '600', letterSpacing: '.1em'}} x="540" y="47" dominantBaseline="middle">NOVENTRA</text>
  <text style={{fontSize: '8px', fill: 'rgba(255,255,255,0.6)', fontFamily: 'sans-serif', letterSpacing: '.05em'}} x="540" y="62" dominantBaseline="middle">× Somnia Network</text>
</g>


</svg>
    </div>
  </div>

  <div style={{ flex: '0 0 350px', display: 'flex', flexDirection: 'column', gap: '28px', padding: '0 20px' }}>
    <h3 style={{ fontFamily: '"Array", sans-serif', fontSize: '1.1rem', color: 'var(--text-muted)', letterSpacing: '4px', marginBottom: '8px' }}>FLOW</h3>
    
    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', boxShadow: '0 0 12px rgba(255,255,255,0.4)', animation: 'pulse 2.4s ease-in-out infinite' }}></div>
      <span style={{ fontSize: '1.4rem', color: 'rgba(255,255,255,0.85)' }}>Intent Submitted</span>
    </div>
    
    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.92)', boxShadow: '0 0 12px rgba(255,255,255,0.4)', animation: 'pulse 2.4s ease-in-out infinite', animationDelay: '0.2s' }}></div>
      <span style={{ fontSize: '1.4rem', color: 'rgba(255,255,255,0.85)' }}>Agents Orchestrate</span>
    </div>
    
    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(52,243,255,0.92)', boxShadow: '0 0 12px rgba(52,243,255,0.4)', animation: 'pulse 2.4s ease-in-out infinite', animationDelay: '0.4s' }}></div>
      <span style={{ fontSize: '1.4rem', color: 'rgba(255,255,255,0.85)' }}>Strategy Validated</span>
    </div>
    
    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(72,255,37,0.92)', boxShadow: '0 0 12px rgba(72,255,37,0.4)', animation: 'pulse 2.4s ease-in-out infinite', animationDelay: '0.6s' }}></div>
      <span style={{ fontSize: '1.4rem', color: 'rgba(255,255,255,0.85)' }}>Risk Checked</span>
    </div>
    
    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255,169,42,0.92)', boxShadow: '0 0 12px rgba(255,169,42,0.4)', animation: 'pulse 2.4s ease-in-out infinite', animationDelay: '0.8s' }}></div>
      <span style={{ fontSize: '1.4rem', color: 'rgba(255,255,255,0.85)' }}>Transaction Executed</span>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.92)', boxShadow: '0 0 12px rgba(255,255,255,0.4)', animation: 'pulse 2.4s ease-in-out infinite', animationDelay: '1s' }}></div>
      <span style={{ fontSize: '1.4rem', color: 'rgba(255,255,255,0.85)' }}>On-Chain Receipt Returned</span>
    </div>
  </div>

</div>
    </>
  );
}
