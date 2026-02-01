(function(){
  const {$,store,clamp}=window.APP;
  const KEY_PROFILE="step_profile_v1", KEY_ATTEMPT="step_attempt_v1", KEY_BANK="step_bank_v1";

  async function loadQuestions(){
    const c=store.get(KEY_BANK,null);
    if(c?.items?.length) return c.items;
    const res=await fetch("./assets/questions.json",{cache:"no-store"});
    const items=await res.json();
    store.set(KEY_BANK,{items,at:Date.now()});
    return items;
  }

  function pickQuestions(all,n){
    const v=all.filter(q=>q.section==="Vocabulary");
    const g=all.filter(q=>q.section==="Grammar");
    const r=all.filter(q=>q.section==="Reading");
    const wantV=Math.round(n*0.36);
    const wantG=Math.round(n*0.34);
    const wantR=n-wantV-wantG;

    const sample=(arr,k)=>{
      const copy=arr.slice(), out=[];
      for(let i=0;i<k && copy.length;i++){
        out.push(copy.splice(Math.floor(Math.random()*copy.length),1)[0]);
      }
      return out;
    };

    const out=[...sample(v,wantV),...sample(g,wantG),...sample(r,wantR)];
    for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
    return out;
  }

  function readProfile(){return store.get(KEY_PROFILE,{})||{};}
  function saveProfile(p){store.set(KEY_PROFILE,p);}

  function compute(qs,ans){
    let correct=0; const by={};
    qs.forEach((q,idx)=>{
      const a=ans[idx];
      by[q.section]??={total:0,correct:0};
      by[q.section].total++;
      if(a===q.correctIndex){correct++;by[q.section].correct++;}
    });
    const total=qs.length; const pct=total?(correct/total)*100:0;
    let weak=null, weakPct=999;
    Object.keys(by).forEach(s=>{
      const p=(by[s].correct/by[s].total)*100;
      if(p<weakPct){weakPct=p;weak=s;}
    });
    return {correct,total,pct,bySection:by,weakestSection:weak};
  }

  function level(pct){
    if(pct>=78) return {level:"متقدم", tone:"جاهز بقوة… خلنا نصقل السرعة ونقفل الثغرات."};
    if(pct>=55) return {level:"متوسط", tone:"مستواك طيب… نحتاج نرفع الدقة وننظّم التكرار."};
    return {level:"مبتدئ", tone:"بداية ممتازة… ركّز على الأساسيات مع تدريب يومي بسيط."};
  }

  function buildPlan(profile, analysis){
    const daysMap={lt_24h:1, lt_3d:3, lt_7d:7, lt_month:30, no_booking:30};
    const days=daysMap[profile.timeframe||"no_booking"]||30;
    const perDay=Number(profile.studyMinutes||30);

    const focusOrder = analysis.weakestSection==="Reading" ? ["Reading","Grammar","Vocabulary"]
                     : analysis.weakestSection==="Grammar" ? ["Grammar","Vocabulary","Reading"]
                     : ["Vocabulary","Grammar","Reading"];

    const blocks=[];
    for(let d=1; d<=days; d++){
      const topic=focusOrder[(d-1)%focusOrder.length];
      const a=Math.max(10,Math.round(perDay*0.45));
      const b=Math.max(10,Math.round(perDay*0.35));
      const c=Math.max(10,perDay-a-b);
      blocks.push({day:d,title:`اليوم ${d}: تركيز ${topic}`,items:[
        `(${a}د) مراجعة سريعة: ${topic}`,
        `(${b}د) تدريب + تصحيح أخطاء`,
        `(${c}د) مراجعة أخطاء أمس + 5 أسئلة سريعة`
      ]});
    }

    const tips=[];
    if((profile.timeframe||"no_booking")==="no_booking"){
      tips.push("ما حجزت موعد؟ الأفضل تحجز بعد ما تلتزم 7–14 يوم عشان تدخل بثقة.");
    } else if(profile.timeframe==="lt_24h"){
      tips.push("وقتك ضيق جدًا: ركّز على الاستراتيجيات + مراجعة الأخطاء.");
    }
    tips.push("قاعدة ذهبية: لا تكثر مصادر… مصدر واحد + تدريب يومي.");
    tips.push("راجع أخطاءك قبل ما تزيد كمية التدريب.");

    return {days, perDay, blocks, tips};
  }

  function renderQ(state){
    const q=state.questions[state.index];
    $("#qIndex").textContent=`${state.index+1}/${state.questions.length}`;
    $("#qSection").textContent=q.section;
    $("#qPrompt").textContent=q.prompt;

    const ans=state.answers[state.index];
    const locked=typeof ans==="number";
    const opts=$("#qOptions"); opts.innerHTML="";
    q.options.forEach((txt,i)=>{
      const b=document.createElement("button");
      b.type="button"; b.className="opt"; b.textContent=txt;
      if(locked){
        if(i===q.correctIndex) b.classList.add("correct");
        if(i===ans && ans!==q.correctIndex) b.classList.add("wrong");
        b.disabled=true;
      }else{
        b.onclick=()=>{state.answers[state.index]=i; store.set(KEY_ATTEMPT,state); renderQ(state);};
      }
      opts.appendChild(b);
    });

    const ex=$("#qExplain");
    if(locked){ex.style.display="block"; ex.innerHTML=q.explanationAr||"";} else {ex.style.display="none"; ex.innerHTML="";}
    $("#progressBar").style.width=((state.index+1)/state.questions.length*100)+"%";

    $("#prevBtn").disabled=state.index===0;
    $("#nextBtn").disabled=state.index===state.questions.length-1;
    $("#finishBtn").disabled=state.answers.some(a=>typeof a!=="number");
  }

  function buildNav(state){
    const grid=$("#navGrid"); grid.innerHTML="";
    state.questions.forEach((q,idx)=>{
      const b=document.createElement("button");
      b.type="button"; b.className="chip"; b.textContent=(idx+1)+"";
      if(typeof state.answers[idx]==="number") b.style.background="rgba(25,135,84,.12)";
      b.onclick=()=>{state.index=idx; store.set(KEY_ATTEMPT,state); renderQ(state);};
      grid.appendChild(b);
    });
  }

  async function start(){
    const all=await loadQuestions();

    // form toggles
    const togglePrev=()=>{const yes=$("#tookStepBefore").value==="yes"; $("#prevBlock").style.display=yes?"block":"none"; $("#targetBlock").style.display=yes?"block":"none";};
    const toggleUni=()=>{const isUni=$("#stage").value==="uni"; $("#uniBlock").style.display=isUni?"block":"none";};

    const prof=readProfile();
    $("#studentName").value=prof.name||"";
    $("#goal").value=prof.goal||"70+";
    $("#region").value=prof.region||"";
    $("#timeframe").value=prof.timeframe||"no_booking";
    $("#studyMinutes").value=prof.studyMinutes||30;
    $("#studyTime").value=prof.studyTime||"evening";
    $("#stage").value=prof.stage||"other";
    $("#uniLevel").value=prof.uniLevel||"";
    $("#major").value=prof.major||"";
    $("#prefStyle").value=prof.prefStyle||"short_videos";
    $("#tookStepBefore").value=prof.tookStepBefore||"no";
    $("#prevScore").value=prof.prevScore||"";
    $("#targetScore").value=prof.targetScore||"";
    $("#notes").value=prof.notes||"";
    togglePrev(); toggleUni();
    $("#tookStepBefore").addEventListener("change",togglePrev);
    $("#stage").addEventListener("change",toggleUni);

    let state=store.get(KEY_ATTEMPT,null);
    const resumeOk=state && Array.isArray(state.questions) && state.questions.length===window.SITE_DATA.test.questionsPerAttempt;
    if(resumeOk){
      const map=new Map(all.map(q=>[q.id,q]));
      state.questions=state.questions.map(x=>map.get(x.id));
      $("#resumeBox").style.display="block";
      $("#resumeBtn").onclick=()=>{ $("#setupCard").style.display="none"; $("#testCard").style.display="block"; buildNav(state); renderQ(state); };
      $("#restartBtn").onclick=()=>{ store.del(KEY_ATTEMPT); location.reload(); };
    }

    $("#startBtn").onclick=()=>{
      const p={
        name:($("#studentName").value.trim()||"صديقنا"),
        goal:$("#goal").value,
        region:$("#region").value,
        timeframe:$("#timeframe").value,
        studyMinutes:Number($("#studyMinutes").value||30),
        studyTime:$("#studyTime").value,
        stage:$("#stage").value,
        uniLevel:$("#uniLevel").value,
        major:$("#major").value.trim(),
        prefStyle:$("#prefStyle").value,
        tookStepBefore:$("#tookStepBefore").value,
        prevScore:$("#prevScore").value.trim(),
        targetScore:$("#targetScore").value.trim(),
        notes:$("#notes").value.trim()
      };
      saveProfile(p);

      const qs=pickQuestions(all,window.SITE_DATA.test.questionsPerAttempt);
      state={startedAt:Date.now(),index:0,questions:qs.map(q=>({id:q.id})),answers:new Array(qs.length).fill(null)};
      const map=new Map(all.map(q=>[q.id,q]));
      state.questions=state.questions.map(x=>map.get(x.id));
      store.set(KEY_ATTEMPT,state);

      $("#setupCard").style.display="none";
      $("#testCard").style.display="block";
      buildNav(state); renderQ(state);
      scrollTo({top:0,behavior:"smooth"});
    };

    $("#prevBtn").onclick=()=>{state.index=clamp(state.index-1,0,state.questions.length-1); store.set(KEY_ATTEMPT,state); renderQ(state);};
    $("#nextBtn").onclick=()=>{state.index=clamp(state.index+1,0,state.questions.length-1); store.set(KEY_ATTEMPT,state); renderQ(state);};

    $("#finishBtn").onclick=()=>{
      const profile=readProfile();
      const analysis=compute(state.questions,state.answers);
      const lvl=level(analysis.pct);
      const plan=buildPlan(profile,analysis);
      store.set("step_result_v1",{profile,analysis,level:lvl,plan,finishedAt:Date.now()});
      store.del(KEY_ATTEMPT);
      location.href="./results.html";
    };
  }

  window.addEventListener("DOMContentLoaded",()=>start().catch(()=>alert("صار خطأ بتحميل الأسئلة.")));
})();