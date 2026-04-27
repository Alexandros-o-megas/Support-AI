import React, { useState, useEffect, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || '/api'

// ── Paleta ────────────────────────────────────────────────────────────────────
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #0a0b0d;
    --surface:   #111318;
    --border:    #1e2028;
    --border2:   #2a2d38;
    --text:      #e8eaf0;
    --muted:     #5a5f72;
    --accent:    #4fffb0;
    --accent2:   #ff4f7b;
    --warn:      #ffb84f;
    --info:      #4f9fff;
    --purple:    #a04fff;
    --font-head: 'Syne', sans-serif;
    --font-mono: 'DM Mono', monospace;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 13px;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* scrollbar */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  .shell {
    display: grid;
    grid-template-columns: 240px 1fr;
    min-height: 100vh;
  }

  /* ── SIDEBAR ── */
  .sidebar {
    background: var(--surface);
    border-right: 1px solid var(--border);
    padding: 0;
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow: hidden;
  }
  .sidebar-logo {
    padding: 24px 20px 20px;
    border-bottom: 1px solid var(--border);
  }
  .sidebar-logo .logotype {
    font-family: var(--font-head);
    font-size: 18px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: var(--accent);
    line-height: 1;
  }
  .sidebar-logo .sub {
    font-size: 10px;
    color: var(--muted);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-top: 4px;
  }
  .nav-section {
    padding: 16px 12px 8px;
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--muted);
  }
  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 16px;
    margin: 1px 8px;
    border-radius: 6px;
    cursor: pointer;
    color: var(--muted);
    transition: all 0.15s;
    font-size: 12px;
    border: none;
    background: none;
    width: calc(100% - 16px);
    text-align: left;
    font-family: var(--font-mono);
  }
  .nav-item:hover { background: var(--border); color: var(--text); }
  .nav-item.active { background: rgba(79,255,176,0.08); color: var(--accent); }
  .nav-item .icon { width: 16px; text-align: center; opacity: 0.7; }
  .sidebar-bottom {
    margin-top: auto;
    padding: 16px;
    border-top: 1px solid var(--border);
    font-size: 11px;
    color: var(--muted);
  }
  .status-dot {
    display: inline-block;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--accent);
    margin-right: 6px;
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0%,100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* ── MAIN ── */
  .main {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    overflow: hidden;
  }

  /* ── TOPBAR ── */
  .topbar {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 0 28px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .topbar-title {
    font-family: var(--font-head);
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -0.3px;
  }
  .topbar-actions { display: flex; gap: 8px; align-items: center; }
  .btn {
    padding: 7px 14px;
    border-radius: 6px;
    font-size: 11px;
    font-family: var(--font-mono);
    font-weight: 500;
    cursor: pointer;
    border: 1px solid var(--border2);
    background: var(--border);
    color: var(--text);
    transition: all 0.15s;
    letter-spacing: 0.3px;
  }
  .btn:hover { border-color: var(--accent); color: var(--accent); }
  .btn.primary {
    background: var(--accent);
    color: #000;
    border-color: var(--accent);
    font-weight: 600;
  }
  .btn.primary:hover { background: #3de89a; }
  .btn.danger { border-color: var(--accent2); color: var(--accent2); }
  .btn.danger:hover { background: rgba(255,79,123,0.1); }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── CONTENT ── */
  .content { padding: 24px 28px; flex: 1; }

  /* ── STATS ROW ── */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
    margin-bottom: 24px;
  }
  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.2s;
  }
  .stat-card:hover { border-color: var(--border2); }
  .stat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: var(--accent-color, var(--accent));
  }
  .stat-label {
    font-size: 10px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 8px;
  }
  .stat-value {
    font-family: var(--font-head);
    font-size: 32px;
    font-weight: 800;
    line-height: 1;
    color: var(--accent-color, var(--accent));
  }
  .stat-sub { font-size: 10px; color: var(--muted); margin-top: 4px; }

  /* ── FILTERS ── */
  .filters-bar {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    flex-wrap: wrap;
    align-items: center;
  }
  .filter-select {
    background: var(--surface);
    border: 1px solid var(--border2);
    color: var(--text);
    padding: 7px 10px;
    border-radius: 6px;
    font-family: var(--font-mono);
    font-size: 11px;
    cursor: pointer;
    outline: none;
    transition: border-color 0.15s;
  }
  .filter-select:focus { border-color: var(--accent); }
  .filter-label {
    font-size: 11px;
    color: var(--muted);
    white-space: nowrap;
  }
  .filter-sep { flex: 1; }

  /* ── TABLE ── */
  .table-wrap {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }
  table { width: 100%; border-collapse: collapse; }
  thead { background: var(--bg); }
  th {
    padding: 10px 14px;
    text-align: left;
    font-size: 10px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--muted);
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }
  td {
    padding: 12px 14px;
    border-bottom: 1px solid var(--border);
    vertical-align: middle;
    font-size: 12px;
  }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(255,255,255,0.015); }
  .tr-click { cursor: pointer; }

  /* ── BADGES ── */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    white-space: nowrap;
    border: 1px solid transparent;
  }
  .badge-suporte    { background: rgba(79,159,255,0.12); color: var(--info); border-color: rgba(79,159,255,0.2); }
  .badge-vendas     { background: rgba(79,255,176,0.1);  color: var(--accent); border-color: rgba(79,255,176,0.2); }
  .badge-reclamacao { background: rgba(255,79,123,0.1);  color: var(--accent2); border-color: rgba(255,79,123,0.2); }
  .badge-urgente    { background: rgba(160,79,255,0.12); color: var(--purple); border-color: rgba(160,79,255,0.25);
    animation: urgente-pulse 2s infinite; }
  @keyframes urgente-pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(160,79,255,0.3); }
    50%      { box-shadow: 0 0 0 4px rgba(160,79,255,0); }
  }
  .badge-alta   { background: rgba(255,79,123,0.1); color: var(--accent2); border-color: rgba(255,79,123,0.2); }
  .badge-media  { background: rgba(255,184,79,0.1); color: var(--warn);   border-color: rgba(255,184,79,0.2); }
  .badge-baixa  { background: rgba(79,159,255,0.08); color: var(--muted); border-color: rgba(79,159,255,0.1); }
  .badge-aberto       { background: rgba(79,159,255,0.1); color: var(--info); }
  .badge-em_progresso { background: rgba(255,184,79,0.1); color: var(--warn); }
  .badge-fechado      { background: rgba(90,95,114,0.2);  color: var(--muted); }

  /* ── MODAL OVERLAY ── */
  .overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    backdrop-filter: blur(4px);
    animation: fadeIn 0.15s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .modal {
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: 12px;
    width: 560px;
    max-width: 95vw;
    max-height: 90vh;
    overflow-y: auto;
    animation: slideUp 0.2s ease;
  }
  @keyframes slideUp { from { transform: translateY(16px); opacity:0; } to { transform:none; opacity:1; } }
  .modal-head {
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .modal-head h2 { font-family: var(--font-head); font-size: 16px; font-weight: 700; }
  .modal-body { padding: 20px 24px; }
  .modal-footer {
    padding: 16px 24px;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
  .close-btn {
    background: none; border: none; cursor: pointer;
    color: var(--muted); font-size: 18px; line-height: 1;
    padding: 2px 6px; border-radius: 4px;
  }
  .close-btn:hover { color: var(--text); background: var(--border); }

  /* ── DETAIL FIELDS ── */
  .field-row {
    display: grid;
    grid-template-columns: 120px 1fr;
    gap: 8px;
    margin-bottom: 12px;
    align-items: start;
  }
  .field-key { font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); padding-top: 2px; }
  .field-val { font-size: 12px; color: var(--text); line-height: 1.6; }
  .field-val.mono { font-family: var(--font-mono); }
  .message-box {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 12px;
    font-size: 12px;
    line-height: 1.7;
    color: var(--text);
    margin: 12px 0;
  }
  .ai-box {
    background: rgba(79,255,176,0.04);
    border: 1px solid rgba(79,255,176,0.15);
    border-radius: 6px;
    padding: 12px;
    font-size: 12px;
    line-height: 1.7;
    color: var(--accent);
    margin: 12px 0;
  }
  .ai-label {
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: rgba(79,255,176,0.5);
    margin-bottom: 6px;
  }

  /* ── FORM (Nova Mensagem) ── */
  .form-grid { display: flex; flex-direction: column; gap: 12px; }
  .form-group { display: flex; flex-direction: column; gap: 5px; }
  .form-label { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); }
  .form-input, .form-textarea, .form-select {
    background: var(--bg);
    border: 1px solid var(--border2);
    color: var(--text);
    padding: 9px 12px;
    border-radius: 6px;
    font-family: var(--font-mono);
    font-size: 12px;
    outline: none;
    transition: border-color 0.15s;
    resize: vertical;
  }
  .form-input:focus, .form-textarea:focus, .form-select:focus { border-color: var(--accent); }
  .form-textarea { min-height: 100px; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  /* ── PAGINATION ── */
  .pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-top: 1px solid var(--border);
    font-size: 11px;
    color: var(--muted);
  }
  .page-btns { display: flex; gap: 4px; }
  .page-btn {
    padding: 4px 10px;
    border-radius: 4px;
    border: 1px solid var(--border2);
    background: none;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 11px;
    cursor: pointer;
    transition: all 0.1s;
  }
  .page-btn:hover { border-color: var(--accent); color: var(--accent); }
  .page-btn.active { background: var(--accent); color: #000; border-color: var(--accent); font-weight: 600; }
  .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  /* ── EMPTY / LOADING ── */
  .empty {
    text-align: center;
    padding: 60px 20px;
    color: var(--muted);
  }
  .empty-icon { font-size: 36px; margin-bottom: 12px; opacity: 0.4; }
  .empty-text { font-size: 13px; }
  .spinner {
    width: 18px; height: 18px;
    border: 2px solid var(--border2);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── TOAST ── */
  .toast-wrap {
    position: fixed;
    bottom: 24px; right: 24px;
    display: flex; flex-direction: column; gap: 8px;
    z-index: 999;
  }
  .toast {
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 12px;
    min-width: 260px;
    animation: toastIn 0.2s ease;
    display: flex; align-items: center; gap: 10px;
  }
  .toast.success { border-color: rgba(79,255,176,0.4); }
  .toast.error   { border-color: rgba(255,79,123,0.4); }
  @keyframes toastIn { from { transform: translateX(20px); opacity:0; } to { transform:none; opacity:1; } }

  /* ── TABS ── */
  .tabs { display: flex; gap: 0; margin-bottom: 20px; border-bottom: 1px solid var(--border); }
  .tab {
    padding: 10px 16px;
    font-size: 12px;
    cursor: pointer;
    color: var(--muted);
    border-bottom: 2px solid transparent;
    transition: all 0.15s;
    background: none; border-top: none; border-left: none; border-right: none;
    font-family: var(--font-mono);
  }
  .tab.active { color: var(--accent); border-bottom-color: var(--accent); }
  .tab:hover { color: var(--text); }

  /* ── MISC ── */
  .id-chip {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--muted);
    background: var(--bg);
    border: 1px solid var(--border);
    padding: 2px 6px;
    border-radius: 3px;
  }
  .summary-text {
    max-width: 340px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
  }
  .origem-chip {
    font-size: 10px;
    color: var(--muted);
    display: flex; align-items: center; gap: 3px;
  }
  .erp-tag {
    font-size: 9px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--accent);
    background: rgba(79,255,176,0.06);
    border: 1px solid rgba(79,255,176,0.15);
    padding: 2px 6px;
    border-radius: 3px;
  }
  .section-title {
    font-family: var(--font-head);
    font-size: 13px;
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
    margin-top: 16px;
  }
  .divider { border: none; border-top: 1px solid var(--border); margin: 12px 0; }
`

// ── Helpers ────────────────────────────────────────────────────────────────────

const catLabel = { suporte: 'Suporte', vendas: 'Vendas', reclamacao: 'Reclamação', urgente: 'Urgente' }
const priLabel = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }
const stLabel  = { aberto: 'Aberto', em_progresso: 'Em Progresso', fechado: 'Fechado' }
const oriIcon  = { whatsapp: '📱', email: '✉️', api: '🔌' }

function Badge({ type, value }) {
  return <span className={`badge badge-${value}`}>{type === 'category' ? catLabel[value] || value : type === 'priority' ? priLabel[value] || value : stLabel[value] || value}</span>
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-MZ', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })
}

// ── Toast system ──────────────────────────────────────────────────────────────
let _toastId = 0
function useToasts() {
  const [toasts, setToasts] = useState([])
  const add = useCallback((msg, type='success') => {
    const id = ++_toastId
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])
  return [toasts, add]
}

// ── API calls ─────────────────────────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Erro desconhecido')
  }
  return res.json()
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [page, setPage]   = useState('dashboard')
  const [toasts, addToast] = useToasts()

  return (
    <>
      <style>{CSS}</style>
      <div className="shell">
        <Sidebar page={page} setPage={setPage} />
        <div className="main">
          {page === 'dashboard' && <DashboardPage addToast={addToast} />}
          {page === 'tickets'   && <TicketsPage   addToast={addToast} />}
          {page === 'nova'      && <NovaMensagemPage addToast={addToast} setPage={setPage} />}
        </div>
      </div>
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.type === 'success' ? '✓' : '✕'}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage }) {
  const nav = [
    { id: 'dashboard', icon: '◈', label: 'Dashboard' },
    { id: 'tickets',   icon: '≡', label: 'Tickets' },
    { id: 'nova',      icon: '+', label: 'Nova Mensagem' },
  ]
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logotype">SUPORTE.IA</div>
        <div className="sub">Sistema Automatizado</div>
      </div>
      <div className="nav-section">Navegação</div>
      {nav.map(n => (
        <button key={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`} onClick={() => setPage(n.id)}>
          <span className="icon">{n.icon}</span>
          {n.label}
        </button>
      ))}
      <div className="sidebar-bottom">
        <span className="status-dot" />
        Sistema operacional
      </div>
    </aside>
  )
}

// ── Dashboard Page ─────────────────────────────────────────────────────────────
function DashboardPage({ addToast }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/tickets/stats/summary')
      setStats(data)
    } catch (e) {
      addToast('Erro ao carregar estatísticas: ' + e.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => { load() }, [load])

  const statCards = stats ? [
    { label: 'Total Tickets', value: stats.total, color: 'var(--accent)',  sub: 'todos os registos' },
    { label: 'Abertos',       value: stats.por_status.aberto,       color: 'var(--info)',   sub: 'aguardam resposta' },
    { label: 'Em Progresso',  value: stats.por_status.em_progresso, color: 'var(--warn)',   sub: 'em atendimento' },
    { label: 'Fechados',      value: stats.por_status.fechado,      color: 'var(--muted)',  sub: 'resolvidos' },
    { label: 'Alta Prioridade',value: stats.por_prioridade.alta,    color: 'var(--accent2)', sub: 'requerem atenção' },
    { label: 'Urgentes',      value: stats.por_categoria.urgente,   color: 'var(--purple)', sub: 'emergências' },
  ] : []

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">Dashboard</span>
        <div className="topbar-actions">
          <button className="btn" onClick={load} disabled={loading}>
            {loading ? <span className="spinner" /> : '↻ Actualizar'}
          </button>
        </div>
      </div>
      <div className="content">
        {loading ? (
          <div className="empty"><div className="spinner" /></div>
        ) : stats ? (
          <>
            <div className="stats-row">
              {statCards.map(c => (
                <div key={c.label} className="stat-card" style={{'--accent-color': c.color}}>
                  <div className="stat-label">{c.label}</div>
                  <div className="stat-value">{c.value}</div>
                  <div className="stat-sub">{c.sub}</div>
                </div>
              ))}
            </div>
            <div className="stats-row">
              {Object.entries(stats.por_categoria).map(([k, v]) => (
                <div key={k} className="stat-card" style={{'--accent-color': 'var(--border2)'}}>
                  <div className="stat-label">{catLabel[k] || k}</div>
                  <div className="stat-value" style={{color: 'var(--text)', fontSize: '24px'}}>{v}</div>
                </div>
              ))}
            </div>
            <RecentTickets addToast={addToast} />
          </>
        ) : null}
      </div>
    </>
  )
}

function RecentTickets({ addToast }) {
  const [tickets, setTickets] = useState([])
  const [sel, setSel] = useState(null)

  useEffect(() => {
    apiFetch('/tickets?page=1&size=8')
      .then(d => setTickets(d.items))
      .catch(e => addToast('Erro: ' + e.message, 'error'))
  }, [addToast])

  return (
    <>
      <div className="section-title">Tickets Recentes</div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Categoria</th><th>Prioridade</th><th>Resumo</th><th>Status</th><th>Data</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 && (
              <tr><td colSpan={6}><div className="empty"><div className="empty-text">Sem tickets ainda.</div></div></td></tr>
            )}
            {tickets.map(t => (
              <tr key={t.id} className="tr-click" onClick={() => setSel(t)}>
                <td><span className="id-chip">#{t.id}</span></td>
                <td><Badge type="category" value={t.category} /></td>
                <td><Badge type="priority" value={t.priority} /></td>
                <td><span className="summary-text">{t.summary}</span></td>
                <td><Badge type="status" value={t.status} /></td>
                <td style={{color:'var(--muted)'}}>{fmtDate(t.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sel && <TicketModal ticket={sel} onClose={() => setSel(null)} onUpdate={(upd) => {
        setTickets(ts => ts.map(t => t.id === upd.id ? upd : t))
        setSel(upd)
      }} addToast={addToast} />}
    </>
  )
}

// ── Tickets Page ──────────────────────────────────────────────────────────────
function TicketsPage({ addToast }) {
  const [data, setData]       = useState({ items: [], total: 0, pages: 1 })
  const [page, setPage]       = useState(1)
  const [status, setStatus]   = useState('')
  const [priority, setPriority] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [sel, setSel]         = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, size: 15 })
      if (status)   params.set('status', status)
      if (priority) params.set('priority', priority)
      if (category) params.set('category', category)
      const d = await apiFetch(`/tickets?${params}`)
      setData(d)
    } catch (e) {
      addToast('Erro: ' + e.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [page, status, priority, category, addToast])

  useEffect(() => { load() }, [load])

  const reset = () => { setStatus(''); setPriority(''); setCategory(''); setPage(1) }

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">Tickets</span>
        <div className="topbar-actions">
          <button className="btn" onClick={load} disabled={loading}>
            {loading ? <span className="spinner" /> : '↻ Actualizar'}
          </button>
        </div>
      </div>
      <div className="content">
        <div className="filters-bar">
          <span className="filter-label">Filtros:</span>
          <select className="filter-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
            <option value="">Todos os Status</option>
            <option value="aberto">Aberto</option>
            <option value="em_progresso">Em Progresso</option>
            <option value="fechado">Fechado</option>
          </select>
          <select className="filter-select" value={priority} onChange={e => { setPriority(e.target.value); setPage(1) }}>
            <option value="">Todas Prioridades</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
          <select className="filter-select" value={category} onChange={e => { setCategory(e.target.value); setPage(1) }}>
            <option value="">Todas Categorias</option>
            <option value="suporte">Suporte</option>
            <option value="vendas">Vendas</option>
            <option value="reclamacao">Reclamação</option>
            <option value="urgente">Urgente</option>
          </select>
          <button className="btn" onClick={reset}>Limpar</button>
          <span className="filter-sep" />
          <span className="filter-label">{data.total} ticket{data.total !== 1 ? 's' : ''}</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Origem</th><th>Categoria</th><th>Prioridade</th>
                <th>Resumo</th><th>Status</th><th>ERP</th><th>Data</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8}><div className="empty"><span className="spinner" /></div></td></tr>
              )}
              {!loading && data.items.length === 0 && (
                <tr><td colSpan={8}><div className="empty">
                  <div className="empty-icon">◌</div>
                  <div className="empty-text">Nenhum ticket encontrado.</div>
                </div></td></tr>
              )}
              {!loading && data.items.map(t => (
                <tr key={t.id} className="tr-click" onClick={() => setSel(t)}>
                  <td><span className="id-chip">#{t.id}</span></td>
                  <td><span className="origem-chip">{oriIcon[t.message?.origem] || '?'} {t.message?.origem || '—'}</span></td>
                  <td><Badge type="category" value={t.category} /></td>
                  <td><Badge type="priority" value={t.priority} /></td>
                  <td><span className="summary-text">{t.summary}</span></td>
                  <td><Badge type="status" value={t.status} /></td>
                  <td>{t.erp_synced === 'true' ? <span className="erp-tag">ERP</span> : <span style={{color:'var(--muted)'}}>—</span>}</td>
                  <td style={{color:'var(--muted)'}}>{fmtDate(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <span>Página {page} de {data.pages}</span>
            <div className="page-btns">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
              {Array.from({ length: Math.min(data.pages, 5) }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>Próxima →</button>
            </div>
          </div>
        </div>
      </div>
      {sel && <TicketModal ticket={sel} onClose={() => setSel(null)} onUpdate={(upd) => {
        setData(d => ({ ...d, items: d.items.map(t => t.id === upd.id ? upd : t) }))
        setSel(upd)
      }} addToast={addToast} />}
    </>
  )
}

// ── Ticket Modal ──────────────────────────────────────────────────────────────
function TicketModal({ ticket, onClose, onUpdate, addToast }) {
  const [saving, setSaving] = useState(false)
  const [newStatus, setNewStatus] = useState(ticket.status)

  const save = async () => {
    if (newStatus === ticket.status) { onClose(); return }
    setSaving(true)
    try {
      const upd = await apiFetch(`/tickets/${ticket.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      onUpdate(upd)
      addToast(`Ticket #${ticket.id} actualizado.`, 'success')
    } catch (e) {
      addToast('Erro: ' + e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <div>
            <h2>Ticket <span className="id-chip">#{ticket.id}</span></h2>
            <div style={{marginTop:6, display:'flex', gap:6}}>
              <Badge type="category" value={ticket.category} />
              <Badge type="priority" value={ticket.priority} />
              <Badge type="status"   value={ticket.status} />
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="field-row">
            <span className="field-key">Origem</span>
            <span className="field-val">{oriIcon[ticket.message?.origem]} {ticket.message?.origem || '—'}</span>
          </div>
          <div className="field-row">
            <span className="field-key">Cliente</span>
            <span className="field-val">{ticket.message?.sender_name || '—'}</span>
          </div>
          <div className="field-row">
            <span className="field-key">Contacto</span>
            <span className="field-val mono">{ticket.message?.sender_contact || '—'}</span>
          </div>
          <div className="field-row">
            <span className="field-key">Criado em</span>
            <span className="field-val mono">{fmtDate(ticket.created_at)}</span>
          </div>
          <div className="field-row">
            <span className="field-key">ERP</span>
            <span className="field-val">{ticket.erp_synced === 'true' ? <span className="erp-tag">Sincronizado</span> : '—'}</span>
          </div>
          <hr className="divider" />
          <div className="ai-label">Mensagem Original</div>
          <div className="message-box">{ticket.message?.content || '—'}</div>
          <div className="ai-label" style={{marginTop:12}}>Resumo IA</div>
          <div className="message-box" style={{color:'var(--info)'}}>{ticket.summary}</div>
          {ticket.ai_response && (
            <>
              <div className="ai-label" style={{marginTop:12}}>Resposta Automática ao Cliente</div>
              <div className="ai-box">
                <div className="ai-label">gerada por ia</div>
                {ticket.ai_response}
              </div>
            </>
          )}
          <hr className="divider" />
          <div className="form-group">
            <label className="form-label">Actualizar Status</label>
            <select className="filter-select" value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{maxWidth:200}}>
              <option value="aberto">Aberto</option>
              <option value="em_progresso">Em Progresso</option>
              <option value="fechado">Fechado</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Fechar</button>
          <button className="btn primary" onClick={save} disabled={saving}>
            {saving ? <span className="spinner" /> : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Nova Mensagem Page ────────────────────────────────────────────────────────
function NovaMensagemPage({ addToast, setPage }) {
  const [form, setForm] = useState({ content: '', sender_name: '', sender_contact: '', origem: 'api' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.content.trim()) { addToast('Escreva a mensagem.', 'error'); return }
    setLoading(true)
    setResult(null)
    try {
      const r = await apiFetch('/messages', { method: 'POST', body: JSON.stringify(form) })
      setResult(r)
      addToast(`Ticket #${r.ticket.id} criado com sucesso!`, 'success')
    } catch (e) {
      addToast('Erro: ' + e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">Nova Mensagem</span>
      </div>
      <div className="content">
        <div style={{maxWidth: 600}}>
          <div className="form-grid">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nome do Cliente</label>
                <input className="form-input" placeholder="Ex: João Machava" value={form.sender_name} onChange={e => set('sender_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Contacto (tel/email)</label>
                <input className="form-input" placeholder="Ex: +258841234567" value={form.sender_contact} onChange={e => set('sender_contact', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Origem da Mensagem</label>
              <select className="form-select" value={form.origem} onChange={e => set('origem', e.target.value)}>
                <option value="api">API / Manual</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Mensagem do Cliente *</label>
              <textarea
                className="form-textarea"
                placeholder="Escreva ou cole aqui a mensagem recebida do cliente…"
                value={form.content}
                onChange={e => set('content', e.target.value)}
                rows={5}
              />
            </div>
            <button className="btn primary" onClick={submit} disabled={loading} style={{alignSelf:'flex-start', padding:'10px 24px', fontSize:12}}>
              {loading ? <><span className="spinner" style={{width:14,height:14}} /> &nbsp;A processar com IA…</> : '▶ Processar Mensagem'}
            </button>
          </div>

          {result && (
            <div style={{marginTop: 28}}>
              <div className="section-title">✓ Ticket Criado</div>
              <div className="table-wrap" style={{padding: '20px 24px'}}>
                <div className="field-row">
                  <span className="field-key">Ticket ID</span>
                  <span className="field-val mono"><strong className="id-chip">#{result.ticket.id}</strong></span>
                </div>
                <div className="field-row">
                  <span className="field-key">Categoria</span>
                  <span className="field-val"><Badge type="category" value={result.ticket.category} /></span>
                </div>
                <div className="field-row">
                  <span className="field-key">Prioridade</span>
                  <span className="field-val"><Badge type="priority" value={result.ticket.priority} /></span>
                </div>
                <div className="field-row">
                  <span className="field-key">Resumo IA</span>
                  <span className="field-val" style={{color:'var(--info)'}}>{result.ticket.summary}</span>
                </div>
                {result.ticket.ai_response && (
                  <div className="field-row">
                    <span className="field-key">Resposta IA</span>
                    <span className="field-val" style={{color:'var(--accent)'}}>{result.ticket.ai_response}</span>
                  </div>
                )}
                {result.ticket.erp_synced === 'true' && (
                  <div className="field-row">
                    <span className="field-key">ERP</span>
                    <span className="field-val"><span className="erp-tag">Lead enviado ao ERP</span></span>
                  </div>
                )}
                <hr className="divider" />
                <button className="btn primary" onClick={() => setPage('tickets')} style={{fontSize:11}}>
                  Ver todos os tickets →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
