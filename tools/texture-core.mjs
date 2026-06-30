/* ============================================================
   texture-core.mjs — Node port of the procedural texture generators
   from assets/app.js (lines ~42-219).

   This is a DUPLICATE of the browser code on purpose: the live app
   (assets/app.js) is left completely untouched. These functions return a
   raw RGBA buffer { width, height, data:Uint8ClampedArray } instead of a
   <canvas>, so they can run headless and be encoded to PNG for use as the
   gpt-image-2 edit reference.

   Keep this in sync with app.js if the procedural look ever changes.
   ============================================================ */

/* ---- seeded value-noise / fbm ---- */
export function makeNoise3(seed){
  const perm = new Uint8Array(512);
  const tmp = []; for(let i=0;i<256;i++) tmp[i]=i;
  let s = (seed>>>0)||1;
  const rnd = ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; };
  for(let i=255;i>0;i--){ const j=(rnd()*(i+1))|0; const t=tmp[i]; tmp[i]=tmp[j]; tmp[j]=t; }
  for(let i=0;i<512;i++) perm[i]=tmp[i&255];
  const fade=t=>t*t*t*(t*(t*6-15)+10);
  const lerp=(a,b,t)=>a+(b-a)*t;
  const val=(x,y,z)=>(perm[(perm[(perm[x&255]+(y&255))&255]+(z&255))&255]/255)*2-1;
  function n3(x,y,z){
    const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z);
    const xf=x-xi,yf=y-yi,zf=z-zi;
    const u=fade(xf),v=fade(yf),w=fade(zf);
    const c000=val(xi,yi,zi),c100=val(xi+1,yi,zi),c010=val(xi,yi+1,zi),c110=val(xi+1,yi+1,zi);
    const c001=val(xi,yi,zi+1),c101=val(xi+1,yi,zi+1),c011=val(xi,yi+1,zi+1),c111=val(xi+1,yi+1,zi+1);
    return lerp( lerp(lerp(c000,c100,u),lerp(c010,c110,u),v),
                 lerp(lerp(c001,c101,u),lerp(c011,c111,u),v), w);
  }
  return function fbm(x,y,z,oct){
    oct=oct||5; let amp=1,freq=1,sum=0,norm=0;
    for(let i=0;i<oct;i++){ sum+=amp*n3(x*freq,y*freq,z*freq); norm+=amp; amp*=0.5; freq*=2; }
    return sum/norm;
  };
}
export function ring(fbm, ang, v, lon, lat, oct, ph){
  const r = lon/(Math.PI*2);
  return fbm(Math.cos(ang)*r, Math.sin(ang)*r, v*lat + (ph||0), oct);
}

/* ---- color helpers ---- */
export function hex2rgb(h){ if(typeof h==='number'){return [(h>>16)&255,(h>>8)&255,h&255];}
  h=h.replace('#',''); return [parseInt(h.substr(0,2),16),parseInt(h.substr(2,2),16),parseInt(h.substr(4,2),16)]; }
function mix(a,b,t){ return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t]; }
function ramp(stops,t){
  t=Math.max(0,Math.min(0.99999,t)); const f=t*(stops.length-1); const i=Math.floor(f);
  return mix(stops[i], stops[Math.min(i+1,stops.length-1)], f-i);
}
function clamp01(x){return x<0?0:x>1?1:x;}
function smooth(e0,e1,x){ const t=clamp01((x-e0)/(e1-e0)); return t*t*(3-2*t); }

export const TXW=1024, TXH=512;
function newBuf(w,h){ return { width:w, height:h, data:new Uint8ClampedArray(w*h*4) }; }

/* ---- gas giant / brown dwarf bands ---- */
export function texGas(palette, seed, opts){
  opts=opts||{};
  const w=TXW,h=TXH, out=newBuf(w,h), d=out.data;
  const fbm=makeNoise3(seed);
  const stops=palette.map(hex2rgb);
  const turb=opts.turb!=null?opts.turb:0.05;
  const streak=opts.streak!=null?opts.streak:0.16;
  for(let y=0;y<h;y++){
    const v=y/h;
    const pole = 1 - 0.32*Math.pow(Math.abs(v-0.5)*2, 3);
    for(let x=0;x<w;x++){
      const u=x/w, ang=u*Math.PI*2;
      const warp = turb*ring(fbm, ang, v, 5, 7, 4, 0);
      let t = v + warp;
      let col = ramp(stops, t*0.999);
      const sN = ring(fbm, ang, v, 14, 48, 5, 30);
      const b = 1 + streak*sN;
      const o=(y*w+x)*4;
      d[o]  = clamp01(col[0]*b*pole/255)*255;
      d[o+1]= clamp01(col[1]*b*pole/255)*255;
      d[o+2]= clamp01(col[2]*b*pole/255)*255;
      d[o+3]=255;
    }
  }
  return out;
}

/* ---- rocky / lava / icy mottled (albedo only) ---- */
export function texRocky(p, seed, opts){
  opts=opts||{};
  const w=TXW,h=TXH,out=newBuf(w,h),d=out.data;
  const fbm=makeNoise3(seed);
  const stops=[hex2rgb(p.b), hex2rgb(p.base), hex2rgb(p.a), hex2rgb(p.c)];
  const glow = opts.glow ? hex2rgb(opts.glow) : null;
  for(let y=0;y<h;y++){
    const v=y/h, lat=Math.abs(v-0.5)*2;
    for(let x=0;x<w;x++){
      const u=x/w, ang=u*Math.PI*2;
      const n  = ring(fbm, ang, v, 6, 6, 6, 0);
      const n2 = ring(fbm, ang, v, 18, 18, 5, 40);
      let t = clamp01(n*0.5 + 0.5 + n2*0.10);
      let col = ramp(stops, t);
      const m = 1 + 0.14*n2;
      col = [col[0]*m, col[1]*m, col[2]*m];
      let g=0;
      if(glow){
        g = clamp01( smooth(-0.05,-0.6,n)*0.8 + Math.pow(clamp01(0.4-Math.abs(n2*0.9)),1.4)*1.8 );
        col = mix(col, glow, g*0.92);
      }
      if(opts.ice){
        const ic = smooth(0.66,0.92, lat);
        col = mix(col, [224,234,244], ic*0.8);
      }
      const o=(y*w+x)*4;
      d[o]=clamp01(col[0]/255)*255; d[o+1]=clamp01(col[1]/255)*255; d[o+2]=clamp01(col[2]/255)*255; d[o+3]=255;
    }
  }
  return out;
}

/* ---- terran: ocean + land + clouds + ice caps ---- */
export function texTerran(t, seed){
  const w=TXW,h=TXH,out=newBuf(w,h),d=out.data;
  const fbm=makeNoise3(seed);
  const ocean=hex2rgb(t.ocean), ocean2=hex2rgb(t.ocean2||t.ocean);
  const land=hex2rgb(t.land), land2=hex2rgb(t.land2||t.land);
  const cloudC=hex2rgb(t.cloud||"#ffffff");
  const sea = 0.5 - (t.landAmt!=null?t.landAmt:0.3);
  for(let y=0;y<h;y++){
    const v=y/h, lat=Math.abs(v-0.5)*2;
    for(let x=0;x<w;x++){
      const u=x/w, ang=u*Math.PI*2;
      const e = ring(fbm,ang,v,6,5,6,0)*0.5 + ring(fbm,ang,v,15,13,4,50)*0.18;
      let col;
      if(e > sea){
        const hh = smooth(sea, sea+0.45, e);
        const veg = ring(fbm,ang,v,22,20,3,90)*0.5+0.5;
        col = mix(land, land2, clamp01(hh*0.55 + veg*0.45));
      }else{
        const depth = smooth(sea, sea-0.55, e);
        col = mix(ocean2, ocean, depth);
      }
      if(t.ice){
        const ic = smooth(0.72,0.96,lat) + (e>sea?smooth(0.6,0.92,lat):0);
        col = mix(col,[228,238,248], clamp01(ic)*0.85);
      }
      const cl  = ring(fbm,ang,v,10,8,5,200)*0.5+0.5;
      const cl2 = ring(fbm,ang,v,20,16,4,260)*0.5+0.5;
      let cover = smooth(0.50,0.80, cl*0.62 + cl2*0.38);
      cover *= 1 - 0.55*smooth(0.7,1.0,lat);
      col = mix(col, cloudC, clamp01(cover)*0.7);
      const o=(y*w+x)*4;
      d[o]=clamp01(col[0]/255)*255; d[o+1]=clamp01(col[1]/255)*255; d[o+2]=clamp01(col[2]/255)*255; d[o+3]=255;
    }
  }
  return out;
}

/* ---- star surface: warm granulation ---- */
export function texStar(palette, seed){
  const w=TXW,h=TXH,out=newBuf(w,h),d=out.data;
  const fbm=makeNoise3(seed);
  const stops=palette.map(hex2rgb);
  for(let y=0;y<h;y++){ const v=y/h;
    for(let x=0;x<w;x++){ const u=x/w, ang=u*Math.PI*2;
      const n =ring(fbm,ang,v,16,16,5,0)*0.5+0.5;
      const n2=ring(fbm,ang,v,40,40,4,30)*0.5+0.5;
      let col=ramp(stops, n*0.7+n2*0.3);
      const o=(y*w+x)*4; d[o]=col[0]; d[o+1]=col[1]; d[o+2]=col[2]; d[o+3]=255;
    }}
  return out;
}

/* ---- body -> texture, mirroring buildBodyMesh()'s precedence in app.js ---- */
export const STAR_PALETTE = ["#ffb347","#ffe9b0","#fff8ee","#ffdf9a"];

export function seedFor(key){
  return (String(key||'x')).split('').reduce((a,ch)=>a*31+ch.charCodeAt(0),7)>>>0;
}

/* Returns the procedural RGBA buffer for a body record (from data.js). */
export function textureForBody(data){
  const seed = seedFor(data.key);
  if(data.kind==='star')                                  return texStar(STAR_PALETTE, seed);
  if(data.kind==='gasgiant'||data.kind==='browndwarf')    return texGas(data.palette||["#888","#bbb","#666"], seed, {turb:0.06,streak:0.18});
  if(data.kind==='lava')                                  return texRocky(data.rocky, seed, {glow:'#ffb84a'});
  if(data.terran)                                         return texTerran(data.terran, seed);
  if(data.rocky)                                          return texRocky(data.rocky, seed, {ice:data.terran&&data.terran.ice});
  return texGas(data.palette||["#9ab","#cde","#8aa"], seed, {turb:0.08,streak:0.10}); // iceworld
}
