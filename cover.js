/* A separate launch sequence. The report itself is never mounted or modified here. */
(()=>{'use strict';
  const root=document.documentElement,canvas=document.getElementById('intro-canvas');
  const enter=document.getElementById('enter-report'),status=document.getElementById('intro-status');
  const fullscreen=document.getElementById('cover-fullscreen');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const smooth=(x)=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
  const timeline=t=>({reveal:smooth((t-.8)/2.5),scan:smooth((t-2.1)/4.8),ready:t>=7.8});
  let renderer,scene,camera,robot,mixer,frame=0,elapsed=0,last=0,disposed=false,ready=false,compact=false;
  let fallbackTimer,lightKey,lightFill,lightRim,environmentTarget,worldX=0;
  const scan={height:{value:3.05},visibility:{value:0},active:{value:0}};
  function showEntry(message=''){
    if(disposed)return;clearTimeout(fallbackTimer);ready=true;root.dataset.intro=message?'fallback':'ready';
    enter.hidden=false;
    if(message){status.textContent=message;status.hidden=false;}
  }
  function attachScan(material){
    const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
    material.onBeforeCompile=shader=>{
      previous.call(material,shader);
      shader.uniforms.introScanY=scan.height;shader.uniforms.introVisibility=scan.visibility;shader.uniforms.introScanActive=scan.active;
      shader.vertexShader='varying vec3 vIntroWorld;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvIntroWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
      shader.fragmentShader='varying vec3 vIntroWorld;\nuniform float introScanY;\nuniform float introVisibility;\nuniform float introScanActive;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
        float scanned=smoothstep(introScanY-0.055,introScanY+0.055,vIntroWorld.y);
        float line=exp(-pow((vIntroWorld.y-introScanY)/0.025,2.0))*introScanActive;
        float halo=exp(-pow((vIntroWorld.y-introScanY)/0.105,2.0))*introScanActive;
        float rim=pow(1.0-abs(dot(normalize(normal),normalize(vViewPosition))),2.2);
        outgoingLight*=introVisibility*(0.10+0.90*scanned);
        outgoingLight+=vec3(0.48,0.77,1.0)*(line*(0.7+rim*3.3)+halo*rim*0.8)*introVisibility;
        outgoingLight+=vec3(0.09,0.23,0.39)*rim*introVisibility*(0.18+0.22*scanned);
        #include <opaque_fragment>
      `);
    };
    material.customProgramCacheKey=()=>key+'|premiere-scan-v1';material.needsUpdate=true;
  }
  function resize(){
    if(!renderer||disposed)return;
    const w=innerWidth,h=innerHeight;compact=w<=760&&h>w;
    renderer.setSize(w,h,false);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));
    camera.aspect=w/h;camera.fov=compact?33:28;
    camera.position.set(0,compact?1.9:1.36,compact?8.8:6.7);camera.lookAt(0,compact?1.9:1.36,0);camera.updateProjectionMatrix();
    const halfWidth=Math.tan(camera.fov*Math.PI/360)*camera.position.z*camera.aspect;
    worldX=halfWidth*(compact?.36:.50);
    if(robot){robot.position.x=worldX;robot.scale.setScalar(compact?.69:1);robot.position.y=compact?-.31:0;}
  }
  function tick(now){
    if(disposed)return;
    const dt=last?Math.min((now-last)/1000,.08):0;last=now;
    if(!document.hidden){
      elapsed+=dt;
      const t=reduced?{reveal:1,scan:1,ready:true}:timeline(elapsed);
      scan.visibility.value=t.reveal;
      const heightScale=compact?.69:1,offset=compact?-.31:0;
      scan.height.value=(3.05-3.3*t.scan)*heightScale+offset;
      scan.active.value=t.scan>0&&t.scan<1?Math.sin(Math.PI*Math.min(1,t.scan*8)):0;
      // Keep the moving band bright through the sweep, then feather out at the feet.
      if(t.scan>.125&&t.scan<.95)scan.active.value=1;
      if(t.scan>=.95)scan.active.value=(1-t.scan)/.05;
      robot.position.x=worldX+.16*(1-t.reveal);robot.rotation.y=-.10-.12*(1-t.reveal);
      lightKey.intensity=.6+3.8*t.scan;lightFill.intensity=.25+.85*t.scan;lightRim.intensity=2.0+2.2*t.reveal;
      if(!reduced)mixer.update(dt*.28);
      if(t.ready&&!ready)showEntry();
      renderer.render(scene,camera);
    }
    frame=requestAnimationFrame(tick);
  }
  async function initialize(){
    fallbackTimer=setTimeout(()=>showEntry('机器人载入较慢，你可以先进入汇报。'),25000);
    try{
      if(typeof THREE==='undefined')throw new Error('3D engine unavailable');
      renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
      renderer.setClearColor(0x000000,1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
      scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(28,1,.05,40);
      scene.add(new THREE.HemisphereLight(0xd5e6f5,0x10151b,.65));
      lightKey=new THREE.DirectionalLight(0xf2f7ff,4.4);lightKey.position.set(-3,4,5);scene.add(lightKey);
      lightFill=new THREE.DirectionalLight(0x87b7e6,1.1);lightFill.position.set(4,2,3);scene.add(lightFill);
      lightRim=new THREE.DirectionalLight(0xa3d8ff,4.2);lightRim.position.set(2.5,3,-3);scene.add(lightRim);
      // Broad studio reflections reveal the real metal, while the stage stays black.
      const studio=new THREE.Scene();studio.background=new THREE.Color(0x080b12);
      for(const [position,size,color] of [[[-3,3,4],[2.5,5],0xc5dcf0],[[4,3,1],[1,5],0x91c1ef],[[1,5,-3],[4,2],0xcbdce9]]){
        const panel=new THREE.Mesh(new THREE.PlaneGeometry(...size),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide}));
        panel.position.set(...position);panel.lookAt(0,1.3,0);studio.add(panel);
      }
      const pmrem=new THREE.PMREMGenerator(renderer);environmentTarget=pmrem.fromScene(studio,.04);scene.environment=environmentTarget.texture;pmrem.dispose();
      studio.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});
      robot=new THREE.Group();const normalized=new THREE.Group();robot.add(normalized);scene.add(robot);
      const gltf=await new THREE.GLTFLoader().loadAsync('./assets/chappie_runtime.glb');
      if(disposed)return;
      normalized.add(gltf.scene);mixer=new THREE.AnimationMixer(gltf.scene);
      const idle=gltf.animations.find(c=>c.name==='Idle');if(idle)mixer.clipAction(idle).play();mixer.update(.01);
      robot.updateMatrixWorld(true);
      const b=new THREE.Box3().setFromObject(gltf.scene),scale=2.73/(b.max.y-b.min.y);
      normalized.scale.setScalar(scale);normalized.position.set(-(b.min.x+b.max.x)*.5*scale,-b.min.y*scale,-(b.min.z+b.max.z)*.5*scale);
      robot.updateMatrixWorld(true);
      gltf.scene.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.material=o.material.clone();o.material.envMapIntensity=.9;}});
      // Reuse the exact emblem and local paint repairs from the existing report.
      await applySchoolPaint(THREE,gltf.scene,robot);
      if(disposed)return;
      gltf.scene.traverse(o=>{if(o.isMesh)attachScan(o.material);});
      resize();await renderer.compileAsync(scene,camera);
      if(disposed)return;
      clearTimeout(fallbackTimer);
      if(!ready)root.dataset.intro='revealing';
      frame=requestAnimationFrame(tick);
    }catch(error){
      console.warn('Opening sequence unavailable:',error);
      showEntry('当前浏览器未能显示开场动画，仍可进入汇报。');
    }
  }
  function dispose(){
    if(disposed)return;disposed=true;cancelAnimationFrame(frame);clearTimeout(fallbackTimer);
    mixer?.stopAllAction();environmentTarget?.dispose();renderer?.dispose();
  }
  enter.addEventListener('click',event=>{
    if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button>0)return;
    event.preventDefault();root.dataset.intro='leaving';
    setTimeout(()=>{dispose();location.assign(enter.href);},reduced?0:380);
  });
  fullscreen?.addEventListener('click',async()=>{
    try{
      if(document.fullscreenElement)await document.exitFullscreen();
      else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();
    }catch{status.textContent='当前浏览器不支持全屏，请使用浏览器菜单全屏。';status.hidden=false;}
  });
  document.addEventListener('fullscreenchange',()=>{if(fullscreen)fullscreen.textContent=document.fullscreenElement?'×':'⛶';});
  addEventListener('resize',resize);
  addEventListener('pagehide',dispose);
  addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(frame);showEntry('开场画面已暂停，可直接进入汇报。');});
  initialize();
})();
