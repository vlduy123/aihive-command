import { getAppJS2 } from "./frontend_js2.ts";
export function getAppJS(): string {
  return `
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

    const _ch = await import('/api/app-charts').catch(() => ({}));
    const FunnelSection = _ch.FunnelSection || (({integrations}) => {
      const ga4 = integrations.find(i=>i.name==='ga4'&&i.connected);
      if(!ga4) return null;
      return React.createElement('div',{style:{background:'#13131a',border:'1px solid #1e1e2e',borderRadius:14,padding:24,marginBottom:24,color:'#64748b',fontSize:13}},'Funnel data loading...');
    });
    const BarChart = _ch.BarChart || null;
    const Sparkline = _ch.Sparkline || (({data=[],color='#6366f1',width=72,height=28})=>{
      if(data.length<2)return null;
      const mn=Math.min(...data),mx=Math.max(...data),r=mx-mn||1;
      const pts=data.map((v,i)=>[(i/(data.length-1))*width,height-((v-mn)/r)*(height-4)+2].join(',')).join(' ');
      return React.createElement('svg',{width,height,style:{overflow:'visible',display:'block'}},React.createElement('polyline',{points:pts,fill:'none',stroke:color,strokeWidth:1.5,strokeLinejoin:'round',strokeLinecap:'round'}));
    });

    const _ui = await import('/api/app-ui').catch(() => ({}));
    const Spinner = _ui.Spinner || (p=>React.createElement('div',{className:'spin',style:{width:p.size||18,height:p.size||18,borderRadius:'50%',border:'2px solid rgba(99,102,241,.2)',borderTopColor:p.color||'#6366f1'}}));
    const Badge = _ui.Badge || (p=>React.createElement('span',{style:{padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:600,background:'rgba(99,102,241,.15)',color:'#6366f1'}},p.label));
    const Toggle = _ui.Toggle || (p=>React.createElement('button',{onClick:()=>p.onChange(!p.value),style:{width:36,height:20,borderRadius:10,border:'none',cursor:'pointer',background:p.value?'#6366f1':'#1e1e2e',position:'relative',flexShrink:0}},React.createElement('div',{style:{position:'absolute',top:2,left:p.value?18:2,width:16,height:16,borderRadius:'50%',background:'#fff'}})));
    const Btn = _ui.Btn || (p=>React.createElement('button',{onClick:p.onClick,disabled:p.disabled,style:{display:'inline-flex',alignItems:'center',gap:6,padding:p.size==='sm'?'5px 12px':'8px 16px',borderRadius:8,border:'none',background:p.variant==='ghost'?'rgba(255,255,255,0.05)':p.variant==='danger'?'rgba(239,68,68,0.15)':'#6366f1',color:p.variant==='ghost'?'#94a3b8':p.variant==='danger'?'#ef4444':'#fff',fontSize:13,fontWeight:500,cursor:p.disabled?'not-allowed':'pointer',opacity:p.disabled?.5:1,...(p.style||{})}},p.children));
    const Input = _ui.Input || (p=>React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:6,...(p.style||{})}},p.label&&React.createElement('label',{style:{fontSize:12,fontWeight:500,color:'#64748b',textTransform:'uppercase'}},p.label),React.createElement('input',{type:p.type||'text',value:p.value||'',onChange:e=>p.onChange&&p.onChange(e.target.value),placeholder:p.placeholder||'',style:{width:'100%',background:'#0a0a0f',border:'1px solid #1e1e2e',borderRadius:8,padding:'9px 12px',color:'#e2e8f0',fontSize:14}})));
    const Textarea = _ui.Textarea || (p=>React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:6,...(p.style||{})}},p.label&&React.createElement('label',{style:{fontSize:12,fontWeight:500,color:'#64748b',textTransform:'uppercase'}},p.label),React.createElement('textarea',{value:p.value||'',onChange:e=>p.onChange&&p.onChange(e.target.value),placeholder:p.placeholder||'',rows:p.rows||4,style:{width:'100%',background:'#0a0a0f',border:'1px solid #1e1e2e',borderRadius:8,padding:'9px 12px',color:'#e2e8f0',fontSize:14,resize:'vertical',fontFamily:'inherit'}})));
    const Select = _ui.Select || (p=>React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:6,...(p.style||{})}},p.label&&React.createElement('label',{style:{fontSize:12,fontWeight:500,color:'#64748b',textTransform:'uppercase'}},p.label),React.createElement('select',{value:p.value,onChange:e=>p.onChange&&p.onChange(e.target.value),style:{width:'100%',background:'#0a0a0f',border:'1px solid #1e1e2e',borderRadius:8,padding:'9px 12px',color:'#e2e8f0',fontSize:14}},p.options&&p.options.map(o=>React.createElement('option',{key:o.value,value:o.value},o.label)))));
    const BrandIcon = _ui.BrandIcon || (p=>React.createElement('div',{style:{width:(p.size||18)+14,height:(p.size||18)+14,borderRadius:10,background:(p.color||'#6366f1')+'22',display:'flex',alignItems:'center',justifyContent:'center'}},React.createElement('img',{src:'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/'+p.slug+'.svg',width:p.size||18,height:p.size||18,style:{filter:'invert(1)',opacity:.9}})));
    const MetricCard = _ui.MetricCard || (p=>React.createElement('div',{style:{background:'#13131a',border:'1px solid #1e1e2e',borderRadius:14,padding:24}},React.createElement('div',{style:{fontSize:28,fontWeight:700,color:'#e2e8f0'}},p.value),React.createElement('div',{style:{fontWeight:600,color:'#e2e8f0'}},p.title)));
    const DataDisplay = _ui.DataDisplay || (p=>p.loading?React.createElement('div',{style:{padding:32,display:'flex',justifyContent:'center'}},React.createElement(Spinner,{})):p.error?React.createElement('div',{style:{padding:14,borderRadius:8,background:'#1a0808',border:'1px solid #7f1d1d',color:'#ef4444',fontSize:13}},String(p.error)):null);
    const DateRangePicker = _ui.DateRangePicker || (({value,onChange})=>React.createElement('div',{style:{display:'flex',background:'#0a0a0f',borderRadius:8,padding:2,border:'1px solid #1e1e2e',gap:1}},
      [{label:'7d',days:7},{label:'30d',days:30},{label:'90d',days:90}].map(o=>React.createElement('button',{key:o.days,onClick:()=>onChange(o.days),style:{padding:'4px 10px',borderRadius:6,border:'none',cursor:'pointer',fontSize:11,fontWeight:600,background:value===o.days?'#6366f1':'none',color:value===o.days?'#fff':'#64748b'}},o.label))));
    const TrendBadge = _ui.TrendBadge || (({current,previous})=>{if(!previous)return null;const pct=(current-previous)/Math.abs(previous)*100,up=pct>=0;return React.createElement('span',{style:{fontSize:11,fontWeight:700,padding:'1px 6px',borderRadius:5,color:up?'#10b981':'#ef4444',background:up?'rgba(16,185,129,0.12)':'rgba(239,68,68,0.12)'}},(up?'↑ +':'↓ ')+Math.abs(pct).toFixed(1)+'%');});
    const LineChart = _ch.LineChart || null;
    const ChannelChart = _ch.ChannelChart || null;

    const parseTools = (tools) => {
      if (Array.isArray(tools)) return tools;
      if (typeof tools === 'string' && tools.trim()) {
        try { return JSON.parse(tools); } catch { return []; }
      }
      return [];
    };


    const INTEGRATIONS = ['google', 'ahrefs', 'ga4', 'gsc', 'linkedin', 'outlook', 'wordpress', 'youtube', 'producthunt'];

    const INTEGRATION_META = {
      google:      { icon: 'google',              label: 'Google OAuth',          category: 'marketing', color: '#4285f4' },
      ahrefs:      { icon: 'ahrefs',             label: 'Ahrefs',                category: 'marketing', color: '#f59e0b' },
      ga4:         { icon: 'googleanalytics',     label: 'Google Analytics 4',    category: 'marketing', color: '#e37400' },
      gsc:         { icon: 'googlesearchconsole', label: 'Google Search Console', category: 'marketing', color: '#34a853' },
      linkedin:    { icon: 'linkedin',            label: 'LinkedIn',              category: 'sales',     color: '#0077b5' },
      outlook:     { icon: 'microsoftoutlook',    label: 'Outlook',               category: 'sales',     color: '#0078d4' },
      wordpress:   { icon: 'wordpress',           label: 'WordPress',             category: 'marketing', color: '#21759b' },
      youtube:     { icon: 'youtube',             label: 'YouTube',               category: 'marketing', color: '#ff0000' },
      producthunt: { icon: 'producthunt',         label: 'Product Hunt',          category: 'marketing', color: '#da552f' },
    };

    const INTEGRATION_ACTIONS = {
      google:      [],
      ahrefs:      [
        { label: 'Site Overview', endpoint: 'site-explorer' },
        { label: 'Top Pages', endpoint: 'top-pages' },
        { label: 'Keywords', endpoint: 'keywords' },
        { label: 'Backlinks', endpoint: 'backlinks' },
        { label: 'Ref. Domains', endpoint: 'referring-domains' },
        { label: 'Domain Rating', endpoint: 'domain-rating' },
        { label: 'Organic KWs', endpoint: 'organic-keywords' },
      ],
      ga4:         [
        { label: 'KPI Overview', endpoint: 'kpi' },
        { label: 'Traffic Trend', endpoint: 'traffic-over-time' },
        { label: 'Acquisition', endpoint: 'user-acquisition' },
        { label: 'Realtime', endpoint: 'realtime' },
        { label: 'Traffic Report', endpoint: 'report' },
        { label: 'Top Pages', endpoint: 'page-views' },
        { label: 'Top Events', endpoint: 'top-events' },
        { label: 'Devices', endpoint: 'device-breakdown' },
      ],
      gsc:         [
        { label: 'Search Queries', endpoint: 'search-analytics' },
        { label: 'Top Pages', endpoint: 'pages' },
        { label: 'Sitemaps', endpoint: 'sitemaps' },
      ],
      linkedin:    [{ label: 'My Profile', endpoint: 'profile' }, { label: 'Posts', endpoint: 'posts' }],
      outlook:     [{ label: 'Inbox', endpoint: 'inbox' }, { label: 'Calendar', endpoint: 'calendar' }],
      wordpress:   [{ label: 'Posts', endpoint: 'posts' }, { label: 'Pages', endpoint: 'pages' }, { label: 'Media', endpoint: 'media' }, { label: 'Categories', endpoint: 'categories' }],
      youtube:     [{ label: 'Trending Videos', endpoint: 'videos' }, { label: 'Search', endpoint: 'search' }, { label: 'Channels', endpoint: 'channels' }],
      producthunt: [{ label: "Today's Posts", endpoint: 'posts' }, { label: 'Topics', endpoint: 'topics' }],
    };

    // google = shared OAuth credentials for all Google APIs (GA4 + GSC + YouTube).
    // GA4 and GSC inherit the google token automatically; per-service tokens override it.
    const INTEGRATION_FIELDS = {
      google:      [
        { key: 'clientId',   label: 'OAuth Client ID',     type: 'text',     hint: 'From Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID (includes .apps.googleusercontent.com)' },
        { key: 'apiSecret',  label: 'OAuth Client Secret', type: 'password', hint: 'From the same OAuth 2.0 credential — Client Secret field' },
        { key: 'redirectUri',label: 'Redirect URI',        type: 'text',     hint: 'Copy this exactly to Google Cloud Console → Authorized Redirect URIs. Value: ' + window.location.origin + '/api/auth/google/callback' },
      ],
      ahrefs:      [{ key: 'apiKey', label: 'API Key', type: 'password' }, { key: 'target', label: 'Target Domain', type: 'text' }],
      ga4:         [
        { key: 'propertyId', label: 'GA4 Property ID', type: 'text', hint: 'Numbers only — e.g. 123456789. Token comes from Google OAuth above.' },
      ],
      gsc:         [
        { key: 'siteUrl', label: 'Site URL', type: 'text', hint: 'e.g. https://example.com — token comes from Google OAuth above.' },
      ],
      linkedin:    [{ key: 'accessToken', label: 'Access Token', type: 'password', hint: 'LinkedIn v2 API — requires Marketing Developer Platform approval for most endpoints. Get a token via LinkedIn OAuth at developer.linkedin.com.' }],
      outlook:     [{ key: 'accessToken', label: 'Access Token', type: 'password' }],
      wordpress:   [{ key: 'siteUrl', label: 'Site URL', type: 'text' }, { key: 'apiKey', label: 'Username', type: 'text' }, { key: 'apiSecret', label: 'App Password', type: 'password' }],
      youtube:     [
        { key: 'apiKey', label: 'API Key (public data)', type: 'password', hint: 'For public endpoints only. Google OAuth token used automatically for your own channel.' },
      ],
      producthunt: [{ key: 'apiKey', label: 'API Key', type: 'password' }],
    };

    const ALL_TOOLS = ['google', 'ahrefs', 'ga4', 'gsc', 'linkedin', 'outlook', 'wordpress', 'youtube', 'producthunt'];


    function useToast() {
      const [toasts, setToasts] = useState([]);
      const show = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev.slice(-4), { id, message, type }]);
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


    // Normalize each integration's API response into a flat structure DataDisplay can render.
    // Fixes [object Object] cells by extracting nested objects into flat key-value rows.
    function normalizeData(name, endpoint, data) {
      if (!data || typeof data !== 'object') return data;
      switch (name) {
        case 'gsc': {
          // GSC rows have a 'keys' array (query/page) that must be unpacked
          if (Array.isArray(data.rows)) {
            return data.rows.map(r => ({
              [endpoint === 'pages' ? 'page' : 'query']: (r.keys || [])[0] || '',
              clicks: r.clicks, impressions: r.impressions,
              ctr: r.ctr != null ? (r.ctr * 100).toFixed(2) + '%' : '—',
              position: r.position != null ? r.position.toFixed(1) : '—'
            }));
          }
          if (Array.isArray(data.sitemap)) return data.sitemap.map(s => ({
            path: s.path, type: s.type, lastSubmitted: s.lastSubmitted?.slice(0, 10),
            isPending: s.isPending, warnings: s.warnings, errors: s.errors, contents: s.contents?.length
          }));
          return data;
        }
        case 'youtube': {
          if (Array.isArray(data.items)) {
            return data.items.map(item => ({
              id: item.id?.videoId || item.id?.channelId || (typeof item.id === 'string' ? item.id : ''),
              title: item.snippet?.title || '',
              channel: item.snippet?.channelTitle || '',
              published: item.snippet?.publishedAt?.slice(0, 10) || '',
              views: item.statistics?.viewCount || '',
              likes: item.statistics?.likeCount || '',
              comments: item.statistics?.commentCount || '',
              subscribers: item.statistics?.subscriberCount || ''
            }));
          }
          return data;
        }
        case 'producthunt': {
          const postEdges = data?.data?.posts?.edges || [];
          const topicEdges = data?.data?.topics?.edges || [];
          const edges = postEdges.length ? postEdges : topicEdges;
          if (edges.length) {
            return edges.map(e => {
              const n = e.node || e;
              return { id: n.id, name: n.name, tagline: n.tagline || '', slug: n.slug || '',
                votes: n.votesCount || '', followers: n.followersCount || '',
                comments: n.commentsCount || '', url: n.url || '' };
            });
          }
          return data;
        }
        case 'wordpress': {
          if (Array.isArray(data)) {
            return data.map(p => ({
              id: p.id, date: p.date?.slice(0, 10) || '', status: p.status || '',
              title: p.title?.rendered || p.title || '',
              link: p.link || '', type: p.type || '',
              author: p.author, commentCount: p.comment_count
            }));
          }
          return data;
        }
        case 'outlook': {
          if (Array.isArray(data.value)) {
            return data.value.map(m => ({
              subject: m.subject || '(no subject)',
              from: m.from?.emailAddress?.name || m.from?.emailAddress?.address || '',
              received: m.receivedDateTime?.slice(0, 16) || m.start?.dateTime?.slice(0, 16) || '',
              isRead: m.isRead != null ? (m.isRead ? 'Yes' : 'No') : '',
              location: m.location?.displayName || '',
              end: m.end?.dateTime?.slice(0, 16) || ''
            }));
          }
          return data;
        }
        case 'linkedin': {
          if (Array.isArray(data.elements)) {
            return data.elements.map(e => ({
              id: e.id || '', urn: e.ugcPost || e.author || '',
              created: e.created?.time ? new Date(e.created.time).toISOString().slice(0, 10) : '',
              lifecycle: e.lifecycleState || ''
            }));
          }
          // Profile response
          if (data.localizedFirstName || data.firstName) {
            const first = data.localizedFirstName || Object.values(data.firstName?.localized || {})[0] || '';
            const last = data.localizedLastName || Object.values(data.lastName?.localized || {})[0] || '';
            return { name: \`\${first} \${last}\`.trim(), id: data.id, headline: data.localizedHeadline || '' };
          }
          return data;
        }
        default:
          return data;
      }
    }

    // Transform raw GA4 API response → flat row array
    function parseGA4Rows(data) {
      if (!data?.rows?.length) return [];
      if (data.dimensionHeaders) {
        const dh = data.dimensionHeaders.map(h => h.name);
        const mh = (data.metricHeaders || []).map(h => h.name);
        return data.rows.map(r => ({
          ...Object.fromEntries(dh.map((k, i) => [k, r.dimensionValues[i]?.value])),
          ...Object.fromEntries(mh.map((k, i) => [k, r.metricValues[i]?.value]))
        }));
      }
      if (data.metricHeaders) {
        const mh = data.metricHeaders.map(h => h.name);
        return data.rows.map(r => Object.fromEntries(mh.map((k, i) => [k, r.metricValues[i]?.value])));
      }
      return [];
    }

    function GA4RichDisplay({ data, endpoint }) {
      const fmtN = v => { const n = parseFloat(v)||0; return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(Math.round(n*100)/100); };
      const fmtPct = v => (parseFloat(v)*100).toFixed(1)+'%';

      if (endpoint === 'traffic-over-time') {
        const rows = parseGA4Rows(data);
        if (!rows.length || !LineChart) return null;
        return React.createElement('div', { style: { marginTop: 16, background: '#0d0d14', border: '1px solid #1e1e2e', borderRadius: 12, padding: 20 } },
          React.createElement('div', { style: { fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 14 } }, 'Sessions Over Time'),
          React.createElement(LineChart, { data: rows, xKey: 'date', yKey: 'sessions', color: '#4285f4' })
        );
      }

      if (endpoint === 'user-acquisition') {
        const rows = parseGA4Rows(data);
        if (!rows.length || !ChannelChart) return null;
        return React.createElement('div', { style: { marginTop: 16, background: '#0d0d14', border: '1px solid #1e1e2e', borderRadius: 12, padding: 20 } },
          React.createElement('div', { style: { fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 14 } }, 'Sessions by Channel'),
          React.createElement(ChannelChart, { data: rows, labelKey: 'sessionDefaultChannelGroup', valueKey: 'sessions' })
        );
      }

      if (endpoint === 'kpi') {
        // GA4 kpi returns two dateRange columns per metric; metricValues alternate current/previous
        const mh = (data.metricHeaders || []).map(h => h.name);
        const row = data.rows?.[0];
        if (!row || !mh.length) return null;
        const vals = row.metricValues || [];
        // With 2 dateRanges and N metrics: values[0..N-1]=current, values[N..2N-1]=previous
        const n = mh.length;
        const KPI_META = [
          { key: 'sessions',       label: 'Sessions',         color: '#6366f1', fmt: fmtN },
          { key: 'activeUsers',    label: 'Active Users',     color: '#10b981', fmt: fmtN },
          { key: 'newUsers',       label: 'New Users',        color: '#f59e0b', fmt: fmtN },
          { key: 'screenPageViews',label: 'Page Views',       color: '#8b5cf6', fmt: fmtN },
          { key: 'engagementRate', label: 'Engagement Rate',  color: '#06b6d4', fmt: fmtPct },
          { key: 'bounceRate',     label: 'Bounce Rate',      color: '#ef4444', fmt: fmtPct },
        ];
        return React.createElement('div', {
          style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 12, marginTop: 16 }
        },
          KPI_META.map(({ key, label, color, fmt }) => {
            const idx = mh.indexOf(key);
            if (idx < 0) return null;
            const cur = parseFloat(vals[idx]?.value || '0');
            const prev = n < vals.length ? parseFloat(vals[idx + n]?.value || '0') : null;
            return React.createElement('div', {
              key, style: { background: '#0d0d14', border: \`1px solid \${color}28\`, borderRadius: 12, padding: 18 }
            },
              React.createElement('div', { style: { fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 } }, label),
              React.createElement('div', { style: { display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' } },
                React.createElement('div', { style: { fontSize: 26, fontWeight: 800, color: '#e2e8f0', lineHeight: 1 } }, fmt(String(cur))),
                prev != null && React.createElement(TrendBadge, { current: cur, previous: prev })
              ),
              React.createElement('div', { style: { marginTop: 8, height: 2, borderRadius: 1, background: color, opacity: 0.35 } })
            );
          }).filter(Boolean)
        );
      }

      return null;
    }

    function IntegrationPanel({ integrationName, integrations, onGoToSettings, onTargetSave }) {
      const meta = INTEGRATION_META[integrationName];
      const actions = INTEGRATION_ACTIONS[integrationName] || [];
      const integration = integrations.find(i => i.name === integrationName);
      const connected = integration?.connected;

      const [activeEndpoint, setActiveEndpoint] = useState(null);
      const [data, setData] = useState(null);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState(null);
      const [autoRefresh, setAutoRefresh] = useState(false);
      const [countdown, setCountdown] = useState(0);
      const [lastFetched, setLastFetched] = useState(null);
      const [targetEdit, setTargetEdit] = useState('');
      const [savingTarget, setSavingTarget] = useState(false);
      const [days, setDays] = useState(30);
      const arRef = useRef(null);
      const cdRef = useRef(null);
      const savedTarget = integration?.extra_config?.target || '';

      const fetchData = async (endpoint, extraParams='', daysOverride=null) => {
        const ep = endpoint || activeEndpoint;
        if (!ep) return;
        setActiveEndpoint(ep);
        setLoading(true);
        setError(null);
        setData(null);
        try {
          const qs = [extraParams, \`days=\${daysOverride ?? days}\`].filter(Boolean).join('&');
          const res = await fetch(\`/api/integrations/\${integrationName}/data?endpoint=\${ep}&\${qs}\`);
          const json = await res.json();
          if (!res.ok) throw new Error(json?.error || json?.message || \`HTTP \${res.status}\`);
          setData(json);
          setLastFetched(new Date());
        } catch (e) {
          setError(e.message || 'Failed to fetch data');
        } finally {
          setLoading(false);
        }
      };

      const saveTarget = async () => {
        if (!targetEdit.trim()) return;
        setSavingTarget(true);
        try {
          await fetch(\`/api/integrations/\${integrationName}\`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ extra_config: { target: targetEdit.trim() } })
          });
          if (onTargetSave) onTargetSave(integrationName, targetEdit.trim());
        } finally { setSavingTarget(false); }
      };

      useEffect(() => {
        clearInterval(arRef.current);
        clearInterval(cdRef.current);
        if (!autoRefresh || !activeEndpoint) return;
        const INTERVAL = 30000;
        setCountdown(INTERVAL / 1000);
        arRef.current = setInterval(() => { fetchData(activeEndpoint); setCountdown(INTERVAL / 1000); }, INTERVAL);
        cdRef.current = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
        return () => { clearInterval(arRef.current); clearInterval(cdRef.current); };
      }, [autoRefresh, activeEndpoint]);

      const analyzeWithAI = () => {
        if (!data) return;
        window.dispatchEvent(new CustomEvent('analyze-data', { detail: { source: meta.label, endpoint: activeEndpoint, data } }));
      };

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

      return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
            React.createElement(BrandIcon, { slug: meta.icon, color: meta.color, size: 20 }),
            React.createElement('div', null,
              React.createElement('div', { style: { fontWeight: 700, fontSize: 17, color: '#e2e8f0' } }, meta.label),
              React.createElement('div',{style:{display:'flex',alignItems:'center',gap:6,marginTop:3}},
                React.createElement(Badge, { label: 'Connected', variant: 'success' }),
                lastFetched&&React.createElement('span',{style:{fontSize:10,color:'#4a5568'}},
                  'Updated '+Math.round((Date.now()-lastFetched)/1000)+'s ago'
                )
              )
            )
          ),
          React.createElement('div', { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } },
            React.createElement(DateRangePicker, {
              value: days,
              onChange: v => { setDays(v); if (activeEndpoint) fetchData(activeEndpoint, '', v); }
            }),
            data && !loading && React.createElement('button', {
              onClick: analyzeWithAI,
              style: { fontSize: 12, padding: '5px 12px', borderRadius: 7, border: '1px solid rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.1)', color: '#818cf8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500 }
            }, React.createElement(Zap, { size: 12 }), 'AI Insights'),
            activeEndpoint && React.createElement('label', {
              style: { display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: autoRefresh ? '#10b981' : '#64748b', userSelect: 'none' }
            },
              React.createElement(Toggle, { value: autoRefresh, onChange: setAutoRefresh }),
              autoRefresh ? \`Auto (\${countdown}s)\` : 'Auto'
            ),
            React.createElement(Btn, { onClick: () => fetchData(activeEndpoint), variant: 'ghost', size: 'sm', disabled: !activeEndpoint || loading },
              loading ? React.createElement(Spinner, { size: 13 }) : React.createElement(RefreshCw, { size: 13 }),
              'Refresh'
            )
          )
        ),

        integrationName === 'ahrefs' && React.createElement('div',{style:{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:'#0d0d14',borderRadius:9,border:'1px solid #1e1e2e'}},
          React.createElement(Globe,{size:13,color:'#64748b'}),
          React.createElement('span',{style:{fontSize:12,color:'#64748b',flexShrink:0}},'Target:'),
          savedTarget&&!targetEdit?
            React.createElement('span',{style:{fontSize:13,color:'#10b981',fontWeight:500,flex:1}},savedTarget):
            React.createElement('input',{
              placeholder:'example.com',value:targetEdit,
              onChange:e=>setTargetEdit(e.target.value),
              onKeyDown:e=>e.key==='Enter'&&saveTarget(),
              style:{flex:1,background:'transparent',border:'none',color:'#e2e8f0',fontSize:12,outline:'none',minWidth:0}
            }),
          savedTarget&&!targetEdit?
            React.createElement('button',{onClick:()=>setTargetEdit(savedTarget),style:{fontSize:10,color:'#6366f1',background:'none',border:'none',cursor:'pointer',flexShrink:0}},'change'):
            React.createElement('button',{onClick:saveTarget,disabled:savingTarget||!targetEdit.trim(),style:{fontSize:11,color:'#10b981',background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:5,padding:'2px 8px',cursor:'pointer',flexShrink:0}},savingTarget?'…':'Save')
        ),

        React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 7 } },
          actions.map(a =>
            React.createElement('button', {
              key: a.endpoint,
              onClick: () => fetchData(a.endpoint),
              style: {
                padding: '7px 14px', borderRadius: 8, border: \`1px solid \${activeEndpoint === a.endpoint ? '#6366f1' : '#1e1e2e'}\`,
                background: activeEndpoint === a.endpoint ? 'rgba(99,102,241,0.15)' : '#0a0a0f',
                color: activeEndpoint === a.endpoint ? '#6366f1' : '#94a3b8',
                fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 5
              }
            },
              loading && activeEndpoint === a.endpoint
                ? React.createElement(Spinner, { size: 11 })
                : React.createElement(Terminal, { size: 12 }),
              a.label
            )
          )
        ),
        integrationName === 'ga4' && data && !error && !loading &&
          React.createElement(GA4RichDisplay, { data, endpoint: activeEndpoint }),
        (integrationName !== 'ga4' || !['kpi','traffic-over-time','user-acquisition'].includes(activeEndpoint)) &&
          React.createElement(DataDisplay, {
            data: normalizeData(integrationName, activeEndpoint, data),
            loading: loading && activeEndpoint !== null, error, integrationName,
            onFix: onGoToSettings
          }),
        integrationName === 'ga4' && ['kpi','traffic-over-time','user-acquisition'].includes(activeEndpoint) && error &&
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
            React.createElement('div',{style:{padding:14,borderRadius:8,background:'#1a0808',border:'1px solid #7f1d1d',color:'#ef4444',fontSize:13}},String(error)),
            React.createElement(Btn, { onClick: onGoToSettings, variant: 'ghost', size: 'sm' },
              React.createElement(Settings, { size: 13 }), 'Fix in Settings'
            )
          )
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

        React.createElement('div', null,
          React.createElement('h2', { style: { fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 14 } }, 'Quick Actions'),
          React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 } },
            [
              { icon: React.createElement(TrendingUp,{size:15,color:'#f59e0b'}), label:'SEO Overview', desc:'Ahrefs site metrics', page:'marketing', tab:'ahrefs' },
              { icon: React.createElement(Activity,{size:15,color:'#4285f4'}), label:'Traffic Report', desc:'GA4 analytics', page:'marketing', tab:'ga4' },
              { icon: React.createElement(Search,{size:15,color:'#4285f4'}), label:'Search Queries', desc:'GSC top keywords', page:'marketing', tab:'gsc' },
              { icon: React.createElement(Bot,{size:15,color:'#6366f1'}), label:'Create Agent', desc:'Automate a task', page:'agents' },
            ].map((q,i)=>React.createElement('button',{
              key:i, onClick:()=>setActivePage(q.page),
              style:{background:'#13131a',border:'1px solid #1e1e2e',borderRadius:10,padding:'14px 16px',cursor:'pointer',textAlign:'left',transition:'border-color 0.15s',display:'flex',flexDirection:'column',gap:6}
            },
              React.createElement('div',{style:{display:'flex',alignItems:'center',gap:8}},q.icon,React.createElement('span',{style:{fontWeight:600,fontSize:13,color:'#e2e8f0'}},q.label)),
              React.createElement('span',{style:{fontSize:11,color:'#64748b'}},q.desc)
            ))
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
  ` + getAppJS2();
}