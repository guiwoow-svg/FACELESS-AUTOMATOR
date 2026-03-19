import { useState, useRef, useEffect } from 'react'

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: 'es-MX', name: 'Espanhol (México/LatAm)' },
  { code: 'es-ES', name: 'Espanhol (Espanha)' },
  { code: 'es-AR', name: 'Espanhol (Argentina)' },
  { code: 'pt-BR', name: 'Português (Brasil)' },
  { code: 'pt-PT', name: 'Português (Portugal)' },
  { code: 'en-US', name: 'Inglês (EUA)' },
  { code: 'en-UK', name: 'Inglês (Reino Unido)' },
  { code: 'fr-FR', name: 'Francês' },
  { code: 'de-DE', name: 'Alemão' },
  { code: 'it-IT', name: 'Italiano' },
  { code: 'nl-NL', name: 'Holandês' },
  { code: 'ko-KR', name: 'Coreano' },
  { code: 'ja-JP', name: 'Japonês' },
  { code: 'hi-IN', name: 'Hindi' },
]

const NARRATOR_TONES = [
  { value: 'storyteller', label: '🔥 Contador de Histórias' },
  { value: 'investigator', label: '🔍 Investigador' },
  { value: 'advisor', label: '🤝 Conselheiro/Amigo' },
  { value: 'revealer', label: '💡 Revelador' },
  { value: 'preacher', label: '⚡ Pregador/Motivador' },
]

const DOMINANT_EMOTIONS = [
  { value: 'curiosity', label: '🧠 Curiosidade Intensa' },
  { value: 'hope', label: '✨ Esperança / Possibilidade' },
  { value: 'healthy_fear', label: '⚠️ Medo Saudável / Alerta' },
  { value: 'outrage', label: '😤 Indignação / Injustiça' },
  { value: 'inspiration', label: '🚀 Inspiração / Transformação' },
  { value: 'wonder', label: '🌌 Admiração / Mistério' },
]

const HOOK_TYPES = [
  { value: 'disturbing_question', label: '❓ Pergunta Perturbadora' },
  { value: 'shocking_fact', label: '💥 Fato Chocante / Estatística' },
  { value: 'personal_story', label: '📖 História Pessoal / Caso Real' },
  { value: 'controversy', label: '🔥 Provocação / Controvérsia' },
  { value: 'mystery', label: '🕵️ Mistério / Segredo' },
  { value: 'counterintuitive', label: '🔄 Afirmação Contraintuitiva' },
]

const RHYTHMS = [
  { value: 'fast_punchy', label: '⚡ Rápido e Direto' },
  { value: 'medium_fluid', label: '🌊 Médio e Fluido' },
  { value: 'slow_contemplative', label: '🌙 Lento e Contemplativo' },
]

const STATUS = {
  PENDING: 'PENDENTE',
  PROCESSING: 'PROCESSANDO',
  COMPLETED: 'CONCLUÍDO',
  FAILED: 'FALHOU',
}

const DEFAULT_CONFIG = {
  channelName: '',
  title: '',
  thumbText: '',
  objective: '',
  language: 'es-MX',
  characterLimit: 19000,
  narratorTone: 'storyteller',
  dominantEmotion: 'curiosity',
  hookType: 'disturbing_question',
  ctaBordao: '',
  narratorVoice: 'second_person',
  rhythm: 'medium_fluid',
  useDramaticPauses: true,
  useConcreteExamples: true,
  retentionLoops: true,
  avoidAcademic: true,
  includeDescription: true,
  includeThumbPrompt: true,
  includeBgPrompts: false,
  bgPromptsCount: 5,
}

// ─── CLAUDE API CALL (via backend proxy) ────────────────────────────────────

async function generateWithClaude(item: any): Promise<any> {
  const langLabel = LANGUAGES.find(l => l.code === item.language)?.name || item.language
  const toneLabel = NARRATOR_TONES.find(t => t.value === item.narratorTone)?.label || item.narratorTone
  const emotionLabel = DOMINANT_EMOTIONS.find(e => e.value === item.dominantEmotion)?.label || item.dominantEmotion
  const hookLabel = HOOK_TYPES.find(h => h.value === item.hookType)?.label || item.hookType
  const rhythmLabel = RHYTHMS.find(r => r.value === item.rhythm)?.label || item.rhythm

  const voiceMap: Record<string, string> = {
    first_person: 'Primeira pessoa (eu/nós)',
    second_person: 'Segunda pessoa (você/tu) — fala direto com o espectador',
    third_person: 'Terceira pessoa — narrador onisciente',
  }

  const systemPrompt = `Você é um roteirista de elite para canais faceless do YouTube. Seus roteiros são famosos por parecerem 100% humanos — emocionais, viscerais e absolutamente impossíveis de pausar.

## FILOSOFIA CENTRAL
Você não escreve textos. Você implanta experiências na mente do espectador.
Um bom roteiro faceless não informa — ele SEQUESTRA a atenção.

## REGRAS ABSOLUTAS DE LINGUAGEM
- ZERO linguagem acadêmica ou formal. Proibido: "destarte", "ademais", "no que tange", "conforme exposto", "portanto podemos concluir".
- Frases curtas. Muito curtas. Às vezes uma palavra só.
- Reticências e parênteses para respiração dramática — USE COM FREQUÊNCIA.
- Coloquial. Direto. Como um amigo que descobriu um segredo e não aguenta guardar.
- NUNCA comece frases com "É importante ressaltar que" ou variações.
- NUNCA use listas ou marcadores no roteiro — só prosa fluida TTS-ready.

## TÉCNICAS DE RETENÇÃO OBRIGATÓRIAS
${item.retentionLoops ? `- Open loops: prometa uma revelação cedo e adie a entrega.
- Cliffhangers internos a cada 2-3 minutos.
- Padrão de recompensa variável: pequenas revelações ao longo, guardando a maior pro final.` : '- Mantenha o fluxo narrativo coeso.'}
${item.useConcreteExamples ? `- Exemplos concretos OBRIGATÓRIOS: números específicos, comparações visuais, casos detalhados.` : ''}
- Perguntas retóricas frequentes para manter o espectador no diálogo interno.

## ESTRUTURA DO ROTEIRO
1. GANCHO (primeiros 30s): ${hookLabel} — brutal na abertura.
2. PROMESSA: o que o espectador ganha assistindo até o fim.
3. DESENVOLVIMENTO: tom ${toneLabel}, emoção dominante ${emotionLabel}.
4. PICO EMOCIONAL: momento de maior intensidade.
5. CTA BORDÃO: ${item.ctaBordao ? `inserir 2x organicamente: "${item.ctaBordao}"` : 'criar bordão natural para engajamento.'}
6. FECHAMENTO + TEASER: encerramento + gancho pro próximo vídeo.

## PARÂMETROS DESTE ROTEIRO
- Idioma: ${langLabel}${item.language.startsWith('es-MX') ? ' — registro coloquial mexicano/latino-americano.' : ''}
- Tom narrativo: ${toneLabel}
- Emoção dominante: ${emotionLabel}
- Tipo de gancho: ${hookLabel}
- Voz narrativa: ${voiceMap[item.narratorVoice] || item.narratorVoice}
- Ritmo: ${rhythmLabel}${item.rhythm === 'fast_punchy' ? ' — frases curtíssimas, parágrafos de 1-2 linhas.' : item.rhythm === 'slow_contemplative' ? ' — parágrafos mais longos, metáforas elaboradas.' : ''}
- Tamanho alvo: ${item.characterLimit.toLocaleString()} caracteres (prosa pura, sem marcações de cena)
- Canal: ${item.channelName || 'não especificado'}

## FORMATO DE SAÍDA
Responda APENAS com JSON válido, sem markdown, sem blocos de código:

{
  "script": "roteiro completo aqui",
  "thumbnailPrompt": ${item.includeThumbPrompt ? '"prompt JSON estruturado para thumbnail aqui"' : 'null'},
  "description": ${item.includeDescription ? '"descrição SEO YouTube aqui"' : 'null'},
  "backgroundPrompts": ${item.includeBgPrompts ? '"prompts separados por \\n---\\n"' : 'null'}
}

${item.includeThumbPrompt ? `THUMBNAIL: JSON com COMPOSITION (figura de autoridade central), TEXT (${item.thumbText || '2-4 palavras de impacto'}), LIGHTING (chiaroscuro dramático), CRITICAL_TEXT_INSTRUCTION (language_lock: ${item.language}, translate: false, render_as_written: true).` : ''}
${item.includeDescription ? `DESCRIÇÃO SEO: 150-200 palavras, curiosidade nos primeiros 2 parágrafos, formato com setas (►), CTA bordão embutido, hashtags mistas.` : ''}`

  const userPrompt = `Crie o roteiro completo:

TÍTULO: ${item.title}
TEXTO DA THUMBNAIL: ${item.thumbText || '(baseado no título)'}
OBJETIVO: ${item.objective || 'Roteiro faceless YouTube de alto engajamento'}
${item.ctaBordao ? `CTA BORDÃO: ${item.ctaBordao}` : ''}

Roteiro com ~${item.characterLimit.toLocaleString()} caracteres, TTS-ready, 100% humano.`

  const response = await fetch('/api/anthropic/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as any)?.error?.message || `HTTP ${response.status}`)
  }

  const data = await response.json()
  const rawText = (data.content as any[])?.map((b: any) => b.text || '').join('') || ''
  const clean = rawText.replace(/```json\n?|```\n?/g, '').trim()

  try {
    return JSON.parse(clean)
  } catch {
    return { script: rawText, thumbnailPrompt: null, description: null, backgroundPrompts: null }
  }
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────

function triggerDownload(content: string, filename: string) {
  try {
    const el = document.createElement('a')
    el.href = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }))
    el.download = filename
    document.body.appendChild(el)
    el.click()
    document.body.removeChild(el)
  } catch (e) { console.error('Download failed', e) }
}

function copyToClipboard(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  })
}

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          position: 'relative', width: 36, height: 20, borderRadius: 10,
          background: checked ? '#7c3aed' : '#1e293b',
          border: '1px solid ' + (checked ? '#7c3aed' : '#334155'),
          transition: 'all 0.2s', cursor: 'pointer', flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 2, width: 14, height: 14, background: '#fff',
          borderRadius: '50%', transition: 'transform 0.2s',
          transform: checked ? 'translateX(18px)' : 'translateX(2px)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </div>
      <span style={{ fontSize: 11, color: '#94a3b8' }}>{label}</span>
    </label>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0f172a', border: '1px solid #1e293b',
  color: '#e2e8f0', fontSize: 12, borderRadius: 8, padding: '8px 10px',
  outline: 'none', fontFamily: 'inherit',
}

function Input({ label, value, onChange, placeholder, textarea = false }: any) {
  return (
    <Field label={label}>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
            style={{ ...inputStyle, resize: 'none' }} />
        : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
      }
    </Field>
  )
}

function Select({ label, value, onChange, options }: any) {
  return (
    <Field label={label}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
        {options.map((o: any) => <option key={o.value || o.code} value={o.value || o.code}>{o.label || o.name}</option>)}
      </select>
    </Field>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    [STATUS.PENDING]: '#334155',
    [STATUS.PROCESSING]: '#5b21b6',
    [STATUS.COMPLETED]: '#065f46',
    [STATUS.FAILED]: '#7f1d1d',
  }
  const text: Record<string, string> = {
    [STATUS.PENDING]: '#94a3b8',
    [STATUS.PROCESSING]: '#c4b5fd',
    [STATUS.COMPLETED]: '#6ee7b7',
    [STATUS.FAILED]: '#fca5a5',
  }
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
      padding: '2px 7px', borderRadius: 6,
      background: colors[status] || '#1e293b',
      color: text[status] || '#94a3b8',
    }}>{status}</span>
  )
}

function Section({ title, children, accent = false }: any) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: `1px solid ${accent ? 'rgba(109,40,217,0.3)' : 'rgba(255,255,255,0.05)'}`,
      borderRadius: 14, padding: '14px 16px',
    }}>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: accent ? '#8b5cf6' : '#475569', marginBottom: 12 }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  )
}

// ─── RESULT MODAL ─────────────────────────────────────────────────────────────

function ResultModal({ item, onClose }: any) {
  const [tab, setTab] = useState('script')
  const [copied, setCopied] = useState('')

  const handleCopy = (text: string, key: string) => {
    copyToClipboard(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  const handleDownloadAll = () => {
    const r = item.result
    if (!r) return
    const lang = (item.language || 'XX').toUpperCase()
    const ch = item.channelName ? `[${item.channelName}] ` : ''
    const base = `${ch}${lang} ${(item.thumbText || item.title || 'roteiro').substring(0, 50)}`
    triggerDownload(r.script || '', `ROTEIRO ${base}.txt`)
    const div = '\n\n' + '='.repeat(40) + '\n\n'
    let meta = `TÍTULO: ${item.title}`
    if (item.channelName) meta += `\nCANAL: ${item.channelName}`
    if (r.thumbnailPrompt) meta += `${div}PROMPT THUMBNAIL:\n${r.thumbnailPrompt}`
    if (r.description) meta += `${div}DESCRIÇÃO SEO:\n${r.description}`
    if (r.backgroundPrompts) meta += `${div}BACKGROUND PROMPTS:\n${r.backgroundPrompts}`
    if (r.thumbnailPrompt || r.description) setTimeout(() => triggerDownload(meta, `META ${base}.txt`), 900)
  }

  const tabs = [
    { key: 'script', label: '📝 Roteiro', content: item.result?.script },
    ...(item.result?.thumbnailPrompt ? [{ key: 'thumb', label: '🖼 Thumbnail', content: item.result.thumbnailPrompt }] : []),
    ...(item.result?.description ? [{ key: 'desc', label: '📋 Descrição', content: item.result.description }] : []),
    ...(item.result?.backgroundPrompts ? [{ key: 'bg', label: '🎨 Backgrounds', content: item.result.backgroundPrompts }] : []),
  ]

  const activeTab = tabs.find(t => t.key === tab) || tabs[0]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#0f0f1a', border: '1px solid #1e293b', borderRadius: 18, width: '100%', maxWidth: 760, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
            <p style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{item.channelName || ''} · {LANGUAGES.find(l => l.code === item.language)?.name}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleDownloadAll} style={{ fontSize: 11, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, cursor: 'pointer' }}>⬇ Baixar Tudo</button>
            <button onClick={onClose} style={{ background: '#1e293b', color: '#94a3b8', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '10px 18px 0' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ fontSize: 10, fontWeight: 700, padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: tab === t.key ? '#7c3aed' : 'transparent', color: tab === t.key ? '#fff' : '#64748b', transition: 'all 0.15s' }}>{t.label}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '10px 18px 18px', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#475569' }}>{activeTab.content ? `${activeTab.content.length.toLocaleString()} chars` : ''}</span>
            <button onClick={() => handleCopy(activeTab.content || '', tab)} style={{ fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', background: copied === tab ? '#065f46' : '#1e293b', color: copied === tab ? '#6ee7b7' : '#94a3b8', transition: 'all 0.15s' }}>
              {copied === tab ? '✓ Copiado!' : 'Copiar'}
            </button>
          </div>
          <pre style={{ flex: 1, overflowY: 'auto', fontSize: 11, color: '#cbd5e1', background: '#080812', borderRadius: 10, padding: 14, whiteSpace: 'pre-wrap', fontFamily: 'DM Mono, monospace', lineHeight: 1.6, border: '1px solid #1e293b' }}>
            {activeTab.content || '(vazio)'}
          </pre>
        </div>
      </div>
    </div>
  )
}

// ─── QUEUE CARD ───────────────────────────────────────────────────────────────

function QueueCard({ item, onView, onRemove, onRetry }: any) {
  const borderColor = item.status === STATUS.PROCESSING ? '#5b21b6' : item.status === STATUS.COMPLETED ? '#065f46' : item.status === STATUS.FAILED ? '#7f1d1d' : '#1e293b'
  return (
    <div style={{ borderRadius: 10, border: `1px solid ${borderColor}`, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', transition: 'all 0.2s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || '(sem título)'}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            <StatusBadge status={item.status} />
            {item.channelName && <span style={{ fontSize: 9, color: '#475569' }}>{item.channelName}</span>}
            <span style={{ fontSize: 9, color: '#334155' }}>{LANGUAGES.find(l => l.code === item.language)?.name || item.language}</span>
          </div>
          {item.error && <p style={{ fontSize: 10, color: '#f87171', marginTop: 4 }}>{item.error}</p>}
          {item.status === STATUS.COMPLETED && item.result && (
            <p style={{ fontSize: 10, color: '#34d399', marginTop: 4 }}>✓ {(item.result.script?.length || 0).toLocaleString()} chars</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {item.status === STATUS.COMPLETED && (
            <button onClick={() => onView(item)} style={{ fontSize: 10, fontWeight: 700, background: 'rgba(109,40,217,0.25)', color: '#a78bfa', border: '1px solid rgba(109,40,217,0.3)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>VER</button>
          )}
          {item.status === STATUS.FAILED && (
            <button onClick={() => onRetry(item.id)} style={{ fontSize: 10, fontWeight: 700, background: 'rgba(245,158,11,0.2)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>↺ TENTAR</button>
          )}
          {item.status !== STATUS.PROCESSING && (
            <button onClick={() => onRemove(item.id)} style={{ fontSize: 10, background: 'transparent', color: '#475569', border: '1px solid #1e293b', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>✕</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function App() {
  const [config, setConfig] = useState({ ...DEFAULT_CONFIG })
  const [batchMode, setBatchMode] = useState(false)
  const [batchTitles, setBatchTitles] = useState('')
  const [queue, setQueue] = useState<any[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  const queueRef = useRef<any[]>([])
  const isPausedRef = useRef(false)

  useEffect(() => { queueRef.current = queue }, [queue])
  useEffect(() => { isPausedRef.current = isPaused }, [isPaused])

  const set = (key: string, val: any) => setConfig(prev => ({ ...prev, [key]: val }))

  const addToQueue = () => {
    if (batchMode) {
      const titles = batchTitles.split('\n').map(t => t.trim()).filter(Boolean)
      if (!titles.length) return
      setQueue(prev => [...prev, ...titles.map(title => ({ ...config, title, id: Math.random().toString(36).slice(2), status: STATUS.PENDING }))])
    } else {
      if (!config.title.trim()) return
      setQueue(prev => [...prev, { ...config, id: Math.random().toString(36).slice(2), status: STATUS.PENDING }])
    }
  }

  const removeItem = (id: string) => {
    if (queueRef.current.find(i => i.id === id)?.status === STATUS.PROCESSING) return
    setQueue(prev => prev.filter(i => i.id !== id))
  }

  const retryItem = (id: string) => {
    setQueue(prev => prev.map(i => i.id === id ? { ...i, status: STATUS.PENDING, result: undefined, error: undefined } : i))
  }

  const processQueue = async () => {
    if (isProcessing) return
    setIsProcessing(true)
    setIsPaused(false)

    while (true) {
      if (isPausedRef.current) break
      const next = queueRef.current.find(i => i.status === STATUS.PENDING)
      if (!next) break

      setQueue(prev => prev.map(i => i.id === next.id ? { ...i, status: STATUS.PROCESSING } : i))

      try {
        const result = await generateWithClaude(next)
        setQueue(prev => prev.map(i => i.id === next.id ? { ...i, status: STATUS.COMPLETED, result } : i))

        const lang = (next.language || 'XX').toUpperCase()
        const ch = next.channelName ? `[${next.channelName.replace(/[<>:"/\\|?*]/g, '')}] ` : ''
        const base = `${ch}${lang} ${(next.thumbText || next.title || 'roteiro').replace(/[<>:"/\\|?*]/g, '').substring(0, 55)}`

        triggerDownload(result.script || '', `ROTEIRO ${base}.txt`)
        const div = '\n\n' + '='.repeat(40) + '\n\n'
        let meta = `TÍTULO: ${next.title}`
        if (next.channelName) meta += `\nCANAL: ${next.channelName}`
        if (result.thumbnailPrompt) meta += `${div}PROMPT THUMBNAIL:\n${result.thumbnailPrompt}`
        if (result.description) meta += `${div}DESCRIÇÃO SEO:\n${result.description}`
        if (result.backgroundPrompts) meta += `${div}BACKGROUND PROMPTS:\n${result.backgroundPrompts}`
        if (result.thumbnailPrompt || result.description) setTimeout(() => triggerDownload(meta, `META ${base}.txt`), 900)

      } catch (err: any) {
        setQueue(prev => prev.map(i => i.id === next.id ? { ...i, status: STATUS.FAILED, error: err.message || 'Erro na API Claude' } : i))
        await new Promise(r => setTimeout(r, 5000))
      }
      await new Promise(r => setTimeout(r, 2000))
    }
    setIsProcessing(false)
  }

  const completed = queue.filter(i => i.status === STATUS.COMPLETED).length
  const pending = queue.filter(i => i.status === STATUS.PENDING).length
  const processing = queue.find(i => i.status === STATUS.PROCESSING)

  const canAdd = batchMode ? batchTitles.trim().length > 0 : config.title.trim().length > 0

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#08080f', minHeight: '100vh', color: '#e2e8f0', position: 'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        input, textarea, select { font-family: inherit; }
        input:focus, textarea:focus, select:focus { outline: none; border-color: #7c3aed !important; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

      {/* BG orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '45%', paddingBottom: '45%', background: 'radial-gradient(circle, rgba(109,40,217,0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '40%', paddingBottom: '40%', background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1360, margin: '0 auto', padding: '24px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', borderRadius: 14, padding: '10px 13px', boxShadow: '0 8px 24px rgba(109,40,217,0.4)' }}>
            <span style={{ fontSize: 22 }}>⚡</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Faceless Automator</h1>
              <span style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', background: 'rgba(139,92,246,0.2)', color: '#a78bfa', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(139,92,246,0.3)' }}>Claude 4 · v4.0</span>
            </div>
            <p style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>Roteiros faceless com técnicas de máxima retenção humana</p>
          </div>
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 20, alignItems: 'start' }}>

          {/* ─── LEFT PANEL ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            <Section title="📌 Informações Básicas">
              <Input label="Canal" value={config.channelName} onChange={(v: string) => set('channelName', v)} placeholder="Ex: Camino Cabalístico" />
              <Input label="Título do Vídeo" value={config.title} onChange={(v: string) => set('title', v)} placeholder="O segredo que os sábios escondem..." />
              <Input label="Texto da Thumbnail (2-4 palavras)" value={config.thumbText} onChange={(v: string) => set('thumbText', v)} placeholder="SECRETO OCULTO" />
              <Input label="Objetivo / Brief" value={config.objective} onChange={(v: string) => set('objective', v)} placeholder="Falar sobre Tzedaká e como ela atrai prosperidade..." textarea />
              <Select label="Idioma" value={config.language} onChange={(v: string) => set('language', v)} options={LANGUAGES.map(l => ({ value: l.code, label: l.name }))} />
              <Field label={`Tamanho do Roteiro — ${config.characterLimit.toLocaleString()} chars`}>
                <input type="range" min={5000} max={25000} step={500} value={config.characterLimit} onChange={e => set('characterLimit', +e.target.value)} style={{ width: '100%', accentColor: '#7c3aed', display: 'block', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#334155' }}>
                  <span>5k</span><span>~10min = 19k</span><span>25k</span>
                </div>
              </Field>
            </Section>

            <Section title="🧠 Parâmetros de Escrita Humana" accent>
              <Select label="Tom Narrativo" value={config.narratorTone} onChange={(v: string) => set('narratorTone', v)} options={NARRATOR_TONES} />
              <Select label="Emoção Dominante" value={config.dominantEmotion} onChange={(v: string) => set('dominantEmotion', v)} options={DOMINANT_EMOTIONS} />
              <Select label="Tipo de Gancho (Abertura)" value={config.hookType} onChange={(v: string) => set('hookType', v)} options={HOOK_TYPES} />
              <Input label="CTA Bordão" value={config.ctaBordao} onChange={(v: string) => set('ctaBordao', v)} placeholder="Ex: Comenta aqui o que você escolhe..." />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Select label="Voz Narrativa" value={config.narratorVoice} onChange={(v: string) => set('narratorVoice', v)} options={[
                  { value: 'first_person', label: '1ª pessoa (Eu/Nós)' },
                  { value: 'second_person', label: '2ª pessoa (Você)' },
                  { value: 'third_person', label: '3ª pessoa (Ele/Ela)' },
                ]} />
                <Select label="Ritmo" value={config.rhythm} onChange={(v: string) => set('rhythm', v)} options={RHYTHMS} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingTop: 2 }}>
                <Toggle checked={config.useDramaticPauses} onChange={v => set('useDramaticPauses', v)} label="Pausas dramáticas" />
                <Toggle checked={config.useConcreteExamples} onChange={v => set('useConcreteExamples', v)} label="Exemplos concretos" />
                <Toggle checked={config.retentionLoops} onChange={v => set('retentionLoops', v)} label="Loops de retenção" />
                <Toggle checked={config.avoidAcademic} onChange={v => set('avoidAcademic', v)} label="Anti-acadêmico" />
              </div>
            </Section>

            <Section title="📦 Outputs">
              <Toggle checked={config.includeThumbPrompt} onChange={v => set('includeThumbPrompt', v)} label="Prompt de Thumbnail (JSON)" />
              <Toggle checked={config.includeDescription} onChange={v => set('includeDescription', v)} label="Descrição SEO do YouTube" />
              <Toggle checked={config.includeBgPrompts} onChange={v => set('includeBgPrompts', v)} label="Prompts de Background" />
              {config.includeBgPrompts && (
                <Field label={`Quantidade de BG prompts: ${config.bgPromptsCount}`}>
                  <input type="range" min={3} max={15} value={config.bgPromptsCount} onChange={e => set('bgPromptsCount', +e.target.value)} style={{ width: '100%', accentColor: '#7c3aed', display: 'block' }} />
                </Field>
              )}
            </Section>

            <Section title="➕ Adicionar à Fila">
              <Toggle checked={batchMode} onChange={setBatchMode} label="Modo batch (múltiplos títulos de uma vez)" />
              {batchMode && (
                <Input label="Um título por linha" value={batchTitles} onChange={setBatchTitles} textarea placeholder={'Título 1\nTítulo 2\nTítulo 3'} />
              )}
              <button
                onClick={addToQueue}
                disabled={!canAdd}
                style={{
                  width: '100%', padding: 11, borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 13, cursor: canAdd ? 'pointer' : 'not-allowed',
                  background: canAdd ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : '#0f172a',
                  color: canAdd ? '#fff' : '#334155',
                  boxShadow: canAdd ? '0 4px 16px rgba(109,40,217,0.35)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {batchMode ? `Adicionar ${batchTitles.split('\n').filter(l => l.trim()).length || 0} vídeos à fila` : '+ Adicionar à Fila'}
              </button>
            </Section>
          </div>

          {/* ─── RIGHT PANEL ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Action bar */}
            <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', gap: 24 }}>
                {[
                  { label: 'Fila', value: queue.length, color: '#e2e8f0' },
                  { label: 'Concluídos', value: completed, color: '#34d399' },
                  { label: 'Pendentes', value: pending, color: '#a78bfa' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: s.color, fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {!isProcessing ? (
                  <button onClick={processQueue} disabled={pending === 0} style={{ display: 'flex', alignItems: 'center', gap: 6, background: pending > 0 ? '#fff' : '#1e293b', color: pending > 0 ? '#0f0f1a' : '#475569', border: 'none', borderRadius: 10, padding: '9px 20px', fontWeight: 800, fontSize: 12, cursor: pending > 0 ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
                    ▶ INICIAR
                  </button>
                ) : (
                  <button onClick={() => setIsPaused(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: isPaused ? '#10b981' : '#f59e0b', color: '#000', border: 'none', borderRadius: 10, padding: '9px 20px', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                    {isPaused ? '▶ CONTINUAR' : '⏸ PAUSAR'}
                  </button>
                )}
                <button onClick={() => setQueue(prev => prev.filter(i => i.status !== STATUS.COMPLETED))} disabled={completed === 0} title="Limpar concluídos" style={{ background: 'transparent', border: '1px solid #1e293b', borderRadius: 10, padding: '9px 12px', color: completed > 0 ? '#94a3b8' : '#1e293b', cursor: completed > 0 ? 'pointer' : 'not-allowed', fontSize: 14 }}>🧹</button>
                <button onClick={() => { if (window.confirm('Limpar toda a fila?')) setQueue([]) }} title="Limpar tudo" style={{ background: 'transparent', border: '1px solid #1e293b', borderRadius: 10, padding: '9px 12px', color: '#475569', cursor: 'pointer', fontSize: 14 }}>🗑️</button>
              </div>
            </div>

            {/* Processing indicator */}
            {processing && (
              <div style={{ background: 'rgba(109,40,217,0.1)', border: '1px solid rgba(109,40,217,0.3)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16, display: 'inline-block', animation: 'spin 1.5s linear infinite' }}>⚙️</span>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#c4b5fd' }}>Gerando com Claude Sonnet 4...</p>
                  <p style={{ fontSize: 10, color: '#7c3aed', marginTop: 1 }}>{processing.title}</p>
                </div>
              </div>
            )}

            {/* Queue */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 480, overflowY: 'auto', paddingRight: 2 }}>
              {queue.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#1e293b' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Fila vazia</p>
                  <p style={{ fontSize: 11, color: '#1e293b', marginTop: 4 }}>Configure e adicione vídeos à fila</p>
                </div>
              ) : queue.map(item => (
                <QueueCard key={item.id} item={item} onView={setSelectedItem} onRemove={removeItem} onRetry={retryItem} />
              ))}
            </div>

            {/* Active techniques */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#334155', marginBottom: 7 }}>Técnicas ativas neste kit</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {[
                  config.retentionLoops && 'Open Loops',
                  config.useDramaticPauses && 'Pausas Dramáticas',
                  config.useConcreteExamples && 'Exemplos Concretos',
                  config.avoidAcademic && 'Anti-Acadêmico',
                  config.ctaBordao && 'Bordão Custom',
                  NARRATOR_TONES.find(t => t.value === config.narratorTone)?.label.split(' ').slice(1).join(' '),
                  DOMINANT_EMOTIONS.find(e => e.value === config.dominantEmotion)?.label.split(' ').slice(1).join(' '),
                ].filter(Boolean).map((tag, i) => (
                  <span key={i} style={{ fontSize: 9, background: 'rgba(109,40,217,0.12)', color: '#7c3aed', border: '1px solid rgba(109,40,217,0.2)', borderRadius: 5, padding: '2px 7px', fontWeight: 600 }}>{tag as string}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedItem && <ResultModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </div>
  )
}
