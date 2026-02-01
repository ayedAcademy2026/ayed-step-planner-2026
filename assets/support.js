(function(){
  const {$,store}=window.APP;
  window.addEventListener("DOMContentLoaded",()=>{
    const form=$("#supportForm"), out=$("#supportOut");
    form?.addEventListener("submit",(e)=>{
      e.preventDefault();
      const name=$("#sName").value.trim()||"صديقنا";
      const msg=$("#sMsg").value.trim();
      if(!msg){alert("اكتب استفسارك أول.");return;}
      const arr=store.get("support_msgs_v1",[]);
      arr.push({at:Date.now(),name,msg});
      store.set("support_msgs_v1",arr);
      out.innerHTML="";
      const add=(t)=>{const d=document.createElement("div"); d.className="bubble"; d.textContent=t; out.appendChild(d);};
      add(`تم استلام استفسارك يا ${name} ✅`);
      add("شكرًا لتواصلك… سيتم النظر على طلبك والعمل عليه.");
      add("ملاحظة: هذه الصفحة تحفظ رسالتك محليًا في جهازك فقط.");
      form.reset();
    });
  });
})();