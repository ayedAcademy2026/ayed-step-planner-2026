(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const store={
    get:(k,f=null)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}},
    set:(k,v)=>localStorage.setItem(k,JSON.stringify(v)),
    del:(k)=>localStorage.removeItem(k)
  };
  window.APP={$,$$,store,clamp:(n,a,b)=>Math.max(a,Math.min(b,n))};

  // SW
  if("serviceWorker" in navigator){
    window.addEventListener("load", ()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
  }

  // Install prompt
  let deferred=null;
  window.addEventListener("beforeinstallprompt",(e)=>{
    e.preventDefault(); deferred=e;
    const b=$("#installBtn");
    if(!b) return;
    b.style.display="inline-flex";
    b.addEventListener("click", async ()=>{
      try{ deferred.prompt(); await deferred.userChoice; }catch{}
      deferred=null; b.style.display="none";
    }, {once:true});
  });

  // Toast tips
  function startPopups(){
    const cfg=window.SITE_DATA?.popups; const toast=$("#toast");
    if(!cfg||!toast) return;
    let i=0;
    const show=(m)=>{toast.textContent=m; toast.classList.add("show"); setTimeout(()=>toast.classList.remove("show"),6200);};
    setTimeout(()=>{show(cfg.items[i%cfg.items.length]);i++;},12000);
    setInterval(()=>{show(cfg.items[i%cfg.items.length]);i++;},cfg.intervalMs||45000);
  }

  // Assistant
  function initAssistant(){
    const fab=$("#assistantFab"), chat=$("#chat");
    if(!fab||!chat) return;
    const title=$("#chatTitle"), status=$("#chatStatus"), body=$("#chatBody"), quick=$("#chatQuick"), input=$("#chatInput"), send=$("#chatSend"), close=$("#chatClose");
    const cfg=window.SITE_DATA.assistant;
    title.textContent=cfg.title; status.textContent=cfg.statusOnline;

    const add=(t,me=false)=>{
      const w=document.createElement("div"); w.className="msg"+(me?" me":"");
      const b=document.createElement("div"); b.className="bubble"; b.textContent=t;
      w.appendChild(b); body.appendChild(w); body.scrollTop=body.scrollHeight;
    };

    const reply=(txt)=>{
      const t=(txt||"").toLowerCase();
      const rule=cfg.rules.find(r=>r.keys.some(k=>t.includes(k)));
      status.textContent=cfg.statusTyping;
      setTimeout(()=>{
        status.textContent=cfg.statusOnline;
        add(rule?rule.reply:cfg.fallback,false);
      },650);
    };

    const doAction=(a)=>{
      if(a==="go:test") location.href="./test.html";
      if(a==="go:intensive") window.open(window.SITE_DATA.intensiveCourseUrl,"_blank");
      if(a?.startsWith("say:")) add(cfg.replies[a.split(":")[1]]||cfg.fallback,false);
    };

    quick.innerHTML="";
    cfg.quick.forEach(q=>{
      const b=document.createElement("button"); b.className="chip"; b.type="button"; b.textContent=q.label;
      b.onclick=()=>{add(q.label,true); doAction(q.action);};
      quick.appendChild(b);
    });

    fab.onclick=()=>{
      chat.classList.toggle("open");
      if(chat.classList.contains("open") && body.childElementCount===0){
        add("هلا! أنا مساعد أكاديمية عايد 👋\nاكتب سؤالك أو اختر زر.", false);
      }
    };
    close?.addEventListener("click",()=>chat.classList.remove("open"));

    const sendNow=()=>{
      const v=(input.value||"").trim(); if(!v) return;
      input.value=""; add(v,true); reply(v);
    };
    send?.addEventListener("click",sendNow);
    input?.addEventListener("keydown",(e)=>{if(e.key==="Enter")sendNow();});
  }

  async function shareApp(){
    const shareUrl=window.SITE_DATA.appShareUrl|| (location.origin + location.pathname.replace(/\/[^\/]*$/,"/"));
    const text=[window.SITE_DATA.share.aya,window.SITE_DATA.share.hadith,"",window.SITE_DATA.share.headline,shareUrl].join("\n");
    try{
      if(navigator.share) await navigator.share({title:window.SITE_DATA.appName,text,url:shareUrl});
      else if(navigator.clipboard){ await navigator.clipboard.writeText(text); alert("تم نسخ نص المشاركة ✅");}
      else prompt("انسخ النص:",text);
    }catch{}
  }

  window.addEventListener("DOMContentLoaded",()=>{
    $$("#year").forEach(el=>el.textContent=new Date().getFullYear());
    $("#shareBtn")?.addEventListener("click",shareApp);
    startPopups(); initAssistant();
  });
})();