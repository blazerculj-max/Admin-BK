import { useState } from 'react'

const SMAP = {L:0,'1':1,'2':2,'3':3,'4':4,'5':5,M:6}

const DEFAULT_QUESTIONS = [
  {B:'Sem natančen in metodičen',R:'Sem odločen in usmerjen v rezultate',G:'Sem empatičen in skrbim za odnose',Y:'Sem entuziastičen in optimističen'},
  {B:'Raje analiziram preden ukrepam',R:'Hitro ukrepam in sprejemam odločitve',G:'Poslušam in razumem druge',Y:'Iščem nove ideje in možnosti'},
  {B:'Cenim kakovost in natančnost',R:'Cenim učinkovitost in hitrost',G:'Cenim harmonijo in sodelovanje',Y:'Cenim ustvarjalnost in inovacije'},
  {B:'V konfliktih ostanem miren in analitičen',R:'V konfliktih sem direkten in odločen',G:'V konfliktih iščem kompromis',Y:'V konfliktih poskušam razbremeniti napetost'},
  {B:'Načrtujem skrbno vnaprej',R:'Osredotočam se na cilje',G:'Gradim zaupanje postopoma',Y:'Sledim navdihu in spontanosti'},
  {B:'Prednost dajem faktom in podatkom',R:'Prednost dajem rezultatom',G:'Prednost dajem ljudem',Y:'Prednost dajem viziji'},
  {B:'Sem sistematičen in organiziran',R:'Sem ambiciozen in pogumen',G:'Sem zvest in zanesljiv',Y:'Sem komunikativen in navdušujoč'},
  {B:'Raje delam samostojno in poglobljeno',R:'Raje vodim in usmerjam',G:'Raje sodelujem in podpiram',Y:'Raje navdušujem in motiviram'},
  {B:'Cenim strukturo in red',R:'Cenim nadzor in moč',G:'Cenim mir in stabilnost',Y:'Cenim zabavo in raznolikost'},
  {B:'Pod pritiskom postanem previdnejši',R:'Pod pritiskom sem bolj direkten',G:'Pod pritiskom se umaknem',Y:'Pod pritiskom dramatiziram'},
  {B:'Odločitve sprejemam na podlagi analize',R:'Odločitve sprejemam hitro in intuitivno',G:'Odločitve sprejemam po posvetovanju',Y:'Odločitve sprejemam na podlagi navdušenja'},
  {B:'Moja moč je v natančnosti',R:'Moja moč je v odločnosti',G:'Moja moč je v empatiji',Y:'Moja moč je v navduševanju'},
  {B:'Cenim mir in tišino pri delu',R:'Cenim izzive in tekmovalnost',G:'Cenim toplino in sprejetost',Y:'Cenim dinamično okolje'},
  {B:'Sem introvertirane narave',R:'Sem ekstrovertirane narave z močno voljo',G:'Sem introvertirane narave s toplim srcem',Y:'Sem ekstrovertirane narave s pozitivno energijo'},
  {B:'Iščem globino in razumevanje',R:'Iščem rezultate in dosežke',G:'Iščem harmonijo in smisel',Y:'Iščem navdih in možnosti'},
]

function loadQuestions() {
  try { const q=localStorage.getItem('insights_questions'); return q?JSON.parse(q):DEFAULT_QUESTIONS } catch { return DEFAULT_QUESTIONS }
}
const QUESTIONS = loadQuestions()

const COLORS = ['B','R','G','Y']
const COLOR_NAMES = {B:'Cool Blue',R:'Fiery Red',G:'Earth Green',Y:'Sunshine Yellow'}

function shuffle(arr, seed) {
  const a = [...arr]
  let s = seed
  for(let i=a.length-1;i>0;i--){
    s = (s*1664525+1013904223)&0xffffffff
    const j=Math.abs(s)%(i+1);
    [a[i],a[j]]=[a[j],a[i]]
  }
  return a
}

function validate(ans) {
  const v = Object.values(ans).filter(x=>x!==null)
  if(v.length<4) return 'incomplete'
  const lc=v.filter(x=>x==='L').length, mc=v.filter(x=>x==='M').length
  if(lc!==1) return `${lc}× L`
  if(mc!==1) return `${mc}× M`
  if(new Set(v).size!==4) return 'Vrednosti niso različne'
  return 'ok'
}

export default function ClientApp() {
  const [step, setStep] = useState('form') // form | questionnaire | done
  const [ime, setIme] = useState('')
  const [email, setEmail] = useState('')
  const [podjetje, setPodjetje] = useState('')
  const [spol, setSpol] = useState('m')
  const [answers, setAnswers] = useState(Array(15).fill(null).map(()=>({B:null,R:null,G:null,Y:null})))
  const [current, setCurrent] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const orders = QUESTIONS.map((_,i) => shuffle(COLORS, i*999+42))

  function setVal(qi, color, val) {
    setAnswers(prev => {
      const next = prev.map(a=>({...a}))
      // Odstrani isto vrednost iz druge barve
      Object.keys(next[qi]).forEach(k => {
        if(next[qi][k]===val) next[qi][k]=null
      })
      next[qi][color] = val
      return next
    })
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/submit', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ime, email, podjetje, spol, answers})
      })
      const data = await res.json()
      if(data.success) setStep('done')
      else setError(data.error || 'Napaka pri oddaji')
    } catch(e) {
      setError('Napaka pri pošiljanju. Preverite internetno povezavo.')
    }
    setSubmitting(false)
  }

  const CLR = {B:'#4a7ab5',R:'#c94030',G:'#2e8a55',Y:'#c49a10'}
  const CLR_L = {B:'#e8f0fa',R:'#faeaea',G:'#e6f5ee',Y:'#fdf6e3'}

  if(step==='done') return (
    <div style={{fontFamily:'system-ui,sans-serif',minHeight:'100vh',background:'#f7f5f1',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'white',borderRadius:20,padding:'48px 52px',maxWidth:480,textAlign:'center',boxShadow:'0 8px 40px rgba(0,0,0,.08)'}}>
        <div style={{fontSize:48,marginBottom:16}}>✅</div>
        <div style={{fontFamily:'Georgia,serif',fontSize:24,fontWeight:600,marginBottom:12}}>Hvala, {ime.split(' ')[0]}!</div>
        <div style={{fontSize:15,color:'#6b6460',lineHeight:1.7}}>Vaš vprašalnik je bil uspešno oddan. Vaš profil bomo pripravili in vam ga poslali v kratkem.</div>
      </div>
    </div>
  )

  if(step==='form') return (
    <div style={{fontFamily:'system-ui,sans-serif',minHeight:'100vh',background:'#f7f5f1',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{background:'white',borderRadius:20,padding:'40px 44px',maxWidth:460,width:'100%',boxShadow:'0 8px 40px rgba(0,0,0,.08)'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:28}}>
          <div style={{width:40,height:40,borderRadius:'50%',background:'conic-gradient(#4a7ab5 0deg 90deg,#c94030 90deg 180deg,#c49a10 180deg 270deg,#2e8a55 270deg 360deg)'}}/>
          <div>
            <div style={{fontFamily:'Georgia,serif',fontSize:18,fontWeight:600}}>Barvni kompas</div>
            <div style={{fontSize:12,color:'#888'}}>Osebnostni vprašalnik</div>
          </div>
        </div>
        <div style={{fontSize:13,color:'#6b6460',lineHeight:1.7,marginBottom:28}}>Prosimo, izpolnite svoje podatke preden začnete z vprašalnikom.</div>
        {['ime','email','podjetje'].map(field => (
          <div key={field} style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:600,color:'#888',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:5}}>
              {field==='ime'?'Ime in priimek':field==='email'?'E-pošta':'Podjetje'}
            </div>
            <input
              value={field==='ime'?ime:field==='email'?email:podjetje}
              onChange={e=>field==='ime'?setIme(e.target.value):field==='email'?setEmail(e.target.value):setPodjetje(e.target.value)}
              style={{width:'100%',padding:'10px 14px',border:'1.5px solid #e5e0d8',borderRadius:10,fontSize:14,fontFamily:'inherit',outline:'none'}}
              placeholder={field==='ime'?'Jana Novak':field==='email'?'jana@podjetje.si':'Podjetje d.o.o.'}
            />
          </div>
        ))}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:600,color:'#888',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:5}}>Spol</div>
          <div style={{display:'flex',gap:8}}>
            {[{v:'m',l:'Moški'},{v:'z',l:'Ženski'}].map(({v,l})=>(
              <button key={v} onClick={()=>setSpol(v)}
                style={{flex:1,padding:'10px',border:`1.5px solid ${spol===v?'#181818':'#e5e0d8'}`,borderRadius:10,fontSize:14,fontFamily:'inherit',background:spol===v?'#181818':'white',color:spol===v?'white':'#444',cursor:'pointer',fontWeight:spol===v?600:400}}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={()=>ime&&email?setStep('questionnaire'):setError('Izpolnite ime in e-pošto')}
          style={{width:'100%',padding:'13px',background:'#181818',color:'white',border:'none',borderRadius:12,fontSize:15,fontWeight:500,cursor:'pointer',marginTop:8,fontFamily:'inherit'}}>
          Začni vprašalnik →
        </button>
        {error&&<div style={{color:'#c94030',fontSize:13,marginTop:8,textAlign:'center'}}>{error}</div>}
      </div>
    </div>
  )

  const q = QUESTIONS[current]
  const a = answers[current]
  const order = orders[current]
  const vals = ['L','1','2','3','4','5','M']
  const vstat = validate(a)
  const allDone = answers.every(ans=>validate(ans)==='ok')

  return (
    <div style={{fontFamily:'system-ui,sans-serif',minHeight:'100vh',background:'#f7f5f1',padding:'20px'}}>
      <div style={{maxWidth:600,margin:'0 auto'}}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:32,height:32,borderRadius:'50%',background:'conic-gradient(#4a7ab5 0deg 90deg,#c94030 90deg 180deg,#c49a10 180deg 270deg,#2e8a55 270deg 360deg)'}}/>
            <span style={{fontFamily:'Georgia,serif',fontSize:15,fontWeight:600}}>Barvni kompas</span>
          </div>
          <div style={{fontSize:12,color:'#888'}}>{current+1} / {QUESTIONS.length}</div>
        </div>

        {/* Progress */}
        <div style={{height:4,background:'#e5e0d8',borderRadius:2,marginBottom:24,overflow:'hidden'}}>
          <div style={{height:'100%',background:'#181818',width:`${((current+1)/QUESTIONS.length)*100}%`,borderRadius:2,transition:'width .3s'}}/>
        </div>

        {/* Vprašanje */}
        <div style={{background:'white',borderRadius:16,padding:'24px',marginBottom:14,boxShadow:'0 2px 12px rgba(0,0,0,.06)'}}>
          <div style={{fontSize:11,fontWeight:600,color:'#888',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:14}}>
            Sklop {current+1}
          </div>
          <div style={{fontSize:12,color:'#888',marginBottom:16}}>
            Ocenite vsako trditev: <strong>L</strong> = najmanj podoben, <strong>M</strong> = najbolj podoben. Vsaka vrednost samo enkrat.
          </div>

          {order.map(k => (
            <div key={k} style={{marginBottom:12,padding:'12px 14px',background:'#f9f7f4',borderRadius:12,border:'1.5px solid transparent'}}>
              <div style={{fontSize:13,color:'#333',marginBottom:8,fontWeight:a[k]?500:400}}>{q[k]}</div>
              <div style={{display:'flex',gap:6}}>
                {vals.map(v => (
                  <button key={v} onClick={()=>setVal(current,k,v)}
                    style={{
                      width:36,height:36,borderRadius:8,border:'none',
                      background:a[k]===v?'#181818':'#e5e0d8',
                      color:a[k]===v?'white':'#666',
                      fontWeight:600,fontSize:12,cursor:'pointer',
                      fontFamily:'inherit',
                      opacity: a[k] && a[k]!==v && Object.values(a).includes(v) ? 0.35 : 1
                    }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {vstat!=='ok'&&vstat!=='incomplete'&&(
            <div style={{fontSize:12,color:'#c94030',marginTop:8}}>⚠ {vstat}</div>
          )}
        </div>

        {/* Navigacija */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <button onClick={()=>setCurrent(c=>Math.max(0,c-1))}
            disabled={current===0}
            style={{padding:'10px 20px',background:'none',border:'1.5px solid #e5e0d8',borderRadius:10,fontSize:13,color:'#666',cursor:'pointer',fontFamily:'inherit',opacity:current===0?.4:1}}>
            ← Nazaj
          </button>

          {current<QUESTIONS.length-1?(
            <button onClick={()=>vstat==='ok'&&setCurrent(c=>c+1)}
              disabled={vstat!=='ok'}
              style={{padding:'10px 24px',background:vstat==='ok'?'#181818':'#ccc',color:'white',border:'none',borderRadius:10,fontSize:13,fontWeight:500,cursor:vstat==='ok'?'pointer':'not-allowed',fontFamily:'inherit'}}>
              Naprej →
            </button>
          ):(
            <button onClick={handleSubmit}
              disabled={!allDone||submitting}
              style={{padding:'10px 24px',background:allDone&&!submitting?'#2e8a55':'#ccc',color:'white',border:'none',borderRadius:10,fontSize:13,fontWeight:500,cursor:allDone&&!submitting?'pointer':'not-allowed',fontFamily:'inherit'}}>
              {submitting?'Pošiljam...':'✓ Oddaj vprašalnik'}
            </button>
          )}
        </div>

        {/* Mini progress dots */}
        <div style={{display:'flex',justifyContent:'center',gap:5,marginTop:20}}>
          {QUESTIONS.map((_,i)=>{
            const s=validate(answers[i])
            return <div key={i} style={{width:8,height:8,borderRadius:'50%',
              background:s==='ok'?'#2e8a55':i===current?'#181818':'#e5e0d8',
              cursor:'pointer'}} onClick={()=>setCurrent(i)}/>
          })}
        </div>
      </div>
    </div>
  )
}
