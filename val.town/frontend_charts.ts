// Chart and complex components served as ES module at /api/app-charts
// Imported dynamically by frontend_js.ts main app

export function getChartsJS(): string {
  return `
import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

export function Sparkline({ data = [], color = '#6366f1', width = 72, height = 28 }) {
  if (data.length < 2) return null;
  const mn = Math.min(...data), mx = Math.max(...data), r = mx - mn || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * width, height - ((v - mn) / r) * (height - 4) + 2].join(',')).join(' ');
  const trend = data[data.length - 1] > data[0];
  const c = color === 'auto' ? (trend ? '#10b981' : '#ef4444') : color;
  return React.createElement('svg', { width, height, style: { overflow: 'visible', display: 'block' } },
    React.createElement('polyline', { points: pts, fill: 'none', stroke: c, strokeWidth: 1.5, strokeLinejoin: 'round', strokeLinecap: 'round' })
  );
}

export function BarChart({ data = [], labelKey = 'label', valueKey = 'value', color = '#6366f1', maxBars = 10, showValues = true }) {
  if (!data.length) return null;
  const items = data.slice(0, maxBars);
  const max = Math.max(...items.map(d => Number(d[valueKey]) || 0)) || 1;
  const fmtN = v => v >= 1e6 ? (v/1e6).toFixed(1)+'M' : v >= 1e3 ? (v/1e3).toFixed(1)+'K' : String(v);
  return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6, width: '100%' } },
    items.map((d, i) => {
      const val = Number(d[valueKey]) || 0;
      const pct = (val / max) * 100;
      return React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 8 } },
        React.createElement('div', { style: { width: 140, fontSize: 12, color: '#94a3b8', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 } },
          String(d[labelKey] || '').slice(0, 25)),
        React.createElement('div', { style: { flex: 1, height: 20, background: '#1e1e2e', borderRadius: 4, overflow: 'hidden', position: 'relative' } },
          React.createElement('div', { style: { height: '100%', width: pct + '%', background: color, borderRadius: 4, transition: 'width 0.5s ease' } })
        ),
        showValues && React.createElement('div', { style: { fontSize: 11, color: '#64748b', width: 48, textAlign: 'right', flexShrink: 0 } }, fmtN(val))
      );
    })
  );
}

export function DonutChart({ data = [], size = 120, thickness = 18, centerLabel = '', centerSub = '' }) {
  if (!data.length) return null;
  const total = data.reduce((s, d) => s + (d.value || 0), 0) || 1;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const slices = data.map((d, i) => {
    const pct = (d.value || 0) / total;
    const dash = pct * circ;
    const gap = circ - dash;
    const slice = React.createElement('circle', {
      key: i, cx: size / 2, cy: size / 2, r,
      fill: 'none', stroke: d.color || '#6366f1', strokeWidth: thickness,
      strokeDasharray: \`\${dash} \${gap}\`,
      strokeDashoffset: -offset, strokeLinecap: 'round',
      style: { transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }
    });
    offset += dash;
    return slice;
  });
  return React.createElement('div', { style: { position: 'relative', width: size, height: size, flexShrink: 0 } },
    React.createElement('svg', { width: size, height: size }, ...slices),
    React.createElement('div', { style: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } },
      centerLabel && React.createElement('div', { style: { fontSize: 18, fontWeight: 800, color: '#e2e8f0', lineHeight: 1 } }, centerLabel),
      centerSub && React.createElement('div', { style: { fontSize: 10, color: '#64748b', textAlign: 'center' } }, centerSub)
    )
  );
}

export function LineChart({ data = [], xKey = 'date', yKey = 'sessions', color = '#6366f1', height = 110 }) {
  if (data.length < 2) return null;
  const vals = data.map(d => Number(d[yKey]) || 0);
  const mn = Math.min(...vals), mx = Math.max(...vals), r = mx - mn || 1;
  const W = 600, H = height;
  const pts = vals.map((v, i) => \`\${(i / (vals.length - 1)) * W},\${H - ((v - mn) / r) * (H - 16) + 8}\`).join(' ');
  const first = vals[0], last = vals[vals.length - 1];
  const pct = first ? ((last - first) / first * 100) : 0;
  const up = pct >= 0;
  const fmtN = v => v >= 1e6 ? (v/1e6).toFixed(1)+'M' : v >= 1e3 ? (v/1e3).toFixed(1)+'K' : String(Math.round(v));
  const xFirst = String(data[0]?.[xKey] || '').replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
  const xLast = String(data.at(-1)?.[xKey] || '').replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
  return React.createElement('div', { style: { width: '100%' } },
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } },
      React.createElement('span', { style: { fontSize: 11, color: '#64748b' } }, xFirst + ' → ' + xLast),
      React.createElement('span', { style: { fontSize: 12, fontWeight: 700, color: up ? '#10b981' : '#ef4444' } },
        (up ? '↑ +' : '↓ ') + Math.abs(pct).toFixed(1) + '%')
    ),
    React.createElement('svg', { viewBox: \`0 0 \${W} \${H}\`, style: { width: '100%', height: H, display: 'block' }, preserveAspectRatio: 'none' },
      [0.33, 0.66].map((t, i) => React.createElement('line', { key: i, x1: 0, x2: W, y1: H * t, y2: H * t, stroke: '#1e1e2e', strokeWidth: 1 })),
      React.createElement('polygon', { points: \`0,\${H} \${pts} \${W},\${H}\`, fill: color + '20' }),
      React.createElement('polyline', { points: pts, fill: 'none', stroke: color, strokeWidth: 2.5, strokeLinejoin: 'round', strokeLinecap: 'round' })
    ),
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginTop: 4 } },
      React.createElement('span', { style: { fontSize: 11, color: '#4a5568' } }, fmtN(first)),
      React.createElement('span', { style: { fontSize: 13, fontWeight: 700, color: '#e2e8f0' } }, fmtN(last))
    )
  );
}

export function ChannelChart({ data = [], labelKey = 'sessionDefaultChannelGroup', valueKey = 'sessions' }) {
  if (!data.length) return null;
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];
  const total = data.reduce((s, d) => s + (Number(d[valueKey]) || 0), 0) || 1;
  const fmtN = v => v >= 1e6 ? (v/1e6).toFixed(1)+'M' : v >= 1e3 ? (v/1e3).toFixed(1)+'K' : String(v);
  return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
    data.slice(0, 8).map((d, i) => {
      const val = Number(d[valueKey]) || 0, pct = (val / total * 100).toFixed(1), c = COLORS[i % COLORS.length];
      const label = String(d[labelKey] || '').replace(/_/g, ' ');
      return React.createElement('div', { key: i },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 5 } },
          React.createElement('span', { style: { fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 } },
            React.createElement('span', { style: { width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block', flexShrink: 0 } }), label
          ),
          React.createElement('span', { style: { fontSize: 12, fontWeight: 600, color: '#e2e8f0' } }, fmtN(val) + '  (' + pct + '%)')
        ),
        React.createElement('div', { style: { height: 6, background: '#1e1e2e', borderRadius: 3, overflow: 'hidden' } },
          React.createElement('div', { style: { height: '100%', width: pct + '%', background: c, borderRadius: 3, transition: 'width 0.6s ease' } })
        )
      );
    })
  );
}

export function FunnelSection({ integrations }) {
  const ga4 = integrations.find(i => i.name === 'ga4' && i.connected);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const SC = ['#4285f4', '#6366f1', '#8b5cf6', '#10b981'];

  const load = async () => {
    if (!ga4) return;
    setLoading(true); setErr(null);
    try {
      const r = await fetch('/api/integrations/ga4/data?endpoint=funnel', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funnel: { steps: [
            { name: 'Session Start', filterExpression: { funnelEventFilter: { eventName: 'session_start' } } },
            { name: 'Sign Up', filterExpression: { funnelEventFilter: { eventName: 'sign_up' } } }
          ]},
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }]
        })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || d.message || 'GA4 ' + r.status);
      setResult(d);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (ga4) load(); }, []);

  const card = { background: '#13131a', border: '1px solid #1e1e2e', borderRadius: 14, padding: 24, marginBottom: 24 };
  const rows = result?.funnelTable?.rows || [];
  const base = parseInt(rows[0]?.metricValues?.[0]?.value || '1', 10);

  return React.createElement('div', { style: card },
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 } },
      React.createElement('div', null,
        React.createElement('div', { style: { fontWeight: 700, fontSize: 16, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 } },
          React.createElement(Activity, { size: 17, color: '#6366f1' }), 'Acquisition Funnel'),
        React.createElement('div', { style: { fontSize: 12, color: '#64748b', marginTop: 3 } }, 'User flow · last 30 days')
      ),
      ga4 && React.createElement('button', {
        onClick: load, disabled: loading,
        style: { background: 'rgba(255,255,255,0.05)', border: '1px solid #1e1e2e', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', color: '#94a3b8', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }
      }, React.createElement(RefreshCw, { size: 12 }), 'Refresh')
    ),
    !ga4 && React.createElement('div', { style: { padding: '28px 0', color: '#64748b', fontSize: 13, textAlign: 'center' } }, 'Connect GA4 in Settings to view your acquisition funnel.'),
    ga4 && loading && !result && React.createElement('div', { style: { padding: '28px 0', textAlign: 'center', color: '#64748b' } }, 'Loading funnel data...'),
    ga4 && err && React.createElement('div', { style: { background: '#1a0a0a', border: '1px solid #7f1d1d', borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: 12, marginBottom: 10 } }, err),
    ga4 && result && rows.length === 0 && React.createElement('div', { style: { padding: '24px 0', color: '#64748b', fontSize: 13, textAlign: 'center' } }, 'No funnel data. Verify GA4 property ID.'),
    ga4 && rows.length > 0 && React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto', paddingBottom: 8 } },
      rows.map((row, i) => {
        const nm = row.dimensionValues?.[0]?.value || ('Step ' + (i + 1));
        const v = parseInt(row.metricValues?.[0]?.value || '0', 10);
        const pct = i === 0 ? 100 : Math.round(v / base * 1000) / 10;
        const c = SC[i % SC.length];
        return React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', flexShrink: 0 } },
          React.createElement('div', { style: { minWidth: 120, background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: 10, padding: '12px 14px', position: 'relative', overflow: 'hidden' } },
            React.createElement('div', { style: { fontSize: 19, fontWeight: 800, color: c, lineHeight: 1, marginBottom: 2 } }, v.toLocaleString()),
            React.createElement('div', { style: { fontSize: 11, fontWeight: 600, color: '#e2e8f0', marginBottom: 6 } }, nm),
            React.createElement('div', { style: { fontSize: 11, fontWeight: 700, color: i === 0 ? '#64748b' : pct > 5 ? '#10b981' : pct > 1 ? '#f59e0b' : '#ef4444' } }, i === 0 ? '100%' : pct.toFixed(1) + '%'),
            React.createElement('div', { style: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: c + '30' } },
              React.createElement('div', { style: { height: '100%', width: Math.min(pct, 100) + '%', background: c } }))
          ),
          i < rows.length - 1 && React.createElement('div', { style: { color: '#2a2a3e', fontSize: 18, padding: '0 3px' } }, '›')
        );
      })
    )
  );
}

export function IntegrationDonut({ integrations }) {
  const connected = integrations.filter(i => i.connected).length;
  const total = integrations.length;
  const data = [
    { value: connected, color: '#10b981' },
    { value: total - connected, color: '#1e1e2e' },
  ];
  return React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 16 } },
    React.createElement(DonutChart, { data, size: 80, thickness: 12, centerLabel: String(connected), centerSub: 'of ' + total }),
    React.createElement('div', null,
      React.createElement('div', { style: { fontSize: 14, fontWeight: 700, color: '#e2e8f0' } }, connected + ' Connected'),
      React.createElement('div', { style: { fontSize: 12, color: '#64748b', marginTop: 4 } }, (total - connected) + ' not configured'),
      data[0].value > 0 && React.createElement('div', { style: { fontSize: 11, color: '#10b981', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 } },
        React.createElement(TrendingUp, { size: 11 }), Math.round(connected / total * 100) + '% coverage'
      )
    )
  );
}
  `;
}
