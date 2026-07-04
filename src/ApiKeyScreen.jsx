import { useState } from 'react'

export default function ApiKeyScreen({ onKey }) {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if(!key.startsWith('sk-ant-')) return setError('API ključ mora začeti s sk-ant-')
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ apiKey: key, system: 'Test', prompt: 'Hi' })
      })
      const data = await res.json()
      if(data.error) { setError('Napačen API ključ: ' + data.error); setLoading(false); return }
      localStorage.setItem('insights_api_key', key)
      onKey(key)
    } catch(e) {
      setError('Napaka pri preverjanju ključa.')
      setLoading(false)
    }
  }

  return (
    <div style={{fontFamily:'system-ui,sans-serif',minHeight:'100vh',background:'#f7f5f1',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:'white',borderRadius:20,padding:'40px 44px',maxWidth:440,width:'100%',boxShadow:'0 8px 40px rgba(0,0,0,.08)'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:28}}>
          <div style={{width:40,height:40,borderRadius:'50%',background:'conic-gradient(#4a7ab5 0deg 90deg,#c94030 90deg 180deg,#c49a10 180deg 270deg,#2e8a55 270deg 360deg)'}}/>
          <div>
            <div style={{fontFamily:'Georgia,serif',fontSize:18,fontWeight:600}}>Barvni kompas</div>
            <div style={{fontSize:12,color:'#888'}}>Vnesi Anthropic API ključ</div>
          </div>
        </div>
        <div style={{fontSize:13,color:'#6b6460',lineHeight:1.7,marginBottom:20}}>
          Za delovanje profilerja potrebuješ Anthropic API ključ. Ključ se shrani lokalno v brskalnik.
        </div>
        <input
          value={key}
          onChange={e=>setKey(e.target.value)}
          placeholder="sk-ant-api03-..."
          type="password"
          style={{width:'100%',padding:'10px 14px',border:'1.5px solid #e5e0d8',borderRadius:10,fontSize:13,fontFamily:'monospace',outline:'none',marginBottom:12,boxSizing:'border-box'}}
        />
        {error && <div style={{color:'#c94030',fontSize:12,marginBottom:12}}>{error}</div>}
        <button onClick={handleSubmit} disabled={loading||!key}
          style={{width:'100%',padding:13,background:loading||!key?'#ccc':'#181818',color:'white',border:'none',borderRadius:12,fontSize:15,fontWeight:500,cursor:loading||!key?'not-allowed':'pointer',fontFamily:'inherit'}}>
          {loading?'Preverjam...':'Potrdi ključ'}
        </button>
        <div style={{fontSize:11,color:'#aaa',marginTop:16,textAlign:'center'}}>
          Ključ dobiš na <a href="https://console.anthropic.com" target="_blank" style={{color:'#4a7ab5'}}>console.anthropic.com</a>
        </div>
      </div>
    </div>
  )
}
