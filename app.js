const D = window.HEALTH_DATA;
const C = {
  text:'#e8edf4', muted:'#9aa6b8', faint:'#5e6a7d', line:'#252d3a',
  accent:'#34d6a8', good:'#3ecf8e', warn:'#f5b94d', bad:'#ef6a6a', info:'#5aa8ff',
  font:"Manrope, system-ui, sans-serif", mono:"'Spline Sans Mono', monospace"
};
Chart.defaults.font.family = C.font;
Chart.defaults.color = C.muted;
Chart.defaults.font.size = 12;

const obj2arr = o => ({ labels:Object.keys(o), values:Object.values(o) });
const fmt = (n,d=0)=> Number(n).toLocaleString('ru-RU',{minimumFractionDigits:d,maximumFractionDigits:d});

function grad(ctx, hex){
  const c = ctx.chart.ctx;
  const g = c.createLinearGradient(0,0,0,ctx.chart.height);
  const r=parseInt(hex.slice(1,3),16),gg=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  g.addColorStop(0,`rgba(${r},${gg},${b},0.28)`);
  g.addColorStop(1,`rgba(${r},${gg},${b},0.0)`);
  return g;
}
const baseOpts = (extra={}) => ({
  responsive:true, maintainAspectRatio:false,
  interaction:{mode:'index',intersect:false},
  plugins:{
    legend:{display:false},
    tooltip:{
      backgroundColor:'#0c0f14', borderColor:C.line, borderWidth:1,
      titleColor:C.text, bodyColor:C.muted, padding:11, cornerRadius:9,
      titleFont:{family:C.mono,size:12}, bodyFont:{family:C.font,size:13},
      displayColors:false
    }
  },
  scales:{
    x:{grid:{display:false},border:{color:C.line},ticks:{color:C.faint,font:{family:C.mono,size:11}}},
    y:{grid:{color:C.line,drawTicks:false},border:{display:false},ticks:{color:C.faint,font:{family:C.mono,size:11},padding:8}}
  },
  ...extra
});

function lineChart(id,obj,color,{fill=true,d=0,suffix=''}={}){
  const {labels,values}=obj2arr(obj);
  new Chart(document.getElementById(id),{
    type:'line',
    data:{labels,datasets:[{
      data:values, borderColor:color, borderWidth:2.5,
      tension:.35, pointRadius:3, pointBackgroundColor:color, pointBorderColor:'#0c0f14', pointBorderWidth:1.5,
      pointHoverRadius:6,
      fill:fill?'start':false,
      backgroundColor:fill?(ctx)=>grad(ctx,color):'transparent'
    }]},
    options:baseOpts({plugins:{legend:{display:false},tooltip:{
      backgroundColor:'#0c0f14',borderColor:C.line,borderWidth:1,titleColor:C.text,bodyColor:C.muted,
      padding:11,cornerRadius:9,displayColors:false,
      callbacks:{label:(c)=>fmt(c.raw,d)+suffix}
    }}})
  });
}

function barChart(id,obj,color,{horizontal=false,d=0,suffix=''}={}){
  const {labels,values}=obj2arr(obj);
  new Chart(document.getElementById(id),{
    type:'bar',
    data:{labels,datasets:[{data:values,backgroundColor:color,borderRadius:6,maxBarThickness:46}]},
    options:baseOpts({
      indexAxis:horizontal?'y':'x',
      plugins:{legend:{display:false},tooltip:{
        backgroundColor:'#0c0f14',borderColor:C.line,borderWidth:1,titleColor:C.text,bodyColor:C.muted,
        padding:11,cornerRadius:9,displayColors:false,callbacks:{label:(c)=>fmt(c.raw,d)+suffix}}}
    })
  });
}

/* KPI strip */
const lastVal = o => Object.values(o).slice(-1)[0];
function kpiHTML(){
  const rhr=D.restingHR, vo2=D.vo2max, steps=D.steps, sleep=D.sleep, wk=D.workoutsByYear;
  const items=[
    {v:fmt(lastVal(rhr),0), l:'Пульс покоя, уд/мин', d:'+4 с 2018', cls:'down'},
    {v:fmt(lastVal(vo2),1), l:'VO₂Max, мл/мин·кг', d:'−18% с 2018', cls:'down'},
    {v:fmt(lastVal(steps)/1000,1)+'k', l:'Шаги в день (2026)', d:'рекорд', cls:'up'},
    {v:fmt(lastVal(sleep),1)+' ч', l:'Сон за ночь (2026)', d:'+1,2 ч с 2021', cls:'up'},
    {v:'72,7', l:'Вес сейчас, кг', d:'циклы 66–75', cls:'flat'},
    {v:fmt(lastVal(wk),0), l:'Тренировок в 2026', d:'максимум', cls:'up'},
  ];
  document.getElementById('kpis').innerHTML = items.map(i=>`
    <div class="kpi"><div class="v tnum">${i.v}</div><div class="l">${i.l}</div><div class="d ${i.cls}">${i.d}</div></div>`).join('');
}

/* Dual axis resp + spo2 */
function respChart(){
  const labels=Object.keys(D.respRate);
  new Chart(document.getElementById('cResp'),{
    type:'line',
    data:{labels,datasets:[
      {label:'Дыхание /мин',data:Object.values(D.respRate),borderColor:C.info,backgroundColor:'transparent',borderWidth:2.5,tension:.35,pointRadius:3,pointBackgroundColor:C.info,yAxisID:'y'},
      {label:'SpO₂ %',data:labels.map(l=>D.spo2[l]??null),borderColor:C.accent,backgroundColor:'transparent',borderWidth:2.5,tension:.35,pointRadius:3,pointBackgroundColor:C.accent,yAxisID:'y1'}
    ]},
    options:baseOpts({
      plugins:{legend:{display:true,labels:{color:C.muted,boxWidth:10,boxHeight:10,usePointStyle:true,font:{size:12}}},
        tooltip:{backgroundColor:'#0c0f14',borderColor:C.line,borderWidth:1,titleColor:C.text,bodyColor:C.muted,padding:11,cornerRadius:9}},
      scales:{
        x:{grid:{display:false},border:{color:C.line},ticks:{color:C.faint,font:{family:C.mono,size:11}}},
        y:{position:'left',grid:{color:C.line},border:{display:false},ticks:{color:C.faint,font:{family:C.mono,size:11}},min:16,max:21},
        y1:{position:'right',grid:{drawOnChartArea:false},border:{display:false},ticks:{color:C.faint,font:{family:C.mono,size:11}},min:90,max:100}
      }
    })
  });
}

/* Noise dual line + threshold */
function noiseChart(){
  const labels=Object.keys(D.envNoise);
  new Chart(document.getElementById('cNoise'),{
    type:'line',
    data:{labels,datasets:[
      {label:'Окружающий шум, дБ',data:Object.values(D.envNoise),borderColor:C.warn,backgroundColor:'transparent',borderWidth:2.5,tension:.35,pointRadius:3,pointBackgroundColor:C.warn},
      {label:'Наушники, дБ',data:labels.map(l=>D.headphoneNoise[l]??null),borderColor:C.info,backgroundColor:'transparent',borderWidth:2.5,tension:.35,pointRadius:3,pointBackgroundColor:C.info},
      {label:'Порог риска 80 дБ',data:labels.map(()=>80),borderColor:C.bad,borderDash:[6,5],borderWidth:1.5,pointRadius:0,fill:false}
    ]},
    options:baseOpts({
      plugins:{legend:{display:true,labels:{color:C.muted,boxWidth:10,boxHeight:10,usePointStyle:true,font:{size:12}}},
        tooltip:{backgroundColor:'#0c0f14',borderColor:C.line,borderWidth:1,titleColor:C.text,bodyColor:C.muted,padding:11,cornerRadius:9}},
      scales:{
        x:{grid:{display:false},border:{color:C.line},ticks:{color:C.faint,font:{family:C.mono,size:11}}},
        y:{grid:{color:C.line},border:{display:false},ticks:{color:C.faint,font:{family:C.mono,size:11}},min:50,max:85}
      }
    })
  });
}

function ecgList(){
  const order={'Синусовый ритм':'b-good','Синусовый ритм (одышка)':'b-warn','Пульс выше 120':'b-warn','Плохая запись':'b-info'};
  document.getElementById('ecgList').innerHTML = D.ecg.map(([date,cls])=>`
    <div class="ecg-item"><span class="date">${date}</span><span class="badge ${order[cls]||'b-info'}">${cls}</span></div>`).join('');
}

/* weight line (date-labelled) */
function weightChart(){
  const labels=D.weight.map(w=>w[0]);
  const vals=D.weight.map(w=>w[1]);
  new Chart(document.getElementById('cWeight'),{
    type:'line',
    data:{labels,datasets:[{
      data:vals, borderColor:C.accent, borderWidth:2.5, tension:.3,
      pointRadius:4, pointBackgroundColor:C.accent, pointBorderColor:'#0c0f14', pointBorderWidth:1.5, pointHoverRadius:6,
      fill:'start', backgroundColor:(ctx)=>grad(ctx,C.accent)
    }]},
    options:baseOpts({plugins:{legend:{display:false},tooltip:{
      backgroundColor:'#0c0f14',borderColor:C.line,borderWidth:1,titleColor:C.text,bodyColor:C.muted,
      padding:11,cornerRadius:9,displayColors:false,callbacks:{label:(c)=>fmt(c.raw,1)+' кг'}
    }},scales:{
      x:{grid:{display:false},border:{color:C.line},ticks:{color:C.faint,font:{family:C.mono,size:11}}},
      y:{grid:{color:C.line},border:{display:false},ticks:{color:C.faint,font:{family:C.mono,size:11},padding:8,callback:(v)=>v+' кг'}}
    }})
  });
}

/* render */
kpiHTML();
weightChart();
lineChart('cRHR',D.restingHR,C.warn,{d:1,suffix:' уд/мин'});
lineChart('cVO2',D.vo2max,C.bad,{d:1});
lineChart('cHRV',D.hrv,C.info,{d:1,suffix:' мс'});
respChart();
lineChart('cSteps',D.steps,C.good,{d:0});
lineChart('cEnergy',D.activeEnergy,C.accent,{d:0,suffix:' ккал'});
lineChart('cExer',D.exerciseMin,C.good,{d:0,suffix:' мин'});
lineChart('cDist',D.distance,C.info,{d:1,suffix:' км'});
barChart('cWYear',D.workoutsByYear,C.accent,{d:0});
barChart('cWType',D.workoutTypes,C.info,{horizontal:true,d:0});
barChart('cWMonth',D.workoutsByMonth,C.accent,{d:0});
lineChart('cSleep',D.sleep,C.accent,{d:1,suffix:' ч'});
barChart('cSleepR',D.sleepRecent,C.good,{d:1,suffix:' ч'});
noiseChart();
ecgList();
