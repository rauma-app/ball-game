const $=s=>document.querySelector(s);
const participantsEl=$("#participants"), setup=$("#setup"), race=$("#race"), canvas=$("#game"), ctx=canvas.getContext("2d");
const state={players:[],running:false,finished:false,startedAt:0};
const colors=["#ff5b68","#5b8cff","#58d68d","#ffc857","#b77cff","#39c6d8","#ff8a3d","#e8e8e8"];

function addPlayer(label="PLAYER "+(state.players.length+1)){
  const p={id:crypto.randomUUID(),label,img:null,color:colors[state.players.length%colors.length]};
  state.players.push(p); renderSetup();
}
function renderSetup(){
  participantsEl.innerHTML="";
  state.players.forEach((p,i)=>{
    const card=document.createElement("div"); card.className="card";
    card.innerHTML=`<button class="remove" title="Remove">×</button>
      <div class="avatar">${p.img?`<img src="${p.img}">`:`<span class="initial">${p.label.slice(0,1).toUpperCase()}</span>`}</div>
      <div class="fields"><label>Ball ${String(i+1).padStart(2,"0")}</label>
      <input type="text" value="${escapeHtml(p.label)}" maxlength="18">
      <label class="upload">＋ Upload photo<input type="file" accept="image/*"></label></div>`;
    card.querySelector("input[type=text]").oninput=e=>p.label=e.target.value||"PLAYER";
    card.querySelector("input[type=file]").onchange=e=>{
      const f=e.target.files[0]; if(!f)return;
      const r=new FileReader(); r.onload=()=>{p.img=r.result;renderSetup()}; r.readAsDataURL(f);
    };
    card.querySelector(".remove").onclick=()=>{if(state.players.length>2){state.players.splice(i,1);renderSetup()}};
    participantsEl.appendChild(card);
  });
}
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
$("#addBtn").onclick=()=>{if(state.players.length<8)addPlayer()};
$("#startBtn").onclick=()=>startRace();
$("#backBtn").onclick=()=>{state.running=false;race.classList.add("hidden");setup.classList.remove("hidden");$("#winner").classList.add("hidden")};

for(let i=0;i<5;i++)addPlayer(["RONALDO","MESSI","MBAPPÉ","HAALAND","NEYMAR"][i]);

function fit(){canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;canvas.style.width=innerWidth+"px";canvas.style.height=innerHeight+"px";ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)}
addEventListener("resize",fit);fit();

const W=1800,H=900;
let balls=[],t=0;
function makeRace(){
  balls=state.players.map((p,i)=>({p,x:100,y:160+i*55,vx:0,vy:0,r:24,finished:false,finishTime:0,phase:Math.random()*6.28}));
  t=0;state.finished=false;
}
function startRace(){
  if(state.players.length<2)return;
  setup.classList.add("hidden");race.classList.remove("hidden");makeRace();
  const cd=$("#countdown"), status=$("#status");
  status.textContent="READY";
  const seq=["3","2","1","GO!"]; let n=0;
  cd.textContent=seq[n];
  const timer=setInterval(()=>{
    n++;
    if(n<seq.length)cd.textContent=seq[n];
    if(n===seq.length-1){status.textContent="RACE";clearInterval(timer);setTimeout(()=>{cd.textContent="" ;state.running=true;state.startedAt=performance.now();requestAnimationFrame(loop)},400)}
  },800);
}

function obstacle(x,y,w,h,type){
  ctx.save();ctx.translate(x,y);
  if(type==="spinner"){
    ctx.fillStyle="#2a303a";ctx.fillRect(-w/2,-h/2,w,h);
    ctx.translate(0,0);ctx.rotate(t*.9);ctx.strokeStyle="#aeb7c4";ctx.lineWidth=12;ctx.lineCap="round";
    for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(w*.55,0);ctx.stroke()}
    ctx.fillStyle="#f3f5f7";ctx.beginPath();ctx.arc(0,0,10,0,7);ctx.fill();
  }else{
    ctx.fillStyle="#202630";ctx.fillRect(-w/2,-h/2,w,h);
    ctx.strokeStyle="#485261";ctx.lineWidth=2;ctx.strokeRect(-w/2,-h/2,w,h);
    ctx.fillStyle="#687384";ctx.beginPath();ctx.arc(0,0,Math.min(w,h)*.22,0,7);ctx.fill();
  }
  ctx.restore();
}
function drawTrack(){
  ctx.fillStyle="#0a0d12";ctx.fillRect(0,0,innerWidth,innerHeight);
  const sx=innerWidth/W, sy=innerHeight/H, scale=Math.min(sx,sy), ox=(innerWidth-W*scale)/2, oy=(innerHeight-H*scale)/2;
  ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);
  // layered track
  ctx.fillStyle="#121720";roundRect(50,70,1700,760,42);ctx.fill();
  ctx.fillStyle="#1b222d";roundRect(80,105,1640,690,34);ctx.fill();
  ctx.fillStyle="#0f141b";roundRect(105,130,1590,640,28);ctx.fill();
  // lanes / ramps
  ctx.strokeStyle="#2a3340";ctx.lineWidth=5;ctx.setLineDash([18,20]);
  for(let y=190;y<750;y+=95){ctx.beginPath();ctx.moveTo(130,y);ctx.lineTo(1680,y);ctx.stroke()}
  ctx.setLineDash([]);
  // obstacles
  obstacle(500,280,90,90,"spinner"); obstacle(820,560,90,90,"spinner"); obstacle(1120,300,90,90,"spinner");
  ctx.fillStyle="#e9edf2";ctx.font="900 16px system-ui";ctx.letterSpacing="3px";ctx.fillText("START",125,145);
  ctx.fillText("FINISH",1600,145);
  ctx.fillStyle="#f1f4f7";ctx.fillRect(1640,150,7,620);
  ctx.restore();
}
function roundRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function drawBall(b){
  const sx=innerWidth/W,sy=innerHeight/H,scale=Math.min(sx,sy),ox=(innerWidth-W*scale)/2,oy=(innerHeight-H*scale)/2;
  const X=ox+b.x*scale,Y=oy+b.y*scale,R=b.r*scale;
  ctx.save();
  // shadow
  ctx.globalAlpha=.35;ctx.fillStyle="#000";ctx.beginPath();ctx.ellipse(X+3,Y+R*.8,R*1.05,R*.35,0,0,7);ctx.fill();ctx.globalAlpha=1;
  // ball
  ctx.fillStyle=b.p.color;ctx.beginPath();ctx.arc(X,Y,R,0,7);ctx.fill();
  ctx.strokeStyle="#ffffff55";ctx.lineWidth=2;ctx.stroke();
  if(b.p.img){
    const img=new Image();img.src=b.p.img;
    ctx.save();ctx.beginPath();ctx.arc(X,Y,R*.72,0,7);ctx.clip();ctx.drawImage(img,X-R*.72,Y-R*.72,R*1.44,R*1.44);ctx.restore();
  }else{
    ctx.fillStyle="#fff";ctx.font=`900 ${R*.8}px system-ui`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(b.p.label[0]?.toUpperCase()||"?",X,Y);
  }
  // simple cartoon body / face above ball
  const lead=Math.max(...balls.map(q=>q.x))===b.x;
  ctx.fillStyle="#f0c7a2";ctx.beginPath();ctx.arc(X,Y-R*1.05,R*.48,0,7);ctx.fill();
  ctx.fillStyle="#1a1d24";ctx.beginPath();ctx.arc(X-R*.15,Y-R*1.1,R*.06,0,7);ctx.arc(X+R*.15,Y-R*1.1,R*.06,0,7);ctx.fill();
  ctx.strokeStyle="#1a1d24";ctx.lineWidth=2;ctx.beginPath();ctx.arc(X,Y-R*.98,R*.2,lead?0:Math.PI,lead?Math.PI:7);ctx.stroke();
  ctx.font=`800 ${Math.max(10,R*.48)}px system-ui`;ctx.textAlign="center";ctx.fillStyle="#fff";ctx.fillText(b.p.label,X,Y+R*1.75);
  ctx.restore();
}
function loop(now){
  if(!state.running)return;
  t=now/1000;
  drawTrack();
  const sx=innerWidth/W,sy=innerHeight/H,scale=Math.min(sx,sy),ox=(innerWidth-W*scale)/2,oy=(innerHeight-H*scale)/2;
  for(const b of balls){
    if(b.finished)continue;
    // pseudo-physics tuned for cinematic demo
    const target=1640;
    const jitter=Math.sin(t*2+b.phase)*.34;
    b.vx=2.25+jitter+(b.p.label.length%4)*.045;
    b.vy=Math.sin(t*2.2+b.phase)*.42;
    b.x+=b.vx;
    b.y+=b.vy;
    // bounce from invisible lane boundaries
    if(b.y<155){b.y=155;b.phase+=1}
    if(b.y>745){b.y=745;b.phase+=1}
    // obstacle zones create different reactions
    for(const o of [[500,280],[820,560],[1120,300]]){
      if(Math.abs(b.x-o[0])<48 && Math.abs(b.y-o[1])<60){
        b.x-=2.8; b.phase+=.18;
      }
    }
    // finish
    if(b.x>=target){b.x=target;b.finished=true;b.finishTime=now}
  }
  balls.sort((a,b)=>b.x-a.x);
  balls.forEach(drawBall);
  const finished=balls.filter(b=>b.finished);
  if(finished.length){
    const winner=finished[0];
    state.running=false;
    setTimeout(()=>showWinner(winner),450);
  }else requestAnimationFrame(loop);
}
function showWinner(b){
  $("#status").textContent="FINISH";
  const w=$("#winner");w.innerHTML=`<div class="small">🏆 WINNER</div><strong>${escapeHtml(b.p.label)}</strong>`;w.classList.remove("hidden");
}
