require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

const { sklanjaj } = require('./slovenska-sklanjatev.cjs')
const sklanjajFull = require('./slovenska-sklanjatev.cjs').sklanjaj

const app = express()
app.use(cors())
app.use(express.json({limit: '10mb'}))
app.use(express.static(path.join(__dirname, 'dist')))

// ─── DATABASE (JSON file) ──────────────────────────────────────────────────────
const DB_FILE = path.join(__dirname, 'profiles.json')

function loadDb() {
  if(!fs.existsSync(DB_FILE)) return {profiles:[]}
  try { return JSON.parse(fs.readFileSync(DB_FILE,'utf8')) }
  catch(e) { return {profiles:[]} }
}

function saveDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
}

const ADMIN_KEY = 'insights2024'
function requireAdmin(req, res, next) {
  if(req.headers['x-admin-key'] !== ADMIN_KEY) return res.status(401).json({error:'Unauthorized'})
  next()
}

// ─── CLIENT SUBMIT ────────────────────────────────────────────────────────────
app.post('/api/submit', (req, res) => {
  const { ime, email, podjetje, answers } = req.body
  if(!ime || !answers) return res.status(400).json({error:'Manjkajoči podatki'})
  const data = loadDb()
  const id = Date.now()
  data.profiles.push({id, ime, email:email||'', podjetje:podjetje||'', answers, texts:{}, created_at:new Date().toISOString()})
  saveDb(data)
  res.json({success:true, id})
})

// ─── ADMIN: LIST PROFILES ─────────────────────────────────────────────────────
app.get('/api/admin/profiles', requireAdmin, (req, res) => {
  const data = loadDb()
  res.json({profiles: [...data.profiles].reverse()})
})

// ─── ADMIN: SAVE TEXT ─────────────────────────────────────────────────────────
app.post('/api/admin/save-text', requireAdmin, (req, res) => {
  const { profileId, sectionId, text } = req.body
  const data = loadDb()
  const profile = data.profiles.find(p=>p.id===profileId)
  if(!profile) return res.status(404).json({error:'Profil ni najden'})
  if(!profile.texts) profile.texts = {}
  profile.texts[sectionId] = text
  saveDb(data)
  res.json({success:true})
})


// ─── ADMIN: UPDATE PROFILE ────────────────────────────────────────────────────
app.post('/api/admin/update-profile', requireAdmin, (req, res) => {
  const { id, ime, email, podjetje, spol, tim, con, uncon, sn, delovno_mesto, mode, pozicija, sport } = req.body
  if(!id) return res.status(400).json({error:'Manjka ID'})
  const data = loadDb()
  const idx = data.profiles.findIndex(p=>p.id===id)
  if(idx<0) return res.status(404).json({error:'Profil ni najden'})
  data.profiles[idx] = {
    ...data.profiles[idx],
    ime: ime||data.profiles[idx].ime,
    email: email!==undefined ? email : data.profiles[idx].email,
    podjetje: podjetje!==undefined ? podjetje : data.profiles[idx].podjetje,
    spol: spol||data.profiles[idx].spol,
    tim: tim!==undefined ? tim : data.profiles[idx].tim,
    con: con||data.profiles[idx].con,
    uncon: uncon||data.profiles[idx].uncon,
    sn: sn!==undefined ? sn : data.profiles[idx].sn,
    delovno_mesto: delovno_mesto!==undefined ? delovno_mesto : data.profiles[idx].delovno_mesto,
    mode: mode!==undefined ? mode : data.profiles[idx].mode,
    pozicija: pozicija!==undefined ? pozicija : data.profiles[idx].pozicija,
    sport: sport!==undefined ? sport : data.profiles[idx].sport,
    updated_at: new Date().toISOString()
  }
  saveDb(data)
  res.json({success:true})
})

// ─── ADMIN: DELETE PROFILE ────────────────────────────────────────────────────
app.post('/api/admin/delete-profile', requireAdmin, (req, res) => {
  const { id } = req.body
  if(!id) return res.status(400).json({error:'Manjka ID'})
  const data = loadDb()
  const before = data.profiles.length
  data.profiles = data.profiles.filter(p=>p.id!==id)
  if(data.profiles.length===before) return res.status(404).json({error:'Profil ni najden'})
  saveDb(data)
  res.json({success:true})
})

// ─── API PROXY ────────────────────────────────────────────────────────────────
app.post('/api/claude', async (req, res) => {
  const { system, prompt } = req.body
  const apiKey = process.env.ANTHROPIC_API_KEY
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        system: system,
        messages: [{ role: 'user', content: prompt }]
      })
    })
    const data = await response.json()
    if (data.error) return res.status(400).json({ error: data.error.message })
    const text = data.content?.map(b => b.text || '').join('') || ''
    res.json({ text })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// ─── HTML REPORT ─────────────────────────────────────────────────────────────
app.post('/api/html-report', (req, res) => {
  const { profileData: d } = req.body
  const CLR = {B:'#4a7ab5',R:'#c94030',G:'#2e8a55',Y:'#c49a10'}
  const CLR_L = {B:'#e8f0fa',R:'#faeaea',G:'#e6f5ee',Y:'#fdf6e3'}
  const CLR_D = {B:'#1a4a7a',R:'#a8291a',G:'#1a5c38',Y:'#8a6200'}
  const CLR_NAME = {B:'Analitična modra',R:'Aktivna rdeča',G:'Stabilna zelena',Y:'Navdušena rumena'}

  const lc = d.leadColor
  const mainClr = CLR[lc]
  const lightClr = CLR_L[lc]
  const darkClr = CLR_D[lc]
  const texts = d.texts || {}
  const con = d.con || {}
  const ime1 = d.ime.trim().split(' ')[0]


  const sorted = ['B','R','G','Y'].map(k=>({k,v:con[k]||0})).sort((a,b)=>b.v-a.v)
  // ── PERSONA TAGS ──────────────────────────────────────────────────────────
  const PERSONA_TAGS = {
    B: {
      m: {
        M: ['Analitičen','Sistematičen','Natančen','Metodičen','Temeljit','Logičen'],
        Z: ['Analitična','Sistematična','Natančna','Metodična','Temeljita','Logična'],
      },
      s: {
        M: ['Premišljen','Zanesljiv','Strukturiran','Zbran','Dosleden','Racionalen'],
        Z: ['Premišljena','Zanesljiva','Strukturirana','Zbrana','Dosledna','Racionalna'],
      },
    },
    R: {
      m: {
        M: ['Odločen','Direkten','Pogumen','Neposreden','Tekmovalen','Akcijski'],
        Z: ['Odločna','Direktna','Pogumna','Neposredna','Tekmovalna','Akcijska'],
      },
      s: {
        M: ['Ciljno usmerjen','Energičen','Samozavesten','Rezultatski','Proaktiven','Iniciativni'],
        Z: ['Ciljno usmerjena','Energična','Samozavestna','Rezultatska','Proaktivna','Iniciativna'],
      },
    },
    G: {
      m: {
        M: ['Empatičen','Harmoničen','Zvest','Skrben','Povezovalen','Zaupanja vreden'],
        Z: ['Empatična','Harmonična','Zvesta','Skrbna','Povezovalna','Zaupanja vredna'],
      },
      s: {
        M: ['Potrpežljiv','Stabilen','Prijazen','Podporen','Diplomatičen','Taktičen'],
        Z: ['Potrpežljiva','Stabilna','Prijazna','Podporna','Diplomatična','Taktična'],
      },
    },
    Y: {
      m: {
        M: ['Optimističen','Navdušujoč','Vizionarski','Ustvarjalen','Spontan','Karizmatičen'],
        Z: ['Optimistična','Navdušujoča','Vizionarska','Ustvarjalna','Spontana','Karizmatična'],
      },
      s: {
        M: ['Komunikativen','Odprt','Dinamičen','Inovativen','Fleksibilen','Radoveden'],
        Z: ['Komunikativna','Odprta','Dinamična','Inovativna','Fleksibilna','Radovedna'],
      },
    },
  }

  // Deterministični "naključni" izbor — seed iz imena (vedno isti za istega človeka)
  function seededRand(seed, max) {
    let s = 0
    for(let i=0; i<seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) & 0xffffffff
    return Math.abs(s) % max
  }
  const spolKey = (d.spol === 'z' || d.spol === 'Z') ? 'Z' : 'M'
  function pickTags(colorKey, count, val, nameSeed) {
    const pool = val >= 4.5
      ? [...PERSONA_TAGS[colorKey].m[spolKey], ...PERSONA_TAGS[colorKey].s[spolKey]]
      : val >= 3.5
      ? [...PERSONA_TAGS[colorKey].m[spolKey].slice(2), ...PERSONA_TAGS[colorKey].s[spolKey]]
      : [...PERSONA_TAGS[colorKey].s[spolKey]]
    // Naključni izbor z deterministično metodo
    const result = []
    const used = new Set()
    let attempt = 0
    while(result.length < count && attempt < 20) {
      const idx = seededRand(nameSeed + colorKey + attempt, pool.length)
      if(!used.has(idx)) { used.add(idx); result.push(pool[idx]) }
      attempt++
    }
    return result
  }

  // Katere barve so nad 3.0
  const aboveThree = ['B','R','G','Y'].filter(k => (con[k]||0) >= 3.0)
  const nameSeed = d.ime || 'default'
  let top3tags = []

  if(aboveThree.length === 0) {
    // Nihče nad 3 — vzemi top 2 barvi
    top3tags = pickTags(sorted[0].k, 2, sorted[0].v, nameSeed)
      .concat(pickTags(sorted[1].k, 2, sorted[1].v, nameSeed))
  } else if(aboveThree.length === 1) {
    // Samo ena barva nad 3 — vse 4 iz nje
    top3tags = pickTags(aboveThree[0], 4, con[aboveThree[0]], nameSeed)
  } else {
    // Več barv nad 3 — proporcionalno glede na moč
    const totalVal = aboveThree.reduce((s,k) => s + (con[k]||0), 0)
    let remaining = 4
    const slots = []
    aboveThree.forEach((k, i) => {
      const isLast = i === aboveThree.length - 1
      const count = isLast ? remaining : Math.round((con[k]||0) / totalVal * 4)
      const actual = Math.max(1, Math.min(remaining, count))
      slots.push({k, count: actual})
      remaining -= actual
    })
    // Če je ostalo kaj, dodaj prvemu
    if(remaining > 0) slots[0].count += remaining
    slots.forEach(({k, count}) => {
      top3tags = top3tags.concat(pickTags(k, count, con[k]||0, nameSeed))
    })
  }
  // Zagotovi točno 4 tagge
  top3tags = top3tags.slice(0, 4)
  const typeTop = top3tags[0] || ''

  // ── KAKO KOMUNICIRAŠ Z VSAKIM TIPOM ─────────────────────────────────────────
  // Logika:
  // osnova = tvoja vrednost te barve (0-6)
  // nasprotna penalizacija: G↔R, B↔Y — visoka nasprotna zmanjša ujemanje
  // kompenzacija pri R: B pomaga 30%, Y pomaga 20% (thinking + ekstravertnost)
  // kompenzacija pri Y: R pomaga 20%, G pomaga 10%
  function calcKomunikacija(targetColor, mycon) {
    const opp = {B:'Y', Y:'B', G:'R', R:'G'}
    const base = mycon[targetColor] || 0
    const oppVal = mycon[opp[targetColor]] || 0
    const oppPenalty = oppVal * 0.4  // visoka nasprotna barva zmanjša

    let kompenzacija = 0
    if(targetColor === 'R') {
      kompenzacija = (mycon.B||0) * 0.30 + (mycon.Y||0) * 0.20
    } else if(targetColor === 'Y') {
      kompenzacija = (mycon.R||0) * 0.20 + (mycon.G||0) * 0.10
    } else if(targetColor === 'B') {
      kompenzacija = (mycon.G||0) * 0.10
    } else if(targetColor === 'G') {
      kompenzacija = (mycon.B||0) * 0.10
    }

    const raw = base - oppPenalty + kompenzacija
    const pct = Math.round(Math.max(10, Math.min(95, (raw / 6) * 100)))
    return pct
  }

  const compatColors = {B:'#4a7ab5',R:'#c94030',G:'#2e8a55',Y:'#c49a10'}
  const compatNames = {B:'Analitična modra',R:'Aktivna rdeča',G:'Stabilna zelena',Y:'Navdušena rumena'}

  // Opisi glede na % — dinamični
  function compatDesc(targetColor, pct, mycon) {
    const names = {B:'modrim',R:'rdečim',G:'zelenim',Y:'rumenim'}
    const n = names[targetColor]
    if(pct >= 75) return `Naravno dobro ujemanje — komunikacija s ${n} tipom vam teče lahkotno in intuitivno.`
    if(pct >= 55) return `Zmerno ujemanje — s ${n} tipom se razumete, a potrebujete zavestno prilagajanje.`
    if(pct >= 35) return `Izziv — ${n} tip razmišlja drugače. Potrebna potrpežljivost in zavestno prilagajanje sloga.`
    return `Največji izziv — ${n} tip je vaš nasprotni pol. Veliko se lahko naučite drug od drugega, a komunikacija zahteva trud.`
  }

  const myCompat = {B:'B',R:'R',G:'G',Y:'Y'}

  // ── ZAVEDNA / NEZAVEDNA ───────────────────────────────────────────────────
  const uncon = d.uncon || {}
  const flowTotal = d.total || 0

  // Prodajni indikatorji - predhodno izračunani
  const SALES_IND_DATA = [
    {phase:'1. Pred prodajnim procesom', items:[
      {label:'Raziskovanje',            color:'#4a7ab5', val: con.B||0},
      {label:'Izgradnja zaupanja',      color:'#7ab55a', val: ((con.G||0)*2+(con.Y||0))/3},
      {label:'Jasni cilji',             color:'#c94030', val: con.R||0},
      {label:'Dogovarjanje sestanka',   color:'#c97a30', val: ((con.R||0)+(con.Y||0))/2},
    ]},
    {phase:'2. Ugotavljanje potreb', items:[
      {label:'Poslušanje',              color:'#3a8a6a', val: ((con.G||0)*2+(con.B||0))/3},
      {label:'Spraševanje',             color:'#3a6a8a', val: ((con.B||0)*2+(con.G||0))/3},
      {label:'Vzpodbujanje',            color:'#c49a10', val: con.Y||0},
      {label:'Ustvarjanje priložnosti', color:'#c97a30', val: ((con.R||0)+(con.Y||0))/2},
    ]},
    {phase:'3. Dajanje predlogov', items:[
      {label:'Osredotočen in relevanten',   color:'#7a4ab5', val: ((con.R||0)+(con.B||0))/2},
      {label:'Entuziastična predstavitev',  color:'#c49a10', val: con.Y||0},
      {label:'Kaže razumevanje za potrebe', color:'#2e8a55', val: con.G||0},
      {label:'Organizacija & Točnost',      color:'#4a7ab5', val: con.B||0},
    ]},
    {phase:'4. Upravljanje z ugovori', items:[
      {label:'Direktno reševanje ugovorov', color:'#c94030', val: con.R||0},
      {label:'Prepričevanje',               color:'#c49a10', val: con.Y||0},
      {label:'Pojasnjevanje podrobnosti',   color:'#7a4ab5', val: ((con.R||0)+(con.B||0))/2},
      {label:'Dodatni sestanki',            color:'#2e8a55', val: con.G||0},
    ]},
    {phase:'5. Pridobivanje zvestobe', items:[
      {label:'Zaključek',                     color:'#c94030', val: con.R||0},
      {label:'Fleksibilnost',                 color:'#7ab55a', val: ((con.G||0)*2+(con.Y||0))/3},
      {label:'Zmanjševanje rizika',           color:'#4a7ab5', val: con.B||0},
      {label:'Zadovoljevanje potreb stranke', color:'#3a8a6a', val: ((con.G||0)*2+(con.B||0))/3},
    ]},
    {phase:'6. Aktivnosti po prodaji', items:[
      {label:'Ohranjanje kontakta',       color:'#2e8a55', val: con.G||0},
      {label:'Načrtovanje novih strank',  color:'#7a4ab5', val: ((con.R||0)+(con.B||0))/2},
      {label:'Vzdrževanje odnosov',       color:'#7ab55a', val: ((con.G||0)+(con.Y||0))/2},
      {label:'Pridobivanje priporočil',   color:'#c97a30', val: ((con.R||0)+(con.Y||0))/2},
    ]},
  ]
  const htmlSalesIndicators = SALES_IND_DATA.map(group => {
    const items = group.items.map(item => {
      const displayVal = parseFloat((item.val/6*10).toFixed(1))
      const pct = Math.min((item.val/6)*100, 100).toFixed(0)
      return '<div style="display:grid;grid-template-columns:36px 1fr 1fr;align-items:center;gap:10px;margin-bottom:10px">'
        + '<div style="font-size:14px;font-weight:700;color:'+item.color+';text-align:right">'+displayVal+'</div>'
        + '<div style="position:relative;height:6px;background:#f0ece8;border-radius:3px">'
        + '<div style="position:absolute;left:0;top:0;height:100%;width:'+pct+'%;background:'+item.color+';border-radius:3px"></div>'
        + '<div style="position:absolute;top:50%;left:'+pct+'%;transform:translate(-50%,-50%);width:12px;height:12px;border-radius:50%;background:'+item.color+';border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,.25)"></div>'
        + '</div>'
        + '<div style="font-size:12px;color:#555">'+item.label+'</div>'
        + '</div>'
    }).join('')
    return '<div style="background:#fafaf8;border-radius:12px;padding:16px 18px;border:1px solid #e8e4df">'
      + '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#aaa;margin-bottom:14px">'+group.phase+'</div>'
      + items
      + '</div>'
  }).join('')


  // Sekcije ki se prikažejo kot bold lista (1 stolpec)
  const LIST_1COL = ['kom','vodenje','motivacija','intervju','prod_tip']
  // Sekcije ki se prikažejo kot bold lista (2 stolpca)
  const LIST_2COL = ['pred','slab','prod_mocne','prod_slepe','prod_akcija']

  function parseBoldListHtml(txt, cols) {
    if(!txt) return ''
    // Najprej normaliziramo — razdelimo po **Naslov** vzorcu
    // Podpiramo oba formata: z \n in brez (vse v eni vrstici)
    let normalized = txt
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/\*\*([^*]+)\*\*\s*[-–:]?\s*/g, '\n**$1** ')
      .trim()

    const lines = normalized.split('\n').map(l => l.trim()).filter(l => l)
    const items = []
    let current = null

    for(const line of lines) {
      const m = line.match(/^\*\*(.+?)\*\*\s*[-–:]?\s*(.*)$/)
      if(m) {
        current = {title: m[1].trim(), desc: m[2].trim()}
        items.push(current)
      } else if(current && line && !line.startsWith('**')) {
        current.desc = current.desc ? current.desc + ' ' + line : line
      } else if(line && !line.startsWith('**')) {
        items.push({title: '', desc: line})
      }
    }

    if(items.length === 0) return '<div class="sec-body">'+txt+'</div>'
    const cls = cols === 2 ? 'bold-list-2col' : 'bold-list'
    const li = items.map(item => {
      if(!item.title) return '<li><div class="bl-desc">'+item.desc+'</div></li>'
      return '<li><div class="bl-title">'+item.title+'</div>'+(item.desc?'<div class="bl-desc">'+item.desc+'</div>':'')+'</li>'
    }).join('')
    return '<ul class="'+cls+'">'+li+'</ul>'
  }


  // Radar vrednosti
  const radarDims = [
    {label:'Analitičnost', val: con.B||0, clr: CLR.B},
    {label:'Odločnost',    val: con.R||0, clr: CLR.R},
    {label:'Empatija',     val: con.G||0, clr: CLR.G},
    {label:'Optimizem',    val: con.Y||0, clr: CLR.Y},
    {label:'Natančnost',   val: con.B||0, clr: CLR.B},
    {label:'Pogum',        val: con.R||0, clr: CLR.R},
    {label:'Harmonija',    val: con.G||0, clr: CLR.G},
    {label:'Ustvarjalnost',val: con.Y||0, clr: CLR.Y},
  ]

  // Radar SVG
  const N = 8
  const CX = 250, CY = 250, R_max = 160
  function radarPoint(i, val) {
    const angle = (Math.PI * 2 * i / N) - Math.PI / 2
    const r = (val / 6) * R_max
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) }
  }
  function radarGrid(r_frac) {
    const pts = Array.from({length: N}, (_, i) => {
      const angle = (Math.PI * 2 * i / N) - Math.PI / 2
      const r = r_frac * R_max
      return `${CX + r * Math.cos(angle)},${CY + r * Math.sin(angle)}`
    })
    return pts.join(' ')
  }
  const dataPts = radarDims.map((d,i) => radarPoint(i, d.val))
  const dataPath = dataPts.map((p,i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z'

  // Labele za radar
  function radarLabel(i, label) {
    const angle = (Math.PI * 2 * i / N) - Math.PI / 2
    const r = R_max + 32
    const x = (CX + r * Math.cos(angle)).toFixed(1)
    const y = (CY + r * Math.sin(angle)).toFixed(1)
    const anchor = Math.cos(angle) > 0.1 ? 'start' : Math.cos(angle) < -0.1 ? 'end' : 'middle'
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="central" font-size="12" fill="#666" font-family="system-ui,sans-serif">${label}</text>`
  }

  // Sekcija helper
  function sec(id, fallback='') {
    return texts[id] || fallback
  }

  function renderSection(id, title, icon) {
    const txt = texts[id] || ''
    if(!txt) return ''
    let content
    if(LIST_2COL.includes(id)) {
      content = parseBoldListHtml(txt, 2)
    } else if(LIST_1COL.includes(id)) {
      content = parseBoldListHtml(txt, 1)
    } else {
      content = '<div class="sec-body">'+txt.split('**').map((p,i)=>i%2===1?'<strong>'+p+'</strong>':p).join('').split('\n').join('<br>')+'</div>'
    }
    return '<div class="section" id="sec-'+id+'"><div class="sec-header"><h2 class="sec-title">'+title+'</h2></div>'+content+'</div>'
  }

  const navItems = [
    {id:'profil', label:'Profil'},
    {id:'tim', label:'Tim'},
    {id:'razvoj', label:'Razvoj'},
    {id:'prodaja', label:'Prodaja'},
  ]

  const html = `<!DOCTYPE html>
<html lang="sl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Barvni kompas — ${d.ime}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --main: ${mainClr};
    --light: ${lightClr};
    --dark: ${darkClr};
    --bg: #fafaf8;
    --white: #ffffff;
    --text: #1a1a1a;
    --muted: #6b6460;
    --border: #e8e4df;
  }
  html { scroll-behavior: smooth; }
  body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); line-height: 1.7; }

  /* NAV */
  nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(250,250,248,0.96); backdrop-filter: blur(16px); border-bottom: 1px solid var(--border); padding: 0 32px; height: 58px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 12px rgba(0,0,0,.04); }
  .nav-brand { display: flex; align-items: center; gap: 10px; }
  .nav-logo { width: 28px; height: 28px; }
  .nav-name { font-family: Georgia, serif; font-size: 14px; font-weight: 700; }
  .nav-links { display: flex; gap: 4px; }
  .nav-link { padding: 6px 14px; border-radius: 20px; font-size: 13px; color: var(--muted); text-decoration: none; transition: all .15s; cursor: pointer; border: none; background: none; font-family: inherit; }
  .nav-link:hover, .nav-link.active { background: var(--light); color: var(--dark); font-weight: 600; }
  .nav-print { padding: 7px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; color: var(--dark); background: var(--light); border: none; cursor: pointer; font-family: inherit; transition: all .15s; margin-left: 8px; }
  .nav-print:hover { background: var(--main); color: white; }

  /* HERO */
  .hero { display: flex; align-items: center; justify-content: center; padding: 88px 60px 40px; position: relative; overflow: hidden; }
  .hero-bg { position: absolute; inset: 0; background: linear-gradient(135deg, var(--light) 0%, var(--bg) 55%); z-index: 0; }
  .hero-accent { position: absolute; top: -80px; right: -80px; width: 400px; height: 400px; border-radius: 50%; background: var(--main); opacity: 0.06; z-index: 0; }
  .hero-content { position: relative; z-index: 1; max-width: 920px; width: 100%; display: grid; grid-template-columns: 1fr auto; gap: 60px; align-items: center; }
  .hero-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .09em; color: var(--main); margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
  .hero-label::before { content: ''; display: block; width: 24px; height: 2px; background: var(--main); border-radius: 2px; }
  .hero-name { font-family: Georgia, serif; font-size: clamp(44px, 6vw, 76px); font-weight: 700; line-height: 1.02; letter-spacing: -0.03em; margin-bottom: 16px; }
  .hero-type { font-size: 22px; color: var(--main); font-weight: 700; margin-bottom: 6px; font-family: Georgia, serif; }
  .hero-variant { font-size: 13px; color: var(--muted); margin-bottom: 44px; font-weight: 500; letter-spacing: .04em; text-transform: uppercase; }
  .hero-scores { display: flex; gap: 10px; flex-wrap: wrap; }
  .score-pill { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: white; border-radius: 40px; border: 1.5px solid var(--border); box-shadow: 0 2px 12px rgba(0,0,0,.06); }
  .score-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .score-label { font-size: 11px; color: var(--muted); font-weight: 500; }
  .score-val { font-size: 16px; font-weight: 800; }
  .hero-chart { flex-shrink: 0; }

  /* INTRO STRAN — Jung teorija */
  .intro-jung { border-top: 1px solid var(--border); padding: 44px 60px 52px; background: white; }
  .intro-jung-inner { max-width: 920px; margin: 0 auto; }
  .intro-jung-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-bottom: 36px; }
  .intro-h { font-family: Georgia, serif; font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 12px; padding-left: 16px; position: relative; }
  .intro-h::before { content: ''; position: absolute; left: 0; top: 3px; width: 4px; height: 16px; background: var(--main); border-radius: 2px; }
  .intro-p { font-size: 13px; color: #3a3530; line-height: 1.85; margin-bottom: 10px; }
  .intro-ul { list-style: none; padding: 0; margin: 12px 0 0; display: flex; flex-direction: column; gap: 0; }
  .intro-ul li { display: flex; align-items: flex-start; gap: 12px; font-size: 12.5px; color: #3a3530; line-height: 1.65; padding: 9px 0; border-bottom: 1px solid var(--border); }
  .intro-ul li:last-child { border-bottom: none; }
  .intro-color-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
  .intro-toc-box { background: var(--bg); border-radius: 14px; border: 1px solid var(--border); padding: 22px 28px; }
  .intro-toc-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .09em; color: var(--muted); margin-bottom: 14px; }

  /* DATA STRANI — zavedna, energije+radar */
  .data-page { padding: 60px 60px 48px; background: white; border-top: 2px solid var(--border); }
  .data-page-inner { max-width: 920px; margin: 0 auto; }
  .dp-title { font-family: Georgia, serif; font-size: 20px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
  .dp-desc { font-size: 13px; color: var(--muted); margin-bottom: 32px; line-height: 1.7; }
  .dp-explain { margin-top: 28px; background: var(--bg); border-radius: 14px; padding: 22px 26px; border-left: 4px solid var(--main); }
  .dp-explain-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: var(--main); margin-bottom: 10px; }
  .dp-explain-text { font-size: 13px; color: #3a3530; line-height: 1.85; }
  .dp-section-divider { margin: 36px 0 28px; padding-top: 28px; border-top: 1px solid var(--border); }
  .dp-section-title { font-family: Georgia, serif; font-size: 17px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
  .dp-section-desc { font-size: 12px; color: var(--muted); }

  /* DONUT */
  .dna-wrap { position: relative; width: 220px; height: 340px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .dna-label { text-align: center; margin-top: 12px; }
  .dna-type { font-family: Georgia, serif; font-size: 13px; font-weight: 700; color: var(--text); white-space: nowrap; }
  .dna-sub { font-size: 11px; color: var(--muted); margin-top: 2px; }

  /* MAIN */
  main { max-width: 920px; margin: 0 auto; padding: 60px 32px 120px; }

  /* GROUP HEADER */
  .group-header { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; color: white; margin: 56px 0 16px; padding: 8px 16px; border-radius: 6px; display: inline-block; }
  .gh-profil  { background: #4a7ab5; }
  .gh-tim     { background: #2e8a55; }
  .gh-razvoj  { background: #7a4ab5; }
  .gh-prodaja { background: #c94030; }

  /* SECTION */
  .section { background: white; border-radius: 16px; border: 1px solid var(--border); padding: 28px 32px; margin-bottom: 16px; transition: box-shadow .2s, transform .2s; position: relative; overflow: hidden; }
  .section::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--main); border-radius: 4px 0 0 4px; }
  .section:hover { box-shadow: 0 6px 28px rgba(0,0,0,.08); transform: translateY(-1px); }
  .sec-header { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid var(--border); }
  .sec-icon { font-size: 18px; width: 36px; height: 36px; background: var(--light); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .sec-title { font-family: Georgia, serif; font-size: 17px; font-weight: 700; }
  .sec-body { font-size: 14px; color: #3a3530; line-height: 1.85; }
  .sec-body strong { font-weight: 700; color: var(--text); }

  /* BOLD LISTA — naslov + opis */
  .bold-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px; }
  .bold-list li { padding: 14px 16px; background: var(--bg); border-radius: 10px; border-left: 3px solid var(--main); }
  .bold-list li .bl-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
  .bold-list li .bl-desc { font-size: 13px; color: #555; line-height: 1.65; }

  /* 2-stolpčna bold lista za prednosti/slabosti */
  .bold-list-2col { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .bold-list-2col li { padding: 14px 16px; background: var(--bg); border-radius: 10px; border-left: 3px solid var(--main); }
  .bold-list-2col li .bl-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
  .bold-list-2col li .bl-desc { font-size: 13px; color: #555; line-height: 1.65; }

  /* BARVNI STOLPCI */
  .bar-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px; }
  .bar-item { background: var(--bg); border-radius: 12px; padding: 14px 16px; border: 1px solid var(--border); }
  .bar-label { font-size: 12px; font-weight: 700; margin-bottom: 10px; }
  .bar-track { height: 8px; background: #eee; border-radius: 4px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 4px; }
  .bar-val { font-size: 14px; font-weight: 800; margin-top: 8px; }

  /* RADAR */
  .radar-wrap { display: flex; justify-content: center; margin: 8px 0; overflow: visible; }

  /* PRODAJA FAZE */
  .phases { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px; }
  .phase { background: var(--bg); border-radius: 12px; padding: 16px; border-left: 3px solid var(--main); border: 1px solid var(--border); border-left: 3px solid var(--main); }
  .phase-label { font-size: 10px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: .1em; margin-bottom: 10px; }
  .phase-row { display: flex; gap: 8px; margin-bottom: 6px; align-items: flex-start; }
  .phase-tag { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; padding: 3px 8px; border-radius: 10px; flex-shrink: 0; margin-top: 1px; }
  .tag-green { background: #e6f5ee; color: #1a5c38; }
  .tag-red   { background: #faeaea; color: #a8291a; }
  .tag-blue  { background: #e8f0fa; color: #1a4a7a; }
  .phase-text { font-size: 12px; color: #444; line-height: 1.5; }

  /* KAZALO */
  .toc { background: white; border-radius: 16px; border: 1px solid var(--border); padding: 28px 32px; margin-bottom: 48px; }
  .toc-title { font-family: Georgia, serif; font-size: 16px; font-weight: 700; margin-bottom: 16px; color: var(--text); }
  .toc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .toc-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: background .12s; text-decoration: none; color: var(--text); font-size: 13px; }
  .toc-item:hover { background: var(--light); }
  .toc-num { font-size: 11px; font-weight: 700; color: var(--muted); width: 20px; flex-shrink: 0; }
  .toc-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

  /* FOOTER */
  footer { text-align: center; padding: 48px 32px; font-size: 12px; color: #bbb; border-top: 1px solid var(--border); margin-top: 40px; }
  .footer-logo { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px; }

  /* ANIMACIJE */
  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  .fade-up { animation: fadeUp .6s ease forwards; opacity: 0; }
  .fade-up:nth-child(2) { animation-delay: .1s; }
  .fade-up:nth-child(3) { animation-delay: .2s; }
  .fade-up:nth-child(4) { animation-delay: .3s; }

  /* PERSONA KARTA */
  .persona-card { background: var(--dark); color: white; border-radius: 20px; padding: 32px; margin-bottom: 16px; position: relative; overflow: hidden; }
  .persona-card::before { content: ''; position: absolute; top: -60px; right: -60px; width: 200px; height: 200px; border-radius: 50%; background: var(--main); opacity: 0.15; }
  .persona-card::after { content: ''; position: absolute; bottom: -40px; left: -40px; width: 140px; height: 140px; border-radius: 50%; background: white; opacity: 0.04; }
  .persona-name { font-family: Georgia, serif; font-size: clamp(28px, 4vw, 48px); font-weight: 700; line-height: 1.05; margin-bottom: 8px; position: relative; z-index: 1; }
  .persona-type { font-size: 16px; font-weight: 600; color: var(--light); margin-bottom: 24px; position: relative; z-index: 1; }
  .persona-tags { display: flex; gap: 8px; flex-wrap: wrap; position: relative; z-index: 1; }
  .persona-tag { padding: 6px 14px; background: rgba(255,255,255,0.12); border-radius: 20px; font-size: 12px; font-weight: 600; backdrop-filter: blur(4px); }

  /* COMPATIBILITY METER */
  .compat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px; }
  .compat-item { background: var(--bg); border-radius: 14px; padding: 18px; border: 1px solid var(--border); text-align: center; }
  .compat-circle { width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; position: relative; }
  .compat-ring { position: absolute; inset: 0; border-radius: 50%; }
  .compat-name { font-size: 13px; font-weight: 700; margin-bottom: 4px; }
  .compat-desc { font-size: 11px; color: var(--muted); line-height: 1.5; }

  /* ZAVEDNA / NEZAVEDNA */
  .persona-compare { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 8px; }
  .persona-col { background: var(--bg); border-radius: 14px; padding: 20px; border: 1px solid var(--border); }
  .persona-col-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); margin-bottom: 16px; }
  .persona-bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .persona-bar-label { font-size: 11px; font-weight: 600; width: 14px; text-align: center; flex-shrink: 0; }
  .persona-bar-track { flex: 1; height: 8px; background: #eee; border-radius: 4px; overflow: hidden; }
  .persona-bar-fill { height: 100%; border-radius: 4px; }
  .persona-bar-val { font-size: 12px; font-weight: 700; width: 30px; text-align: right; flex-shrink: 0; }
  .flow-badge { display: inline-flex; align-items: center; gap: 8px; background: white; border: 1px solid var(--border); border-radius: 20px; padding: 8px 16px; margin-top: 12px; font-size: 12px; }
  .flow-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--main); }

  /* DNEVNIK RAZVOJA */
  .razvoj-list { list-style: none; padding: 0; margin: 0; }
  .razvoj-item { display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; background: var(--bg); border-radius: 12px; margin-bottom: 10px; border: 1.5px solid transparent; transition: all .15s; cursor: pointer; }
  .razvoj-item:hover { border-color: var(--main); background: var(--light); }
  .razvoj-item.done { opacity: 0.5; }
  .razvoj-item.done .razvoj-text { text-decoration: line-through; }
  .razvoj-check { width: 22px; height: 22px; border-radius: 6px; border: 2px solid var(--border); background: white; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all .15s; margin-top: 1px; }
  .razvoj-item.done .razvoj-check { background: var(--main); border-color: var(--main); }
  .razvoj-num { font-size: 11px; font-weight: 800; color: var(--main); background: var(--light); width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .razvoj-text { font-size: 13px; color: var(--text); line-height: 1.6; flex: 1; }
  .razvoj-progress { height: 6px; background: var(--border); border-radius: 3px; margin-bottom: 16px; overflow: hidden; }
  .razvoj-progress-fill { height: 100%; background: var(--main); border-radius: 3px; transition: width .4s ease; }
  .razvoj-stats { font-size: 12px; color: var(--muted); margin-bottom: 12px; }
  .print-sec-btn:hover { background: var(--light); color: var(--dark); border-color: var(--main); }

  /* ═══ PRINT STYLES ═══════════════════════════════════════════════════════ */
  @media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    nav { display: none !important; }
    .hero { min-height: auto; padding: 52px 48px 24px; page-break-after: avoid; }
    .intro-jung { page-break-after: always; padding: 20px 48px 24px; }
    .data-page { page-break-after: always; padding: 32px 48px; }
    .data-page:last-of-type { page-break-after: avoid; }
    .intro-jung-grid { gap: 24px; }
    .intro-p { font-size: 11.5px; line-height: 1.7; margin-bottom: 7px; }
    .intro-h { font-size: 13px; margin-top: 14px; margin-bottom: 8px; }
    .intro-ul li { font-size: 11px; padding: 6px 0; }
    .intro-toc-box { padding: 14px 20px; }
    .toc-item { font-size: 12px; padding: 5px 10px; }
    .hero-bg, .hero-accent { display: none; }
    .hero-content { grid-template-columns: 1fr auto; }
    main { padding: 20px 32px; }
    .group-header { margin-top: 0; }
    .chapter { page-break-before: always; }
    .chapter:first-of-type { page-break-before: avoid; }
    .section { break-inside: avoid; page-break-inside: avoid; box-shadow: none !important; transform: none !important; border: 1px solid #ddd !important; margin-bottom: 12px; padding: 20px 24px; }
    .data-page-inner { break-inside: avoid; }
    .dp-title { font-size: 17px; margin-bottom: 4px; }
    .dp-desc { font-size: 12px; margin-bottom: 20px; }
    .dp-explain { margin-top: 16px; padding: 16px 20px; }
    .dp-explain-text { font-size: 12px; }
    .section:hover { box-shadow: none !important; transform: none !important; }
    .section::before { display: block !important; }
    .toc { page-break-after: always; }
    .bar-fill { -webkit-print-color-adjust: exact; }
    footer { page-break-before: always; }
    .fade-up { animation: none !important; opacity: 1 !important; }
    .phases { grid-template-columns: 1fr 1fr; }
    .bar-grid { grid-template-columns: 1fr 1fr; }
    .bold-list-2col { grid-template-columns: 1fr 1fr; }
    .bold-list li, .bold-list-2col li { break-inside: avoid; background: #f9f7f4 !important; }
    .print-sec-btn { display: none !important; }
  }

  @media (max-width: 640px) {
    .hero-content { grid-template-columns: 1fr; }
    .hero-chart { display: none; }
    .bar-grid, .phases, .toc-grid { grid-template-columns: 1fr; }
    .nav-links { display: none; }
    main { padding: 40px 16px 80px; }
  }
</style>
</head>
<body>

<!-- NAV -->
<nav>
  <div class="nav-brand">
    <svg class="nav-logo" viewBox="0 0 60 60">
      <path d="M30,30 L30,4 A26,26 0 0,1 56,30 Z" fill="${CLR.R}"/>
      <path d="M30,30 L56,30 A26,26 0 0,1 30,56 Z" fill="${CLR.Y}"/>
      <path d="M30,30 L30,56 A26,26 0 0,1 4,30 Z" fill="${CLR.G}"/>
      <path d="M30,30 L4,30 A26,26 0 0,1 30,4 Z" fill="${CLR.B}"/>
      <circle cx="30" cy="30" r="10" fill="white"/>
    </svg>
    <span class="nav-name">Barvni kompas</span>
  </div>
  <div class="nav-links">
    <button class="nav-link active" onclick="scrollTo('profil')">Profil</button>
    <button class="nav-link" onclick="scrollTo('tim')">Tim</button>
    <button class="nav-link" onclick="scrollTo('razvoj')">Razvoj</button>
    <button class="nav-link" onclick="scrollTo('prodaja')">Prodaja</button>
    <button class="nav-print" onclick="window.print()">🖨️ Natisni</button>
  </div>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="hero-bg"></div>
  <div class="hero-content">
    <div class="hero-left">
      <div class="hero-label fade-up"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--main);margin-right:8px"></span>Barvni kompas · Osebnostni profil</div>
      <h1 class="hero-name fade-up">${d.ime}</h1>
      <div class="hero-type fade-up">${(d.typeData && d.typeData.sl) || d.typeName || ''}</div>
      <div class="hero-variant fade-up">${d.variant || ''}</div>
      <div class="persona-tags fade-up">
        ${top3tags.map(tag => '<span class="persona-tag">'+tag+'</span>').join('')}
      </div>
      <div class="hero-scores fade-up">
        ${sorted.map(({k,v}) => `
        <div class="score-pill">
          <div class="score-dot" style="background:${CLR[k]}"></div>
          <span class="score-label">${CLR_NAME[k]}</span>
          <span class="score-val" style="color:${CLR[k]}">${v.toFixed(1)}</span>
        </div>`).join('')}
      </div>
    </div>
    <div class="hero-chart">
      <div class="dna-wrap">
        ${(()=>{
          // DNA vizualizacija — dvojna spirala
          // Vsaka "rung" (prečka) = ena barvna energija, večkrat ponovljena
          const W = 200, H = 320
          const cx = W/2
          const rungs = 16  // število prečk
          const spacing = H / (rungs + 1)
          const amplitude = 44  // širina spirale
          const nodeR = 6

          // Razpored barv glede na vrednosti — višja vrednost = več rungov
          const total = ['B','R','G','Y'].reduce((s,k)=>s+(con[k]||0),0) || 1
          const rungColors = []
          const counts = {}
          ;['B','R','G','Y'].forEach(k => {
            counts[k] = Math.max(1, Math.round((con[k]||0)/total * rungs))
          })
          // Normalizacija na točno rungs
          let diff = rungs - Object.values(counts).reduce((a,b)=>a+b,0)
          const sorted2 = ['B','R','G','Y'].sort((a,b)=>(con[b]||0)-(con[a]||0))
          while(diff > 0) { counts[sorted2[diff%4]]++; diff-- }
          while(diff < 0) { const k=sorted2[Math.abs(diff)%4]; if(counts[k]>1){counts[k]--;diff++} else diff++ }
          // Razporedi barve enakomerno
          const colorSeq = []
          const keys = ['B','R','G','Y']
          const maxC = Math.max(...Object.values(counts))
          for(let i=0;i<maxC;i++) keys.forEach(k=>{ if(i<counts[k]) colorSeq.push(k) })
          // Zapolni do rungs
          while(colorSeq.length < rungs) colorSeq.push(sorted2[0])
          colorSeq.length = rungs

          // Generiraj SVG elemente
          let paths = ''
          // Ozadje spiralni krivulji (tanki)
          const steps = 80
          let leftPath = '', rightPath = ''
          for(let i=0;i<=steps;i++) {
            const t = i/steps
            const y = spacing + t*(H-2*spacing)
            const wave = Math.sin(t*Math.PI*2*2)*amplitude
            const lx = (cx - wave).toFixed(1)
            const rx = (cx + wave).toFixed(1)
            leftPath += (i===0?'M':'L')+lx+','+y.toFixed(1)+' '
            rightPath += (i===0?'M':'L')+rx+','+y.toFixed(1)+' '
          }
          paths += '<path d="'+leftPath+'" fill="none" stroke="#e0dbd4" stroke-width="2.5" stroke-linecap="round"/>'
          paths += '<path d="'+rightPath+'" fill="none" stroke="#e0dbd4" stroke-width="2.5" stroke-linecap="round"/>'

          // Prečke in vozlišča
          for(let i=0;i<rungs;i++) {
            const t = (i+1)/(rungs+1)
            const y = spacing + t*(H-2*spacing)
            const wave = Math.sin(t*Math.PI*2*2)*amplitude
            const lx = cx - wave
            const rx = cx + wave
            const k = colorSeq[i]
            const clr = CLR[k]
            const lightClr = CLR_L[k]
            const val = (con[k]||0)
            const opacity = 0.5 + (val/6)*0.5  // višja vrednost = bolj opačen

            // Prečka
            paths += '<line x1="'+lx.toFixed(1)+'" y1="'+y.toFixed(1)+'" x2="'+rx.toFixed(1)+'" y2="'+y.toFixed(1)+'" stroke="'+clr+'" stroke-width="2" opacity="'+opacity.toFixed(2)+'"/>'

            // Levo vozlišče (zavedna)
            paths += '<circle cx="'+lx.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+nodeR+'" fill="'+clr+'" opacity="'+opacity.toFixed(2)+'"/>'
            paths += '<circle cx="'+lx.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+(nodeR-2)+'" fill="'+lightClr+'"/>'

            // Desno vozlišče (nezavedna — bolj bleda)
            const unconVal = (uncon[k]||0)
            const unconOpacity = 0.3 + (unconVal/6)*0.4
            paths += '<circle cx="'+rx.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+nodeR+'" fill="'+clr+'" opacity="'+unconOpacity.toFixed(2)+'"/>'
          }

          return '<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">'+paths+'</svg>'
        })()}
        <div class="dna-label">
          <div class="dna-type">${(d.typeData && d.typeData.sl) || d.typeName || ''}</div>
          <div class="dna-sub">${d.variant||''}</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- INTRO STRAN: Jung teorija + TOC -->
<div class="intro-jung">
  <div class="intro-jung-inner">
    <div class="intro-jung-grid">
      <div>
        <div class="intro-h">Kaj je Barvni kompas?</div>
        <p class="intro-p">Barvni kompas je orodje za razumevanje osebnostnih preferenc, ki temelji na mednarodno uveljavljenem modelu Insights Discovery. Poročilo ni diagnoza — je ogledalo, ki prikazuje vaše naravne vedenjske vzorce, prednosti in področja za rast.</p>
        <p class="intro-p">Rezultati opisujejo <em>preference</em>, ne sposobnosti. Vsak profil je enakovredna različica — ni boljšega ali slabšega tipa.</p>
        <div class="intro-h" style="margin-top:22px">Carl Gustav Jung — teoretično ozadje</div>
        <p class="intro-p">Model izhaja iz teorije švicarskega psihiatra Carla Gustava Junga (1875–1961). Jung je ugotovil, da ima vsak človek naravne psihološke preference pri zaznavanju sveta, sprejemanju odločitev in usmerjanju energije — in da se te preference ohranjajo skozi celotno življenje.</p>
        <p class="intro-p">Insights Discovery te dimenzije prevaja v štiri barvne energije, ki skupaj tvorijo vaš edinstveni osebnostni profil.</p>
      </div>
      <div>
        <div class="intro-h">Štiri arhetipske energije</div>
        <p class="intro-p" style="margin-bottom:16px">Vsak človek nosi vse štiri energije — razlika je le v moči posamezne.</p>
        <ul class="intro-ul">
          <li>
            <span class="intro-color-dot" style="background:#4a7ab5"></span>
            <div><strong style="color:#1a4a7a">Analitična modra</strong><br><span style="font-size:11.5px;color:var(--muted)">Natančnost · Sistematičnost · Kakovost · Premišljenost · Introvertno-mišljenjski tip</span></div>
          </li>
          <li>
            <span class="intro-color-dot" style="background:#c94030"></span>
            <div><strong style="color:#a8291a">Aktivna rdeča</strong><br><span style="font-size:11.5px;color:var(--muted)">Odločnost · Akcija · Rezultati · Neposrednost · Ekstrovertno-mišljenjski tip</span></div>
          </li>
          <li>
            <span class="intro-color-dot" style="background:#2e8a55"></span>
            <div><strong style="color:#1a5c38">Stabilna zelena</strong><br><span style="font-size:11.5px;color:var(--muted)">Harmonija · Zaupanje · Empatija · Potrpežljivost · Introvertno-čutenjski tip</span></div>
          </li>
          <li>
            <span class="intro-color-dot" style="background:#c49a10"></span>
            <div><strong style="color:#8a6200">Navdušena rumena</strong><br><span style="font-size:11.5px;color:var(--muted)">Optimizem · Kreativnost · Entuzijazem · Sociabilnost · Ekstrovertno-čutenjski tip</span></div>
          </li>
        </ul>
      </div>
    </div>

    <div class="intro-toc-box">
      <div class="intro-toc-label">Vsebina tega poročila</div>
      <div class="toc-grid">
        <a class="toc-item" onclick="scrollTo('sec-zavedna')"><span class="toc-num">01</span><span class="toc-dot" style="background:var(--main)"></span>Zavedna &amp; Nezavedna persona</a>
        <a class="toc-item" onclick="scrollTo('sec-energije')"><span class="toc-num">02</span><span class="toc-dot" style="background:var(--main)"></span>Barvne energije &amp; Radar</a>
        <a class="toc-item" onclick="scrollTo('sec-stil')"><span class="toc-num">03</span><span class="toc-dot" style="background:#4a7ab5"></span>Osebni stil &amp; Vedenje</a>
        <a class="toc-item" onclick="scrollTo('tim')"><span class="toc-num">04</span><span class="toc-dot" style="background:#2e8a55"></span>Tim &amp; Motivacija</a>
        <a class="toc-item" onclick="scrollTo('razvoj')"><span class="toc-num">05</span><span class="toc-dot" style="background:#7a4ab5"></span>Razvoj &amp; Slepe pege</a>
        <a class="toc-item" onclick="scrollTo('sec-vodenje')"><span class="toc-num">06</span><span class="toc-dot" style="background:#7a4ab5"></span>Vodenje &amp; Stres</a>
        <a class="toc-item" onclick="scrollTo('prodaja')"><span class="toc-num">07</span><span class="toc-dot" style="background:#c94030"></span>Prodajni profil</a>
        <a class="toc-item" onclick="scrollTo('sec-prod_akcija')"><span class="toc-num">08</span><span class="toc-dot" style="background:#c94030"></span>Akcijski plan &amp; Indikatorji</a>
      </div>
    </div>
  </div>
</div>

<!-- MAIN CONTENT -->
<main>

  <!-- BARVNI PROFIL -->


  <div class="group-header gh-profil" id="profil">Barvni profil</div>

  <!-- DATA STRAN 1: Zavedna / Nezavedna -->
  <div class="data-page" id="sec-zavedna">
  <div class="data-page-inner">
    <div class="dp-title">Zavedna &amp; Nezavedna persona</div>
    <div class="dp-desc">Primerjava vedenjskega vzorca v delovnem okolju z globljimi, naravnimi preferencami — in koliko energije porabite za prilagajanje</div>
  <!-- ZAVEDNA / NEZAVEDNA PERSONA -->
  <div class="section">
    <div class="sec-header">
      <h2 class="sec-title">Zavedna & Nezavedna persona</h2>
    </div>
    <div class="persona-compare">
      <div class="persona-col">
        <div class="persona-col-title">Zavedna persona · Delovni jaz</div>
        ${['B','R','G','Y'].map(k => {
          const pct = ((con[k]||0)/6*100).toFixed(0)
          return '<div class="persona-bar-row">'
            + '<div class="persona-bar-label" style="color:'+CLR[k]+'">'+k+'</div>'
            + '<div class="persona-bar-track"><div class="persona-bar-fill" style="width:'+pct+'%;background:'+CLR[k]+'"></div></div>'
            + '<div class="persona-bar-val" style="color:'+CLR[k]+'">'+(con[k]||0).toFixed(1)+'</div>'
            + '</div>'
        }).join('')}
        <div style="font-size:11px;color:var(--muted);margin-top:10px;line-height:1.6">Kako se prilagajate delovnemu okolju — vedenjski vzorci ki jih okolica vidi.</div>
      </div>
      <div class="persona-col">
        <div class="persona-col-title">Nezavedna persona · Temeljni jaz</div>
        ${['B','R','G','Y'].map(k => {
          const oppMap = {B:'Y',R:'G',G:'R',Y:'B'}
          const val = uncon[k] !== undefined ? uncon[k] : parseFloat((6-(con[oppMap[k]]||0)).toFixed(2))
          const pct = (val/6*100).toFixed(0)
          return '<div class="persona-bar-row">'
            + '<div class="persona-bar-label" style="color:'+CLR[k]+'">'+k+'</div>'
            + '<div class="persona-bar-track"><div class="persona-bar-fill" style="width:'+pct+'%;background:'+CLR[k]+';opacity:0.55"></div></div>'
            + '<div class="persona-bar-val" style="color:'+CLR[k]+'">'+val.toFixed(1)+'</div>'
            + '</div>'
        }).join('')}
        <div style="font-size:11px;color:var(--muted);margin-top:10px;line-height:1.6">Globlje naravne preference — kdo ste ko niste pod pritiskom okolja.</div>
      </div>
    </div>
    <div style="text-align:center;margin-top:16px">
      <div class="flow-badge">
        <div class="flow-dot"></div>
        <span><strong>Preference tok: ${flowTotal}%</strong> — ${flowTotal<=15?'Delate po naravni poti — nizka razlika med persono':flowTotal<=30?'Zmerno prilagajanje — normalno za delovno okolje':'Visoko prilagajanje — možen stres ali maska'}</span>
      </div>
    </div>
  </div>

  <div class="dp-explain">
    <div class="dp-explain-label">Kaj pomeni ta primerjava?</div>
    <div class="dp-explain-text"><strong>Zavedna persona</strong> je vaš delovni jaz — kako se prilagajate zahtevam okolja in kako vas vidi okolica v službenem kontekstu. <strong>Nezavedna persona</strong> je vaš temeljni jaz — naravne, globlje preference, ki pridejo do izraza ko niste pod pritiskom in ste povsem sproščeni. Večja ko je razlika med njima, več energije porabite za prilagajanje. <em>Tok preferenc</em> meri intenzivnost tega prilagajanja — visoka vrednost lahko nakazuje stres ali vedenjsko masko.</div>
  </div>

  </div></div><!-- /data-page 1 -->

  <!-- DATA STRAN 2: Energije + Radar -->
  <div class="data-page" id="sec-energije">
  <div class="data-page-inner">
    <div class="dp-title">Barvne energije &amp; Osebnostni radar</div>
    <div class="dp-desc">Moč posameznih barvnih energij in vaš večdimenzionalni osebnostni profil</div>

  <div class="section">
    <div class="sec-header">
      <h2 class="sec-title">Energije</h2>
    </div>
    <div class="bar-grid">
      ${['B','R','G','Y'].map(k=>`
      <div class="bar-item">
        <div class="bar-label" style="color:${CLR_D[k]}">${CLR_NAME[k]}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${((con[k]||0)/6*100).toFixed(0)}%;background:${CLR[k]}"></div></div>
        <div class="bar-val" style="color:${CLR[k]}">${(con[k]||0).toFixed(2)} / 6</div>
      </div>`).join('')}
    </div>
  </div>

  <!-- RADAR -->
  <div class="section">
    <div class="sec-header">
      <h2 class="sec-title">Osebnostni radar</h2>
    </div>
    <div class="radar-wrap">
      <svg width="500" height="500" viewBox="0 0 500 500">
        ${[0.25,0.5,0.75,1].map(f=>`<polygon points="${radarGrid(f)}" fill="none" stroke="#e8e4df" stroke-width="1"/>`).join('')}
        ${Array.from({length:N},(_,i)=>{
          const angle=(Math.PI*2*i/N)-Math.PI/2
          return `<line x1="${CX}" y1="${CY}" x2="${(CX+R_max*Math.cos(angle)).toFixed(1)}" y2="${(CY+R_max*Math.sin(angle)).toFixed(1)}" stroke="#e8e4df" stroke-width="1"/>`
        }).join('')}
        <polygon points="${dataPts.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}" fill="${mainClr}" fill-opacity="0.15" stroke="${mainClr}" stroke-width="2"/>
        ${dataPts.map((p,i)=>`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5" fill="${radarDims[i].clr}"/>`).join('')}
        ${radarDims.map((d,i)=>radarLabel(i,d.label)).join('')}
      </svg>
    </div>
  </div>

  <div class="dp-explain" style="margin-top:20px">
    <div class="dp-explain-label">Kaj pove osebnostni radar?</div>
    <div class="dp-explain-text">Radar prikazuje vaš profil vzdolž osmih dimenzij. Vsaka os meri kombinacijo barvnih energij v določenem kontekstu — od analitičnega razmišljanja do intuitivnega zaznavanja. <strong>Večja površina</strong> v določeni smeri pomeni močnejšo preferenco. Oblika radarja je vaš edinstveni prstni odtis — ni dveh enakih profilov.</div>
  </div>

  </div></div><!-- /data-page 2 -->

  <!-- OSEBNI STIL -->
  ${renderSection('stil','Osebni stil','👤')}
  ${renderSection('inter','Interakcija z drugimi','🤝')}
  ${renderSection('odl','Sprejemanje odločitev','⚖️')}
  ${renderSection('pritisk','Vedenje pod pritiskom','⚡')}
  ${renderSection('pred','Ključne prednosti','💪')}
  ${renderSection('slab','Možne slabosti','🔍')}

  <!-- TIM -->
  </div>
  <div class="chapter">
  <div class="group-header gh-tim" id="tim">Tim &amp; Okolje</div>
  ${renderSection('tim','Prispevek k timu','👥')}
  ${renderSection('okol','Idealno delovno okolje','🏢')}
  ${renderSection('motiv','Motivacija in strahovi','🎯')}
  ${renderSection('kom','Komunikacijski nasveti','💬')}

  <!-- RAZVOJ -->
  </div>
  <div class="chapter">
  <div class="group-header gh-razvoj" id="razvoj">Razvoj &amp; Odnosi</div>
  ${renderSection('razv','Predlogi za razvoj','🚀')}
  ${renderSection('slepe','Slepe pege','🔎')}
  ${renderSection('naspr','Nasprotni tip','🔄')}
  ${renderSection('vodenje','Kako voditi','👔')}
  ${renderSection('digital','Digitalna komunikacija','💻')}
  ${renderSection('stres','Stres in opozorilni znaki','⚠️')}
  ${renderSection('regen','Regeneracija in ravnovesje','🌿')}

  <!-- PRODAJA -->
  </div>
  <div class="chapter">
  <div class="group-header gh-prodaja" id="prodaja">Prodajno poglavje</div>

  <!-- KAKO KOMUNICIRAŠ Z VSAKIM TIPOM -->
  <div class="section">
    <div class="sec-header">
      <h2 class="sec-title">Kako komuniciraš z vsakim tipom</h2>
    </div>
    <p style="font-size:13px;color:var(--muted);margin-bottom:20px;line-height:1.7">Indeks temelji na vaših barvnih vrednostih — upošteva naravno afiniteto, vpliv nasprotnih energij in delno kompenzacijo sorodnih lastnosti.</p>
    <div class="compat-grid">
      ${['B','R','G','Y'].map(k => {
        const pct = calcKomunikacija(k, con)
        const clr = compatColors[k]
        const circumference = 2 * Math.PI * 34
        const dash = (pct/100 * circumference).toFixed(1)
        const gap = (circumference - dash).toFixed(1)
        const level = pct>=75?'Naravno':'Zmerno'
        const levelClr = pct>=75?'#2e8a55':pct>=55?'#c49a10':'#c94030'
        const desc = compatDesc(k, pct, con)
        return '<div class="compat-item">'
          + '<div class="compat-circle" style="background:'+CLR_L[k]+'">'
          + '<svg width="80" height="80" viewBox="0 0 80 80" style="position:absolute;inset:0;transform:rotate(-90deg)">'
          + '<circle cx="40" cy="40" r="34" fill="none" stroke="#eee" stroke-width="6"/>'
          + '<circle cx="40" cy="40" r="34" fill="none" stroke="'+clr+'" stroke-width="6" stroke-dasharray="'+dash+' '+gap+'" stroke-linecap="round"/>'
          + '</svg>'
          + '<span style="position:relative;z-index:1;font-size:18px;font-weight:800;color:'+clr+'">'+pct+'%</span>'
          + '</div>'
          + '<div class="compat-name" style="color:'+clr+'">'+compatNames[k]+'</div>'
          + '<div style="display:inline-block;font-size:10px;font-weight:700;color:'+levelClr+';background:'+levelClr+'22;padding:2px 8px;border-radius:10px;margin:4px 0 6px">'+level+'</div>'
          + '<div class="compat-desc">'+desc+'</div>'
          + '</div>'
      }).join('')}
    </div>
  </div>
  ${renderSection('prod_uvod','Prodajni slog','💼')}

  ${(d.salesPhases||[]).length > 0 ? `
  <div class="section">
    <div class="sec-header">
      <h2 class="sec-title">6 faz prodajnega procesa</h2>
    </div>
    <div class="phases">
      ${(d.salesPhases||[]).map(phase => {
        const lk = d.leadColor
        const pd = phase[lk] || {}
        return `
        <div class="phase">
          <div class="phase-label">${phase.label||''}</div>
          <div class="phase-row"><span class="phase-tag tag-green">Prednost</span><span class="phase-text">${pd.strong||''}</span></div>
          <div class="phase-row"><span class="phase-tag tag-red">Izziv</span><span class="phase-text">${pd.challenge||''}</span></div>
          <div class="phase-row"><span class="phase-tag tag-blue">Nasvet</span><span class="phase-text">${pd.tip||''}</span></div>
        </div>`
      }).join('')}
    </div>
  </div>` : ''}

  ${renderSection('prod_mocne','Močne točke v prodaji','⭐')}
  ${renderSection('prod_slepe','Slepe pege v prodaji','🔍')}
  ${renderSection('prod_akcija','Top 5 akcijskih korakov','✅')}

  <!-- PRODAJNI INDIKATORJI -->
  <div class="section">
    <div class="sec-header">
      <h2 class="sec-title">Pokazatelji prodajnih preferenc</h2>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:8px">
      ${htmlSalesIndicators}
    </div>
  </div>
  </div>

  <!-- DNEVNIK RAZVOJA -->
  <div class="section" id="sec-razvoj-dnevnik">
    <div class="sec-header">
      <h2 class="sec-title">Dnevnik razvoja</h2>
    </div>
    <div class="razvoj-stats" id="razvojStats">0 / 5 korakov dokončanih</div>
    <div class="razvoj-progress"><div class="razvoj-progress-fill" id="razvojProgress" style="width:0%"></div></div>
    <ul class="razvoj-list" id="razvojList">
      ${(()=>{
        // Izvleči akcijske korake iz prod_akcija teksta
        const txt = texts['prod_akcija'] || ''
        const lines = txt.replace(/<[^>]+>/g,'').split('\n').filter(l=>l.trim() && l.match(/Korak|\*\*/))
        const koraki = lines.slice(0,5).map((l,i) => {
          const clean = l.replace(/\*\*/g,'').replace(/^Korak \d+:/,'').replace(/^\d+\./,'').trim()
          return '<li class="razvoj-item" id="razvoj-'+i+'" onclick="toggleRazvoj('+i+')">'
            + '<div class="razvoj-check" id="check-'+i+'"></div>'
            + '<div class="razvoj-num">'+(i+1)+'</div>'
            + '<div class="razvoj-text">'+clean+'</div>'
            + '</li>'
        })
        if(koraki.length === 0) {
          return '<li class="razvoj-item"><div class="razvoj-text" style="color:var(--muted)">Najprej generiraj "Top 5 akcijskih korakov" v adminu.</div></li>'
        }
        return koraki.join('')
      })()}
    </ul>
  </div>

</main>

<footer>
  <div class="footer-logo">
    <svg width="24" height="24" viewBox="0 0 60 60">
      <path d="M30,30 L30,4 A26,26 0 0,1 56,30 Z" fill="#c94030"/>
      <path d="M30,30 L56,30 A26,26 0 0,1 30,56 Z" fill="#c49a10"/>
      <path d="M30,30 L30,56 A26,26 0 0,1 4,30 Z" fill="#2e8a55"/>
      <path d="M30,30 L4,30 A26,26 0 0,1 30,4 Z" fill="#4a7ab5"/>
      <circle cx="30" cy="30" r="10" fill="white"/>
    </svg>
    <strong style="font-size:13px;color:#555">Barvni kompas</strong>
  </div>
  <div style="color:#888;margin-bottom:4px">${d.ime} · Osebnostni profil</div>
  <div style="font-size:11px;color:#ccc">Ta dokument je zaupne narave in namenjen izključno prejemniku.</div>
</footer>

<script>
  // Scroll navigacija
  function scrollTo(id) {
    const el = document.getElementById(id)
    if(el) { window.scrollTo({top: el.offsetTop - 80, behavior:'smooth'}) }
  }

  // Aktivni nav link ob scrollu
  window.addEventListener('scroll', () => {
    const sections = ['profil','tim','razvoj','prodaja']
    const links = document.querySelectorAll('.nav-link')
    let current = 'profil'
    sections.forEach(id => {
      const el = document.getElementById(id)
      if(el && window.scrollY >= el.offsetTop - 120) current = id
    })
    links.forEach((l,i) => l.classList.toggle('active', sections[i]===current))
  })

  // Animirani bar fills ob nalaganju
  window.addEventListener('load', () => {
    document.querySelectorAll('.bar-fill').forEach(el => {
      const target = el.style.width
      el.style.width = '0'
      setTimeout(() => { el.style.width = target }, 300)
    })
    // Naloži shranjene checkboxe
    loadRazvojState()
  })



  // ── KOPIRAJ POVZETEK ─────────────────────────────────────────────────────




  // ── DNEVNIK RAZVOJA ──────────────────────────────────────────────────────
  const STORAGE_KEY = 'razvoj_' + (document.title || 'bk')

  function loadRazvojState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      saved.forEach(i => {
        const item = document.getElementById('razvoj-'+i)
        if(item) item.classList.add('done')
        const check = document.getElementById('check-'+i)
        if(check) check.innerHTML = '✓'
      })
      updateRazvojProgress()
    } catch(e) {}
  }

  function toggleRazvoj(i) {
    const item = document.getElementById('razvoj-'+i)
    const check = document.getElementById('check-'+i)
    if(!item) return
    const isDone = item.classList.toggle('done')
    check.innerHTML = isDone ? '<span style="color:white;font-size:13px;font-weight:700">✓</span>' : ''
    // Shrani
    try {
      const items = document.querySelectorAll('.razvoj-item')
      const done = [...items].map((el,idx) => el.classList.contains('done') ? idx : -1).filter(x=>x>=0)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(done))
    } catch(e) {}
    updateRazvojProgress()
  }

  function updateRazvojProgress() {
    const items = document.querySelectorAll('.razvoj-item')
    const total = items.length
    const done = [...items].filter(el => el.classList.contains('done')).length
    const pct = total > 0 ? Math.round(done/total*100) : 0
    const fill = document.getElementById('razvojProgress')
    const stats = document.getElementById('razvojStats')
    if(fill) fill.style.width = pct + '%'
    if(stats) stats.textContent = done + ' / ' + total + ' korakov dokončanih'
  }





</script>
</body>
</html>`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.send(html)
})



// ─── HTML REPORT SPORT ───────────────────────────────────────────────────────
app.post('/api/html-report-sport', (req, res) => {
  const { profileData: d } = req.body
  const CLR = {B:'#4a7ab5',R:'#c94030',G:'#2e8a55',Y:'#c49a10'}
  const CLR_L = {B:'#e8f0fa',R:'#faeaea',G:'#e6f5ee',Y:'#fdf6e3'}
  const CLR_D = {B:'#1a4a7a',R:'#a8291a',G:'#1a5c38',Y:'#8a6200'}
  const CLR_NAME = {B:'Analitična modra',R:'Aktivna rdeča',G:'Stabilna zelena',Y:'Navdušena rumena'}
  const lc = d.leadColor || 'B'
  const mainClr = CLR[lc]
  const lightClr = CLR_L[lc]
  const texts = d.texts || {}
  const con = d.con || {}
  const typeSlName = (d.typeData && d.typeData.sl) || d.typeName || ''
  const sorted = ['B','R','G','Y'].map(k=>({k,v:con[k]||0})).sort((a,b)=>b.v-a.v)

  function sec(id, title, icon) {
    const txt = texts[id] || ''
    if(!txt) return ''
    return '<div class="section" id="sec-'+id+'">'
      + '<div class="sec-header"><span class="sec-icon">'+icon+'</span><h2 class="sec-title">'+title+'</h2></div>'
      + '<div class="sec-body">'+txt.split('**').map((p,i)=>i%2===1?'<strong>'+p+'</strong>':p).join('').split('\n').join('<br>')+'</div>'
      + '</div>'
  }

  const html = `<!DOCTYPE html>
<html lang="sl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Barvni kompas Šport — ${d.ime}</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--main:${mainClr};--light:${lightClr};--dark:${CLR_D[lc]};--bg:#fafaf8;--border:#e8e4df;--text:#1a1a1a;--muted:#6b6460}
  body{font-family:system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.7}
  nav{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(250,250,248,.96);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:0 32px;height:56px;display:flex;align-items:center;justify-content:space-between}
  .nav-brand{display:flex;align-items:center;gap:10px}
  .nav-name{font-family:Georgia,serif;font-size:14px;font-weight:700}
  .nav-badge{padding:4px 12px;background:var(--light);color:var(--dark);border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}
  .nav-print{padding:7px 16px;border-radius:20px;font-size:12px;font-weight:600;color:var(--dark);background:var(--light);border:none;cursor:pointer;font-family:inherit}
  .hero{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:80px 32px 60px;background:linear-gradient(135deg,var(--light) 0%,var(--bg) 55%)}
  .hero-content{max-width:900px;width:100%;display:grid;grid-template-columns:1fr auto;gap:60px;align-items:center}
  .hero-badge{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:var(--main);margin-bottom:16px}
  .hero-name{font-family:Georgia,serif;font-size:clamp(44px,6vw,72px);font-weight:700;line-height:1.02;letter-spacing:-.025em;margin-bottom:12px}
  .hero-type{font-size:20px;color:var(--main);font-weight:700;font-family:Georgia,serif;margin-bottom:6px}
  .hero-sub{font-size:13px;color:var(--muted);margin-bottom:16px}
  .sport-info{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:32px}
  .sport-tag{padding:8px 16px;background:white;border-radius:20px;border:1.5px solid var(--border);font-size:12px;font-weight:600}
  .score-pills{display:flex;gap:10px;flex-wrap:wrap}
  .score-pill{display:flex;align-items:center;gap:8px;padding:10px 16px;background:white;border-radius:40px;border:1.5px solid var(--border);box-shadow:0 2px 8px rgba(0,0,0,.05)}
  .score-dot{width:10px;height:10px;border-radius:50%}
  .score-val{font-size:15px;font-weight:800}
  .donut-wrap{position:relative;width:200px;height:200px;flex-shrink:0}
  .donut-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center}
  .donut-type{font-family:Georgia,serif;font-size:13px;font-weight:700}
  .donut-sub{font-size:11px;color:var(--muted);margin-top:2px}
  main{max-width:900px;margin:0 auto;padding:60px 32px 120px}
  .group-header{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:white;margin:48px 0 16px;padding:8px 16px;border-radius:6px;display:inline-block}
  .gh-sport{background:#c94030}
  .gh-mental{background:#7a4ab5}
  .gh-tim{background:#2e8a55}
  .gh-razvoj{background:#4a7ab5}
  .section{background:white;border-radius:16px;border:1px solid var(--border);padding:28px 32px;margin-bottom:16px;position:relative;overflow:hidden}
  .section::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--main);border-radius:4px 0 0 4px}
  .sec-header{display:flex;align-items:center;gap:12px;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid var(--border)}
  .sec-icon{font-size:18px;width:36px;height:36px;background:var(--light);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .sec-title{font-family:Georgia,serif;font-size:17px;font-weight:700}
  .sec-body{font-size:14px;color:#3a3530;line-height:1.85}
  .sec-body strong{font-weight:700;color:var(--text)}
  footer{text-align:center;padding:40px;font-size:12px;color:#bbb;border-top:1px solid var(--border)}
  @media print{nav{display:none!important}.hero{min-height:auto;padding:40px 32px;page-break-after:always}.group-header{page-break-before:always}.section{break-inside:avoid;box-shadow:none!important}}
</style></head><body>
<nav>
  <div class="nav-brand">
    <svg width="28" height="28" viewBox="0 0 60 60"><path d="M30,30 L30,4 A26,26 0 0,1 56,30 Z" fill="${CLR.R}"/><path d="M30,30 L56,30 A26,26 0 0,1 30,56 Z" fill="${CLR.Y}"/><path d="M30,30 L30,56 A26,26 0 0,1 4,30 Z" fill="${CLR.G}"/><path d="M30,30 L4,30 A26,26 0 0,1 30,4 Z" fill="${CLR.B}"/><circle cx="30" cy="30" r="10" fill="white"/></svg>
    <span class="nav-name">Barvni kompas</span>
    <span class="nav-badge">⚽ Šport</span>
  </div>
  <button class="nav-print" onclick="window.print()">🖨️ Natisni</button>
</nav>
<section class="hero">
  <div class="hero-content">
    <div>
      <div class="hero-badge">Barvni kompas · Športni profil</div>
      <h1 class="hero-name">${d.ime}</h1>
      <div class="hero-type">${typeSlName}</div>
      <div class="hero-sub">${d.variant || ''}</div>
      <div class="sport-info">
        ${d.sport ? '<span class="sport-tag">⚽ '+d.sport+'</span>' : ''}
        ${d.pozicija ? '<span class="sport-tag">📍 '+d.pozicija+'</span>' : ''}
      </div>
      <div class="score-pills">
        ${sorted.map(({k,v})=>'<div class="score-pill"><div class="score-dot" style="background:'+CLR[k]+'"></div><span style="font-size:11px;color:var(--muted)">'+CLR_NAME[k]+'</span><span class="score-val" style="color:'+CLR[k]+'">'+v.toFixed(1)+'</span></div>').join('')}
      </div>
    </div>
    <div class="donut-wrap">
      <svg width="200" height="200" viewBox="0 0 200 200">
        ${(()=>{const total=sorted.reduce((s,{v})=>s+v,0)||1;let a=-Math.PI/2;return sorted.map(({k,v})=>{const ang=(v/total)*Math.PI*2;const x1=100+80*Math.cos(a),y1=100+80*Math.sin(a),x2=100+80*Math.cos(a+ang),y2=100+80*Math.sin(a+ang),xi1=100+50*Math.cos(a),yi1=100+50*Math.sin(a),xi2=100+50*Math.cos(a+ang),yi2=100+50*Math.sin(a+ang),lg=ang>Math.PI?1:0;const p='M'+x1.toFixed(1)+','+y1.toFixed(1)+' A80,80 0 '+lg+',1 '+x2.toFixed(1)+','+y2.toFixed(1)+' L'+xi2.toFixed(1)+','+yi2.toFixed(1)+' A50,50 0 '+lg+',0 '+xi1.toFixed(1)+','+yi1.toFixed(1)+' Z';a+=ang;return '<path d="'+p+'" fill="'+CLR[k]+'" opacity="0.9"/>'}).join('')})()}
        <circle cx="100" cy="100" r="45" fill="white"/>
      </svg>
      <div class="donut-center"><div class="donut-type">${typeSlName}</div><div class="donut-sub">${d.variant||''}</div></div>
    </div>
  </div>
</section>
<main>
  <div class="group-header gh-sport">⚡ Nastop & Trening</div>
  ${sec('sport_trening','Stil treninga','🏋️')}
  ${sec('sport_mentalna','Mentalna pripravljenost','🧠')}
  ${sec('sport_motivacija','Motivacija in pritisk','🎯')}

  <div class="group-header gh-tim">👥 Tim & Vloga</div>
  ${sec('sport_vloga','Vloga v ekipi','⭐')}
  ${sec('sport_slacilnica','Slačilnica in ekipna dinamika','🤝')}
  ${sec('sport_soigralci','Soigralci in dinamika','👥')}

  <div class="group-header gh-mental">🗣️ Komunikacija</div>
  ${sec('sport_trener','Komunikacija s trenerjem','💬')}

  <div class="group-header gh-razvoj">🚀 Razvoj & Stres</div>
  ${sec('sport_razvoj','Razvoj in izzivi','📈')}
  ${sec('sport_stres','Stres in opozorilni znaki','⚠️')}
  ${sec('sport_regen','Regeneracija in ravnovesje','🌿')}
</main>
<footer><strong>Barvni kompas</strong> · Športni profil · ${d.ime}</footer>
</body></html>`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.send(html)
})

// ─── HTML REPORT TIM ─────────────────────────────────────────────────────────
app.post('/api/html-report-tim', (req, res) => {
  const { analiza, members } = req.body
  const CLR = {B:'#4a7ab5',R:'#c94030',G:'#2e8a55',Y:'#c49a10'}
  const CLR_L = {B:'#e8f0fa',R:'#faeaea',G:'#e6f5ee',Y:'#fdf6e3'}
  const CLR_NAME = {B:'Analitična modra',R:'Aktivna rdeča',G:'Stabilna zelena',Y:'Navdušena rumena'}

  function sec(title, txt, icon) {
    if(!txt) return ''
    return '<div class="section"><div class="sec-header"><span class="sec-icon">'+icon+'</span><h2 class="sec-title">'+title+'</h2></div>'
      + '<div class="sec-body">'+txt.split('**').map((p,i)=>i%2===1?'<strong>'+p+'</strong>':p).join('').split('\n').join('<br>')+'</div></div>'
  }

  function boldSec(title, txt, icon) {
    if(!txt) return ''
    const lines = txt.replace(/\*\*([^*]+)\*\*/g, '\n**$1** ').split('\n').map(l=>l.trim()).filter(l=>l)
    const items = []
    let cur = null
    for(const l of lines) {
      const m = l.match(/^\*\*(.+?)\*\*\s*[-–:]?\s*(.*)$/)
      if(m) { cur={title:m[1],desc:m[2]}; items.push(cur) }
      else if(cur) cur.desc += ' '+l
    }
    const lis = items.map(i=>'<li><div class="bl-title">'+i.title+'</div>'+(i.desc?'<div class="bl-desc">'+i.desc+'</div>':'')+'</li>').join('')
    return '<div class="section"><div class="sec-header"><span class="sec-icon">'+icon+'</span><h2 class="sec-title">'+title+'</h2></div><ul class="bold-list">'+lis+'</ul></div>'
  }

  // Tim donut — povprečne vrednosti
  const timCon = {B:0,R:0,G:0,Y:0}
  const mems = members || []
  if(mems.length > 0) {
    mems.forEach(m => { ['B','R','G','Y'].forEach(k => { timCon[k] += (m.con&&m.con[k])||0 }) })
    ;['B','R','G','Y'].forEach(k => { timCon[k] = parseFloat((timCon[k]/mems.length).toFixed(2)) })
  }
  const sortedTim = ['B','R','G','Y'].map(k=>({k,v:timCon[k]})).sort((a,b)=>b.v-a.v)

  const html = `<!DOCTYPE html>
<html lang="sl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Barvni kompas — Timska analiza</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--main:#4a7ab5;--light:#e8f0fa;--dark:#1a4a7a;--bg:#fafaf8;--border:#e8e4df;--text:#1a1a1a;--muted:#6b6460}
  body{font-family:system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.7}
  nav{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(250,250,248,.96);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:0 32px;height:56px;display:flex;align-items:center;justify-content:space-between}
  .nav-name{font-family:Georgia,serif;font-size:14px;font-weight:700;margin-left:10px}
  .nav-badge{padding:4px 12px;background:#e8f0fa;color:#1a4a7a;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}
  .nav-print{padding:7px 16px;border-radius:20px;font-size:12px;font-weight:600;color:#1a4a7a;background:#e8f0fa;border:none;cursor:pointer;font-family:inherit}
  .hero{min-height:60vh;display:flex;align-items:center;justify-content:center;padding:80px 32px 60px;background:linear-gradient(135deg,#e8f0fa 0%,var(--bg) 55%)}
  .hero-content{max-width:900px;width:100%}
  .hero-badge{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:#4a7ab5;margin-bottom:16px}
  .hero-name{font-family:Georgia,serif;font-size:clamp(36px,5vw,60px);font-weight:700;line-height:1.05;margin-bottom:24px}
  .members-grid{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:32px}
  .member-pill{display:flex;align-items:center;gap:8px;padding:10px 16px;background:white;border-radius:40px;border:1.5px solid var(--border)}
  .member-dot{width:10px;height:10px;border-radius:50%}
  .tim-scores{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:24px}
  .tim-score{background:white;border-radius:12px;padding:14px;border:1px solid var(--border);text-align:center}
  .tim-score-val{font-size:24px;font-weight:800;margin-bottom:4px}
  .tim-score-label{font-size:11px;color:var(--muted)}
  main{max-width:900px;margin:0 auto;padding:60px 32px 120px}
  .group-header{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:white;margin:48px 0 16px;padding:8px 16px;border-radius:6px;display:inline-block}
  .gh-analiza{background:#4a7ab5}
  .gh-dinamika{background:#2e8a55}
  .gh-razvoj{background:#7a4ab5}
  .section{background:white;border-radius:16px;border:1px solid var(--border);padding:28px 32px;margin-bottom:16px;position:relative;overflow:hidden}
  .section::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:#4a7ab5;border-radius:4px 0 0 4px}
  .sec-header{display:flex;align-items:center;gap:12px;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid var(--border)}
  .sec-icon{font-size:18px;width:36px;height:36px;background:#e8f0fa;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .sec-title{font-family:Georgia,serif;font-size:17px;font-weight:700}
  .sec-body{font-size:14px;color:#3a3530;line-height:1.85}
  .sec-body strong{font-weight:700}
  .bold-list{list-style:none;padding:0;display:flex;flex-direction:column;gap:12px}
  .bold-list li{padding:14px 16px;background:var(--bg);border-radius:10px;border-left:3px solid #4a7ab5}
  .bl-title{font-size:13px;font-weight:700;margin-bottom:4px}
  .bl-desc{font-size:13px;color:#555;line-height:1.65}
  footer{text-align:center;padding:40px;font-size:12px;color:#bbb;border-top:1px solid var(--border)}
  @media print{nav{display:none!important}.hero{min-height:auto;page-break-after:always}.group-header{page-break-before:always}.section{break-inside:avoid}}
</style></head><body>
<nav>
  <div style="display:flex;align-items:center">
    <svg width="28" height="28" viewBox="0 0 60 60"><path d="M30,30 L30,4 A26,26 0 0,1 56,30 Z" fill="#c94030"/><path d="M30,30 L56,30 A26,26 0 0,1 30,56 Z" fill="#c49a10"/><path d="M30,30 L30,56 A26,26 0 0,1 4,30 Z" fill="#2e8a55"/><path d="M30,30 L4,30 A26,26 0 0,1 30,4 Z" fill="#4a7ab5"/><circle cx="30" cy="30" r="10" fill="white"/></svg>
    <span class="nav-name">Barvni kompas</span>
    <span class="nav-badge" style="margin-left:10px">👥 Tim</span>
  </div>
  <button class="nav-print" onclick="window.print()">🖨️ Natisni</button>
</nav>
<section class="hero">
  <div class="hero-content">
    <div class="hero-badge">Barvni kompas · Timska analiza</div>
    <h1 class="hero-name">Timska analiza</h1>
    <div class="members-grid">
      ${mems.map(m=>{const lc=['B','R','G','Y'].reduce((a,b)=>(m.con&&(m.con[a]||0))>(m.con&&(m.con[b]||0))?a:b);return '<div class="member-pill"><div class="member-dot" style="background:'+CLR[lc]+'"></div><span style="font-size:13px;font-weight:500">'+m.ime+'</span></div>'}).join('')}
    </div>
    <div class="tim-scores">
      ${['B','R','G','Y'].map(k=>'<div class="tim-score"><div class="tim-score-val" style="color:'+CLR[k]+'">'+timCon[k].toFixed(1)+'</div><div class="tim-score-label">'+CLR_NAME[k]+'</div></div>').join('')}
    </div>
  </div>
</section>
<main>
  <div class="group-header gh-analiza">📊 Analiza tima</div>
  ${sec('Prednosti tega tima', analiza&&analiza.prednosti, '💪')}
  ${sec('Tveganja in slepe pege', analiza&&analiza.tveganja, '⚠️')}
  ${sec('Komunikacija v timu', analiza&&analiza.komunikacija, '💬')}

  <div class="group-header gh-dinamika">👥 Dinamika & Vloge</div>
  ${boldSec('Priporočila za vodjo', analiza&&analiza.priporocila, '👔')}
  ${sec('Razvojne priložnosti', analiza&&analiza.razvoj, '🚀')}
</main>
<footer><strong>Barvni kompas</strong> · Timska analiza · ${mems.map(m=>m.ime).join(', ')}</footer>
</body></html>`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.send(html)
})

// ─── HTML REPORT SPORT TIM ───────────────────────────────────────────────────
app.post('/api/html-report-sport-tim', (req, res) => {
  const { analiza, members } = req.body
  const CLR = {B:'#4a7ab5',R:'#c94030',G:'#2e8a55',Y:'#c49a10'}
  const CLR_NAME = {B:'Analitična modra',R:'Aktivna rdeča',G:'Stabilna zelena',Y:'Navdušena rumena'}

  function sec(title, txt, icon) {
    if(!txt) return ''
    return '<div class="section"><div class="sec-header"><span class="sec-icon">'+icon+'</span><h2 class="sec-title">'+title+'</h2></div>'
      + '<div class="sec-body">'+txt.split('**').map((p,i)=>i%2===1?'<strong>'+p+'</strong>':p).join('').split('\n').join('<br>')+'</div></div>'
  }

  function boldSec(title, txt, icon) {
    if(!txt) return ''
    const lines = txt.replace(/\*\*([^*]+)\*\*/g, '\n**$1** ').split('\n').map(l=>l.trim()).filter(l=>l)
    const items = []
    let cur = null
    for(const l of lines) {
      const m = l.match(/^\*\*(.+?)\*\*\s*[-–:]?\s*(.*)$/)
      if(m) { cur={title:m[1],desc:m[2]}; items.push(cur) }
      else if(cur) cur.desc += ' '+l
    }
    const lis = items.map(i=>'<li><div class="bl-title">'+i.title+'</div>'+(i.desc?'<div class="bl-desc">'+i.desc+'</div>':'')+'</li>').join('')
    return '<div class="section"><div class="sec-header"><span class="sec-icon">'+icon+'</span><h2 class="sec-title">'+title+'</h2></div><ul class="bold-list">'+lis+'</ul></div>'
  }

  const mems = members || []
  const timCon = {B:0,R:0,G:0,Y:0}
  if(mems.length > 0) {
    mems.forEach(m => { ['B','R','G','Y'].forEach(k => { timCon[k] += (m.con&&m.con[k])||0 }) })
    ;['B','R','G','Y'].forEach(k => { timCon[k] = parseFloat((timCon[k]/mems.length).toFixed(2)) })
  }

  const html = `<!DOCTYPE html>
<html lang="sl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Barvni kompas — Športna timska analiza</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--main:#c94030;--light:#faeaea;--dark:#a8291a;--bg:#fafaf8;--border:#e8e4df;--text:#1a1a1a;--muted:#6b6460}
  body{font-family:system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.7}
  nav{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(250,250,248,.96);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:0 32px;height:56px;display:flex;align-items:center;justify-content:space-between}
  .nav-name{font-family:Georgia,serif;font-size:14px;font-weight:700;margin-left:10px}
  .nav-badge{padding:4px 12px;background:#faeaea;color:#a8291a;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}
  .nav-print{padding:7px 16px;border-radius:20px;font-size:12px;font-weight:600;color:#a8291a;background:#faeaea;border:none;cursor:pointer;font-family:inherit}
  .hero{min-height:60vh;display:flex;align-items:center;justify-content:center;padding:80px 32px 60px;background:linear-gradient(135deg,#faeaea 0%,var(--bg) 55%)}
  .hero-content{max-width:900px;width:100%}
  .hero-badge{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:#c94030;margin-bottom:16px}
  .hero-name{font-family:Georgia,serif;font-size:clamp(36px,5vw,60px);font-weight:700;line-height:1.05;margin-bottom:24px}
  .members-grid{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px}
  .member-pill{display:flex;align-items:center;gap:8px;padding:10px 16px;background:white;border-radius:40px;border:1.5px solid var(--border)}
  .tim-scores{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
  .tim-score{background:white;border-radius:12px;padding:14px;border:1px solid var(--border);text-align:center}
  .tim-score-val{font-size:24px;font-weight:800;margin-bottom:4px}
  .tim-score-label{font-size:11px;color:var(--muted)}
  main{max-width:900px;margin:0 auto;padding:60px 32px 120px}
  .group-header{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:white;margin:48px 0 16px;padding:8px 16px;border-radius:6px;display:inline-block}
  .gh-ekipa{background:#c94030}
  .gh-nastop{background:#c49a10}
  .gh-razvoj{background:#2e8a55}
  .section{background:white;border-radius:16px;border:1px solid var(--border);padding:28px 32px;margin-bottom:16px;position:relative;overflow:hidden}
  .section::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:#c94030;border-radius:4px 0 0 4px}
  .sec-header{display:flex;align-items:center;gap:12px;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid var(--border)}
  .sec-icon{font-size:18px;width:36px;height:36px;background:#faeaea;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .sec-title{font-family:Georgia,serif;font-size:17px;font-weight:700}
  .sec-body{font-size:14px;color:#3a3530;line-height:1.85}
  .sec-body strong{font-weight:700}
  .bold-list{list-style:none;padding:0;display:flex;flex-direction:column;gap:12px}
  .bold-list li{padding:14px 16px;background:var(--bg);border-radius:10px;border-left:3px solid #c94030}
  .bl-title{font-size:13px;font-weight:700;margin-bottom:4px}
  .bl-desc{font-size:13px;color:#555;line-height:1.65}
  footer{text-align:center;padding:40px;font-size:12px;color:#bbb;border-top:1px solid var(--border)}
  @media print{nav{display:none!important}.hero{min-height:auto;page-break-after:always}.group-header{page-break-before:always}.section{break-inside:avoid}}
</style></head><body>
<nav>
  <div style="display:flex;align-items:center">
    <svg width="28" height="28" viewBox="0 0 60 60"><path d="M30,30 L30,4 A26,26 0 0,1 56,30 Z" fill="#c94030"/><path d="M30,30 L56,30 A26,26 0 0,1 30,56 Z" fill="#c49a10"/><path d="M30,30 L30,56 A26,26 0 0,1 4,30 Z" fill="#2e8a55"/><path d="M30,30 L4,30 A26,26 0 0,1 30,4 Z" fill="#4a7ab5"/><circle cx="30" cy="30" r="10" fill="white"/></svg>
    <span class="nav-name">Barvni kompas</span>
    <span class="nav-badge" style="margin-left:10px">⚽ Šport Tim</span>
  </div>
  <button class="nav-print" onclick="window.print()">🖨️ Natisni</button>
</nav>
<section class="hero">
  <div class="hero-content">
    <div class="hero-badge">Barvni kompas · Športna timska analiza</div>
    <h1 class="hero-name">Športna timska analiza</h1>
    <div class="members-grid">
      ${mems.map(m=>{const lc=['B','R','G','Y'].reduce((a,b)=>(m.con&&(m.con[a]||0))>(m.con&&(m.con[b]||0))?a:b);return '<div class="member-pill"><div style="width:10px;height:10px;border-radius:50%;background:'+CLR[lc]+'"></div><span style="font-size:13px;font-weight:500">'+m.ime+'</span></div>'}).join('')}
    </div>
    <div class="tim-scores">
      ${['B','R','G','Y'].map(k=>'<div class="tim-score"><div class="tim-score-val" style="color:'+CLR[k]+'">'+timCon[k].toFixed(1)+'</div><div class="tim-score-label">'+CLR_NAME[k]+'</div></div>').join('')}
    </div>
  </div>
</section>
<main>
  <div class="group-header gh-ekipa">👥 Ekipna dinamika</div>
  ${sec('Kemija ekipe', analiza&&analiza.kemija, '⚡')}
  ${boldSec('Vloge v ekipi', analiza&&analiza.vloge, '⭐')}
  ${sec('Kako delati s posameznikom', analiza&&analiza.posameznik, '👤')}

  <div class="group-header gh-nastop">🏆 Nastop</div>
  ${sec('Pred-tekma protokol', analiza&&analiza.predtekma, '🎯')}
  ${sec('Krizni moment', analiza&&analiza.kriza, '🔥')}

  <div class="group-header gh-razvoj">🚀 Razvoj</div>
  ${sec('Kako voditi trening', analiza&&analiza.trening, '📋')}
</main>
<footer><strong>Barvni kompas</strong> · Športna timska analiza · ${mems.map(m=>m.ime).join(', ')}</footer>
</body></html>`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.send(html)
})

// ─── PDF GENERATOR (Playwright) ───────────────────────────────────────────────
app.post('/api/pdf', async (req, res) => {
  const { chromium } = require('playwright')
  const fs = require('fs')
  const os = require('os')
  const path = require('path')
  const { profileData } = req.body

  try {
    const { coverHtml, contentHtml } = generatePdfHtml(profileData)
    const tmpDir = os.tmpdir()
    const ts = Date.now()
    const coverPath = path.join(tmpDir, `cover-${ts}.pdf`)
    const contentPath = path.join(tmpDir, `content-${ts}.pdf`)
    const finalPath = path.join(tmpDir, `final-${ts}.pdf`)

    const browser = await chromium.launch()

    // 1. Naslovnica — brez margina, polna stran
    const coverPage = await browser.newPage()
    await coverPage.setContent(coverHtml, { waitUntil: 'domcontentloaded' })
    await coverPage.waitForTimeout(800)
    await coverPage.pdf({
      path: coverPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
    })

    // 2. Vsebinske strani
    const contentPage = await browser.newPage()
    await contentPage.setContent(contentHtml, { waitUntil: 'domcontentloaded' })
    await contentPage.waitForTimeout(1200)
    await contentPage.pdf({
      path: contentPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
    })

    await browser.close()

    // 3. Združi z qpdf če je na voljo, sicer samo vsebina
    const safeName = profileData.ime.replace(/ /g,'-').replace(/[čšžČŠŽ]/g, c => ({č:'c',š:'s',ž:'z',Č:'C',Š:'S',Ž:'Z'}[c]||c))
    try {
      const { execSync } = require('child_process')
      execSync(`qpdf --empty --pages "${coverPath}" "${contentPath}" -- "${finalPath}"`)
      const finalPdf = fs.readFileSync(finalPath)
      ;[coverPath, contentPath, finalPath].forEach(p => { try { fs.unlinkSync(p) } catch(e){} })
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="insights-${safeName}.pdf"`)
      res.send(finalPdf)
    } catch(mergeErr) {
      // qpdf ni na voljo — pošlji naslovnico + vsebino ločeno (samo vsebina)
      ;[coverPath].forEach(p => { try { fs.unlinkSync(p) } catch(e){} })
      const finalPdf = fs.readFileSync(contentPath)
      ;[contentPath].forEach(p => { try { fs.unlinkSync(p) } catch(e){} })
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="insights-${safeName}.pdf"`)
      res.send(finalPdf)
    }
  } catch (err) {
    console.error('PDF error:', err)
    res.status(500).json({ error: err.message })
  }
})


// ─── PDF HTML TEMPLATE ────────────────────────────────────────────────────────

// ─── PDF HELPER FUNCTIONS ─────────────────────────────────────────────────────
const CLR_PDF = {B:'#4a7ab5',R:'#c94030',G:'#2e8a55',Y:'#c49a10'}
const CLR_L_PDF = {B:'#e8f0fa',R:'#faeaea',G:'#e6f5ee',Y:'#fdf6e3'}
const CLR_D_PDF = {B:'#1a4a7a',R:'#a8291a',G:'#1a5c38',Y:'#8a6200'}
const CLR_BG_PDF = {B:'#1a2f4a',R:'#3a0f0a',G:'#0a2a1a',Y:'#2a1f00'}

function pdfBarChart(scores, title) {
  const order=['B','G','Y','R'], labels=['Blue','Green','Yellow','Red'], colors=[CLR_PDF.B,CLR_PDF.G,CLR_PDF.Y,CLR_PDF.R]
  const H=110
  const bars = order.map((k,i) => {
    const sc=Math.max(0,Math.min(6,scores[k])), bh=Math.round((sc/6)*H), x=i*46+4
    return `<rect x="${x}" y="${H-bh}" width="34" height="${bh}" fill="${colors[i]}" rx="2"/>
      <text x="${x+17}" y="${H+11}" text-anchor="middle" font-size="8" fill="${colors[i]}" font-weight="600">${labels[i]}</text>
      <text x="${x+17}" y="${H+21}" text-anchor="middle" font-size="8" fill="#666">${sc.toFixed(1)}</text>`
  }).join('')
  const midY=Math.round((3/6)*H)
  return `<div style="text-align:center">
    <div style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:#888;margin-bottom:6px">${title}</div>
    <svg width="196" height="${H+28}" xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="${H-midY}" x2="196" y2="${H-midY}" stroke="#aaa" stroke-width="0.7" stroke-dasharray="3,3"/>
      ${bars}
    </svg>
  </div>`
}

function pdfWheel(scores) {
  const cx=90,cy=90,R=80,inner=18
  const segs=[{k:'B',hex:CLR_PDF.B,s:Math.PI,e:Math.PI*1.5},{k:'R',hex:CLR_PDF.R,s:Math.PI*1.5,e:Math.PI*2},{k:'Y',hex:CLR_PDF.Y,s:0,e:Math.PI*0.5},{k:'G',hex:CLR_PDF.G,s:Math.PI*0.5,e:Math.PI}]
  function pt(cx,cy,r,a){return [cx+r*Math.cos(a),cy+r*Math.sin(a)]}
  function arc(cx,cy,r1,r2,s,e){
    const steps=32,op=[],ip=[]
    for(let i=0;i<=steps;i++){const a=s+(e-s)*i/steps;op.push(pt(cx,cy,r2,a));ip.push(pt(cx,cy,r1,a))}
    return op.map((p,i)=>(i===0?`M${p[0].toFixed(1)},${p[1].toFixed(1)}`:`L${p[0].toFixed(1)},${p[1].toFixed(1)}`)).join(' ')+' '+ip.reverse().map((p,i)=>(i===0?`L${p[0].toFixed(1)},${p[1].toFixed(1)}`:`L${p[0].toFixed(1)},${p[1].toFixed(1)}`)).join(' ')+'Z'
  }
  const paths=segs.map(s=>{const segR=inner+(R-inner)*(Math.max(0.1,Math.min(6,scores[s.k]))/6);return `<path d="${arc(cx,cy,inner,segR,s.s,s.e)}" fill="${s.hex}cc" stroke="${s.hex}" stroke-width="1.5"/>`}).join('')
  const mid=`<circle cx="${cx}" cy="${cy}" r="${inner+(R-inner)*0.5}" fill="none" stroke="#ccc" stroke-width="0.7" stroke-dasharray="3,4"/>`
  const outer=`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#bbb" stroke-width="1"/>`
  const divs=`<line x1="${cx}" y1="${cy-R}" x2="${cx}" y2="${cy+R}" stroke="white" stroke-width="2"/><line x1="${cx-R}" y1="${cy}" x2="${cx+R}" y2="${cy}" stroke="white" stroke-width="2"/>`
  const centers=segs.map(s=>`<path d="${arc(cx,cy,0,inner-2,s.s,s.e)}" fill="${s.hex}"/>`).join('')
  const lbls=[{k:'B',x:cx-R+4,y:cy-R+12,a:'start'},{k:'R',x:cx+R-4,y:cy-R+12,a:'end'},{k:'Y',x:cx+R-4,y:cy+R-6,a:'end'},{k:'G',x:cx-R+4,y:cy+R-6,a:'start'}].map(l=>`<text x="${l.x}" y="${l.y}" text-anchor="${l.a}" font-size="8" font-weight="700" fill="${CLR_PDF[l.k]}">${l.k} ${scores[l.k].toFixed(1)}</text>`).join('')
  return `<svg width="180" height="180" xmlns="http://www.w3.org/2000/svg">${mid}${paths}${outer}${divs}${centers}${lbls}</svg>`
}

function pdfFlowChart(flow, total) {
  const order=['B','G','Y','R'],colors=[CLR_PDF.B,CLR_PDF.G,CLR_PDF.Y,CLR_PDF.R]
  const H=80,MAX=3
  const bars=order.map((k,i)=>{
    const val=flow[k]||0,pct=Math.min(Math.abs(val)/MAX,1),bh=Math.round(pct*(H/2-4)),x=i*46+4
    return val>=0
      ?`<rect x="${x}" y="${H/2-bh}" width="34" height="${bh}" fill="${colors[i]}cc" rx="2"/>`
      :`<rect x="${x}" y="${H/2}" width="34" height="${bh}" fill="${colors[i]}88" rx="2"/>`
  }).join('')
  return `<div style="text-align:center">
    <div style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:#888;margin-bottom:6px">Preference Tok</div>
    <svg width="196" height="${H+16}" xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="${H/2}" x2="196" y2="${H/2}" stroke="#555" stroke-width="1"/>
      ${bars}
      <text x="98" y="${H+14}" text-anchor="middle" font-size="10" font-weight="700" fill="#333">${total}%</text>
    </svg>
  </div>`
}

function pdfPageHeader(ime, label) {
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:2px solid #333;margin-bottom:11px">
    <div>
      <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:#888;margin-bottom:2px">${label}</div>
      <div style="font-family:Georgia,serif;font-size:14px;font-weight:600">${ime}</div>
    </div>
    <div style="font-size:9px;color:#bbb">${new Date().toLocaleDateString('sl-SI')}</div>
  </div>`
}

function pdfSection(title, text, accentColor) {
  if(!text) return ''
  return `<div style="display:flex;margin-bottom:13px;page-break-inside:avoid;break-inside:avoid">
    <div style="width:3px;background:${accentColor||'#333'};border-radius:3px;flex-shrink:0;margin-right:14px"></div>
    <div style="flex:1">
      <div style="font-family:Georgia,serif;font-size:13px;font-weight:600;color:#1a1a1a;margin-bottom:7px">${title}</div>
      <div style="font-size:12px;color:#4a4a4a;line-height:1.8">${text}</div>
    </div>
  </div>`
}

function pdfBoldSection(title, text, accentColor) {
  if(!text) return ''
  const items = parseBoldListPdf(text)
  if(!items.length) return ''
  return `<div style="display:flex;margin-bottom:13px;page-break-inside:avoid;break-inside:avoid">
    <div style="width:3px;background:${accentColor||'#333'};border-radius:3px;flex-shrink:0;margin-right:14px"></div>
    <div style="flex:1">
      <div style="font-family:Georgia,serif;font-size:13px;font-weight:600;color:#1a1a1a;margin-bottom:8px">${title}</div>
      ${items.map((item,i)=>`<div style="padding:6px 0;${i<items.length-1?'border-bottom:0.5px solid #f0ece4':''}">
        ${item.title?`<div style="font-size:12px;font-weight:600;color:#1a1a1a;margin-bottom:2px">${item.title}</div>`:''}
        ${item.desc?`<div style="font-size:11.5px;color:#5a5a5a;line-height:1.65">${item.desc}</div>`:''}
      </div>`).join('')}
    </div>
  </div>`
}

function parseBoldListPdf(txt) {
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

// Podatki za prodajne indikatorje
const SALES_IND = [
  {phase:'1. Pred prodajnim procesom', items:[
    {label:'Raziskovanje',           color:'#4a7ab5', calc: c => c.B},
    {label:'Izgradnja zaupanja',     color:'#7ab55a', calc: c => (c.G*2+c.Y)/3},
    {label:'Jasni cilji',            color:'#c94030', calc: c => c.R},
    {label:'Dogovarjanje sestanka',  color:'#c97a30', calc: c => (c.R+c.Y)/2},
  ]},
  {phase:'2. Ugotavljanje potreb', items:[
    {label:'Poslušanje',             color:'#3a8a6a', calc: c => (c.G*2+c.B)/3},
    {label:'Spraševanje',            color:'#3a6a8a', calc: c => (c.B*2+c.G)/3},
    {label:'Vzpodbujanje',           color:'#c49a10', calc: c => c.Y},
    {label:'Ustvarjanje priložnosti',color:'#c97a30', calc: c => (c.R+c.Y)/2},
  ]},
  {phase:'3. Dajanje predlogov', items:[
    {label:'Osredotočen in relevanten',  color:'#7a4ab5', calc: c => (c.R+c.B)/2},
    {label:'Entuziastična predstavitev', color:'#c49a10', calc: c => c.Y},
    {label:'Kaže razumevanje za potrebe',color:'#2e8a55', calc: c => c.G},
    {label:'Organizacija & Točnost',     color:'#4a7ab5', calc: c => c.B},
  ]},
  {phase:'4. Upravljanje z ugovori', items:[
    {label:'Direktno reševanje ugovorov',color:'#c94030', calc: c => c.R},
    {label:'Prepričevanje',              color:'#c49a10', calc: c => c.Y},
    {label:'Pojasnjevanje podrobnosti',  color:'#7a4ab5', calc: c => (c.R+c.B)/2},
    {label:'Dodatni sestanki',           color:'#2e8a55', calc: c => c.G},
  ]},
  {phase:'5. Pridobivanje zvestobe', items:[
    {label:'Zaključek',                    color:'#c94030', calc: c => c.R},
    {label:'Fleksibilnost',                color:'#7ab55a', calc: c => (c.G*2+c.Y)/3},
    {label:'Zmanjševanje rizika',          color:'#4a7ab5', calc: c => c.B},
    {label:'Zadovoljevanje potreb stranke',color:'#3a8a6a', calc: c => (c.G*2+c.B)/3},
  ]},
  {phase:'6. Aktivnosti po prodaji', items:[
    {label:'Ohranjanje kontakta',         color:'#2e8a55', calc: c => c.G},
    {label:'Načrtovanje novih strank',    color:'#7a4ab5', calc: c => (c.R+c.B)/2},
    {label:'Vzdrževanje odnosov',         color:'#7ab55a', calc: c => (c.G+c.Y)/2},
    {label:'Pridobivanje priporočil',     color:'#c97a30', calc: c => (c.R+c.Y)/2},
  ]},
]

function pdfSalesIndicators(con, from=0, to=6) {
  return SALES_IND.slice(from, to).map(group => `
    <div style="margin-bottom:10px;page-break-inside:avoid;break-inside:avoid">
      <div style="font-size:11px;font-weight:700;color:#1a1a1a;margin-bottom:7px">${group.phase}</div>
      <div style="border:1px solid #d0cbc3;padding:10px 12px;background:white;border-radius:4px">
        ${group.items.map(item => {
          const val = parseFloat(item.calc(con).toFixed(1))
          const pct = Math.min((val/6)*100, 100)
          const displayVal = parseFloat((val/6*10).toFixed(1))
          return `<div style="display:grid;grid-template-columns:28px 1fr 150px;align-items:center;gap:8px;margin-bottom:6px">
            <div style="font-size:10px;font-weight:600;color:#444;text-align:right">${displayVal}</div>
            <div style="position:relative;height:4px;background:#eee;border-radius:2px">
              <div style="position:absolute;left:0;top:0;height:100%;width:${pct}%;background:${item.color};border-radius:2px"></div>
              <div style="position:absolute;top:50%;left:${pct}%;transform:translate(-50%,-50%);width:9px;height:9px;border-radius:50%;background:${item.color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.25)"></div>
            </div>
            <div style="font-size:10.5px;color:#555">${item.label}</div>
          </div>`
        }).join('')}
      </div>
    </div>
  `).join('')
}

function pdfSalesCard(phase, lc, con) {
  const d=phase[lc]
  const scoreKeys={pred:'B',potrebe:'G',predlog:'B',ugovori:'R',zvestoba:'G',sledenje:'R'}
  const sk=scoreKeys[phase.id]||lc
  const score=con[sk]
  const level=score>=4.0?'Naravna prednost':score>=2.5?'Zavestno področje':'Področje razvoja'
  const lvlColor=score>=4.0?'#1a5c38':score>=2.5?'#8a6200':'#a8291a'
  const lvlBg=score>=4.0?'#e6f5ee':score>=2.5?'#fdf6e3':'#faeaea'
  return `<div style="background:white;border:1px solid #e8e3db;border-radius:8px;padding:10px 13px;margin-bottom:8px;page-break-inside:avoid;break-inside:avoid">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:9px">
      <div style="font-family:Georgia,serif;font-size:13px;font-weight:600">${phase.icon} ${phase.label}</div>
      <div style="font-size:9px;font-weight:700;padding:3px 9px;border-radius:20px;background:${lvlBg};color:${lvlColor}">${level}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:7px">
      <div style="background:#e6f5ee;border-radius:7px;padding:8px 10px">
        <div style="font-size:9px;font-weight:700;color:#1a5c38;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px">Naravne prednosti</div>
        <div style="font-size:11px;color:#1a5c38;line-height:1.5">${d.strong}</div>
      </div>
      <div style="background:#faeaea;border-radius:7px;padding:8px 10px">
        <div style="font-size:9px;font-weight:700;color:#a8291a;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px">Pričakovani izzivi</div>
        <div style="font-size:11px;color:#a8291a;line-height:1.5">${d.challenge}</div>
      </div>
    </div>
    <div style="background:#f0f4ff;border-left:3px solid #4a7ab5;border-radius:0 7px 7px 0;padding:7px 10px;font-size:11px;color:#1a4a7a;line-height:1.5;${d.actions?'margin-bottom:7px':''}">
      <strong>Priporočilo:</strong> ${d.tip}
    </div>
    ${d.actions?`<div style="background:#f9f7f4;border-radius:7px;padding:7px 10px">
      <div style="font-size:9px;font-weight:600;color:#666;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:5px">Akcijski koraki</div>
      ${d.actions.map((a,i)=>`<div style="display:flex;align-items:flex-start;gap:6px;padding:2px 0;font-size:10.5px;color:#4a4a4a;line-height:1.5">
        <span style="width:14px;height:14px;border-radius:50%;background:#e5e0d8;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:8px;font-weight:700;color:#666">${i+1}</span>
        ${a}</div>`).join('')}
    </div>`:''}
  </div>`
}

function generatePdfHtml(d) {
  const lc=d.leadColor
  const darkBg=CLR_BG_PDF[lc]
  const mainColor=CLR_PDF[lc]
  const ime1=d.ime.trim().split(' ')[0]
  const sk=sklanjaj(d.ime, d.spol)
  const texts=d.texts||{}
  const salesPhases=d.salesPhases||[]

  const CD={
    B:{name:'Analitična modra',fears:'Iracionalnost, nepopolnost, zmeda',pressure:'Zapre se vase, postane pretirano kritičen'},
    R:{name:'Aktivna rdeča',fears:'Izguba nadzora, neučinkovitost',pressure:'Postane direktiven, diktatorski, nestrpen'},
    G:{name:'Stabilna zelena',fears:'Konflikt, spremembe brez razloga',pressure:'Se umakne, postane pasivno-agresiven'},
    Y:{name:'Navdušena rumena',fears:'Zavrnitev, ignoriranje, rutina',pressure:'Dramatizira, postane kaotičen'},
  }

  const ARCHETYPE_DESC={
    Observer:'Opazovalec ustreza Jungovemu introvertnemu mislecu — energijo usmerja navznoter, svet razume skozi analizo in iskanje objektivne resnice. Psihična funkcija: mišljenje, usmeritev: introvertna.',
    Reformer:'Reformator združuje introvertno mišljenje z odločnostjo — Jungov strateški mislec, ki analizira globoko in hkrati pogumno uvaja spremembe. Odraža integracijo mišljenja in intuicije.',
    Director:'Direktor je Jungov ekstravertni mislec — usmerjen navzven, k rezultatom in akciji. Energija teče v svet in ga oblikuje skozi odločnost in vodenje.',
    Motivator:'Motivator združuje ekstravertno mišljenje z intuicijo — Jungov vizionarski vodja, ki dosega cilje in navdihuje. Sinteza akcije, karizme in strateškega mišljenja.',
    Inspirer:'Inspirator je Jungov ekstravertni intuitivec — energijo izraža skozi ustvarjalnost, optimizem in širjenje možnosti. Prihodnost in potencial sta njegova naravna domena.',
    Helper:'Pomočnik združuje ekstravertnost z čustvovanjem — Jungov socialni mediator, ki energijo vlaga v izgradnjo mostov med ljudmi.',
    Supporter:'Podpornik je Jungov introvertni čustveni tip — globok, zvest, empatičen. Moč leži v zanesljivosti, lojalnosti in globoki osebni integriteti.',
    Coordinator:'Koordinator združuje introvertno čustvovanje s sistematičnostjo — skrbni organizator, ki varuje harmonijo skupnosti in skrbi za red.',
  }

  const sorted=['B','R','G','Y'].map(k=>({k,v:d.con[k]})).sort((a,b)=>a.v-b.v)
  const low=sorted[0], low2=sorted[1], high=sorted[3]
  const names={B:'Analitična modra',R:'Aktivna rdeča',G:'Stabilna zelena',Y:'Navdušena rumena'}
  const slNames={B:'modro',R:'rdečo',G:'zeleno',Y:'rumeno'}
  const highNames={B:'analitičnem mišljenju in sistematičnosti',R:'odločnosti in usmerjenosti v rezultate',G:'empatiji in gradnji dolgoročnih odnosov',Y:'ustvarjalnosti in navduševanju других'}
  const devDescs={
    B:`Razvijanje analitičnega mišljenja in natančnosti odpira dostop do globlje intelektualne moči. Za ${sk.ime1.rod} to pomeni vlaganje časa v poglobljeno analizo pred odločitvami in ustvarjanje prostora za premislek.`,
    R:`Krepitev odločnosti in poguma pri soočanju s konflikti odpira dostop do vodstvene moči. Za ${sk.ime1.rod} to pomeni zavestno vadbo neposredne komunikacije in prevzemanje pobude v zahtevnih situacijah.`,
    G:`Negovanje empatije in potrpežljivosti odpira dostop do globine medčloveških odnosov. Za ${sk.ime1.rod} to pomeni zavestno upočasnitev, aktivno poslušanje in gradnjo zaupanja skozi doslednost.`,
    Y:`Razvijanje ustvarjalnosti in odprtosti za nove ideje odpira dostop do inovativnega potenciala. Za ${sk.ime1.rod} to pomeni iskanje novih perspektiv in dopuščanje spontanosti v delovnem procesu.`
  }
  const devTips={
    B:['Vzemi si čas za temeljito analizo pred odločitvami','Strukturiraj misli pisno — dnevnik razmislekov','Postavljaj vprašanja "zakaj" preden preidete k akciji','Poišči mentorja z visoko analitično energijo'],
    R:['Vadite direktno komunikacijo — jasno in spoštljivo','Prevzemi vodstvo pri naslednjem skupinskem projektu','Postavi si jasne cilje z merljivimi rezultati','Soočaj se z izzivi namesto da jih odlašaš'],
    G:['Posveti polno pozornost sogovorniku brez prekinitev','Vzdržuj redne stike s ključnimi odnosi','Vadite potrpežljivost — ne hitite z rešitvami','Zgradite rutino za redne osebne pogovore s kolegi'],
    Y:['Dovoli si brainstorming brez kritike','Poišči navdih v novih okoljih in pogovorih','Organiziraj kreativne neformalne pogovore v timu','Vadite optimizem — vsak izziv ima priložnost']
  }

  // Pomožna funkcija za senčne kartice
  function shadowCard(k, label) {
    return `<div style="background:${CLR_L_PDF[k]};border-radius:10px;padding:10px 13px;border:1px solid ${CLR_PDF[k]}44">
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${CLR_D_PDF[k]};margin-bottom:5px">${label}</div>
      <div style="font-family:Georgia,serif;font-size:15px;font-weight:600;color:${CLR_D_PDF[k]};margin-bottom:4px">${names[k]}</div>
      <div style="font-size:11px;color:${CLR_D_PDF[k]}">Vrednost: ${d.con[k].toFixed(2)}/6</div>
    </div>`
  }

  return {
    coverHtml: `<!DOCTYPE html><html lang="sl"><head><meta charset="UTF-8"/>
<style>* { box-sizing:border-box; margin:0; padding:0; }
body { font-family:-apple-system,'Helvetica Neue',Arial,sans-serif; background:white; margin:0; padding:0; }
@page { margin:0mm; }
</style></head><body>
<div style="width:210mm;height:297mm;background:white;display:flex;flex-direction:column;overflow:hidden">
  <div style="display:flex;height:6px;flex-shrink:0">
    <div style="flex:1;background:#4a7ab5"></div><div style="flex:1;background:#c94030"></div>
    <div style="flex:1;background:#c49a10"></div><div style="flex:1;background:#2e8a55"></div>
  </div>
  <div style="padding:52px 60px 0;flex-shrink:0">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:44px">
      <div style="width:32px;height:32px;border-radius:50%;background:conic-gradient(#4a7ab5 0deg 90deg,#c94030 90deg 180deg,#c49a10 180deg 270deg,#2e8a55 270deg 360deg);flex-shrink:0"></div>
      <div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#999">Barvni kompas</div>
    </div>
    <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${mainColor};margin-bottom:18px">Osebnostni profil</div>
    <div style="font-family:Georgia,serif;font-size:62px;font-weight:700;color:#1a1a1a;line-height:1.0;margin-bottom:16px;letter-spacing:-0.02em">${d.ime}</div>
    <div style="font-size:13px;color:#999">${new Date().toLocaleDateString('sl-SI',{day:'numeric',month:'long',year:'numeric'})}</div>
  </div>
  <div style="flex:1;display:flex;align-items:center;justify-content:center">
    <div style="transform:scale(1.55);transform-origin:center">${pdfWheel(d.con)}</div>
  </div>
  <div style="padding:0 60px 48px;display:flex;justify-content:space-between;align-items:flex-end;flex-shrink:0">
    <div>
      <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:#bbb;margin-bottom:6px">Osebnostni tip</div>
      <div style="font-family:Georgia,serif;font-size:22px;font-weight:600;color:#1a1a1a">${d.typeData.sl}</div>
      <div style="font-size:11px;color:#aaa;margin-top:4px">${d.variant}</div>
    </div>
    <div style="display:flex;gap:5px">
      <div style="width:9px;height:9px;border-radius:50%;background:#4a7ab5"></div>
      <div style="width:9px;height:9px;border-radius:50%;background:#c94030"></div>
      <div style="width:9px;height:9px;border-radius:50%;background:#c49a10"></div>
      <div style="width:9px;height:9px;border-radius:50%;background:#2e8a55"></div>
    </div>
  </div>
  <div style="display:flex;height:4px;flex-shrink:0">
    <div style="flex:1;background:#4a7ab5"></div><div style="flex:1;background:#c94030"></div>
    <div style="flex:1;background:#c49a10"></div><div style="flex:1;background:#2e8a55"></div>
  </div>
</div>
</body></html>`,
    contentHtml: `<!DOCTYPE html><html lang="sl"><head><meta charset="UTF-8"/>
<style>
* { box-sizing:border-box; margin:0; padding:0; }
body { font-family:-apple-system,'Helvetica Neue',Arial,sans-serif; background:white; color:#1a1a1a; }


@page {
  margin: 14mm 17mm 16mm;
  @top-left {
    content: string(page-name);
    font-family: -apple-system, sans-serif;
    font-size: 9px;
    color: #888;
  }
}

.page {
  width:210mm; min-height:297mm;
  padding:10mm 14mm 12mm;
  page-break-after:always;
  position:relative;
  background:white;
}
.cover {
  width:210mm; height:297mm;
  background:${darkBg};
  page-break-after:always;
  display:flex; flex-direction:column;
  justify-content:space-between;
  padding:0; overflow:hidden; position:relative;
}
.page-hdr {
  display:flex; justify-content:space-between; align-items:center;
  padding-bottom:6px; border-bottom:2px solid ${mainColor}; margin-bottom:12px;
}
.page-hdr-label { font-size:9px; text-transform:uppercase; letter-spacing:0.1em; color:#888; margin-bottom:2px; }
.page-hdr-name { font-family:Georgia,serif; font-size:14px; font-weight:600; }
.page-hdr-right { font-size:10px; color:#888; font-weight:500; }
.footer {
  position:absolute; bottom:7mm; left:14mm; right:14mm;
  display:flex; justify-content:space-between;
  font-size:9px; color:#bbb;
  border-top:0.5px solid #e5e0d8; padding-top:4px;
}
.section {
  display:flex; margin-bottom:13px;
}
.section-accent { width:3px; border-radius:3px; flex-shrink:0; margin-right:13px; }
.section-title { font-family:Georgia,serif; font-size:13px; font-weight:600; margin-bottom:6px; }
.section-body { font-size:12px; color:#4a4a4a; line-height:1.8; }
.type-card { background:#1a1a1a; color:white; border-radius:10px; padding:14px 18px; margin-bottom:11px; }
.jung-quote { font-family:Georgia,serif; font-style:italic; font-size:14px; color:#1a1a1a; line-height:1.7; margin-bottom:6px; }
.jung-body { font-size:12px; color:#4a4a4a; line-height:1.75; margin-bottom:9px; }
.h2 { font-family:Georgia,serif; font-size:15px; font-weight:600; color:#1a1a1a; margin:18px 0 8px; padding-bottom:5px; border-bottom:1px solid #e5e0d8; }
</style>
</head><body>
<!-- STRAN 2: JUNG TEORIJA -->
<div class="page">
  <div class="page-hdr">
    <div><div class="page-hdr-label">Barvni kompas · Teoretično ozadje</div><div class="page-hdr-name">${d.ime}</div></div>
    <div class="page-hdr-right">Carl Gustav Jung</div>
  </div>

  <div style="border-left:4px solid #1a1a1a;padding:14px 18px;background:#f9f7f4;border-radius:0 10px 10px 0;margin-bottom:11px">
    <div class="jung-quote">"Dokler ne naredimo nezavednega zavednega, bo usmerjalo naše življenje — in mi mu bomo rekli usoda."</div>
    <div style="font-size:11px;color:#888;letter-spacing:0.06em">— Carl Gustav Jung (1875–1961)</div>
  </div>

  <div class="h2" style="margin-top:0">Jungianska osnova osebnostne tipologije</div>
  <div class="jung-body">Carl Gustav Jung je v delu <em>Psihološki tipi</em> (1921) identificiral ključne dimenzije človeške osebnosti. Barvni kompas metodologija gradi neposredno na teh temeljih in jih prevaja v praktičen model štirih barvnih energij — orodje za razumevanje sebe in izboljšanje odnosov z drugimi.</div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:11px">
    <div style="border:1px solid #e5e0d8;border-radius:10px;padding:12px 14px">
      <div style="font-family:Georgia,serif;font-size:12px;font-weight:600;margin-bottom:5px">⬅ Introvertnost / Ekstravertnost ➡</div>
      <div style="font-size:11px;color:#6b6460;line-height:1.65"><strong>Introverti</strong> (modra, zelena) črpajo energijo iz notranjega sveta. <strong>Ekstravertni</strong> (rdeča, rumena) jo pridobivajo iz zunanjega sveta, akcije in socialnih stikov.</div>
    </div>
    <div style="border:1px solid #e5e0d8;border-radius:10px;padding:12px 14px">
      <div style="font-family:Georgia,serif;font-size:12px;font-weight:600;margin-bottom:5px">🧠 Štiri psihološke funkcije</div>
      <div style="font-size:11px;color:#6b6460;line-height:1.65"><strong>Mišljenje</strong> (logika), <strong>Čustvovanje</strong> (vrednote), <strong>Zaznavanje</strong> (fakti) in <strong>Intuicija</strong> (vzorci). Vsaka barvna energija odraža kombinacijo teh funkcij.</div>
    </div>
  </div>

  <div class="h2">Štiri barvne energije in njihova jungianska osnova</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:11px">
    ${[['B','Analitična modra','Introvert · Mišljenje','Analiza, natančnost, sistematičnost, objektivna logika'],['R','Aktivna rdeča','Ekstravert · Mišljenje','Odločnost, pogum, rezultati, neposredna akcija'],['Y','Navdušena rumena','Ekstravert · Intuicija','Ustvarjalnost, optimizem, socialne povezave, vizija'],['G','Stabilna zelena','Introvert · Čustvovanje','Empatija, harmonija, dolgoročni odnosi, vrednote']].map(([k,name,func,desc])=>`
      <div style="background:${CLR_L_PDF[k]};border:1px solid ${CLR_PDF[k]}44;border-radius:10px;padding:10px 12px">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:${CLR_D_PDF[k]};margin-bottom:3px">${name}</div>
        <div style="font-size:10px;font-weight:600;color:${CLR_D_PDF[k]};margin-bottom:5px">${func}</div>
        <div style="font-size:10px;color:${CLR_D_PDF[k]};line-height:1.5">${desc}</div>
      </div>`).join('')}
  </div>

  <div class="h2">Zavedna in nezavedna persona</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:11px">
    <div style="border:1px solid #e5e0d8;border-radius:10px;padding:13px 15px">
      <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.06em;color:#888;margin-bottom:4px">Zavedna persona</div>
      <div style="font-family:Georgia,serif;font-size:13px;font-weight:600;margin-bottom:6px">Delovni jaz</div>
      <div style="font-size:11px;color:#6b6460;line-height:1.65">Odraža, kako se posameznik prilagaja zahtevam delovnega okolja. Maska, ki jo nosimo — vedenjski vzorci razviti kot odgovor na pričakovanja okolice. Izhaja neposredno iz odgovorov na vprašalnik.</div>
    </div>
    <div style="border:1px solid #e5e0d8;border-radius:10px;padding:13px 15px">
      <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.06em;color:#888;margin-bottom:4px">Nezavedna persona</div>
      <div style="font-family:Georgia,serif;font-size:13px;font-weight:600;margin-bottom:6px">Temeljni jaz</div>
      <div style="font-size:11px;color:#6b6460;line-height:1.65">Globlje, naravne osebnostne preference — Jungove "senčne" kvalitete. Izračuna se kot zrcalna vrednost zavedne persone. Visoka razlika (Preference tok) nakazuje intenzivno prilagajanje ali stres.</div>
    </div>
  </div>

  <div style="background:#1a1a1a;color:white;border-radius:11px;padding:11px 14px">
    <div style="font-family:Georgia,serif;font-size:13px;font-weight:600;margin-bottom:7px">Individuacija — vseživljenjski proces</div>
    <div style="font-size:11.5px;opacity:0.82;line-height:1.75">Jung je proces psihološkega zorenja poimenoval individuacija — postopno integriranje vseh delov osebnosti v celostno, avtentično sebstvo. Gre za zavestno sprejemanje tako naravnih moči kot tistih psihičnih funkcij, ki jih pogosto zanemarjamo. V kontekstu Barvni kompas to pomeni razvijanje nižjih barvnih energij — ne z zanikanjem naravnih prednosti, temveč z njihovo dopolnitvijo.</div>
  </div>

  <div class="footer"><span>${d.ime} · Barvni kompas</span><span>Teoretično ozadje</span></div>
</div>

<!-- STRAN 3: GRAFIKONI + PROFIL -->
<div class="page">
  <div class="page-hdr">
    <div><div class="page-hdr-label">Barvni kompas · Osebni profil</div><div class="page-hdr-name">${d.ime}</div></div>
    <div class="page-hdr-right">Barvni profil</div>
  </div>

  <!-- Grafikoni -->
  <div style="display:grid;grid-template-columns:1fr 190px 1fr;gap:12px;margin-bottom:9px;align-items:start">
    <div style="background:#f9f7f4;border-radius:10px;padding:12px">${pdfBarChart(d.con,'Persona (Zavedna)')}</div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
      ${pdfWheel(d.con)}
      <div style="text-align:center">
        <div style="font-size:9px;color:#888">Pozicija ${d.typeData.num}</div>
        <div style="font-family:Georgia,serif;font-size:13px;font-weight:600">${d.typeData.sl}</div>
        <div style="font-size:9px;color:#888;margin-top:1px">${d.variant}</div>
      </div>
    </div>
    <div style="background:#f9f7f4;border-radius:10px;padding:12px">${pdfBarChart(d.uncon,'Persona (Nezavedna)')}</div>
  </div>

  <!-- Preference tok -->
  <div style="display:grid;grid-template-columns:210px 1fr;gap:14px;background:#f9f7f4;border-radius:10px;padding:13px 15px;margin-bottom:9px;align-items:center">
    ${pdfFlowChart(d.flow,d.total)}
    <div>
      <div style="font-size:9px;font-weight:500;text-transform:uppercase;letter-spacing:0.1em;color:#888;margin-bottom:4px">Preference Tok · ${d.total}%</div>
      <div style="font-family:Georgia,serif;font-size:14px;font-weight:600;margin-bottom:6px">Prilagajanje vedenja</div>
      <div style="font-size:11.5px;color:#6b6460;line-height:1.7">Razlika med <strong>zavedno</strong> (delovni jaz) in <strong>nezavedno persono</strong> (temeljni jaz po Jungu). ${d.total>40?'Visok % — visoka motiviranost ali povečan stres.':d.total<10?'Nizek % — dela po naravni poti.':'Zmeren % — uravnoteženo prilagajanje vlogi.'}</div>
    </div>
  </div>

  <!-- Type card -->
  <div class="type-card" style="margin-bottom:12px">
    <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.08em;opacity:0.4;margin-bottom:5px">Osebnostni tip · Barvni kompas</div>
    <div style="font-family:Georgia,serif;font-size:20px;font-weight:700;margin-bottom:3px">${d.typeData.sl}</div>
    <div style="font-size:11px;opacity:0.45;margin-bottom:10px">Pozicija ${d.typeData.num} · ${d.variant}</div>
    <div style="font-size:12px;line-height:1.75;opacity:0.82">${d.typeData.desc}</div>
  </div>

  <!-- Barvni kartici -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
    ${[d.leadColor,d.sec].map((k,i)=>{const cd=CD[k];return `
      <div style="background:${CLR_L_PDF[k]};border:1px solid ${CLR_PDF[k]}33;border-radius:10px;padding:13px 15px">
        <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:${CLR_D_PDF[k]};margin-bottom:4px">${i===0?'Primarna':'Sekundarna'} energija</div>
        <div style="font-family:Georgia,serif;font-size:14px;font-weight:600;color:${CLR_D_PDF[k]};margin-bottom:7px">${cd.name}</div>
        <div style="font-size:11px;color:${CLR_D_PDF[k]};line-height:1.55;margin-bottom:3px"><strong>Se boji:</strong> ${cd.fears}</div>
        <div style="font-size:11px;color:${CLR_D_PDF[k]};line-height:1.55"><strong>Pod pritiskom:</strong> ${cd.pressure}</div>
      </div>`}).join('')}
  </div>

  <div class="footer"><span>${d.ime} · Barvni kompas</span><span>Barvni profil</span></div>
</div>

<!-- STRAN 4: ARHETIP + INDIVIDUACIJA -->
<div class="page">
  <div class="page-hdr">
    <div><div class="page-hdr-label">Barvni kompas · Jungianska perspektiva</div><div class="page-hdr-name">${d.ime}</div></div>
    <div class="page-hdr-right">Arhetip &amp; Individuacija</div>
  </div>

  <div class="h2" style="margin-top:0">Jungianski arhetip — ${d.typeData.sl}</div>
  <div style="border-left:3px solid ${mainColor};padding:12px 16px;background:#f9f7f4;border-radius:0 10px 10px 0;margin-bottom:11px">
    <div style="font-size:12px;color:#4a4a4a;line-height:1.8">${ARCHETYPE_DESC[d.typeName]||''}</div>
  </div>

  <div class="h2">Individuacija — razvojna priložnost za ${sk.ime1.rod}</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:9px">
    ${shadowCard(low.k,'Primarna senčna energija')}
    ${shadowCard(low2.k,'Sekundarna senčna energija')}
  </div>
  <div class="jung-body">${devDescs[low.k]}</div>

  <div class="h2">Konkretni koraki za razvoj</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
    ${devTips[low.k].map(tip=>`
      <div style="background:#f9f7f4;border-radius:8px;padding:10px 12px;border-left:3px solid ${CLR_PDF[low.k]}">
        <div style="font-size:11.5px;color:#4a4a4a;line-height:1.65">${tip}</div>
      </div>`).join('')}
  </div>

  <div style="background:linear-gradient(135deg,#1a2f4a 0%,#0a2a1a 100%);color:white;border-radius:11px;padding:11px 14px">
    <div style="font-family:Georgia,serif;font-size:13px;font-weight:600;margin-bottom:7px">Sporočilo za ${sk.ime1.rod}</div>
    <div style="font-size:11.5px;opacity:0.82;line-height:1.75">Vaš profil razkriva izjemno moč v ${highNames[high.k]}. Jung bi rekel: vaša pot do celovitosti ne zahteva zanikanja te moči — zahteva njeno dopolnitev. Ko začnete zavestno razvijati ${slNames[low.k]} energijo, ne postanete nekdo drug. Postanete bolj vi.</div>
  </div>

  <div class="footer"><span>${d.ime} · Barvni kompas</span><span>Jungianska perspektiva</span></div>
</div>

<!-- STRAN 5+: GENERIRANE SEKCIJE -->
${Object.keys(texts).length>0?`

${texts.stil||texts.inter||texts.odl||texts.pritisk?`
<div class="page">
  <div class="page-hdr">
    <div><div class="page-hdr-label">Osebnostni profil</div><div class="page-hdr-name">${d.ime}</div></div>
    <div class="page-hdr-right">Osebni stil &amp; Vedenje</div>
  </div>
  ${pdfSection('Osebni stil',texts.stil,mainColor)}
  ${pdfSection('Interakcija z drugimi',texts.inter,mainColor)}
  ${pdfSection('Sprejemanje odločitev',texts.odl,mainColor)}
  ${pdfSection('Vedenje pod pritiskom',texts.pritisk,'#c94030')}
  <div class="footer"><span>${d.ime} · Barvni kompas</span><span>Osebni stil</span></div>
</div>`:''}

${texts.pred||texts.slab?`
<div class="page">
  <div class="page-hdr">
    <div><div class="page-hdr-label">Osebnostni profil</div><div class="page-hdr-name">${d.ime}</div></div>
    <div class="page-hdr-right">Prednosti &amp; Slabosti</div>
  </div>
  ${pdfBoldSection('Ključne prednosti',texts.pred,'#2e8a55')}
  ${pdfBoldSection('Možne slabosti',texts.slab,'#c94030')}
  <div class="footer"><span>${d.ime} · Barvni kompas</span><span>Prednosti &amp; Slabosti</span></div>
</div>`:''}

${texts.tim||texts.okol||texts.motiv||texts.kom?`
<div class="page">
  <div class="page-hdr">
    <div><div class="page-hdr-label">Tim &amp; Okolje</div><div class="page-hdr-name">${d.ime}</div></div>
    <div class="page-hdr-right">Tim &amp; Motivacija</div>
  </div>
  ${pdfSection('Prispevek k timu',texts.tim,mainColor)}
  ${pdfSection('Idealno delovno okolje',texts.okol,mainColor)}
  ${pdfSection('Motivacija in strahovi',texts.motiv,mainColor)}
  ${pdfBoldSection('Komunikacijski nasveti',texts.kom,mainColor)}
  <div class="footer"><span>${d.ime} · Barvni kompas</span><span>Tim &amp; Okolje</span></div>
</div>`:''}

${texts.razv||texts.slepe||texts.naspr?`
<div class="page">
  <div class="page-hdr">
    <div><div class="page-hdr-label">Razvoj &amp; Odnosi</div><div class="page-hdr-name">${d.ime}</div></div>
    <div class="page-hdr-right">Razvoj</div>
  </div>
  ${pdfSection('Predlogi za razvoj',texts.razv,mainColor)}
  ${pdfSection('Slepe pege',texts.slepe,'#c49a10')}
  ${pdfSection('Nasprotni tip',texts.naspr,'#888')}
  <div class="footer"><span>${d.ime} · Barvni kompas</span><span>Razvoj &amp; Odnosi</span></div>
</div>`:''}

`:''}

<!-- PRODAJNI STRANI -->
${salesPhases.length>0?`
<div class="page">
  <div class="page-hdr">
    <div><div class="page-hdr-label">Prodajno poglavje</div><div class="page-hdr-name">${d.ime}</div></div>
    <div class="page-hdr-right">1/2</div>
  </div>

  <div style="background:${darkBg};color:white;border-radius:11px;padding:13px 16px;margin-bottom:9px;margin-top:4px">
    <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.08em;opacity:0.4;margin-bottom:5px">Prodajno poglavje · Barvni kompas</div>
    <div style="font-family:Georgia,serif;font-size:18px;font-weight:700;margin-bottom:3px">Prodajni profil — ${sk.ime1.or}</div>
    <div style="font-size:11px;opacity:0.6;margin-bottom:9px">Analiza na osnovi ${d.typeData.sl} profila</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px">
      ${salesPhases.map(p=>{
        const scoreKeys={pred:'B',potrebe:'G',predlog:'B',ugovori:'R',zvestoba:'G',sledenje:'R'}
        const sk=scoreKeys[p.id]||lc
        const score=d.con[sk]
        const level=score>=4.0?'Naravna prednost':score>=2.5?'Zavestno področje':'Področje razvoja'
        const lvlColor=score>=4.0?'#2e8a55':score>=2.5?'#c49a10':'#c94030'
        return `<div style="background:rgba(255,255,255,0.08);border-radius:8px;padding:8px 10px">
          <div style="font-size:10px;opacity:0.7;margin-bottom:2px">${p.icon} ${p.label.replace(/^\d\. /,'')}</div>
          <div style="font-size:10px;font-weight:600;color:${lvlColor}">${level}</div>
        </div>`
      }).join('')}
    </div>
  </div>

  ${texts.prod_uvod?pdfSection('Prodajni slog', texts.prod_uvod, mainColor):''}

  ${salesPhases.slice(0,3).map(p=>pdfSalesCard(p,lc,d.con)).join('')}

  <div class="footer"><span>${d.ime} · Barvni kompas</span><span>Prodajno poglavje 1/2</span></div>
</div>

<div class="page">
  <div class="page-hdr">
    <div><div class="page-hdr-label">Prodajno poglavje · nadaljevanje</div><div class="page-hdr-name">${d.ime}</div></div>
    <div class="page-hdr-right">2/2</div>
  </div>

  
  ${salesPhases.slice(3).map(p=>pdfSalesCard(p,lc,d.con)).join('')}

  <div style="margin-top:10px"></div>
  ${texts.prod_mocne?pdfBoldSection('Močne točke v prodaji', texts.prod_mocne, '#2e8a55'):''}
  <div style="margin-top:10px"></div>
  ${texts.prod_slepe?pdfBoldSection('Slepe pege v prodaji', texts.prod_slepe, '#c94030'):''}

  <!-- Prodajni indikatorji -->
  <div style="margin-top:24px">
    <div style="font-family:Georgia,serif;font-size:16px;font-weight:600;color:#1a1a1a;margin-bottom:10px">Pokazatelji prodajnih preferenc</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div>${pdfSalesIndicators(d.con, 0, 3)}</div>
      <div>${pdfSalesIndicators(d.con, 3, 6)}</div>
    </div>
  </div>

  <div style="margin-top:12px"></div>
  ${texts.prod_tip?pdfBoldSection('Prilagoditev tipu stranke', texts.prod_tip, mainColor):''}

  <div class="footer"><span>${d.ime} · Barvni kompas</span><span>Prodajno poglavje 2/2</span></div>
</div>
`:''}
</body></html>`
  }
}

// ─── ADMIN: MANUAL SUBMIT ────────────────────────────────────────────────────
app.post('/api/submit-manual', requireAdmin, (req, res) => {
  const { ime, email, podjetje, spol, con, uncon } = req.body
  if(!ime || !con) return res.status(400).json({error:'Manjkajoči podatki'})
  const data = loadDb()
  const id = Date.now()
  data.profiles.push({ id, ime, email:email||'', podjetje:podjetje||'', spol:spol||'m', answers:null, con, uncon, manual:true, texts:{}, sn:req.body.sn||'', delovno_mesto:req.body.delovno_mesto||'', mode:req.body.mode||'podjetje', pozicija:req.body.pozicija||'', sport:req.body.sport||'', created_at:new Date().toISOString() })
  saveDb(data)
  res.json({success:true, id})
})

// ─── PDF PREMIUM ENDPOINT ─────────────────────────────────────────────────────
app.post('/api/pdf-premium', async (req, res) => {
  const { chromium } = require('playwright')
  const fs = require('fs'), os = require('os'), path = require('path')
  const { profileData } = req.body
  try {
    const html = generatePdfPremiumHtml(profileData)
    const tmpDir = os.tmpdir(), ts = Date.now()
    const pdfPath = path.join(tmpDir, `premium-${ts}.pdf`)
    const browser = await chromium.launch()
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, margin: { top:'0mm', right:'0mm', bottom:'0mm', left:'0mm' } })
    await browser.close()
    const safeName = profileData.ime.replace(/ /g,'-').replace(/[čšžČŠŽ]/g, c => ({č:'c',š:'s',ž:'z',Č:'C',Š:'S',Ž:'Z'}[c]||c))
    const pdfBuf = fs.readFileSync(pdfPath)
    try { fs.unlinkSync(pdfPath) } catch(e) {}
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="insights-premium-${safeName}.pdf"`)
    res.send(pdfBuf)
  } catch(err) { console.error('PDF Premium error:', err); res.status(500).json({ error: err.message }) }
})

// ─── PDF PREMIUM GENERATOR ────────────────────────────────────────────────────
function generatePdfPremiumHtml(d) {
  const lc = d.leadColor
  const mc = {B:'#4a7ab5',R:'#c94030',G:'#2e8a55',Y:'#c49a10'}[lc]
  const CLR = {B:'#4a7ab5',R:'#c94030',G:'#2e8a55',Y:'#c49a10'}
  const CLR_L = {B:'#e8f0fa',R:'#faeaea',G:'#e6f5ee',Y:'#fdf6e3'}
  const CLR_D = {B:'#1a4a7a',R:'#a8291a',G:'#1a5c38',Y:'#8a6200'}
  const ime1 = d.ime.trim().split(' ')[0]
  const spol = d.spol || 'm'
  const sk = sklanjajFull(d.ime, spol)
  function sklanjaj(ime) {
    if(!ime) return ime
    const zadnji = ime.slice(-1).toLowerCase()
    const zadnji2 = ime.slice(-2).toLowerCase()
    const zadnji3 = ime.slice(-3).toLowerCase()
    const soglasniki = 'bcčdfghjklmnprsštvzž'
    if(spol === 'z' || spol === 'f') {
      // Ženski: Ana→Ane, Jana→Jane
      if(zadnji === 'a') return ime.slice(0,-1) + 'e'
      if(soglasniki.includes(zadnji)) return ime + 'e'
      return ime
    } else {
      // Moški — posebni vzorci najprej
      if(zadnji2 === 'ec') return ime.slice(0,-2) + 'cu'   // Zaznavec→Zaznavcu, Koordinatorec→Koordinatorcu
      if(zadnji2 === 'ač') return ime.slice(0,-2) + 'aču'  // Blokirač→Blokiraču (redko)
      if(zadnji2 === 'ar') return ime + 'ja'                // Gregor→Gregorja (redko)
      if(zadnji === 'a') return ime.slice(0,-1) + 'e'       // Luka→Luke
      if(soglasniki.includes(zadnji)) return ime + 'a'      // Janez→Janeza, Blaž→Blaža
      return ime
    }
  }
  const ime1rod = sklanjaj(ime1)  // rodilnik: "Kako voditi Janeza/Jane"

  function sklanjajMestnik(ime) {
    if(!ime) return ime
    const zadnji = ime.slice(-1).toLowerCase()
    const zadnji2 = ime.slice(-2).toLowerCase()
    const soglasniki = 'bcčdfghjklmnprsštvzž'
    if(spol === 'z' || spol === 'f') {
      // Ženski mestnik: Ana→Ani, Jana→Jani, Tina→Tini
      if(zadnji === 'a') return ime.slice(0,-1) + 'i'
      if(zadnji === 'i') return ime
      return ime + 'i'
    } else {
      // Moški mestnik
      if(zadnji2 === 'ec') return ime.slice(0,-2) + 'cu'  // Zaznavec→Zaznavcu
      if(zadnji === 'a') return ime.slice(0,-1) + 'i'      // Luka→Luki, Miha→Mihi
      if(soglasniki.includes(zadnji)) return ime + 'u'     // Blaž→Blažu, Janez→Janezu, Matej→Mateju
      return ime + 'u'
    }
  }
  const ime1mestnik = sklanjajMestnik(ime1)  // mestnik: "pri Blažu", "pri Ani" 
  const ime1daj = ime1  // dajalnik ostane enak za naslove
  const texts = d.texts || {}
  const salesPhases = d.salesPhases || []
  const date = new Date().toLocaleDateString('sl-SI', {day:'numeric',month:'long',year:'numeric'})

  function wheel(scores, size=180) {
    const cx=size/2,cy=size/2,R=size*0.43,inner=size*0.09
    const segs=[{k:'B',hex:'#4a7ab5',s:Math.PI,e:Math.PI*1.5},{k:'R',hex:'#c94030',s:Math.PI*1.5,e:Math.PI*2},{k:'Y',hex:'#c49a10',s:0,e:Math.PI*0.5},{k:'G',hex:'#2e8a55',s:Math.PI*0.5,e:Math.PI}]
    function pt(r,a){return [cx+r*Math.cos(a),cy+r*Math.sin(a)]}
    function arc(r1,r2,s,e){
      const steps=40,op=[],ip=[]
      for(let i=0;i<=steps;i++){const a=s+(e-s)*i/steps;op.push(pt(r2,a));ip.push(pt(r1,a))}
      return op.map((p,i)=>(i===0?'M'+p[0].toFixed(1)+','+p[1].toFixed(1):'L'+p[0].toFixed(1)+','+p[1].toFixed(1))).join(' ')+' '+ip.reverse().map((p,i)=>(i===0?'L'+p[0].toFixed(1)+','+p[1].toFixed(1):'L'+p[0].toFixed(1)+','+p[1].toFixed(1))).join(' ')+'Z'
    }
    const paths=segs.map(s=>{const sR=inner+(R-inner)*(Math.max(0.05,Math.min(6,scores[s.k]))/6);return `<path d="${arc(inner,sR,s.s,s.e)}" fill="${s.hex}" opacity="0.92" stroke="white" stroke-width="2"/>`}).join('')
    const mid=`<circle cx="${cx}" cy="${cy}" r="${inner+(R-inner)*0.5}" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="0.8" stroke-dasharray="3,4"/>`
    const outerC=`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="1"/>`
    const divs=`<line x1="${cx}" y1="${cy-R}" x2="${cx}" y2="${cy+R}" stroke="white" stroke-width="2.5"/><line x1="${cx-R}" y1="${cy}" x2="${cx+R}" y2="${cy}" stroke="white" stroke-width="2.5"/>`
    const centers=segs.map(s=>`<path d="${arc(0,inner-1,s.s,s.e)}" fill="${s.hex}"/>`).join('')
    const fs2=size*0.044
    const lbls=[{k:'B',x:cx-R+3,y:cy-R+fs2+1,a:'start'},{k:'R',x:cx+R-3,y:cy-R+fs2+1,a:'end'},{k:'Y',x:cx+R-3,y:cy+R-3,a:'end'},{k:'G',x:cx-R+3,y:cy+R-3,a:'start'}]
      .map(l=>`<text x="${l.x}" y="${l.y}" text-anchor="${l.a}" font-size="${fs2}" font-weight="700" font-family="system-ui" fill="${CLR[l.k]}">${l.k} ${scores[l.k].toFixed(1)}</text>`).join('')
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">${mid}${paths}${outerC}${divs}${centers}${lbls}</svg>`
  }

  function barChart(scores, title) {
    const order=['B','G','Y','R'],labels=['Blue','Green','Yellow','Red']
    const H=90,W=38,gap=10,tot=(W+gap)*4-gap+8
    const bars=order.map((k,i)=>{
      const sc=Math.max(0,Math.min(6,scores[k])),bh=Math.round((sc/6)*H),x=i*(W+gap)+4
      return `<rect x="${x}" y="${H-bh}" width="${W}" height="${bh}" fill="${CLR[k]}" rx="3"/>
        <text x="${x+W/2}" y="${H+10}" text-anchor="middle" font-size="7.5" fill="${CLR[k]}" font-weight="700" font-family="system-ui">${labels[i]}</text>
        <text x="${x+W/2}" y="${H+19}" text-anchor="middle" font-size="7.5" fill="#888" font-family="system-ui">${sc.toFixed(1)}</text>`
    }).join('')
    const midY=Math.round((3/6)*H)
    return `<div style="text-align:center;padding:8px 4px">
      <div style="font-size:9px;color:#aaa;margin-bottom:6px;font-style:italic">${title}</div>
      <svg width="${tot}" height="${H+24}" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="${H-midY}" x2="${tot}" y2="${H-midY}" stroke="#ddd" stroke-width="0.8" stroke-dasharray="3,3"/>
        ${bars}
      </svg>
    </div>`
  }

  function radarChart(scores, size=220) {
    const cx=size/2,cy=size/2,R=size*0.36
    const dims=[
      {label:'Analitičnost',val:scores.B},{label:'Odločnost',val:scores.R},
      {label:'Empatija',val:scores.G},{label:'Optimizem',val:scores.Y},
      {label:'Natančnost',val:Math.min(6,scores.B*0.8+scores.G*0.2)},
      {label:'Pogum',val:Math.min(6,scores.R*0.8+scores.Y*0.2)},
      {label:'Harmonija',val:Math.min(6,scores.G*0.8+scores.B*0.2)},
      {label:'Ustvarjalnost',val:Math.min(6,scores.Y*0.8+scores.R*0.2)},
    ]
    const dimColors=['#4a7ab5','#c94030','#2e8a55','#c49a10','#4a7ab5','#c94030','#2e8a55','#c49a10']
    const n=dims.length
    function ptA(i,r){const a=(i/n)*2*Math.PI-Math.PI/2;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]}
    const grid=[1,2,3,4,5,6].map(v=>{const r=(v/6)*R,pts=Array.from({length:n},(_,i)=>ptA(i,r));return `<path d="${pts.map((p,i)=>(i===0?'M':'L')+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}Z" fill="none" stroke="#e8e4df" stroke-width="${v===3?'0.8':'0.4'}"/>`}).join('')
    const axes=dims.map((_,i)=>{const [x,y]=ptA(i,R);return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#e8e4df" stroke-width="0.6"/>`}).join('')
    const dataPts=dims.map((dim,i)=>ptA(i,(Math.min(dim.val,6)/6)*R))
    const dataPath=dataPts.map((p,i)=>(i===0?'M':'L')+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')+'Z'
    const dots=dataPts.map((p,i)=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="${dimColors[i]}" stroke="white" stroke-width="1.5"/>`).join('')
    const pad=32
    const lbls=dims.map((dim,i)=>{const [x,y]=ptA(i,R+18);const anchor=x<cx-3?'end':x>cx+3?'start':'middle';return `<text x="${x.toFixed(1)}" y="${(y+3).toFixed(1)}" text-anchor="${anchor}" font-size="7.5" fill="#888" font-family="system-ui">${dim.label}</text>`}).join('')
    return `<svg width="${size+pad*2}" height="${size+pad*2}" viewBox="${-pad} ${-pad} ${size+pad*2} ${size+pad*2}" xmlns="http://www.w3.org/2000/svg">${grid}${axes}<path d="${dataPath}" fill="${mc}18" stroke="${mc}" stroke-width="1.5" opacity="0.85"/>${dots}${lbls}</svg>`
  }

  function flowChart(flow, total) {
    const order=['B','G','Y','R'],H=60,W=38,gap=10,MAX=3
    const bars=order.map((k,i)=>{const val=flow[k]||0,pct=Math.min(Math.abs(val)/MAX,1),bh=Math.round(pct*(H/2-3)),x=i*(W+gap)+4;return val>=0?`<rect x="${x}" y="${H/2-bh}" width="${W}" height="${bh}" fill="${CLR[k]}" rx="2" opacity="0.85"/>`:`<rect x="${x}" y="${H/2}" width="${W}" height="${bh}" fill="${CLR[k]}" rx="2" opacity="0.4"/>`}).join('')
    const tot=(W+gap)*4-gap+8
    return `<svg width="${tot}" height="${H+10}" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="${H/2}" x2="${tot}" y2="${H/2}" stroke="#ccc" stroke-width="1"/>${bars}<text x="${tot/2}" y="${H+9}" text-anchor="middle" font-size="9" font-weight="700" fill="#333" font-family="system-ui">${total}%</text></svg>`
  }

  function parseBold(txt) {
    if(!txt) return []
    const clean = s => s.replace(/\*/g,'').trim()
    const items=[]
    for(const line of txt.split('\n').filter(l=>l.trim())) {
      const t=line.replace(/^[•\-\d\.]+\s*/,'').trim()
      if(!t) continue
      const m1=t.match(/^\*\*(.+?)\*\*\s*[-–:]?\s*(.*)$/)
      if(m1){items.push({title:clean(m1[1]),desc:clean(m1[2])});continue}
      const m2=t.match(/^(.+?)\*\*\s*[-–:]?\s*(.*)$/)
      if(m2){items.push({title:clean(m2[1]),desc:clean(m2[2])});continue}
      const m3=t.match(/^(.+?)\s+[-–]\s+(.+)$/)
      if(m3&&m3[1].length<60){items.push({title:clean(m3[1]),desc:clean(m3[2])});continue}
      items.push({title:'',desc:clean(t)})
    }
    return items.filter(i=>i.title||i.desc)
  }

  function hdr(label, right='') {
    return `<div style="margin-bottom:18px">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:8px">
        <div>
          <div style="font-size:7px;text-transform:uppercase;letter-spacing:0.1em;color:#bbb;margin-bottom:3px">Barvni kompas · ${label}</div>
          <div style="font-size:14px;font-weight:700;color:#1a1a1a;letter-spacing:-0.01em">${d.ime}</div>
        </div>
        <div style="font-size:9px;color:#bbb;font-weight:500">${right}</div>
      </div>
      <div style="height:2px;background:linear-gradient(to right,${mc},${mc}44,transparent)"></div>
    </div>`
  }

  function ftr(right) {
    return `<div style="position:absolute;bottom:8mm;left:14mm;right:14mm;display:flex;justify-content:space-between;font-size:7.5px;color:#ccc;border-top:0.5px solid #ede9e3;padding-top:4px"><span>${d.ime} · Barvni kompas</span><span>${right}</span></div>`
  }

  function section(title, text) {
    if(!text) return ''
    return `<div style="margin-bottom:20px;break-inside:avoid">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <div style="width:3px;height:20px;background:${mc};border-radius:2px;flex-shrink:0"></div>
        <div style="font-size:14px;font-weight:700;color:#1a1a1a;letter-spacing:-0.01em">${title}</div>
      </div>
      <div style="font-size:11px;color:#4a4a4a;line-height:1.9;padding-left:13px;border-left:1px solid #f0ece4">${text}</div>
    </div>`
  }

  function boldSection(title, text, color) {
    if(!text) return ''
    const items=parseBold(text)
    if(!items.length) return ''
    const c=color||mc
    return `<div style="display:flex;margin-bottom:13px;break-inside:avoid">
      <div style="width:2.5px;background:${c};border-radius:2px;flex-shrink:0;margin-right:11px"></div>
      <div style="flex:1">
        <div style="font-size:14px;font-weight:700;color:#1a1a1a;margin-bottom:10px;letter-spacing:-0.01em">${title}</div>
        ${items.map((item,i)=>`<div style="padding:6px 0;${i<items.length-1?'border-bottom:0.5px solid #f0ece4':''}">
          ${item.title?`<div style="font-size:11.5px;font-weight:700;color:#1a1a1a;margin-bottom:2px">${item.title}</div>`:''}
          ${item.desc?`<div style="font-size:10.5px;color:#5a5a5a;line-height:1.65">${item.desc}</div>`:''}
        </div>`).join('')}
      </div>
    </div>`
  }

  function contentPage(label, right, cnt) {
    return `<div style="width:210mm;min-height:297mm;padding:10mm 14mm 18mm;position:relative;break-after:page;background:#fafaf8">${hdr(label,right)}${cnt}${ftr(right)}</div>`
  }

  const CD={B:{name:'Analitična modra',fears:'Iracionalnost, nepopolnost, zmeda',pressure:'Zapre se vase, postane pretirano kritičen'},R:{name:'Aktivna rdeča',fears:'Izguba nadzora, neučinkovitost',pressure:'Postane direktiven, diktatorski, nestrpen'},G:{name:'Stabilna zelena',fears:'Konflikt, spremembe brez razloga',pressure:'Se umakne, postane pasivno-agresiven'},Y:{name:'Navdušena rumena',fears:'Zavrnitev, ignoriranje, rutina',pressure:'Dramatizira, postane kaotičen'}}
  const ARCHETYPE_DESC={Observer:'Opazovalec ustreza Jungovemu introvertnemu mislecu — energijo usmerja navznoter, svet razume skozi analizo in iskanje objektivne resnice. Psihična funkcija: mišljenje, usmeritev: introvertna.',Reformer:'Reformator združuje introvertno mišljenje z odločnostjo — Jungov strateški mislec, ki analizira globoko in hkrati pogumno uvaja spremembe.',Director:'Direktor je Jungov ekstravertni mislec — usmerjen navzven, k rezultatom in akciji.',Motivator:'Motivator združuje ekstravertno mišljenje z intuicijo — Jungov vizionarski vodja, ki dosega cilje in navdihuje.',Inspirer:'Inspirator je Jungov ekstravertni intuitivec — energijo izraža skozi ustvarjalnost, optimizem in širjenje možnosti.',Helper:'Pomočnik združuje ekstravertnost z čustvovanjem — Jungov socialni mediator, ki energijo vlaga v izgradnjo mostov med ljudmi.',Supporter:'Podpornik je Jungov introvertni čustveni tip — globok, zvest, empatičen. Moč leži v zanesljivosti, lojalnosti in globoki osebni integriteti.',Coordinator:'Koordinator združuje introvertno čustvovanje s sistematičnostjo — skrbni organizator, ki varuje harmonijo skupnosti in skrbi za red.'}
  const sorted=['B','R','G','Y'].map(k=>({k,v:d.con[k]})).sort((a,b)=>a.v-b.v)
  const low=sorted[0],low2=sorted[1],high=sorted[3]
  const names={B:'Analitična modra',R:'Aktivna rdeča',G:'Stabilna zelena',Y:'Navdušena rumena'}
  const slNames={B:'modro',R:'rdečo',G:'zeleno',Y:'rumeno'}
  const highNames={B:'analitičnem mišljenju in sistematičnosti',R:'odločnosti in usmerjenosti v rezultate',G:'empatiji in gradnji dolgoročnih odnosov',Y:'ustvarjalnosti in navduševanju'}
  const devDescs={B:`Razvijanje analitičnega mišljenja in natančnosti odpira dostop do globlje intelektualne moči. Za ${sk.ime1.rod} to pomeni vlaganje časa v poglobljeno analizo pred odločitvami.`,R:`Krepitev odločnosti in poguma pri soočanju s konflikti odpira dostop do vodstvene moči. Za ${sk.ime1.rod} to pomeni zavestno vadbo neposredne komunikacije.`,G:`Negovanje empatije in potrpežljivosti odpira dostop do globine medčloveških odnosov. Za ${sk.ime1.rod} to pomeni zavestno upočasnitev in aktivno poslušanje.`,Y:`Razvijanje ustvarjalnosti in odprtosti za nove ideje odpira dostop do inovativnega potenciala. Za ${sk.ime1.rod} to pomeni iskanje novih perspektiv.`}
  const devTips={B:['Vzemi si čas za temeljito analizo pred odločitvami','Strukturiraj misli pisno — dnevnik razmislekov','Postavljaj vprašanja "zakaj" preden preidete k akciji','Poišči mentorja z visoko analitično energijo'],R:['Vadite direktno komunikacijo — jasno in spoštljivo','Prevzemi vodstvo pri naslednjem skupinskem projektu','Postavi si jasne cilje z merljivimi rezultati','Soočaj se z izzivi namesto da jih odlašaš'],G:['Posveti polno pozornost sogovorniku brez prekinitev','Vzdržuj redne stike s ključnimi odnosi','Vadite potrpežljivost — ne hitite z rešitvami','Zgradite rutino za redne osebne pogovore s kolegi'],Y:['Dovoli si brainstorming brez kritike','Poišči navdih v novih okoljih in pogovorih','Organiziraj kreativne neformalne pogovore v timu','Vadite optimizem — vsak izziv ima priložnost']}

  const coverPage=`<div style="width:210mm;height:297mm;background:#fafaf8;display:flex;flex-direction:column;overflow:hidden;break-after:page">
    <div style="display:flex;height:5px;flex-shrink:0"><div style="flex:1;background:#4a7ab5"></div><div style="flex:1;background:#c94030"></div><div style="flex:1;background:#c49a10"></div><div style="flex:1;background:#2e8a55"></div></div>
    <div style="padding:44px 52px 0;flex-shrink:0">
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:40px">
        <div style="width:28px;height:28px;border-radius:50%;background:conic-gradient(#4a7ab5 0deg 90deg,#c94030 90deg 180deg,#c49a10 180deg 270deg,#2e8a55 270deg 360deg);flex-shrink:0"></div>
        <div style="font-size:8.5px;letter-spacing:0.12em;text-transform:uppercase;color:#bbb">Barvni kompas</div>
      </div>
      <div style="font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:${mc};margin-bottom:16px;font-weight:700">Osebnostni profil</div>
      <div style="font-size:58px;font-weight:800;color:#1a1a1a;line-height:0.95;margin-bottom:18px;letter-spacing:-0.03em">${d.ime}</div>
      <div style="display:flex;align-items:center;gap:10px">
        <div style="font-size:11px;color:#bbb">${date}</div>
        <div style="width:4px;height:4px;border-radius:50%;background:#e5e0d8"></div>
        <div style="font-size:11px;color:${mc};font-weight:600">${d.typeData.sl}</div>
      </div>
    </div>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;position:relative">
      <div style="position:absolute;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,#f0f0ee 0%,transparent 70%);opacity:0.6"></div>
      ${wheel(d.con,330)}
    </div>
    <div style="padding:0 52px 48px;flex-shrink:0">
      <div style="height:1px;background:linear-gradient(to right,#e5e0d8,transparent);margin-bottom:20px"></div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end">
        <div>
          <div style="font-size:7px;text-transform:uppercase;letter-spacing:0.1em;color:#ccc;margin-bottom:6px">Osebnostni tip</div>
          <div style="font-size:22px;font-weight:700;color:#1a1a1a;letter-spacing:-0.02em">${d.typeData.sl}</div>
          <div style="font-size:10px;color:${mc};margin-top:4px;font-weight:500">${d.variant}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
          <div style="display:flex;gap:4px">
            ${['B','R','Y','G'].map(k=>`<div style="width:28px;height:28px;border-radius:50%;background:${{B:'#e8f0fa',R:'#faeaea',Y:'#fdf6e3',G:'#e6f5ee'}[k]};border:2px solid ${{B:'#4a7ab5',R:'#c94030',Y:'#c49a10',G:'#2e8a55'}[k]};display:flex;align-items:center;justify-content:center"><span style="font-size:9px;font-weight:700;color:${{B:'#4a7ab5',R:'#c94030',Y:'#c49a10',G:'#2e8a55'}[k]}">${d.con[k].toFixed(1)}</span></div>`).join('')}
          </div>
        </div>
      </div>
    </div>
    <div style="display:flex;height:3px;flex-shrink:0"><div style="flex:1;background:#4a7ab5"></div><div style="flex:1;background:#c94030"></div><div style="flex:1;background:#c49a10"></div><div style="flex:1;background:#2e8a55"></div></div>
  </div>`

  // Kazalo poglavij
  const tocPage=`<div style="width:210mm;min-height:297mm;padding:0;position:relative;break-after:page;background:#fafaf8;display:flex;flex-direction:column;overflow:hidden">
    <div style="display:flex;height:4px;flex-shrink:0">
      <div style="flex:1;background:#4a7ab5"></div><div style="flex:1;background:#c94030"></div>
      <div style="flex:1;background:#c49a10"></div><div style="flex:1;background:#2e8a55"></div>
    </div>
    <div style="padding:14mm 14mm 0;flex:1">
      <div style="font-size:7px;text-transform:uppercase;letter-spacing:0.1em;color:#bbb;margin-bottom:6px">Barvni kompas · Osebnostni profil</div>
      <div style="font-size:26px;font-weight:800;color:#1a1a1a;letter-spacing:-0.02em;margin-bottom:4px">${d.ime}</div>
      <div style="font-size:11px;color:${mc};font-weight:600;margin-bottom:20px">${d.typeData.sl} · ${d.variant}</div>
      <div style="height:1px;background:linear-gradient(to right,#e5e0d8,transparent);margin-bottom:20px"></div>

      <div style="font-size:12px;color:#4a4a4a;line-height:1.85;margin-bottom:24px;max-width:440px">
        Ta profil je nastal na podlagi Jungove tipologije in Barvni kompas metodologije. Pred vami je celovita analiza osebnostnega sloga, vedenjskih vzorcev in razvojnih priložnosti — pripravljena kot orodje za globlje razumevanje sebe in učinkovitejše sodelovanje z drugimi.
      </div>

      <div style="font-size:9px;font-weight:600;color:#bbb;margin-bottom:14px">Vsebina poročila</div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
        ${[
          {num:'01', title:'Teoretično ozadje', desc:'Jungova tipologija, štiri barvne energije, zavedna in nezavedna persona', color:'#1a1a1a'},
          {num:'02', title:'Barvni profil & Arhetip', desc:'Grafični prikaz profila, osebnostni tip, jungianski arhetip in individuacija', color:'#1a1a1a'},
          {num:'03', title:'Osebni stil & Vedenje', desc:'Delovni slog, interakcija z drugimi, odločanje in vedenje pod pritiskom', color:mc},
          {num:'04', title:'Prednosti & Slabosti', desc:'Ključne prednosti ki jih prinaša, možne slabosti in slepe pege', color:mc},
          {num:'05', title:'Osebnostni radar', desc:'Vizualni prikaz osmih dimenzij osebnosti z percentilnim položajem', color:mc},
          {num:'06', title:'Tim & Motivacija', desc:'Prispevek k timu, idealno okolje, motivatorji in komunikacijski nasveti', color:'#2e8a55'},
          {num:'07', title:'Razvoj & Odnosi', desc:'Razvojne priložnosti, slepe pege in nasprotni tip', color:'#2e8a55'},
          {num:'08', title:'Vodenje & Motivacija', desc:'Napotki za vodjo, motivacijski profil in intervju vprašanja', color:'#2e8a55'},
          {num:'09', title:'Stres & Regeneracija', desc:'Opozorilni znaki stresa, regeneracijske strategije in napotki za vodjo', color:'#c94030'},
          {num:'10', title:'Prodajno poglavje', desc:'Prodajni profil, prednosti in izzivi skozi 6 faz prodajnega procesa', color:'#c49a10'},
          {num:'11', title:'Akcijski plan & Indikatorji', desc:'Top 5 akcijskih korakov, prodajne preference in prilagoditev tipu stranke', color:'#c49a10'},
        ].map((item,i)=>`<div style="display:flex;align-items:flex-start;gap:12px;padding:10px 14px;border-bottom:0.5px solid #f0ece4;${i%2===0?'border-right:0.5px solid #f0ece4':''}">
          <div style="font-size:18px;font-weight:800;color:${item.color};opacity:0.15;flex-shrink:0;line-height:1;margin-top:2px">${item.num}</div>
          <div style="flex:1">
            <div style="font-size:11px;font-weight:700;color:#1a1a1a;margin-bottom:3px">${item.title}</div>
            <div style="font-size:9px;color:#888;line-height:1.5">${item.desc}</div>
          </div>
          <div style="width:3px;height:100%;background:${item.color};border-radius:2px;flex-shrink:0;align-self:stretch;opacity:0.4"></div>
        </div>`).join('')}
      </div>

      <div style="margin-top:20px;padding:12px 16px;background:white;border:1px solid #e8e4df;border-radius:10px;display:flex;align-items:center;gap:12px">
        <div style="width:32px;height:32px;border-radius:50%;background:conic-gradient(#4a7ab5 0deg 90deg,#c94030 90deg 180deg,#c49a10 180deg 270deg,#2e8a55 270deg 360deg);flex-shrink:0"></div>
        <div>
          <div style="font-size:9px;font-weight:700;color:#1a1a1a;margin-bottom:2px">Kako uporabljati ta profil</div>
          <div style="font-size:9px;color:#888;line-height:1.5">Profil je orodje za razvoj — ne oznaka. Vsaka izjava je priporočilo za razmislek, ne absolutna resnica. Preverite ugotovitve s sodelavci in jih vključite v razgovor o razvoju.</div>
        </div>
      </div>
    </div>
    <div style="display:flex;height:3px;flex-shrink:0;margin-top:14px">
      <div style="flex:1;background:#4a7ab5"></div><div style="flex:1;background:#c94030"></div>
      <div style="flex:1;background:#c49a10"></div><div style="flex:1;background:#2e8a55"></div>
    </div>
  </div>`

  const jungPage=`<div style="width:210mm;min-height:297mm;padding:10mm 14mm 18mm;position:relative;break-after:page;background:#fafaf8">
    ${hdr('Teoretično ozadje','Carl Gustav Jung')}
    <div style="border-left:3px solid #1a1a1a;padding:10px 14px;background:#f2efe9;border-radius:0 8px 8px 0;margin-bottom:8px">
      <div style="font-size:12px;font-style:italic;color:#1a1a1a;line-height:1.7;margin-bottom:4px">"Dokler ne naredimo nezavednega zavednega, bo usmerjalo naše življenje — in mi mu bomo rekli usoda."</div>
      <div style="font-size:8px;color:#aaa">— Carl Gustav Jung (1875–1961)</div>
    </div>
    <div style="border-left:3px solid #4a7ab5;padding:9px 13px;background:#f0f4ff;border-radius:0 8px 8px 0;margin-bottom:10px">
      <div style="font-size:11px;font-style:italic;color:#1a4a7a;line-height:1.7;margin-bottom:3px">"Poznavanje lastnih tem je najboljši dar, ki si ga lahko podarimo sebi in drugim."</div>
      <div style="font-size:8px;color:#7a9ab5">— C. G. Jung, Psihološki tipi (1921)</div>
    </div>
    <div style="font-size:12px;font-weight:700;color:#1a1a1a;margin:10px 0 5px;padding-bottom:4px;border-bottom:1px solid #e8e4df">Jungianska osnova osebnostne tipologije</div>
    <div style="font-size:11px;color:#4a4a4a;line-height:1.8;margin-bottom:9px">Carl Gustav Jung je v delu <em>Psihološki tipi</em> (1921) identificiral ključne dimenzije človeške osebnosti. Barvni kompas metodologija gradi neposredno na teh temeljih in jih prevaja v praktičen model štirih barvnih energij.</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:9px">
      ${[['⬅ Introvertnost / Ekstravertnost ➡','<strong>Introverti</strong> (modra, zelena) črpajo energijo iz notranjega sveta. <strong>Ekstravertni</strong> (rdeča, rumena) jo pridobivajo iz zunanjega sveta.'],['🧠 Štiri psihološke funkcije','<strong>Mišljenje</strong> (logika), <strong>Čustvovanje</strong> (vrednote), <strong>Zaznavanje</strong> (fakti) in <strong>Intuicija</strong> (vzorci). Vsaka barva odraža kombinacijo teh funkcij.']].map(([t,b])=>`<div style="border:1px solid #e8e4df;border-radius:8px;padding:9px 11px;background:white"><div style="font-size:10.5px;font-weight:700;color:#1a1a1a;margin-bottom:4px">${t}</div><div style="font-size:10px;color:#6b6460;line-height:1.65">${b}</div></div>`).join('')}
    </div>
    <div style="font-size:12px;font-weight:700;color:#1a1a1a;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #e8e4df">Štiri barvne energije</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:9px">
      ${[['B','Analitična modra','Introvert · Mišljenje','Analiza, natančnost, sistematičnost'],['R','Aktivna rdeča','Ekstravert · Mišljenje','Odločnost, pogum, rezultati'],['Y','Navdušena rumena','Ekstravert · Intuicija','Ustvarjalnost, optimizem, vizija'],['G','Stabilna zelena','Introvert · Čustvovanje','Empatija, harmonija, vrednote']].map(([k,n,f,desc])=>`<div style="background:${CLR_L[k]};border:1px solid ${CLR[k]}33;border-radius:8px;padding:9px 11px"><div style="font-size:8.5px;font-weight:800;text-transform:uppercase;color:${CLR_D[k]};margin-bottom:2px">${n}</div><div style="font-size:8.5px;font-weight:600;color:${CLR_D[k]};margin-bottom:4px">${f}</div><div style="font-size:8.5px;color:${CLR_D[k]};line-height:1.55;opacity:0.85">${desc}</div></div>`).join('')}
    </div>
    <div style="font-size:12px;font-weight:700;color:#1a1a1a;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #e8e4df">Zavedna in nezavedna persona</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:9px">
      ${[['Zavedna persona','Delovni jaz','Odraža, kako se posameznik prilagaja zahtevam delovnega okolja. Vedenjski vzorci razviti kot odgovor na pričakovanja okolice.'],['Nezavedna persona','Temeljni jaz','Globlje, naravne osebnostne preference. Izračuna se kot zrcalna vrednost zavedne persone. Visoka razlika nakazuje prilagajanje ali stres.']].map(([label,title,body])=>`<div style="border:1px solid #e8e4df;border-radius:8px;padding:10px 12px;background:white"><div style="font-size:7.5px;text-transform:uppercase;letter-spacing:0.1em;color:#aaa;margin-bottom:3px">${label}</div><div style="font-size:12px;font-weight:700;color:#1a1a1a;margin-bottom:5px">${title}</div><div style="font-size:10px;color:#6b6460;line-height:1.65">${body}</div></div>`).join('')}
    </div>
    <div style="background:#1f2933;color:white;border-radius:9px;padding:11px 14px;margin-bottom:10px">
      <div style="font-size:11px;font-weight:700;margin-bottom:5px">Individuacija — vseživljenjski proces</div>
      <div style="font-size:10px;opacity:0.78;line-height:1.8">Jung je proces psihološkega zorenja poimenoval individuacija — postopno integriranje vseh delov osebnosti v celostno, avtentično sebstvo. V kontekstu Barvni kompas to pomeni razvijanje nižjih barvnih energij — ne z zanikanjem naravnih prednosti, temveč z njihovo dopolnitvijo.</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
      <div style="border:1px solid #e8e4df;border-radius:8px;padding:10px 13px;background:white">
        <div style="font-size:9px;font-weight:700;color:#1a1a1a;margin-bottom:5px">🔍 Zakaj je samopoznavanje ključno?</div>
        <div style="font-size:9.5px;color:#6b6460;line-height:1.65">Raziskave v organizacijski psihologiji kažejo, da posamezniki z visokim samopoznavanjem sprejemajo boljše odločitve, gradijo trdnejše odnose in se učinkoviteje spopadajo s stresom. Barvni kompas je orodje ki to samopoznavanje sistematizira.</div>
      </div>
      <div style="border:1px solid #e8e4df;border-radius:8px;padding:10px 13px;background:white">
        <div style="font-size:9px;font-weight:700;color:#1a1a1a;margin-bottom:5px">🔄 Profil se razvija</div>
        <div style="font-size:9.5px;color:#6b6460;line-height:1.65">Barvni kompas profil ni statičen — odraža trenutno stanje in kontekst v katerem živite in delate. Jungianska individuacija je vseživljenjski proces. Profil je priporočljivo preveriti vsakih 2-3 leta ali ob večjih življenjskih spremembah.</div>
      </div>
    </div>
    <div style="border-left:3px solid #4a7ab5;padding:9px 13px;background:#f0f4ff;border-radius:0 8px 8px 0">
      <div style="font-size:9.5px;font-style:italic;color:#1a4a7a;line-height:1.7">"Srečanje dveh osebnosti je kot stik dveh kemičnih substanc: če pride do reakcije, se obe spremenita."</div>
      <div style="font-size:8px;color:#7a9ab5;margin-top:3px">— C. G. Jung, Modern Man in Search of a Soul (1933)</div>
    </div>
    ${ftr('Teoretično ozadje')}
  </div>`

  // Stran 3+4 združeni: barvni profil + arhetip na ENO STRAN
  const profileAndArchPage=`<div style="width:210mm;min-height:297mm;padding:10mm 14mm 18mm;position:relative;break-after:page;background:#fafaf8">
    ${hdr('Osebni profil','Barvni profil & Arhetip')}
    <div style="display:grid;grid-template-columns:1fr 160px 1fr;gap:9px;margin-bottom:7px;align-items:start">
      <div style="background:white;border:1px solid #e8e4df;border-radius:9px;padding:7px">${barChart(d.con,'Persona (Zavedna)')}</div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
        ${wheel(d.con,160)}
        <div style="text-align:center">
          <div style="font-size:7px;color:#aaa">Pozicija ${d.typeData.num}</div>
          <div style="font-size:11px;font-weight:700;color:#1a1a1a">${d.typeData.sl}</div>
          <div style="font-size:7.5px;color:#aaa">${d.variant}</div>
        </div>
      </div>
      <div style="background:white;border:1px solid #e8e4df;border-radius:9px;padding:7px">${barChart(d.uncon,'Persona (Nezavedna)')}</div>
    </div>
    <div style="background:white;border:1px solid #e8e4df;border-radius:9px;padding:9px 11px;margin-bottom:7px">
      <div style="display:flex;align-items:center;gap:14px">
        <div style="flex-shrink:0;text-align:center">
          <div style="font-size:7.5px;color:#aaa;font-style:italic;margin-bottom:4px">Preference Tok</div>
          ${flowChart(d.flow,d.total)}
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:7px;text-transform:uppercase;letter-spacing:0.08em;color:#aaa;margin-bottom:2px">Preference Tok · ${d.total}%</div>
          <div style="font-size:12px;font-weight:700;color:#1a1a1a;margin-bottom:4px">Prilagajanje vedenja</div>
          <div style="font-size:10px;color:#6b6460;line-height:1.7">Razlika med <strong>zavedno</strong> in <strong>nezavedno persono</strong>. ${d.total>40?'Visok % — visoka motiviranost ali povečan stres.':d.total<10?'Nizek % — dela po naravni poti.':'Zmeren % — uravnoteženo prilagajanje vlogi.'}</div>
        </div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:7px">
      <div style="background:#1f2933;color:white;border-radius:9px;padding:9px 12px">
        <div style="font-size:6.5px;text-transform:uppercase;letter-spacing:0.09em;opacity:0.3;margin-bottom:3px">Osebnostni tip</div>
        <div style="font-size:16px;font-weight:800;margin-bottom:2px">${d.typeData.sl}</div>
        <div style="font-size:8.5px;opacity:0.35;margin-bottom:6px">Pozicija ${d.typeData.num} · ${d.variant}</div>
        <div style="font-size:9.5px;opacity:0.78;line-height:1.65">${d.typeData.desc}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${[d.leadColor,d.sec].map((k,i)=>`<div style="background:${CLR_L[k]};border:1px solid ${CLR[k]}22;border-radius:8px;padding:8px 11px;flex:1"><div style="font-size:6.5px;font-weight:800;text-transform:uppercase;color:${CLR_D[k]};margin-bottom:2px">${i===0?'Primarna':'Sekundarna'} energija</div><div style="font-size:12px;font-weight:700;color:${CLR_D[k]};margin-bottom:4px">${CD[k].name}</div><div style="font-size:9px;color:${CLR_D[k]};line-height:1.5"><strong>Se boji:</strong> ${CD[k].fears}</div><div style="font-size:9px;color:${CLR_D[k]};line-height:1.5"><strong>Pod pritiskom:</strong> ${CD[k].pressure}</div></div>`).join('')}
      </div>
    </div>
    <div style="font-size:11.5px;font-weight:700;color:#1a1a1a;margin-bottom:5px;padding-bottom:3px;border-bottom:1px solid #e8e4df">Jungianski arhetip — ${d.typeData.sl}</div>
    <div style="border-left:3px solid ${mc};padding:7px 11px;background:white;border:1px solid #e8e4df;border-left:3px solid ${mc};border-radius:0 7px 7px 0;margin-bottom:7px">
      <div style="font-size:10px;color:#4a4a4a;line-height:1.75">${ARCHETYPE_DESC[d.typeName]||''}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px">
      ${[{k:low.k,label:'Primarna senčna energija'},{k:low2.k,label:'Sekundarna senčna energija'}].map(s=>`<div style="background:${CLR_L[s.k]};border:1px solid ${CLR[s.k]}33;border-radius:7px;padding:8px 10px"><div style="font-size:6.5px;font-weight:800;text-transform:uppercase;color:${CLR_D[s.k]};margin-bottom:2px">${s.label}</div><div style="font-size:12px;font-weight:700;color:${CLR_D[s.k]};margin-bottom:2px">${names[s.k]}</div><div style="font-size:9px;color:${CLR_D[s.k]};opacity:0.8">Vrednost: ${d.con[s.k].toFixed(2)}/6</div></div>`).join('')}
    </div>
    <div style="background:linear-gradient(135deg,#243140 0%,#1a2b22 100%);color:white;border-radius:8px;padding:9px 12px;margin-bottom:7px">
      <div style="font-size:10px;font-weight:700;margin-bottom:4px">Sporočilo za ${ime1rod}</div>
      <div style="font-size:9.5px;opacity:0.82;line-height:1.75">Vaš profil razkriva izjemno moč v ${highNames[high.k]}. Ko začnete zavestno razvijati ${slNames[low.k]} energijo, ne postanete nekdo drug — postanete bolj vi.</div>
    </div>
    <div style="background:white;border:1px solid #e8e4df;border-radius:8px;padding:10px 13px">
      <div style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#aaa;margin-bottom:8px">Kaj to pomeni v praksi</div>
      ${[
        {B:['Pred vsakim sestankom si pripravi strukturirano agendo z jasnimi točkami','Ko analiziraš podatke, si nastavi časovni okvir — prepreči pretirano analizo','Svoja dognanja deli pisno — kolegi te bodo bolje razumeli'],
         R:['V pogajanjih prevzemi pobudo — predlagaj prve','Ko cilj ni dosežen, takoj analiziraj vzrok in prilagodi taktiko','Delegiraj podrobnosti — osredotoči se na strateške odločitve'],
         G:['Rezerviraj čas za individualne pogovore s ključnimi sodelavci','Ko zaznaš napetost v timu, jo naslovaj neposredno — ne čakaj','Gradi zaupanje z doslednostjo — stori kar obljubiš'],
         Y:['Organiziraj tedenske brainstorming seje za generiranje idej','Poveži se z novimi ljudmi — navdih prihaja iz raznolikih pogovorov','Dokumentiraj ideje takoj — spontanost je tvoja prednost']}
      ][0][high.k].map(tip=>`<div style="display:flex;align-items:flex-start;gap:8px;padding:4px 0;border-bottom:0.5px solid #f0ece4;last-child:border-none">
        <div style="width:5px;height:5px;border-radius:50%;background:${CLR[high.k]};flex-shrink:0;margin-top:5px"></div>
        <div style="font-size:10px;color:#4a4a4a;line-height:1.65">${tip}</div>
      </div>`).join('')}
    </div>
    ${ftr('Barvni profil & Arhetip')}
  </div>`

  const stilPage=(texts.stil||texts.inter||texts.odl||texts.pritisk)?contentPage('Osebnostni profil','Osebni stil & Vedenje',
    section('Osebni stil',texts.stil)+section('Interakcija z drugimi',texts.inter)+
    section('Sprejemanje odločitev',texts.odl)+section('Vedenje pod pritiskom',texts.pritisk)):''

  // Prednosti + Slabosti — cela stran, radar na svoji strani
  const predPage=(texts.pred||texts.slab)?`<div style="width:210mm;min-height:297mm;padding:10mm 14mm 18mm;position:relative;break-after:page;background:#fafaf8">
    ${hdr('Osebnostni profil','Prednosti & Slabosti')}
    ${boldSection('Ključne prednosti',texts.pred,'#2e8a55')}
    ${boldSection('Možne slabosti',texts.slab,'#c94030')}
    ${ftr('Prednosti & Slabosti')}
  </div>
  <div style="width:210mm;min-height:297mm;padding:10mm 14mm 18mm;position:relative;break-after:page;background:#fafaf8">
    ${hdr('Osebnostni profil','Osebnostni radar')}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;align-items:start">
      <div>
        <div style="font-size:11px;color:#6b6460;line-height:1.75;margin-bottom:10px">Osebnostni radar prikazuje osem ključnih dimenzij osebnosti, izračunanih na podlagi barvnega profila. Vsaka dimenzija odraža določen vidik vedenja in komunikacijskega sloga. Višja vrednost pomeni naravno prednost in pogostejšo uporabo tega vedenjskega vzorca.</div>
        <div style="border-left:3px solid ${mc};padding:9px 13px;background:#f9f7f4;border-radius:0 8px 8px 0">
          <div style="font-size:10px;font-style:italic;color:#4a4a4a;line-height:1.7;margin-bottom:3px">"Srečanje dveh osebnosti je kot stik dveh kemičnih substanc: če pride do reakcije, se obe spremenita."</div>
          <div style="font-size:8px;color:#aaa">— C. G. Jung, Psihološki tipi (1921)</div>
        </div>
      </div>
      <div style="background:white;border:1px solid #e8e4df;border-radius:9px;padding:12px">
        <div style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#aaa;margin-bottom:10px">Percentilni položaj</div>
        ${['B','R','G','Y'].map(k=>{
          const val=d.con[k], pct=Math.round((val/6)*100)
          const label={B:'Analitičnost',R:'Odločnost',G:'Empatija',Y:'Optimizem'}[k]
          const desc=pct>=75?'Zgornja četrtina':pct>=50?'Nadpovprečno':pct>=25?'Povprečno':'Spodnja četrtina'
          return `<div style="margin-bottom:7px">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px">
              <div style="font-size:9px;color:${CLR[k]};font-weight:600">${label}</div>
              <div style="font-size:9px;color:#888">${pct}. percentil · ${desc}</div>
            </div>
            <div style="height:5px;background:#f0ece4;border-radius:3px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:${CLR[k]};border-radius:3px"></div>
            </div>
          </div>`
        }).join('')}
      </div>
    </div>
    <div style="display:flex;justify-content:center;margin-bottom:18px">
      ${radarChart(d.con,320)}
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">
      ${[
        {k:'B',dims:'Analitičnost · Natančnost',desc:'Sistematično mišljenje in natančnost pri delu'},
        {k:'R',dims:'Odločnost · Pogum',desc:'Usmerjenost v rezultate in prevzemanje pobude'},
        {k:'G',dims:'Empatija · Harmonija',desc:'Razumevanje drugih in gradnja odnosov'},
        {k:'Y',dims:'Optimizem · Ustvarjalnost',desc:'Pozitivna naravnanost in iskanje novih možnosti'},
      ].map(item=>`<div style="background:${CLR_L[item.k]};border:1px solid ${CLR[item.k]}33;border-radius:8px;padding:10px 12px">
        <div style="font-size:8px;font-weight:800;text-transform:uppercase;color:${CLR_D[item.k]};margin-bottom:4px">${{B:'Analitična modra',R:'Aktivna rdeča',G:'Stabilna zelena',Y:'Navdušena rumena'}[item.k]}</div>
        <div style="font-size:9px;font-weight:600;color:${CLR_D[item.k]};margin-bottom:4px">${item.dims}</div>
        <div style="font-size:8.5px;color:${CLR_D[item.k]};line-height:1.5;opacity:0.85">${item.desc}</div>
        <div style="margin-top:7px;font-size:10px;font-weight:700;color:${CLR[item.k]}">${d.con[item.k].toFixed(2)} / 6</div>
      </div>`).join('')}
    </div>
    <div style="background:white;border:1px solid #e8e4df;border-radius:9px;padding:14px 18px">
      <div style="font-size:8px;color:#aaa;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px">Barvni profil — vrednosti</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${['B','R','G','Y'].map(k=>`<div><div style="display:flex;justify-content:space-between;margin-bottom:4px"><div style="font-size:11px;color:${CLR[k]};font-weight:700">${{B:'Analitična modra',R:'Aktivna rdeča',G:'Stabilna zelena',Y:'Navdušena rumena'}[k]}</div><div style="font-size:11px;color:#888;font-weight:600">${d.con[k].toFixed(2)}</div></div><div style="height:7px;background:#f0ece4;border-radius:3px;overflow:hidden"><div style="height:100%;width:${(d.con[k]/6)*100}%;background:${CLR[k]};border-radius:3px"></div></div></div>`).join('')}
      </div>
    </div>
    ${ftr('Osebnostni radar')}
  </div>`:''
  const timPage=(texts.tim||texts.okol||texts.motiv||texts.kom)?contentPage('Tim & Okolje','Tim & Motivacija',
    section('Prispevek k timu',texts.tim)+section('Idealno delovno okolje',texts.okol)+
    section('Motivacija in strahovi',texts.motiv)+boldSection('Komunikacijski nasveti',texts.kom,mc)):''

  const razvPage=(texts.razv||texts.slepe||texts.naspr)?contentPage('Razvoj & Odnosi','Razvoj',
    section('Predlogi za razvoj',texts.razv)+section('Slepe pege',texts.slepe)+section('Nasprotni tip',texts.naspr)):''

  // Motivacijski kompas — vizualni prikaz
  function motivKompas(motivText) {
    if(!motivText) return ''
    const motivira = [], demotivira = []
    // Razdeli na MOTIVIRA in DEMOTIVIRA bloka
    const demoIdx = motivText.indexOf('**DEMOTIVIRA')
    const motiIdx = motivText.indexOf('**MOTIVIRA')
    let motivBlock = '', demoBlock = ''
    if(demoIdx > 0) {
      motivBlock = motivText.slice(0, demoIdx)
      demoBlock = motivText.slice(demoIdx)
    } else if(motiIdx >= 0) {
      // Ima MOTIVIRA marker
      const afterMotiv = motivText.slice(motiIdx)
      const demoIdx2 = afterMotiv.indexOf('**DEMOTIVIRA')
      if(demoIdx2 > 0) {
        motivBlock = afterMotiv.slice(0, demoIdx2)
        demoBlock = afterMotiv.slice(demoIdx2)
      } else {
        motivBlock = afterMotiv
      }
    } else {
      // Ni markerjev — vzami vse kot motivira
      motivBlock = motivText
    }
    // Razčleni vsak blok
    function parseBlock(txt) {
      const items = []
      const parts = txt.split('**').filter(s=>s.trim())
      for(let i=0; i<parts.length; i++) {
        const t = parts[i].trim()
        if(!t || t.includes('MOTIVIRA') || t.includes('DEMOTIVIRA') || t==='-' || t==='–') continue
        if(t.endsWith(' -') || t.endsWith(' –')) {
          const title = t.slice(0,-2).trim()
          const desc = (parts[i+1]||'').replace(/^\s*[-–]?\s*/,'').trim()
          if(title) items.push(title + (desc?' — '+desc:''))
          i++
        } else if(i+1 < parts.length && (parts[i+1].trim().startsWith('-') || parts[i+1].trim().startsWith('–'))) {
          const desc = parts[i+1].replace(/^\s*[-–]?\s*/,'').trim()
          items.push(t + (desc?' — '+desc:''))
          i++
        } else {
          items.push(t)
        }
      }
      return items.filter(x=>x.length>2)
    }
    const mItems2 = parseBlock(motivBlock)
    const dItems2 = parseBlock(demoBlock)
    const mItems = mItems2.slice(0,5).map(t=>`<div style="display:flex;align-items:flex-start;gap:6px;padding:4px 0;border-bottom:0.5px solid #e6f5ee"><div style="color:#2e8a55;font-size:10px;flex-shrink:0;margin-top:1px">✓</div><div style="font-size:10px;color:#1a5c38;line-height:1.5">${t}</div></div>`).join('')
    const dItems = dItems2.slice(0,5).map(t=>`<div style="display:flex;align-items:flex-start;gap:6px;padding:4px 0;border-bottom:0.5px solid #faeaea"><div style="color:#c94030;font-size:10px;flex-shrink:0;margin-top:1px">✕</div><div style="font-size:10px;color:#a8291a;line-height:1.5">${t}</div></div>`).join('')
    return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px">
      <div style="background:#e6f5ee;border-radius:10px;padding:13px 15px">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#1a5c38;margin-bottom:10px">✓ Motivira</div>
        ${mItems}
      </div>
      <div style="background:#faeaea;border-radius:10px;padding:13px 15px">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#a8291a;margin-bottom:10px">✕ Demotivira</div>
        ${dItems}
      </div>
    </div>`
  }

  function intervjuSection(text) {
    if(!text) return ''
    const items = text.split('\n').filter(l=>l.trim() && /^\d/.test(l.trim()))
    if(!items.length) return ''
    return `<div style="margin-bottom:10px;break-inside:avoid">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <div style="width:3px;height:16px;background:#888;border-radius:2px;flex-shrink:0"></div>
        <div style="font-size:12px;font-weight:700;color:#1a1a1a">Intervju vprašanja</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        ${items.slice(0,6).map((q,i)=>`<div style="background:white;border:1px solid #e8e4df;border-radius:7px;padding:8px 10px;break-inside:avoid"><div style="font-size:8px;font-weight:700;color:#bbb;margin-bottom:3px">${i+1}.</div><div style="font-size:10px;color:#4a4a4a;line-height:1.6">${q.replace(/^\d+\.?\s*/,'')}</div></div>`).join('')}
      </div>
    </div>`
  }

  const vodenjePage=(texts.vodenje||texts.motivacija||texts.intervju||texts.digital)?`<div style="width:210mm;min-height:auto;padding:10mm 14mm 18mm;position:relative;break-after:page;background:#fafaf8">
    ${hdr('Vodenje & Motivacija','Za vodjo')}
    ${texts.vodenje?`<div style="margin-bottom:12px;break-inside:avoid">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <div style="width:3px;height:16px;background:${mc};border-radius:2px;flex-shrink:0"></div>
        <div style="font-size:12px;font-weight:700;color:#1a1a1a">Kako voditi ${ime1rod}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${(()=>{
          const items=[]
          // Besedilo pride kot en blok ali z newlines
          const vLines=texts.vodenje.split(/\n|(?=\*\*)/).filter(l=>l.trim())
          for(const line of vLines){
            const t=line.replace(/^[•\-\*\d\.]+\s*/,'').trim()
            if(!t) continue
            const m=t.match(/^\*\*(.+?)\*\*\s*[-–:]?\s*(.*)$/)
            if(m&&m[1].length<60) items.push({title:m[1].trim(),desc:m[2].trim()})
            else if(t.length>5) items.push({title:'',desc:t.replace(/\*\*/g,'')})
          }
          return items.slice(0,8).map(item=>`<div style="background:white;border:1px solid #e8e4df;border-left:3px solid ${mc};border-radius:0 6px 6px 0;padding:7px 10px;break-inside:avoid">
            ${item.title?`<div style="font-size:10.5px;font-weight:700;color:#1a1a1a;margin-bottom:2px">${item.title}</div>`:''}
            ${item.desc?`<div style="font-size:9.5px;color:#5a5a5a;line-height:1.55">${item.desc}</div>`:''}
          </div>`).join('')
        })()}
      </div>
    </div>`:''}
    ${texts.motivacija?`<div style="margin-bottom:12px;break-inside:avoid">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <div style="width:3px;height:16px;background:#2e8a55;border-radius:2px;flex-shrink:0"></div>
        <div style="font-size:12px;font-weight:700;color:#1a1a1a">Motivacijski profil</div>
      </div>
      ${motivKompas(texts.motivacija)}
    </div>`:''}
    ${intervjuSection(texts.intervju)}
    ${ftr('Vodenje & Motivacija')}
  </div>`:''

  function salesCard(phase) {
    const pd=phase[d.leadColor]
    if(!pd) return ''
    const scoreKeys={pred:'B',potrebe:'G',predlog:'B',ugovori:'R',zvestoba:'G',sledenje:'R'}
    const sk=scoreKeys[phase.id]||d.leadColor,score=d.con[sk]
    const level=score>=4.0?'Naravna prednost':score>=2.5?'Zavestno področje':'Področje razvoja'
    const lvlColor=score>=4.0?'#2e8a55':score>=2.5?'#c49a10':'#c94030'
    const lvlBg=score>=4.0?'#e6f5ee':score>=2.5?'#fdf6e3':'#faeaea'
    return `<div style="background:white;border:1px solid #e8e4df;border-radius:7px;padding:7px 9px;break-inside:avoid">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
        <div style="font-size:10px;font-weight:700;color:#1a1a1a">${phase.label}</div>
        <div style="font-size:7px;font-weight:700;padding:2px 6px;border-radius:20px;background:${lvlBg};color:${lvlColor}">${level}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:4px">
        <div style="background:#e6f5ee;border-radius:4px;padding:5px 7px"><div style="font-size:7px;font-weight:700;color:#1a5c38;text-transform:uppercase;margin-bottom:1px">Prednosti</div><div style="font-size:8.5px;color:#1a5c38;line-height:1.4">${pd.strong}</div></div>
        <div style="background:#faeaea;border-radius:4px;padding:5px 7px"><div style="font-size:7px;font-weight:700;color:#a8291a;text-transform:uppercase;margin-bottom:1px">Izzivi</div><div style="font-size:8.5px;color:#a8291a;line-height:1.4">${pd.challenge}</div></div>
      </div>
      <div style="background:#f0f4ff;border-left:2px solid #4a7ab5;border-radius:0 4px 4px 0;padding:4px 7px;font-size:8.5px;color:#1a4a7a;line-height:1.4"><strong>Priporočilo:</strong> ${pd.tip}</div>
    </div>`
  }

  function salesIndicators(con,from,to) {
    return SALES_IND.slice(from,to).map(group=>`<div style="margin-bottom:8px;break-inside:avoid">
      <div style="font-size:9.5px;font-weight:700;color:#1a1a1a;margin-bottom:4px">${group.phase}</div>
      <div style="border:1px solid #e0dbd3;padding:7px 9px;background:white;border-radius:5px">
        ${group.items.map(item=>{const val=parseFloat(item.calc(con).toFixed(1)),pct=Math.min((val/6)*100,100),dv=parseFloat((val/6*10).toFixed(1));return `<div style="display:grid;grid-template-columns:22px 1fr 120px;align-items:center;gap:6px;margin-bottom:4px"><div style="font-size:8.5px;font-weight:700;color:#555;text-align:right">${dv}</div><div style="position:relative;height:3.5px;background:#eee;border-radius:2px"><div style="position:absolute;left:0;top:0;height:100%;width:${pct}%;background:${item.color};border-radius:2px"></div><div style="position:absolute;top:50%;left:${pct}%;transform:translate(-50%,-50%);width:7px;height:7px;border-radius:50%;background:${item.color};border:1.5px solid white"></div></div><div style="font-size:8.5px;color:#666">${item.label}</div></div>`}).join('')}
      </div>
    </div>`).join('')
  }

  // Prodajno — vse 6 faz na ENO stran v 2-stolpčnem gridu
  const prod1=salesPhases.length>0?`<div style="width:210mm;min-height:297mm;padding:10mm 14mm 18mm;position:relative;break-after:page;background:#fafaf8">
    ${hdr('Prodajno poglavje','Prodajni profil')}
    <div style="background:#243140;color:white;border-radius:8px;padding:8px 11px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
        <div><div style="font-size:6.5px;text-transform:uppercase;opacity:0.3;margin-bottom:2px">Prodajno poglavje</div><div style="font-size:14px;font-weight:800">Prodajni profil — ${sk.ime1.or}</div></div>
        <div style="font-size:8.5px;opacity:0.5">Analiza: ${d.typeData.sl}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:4px">
        ${salesPhases.map(p=>{const scoreKeys={pred:'B',potrebe:'G',predlog:'B',ugovori:'R',zvestoba:'G',sledenje:'R'},sk=scoreKeys[p.id]||d.leadColor,score=d.con[sk],level=score>=4.0?'Prednost':score>=2.5?'Zavestno':'Razvoj',lvlColor=score>=4.0?'#2e8a55':score>=2.5?'#c49a10':'#c94030';return `<div style="background:rgba(255,255,255,0.07);border-radius:5px;padding:5px 7px"><div style="font-size:8px;opacity:0.6;margin-bottom:1px">${p.label.replace(/^\d\. /,'')}</div><div style="font-size:8px;font-weight:700;color:${lvlColor}">${level}</div></div>`}).join('')}
      </div>
    </div>
    ${texts.prod_uvod?`<div style="display:flex;margin-bottom:7px"><div style="width:2.5px;background:${mc};border-radius:2px;flex-shrink:0;margin-right:10px;min-height:14px"></div><div style="flex:1"><div style="font-size:10px;font-weight:700;color:#1a1a1a;margin-bottom:3px">Prodajni slog</div><div style="font-size:10px;color:#4a4a4a;line-height:1.7">${texts.prod_uvod}</div></div></div>`:''}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">
      ${salesPhases.map(p=>salesCard(p)).join('')}
    </div>
    <div style="font-size:11px;font-weight:700;color:#1a1a1a;margin-bottom:6px;padding-bottom:3px;border-bottom:1px solid #e8e4df">Pokazatelji prodajnih preferenc</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div>${salesIndicators(d.con,0,3)}</div>
      <div>${salesIndicators(d.con,3,6)}</div>
    </div>
    ${ftr('Prodajno poglavje')}
  </div>`:''

  // Indikatorji + generiran tekst na svoji strani
  const prod2=salesPhases.length>0?`<div style="width:210mm;padding:10mm 14mm 0;position:relative;background:#fafaf8">
    ${hdr('Prodajno poglavje · Indikatorji','Pokazatelji')}
    ${texts.prod_akcija?`<div style="background:#1f2933;color:white;border-radius:10px;padding:14px 18px;margin-bottom:16px">
      <div style="font-size:8px;text-transform:uppercase;opacity:0.4;margin-bottom:6px">Prioritetni akcijski plan</div>
      <div style="font-size:16px;font-weight:700;margin-bottom:12px;letter-spacing:-0.01em">Top 5 akcijskih korakov</div>
      ${(()=>{
        const raw2=texts.prod_akcija
        const blocks=raw2.split(/\n\n/).filter(b=>b.trim())
        const items2=blocks.slice(0,5).map(block=>{
          const lines2=block.split('\n').filter(l=>l.trim())
          const titleLine=lines2[0]||''
          const m2=titleLine.match(/^\*\*(.+?)\*\*\s*[-–:]?\s*(.*)$/)
          const title2=m2?m2[1].trim():titleLine.replace(/^\*+/,'').trim()
          const desc2=m2&&m2[2]?m2[2].trim():lines2.slice(1).filter(l=>!l.toLowerCase().startsWith('cilj')).join(' ').trim()
          const ciljLine=lines2.find(l=>l.toLowerCase().startsWith('cilj'))
          const cilj2=ciljLine?ciljLine.replace(/^cilj:?\s*/i,'').trim():''
          return {title:title2,desc:desc2,cilj:cilj2}
        }).filter(i=>i.title)
        return items2.map((item,i)=>'<div style="background:rgba(255,255,255,0.07);border-radius:8px;padding:10px 13px;margin-bottom:8px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:5px"><div style="width:20px;height:20px;border-radius:50%;background:'+mc+';display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="font-size:10px;font-weight:700;color:white">'+(i+1)+'</span></div><div style="font-size:11px;font-weight:700;color:white">'+item.title+'</div></div><div style="font-size:10px;opacity:0.75;line-height:1.6;padding-left:28px">'+item.desc+'</div>'+(item.cilj?'<div style="margin-top:6px;padding:5px 10px 5px 28px;border-left:2px solid '+mc+';font-size:9px;opacity:0.6"><strong style="opacity:0.9">Cilj:</strong> '+item.cilj+'</div>':'')+'</div>').join('')
      })()}
    </div>`:''}


  </div>
  ${(texts.prod_mocne||texts.prod_slepe)?`<div style="width:210mm;min-height:297mm;padding:0 14mm 18mm;position:relative;break-after:page;background:#fafaf8">
    ${hdr('Prodajno poglavje','Prednosti & Slepe pege')}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div>
        ${texts.prod_mocne?boldSection('Močne točke v prodaji',texts.prod_mocne,'#2e8a55'):''}
      </div>
      <div>
        ${texts.prod_slepe?boldSection('Slepe pege v prodaji',texts.prod_slepe,'#c94030'):''}
      </div>
    </div>
    ${ftr('Prednosti & Slepe pege')}
  </div>`:''}
  ${texts.prod_tip?`<div style="width:210mm;min-height:auto;padding:10mm 14mm 18mm;position:relative;break-after:page;background:#fafaf8">
    ${hdr('Prodajno poglavje','Prilagoditev tipu stranke')}
    ${(()=>{
      if(!texts.prod_tip) return ''
      const lines = texts.prod_tip.split('\n').filter(l=>l.trim())
      const sections = []
      let current = null
      for(const line of lines) {
        const m = line.match(/^\*\*(.+?)\*\*\s*[-–:]?\s*(.*)$/)
        if(m && m[1].length < 60) {
          if(current) sections.push(current)
          current = {title: m[1].trim(), text: m[2].trim()}
        } else if(current) {
          current.text += (current.text?' ':'') + line.replace(/^[-–•]\s*/,'').trim()
        }
      }
      if(current) sections.push(current)
      const typeColors = {'Director':'#c94030','Direktor':'#c94030','Reformer':'#c94030','Reformator':'#c94030','Motivator':'#c49a10','Inspirer':'#c49a10','Inspirator':'#c49a10','Helper':'#2e8a55','Pomočnik':'#2e8a55','Supporter':'#2e8a55','Podpornik':'#2e8a55','Coordinator':'#4a7ab5','Koordinator':'#4a7ab5','Observer':'#4a7ab5','Opazovalec':'#4a7ab5'}
      const typeIcons = {'Director':'⚡','Direktor':'⚡','Reformer':'🎯','Reformator':'🎯','Motivator':'🌟','Inspirer':'💫','Inspirator':'💫','Helper':'🤝','Pomočnik':'🤝','Supporter':'🌱','Podpornik':'🌱','Coordinator':'📋','Koordinator':'📋','Observer':'🔍','Opazovalec':'🔍'}
      if(sections.length >= 4) {
        return '<div style="margin-bottom:10px">'
          + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">'
          + '<div style="width:3px;height:18px;background:' + mc + ';border-radius:2px;flex-shrink:0"></div>'
          + '<div style="font-size:14px;font-weight:700;color:#1a1a1a">Prilagoditev tipu stranke</div>'
          + '</div>'
          + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:9px">'
          + sections.map(function(s){
              var clr = Object.entries(typeColors).find(function(e){return s.title.includes(e[0])})
              clr = clr ? clr[1] : mc
              var icon = Object.entries(typeIcons).find(function(e){return s.title.includes(e[0])})
              icon = icon ? icon[1] : '👤'
              return '<div style="padding:11px 13px;background:white;border:1px solid #e8e4df;border-left:3px solid ' + clr + ';border-radius:0 9px 9px 0;break-inside:avoid">'
                + '<div style="display:flex;align-items:center;margin-bottom:6px">'
                + '<div style="font-size:11px;font-weight:700;color:' + clr + '">' + s.title + '</div>'
                + '</div>'
                + '<div style="font-size:9.5px;color:#5a5a5a;line-height:1.65">' + s.text + '</div>'
                + '</div>'
            }).join('')
          + '</div>'
          + '</div>'
      }
      return boldSection('Prilagoditev tipu stranke', texts.prod_tip, mc)
    })()}
    ${ftr('Prilagoditev tipu stranke')}
  </div>`:''}
`:''
  // Stres & Regeneracija stran
  const stresRegenPage=(texts.stres||texts.regen)?`<div style="width:210mm;min-height:auto;padding:10mm 14mm 18mm;position:relative;break-after:page;background:#fafaf8">
    ${hdr('Stres & Regeneracija','Za vodjo')}

    ${texts.stres?`<div style="margin-bottom:16px;break-inside:avoid">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div style="width:3px;height:18px;background:#c94030;border-radius:2px;flex-shrink:0"></div>
        <div style="font-size:14px;font-weight:700;color:#1a1a1a;letter-spacing:-0.01em">Stres in opozorilni znaki</div>
      </div>
      <div style="background:#faeaea;border:1px solid #c9403022;border-radius:10px;padding:14px 16px;margin-bottom:10px">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#a8291a;margin-bottom:8px">⚠ Opozorilni znaki</div>
        <div style="font-size:11px;color:#4a4a4a;line-height:1.85">${texts.stres}</div>
      </div>
    </div>`:''}

    ${texts.regen?`<div style="margin-bottom:16px;break-inside:avoid">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div style="width:3px;height:18px;background:#2e8a55;border-radius:2px;flex-shrink:0"></div>
        <div style="font-size:14px;font-weight:700;color:#1a1a1a;letter-spacing:-0.01em">Regeneracija in ravnovesje</div>
      </div>
      <div style="background:#e6f5ee;border:1px solid #2e8a5522;border-radius:10px;padding:14px 16px">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#1a5c38;margin-bottom:8px">✓ Kako pomagati</div>
        <div style="font-size:11px;color:#4a4a4a;line-height:1.85">${texts.regen}</div>
      </div>
    </div>`:''}

    <div style="background:#1f2933;color:white;border-radius:10px;padding:12px 16px;margin-top:8px">
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;opacity:0.4;margin-bottom:6px">Sporočilo za vodjo</div>
      <div style="font-size:10.5px;opacity:0.82;line-height:1.8">Stres ni slabost — je signal. Ko prepoznate opozorilne znake pri ${ime1mestnik}, ukrepajte proaktivno. Regeneracija ni luksuz — je pogoj za trajno visoko zmogljivost.</div>
    </div>

    ${ftr('Stres & Regeneracija')}
  </div>`:''

  return `<!DOCTYPE html><html lang="sl"><head><meta charset="UTF-8"/>
<style>* { box-sizing:border-box; margin:0; padding:0; } body { font-family:-apple-system,'Helvetica Neue',Arial,sans-serif; background:#fafaf8; color:#1a1a1a; } @page { margin:0mm; }</style>
</head><body>
${coverPage}${tocPage}${jungPage}${profileAndArchPage}${stilPage}${predPage}${timPage}${razvPage}${vodenjePage}${stresRegenPage}${prod1}${prod2}
</body></html>`
}


// ─── PDF TIM ENDPOINT ─────────────────────────────────────────────────────────
app.post('/api/pdf-tim', async (req, res) => {
  const { chromium } = require('playwright')
  const fs = require('fs'), os = require('os'), path = require('path')
  const { teamProfiles, teamStats, analiza, date } = req.body

  try {
    const html = generateTimPdfHtml(teamProfiles, teamStats, analiza, date)
    const tmpDir = os.tmpdir(), ts = Date.now()
    const pdfPath = path.join(tmpDir, `tim-${ts}.pdf`)
    const browser = await chromium.launch()
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, margin: { top:'0mm', right:'0mm', bottom:'0mm', left:'0mm' } })
    await browser.close()
    const pdfBuf = fs.readFileSync(pdfPath)
    try { fs.unlinkSync(pdfPath) } catch(e) {}
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="insights-tim-${ts}.pdf"`)
    res.send(pdfBuf)
  } catch(err) {
    console.error('PDF Tim error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ─── PDF TIM GENERATOR ────────────────────────────────────────────────────────

function renderKakoDelati(txt) {
  if(!txt) return '<div style="font-size:12px;color:#ccc;font-style:italic">Ni generirano</div>'
  var out = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
  var blocks = txt.split(/\n(?=\*\*)/)
  for(var b=0; b<blocks.length; b++){
    var block = blocks[b].trim()
    if(!block) continue
    var nameMatch = block.match(/^\*\*(.+?)\*\*/)
    if(!nameMatch) continue
    var name = nameMatch[1]
    var rest = block.slice(nameMatch[0].length).trim()
    var rowLines = rest.split('\n').filter(function(l){return l.trim().match(/^-/)})
    var rows = ''
    for(var r=0; r<rowLines.length; r++){
      var t = rowLines[r].replace(/^-\s*/,'').trim()
      var col = t.indexOf(':')
      if(col>0){
        var lbl = t.slice(0,col).trim()
        var val = t.slice(col+1).trim()
        var clr = lbl.toLowerCase().indexOf('izogib')>=0?'#c94030':lbl.toLowerCase().indexOf('motiv')>=0?'#2e8a55':'#4a7ab5'
        rows += '<div style="display:flex;gap:8px;padding:5px 0;border-bottom:0.5px solid #f0ece4">'
        rows += '<div style="font-size:8px;font-weight:700;color:'+clr+';text-transform:uppercase;width:90px;flex-shrink:0">'+lbl+'</div>'
        rows += '<div style="font-size:10px;color:#4a4a4a;line-height:1.55">'+val+'</div>'
        rows += '</div>'
      }
    }
    out += '<div style="background:white;border:1px solid #e8e4df;border-radius:9px;padding:11px 14px;break-inside:avoid">'
    out += '<div style="font-size:12px;font-weight:700;color:#1a1a1a;margin-bottom:8px">'+name+'</div>'
    out += rows
    out += '</div>'
  }
  out += '</div>'
  return out
}



function renderSoigralci(txt) {
  if(!txt) return ''

  // Razdeli na IDEALNI in IZZIVI bloka
  const idealIdx = txt.indexOf('[IDEALNI]')
  const izziviIdx = txt.indexOf('[IZZIVI]')

  const idealBlock = idealIdx >= 0 ? txt.slice(idealIdx + 9, izziviIdx > 0 ? izziviIdx : undefined).trim() : ''
  const izziviBlock = izziviIdx >= 0 ? txt.slice(izziviIdx + 8).trim() : ''

  function parseBlock(block) {
    const items = []
    const lines = block.split('\n')
    let current = null
    for(const line of lines) {
      const t = line.trim()
      if(!t) continue
      // Ime: **Energični motivator** ali **Energični motivator** - opis
      const nameMatch = t.match(/^\*\*(.+?)\*\*/)
      if(nameMatch && nameMatch[1].length < 60) {
        if(current) items.push(current)
        const rest = t.slice(nameMatch[0].length).replace(/^\s*[-–]\s*/, '').trim()
        current = {tip: nameMatch[1].trim(), zakaj: '', nasvet: ''}
        // Preverimo ali je rest ze del opisa
        if(rest && !rest.match(/^(Zakaj|Nasvet|Rešitev|Konkretno)/i)) {
          current.zakaj = rest
        }
      } else if(current) {
        // Zakaj deluje: ... / Zakaj je trenje: ...
        if(t.match(/^Zakaj/i)) {
          const col = t.indexOf(':')
          if(col > 0) current.zakaj = t.slice(col+1).trim()
          else current.zakaj = t
        }
        // Nasvet za jutri: ... / Rešitev: ...
        else if(t.match(/^(Nasvet za jutri|Nasvet|Rešitev|Konkretno|→)/i)) {
          const col = t.indexOf(':')
          if(col > 0) current.nasvet = t.slice(col+1).trim()
          else current.nasvet = t.replace(/^→\s*/, '').trim()
        }
        // → brez dvopičja
        else if(t.startsWith('→')) {
          current.nasvet = t.replace(/^→\s*/, '').trim()
        }
        // Če še ni zakaj, dodaj kot zakaj
        else if(!current.zakaj) {
          current.zakaj = t
        }
        // Sicer dodaj k nasvetu
        else if(!current.nasvet) {
          current.nasvet = t
        }
      }
    }
    if(current) items.push(current)
    return items.filter(i => i.tip)
  }

  const idealItems = parseBlock(idealBlock)
  const izziviItems = parseBlock(izziviBlock)

  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s }
  function renderItem(item, clr, bgClr, borderClr) {
    return `<div style="background:white;border:1px solid ${borderClr};border-left:3px solid ${clr};border-radius:0 8px 8px 0;padding:11px 14px;margin-bottom:8px;break-inside:avoid">
      <div style="font-size:12px;font-weight:700;color:${clr};margin-bottom:6px">${item.tip}</div>
      ${item.zakaj ? `<div style="font-size:10px;color:#4a4a4a;line-height:1.6;margin-bottom:5px">${cap(item.zakaj)}</div>` : ''}
      ${item.nasvet ? `<div style="background:${bgClr};border-radius:5px;padding:6px 9px;font-size:9.5px;color:${clr};line-height:1.55"><strong>→</strong> ${cap(item.nasvet)}</div>` : ''}
    </div>`
  }

  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
    <div>
      <div style="font-size:9px;font-weight:700;color:#1a5c38;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;padding-bottom:5px;border-bottom:2px solid #2e8a55">✓ Idealni soigralci</div>
      ${idealItems.map(i => renderItem(i, '#1a5c38', '#e6f5ee', '#2e8a5533')).join('')}
    </div>
    <div>
      <div style="font-size:9px;font-weight:700;color:#a8291a;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;padding-bottom:5px;border-bottom:2px solid #c94030">⚠ Izzivi v ekipi</div>
      ${izziviItems.map(i => renderItem(i, '#a8291a', '#faeaea', '#c9403033')).join('')}
    </div>
  </div>`
}

function renderVloge(txt) {
  if(!txt) return '<div style="font-size:12px;color:#ccc;font-style:italic">Ni generirano</div>'
  var out = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
  var blocks = txt.split(/\n(?=\*\*)/)
  for(var b=0; b<blocks.length; b++){
    var block = blocks[b].trim()
    if(!block) continue
    var nameMatch = block.match(/^\*\*(.+?)\*\*/)
    if(!nameMatch) continue
    var fullName = nameMatch[1].trim()
    // Ločimo ime od delovnega mesta v oklepajih
    var dmMatch = fullName.match(/^(.+?)\s*\((.+?)\)\s*$/)
    var name = dmMatch ? dmMatch[1].trim() : fullName
    var dm = dmMatch ? dmMatch[2].trim() : ''
    var rest = block.slice(nameMatch[0].length).replace(/^\s*[-–]\s*/, '').trim()
    out += '<div style="background:white;border:1px solid #e8e4df;border-radius:9px;padding:11px 14px;break-inside:avoid">'
    out += '<div style="margin-bottom:6px">'
    out += '<div style="font-size:12px;font-weight:700;color:#1a1a1a">' + name + '</div>'
    if(dm) out += '<div style="font-size:9px;color:#c49a10;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-top:2px">' + dm + '</div>'
    out += '</div>'
    out += '<div style="height:1px;background:#f0ece4;margin-bottom:8px"></div>'
    out += '<div style="font-size:10px;color:#4a4a4a;line-height:1.6">' + rest + '</div>'
    out += '</div>'
  }
  out += '</div>'
  return out
}

function generateTimPdfHtml(teamProfiles, teamStats, analiza, date) {
  const CLR = {B:'#4a7ab5',R:'#c94030',G:'#2e8a55',Y:'#c49a10'}
  const CLR_L = {B:'#e8f0fa',R:'#faeaea',G:'#e6f5ee',Y:'#fdf6e3'}
  const CLR_D = {B:'#1a4a7a',R:'#a8291a',G:'#1a5c38',Y:'#8a6200'}
  const NAMES = {B:'Analitična modra',R:'Aktivna rdeča',G:'Stabilna zelena',Y:'Navdušena rumena'}

  function hdr(label, right='') {
    return `<div style="display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:8px;border-bottom:1.5px solid #1a1a1a;margin-bottom:14px">
      <div>
        <div style="font-size:7px;text-transform:uppercase;letter-spacing:0.09em;color:#aaa;margin-bottom:2px">Barvni kompas · ${label}</div>
        <div style="font-size:13px;font-weight:700;color:#1a1a1a">Timsko poročilo</div>
      </div>
      <div style="font-size:8px;color:#bbb">${right}</div>
    </div>`
  }

  function ftr(right) {
    return `<div style="position:absolute;bottom:8mm;left:14mm;right:14mm;display:flex;justify-content:space-between;font-size:7.5px;color:#ccc;border-top:0.5px solid #ede9e3;padding-top:4px"><span>Timsko poročilo · Barvni kompas</span><span>${right}</span></div>`
  }

  function section(title, text, color) {
    if(!text) return ''
    return `<div style="display:flex;margin-bottom:13px;break-inside:avoid">
      <div style="width:2.5px;background:${color||'#4a7ab5'};border-radius:2px;flex-shrink:0;margin-right:12px;min-height:16px"></div>
      <div style="flex:1">
        <div style="font-size:11.5px;font-weight:700;color:#1a1a1a;margin-bottom:5px">${title}</div>
        <div style="font-size:11px;color:#4a4a4a;line-height:1.85">${text}</div>
      </div>
    </div>`
  }

  function boldSection(title, text, color) {
    if(!text) return ''
    const items = []
    for(const line of text.split('\n').filter(l=>l.trim())) {
      const t = line.replace(/^[•\-\*\d\.]+\s*/,'').trim()
      if(!t) continue
      const m = t.match(/^\*\*(.+?)\*\*\s*[-–:]?\s*(.*)$/)
      if(m) { items.push({title:m[1].trim(),desc:m[2].trim()}); continue }
      items.push({title:'',desc:t})
    }
    if(!items.length) return ''
    return `<div style="display:flex;margin-bottom:13px;break-inside:avoid">
      <div style="width:2.5px;background:${color||'#4a7ab5'};border-radius:2px;flex-shrink:0;margin-right:12px"></div>
      <div style="flex:1">
        <div style="font-size:11.5px;font-weight:700;color:#1a1a1a;margin-bottom:7px">${title}</div>
        ${items.map((item,i)=>`<div style="padding:5px 0;${i<items.length-1?'border-bottom:0.5px solid #f0ece4':''}">
          ${item.title?`<div style="font-size:11px;font-weight:700;color:#1a1a1a;margin-bottom:1px">${item.title}</div>`:''}
          ${item.desc?`<div style="font-size:10px;color:#6b6b6b;line-height:1.6">${item.desc}</div>`:''}
        </div>`).join('')}
      </div>
    </div>`
  }

  // Radar SVG
  function radarSvg(size=300) {
    const cx=size/2,cy=size/2,R=size*0.35
    const dims=[
      {label:'Analitičnost',k:'B'},{label:'Odločnost',k:'R'},
      {label:'Empatija',k:'G'},{label:'Optimizem',k:'Y'},
      {label:'Natančnost',k:'B'},{label:'Pogum',k:'R'},
      {label:'Harmonija',k:'G'},{label:'Ustvarjalnost',k:'Y'},
    ]
    const vals=dims.map(d=>Math.min(teamStats.avg[d.k],6))
    const n=dims.length
    function ptA(i,r){const a=(i/n)*2*Math.PI-Math.PI/2;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]}
    const pad=35
    const grid=[1,2,3,4,5,6].map(v=>{const r=(v/6)*R,pts=Array.from({length:n},(_,i)=>ptA(i,r));return `<path d="${pts.map((p,i)=>(i===0?'M':'L')+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}Z" fill="none" stroke="#e8e4df" stroke-width="${v===3?'1':'0.5'}"/>`}).join('')
    const axes=dims.map((_,i)=>{const [x,y]=ptA(i,R);return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#e8e4df" stroke-width="0.8"/>`}).join('')
    const dataPts=vals.map((v,i)=>ptA(i,(v/6)*R))
    const dataPath=dataPts.map((p,i)=>(i===0?'M':'L')+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')+'Z'
    const dots=dataPts.map((p,i)=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4" fill="${CLR[dims[i].k]}" stroke="white" stroke-width="2"/>`).join('')
    const lbls=dims.map((dim,i)=>{const [x,y]=ptA(i,R+20);const anchor=x<cx-3?'end':x>cx+3?'start':'middle';return `<text x="${x.toFixed(1)}" y="${(y+4).toFixed(1)}" text-anchor="${anchor}" font-size="9" fill="#888" font-family="system-ui">${dim.label}</text>`}).join('')
    return `<svg width="${size+pad*2}" height="${size+pad*2}" viewBox="${-pad} ${-pad} ${size+pad*2} ${size+pad*2}" xmlns="http://www.w3.org/2000/svg">${grid}${axes}<path d="${dataPath}" fill="rgba(74,122,181,0.12)" stroke="#4a7ab5" stroke-width="2.5" opacity="0.9"/>${dots}${lbls}</svg>`
  }

  const memberNames = teamProfiles.map(p=>p.ime).join(', ')

  // ── NASLOVNICA ─────────────────────────────────────────────────────────────
  const coverPage = `<div style="width:210mm;height:297mm;background:#fafaf8;display:flex;flex-direction:column;overflow:hidden;break-after:page">
    <div style="display:flex;height:5px;flex-shrink:0">
      <div style="flex:1;background:#4a7ab5"></div><div style="flex:1;background:#c94030"></div>
      <div style="flex:1;background:#c49a10"></div><div style="flex:1;background:#2e8a55"></div>
    </div>
    <div style="padding:52px 60px 0;flex-shrink:0">
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:72px">
        <div style="width:28px;height:28px;border-radius:50%;background:conic-gradient(#4a7ab5 0deg 90deg,#c94030 90deg 180deg,#c49a10 180deg 270deg,#2e8a55 270deg 360deg);flex-shrink:0"></div>
        <div style="font-size:8.5px;letter-spacing:0.12em;text-transform:uppercase;color:#bbb">Barvni kompas</div>
      </div>
      <div style="font-size:9px;letter-spacing:0.09em;text-transform:uppercase;color:#4a7ab5;margin-bottom:14px">Timsko poročilo</div>
      <div style="font-size:58px;font-weight:800;color:#1a1a1a;line-height:1.0;margin-bottom:20px;letter-spacing:-0.025em">Naš tim</div>
      <div style="font-size:13px;color:#bbb;margin-bottom:40px">${date}</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${teamProfiles.map(p=>{
          const lc=(['B','R','G','Y'].map(k=>({k,v:p.con[k]})).sort((a,b)=>b.v-a.v))[0].k
          return `<div style="display:flex;align-items:center;gap:12px">
            <div style="width:10px;height:10px;border-radius:50%;background:${CLR[lc]};flex-shrink:0"></div>
            <div style="font-size:14px;font-weight:500;color:#1a1a1a">${p.ime}</div>
            <div style="font-size:11px;color:#aaa">${NAMES[lc]}</div>
          </div>`
        }).join('')}
      </div>
    </div>
    <div style="flex:1;display:flex;align-items:center;justify-content:center">
      <div style="display:flex;gap:16px">
        ${['B','R','Y','G'].map(k=>`<div style="text-align:center">
          <div style="width:60px;height:60px;border-radius:50%;background:${CLR_L[k]};border:3px solid ${CLR[k]};display:flex;align-items:center;justify-content:center;margin:0 auto 8px">
            <span style="font-size:16px;font-weight:800;color:${CLR[k]}">${teamStats.avg[k].toFixed(1)}</span>
          </div>
          <div style="font-size:8px;color:${CLR_D[k]};font-weight:700;text-transform:uppercase">${NAMES[k].split(' ')[1]}</div>
        </div>`).join('')}
      </div>
    </div>
    <div style="padding:0 60px 48px;flex-shrink:0">
      <div style="font-size:10px;color:#bbb">${teamProfiles.length} članov · Barvni kompas Timska analiza</div>
    </div>
    <div style="display:flex;height:3px;flex-shrink:0">
      <div style="flex:1;background:#4a7ab5"></div><div style="flex:1;background:#c94030"></div>
      <div style="flex:1;background:#c49a10"></div><div style="flex:1;background:#2e8a55"></div>
    </div>
  </div>`

  // ── TEORIJA ────────────────────────────────────────────────────────────────
  const theoryPage = `<div style="width:210mm;min-height:297mm;padding:10mm 14mm 18mm;position:relative;break-after:page;background:#fafaf8">
    ${hdr('Teoretično ozadje','Timska dinamika')}
    <div style="font-size:12px;font-weight:700;color:#1a1a1a;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #e8e4df">Barvne energije v timu</div>
    <div style="font-size:10.5px;color:#4a4a4a;line-height:1.8;margin-bottom:10px">Barvni kompas model temelji na Jungovi tipologiji in opisuje štiri temeljne energije ki jih vsak posameznik in tim izraža v različnih kombinacijah. V timskem kontekstu je ravnovesje med energijami ključno za učinkovitost, inovativnost in vzdušje.</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:12px">
      ${[
        ['B','Analitična modra','Analitičnost, sistematičnost, natančnost. Tim potrebuje modro energijo za kakovostne odločitve in temeljito analizo.'],
        ['R','Aktivna rdeča','Odločnost, pogum, usmerjenost v rezultate. Tim potrebuje rdečo energijo za akcijo, hitrost in doseganje ciljev.'],
        ['Y','Navdušena rumena','Ustvarjalnost, optimizem, navdušenje. Tim potrebuje rumeno energijo za inovacije, motivacijo in pozitivno vzdušje.'],
        ['G','Stabilna zelena','Empatija, harmonija, zaupanje. Tim potrebuje zeleno energijo za kohezijo, podporo in dolgoročne odnose.'],
      ].map(([k,n,desc])=>`<div style="background:${CLR_L[k]};border:1px solid ${CLR[k]}33;border-radius:8px;padding:9px 11px">
        <div style="font-size:8px;font-weight:800;text-transform:uppercase;color:${CLR_D[k]};margin-bottom:3px">${n}</div>
        <div style="font-size:8.5px;color:${CLR_D[k]};line-height:1.55;opacity:0.9">${desc}</div>
      </div>`).join('')}
    </div>
    <div style="font-size:12px;font-weight:700;color:#1a1a1a;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #e8e4df">5 disfunkcij ekipe — Patrick Lencioni</div>
    <div style="font-size:10.5px;color:#4a4a4a;line-height:1.8;margin-bottom:8px">Patrick Lencioni je v delu <em>The Five Dysfunctions of a Team</em> (2002) identificiral pet temeljnih vzorcev ki preprečujejo timom da bi dosegli polni potencial. Vsaka disfunkcija je razumljiva skozi prizmo barvnih energij.</div>
    <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">
      ${[
        ['1. Odsotnost zaupanja','Člani tima se ne počutijo varne za izražanje ranljivosti. Pogosto v timih z visoko rdečo in nizko zeleno energijo.','#c94030'],
        ['2. Strah pred konfliktom','Tim se izogiba produktivnim debatam. Visoka zelena energija brez modre lahko vodi v lažno harmonijo.','#c49a10'],
        ['3. Pomanjkanje zavezanosti','Brez resničnih debat ni prave zavezanosti odločitvam. Rumena in rdeča energija pomagata pri akciji.','#c49a10'],
        ['4. Izogibanje odgovornosti','Člani ne opozarjajo drug drugega na neproduktivno vedenje. Modra in rdeča energija sta ključni.','#4a7ab5'],
        ['5. Nepozornost na rezultate','Osebni interesi prevladajo nad timskimi cilji. Uravnotežen tim z jasno rdečo energijo to prepreči.','#2e8a55'],
      ].map(([title,desc,color])=>`<div style="display:flex;gap:10px;padding:8px 10px;background:white;border:1px solid #e8e4df;border-left:3px solid ${color};border-radius:0 7px 7px 0">
        <div style="flex:1">
          <div style="font-size:10px;font-weight:700;color:#1a1a1a;margin-bottom:2px">${title}</div>
          <div style="font-size:9px;color:#6b6460;line-height:1.55">${desc}</div>
        </div>
      </div>`).join('')}
    </div>
    <div style="font-size:12px;font-weight:700;color:#1a1a1a;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #e8e4df">Doprinos posameznih energij k timu</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">
      ${[
        ['B','V analizi in reševanju problemov: zagotavlja kakovost, preprečuje napake, skrbi za podatke in sistematičnost.'],
        ['R','V vodenju in akciji: zagotavlja hitrost odločanja, jasne cilje in pogum za težke pogovore.'],
        ['G','V koheziji in odnosih: gradi zaupanje, skrbi za vzdušje, zagotavlja da se vsi slišijo.'],
        ['Y','V inovacijah in motivaciji: prinaša svežino, entuzijazem, kreativne rešitve in pozitivno energijo.'],
      ].map(([k,desc])=>`<div style="background:${CLR_L[k]};border-radius:7px;padding:8px 10px">
        <div style="font-size:8px;font-weight:800;text-transform:uppercase;color:${CLR_D[k]};margin-bottom:3px">${NAMES[k]}</div>
        <div style="font-size:9px;color:${CLR_D[k]};line-height:1.55">${desc}</div>
      </div>`).join('')}
    </div>
    ${ftr('Teoretično ozadje')}
  </div>`

  // ── BARVNA SESTAVA ─────────────────────────────────────────────────────────
  const compositionPage = `<div style="width:210mm;min-height:297mm;padding:10mm 14mm 18mm;position:relative;break-after:page;background:#fafaf8">
    ${hdr('Barvna sestava','Profili tima')}
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px">
      ${teamStats.distribution.map(({k,avg,leaders})=>`<div style="background:${CLR_L[k]};border:1px solid ${CLR[k]}33;border-radius:9px;padding:12px;text-align:center">
        <div style="font-size:8px;font-weight:800;text-transform:uppercase;color:${CLR_D[k]};margin-bottom:4px">${NAMES[k]}</div>
        <div style="font-size:28px;font-weight:800;color:${CLR[k]};margin-bottom:4px">${avg.toFixed(1)}</div>
        <div style="font-size:8px;color:${CLR_D[k]};opacity:0.7;margin-bottom:6px">povprečje tima</div>
        <div style="font-size:9px;color:${CLR_D[k]};font-weight:600">${leaders.length>0?leaders.join(', '):'—'}</div>
        <div style="height:5px;background:${CLR[k]}22;border-radius:3px;overflow:hidden;margin-top:8px">
          <div style="height:100%;width:${(avg/6*100)}%;background:${CLR[k]};border-radius:3px"></div>
        </div>
      </div>`).join('')}
    </div>
    <div style="display:flex;justify-content:center;margin-bottom:14px">
      ${radarSvg(280)}
    </div>
    <div style="background:white;border:1px solid #e8e4df;border-radius:10px;padding:14px 18px;margin-bottom:10px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#aaa;margin-bottom:12px">Člani tima — vrednosti</div>
      <table style="width:100%;border-collapse:collapse;font-size:10.5px">
        <thead>
          <tr style="border-bottom:1px solid #e5e0d8">
            <th style="text-align:left;padding:4px 8px;color:#888;font-weight:600">Ime</th>
            <th style="text-align:left;padding:4px 8px;color:#888;font-weight:600">Tip</th>
            ${['B','R','G','Y'].map(k=>`<th style="text-align:center;padding:4px 8px;color:${CLR[k]};font-weight:700">${k}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${teamProfiles.map(p=>`<tr style="border-bottom:0.5px solid #f0ece4">
            <td style="padding:6px 8px;font-weight:500">${p.ime}</td>
            <td style="padding:6px 8px;color:#888;font-size:10px">${p.typeName||p.leadColor}</td>
            ${['B','R','G','Y'].map(k=>`<td style="text-align:center;padding:6px 8px;color:${CLR[k]};font-weight:${p.leadColor===k?700:400}">${p.con[k].toFixed(2)}</td>`).join('')}
          </tr>`).join('')}
          <tr style="border-top:2px solid #e5e0d8;background:#f9f7f4">
            <td colspan="2" style="padding:6px 8px;font-weight:700;color:#888;font-size:10px">POVPREČJE TIMA</td>
            ${['B','R','G','Y'].map(k=>`<td style="text-align:center;padding:6px 8px;color:${CLR[k]};font-weight:700">${teamStats.avg[k].toFixed(2)}</td>`).join('')}
          </tr>
        </tbody>
      </table>
    </div>
    ${teamStats.missing.length>0?`<div style="padding:10px 14px;background:#fdf6e3;border:1px solid #c49a1033;border-radius:8px;font-size:10.5px;color:#8a6200">
      ⚠️ <strong>Manjkajoča energija:</strong> ${teamStats.missing.map(k=>NAMES[k]).join(', ')} — tim bo imel izzive na področjih ki jih ta energija pokriva. Priporočamo zavestno krepitev teh kompetenc.
    </div>`:''}
    ${ftr('Barvna sestava')}
  </div>`

  // ── TIMSKA ANALIZA ─────────────────────────────────────────────────────────
  const analysisPage = (analiza && Object.keys(analiza).length > 0) ? `<div style="width:210mm;min-height:297mm;padding:10mm 14mm 18mm;position:relative;break-after:page;background:#fafaf8">
    ${hdr('Timska analiza','AI Poročilo')}
    ${section('Prednosti tega tima', analiza.prednosti, '#2e8a55')}
    ${section('Tveganja in slepe pege', analiza.tveganja, '#c94030')}
    ${section('Komunikacija v timu', analiza.komunikacija, '#4a7ab5')}
    ${boldSection('Priporočila za vodjo', analiza.priporocila, '#4a7ab5')}
    ${section('Razvojne priložnosti', analiza.razvoj, '#2e8a55')}
    ${ftr('Timska analiza')}
  </div>
  <div style="width:210mm;min-height:297mm;padding:10mm 14mm 18mm;position:relative;break-after:page;background:#fafaf8">
    ${hdr('Idealne vloge','Tim')}
    <div style="font-size:11px;color:#6b6460;line-height:1.8;margin-bottom:14px">Priporočene vloge za vsakega člana tima glede na njihov osebnostni profil, percepcijski stil in vedenjske prednosti.</div>
    ${renderVloge(analiza.vloge)}
    ${ftr('Idealne vloge')}
  </div>
  <div style="width:210mm;min-height:297mm;padding:10mm 14mm 18mm;position:relative;break-after:page;background:#fafaf8">
    ${hdr('Kako delati s posameznikom','Za vodjo')}
    ${renderKakoDelati(analiza.kako_delati)}
    ${ftr('Kako delati s posameznikom')}
  </div>` : ''

  // ── INDIVIDUALNI POVZETKI ──────────────────────────────────────────────────
  const individualsPage = `<div style="width:210mm;min-height:297mm;padding:10mm 14mm 18mm;position:relative;break-after:page;background:#fafaf8">
    ${hdr('Individualni povzetki','Člani tima')}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${teamProfiles.map(p=>{
        const sorted=['B','R','G','Y'].map(k=>({k,v:p.con[k]})).sort((a,b)=>b.v-a.v)
        const lc=sorted[0].k
        const texts = p.texts || {}
        const snVal = parseFloat(p.sn)
        const snTag = !isNaN(snVal) && Math.abs(snVal) >= 1.0
          ? (snVal <= -2.5 ? '· Izrazito zaznavanje' :
             snVal <= -1.0 ? '· Zaznavanje' :
             snVal >= 2.5  ? '· Izrazita intuicija' :
             '· Intuicija')
          : ''
        return `<div style="background:white;border:1px solid ${CLR[lc]}44;border-radius:10px;padding:12px 14px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <div style="width:10px;height:10px;border-radius:50%;background:${CLR[lc]};flex-shrink:0"></div>
            <div>
              <div style="font-size:13px;font-weight:700;color:#1a1a1a">${p.ime}</div>
              <div style="font-size:9px;color:#aaa">${p.typeName||lc} ${snTag}</div>
              ${p.delovno_mesto ? `<div style="font-size:8px;color:#bbb;margin-top:1px">${p.delovno_mesto}</div>` : ''}
            </div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:8px">
            ${['B','R','G','Y'].map(k=>`<div style="text-align:center;background:${CLR_L[k]};border-radius:5px;padding:4px 2px">
              <div style="font-size:7px;color:${CLR_D[k]};font-weight:700">${k}</div>
              <div style="font-size:11px;font-weight:700;color:${CLR[k]}">${p.con[k].toFixed(1)}</div>
            </div>`).join('')}
          </div>
          ${(()=>{
            const lc=['B','R','G','Y'].map(k=>({k,v:p.con[k]})).sort((a,b)=>b.v-a.v)[0].k
            const lcv=p.con[lc]
            const sorted2=['B','R','G','Y'].map(k=>({k,v:p.con[k]})).sort((a,b)=>b.v-a.v)
            const lc2=sorted2[0].k, sc2=sorted2[1].k, lcv2=p.con[lc2], scv2=p.con[sc2]
            const lvl2=lcv2>=4.5?'h':lcv2>=3.0?'m':'l'
            const slvl2=scv2>=3.5?'h':'l'
            const CM={
              BB:{h:['Izjemna analitična globina z metodičnim pristopom','Vzdrži najvišje standarde kakovosti','Sistematično gradi znanje ki postane timski kapital'],m:['Zanesljiv analitik ki preverja dejstva','Strukturiran pri postopkih','Preudaren glasnik kakovosti'],l:['Podpira analizo v skupnih projektih','Skrbi za natančnost','Prinaša red in sistematičnost']},
              BR:{h:['Analitičnost z odločnostjo — analizira hitro in ukrepa','Kakovostne odločitve pod pritiskom','Strateški mislec ki ne okleva'],m:['Premišljeno reši probleme brez odlašanja','Ravnotežje med analizo in akcijo','Gradi kredibilnost s kakovostnim delom'],l:['Analitičen temelj z določeno odločnostjo','Kakovost brez zaviranja tempa','Premišljeno ukrepa kadar je potrebno']},
              BG:{h:['Analitičnost z empatijo — natančen in sočuten hkrati','Gradi sisteme ki upoštevajo človeški faktor','Redka kombinacija logike in topline'],m:['Zanesljiv in empatičen — kolegi mu zaupajo','Kakovost in vzdušje v timu hkrati','Analizira z razumevanjem za vse vpletene'],l:['Natančen in pozoren na dinamiko tima','Procesi ki upoštevajo ljudi','Analitičen brez zanemarjanja odnosov']},
              BY:{h:['Analitičnost z ustvarjalnostjo — inovira in zagotavlja kakovost','Most med podatki in idejami','Sistemsko z vizionarskim potencialom'],m:['Strukturiran a odprt za nove pristope','Svežina v analitičnem okolju','Inovativne rešitve na trdnih temeljih'],l:['Analitičen temelj z iskrico ustvarjalnosti','Natančnost z odprtostjo za boljše poti','Podpira inovacije z zanesljivimi podatki']},
              RB:{h:['Odločna akcija podprta z globoko analizo','Vodja ki ne odloča brez podatkov','Rezultati z izjemno kakovostjo izvedbe'],m:['Odločen a premišljen — hitrost s kakovostjo','Prevzema pobudo in skrbi za pravilno izvedbo','Dejstva podpirajo njegove odločitve'],l:['Usmerjen v rezultate z zavestjo o kakovosti','Pogumen a previden pri izvedbi','Cilje dosega brez zanemarjanja podrobnosti']},
              RR:{h:['Izjemna pogonska sila — energija in ambicija na vrhu','Neustavljiv pri doseganju ciljev','Postavlja visoke standarde in zahteva isto od drugih'],m:['Močan motor — vzdržuje tempo in fokus','Žene projekt naprej z jasnimi cilji','Odločen pri prioritetah in odgovornostih'],l:['Energija kadar tim potrebuje zagon','Pomaga preseči zastoje','Pogumen glasnik akcije']},
              RG:{h:['Odločnost z empatijo — vodja ki ga vsi spoštujejo','Reši težke situacije in ohrani odnose','Most med rezultati in vrednotami'],m:['Usmerjen v cilje a pozoren na tim','Pobuda z zavedanjem za vse vpletene','Zaupanje gradi skozi doslednost in skrb'],l:['Odločen a human pri izzivih','Rezultati brez zanemarjanja ljudi','Uravnoteženost med akcijo in empatijo']},
              RY:{h:['Karizmatičen pogon — odločnost z navdušenjem osvaja vse','Energičen vizionar ki dosega nemogoče','Navdihuje in zahteva — najmočnejši motivator'],m:['Odločen in optimističen — morala in tempo','Energija in jasni cilji hkrati','Motivira skozi akcijo in pozitivnost'],l:['Ambiciozen a z lahkoto','Svež zagon kadar zastane','Odločen a z nasmehom']},
              GB:{h:['Empatija z analitično globino — razume ljudi in sisteme','Trajni odnosi na trdnih temeljih zaupanja','Koordinator ki upošteva vse vidike'],m:['Zanesljiv in premišljen — drži tim skupaj','Odnosi in kakovost procesov hkrati','Natančen in human pri konfliktih'],l:['Harmonija z zavestjo o kakovosti','Vzdušje brez zanemarjanja postopkov','Empatičen a strukturiran']},
              GR:{h:['Empatija z odločnostjo — konflikte rešuje neposredno in sočutno','Zaupanje in pogon tima hkrati','Srce in pogum — redka kombinacija'],m:['Odnosi in rezultati enako pomembni','Pobuda v težkih pogovorih z empatijo','Drži tim skupaj in ga usmerja'],l:['Human vodja ki ne beži od izzivov','Toplina v zahtevnih situacijah','Podpira in spodbuja k akciji']},
              GG:{h:['Temelj psihološke varnosti — vsi se počutijo varno','Izjemen graditelj zaupanja in dolgoročnih odnosov','Njegova prisotnost zmanjša konflikte'],m:['Drži tim skupaj v težkih trenutkih','Posluša in usklajuje različna mnenja','Kultura spoštovanja in vključenosti'],l:['Toplina in empatija v delovnem okolju','Nihče se ne počuti spregledenega','Human glas v odločitvah']},
              GY:{h:['Empatija z ustvarjalnostjo — navdihuje in skrbi za vsakogar','Vključujoče okolje kjer ideje cvetijo','Naravni facilitator skupinske ustvarjalnosti'],m:['Pozitivno vzdušje in skrb za odnose','Svežina in toplina v enaki meri','Ustvarjalnost z empatičnim pristopom'],l:['Prijazen in odprt za nove ideje','Vzdušje in boljše načine hkrati','Human inovator v timu']},
              YB:{h:['Ustvarjalnost z analitično podlago — ideje ki zares delujejo','Inovira sistematično in meri uspeh','Vizionar ki ne pozabi na izvedljivost'],m:['Svež pristop z zavestjo o realnosti','Ideje ki so izvedljive','Intuicija podprta z dejstvi'],l:['Ustvarjalen a pragmatičen','Iskra idej s trdnimi temelji','Inovira znotraj realnih okvirov']},
              YR:{h:['Karizmatičen vizionar z odločnostjo — ideje uresniči hitro','Navdihuje in poganja k izvedbi','Energičen inovator ki ne pusti idej v predalu'],m:['Entuziastičen in usmerjen — kombinacija ki zmaguje','Ideje in skrb da se uresničijo','Motivira skozi vizijo in akcijo'],l:['Ustvarjalen z mero poguma','Svežino uresniči','Optimist ki dela']},
              YG:{h:['Ustvarjalnost z empatijo — gradi skupnost okoli vizije','Navdihuje in globoko skrbi za vsakogar','Magnetična osebnost ki združuje tim'],m:['Pozitiven in human — dviga moralo','Ideje ki upoštevajo vse vpletene','Kultura kjer vsakdo da vse od sebe'],l:['Prijazen optimist z ustvarjalnim duhom','Svežina in toplina hkrati','Dobro vzdušje z novimi idejami']},
              YY:{h:['Izjemen vir navdiha — tim nikoli ne zastane','Optimizem ki je nalezljiv in produktiven','Vidi priložnosti kjer drugi vidijo ovire'],m:['Pozitivna energija in ustvarjalnost','Svež pogled k vsakemu problemu','Spodbuja eksperimentiranje in rast'],l:['Optimizem kadar tim potrebuje navdih','Svež pogled na stare probleme','Ustvarjalnost in lahkotnost']}
            }
            const key2=lc2+(slvl2==='h'?sc2:lc2)
            // Prilagodljiv tip — ima 3+ barve nad 3.0
            const above3_2=['B','R','G','Y'].filter(k=>p.con[k]>=3.0).length
            const isPrilagodljiv=above3_2>=3
            let tips2
            if(isPrilagodljiv){
              const flexTips={
                h:['Naravno prehaja med energijami glede na potrebe situacije — redka in dragocena lastnost','Razume perspektive vseh tipov v timu in deluje kot naravni mediator','Tim ga vidi kot zanesljivega partnerja v katerikoli vlogi'],
                m:['Fleksibilen pri pristopu — se prilagodi tam kjer je tim najranljivejši','Premošča razlike med različnimi tipi v timu','Naravno dopolnjuje tisto kar timu v danem trenutku manjka'],
                l:['Vsestranski contributor ki ne vztraja le pri enem načinu dela','Prinaša uravnoteženost in zmanjšuje ekstreme v timu','Njegova fleksibilnost je varnostna mreža tima']
              }
              tips2=flexTips[lvl2]
            } else {
              tips2=(CM[key2]||CM[lc2+lc2])[lvl2]
            }
            // Dodaj S/N opis
            const snVal2 = parseFloat(p.sn)
            let snTip = ''
            if(!isNaN(snVal2) && Math.abs(snVal2) >= 1.0) {
              if(snVal2 <= -2.5) snTip = 'Izrazito zaznavni stil — zaupa konkretnim dejstvom, korak-za-korakom pristopu in preizkušenim metodam.'
              else if(snVal2 <= -1.0) snTip = 'Zaznavni stil — preferira konkretne naloge, jasne korake in preverjena dejstva pred abstrakcijami.'
              else if(snVal2 >= 2.5) snTip = 'Izrazito intuitiven stil — hitro vidi vzorce in možnosti, razmišlja celostno in vizionarsko.'
              else snTip = 'Intuitiven stil — išče globlje pomene in priložnosti, preferira celostno sliko pred podrobnostmi.'
            }
            const dot2='<div style="width:5px;height:5px;border-radius:50%;background:'+CLR[lc2]+';flex-shrink:0;margin-top:3px"></div>'
            const snDot='<div style="width:5px;height:5px;border-radius:50%;background:#888;flex-shrink:0;margin-top:3px"></div>'
            const items2=tips2.map(t=>'<div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:4px">'+dot2+'<div style="font-size:9px;color:#4a4a4a;line-height:1.5">'+t+'</div></div>').join('')
            const snItem=snTip?'<div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:4px">'+snDot+'<div style="font-size:9px;color:#666;line-height:1.5;font-style:italic">'+snTip+'</div></div>':''
            return '<div style="border-top:0.5px solid #f0ece4;padding-top:8px;margin-top:4px"><div style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#aaa;margin-bottom:6px">Prinaša timu</div>'+items2+snItem+'</div>'
          })()}
        </div>`
      }).join('')}
    </div>
    ${ftr('Individualni povzetki')}
  </div>`

  return `<!DOCTYPE html><html lang="sl"><head><meta charset="UTF-8"/>
<style>* { box-sizing:border-box; margin:0; padding:0; } body { font-family:-apple-system,'Helvetica Neue',Arial,sans-serif; background:#fafaf8; color:#1a1a1a; } @page { margin:0mm; }</style>
</head><body>
${coverPage}${theoryPage}${compositionPage}${analysisPage}${individualsPage}
</body></html>`
}

// ─── PDF SPORT ENDPOINT ───────────────────────────────────────────────────────
app.post('/api/pdf-sport', async (req, res) => {
  const { chromium } = require('playwright')
  const fs = require('fs'), os = require('os'), path = require('path')
  const { profileData } = req.body
  try {
    const html = generateSportPdfHtml(profileData)
    const tmpDir = os.tmpdir(), ts = Date.now()
    const pdfPath = path.join(tmpDir, `sport-${ts}.pdf`)
    const browser = await chromium.launch()
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, margin: { top:'0mm', right:'0mm', bottom:'0mm', left:'0mm' } })
    await browser.close()
    const safeName = profileData.ime.replace(/ /g,'-').replace(/[čšžČŠŽ]/g, c => ({č:'c',š:'s',ž:'z',Č:'C',Š:'S',Ž:'Z'}[c]||c))
    const pdfBuf = fs.readFileSync(pdfPath)
    try { fs.unlinkSync(pdfPath) } catch(e) {}
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="sport-${safeName}.pdf"`)
    res.send(pdfBuf)
  } catch(err) { console.error('PDF Sport error:', err); res.status(500).json({ error: err.message }) }
})

// ─── PDF SPORT GENERATOR ──────────────────────────────────────────────────────
function generateSportPdfHtml(d) {
  const lc = d.leadColor
  const mc = {B:'#4a7ab5',R:'#c94030',G:'#2e8a55',Y:'#c49a10'}[lc]
  const CLR = {B:'#4a7ab5',R:'#c94030',G:'#2e8a55',Y:'#c49a10'}
  const CLR_L = {B:'#e8f0fa',R:'#faeaea',G:'#e6f5ee',Y:'#fdf6e3'}
  const CLR_D = {B:'#1a4a7a',R:'#a8291a',G:'#1a5c38',Y:'#8a6200'}
  const ime1 = d.ime.trim().split(' ')[0]
  const spol = d.spol || 'm'
  const texts = d.texts || {}
  const date = new Date().toLocaleDateString('sl-SI', {day:'numeric',month:'long',year:'numeric'})

  function sklanjaj(ime) {
    if(!ime) return ime
    const zadnji = ime.slice(-1).toLowerCase()
    const zadnji2 = ime.slice(-2).toLowerCase()
    const soglasniki = 'bcčdfghjklmnprsštvzž'
    if(spol === 'z' || spol === 'f') {
      if(zadnji === 'a') return ime.slice(0,-1) + 'e'
      if(soglasniki.includes(zadnji)) return ime + 'e'
      return ime
    } else {
      if(zadnji2 === 'ec') return ime.slice(0,-2) + 'cu'
      if(zadnji === 'a') return ime.slice(0,-1) + 'e'
      if(soglasniki.includes(zadnji)) return ime + 'a'
      return ime
    }
  }
  const ime1rod = sklanjaj(ime1)

  function wheel(scores, size=180) {
    const cx=size/2,cy=size/2,R=size*0.43,inner=size*0.09
    const segs=[{k:'B',hex:'#4a7ab5',s:Math.PI,e:Math.PI*1.5},{k:'R',hex:'#c94030',s:Math.PI*1.5,e:Math.PI*2},{k:'Y',hex:'#c49a10',s:0,e:Math.PI*0.5},{k:'G',hex:'#2e8a55',s:Math.PI*0.5,e:Math.PI}]
    function pt(r,a){return [cx+r*Math.cos(a),cy+r*Math.sin(a)]}
    function arc(r1,r2,s,e){
      const steps=40,op=[],ip=[]
      for(let i=0;i<=steps;i++){const a=s+(e-s)*i/steps;op.push(pt(r2,a));ip.push(pt(r1,a))}
      return op.map((p,i)=>(i===0?'M'+p[0].toFixed(1)+','+p[1].toFixed(1):'L'+p[0].toFixed(1)+','+p[1].toFixed(1))).join(' ')+' '+ip.reverse().map((p,i)=>(i===0?'L'+p[0].toFixed(1)+','+p[1].toFixed(1):'L'+p[0].toFixed(1)+','+p[1].toFixed(1))).join(' ')+'Z'
    }
    const paths=segs.map(s=>{const sR=inner+(R-inner)*(Math.max(0.05,Math.min(6,scores[s.k]))/6);return `<path d="${arc(inner,sR,s.s,s.e)}" fill="${s.hex}" opacity="0.92" stroke="white" stroke-width="2"/>`}).join('')
    const divs=`<line x1="${cx}" y1="${cy-R}" x2="${cx}" y2="${cy+R}" stroke="white" stroke-width="2.5"/><line x1="${cx-R}" y1="${cy}" x2="${cx+R}" y2="${cy}" stroke="white" stroke-width="2.5"/>`
    const centers=segs.map(s=>`<path d="${arc(0,inner-1,s.s,s.e)}" fill="${s.hex}"/>`).join('')
    const fs2=size*0.044
    const lbls=[{k:'B',x:cx-R+3,y:cy-R+fs2+1,a:'start'},{k:'R',x:cx+R-3,y:cy-R+fs2+1,a:'end'},{k:'Y',x:cx+R-3,y:cy+R-3,a:'end'},{k:'G',x:cx-R+3,y:cy+R-3,a:'start'}]
      .map(l=>`<text x="${l.x}" y="${l.y}" text-anchor="${l.a}" font-size="${fs2}" font-weight="700" font-family="system-ui" fill="${CLR[l.k]}">${l.k} ${scores[l.k].toFixed(1)}</text>`).join('')
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">${paths}<line x1="${cx}" y1="${cy-R}" x2="${cx}" y2="${cy+R}" stroke="white" stroke-width="2.5"/><line x1="${cx-R}" y1="${cy}" x2="${cx+R}" y2="${cy}" stroke="white" stroke-width="2.5"/>${centers}${lbls}</svg>`
  }

  function hdr(label, right='') {
    return `<div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:8px">
        <div>
          <div style="font-size:7px;text-transform:uppercase;letter-spacing:0.1em;color:#bbb;margin-bottom:3px">Barvni kompas · Šport · ${label}</div>
          <div style="font-size:14px;font-weight:700;color:#1a1a1a;letter-spacing:-0.01em">${d.ime}</div>
          ${d.sport||d.pozicija ? `<div style="font-size:9px;color:${mc};font-weight:600;margin-top:2px">${[d.sport,d.pozicija].filter(Boolean).join(' · ')}</div>` : ''}
        </div>
        <div style="font-size:9px;color:#bbb;font-weight:500">${right}</div>
      </div>
      <div style="height:2px;background:linear-gradient(to right,${mc},${mc}44,transparent)"></div>
    </div>`
  }

  function ftr(right) {
    return `<div style="position:absolute;bottom:8mm;left:14mm;right:14mm;display:flex;justify-content:space-between;font-size:7.5px;color:#ccc;border-top:0.5px solid #ede9e3;padding-top:4px"><span>${d.ime} · Barvni kompas Šport</span><span>${right}</span></div>`
  }

  function section(title, text, color) {
    if(!text) return ''
    return `<div style="margin-bottom:18px;break-inside:avoid">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <div style="width:3px;height:20px;background:${color||mc};border-radius:2px;flex-shrink:0"></div>
        <div style="font-size:13px;font-weight:700;color:#1a1a1a;letter-spacing:-0.01em">${title}</div>
      </div>
      <div style="font-size:11px;color:#4a4a4a;line-height:1.9;padding-left:13px;border-left:1px solid #f0ece4">${text}</div>
    </div>`
  }

  // ── NASLOVNICA ─────────────────────────────────────────────────────────────
  const coverPage = `<div style="width:210mm;height:297mm;background:#fafaf8;display:flex;flex-direction:column;overflow:hidden;break-after:page">
    <div style="display:flex;height:5px;flex-shrink:0">
      <div style="flex:1;background:#4a7ab5"></div><div style="flex:1;background:#c94030"></div>
      <div style="flex:1;background:#c49a10"></div><div style="flex:1;background:#2e8a55"></div>
    </div>
    <div style="padding:44px 52px 0;flex-shrink:0">
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:20px">
        <div style="width:28px;height:28px;border-radius:50%;background:conic-gradient(#4a7ab5 0deg 90deg,#c94030 90deg 180deg,#c49a10 180deg 270deg,#2e8a55 270deg 360deg);flex-shrink:0"></div>
        <div style="font-size:8.5px;letter-spacing:0.12em;text-transform:uppercase;color:#bbb">Barvni kompas</div>
        <div style="background:#e6f5ee;color:#1a5c38;border-radius:20px;padding:3px 10px;font-size:8px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase">⚽ Športni profil</div>
      </div>
      ${d.sport ? `<div style="font-size:11px;color:#888;margin-bottom:8px;font-weight:500">${d.sport}${d.pozicija?' · '+d.pozicija:''}</div>` : ''}
      <div style="font-size:8px;letter-spacing:0.1em;text-transform:uppercase;color:${mc};margin-bottom:16px;font-weight:600">Osebnostni profil</div>
      <div style="font-size:52px;font-weight:800;color:#1a1a1a;line-height:0.95;margin-bottom:18px;letter-spacing:-0.03em">${d.ime}</div>
      <div style="display:flex;align-items:center;gap:10px">
        <div style="font-size:11px;color:#bbb">${date}</div>
        <div style="width:4px;height:4px;border-radius:50%;background:#e5e0d8"></div>
        <div style="font-size:11px;color:${mc};font-weight:600">${d.typeData.sl}</div>
      </div>
    </div>
    <div style="flex:1;display:flex;align-items:center;justify-content:center">
      ${wheel(d.con, 260)}
    </div>
    <div style="padding:0 52px 48px;flex-shrink:0">
      <div style="height:1px;background:linear-gradient(to right,#e5e0d8,transparent);margin-bottom:20px"></div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end">
        <div>
          <div style="font-size:7px;text-transform:uppercase;letter-spacing:0.1em;color:#ccc;margin-bottom:6px">Osebnostni tip</div>
          <div style="font-size:20px;font-weight:700;color:#1a1a1a;letter-spacing:-0.02em">${d.typeData.sl}</div>
          <div style="font-size:10px;color:${mc};margin-top:4px;font-weight:500">${d.variant}</div>
        </div>
        <div style="display:flex;gap:4px">
          ${['B','R','Y','G'].map(k=>`<div style="width:28px;height:28px;border-radius:50%;background:${CLR_L[k]};border:2px solid ${CLR[k]};display:flex;align-items:center;justify-content:center"><span style="font-size:9px;font-weight:700;color:${CLR[k]}">${d.con[k].toFixed(1)}</span></div>`).join('')}
        </div>
      </div>
    </div>
    <div style="display:flex;height:3px;flex-shrink:0">
      <div style="flex:1;background:#4a7ab5"></div><div style="flex:1;background:#c94030"></div>
      <div style="flex:1;background:#c49a10"></div><div style="flex:1;background:#2e8a55"></div>
    </div>
  </div>`

  // ── KAZALO ─────────────────────────────────────────────────────────────────
  const tocPage = `<div style="width:210mm;min-height:297mm;padding:0;position:relative;break-after:page;background:#fafaf8;display:flex;flex-direction:column;overflow:hidden">
    <div style="display:flex;height:4px;flex-shrink:0">
      <div style="flex:1;background:#4a7ab5"></div><div style="flex:1;background:#c94030"></div>
      <div style="flex:1;background:#c49a10"></div><div style="flex:1;background:#2e8a55"></div>
    </div>
    <div style="padding:14mm 14mm 0;flex:1">
      <div style="font-size:7px;text-transform:uppercase;letter-spacing:0.1em;color:#bbb;margin-bottom:6px">Barvni kompas · Športni profil</div>
      <div style="font-size:24px;font-weight:800;color:#1a1a1a;letter-spacing:-0.02em;margin-bottom:4px">${d.ime}</div>
      <div style="font-size:11px;color:${mc};font-weight:600;margin-bottom:4px">${d.typeData.sl} · ${d.variant}</div>
      ${d.sport||d.pozicija?`<div style="font-size:10px;color:#888;margin-bottom:20px">${[d.sport,d.pozicija].filter(Boolean).join(' · ')}</div>`:'<div style="margin-bottom:20px"></div>'}
      <div style="height:1px;background:linear-gradient(to right,#e5e0d8,transparent);margin-bottom:20px"></div>
      <div style="font-size:12px;color:#4a4a4a;line-height:1.85;margin-bottom:24px;max-width:440px">
        Ta profil je nastal na podlagi Jungove tipologije in Barvni kompas metodologije. Pred vami je analiza osebnostnega sloga in vedenjskih vzorcev — pripravljena kot orodje za trenerja in športnika za boljše razumevanje in razvoj.
      </div>
      <div style="font-size:9px;font-weight:600;color:#bbb;margin-bottom:14px">Vsebina poročila</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
        ${[
          {num:'01',title:'Barvni profil',desc:'Grafični prikaz profila, osebnostni tip in jungianski arhetip',color:'#1a1a1a'},
          {num:'02',title:'Mentalna pripravljenost',desc:'Priprava na tekmo, mentalni reset, flow stanje in mentalna šibkost',color:'#2e8a55'},
          {num:'03',title:'Stil treninga',desc:'Pristop k treningu, učenje novih tehnik, odnos do napak in ponavljanja',color:mc},
          {num:'04',title:'Motivacija in pritisk',desc:'Motivacijski profil, odziv na pritisk tekme, poraz in zmago',color:mc},
          {num:'05',title:'Vloga v ekipi',desc:'Naravna vloga na igrišču, komunikacija s soigralci, prednosti',color:mc},
          {num:'06',title:'Slačilnica',desc:'Ekipna dinamika, vloga v skupini, vzdušje in reševanje konfliktov',color:'#2e8a55'},
          {num:'07',title:'Komunikacija s trenerjem',desc:'Kako dati feedback, kritika, pohvala, odnos z avtoriteto',color:'#2e8a55'},
          {num:'08',title:'Razvoj in izzivi',desc:'Področja za razvoj, ovire in konkretni koraki za napredek',color:'#2e8a55'},
          {num:'09',title:'Soigralci & Dinamika',desc:'Idealni soigralci, izzivi v ekipi in nasveti za ekipno dinamiko',color:'#c49a10'},
        ].map((item,i)=>`<div style="display:flex;align-items:flex-start;gap:12px;padding:10px 14px;border-bottom:0.5px solid #f0ece4;${i%2===0?'border-right:0.5px solid #f0ece4':''}">
          <div style="font-size:18px;font-weight:800;color:${item.color};opacity:0.15;flex-shrink:0;line-height:1;margin-top:2px">${item.num}</div>
          <div style="flex:1">
            <div style="font-size:11px;font-weight:700;color:#1a1a1a;margin-bottom:3px">${item.title}</div>
            <div style="font-size:9px;color:#888;line-height:1.5">${item.desc}</div>
          </div>
        </div>`).join('')}
      </div>
    </div>
    <div style="display:flex;height:3px;flex-shrink:0;margin-top:14px">
      <div style="flex:1;background:#4a7ab5"></div><div style="flex:1;background:#c94030"></div>
      <div style="flex:1;background:#c49a10"></div><div style="flex:1;background:#2e8a55"></div>
    </div>
  </div>`

  // ── BARVNI PROFIL STRAN ────────────────────────────────────────────────────
  const CD={B:{name:'Analitična modra',fears:'Iracionalnost, nepopolnost, zmeda',pressure:'Zapre se vase, postane pretirano kritičen'},R:{name:'Aktivna rdeča',fears:'Izguba nadzora, neučinkovitost',pressure:'Postane direktiven, diktatorski, nestrpen'},G:{name:'Stabilna zelena',fears:'Konflikt, spremembe brez razloga',pressure:'Se umakne, postane pasivno-agresiven'},Y:{name:'Navdušena rumena',fears:'Zavrnitev, ignoriranje, rutina',pressure:'Dramatizira, postane kaotičen'}}

  const FAMOUS = {
    BB:[['Kobe Bryant','🏀','Košarka','Enak perfekcionizem — analizira do zadnjega detajla, v ključnih trenutkih odloča sam'],['Roger Federer','🎾','Tenis','Metodičen pristop k treningu, natančnost v izvedbi, hladen pod pritiskom'],['Jan Oblak','⚽','Nogomet','Sistematičen, analitičen, zanesljiv — drži ekipo skupaj z mirnostjo']],
    BR:[['Kobe Bryant','🏀','Košarka','Analitičnost z neustavljivo odločnostjo — kombinacija ki osvaja naslove'],['Cristiano Ronaldo','⚽','Nogomet','Perfekcionizem in odločnost — vsak trening optimizira za maksimalen rezultat'],['Michael Phelps','🏊','Plavanje','Strogo strukturiran trening z jasnimi cilji in pogumom v finalih']],
    RR:[['Michael Jordan','🏀','Košarka','Dominanten, tekmovalen, ne sprejme poraza — poganja ekipo z energijo'],['Cristiano Ronaldo','⚽','Nogomet','Neustavljiva pogonska sila, zahteva od sebe in ekipe maksimum'],['Novak Djokovic','🎾','Tenis','Mentalna trdnost in odločnost v ključnih točkah']],
    RG:[['LeBron James','🏀','Košarka','Vodja ki skrbi za ekipo — odločen in empatičen hkrati'],['Luka Dončić','🏀','Košarka','Kreativno vodenje z razumevanjem soigralcev'],['Zinedine Zidane','⚽','Nogomet','Tih vodja ki vodi z zgledom in razume dinamiko ekipe']],
    RY:[['Magic Johnson','🏀','Košarka','Karizmatičen vodja ki navdušuje ekipo — odločen in optimističen'],['Goran Dragic','🏀','Košarka','Odločen z visokim optimizmom — poganja ekipo v težkih trenutkih'],['Zlatan Ibrahimovic','⚽','Nogomet','Samozavesten, direkten, z energijo ki prenaša na soigralce']],
    GG:[['Tim Duncan','🏀','Košarka','Tihi vodja ki drži ekipo skupaj — zanesljiv, stabilen, empatičen'],['Lionel Messi','⚽','Nogomet','Globoka empatija do soigralcev, gradi dolgoročne odnose'],['Jan Oblak','⚽','Nogomet','Miren, zanesljiv, ekipa mu zaupa v najtežjih trenutkih']],
    GB:[['Tony Parker','🏀','Košarka','Empatija z analitičnostjo — razume ekipo in igra taktično'],['Xavi Hernandez','⚽','Nogomet','Sistematičen in sočuten — organizira igro z razumevanjem vseh'],['Primož Roglič','🚴','Kolesarstvo','Metodičen in ekipno usmerjen — zmaga z ekipo ne sam']],
    YY:[['Shaquille ONeal','🏀','Košarka','Energija in optimizem ki dviguje celotno ekipo'],['Neymar Jr','⚽','Nogomet','Ustvarjalnost in spontanost — vnaša igrivost v ekipo'],['Usain Bolt','🏅','Atletika','Karizmatičen in pozitiven — pritegne pozornost in navdušuje']],
    YG:[['Steve Nash','🏀','Košarka','Komunikativen in skrben — razume potrebe soigralcev in jih dviga'],['Ronaldinho','⚽','Nogomet','Igrivost in skrb za vzdušje — slačilnica je vedno pozitivna'],['Draymond Green','🏀','Košarka','Optimizem z empatijo — energizira ekipo in skrbi za vsakega']],
    YR:[['Magic Johnson','🏀','Košarka','Optimizem z odločnostjo — navdušuje in zahteva hkrati'],['Vlade Divac','🏀','Košarka','Energičen vodja ki motivira z dobro voljo in trdnostjo'],['Tina Maze','⛷️','Smučanje','Pogumna, odločna, z optimizmom ki ji daje krila']],
  }

  const TEAMMATES = {
    B: {
      ideal:[['Spontani improvizator','Doda ustvarjalnost in hitrost odločanja ki mu manjka — skupaj pokrijeta celoten spekter'],['Ekipni vezni člen','Skrbi za harmonijo in komunikacijo — omogoča fokus na analizo'],['Akcijski izvajalec','Prevzame pobudo ko je potrebna hitra odločitev — dopolnjujeta se pri protinapadih']],
      izzivi:[['Drug analitik','Preveč analize in premalo akcije — ekipa potrebuje koga ki bo prekinil paralizo'],['Kaotični improvizator','Frustrira z nepredvidljivostjo — potreben dogovor o strukturi'],['Dominanten vodja','Tekmovanje za taktično vodenje — potrebna jasna razdelitev vlog']]
    },
    R: {
      ideal:[['Stabilen izvajalec','Izvaja odločitve brez ugovorov — idealna kombinacija vodja+izvajalec'],['Analitičen svetovalec','Doda podatkovni temelj k odločitvam — skupaj sta neustavljiva'],['Energičen motivator','Doda optimizem in vzdušje — skupaj poganjata ekipo k maksimumu']],
      izzivi:[['Drug dominanten vodja','Konflikt za vodstvo — potrebna jasna razdelitev področij'],['Počasen analitik','Frustracija z tempom odločanja — dogovor o časovnicah je ključen'],['Pasivni opazovalec','Razburja ga neaktivnost — potrebuje soigralca ki prevzame pobudo']]
    },
    G: {
      ideal:[['Odločni vodja','Prevzame vodstvo ki se mu izogiba — skupaj pokrijeta vse situacije'],['Analitičen organizator','Skupaj gradita zaupanje in strukturo — ekipa se zanese nanju'],['Energičen optimist','Doda pozitivno energijo — vzdušje postane odlično']],
      izzivi:[['Konflikten tip','Izogiba se direktnim soočenjem — potrebna strategija reševanja'],['Agresiven tekmovalec','Intenzivnost ga izčrpava — potreben dogovor o spoštovanju'],['Neempatičen analitik','Hladen pristop ga odvrača — potrebujeta čas za vzpostavitev zaupanja']]
    },
    Y: {
      ideal:[['Strukturiran organizator','Da strukturo njegovi ustvarjalnosti — skupaj sta inovativna in učinkovita'],['Stabilen izvajalec','Uresniči ideje z zanesljivostjo — idealna kombinacija vizije in izvedbe'],['Energičen soborec','Skupaj ustvarjata neustavljivo dinamiko na igrišču']],
      izzivi:[['Rigiden perfekcionis','Zavira spontanost — potrebuje prostor za improvizacijo'],['Introvertni tihi tip','Težko vzpostavi energijsko izmenjavo — potrebna aktivnejša komunikacija'],['Drug karizmatičen vodja','Tekmovanje za pozornost — potrebna jasna razdelitev vlog']]
    },
  }

  const famKey = lc + d.sec
  const famAthletes = FAMOUS[famKey] || FAMOUS[lc+lc] || FAMOUS.BB
  const teammates = TEAMMATES[lc] || TEAMMATES.B

  const profilePage = `<div style="width:210mm;min-height:297mm;padding:10mm 14mm 18mm;position:relative;break-after:page;background:#fafaf8">
    ${hdr('Barvni profil','Osebnostni tip')}
    <div style="display:flex;gap:16px;margin-bottom:10px;align-items:center">
      <div>${wheel(d.con,150)}</div>
      <div style="flex:1">
        <div style="background:#1a1a1a;color:white;border-radius:9px;padding:9px 13px;margin-bottom:7px">
          <div style="font-size:6.5px;text-transform:uppercase;letter-spacing:0.09em;opacity:0.3;margin-bottom:3px">Osebnostni tip</div>
          <div style="font-size:17px;font-weight:800;margin-bottom:2px">${d.typeData.sl}</div>
          <div style="font-size:9px;opacity:0.75;line-height:1.6">${d.typeData.desc}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px">
          ${['B','R','G','Y'].map(k=>`<div style="background:${CLR_L[k]};border-radius:7px;padding:7px 9px">
            <div style="font-size:7px;font-weight:700;color:${CLR_D[k]};text-transform:uppercase;margin-bottom:2px">${CD[k].name}</div>
            <div style="font-size:15px;font-weight:800;color:${CLR[k]}">${d.con[k].toFixed(1)}</div>
            <div style="height:3px;background:${CLR[k]}22;border-radius:2px;overflow:hidden;margin-top:3px">
              <div style="height:100%;width:${(d.con[k]/6*100)}%;background:${CLR[k]};border-radius:2px"></div>
            </div>
          </div>`).join('')}
        </div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:10px">
      ${[d.leadColor,d.sec].map((k,i)=>`<div style="background:${CLR_L[k]};border:1px solid ${CLR[k]}22;border-radius:8px;padding:8px 12px">
        <div style="font-size:6.5px;font-weight:800;text-transform:uppercase;color:${CLR_D[k]};margin-bottom:2px">${i===0?'Primarna':'Sekundarna'} energija</div>
        <div style="font-size:12px;font-weight:700;color:${CLR_D[k]};margin-bottom:4px">${CD[k].name}</div>
        <div style="font-size:9px;color:${CLR_D[k]};line-height:1.5"><strong>Pod pritiskom:</strong> ${CD[k].pressure}</div>
      </div>`).join('')}
    </div>

    <div style="margin-bottom:10px">
      <div style="font-size:10px;font-weight:700;color:#1a1a1a;margin-bottom:7px;padding-bottom:4px;border-bottom:1px solid #e8e4df">⭐ Znani športniki s podobnim profilom</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px">
        ${famAthletes.map(([name,icon,sport,why])=>`<div style="background:white;border:1px solid #e8e4df;border-radius:8px;padding:9px 11px">
          <div style="font-size:16px;margin-bottom:4px">${icon}</div>
          <div style="font-size:11px;font-weight:700;color:#1a1a1a;margin-bottom:1px">${name}</div>
          <div style="font-size:8px;color:${mc};font-weight:600;margin-bottom:5px">${sport}</div>
          <div style="font-size:8.5px;color:#666;line-height:1.5">${why}</div>
        </div>`).join('')}
      </div>
    </div>

    ${ftr('Barvni profil')}
  </div>`

  // ── ŠPORTNE SEKCIJE ────────────────────────────────────────────────────────
  // Parser za mentalno pripravljenost
  function parseMentalna(txt) {
    if(!txt) return {}
    const result = {}
    const blocks = ['Priprava na tekmo','Mentalni reset','Flow stanje','Mentalna šibkost']
    const keys = ['priprava','reset','flow','slabost']
    // Najprej poišči vse pozicije markerjev
    const positions = blocks.map(block => {
      let idx = txt.indexOf('**' + block + ':**')
      let skip = block.length + 5
      if(idx < 0) { idx = txt.indexOf(block + ':'); skip = block.length + 1 }
      return {idx, skip}
    })
    // Besedilo pred prvim markerjem = priprava na tekmo
    const firstMarker = positions.find(p => p.idx >= 0)
    if(firstMarker && firstMarker.idx > 0) {
      const before = txt.slice(0, firstMarker.idx).trim()
      if(before) result.priprava = before
    }
    // Ostali bloki
    positions.forEach(({idx, skip}, i) => {
      if(idx < 0) return
      let nextIdx = txt.length
      positions.slice(i+1).forEach(p => {
        if(p.idx > 0 && p.idx < nextIdx) nextIdx = p.idx
      })
      result[keys[i]] = txt.slice(idx + skip, nextIdx).trim()
    })
    if(Object.keys(result).length === 0 && txt.trim()) result.priprava = txt.trim()
    return result
  }

  const mentalna = parseMentalna(texts.sport_mentalna)

  const mentalnaPage = texts.sport_mentalna ? `<div style="width:210mm;min-height:297mm;padding:10mm 14mm 18mm;position:relative;break-after:page;background:#fafaf8">
    ${hdr('Mentalna pripravljenost','Športni profil')}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
      ${mentalna.priprava ? `<div style="background:#e6f5ee;border-radius:10px;padding:13px 15px">
        <div style="font-size:9px;font-weight:700;color:#1a5c38;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">🎯 Priprava na tekmo</div>
        <div style="font-size:10.5px;color:#1a5c38;line-height:1.7">${mentalna.priprava}</div>
      </div>` : ''}
      ${mentalna.reset ? `<div style="background:#faeaea;border-radius:10px;padding:13px 15px">
        <div style="font-size:9px;font-weight:700;color:#a8291a;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">🔄 Mentalni reset</div>
        <div style="font-size:10.5px;color:#a8291a;line-height:1.7">${mentalna.reset}</div>
      </div>` : ''}
      ${mentalna.flow ? `<div style="background:#e8f0fa;border-radius:10px;padding:13px 15px">
        <div style="font-size:9px;font-weight:700;color:#1a4a7a;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">⚡ Flow stanje</div>
        <div style="font-size:10.5px;color:#1a4a7a;line-height:1.7">${mentalna.flow}</div>
      </div>` : ''}
      ${mentalna.slabost ? `<div style="background:#fdf6e3;border-radius:10px;padding:13px 15px">
        <div style="font-size:9px;font-weight:700;color:#8a6200;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">⚠ Mentalna šibkost</div>
        <div style="font-size:10.5px;color:#8a6200;line-height:1.7">${mentalna.slabost}</div>
      </div>` : ''}
    </div>
    ${ftr('Mentalna pripravljenost')}
  </div>` : ''

  const sportPage1 = (texts.sport_trening||texts.sport_motivacija) ? `<div style="width:210mm;min-height:297mm;padding:10mm 14mm 18mm;position:relative;break-after:page;background:#fafaf8">
    ${hdr('Trening & Motivacija','Športni profil')}
    ${section('Stil treninga', texts.sport_trening, mc)}
    ${section('Motivacija in pritisk', texts.sport_motivacija, '#c94030')}
    ${ftr('Trening & Motivacija')}
  </div>` : ''

  const sportPage2 = (texts.sport_vloga||texts.sport_slacilnica) ? `<div style="width:210mm;min-height:297mm;padding:10mm 14mm 18mm;position:relative;break-after:page;background:#fafaf8">
    ${hdr('Ekipa & Vloga','Športni profil')}
    ${section('Vloga v ekipi', texts.sport_vloga, '#2e8a55')}
    ${section('Slačilnica in ekipna dinamika', texts.sport_slacilnica, '#c49a10')}
    ${ftr('Ekipa & Vloga')}
  </div>` : ''

  const sportPage3 = (texts.sport_trener||texts.sport_razvoj) ? `<div style="width:210mm;min-height:297mm;padding:10mm 14mm 18mm;position:relative;break-after:page;background:#fafaf8">
    ${hdr('Trener & Razvoj','Športni profil')}
    ${section('Komunikacija s trenerjem', texts.sport_trener, '#4a7ab5')}
    ${section('Razvoj in izzivi', texts.sport_razvoj, '#2e8a55')}
    ${ftr('Trener & Razvoj')}
  </div>` : ''

  const sportPage4 = texts.sport_soigralci ? `<div style="width:210mm;min-height:297mm;padding:10mm 14mm 18mm;position:relative;break-after:page;background:#fafaf8">
    ${hdr('Soigralci & Dinamika','Športni profil')}
    ${renderSoigralci(texts.sport_soigralci)}
    ${ftr('Soigralci & Dinamika')}
  </div>` : ''

  const sportStresPage = (texts.sport_stres||texts.sport_regen) ? `<div style="width:210mm;min-height:297mm;padding:10mm 14mm 18mm;position:relative;break-after:page;background:#fafaf8">
    ${hdr('Stres & Regeneracija','Za trenerja')}

    ${texts.sport_stres?`<div style="margin-bottom:16px;break-inside:avoid">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div style="width:3px;height:18px;background:#c94030;border-radius:2px;flex-shrink:0"></div>
        <div style="font-size:14px;font-weight:700;color:#1a1a1a;letter-spacing:-0.01em">Stres in opozorilni znaki</div>
      </div>
      <div style="background:#faeaea;border:1px solid #c9403022;border-radius:10px;padding:14px 16px">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#a8291a;margin-bottom:8px">⚠ Opozorilni znaki</div>
        <div style="font-size:11px;color:#4a4a4a;line-height:1.85">${texts.sport_stres}</div>
      </div>
    </div>`:''}

    ${texts.sport_regen?`<div style="margin-bottom:16px;break-inside:avoid">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div style="width:3px;height:18px;background:#2e8a55;border-radius:2px;flex-shrink:0"></div>
        <div style="font-size:14px;font-weight:700;color:#1a1a1a;letter-spacing:-0.01em">Regeneracija in ravnovesje</div>
      </div>
      <div style="background:#e6f5ee;border:1px solid #2e8a5522;border-radius:10px;padding:14px 16px">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#1a5c38;margin-bottom:8px">✓ Kako pomagati</div>
        <div style="font-size:11px;color:#4a4a4a;line-height:1.85">${texts.sport_regen}</div>
      </div>
    </div>`:''}

    <div style="background:#111;color:white;border-radius:10px;padding:12px 16px">
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;opacity:0.4;margin-bottom:6px">Sporočilo za trenerja</div>
      <div style="font-size:10.5px;opacity:0.82;line-height:1.8">Mentalna obremenitev v športu je resnična. Ko prepoznate opozorilne znake pri ${ime1rod}, ukrepajte proaktivno — ne čakajte na poraz ali poškodbo. Regeneracija ni luksuz, je del treninga.</div>
    </div>

    ${ftr('Stres & Regeneracija')}
  </div>` : ''

  return `<!DOCTYPE html><html lang="sl"><head><meta charset="UTF-8"/>
<style>* { box-sizing:border-box; margin:0; padding:0; } body { font-family:-apple-system,'Helvetica Neue',Arial,sans-serif; background:#fafaf8; color:#1a1a1a; } @page { margin:0mm; }</style>
</head><body>
${coverPage}${tocPage}${profilePage}${mentalnaPage}${sportPage1}${sportPage2}${sportPage3}${sportStresPage}${sportPage4}
</body></html>`
}


// ─── PDF SPORT TIM ENDPOINT ───────────────────────────────────────────────────
app.post('/api/pdf-sport-tim', async (req, res) => {
  const { chromium } = require('playwright')
  const fs = require('fs'), os = require('os'), path = require('path')
  const { teamProfiles, teamStats, analiza, date } = req.body
  try {
    const html = generateSportTimPdfHtml(teamProfiles, teamStats, analiza, date)
    const tmpDir = os.tmpdir(), ts = Date.now()
    const pdfPath = path.join(tmpDir, `sport-tim-${ts}.pdf`)
    const browser = await chromium.launch()
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, margin: { top:'0mm', right:'0mm', bottom:'0mm', left:'0mm' } })
    await browser.close()
    const pdfBuf = fs.readFileSync(pdfPath)
    try { fs.unlinkSync(pdfPath) } catch(e) {}
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="sport-tim-${ts}.pdf"`)
    res.send(pdfBuf)
  } catch(err) {
    console.error('PDF Sport Tim error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ─── PDF SPORT TIM GENERATOR ─────────────────────────────────────────────────
function generateSportTimPdfHtml(teamProfiles, teamStats, analiza, date) {
  const CLR = {B:'#4a7ab5',R:'#c94030',G:'#2e8a55',Y:'#c49a10'}
  const CLR_L = {B:'#e8f0fa',R:'#faeaea',G:'#e6f5ee',Y:'#fdf6e3'}
  const CLR_D = {B:'#1a4a7a',R:'#a8291a',G:'#1a5c38',Y:'#8a6200'}
  const NAMES = {B:'Analitična modra',R:'Aktivna rdeča',G:'Stabilna zelena',Y:'Navdušena rumena'}

  function hdr(label, right='') {
    return `<div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:8px">
        <div>
          <div style="font-size:7px;text-transform:uppercase;letter-spacing:0.1em;color:#bbb;margin-bottom:3px">Barvni kompas · Šport · ${label}</div>
          <div style="font-size:14px;font-weight:700;color:#1a1a1a">Ekipna analiza</div>
        </div>
        <div style="font-size:9px;color:#bbb">${right}</div>
      </div>
      <div style="height:2px;background:linear-gradient(to right,#2e8a55,#2e8a5544,transparent)"></div>
    </div>`
  }

  function ftr(right) {
    return `<div style="position:absolute;bottom:8mm;left:14mm;right:14mm;display:flex;justify-content:space-between;font-size:7.5px;color:#ccc;border-top:0.5px solid #ede9e3;padding-top:4px"><span>Šport Tim · Barvni kompas</span><span>${right}</span></div>`
  }

  function section(title, text, color) {
    if(!text) return ''
    return `<div style="margin-bottom:16px;break-inside:avoid">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <div style="width:3px;height:18px;background:${color||'#2e8a55'};border-radius:2px;flex-shrink:0"></div>
        <div style="font-size:13px;font-weight:700;color:#1a1a1a">${title}</div>
      </div>
      <div style="font-size:11px;color:#4a4a4a;line-height:1.85;padding-left:11px;border-left:1px solid #f0ece4">${text}</div>
    </div>`
  }

  function boldSection(title, text, color) {
    if(!text) return ''
    const items = []
    for(const line of text.split('\n').filter(l=>l.trim())) {
      const t = line.replace(/^[•\-\*\d\.]+\s*/,'').trim()
      if(!t) continue
      const m = t.match(/^\*\*(.+?)\*\*\s*[-–:]?\s*(.*)$/)
      if(m) { items.push({title:m[1].trim(),desc:m[2].trim()}); continue }
      items.push({title:'',desc:t})
    }
    if(!items.length) return ''
    return `<div style="margin-bottom:16px;break-inside:avoid">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <div style="width:3px;height:18px;background:${color||'#2e8a55'};border-radius:2px;flex-shrink:0"></div>
        <div style="font-size:13px;font-weight:700;color:#1a1a1a">${title}</div>
      </div>
      ${items.map((item,i)=>`<div style="padding:6px 0 6px 11px;border-left:1px solid #f0ece4;${i<items.length-1?'border-bottom:0.5px solid #f5f2ee':''}">
        ${item.title?`<div style="font-size:11px;font-weight:700;color:#1a1a1a;margin-bottom:2px">${item.title}</div>`:''}
        ${item.desc?`<div style="font-size:10.5px;color:#5a5a5a;line-height:1.65">${item.desc}</div>`:''}
      </div>`).join('')}
    </div>`
  }

  // Naslovnica
  const sport = teamProfiles[0]?.sport || ''
  const coverPage = `<div style="width:210mm;height:297mm;background:#fafaf8;display:flex;flex-direction:column;overflow:hidden;break-after:page">
    <div style="display:flex;height:5px;flex-shrink:0">
      <div style="flex:1;background:#2e8a55"></div><div style="flex:1;background:#4a7ab5"></div>
      <div style="flex:1;background:#c94030"></div><div style="flex:1;background:#c49a10"></div>
    </div>
    <div style="padding:44px 52px 0;flex-shrink:0">
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:20px">
        <div style="width:28px;height:28px;border-radius:50%;background:conic-gradient(#4a7ab5 0deg 90deg,#c94030 90deg 180deg,#c49a10 180deg 270deg,#2e8a55 270deg 360deg);flex-shrink:0"></div>
        <div style="font-size:8.5px;letter-spacing:0.12em;text-transform:uppercase;color:#bbb">Barvni kompas</div>
        <div style="background:#e6f5ee;color:#1a5c38;border-radius:20px;padding:3px 10px;font-size:8px;font-weight:700;text-transform:uppercase">⚽ Ekipna analiza</div>
      </div>
      ${sport?`<div style="font-size:12px;color:#2e8a55;font-weight:600;margin-bottom:8px">${sport}</div>`:''}
      <div style="font-size:8px;letter-spacing:0.1em;text-transform:uppercase;color:#2e8a55;margin-bottom:16px;font-weight:600">Športni tim</div>
      <div style="font-size:52px;font-weight:800;color:#1a1a1a;line-height:0.95;margin-bottom:18px;letter-spacing:-0.03em">Naša ekipa</div>
      <div style="font-size:11px;color:#bbb;margin-bottom:32px">${date}</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${teamProfiles.map(p=>`<div style="display:flex;align-items:center;gap:10px">
          <div style="width:8px;height:8px;border-radius:50%;background:${CLR[p.leadColor]};flex-shrink:0"></div>
          <div style="font-size:13px;font-weight:500">${p.ime}</div>
          <div style="font-size:10px;color:#aaa">${p.pozicija||''}</div>
        </div>`).join('')}
      </div>
    </div>
    <div style="flex:1;display:flex;align-items:center;justify-content:center">
      <div style="display:flex;gap:12px">
        ${['B','R','G','Y'].map(k=>`<div style="text-align:center">
          <div style="width:52px;height:52px;border-radius:50%;background:${CLR_L[k]};border:3px solid ${CLR[k]};display:flex;align-items:center;justify-content:center;margin:0 auto 6px">
            <span style="font-size:14px;font-weight:800;color:${CLR[k]}">${teamStats.avg[k].toFixed(1)}</span>
          </div>
          <div style="font-size:7px;color:${CLR_D[k]};font-weight:700;text-transform:uppercase">${{B:'Analitičnost',R:'Odločnost',G:'Empatija',Y:'Optimizem'}[k]}</div>
        </div>`).join('')}
      </div>
    </div>
    <div style="padding:0 52px 40px">
      <div style="font-size:10px;color:#bbb">${teamProfiles.length} članov · Barvni kompas Športna analiza</div>
    </div>
    <div style="display:flex;height:3px;flex-shrink:0">
      <div style="flex:1;background:#2e8a55"></div><div style="flex:1;background:#4a7ab5"></div>
      <div style="flex:1;background:#c94030"></div><div style="flex:1;background:#c49a10"></div>
    </div>
  </div>`

  // Analiza stran
  const analysisPage = `<div style="width:210mm;min-height:297mm;padding:10mm 14mm 18mm;position:relative;break-after:page;background:#fafaf8">
    ${hdr('Ekipna analiza','Za trenerja')}
    ${section('Kemija ekipe', analiza.kemija, '#2e8a55')}
    ${section('Pred-tekma protokol', analiza.predtekma, '#c49a10')}
    ${section('Krizni moment', analiza.kriza, '#c94030')}
    ${ftr('Ekipna analiza')}
  </div>`

  // Vloge + trening
  const vlogePage = `<div style="width:210mm;min-height:297mm;padding:10mm 14mm 18mm;position:relative;break-after:page;background:#fafaf8">
    ${hdr('Vloge & Trening','Za trenerja')}
    ${boldSection('Vloge v ekipi', analiza.vloge, '#4a7ab5')}
    ${section('Kako voditi trening', analiza.trening, '#2e8a55')}
    ${ftr('Vloge & Trening')}
  </div>`

  // Posameznik
  const posameznikPage = analiza.posameznik ? `<div style="width:210mm;min-height:297mm;padding:10mm 14mm 18mm;position:relative;break-after:page;background:#fafaf8">
    ${hdr('Kako delati s posameznikom','Za trenerja')}
    ${renderKakoDelati(analiza.posameznik)}
    ${ftr('Kako delati s posameznikom')}
  </div>` : ''

  // Profili tabela
  const profilesPage = `<div style="width:210mm;min-height:297mm;padding:10mm 14mm 18mm;position:relative;break-after:page;background:#fafaf8">
    ${hdr('Profili ekipe','Pregled')}
    <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:14px">
      <thead>
        <tr style="border-bottom:2px solid #e5e0d8">
          <th style="text-align:left;padding:6px 8px;color:#888;font-weight:600">Ime</th>
          <th style="text-align:left;padding:6px 8px;color:#888;font-weight:600">Pozicija</th>
          <th style="text-align:left;padding:6px 8px;color:#888;font-weight:600">Tip</th>
          ${['B','R','G','Y'].map(k=>`<th style="text-align:center;padding:6px 8px;color:${CLR[k]};font-weight:700">${{B:'Anal.',R:'Odl.',G:'Emp.',Y:'Opt.'}[k]}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${teamProfiles.map(p=>`<tr style="border-bottom:0.5px solid #f0ece4">
          <td style="padding:7px 8px;font-weight:600">${p.ime}</td>
          <td style="padding:7px 8px;color:#888;font-size:10px">${p.pozicija||'—'}</td>
          <td style="padding:7px 8px;color:#888;font-size:10px">${p.typeName||p.leadColor}</td>
          ${['B','R','G','Y'].map(k=>`<td style="text-align:center;padding:7px 8px;color:${CLR[k]};font-weight:${p.leadColor===k?700:400}">${p.con[k].toFixed(1)}</td>`).join('')}
        </tr>`).join('')}
        <tr style="border-top:2px solid #e5e0d8;background:#f9f7f4;font-weight:700">
          <td colspan="3" style="padding:7px 8px;color:#888;font-size:10px">POVPREČJE EKIPE</td>
          ${['B','R','G','Y'].map(k=>`<td style="text-align:center;padding:7px 8px;color:${CLR[k]};font-weight:700">${teamStats.avg[k].toFixed(1)}</td>`).join('')}
        </tr>
      </tbody>
    </table>
    ${ftr('Profili ekipe')}
  </div>`

  return `<!DOCTYPE html><html lang="sl"><head><meta charset="UTF-8"/>
<style>* { box-sizing:border-box; margin:0; padding:0; } body { font-family:-apple-system,'Helvetica Neue',Arial,sans-serif; background:#fafaf8; color:#1a1a1a; } @page { margin:0mm; }</style>
</head><body>
${coverPage}${profilesPage}${analysisPage}${vlogePage}${posameznikPage}
</body></html>`
}


// ─── LAUNCHER ────────────────────────────────────────────────────────────────
app.get('/launcher', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="sl">
<head>
<meta charset="UTF-8"/>
<title>Barvni kompas</title>
<style>
* { box-sizing:border-box; margin:0; padding:0; }
body { font-family:-apple-system,'Helvetica Neue',sans-serif; background:#f7f5f1; min-height:100vh; display:flex; align-items:center; justify-content:center; }
.card { background:white; border-radius:20px; padding:40px 48px; box-shadow:0 8px 40px rgba(0,0,0,0.10); max-width:440px; width:100%; text-align:center; }
.logo { width:52px;height:52px;border-radius:50%;background:conic-gradient(#4a7ab5 0deg 90deg,#c94030 90deg 180deg,#c49a10 180deg 270deg,#2e8a55 270deg 360deg);margin:0 auto 20px; }
h1 { font-family:Georgia,serif;font-size:22px;font-weight:600;margin-bottom:6px;color:#181818; }
.sub { font-size:13px;color:#888;margin-bottom:32px; }
.btn { display:block;width:100%;padding:16px 24px;border-radius:14px;border:none;cursor:pointer;font-family:inherit;font-size:15px;font-weight:500;text-decoration:none;margin-bottom:12px;transition:transform 0.15s,box-shadow 0.15s; }
.btn:hover { transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.12); }
.btn-admin { background:#181818;color:white; }
.btn-client { background:#e8f0fa;color:#1a4a7a;border:1.5px solid #4a7ab5; }
.btn-profiler { background:#f7f5f1;color:#444;border:1.5px solid #e5e0d8;font-size:13px;padding:12px 24px; }
.divider { display:flex;align-items:center;gap:12px;margin:4px 0 16px;color:#ccc;font-size:12px; }
.divider::before,.divider::after { content:'';flex:1;height:1px;background:#e5e0d8; }
.status { margin-top:24px;font-size:11px;color:#aaa; }
.dot { display:inline-block;width:7px;height:7px;border-radius:50%;background:#2e8a55;margin-right:5px;animation:pulse 2s infinite; }
@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
</style>
</head>
<body>
<div class="card">
  <div class="logo"></div>
  <h1>Barvni kompas</h1>
  <p class="sub">Izberite način uporabe</p>
  <a href="/admin" class="btn btn-admin">🔐 Admin panel</a>
  <a href="/oddaj" class="btn btn-client">📋 Vprašalnik za stranke</a>
  <div class="divider">ali</div>
  <a href="/" class="btn btn-profiler">⚡ Direktni profiler</a>
  <div class="status"><span class="dot"></span>Strežnik teče na localhost:3131</div>
</div>
</body>
</html>`)
})

// ─── ROUTING ─────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

const PORT = 3131
app.listen(PORT, () => {
  console.log(`✓ Insights Profiler teče na http://localhost:${PORT}`)
})
