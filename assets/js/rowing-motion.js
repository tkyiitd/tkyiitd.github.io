(() => {
  'use strict';
  // Corresponding landmarks in each 512-square source pose. The hull, head,
  // shoulders, hands and paddle tips share a common mesh for continuous motion.
  const shifts = [[0,0],[-10,0],[-25,0],[-3,-26],[-15,-26],[-28,-26]];
  const hands = [
    [[196,288],[344,217],[88,362],[445,158]],
    [[188,274],[333,258],[113,302],[448,240]],
    [[168,212],[296,269],[81,191],[438,297]],
    [[202,220],[327,277],[113,160],[449,315]],
    [[184,230],[327,256],[114,220],[443,292]],
    [[156,218],[310,264],[89,175],[437,287]]
  ];
  const poses = shifts.map(([dx,dy], index) => {
    const body = [[269,126],[232,166],[304,166],[269,205],[237,226],[313,232],
      [253,296],[314,303],[196,345],[347,327],[224,449],[316,390]];
    return [[0,0],[256,0],[512,0],[512,256],[512,512],[256,512],[0,512],[0,256],
      ...body.map(([x,y]) => [x+dx,y+dy]), ...hands[index]];
  });
  const mean = poses[0].map((_, index) => [0,1].map(axis =>
    poses.reduce((sum, pose) => sum + pose[index][axis], 0) / poses.length));

  const area = (a,b,c) => (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const inCircle = (point,a,b,c) => {
    const ax=a[0]-point[0], ay=a[1]-point[1];
    const bx=b[0]-point[0], by=b[1]-point[1];
    const cx=c[0]-point[0], cy=c[1]-point[1];
    const det=(ax*ax+ay*ay)*(bx*cy-cx*by)-(bx*bx+by*by)*(ax*cy-cx*ay)+(cx*cx+cy*cy)*(ax*by-bx*ay);
    return det * Math.sign(area(a,b,c)) > 0.001;
  };
  const triangulate = (points) => {
    const count=points.length;
    const all=[...points,[-2048,-1024],[256,3072],[2560,-1024]];
    let triangles=[[count,count+1,count+2]];
    for(let index=0;index<count;index++) {
      const edges=new Map();
      triangles=triangles.filter(triangle => {
        if(!inCircle(all[index],...triangle.map(i=>all[i]))) return true;
        for(let k=0;k<3;k++) {
          const a=triangle[k],b=triangle[(k+1)%3],key=[Math.min(a,b),Math.max(a,b)].join(':');
          if(edges.has(key)) edges.delete(key); else edges.set(key,[a,b]);
        }
        return false;
      });
      for(const edge of edges.values()) triangles.push([...edge,index]);
    }
    return triangles.filter(t=>t.every(i=>i<count));
  };
  // Connect the outer paddle blade to the lower border so its full sweep cannot
  // invert the narrow triangle beside the hull in the left-immersion pose.
  const triangles=triangulate(mean).filter(t=>!(t.includes(7)&&t.includes(16)));
  triangles.push([7,6,22],[6,16,22]);
  const interpolate=(a,b,c,d,t)=>0.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);

  const warpTriangle = (ctx,image,source,target,triangle) => {
    const [a,b,c]=triangle.map(index=>source[index]);
    const [u,v,w]=triangle.map(index=>target[index]);
    const den=area(a,b,c);
    if(Math.abs(den)<0.01) return;
    const bx=b[0]-a[0], by=b[1]-a[1], cx=c[0]-a[0], cy=c[1]-a[1];
    const vx=v[0]-u[0], vy=v[1]-u[1], wx=w[0]-u[0], wy=w[1]-u[1];
    const m0=(vx*cy-wx*by)/den, m2=(wx*bx-vx*cx)/den;
    const m1=(vy*cy-wy*by)/den, m3=(wy*bx-vy*cx)/den;
    ctx.save();
    // Expand clipping slightly to prevent hairline seams at shared edges.
    const center=[(u[0]+v[0]+w[0])/3,(u[1]+v[1]+w[1])/3];
    const expand=p=>{
      const length=Math.hypot(p[0]-center[0],p[1]-center[1]) || 1;
      return [p[0]+(p[0]-center[0])*.28/length,p[1]+(p[1]-center[1])*.28/length];
    };
    const clip=[u,v,w].map(expand);
    ctx.beginPath();ctx.moveTo(...clip[0]);ctx.lineTo(...clip[1]);ctx.lineTo(...clip[2]);ctx.closePath();ctx.clip();
    ctx.transform(m0,m1,m2,m3,u[0]-m0*a[0]-m2*a[1],u[1]-m1*a[0]-m3*a[1]);
    ctx.drawImage(image,0,0,512,512);
    ctx.restore();
  };

  window.createRowingMotion = (atlas) => {
    const makeCanvas=()=>{const c=document.createElement('canvas');c.width=512;c.height=512;return c;};
    const frames=poses.map((_,index)=>{
      const c=makeCanvas(),ctx=c.getContext('2d');
      if(!ctx) return null;
      ctx.drawImage(atlas,index%3*atlas.naturalWidth/3,Math.floor(index/3)*atlas.naturalHeight/2,
        atlas.naturalWidth/3,atlas.naturalHeight/2,0,0,512,512);
      return c;
    });
    const layers=[makeCanvas(),makeCanvas()];
    const contexts=layers.map(c=>c.getContext('2d'));
    if(frames.some(f=>!f)||contexts.some(c=>!c)) return null;
    const sourceAngle=Math.atan2(poses[0][23][1]-poses[0][22][1],poses[0][23][0]-poses[0][22][0]);
    const blades=[22,23].map(index=>{
      const c=makeCanvas(),p=c.getContext('2d'),point=poses[0][index];
      p.beginPath();p.ellipse(point[0],point[1],60,24,sourceAngle,0,Math.PI*2);p.clip();
      p.drawImage(frames[0],0,0);
      return c;
    });
    const body=makeCanvas(),bodyContext=body.getContext('2d');
    bodyContext.drawImage(frames[0],0,0);
    bodyContext.globalCompositeOperation='destination-out';
    bodyContext.lineWidth=15;bodyContext.lineCap='round';
    for(const [tip,hand] of [[22,20],[23,21]]) {
      bodyContext.beginPath();bodyContext.moveTo(...poses[0][tip]);bodyContext.lineTo(...poses[0][hand]);bodyContext.stroke();
      bodyContext.beginPath();bodyContext.ellipse(...poses[0][tip],72,36,sourceAngle,0,Math.PI*2);bodyContext.fill();
    }
    bodyContext.globalCompositeOperation='source-over';
    for(const hand of [20,21]) {
      bodyContext.save();bodyContext.beginPath();bodyContext.arc(...poses[0][hand],14,0,Math.PI*2);bodyContext.clip();
      bodyContext.drawImage(frames[0],0,0);bodyContext.restore();
    }
    return {
      paint(ctx,time) {
        const phase=(time/4.8*6)%6;
        const first=Math.floor(phase),second=(first+1)%6;
        const local=phase-first;
        const target=poses[first].map((p,index)=>p.map((value,axis)=>interpolate(
          poses[(first+5)%6][index][axis],value,poses[second][index][axis],
          poses[(first+2)%6][index][axis],local)));
        // Keep the hull's anchor fixed even where the generated source poses differ.
        const hull=target[18];
        const dx=mean[18][0]-hull[0],dy=mean[18][1]-hull[1];
        const aligned=target.map(p=>[p[0]+dx,p[1]+dy]);
        const c=contexts[0];
        c.clearRect(0,0,512,512);
        for(const triangle of triangles) warpTriangle(c,body,poses[0],aligned,triangle);
        ctx.clearRect(0,0,512,512);
        ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
        // The paddle is a rigid object, independent of the flexible character mesh.
        const left=aligned[22],right=aligned[23];
        const angle=Math.atan2(right[1]-left[1],right[0]-left[0]);
        ctx.lineWidth=5.5;ctx.lineCap='round';ctx.strokeStyle='#283a42';
        ctx.beginPath();ctx.moveTo(...left);ctx.lineTo(...right);ctx.stroke();
        for(let i=0;i<2;i++) {
          const tip=aligned[22+i],source=poses[0][22+i];
          ctx.save();ctx.translate(...tip);ctx.rotate(angle-sourceAngle);
          ctx.translate(-source[0],-source[1]);ctx.drawImage(blades[i],0,0);ctx.restore();
        }
        ctx.drawImage(layers[0],0,0);
      }
    };
  };
})();
