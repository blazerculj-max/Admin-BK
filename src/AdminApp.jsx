import { useState, useEffect, useCallback } from 'react'

const CLR={B:'#4a7ab5',R:'#c94030',G:'#2e8a55',Y:'#c49a10'}
const CLR_L={B:'#e8f0fa',R:'#faeaea',G:'#e6f5ee',Y:'#fdf6e3'}
const CLR_D={B:'#1a4a7a',R:'#a8291a',G:'#1a5c38',Y:'#8a6200'}

const SMAP={L:0,'1':1,'2':2,'3':3,'4':4,'5':5,M:6}
const N=15

const TYPES={
  Observer:{sl:'Opazovalec',num:'34',lead:'B',desc:'Natančen, sistematičen in intelektualno radoveden.'},
  Reformer:{sl:'Reformator',num:'22',lead:'B',desc:'Združuje analitično natančnost z odločnostjo.'},
  Director:{sl:'Direktor',num:'4',lead:'R',desc:'Odločen, neposreden, rezultatsko usmerjen.'},
  Motivator:{sl:'Motivator',num:'23',lead:'R',desc:'Združuje energičnost z optimizmom in karizmo.'},
  Inspirer:{sl:'Inspirator',num:'45',lead:'Y',desc:'Optimističen, komunikativen, ustvarjalen.'},
  Helper:{sl:'Pomočnik',num:'52',lead:'Y',desc:'Združuje odprtost z empatijo.'},
  Supporter:{sl:'Podpornik',num:'108',lead:'G',desc:'Empatičen, stabilen, zanesljiv.'},
  Coordinator:{sl:'Koordinator',num:'34',lead:'G',desc:'Združuje empatijo s sistematičnostjo.'},
}

const CD={
  B:{name:'Analitična modra',opposite:'Y'},R:{name:'Aktivna rdeča',opposite:'G'},
  G:{name:'Stabilna zelena',opposite:'R'},Y:{name:'Navdušena rumena',opposite:'B'},
}

const SECTIONS=[
  {id:'stil',label:'Osebni stil',group:'Profil'},
  {id:'inter',label:'Interakcija z drugimi',group:'Profil'},
  {id:'odl',label:'Sprejemanje odločitev',group:'Profil'},
  {id:'pritisk',label:'Vedenje pod pritiskom',group:'Profil'},
  {id:'pred',label:'Ključne prednosti',group:'Profil'},
  {id:'slab',label:'Možne slabosti',group:'Profil'},
  {id:'slepe',label:'Slepe pege',group:'Profil'},
  {id:'tim',label:'Prispevek k timu',group:'Tim'},
  {id:'okol',label:'Idealno delovno okolje',group:'Tim'},
  {id:'motiv',label:'Motivacija in strahovi',group:'Tim'},
  {id:'kom',label:'Komunikacijski nasveti',group:'Tim'},
  {id:'razv',label:'Predlogi za razvoj',group:'Razvoj'},
  {id:'naspr',label:'Nasprotni tip',group:'Razvoj'},
  {id:'vodenje',label:'Kako voditi',group:'Vodenje'},
  {id:'motivacija',label:'Kako motivirati',group:'Vodenje'},
  {id:'intervju',label:'Intervju vprašanja',group:'Vodenje'},
  {id:'digital',label:'Digitalna komunikacija',group:'Vodenje'},
  {id:'stres',label:'Stres in opozorilni znaki',group:'Stres & Regeneracija'},
  {id:'regen',label:'Regeneracija in ravnovesje',group:'Stres & Regeneracija'},
  {id:'prod_uvod',label:'Prodajni slog (uvod)',group:'Prodaja'},
  {id:'prod_mocne',label:'Močne točke v prodaji',group:'Prodaja'},
  {id:'prod_slepe',label:'Slepe pege v prodaji',group:'Prodaja'},
  {id:'prod_tip',label:'Prilagoditev tipu stranke',group:'Prodaja'},
  {id:'prod_akcija',label:'Top 5 akcijskih korakov',group:'Prodaja'},
  // ── SPORTNE SEKCIJE ──
  {id:'sport_trening',label:'Stil treninga',group:'Šport'},
  {id:'sport_mentalna',label:'Mentalna pripravljenost',group:'Šport'},
  {id:'sport_motivacija',label:'Motivacija in pritisk',group:'Šport'},
  {id:'sport_vloga',label:'Vloga v ekipi',group:'Šport'},
  {id:'sport_slacilnica',label:'Slačilnica',group:'Šport'},
  {id:'sport_trener',label:'Komunikacija s trenerjem',group:'Šport'},
  {id:'sport_razvoj',label:'Razvoj in izzivi',group:'Šport'},
  {id:'sport_soigralci',label:'Soigralci in dinamika',group:'Šport'},
  {id:'sport_stres',label:'Stres in opozorilni znaki',group:'Šport'},
  {id:'sport_regen',label:'Regeneracija in ravnovesje',group:'Šport'},
]

const SPORT_SYS=`Si ekspert za športno psihologijo in Barvni kompas osebnostne profile. Pišeš poročila za trenerje in športnike v slovenščini.

STIL: Tretja oseba, sproščeno a strokovno. Direktno, brez akademskega žargona. Kot izkušen športni psiholog ki govori trenerju.

SLOVNICA IN SPOL:
- Moški: zaimki ga/mu/on/njegov, pridevniki: analitičen, odločen
- Ženski: zaimki jo/ji/ona/njen, pridevniki: analitična, odločna
- Glagoli VEDNO ustrezajo spolu. NE krajšaj imen.

FORMATIRANJE: Odstavki brez alinej. Seznami = **Naslov** - En stavek.
PRAVILA: Ne začni z naslovom. Ne omenjaj barv. Ne piši generično — vsak stavek mora biti specifičen za ta profil.
ŠPORT: Upoštevaj pozicijo/vlogo če je navedena. Primeri morajo biti iz športnega okolja (trening, tekma, slačilnica, pritisk rezultatov).`

const SYS=`Si izkušen organizacijski psiholog, ki piše osebnostna poročila za Barvni kompas v slovenščini. Profesionalno a toplo, kot dober coach in ne kot učbenik.

STIL: Tretja oseba, opisno, konkretno. NE superlativi.

SLOVNICA IN SPOL:
- Moški: zaimki ga/mu/on/njegov, pridevniki: analitičen, odločen. Rodilnik: Janez→Janeza
- Ženski: zaimki jo/ji/ona/njen, pridevniki: analitična, odločna. Rodilnik: Jana→Jane
- Glagoli in pridevniki VEDNO ustrezajo spolu. NE krajšaj imen.
- NE izmišljaj % ali konkretnih številk — piši opisno.

SHOW, DON'T TELL: opisuj oprijemljiva vedenja in situacije, ne abstraktnih lastnosti. Namesto "je analitičen" raje "pred odločitvijo zahteva pisne podatke in dela seznam pro/contra".

RAZNOLIKOST: vsak odstavek in vsak stavek se začne drugače. Variiraj stavčne strukture. NE začenjaj stavkov z imenom osebe. NE uporabljaj konstrukcije "najprej... nato pa...". Ne uporabljaj fiksnih uvodnih fraz — vsaka sekcija naj se začne na svoj naraven način, izhajajoč iz vsebine.

PREPOVEDANE PRAZNE FRAZE (povedo nič — zamenjaj s konkretnim vedenjem): "v svojem delovnem okolju", "v svojem delovnem pristopu", "dinamično vzdušje", "pozitivna energija", "strukturiran pristop", "ustvarja zaupanje", "kombinacija ... in ...".

FORMATIRANJE: Odstavki brez alinej. Seznami = **Naslov** - En stavek.
PRAVILA: Ne začni z naslovom. Ne omenjaj barv. Blue=analitičen, Red=odločen, Green=empatičen, Yellow=optimističen.`


function calcScores(answers, manualCon, manualUncon) {
  if(!answers || manualCon) return {con:manualCon||{B:0,G:0,Y:0,R:0}, uncon:manualUncon||{B:0,G:0,Y:0,R:0}}
  const raw={B:0,R:0,G:0,Y:0}
  answers.forEach(a=>['B','R','G','Y'].forEach(k=>{raw[k]+=SMAP[a[k]]||0}))
  const con={}
  ;['B','R','G','Y'].forEach(k=>{con[k]=parseFloat((raw[k]/N).toFixed(2))})
  const uncon={R:parseFloat((6-con.G).toFixed(2)),G:parseFloat((6-con.R).toFixed(2)),B:parseFloat((6-con.Y).toFixed(2)),Y:parseFloat((6-con.B).toFixed(2))}
  return {con,uncon}
}

function getType(con) {
  const s=[{k:'B',v:con.B},{k:'R',v:con.R},{k:'G',v:con.G},{k:'Y',v:con.Y}].sort((a,b)=>b.v-a.v)
  const t1=s[0].k,t2=s[1].k,diff=s[0].v-s[1].v
  if(diff>1.5) return {B:'Observer',R:'Director',G:'Supporter',Y:'Inspirer'}[t1]
  const c=t1+t2
  if(c==='BR'||c==='RB') return 'Reformer'
  if(c==='RY'||c==='YR') return 'Motivator'
  if(c==='YG'||c==='GY') return 'Helper'
  if(c==='GB'||c==='BG') return 'Coordinator'
  return {B:'Observer',R:'Director',G:'Supporter',Y:'Inspirer'}[t1]
}

function getVariant(con) {
  // Štej koliko barv je nad 3.0 na zavedni personi
  const above3 = ['B','R','G','Y'].filter(k => con[k] > 3.0).length
  if(above3 >= 3) return 'Prilagodljiv tip'
  if(above3 === 2) return 'Klasičen tip'
  return 'Osredotočen tip'
}

function calcFlow(con,uncon) {
  const flow={}
  ;['B','R','G','Y'].forEach(k=>{flow[k]=parseFloat((con[k]-uncon[k]).toFixed(2))})
  const total=Math.round((['B','R','G','Y'].reduce((s,k)=>s+Math.abs(flow[k]),0)/4)/6*100)
  return {flow,total}
}

// Odstrani morebitni naslov sekcije na začetku teksta
function fixModelErrors(txt) {
  if(!txt) return txt
  return txt
    .replace(/а/g, "a").replace(/е/g, "e").replace(/о/g, "o")
    .replace(/р/g, "p").replace(/с/g, "c").replace(/у/g, "u")
    .replace(/ш/g, "š").replace(/Ш/g, "Š")
    .replace(/v željgi/g, "v želji")
    .replace(/napredovaniu/g, "napredovanju")
    .replace(/spregledå/g, "spregleda")
    .replace(/energia/g, "energija")
    .replace(/Energia/g, "Energija")
    .replace(/analytičnimi/g, "analitičnimi")
    .replace(/analytičen/g, "analitičen")
    .replace(/colaboradores/g, "sodelavcev")
    .replace(/Nenašunost/g, "Neučinkovitost")
    .replace(/Perfekcionizam/g, "Perfekcionizem")
    .replace(/Cenni/g, "Ceni")
    .replace(/  +/g, " ")
    .trim()
}

function stripSectionTitle(txt) {
  if(!txt) return txt
  const lines = txt.split('\n')
  const first = lines[0].trim()
  // Če prva vrstica je v bold (**Naslov**) ali kratka (do 40 znakov) brez pike = verjetno naslov
  if(first.match(/^\*\*[^*]+\*\*:?\s*$/) || (first.length < 50 && !first.includes('.') && first.match(/^[A-ZŠĐČŽĆŠĐ]/))) {
    return lines.slice(1).join('\n').trim()
  }
  return txt
}

async function serverHasKey() {
  try {
    const res = await fetch('/api/has-key')
    const data = await res.json()
    return data.hasKey
  } catch { return false }
}

function parseBoldList(txt) {
  if(!txt) return []
  const items=[]
  for(const line of txt.split('\n').filter(l=>l.trim())) {
    const t=line.replace(/^[•\-\*\d\.]+\s*/,'').trim()
    if(!t) continue
    const m1=t.match(/^\*\*(.+?)\*\*\s*[-–:]?\s*(.*)$/)
    if(m1){items.push({title:m1[1].trim(),desc:m1[2].trim()});continue}
    const m2=t.match(/^(.+?)\*\*\s*[-–:]?\s*(.*)$/)
    if(m2){items.push({title:m2[1].trim(),desc:m2[2].trim()});continue}
    const m3=t.match(/^(.+?)\s+[-–]\s+(.+)$/)
    if(m3&&m3[1].length<60){items.push({title:m3[1].trim(),desc:m3[2].trim()});continue}
    items.push({title:'',desc:t})
  }
  return items.filter(i=>i.title||i.desc)
}


// ── ADMIN TOOLS ───────────────────────────────────────────────────────────────
const DEFAULT_QUESTIONS=[{B:'Sem natancen in metodicen',R:'Sem odlocen in usmerjen v rezultate',G:'Sem empaticen in skrbim za odnose',Y:'Sem entuziasten in optimisticen'},{B:'Raje analiziram preden ukrepam',R:'Hitro ukrepam in sprejemam odlocitve',G:'Poslusam in razumem druge',Y:'Iscem nove ideje in moznosti'},{B:'Cenim kakovost in natancnost',R:'Cenim ucinkovitost in hitrost',G:'Cenim harmonijo in sodelovanje',Y:'Cenim ustvarjalnost in inovacije'},{B:'V konfliktih ostanem miren in analiticen',R:'V konfliktih sem direkten in odlocen',G:'V konfliktih iscem kompromis',Y:'V konfliktih poskusam razbremeniti napetost'},{B:'Nacrtujemskrbno vnaprej',R:'Osredotocam se na cilje',G:'Gradim zaupanje postopoma',Y:'Sledim navdihu in spontanosti'},{B:'Prednost dajem faktom in podatkom',R:'Prednost dajem rezultatom',G:'Prednost dajem ljudem',Y:'Prednost dajem viziji'},{B:'Sem sistematicen in organiziran',R:'Sem ambiciozen in pogumen',G:'Sem zvest in zanesljiv',Y:'Sem komunikativen in navdusujoc'},{B:'Raje delam samostojno in poglobljeno',R:'Raje vodim in usmerjam',G:'Raje sodelujem in podpiram',Y:'Raje navdusujemo in motiviram'},{B:'Cenim strukturo in red',R:'Cenim nadzor in moc',G:'Cenim mir in stabilnost',Y:'Cenim zabavo in raznolikost'},{B:'Pod pritiskom postanem previdnejsi',R:'Pod pritiskom sem bolj direkten',G:'Pod pritiskom se umaknem',Y:'Pod pritiskom dramatiziram'},{B:'Odlocitve sprejemam na podlagi analize',R:'Odlocitve sprejemam hitro in intuitivno',G:'Odlocitve sprejemam po posvetovanju',Y:'Odlocitve sprejemam na podlagi navdusenja'},{B:'Moja moc je v natancnosti',R:'Moja moc je v odlocnosti',G:'Moja moc je v empatiji',Y:'Moja moc je v navdusevanju'},{B:'Cenim mir in tisino pri delu',R:'Cenim izzive in tekmovalnost',G:'Cenim toplino in sprejetost',Y:'Cenim dinamicno okolje'},{B:'Sem introvertirane narave',R:'Sem ekstrovertirane narave z mocno voljo',G:'Sem introvertirane narave s toplim srcem',Y:'Sem ekstrovertirane narave s pozitivno energijo'},{B:'Iscem globino in razumevanje',R:'Iscem rezultate in dosezke',G:'Iscem harmonijo in smisel',Y:'Iscem navdih in moznosti'}]
function loadQuestions(){try{const q=localStorage.getItem('insights_questions');return q?JSON.parse(q):DEFAULT_QUESTIONS}catch{return DEFAULT_QUESTIONS}}
function saveQuestions(q){localStorage.setItem('insights_questions',JSON.stringify(q))}
function loadPrompts(){try{const p=localStorage.getItem('insights_prompts');return p?JSON.parse(p):null}catch{return null}}
function savePrompts(p){localStorage.setItem('insights_prompts',JSON.stringify(p))}
function ToolsView({onBack}){
  const [tab,setTab]=useState('questions')
  const [questions,setQuestions]=useState(loadQuestions)
  const [savedQ,setSavedQ]=useState(false)
  const CH={B:'#4a7ab5',R:'#c94030',G:'#2e8a55',Y:'#c49a10'}
  const CL={B:'#e8f0fa',R:'#faeaea',G:'#e6f5ee',Y:'#fdf6e3'}
  const defSys='Si ekspert za Barvni kompas osebnostne profile. Pises uradna porocila v slovenscini.\n\nSTIL: Tretja oseba, opisno, konkretno. NE superlativi.\nFORMATIRANJE: Odstavki brez alinej. Seznami = **Naslov** - En stavek.\nPRAVILA: Ne zacni z naslovom. Ne omenjaj barv.'
  const defP={stil:'Napisi odstavek Osebni stil. 6-7 povedi, tretja oseba.',inter:'Napisi odstavek Interakcija z drugimi. 6-7 povedi.',odl:'Napisi odstavek Sprejemanje odlocitev. 6-7 povedi.',pritisk:'Napisi odstavek Vedenje pod pritiskom. 6-7 povedi.',pred:'Seznam 8 prednosti. Format: **Naslov** - En stavek.',slab:'Seznam 8 slabosti. Format: **Naslov** - En stavek.',slepe:'Odstavek Slepe pege. 6-7 povedi.',tim:'Odstavek Prispevek k timu. 6-7 povedi.',okol:'Odstavek Idealno delovno okolje. 6-7 povedi.',motiv:'Odstavek Motivacija in strahovi. 6-7 povedi.',kom:'Seznam 6 komunikacijskih nasvetov. Format: **Naslov** - En stavek.',razv:'Odstavek Predlogi za razvoj. 6-7 povedi. Navedi konkretne vaje, merljive znake napredka in 2 priporočeni knjigi/podcast.',naspr:'Odstavek Nasprotni tip. 6-7 povedi. Poimenuj nasprotni tip direktno. Navedi 2-3 konkretne strategije.',prod_uvod:'Napisi odstavek Prodajni slog. 5-6 povedi.',prod_mocne:'Seznam 7 prodajnih prednosti. Format: **Naslov** - En stavek.',prod_slepe:'Seznam 5 prodajnih slepih peg. Format: **Naslov** - En stavek.',prod_tip:'Nasveti za prilagoditev prodajnega pristopa. Format: **Prodaja modri stranki** - nasveti. **Prodaja rdeci stranki** - nasveti. **Prodaja zeleni stranki** - nasveti. **Prodaja rumeni stranki** - nasveti.'}
  const sp=loadPrompts()
  const [sys,setSys]=useState(sp?.sys||defSys)
  const [pr,setPr]=useState(sp?.prompts||defP)
  const [savedP,setSavedP]=useState(false)
  const sl={stil:'Osebni stil',inter:'Interakcija z drugimi',odl:'Sprejemanje odlocitev',pritisk:'Vedenje pod pritiskom',pred:'Kljucne prednosti',slab:'Mozne slabosti',slepe:'Slepe pege',tim:'Prispevek k timu',okol:'Idealno delovno okolje',motiv:'Motivacija in strahovi',kom:'Komunikacijski nasveti',razv:'Predlogi za razvoj',naspr:'Nasprotni tip',prod_uvod:'Prodajni slog',prod_mocne:'Mocne tocke v prodaji',prod_slepe:'Slepe pege v prodaji',prod_tip:'Prilagoditev tipu stranke',prod_akcija:'Top 5 akcijskih korakov',vodenje:'Kako voditi',motivacija:'Kako motivirati',intervju:'Intervju vprašanja'}
  return(<div style={{fontFamily:'system-ui,sans-serif',maxWidth:900,margin:'0 auto',padding:'0 20px 60px',background:'#f7f5f1',minHeight:'100vh'}}>
    <div style={{background:'white',borderBottom:'1px solid #e5e0d8',padding:'12px 18px',display:'flex',alignItems:'center',gap:10,position:'sticky',top:0,zIndex:20,marginBottom:24}}>
      <button onClick={onBack} style={{padding:'5px 12px',background:'none',border:'1px solid #e5e0d8',borderRadius:20,fontSize:11,color:'#888',cursor:'pointer',fontFamily:'inherit'}}>← Nazaj</button>
      <div style={{fontFamily:'Georgia,serif',fontSize:14,fontWeight:600,marginLeft:6}}>Admin orodja</div>
    </div>
    <div style={{display:'flex',gap:8,marginBottom:20}}>
      {[{id:'questions',label:'Vprasalnik'},{id:'prompts',label:'Prompti'}].map(t=>(
        <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'8px 20px',background:tab===t.id?'#181818':'white',color:tab===t.id?'white':'#444',border:'1px solid #e5e0d8',borderRadius:20,fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit'}}>{t.label}</button>
      ))}
    </div>
    {tab==='questions'&&(<div>
      <div style={{background:'white',border:'1px solid #e5e0d8',borderRadius:14,padding:'16px 20px',marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontFamily:'Georgia,serif',fontSize:15,fontWeight:600}}>Trditve vprasalnika</div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>{if(confirm('Ponastavi?')){setQuestions(DEFAULT_QUESTIONS);saveQuestions(DEFAULT_QUESTIONS)}}} style={{padding:'6px 14px',background:'none',border:'1px solid #e5e0d8',borderRadius:20,fontSize:11,color:'#888',cursor:'pointer',fontFamily:'inherit'}}>Ponastavi</button>
          <button onClick={()=>{saveQuestions(questions);setSavedQ(true);setTimeout(()=>setSavedQ(false),2000)}} style={{padding:'6px 16px',background:savedQ?'#2e8a55':'#181818',color:'white',border:'none',borderRadius:20,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>{savedQ?'Shranjeno':'Shrani'}</button>
        </div>
      </div>
      {questions.map((q,qi)=>(<div key={qi} style={{background:'white',border:'1px solid #e5e0d8',borderRadius:14,padding:'16px 20px',marginBottom:10}}>
        <div style={{fontSize:11,fontWeight:600,color:'#888',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:12}}>Sklop {qi+1}</div>
        {['B','G','Y','R'].map(k=>(<div key={k} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
          <div style={{width:24,height:24,borderRadius:'50%',background:CL[k],border:'1.5px solid '+CH[k],display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><span style={{fontSize:9,fontWeight:700,color:CH[k]}}>{k}</span></div>
          <input value={q[k]} onChange={e=>{const nq=[...questions];nq[qi]={...nq[qi],[k]:e.target.value};setQuestions(nq)}} style={{flex:1,padding:'8px 12px',border:'1px solid #e5e0d8',borderRadius:8,fontSize:13,fontFamily:'inherit',outline:'none',color:'#181818'}}/>
        </div>))}
      </div>))}
    </div>)}
    {tab==='prompts'&&(<div>
      <div style={{background:'white',border:'1px solid #e5e0d8',borderRadius:14,padding:'16px 20px',marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={{fontFamily:'Georgia,serif',fontSize:15,fontWeight:600}}>System prompt</div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>{if(confirm('Ponastavi?')){setSys(defSys);setPr(defP);savePrompts(null)}}} style={{padding:'6px 14px',background:'none',border:'1px solid #e5e0d8',borderRadius:20,fontSize:11,color:'#888',cursor:'pointer',fontFamily:'inherit'}}>Ponastavi vse</button>
            <button onClick={()=>{savePrompts({sys,prompts:pr});setSavedP(true);setTimeout(()=>setSavedP(false),2000)}} style={{padding:'6px 16px',background:savedP?'#2e8a55':'#181818',color:'white',border:'none',borderRadius:20,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>{savedP?'Shranjeno':'Shrani vse'}</button>
          </div>
        </div>
        <textarea value={sys} onChange={e=>setSys(e.target.value)} style={{width:'100%',minHeight:180,padding:'12px',border:'1.5px solid #e5e0d8',borderRadius:8,fontSize:12,fontFamily:'monospace',lineHeight:1.6,resize:'vertical',outline:'none',color:'#181818',boxSizing:'border-box'}}/>
      </div>
      <div style={{fontFamily:'Georgia,serif',fontSize:15,fontWeight:600,marginBottom:12}}>Sekcijski prompti</div>
      {Object.entries(pr).map(([id,val])=>(<div key={id} style={{background:'white',border:'1px solid #e5e0d8',borderRadius:12,padding:'14px 16px',marginBottom:8}}>
        <div style={{fontSize:11,fontWeight:600,color:'#444',marginBottom:8}}>{sl[id]||id}</div>
        <textarea value={val} onChange={e=>setPr(p=>({...p,[id]:e.target.value}))} style={{width:'100%',minHeight:64,padding:'8px 10px',border:'1px solid #e5e0d8',borderRadius:8,fontSize:12,fontFamily:'monospace',lineHeight:1.6,resize:'vertical',outline:'none',color:'#181818',boxSizing:'border-box'}}/>
      </div>))}
    </div>)}
  </div>)
}
function RocniVnosView({onBack,onSuccess}){
  const [ime,setIme]=useState('')
  const [email,setEmail]=useState('')
  const [podjetje,setPodjetje]=useState('')
  const [spol,setSpol]=useState('m')
  const [scores,setScores]=useState({B:'',G:'',Y:'',R:''})
  const [saving,setSaving]=useState(false)
  const [err,setErr]=useState('')
  const [sn,setSn]=useState('')
  const [delovnoMesto,setDelovnoMesto]=useState('')
  const [rocniMode,setRocniMode]=useState('podjetje')
  const [pozicija,setPozicija]=useState('')
  const [sport,setSport]=useState('')
  const CH={B:'#4a7ab5',R:'#c94030',G:'#2e8a55',Y:'#c49a10'}
  const CL={B:'#e8f0fa',R:'#faeaea',G:'#e6f5ee',Y:'#fdf6e3'}
  const lb={B:'Analitična modra',G:'Stabilna zelena',Y:'Navdušena rumena',R:'Aktivna rdeča'}
  async function handleSave(){
    if(!ime.trim()) return setErr('Vnesite ime')
    const B=parseFloat(scores.B),G=parseFloat(scores.G),Y=parseFloat(scores.Y),R=parseFloat(scores.R)
    if([B,G,Y,R].some(v=>isNaN(v)||v<0||v>6)) return setErr('Vrednosti morajo biti med 0 in 6')
    setSaving(true);setErr('')
    try{
      const con={B,G,Y,R}
      const uncon={R:parseFloat((6-G).toFixed(2)),G:parseFloat((6-R).toFixed(2)),B:parseFloat((6-Y).toFixed(2)),Y:parseFloat((6-B).toFixed(2))}
      const res=await fetch('/api/submit-manual',{method:'POST',headers:{'Content-Type':'application/json','x-admin-key':'insights2024'},body:JSON.stringify({ime,email,podjetje,spol,con,uncon,sn,delovno_mesto:delovnoMesto,mode:rocniMode,pozicija,sport})})
      const data=await res.json()
      if(data.success){onSuccess();onBack()}
      else setErr(data.error||'Napaka')
    }catch(e){setErr('Napaka: '+e.message)}
    setSaving(false)
  }
  return(<div style={{fontFamily:'system-ui,sans-serif',maxWidth:600,margin:'0 auto',padding:'0 20px 60px',background:'#f7f5f1',minHeight:'100vh'}}>
    <div style={{background:'white',borderBottom:'1px solid #e5e0d8',padding:'12px 18px',display:'flex',alignItems:'center',gap:10,position:'sticky',top:0,zIndex:20,marginBottom:24}}>
      <button onClick={onBack} style={{padding:'5px 12px',background:'none',border:'1px solid #e5e0d8',borderRadius:20,fontSize:11,color:'#888',cursor:'pointer',fontFamily:'inherit'}}>← Nazaj</button>
      <div style={{fontFamily:'Georgia,serif',fontSize:14,fontWeight:600,marginLeft:6}}>Ročni vnos profila</div>
    </div>
    <div style={{background:'white',border:'1px solid #e5e0d8',borderRadius:14,padding:'20px 24px',marginBottom:14}}>
      <div style={{fontFamily:'Georgia,serif',fontSize:15,fontWeight:600,marginBottom:16}}>Podatki stranke</div>
      {[{id:'ime',label:'Ime in priimek *',val:ime,set:setIme,ph:'Jana Novak'},{id:'email',label:'E-posta',val:email,set:setEmail,ph:'jana@podjetje.si'},{id:'podjetje',label:'Podjetje',val:podjetje,set:setPodjetje,ph:'Podjetje d.o.o.'},{id:'delovno_mesto',label:'Delovno mesto',val:delovnoMesto,set:setDelovnoMesto,ph:'npr. Prodajalec, Marketing manager, Coach...'}].map(f=>(<div key={f.id} style={{marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:600,color:'#888',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:5}}>{f.label}</div>
        <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={{width:'100%',padding:'9px 12px',border:'1.5px solid #e5e0d8',borderRadius:8,fontSize:14,fontFamily:'inherit',outline:'none',boxSizing:'border-box'}}/>
      </div>))}
      <div>
        <div style={{fontSize:11,fontWeight:600,color:'#888',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:5}}>Spol</div>
        <div style={{display:'flex',gap:8}}>
          {[{v:'m',l:'Moški'},{v:'z',l:'Ženski'}].map(({v,l})=>(<button key={v} onClick={()=>setSpol(v)} style={{flex:1,padding:'9px',border:'1.5px solid '+(spol===v?'#181818':'#e5e0d8'),borderRadius:8,fontSize:13,fontFamily:'inherit',background:spol===v?'#181818':'white',color:spol===v?'white':'#444',cursor:'pointer'}}>{l}</button>))}
        </div>
      </div>
    </div>
    <div style={{background:'white',border:'1px solid #e5e0d8',borderRadius:14,padding:'20px 24px',marginBottom:14}}>
      <div style={{fontFamily:'Georgia,serif',fontSize:15,fontWeight:600,marginBottom:4}}>Barvne vrednosti (zavedna persona)</div>
      <div style={{fontSize:11,color:'#888',marginBottom:16}}>Vrednosti iz Google Sheets med 0.00 in 6.00.</div>
      {['B','G','Y','R'].map(k=>(<div key={k} style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
        <div style={{width:32,height:32,borderRadius:'50%',background:CL[k],border:'2px solid '+CH[k],display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><span style={{fontSize:11,fontWeight:700,color:CH[k]}}>{k}</span></div>
        <div style={{fontSize:13,color:'#444',width:130}}>{lb[k]}</div>
        <input type="number" min="0" max="6" step="0.01" value={scores[k]} onChange={e=>setScores(s=>({...s,[k]:e.target.value}))} placeholder="0.00"
          style={{width:90,padding:'8px 10px',border:'1.5px solid '+(scores[k]&&!isNaN(parseFloat(scores[k]))?CH[k]:'#e5e0d8'),borderRadius:8,fontSize:14,fontFamily:'monospace',outline:'none',textAlign:'center'}}/>
        {scores[k]&&!isNaN(parseFloat(scores[k]))&&(<div style={{flex:1,height:6,background:'#f0ece4',borderRadius:3,overflow:'hidden'}}>
          <div style={{height:'100%',background:CH[k],width:Math.min(parseFloat(scores[k])/6*100,100)+'%',borderRadius:3}}/>
        </div>)}
      </div>))}
      {['B','G','Y','R'].every(k=>scores[k]&&!isNaN(parseFloat(scores[k])))&&(<div style={{marginTop:14,padding:'12px 14px',background:'#f9f7f4',borderRadius:8}}>
        <div style={{fontSize:10,fontWeight:600,color:'#888',textTransform:'uppercase',marginBottom:8}}>Nezavedna persona (izracunano)</div>
        <div style={{display:'flex',gap:16}}>
          {['B','G','Y','R'].map(k=>{const c={B:parseFloat(scores.B),G:parseFloat(scores.G),Y:parseFloat(scores.Y),R:parseFloat(scores.R)};const u={R:parseFloat((6-c.G).toFixed(2)),G:parseFloat((6-c.R).toFixed(2)),B:parseFloat((6-c.Y).toFixed(2)),Y:parseFloat((6-c.B).toFixed(2))};return <div key={k} style={{fontSize:12,color:CH[k],fontWeight:600}}>{k}: {u[k]}</div>})}
        </div>
      </div>)}
    </div>
      <div style={{background:'white',border:'1px solid #e5e0d8',borderRadius:14,padding:'20px 24px',marginBottom:14}}>
      <div style={{fontFamily:'Georgia,serif',fontSize:15,fontWeight:600,marginBottom:12}}>Kontekst profila</div>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:600,color:'#888',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>Tip profila</div>
        <div style={{display:'flex',gap:8}}>
          {[{v:'podjetje',l:'🏢 Podjetje'},{v:'sport',l:'⚽ Šport'}].map(({v,l})=>(
            <button key={v} onClick={()=>setRocniMode(v)} style={{flex:1,padding:'9px',border:'1.5px solid '+(rocniMode===v?'#181818':'#e5e0d8'),borderRadius:8,fontSize:13,fontFamily:'inherit',background:rocniMode===v?'#181818':'white',color:rocniMode===v?'white':'#444',cursor:'pointer'}}>{l}</button>
          ))}
        </div>
      </div>
      {rocniMode==='sport'&&(<div style={{marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:600,color:'#888',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:5}}>Šport</div>
        <input value={sport} onChange={e=>setSport(e.target.value)} placeholder='npr. Nogomet, Košarka, Rokomet...'
          style={{width:'100%',padding:'9px 12px',border:'1.5px solid #e5e0d8',borderRadius:8,fontSize:14,fontFamily:'inherit',outline:'none',boxSizing:'border-box'}}/>
      </div>)}
      {rocniMode==='sport'&&(<div style={{marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:600,color:'#888',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:5}}>Pozicija / Vloga</div>
        <input value={pozicija} onChange={e=>setPozicija(e.target.value)} placeholder='npr. Napadalec, Vratar, Trener, Kapetan...'
          style={{width:'100%',padding:'9px 12px',border:'1.5px solid #e5e0d8',borderRadius:8,fontSize:14,fontFamily:'inherit',outline:'none',boxSizing:'border-box'}}/>
      </div>)}
      </div>
      <div style={{background:'white',border:'1px solid #e5e0d8',borderRadius:14,padding:'20px 24px',marginBottom:14}}>
      <div style={{fontFamily:'Georgia,serif',fontSize:15,fontWeight:600,marginBottom:8}}>Percepcijski stil (S/N)</div>
      <div style={{fontSize:11,color:'#888',marginBottom:14}}>Vrednost med -3 in +3. Negativno = zaznavanje, pozitivno = intuicija, 0 = uravnotežen.</div>
      <input type="number" min="-3" max="3" step="0.5" value={sn} onChange={e=>setSn(e.target.value)} placeholder="npr. -1.5 ali +2"
        style={{width:'100%',padding:'10px 14px',border:'1.5px solid #e5e0d8',borderRadius:10,fontSize:15,fontFamily:'monospace',outline:'none',boxSizing:'border-box',textAlign:'center'}}/>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#bbb',marginTop:6}}>
        <span>-3 = izrazito zaznavanje</span>
        <span>0 = uravnotežen</span>
        <span>+3 = izrazita intuicija</span>
      </div>
    </div>
    {err&&<div style={{background:'#faeaea',border:'1px solid #c94030',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#a8291a',marginBottom:14}}>{err}</div>}
    <button onClick={handleSave} disabled={saving} style={{width:'100%',padding:'13px',background:saving?'#aaa':'#181818',color:'white',border:'none',borderRadius:12,fontSize:15,fontWeight:500,cursor:saving?'not-allowed':'pointer',fontFamily:'inherit'}}>
      {saving?'Shranjujem...':'Ustvari profil'}
    </button>
  </div>)
}
// ── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginScreen({onLogin}) {
  const [pw,setPw]=useState('')
  const [err,setErr]=useState('')
  function handle() {
    if(pw==='insights2024'){onLogin()}
    else setErr('Napačno geslo.')
  }
  return (
    <div style={{minHeight:'100vh',background:'#f7f5f1',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui,sans-serif'}}>
      <div style={{background:'white',borderRadius:20,padding:'40px 44px',maxWidth:380,width:'100%',boxShadow:'0 4px 40px rgba(0,0,0,0.08)'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:28}}>
          <div style={{width:40,height:40,borderRadius:'50%',background:'conic-gradient(#4a7ab5 0deg 90deg,#c94030 90deg 180deg,#c49a10 180deg 270deg,#2e8a55 270deg 360deg)'}}/>
          <div>
            <div style={{fontFamily:'Georgia,serif',fontSize:16,fontWeight:600}}>Admin panel</div>
            <div style={{fontSize:11,color:'#888'}}>Barvni kompas</div>
          </div>
        </div>
        <input type="password" value={pw} onChange={e=>setPw(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&handle()}
          placeholder="Geslo"
          style={{width:'100%',padding:'11px 14px',border:'1.5px solid #e5e0d8',borderRadius:10,fontSize:14,fontFamily:'inherit',background:'#f7f5f1',outline:'none',boxSizing:'border-box',marginBottom:10}}/>
        {err&&<div style={{fontSize:12,color:'#a8291a',marginBottom:10}}>{err}</div>}
        <button onClick={handle} style={{width:'100%',padding:'12px',background:'#181818',color:'white',border:'none',borderRadius:50,fontSize:14,fontWeight:500,cursor:'pointer',fontFamily:'inherit'}}>
          Prijava →
        </button>
      </div>
    </div>
  )
}

// ── MINI BAR CHART ────────────────────────────────────────────────────────────
function MiniBar({con}) {
  const order=['B','G','Y','R'],hexes=[CLR.B,CLR.G,CLR.Y,CLR.R]
  return (
    <div style={{display:'flex',gap:2,alignItems:'flex-end',height:24}}>
      {order.map((k,i)=>{
        const sc=Math.max(0,Math.min(6,con[k]))
        return <div key={k} style={{width:10,background:hexes[i],height:Math.round((sc/6)*24),borderRadius:'1px 1px 0 0'}}/>
      })}
    </div>
  )
}

// ── MAIN ADMIN APP ────────────────────────────────────────────────────────────

// ─── EDIT PROFILE MODAL ────────────────────────────────────────────────────────
function EditProfileModal({profile, onClose, onSave}) {
  const [ime, setIme] = useState(profile.ime||'')
  const [email, setEmail] = useState(profile.email||'')
  const [podjetje, setPodjetje] = useState(profile.podjetje||'')
  const [spol, setSpol] = useState(profile.spol||'m')
  const [tim, setTim] = useState(profile.tim||'')
  const [sn, setSn] = useState(profile.sn||'')
  const [delovnoMesto, setDelovnoMesto] = useState(profile.delovno_mesto||'')
  const [editMode, setEditMode] = useState(profile.mode||'podjetje')
  const [pozicija, setPozicija] = useState(profile.pozicija||'')
  const [sport, setSport] = useState(profile.sport||'')
  const [con, setCon] = useState({B:profile.con?.B||0,R:profile.con?.R||0,G:profile.con?.G||0,Y:profile.con?.Y||0})
  const CLR={B:"#4a7ab5",R:"#c94030",G:"#2e8a55",Y:"#c49a10"}
  const LABEL={B:"Analitična modra",R:"Aktivna rdeča",G:"Stabilna zelena",Y:"Navdušena rumena"}
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"white",borderRadius:16,padding:"28px 32px",width:480,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
        <div style={{fontFamily:"Georgia,serif",fontSize:18,fontWeight:600,marginBottom:20}}>✏️ Uredi profil</div>
        {[
          ["Ime in priimek",ime,setIme],
          ["Email",email,setEmail],
          ["Podjetje",podjetje,setPodjetje],
          ["Tim / Skupina",tim,setTim],
          ["Delovno mesto",delovnoMesto,setDelovnoMesto],
        ].map(([label,val,set])=>(
          <div key={label} style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:600,color:"#888",marginBottom:5,textTransform:"uppercase"}}>{label}</div>
            <input value={val} onChange={e=>set(e.target.value)} style={{width:"100%",padding:"9px 12px",border:"1px solid #e5e0d8",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
          </div>
        ))}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:600,color:"#888",marginBottom:5,textTransform:"uppercase"}}>Spol</div>
          <div style={{display:"flex",gap:8}}>
            {[["m","Moški"],["z","Ženski"]].map(([v,l])=>(
              <button key={v} onClick={()=>setSpol(v)} style={{flex:1,padding:"8px",border:"1.5px solid "+(spol===v?"#181818":"#e5e0d8"),borderRadius:8,background:spol===v?"#181818":"white",color:spol===v?"white":"#888",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:600,color:"#888",marginBottom:10,textTransform:"uppercase"}}>Barvne vrednosti (0–6)</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {["B","R","G","Y"].map(k=>(
              <div key={k}>
                <div style={{fontSize:11,color:CLR[k],fontWeight:700,marginBottom:4}}>{LABEL[k]}</div>
                <input type="number" min="0" max="6" step="0.01" value={con[k]}
                  onChange={e=>setCon(prev=>({...prev,[k]:parseFloat(e.target.value)||0}))}
                  style={{width:"100%",padding:"8px 10px",border:"1.5px solid "+CLR[k]+"44",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none",color:CLR[k],fontWeight:600,boxSizing:"border-box"}}/>
              </div>
            ))}
          </div>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:600,color:"#888",marginBottom:5,textTransform:"uppercase"}}>Percepcijski stil S/N</div>
          <input type="number" min="-3" max="3" step="0.5" value={sn} onChange={e=>setSn(e.target.value)}
            placeholder="npr. -1.5 ali +2"
            style={{width:"100%",padding:"9px 12px",border:"1px solid #e5e0d8",borderRadius:8,fontSize:13,fontFamily:"monospace",outline:"none",boxSizing:"border-box",textAlign:"center"}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#bbb",marginTop:4}}>
            <span>-3 = zaznavanje</span>
            <span>0 = nevtralno</span>
            <span>+3 = intuicija</span>
          </div>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:600,color:"#888",marginBottom:8,textTransform:"uppercase"}}>Tip profila</div>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            {[{v:'podjetje',l:'🏢 Podjetje'},{v:'sport',l:'⚽ Šport'}].map(({v,l})=>(
              <button key={v} onClick={()=>setEditMode(v)} style={{flex:1,padding:"8px",border:"1.5px solid "+(editMode===v?"#181818":"#e5e0d8"),borderRadius:8,background:editMode===v?"#181818":"white",color:editMode===v?"white":"#888",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
            ))}
          </div>
          {editMode==='sport'&&(<>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:11,fontWeight:600,color:"#888",marginBottom:5,textTransform:"uppercase"}}>Šport</div>
              <input value={sport} onChange={e=>setSport(e.target.value)} placeholder="npr. Nogomet, Košarka..." style={{width:"100%",padding:"9px 12px",border:"1px solid #e5e0d8",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:600,color:"#888",marginBottom:5,textTransform:"uppercase"}}>Pozicija / Vloga</div>
              <input value={pozicija} onChange={e=>setPozicija(e.target.value)} placeholder="npr. Napadalec, Vratar, Trener..." style={{width:"100%",padding:"9px 12px",border:"1px solid #e5e0d8",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
            </div>
          </>)}
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>onSave({id:profile.id,ime,email,podjetje,spol,tim,sn,delovno_mesto:delovnoMesto,mode:editMode,pozicija,sport,con,uncon:{R:parseFloat((6-con.G).toFixed(2)),G:parseFloat((6-con.R).toFixed(2)),B:parseFloat((6-con.Y).toFixed(2)),Y:parseFloat((6-con.B).toFixed(2))}})}
            style={{flex:1,padding:"12px",background:"#181818",color:"white",border:"none",borderRadius:10,fontSize:14,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>
            ✓ Shrani spremembe
          </button>
          <button onClick={onClose} style={{padding:"12px 20px",background:"none",border:"1px solid #e5e0d8",borderRadius:10,fontSize:14,color:"#888",cursor:"pointer",fontFamily:"inherit"}}>Prekliči</button>
        </div>
      </div>
    </div>
  )
}

// ─── TIM DASHBOARD ────────────────────────────────────────────────────────────
function TimDashboard({profiles, onBack}) {
  const [selected, setSelected] = useState(new Set())
  const [analiza, setAnaliza] = useState({})
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [generating, setGenerating] = useState(null)

  const CLR={B:'#4a7ab5',R:'#c94030',G:'#2e8a55',Y:'#c49a10'}
  const CLR_L={B:'#e8f0fa',R:'#faeaea',G:'#e6f5ee',Y:'#fdf6e3'}
  const CLR_D={B:'#1a4a7a',R:'#a8291a',G:'#1a5c38',Y:'#8a6200'}
  const NAMES={B:'Analitična modra',R:'Aktivna rdeča',G:'Stabilna zelena',Y:'Navdušena rumena'}

  const TIM_SECTIONS = [
    {id:'prednosti', label:'Prednosti tima'},
    {id:'tveganja', label:'Tveganja in slepe pege'},
    {id:'komunikacija', label:'Komunikacija v timu'},
    {id:'vloge', label:'Idealne vloge'},
    {id:'priporocila', label:'Priporočila za vodjo'},
    {id:'razvoj', label:'Razvojne priložnosti tima'},
    {id:'kako_delati', label:'Kako delati s posameznikom'},
  ]

  const teamProfiles = profiles
    .filter(p => selected.has(p.id) && (p.mode||'podjetje') === 'podjetje')
    .map(p => {
      const con = p.con || {B:0,G:0,Y:0,R:0}
      const sorted = ['B','R','G','Y'].map(k=>({k,v:con[k]})).sort((a,b)=>b.v-a.v)
      return {...p, con, leadColor: sorted[0].k, sec: sorted[1].k}
    })

  const teamStats = teamProfiles.length > 0 ? {
    avg: {
      B: parseFloat((teamProfiles.reduce((s,p)=>s+p.con.B,0)/teamProfiles.length).toFixed(2)),
      G: parseFloat((teamProfiles.reduce((s,p)=>s+p.con.G,0)/teamProfiles.length).toFixed(2)),
      Y: parseFloat((teamProfiles.reduce((s,p)=>s+p.con.Y,0)/teamProfiles.length).toFixed(2)),
      R: parseFloat((teamProfiles.reduce((s,p)=>s+p.con.R,0)/teamProfiles.length).toFixed(2)),
    },
    missing: ['B','R','G','Y'].filter(k => teamProfiles.every(p=>p.con[k] < 2.5)),
    distribution: ['B','R','G','Y'].map(k=>({
      k,
      avg: parseFloat((teamProfiles.reduce((s,p)=>s+p.con[k],0)/teamProfiles.length).toFixed(2)),
      leaders: teamProfiles.filter(p=>p.leadColor===k).map(p=>p.ime.split(' ')[0])
    }))
  } : null

  function teamRadar(size=260) {
    const cx=size/2, cy=size/2, R=size*0.35
    const dims=[
      {label:'Analitičnost',k:'B'},{label:'Odločnost',k:'R'},
      {label:'Empatija',k:'G'},{label:'Optimizem',k:'Y'},
      {label:'Natančnost',k:'B'},{label:'Pogum',k:'R'},
      {label:'Harmonija',k:'G'},{label:'Ustvarjalnost',k:'Y'},
    ]
    const vals=dims.map(d=>teamStats?Math.min(teamStats.avg[d.k],6):0)
    const n=dims.length
    function ptA(i,r){const a=(i/n)*2*Math.PI-Math.PI/2;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]}
    const pad=32
    const grid=[1,2,3,4,5,6].map(v=>{const r=(v/6)*R,pts=Array.from({length:n},(_,i)=>ptA(i,r));return `<path d="${pts.map((p,i)=>(i===0?'M':'L')+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}Z" fill="none" stroke="#e8e4df" stroke-width="${v===3?'1':'0.5'}"/>`}).join('')
    const axes=dims.map((_,i)=>{const [x,y]=ptA(i,R);return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#e8e4df" stroke-width="0.8"/>`}).join('')
    const dataPts=vals.map((v,i)=>ptA(i,(v/6)*R))
    const dataPath=dataPts.map((p,i)=>(i===0?'M':'L')+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')+'Z'
    const dots=dataPts.map((p,i)=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4" fill="${CLR[dims[i].k]}" stroke="white" stroke-width="2"/>`).join('')
    const lbls=dims.map((dim,i)=>{const [x,y]=ptA(i,R+18);const anchor=x<cx-3?'end':x>cx+3?'start':'middle';return `<text x="${x.toFixed(1)}" y="${(y+4).toFixed(1)}" text-anchor="${anchor}" font-size="9" fill="#888" font-family="system-ui">${dim.label}</text>`}).join('')
    return `<svg width="${size+pad*2}" height="${size+pad*2}" viewBox="${-pad} ${-pad} ${size+pad*2} ${size+pad*2}" xmlns="http://www.w3.org/2000/svg">${grid}${axes}<path d="${dataPath}" fill="rgba(74,122,181,0.12)" stroke="#4a7ab5" stroke-width="2" opacity="0.9"/>${dots}${lbls}</svg>`
  }

  async function generirajAnalizo() {
    if(teamProfiles.length < 2) return
    setLoading(true)
    setAnaliza({})
    try {
      const teamDesc = teamProfiles.map(p =>
        `${p.ime}: B=${p.con.B.toFixed(1)} G=${p.con.G.toFixed(1)} Y=${p.con.Y.toFixed(1)} R=${p.con.R.toFixed(1)} (${p.typeName||p.leadColor})`
      ).join('\n')

      const validMembers = teamProfiles.filter(p => p.con.B+p.con.R+p.con.G+p.con.Y > 0)
      const teamDescClean = validMembers.map(p => {
        const snVal = parseFloat(p.sn)
        const snDesc = !isNaN(snVal) && snVal !== 0
          ? (snVal <= -2.5 ? ', percepcija: izrazito zaznavanje' :
             snVal <= -1.0 ? ', percepcija: zaznavanje' :
             snVal >= 2.5  ? ', percepcija: izrazita intuicija' :
             snVal >= 1.0  ? ', percepcija: intuicija' : ', percepcija: uravnotežen')
          : ''
        const dmDesc = p.delovno_mesto ? `, delovno mesto: ${p.delovno_mesto}` : ''
        return `${p.ime}: analitičnost=${p.con.B.toFixed(1)}/6, odločnost=${p.con.R.toFixed(1)}/6, empatija=${p.con.G.toFixed(1)}/6, optimizem=${p.con.Y.toFixed(1)}/6${snDesc}${dmDesc}`
      }).join('\n')

      const prompt = `Tim ${validMembers.length} oseb — analiza za vodjo.

ČLANI IN NJIHOVE VREDNOSTI (lestvica 0-6):
${teamDescClean}

POVPREČJE TIMA: analitičnost=${teamStats.avg.B} odločnost=${teamStats.avg.R} empatija=${teamStats.avg.G} optimizem=${teamStats.avg.Y}
${teamStats.missing.length>0?'OPOZORILO — timu manjka: '+teamStats.missing.map(k=>({B:'analitičnost',R:'odločnost',G:'empatija',Y:'optimizem'}[k])).join(', '):''}

PRAVILA — OBVEZNO UPOŠTEVAJ:
- NIKOLI ne omenjaj barv (ne modra, rdeča, zelena, rumena, ne 'barvni profil', ne 'energija')
- Opisuj vedenje konkretno: namesto 'visoka modra' piši 'metodičen', 'analitičen', 'natančen'
- Člane imenuj po imenu — ne po tipu ali barvi
- NE ponavljaj naslova sekcije v prvem stavku
- Piši v slovenščini, tretja oseba, konkretno in specifično
- Člane z vsemi vrednostmi 0 ignoriraj

BESEDNJAK namesto barv:
- Visoka analitičnost (B) → metodičen, natančen, sistematičen, podatkovni, skrben za kakovost
- Visoka odločnost (R) → direkten, rezultatsko usmerjen, pogumen, hiter, akcijsko naravnan
- Visoka empatija (G) → sočuten, harmoničen, podporen, dober poslušalec, stabilen
- Visok optimizem (Y) → entuziastičen, kreativen, komunikativen, spontan, vizionarski

S/N OS — PERCEPCIJSKI STIL (upoštevaj kjer je relevantno):
- Zaznavanje → konkretno, korak-za-korakom, dejstva, preizkušene metode, sedanjost
- Intuicija → vzorci, možnosti, prihodnost, celostna slika, inovativnost
- Napetosti: zaznavni člani in intuitivni člani imajo zelo različen tempo in pristop
- V Komunikaciji in Priporočilih omeni napetosti med S/N stili če so prisotni v timu
- V Kako delati: za zaznavne člane piši konkretno, za intuitivne vizionarsko

Generiraj timsko analizo. Vsako sekcijo začni TOČNO z [SEKCIJA:id].

[SEKCIJA:prednosti]
5-6 povedi. Opiši kaj ta specifična kombinacija ljudi naredi skupaj dobro — konkretno po vedenju, brez barv. Navedi člane po imenu kjer je relevantno.

[SEKCIJA:tveganja]
5-6 povedi. Konkretna tveganja in slepe pege tega tima — kje so napetosti med posamezniki, kaj timu manjka. Brez barv, po imenih.

[SEKCIJA:komunikacija]
5-6 povedi. Kako različni člani komunicirajo med seboj — kje je harmonija, kje so napetosti, kakšen tempo prevladuje. Brez barv, po imenih.

[SEKCIJA:vloge]
Idealne vloge za vsakega aktivnega člana glede na njegovo DEJANSKO delovno mesto (če je navedeno) in vedenjski profil.
Format: **Ime Priimek** (delovno mesto) - En stavek kako se njegov profil kaže v tej vlogi, brez omembe barv.
Če delovno mesto ni navedeno, predlagaj vlogo glede na profil.

[SEKCIJA:priporocila]
5 konkretnih priporočil za vodjo tega specifičnega tima. Upoštevaj dejanska delovna mesta članov kjer so navedena.
Format: **Kratko priporočilo** - En stavek razlage. Brez barv, konkretno in actionable.

[SEKCIJA:razvoj]
4-5 povedi. Kaj ta specifičen tim potrebuje za rast — konkretni ukrepi, ne generični nasveti. Brez barv.

[SEKCIJA:kako_delati]
Za vsakega aktivnega člana napiši kratke praktične napotke ZA VODJO — upoštevaj njegovo delovno mesto kjer je navedeno.
Nasveti morajo biti specifični za kombinacijo profila IN delovnega mesta. Npr. če je Janez prodajalec z nizko odločnostjo,
napiši konkretno kako ga voditi pri zaključevanju poslov — ne generično.
Format:
**Ime Priimek** (delovno mesto če je navedeno)
- Kako komunicirati: en konkreten stavek vezan na delovno mesto in profil
- Kako motivirati: en konkreten stavek vezan na delovno mesto in profil
- Izogibaj se: en konkreten stavek vezan na delovno mesto in profil
`

      const r = await fetch('/api/claude', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({system:'Si ekspert za timsko dinamiko in Barvni kompas. Pišeš v slovenščini, tretja oseba, konkretno in specifično za ta tim.', prompt})
      })
      const data = await r.json()
      const raw = data.text || ''
      const parts = raw.split(/\[SEKCIJA:(\w+)\]/)
      const result = {}
      for(let i=1;i<parts.length;i+=2){
        const id=parts[i].trim()
        const txt=(parts[i+1]||'').trim()
        if(id&&txt) result[id]=txt
      }
      setAnaliza(result)
    } catch(e) {
      console.error('Tim analiza napaka:', e)
    }
    setLoading(false)
  }

  async function handleTimPdf() {
    if(teamProfiles.length < 2) return
    setPdfLoading(true)
    try {
      const r = await fetch('/api/pdf-tim', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          teamProfiles,
          teamStats,
          analiza,
          date: new Date().toLocaleDateString('sl-SI',{day:'numeric',month:'long',year:'numeric'})
        })
      })
      if(!r.ok) throw new Error('PDF Tim napaka')
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href=url
      a.download=`insights-tim-${new Date().toISOString().slice(0,10)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch(e) {
      alert('PDF napaka: '+e.message)
    }
    setPdfLoading(false)
  }

  async function handleTimHtml() {
    if(teamProfiles.length < 2) return
    setPdfLoading(true)
    try {
      const r = await fetch('/api/html-report-tim', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          analiza,
          members: teamProfiles.map(p => ({ime: p.ime, con: p.con}))
        })
      })
      if(!r.ok) throw new Error('Tim HTML napaka')
      const html = await r.text()
      const blob = new Blob([html], {type:'text/html;charset=utf-8'})
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href=url
      a.download=`barvni-kompas-tim-${new Date().toISOString().slice(0,10)}.html`
      a.click()
      URL.revokeObjectURL(url)
    } catch(e) { alert('Tim HTML napaka: '+e.message) }
    setPdfLoading(false)
  }

  function toggleProfile(id) {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
    setAnaliza({})
  }

  function timStartEdit(id, txt) { setEditingId(id); setEditingText(txt) }
  function timCancelEdit() { setEditingId(null); setEditingText('') }
  function timSaveEdit(id) {
    setAnaliza(prev=>({...prev,[id]:editingText}))
    setEditingId(null)
    setEditingText('')
  }

  const sectionCard = (sec) => {
    const txt = analiza[sec.id] || ''
    const isEditing = editingId === sec.id
    const isList = ['vloge','priporocila'].includes(sec.id)
    const color = sec.id==='prednosti'?'#2e8a55':sec.id==='tveganja'?'#c94030':sec.id==='priporocila'?'#2e8a55':'#4a7ab5'

    return (
      <div key={sec.id} style={{background:'white',border:'1px solid #e5e0d8',borderRadius:12,padding:'16px 20px',marginBottom:14}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div style={{fontFamily:'Georgia,serif',fontSize:14,fontWeight:600,color:'#1a1a1a'}}>{sec.label}</div>
          <div style={{display:'flex',gap:6}}>
            {!isEditing && txt && (
              <button onClick={()=>timStartEdit(sec.id,txt)} style={{padding:'3px 10px',background:'none',border:'1px solid #e5e0d8',borderRadius:20,fontSize:11,color:'#888',cursor:'pointer',fontFamily:'inherit'}}>✏️ Uredi</button>
            )}
            {isEditing && (<>
              <button onClick={()=>timSaveEdit(sec.id)} style={{padding:'3px 10px',background:'#181818',color:'white',border:'none',borderRadius:20,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>✓ Shrani</button>
              <button onClick={timCancelEdit} style={{padding:'3px 10px',background:'none',border:'1px solid #e5e0d8',borderRadius:20,fontSize:11,color:'#888',cursor:'pointer',fontFamily:'inherit'}}>✕</button>
            </>)}
          </div>
        </div>
        {isEditing ? (
          <textarea value={editingText} onChange={e=>setEditingText(e.target.value)}
            style={{width:'100%',minHeight:120,padding:'10px 12px',border:'1px solid #e5e0d8',borderRadius:8,fontSize:12,lineHeight:1.7,fontFamily:'inherit',resize:'vertical',outline:'none',boxSizing:'border-box'}}
          />
        ) : txt ? (
          <div style={{display:'flex'}}>
            <div style={{width:3,background:color,borderRadius:2,flexShrink:0,marginRight:12}}></div>
            <div style={{flex:1,fontSize:12,color:'#4a4a4a',lineHeight:1.8}}>{txt}</div>
          </div>
        ) : (
          <div style={{fontSize:12,color:'#ccc',fontStyle:'italic'}}>Ni generirano</div>
        )}
      </div>
    )
  }

  return (
    <div style={{fontFamily:'system-ui,sans-serif',maxWidth:1000,margin:'0 auto',padding:'0 20px 60px',background:'#f7f5f1',minHeight:'100vh'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'24px 0 20px',borderBottom:'1px solid #e5e0d8',marginBottom:24}}>
        <button onClick={onBack} style={{padding:'6px 14px',background:'none',border:'1px solid #e5e0d8',borderRadius:20,fontSize:11,color:'#888',cursor:'pointer',fontFamily:'inherit'}}>← Nazaj</button>
        <div style={{fontFamily:'Georgia,serif',fontSize:20,fontWeight:600}}>👥 Timski dashboard</div>
        <div style={{fontSize:12,color:'#aaa',marginLeft:'auto'}}>{selected.size} izbranih / {profiles.length} profilov</div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:20}}>
        {/* Levo — izbira */}
        <div>
          <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',color:'#aaa',marginBottom:8}}>Izberi člane</div>
          {[...new Set(profiles.map(p=>p.tim).filter(Boolean))].length>0&&(
            <div style={{marginBottom:10,display:'flex',gap:5,flexWrap:'wrap'}}>
              {['Vsi',...[...new Set(profiles.map(p=>p.tim).filter(Boolean))].sort()].map(t=>(
                <button key={t} onClick={()=>{
                  const timProfiles=profiles.filter(p=>t==='Vsi'||p.tim===t)
                  if(t==='Vsi'){setSelected(new Set())}
                  else{setSelected(new Set(timProfiles.map(p=>p.id)));setAnaliza({})}
                }} style={{padding:'3px 10px',background:'none',border:'1px solid #e5e0d8',borderRadius:20,fontSize:10,color:'#888',cursor:'pointer',fontFamily:'inherit'}}>
                  {t==='Vsi'?'Počisti':t} {t!=='Vsi'&&`(${profiles.filter(p=>p.tim===t).length})`}
                </button>
              ))}
            </div>
          )}
          {profiles.filter(p=>(p.mode||'podjetje')==='podjetje').map(p => {
            const con = p.con || {B:0,G:0,Y:0,R:0}
            const lc = ['B','R','G','Y'].map(k=>({k,v:con[k]})).sort((a,b)=>b.v-a.v)[0].k
            const isSelected = selected.has(p.id)
            return (
              <div key={p.id} onClick={()=>toggleProfile(p.id)} style={{
                background:isSelected?CLR_L[lc]:'white',
                border:`1.5px solid ${isSelected?CLR[lc]:'#e5e0d8'}`,
                borderRadius:10,padding:'9px 13px',marginBottom:7,cursor:'pointer',transition:'all 0.15s'
              }}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:CLR[lc],flexShrink:0}}></div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:'#1a1a1a'}}>{p.ime}</div>
                    <div style={{fontSize:10,color:'#aaa'}}>B{con.B.toFixed(1)} R{con.R.toFixed(1)} G{con.G.toFixed(1)} Y{con.Y.toFixed(1)}</div>
                  </div>
                  {isSelected&&<div style={{color:CLR[lc],fontSize:14,fontWeight:700}}>✓</div>}
                </div>
              </div>
            )
          })}

          <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:8}}>
            {selected.size >= 2 ? (<>
              <button onClick={generirajAnalizo} disabled={loading} style={{
                width:'100%',padding:'11px',background:'#181818',color:'white',border:'none',
                borderRadius:10,fontSize:13,fontWeight:500,cursor:loading?'default':'pointer',fontFamily:'inherit',opacity:loading?0.7:1
              }}>
                {loading?'⏳ Generiram...':'🔍 Generiraj analizo'}
              </button>
              {Object.keys(analiza).length > 0 && (<>
                <button onClick={handleTimPdf} disabled={pdfLoading} style={{
                  width:'100%',padding:'11px',background:'#2e8a55',color:'white',border:'none',
                  borderRadius:10,fontSize:13,fontWeight:500,cursor:pdfLoading?'default':'pointer',fontFamily:'inherit',opacity:pdfLoading?0.7:1
                }}>
                  {pdfLoading?'⏳ Generiram PDF...':'⭐ Izvozi Tim PDF'}
                </button>
                <button onClick={handleTimHtml} disabled={pdfLoading} style={{padding:'6px 14px',background:pdfLoading?'#888':'#534AB7',color:'white',border:'none',borderRadius:10,fontSize:13,fontWeight:500,cursor:pdfLoading?'default':'pointer',fontFamily:'inherit',opacity:pdfLoading?0.7:1}}>
                  {pdfLoading?'⏳ Generiram...':'🌐 Tim HTML'}
                </button>
              </>)}
            </>) : (
              <div style={{fontSize:11,color:'#aaa',textAlign:'center',padding:'8px 0'}}>Izberi vsaj 2 profila</div>
            )}
          </div>
        </div>

        {/* Desno */}
        <div>
          {teamStats && (<>
            {/* Barvna sestava */}
            <div style={{background:'white',border:'1px solid #e5e0d8',borderRadius:12,padding:'16px 20px',marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',color:'#aaa',marginBottom:14}}>Barvna sestava tima</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
                {teamStats.distribution.map(({k,avg,leaders})=>(
                  <div key={k} style={{background:CLR_L[k],border:`1px solid ${CLR[k]}33`,borderRadius:8,padding:'10px 12px',textAlign:'center'}}>
                    <div style={{fontSize:9,fontWeight:800,textTransform:'uppercase',color:CLR_D[k],marginBottom:3}}>{NAMES[k]}</div>
                    <div style={{fontSize:22,fontWeight:700,color:CLR[k],marginBottom:3}}>{avg.toFixed(1)}</div>
                    <div style={{fontSize:9,color:CLR_D[k],opacity:0.7}}>{leaders.length>0?leaders.join(', '):'—'}</div>
                  </div>
                ))}
              </div>
              <div style={{height:8,borderRadius:4,overflow:'hidden',display:'flex',marginBottom:8}}>
                {['B','G','Y','R'].map(k=>{
                  const total=teamStats.avg.B+teamStats.avg.G+teamStats.avg.Y+teamStats.avg.R
                  return <div key={k} style={{width:((teamStats.avg[k]/total)*100)+'%',background:CLR[k]}}></div>
                })}
              </div>
              {teamStats.missing.length>0&&(
                <div style={{padding:'8px 12px',background:'#fdf6e3',border:'1px solid #c49a1033',borderRadius:8,fontSize:11,color:'#8a6200'}}>
                  ⚠️ Manjkajoča energija: {teamStats.missing.map(k=>NAMES[k]).join(', ')} — tim bo imel izzive na tem področju
                </div>
              )}
            </div>

            {/* Radar + tabela */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div style={{background:'white',border:'1px solid #e5e0d8',borderRadius:12,padding:'16px',textAlign:'center'}}>
                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',color:'#aaa',marginBottom:8}}>Timski radar</div>
                <div dangerouslySetInnerHTML={{__html:teamRadar(220)}}/>
              </div>
              <div style={{background:'white',border:'1px solid #e5e0d8',borderRadius:12,padding:'16px 20px'}}>
                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',color:'#aaa',marginBottom:12}}>Člani tima</div>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                  <thead>
                    <tr style={{borderBottom:'1px solid #e5e0d8'}}>
                      <th style={{textAlign:'left',padding:'3px 6px',color:'#888',fontWeight:600}}>Ime</th>
                      {['B','R','G','Y'].map(k=><th key={k} style={{textAlign:'center',padding:'3px 6px',color:CLR[k],fontWeight:700}}>{k}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {teamProfiles.map(p=>(
                      <tr key={p.id} style={{borderBottom:'0.5px solid #f0ece4'}}>
                        <td style={{padding:'5px 6px',fontWeight:500}}>{p.ime.split(' ')[0]}</td>
                        {['B','R','G','Y'].map(k=>(
                          <td key={k} style={{textAlign:'center',padding:'5px 6px',color:CLR[k],fontWeight:p.leadColor===k?700:400}}>
                            {p.con[k].toFixed(1)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr style={{borderTop:'2px solid #e5e0d8',background:'#f9f7f4'}}>
                      <td style={{padding:'5px 6px',fontWeight:700,fontSize:10,color:'#888'}}>AVG</td>
                      {['B','R','G','Y'].map(k=>(
                        <td key={k} style={{textAlign:'center',padding:'5px 6px',color:CLR[k],fontWeight:700}}>{teamStats.avg[k].toFixed(1)}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>)}

          {/* AI sekcije */}
          {loading && (
            <div style={{background:'white',border:'1px solid #e5e0d8',borderRadius:12,padding:24,textAlign:'center',color:'#aaa',marginBottom:14}}>
              ⏳ Generiram analizo tima...
            </div>
          )}

          {Object.keys(analiza).length > 0 && (
            <div>
              <div style={{fontFamily:'Georgia,serif',fontSize:16,fontWeight:600,marginBottom:16,paddingBottom:8,borderBottom:'2px solid #333'}}>
                AI Analiza — {teamProfiles.length} članov
              </div>
              {TIM_SECTIONS.map(sec => sectionCard(sec))}
            </div>
          )}

          {!teamStats && (
            <div style={{background:'white',border:'1px solid #e5e0d8',borderRadius:12,padding:48,textAlign:'center'}}>
              <div style={{fontSize:48,marginBottom:12}}>👥</div>
              <div style={{fontSize:14,color:'#aaa'}}>Izberi vsaj 2 profila za prikaz timske analize</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



// ─── SPORT TIM DASHBOARD ──────────────────────────────────────────────────────
function SportTimDashboard({profiles, onBack}) {
  const [selected, setSelected] = useState(new Set())
  const [analiza, setAnaliza] = useState({})
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')

  const CLR={B:'#4a7ab5',R:'#c94030',G:'#2e8a55',Y:'#c49a10'}
  const CLR_L={B:'#e8f0fa',R:'#faeaea',G:'#e6f5ee',Y:'#fdf6e3'}
  const CLR_D={B:'#1a4a7a',R:'#a8291a',G:'#1a5c38',Y:'#8a6200'}
  const NAMES={B:'Analitična modra',R:'Aktivna rdeča',G:'Stabilna zelena',Y:'Navdušena rumena'}

  const SPORT_TIM_SECTIONS = [
    {id:'kemija', label:'Kemija ekipe'},
    {id:'vloge', label:'Vloge v ekipi'},
    {id:'trening', label:'Kako voditi trening'},
    {id:'predtekma', label:'Pred-tekma protokol'},
    {id:'kriza', label:'Krizni moment'},
    {id:'posameznik', label:'Kako delati s posameznikom'},
  ]

  const sportProfiles = profiles.filter(p => (p.mode||'podjetje') === 'sport')

  const teamProfiles = sportProfiles
    .filter(p => selected.has(p.id))
    .map(p => {
      const con = p.con || {B:0,G:0,Y:0,R:0}
      const sorted = ['B','R','G','Y'].map(k=>({k,v:con[k]})).sort((a,b)=>b.v-a.v)
      return {...p, con, leadColor: sorted[0].k, sec: sorted[1].k}
    })

  const teamStats = teamProfiles.length > 0 ? {
    avg: {
      B: parseFloat((teamProfiles.reduce((s,p)=>s+p.con.B,0)/teamProfiles.length).toFixed(2)),
      R: parseFloat((teamProfiles.reduce((s,p)=>s+p.con.R,0)/teamProfiles.length).toFixed(2)),
      G: parseFloat((teamProfiles.reduce((s,p)=>s+p.con.G,0)/teamProfiles.length).toFixed(2)),
      Y: parseFloat((teamProfiles.reduce((s,p)=>s+p.con.Y,0)/teamProfiles.length).toFixed(2)),
    },
    missing: ['B','R','G','Y'].filter(k => teamProfiles.every(p=>p.con[k] < 2.5)),
  } : null

  function toggleProfile(id) {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
    setAnaliza({})
  }

  async function generirajAnalizo() {
    if(teamProfiles.length < 2) return
    setLoading(true)
    setAnaliza({})
    try {
      const teamDesc = teamProfiles.map(p => {
        const snVal = parseFloat(p.sn)
        const snDesc = !isNaN(snVal) && Math.abs(snVal) >= 1.0
          ? (snVal <= -1.0 ? ', zaznavni tip' : ', intuitivni tip') : ''
        const pozDesc = p.pozicija ? `, pozicija: ${p.pozicija}` : ''
        const sportDesc = p.sport ? `, šport: ${p.sport}` : ''
        return `${p.ime}: analitičnost=${p.con.B.toFixed(1)}/6, odločnost=${p.con.R.toFixed(1)}/6, empatija=${p.con.G.toFixed(1)}/6, optimizem=${p.con.Y.toFixed(1)}/6${snDesc}${pozDesc}${sportDesc}`
      }).join('\n')

      const prompt = `Ekipa ${teamProfiles.length} športnikov — analiza za trenerja.

ČLANI IN NJIHOVE VREDNOSTI:
${teamDesc}

POVPREČJE EKIPE: analitičnost=${teamStats.avg.B} odločnost=${teamStats.avg.R} empatija=${teamStats.avg.G} optimizem=${teamStats.avg.Y}

PRAVILA:
- Piši direktno trenerju — "ti", ne tretja oseba
- Brez omenjanja barv — opisuj vedenjske tipe
- Člane imenuj po imenu
- Konkretno in actionable — kar trener naredi jutri

Generiraj analizo. Vsako sekcijo začni TOČNO z [SEKCIJA:id].

[SEKCIJA:kemija]
5-6 povedi. Opiši kemijo te ekipe — kdo se naravno dopolnjuje, kje so potencialne napetosti med posamezniki. Po imenih, konkretno.

[SEKCIJA:vloge]
Idealne vloge za vsakega člana. Format: **Ime** (pozicija) - Vloga v ekipi in zakaj glede na profil. Brez barv.

[SEKCIJA:trening]
5-6 povedi. Kako voditi trening za to specifično ekipo — tempo, komunikacija, kako dati feedback različnim tipom. Konkretni nasveti za trenerja.

[SEKCIJA:predtekma]
5-6 povedi. Pred-tekma protokol za to ekipo — kako jih pripraviti, motivirati, fokusirati. Upoštevaj različne tipe v ekipi. Konkretno.

[SEKCIJA:kriza]
4-5 povedi. Ko je rezultat tesen ali ekipa v krizi — kdo prevzame vodstvo, kako trener ukrepa, na koga se zanese. Po imenih.

[SEKCIJA:posameznik]
Za vsakega člana kratek napotki za trenerja. Format:
**Ime** (pozicija)
- Kako komunicirati: en stavek
- Kako motivirati: en stavek
- Izogibaj se: en stavek`

      const r = await fetch('/api/claude', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          system:'Si ekspert za športno psihologijo in ekipno dinamiko. Pišeš v slovenščini, direktno trenerju, sproščeno a strokovno. Konkretno — kar trener naredi jutri na treningu.',
          prompt
        })
      })
      const data = await r.json()
      const raw = data.text || ''
      const parts = raw.split(/\[SEKCIJA:(\w+)\]/)
      const result = {}
      for(let i=1;i<parts.length;i+=2){
        const id=parts[i].trim()
        const txt=(parts[i+1]||'').trim()
        if(id&&txt) result[id]=txt
      }
      setAnaliza(result)
    } catch(e) {
      console.error('Sport Tim analiza napaka:', e)
    }
    setLoading(false)
  }

  async function handleSportTimPdf() {
    if(teamProfiles.length < 2) return
    setPdfLoading(true)
    try {
      const r = await fetch('/api/pdf-sport-tim', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          teamProfiles,
          teamStats,
          analiza,
          date: new Date().toLocaleDateString('sl-SI',{day:'numeric',month:'long',year:'numeric'})
        })
      })
      if(!r.ok) throw new Error('PDF Sport Tim napaka')
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href=url
      a.download=`sport-tim-${new Date().toISOString().slice(0,10)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch(e) {
      alert('PDF napaka: '+e.message)
    }
    setPdfLoading(false)
  }

  async function handleSportTimHtml() {
    setPdfLoading(true)
    try {
      const r = await fetch('/api/html-report-sport-tim', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          analiza,
          members: teamProfiles.map(p => ({ime: p.ime, con: p.con}))
        })
      })
      if(!r.ok) throw new Error('Šport Tim HTML napaka')
      const html = await r.text()
      const blob = new Blob([html], {type:'text/html;charset=utf-8'})
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href=url
      a.download=`barvni-kompas-sport-tim-${new Date().toISOString().slice(0,10)}.html`
      a.click()
      URL.revokeObjectURL(url)
    } catch(e) { alert('Šport Tim HTML napaka: '+e.message) }
    setPdfLoading(false)
  }


  function startEdit(id, txt) { setEditingId(id); setEditingText(txt) }
  function cancelEdit() { setEditingId(null); setEditingText('') }
  function saveEdit(id) {
    setAnaliza(prev=>({...prev,[id]:editingText}))
    setEditingId(null)
    setEditingText('')
  }

  const sectionCard = (sec) => {
    const txt = analiza[sec.id] || ''
    const isEditing = editingId === sec.id
    const isBold = ['vloge','posameznik'].includes(sec.id)

    return (
      <div key={sec.id} style={{background:'white',border:'1px solid #e5e0d8',borderRadius:12,padding:'16px 20px',marginBottom:14}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div style={{fontFamily:'Georgia,serif',fontSize:14,fontWeight:600,color:'#1a1a1a'}}>{sec.label}</div>
          <div style={{display:'flex',gap:6}}>
            {!isEditing && txt && (
              <button onClick={()=>startEdit(sec.id,txt)} style={{padding:'3px 10px',background:'none',border:'1px solid #e5e0d8',borderRadius:20,fontSize:11,color:'#888',cursor:'pointer',fontFamily:'inherit'}}>✏️ Uredi</button>
            )}
            {isEditing && (<>
              <button onClick={()=>saveEdit(sec.id)} style={{padding:'3px 10px',background:'#181818',color:'white',border:'none',borderRadius:20,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>✓ Shrani</button>
              <button onClick={cancelEdit} style={{padding:'3px 10px',background:'none',border:'1px solid #e5e0d8',borderRadius:20,fontSize:11,color:'#888',cursor:'pointer',fontFamily:'inherit'}}>✕</button>
            </>)}
          </div>
        </div>
        {isEditing ? (
          <textarea value={editingText} onChange={e=>setEditingText(e.target.value)}
            style={{width:'100%',minHeight:120,padding:'10px 12px',border:'1px solid #e5e0d8',borderRadius:8,fontSize:12,lineHeight:1.7,fontFamily:'inherit',resize:'vertical',outline:'none',boxSizing:'border-box'}}
          />
        ) : txt ? (
          <div style={{display:'flex'}}>
            <div style={{width:3,background:'#2e8a55',borderRadius:2,flexShrink:0,marginRight:12}}></div>
            <div style={{flex:1,fontSize:12,color:'#4a4a4a',lineHeight:1.8}}>{txt}</div>
          </div>
        ) : (
          <div style={{fontSize:12,color:'#ccc',fontStyle:'italic'}}>Ni generirano</div>
        )}
      </div>
    )
  }

  return (
    <div style={{fontFamily:'system-ui,sans-serif',maxWidth:1000,margin:'0 auto',padding:'0 20px 60px',background:'#f7f5f1',minHeight:'100vh'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'24px 0 20px',borderBottom:'1px solid #e5e0d8',marginBottom:24}}>
        <button onClick={onBack} style={{padding:'6px 14px',background:'none',border:'1px solid #e5e0d8',borderRadius:20,fontSize:11,color:'#888',cursor:'pointer',fontFamily:'inherit'}}>← Nazaj</button>
        <div style={{fontFamily:'Georgia,serif',fontSize:20,fontWeight:600}}>⚽ Športni tim dashboard</div>
        <div style={{fontSize:12,color:'#aaa',marginLeft:'auto'}}>{selected.size} izbranih / {sportProfiles.length} športnih profilov</div>
      </div>

      {sportProfiles.length === 0 ? (
        <div style={{background:'white',border:'1px solid #e5e0d8',borderRadius:16,padding:48,textAlign:'center'}}>
          <div style={{fontSize:48,marginBottom:12}}>⚽</div>
          <div style={{fontSize:14,color:'#aaa'}}>Ni športnih profilov. Dodaj profile z načinom "⚽ Šport".</div>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:20}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',color:'#aaa',marginBottom:8}}>Izberi člane ekipe</div>
            {sportProfiles.map(p => {
              const con = p.con || {B:0,G:0,Y:0,R:0}
              const lc = ['B','R','G','Y'].map(k=>({k,v:con[k]})).sort((a,b)=>b.v-a.v)[0].k
              const isSelected = selected.has(p.id)
              return (
                <div key={p.id} onClick={()=>toggleProfile(p.id)} style={{
                  background:isSelected?CLR_L[lc]:'white',
                  border:`1.5px solid ${isSelected?CLR[lc]:'#e5e0d8'}`,
                  borderRadius:10,padding:'9px 13px',marginBottom:7,cursor:'pointer'
                }}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:CLR[lc],flexShrink:0}}></div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,color:'#1a1a1a'}}>{p.ime}</div>
                      <div style={{fontSize:10,color:'#aaa'}}>{p.sport||''}{p.pozicija?' · '+p.pozicija:''}</div>
                    </div>
                    {isSelected&&<div style={{color:CLR[lc],fontSize:14,fontWeight:700}}>✓</div>}
                  </div>
                </div>
              )
            })}

            <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:8}}>
              {selected.size >= 2 ? (<>
                <button onClick={generirajAnalizo} disabled={loading} style={{
                  width:'100%',padding:'11px',background:'#2e8a55',color:'white',border:'none',
                  borderRadius:10,fontSize:13,fontWeight:500,cursor:loading?'default':'pointer',fontFamily:'inherit',opacity:loading?0.7:1
                }}>
                  {loading?'⏳ Generiram...':'🔍 Generiraj analizo'}
                </button>
                {Object.keys(analiza).length > 0 && (
                  <button onClick={handleSportTimPdf} disabled={pdfLoading} style={{
                    width:'100%',padding:'11px',background:'#1a5c38',color:'white',border:'none',
                    borderRadius:10,fontSize:13,fontWeight:500,cursor:pdfLoading?'default':'pointer',fontFamily:'inherit',opacity:pdfLoading?0.7:1
                  }}>
                    {pdfLoading?'⏳ Generiram PDF...':'⚽ Izvozi Šport Tim PDF'}
                  </button>
                )}
              </>) : (
                <div style={{fontSize:11,color:'#aaa',textAlign:'center',padding:'8px 0'}}>Izberi vsaj 2 profila</div>
              )}
            </div>
          </div>

          <div>
            {teamStats && (
              <div style={{background:'white',border:'1px solid #e5e0d8',borderRadius:12,padding:'16px 20px',marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',color:'#aaa',marginBottom:14}}>Profili ekipe</div>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                  <thead>
                    <tr style={{borderBottom:'1px solid #e5e0d8'}}>
                      <th style={{textAlign:'left',padding:'4px 8px',color:'#888',fontWeight:600}}>Ime</th>
                      <th style={{textAlign:'left',padding:'4px 8px',color:'#888',fontWeight:600}}>Pozicija</th>
                      {['B','R','G','Y'].map(k=><th key={k} style={{textAlign:'center',padding:'4px 8px',color:CLR[k],fontWeight:700}}>{k}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {teamProfiles.map(p=>(
                      <tr key={p.id} style={{borderBottom:'0.5px solid #f0ece4'}}>
                        <td style={{padding:'6px 8px',fontWeight:500}}>{p.ime}</td>
                        <td style={{padding:'6px 8px',color:'#888',fontSize:10}}>{p.pozicija||p.sport||'—'}</td>
                        {['B','R','G','Y'].map(k=>(
                          <td key={k} style={{textAlign:'center',padding:'6px 8px',color:CLR[k],fontWeight:p.leadColor===k?700:400}}>
                            {p.con[k].toFixed(1)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr style={{borderTop:'2px solid #e5e0d8',background:'#f9f7f4'}}>
                      <td colspan="2" style={{padding:'6px 8px',fontWeight:700,color:'#888',fontSize:10}}>POVPREČJE</td>
                      {['B','R','G','Y'].map(k=>(
                        <td key={k} style={{textAlign:'center',padding:'6px 8px',color:CLR[k],fontWeight:700}}>{teamStats.avg[k].toFixed(1)}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {loading && (
              <div style={{background:'white',border:'1px solid #e5e0d8',borderRadius:12,padding:24,textAlign:'center',color:'#aaa',marginBottom:14}}>
                ⏳ Generiram analizo ekipe...
              </div>
            )}

            {Object.keys(analiza).length > 0 && (
              <div>
                <div style={{fontFamily:'Georgia,serif',fontSize:16,fontWeight:600,marginBottom:16,paddingBottom:8,borderBottom:'2px solid #2e8a55'}}>
                  ⚽ Analiza ekipe — {teamProfiles.length} članov
                </div>
                {SPORT_TIM_SECTIONS.map(sec => sectionCard(sec))}
              </div>
            )}

            {!teamStats && (
              <div style={{background:'white',border:'1px solid #e5e0d8',borderRadius:12,padding:48,textAlign:'center'}}>
                <div style={{fontSize:48,marginBottom:12}}>⚽</div>
                <div style={{fontSize:14,color:'#aaa'}}>Izberi vsaj 2 športna profila za analizo</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminApp() {
  const [loggedIn,setLoggedIn]=useState(false)
  const [profiles,setProfiles]=useState([])
  const [selected,setSelected]=useState(null)
  const [apiKey,setApiKey]=useState(()=>localStorage.getItem('insights_api_key')||'')
  const [texts,setTexts]=useState({})
  const [generating,setGenerating]=useState(null)
  const [queuedIds,setQueuedIds]=useState([])
  const [generated,setGenerated]=useState(new Set())
  const [checkedSections,setCheckedSections]=useState(new Set(['stil','inter','odl','pred','slab','pritisk','slepe','tim','okol','motiv','kom','razv','naspr','vodenje','motivacija','intervju','digital','stres','regen','prod_uvod','prod_mocne','prod_slepe','prod_tip','prod_akcija']))
  const [pdfLoading,setPdfLoading]=useState(false)
  const [view,setView]=useState('list') // 'list' | 'profile' | 'preview'
  const [editProfile,setEditProfile]=useState(null) // profil ki ga urejamo
  const [filterTim,setFilterTim]=useState('') // filter po timu
  const [mode,setMode]=useState('podjetje') // 'podjetje' | 'sport'
  const [editingId,setEditingId]=useState(null)
  const [editingText,setEditingText]=useState('')


  useEffect(()=>{
    if(loggedIn) loadProfiles()
  },[loggedIn])

  async function loadProfiles() {
    const r=await fetch('/api/admin/profiles',{headers:{'x-admin-key':'insights2024'}})
    const d=await r.json()
    setProfiles(d.profiles||[])
  }

  async function deleteProfile(id) {
    try {
      await fetch('/api/admin/delete-profile',{method:'POST',headers:{'Content-Type':'application/json','x-admin-key':'insights2024'},body:JSON.stringify({id})})
      loadProfiles()
    } catch(e) { alert('Napaka pri brisanju: '+e.message) }
  }

  function openProfile(p) {
    // Izračunaj scores
    const {con,uncon}=calcScores(p.answers, p.con, p.uncon)
    const typeName=getType(con)
    const typeData=TYPES[typeName]
    const variant=getVariant(con)
    const {flow,total}=calcFlow(con,uncon)
    const sorted=[{k:'B',v:con.B},{k:'R',v:con.R},{k:'G',v:con.G},{k:'Y',v:con.Y}].sort((a,b)=>b.v-a.v)
    const leadColor=sorted[0].k, sec=sorted[1].k
    const profileMode = p.mode||'podjetje'
    setSelected({...p,con,uncon,typeName,typeData,variant,flow,total,leadColor,sec,sn:p.sn||'',mode:profileMode,pozicija:p.pozicija||'',sport:p.sport||''})
    const savedTexts = p.texts||{}
    setTexts(savedTexts)
    setGenerated(new Set(Object.keys(savedTexts)))
    setQueuedIds([])
    setGenerating(null)
    // Nastavi privzete sekcije glede na mode
    if(profileMode==='sport') {
      setCheckedSections(new Set(['sport_trening','sport_mentalna','sport_motivacija','sport_vloga','sport_slacilnica','sport_trener','sport_razvoj','sport_soigralci','sport_stres','sport_regen']))
    } else {
      setCheckedSections(new Set(['stil','inter','odl','pred','slab']))
    }
    setView('profile')
  }

  const generateNext=useCallback(async(queue,currentTexts,ctx)=>{
    if(!queue.length){setGenerating(null);setQueuedIds([]);return}
    const {ime,con,typeData,variant,leadColor,sec,sn}=ctx
    const ime1=ime.trim().split(' ')[0]

    // S/N parsiranje
    const snParsed = (()=>{
      if(!sn && sn !== 0) return null
      // Podpira dva formata: "-1.5" (novo) ali "S=3.5" (staro)
      let type, score
      const oldFmt = String(sn).match(/^([SNU])=([\d.]+)$/)
      if(oldFmt) {
        type = oldFmt[1]; score = parseFloat(oldFmt[2])
        // Pretvori stari format v nov bipolarni score
        if(type==='S') score = -score; else if(type==='U') score = 0
      } else {
        score = parseFloat(sn)
        if(isNaN(score)) return null
        type = score >= 0.5 ? 'N' : score <= -0.5 ? 'S' : 'U'
      }
      const abs = Math.abs(score)
      // Intenzitetni opisi — diferenciacija med 0.5 in 1.5 in 2.5
      const intDesc = abs >= 2.5 ? 'izrazito' : abs >= 1.5 ? 'zmerno' : abs >= 0.5 ? 'rahlo' : 'uravnoteženo'
      if(type==='S') return {
        type:'S', label:'Zaznavanje', score,
        desc:`Zaznavanje (score=${score}, ${intDesc}) — konkretno, dejstveno, korak-za-korakom, sedanjost, preizkušene metode`,
        writing: abs >= 2.5 ? 'Piši IZRAZITO konkretno in dejstveno. Samo preverjena dejstva, konkretni primeri iz prakse, korak-po-korak razlage. Brez abstrakcij.' :
                 abs >= 1.5 ? 'Piši konkretno in praktično. Prednostno dejstva pred abstrakcijami, primeri iz prakse.' :
                 'Rahlo nagnjeno k zaznavanju — piši pretežno konkretno, a dopusti malo abstraktnega.'
      }
      if(type==='N') return {
        type:'N', label:'Intuicija', score,
        desc:`Intuicija (score=+${score}, ${intDesc}) — vzorci, možnosti, prihodnost, notranji občutek, inovativnost`,
        writing: abs >= 2.5 ? 'Piši IZRAZITO vizionarsko. Globji pomeni, prihodnostna perspektiva, vzorci in možnosti. Minimalno konkretnih detajlov.' :
                 abs >= 1.5 ? 'Piši vizionarsko in s poudarkom na možnostih in prihodnosti.' :
                 'Rahlo nagnjeno k intuiciji — piši pretežno vizionarsko, a vključi konkretne primere.'
      }
      return {type:'U', label:'Uravnotežen', score:0, desc:'Uravnotežen S/N — enakomerno med zaznavanjem in intuicijo', writing:'Piši uravnoteženo — kombiniraj konkretne primere z globljimi pomeni.'}
    })()
    const sorted4=[{k:'B',v:con.B},{k:'R',v:con.R},{k:'G',v:con.G},{k:'Y',v:con.Y}].sort((a,b)=>b.v-a.v)
    const above3=['B','R','G','Y'].filter(k=>con[k]>=3.0)
    const variantDesc = variant==='Prilagodljiv tip'
      ? `Prilagodljiv tip — vrednosti: ${above3.map(k=>k+'='+con[k].toFixed(1)).join(', ')} (vse nad 3.0). NAVODILO ZA PISANJE: Ta oseba je generalist ki se naravno prilagaja situaciji. Poudarij fleksibilnost, vsestranskost in sposobnost razumevanja različnih perspektiv. Besedilo naj opisuje kako se vedenjski vzorci prepletajo — analitičnost, odločnost, empatija, ustvarjalnost — glede na kontekst. NE omenjaj barv, NE opisuj samo ene lastnosti.`
      : variant==='Klasičen tip'
      ? `Klasičen tip — dve dominantni področji (${above3.map(k=>k+'='+con[k].toFixed(1)).join(' in ')}). NAVODILO: Opiši kako se ti dve vedenjski področji dopolnjujeta in ustvarjata specifičen stil te osebe. NE omenjaj barv.`
      : `Osredotočen tip — ena dominantna lastnost (${sorted4[0].k}=${sorted4[0].v.toFixed(1)}, ostale pod 3.0). NAVODILO: Besedilo mora biti izrazito specifično — ta oseba ima zelo izrazit profil. Opiši intenziteto te dominantne lastnosti in kaj to pomeni v praksi. NE omenjaj barv, NE piši generično.`
    const pct=(v)=>Math.round((v/6)*100)
    const intensity=(v)=>v>=5.0?'izjemno visoka — naravna dominanta':v>=4.0?'visoka — naravna prednost':v>=3.0?'zmerna — zavestno področje':v>=2.0?'nizka — razvoj potreben':'zelo nizka — senčna energija'
    const gap=parseFloat((con[leadColor]-(con[sec]||0)).toFixed(2))
    const gapDesc=gap>=2.0?'zelo izrazita dominanca':gap>=1.0?'jasna dominanca':'subtilna dominanca'

    // Senčne energije — kaj osebi manjka (pod 2.5)
    const shadowMap = {B:'analitična natančnost',R:'odločnost in direktnost',G:'empatija in potrpežljivost',Y:'spontanost in optimizem'}
    const shadows = sorted4.filter(e=>e.v<2.5).map(e=>shadowMap[e.k])
    const shadowDesc = shadows.length>0 ? 'Senčne energije (pod 2.5 — slepe pege): '+shadows.join(', ') : 'Ni izrazitih senčnih energij'

    // Razmerje vseh 4 energij — fingerprint profila
    const allRatios = sorted4.map(e=>e.k+'='+e.v.toFixed(1)).join(', ')
    const spreadDesc = (()=>{
      const vals = sorted4.map(e=>e.v)
      const spread = vals[0]-vals[3]
      if(spread>=3.5) return 'zelo razpršen profil (razpon '+spread.toFixed(1)+') — izjemno izrazite razlike med energijami'
      if(spread>=2.5) return 'razpršen profil (razpon '+spread.toFixed(1)+') — jasne razlike med energijami'
      if(spread>=1.5) return 'zmerno razpršen profil (razpon '+spread.toFixed(1)+') — subtilne razlike'
      return 'kompakten profil (razpon '+spread.toFixed(1)+') — vse energije relativno blizu — pisati bolj uravnoteženo'
    })()

    // Tretja energija — pogosto spregledana a pomembna
    const third = sorted4[2]
    const thirdDesc = third.v>=3.0 ? 'Tretja energija '+third.k+'='+third.v.toFixed(1)+' je zavestno področje — vpliva na vedenje v specifičnih situacijah'
      : third.v>=2.0 ? 'Tretja energija '+third.k+'='+third.v.toFixed(1)+' je v ozadju — pojavlja se redko'
      : 'Tretja energija '+third.k+'='+third.v.toFixed(1)+' je senčna — skoraj ni opazna'
    // Vodstveni stil po barvi (Leadership PPT slide 5-8)
    const ledR = 'Rdeča vodstvena prednost: pragmatičen v odločanju, direkten in jedrnat, hitro sproži akcijo, jasno določi kdo kaj naredi in kdaj'
    const ledG = 'Zelena vodstvena prednost: ustvarja idealno okolje, podpira in pomaga, spoštuje vrednote in izbire drugih, ne pretirava z avtoriteto'
    const ledY = 'Rumena vodstvena prednost: vključuje ljudi, vizionira prihodnost, deluje kot katalizator rasti, navdušujoč in spodbuden'
    const ledB = 'Modra vodstvena prednost: metodičen in natančen, odločitve temelji na dejstvih, daje čas za premislek, dosleden in premišljen'

    // "Dober dan" po barvi in intenziteti (slide 9)
    const goodB = con.B>=5.0 ? 'Dober dan (B='+con.B+'): izjemno dosleden, načelen, objektiven — model zanesljivosti za tim'
      : con.B>=4.0 ? 'Dober dan (B='+con.B+'): premišljen, principialen, skrben — tim ga ceni kot stabilno točko'
      : con.B>=3.0 ? 'Dober dan (B='+con.B+'): thoughtful pristop, zmerna doslednost, uravnoteži analizo z akcijo'
      : 'Modra na dobrem dnevu (B='+con.B+'): minimalen vpliv te energije'
    const goodR = con.R>=5.0 ? 'Dober dan (R='+con.R+'): izjemno odločen, fokusiran, proaktiven — tim ga sledi brez oklevanja'
      : con.R>=4.0 ? 'Dober dan (R='+con.R+'): pogumen, ciljno usmerjen, jasno vodi — tim ve kaj se pričakuje'
      : con.R>=3.0 ? 'Dober dan (R='+con.R+'): zmerna odločnost, sproži akcijo ko je potrebno'
      : 'Rdeča na dobrem dnevu (R='+con.R+'): minimalen vpliv te energije'
    const goodG = con.G>=5.0 ? 'Dober dan (G='+con.G+'): izjemno spoštljiv, vrednoten, servisno naravnan — gradi globoko zaupanje'
      : con.G>=4.0 ? 'Dober dan (G='+con.G+'): cenječ, skrben, podpirajoč — tim se počuti slišan'
      : con.G>=3.0 ? 'Dober dan (G='+con.G+'): zmerna empatija, vzdržuje harmonijo brez pretiranega ugajanja'
      : 'Zelena na dobrem dnevu (G='+con.G+'): minimalen vpliv te energije'
    const goodY = con.Y>=5.0 ? 'Dober dan (Y='+con.Y+'): izjemno spodbujajoč, dinamičen, navdušujoč — tim nabije z energijo'
      : con.Y>=4.0 ? 'Dober dan (Y='+con.Y+'): angažirajoč, adaptabilen, vizionarski — tim sledi z navdušenjem'
      : con.Y>=3.0 ? 'Dober dan (Y='+con.Y+'): zmerna energija, vnaša optimizem ko je potreben'
      : 'Rumena na dobrem dnevu (Y='+con.Y+'): minimalen vpliv te energije'

    // "Slab dan" po barvi in intenziteti (slide 10) — diferencirano
    const badB = con.B>=5.5 ? 'Slab dan (B='+con.B+'): pretirano analizira, obtičí v intelektualnem zastoju, se togo drži protokola, se izgubi v podrobnostih, postane nit-picker — paraliza z analizo'
      : con.B>=4.5 ? 'Slab dan (B='+con.B+'): preveč analizira pred akcijo, rigidno sledi postopkom, tim frustrira s pretirano podrobnostjo'
      : con.B>=3.5 ? 'Slab dan (B='+con.B+'): v stresu se umakne v analizo in postane zadržan, videti hladen in odmaknjen'
      : con.B>=2.5 ? 'Slab dan (B='+con.B+'): občasno preveč previden, a le v ekstremnem stresu'
      : 'Modra na slab dan (B='+con.B+'): minimalen negativen vpliv'
    const badR = con.R>=5.5 ? 'Slab dan (R='+con.R+'): pretirano direkten do mere agresivnosti, zavrača mnenja, je prisilen in kontrolirajoč, sprejema prenagljene odločitve, prevzame vse — destruktivno za tim'
      : con.R>=4.5 ? 'Slab dan (R='+con.R+'): postane preveč direkten, odriva nasprotujoča mnenja, nestrpen s počasnimi procesi'
      : con.R>=3.5 ? 'Slab dan (R='+con.R+'): pritiska na tim, zahteva hitrost ki ni vedno možna'
      : con.R>=2.5 ? 'Slab dan (R='+con.R+'): redko, a v visokem stresu postane nepotrpežljiv'
      : 'Rdeča na slab dan (R='+con.R+'): minimalen negativen vpliv'
    const badG = con.G>=5.5 ? 'Slab dan (G='+con.G+'): ne postavi stališča, poskuša ugoditi vsem, izgubi smer, postane neodločen in podredljiv — tim ostane brez vodenja'
      : con.G>=4.5 ? 'Slab dan (G='+con.G+'): izogiba se konfliktu, preveč prilagodljiv, ne sprejme odločitve pravočasno'
      : con.G>=3.5 ? 'Slab dan (G='+con.G+'): okleva pri nepopularnih odločitvah, išče soglasje ko ni časa'
      : con.G>=2.5 ? 'Slab dan (G='+con.G+'): redko, a v stresu postane preveč obziren'
      : 'Zelena na slab dan (G='+con.G+'): minimalen negativen vpliv'
    const badY = con.Y>=5.5 ? 'Slab dan (Y='+con.Y+'): preveč vključuje druge, se izgubi v stranskih temah, nima fokusa, izgubi zanimanje, prevzame preveč — tim zmeden brez jasne smeri'
      : con.Y>=4.5 ? 'Slab dan (Y='+con.Y+'): razpršen, preskakuje med idejami, pozablja na podrobnosti in sledenje'
      : con.Y>=3.5 ? 'Slab dan (Y='+con.Y+'): v stresu postane preglasna, vznemirljiva, izgubi rdečo nit'
      : con.Y>=2.5 ? 'Slab dan (Y='+con.Y+'): občasno prenagljena obljuba, a redko'
      : 'Rumena na slab dan (Y='+con.Y+'): minimalen negativen vpliv'

    // SN vedenjski opisi — vplivajo na dejanski opis vedenja v sekcijah
    const snBehavior = snParsed ? (()=>{
      const abs = Math.abs(snParsed.score)
      if(snParsed.type==='S') {
        if(abs >= 2.5) return {
          stil: 'Pri delu se IZRAZITO zanaša na konkretne izkušnje in preizkušene metode. Naloge rešuje korak-za-korakom. Ne rad improvizira ali eksperimentira brez preverjenih temeljev.',
          odl: 'Odločitve sprejema na podlagi konkretnih podatkov in precedentov. Nejasne situacije brez jasnih parametrov ga/jo motijo. Potrebuje dejstva, ne intuicije.',
          motiv: 'Motivirajo ga/jo konkretni, merljivi rezultati in jasno definirane naloge. Demotivira ga/jo abstraktno razmišljanje brez praktične vrednosti.',
          naspr: 'Posebej težko komunicira z izrazito intuitivnimi osebami ki skačejo med idejami brez jasnega plana.'
        }
        if(abs >= 1.5) return {
          stil: 'Pri delu preferira konkretne naloge z jasnimi koraki. Zaupa preizkušenim metodam in izkušnjam.',
          odl: 'Odločitve temelji na dejstvih in preteklih izkušnjah. Nejasne situacije rešuje s strukturiranim pristopom.',
          motiv: 'Motivirajo ga/jo jasno definirani cilji in merljiv napredek.',
          naspr: 'Težje razume kolege ki delajo intuitivno brez jasnega plana.'
        }
        return {
          stil: 'Rahlo nagnjeno k zaznavanju — nekoliko preferira konkretno pred abstraktnim.',
          odl: 'Rahla preferenca za dejstveno odločanje pred intuitivnim.',
          motiv: 'Nekoliko bolj motiviran/a s konkretnimi nalogami.',
          naspr: 'Manjše napetosti z intuitivnimi tipi.'
        }
      }
      if(snParsed.type==='N') {
        if(abs >= 2.5) return {
          stil: 'Pri delu se IZRAZITO zanaša na intuicijo in iskanje vzorcev. Hitro vidi priložnosti in možnosti. Rutinske naloge ga/jo dolgočasijo. Rad/a eksperimentira in brezhitro preskakuje med idejami.',
          odl: 'Odločitve sprejema na podlagi notranjega občutka in prepoznavanja vzorcev. Dejstva ga/jo podpirajo, ne vodijo. Včasih odloči pred vsemi informacijami.',
          motiv: 'Motivirajo ga/jo inovativni projekti, vizija in možnosti. Demotivira ga/jo repetitivno rutinsko delo brez smisla.',
          naspr: 'Posebej težko komunicira z izrazito zaznavnimi osebami ki zahtevajo podrobne korake brez prostora za improvizacijo.'
        }
        if(abs >= 1.5) return {
          stil: 'Preferira vizionarsko razmišljanje in iskanje novih možnosti. Rad/a vidi celotno sliko pred podrobnostmi.',
          odl: 'Odločitve pogosto temelji na intuiciji in prepoznavanju vzorcev. Ceni kreativne rešitve.',
          motiv: 'Motivirajo ga/jo inovativni izzivi in priložnosti za ustvarjalnost.',
          naspr: 'Včasih frustriran/a z osebami ki zahtevajo preveč podrobnosti pred akcijo.'
        }
        return {
          stil: 'Rahlo nagnjeno k intuiciji — nekoliko preferira celostno sliko pred podrobnostmi.',
          odl: 'Rahla preferenca za intuitivno odločanje.',
          motiv: 'Nekoliko bolj motiviran/a z inovativnimi nalogami.',
          naspr: 'Manjše napetosti z zaznavnimi tipi.'
        }
      }
      return {
        stil: 'Uravnotežen med zaznavanjem in intuicijo — prilagodi pristop glede na situacijo.',
        odl: 'Enakomerno uporablja dejstva in intuicijo pri odločanju.',
        motiv: 'Motivirajo ga/jo tako konkretni kot abstraktni izzivi.',
        naspr: 'Relativno dobro razume oba stila razmišljanja.'
      }
    })() : null

        const base=`Ime: ${ime1}
BARVNI PROFIL — vse vrednosti (${allRatios}):
- Blue: ${con.B}/6 (${pct(con.B)}. percentil) — ${intensity(con.B)}
- Green: ${con.G}/6 (${pct(con.G)}. percentil) — ${intensity(con.G)}
- Yellow: ${con.Y}/6 (${pct(con.Y)}. percentil) — ${intensity(con.Y)}
- Red: ${con.R}/6 (${pct(con.R)}. percentil) — ${intensity(con.R)}
Primarna: ${sorted4[0].k}=${sorted4[0].v.toFixed(2)}, Sekundarna: ${sorted4[1].k}=${sorted4[1].v.toFixed(2)}, razlika ${gap} (${gapDesc}).
${thirdDesc}
${shadowDesc}
Razpršenost: ${spreadDesc}
Tip: ${typeData.sl}. ${variantDesc}

VODSTVENI PROFIL (za sekcije vodenje, motivacija, pritisk, slepe, slab):
Primarna energija — vodstvena prednost: ${sorted4[0].k==='R'?ledR:sorted4[0].k==='G'?ledG:sorted4[0].k==='Y'?ledY:ledB}
Sekundarna energija — vodstvena prednost: ${sorted4[1].k==='R'?ledR:sorted4[1].k==='G'?ledG:sorted4[1].k==='Y'?ledY:ledB}

DOBER DAN (ko dela na višku svojih moči):
${goodB}
${goodR}
${goodG}
${goodY}

SLAB DAN (ko je pod pritiskom ali prekomerno obremenjen):
${badB}
${badR}
${badG}
${badY}

Kombinacijski učinek: ${sorted4[0].k}=${sorted4[0].v.toFixed(1)} + ${sorted4[1].k}=${sorted4[1].v.toFixed(1)} — ${
  gap>=2.5 ? 'zelo izrazita dominanca primarne energije — na slab dan so njene negativne lastnosti posebej intenzivne' :
  gap>=1.5 ? 'jasna dominanca — negativne lastnosti primarne energije prevladujejo, sekundarna jih blago omili' :
  gap>=0.8 ? 'uravnotežena kombinacija — negativne lastnosti obeh energij se izmenjujejo glede na situacijo' :
  'zelo blizki energiji — negativne lastnosti se prepletajo nepredvidljivo, profil je težje brati'
}
DIFERENCIACIJA OPOMNIK: Profil B=${con.B.toFixed(1)} R=${con.R.toFixed(1)} G=${con.G.toFixed(1)} Y=${con.Y.toFixed(1)} mora dati DRUGACNO besedilo kot B=5.0 R=2.0. Vrednosti so konkretne.
${snParsed ? `S/N OS (${snParsed.label}, score=${snParsed.score}): ${snParsed.desc}. PISANJE: ${snParsed.writing}. Stil: ${snBehavior ? snBehavior.stil : ''}. Odlocitev: ${snBehavior ? snBehavior.odl : ''}. Motivacija: ${snBehavior ? snBehavior.motiv : ''}.` : 'S/N os: ni podatka.'}`
    const BATCHES=[
      {ids:['stil','inter','odl','pritisk','pred','slab','slepe'],prompt:`${base}

Generiraj vse sekcije. Vsako začni z [SEKCIJA:id].

[SEKCIJA:stil]
Odstavek Osebni stil, 7-8 povedi, tretja oseba.

OBVEZNA PRAVILA:
1. Vsak stavek opisuje KONKRETNO OPAZNO VEDENJE — ne lastnosti, ne adjektive
   ✗ NAPAČNO: "Je analitičen in sistematičen"
   ✓ PRAVILNO: "Pred vsakim sestankom si pripravi seznam vprašanj in jih postavi po vrsti"
2. Vsaj 2 stavka opisujeta vedenje ki je SPECIFIČNO za to kombinacijo energij
3. En stavek opisuje kako se obnaša ko stvari ne gredo po načrtu
4. En stavek opisuje kako ga/jo vidijo kolegi

VEDENJSKI ZNAKI (izberi glede na vrednosti):
- B≥4.5: pred odločitvijo zahteva pisne podatke, dela seznam pro/contra, sprašuje "kaj pa če..."
- B 3-4.5: temeljit pri pomembnih stvareh, hitrejši pri rutini
- R≥4.5: govori prvi na sestanku, odloči se med pogovorom, ne mara ponavljanja
- R 3-4.5: direkten ko je potrebno, sicer prilagodljiv
- G≥4.5: najprej vpraša kako se drugi počutijo, odloča počasi, izogiba se konfliktu
- G 3-4.5: pozoren na vzdušje, a ne na škodo učinkovitosti
- Y≥4.5: začne s small talkom, skače med temami, navdušuje se glasno
- Y 3-4.5: optimističen a fokusiran

NE omenjaj barv. NE začni z imenom. NE piši generično.

[SEKCIJA:inter]
Odstavek Interakcija z drugimi, 7-8 povedi, tretja oseba.

OBVEZNA VSEBINA — vsak element mora biti prisoten:
1. Kako se obnaša NA SESTANKIH — govori prvi ali zadnji, koliko prostora zasede, kako posluša
2. Kako reagira na KONFLIKT — se sooči, umakne, posreduje?
3. Kako sprejema KRITIKO — se zapre, analizira, braniš se?
4. Kako daje POHVALO in feedback — direktno, posredno, javno, zasebno?
5. Kakšen je njegov/njen komunikacijski TEMPO — hiter, premišljen, spontan?

DIFERENCIACIJA:
- B≥4: na sestankih čaka s komentarji dokler nima dovolj podatkov, kritiko procesira sam/a preden odgovori
- R≥4: govori direktno in brez olepševanja, konflikt rešuje takoj in frontalno
- G≥4: na sestankih skrbi da so vsi slišani, konflikt ga/jo vznemiri in ga odlaša
- Y≥4: dominira pogovor, skače med temami, feedback daje z navdušenjem

NE omenjaj barv. NE začni z imenom. Vsak stavek = konkretno opazno vedenje.

[SEKCIJA:odl]
Odstavek Sprejemanje odločitev, 6-7 povedi, tretja oseba. DIFERENCIACIJA: Koliko časa potrebuje, kakšne informacije išče, kako reagira na časovni pritisk, ali odloča sam ali išče mnenja — vse mora izhajati iz konkretnih vrednosti. NE začni z imenom.

[SEKCIJA:pritisk]
Odstavek Vedenje pod pritiskom, 7-8 povedi, tretja oseba.

OBVEZNA STRUKTURA:
1. Kaj je SPROŽILEC — katera specifična situacija sproži pritisk (ne "stres" ampak "ko mora odločiti v 10 minutah brez podatkov")
2. PRVA REAKCIJA — kaj naredi v prvih minutah (konkretno vedenje, ne lastnost)
3. Kako se VEDENJE SPREMENI — kaj je drugače kot na "dober dan"
4. Kaj OPAZIJO KOLEGI — konkretno, kaj vidijo od zunaj
5. Kaj POMAGA — katera konkretna intervencija ga/jo vrne nazaj
6. Kako dolgo TRAJA pritisk — minute, ure, dni?

DIFERENCIACIJA (izberi glede na vrednosti):
- B≥4 pod pritiskom: postane pretirano kritičen/na do lastnega dela, zahteva več podatkov, se izolira
- R≥4 pod pritiskom: postane agresiven/na in direktiven/na, prekinja, sprejema hitre odločitve brez posvetovanja
- G≥4 pod pritiskom: se umakne, postane tiho, izogiba se odločitvam, pasivno-agresiven/na
- Y≥4 pod pritiskom: dramatizira, skače med rešitvami, izgubi fokus, postane kaotičen/na

NE omenjaj barv. NE začni z imenom.

NEGATIVNE LASTNOSTI KO JE VSAKA ENERGIJA PREKOMERNO UPORABLJENA — uporabi kot vodilo:
- Prekomerna modra: hladen, trd, neodločen, sumničav, zadržan
- Prekomerna rdeča: agresiven, kontrolirajoč, nestrpen, nadut, brezobziren
- Prekomerna zelena: trm, počasen, podredljiv, brezbarven, odvisen
- Prekomerna rumena: pretiravač, vznemirljiv, nediskretna, kaotičen, prenagljen

Opiši kako se pri ${ime1}u pod stresom njegova primarna in sekundarna energija prekomerno aktivirata in katere SPECIFIČNE negativne lastnosti iz zgornjega seznama se pokažejo. NE začni z imenom.

[SEKCIJA:pred]
Seznam 8 prednosti. Format: **Naslov** - En stavek. DIFERENCIACIJA: Prednosti morajo biti SPECIFIČNE za ta profil — ne generične "analitičnost" ampak "sposobnost zaznavanja napak v podatkih ki jih drugi spregledajo". Vsaka prednost mora biti vezana na konkretne vrednosti.

[SEKCIJA:slab]
Seznam 8 slabosti. Format: **Naslov** - En stavek. DIFERENCIACIJA: Slabosti morajo opisovati SPECIFIČNE situacije kjer se ta profil zatakne — ne generične "počasnost" ampak "v hitrem prodajnem okolju izgubi prednost ker...".

[SEKCIJA:slepe]
Odstavek Slepe pege, 7-8 povedi, tretja oseba.

STRUKTURA (obvezna):
1. Identificiraj 2-3 SPECIFIČNE slepe pege tega profila — glede na dejanske vrednosti
2. Za vsako slepo pego navedi KONKRETNO SITUACIJO v kateri se pokaže — ne abstraktno
3. Opiši kako to VIDIJO DRUGI — kaj si mislijo kolegi/stranke (čeprav je napačno)
4. Navedi zakaj oseba tega NE OPAZI — zakaj je slepa pega slepa

PRIMERI KONKRETNIH SLEPIH PEG (prilagodi profilu):
- Visoka B: ne opazi da njegova/njena analiza paralyze other — kolegi mislijo da ne zaupa odločitvam
- Visoka R: ne opazi da njegova/njena direktnost prizadene — drugi menijo da je nespoštljiv/a
- Visoka G: ne opazi da njegovo/njeno izogibanje konfliktu ustvarja večji problem — tim misli da ni zainteresiran/a
- Visoka Y: ne opazi da njegove/njene obljube ne sledijo — stranke menijo da ni zanesljiv/a
- Nizka R + visoka G: ne opazi da njegova/njena "strpnost" deluje kot pomanjkanje vodstva

Vsaka slepa pega mora biti SPECIFIČNA za to kombinacijo — ne generična lista lastnosti. NE začni z imenom.`},
      {ids:['tim','okol','motiv','kom','razv','naspr','stres','regen'],prompt:`${base}

Generiraj vse sekcije. Vsako začni z [SEKCIJA:id].

[SEKCIJA:tim]
Odstavek Prispevek k timu, 6-7 povedi, tretja oseba. DIFERENCIACIJA: Kakšno SPECIFIČNO vlogo prevzame v timu glede na vrednosti — ne "podpira kolege" ampak "v kriznih situacijah postane...". Opiši kaj tim pridobi in kaj izgubi brez te osebe. NE začni z imenom.

[SEKCIJA:okol]
Odstavek Idealno delovno okolje, 6-7 povedi, tretja oseba. DIFERENCIACIJA: Budi SPECIFIČEN — kakšen tempo, kakšna struktura sestankov, kako pogosto feedback, koliko avtonomije, kakšni kolegi. Razlika med R=5 in G=5 mora biti jasna. NE začni z imenom.

[SEKCIJA:motiv]
Odstavek Motivacija in strahovi, 6-7 povedi, tretja oseba. DIFERENCIACIJA: Navedi KONKRETNE motivatorje — ne "izzivi" ampak "projekti kjer vidi neposreden vpliv v roku 2 tednov". In konkretne strahove — ne "neuspeh" ampak "situacije kjer mora odločati brez zadostnih podatkov". NE začni z imenom.

[SEKCIJA:kom]
Seznam 6 komunikacijskih nasvetov ZA SODELAVCE te osebe. Format: **Naslov** - En stavek. DIFERENCIACIJA: Nasveti morajo biti SPECIFIČNI za ta profil.

OSNOVNA NAVODILA ZA VSAKO ENERGIJO (prilagodi glede na profil):
- Modra dominanta: bodi dobro pripravljen, ne bodi površen pri pomembnih stvareh, daj čas za razmislek
- Rdeča dominanta: bodi direkten in jedrnat, ne oklevaj, osredotoči se na rezultate
- Zelena dominanta: ne pritiskaj za hitre odločitve, bodi potrpežljiv in podpirajoč
- Rumena dominanta: ne vsiljuj rutine, bodi prijazen in odprt, omogoči spontanost

Vsak nasvet mora biti actionable in specifičen za ${ime1}ov profil — ne generičen.

[SEKCIJA:razv]
Odstavek Predlogi za razvoj, 7-8 povedi, tretja oseba.

OBVEZNA STRUKTURA:
1. Identificiraj 1-2 SENČNI ENERGIJI tega profila (tiste z najnižjimi vrednostmi pod 2.5)
2. Za vsako senčno energijo navedi TOČNO ENO tedensko vajo — konkretna, izvedljiva v 15 min:
   - Nizka R (odločnost): "Vsak teden sprejmi eno odločitev brez posvetovanja z drugimi v roku 24 ur"
   - Nizka B (analitičnost): "Pred vsakim večjim nakupom ali odločitvijo zapiši 3 argumente za in proti"
   - Nizka G (empatija): "Enkrat tedensko vpraši sodelavca kako se počuti — brez agende"
   - Nizka Y (spontanost): "Enkrat mesečno sprejmi povabilo ki ga prvotno nisi nameraval sprejeti"
3. Navedi 1 MERLJIV ZNAK napredka — kako bo čez 3 mesece vedel/a da se razvija
4. Priporoči TOČNO 2 vira — navedi naslov IN avtorja. Izberi glede na senčno energijo:
   - Za razvoj R: "Radikalna direktnost" (Kim Scott) ali "Ekstremna odgovornost" (Jocko Willink)
   - Za razvoj B: "Mišljenje, hitro in počasno" (Daniel Kahneman) ali "Superforecasting" (Philip Tetlock)
   - Za razvoj G: "Dati in vzeti" (Adam Grant) ali "Nenasilna komunikacija" (Marshall Rosenberg)
   - Za razvoj Y: "Tekoči um" (Mihaly Csikszentmihalyi) ali "Originali" (Adam Grant)

NE začni z imenom. Priporoči vire ki so PREVEDENI v slovenščino ali dostopni v angleščini.

[SEKCIJA:naspr]
Odstavek Nasprotni tip, 7-8 povedi, tretja oseba.

STRUKTURA (obvezna):
1. PRVI STAVEK: Poimenuj nasprotni tip DIREKTNO po slovenskem imenu (Direktor/Motivator/Inspirator/Pomočnik/Podpornik/Koordinator/Opazovalec/Reformator). Npr: "Njen naravni nasprotni tip je Direktor..."
2. DRUGI-TRETJI STAVEK: Opiši TOČNO KJE pride do napetosti — katera konkretna situacija (npr. "Ko Direktor zahteva odločitev v 5 minutah, se Koordinator zapre...")
3. ČETRTI-PETI STAVEK: Še ena konkretna situacija konflikta iz delovnega okolja
4. ŠESTI-SEDMI STAVEK: 2-3 KONKRETNE strategije — ne "bodi potrpežljiv" ampak "pred skupnim sestankom pošlji agendo dan prej da ima čas za pripravo"

NE piši generično. Vsaka strategija mora biti akcijska — kaj TOČNO naredi.

[SEKCIJA:stres]
Odstavek Stres in opozorilni znaki, 6-7 povedi, tretja oseba.
Opiši: (1) konkretne situacijske sprožilce stresa za ta profil, (2) kako se stres kaže navzven — vedenje, komunikacija, (3) opozorilne znake izgorelosti, (4) kako tim trpi ko je ta oseba pod stresom.
DIFERENCIACIJA: Visoka B → zapre se, postane pretirano kritična. Visoka R → agresivna, kontrolirajoča. Visoka G → umakne se, pasivno-agresivna. Visoka Y → dramatizira, kaotična.
NE začni z imenom.

[SEKCIJA:regen]
Odstavek Regeneracija in ravnovesje, 6-7 povedi, tretja oseba.
Opiši: (1) kaj konkretno pomaga tej osebi po stresu, (2) ali potrebuje samoto ali družbo, (3) okvirni čas regeneracije, (4) kaj vodja lahko naredi, (5) kako preprečiti ponavljajoči stres.
DIFERENCIACIJA: Visoka B → red, tišina, analiza. Visoka R → akcija, gibanje. Visoka G → globoki pogovori, podpora. Visoka Y → novi stimulusi, socialni stiki.
NE začni z imenom.
`},
      {ids:['prod_uvod','prod_mocne','prod_slepe','prod_tip','prod_akcija'],prompt:`${base}

Generiraj vse sekcije. Vsako začni z [SEKCIJA:id].

[SEKCIJA:prod_uvod]
Odstavek Prodajni slog, 8-9 povedi, tretja oseba. Začni z: "Stranke ${ime1} doživljajo kot..."

OBVEZNA VSEBINA:
1. Prvi stavek: kako stranke doživljajo tega prodajalca (splošen vtis)
2. Drugi-tretji stavek: kaj konkretno NAREDI dobro v prodajnem procesu — specifično za ta profil
3. Četrti stavek: kje je njegova/njena NARAVNA PREDNOST v prodajnem ciklu (katera faza)
4. Peti-šesti stavek: kje se ZATAKNE — katera faza je izziv in zakaj
5. Sedmi stavek: kako stranke OPISUJEJO izkušnjo z njim/njo (ne kaj on/a naredi ampak kako stranke to čutijo)
6. Osmi-deveti stavek: kakšen TIP STRANKE mu/ji najbolj ustreza in zakaj

DIFERENCIACIJA po profilu:
- Visoka G: graditelj zaupanja, počasen pri zaključevanju, stranke ga cenijo kot zaupnika
- Visoka B: odličen pri kompleksnih rešitvah, šibak pri small talku in impulzivnih kupcih
- Visoka R: hiter pri zaključku, šibak pri empatičnem poslušanju, primeren za transakcijsko prodajo
- Visoka Y: navdušujoč pri predstavitvi, šibak pri sledenju in dokumentaciji

NE piši generično. Vsak stavek mora biti specifičen za TA profil."

[SEKCIJA:prod_mocne]
Seznam 7 prodajnih prednosti. Format: **Naslov** - En stavek.

[SEKCIJA:prod_slepe]
Seznam 5 prodajnih slepih peg. Format: **Naslov** - En stavek.

[SEKCIJA:prod_tip]
Za vsak tip stranke napiši 3-4 KONKRETNE nasvete. Format:

**Prodaja modri stranki**
3-4 nasveti. Kako ta prodajalec prilagodi SVOJO naravno energijo modri stranki? Kaj mora poudariti, čemu se izogniti, kakšen tempo, kakšna dokumentacija.

**Prodaja rdeči stranki**
3-4 nasveti. Kako prilagodi pristop rdeči stranki? Hitrost, direktnost, fokus na rezultate — kaj mu/ji to pomeni glede na lastni profil.

**Prodaja zeleni stranki**
3-4 nasveti. Kako prilagodi pristop zeleni stranki? Odnos, zaupanje, tempo — kaj mu/ji pride naravno in kje mora biti pozoren/na.

**Prodaja rumeni stranki**
3-4 nasveti. Kako prilagodi pristop rumeni stranki? Navdušenje, vizija, spontanost — kaj mu/ji pride naravno in kje mora prilagoditi.

PRAVILO: Vsak nasvet mora biti AKCIJSKI — ne "bodi direkten" ampak "začni sestanek z 2-minutnim povzetkom ključnih koristi brez uvoda".

[SEKCIJA:prod_akcija]
Top 5 prioritiziranih akcijskih korakov za ${ime1}a v prodaji. FORMAT: **Korak N: Naslov** - Razlaga (2 stavka). PRAVILA: (1) Koraki morajo biti razvrščeni po prioriteti — #1 je najpomembnejši. (2) Vsak korak mora biti specifičen za ta barvni profil — ne generičen nasvet. (3) Vsak korak mora imeti merljiv rezultat ("cilj: ..."). (4) Korak #1 mora naslavljati največjo slabost tega profila v prodaji.

[SEKCIJA:stres]
Napiši odstavek "Stres in opozorilni znaki" za ${ime1}a. 6-7 povedi, tretja oseba.
Opiši:
- Kateri KONKRETNI situacijski sprožilci povzročijo stres (glede na barvni profil)
- Kako se stres kaže NAVZVEN — kaj opazijo sodelavci in vodja (vedenje, komunikacija, telesni znaki)
- Kateri opozorilni znaki kažejo da je oseba blizu izgorelosti
- Kako se obnaša tim ko je ta oseba pod stresom
DIFERENCIACIJA: Visoka modra pod stresom se zapre vase in postane pretirano kritična. Visoka rdeča postane agresivna in kontrolirajoča. Visoka zelena se umakne in postane pasivno-agresivna. Visoka rumena dramatizira in postane kaotična. Opiši SPECIFIČNO za ta profil — ne generično.
NE začni z imenom.

[SEKCIJA:regen]
Napiši odstavek "Regeneracija in ravnovesje" za ${ime1}a. 6-7 povedi, tretja oseba.
Opiši:
- Kaj KONKRETNO pomaga tej osebi da se "resetira" po stresu (glede na barvni profil)
- Ali potrebuje samoto ali družbo za regeneracijo
- Koliko časa okvirno potrebuje
- Kaj vodja lahko konkretno naredi da pomaga
- Kako preprečiti ponavljajoči stres dolgoročno
DIFERENCIACIJA: Visoka modra se regenerira z analizo, redom in tišino. Visoka rdeča z akcijo in fizičnim gibanjem. Visoka zelena z globokimi pogovori in podporo. Visoka rumena z novimi stimulusi in socialnimi stiki. Opiši SPECIFIČNO za ta profil.
NE začni z imenom.`},
      {ids:['vodenje','motivacija','intervju','digital'],prompt:`${base}

Generiraj vse sekcije. Vsako začni TOČNO z [SEKCIJA:id].

[SEKCIJA:vodenje]
Napiši 8 konkretnih napotkov ZA VODJO ${ime1}a — ne za ${ime1}a samega. Format: **Napotok** - En stavek razlage. DIFERENCIACIJA: Vsak napotok mora biti SPECIFIČEN za ta profil. Npr. ne "daj feedback" ampak "feedback daj pisno dan po sestanku ker potrebuje čas za procesiranje". Napiši kot da govoriš izkušenemu vodji ki ne pozna Insights metodologije.

[SEKCIJA:motivacija]
Dve ločeni skupini — MOTIVIRA in DEMOTIVIRA:
**MOTIVIRA:** 5 motivatorjev. Format: **Motivator** - En stavek zakaj TOČNO ta profil to motivira.
**DEMOTIVIRA:** 5 demotivatorjev. Format: **Demotivator** - En stavek zakaj TOČNO ta profil to demotivira.
DIFERENCIACIJA: Motivatorji morajo biti SPECIFIČNI — ne "izzivi" ampak "projekti z jasnimi merljivimi cilji in avtonomijo pri izvedbi". Razlika med R=5 in G=5 mora biti očitna.

[SEKCIJA:intervju]
6 intervju vprašanj. Format: numerirane alineje, samo vprašanje brez pojasnil.

PRAVILA ZA VSAKO VPRAŠANJE:
1. Vprašanje mora biti situacijsko ("Opišite situacijo ko...") ali vedenjsko ("Kako ste ravnali ko...")
2. Vsako vprašanje mora ciljati na SPECIFIČNO SLABOST tega barvnega profila
3. Dober kandidat bo opisal kako je PREMAGAL svojo naravno omejitev — ne splošen odgovor
4. Nobeno vprašanje ne sme biti generično

CILJAJ NA TE SPECIFIČNE IZZIVE (glede na profil):
- Nizka R: "Opišite situacijo ko ste morali sprejeti nepopularno odločitev ki je prizadela nekoga v timu — kako ste se odločili in kako ste jo sporočili?"
- Nizka B: "Opišite primer ko ste morali prepričati skeptičnega sogovornika brez zadostnih podatkov — kaj ste naredili?"
- Nizka G: "Kdaj ste nazadnje opazili da je nekdo v timu imel težave — preden vam je povedal? Kaj ste naredili?"
- Nizka Y: "Opišite projekt ki je popolnoma zašel v rutino in postal dolgočasen — kako ste vzdrževali energijo?"
- Visoka G + nizka R: "Opišite situacijo ko ste morali vztrajati pri svoji odločitvi kljub pritisku tima"
- Visoka B + nizka Y: "Kdaj ste morali improvizirati brez priprave in kako je šlo?"

Prilagodi vprašanja TOČNO temu profilu — ne kopiraj primerov dobesedno.

[SEKCIJA:digital]
Odstavek Digitalna komunikacija, 6-7 povedi, tretja oseba.
Opiši KONKRETNO za ta profil:
1. Email stil — dolžina, ton, struktura
2. Slack/Teams — odzivnost, način izražanja
3. Video klici — ali mu/ji ustrezajo in zakaj
4. Asinhrona vs sinhrona komunikacija — kaj preferira
5. 2 konkretna nasveta za sodelavce kako z njim/njo najučinkoviteje komuniciramo digitalno
NE začni z imenom. Specifično za TA profil.`}
    ]

    // ── SPORTNI BATCH ────────────────────────────────────────────────────
    const isSportProfile = ctx.mode === 'sport'
    const sportBase = isSportProfile ? `Ime: ${ime1}
Šport: ${ctx.sport||'ni naveden'}
Pozicija/Vloga: ${ctx.pozicija||'ni navedena'}
Spol: ${ctx.spol==='z'?'ženski':'moški'}

BARVNI PROFIL (vse vrednosti):
- Analitičnost (B): ${con.B}/6 — ${con.B>=4.5?'izjemno visoka':con.B>=3.0?'visoka':con.B>=2.0?'zmerna':'nizka'}
- Odločnost (R): ${con.R}/6 — ${con.R>=4.5?'izjemno visoka':con.R>=3.0?'visoka':con.R>=2.0?'zmerna':'nizka'}
- Empatija (G): ${con.G}/6 — ${con.G>=4.5?'izjemno visoka':con.G>=3.0?'visoka':con.G>=2.0?'zmerna':'nizka'}
- Optimizem (Y): ${con.Y}/6 — ${con.Y>=4.5?'izjemno visoka':con.Y>=3.0?'visoka':con.Y>=2.0?'zmerna':'nizka'}
Tip: ${typeData.sl}. Varianta: ${variant}.
${snParsed?`Percepcijski stil: ${snParsed.label} (${snParsed.score}) — ${snParsed.writing}`:''}

VEDENJSKI KONTEKST ZA ŠPORT:
- Visoka analitičnost → taktično razmišljanje, analiza nasprotnika, strukturiran pristop k treningu
- Visoka odločnost → pogum v ključnih trenutkih, prevzemanje pobude, vodenje pod pritiskom
- Visoka empatija → timski duh, razumevanje soigralcev, vloga v slačilnici
- Visok optimizem → motivacija, energija na terenu, odziv na poraz` : ''

    const SPORT_BATCHES = [{
      ids: ['sport_trening','sport_mentalna','sport_motivacija','sport_vloga','sport_slacilnica','sport_trener','sport_razvoj','sport_soigralci','sport_stres','sport_regen'],
      prompt: `${sportBase}

Generiraj vse sekcije. Vsako začni TOČNO z [SEKCIJA:id].

[SEKCIJA:sport_mentalna]
Napiši sekcijo "Mentalna pripravljenost" — 4 kratki bloki. Vsak blok začni TOČNO z označbo.

**Priprava na tekmo:**
2-3 stavki. Kakšna je idealna mentalna rutina tega tipa pred tekmo — kaj potrebuje (tišina, analiza, glasba, pogovor...) da pride na igrišče zbran in pripravljen. Konkretno, ne generično.

**Mentalni reset:**
2-3 stavki. Ko naredi napako med tekmo — kako se ta tip najhitreje zbere in vrne fokus. Kaj mu pomaga, kaj ne. Konkretno za trenerja.

**Flow stanje:**
2-3 stavki. Kaj tega športnika spravi v "cono" kjer igra najboljše — kakšni pogoji, kakšen tempo, kakšna vloga na igrišču. Specifično za ta profil.

**Mentalna šibkost:**
2-3 stavki. Kje je ta tip psihološko ranljiv pod pritiskom — katera situacija ga mentalno destabilizira in kako to preprečiti.

Pisano direktno trenerju — "ti", sproščeno a strokovno. Brez omenjanja barv.

[SEKCIJA:sport_trening]
Odstavek "Stil treninga", 6-7 povedi, tretja oseba. Opiši:
- Kako pristopa k treningu — tempo, fokus, odnos do ponavljanja
- Kako se uči novih tehnik ali taktik (zaznavanje=korak po korak, intuicija=celostna slika)
- Kako reagira na napake med treningom
- Kakšen trening mu/ji ustreza (strukturiran, kreativen, tekmovalen, skupinski)
Bodi specifičen za ta profil — ne generično.

[SEKCIJA:sport_motivacija]
Odstavek "Motivacija in pritisk", 6-7 povedi, tretja oseba. Opiši:
- Kaj ga/jo žene k boljšim rezultatom (notranja/zunanja motivacija)
- Kako reagira na pritisk tekme — tesni rezultat, finale, odločilni trenutek
- Kako se odzove na poraz in na zmago
- Kaj ga/jo demotivira
Konkretni primeri iz tekmovalnega okolja.

[SEKCIJA:sport_vloga]
Odstavek "Vloga v ekipi na igrišču", 6-7 povedi, tretja oseba. Opiši:
- Kakšno naravno vlogo prevzema med igro (vodja, eksekvutor, kreativec, stabilizator)
- Kako komunicira s soigralci med tekmo
- V katerih situacijah je najboljši/a (pritisk, prosta igra, obramba, napad)
- Kako vpliva na igro ekipe
${ctx.pozicija?`Upoštevaj pozicijo: ${ctx.pozicija}`:''}

[SEKCIJA:sport_slacilnica]
Odstavek "Slačilnica in ekipna dinamika", 6-7 povedi, tretja oseba. Opiši:
- Kakšna je njegova/njena vloga v slačilnici izven igrišča
- Ali gradi vzdušje, je tih, ali je most med skupinami
- Kako reagira na konflikte v ekipi
- Kako vpliva na moralo ekipe pred in po tekmi
- Kaj ekipa dobi od njegove/njene prisotnosti

[SEKCIJA:sport_trener]
Odstavek "Komunikacija s trenerjem", 6-7 povedi, tretja oseba — PIŠEŠ TRENERJU.
Opiši:
- Kako mu/ji dati feedback da ga/jo doseže (direktno, opisno, s podatki, s pohvalo)
- Kako reagira na kritiko in na pohvalo
- Kakšen odnos s trenerjem mu/ji ustreza (avtoriteta, partner, mentor)
- Čemu se trener mora izogibati
Konkretni nasveti za trenerja.

[SEKCIJA:sport_razvoj]
Odstavek "Razvoj in izzivi", 6-7 povedi, tretja oseba. Opiši:
- Katera področja mu/ji v športu predstavljajo največji izziv (glede na profil)
- Kako pristopa k lastnemu razvoju
- Kaj ga/jo zavira od polnega potenciala
- Konkretni koraki za razvoj specifični za ta profil in pozicijo
${ctx.pozicija?`Upoštevaj pozicijo: ${ctx.pozicija}`:''}
${ctx.pozicija?`Upoštevaj pozicijo: ${ctx.pozicija}`:''}
Brez generičnih nasvetov — samo specifično za ta profil.

[SEKCIJA:sport_soigralci]
Napiši praktičen vodič za trenerja in igralca. DVA LOČENA BLOKA — začni vsakega TOČNO z [IDEALNI] in [IZZIVI].

[IDEALNI]
3 idealni soigralci za ta profil. Za vsakega:
**Ime tipa** (npr. Spontani improvizator, Energični motivator...)
Zakaj deluje: en stavek zakaj ta kombinacija deluje na igrišču.
Nasvet za jutri: en konkreten nasvet kaj narediti na naslednjem treningu ali tekmi skupaj.

[IZZIVI]
3 soigralci ki povzročajo trenje. Za vsakega:
**Ime tipa** (npr. Dominanten vodja, Kaotični improvizator...)
Zakaj je trenje: en stavek zakaj pride do napetosti.
Rešitev: en konkreten nasvet kaj narediti da napetost zmanjšaš.

Brez omenjanja barv. Pisano direktno trenerju/igralcu — "ti", ne tretja oseba.

[SEKCIJA:sport_stres]
Odstavek "Stres in opozorilni znaki", 6-7 povedi, tretja oseba.
Opiši konkretne situacijske sprožilce stresa za tega športnika, kako se stres kaže navzven na treningu in tekmi, kako vpliva na ekipo in kateri znaki kažejo mentalno izčrpanost. Diferenciacija: visoka analitičnost = prekomerna samokritičnost; visoka odločnost = agresivnost; visoka empatija = absorbira negativno energijo ekipe; visok optimizem = dramatizira in postane kaotičen. Specifično za ta profil, ne generično. NE začni z imenom.

[SEKCIJA:sport_regen]
Odstavek "Regeneracija in ravnovesje", 6-7 povedi, tretja oseba.
Opiši kaj konkretno pomaga temu športniku po stresu ali porazu, ali potrebuje samoto ali ekipno podporo, kako hitro se regenerira, kaj trener lahko naredi in kako dolgoročno preprečiti mentalni stres. Diferenciacija: visoka analitičnost = rutina in strukturiran počitek; visoka odločnost = fizična akcija; visoka empatija = ekipni pogovori; visok optimizem = novi stimulusi in zabava. Specifično za ta profil. NE začni z imenom.
`
    }]

    const activeBatches = isSportProfile
      ? SPORT_BATCHES.map(b=>({...b,ids:b.ids.filter(id=>queue.includes(id))})).filter(b=>b.ids.length>0)
      : BATCHES.map(b=>({...b,ids:b.ids.filter(id=>queue.includes(id))})).filter(b=>b.ids.length>0)
    const activeSystem = isSportProfile ? SPORT_SYS : SYS
    setQueuedIds(activeBatches.flatMap(b=>b.ids))
    let allTexts={...currentTexts}

    for(const batch of activeBatches){
      setGenerating(batch.ids[0])
      try{
        const r=await fetch('/api/claude',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({system:activeSystem,prompt:batch.prompt})})
        const data=await r.json()
        const raw=data.text||''
        const parts=raw.split(/\[SEKCIJA:(\w+)\]/)
        for(let i=1;i<parts.length;i+=2){
          const id=parts[i].trim()
          const txt=(parts[i+1]||'').trim()
          if(id&&txt&&batch.ids.includes(id)){
            const clean=fixModelErrors(stripSectionTitle(txt))
            allTexts={...allTexts,[id]:clean}
            setTexts(prev=>({...prev,[id]:clean}))
            setGenerated(prev=>new Set([...prev,id]))
            await fetch('/api/admin/save-text',{method:'POST',headers:{'Content-Type':'application/json','x-admin-key':'insights2024'},body:JSON.stringify({profileId:ctx.id,sectionId:id,text:clean})})
          }
        }
      }catch(e){
        batch.ids.forEach(id=>{setTexts(prev=>({...prev,[id]:'Napaka: '+e.message}));setGenerated(prev=>new Set([...prev,id]))})
      }
      setQueuedIds(prev=>prev.filter(id=>!batch.ids.includes(id)))
    }
    setGenerating(null);setQueuedIds([])
  },[apiKey])



  async function handleSportPdf() {
    if(!selected || selected.mode !== 'sport') return
    setPdfLoading(true)
    try {
      const r = await fetch('/api/pdf-sport', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({profileData:{
          ime: selected.ime,
          spol: selected.spol||'m',
          sport: selected.sport||'',
          pozicija: selected.pozicija||'',
          con: selected.con,
          uncon: selected.uncon,
          flow: selected.flow,
          total: selected.total,
          typeName: selected.typeName,
          typeData: selected.typeData,
          variant: selected.variant,
          leadColor: selected.leadColor,
          sec: selected.sec,
          sn: selected.sn||'',
          texts,
        }})
      })
      if(!r.ok) throw new Error('Sport PDF napaka')
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href=url; a.download=`sport-${selected.ime.replace(/ /g,'-')}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch(e) { alert('Sport PDF napaka: '+e.message) }
    setPdfLoading(false)
  }

  async function handleSportHtml() {
    if(!selected) return
    setPdfLoading(true)
    try {
      const r = await fetch('/api/html-report-sport', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({profileData:{
          ime: selected.ime,
          spol: selected.spol||'m',
          sport: selected.sport||'',
          pozicija: selected.pozicija||'',
          con: selected.con,
          uncon: selected.uncon,
          flow: selected.flow,
          total: selected.total,
          typeName: selected.typeName,
          typeData: selected.typeData,
          variant: selected.variant,
          leadColor: selected.leadColor,
          sec: selected.sec,
          sn: selected.sn||'',
          texts,
        }})
      })
      if(!r.ok) throw new Error('Sport HTML napaka')
      const html = await r.text()
      const blob = new Blob([html], {type:'text/html;charset=utf-8'})
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href=url; a.download=`barvni-kompas-sport-${selected.ime.replace(/ /g,'-')}.html`; a.click()
      URL.revokeObjectURL(url)
    } catch(e) { alert('Sport HTML napaka: '+e.message) }
    setPdfLoading(false)
  }

  async function handlePdfPremium() {
    if(!selected) return
    setPdfLoading(true)
    try {
      const SALES_PHASES=[
        {id:'pred',label:'1. Pred prodajnim procesom',icon:'🎯',scoreKey:'B',B:{strong:'Temeljita analiza stranke, jasni cilji',challenge:'Vzpostavljanje osebnega zaupanja',tip:'Pripravi strukturirano analizo stranke vnaprej.'},R:{strong:'Odločnost, jasni cilji',challenge:'Potrpežljivost v fazi priprave',tip:'Vzemi si čas za analizo stranke.'},G:{strong:'Vzpostavljanje zaupanja, empatija',challenge:'Iniciativa pri novih strankah',tip:'Določi jasne cilje za vsak stik.'},Y:{strong:'Navdušujoč prvi vtis',challenge:'Sistematična priprava',tip:'Pripravi seznam ključnih točk.'}},
        {id:'potrebe',label:'2. Ugotavljanje potreb',icon:'🔍',scoreKey:'G',B:{strong:'Sistematično spraševanje',challenge:'Čustvene potrebe stranke',tip:'Vadi aktivno poslušanje.'},R:{strong:'Hitro prepoznavanje priložnosti',challenge:'Poslušanje brez prekinjanja',tip:'Vadite tišino po odgovoru.'},G:{strong:'Globoko empatično poslušanje',challenge:'Zahtevna vprašanja',tip:'Postavljaj vprašanja ki izzivajo.'},Y:{strong:'Sproščeno vzdušje',challenge:'Fokus pri beleženju',tip:'Imej strukturo vprašanj zapisano.'}},
        {id:'predlog',label:'3. Dajanje predlogov',icon:'💡',scoreKey:'B',B:{strong:'Logična strukturirana predstavitev',challenge:'Čustvena zgodba',tip:'Začni z zgodbo, nato dejstva.'},R:{strong:'Samozavest pri predstavitvi',challenge:'Prilagajanje tempu',tip:'Preverjaj razumevanje med potekom.'},G:{strong:'Prilagojeni predlogi',challenge:'Samozavestna cena',tip:'Vadite izgovarjanje cene.'},Y:{strong:'Navdušujoča predstavitev',challenge:'Struktura',tip:'Drži se pripravljene strukture.'}},
        {id:'ugovori',label:'4. Upravljanje z ugovori',icon:'🛡',scoreKey:'R',B:{strong:'Logični odgovori s podatki',challenge:'Čustveni ugovori',tip:'Pripravi odgovore na 10 ugovorov.'},R:{strong:'Pogum pri soočanju',challenge:'Prekomerna asertivnost',tip:'Najprej potrdi ugovor.'},G:{strong:'Empatično razumevanje',challenge:'Premalo odločnosti',tip:'Ugovor je vprašanje, ne napad.'},Y:{strong:'Optimizem',challenge:'Preveč obljub',tip:'Zapiši ugovore med pogovorom.'}},
        {id:'zvestoba',label:'5. Pridobivanje zvestobe',icon:'🤝',scoreKey:'G',B:{strong:'Zanesljivost, doslednost',challenge:'Osebna navezanost',tip:'Načrtuj redne pogovore s stranko.'},R:{strong:'Izpolnjevanje obljub',challenge:'Vzdrževanje odnosa',tip:'Vnesi sledenje v koledar.'},G:{strong:'Dolgoročni odnosi',challenge:'Priložnosti za dodatno prodajo',tip:'Prepoznaj priložnosti za rast.'},Y:{strong:'Navdušenje',challenge:'Sistematično sledenje',tip:'Vzpostavi sistem sledenja.'}},
        {id:'sledenje',label:'6. Sledenje in zaključek',icon:'✅',scoreKey:'R',B:{strong:'Sistematično sledenje',challenge:'Zaključevanje posla',tip:'Vadite direkten zaključek.'},R:{strong:'Odlično pri zaključevanju',challenge:'Prekomeren pritisk',tip:'Dokumentiraj vsak dogovor.'},G:{strong:'Doslednost sledenja',challenge:'Zaključevanje',tip:'Vadite neposredno vprašanje za posel.'},Y:{strong:'Pozitiven zaključek',challenge:'Dokumentacija',tip:'Pripravi seznam korakov za zaključek.'}},
      ]
      const r = await fetch('/api/pdf-premium', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({profileData:{
          ime:selected.ime, con:selected.con, uncon:selected.uncon,
          flow:selected.flow, total:selected.total,
          typeName:selected.typeName, typeData:selected.typeData,
          variant:selected.variant, leadColor:selected.leadColor,
          sec:selected.sec, texts, salesPhases:SALES_PHASES,
        }})
      })
      if(!r.ok) throw new Error('PDF Premium napaka')
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href=url; a.download=`insights-premium-${selected.ime.replace(/ /g,'-')}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch(e) { alert('PDF Premium napaka: '+e.message) }
    setPdfLoading(false)
  }



  // ── REGENERACIJA POSAMEZNE SEKCIJE ──────────────────────────────────────────
  const [regenLoading, setRegenLoading] = useState(null) // id sekcije ki se generira

  async function regenSection(sectionId) {
    if(!selected) return
    setRegenLoading(sectionId)
    try {
      const con = selected.con
      const uncon = selected.uncon
      const ime1 = selected.ime.trim().split(' ')[0]
      const spol = selected.spol || 'm'
      const spolDesc = spol === 'z' ? 'Ženski spol — zaimki: jo/ji/ona/njen, pridevniki: analitična, odločna.' : 'Moški spol — zaimki: ga/mu/on/njegov, pridevniki: analitičen, odločen.'

      const leadColor = ['B','R','G','Y'].reduce((a,b) => con[a]>con[b]?a:b)
      const sorted4 = [{k:'B',v:con.B},{k:'R',v:con.R},{k:'G',v:con.G},{k:'Y',v:con.Y}].sort((a,b)=>b.v-a.v)
      const typeName = selected.typeName || ''
      const typeSlName = selected.typeData?.sl || typeName

      const base = `Si izkušen organizacijski psiholog, ki piše osebnostna poročila za Barvni kompas v slovenščini. Pišeš za poslovne stranke — profesionalno, a toplo, kot dober coach in ne kot učbenik.

PROFIL: ${selected.ime} | Tip: ${typeSlName} | ${selected.variant || ''}
ENERGIJE (0-6): B=${con.B} analitičnost, R=${con.R} odločnost, G=${con.G} harmonija, Y=${con.Y} navdušenje
Primarna: ${leadColor}=${con[leadColor]} | Sekundarna: ${sorted4[1].k}=${sorted4[1].v} | Najšibkejša: ${sorted4[3].k}=${sorted4[3].v}
${spolDesc}

KAKO PISATI:
- Tretja oseba, uporabljaj ime osebe.
- SHOW, DON'T TELL: opisuj oprijemljive situacije, ne abstraktnih lastnosti. Namesto "ustvarja pozitivno vzdušje" raje "ko se na sestanku debata zatakne, je on tisti, ki predlaga premor". Namesto "strukturiran pristop" raje "pred zagonom projekta razdela časovnico do posameznih korakov".
- Vsak stavek pove nekaj NOVEGA — brez ponavljanja iste misli z drugimi besedami.

KALIBRACIJA PO VREDNOSTIH:
- Visoka (5-6): izrazita, vsakodnevno vidna lastnost.
- Srednja (3-4): situacijska, pride do izraza ob pravih pogojih.
- Nizka (0-2): senčna stran — vir nelagodja, izogibanja ali napora.

PREPOVEDANO:
- Več kot dva stavka z enakim začetkom (NE vsak stavek z imenom ali s "Pri...").
- Konstrukcija "najprej... nato pa..." — menjaj stavčne strukture.
- Prazne fraze: "dinamično vzdušje", "pozitivna energija", "strukturiran pristop", "ustvarja zaupanje", "v svojem delovnem okolju", "kombinacija ... in ...".
- Superlativi in hvalnice. Bodi iskren, pokaži tudi senco.
- Omenjanje barv ali številk energij.

FORMATIRANJE: Odstavki brez alinej (razen ko je izrecno zahtevan seznam). Seznami = **Naslov** - En konkreten stavek.
Ne začni z naslovom sekcije. Piši specifično za TA profil, ne splošno.`

      // Prompti za vsako sekcijo
      const sectionPrompts = {
        stil: `${base}

Napiši odstavek OSEBNI STIL (6-7 povedi). Kako oseba deluje pri vsakdanjem delu: kako pristopa k nalogam, organizira čas, kaj jo požene in kaj zavira. Vključi vsaj eno konkretno delovno situacijo — npr. kako se loti novega projekta ali reagira na nepričakovano spremembo.`,
        inter: `${base}

Napiši odstavek INTERAKCIJA Z DRUGIMI (6-7 povedi). Kako se vede v skupini, na sestankih, v razpravah. Kako daje in sprejema povratne informacije. Kako reagira ob nestrinjanju. Vključi eno konkretno medosebno situacijo.`,
        odl: `${base}

Napiši odstavek SPREJEMANJE ODLOČITEV (6-7 povedi). Hitrost odločanja, na kaj se opira (podatki, intuicija, mnenja drugih), kako reagira pod časovnim pritiskom, kaj ga zablokira. Pokaži razliko med rutinskimi in pomembnimi odločitvami.`,
        pritisk: `${base}

Napiši odstavek VEDENJE POD PRITISKOM (6-7 povedi). Kako se oseba spremeni v stresu — katere lastnosti se pretiravajo, kako jo vidijo sodelavci, kateri so opozorilni znaki. Vključi konkreten primer stresne situacije in kaj ji pomaga nazaj v ravnovesje.`,
        pred: `${base}

Seznam 8 ključnih prednosti. Format: **Naslov** - En stavek.`,
        slab: `${base}

Seznam 8 možnih slabosti. Format: **Naslov** - En stavek.`,
        slepe: `${base}

Odstavek Slepe pege, 6-7 povedi. Navedi 2-3 KONKRETNE situacije kjer se slepa pega pokaže.`,
        tim: `${base}

Odstavek Prispevek k timu, 6-7 povedi. Opiši specifično vlogo in kaj tim pridobi/izgubi.`,
        okol: `${base}

Odstavek Idealno delovno okolje, 6-7 povedi. Budi specifičen — tempo, struktura, feedback, avtonomija.`,
        motiv: `${base}

Odstavek Motivacija in strahovi, 6-7 povedi. Navedi konkretne motivatorje in strahove.`,
        kom: `${base}

Seznam 6 komunikacijskih nasvetov ZA SODELAVCE. Format: **Naslov** - En stavek. Specifično za ta profil.`,
        razv: `${base}

Odstavek Predlogi za razvoj, 6-7 povedi. Navedi: (1) 2-3 konkretne tedenske vaje, (2) merljive znake napredka, (3) 1-2 konkretni knjigi/podcast z naslovom in avtorjem.`,
        naspr: `${base}

Odstavek Nasprotni tip, 6-7 povedi. (1) Poimenuj nasprotni tip direktno. (2) Opiši 2 konkretni situaciji napetosti. (3) Navedi 3 komunikacijske strategije.`,
        vodenje: `${base}

Seznam 6-8 nasvetov Kako voditi to osebo. Format: **Naslov** - En stavek.`,
        motivacija: `${base}

Seznam motivatorjev in demotivatorjev. Format: **Motivira: Naslov** - En stavek. **Demotivira: Naslov** - En stavek. 5 motivatorjev + 5 demotivatorjev.`,
        intervju: `${base}

6 provokativnih intervju vprašanj. Vprašanja naj razkrijejo situacije kjer naravni stil NI prednost. Specifično za TA profil. Format: numerirane alineje, samo vprašanje.`,
        digital: `${base}

Kako ${ime1} komunicira digitalno, 6-7 povedi. Pokri: (1) email stil, (2) Slack/Teams, (3) video klici, (4) asinhrona vs sinhrona komunikacija, (5) 2 nasveta za najučinkovitejšo digitalno komunikacijo z njim/njo.`,
        stres: `${base}

Odstavek Stres in opozorilni znaki, 6-7 povedi. Navedi konkretne opozorilne znake in situacije ki sprožijo stres.`,
        regen: `${base}

Odstavek Regeneracija in ravnovesje, 6-7 povedi. Navedi konkretne regeneracijske strategije specifične za ta profil.`,
        prod_uvod: `${base}

Odstavek Prodajni slog, 5-6 povedi. Začni z: "Stranke ${ime1} doživljajo kot..."`,
        prod_mocne: `${base}

Seznam 7 prodajnih prednosti. Format: **Naslov** - En stavek.`,
        prod_slepe: `${base}

Seznam 5 prodajnih slepih peg. Format: **Naslov** - En stavek.`,
        prod_akcija: `${base}

Top 5 prioritiziranih akcijskih korakov v prodaji. FORMAT: **Korak N: Naslov** - Razlaga (2 stavka) + "Cilj: ...". Korak #1 naslavlja največjo slabost tega profila.`,
      }

      const prompt = sectionPrompts[sectionId]
      if(!prompt) { console.warn('Ni prompta za:', sectionId); setRegenLoading(null); return }

      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: {'Content-Type':'application/json', 'x-admin-key':'insights2024'},
        body: JSON.stringify({system: 'Si ekspert za Barvni kompas profile. Odgovarjaš v slovenščini.', prompt})
      })
      const data = await res.json()
      if(data.error) throw new Error(data.error)

      let txt = data.text?.trim() || ''
      // Odstrani morebitni naslov na začetku
      const firstNewline = txt.indexOf('\n')
      if(firstNewline > 0) {
        const firstLine = txt.slice(0, firstNewline).trim()
        if(firstLine.length < 50 && !firstLine.includes('.')) txt = txt.slice(firstNewline).trim()
      }

      // // Shrani v bazo
      await fetch('/api/admin/save-text', {
        method: 'POST',
        headers: {'Content-Type':'application/json', 'x-admin-key':'insights2024'},
        body: JSON.stringify({profileId: selected.id, sectionId, text: txt})
      })

      // Posodobi lokalni state
      setTexts(prev => ({...prev, [sectionId]: txt}))
      console.log('✅ Regenerirano:', sectionId)
    } catch(e) {
      alert('Napaka pri regeneraciji: ' + e.message)
    }
    setRegenLoading(null)
  }

  async function handleHtmlReport() {
    if(!selected) return
    setPdfLoading(true)
    try {
      const SALES_PHASES=[
        {id:'pred',label:'1. Pred prodajnim procesom',icon:'🎯',scoreKey:'B',B:{strong:'Temeljita analiza stranke, jasni cilji',challenge:'Vzpostavljanje osebnega zaupanja',tip:'Pripravi strukturirano analizo stranke vnaprej.'},R:{strong:'Odločnost, jasni cilji',challenge:'Potrpežljivost v fazi priprave',tip:'Vzemi si čas za analizo stranke.'},G:{strong:'Vzpostavljanje zaupanja, empatija',challenge:'Iniciativa pri novih strankah',tip:'Določi jasne cilje za vsak stik.'},Y:{strong:'Navdušujoč prvi vtis',challenge:'Sistematična priprava',tip:'Pripravi seznam ključnih točk.'}},
        {id:'potrebe',label:'2. Ugotavljanje potreb',icon:'🔍',scoreKey:'G',B:{strong:'Sistematično spraševanje',challenge:'Čustvene potrebe stranke',tip:'Vadi aktivno poslušanje.'},R:{strong:'Hitro prepoznavanje priložnosti',challenge:'Poslušanje brez prekinjanja',tip:'Vadite tišino po odgovoru.'},G:{strong:'Globoko empatično poslušanje',challenge:'Zahtevna vprašanja',tip:'Postavljaj vprašanja ki izzivajo.'},Y:{strong:'Sproščeno vzdušje',challenge:'Fokus pri beleženju',tip:'Imej strukturo vprašanj zapisano.'}},
        {id:'predlog',label:'3. Dajanje predlogov',icon:'💡',scoreKey:'B',B:{strong:'Logična strukturirana predstavitev',challenge:'Čustvena zgodba',tip:'Začni z zgodbo, nato dejstva.'},R:{strong:'Samozavest pri predstavitvi',challenge:'Prilagajanje tempu',tip:'Preverjaj razumevanje med potekom.'},G:{strong:'Prilagojeni predlogi',challenge:'Samozavestna cena',tip:'Vadite izgovarjanje cene.'},Y:{strong:'Navdušujoča predstavitev',challenge:'Struktura',tip:'Drži se pripravljene strukture.'}},
        {id:'ugovori',label:'4. Upravljanje z ugovori',icon:'🛡',scoreKey:'R',B:{strong:'Logični odgovori s podatki',challenge:'Čustveni ugovori',tip:'Pripravi odgovore na 10 ugovorov.'},R:{strong:'Pogum pri soočanju',challenge:'Prekomerna asertivnost',tip:'Najprej potrdi ugovor.'},G:{strong:'Empatično razumevanje',challenge:'Premalo odločnosti',tip:'Ugovor je vprašanje, ne napad.'},Y:{strong:'Optimizem',challenge:'Preveč obljub',tip:'Zapiši ugovore med pogovorom.'}},
        {id:'zvestoba',label:'5. Pridobivanje zvestobe',icon:'🤝',scoreKey:'G',B:{strong:'Zanesljivost, doslednost',challenge:'Osebna navezanost',tip:'Načrtuj redne pogovore s stranko.'},R:{strong:'Izpolnjevanje obljub',challenge:'Vzdrževanje odnosa',tip:'Vnesi sledenje v koledar.'},G:{strong:'Dolgoročni odnosi',challenge:'Priložnosti za dodatno prodajo',tip:'Prepoznaj priložnosti za rast.'},Y:{strong:'Navdušenje',challenge:'Sistematično sledenje',tip:'Vzpostavi sistem sledenja.'}},
        {id:'sledenje',label:'6. Sledenje in zaključek',icon:'✅',scoreKey:'R',B:{strong:'Sistematično sledenje',challenge:'Zaključevanje posla',tip:'Vadite direkten zaključek.'},R:{strong:'Odlično pri zaključevanju',challenge:'Prekomeren pritisk',tip:'Dokumentiraj vsak dogovor.'},G:{strong:'Doslednost sledenja',challenge:'Zaključevanje',tip:'Vadite neposredno vprašanje za posel.'},Y:{strong:'Pozitiven zaključek',challenge:'Dokumentacija',tip:'Pripravi seznam korakov za zaključek.'}},
      ]
      const r = await fetch('/api/html-report', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({profileData:{
          ime:selected.ime, con:selected.con, uncon:selected.uncon,
          spol:selected.spol,
          flow:selected.flow, total:selected.total,
          typeName:selected.typeName, typeData:selected.typeData,
          variant:selected.variant, leadColor:selected.leadColor,
          sec:selected.sec, texts, salesPhases:SALES_PHASES,
        }})
      })
      if(!r.ok) throw new Error('HTML Report napaka')
      const html = await r.text()
      const blob = new Blob([html], {type:'text/html;charset=utf-8'})
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href=url
      a.download=`barvni-kompas-${selected.ime.replace(/ /g,'-')}.html`
      a.click()
      URL.revokeObjectURL(url)
    } catch(e) { alert('HTML Report napaka: '+e.message) }
    setPdfLoading(false)
  }

  function handleExport() {
    if(!selected) return
    const exportTexts = Object.keys(texts).length > 0 ? texts : (selected.texts || {})
    const sectionLabels = {stil:'OSEBNI STIL',inter:'INTERAKCIJA Z DRUGIMI',odl:'SPREJEMANJE ODLOCITEV',pritisk:'VEDENJE POD PRITISKOM',pred:'KLJUCNE PREDNOSTI',slab:'MOZNE SLABOSTI',slepe:'SLEPE PEGE',tim:'PRISPEVEK K TIMU',okol:'IDEALNO DELOVNO OKOLJE',motiv:'MOTIVACIJA IN STRAHOVI',kom:'KOMUNIKACIJSKI NASVETI',razv:'PREDLOGI ZA RAZVOJ',naspr:'NASPROTNI TIP',prod_uvod:'PRODAJNI SLOG',prod_mocne:'MOCNE TOCKE V PRODAJI',prod_slepe:'SLEPE PEGE V PRODAJI',prod_tip:'PRILAGODITEV TIPU STRANKE',prod_akcija:'TOP 3 AKCIJSKI KORAKI',vodenje:'KAKO VODITI',motivacija:'KAKO MOTIVIRATI',intervju:'INTERVJU VPRASANJA'}
    let out = '='.repeat(40)+'\n'+'BARVNI KOMPAS - OSEBNI PROFIL\n'+'='.repeat(40)+'\n'
    out += 'IME: '+selected.ime+'\nTIP: '+selected.typeData.sl+'\nVARIANTA: '+selected.variant+'\nDATUM: '+new Date().toLocaleDateString('sl-SI')+'\n\n'
    out += 'BARVNI PROFIL:\nAnalitična modra (B): '+selected.con.B.toFixed(2)+'/6\nStabilna zelena (G): '+selected.con.G.toFixed(2)+'/6\nNavdušena rumena (Y): '+selected.con.Y.toFixed(2)+'/6\nAktivna rdeča (R): '+selected.con.R.toFixed(2)+'/6\n\n'
    SECTIONS.forEach(s=>{const txt=exportTexts[s.id];if(!txt)return;out+='='.repeat(40)+'\n'+(sectionLabels[s.id]||s.id.toUpperCase())+'\n'+'='.repeat(40)+'\n'+txt.trim()+'\n\n'})
    const blob=new Blob([out],{type:'text/plain;charset=utf-8'})
    const url=URL.createObjectURL(blob)
    const a=document.createElement('a')
    a.href=url;a.download='insights-'+selected.ime.replace(/ /g,'-')+'-export.txt';a.click()
    URL.revokeObjectURL(url)
  }

  function handleGenerate() {
    if(!selected||generating) return
    const isSport = selected.mode === 'sport'
    const toGen=SECTIONS.filter(s=>checkedSections.has(s.id) && (isSport ? s.group==='Šport' : s.group!=='Šport')).map(s=>s.id)
    setGenerated(new Set());setTexts({})
    generateNext(toGen,{},selected)
  }

  function startEdit(id, currentText) {
    setEditingId(id)
    setEditingText(currentText)
  }

  async function saveEdit(id) {
    const newTexts = {...texts, [id]: editingText}
    setTexts(newTexts)
    setEditingId(null)
    // Shrani v bazo
    try {
      await fetch('/api/admin/save-text', {
        method:'POST', headers:{'Content-Type':'application/json','x-admin-key':'insights2024'},
        body: JSON.stringify({profileId: selected.id, sectionId: id, text: editingText})
      })
    } catch(e) { console.error('Save error:', e) }
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingText('')
  }

  async function handlePdf() {
    if(!selected) return
    setPdfLoading(true)
    try {
      const SALES_PHASES=[
        {id:'pred',label:'1. Pred prodajnim procesom',icon:'🎯',scoreKey:'B',
          B:{strong:'Temeljita analiza stranke, jasni cilji',challenge:'Vzpostavljanje osebnega zaupanja',tip:'Pripravi strukturirano analizo stranke vnaprej.'},
          R:{strong:'Odločnost, jasni cilji',challenge:'Potrpežljivost v fazi priprave',tip:'Vzemi si čas za analizo stranke.'},
          G:{strong:'Vzpostavljanje zaupanja, empatija',challenge:'Iniciativa pri novih strankah',tip:'Določi jasne cilje za vsak stik.'},
          Y:{strong:'Navdušujoč prvi vtis',challenge:'Sistematična priprava',tip:'Pripravi seznam ključnih točk.'}},
        {id:'potrebe',label:'2. Ugotavljanje potreb',icon:'🔍',scoreKey:'G',
          B:{strong:'Sistematično spraševanje',challenge:'Čustvene potrebe stranke',tip:'Vadi aktivno poslušanje.'},
          R:{strong:'Hitro prepoznavanje priložnosti',challenge:'Poslušanje brez prekinjanja',tip:'Vadite tišino po odgovoru.'},
          G:{strong:'Globoko empatično poslušanje',challenge:'Zahtevna vprašanja',tip:'Postavljaj vprašanja ki izzivajo.'},
          Y:{strong:'Sproščeno vzdušje',challenge:'Fokus pri beleženju',tip:'Imej strukturo vprašanj zapisano.'}},
        {id:'predlog',label:'3. Dajanje predlogov',icon:'💡',scoreKey:'B',
          B:{strong:'Logična strukturirana predstavitev',challenge:'Čustvena zgodba',tip:'Začni z zgodbo, nato dejstva.'},
          R:{strong:'Samozavest pri predstavitvi',challenge:'Prilagajanje tempu',tip:'Preverjaj razumevanje med potekom.'},
          G:{strong:'Prilagojeni predlogi',challenge:'Samozavestna cena',tip:'Vadite izgovarjanje cene.'},
          Y:{strong:'Navdušujoča predstavitev',challenge:'Struktura',tip:'Drži se pripravljene strukture.'}},
        {id:'ugovori',label:'4. Upravljanje z ugovori',icon:'🛡',scoreKey:'R',
          B:{strong:'Logični odgovori s podatki',challenge:'Čustveni ugovori',tip:'Pripravi odgovore na 10 ugovorov.'},
          R:{strong:'Pogum pri soočanju',challenge:'Prekomerna asertivnost',tip:'Najprej potrdi ugovor.'},
          G:{strong:'Empatično razumevanje',challenge:'Premalo odločnosti',tip:'Ugovor je vprašanje, ne napad.'},
          Y:{strong:'Optimizem',challenge:'Preveč obljub',tip:'Zapiši ugovore med pogovorom.'}},
        {id:'zvestoba',label:'5. Pridobivanje zvestobe',icon:'🤝',scoreKey:'G',
          B:{strong:'Zanesljivost, doslednost',challenge:'Osebna navezanost',tip:'Načrtuj redne pogovore s stranko.'},
          R:{strong:'Izpolnjevanje obljub',challenge:'Vzdrževanje odnosa',tip:'Vnesi sledenje v koledar.'},
          G:{strong:'Dolgoročni odnosi',challenge:'Priložnosti za dodatno prodajo',tip:'Prepoznaj priložnosti za rast.'},
          Y:{strong:'Navdušenje',challenge:'Sistematično sledenje',tip:'Vzpostavi sistem sledenja.'}},
        {id:'sledenje',label:'6. Sledenje in zaključek',icon:'✅',scoreKey:'R',
          B:{strong:'Sistematično sledenje',challenge:'Zaključevanje posla',tip:'Vadite direkten zaključek.'},
          R:{strong:'Odlično pri zaključevanju',challenge:'Prekomeren pritisk',tip:'Dokumentiraj vsak dogovor.'},
          G:{strong:'Doslednost sledenja',challenge:'Zaključevanje',tip:'Vadite neposredno vprašanje za posel.'},
          Y:{strong:'Pozitiven zaključek',challenge:'Dokumentacija',tip:'Pripravi seznam korakov za zaključek.'}},
      ]
      const r=await fetch('/api/pdf',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({profileData:{
          ime:selected.ime, con:selected.con, uncon:selected.uncon,
          flow:selected.flow, total:selected.total,
          typeName:selected.typeName, typeData:selected.typeData,
          variant:selected.variant, leadColor:selected.leadColor,
          sec:selected.sec, texts, salesPhases:SALES_PHASES,
        }})
      })
      if(!r.ok) throw new Error('PDF napaka')
      const blob=await r.blob()
      const url=URL.createObjectURL(blob)
      const a=document.createElement('a')
      a.href=url;a.download=`insights-${selected.ime.replace(/ /g,'-')}.pdf`;a.click()
      URL.revokeObjectURL(url)
    } catch(e) {alert('PDF napaka: '+e.message)}
    setPdfLoading(false)
  }

  if(!loggedIn) return <LoginScreen onLogin={()=>setLoggedIn(true)}/>

  // ── LIST VIEW ───────────────────────────────────────────────────────────────
  if(view==='list') return (
    <div style={{fontFamily:'system-ui,sans-serif',maxWidth:900,margin:'0 auto',padding:'0 20px 60px',background:'#f7f5f1',minHeight:'100vh'}}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
      <div style={{background:'white',borderBottom:'1px solid #e5e0d8',padding:'14px 20px',display:'flex',alignItems:'center',gap:12,marginBottom:24,position:'sticky',top:0,zIndex:10}}>
        <div style={{width:32,height:32,borderRadius:'50%',background:'conic-gradient(#4a7ab5 0deg 90deg,#c94030 90deg 180deg,#c49a10 180deg 270deg,#2e8a55 270deg 360deg)'}}/>
        <div>
          <div style={{fontFamily:'Georgia,serif',fontSize:15,fontWeight:600}}>Admin panel</div>
          <div style={{fontSize:10,color:'#888'}}>Barvni kompas</div>
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:10,alignItems:'center'}}>
          <div>
            <label style={{fontSize:10,color:'#888',marginRight:6}}>API ključ:</label>
            <input value={apiKey} onChange={e=>{setApiKey(e.target.value);localStorage.setItem('insights_api_key',e.target.value)}}
              type="password" placeholder="sk-ant-..."
              style={{padding:'5px 10px',border:'1px solid #e5e0d8',borderRadius:8,fontSize:11,fontFamily:'monospace',width:180}}/>
          </div>
          <button onClick={loadProfiles} style={{padding:'6px 14px',background:'#f7f5f1',border:'1px solid #e5e0d8',borderRadius:20,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>↻ Osveži</button>
          <button onClick={()=>setView('tools')} style={{padding:'6px 14px',background:'#f7f5f1',border:'1px solid #e5e0d8',borderRadius:20,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>⚙ Orodja</button>
          <button onClick={()=>setView('tim')} style={{padding:'6px 14px',background:'#f7f5f1',border:'1px solid #e5e0d8',borderRadius:20,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>👥 Tim</button>
          <button onClick={()=>setView('sport_tim')} style={{padding:'6px 14px',background:'#e6f5ee',border:'1px solid #2e8a55',borderRadius:20,fontSize:11,cursor:'pointer',fontFamily:'inherit',color:'#1a5c38',fontWeight:500}}>⚽ Šport Tim</button>
          <button onClick={()=>setView('rocni')} style={{padding:'6px 14px',background:'#181818',color:'white',border:'none',borderRadius:20,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>+ Ročni vnos</button>
          <a href="/" style={{padding:'6px 14px',background:'none',border:'1px solid #e5e0d8',borderRadius:20,fontSize:11,color:'#888',textDecoration:'none'}}>← Profiler</a>
        </div>
      </div>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div style={{fontFamily:'Georgia,serif',fontSize:20,fontWeight:600}}>Oddani vprašalniki</div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{display:'flex',gap:6,background:'#f0ece4',borderRadius:20,padding:'3px'}}>
            {[{v:'podjetje',l:'🏢 Podjetje'},{v:'sport',l:'⚽ Šport'}].map(({v,l})=>(
              <button key={v} onClick={()=>setMode(v)} style={{padding:'5px 14px',background:mode===v?'white':'transparent',border:'none',borderRadius:16,fontSize:12,fontWeight:mode===v?600:400,color:mode===v?'#1a1a1a':'#888',cursor:'pointer',fontFamily:'inherit',boxShadow:mode===v?'0 1px 4px rgba(0,0,0,0.1)':'none',transition:'all 0.15s'}}>{l}</button>
            ))}
          </div>
          <div style={{fontSize:12,color:'#888'}}>{profiles.length} profilov</div>
        </div>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{fontSize:11,color:'#888',fontWeight:600}}>Tim:</div>
        {['Vsi',...[...new Set(profiles.map(p=>p.tim).filter(Boolean))].sort()].map(t=>(
          <button key={t} onClick={()=>setFilterTim(t==='Vsi'?'':t)}
            style={{padding:'5px 12px',background:filterTim===(t==='Vsi'?'':t)?'#181818':'white',color:filterTim===(t==='Vsi'?'':t)?'white':'#888',border:'1px solid #e5e0d8',borderRadius:20,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
            {t}
          </button>
        ))}
        {filterTim&&<div style={{fontSize:11,color:'#4a7ab5',marginLeft:4}}>{profiles.filter(p=>p.tim===filterTim).length} profilov</div>}
      </div>

      {profiles.length===0?(
        <div style={{background:'white',border:'1px solid #e5e0d8',borderRadius:16,padding:'40px',textAlign:'center',color:'#aaa'}}>
          <div style={{fontSize:32,marginBottom:12}}>📋</div>
          <div style={{fontSize:14}}>Ni oddanih vprašalnikov.</div>
          <div style={{fontSize:12,marginTop:6}}>Delite link <strong style={{color:'#181818'}}>/oddaj</strong> s strankami.</div>
        </div>
      ):(
        <div style={{display:'grid',gap:10}}>
          {profiles.filter(p=>!filterTim||p.tim===filterTim).map(p=>{
            const {con}=calcScores(p.answers, p.con, p.uncon)
            const typeName=getType(con)
            const typeData=TYPES[typeName]
            const lc=[{k:'B',v:con.B},{k:'R',v:con.R},{k:'G',v:con.G},{k:'Y',v:con.Y}].sort((a,b)=>b.v-a.v)[0].k
            const date=new Date(p.created_at).toLocaleDateString('sl-SI',{day:'numeric',month:'short',year:'numeric'})
            return (
              <div key={p.id}
                style={{background:'white',border:'1px solid #e5e0d8',borderRadius:14,padding:'16px 20px',display:'flex',alignItems:'center',gap:16,boxShadow:'0 1px 8px rgba(0,0,0,.04)',transition:'border-color .2s'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=CLR[lc]}
                onMouseLeave={e=>e.currentTarget.style.borderColor='#e5e0d8'}>
                <div onClick={()=>openProfile(p)} style={{width:36,height:36,borderRadius:'50%',background:CLR_L[lc],border:`2px solid ${CLR[lc]}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,cursor:'pointer'}}>
                  <span style={{fontSize:13,fontWeight:700,color:CLR_D[lc]}}>{lc}</span>
                </div>
                <div onClick={()=>openProfile(p)} style={{flex:1,cursor:'pointer'}}>
                  <div style={{fontWeight:600,fontSize:15,marginBottom:2}}>{p.ime}</div>
                  <div style={{fontSize:11,color:'#888'}}>
              {p.mode==='sport'&&<span style={{background:'#e6f5ee',color:'#1a5c38',borderRadius:10,padding:'1px 7px',marginRight:6,fontSize:10,fontWeight:600}}>⚽ Šport{p.sport?' · '+p.sport:''}</span>}
              {p.mode!=='sport'&&<span style={{background:'#f0f4ff',color:'#4a7ab5',borderRadius:10,padding:'1px 7px',marginRight:6,fontSize:10,fontWeight:600}}>🏢 Podjetje</span>}
              {p.tim&&<span style={{background:'#f0f4ff',color:'#4a7ab5',borderRadius:10,padding:'1px 7px',marginRight:6,fontSize:10,fontWeight:600}}>{p.tim}</span>}
              {p.podjetje&&`${p.podjetje} · `}{typeData.sl} · {date}
            </div>
                </div>
                <MiniBar con={con}/>
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  <button onClick={e=>{e.stopPropagation();setEditProfile(p)}} style={{padding:'4px 10px',background:'none',border:'1px solid #e5e0d8',borderRadius:20,fontSize:11,color:'#888',cursor:'pointer',fontFamily:'inherit'}}>✏️</button>
                  <button onClick={e=>{e.stopPropagation();if(confirm('Izbriši profil '+p.ime+'?'))deleteProfile(p.id)}} style={{padding:'4px 10px',background:'none',border:'1px solid #faeaea',borderRadius:20,fontSize:11,color:'#c94030',cursor:'pointer',fontFamily:'inherit'}}>🗑</button>
                  <div onClick={()=>openProfile(p)} style={{fontSize:20,color:'#ccc',cursor:'pointer'}}>›</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editProfile&&<EditProfileModal profile={editProfile} onClose={()=>setEditProfile(null)} onSave={async(updated)=>{
        try{
          await fetch('/api/admin/update-profile',{method:'POST',headers:{'Content-Type':'application/json','x-admin-key':'insights2024'},body:JSON.stringify(updated)})
          loadProfiles()
          setEditProfile(null)
        }catch(e){alert('Napaka: '+e.message)}
      }}/>}

      <div style={{marginTop:24,background:'white',border:'1px solid #e5e0d8',borderRadius:14,padding:'16px 20px'}}>
        <div style={{fontFamily:'Georgia,serif',fontSize:14,fontWeight:600,marginBottom:6}}>Strankam delite ta link za izpolnitev vprašalnika:</div>
        <div style={{background:'#f7f5f1',padding:'10px 14px',borderRadius:8,fontSize:13,fontFamily:'monospace',color:'#4a7ab5',userSelect:'all'}}>
          {window.location.origin}/oddaj
        </div>
      </div>
    </div>
  )


  if(view==='tools') return <ToolsView onBack={()=>setView('list')} />
  if(view==='rocni') return <RocniVnosView onBack={()=>setView('list')} onSuccess={loadProfiles} />
  if(view==='tim') return <TimDashboard profiles={profiles} onBack={()=>setView('list')} />
  if(view==='sport_tim') return <SportTimDashboard profiles={profiles} onBack={()=>setView('list')} />

  // ── PREVIEW VIEW ──────────────────────────────────────────────────────────
  const PCLR={B:'#4a7ab5',R:'#c94030',G:'#2e8a55',Y:'#c49a10'}
  const PCLR_L={B:'#e8f0fa',R:'#faeaea',G:'#e6f5ee',Y:'#fdf6e3'}
  const PCLR_D={B:'#1a4a7a',R:'#a8291a',G:'#1a5c38',Y:'#8a6200'}

  if(view==='preview') {
    const CLR=PCLR, CLR_L=PCLR_L, CLR_D=PCLR_D
    const lc=selected.leadColor
    const ime1=selected.ime.trim().split(' ')[0]

    function PreviewSection({id, label, isBold}) {
      const [editing, setEditing] = useState(false)
      const [val, setVal] = useState(texts[id]||'')
      const items = isBold ? parseBoldList(val) : []

      async function save() {
        const newTexts={...texts,[id]:val}
        setTexts(newTexts)
        setEditing(false)
        try {
          await fetch('/api/admin/save-text',{
            method:'POST',headers:{'Content-Type':'application/json','x-admin-key':'insights2024'},
            body:JSON.stringify({profileId:selected.id,sectionId:id,text:val})
          })
        } catch(e){}
      }

      if(!val) return null

      return (
        <div style={{marginBottom:20,pageBreakInside:'avoid'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:3,height:'100%',minHeight:20,background:CLR[lc],borderRadius:2}}/>
              <div style={{fontFamily:'Georgia,serif',fontSize:15,fontWeight:600}}>{label}</div>
            </div>
            {!editing?(
              <button onClick={()=>setEditing(true)}
                style={{padding:'3px 10px',background:'none',border:'1px solid #e5e0d8',borderRadius:20,fontSize:11,color:'#888',cursor:'pointer',fontFamily:'inherit',flexShrink:0}}>
                ✏️ Uredi
              </button>
            ):(
              <div style={{display:'flex',gap:6,flexShrink:0}}>
                <button onClick={save} style={{padding:'3px 10px',background:'#181818',color:'white',border:'none',borderRadius:20,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>✓ Shrani</button>
                <button onClick={()=>{setEditing(false);setVal(texts[id]||'')}} style={{padding:'3px 10px',background:'none',border:'1px solid #e5e0d8',borderRadius:20,fontSize:11,color:'#888',cursor:'pointer',fontFamily:'inherit'}}>✗</button>
              </div>
            )}
          </div>
          {editing?(
            <textarea value={val} onChange={e=>setVal(e.target.value)}
              style={{width:'100%',minHeight:150,padding:'10px 12px',border:'1.5px solid #4a7ab5',borderRadius:8,fontSize:13,fontFamily:'inherit',lineHeight:1.75,resize:'vertical',outline:'none'}}
              autoFocus/>
          ):isBold?(
            <div style={{paddingLeft:11}}>
              {items.map((item,i)=>(
                <div key={i} style={{padding:'6px 0',borderBottom:i<items.length-1?'1px solid #f0ece4':'none'}}>
                  {item.title&&<div style={{fontSize:13,fontWeight:600,color:'#181818',marginBottom:2}}>{item.title}</div>}
                  {item.desc&&<div style={{fontSize:13,color:'#6b6460',lineHeight:1.65}}>{item.desc}</div>}
                </div>
              ))}
            </div>
          ):(
            <div style={{paddingLeft:11,fontSize:13,color:'#4a4a4a',lineHeight:1.8}}>{val}</div>
          )}
        </div>
      )
    }

    return (
      <div style={{fontFamily:'system-ui,sans-serif',background:'#f7f5f1',minHeight:'100vh'}}>
        {/* Preview header */}
        <div style={{background:'white',borderBottom:'1px solid #e5e0d8',padding:'12px 24px',display:'flex',alignItems:'center',gap:10,position:'sticky',top:0,zIndex:20}}>
          <button onClick={()=>{setView('profile');loadProfiles()}} style={{padding:'5px 12px',background:'none',border:'1px solid #e5e0d8',borderRadius:20,fontSize:11,color:'#888',cursor:'pointer',fontFamily:'inherit'}}>← Nazaj</button>
          <div style={{fontFamily:'Georgia,serif',fontSize:14,fontWeight:600,marginLeft:6}}>{selected.ime}</div>
          <div style={{fontSize:11,color:'#888'}}>Preview profila</div>
          <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
            <div style={{fontSize:11,color:'#888'}}>Uredi sekcije in generiraj PDF</div>
            <button onClick={handlePdf} disabled={pdfLoading}
              style={{padding:'7px 16px',background:pdfLoading?'#888':'#181818',color:'white',border:'none',borderRadius:20,fontSize:12,fontWeight:500,cursor:pdfLoading?'not-allowed':'pointer',fontFamily:'inherit'}}>
              {pdfLoading?'Generiram...':'⬇ Generiraj PDF'}
            </button>
          </div>
        </div>

        {/* A4 preview */}
        <div style={{maxWidth:794,margin:'24px auto',paddingBottom:40}}>

          {/* Cover simulacija */}
          <div style={{background:'#1a1a2e',color:'white',borderRadius:16,padding:'40px 44px',marginBottom:16,minHeight:200}}>
            <div style={{fontSize:11,opacity:.4,letterSpacing:'.12em',textTransform:'uppercase',marginBottom:8}}>Barvni kompas · Osebni profil</div>
            <div style={{fontFamily:'Georgia,serif',fontSize:32,fontWeight:700,marginBottom:6}}>{selected.ime}</div>
            <div style={{fontSize:14,color:CLR[lc],marginBottom:4}}>{selected.typeData.sl}</div>
            <div style={{fontSize:11,opacity:.4}}>{new Date().toLocaleDateString('sl-SI',{day:'numeric',month:'long',year:'numeric'})}</div>
          </div>

          {/* Grafikoni info */}
          <div style={{background:'white',border:'1px solid #e5e0d8',borderRadius:16,padding:'20px 24px',marginBottom:16}}>
            <div style={{fontFamily:'Georgia,serif',fontSize:15,fontWeight:600,marginBottom:12,color:'#888',fontStyle:'italic'}}>Barvni profil & Grafikoni</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
              {['B','G','Y','R'].map(k=>{
                const labels={B:'Analitična modra',R:'Aktivna rdeča',G:'Stabilna zelena',Y:'Navdušena rumena'}
                const sc=selected.con[k]
                return (
                  <div key={k} style={{background:CLR_L[k],borderRadius:10,padding:'10px 12px',border:`1px solid ${CLR[k]}33`}}>
                    <div style={{fontSize:10,fontWeight:600,color:CLR_D[k],marginBottom:4}}>{labels[k]}</div>
                    <div style={{fontSize:20,fontWeight:700,color:CLR[k]}}>{sc.toFixed(1)}</div>
                    <div style={{width:'100%',height:4,background:'#f0ece4',borderRadius:2,marginTop:6,overflow:'hidden'}}>
                      <div style={{height:'100%',background:CLR[k],width:`${(sc/6)*100}%`,borderRadius:2}}/>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Generirane sekcije */}
          <div style={{background:'white',border:'1px solid #e5e0d8',borderRadius:16,padding:'24px',marginBottom:16}}>
            <div style={{fontFamily:'Georgia,serif',fontSize:16,fontWeight:600,marginBottom:18,paddingBottom:10,borderBottom:'2px solid #333'}}>Osebnostni profil</div>
            <PreviewSection id="stil" label="Osebni stil" isBold={false}/>
            <PreviewSection id="inter" label="Interakcija z drugimi" isBold={false}/>
            <PreviewSection id="odl" label="Sprejemanje odločitev" isBold={false}/>
            <PreviewSection id="pritisk" label="Vedenje pod pritiskom" isBold={false}/>
          </div>

          {(texts.pred||texts.slab)&&(
            <div style={{background:'white',border:'1px solid #e5e0d8',borderRadius:16,padding:'24px',marginBottom:16}}>
              <div style={{fontFamily:'Georgia,serif',fontSize:16,fontWeight:600,marginBottom:18,paddingBottom:10,borderBottom:'2px solid #333'}}>Prednosti & Slabosti</div>
              <PreviewSection id="pred" label="Ključne prednosti" isBold={true}/>
              <PreviewSection id="slab" label="Možne slabosti" isBold={true}/>
            </div>
          )}

          {(texts.tim||texts.okol||texts.motiv||texts.kom)&&(
            <div style={{background:'white',border:'1px solid #e5e0d8',borderRadius:16,padding:'24px',marginBottom:16}}>
              <div style={{fontFamily:'Georgia,serif',fontSize:16,fontWeight:600,marginBottom:18,paddingBottom:10,borderBottom:'2px solid #333'}}>Tim & Okolje</div>
              <PreviewSection id="tim" label="Prispevek k timu" isBold={false}/>
              <PreviewSection id="okol" label="Idealno delovno okolje" isBold={false}/>
              <PreviewSection id="motiv" label="Motivacija in strahovi" isBold={false}/>
              <PreviewSection id="kom" label="Komunikacijski nasveti" isBold={true}/>
            </div>
          )}

          {(texts.razv||texts.slepe||texts.naspr)&&(
            <div style={{background:'white',border:'1px solid #e5e0d8',borderRadius:16,padding:'24px',marginBottom:16}}>
              <div style={{fontFamily:'Georgia,serif',fontSize:16,fontWeight:600,marginBottom:18,paddingBottom:10,borderBottom:'2px solid #333'}}>Razvoj & Odnosi</div>
              <PreviewSection id="razv" label="Predlogi za razvoj" isBold={false}/>
              <PreviewSection id="slepe" label="Slepe pege" isBold={false}/>
              <PreviewSection id="naspr" label="Nasprotni tip" isBold={false}/>
            </div>
          )}

          {/* Prodajno poglavje - statično */}
          <div style={{background:'white',border:'1px solid #e5e0d8',borderRadius:16,padding:'24px',marginBottom:16}}>
            <div style={{fontFamily:'Georgia,serif',fontSize:16,fontWeight:600,marginBottom:4,paddingBottom:10,borderBottom:'2px solid #333'}}>Prodajno poglavje</div>
            <div style={{fontSize:12,color:'#888',marginBottom:16}}>Statična vsebina — generira se avtomatsko glede na profil</div>
            {[
              {id:'pred',label:'1. Pred prodajnim procesom',icon:'🎯',scoreKey:'B'},
              {id:'potrebe',label:'2. Ugotavljanje potreb',icon:'🔍',scoreKey:'G'},
              {id:'predlog',label:'3. Dajanje predlogov',icon:'💡',scoreKey:'B'},
              {id:'ugovori',label:'4. Upravljanje z ugovori',icon:'🛡',scoreKey:'R'},
              {id:'zvestoba',label:'5. Pridobivanje zvestobe',icon:'🤝',scoreKey:'G'},
              {id:'sledenje',label:'6. Sledenje in zaključek',icon:'✅',scoreKey:'R'},
            ].map(phase=>{
              const score=selected.con[phase.scoreKey]
              const level=score>=4.0?'Naravna prednost':score>=2.5?'Zavestno področje':'Področje razvoja'
              const lvlColor=score>=4.0?'#1a5c38':score>=2.5?'#8a6200':'#a8291a'
              const lvlBg=score>=4.0?'#e6f5ee':score>=2.5?'#fdf6e3':'#faeaea'
              return (
                <div key={phase.id} style={{border:'1px solid #e8e3db',borderRadius:10,padding:'12px 14px',marginBottom:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                    <div style={{fontFamily:'Georgia,serif',fontSize:13,fontWeight:600}}>{phase.icon} {phase.label}</div>
                    <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:lvlBg,color:lvlColor}}>{level}</span>
                  </div>
                  <div style={{fontSize:11,color:'#888'}}>Ocena: {score.toFixed(2)}/6</div>
                </div>
              )
            })}
          </div>

          <div style={{textAlign:'center',padding:'20px 0'}}>
            <button onClick={handlePdf} disabled={pdfLoading}
              style={{padding:'13px 36px',background:pdfLoading?'#888':'#181818',color:'white',border:'none',borderRadius:50,fontSize:14,fontWeight:500,cursor:pdfLoading?'not-allowed':'pointer',fontFamily:'inherit'}}>
              {pdfLoading?'Generiram PDF...':'⬇ Generiraj PDF'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── PROFILE VIEW ────────────────────────────────────────────────────────────
  const {con,uncon,typeData,variant,leadColor,sec,flow,total}=selected
  const ime1=selected.ime.trim().split(' ')[0]
  const groups=[...new Set(SECTIONS.map(s=>s.group))]

  return (
    <div style={{fontFamily:'system-ui,sans-serif',maxWidth:900,margin:'0 auto',padding:'0 20px 60px',background:'#f7f5f1',minHeight:'100vh'}}>
      <div style={{background:'white',borderBottom:'1px solid #e5e0d8',padding:'12px 18px',display:'flex',alignItems:'center',gap:10,position:'sticky',top:0,zIndex:20}}>
        <button onClick={()=>setView('list')} style={{padding:'5px 12px',background:'none',border:'1px solid #e5e0d8',borderRadius:20,fontSize:11,color:'#888',cursor:'pointer',fontFamily:'inherit'}}>← Nazaj</button>
        <div style={{fontFamily:'Georgia,serif',fontSize:14,fontWeight:600,marginLeft:6}}>{selected.ime}</div>
        <div style={{fontSize:11,color:'#888'}}>{typeData.sl}</div>
        {selected.mode==='sport'&&<span style={{background:'#e6f5ee',color:'#1a5c38',borderRadius:10,padding:'2px 8px',fontSize:10,fontWeight:600}}>⚽ {selected.sport||'Šport'}{selected.pozicija?' · '+selected.pozicija:''}</span>}
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          {generated.size>0&&(
            <button onClick={()=>setView('preview')}
              style={{padding:'6px 14px',background:'#f0f4ff',color:'#1a4a7a',border:'1px solid #4a7ab5',borderRadius:20,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
              👁 Preview
            </button>
          )}
          {selected.mode==='sport' ? (<>
            <button onClick={handleSportPdf} disabled={pdfLoading}
              style={{padding:'6px 14px',background:pdfLoading?'#888':'#2e8a55',color:'white',border:'none',borderRadius:20,fontSize:11,cursor:pdfLoading?'not-allowed':'pointer',fontFamily:'inherit'}}>
              {pdfLoading?'Generiram...':'⚽ Šport PDF'}
            </button>
            <button onClick={handleSportHtml} disabled={pdfLoading}
              style={{padding:'6px 14px',background:pdfLoading?'#888':'#534AB7',color:'white',border:'none',borderRadius:20,fontSize:11,cursor:pdfLoading?'not-allowed':'pointer',fontFamily:'inherit'}}>
              {pdfLoading?'Generiram...':'🌐 Šport HTML'}
            </button>
          </>) : (
            <>
            <button onClick={handlePdfPremium} disabled={pdfLoading}
              style={{padding:'6px 14px',background:pdfLoading?'#888':'#c49a10',color:'white',border:'none',borderRadius:20,fontSize:11,cursor:pdfLoading?'not-allowed':'pointer',fontFamily:'inherit'}}>
              {pdfLoading?'Generiram...':'⭐ PDF Premium'}
            </button>
            <button onClick={handleHtmlReport} disabled={pdfLoading}
              style={{padding:'6px 14px',background:pdfLoading?'#888':'#534AB7',color:'white',border:'none',borderRadius:20,fontSize:11,cursor:pdfLoading?'not-allowed':'pointer',fontFamily:'inherit'}}>
              {pdfLoading?'Generiram...':'🌐 HTML Report'}
            </button>
  
            </>
          )}
          <button onClick={handlePdf} disabled={pdfLoading}
            style={{padding:'6px 14px',background:pdfLoading?'#888':'#181818',color:'white',border:'none',borderRadius:20,fontSize:11,cursor:pdfLoading?'not-allowed':'pointer',fontFamily:'inherit'}}>
            {pdfLoading?'Generiram...':'⬇ PDF'}
          </button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'320px 1fr',gap:16,marginTop:20}}>

        {/* Leva kolona — profil info + checkbox */}
        <div>
          {/* Scores */}
          <div style={{background:'white',border:'1px solid #e5e0d8',borderRadius:14,padding:'16px',marginBottom:12}}>
            <div style={{fontFamily:'Georgia,serif',fontSize:14,fontWeight:600,marginBottom:12}}>Barvni profil</div>
            {['B','G','Y','R'].map(k=>{
              const labels={B:'Analitična modra',R:'Aktivna rdeča',G:'Stabilna zelena',Y:'Navdušena rumena'}
              const sc=con[k]
              return (
                <div key={k} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <div style={{width:10,height:10,borderRadius:'50%',background:CLR[k],flexShrink:0}}/>
                  <div style={{fontSize:11,color:'#444',width:100}}>{labels[k]}</div>
                  <div style={{flex:1,height:6,background:'#f0ece4',borderRadius:3,overflow:'hidden'}}>
                    <div style={{height:'100%',background:CLR[k],width:`${(sc/6)*100}%`,borderRadius:3}}/>
                  </div>
                  <div style={{fontSize:11,fontWeight:600,color:CLR_D[k],width:28,textAlign:'right'}}>{sc.toFixed(1)}</div>
                </div>
              )
            })}
            <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid #f0ece4',fontSize:11,color:'#888'}}>
              {typeData.sl} · {variant} · Flow: {total}%
            </div>
          </div>

          {/* Checkbox sekcije */}
          <div style={{background:'white',border:'1px solid #e5e0d8',borderRadius:14,padding:'16px',marginBottom:12}}>
            <div style={{fontFamily:'Georgia,serif',fontSize:14,fontWeight:600,marginBottom:12}}>Izberi za generiranje</div>
            {groups.filter(group => selected && selected.mode === 'sport' ? group === 'Šport' : group !== 'Šport').map(group=>(
              <div key={group} style={{marginBottom:14}}>
                <div style={{fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'.08em',color:'#888',marginBottom:6}}>{group}</div>
                {SECTIONS.filter(s=>s.group===group).map(s=>{
                  const isSel=checkedSections.has(s.id)
                  const isDone=generated.has(s.id)
                  const isNow=generating===s.id
                  const isQ=queuedIds.includes(s.id)
                  return (
                    <div key={s.id} onClick={()=>{
                      setCheckedSections(prev=>{const n=new Set(prev);n.has(s.id)?n.delete(s.id):n.add(s.id);return n})
                    }} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderRadius:8,cursor:'pointer',marginBottom:3,background:isSel?'#f0f4ff':'transparent'}}>
                      <div style={{width:14,height:14,borderRadius:3,border:`1.5px solid ${isSel?CLR.B:'#ccc'}`,background:isSel?CLR.B:'white',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        {isSel&&<span style={{color:'white',fontSize:9}}>✓</span>}
                      </div>
                      <span style={{fontSize:12,flex:1,color:'#181818'}}>{s.label}</span>
                      {isDone&&!isNow&&<span style={{fontSize:10,color:'#1a5c38'}}>✓</span>}
                      {isNow&&<div style={{width:9,height:9,border:'1.5px solid #4a7ab5',borderTop:'1.5px solid transparent',borderRadius:'50%',animation:'spin .8s linear infinite'}}/>}
                      {isQ&&<span style={{fontSize:9,color:'#aaa'}}>v vrsti</span>}
                    </div>
                  )
                })}
              </div>
            ))}

            <button onClick={handleGenerate} disabled={!!generating||!checkedSections.size}
              style={{width:'100%',padding:'10px',background:generating?'#aaa':'#181818',color:'white',border:'none',borderRadius:50,fontSize:13,fontWeight:500,cursor:generating?'not-allowed':'pointer',fontFamily:'inherit',marginTop:6}}>
              {generating?(
                <span style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',background:'white',animation:'pulse 1s infinite'}}></span>
                  {SECTIONS.find(s=>s.id===generating)?.label||generating}
                  <span style={{fontSize:10,opacity:0.6}}>({Math.round((generated.size/(checkedSections.size||1))*100)}%)</span>
                </span>
              ):`Generiraj ${checkedSections.size} sekcij →`}
            </button>
            {generated.size>0&&!generating&&<div style={{textAlign:'center',fontSize:11,color:'#1a5c38',marginTop:8}}>✓ {generated.size} sekcij generirano</div>}


          </div>
        </div>

        {/* Desna kolona — generirane sekcije */}
        <div>
          {generated.size===0&&generating===null&&Object.keys(texts).length===0&&(
            <div style={{background:'white',border:'1px solid #e5e0d8',borderRadius:14,padding:'40px',textAlign:'center',color:'#aaa'}}>
              <div style={{fontSize:24,marginBottom:10}}>✨</div>
              <div style={{fontSize:13}}>Izberi sekcije in klikni "Generiraj"</div>
            </div>
          )}

          {SECTIONS.map(s=>{
            const isGen=generated.has(s.id),isNow=generating===s.id,isQ=queuedIds.includes(s.id)
            if(!isGen&&!isNow&&!isQ) return null
            const isBold=s.id==='pred'||s.id==='slab'||s.id==='kom'
            const txt=texts[s.id]||''
            const boldItems=isBold?parseBoldList(txt):[]
            const isEditing=editingId===s.id
            return (
              <div key={s.id} style={{background:'white',border:`1px solid ${isEditing?'#4a7ab5':'#e5e0d8'}`,borderRadius:14,padding:'16px 18px',marginBottom:10,boxShadow:'0 1px 8px rgba(0,0,0,.04)'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  {isNow&&<div style={{width:11,height:11,border:'2px solid #4a7ab5',borderTop:'2px solid transparent',borderRadius:'50%',animation:'spin .8s linear infinite'}}/>}
                  {isQ&&<div style={{width:7,height:7,borderRadius:'50%',background:'#e5e0d8'}}/>}
                  {isGen&&!isNow&&!isEditing&&<div style={{width:7,height:7,borderRadius:'50%',background:'#2e8a55'}}/>}
                  {isEditing&&<div style={{width:7,height:7,borderRadius:'50%',background:'#4a7ab5'}}/>}
                  <div style={{fontFamily:'Georgia,serif',fontSize:14,fontWeight:600,flex:1}}>{s.label}</div>
                  {isGen&&!isNow&&!isEditing&&(
                    <div style={{display:'flex',gap:6}}>
                      <button onClick={()=>{setGenerated(prev=>{const n=new Set(prev);n.delete(s.id);return n});generateNext([s.id],texts,selected)}} disabled={!!generating} style={{padding:'3px 10px',background:'none',border:'1px solid #e5e0d8',borderRadius:20,fontSize:11,color:'#888',cursor:'pointer',fontFamily:'inherit',opacity:generating?0.4:1}}>↺</button>
                      <button onClick={()=>startEdit(s.id,txt)} style={{padding:'3px 10px',background:'none',border:'1px solid #e5e0d8',borderRadius:20,fontSize:11,color:'#888',cursor:'pointer',fontFamily:'inherit'}}>✏️ Uredi</button>
                    </div>
                  )}
                  {isEditing&&(
                    <div style={{display:'flex',gap:6}}>
                      <button onClick={()=>saveEdit(s.id)}
                        style={{padding:'3px 10px',background:'#181818',color:'white',border:'none',borderRadius:20,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
                        ✓ Shrani
                      </button>
                      <button onClick={cancelEdit}
                        style={{padding:'3px 10px',background:'none',border:'1px solid #e5e0d8',borderRadius:20,fontSize:11,color:'#888',cursor:'pointer',fontFamily:'inherit'}}>
                        ✗ Prekliči
                      </button>
                    </div>
                  )}
                </div>
                {(isNow||isQ)&&<div style={{fontSize:13,color:'#ccc',animation:'pulse 1.5s ease-in-out infinite'}}>{isNow?'Generiram...':'V vrsti...'}</div>}
                {isEditing&&(
                  <textarea
                    value={editingText}
                    onChange={e=>setEditingText(e.target.value)}
                    style={{width:'100%',minHeight:160,padding:'10px 12px',border:'1px solid #e5e0d8',borderRadius:8,fontSize:13,fontFamily:'inherit',lineHeight:1.7,resize:'vertical',outline:'none',color:'#181818'}}
                    autoFocus
                  />
                )}
                {isGen&&!isNow&&!isEditing&&isBold&&(
                  <div>{boldItems.map((item,i)=>(
                    <div key={i} style={{padding:'7px 0',borderBottom:i<boldItems.length-1?'1px solid #f0ece4':'none'}}>
                      {item.title&&<div style={{fontSize:13,fontWeight:600,color:'#181818',marginBottom:2}}>{item.title}</div>}
                      {item.desc&&<div style={{fontSize:13,color:'#6b6460',lineHeight:1.65}}>{item.desc}</div>}
                    </div>
                  ))}</div>
                )}
                {isGen&&!isNow&&!isEditing&&!isBold&&<div style={{fontSize:13,color:'#6b6460',lineHeight:1.75}}>{txt}</div>}
              </div>
            )
          })}


        </div>
      </div>


      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:.35}50%{opacity:1}}`}</style>
    </div>
  )
}
