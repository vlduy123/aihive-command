// Shared UI primitives + DataDisplay — served at /api/app-ui as ES module
export function getUIJS(): string {
  return `
import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

const fmtNum = v => typeof v!=='number'?v:v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':String(v);
function exportCSV(data,filename='export.csv'){
  const rows=(Array.isArray(data)?data:Object.values(data||{}).find(v=>Array.isArray(v)&&v.length)||[data]).filter(r=>r&&typeof r==='object');
  if(!rows.length)return;
  const keys=Object.keys(rows[0]);
  const csv=[keys.join(','),...rows.map(r=>keys.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\\n');
  Object.assign(document.createElement('a'),{href:'data:text/csv;charset=utf-8,'+encodeURIComponent(csv),download:filename}).click();
}

export function Spinner({size=18,color='#6366f1'}){
  return React.createElement('div',{className:'spin',style:{width:size,height:size,borderRadius:'50%',border:'2px solid rgba(99,102,241,0.2)',borderTopColor:color,flexShrink:0}});
}

export function Badge({label,variant='default'}){
  const s={default:{background:'rgba(99,102,241,0.15)',color:'#6366f1'},success:{background:'rgba(16,185,129,0.15)',color:'#10b981'},error:{background:'rgba(239,68,68,0.15)',color:'#ef4444'},warning:{background:'rgba(245,158,11,0.15)',color:'#f59e0b'},muted:{background:'#1e1e2e',color:'#64748b'}};
  return React.createElement('span',{style:{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:600,...s[variant]||s.default}},label);
}

export function Toggle({value,onChange}){
  return React.createElement('button',{onClick:()=>onChange(!value),style:{width:36,height:20,borderRadius:10,border:'none',cursor:'pointer',background:value?'#6366f1':'#1e1e2e',position:'relative',transition:'background 0.2s',flexShrink:0}},
    React.createElement('div',{style:{position:'absolute',top:2,left:value?18:2,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 4px rgba(0,0,0,0.4)'}})
  );
}

export function Btn({children,onClick,variant='primary',size='md',disabled=false,style={}}){
  const base={display:'inline-flex',alignItems:'center',gap:6,borderRadius:8,fontWeight:500,cursor:disabled?'not-allowed':'pointer',border:'none',transition:'all 0.15s',opacity:disabled?0.5:1,...style,
    ...(size==='sm'?{padding:'5px 12px',fontSize:12}:size==='lg'?{padding:'12px 24px',fontSize:15}:{padding:'8px 16px',fontSize:13}),
    ...(variant==='primary'?{background:'#6366f1',color:'#fff'}:variant==='ghost'?{background:'rgba(255,255,255,0.05)',color:'#94a3b8'}:variant==='danger'?{background:'rgba(239,68,68,0.15)',color:'#ef4444'}:variant==='success'?{background:'rgba(16,185,129,0.15)',color:'#10b981'}:{background:'#1e1e2e',color:'#94a3b8'})};
  return React.createElement('button',{onClick,disabled,style:base,onMouseEnter:e=>{if(!disabled)e.currentTarget.style.opacity='0.85';},onMouseLeave:e=>{e.currentTarget.style.opacity=disabled?'0.5':'1';}},children);
}

export function Input({label,value,onChange,type='text',placeholder='',style={}}){
  const [show,setShow]=useState(false);
  const isPass=type==='password';
  return React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:6,...style}},
    label&&React.createElement('label',{style:{fontSize:12,fontWeight:500,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.05em'}},label),
    React.createElement('div',{style:{position:'relative'}},
      React.createElement('input',{type:isPass&&!show?'password':'text',value,onChange:e=>onChange(e.target.value),placeholder,
        style:{width:'100%',background:'#0a0a0f',border:'1px solid #1e1e2e',borderRadius:8,padding:isPass?'9px 40px 9px 12px':'9px 12px',color:'#e2e8f0',fontSize:14,transition:'border-color 0.15s'}}),
      isPass&&React.createElement('button',{onClick:()=>setShow(!show),type:'button',
        style:{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#64748b',display:'flex',padding:2}},
        show?React.createElement(EyeOff,{size:15}):React.createElement(Eye,{size:15}))
    )
  );
}

export function Textarea({label,value,onChange,placeholder='',rows=4,style={}}){
  return React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:6,...style}},
    label&&React.createElement('label',{style:{fontSize:12,fontWeight:500,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.05em'}},label),
    React.createElement('textarea',{value,onChange:e=>onChange(e.target.value),placeholder,rows,
      style:{width:'100%',background:'#0a0a0f',border:'1px solid #1e1e2e',borderRadius:8,padding:'9px 12px',color:'#e2e8f0',fontSize:14,resize:'vertical',transition:'border-color 0.15s',fontFamily:'inherit',lineHeight:1.6}})
  );
}

export function Select({label,value,onChange,options,style={}}){
  return React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:6,...style}},
    label&&React.createElement('label',{style:{fontSize:12,fontWeight:500,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.05em'}},label),
    React.createElement('select',{value,onChange:e=>onChange(e.target.value),
      style:{width:'100%',background:'#0a0a0f',border:'1px solid #1e1e2e',borderRadius:8,padding:'9px 12px',color:'#e2e8f0',fontSize:14,cursor:'pointer',transition:'border-color 0.15s',appearance:'none'}},
      options.map(o=>React.createElement('option',{key:o.value,value:o.value},o.label)))
  );
}

export function BrandIcon({slug,color='#6366f1',size=18,bare=false}){
  const [err,setErr]=useState(false);
  const img=React.createElement('img',{src:'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/'+slug+'.svg',width:size,height:size,alt:slug,style:{filter:'invert(1)',opacity:0.9,display:'block'},onError:()=>setErr(true)});
  const fb=React.createElement('span',{style:{fontSize:size*0.65,fontWeight:700,color}},slug[0]);
  const c=err?fb:img;
  if(bare)return c;
  return React.createElement('div',{style:{width:size+14,height:size+14,borderRadius:10,flexShrink:0,background:color+'22',display:'flex',alignItems:'center',justifyContent:'center'}},c);
}

export function MetricCard({icon,title,value,subtitle,color='#6366f1'}){
  return React.createElement('div',{style:{background:'#13131a',border:'1px solid #1e1e2e',borderRadius:14,padding:24,display:'flex',flexDirection:'column',gap:16}},
    React.createElement('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between'}},
      React.createElement('div',{style:{width:40,height:40,borderRadius:10,background:color+'22',display:'flex',alignItems:'center',justifyContent:'center',color}},icon),
      React.createElement('div',{style:{fontSize:28,fontWeight:700,color:'#e2e8f0'}},value)
    ),
    React.createElement('div',null,
      React.createElement('div',{style:{fontWeight:600,color:'#e2e8f0',fontSize:15}},title),
      subtitle&&React.createElement('div',{style:{color:'#64748b',fontSize:12,marginTop:3}},subtitle)
    )
  );
}

export function DateRangePicker({ value, onChange }) {
  const opts = [{ label: '7d', days: 7 }, { label: '30d', days: 30 }, { label: '90d', days: 90 }, { label: '6m', days: 180 }];
  return React.createElement('div', { style: { display: 'flex', background: '#0a0a0f', borderRadius: 8, padding: 2, border: '1px solid #1e1e2e', gap: 1 } },
    opts.map(o => React.createElement('button', {
      key: o.days, onClick: () => onChange(o.days),
      style: { padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
        background: value === o.days ? '#6366f1' : 'none', color: value === o.days ? '#fff' : '#64748b' }
    }, o.label))
  );
}

export function TrendBadge({ current, previous }) {
  if (previous == null || previous === 0) return null;
  const pct = (current - previous) / Math.abs(previous) * 100;
  const up = pct >= 0;
  return React.createElement('span', {
    style: { display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 5,
      color: up ? '#10b981' : '#ef4444', background: up ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }
  }, (up ? '↑ +' : '↓ ') + Math.abs(pct).toFixed(1) + '%');
}

export function DataDisplay({data,loading,error,integrationName=''}){
  const [sortCol,setSortCol]=useState(null);
  const [sortDir,setSortDir]=useState(1);
  const [page,setPage]=useState(0);
  const PAGE=50;

  if(loading)return React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:8,padding:'12px 0'}},
    ...[1,2,3].map(i=>React.createElement('div',{key:i,style:{height:34,borderRadius:8,background:'linear-gradient(90deg,#1e1e2e 25%,#2a2a3e 50%,#1e1e2e 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.5s infinite'}}))
  );

  if(error){
    const hints={'select: column':'— check Ahrefs column names in API docs','401':'— refresh your access token in Settings','403':'— check API key permissions','not found':'— verify target domain or property ID'};
    const hint=Object.entries(hints).find(([k])=>String(error).includes(k))?.[1]||'';
    return React.createElement('div',{style:{padding:14,borderRadius:8,background:'#1a0808',border:'1px solid #7f1d1d',color:'#ef4444',fontSize:13,lineHeight:1.6}},
      React.createElement(AlertCircle,{size:14,style:{display:'inline',marginRight:6}}),String(error),
      hint&&React.createElement('div',{style:{color:'#f87171',fontSize:11,marginTop:4,opacity:0.8}},hint)
    );
  }

  if(!data)return null;

  let rows=null,rk='';
  for(const k of['keywords','backlinks','refdomains','organic_keywords','pages','rows','items','posts','messages','results','edges','value','events','categories']){
    const a=Array.isArray(data[k])?data[k]:Array.isArray(data?.data?.[k])?data.data[k]:null;
    if(a?.length&&typeof a[0]==='object'){rows=a;rk=k;break;}
  }
  if(!rows&&data?.rows?.length&&data.dimensionHeaders){
    const dh=data.dimensionHeaders.map(h=>h.name),mh=(data.metricHeaders||[]).map(h=>h.name);
    rows=data.rows.map(r=>({...Object.fromEntries(dh.map((k,i)=>[k,r.dimensionValues[i]?.value])),...Object.fromEntries(mh.map((k,i)=>[k,r.metricValues[i]?.value]))}));rk='analytics';
  }

  const wrap={background:'#0d0d14',borderRadius:10,padding:16,border:'1px solid #1e1e2e',marginTop:12,overflowX:'auto',maxHeight:520,overflowY:'auto'};
  const btnS={fontSize:11,padding:'1px 7px',borderRadius:4,border:'1px solid #1e1e2e',background:'#13131a',color:'#94a3b8',cursor:'pointer'};

  if(rows?.length){
    const cols=Object.keys(rows[0]).slice(0,10);
    const sorted=sortCol?[...rows].sort((a,b)=>{const v=a[sortCol],w=b[sortCol];return(typeof v==='number'&&typeof w==='number'?v-w:String(v??'').localeCompare(String(w??'')))*sortDir;}):rows;
    const totalPages=Math.ceil(sorted.length/PAGE);
    const visible=sorted.slice(page*PAGE,(page+1)*PAGE);
    return React.createElement('div',{style:wrap},
      React.createElement('div',{style:{fontSize:11,color:'#64748b',marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,flexWrap:'wrap'}},
        React.createElement('span',null,rk+' · '+rows.length+' rows'+(totalPages>1?' · p'+(page+1)+'/'+totalPages:'')),
        React.createElement('div',{style:{display:'flex',gap:5,alignItems:'center'}},
          totalPages>1&&React.createElement('div',{style:{display:'flex',gap:3}},
            React.createElement('button',{onClick:()=>setPage(p=>Math.max(0,p-1)),disabled:page===0,style:{...btnS,color:page===0?'#2a2a3e':'#94a3b8'}},'‹'),
            React.createElement('button',{onClick:()=>setPage(p=>Math.min(totalPages-1,p+1)),disabled:page===totalPages-1,style:{...btnS,color:page===totalPages-1?'#2a2a3e':'#94a3b8'}},'›')
          ),
          React.createElement('button',{onClick:()=>exportCSV(rows,integrationName+'-'+rk+'.csv'),style:{fontSize:11,padding:'2px 8px',borderRadius:5,border:'1px solid rgba(99,102,241,0.3)',background:'rgba(99,102,241,0.08)',color:'#6366f1',cursor:'pointer'}},'↓ CSV')
        )
      ),
      React.createElement('table',null,
        React.createElement('thead',null,React.createElement('tr',null,
          cols.map(c=>React.createElement('th',{key:c,onClick:()=>{setSortCol(c);setSortDir(sortCol===c?-sortDir:1);setPage(0);},style:{cursor:'pointer',userSelect:'none',whiteSpace:'nowrap'}},
            c.replace(/_/g,' ')+(sortCol===c?(sortDir>0?' ↑':' ↓'):' ·')
          ))
        )),
        React.createElement('tbody',null,visible.map((r,i)=>
          React.createElement('tr',{key:i},cols.map(c=>{const v=r[c];return React.createElement('td',{key:c,title:v==null?'':String(v)},v==null?'—':typeof v==='number'?fmtNum(v):String(v).slice(0,60));}))
        ))
      )
    );
  }

  if(data&&typeof data==='object'){
    const src=Object.values(data).find(v=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length>0)||data;
    const entries=Object.entries(src).filter(([,v])=>v!==null&&v!==undefined&&typeof v!=='object').slice(0,60);
    if(entries.length)return React.createElement('div',{style:{...wrap,padding:0,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))'}},
      entries.map(([k,v])=>React.createElement('div',{key:k,style:{padding:'10px 16px',borderBottom:'1px solid #1e1e2e',display:'flex',flexDirection:'column',gap:3}},
        React.createElement('span',{style:{fontSize:10,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.05em'}},k.replace(/_/g,' ')),
        React.createElement('span',{style:{fontSize:14,fontWeight:600,color:'#e2e8f0'}},typeof v==='number'?fmtNum(v):String(v))
      ))
    );
  }
  return React.createElement('div',{style:wrap},React.createElement('pre',{style:{fontSize:12,color:'#94a3b8',lineHeight:1.6}},JSON.stringify(data,null,2)));
}
  `;
}
