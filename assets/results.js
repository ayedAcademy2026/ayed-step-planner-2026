(function(){
  const {$,store}=window.APP;
  const arSec=(s)=>({Vocabulary:"المفردات",Grammar:"القواعد",Reading:"القراءة"}[s]||s);

  function buildPrintable(result){
    const name=result.profile?.name||"صديقنا";
    const date=new Date().toLocaleString("ar-SA");
    const shareUrl=window.SITE_DATA.appShareUrl|| (location.origin + location.pathname.replace(/\/[^\/]*$/,"/"));
    const days=result.plan.blocks.map(b=>`<div class="day"><h3>${b.title}</h3><ul>${b.items.map(i=>`<li>${i}</li>`).join("")}</ul></div>`).join("");
    return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><title>جدول ${name}</title>
    <style>body{font-family:Arial;margin:24px}h1{margin:0 0 6px}h2{margin:18px 0 8px} .meta{color:#444;font-weight:700}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.day{border:1px solid #ddd;border-radius:12px;padding:10px}ul{margin:0;padding-right:18px}li{margin:6px 0;line-height:1.6}
    @media print{.grid{grid-template-columns:1fr}}</style></head><body>
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
      <div>
        <div style="display:inline-block;padding:8px 10px;border-radius:999px;background:#fff2b8;border:1px solid #f6c343;font-weight:800">أكاديمية عايد</div>
        <h1>جدول مذاكرة STEP — ${name}</h1>
        <div class="meta">تاريخ الإنشاء: ${date}</div>
        <div class="meta">المستوى: ${result.level.level} — النسبة: ${Math.round(result.analysis.pct)}%</div>
      </div>
    </div>
    <h2>الجدول</h2>
    <div class="grid">${days}</div>
    <div style="margin-top:16px;font-size:12px;color:#444">رابط البرنامج: ${shareUrl}</div>
    </body></html>`;
  }

  function shareText(result){
    const shareUrl=window.SITE_DATA.appShareUrl|| (location.origin + location.pathname.replace(/\/[^\/]*$/,"/"));
    const pct=Math.round(result.analysis.pct);
    return [
      window.SITE_DATA.share.aya,
      window.SITE_DATA.share.hadith,
      "",
      `جربت برنامج تحديد مستوى STEP وطلع لي مستوى: ${result.level.level} (${pct}%).`,
      `نصيحة سريعة: ${(result.plan.tips||[])[0]||"التزم يوميًا ولو 15 دقيقة."}`,
      "",
      "جرّبه وخذ خطتك:",
      shareUrl
    ].join("\\n");
  }

  function render(){
    const result=store.get("step_result_v1",null);
    if(!result){ $("#empty").style.display="block"; return; }
    $("#empty").style.display="none";
    $("#helloName").textContent=result.profile?.name||"صديقنا";
    $("#tone").textContent=result.level.tone;
    $("#level").textContent=result.level.level;
    $("#score").textContent=Math.round(result.analysis.pct)+"%";
    $("#correct").textContent=`${result.analysis.correct} / ${result.analysis.total}`;

    const body=$("#secBody"); body.innerHTML="";
    Object.keys(result.analysis.bySection).forEach(sec=>{
      const st=result.analysis.bySection[sec];
      const pct=Math.round((st.correct/st.total)*100);
      const tr=document.createElement("tr");
      tr.innerHTML=`<td><b>${arSec(sec)}</b></td><td>${st.correct}/${st.total}</td><td><b>${pct}%</b></td>`;
      body.appendChild(tr);
    });

    $("#planMeta").textContent=`خطة ${result.plan.days} يوم — وقتك اليومي: ${result.plan.perDay} دقيقة`;
    const list=$("#planList"); list.innerHTML="";
    result.plan.blocks.slice(0,Math.min(14,result.plan.blocks.length)).forEach(b=>{
      const d=document.createElement("div"); d.className="feature";
      d.innerHTML=`<h3 style="margin:0 0 8px">${b.title}</h3><p style="margin:0;color:var(--muted);line-height:1.8">${b.items.map(x=>"• "+x).join("<br>")}</p>`;
      list.appendChild(d);
    });
    $("#tips").innerHTML=(result.plan.tips||[]).map(t=>`<li>${t}</li>`).join("");

    $("#goCourse").onclick=()=>window.open(window.SITE_DATA.intensiveCourseUrl,"_blank");
    $("#sharePlan").onclick=async ()=>{
      const txt=shareText(result);
      const url=window.SITE_DATA.appShareUrl|| (location.origin + location.pathname.replace(/\/[^\/]*$/,"/"));
      try{
        if(navigator.share) await navigator.share({title:window.SITE_DATA.appName,text:txt,url});
        else if(navigator.clipboard){ await navigator.clipboard.writeText(txt); alert("تم نسخ نص المشاركة ✅");}
        else prompt("انسخ النص:",txt);
      }catch{}
    };
    $("#downloadPdf").onclick=()=>{
      const w=window.open("","_blank"); if(!w) return;
      w.document.open(); w.document.write(buildPrintable(result)); w.document.close(); w.focus();
      setTimeout(()=>w.print(),600);
    };

    $("#jumpTop").onclick=()=>scrollTo({top:0,behavior:"smooth"});
    $("#jumpPlan").onclick=()=>$("#planAnchor").scrollIntoView({behavior:"smooth"});
    $("#jumpTips").onclick=()=>$("#tipsAnchor").scrollIntoView({behavior:"smooth"});
  }

  window.addEventListener("DOMContentLoaded",render);
})();