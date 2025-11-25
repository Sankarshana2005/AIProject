const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const labelEl = document.getElementById("label");
const scoreEl = document.getElementById("score");
const emojiEl = document.getElementById("emoji");
const bgFX = document.getElementById("bgFX");
const ctxFX = bgFX.getContext("2d");

let stream = null;
let intervalId = null;

// Mirrored send: draw mirrored frame into canvas so backend sees left=left
function drawMirrored(ctx, video, w, h){
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(video, -w, 0, w, h);
  ctx.restore();
}

const EMOJI = {
  "Open Palm":"✋","Fist":"✊","Peace":"✌️","OK":"👌","Thumbs Up":"👍",
  "Thumbs Down":"👎","Point Up":"👆","Call Me":"🤙","Swipe Left":"⬅️","Swipe Right":"➡️"
};

// 10 themes with unique patterns; randomized order each run
const THEMES = [
  { class:"theme-blue",   pattern:"stars"     },
  { class:"theme-purple", pattern:"waves"     },
  { class:"theme-cyan",   pattern:"orbits"    },
  { class:"theme-green",  pattern:"particles" },
  { class:"theme-orange", pattern:"waves"     },
  { class:"theme-pink",   pattern:"stars"     },
  { class:"theme-matrix", pattern:"matrix"    },
  { class:"theme-aurora", pattern:"aurora"    },
  { class:"theme-galaxy", pattern:"galaxy"    },
  { class:"theme-plasma", pattern:"plasma"    },
];
// Shuffle themes
for(let i=THEMES.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [THEMES[i],THEMES[j]]=[THEMES[j],THEMES[i]]; }
let themeIndex = 0;

function applyTheme(){
  document.body.className = THEMES[themeIndex].class;
  startBackground(THEMES[themeIndex].pattern);
}
function nextTheme(){ themeIndex = (themeIndex + 1) % THEMES.length; applyTheme(); }
function prevTheme(){ themeIndex = (themeIndex - 1 + THEMES.length) % THEMES.length; applyTheme(); }

// ----- BACKGROUND FX -----
let animId = null;
function resizeBG(){ bgFX.width = window.innerWidth; bgFX.height = window.innerHeight; }
window.addEventListener("resize", resizeBG); resizeBG();

function startBackground(pattern){
  if(animId) cancelAnimationFrame(animId);
  const c1 = getComputedStyle(document.body).getPropertyValue("--c1").trim();
  const c2 = getComputedStyle(document.body).getPropertyValue("--c2").trim();
  if(pattern==="stars") return starfield(c1);
  if(pattern==="waves") return neonWaves(c1,c2);
  if(pattern==="orbits") return orbits(c1,c2);
  if(pattern==="particles") return particles(c1);
  if(pattern==="matrix") return matrixRain(c1);
  if(pattern==="aurora") return aurora(c1,c2);
  if(pattern==="galaxy") return galaxyPulse(c1,c2);
  if(pattern==="plasma") return plasma(c1,c2);
}

function starfield(c1){
  const stars = new Array(180).fill(0).map(()=>({x:Math.random()*bgFX.width,y:Math.random()*bgFX.height,r:Math.random()*1.6+.3,s:Math.random()*.7+.2}));
  function frame(){
    ctxFX.clearRect(0,0,bgFX.width,bgFX.height);
    for(const st of stars){
      st.y += st.s; if(st.y>bgFX.height) st.y=0;
      ctxFX.beginPath(); ctxFX.fillStyle = c1; ctxFX.shadowColor = c1; ctxFX.shadowBlur=10;
      ctxFX.arc(st.x, st.y, st.r, 0, Math.PI*2); ctxFX.fill();
    }
    animId=requestAnimationFrame(frame);
  }
  frame();
}
function neonWaves(c1,c2){
  let t=0;
  function frame(){
    const w=bgFX.width,h=bgFX.height; ctxFX.clearRect(0,0,w,h);
    for(let i=0;i<6;i++){
      const amp = 18 + i*12, freq = 0.004 + i*0.0013;
      ctxFX.beginPath(); ctxFX.moveTo(0,h*0.7);
      for(let x=0;x<=w;x+=6){
        const y = h*0.7 + Math.sin((x*freq)+t+i)*amp;
        ctxFX.lineTo(x,y);
      }
      ctxFX.lineWidth=2; ctxFX.strokeStyle=i%2?c1:c2; ctxFX.shadowColor=ctxFX.strokeStyle; ctxFX.shadowBlur=12; ctxFX.stroke();
    }
    t+=0.03; animId=requestAnimationFrame(frame);
  }
  frame();
}
function orbits(c1,c2){
  let t=0; const rings=[80,140,220,300];
  function frame(){
    const w=bgFX.width,h=bgFX.height; ctxFX.clearRect(0,0,w,h);
    const cx=w*0.8, cy=h*0.25;
    rings.forEach((r,i)=>{
      ctxFX.beginPath(); ctxFX.strokeStyle = i%2?c1:c2; ctxFX.lineWidth=1.2; ctxFX.shadowBlur=10; ctxFX.shadowColor=ctxFX.strokeStyle;
      ctxFX.arc(cx,cy,r,0,Math.PI*2); ctxFX.stroke();
      const x=cx+Math.cos(t*0.6+i)*r, y=cy+Math.sin(t*0.6+i)*r;
      ctxFX.beginPath(); ctxFX.fillStyle = i%2?c2:c1; ctxFX.shadowBlur=16; ctxFX.arc(x,y,4,0,Math.PI*2); ctxFX.fill();
    });
    t+=0.02; animId=requestAnimationFrame(frame);
  }
  frame();
}
function particles(c1){
  const ps = new Array(130).fill(0).map(()=>({x:Math.random()*bgFX.width,y:Math.random()*bgFX.height,vx:(Math.random()-.5)*.9,vy:(Math.random()-.5)*.9}));
  function frame(){
    ctxFX.clearRect(0,0,bgFX.width,bgFX.height);
    for(const p of ps){
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0||p.x>bgFX.width) p.vx*=-1;
      if(p.y<0||p.y>bgFX.height) p.vy*=-1;
      ctxFX.beginPath(); ctxFX.fillStyle=c1; ctxFX.shadowColor=c1; ctxFX.shadowBlur=10;
      ctxFX.arc(p.x,p.y,2,0,Math.PI*2); ctxFX.fill();
    }
    animId=requestAnimationFrame(frame);
  }
  frame();
}
function matrixRain(c1){
  const cols = Math.floor(bgFX.width/16);
  const drops = new Array(cols).fill(0).map(()=>Math.random()*bgFX.height);
  function frame(){
    ctxFX.fillStyle = "rgba(0, 0, 0, 0.08)";
    ctxFX.fillRect(0,0,bgFX.width,bgFX.height);
    ctxFX.fillStyle = c1; ctxFX.shadowColor=c1; ctxFX.shadowBlur=8;
    for(let i=0;i<cols;i++){
      const text = String.fromCharCode(0x30A0 + Math.floor(Math.random()*96));
      const x = i*16, y = drops[i]*16;
      ctxFX.fillText(text, x, y);
      drops[i] = (y>bgFX.height && Math.random()>0.975) ? 0 : drops[i]+1;
    }
    animId=requestAnimationFrame(frame);
  }
  ctxFX.font = "16px monospace";
  frame();
}
function aurora(c1,c2){
  let t=0;
  function frame(){
    const w=bgFX.width,h=bgFX.height;
    const grd = ctxFX.createRadialGradient(w*0.3, h*0.2, 0, w*0.7, h*0.8, Math.max(w,h));
    grd.addColorStop(0, c1+"33"); grd.addColorStop(1, c2+"11");
    ctxFX.fillStyle=grd; ctxFX.fillRect(0,0,w,h);
    for(let i=0;i<3;i++){
      ctxFX.beginPath();
      const y = h*0.3 + Math.sin(t+i)*h*0.1;
      ctxFX.moveTo(0,y);
      for(let x=0;x<w;x+=8){
        const yy = y + Math.sin((x*0.004)+t+i)*20;
        ctxFX.lineTo(x,yy);
      }
      ctxFX.lineWidth=2; ctxFX.strokeStyle = i%2?c1:c2; ctxFX.shadowBlur=14; ctxFX.shadowColor=ctxFX.strokeStyle; ctxFX.stroke();
    }
    t+=0.02; animId=requestAnimationFrame(frame);
  }
  frame();
}
function galaxyPulse(c1,c2){
  let t=0; const stars = new Array(120).fill(0).map(()=>({x:Math.random()*bgFX.width,y:Math.random()*bgFX.height, r:Math.random()*1.8+.4}));
  function frame(){
    const w=bgFX.width,h=bgFX.height; ctxFX.clearRect(0,0,w,h);
    for(const s of stars){
      ctxFX.beginPath(); ctxFX.fillStyle=c1; ctxFX.shadowColor=c1; ctxFX.shadowBlur=10+Math.sin(t+s.r)*6;
      ctxFX.arc(s.x,s.y,s.r,0,Math.PI*2); ctxFX.fill();
    }
    // Pulsing nebulas
    const grd = ctxFX.createRadialGradient(w*0.5, h*0.5, 50+Math.sin(t)*40, w*0.5, h*0.5, Math.max(w,h)*0.6);
    grd.addColorStop(0, c2+"33"); grd.addColorStop(1, "transparent");
    ctxFX.fillStyle=grd; ctxFX.fillRect(0,0,w,h);
    t+=0.02; animId=requestAnimationFrame(frame);
  }
  frame();
}
function plasma(c1,c2){
  let t=0;
  function frame(){
    const w=bgFX.width,h=bgFX.height; const img=ctxFX.createImageData(w,h); const data=img.data;
    for(let y=0;y<h;y+=2){
      for(let x=0;x<w;x+=2){
        const v = (Math.sin(x*0.01+t)+Math.sin(y*0.013-t)+Math.sin((x+y)*0.008))/3;
        const i = (y*w + x)*4;
        const r = Math.floor(50 + 205 * (v*0.5+0.5));
        const g = Math.floor(50 + 205 * (1-(v*0.5+0.5)));
        const b = 200;
        data[i]=r; data[i+1]=g; data[i+2]=b; data[i+3]=35;
      }
    }
    ctxFX.putImageData(img,0,0);
    t+=0.03; animId=requestAnimationFrame(frame);
  }
  frame();
}

// ----- CAMERA + BACKEND -----
async function startCamera(){
  try{
    stream = await navigator.mediaDevices.getUserMedia({ video:{ width:640, height:360 }, audio:false });
    video.srcObject = stream;
    await video.play();
    startSending();
    applyTheme();
  }catch(err){ alert("Camera error: "+err.message); }
}
function stopCamera(){
  if(intervalId){ clearInterval(intervalId); intervalId=null; }
  if(stream){ stream.getTracks().forEach(t=>t.stop()); stream=null; }
}
function startSending(){
  const ctx = canvas.getContext("2d");
  intervalId = setInterval(async () => {
    const w=640,h=360;
    canvas.width = w; canvas.height = h;
    drawMirrored(ctx, video, w, h); // mirrored send
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    try{
      const res = await fetch("/predict", {
        method: "POST", headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ image: dataUrl })
      });
      const json = await res.json();
      if(json.error) throw new Error(json.error);
      const label = json.label || "No Hand";
      const score = json.score != null ? json.score.toFixed(2) : "—";
      labelEl.textContent = label;
      scoreEl.textContent = "Confidence: " + score;
      emojiEl.textContent = EMOJI[label] || "🖐️";
      if(label === "Swipe Right") nextTheme();
      if(label === "Swipe Left")  prevTheme();
      emojiEl.animate([{transform:"scale(1)"},{transform:"scale(1.08)"},{transform:"scale(1)"}],{duration:260,easing:"ease-out"});
    }catch(e){ console.warn(e.message); }
  }, 140);
}

startBtn.onclick = startCamera;
stopBtn.onclick = stopCamera;
