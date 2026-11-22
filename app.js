const $ = (s) => document.querySelector(s);
const now = new Date();
$('#yearNow').textContent = now.getFullYear();
$('#todayLabel').textContent = now.toLocaleDateString('en-IN',{weekday:'short',day:'2-digit',month:'short',year:'numeric'}).toUpperCase();
$('#menuToggle').addEventListener('click',()=>{const nav=$('#mainNav');const open=nav.classList.toggle('open');$('#menuToggle').setAttribute('aria-expanded',String(open));});
fetch('issues/index.json').then(r=>{if(!r.ok)throw new Error('No archive index');return r.json()}).then(data=>{
 const issues=Array.isArray(data.issues)?data.issues:[];
 const years=[...new Set(issues.map(x=>String(x.date||'').slice(0,4)).filter(Boolean))].sort().reverse();
 years.forEach(y=>{const o=document.createElement('option');o.value=y;o.textContent=y;$('#yearFilter').append(o)});
 function render(){const q=$('#searchInput').value.toLowerCase().trim(),year=$('#yearFilter').value;const found=issues.filter(x=>(year==='all'||String(x.date).startsWith(year))&&(`${x.title} ${x.summary} ${(x.tags||[]).join(' ')}`.toLowerCase().includes(q))).sort((a,b)=>b.date.localeCompare(a.date));const root=$('#archiveList');root.replaceChildren();if(!found.length){root.innerHTML='<div class="empty-state"><span>⌕</span><strong>No matching editions.</strong><p>Try another keyword or year.</p></div>';return}found.forEach(x=>{const a=document.createElement('a');a.className='archive-item';a.href=x.url;const left=document.createElement('div');const meta=document.createElement('div');meta.className='archive-meta';meta.textContent=`${x.date} · ${(x.tags||[]).join(' / ')}`;const h=document.createElement('h3');h.textContent=x.title;const p=document.createElement('p');p.textContent=x.summary;left.append(meta,h,p);const right=document.createElement('span');right.className='archive-meta';right.textContent='READ EDITION ↗';a.append(left,right);root.append(a)})}
 $('#searchInput').addEventListener('input',render);$('#yearFilter').addEventListener('change',render);render();
}).catch(()=>{});