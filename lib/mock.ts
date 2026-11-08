const ACCENTS: Record<string, string> = {
  focus: "#2563eb",
  dense: "#0f766e",
  warm: "#c2410c",
};

/**
 * 不同跑道产出不同布局，让"赛马模式"在无 Key 时也能看出差异。
 * focus：极简专注（窄栏、大留白、弱边框）
 * dense：专业高密度（宽栏、紧凑栅格、统计条）
 * warm：活泼暖色（圆角卡片、柔和阴影、高饱和强调）
 */
function variantCss(variantKey: string, accent: string): string {
  switch (variantKey) {
    case "dense":
      return `:root{--bg:#eef1f5;--panel:#fff;--ink:#0f172a;--muted:#475569;--line:#cbd5e1;--accent:${accent};--danger:#b91c1c}
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;background:var(--bg);color:var(--ink);padding:12px;line-height:1.4;font-size:13px}
.wrap{max-width:1280px;margin:0 auto}
h1{font-size:16px;margin:0 0 2px;letter-spacing:.2px}
.sub{color:var(--muted);font-size:11px;margin:0 0 10px}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:10px 12px;margin-bottom:8px}
label{display:block;font-size:11px;color:var(--muted);margin-bottom:2px;text-transform:uppercase;letter-spacing:.3px}
input,select,textarea{width:100%;font:inherit;font-size:13px;padding:5px 8px;border:1px solid var(--line);border-radius:4px;background:#fff;color:inherit}
button{font:inherit;font-size:12px;padding:5px 12px;border-radius:4px;border:1px solid var(--line);background:#f8fafc;cursor:pointer;font-weight:500}
button.primary{background:var(--accent);border-color:var(--accent);color:#fff}
button:hover{filter:brightness(.95)}
.row{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px}
.err{color:var(--danger);font-size:11px;margin-top:6px;display:none}
.empty{color:var(--muted);font-size:12px;padding:10px;text-align:center}
@media(max-width:720px){body{padding:8px}}`;
    case "warm":
      return `:root{--bg:#fdf6f0;--panel:#fff;--ink:#1b1d22;--muted:#7c6f64;--line:#f0e6dc;--accent:${accent};--danger:#b91c1c}
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;background:var(--bg);color:var(--ink);padding:20px;line-height:1.6}
.wrap{max-width:900px;margin:0 auto}
h1{font-size:22px;margin:0 0 4px;font-weight:700}
.sub{color:var(--muted);font-size:13px;margin:0 0 16px}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:18px;margin-bottom:14px;box-shadow:0 4px 14px rgba(194,65,12,.06)}
label{display:block;font-size:12px;color:var(--muted);margin-bottom:6px;font-weight:500}
input,select,textarea{width:100%;font:inherit;font-size:14px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:#fffdfa;color:inherit}
button{font:inherit;font-size:14px;padding:10px 18px;border-radius:12px;border:1px solid var(--line);background:#fff;cursor:pointer;font-weight:600}
button.primary{background:var(--accent);border-color:var(--accent);color:#fff}
button:hover{filter:brightness(.95);transform:translateY(-1px)}
.row{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px}
.err{color:var(--danger);font-size:12px;margin-top:8px;display:none}
.empty{color:var(--muted);font-size:13px;padding:16px;text-align:center}
@media(max-width:720px){body{padding:14px}}`;
    default: // focus
      return `:root{--bg:#fafafa;--panel:#fff;--ink:#1b1d22;--muted:#9ca3af;--line:#f0f0f0;--accent:${accent};--danger:#b91c1c}
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;background:var(--bg);color:var(--ink);padding:32px;line-height:1.6}
.wrap{max-width:720px;margin:0 auto}
h1{font-size:24px;margin:0 0 4px;font-weight:600}
.sub{color:var(--muted);font-size:13px;margin:0 0 24px}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:20px;margin-bottom:16px}
label{display:block;font-size:12px;color:var(--muted);margin-bottom:6px}
input,select,textarea{width:100%;font:inherit;font-size:14px;padding:10px;border:1px solid var(--line);border-radius:6px;background:#fff;color:inherit}
button{font:inherit;font-size:14px;padding:10px 16px;border-radius:6px;border:1px solid var(--line);background:#fff;cursor:pointer}
button.primary{background:var(--accent);border-color:var(--accent);color:#fff}
button:hover{filter:brightness(.96)}
.row{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px}
.err{color:var(--danger);font-size:12px;margin-top:8px;display:none}
.empty{color:var(--muted);font-size:13px;padding:16px;text-align:center}
@media(max-width:720px){body{padding:20px}}`;
  }
}

function shell(title: string, accent: string, body: string, variantKey = "focus"): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
${variantCss(variantKey, accent)}
</style>
</head>
<body>
<div class="wrap">
${body}
</div>
</body>
</html>`;
}

function kanban(accent: string, prompt: string, variantKey: string): string {
  const title = prompt.slice(0, 30) || "任务看板";
  return shell(
    "任务看板",
    accent,
    `<h1>${title}</h1>
<p class="sub">拖拽卡片切换状态；所有改动自动保存，刷新后仍在。</p>
<form class="panel row" id="form" style="align-items:end">
  <div><label>任务内容</label><input id="title" maxlength="60" placeholder="例如：整理季度复盘" /></div>
  <div><label>优先级</label><select id="prio"><option value="high">高</option><option value="mid" selected>中</option><option value="low">低</option></select></div>
  <div><label>截止日期</label><input id="due" type="date" /></div>
  <div><button class="primary" type="submit" style="width:100%">添加任务</button></div>
</form>
<div class="err" id="err">请先填写任务内容</div>
<div class="panel" style="padding:12px 16px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">
  <span id="stats" style="font-size:13px;color:var(--muted)"></span>
  <select id="filter" style="width:auto"><option value="all">全部优先级</option><option value="high">只看高</option><option value="mid">只看中</option><option value="low">只看低</option></select>
</div>
<div id="board" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px"></div>
<p class="sub" style="margin-top:14px">数据保存在浏览器 localStorage，重开浏览器也不会丢。</p>
<script>
(function(){
  var KEY='appforge_mock_board_v1';
  var COLS=[{id:'todo',name:'待办'},{id:'doing',name:'进行中'},{id:'done',name:'已完成'}];
  function load(){try{var raw=localStorage.getItem(KEY);if(raw){var d=JSON.parse(raw);if(d&&Array.isArray(d.tasks))return d;}}catch(e){}return{tasks:[
    {id:'s1',title:'梳理本周需求优先级',prio:'high',due:'',status:'todo'},
    {id:'s2',title:'完成看板拖拽交互',prio:'mid',due:'',status:'doing'},
    {id:'s3',title:'补充空状态文案',prio:'low',due:'',status:'done'}]};}
  var state=load();
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}}
  var board=document.getElementById('board'),stats=document.getElementById('stats'),filter=document.getElementById('filter'),err=document.getElementById('err');
  function uid(){return 't'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
  function render(){
    var p=filter.value;var visible=state.tasks.filter(function(t){return p==='all'||t.prio===p;});
    var todo=state.tasks.filter(function(t){return t.status==='todo';}).length;
    var done=state.tasks.filter(function(t){return t.status==='done';}).length;
    stats.textContent='共 '+state.tasks.length+' 项 · 待办 '+todo+' · 已完成 '+done;
    board.innerHTML='';
    COLS.forEach(function(col){
      var wrap=document.createElement('div');
      wrap.style.cssText='background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px;min-height:180px';
      wrap.dataset.status=col.id;
      var items=visible.filter(function(t){return t.status===col.id;});
      var h=document.createElement('h2');
      h.style.cssText='font-size:14px;margin:0 0 10px;display:flex;justify-content:space-between';
      h.innerHTML=col.name+'<span style="color:var(--muted);font-weight:400">'+items.length+'</span>';
      wrap.appendChild(h);
      if(!items.length){var e=document.createElement('div');e.className='empty';e.textContent='暂无任务';wrap.appendChild(e);}
      items.forEach(function(t){
        var c=document.createElement('div');
        c.style.cssText='background:#fff;border:1px solid var(--line);border-radius:10px;padding:10px;margin-bottom:8px;cursor:grab';
        c.draggable=true;c.dataset.id=t.id;
        var tt=document.createElement('div');tt.style.cssText='font-size:14px;margin-bottom:6px';tt.textContent=t.title;
        var m=document.createElement('div');m.style.cssText='display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--muted)';
        var tag=document.createElement('span');tag.textContent=t.prio==='high'?'高优先级':t.prio==='mid'?'中优先级':'低优先级';
        tag.style.cssText='font-size:11px;padding:2px 8px;border-radius:999px;border:1px solid var(--line)';
        var right=document.createElement('span');right.textContent=t.due||'无截止';
        var del=document.createElement('button');del.type='button';del.textContent='×';del.title='删除';
        del.style.cssText='border:0;background:transparent;color:var(--muted);cursor:pointer;font-size:16px;line-height:1;padding:0 4px';
        del.addEventListener('click',function(){
          state.tasks=state.tasks.filter(function(x){return x.id!==t.id;});save();render();
        });
        m.appendChild(tag);m.appendChild(right);m.appendChild(del);
        c.appendChild(tt);c.appendChild(m);
        c.addEventListener('dragstart',function(ev){ev.dataTransfer.setData('text/plain',t.id);});
        wrap.appendChild(c);
      });
      wrap.addEventListener('dragover',function(ev){ev.preventDefault();wrap.style.borderColor='var(--accent)';});
      wrap.addEventListener('dragleave',function(){wrap.style.borderColor='var(--line)';});
      wrap.addEventListener('drop',function(ev){
        ev.preventDefault();wrap.style.borderColor='var(--line)';
        var id=ev.dataTransfer.getData('text/plain');
        var task=state.tasks.filter(function(x){return x.id===id;})[0];
        if(task){task.status=col.id;save();render();}
      });
      board.appendChild(wrap);
    });
  }
  document.getElementById('form').addEventListener('submit',function(ev){
    ev.preventDefault();
    var input=document.getElementById('title');var title=input.value.trim();
    if(!title){err.style.display='block';input.focus();return;}
    err.style.display='none';
    state.tasks.unshift({id:uid(),title:title,prio:document.getElementById('prio').value,due:document.getElementById('due').value,status:'todo'});
    input.value='';save();render();
  });
  filter.addEventListener('change',render);
  render();
})();
</script>`,
    variantKey,
  );
}

function loanCalculator(accent: string, prompt: string, variantKey: string): string {
  const title = prompt.slice(0, 30) || "房贷计算器";
  return shell(
    "房贷计算器",
    accent,
    `<h1>${title}</h1>
<p class="sub">等额本息月供测算，并对比提前还款能省多少利息。</p>
<form class="panel" id="form">
  <div class="row">
    <div><label>贷款金额（万元）</label><input id="amount" type="number" min="1" step="1" value="300" /></div>
    <div><label>年利率（%）</label><input id="rate" type="number" min="0.1" step="0.01" value="3.6" /></div>
    <div><label>贷款年限（年）</label><input id="years" type="number" min="1" max="40" step="1" value="30" /></div>
    <div><label>计划提前还款（万元，可留空）</label><input id="prepay" type="number" min="0" step="0.1" placeholder="例如 20" /></div>
  </div>
  <div style="margin-top:12px"><button class="primary" type="submit">计算并保存</button></div>
  <div class="err" id="err">请检查输入：金额需大于 0，利率与年限需为正数。</div>
</form>
<div class="panel" id="result"><div class="empty">填写参数后点击计算，结果会保存在本机。</div></div>
<div class="panel">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
    <strong style="font-size:14px">历史记录</strong>
    <button id="clear" type="button">清空</button>
  </div>
  <div id="history"><div class="empty">暂无记录</div></div>
</div>
<script>
(function(){
  var KEY='appforge_mock_loan_v1';
  function load(){try{var raw=localStorage.getItem(KEY);var d=raw?JSON.parse(raw):null;if(d&&Array.isArray(d.records))return d;}catch(e){}return{records:[]};}
  var state=load();
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}}
  var err=document.getElementById('err'),result=document.getElementById('result'),history=document.getElementById('history');
  function fmt(n){return n.toLocaleString('zh-CN',{maximumFractionDigits:0});}
  function calc(principal,annual,years,prepay){
    var r=annual/100/12,n=years*12;
    var monthly=principal*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
    var total=monthly*n;
    var interest=total-principal;
    var prepayInfo=null;
    if(prepay>0&&prepay<principal){
      var remain=principal-prepay;
      var m2=remain*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
      var total2=m2*n+prepay;
      prepayInfo={monthly:m2,interest:total2-principal,saved:interest-(total2-principal)};
    }
    return{monthly:monthly,total:total,interest:interest,prepay:prepayInfo};
  }
  function renderResult(rec){
    var r=rec.result;
    var html='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px">';
    html+='<div><label>每月月供</label><div style="font-size:22px;font-weight:600">'+fmt(r.monthly)+' 元</div></div>';
    html+='<div><label>支付总利息</label><div style="font-size:22px;font-weight:600">'+fmt(r.interest)+' 元</div></div>';
    html+='<div><label>还款总额</label><div style="font-size:22px;font-weight:600">'+fmt(r.total)+' 元</div></div>';
    if(r.prepay){html+='<div><label>提前还款后省息</label><div style="font-size:22px;font-weight:600;color:var(--accent)">'+fmt(r.prepay.saved)+' 元</div></div>';}
    html+='</div>';
    if(r.prepay){html+='<p class="sub" style="margin:12px 0 0">提前还 '+fmt(rec.prepay)+' 万元后，月供降至 '+fmt(r.prepay.monthly)+' 元，总利息减少 '+fmt(r.prepay.saved)+' 元。</p>';}
    result.innerHTML=html;
  }
  function renderHistory(){
    if(!state.records.length){history.innerHTML='<div class="empty">暂无记录</div>';return;}
    history.innerHTML='';
    state.records.slice(0,10).forEach(function(rec,idx){
      var row=document.createElement('div');
      row.style.cssText='display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--line);font-size:13px';
      var left=document.createElement('span');
      left.textContent=rec.amount+' 万 · '+rec.rate+'% · '+rec.years+' 年 · 月供 '+fmt(rec.result.monthly)+' 元';
      var acts=document.createElement('span');
      var view=document.createElement('button');view.type='button';view.textContent='查看';
      view.style.cssText='padding:4px 10px;font-size:12px;margin-right:6px';
      view.addEventListener('click',function(){renderResult(rec);});
      var del=document.createElement('button');del.type='button';del.textContent='删除';
      del.style.cssText='padding:4px 10px;font-size:12px';
      del.addEventListener('click',function(){state.records.splice(idx,1);save();renderHistory();});
      acts.appendChild(view);acts.appendChild(del);
      row.appendChild(left);row.appendChild(acts);
      history.appendChild(row);
    });
  }
  document.getElementById('form').addEventListener('submit',function(ev){
    ev.preventDefault();
    var amount=parseFloat(document.getElementById('amount').value)*10000;
    var rate=parseFloat(document.getElementById('rate').value);
    var years=parseFloat(document.getElementById('years').value);
    var prepayRaw=document.getElementById('prepay').value;
    var prepay=prepayRaw?parseFloat(prepayRaw)*10000:0;
    if(!(amount>0)||!(rate>0)||!(years>0)){err.style.display='block';return;}
    err.style.display='none';
    var rec={id:'r'+Date.now().toString(36),amount:amount/10000,rate:rate,years:years,prepay:prepay/10000,result:calc(amount,rate,years,prepay)};
    state.records.unshift(rec);state.records=state.records.slice(0,30);save();
    renderResult(rec);renderHistory();
  });
  document.getElementById('clear').addEventListener('click',function(){state.records=[];save();renderHistory();});
  renderHistory();
  if(state.records.length)renderResult(state.records[0]);
})();
</script>`,
    variantKey,
  );
}

function profile(accent: string, prompt: string, variantKey: string): string {
  const title = prompt.slice(0, 30) || "个人主页生成器";
  return shell(
    "个人主页生成器",
    accent,
    `<h1>${title}</h1>
<p class="sub">填写信息生成一页个人主页；多个版本保存在本机，随时切换预览。</p>
<form class="panel" id="form">
  <div class="row">
    <div><label>姓名</label><input id="name" maxlength="20" placeholder="陈墨" /></div>
    <div><label>身份 / 职业</label><input id="role" maxlength="30" placeholder="前端工程师" /></div>
    <div><label>一句话介绍</label><input id="bio" maxlength="80" placeholder="喜欢把想法快速做成能用的产品" /></div>
    <div><label>技能（逗号分隔）</label><input id="skills" placeholder="TypeScript, React, Playwright" /></div>
    <div><label>邮箱</label><input id="email" placeholder="you@example.com" /></div>
    <div><button class="primary" type="submit" style="width:100%">生成主页</button></div>
  </div>
  <div class="err" id="err">姓名和身份至少填一项。</div>
</form>
<div id="output"><div class="empty">还没有生成的主页</div></div>
<div class="panel">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
    <strong style="font-size:14px">已保存的主页</strong>
    <button id="clear" type="button">清空</button>
  </div>
  <div id="list"><div class="empty">暂无记录</div></div>
</div>
<script>
(function(){
  var KEY='appforge_mock_profile_v1';
  function load(){try{var raw=localStorage.getItem(KEY);var d=raw?JSON.parse(raw):null;if(d&&Array.isArray(d.profiles))return d;}catch(e){}return{profiles:[]};}
  var state=load();
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}}
  var err=document.getElementById('err'),output=document.getElementById('output'),list=document.getElementById('list');
  function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function renderProfile(p){
    var tags=(p.skills||'').split(/[,，]/).filter(function(s){return s.trim();}).map(function(s){
      return '<span style="font-size:12px;padding:3px 10px;border-radius:999px;background:#eef2ff;color:var(--accent);margin:0 6px 6px 0;display:inline-block">'+esc(s.trim())+'</span>';
    }).join('');
    output.innerHTML='<div class="panel" style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap">'+
      '<div style="width:64px;height:64px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px">'+esc((p.name||'?').slice(0,1))+'</div>'+
      '<div style="flex:1;min-width:220px">'+
        '<div style="font-size:20px;font-weight:600">'+esc(p.name||'未命名')+'</div>'+
        '<div style="color:var(--muted);font-size:13px;margin:2px 0 10px">'+esc(p.role||'')+'</div>'+
        '<div style="font-size:14px;margin-bottom:10px">'+esc(p.bio||'')+'</div>'+
        tags+
        (p.email?'<div style="margin-top:10px;font-size:13px;color:var(--muted)">联系：'+esc(p.email)+'</div>':'')+
      '</div></div>';
  }
  function renderList(){
    if(!state.profiles.length){list.innerHTML='<div class="empty">暂无记录</div>';return;}
    list.innerHTML='';
    state.profiles.forEach(function(p,idx){
      var row=document.createElement('div');
      row.style.cssText='display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--line);font-size:13px';
      var left=document.createElement('span');left.textContent=(p.name||'未命名')+' · '+(p.role||'');
      var acts=document.createElement('span');
      var view=document.createElement('button');view.type='button';view.textContent='预览';
      view.style.cssText='padding:4px 10px;font-size:12px;margin-right:6px';
      view.addEventListener('click',function(){renderProfile(p);});
      var del=document.createElement('button');del.type='button';del.textContent='删除';
      del.style.cssText='padding:4px 10px;font-size:12px';
      del.addEventListener('click',function(){state.profiles.splice(idx,1);save();renderList();});
      acts.appendChild(view);acts.appendChild(del);
      row.appendChild(left);row.appendChild(acts);list.appendChild(row);
    });
  }
  document.getElementById('form').addEventListener('submit',function(ev){
    ev.preventDefault();
    var name=document.getElementById('name').value.trim();
    var role=document.getElementById('role').value.trim();
    if(!name&&!role){err.style.display='block';return;}
    err.style.display='none';
    var p={id:'p'+Date.now().toString(36),name:name,role:role,bio:document.getElementById('bio').value.trim(),skills:document.getElementById('skills').value,email:document.getElementById('email').value.trim()};
    state.profiles.unshift(p);state.profiles=state.profiles.slice(0,20);save();
    renderProfile(p);renderList();
  });
  document.getElementById('clear').addEventListener('click',function(){state.profiles=[];save();renderList();output.innerHTML='<div class="empty">还没有生成的主页</div>';});
  renderList();
  if(state.profiles.length)renderProfile(state.profiles[0]);
})();
</script>`,
    variantKey,
  );
}

/**
 * 离线 mock 生成器：根据关键词选出可用的小应用模板。
 * 无 API Key、额度耗尽或模型超时时启用，保证演示流程不中断。
 * 不同 variantKey 产出不同布局（极简/紧凑/活泼），让赛马模式在无 Key 时也能看出差异。
 */
export function mockGenerate(prompt: string, variantKey: string): string {
  const accent = ACCENTS[variantKey] || ACCENTS.focus;
  const text = prompt.toLowerCase();

  if (/房贷|贷款|月供|利率|计算器|calculator|loan/.test(text)) {
    return loanCalculator(accent, prompt, variantKey);
  }
  if (/主页|简历|个人|profile|resume|portfolio/.test(text)) {
    return profile(accent, prompt, variantKey);
  }
  return kanban(accent, prompt, variantKey);
}
