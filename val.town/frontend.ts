export function getFrontendHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AIHive Command Center</title>
  <script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@18",
      "react-dom/client": "https://esm.sh/react-dom@18/client",
      "react-dom": "https://esm.sh/react-dom@18",
      "lucide-react": "https://esm.sh/lucide-react@0.263.1"
    }
  }
  </script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0a0f; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; overflow: hidden; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #13131a; }
    ::-webkit-scrollbar-thumb { background: #1e1e2e; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #2a2a3e; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .pulse-dot { animation: pulse 2s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .typing-dot { animation: typing 1.4s infinite; display: inline-block; width: 7px; height: 7px; background: #6366f1; border-radius: 50%; margin: 0 2px; }
    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typing { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
    .toast { animation: toastIn 0.3s ease, toastOut 0.3s ease 2.7s forwards; }
    @keyframes toastIn { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes toastOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(110%); opacity: 0; } }
    .modal-overlay { animation: fadeIn 0.2s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal-card { animation: slideUp 0.25s ease; }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .chat-panel { animation: chatSlideIn 0.3s ease; }
    @keyframes chatSlideIn { from { transform: translateY(20px) scale(0.97); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
    input, textarea, select { outline: none; }
    input:focus, textarea:focus, select:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 2px rgba(99,102,241,0.2); }
    .tab-active { border-bottom: 2px solid #6366f1; color: #e2e8f0; }
    .tab-inactive { border-bottom: 2px solid transparent; color: #64748b; }
    .tab-inactive:hover { color: #94a3b8; border-bottom-color: #2a2a3e; }
    .nav-active { background: rgba(99,102,241,0.15); color: #e2e8f0; border-right: 2px solid #6366f1; }
    .nav-inactive { color: #64748b; }
    .nav-inactive:hover { background: rgba(255,255,255,0.04); color: #94a3b8; }
    .toggle-on { background: #6366f1; }
    .toggle-off { background: #1e1e2e; }
    pre { white-space: pre-wrap; word-break: break-all; }
    table { border-collapse: collapse; width: 100%; }
    th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #1e1e2e; font-size: 13px; }
    th { color: #64748b; font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
    td { color: #e2e8f0; }
    tr:hover td { background: rgba(255,255,255,0.02); }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
    import { createRoot } from 'react-dom/client';
    import {
      LayoutDashboard, TrendingUp, Briefcase, Bot, Settings, MessageSquare,
      X, Send, RefreshCw, Plus, Play, Edit, Trash2, ChevronRight, CheckCircle,
      AlertCircle, Loader, Search, ExternalLink, ChevronDown, Zap, Globe,
      BarChart2, Link2, Mail, FileText, Youtube, Rocket, User, Key, Save,
      ToggleLeft, ToggleRight, Terminal, Eye, EyeOff, Copy, Check, Shield,
      Cpu, Activity, Database, Bell
    } from 'lucide-react';


    const parseTools = (tools) => {
      if (Array.isArray(tools)) return tools;
      if (typeof tools === 'string' && tools.trim()) {
        try { return JSON.parse(tools); } catch { return []; }
      }
      return [];
    };


    const INTEGRATIONS = ['ahrefs', 'ga4', 'gsc', 'linkedin', 'outlook', 'wordpress', 'youtube', 'producthunt'];

    const INTEGRATION_META = {
      ahrefs:      { icon: 'ahrefs',             label: 'Ahrefs',                category: 'marketing', color: '#f59e0b' },
      ga4:         { icon: 'googleanalytics',     label: 'Google Analytics 4',    category: 'marketing', color: '#e37400' },
      gsc:         { icon: 'googlesearchconsole', label: 'Google Search Console', category: 'marketing', color: '#4285f4' },
      linkedin:    { icon: 'linkedin',            label: 'LinkedIn',              category: 'sales',     color: '#0077b5' },
      outlook:     { icon: 'microsoftoutlook',    label: 'Outlook',               category: 'sales',     color: '#0078d4' },
      wordpress:   { icon: 'wordpress',           label: 'WordPress',             category: 'marketing', color: '#21759b' },
      youtube:     { icon: 'youtube',             label: 'YouTube',               category: 'marketing', color: '#ff0000' },
      producthunt: { icon: 'producthunt',         label: 'Product Hunt',          category: 'marketing', color: '#da552f' },
    };

    const INTEGRATION_ACTIONS = {
      ahrefs:      [{ label: 'Site Explorer', endpoint: 'site-explorer' }, { label: 'Keywords', endpoint: 'keywords' }, { label: 'Backlinks', endpoint: 'backlinks' }],
      ga4:         [{ label: 'Realtime', endpoint: 'realtime' }, { label: 'Report', endpoint: 'report' }],
      gsc:         [{ label: 'Search Analytics', endpoint: 'search-analytics' }, { label: 'Sitemaps', endpoint: 'sitemaps' }],
      linkedin:    [{ label: 'My Profile', endpoint: 'profile' }, { label: 'Posts', endpoint: 'posts' }, { label: 'Analytics', endpoint: 'analytics' }],
      outlook:     [{ label: 'Inbox', endpoint: 'inbox' }, { label: 'Calendar', endpoint: 'calendar' }],
      wordpress:   [{ label: 'Posts', endpoint: 'posts' }, { label: 'Pages', endpoint: 'pages' }, { label: 'Media', endpoint: 'media' }],
      youtube:     [{ label: 'Channels', endpoint: 'channels' }, { label: 'Videos', endpoint: 'videos' }, { label: 'Playlists', endpoint: 'playlists' }],
      producthunt: [{ label: 'Posts', endpoint: 'posts' }, { label: 'Topics', endpoint: 'topics' }],
    };

    const INTEGRATION_FIELDS = {
      ahrefs:      [{ key: 'apiKey', label: 'API Key', type: 'password' }],
      ga4:         [{ key: 'accessToken', label: 'Access Token', type: 'password' }, { key: 'propertyId', label: 'Property ID', type: 'text' }],
      gsc:         [{ key: 'accessToken', label: 'Access Token', type: 'password' }, { key: 'siteUrl', label: 'Site URL', type: 'text' }],
      linkedin:    [{ key: 'accessToken', label: 'Access Token', type: 'password' }],
      outlook:     [{ key: 'accessToken', label: 'Access Token', type: 'password' }],
      wordpress:   [{ key: 'siteUrl', label: 'Site URL', type: 'text' }, { key: 'apiKey', label: 'Username / API Key', type: 'text' }, { key: 'apiSecret', label: 'Password / API Secret', type: 'password' }],
      youtube:     [{ key: 'apiKey', label: 'API Key or Access Token', type: 'password' }],
      producthunt: [{ key: 'apiKey', label: 'API Key', type: 'password' }],
    };

    const ALL_TOOLS = ['ahrefs', 'ga4', 'gsc', 'linkedin', 'outlook', 'wordpress', 'youtube', 'producthunt'];


    function useToast() {
      const [toasts, setToasts] = useState([]);
      const show = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
      }, []);
      return { toasts, show };
    }


    function ToastContainer({ toasts }) {
      return React.createElement('div', {
        style: { position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }
      },
        toasts.map(t =>
          React.createElement('div', {
            key: t.id,
            className: 'toast',
            style: {
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 18px', borderRadius: 10,
              background: t.type === 'success' ? '#052e16' : t.type === 'error' ? '#1f0a0a' : '#1c1400',
              border: \`1px solid \${t.type === 'success' ? '#10b981' : t.type === 'error' ? '#ef4444' : '#f59e0b'}\`,
              color: t.type === 'success' ? '#10b981' : t.type === 'error' ? '#ef4444' : '#f59e0b',
              fontSize: 14, fontWeight: 500, maxWidth: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
            }
          },
            t.type === 'success' ? React.createElement(CheckCircle, { size: 16 })
              : t.type === 'error' ? React.createElement(AlertCircle, { size: 16 })
              : React.createElement(Bell, { size: 16 }),
            t.message
          )
        )
      );
    }


    function Btn({ children, onClick, variant = 'primary', size = 'md', disabled = false, style = {}, className = '' }) {
      const baseStyle = {
        display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 8,
        fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer', border: 'none',
        transition: 'all 0.15s', opacity: disabled ? 0.5 : 1, ...style,
        ...(size === 'sm' ? { padding: '5px 12px', fontSize: 12 } :
           size === 'lg' ? { padding: '12px 24px', fontSize: 15 } :
                           { padding: '8px 16px', fontSize: 13 }),
        ...(variant === 'primary' ? { background: '#6366f1', color: '#fff' } :
           variant === 'ghost'   ? { background: 'rgba(255,255,255,0.05)', color: '#94a3b8' } :
           variant === 'danger'  ? { background: 'rgba(239,68,68,0.15)', color: '#ef4444' } :
           variant === 'success' ? { background: 'rgba(16,185,129,0.15)', color: '#10b981' } :
                                   { background: '#1e1e2e', color: '#94a3b8' }),
      };
      return React.createElement('button', {
        onClick, disabled, style: baseStyle, className,
        onMouseEnter: e => { if (!disabled) e.currentTarget.style.opacity = '0.85'; },
        onMouseLeave: e => { e.currentTarget.style.opacity = disabled ? '0.5' : '1'; }
      }, children);
    }

    function Input({ label, value, onChange, type = 'text', placeholder = '', style = {} }) {
      const [show, setShow] = useState(false);
      const isPass = type === 'password';
      return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6, ...style } },
        label && React.createElement('label', { style: { fontSize: 12, fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' } }, label),
        React.createElement('div', { style: { position: 'relative' } },
          React.createElement('input', {
            type: isPass && !show ? 'password' : 'text',
            value, onChange: e => onChange(e.target.value), placeholder,
            style: {
              width: '100%', background: '#0a0a0f', border: '1px solid #1e1e2e',
              borderRadius: 8, padding: isPass ? '9px 40px 9px 12px' : '9px 12px',
              color: '#e2e8f0', fontSize: 14, transition: 'border-color 0.15s'
            }
          }),
          isPass && React.createElement('button', {
            onClick: () => setShow(!show), type: 'button',
            style: { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 2 }
          }, show ? React.createElement(EyeOff, { size: 15 }) : React.createElement(Eye, { size: 15 }))
        )
      );
    }

    function Textarea({ label, value, onChange, placeholder = '', rows = 4, style = {} }) {
      return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6, ...style } },
        label && React.createElement('label', { style: { fontSize: 12, fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' } }, label),
        React.createElement('textarea', {
          value, onChange: e => onChange(e.target.value), placeholder, rows,
          style: {
            width: '100%', background: '#0a0a0f', border: '1px solid #1e1e2e',
            borderRadius: 8, padding: '9px 12px', color: '#e2e8f0', fontSize: 14,
            resize: 'vertical', transition: 'border-color 0.15s', fontFamily: 'inherit', lineHeight: 1.6
          }
        })
      );
    }

    function Select({ label, value, onChange, options, style = {} }) {
      return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6, ...style } },
        label && React.createElement('label', { style: { fontSize: 12, fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' } }, label),
        React.createElement('select', {
          value, onChange: e => onChange(e.target.value),
          style: {
            width: '100%', background: '#0a0a0f', border: '1px solid #1e1e2e',
            borderRadius: 8, padding: '9px 12px', color: '#e2e8f0', fontSize: 14,
            cursor: 'pointer', transition: 'border-color 0.15s', appearance: 'none'
          }
        }, options.map(o => React.createElement('option', { key: o.value, value: o.value }, o.label)))
      );
    }

    function Spinner({ size = 18, color = '#6366f1' }) {
      return React.createElement('div', {
        className: 'spin',
        style: {
          width: size, height: size, borderRadius: '50%',
          border: \`2px solid rgba(99,102,241,0.2)\`,
          borderTopColor: color, flexShrink: 0
        }
      });
    }

    function BrandIcon({slug,color='#6366f1',size=18,bare=false}){
      const [err,setErr]=useState(false);
      const img=React.createElement('img',{src:'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/'+slug+'.svg',width:size,height:size,alt:slug,style:{filter:'invert(1)',opacity:0.9,display:'block'},onError:()=>setErr(true)});
      const fb=React.createElement('span',{style:{fontSize:size*0.65,fontWeight:700,color}},slug[0]);
      const c=err?fb:img;
      if(bare)return c;
      return React.createElement('div',{style:{width:size+14,height:size+14,borderRadius:10,flexShrink:0,background:color+'22',display:'flex',alignItems:'center',justifyContent:'center'}},c);
    }

    function Badge({ label, variant = 'default' }) {
      const styles = {
        default: { background: 'rgba(99,102,241,0.15)', color: '#6366f1' },
        success: { background: 'rgba(16,185,129,0.15)', color: '#10b981' },
        error:   { background: 'rgba(239,68,68,0.15)', color: '#ef4444' },
        warning: { background: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
        muted:   { background: '#1e1e2e', color: '#64748b' },
      };
      return React.createElement('span', {
        style: {
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
          ...styles[variant]
        }
      }, label);
    }

    function Toggle({ value, onChange }) {
      return React.createElement('button', {
        onClick: () => onChange(!value),
        style: {
          width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
          background: value ? '#6366f1' : '#1e1e2e', position: 'relative',
          transition: 'background 0.2s', flexShrink: 0
        }
      },
        React.createElement('div', {
          style: {
            position: 'absolute', top: 2, left: value ? 18 : 2,
            width: 16, height: 16, borderRadius: '50%', background: '#fff',
            transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)'
          }
        })
      );
    }


    function DataDisplay({data,loading,error}){
      if(loading)return React.createElement('div',{style:{display:'flex',justifyContent:'center',padding:32}},React.createElement(Spinner));
      if(error)return React.createElement('div',{style:{padding:16,borderRadius:8,background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',color:'#ef4444',fontSize:13}},React.createElement(AlertCircle,{size:14,style:{display:'inline',marginRight:6}}),error);
      if(!data)return null;
      return React.createElement('div',{style:{background:'#0d0d14',borderRadius:10,padding:16,border:'1px solid #1e1e2e',marginTop:16,overflowX:'auto',maxHeight:480,overflowY:'auto'}},
        React.createElement('pre',{style:{fontSize:12,color:'#94a3b8',lineHeight:1.6,whiteSpace:'pre-wrap',wordBreak:'break-all'}},JSON.stringify(data,null,2))
      );
    }

    function MetricCard({ icon, title, value, subtitle, color = '#6366f1' }) {
      return React.createElement('div', {
        style: {
          background: '#13131a', border: '1px solid #1e1e2e', borderRadius: 14,
          padding: 24, display: 'flex', flexDirection: 'column', gap: 16
        }
      },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
          React.createElement('div', {
            style: { width: 40, height: 40, borderRadius: 10, background: \`\${color}22\`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }
          }, icon),
          React.createElement('div', {
            style: { fontSize: 28, fontWeight: 700, color: '#e2e8f0' }
          }, value)
        ),
        React.createElement('div', null,
          React.createElement('div', { style: { fontWeight: 600, color: '#e2e8f0', fontSize: 15 } }, title),
          subtitle && React.createElement('div', { style: { color: '#64748b', fontSize: 12, marginTop: 3 } }, subtitle)
        )
      );
    }


    function IntegrationPanel({ integrationName, integrations, onGoToSettings }) {
      const meta = INTEGRATION_META[integrationName];
      const actions = INTEGRATION_ACTIONS[integrationName] || [];
      const integration = integrations.find(i => i.name === integrationName);
      const connected = integration?.connected;

      const [activeEndpoint, setActiveEndpoint] = useState(null);
      const [data, setData] = useState(null);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState(null);

      const fetchData = async (endpoint) => {
        setActiveEndpoint(endpoint);
        setLoading(true);
        setError(null);
        setData(null);
        try {
          const res = await fetch(\`/api/integrations/\${integrationName}/data?endpoint=\${endpoint}\`);
          if (!res.ok) throw new Error(\`HTTP \${res.status}: \${res.statusText}\`);
          const json = await res.json();
          setData(json);
        } catch (e) {
          setError(e.message || 'Failed to fetch data');
        } finally {
          setLoading(false);
        }
      };

      const refresh = () => activeEndpoint && fetchData(activeEndpoint);

      if (!connected) {
        return React.createElement('div', {
          style: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 64, gap: 16 }
        },
          React.createElement(BrandIcon, { slug: meta.icon, color: meta.color, size: 42 }),
          React.createElement('div', { style: { fontSize: 18, fontWeight: 600, color: '#e2e8f0' } }, meta.label),
          React.createElement(Badge, { label: 'Not Connected', variant: 'muted' }),
          React.createElement('div', { style: { color: '#64748b', fontSize: 13, textAlign: 'center', maxWidth: 320, lineHeight: 1.6, marginTop: 4 } },
            \`Connect \${meta.label} in Settings to start using this integration.\`
          ),
          React.createElement(Btn, { onClick: onGoToSettings, variant: 'primary', size: 'md', style: { marginTop: 8 } },
            React.createElement(Settings, { size: 15 }), 'Go to Settings'
          )
        );
      }

      return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 16 } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
            React.createElement(BrandIcon, { slug: meta.icon, color: meta.color, size: 20 }),
            React.createElement('div', null,
              React.createElement('div', { style: { fontWeight: 700, fontSize: 17, color: '#e2e8f0' } }, meta.label),
              React.createElement(Badge, { label: 'Connected', variant: 'success' })
            )
          ),
          React.createElement(Btn, { onClick: refresh, variant: 'ghost', size: 'sm', disabled: !activeEndpoint || loading },
            loading ? React.createElement(Spinner, { size: 13 }) : React.createElement(RefreshCw, { size: 13 }),
            'Refresh'
          )
        ),
        React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 8 } },
          actions.map(a =>
            React.createElement('button', {
              key: a.endpoint,
              onClick: () => fetchData(a.endpoint),
              style: {
                padding: '8px 16px', borderRadius: 8, border: \`1px solid \${activeEndpoint === a.endpoint ? '#6366f1' : '#1e1e2e'}\`,
                background: activeEndpoint === a.endpoint ? 'rgba(99,102,241,0.15)' : '#0a0a0f',
                color: activeEndpoint === a.endpoint ? '#6366f1' : '#94a3b8',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6
              }
            },
              loading && activeEndpoint === a.endpoint
                ? React.createElement(Spinner, { size: 12 })
                : React.createElement(Terminal, { size: 13 }),
              a.label
            )
          )
        ),
        React.createElement(DataDisplay, { data, loading: loading && activeEndpoint !== null, error })
      );
    }


    function Sidebar({ activePage, setActivePage, integrations, agents, chatOpen, setChatOpen }) {
      const marketingConnected = integrations.some(i => INTEGRATION_META[i.name]?.category === 'marketing' && i.connected);
      const salesConnected = integrations.some(i => INTEGRATION_META[i.name]?.category === 'sales' && i.connected);
      const agentCount = agents.length;

      const navItems = [
        { id: 'dashboard', icon: React.createElement(LayoutDashboard, { size: 17 }), label: 'Dashboard' },
        { id: 'marketing', icon: React.createElement(TrendingUp, { size: 17 }), label: 'Marketing', dot: marketingConnected, dotColor: '#10b981' },
        { id: 'sales', icon: React.createElement(Briefcase, { size: 17 }), label: 'Sales', dot: salesConnected, dotColor: '#10b981' },
        { id: 'agents', icon: React.createElement(Bot, { size: 17 }), label: 'Agent Studio', badge: agentCount > 0 ? agentCount : null },
        { id: 'settings', icon: React.createElement(Settings, { size: 17 }), label: 'Settings' },
      ];

      return React.createElement('div', {
        style: {
          width: 240, minWidth: 240, height: '100vh', background: '#0a0a0f',
          borderRight: '1px solid #1e1e2e', display: 'flex', flexDirection: 'column',
          position: 'fixed', left: 0, top: 0, zIndex: 100
        }
      },
        // Logo
        React.createElement('div', { style: { padding: '24px 20px 20px', borderBottom: '1px solid #1e1e2e' } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
            React.createElement('div', {
              style: {
                width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 4px 12px rgba(99,102,241,0.4)'
              }
            },
              React.createElement('svg', { viewBox: '0 0 24 24', width: 22, height: 22, fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
                React.createElement('path', { d: 'M12 2L21 7v10l-9 5L3 17V7z', fill: 'rgba(255,255,255,0.15)', stroke: 'rgba(255,255,255,0.85)', strokeWidth: '1.5', strokeLinejoin: 'round' }),
                React.createElement('path', { d: 'M8 12h8M12 8v8', stroke: 'rgba(255,255,255,0.85)', strokeWidth: '1.5', strokeLinecap: 'round' })
              )
            ),
            React.createElement('div', null,
              React.createElement('div', { style: { fontWeight: 800, fontSize: 15, color: '#e2e8f0', letterSpacing: '-0.01em' } }, 'AIHive'),
              React.createElement('div', { style: { fontSize: 10, color: '#64748b', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' } }, 'Command Center')
            )
          )
        ),
        // Nav
        React.createElement('nav', { style: { flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 3 } },
          navItems.map(item =>
            React.createElement('button', {
              key: item.id,
              onClick: () => setActivePage(item.id),
              className: activePage === item.id ? 'nav-active' : 'nav-inactive',
              style: {
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: 'none', textAlign: 'left', transition: 'all 0.15s', position: 'relative',
                ...(activePage === item.id
                  ? { background: 'rgba(99,102,241,0.12)', color: '#e2e8f0', borderRight: '2px solid #6366f1' }
                  : { color: '#64748b' })
              }
            },
              item.icon,
              React.createElement('span', { style: { fontSize: 13, fontWeight: 500, flex: 1 } }, item.label),
              item.dot && React.createElement('div', {
                style: { width: 7, height: 7, borderRadius: '50%', background: item.dotColor }
              }),
              item.badge != null && React.createElement('div', {
                style: {
                  background: '#6366f1', color: '#fff', fontSize: 10, fontWeight: 700,
                  padding: '1px 6px', borderRadius: 10, minWidth: 18, textAlign: 'center'
                }
              }, item.badge)
            )
          )
        ),
        // Chat button
        React.createElement('div', { style: { padding: '12px 10px 20px', borderTop: '1px solid #1e1e2e' } },
          React.createElement('button', {
            onClick: () => setChatOpen(!chatOpen),
            style: {
              width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              borderRadius: 10, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: chatOpen ? '#4f46e5' : '#6366f1',
              color: '#fff', fontWeight: 600, fontSize: 13
            }
          },
            React.createElement(MessageSquare, { size: 16 }),
            'AI Chat',
            chatOpen && React.createElement('div', {
              style: { marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: '#10b981' }
            })
          )
        )
      );
    }


    function FunnelSection({integrations}){
      const ga4=integrations.find(i=>i.name==='ga4'&&i.connected);
      const [loading,setLoading]=useState(false);
      const [result,setResult]=useState(null);
      const [err,setErr]=useState(null);
      const SC=['#4285f4','#6366f1','#8b5cf6','#10b981'];
      const load=async()=>{
        if(!ga4)return;setLoading(true);setErr(null);
        try{
          const r=await fetch('/api/integrations/ga4/proxy?endpoint=funnel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({funnel:{steps:[{name:'Session Start',filterExpression:{funnelEventFilter:{eventName:'session_start'}}},{name:'Sign Up',filterExpression:{funnelEventFilter:{eventName:'sign_up'}}}]},funnelBreakdown:{breakdownDimension:{dimensionName:'firstUserChannelGrouping'}},dateRanges:[{startDate:'30daysAgo',endDate:'today'}]})});
          const d=await r.json();
          if(!r.ok)throw new Error(d.error||d.message||'GA4 '+r.status);
          setResult(d);
        }catch(e){setErr(e.message);}finally{setLoading(false);}
      };
      useEffect(()=>{if(ga4)load();},[]);
      const bg='#0a0a0f';
      const card={background:'#13131a',border:'1px solid #1e1e2e',borderRadius:14,padding:24,marginBottom:24};
      const rows=result?.funnelTable?.rows||[];
      const base=parseInt(rows[0]?.metricValues?.[0]?.value||'1',10);
      return React.createElement('div',{style:card},
        React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}},
          React.createElement('div',null,
            React.createElement('div',{style:{fontWeight:700,fontSize:16,color:'#e2e8f0',display:'flex',alignItems:'center',gap:8}},React.createElement(Activity,{size:17,color:'#6366f1'}),'Acquisition Funnel'),
            React.createElement('div',{style:{fontSize:12,color:'#64748b',marginTop:3}},'User signup sources · last 30 days')
          ),
          ga4&&React.createElement(Btn,{onClick:load,variant:'ghost',size:'sm',disabled:loading},loading?React.createElement(Spinner,{size:12}):React.createElement(RefreshCw,{size:12}))
        ),
        !ga4&&React.createElement('div',{style:{padding:'28px 0',color:'#64748b',fontSize:13,textAlign:'center'}},'Connect GA4 in Settings to view your acquisition funnel.'),
        ga4&&loading&&!result&&React.createElement('div',{style:{padding:'28px 0',textAlign:'center'}},React.createElement(Spinner,{size:20})),
        ga4&&err&&React.createElement('div',{style:{background:'#1a0a0a',border:'1px solid #7f1d1d',borderRadius:8,padding:'10px 14px',color:'#f87171',fontSize:12,fontFamily:'monospace',marginBottom:10}},err),
        ga4&&result&&rows.length===0&&React.createElement('div',{style:{padding:'24px 0',color:'#64748b',fontSize:13,textAlign:'center'}},'No funnel data. Verify GA4 property ID and sign_up event tracking.'),
        ga4&&rows.length>0&&React.createElement('div',{style:{display:'flex',alignItems:'center',gap:4,overflowX:'auto',paddingBottom:8}},
          rows.map((row,i)=>{
            const nm=row.dimensionValues?.[0]?.value||('Step '+(i+1));
            const v=parseInt(row.metricValues?.[0]?.value||'0',10);
            const pct=i===0?100:Math.round(v/base*1000)/10;
            const c=SC[i%SC.length];
            return React.createElement('div',{key:i,style:{display:'flex',alignItems:'center',flexShrink:0}},
              React.createElement('div',{style:{minWidth:120,background:bg,border:'1px solid #1e1e2e',borderRadius:10,padding:'12px 14px',position:'relative',overflow:'hidden'}},
                React.createElement('div',{style:{fontSize:19,fontWeight:800,color:c,lineHeight:1,marginBottom:2}},v.toLocaleString()),
                React.createElement('div',{style:{fontSize:11,fontWeight:600,color:'#e2e8f0',marginBottom:6}},nm),
                React.createElement('div',{style:{fontSize:11,fontWeight:700,color:i===0?'#64748b':pct>5?'#10b981':pct>1?'#f59e0b':'#ef4444'}},i===0?'100%':pct.toFixed(1)+'%'),
                React.createElement('div',{style:{position:'absolute',bottom:0,left:0,right:0,height:3,background:c+'30'}},React.createElement('div',{style:{height:'100%',width:Math.min(pct,100)+'%',background:c}}))
              ),
              i<rows.length-1&&React.createElement('div',{style:{color:'#2a2a3e',fontSize:18,padding:'0 3px'}},'›')
            );
          })
        )
      );
    }

    function Dashboard({ integrations, agents, setActivePage }) {
      const connectedCount = integrations.filter(i => i.connected).length;
      const activeAgents = agents.filter(a => !!a.enabled).length;
      const marketingAgents = agents.filter(a => a.workspace === 'marketing').length;
      const salesAgents = agents.filter(a => a.workspace === 'sales').length;

      return React.createElement('div', { style: { padding: 32, maxWidth: 1200, margin: '0 auto' } },
        React.createElement('div', { style: { marginBottom: 28 } },
          React.createElement('h1', { style: { fontSize: 26, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em' } }, 'Command Center'),
          React.createElement('p', { style: { color: '#64748b', fontSize: 14, marginTop: 4 } }, 'Overview of your AI-powered marketing and sales platform')
        ),

        // Metric cards
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 } },
          React.createElement(MetricCard, {
            icon: React.createElement(Link2, { size: 20 }), title: 'Connected Services',
            value: connectedCount, subtitle: \`of \${INTEGRATIONS.length} integrations\`, color: '#6366f1'
          }),
          React.createElement(MetricCard, {
            icon: React.createElement(Cpu, { size: 20 }), title: 'Active Agents',
            value: activeAgents, subtitle: \`of \${agents.length} total\`, color: '#10b981'
          }),
          React.createElement(MetricCard, {
            icon: React.createElement(TrendingUp, { size: 20 }), title: 'Marketing Agents',
            value: marketingAgents, subtitle: 'in marketing workspace', color: '#f59e0b'
          }),
          React.createElement(MetricCard, {
            icon: React.createElement(Briefcase, { size: 20 }), title: 'Sales Agents',
            value: salesAgents, subtitle: 'in sales workspace', color: '#8b5cf6'
          })
        ),

        React.createElement(FunnelSection, { integrations }),

        // Integration grid
        React.createElement('div', { style: { marginBottom: 12 } },
          React.createElement('h2', { style: { fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 16 } }, 'Integration Status')
        ),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginBottom: 32 } },
          INTEGRATIONS.map(name => {
            const meta = INTEGRATION_META[name];
            const integ = integrations.find(i => i.name === name);
            const connected = integ?.connected;
            const pageDest = meta.category === 'marketing' ? 'marketing' : 'sales';
            return React.createElement('div', {
              key: name,
              style: {
                background: '#13131a', border: \`1px solid \${connected ? 'rgba(16,185,129,0.25)' : '#1e1e2e'}\`,
                borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 12,
                transition: 'border-color 0.2s'
              }
            },
              React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
                React.createElement(BrandIcon, { slug: meta.icon, color: meta.color, size: 22 }),
                React.createElement(Badge, { label: connected ? 'Connected' : 'Not Connected', variant: connected ? 'success' : 'muted' })
              ),
              React.createElement('div', null,
                React.createElement('div', { style: { fontWeight: 600, fontSize: 14, color: '#e2e8f0' } }, meta.label),
                React.createElement('div', { style: { fontSize: 11, color: '#64748b', marginTop: 2, textTransform: 'capitalize' } }, meta.category)
              ),
              React.createElement('button', {
                onClick: () => setActivePage(connected ? pageDest : 'settings'),
                style: {
                  fontSize: 12, color: '#6366f1', background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left', padding: 0, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500
                }
              }, connected ? 'Open workspace' : 'Configure', React.createElement(ChevronRight, { size: 12 }))
            );
          })
        ),

        // Recent activity
        React.createElement('div', null,
          React.createElement('h2', { style: { fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 16 } }, 'Recent Activity'),
          React.createElement('div', {
            style: {
              background: '#13131a', border: '1px solid #1e1e2e', borderRadius: 12,
              padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12
            }
          },
            React.createElement(Activity, { size: 28, color: '#1e1e2e' }),
            React.createElement('div', { style: { color: '#64748b', fontSize: 14 } }, 'No recent activity yet'),
            React.createElement('div', { style: { color: '#4a5568', fontSize: 12 } }, 'Activity from your agents and integrations will appear here')
          )
        )
      );
    }


    function MarketingWorkspace({ integrations, setActivePage }) {
      const tabs = ['ahrefs', 'ga4', 'gsc', 'wordpress', 'youtube', 'producthunt'];
      const [activeTab, setActiveTab] = useState('ahrefs');

      return React.createElement('div', { style: { padding: 32, maxWidth: 1100, margin: '0 auto' } },
        React.createElement('div', { style: { marginBottom: 24 } },
          React.createElement('h1', { style: { fontSize: 24, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em' } }, 'Marketing Workspace'),
          React.createElement('p', { style: { color: '#64748b', fontSize: 13, marginTop: 4 } }, 'SEO, analytics, content, and growth tools')
        ),
        React.createElement('div', { style: { display: 'flex', gap: 0, borderBottom: '1px solid #1e1e2e', marginBottom: 24, overflowX: 'auto' } },
          tabs.map(tab =>
            React.createElement('button', {
              key: tab,
              onClick: () => setActiveTab(tab),
              className: activeTab === tab ? 'tab-active' : 'tab-inactive',
              style: {
                padding: '10px 20px', fontSize: 13, fontWeight: 500, background: 'none',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 7
              }
            },
              React.createElement(BrandIcon, { slug: INTEGRATION_META[tab].icon, color: INTEGRATION_META[tab].color, size: 13, bare: true }),
              INTEGRATION_META[tab].label
            )
          )
        ),
        React.createElement(IntegrationPanel, {
          key: activeTab,
          integrationName: activeTab,
          integrations,
          onGoToSettings: () => setActivePage('settings')
        })
      );
    }


    function SalesWorkspace({ integrations, setActivePage }) {
      const tabs = ['linkedin', 'outlook'];
      const [activeTab, setActiveTab] = useState('linkedin');

      return React.createElement('div', { style: { padding: 32, maxWidth: 1100, margin: '0 auto' } },
        React.createElement('div', { style: { marginBottom: 24 } },
          React.createElement('h1', { style: { fontSize: 24, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em' } }, 'Sales Workspace'),
          React.createElement('p', { style: { color: '#64748b', fontSize: 13, marginTop: 4 } }, 'LinkedIn outreach, email, and pipeline management')
        ),
        React.createElement('div', { style: { display: 'flex', gap: 0, borderBottom: '1px solid #1e1e2e', marginBottom: 24 } },
          tabs.map(tab =>
            React.createElement('button', {
              key: tab,
              onClick: () => setActiveTab(tab),
              className: activeTab === tab ? 'tab-active' : 'tab-inactive',
              style: {
                padding: '10px 20px', fontSize: 13, fontWeight: 500, background: 'none',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 7
              }
            },
              React.createElement(BrandIcon, { slug: INTEGRATION_META[tab].icon, color: INTEGRATION_META[tab].color, size: 13, bare: true }),
              INTEGRATION_META[tab].label
            )
          )
        ),
        React.createElement(IntegrationPanel, {
          key: activeTab,
          integrationName: activeTab,
          integrations,
          onGoToSettings: () => setActivePage('settings')
        })
      );
    }


    function AgentCard({ agent, onToggle, onEdit, onDelete, onRun }) {
      const [running, setRunning] = useState(false);

      const handleRun = async () => {
        setRunning(true);
        await onRun(agent);
        setRunning(false);
      };

      return React.createElement('div', {
        style: {
          background: '#13131a', border: \`1px solid \${agent.enabled ? 'rgba(99,102,241,0.25)' : '#1e1e2e'}\`,
          borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 14,
          transition: 'border-color 0.2s'
        }
      },
        React.createElement('div', { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 } },
            React.createElement('div', {
              style: {
                width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }
            }, React.createElement(Bot, { size: 18, color: '#6366f1' })),
            React.createElement('div', { style: { minWidth: 0 } },
              React.createElement('div', { style: { fontWeight: 700, fontSize: 14, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, agent.name),
              React.createElement(Badge, { label: agent.workspace, variant: agent.workspace === 'marketing' ? 'default' : 'warning' })
            )
          ),
          React.createElement(Toggle, { value: !!agent.enabled, onChange: (v) => onToggle(agent.id, v ? 1 : 0) })
        ),

        agent.description && React.createElement('p', { style: { fontSize: 13, color: '#94a3b8', lineHeight: 1.5, margin: 0 } },
          agent.description.length > 120 ? agent.description.slice(0, 120) + '...' : agent.description
        ),

        parseTools(agent.tools).length > 0 && React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 5 } },
          React.createElement('span', { style: { fontSize: 11, color: '#64748b', marginRight: 3, alignSelf: 'center' } }, 'Tools:'),
          parseTools(agent.tools).map(t =>
            React.createElement('span', {
              key: t,
              style: {
                fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5,
                background: 'rgba(99,102,241,0.12)', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.03em'
              }
            }, t)
          )
        ),

        React.createElement('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
          React.createElement(Btn, { onClick: handleRun, variant: 'primary', size: 'sm', disabled: running },
            running ? React.createElement(Spinner, { size: 11, color: '#fff' }) : React.createElement(Play, { size: 12 }),
            running ? 'Running...' : 'Run'
          ),
          React.createElement(Btn, { onClick: () => onEdit(agent), variant: 'ghost', size: 'sm' },
            React.createElement(Edit, { size: 12 }), 'Edit'
          ),
          React.createElement(Btn, { onClick: () => onDelete(agent.id), variant: 'danger', size: 'sm' },
            React.createElement(Trash2, { size: 12 }), 'Delete'
          )
        )
      );
    }


    function AgentBuilderModal({ agent, onSave, onClose }) {
      const [form, setForm] = useState({
        name: agent?.name || '',
        workspace: agent?.workspace || 'marketing',
        description: agent?.description || '',
        system_prompt: agent?.system_prompt || '',
        tools: parseTools(agent?.tools),
        model: agent?.model || 'claude-sonnet-4-6',
      });
      const [saving, setSaving] = useState(false);

      const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
      const toggleTool = (t) => setField('tools', form.tools.includes(t) ? form.tools.filter(x => x !== t) : [...form.tools, t]);

      const handleSave = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        await onSave({ ...form, id: agent?.id });
        setSaving(false);
        onClose();
      };

      return React.createElement('div', {
        className: 'modal-overlay',
        style: {
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        },
        onClick: e => e.target === e.currentTarget && onClose()
      },
        React.createElement('div', {
          className: 'modal-card',
          style: {
            background: '#13131a', border: '1px solid #1e1e2e', borderRadius: 18,
            width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 0
          }
        },
          // Header
          React.createElement('div', { style: { padding: '22px 24px', borderBottom: '1px solid #1e1e2e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
            React.createElement('div', null,
              React.createElement('h2', { style: { fontSize: 18, fontWeight: 700, color: '#e2e8f0' } }, agent ? 'Edit Agent' : 'Create Agent'),
              React.createElement('p', { style: { color: '#64748b', fontSize: 12, marginTop: 2 } }, 'Configure your AI agent')
            ),
            React.createElement('button', {
              onClick: onClose,
              style: { background: '#1e1e2e', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#64748b', display: 'flex' }
            }, React.createElement(X, { size: 16 }))
          ),
          // Body
          React.createElement('div', { style: { padding: 24, display: 'flex', flexDirection: 'column', gap: 20 } },
            React.createElement(Input, { label: 'Agent Name', value: form.name, onChange: v => setField('name', v), placeholder: 'My Marketing Agent' }),

            // Workspace radio
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
              React.createElement('label', { style: { fontSize: 12, fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' } }, 'Workspace'),
              React.createElement('div', { style: { display: 'flex', gap: 10 } },
                ['marketing', 'sales'].map(w =>
                  React.createElement('button', {
                    key: w, onClick: () => setField('workspace', w),
                    style: {
                      flex: 1, padding: '10px 16px', borderRadius: 9, border: \`1px solid \${form.workspace === w ? '#6366f1' : '#1e1e2e'}\`,
                      background: form.workspace === w ? 'rgba(99,102,241,0.15)' : '#0a0a0f',
                      color: form.workspace === w ? '#6366f1' : '#64748b',
                      cursor: 'pointer', fontSize: 13, fontWeight: 500, textTransform: 'capitalize', transition: 'all 0.15s'
                    }
                  }, w)
                )
              )
            ),

            React.createElement(Textarea, { label: 'Description', value: form.description, onChange: v => setField('description', v), placeholder: 'Briefly describe what this agent does...', rows: 2 }),
            React.createElement(Textarea, { label: 'System Prompt', value: form.system_prompt, onChange: v => setField('system_prompt', v), placeholder: 'You are a helpful marketing assistant...', rows: 6 }),

            // Tools
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
              React.createElement('label', { style: { fontSize: 12, fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' } }, 'Tools'),
              React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 } },
                ALL_TOOLS.map(t =>
                  React.createElement('label', {
                    key: t,
                    style: {
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                      borderRadius: 8, border: \`1px solid \${form.tools.includes(t) ? '#6366f1' : '#1e1e2e'}\`,
                      background: form.tools.includes(t) ? 'rgba(99,102,241,0.1)' : '#0a0a0f',
                      cursor: 'pointer', transition: 'all 0.15s', fontSize: 13
                    }
                  },
                    React.createElement('input', {
                      type: 'checkbox', checked: form.tools.includes(t), onChange: () => toggleTool(t),
                      style: { accentColor: '#6366f1', width: 14, height: 14 }
                    }),
                    React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: 5 } },
                      React.createElement(BrandIcon, { slug: INTEGRATION_META[t]?.icon || t, color: INTEGRATION_META[t]?.color || '#6366f1', size: 12, bare: true }),
                      t
                    )
                  )
                )
              )
            ),

            React.createElement(Input, { label: 'Model', value: form.model, onChange: v => setField('model', v), placeholder: 'claude-sonnet-4-6' })
          ),
          // Footer
          React.createElement('div', { style: { padding: '18px 24px', borderTop: '1px solid #1e1e2e', display: 'flex', gap: 10, justifyContent: 'flex-end' } },
            React.createElement(Btn, { onClick: onClose, variant: 'ghost' }, 'Cancel'),
            React.createElement(Btn, { onClick: handleSave, variant: 'primary', disabled: !form.name.trim() || saving },
              saving ? React.createElement(Spinner, { size: 14, color: '#fff' }) : React.createElement(Save, { size: 14 }),
              saving ? 'Saving...' : (agent ? 'Update Agent' : 'Create Agent')
            )
          )
        )
      );
    }


    function AgentStudio({ agents, setAgents, setChatOpen, setChatMessages, showToast }) {
      const [showBuilder, setShowBuilder] = useState(false);
      const [editingAgent, setEditingAgent] = useState(null);

      const marketingAgents = agents.filter(a => a.workspace === 'marketing');
      const salesAgents = agents.filter(a => a.workspace === 'sales');

      const handleSaveAgent = async (form) => {
        try {
          const isEdit = !!form.id;
          const url = isEdit ? \`/api/agents/\${form.id}\` : '/api/agents';
          const method = isEdit ? 'PUT' : 'POST';
          const payload = {
            name: form.name,
            workspace: form.workspace,
            description: form.description,
            system_prompt: form.system_prompt,
            tools: form.tools,
            model: form.model,
          };
          const res = await fetch(url, {
            method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error('Failed to save agent');
          const saved = await res.json();
          if (isEdit) {
            setAgents(prev => prev.map(a => a.id === saved.id ? saved : a));
          } else {
            setAgents(prev => [...prev, saved]);
          }
          showToast(isEdit ? 'Agent updated!' : 'Agent created!', 'success');
        } catch (e) {
          showToast('Failed to save agent: ' + e.message, 'error');
        }
      };

      const handleToggle = async (id, enabled) => {
        try {
          const res = await fetch(\`/api/agents/\${id}\`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled })
          });
          if (!res.ok) throw new Error();
          setAgents(prev => prev.map(a => a.id === id ? { ...a, enabled } : a));
        } catch {
          showToast('Failed to update agent', 'error');
        }
      };

      const handleDelete = async (id) => {
        if (!confirm('Delete this agent?')) return;
        try {
          const res = await fetch(\`/api/agents/\${id}\`, { method: 'DELETE' });
          if (!res.ok) throw new Error();
          setAgents(prev => prev.filter(a => a.id !== id));
          showToast('Agent deleted', 'success');
        } catch {
          showToast('Failed to delete agent', 'error');
        }
      };

      const handleRun = (agent) => {
        setChatMessages(prev => [...prev, {
          role: 'user',
          content: \`Run agent: \${agent.name}. \${agent.description || 'Execute your primary task now.'}\`
        }]);
        setChatOpen(true);
        showToast(\`Agent "\${agent.name}" activated in chat\`, 'success');
      };

      const openAiCreate = () => {
        setChatMessages(prev => [...prev, {
          role: 'user', content: 'Help me create a new AI agent for my marketing/sales workflow.',
          id: Date.now()
        }]);
        setChatOpen(true);
      };

      const AgentColumn = ({ title, agentList, icon }) =>
        React.createElement('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: 16 } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 } },
            icon,
            React.createElement('h2', { style: { fontSize: 15, fontWeight: 700, color: '#e2e8f0' } }, title),
            React.createElement('span', { style: { fontSize: 12, color: '#64748b', background: '#1e1e2e', padding: '1px 8px', borderRadius: 10 } }, agentList.length)
          ),
          agentList.length === 0
            ? React.createElement('div', {
                style: {
                  background: '#13131a', border: '1px dashed #1e1e2e', borderRadius: 12,
                  padding: 32, textAlign: 'center', color: '#64748b', fontSize: 13
                }
              },
                React.createElement(Bot, { size: 24, style: { margin: '0 auto 10px', opacity: 0.3 } }),
                React.createElement('div', null, 'No agents yet'),
                React.createElement('div', { style: { fontSize: 11, marginTop: 4, color: '#4a5568' } }, 'Create one to get started')
              )
            : agentList.map(agent =>
                React.createElement(AgentCard, {
                  key: agent.id, agent,
                  onToggle: handleToggle,
                  onEdit: (a) => { setEditingAgent(a); setShowBuilder(true); },
                  onDelete: handleDelete,
                  onRun: handleRun
                })
              )
        );

      return React.createElement('div', { style: { padding: 32, maxWidth: 1100, margin: '0 auto' } },
        // Header
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 } },
          React.createElement('div', null,
            React.createElement('h1', { style: { fontSize: 24, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em' } }, 'Agent Studio'),
            React.createElement('p', { style: { color: '#64748b', fontSize: 13, marginTop: 4 } }, 'Build and manage your AI agents')
          ),
          React.createElement('div', { style: { display: 'flex', gap: 10 } },
            React.createElement(Btn, {
              onClick: openAiCreate, variant: 'ghost',
              style: { border: '1px solid #1e1e2e' }
            },
              React.createElement(Zap, { size: 14, color: '#f59e0b' }), 'Ask AI to create'
            ),
            React.createElement(Btn, {
              onClick: () => { setEditingAgent(null); setShowBuilder(true); }, variant: 'primary'
            },
              React.createElement(Plus, { size: 15 }), 'Create Agent'
            )
          )
        ),

        // Two columns
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 } },
          React.createElement(AgentColumn, {
            title: 'Marketing Agents', agentList: marketingAgents,
            icon: React.createElement(TrendingUp, { size: 15, color: '#10b981' })
          }),
          React.createElement(AgentColumn, {
            title: 'Sales Agents', agentList: salesAgents,
            icon: React.createElement(Briefcase, { size: 15, color: '#8b5cf6' })
          })
        ),

        (showBuilder) && React.createElement(AgentBuilderModal, {
          agent: editingAgent,
          onSave: handleSaveAgent,
          onClose: () => { setShowBuilder(false); setEditingAgent(null); }
        })
      );
    }


    function SettingsPage({ integrations, setIntegrations, llmConfig, setLlmConfig, showToast }) {
      const [llmForm, setLlmForm] = useState({
        provider: llmConfig?.provider || 'anthropic',
        apiKey: llmConfig?.api_key || '',
        model: llmConfig?.model || 'claude-sonnet-4-6',
        endpoint: llmConfig?.endpoint || '',
      });
      const [llmSaving, setLlmSaving] = useState(false);
      const [intFields, setIntFields] = useState(() => {
        const init = {};
        INTEGRATIONS.forEach(name => {
          const integ = integrations.find(i => i.name === name);
          init[name] = {};
          (INTEGRATION_FIELDS[name] || []).forEach(f => {
            init[name][f.key] = integ?.credentials?.[f.key] || '';
          });
        });
        return init;
      });
      const [intSaving, setIntSaving] = useState({});

      const setLlmField = (k, v) => setLlmForm(f => ({ ...f, [k]: v }));
      const setIntField = (name, key, val) => setIntFields(f => ({ ...f, [name]: { ...f[name], [key]: val } }));

      const saveLlm = async () => {
        setLlmSaving(true);
        try {
          const res = await fetch('/api/llm/config', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider: llmForm.provider, model: llmForm.model, api_key: llmForm.apiKey, endpoint: llmForm.endpoint })
          });
          if (!res.ok) throw new Error('Failed');
          const data = await res.json();
          setLlmConfig(data);
          showToast('LLM configuration saved!', 'success');
        } catch (e) {
          showToast('Failed to save LLM config', 'error');
        } finally {
          setLlmSaving(false);
        }
      };

      const saveIntegration = async (name) => {
        setIntSaving(s => ({ ...s, [name]: true }));
        try {
          const f=intFields[name]||{};
          const ex={};
          if(f.propertyId)ex.property_id=f.propertyId;
          if(f.siteUrl)ex.site_url=f.siteUrl;
          if(f.authorId)ex.author_id=f.authorId;
          const pl={api_key:f.apiKey||undefined,api_secret:f.apiSecret||undefined,access_token:f.accessToken||undefined};
          if(Object.keys(ex).length)pl.extra_config=ex;
          const res = await fetch(\`/api/integrations/\${name}\`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pl)
          });
          if (!res.ok) throw new Error('Failed');
          const data = await res.json();
          const integ = data.integration || data;
          const updated = { ...integ, connected: !!(integ.api_key || integ.access_token) };
          setIntegrations(prev => {
            const exists = prev.find(i => i.name === name);
            if (exists) return prev.map(i => i.name === name ? updated : i);
            return [...prev, updated];
          });
          showToast(\`\${INTEGRATION_META[name].label} saved!\`, 'success');
        } catch (e) {
          showToast(\`Failed to save \${INTEGRATION_META[name].label}\`, 'error');
        } finally {
          setIntSaving(s => ({ ...s, [name]: false }));
        }
      };

      const providerModels = { anthropic: 'claude-sonnet-4-6', openai: 'gpt-4o', custom: 'your-model' };

      return React.createElement('div', { style: { padding: 32, maxWidth: 860, margin: '0 auto' } },
        React.createElement('div', { style: { marginBottom: 28 } },
          React.createElement('h1', { style: { fontSize: 24, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em' } }, 'Settings'),
          React.createElement('p', { style: { color: '#64748b', fontSize: 13, marginTop: 4 } }, 'Configure integrations and AI provider')
        ),

        // Integrations section
        React.createElement('div', { style: { marginBottom: 32 } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 } },
            React.createElement(Link2, { size: 16, color: '#6366f1' }),
            React.createElement('h2', { style: { fontSize: 17, fontWeight: 700, color: '#e2e8f0' } }, 'Integrations')
          ),
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
            INTEGRATIONS.map(name => {
              const meta = INTEGRATION_META[name];
              const integ = integrations.find(i => i.name === name);
              const connected = integ?.connected;
              const fields = INTEGRATION_FIELDS[name] || [];

              return React.createElement('div', {
                key: name,
                style: { background: '#13131a', border: \`1px solid \${connected ? 'rgba(16,185,129,0.2)' : '#1e1e2e'}\`, borderRadius: 14, padding: 22 }
              },
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 } },
                  React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
                    React.createElement(BrandIcon, { slug: meta.icon, color: meta.color, size: 20 }),
                    React.createElement('div', null,
                      React.createElement('div', { style: { fontWeight: 700, fontSize: 15, color: '#e2e8f0' } }, meta.label),
                      React.createElement('div', { style: { fontSize: 11, color: '#64748b', textTransform: 'capitalize' } }, meta.category)
                    )
                  ),
                  React.createElement(Badge, { label: connected ? 'Connected' : 'Not Connected', variant: connected ? 'success' : 'muted' })
                ),
                React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 } },
                  fields.map(f =>
                    React.createElement(Input, {
                      key: f.key, label: f.label, type: f.type,
                      value: intFields[name]?.[f.key] || '',
                      onChange: v => setIntField(name, f.key, v),
                      placeholder: f.type === 'password' ? '••••••••••••' : \`Enter \${f.label.toLowerCase()}...\`
                    })
                  )
                ),
                React.createElement(Btn, {
                  onClick: () => saveIntegration(name), variant: 'primary', size: 'sm',
                  disabled: intSaving[name]
                },
                  intSaving[name] ? React.createElement(Spinner, { size: 12, color: '#fff' }) : React.createElement(Save, { size: 13 }),
                  intSaving[name] ? 'Saving...' : 'Save'
                )
              );
            })
          )
        ),

        // LLM Config
        React.createElement('div', null,
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 } },
            React.createElement(Cpu, { size: 16, color: '#6366f1' }),
            React.createElement('h2', { style: { fontSize: 17, fontWeight: 700, color: '#e2e8f0' } }, 'LLM Configuration')
          ),
          React.createElement('div', { style: { background: '#13131a', border: '1px solid #1e1e2e', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 } },
            React.createElement(Select, {
              label: 'Provider',
              value: llmForm.provider,
              onChange: v => {
                setLlmField('provider', v);
                setLlmField('model', providerModels[v] || '');
              },
              options: [
                { value: 'anthropic', label: 'Anthropic (Claude)' },
                { value: 'openai', label: 'OpenAI' },
                { value: 'custom', label: 'Custom' },
              ]
            }),
            React.createElement(Input, { label: 'API Key', value: llmForm.apiKey, onChange: v => setLlmField('apiKey', v), type: 'password', placeholder: '••••••••••••' }),
            React.createElement(Input, {
              label: 'Model', value: llmForm.model, onChange: v => setLlmField('model', v),
              placeholder: providerModels[llmForm.provider] || 'your-model'
            }),
            llmForm.provider === 'custom' && React.createElement(Input, {
              label: 'Custom Endpoint', value: llmForm.endpoint, onChange: v => setLlmField('endpoint', v),
              placeholder: 'https://your-api.com/v1'
            }),
            React.createElement(Btn, { onClick: saveLlm, variant: 'primary', disabled: llmSaving },
              llmSaving ? React.createElement(Spinner, { size: 14, color: '#fff' }) : React.createElement(Save, { size: 14 }),
              llmSaving ? 'Saving...' : 'Save Configuration'
            )
          )
        )
      );
    }


    function AIChatPanel({ open, onClose, messages, setMessages, currentWorkspace, setCurrentWorkspace }) {
      const [input, setInput] = useState('');
      const [loading, setLoading] = useState(false);
      const messagesEndRef = useRef(null);
      const inputRef = useRef(null);

      useEffect(() => {
        if (open) {
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
          inputRef.current?.focus();
        }
      }, [messages, open]);

      if (!open) return null;

      const quickActions = ['Analyze my SEO', 'Create an agent', 'Draft LinkedIn post', 'Check email'];

      const sendMessage = async (text) => {
        const msg = text || input.trim();
        if (!msg || loading) return;
        setInput('');
        const userMsg = { role: 'user', content: msg, id: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);
        try {
          const res = await fetch('/api/chat', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg, workspace: currentWorkspace })
          });
          if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
          const data = await res.json();
          setMessages(prev => [...prev, { role: 'assistant', content: data.response || data.message || 'Done!', id: Date.now() + 1 }]);
        } catch (e) {
          setMessages(prev => [...prev, { role: 'assistant', content: \`Error: \${e.message}\`, id: Date.now() + 1, error: true }]);
        } finally {
          setLoading(false);
        }
      };

      return React.createElement('div', {
        className: 'chat-panel',
        style: {
          position: 'fixed', bottom: 20, right: 20, width: 380, height: 520, zIndex: 500,
          background: '#13131a', border: '1px solid #1e1e2e', borderRadius: 18,
          display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
        }
      },
        // Header
        React.createElement('div', { style: { padding: '14px 18px', borderBottom: '1px solid #1e1e2e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
            React.createElement('div', {
              style: { width: 8, height: 8, borderRadius: '50%', background: '#10b981' }
            }),
            React.createElement('span', { style: { fontWeight: 700, fontSize: 14, color: '#e2e8f0' } }, 'AI Assistant')
          ),
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
            // Workspace selector
            React.createElement('div', { style: { display: 'flex', background: '#0a0a0f', borderRadius: 8, padding: 2, border: '1px solid #1e1e2e' } },
              ['marketing', 'sales'].map(w =>
                React.createElement('button', {
                  key: w,
                  onClick: () => setCurrentWorkspace(w),
                  style: {
                    padding: '3px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                    background: currentWorkspace === w ? '#6366f1' : 'none',
                    color: currentWorkspace === w ? '#fff' : '#64748b',
                    transition: 'all 0.15s', textTransform: 'capitalize'
                  }
                }, w)
              )
            ),
            React.createElement('button', {
              onClick: onClose,
              style: { background: '#1e1e2e', border: 'none', borderRadius: 7, padding: 6, cursor: 'pointer', color: '#64748b', display: 'flex' }
            }, React.createElement(X, { size: 14 }))
          )
        ),

        // Messages
        React.createElement('div', { style: { flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 } },
          messages.length === 0 && React.createElement('div', { style: { textAlign: 'center', padding: '30px 20px', color: '#64748b' } },
            React.createElement('div', { style: { fontSize: 32, marginBottom: 12 } }, '🤖'),
            React.createElement('div', { style: { fontSize: 14, fontWeight: 600, color: '#94a3b8', marginBottom: 6 } }, 'AI Assistant'),
            React.createElement('div', { style: { fontSize: 12, lineHeight: 1.6 } }, 'Ask me anything about your marketing, sales, or to help create agents.')
          ),
          messages.map(msg =>
            React.createElement('div', {
              key: msg.id,
              style: { display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }
            },
              React.createElement('div', {
                style: {
                  maxWidth: '85%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: msg.role === 'user' ? '#6366f1' : msg.error ? 'rgba(239,68,68,0.1)' : '#1a1a24',
                  border: msg.role !== 'user' ? \`1px solid \${msg.error ? 'rgba(239,68,68,0.3)' : '#1e1e2e'}\` : 'none',
                  color: msg.role === 'user' ? '#fff' : msg.error ? '#ef4444' : '#e2e8f0',
                  fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                }
              }, msg.content)
            )
          ),
          loading && React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-start' } },
            React.createElement('div', {
              style: { padding: '12px 16px', background: '#1a1a24', border: '1px solid #1e1e2e', borderRadius: '14px 14px 14px 4px', display: 'flex', gap: 4, alignItems: 'center' }
            },
              React.createElement('span', { className: 'typing-dot' }),
              React.createElement('span', { className: 'typing-dot' }),
              React.createElement('span', { className: 'typing-dot' })
            )
          ),
          React.createElement('div', { ref: messagesEndRef })
        ),

        // Quick actions
        React.createElement('div', { style: { padding: '10px 16px 6px', display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '1px solid #1e1e2e', flexShrink: 0 } },
          quickActions.map(qa =>
            React.createElement('button', {
              key: qa, onClick: () => sendMessage(qa),
              style: {
                fontSize: 11, padding: '4px 10px', borderRadius: 20,
                background: '#0a0a0f', border: '1px solid #1e1e2e',
                color: '#64748b', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                fontWeight: 500
              },
              onMouseEnter: e => { e.target.style.borderColor = '#6366f1'; e.target.style.color = '#6366f1'; },
              onMouseLeave: e => { e.target.style.borderColor = '#1e1e2e'; e.target.style.color = '#64748b'; }
            }, qa)
          )
        ),

        // Input
        React.createElement('div', { style: { padding: '8px 12px 14px', borderTop: '1px solid #0a0a0f', flexShrink: 0 } },
          React.createElement('div', {
            style: { display: 'flex', gap: 8, background: '#0a0a0f', borderRadius: 12, border: '1px solid #1e1e2e', padding: '8px 8px 8px 14px', alignItems: 'flex-end' }
          },
            React.createElement('textarea', {
              ref: inputRef, value: input,
              onChange: e => setInput(e.target.value),
              onKeyDown: e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              },
              placeholder: 'Ask the AI assistant...',
              rows: 1,
              style: {
                flex: 1, background: 'none', border: 'none', color: '#e2e8f0',
                fontSize: 13, resize: 'none', outline: 'none', lineHeight: 1.5,
                maxHeight: 100, overflowY: 'auto', fontFamily: 'inherit'
              }
            }),
            React.createElement('button', {
              onClick: () => sendMessage(), disabled: !input.trim() || loading,
              style: {
                width: 32, height: 32, borderRadius: 9, border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                background: input.trim() && !loading ? '#6366f1' : '#1e1e2e',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.15s'
              }
            }, loading ? React.createElement(Spinner, { size: 13, color: '#fff' }) : React.createElement(Send, { size: 14 }))
          )
        )
      );
    }


    function App() {
      const [activePage, setActivePage] = useState('dashboard');
      const [integrations, setIntegrations] = useState([]);
      const [agents, setAgents] = useState([]);
      const [llmConfig, setLlmConfig] = useState(null);
      const [chatOpen, setChatOpen] = useState(false);
      const [chatMessages, setChatMessages] = useState([]);
      const [currentWorkspace, setCurrentWorkspace] = useState('marketing');
      const [loading, setLoading] = useState(true);
      const { toasts, show: showToast } = useToast();

      useEffect(() => {
        const init = async () => {
          try {
            const [intRes, agentRes, llmRes] = await Promise.allSettled([
              fetch('/api/integrations').then(r => r.json()),
              fetch('/api/agents').then(r => r.json()),
              fetch('/api/llm/config').then(r => r.json()),
            ]);
            if (intRes.status === 'fulfilled') setIntegrations(Array.isArray(intRes.value) ? intRes.value : []);
            if (agentRes.status === 'fulfilled') setAgents(Array.isArray(agentRes.value) ? agentRes.value : []);
            if (llmRes.status === 'fulfilled' && llmRes.value) setLlmConfig(llmRes.value);
          } catch (e) {
            console.error('Init error:', e);
          } finally {
            setLoading(false);
          }
        };
        init();
      }, []);

      const renderPage = () => {
        if (loading) return React.createElement('div', {
          style: { display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }
        },
          React.createElement(Spinner, { size: 36 }),
          React.createElement('div', { style: { color: '#64748b', fontSize: 14 } }, 'Loading AIHive...')
        );

        switch (activePage) {
          case 'dashboard':  return React.createElement(Dashboard, { integrations, agents, setActivePage });
          case 'marketing':  return React.createElement(MarketingWorkspace, { integrations, setActivePage });
          case 'sales':      return React.createElement(SalesWorkspace, { integrations, setActivePage });
          case 'agents':     return React.createElement(AgentStudio, { agents, setAgents, setChatOpen, setChatMessages, showToast });
          case 'settings':   return React.createElement(SettingsPage, { integrations, setIntegrations, llmConfig, setLlmConfig, showToast });
          default:           return React.createElement(Dashboard, { integrations, agents, setActivePage });
        }
      };

      return React.createElement('div', { style: { display: 'flex', height: '100vh', overflow: 'hidden' } },
        React.createElement(Sidebar, {
          activePage, setActivePage, integrations, agents, chatOpen, setChatOpen
        }),
        React.createElement('main', {
          style: { flex: 1, marginLeft: 240, height: '100vh', overflowY: 'auto', background: '#0a0a0f' }
        }, renderPage()),
        React.createElement(AIChatPanel, {
          open: chatOpen, onClose: () => setChatOpen(false),
          messages: chatMessages, setMessages: setChatMessages,
          currentWorkspace, setCurrentWorkspace
        }),
        React.createElement(ToastContainer, { toasts })
      );
    }

    // Mount
    const root = createRoot(document.getElementById('root'));
    root.render(React.createElement(App));
  </script>
</body>
</html>`;
}
