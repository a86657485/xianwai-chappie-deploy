/* School livery on the existing skinned chest surface.
 * The uploaded emblem is used directly. Original GLB, UVs, normal/roughness maps,
 * skeleton and animation clips are left untouched; only the material is layered.
 */
async function applySchoolPaint(THREE,model,robot){
  const encoded=document.getElementById('school-emblem').textContent.trim();
  const emblem=new Image();
  await new Promise((resolve,reject)=>{emblem.onload=resolve;emblem.onerror=()=>reject(new Error('School emblem could not load'));emblem.src='data:image/png;base64,'+encoded;});
  const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=720;
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,1600,720);
  // Source emblem has generous transparent margins. Keep its circular mark true.
  ctx.drawImage(emblem,76,25,420,420,55,70,580,580);
  ctx.fillStyle='#274953';ctx.textAlign='left';ctx.textBaseline='middle';
  ctx.font='600 91px Arial,sans-serif';ctx.fillText('XIAN YI',720,180);
  ctx.font='500 41px Arial,sans-serif';ctx.fillText('FOREIGN LANGUAGE',720,268);ctx.fillText('SCHOOL',720,326);
  ctx.font='600 97px "Microsoft YaHei","PingFang SC",sans-serif';ctx.fillText('AI赋能',720,470);ctx.fillText('做中学',1120,470);
  ctx.font='500 39px Arial,sans-serif';ctx.fillText('LEARNING BY DOING',720,585);
  const paint=new THREE.CanvasTexture(canvas);paint.colorSpace=THREE.NoColorSpace;
  paint.anisotropy=4;
  robot.updateMatrixWorld(true);
  model.traverse(mesh=>{
    if(!mesh.isMesh||mesh.material.name!=='Body')return;
    const positions=new Float32Array(mesh.geometry.attributes.position.count*3),v=new THREE.Vector3();
    for(let i=0;i<mesh.geometry.attributes.position.count;i++){
      mesh.getVertexPosition(i,v).applyMatrix4(mesh.matrixWorld);robot.worldToLocal(v);v.toArray(positions,i*3);
    }
    mesh.geometry.setAttribute('schoolPosition',new THREE.BufferAttribute(positions,3));
    const material=mesh.material;
    material.onBeforeCompile=shader=>{
      shader.uniforms.schoolPaint={value:paint};
      shader.uniforms.schoolBase={value:new THREE.Color(0x30415a)};
      shader.uniforms.schoolInk={value:new THREE.Color(0xbbc2b8)};
      shader.vertexShader='attribute vec3 schoolPosition;\nvarying vec3 vSchoolPosition;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSchoolPosition=schoolPosition;');
      shader.fragmentShader='uniform sampler2D schoolPaint;\nuniform vec3 schoolBase;\nuniform vec3 schoolInk;\nvarying vec3 vSchoolPosition;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        vec2 schoolUV=(vSchoolPosition.xy-vec2(0.008,2.054))/vec2(0.412,0.184)+0.5;
        vec2 schoolEdge=smoothstep(vec2(0.0),vec2(0.055),schoolUV)*smoothstep(vec2(0.0),vec2(0.055),1.0-schoolUV);
        float schoolPanel=schoolEdge.x*schoolEdge.y*smoothstep(0.135,0.165,vSchoolPosition.z);
        vec4 schoolSample=texture2D(schoolPaint,clamp(schoolUV,0.0,1.0));
        float schoolMask=schoolSample.a*(1.0-smoothstep(0.58,0.9,max(schoolSample.r,max(schoolSample.g,schoolSample.b))));
        float schoolNoise=fract(sin(dot(floor(vSchoolPosition.xy*2900.0),vec2(12.9898,78.233)))*43758.5453);
        float schoolWear=(0.73+0.27*schoolNoise)*smoothstep(0.045,0.09,schoolNoise);
        float schoolGrain=clamp(dot(diffuseColor.rgb,vec3(0.299,0.587,0.114))*2.0+0.7,0.72,1.12);
        // Recoat only the chest's original graffiti area. Retain surface grain and PBR relief.
        diffuseColor.rgb=mix(diffuseColor.rgb,schoolBase*schoolGrain,schoolPanel*0.97);
        float schoolCoverage=schoolMask*schoolPanel*schoolWear*0.91;
        diffuseColor.rgb=mix(diffuseColor.rgb,schoolInk,schoolCoverage);
      `);
      shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,max(roughnessFactor,0.78),schoolCoverage);');
      shader.fragmentShader=shader.fragmentShader.replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=mix(metalnessFactor,0.18,schoolCoverage);');
    };
    material.customProgramCacheKey=()=> 'xianwai-school-spray-v1';
    material.needsUpdate=true;
  });
  applyMarkedPaintRepairs(THREE,model);
}

// Only the old markings identified in the two red-annotated reference views.
// Coordinates are pixels in the original 1024px UV atlases (GLTF: no Y flip).
// Each patch borrows plain paint from the SAME material. `inkOnly` protects
// dark seams, bolts and worn edges inside the larger rear-panel regions.
const ROBOT_PAINT_REPAIRS={
  Body:[
    {id:'rear-circular-lettering',rect:[1,1,145,169],source:[25,320,53,351],inkOnly:false},
    {id:'rear-upper-lettering',rect:[68,224,144,302],source:[25,320,53,351],inkOnly:false},
    {id:'rear-central-lines',rect:[638,61,691,116],source:[25,320,53,351],inkOnly:false},
    {id:'rear-central-character',rect:[581,713,644,748],source:[25,320,53,351],inkOnly:false},
    {id:'rear-lettering-seam-left',rect:[731,560,742,576],source:[25,320,53,351],inkOnly:true},
    {id:'rear-lettering-seam-right',rect:[731,466,745,485],source:[25,320,53,351],inkOnly:true},
    {id:'rear-shoulder-22',rect:[118,703,161,738],source:[92,699,112,727],inkOnly:false},
    {id:'rear-lower-word',rect:[540,237,561,317],source:[536,327,553,354],inkOnly:false},
    {id:'front-shoulder-symbol',rect:[709,758,750,800],source:[682,762,704,791],inkOnly:false}
  ],
  Hands:[
    {id:'blue-upper-arm-symbol',rect:[803,545,841,582],source:[804,586,831,612],inkOnly:false},
    {id:'blue-forearm-front-drawing',rect:[42,22,132,81],source:[47,82,96,110],inkOnly:true},
    {id:'blue-forearm-front-wrap',rect:[147,434,193,481],source:[141,393,173,425],inkOnly:true},
    {id:'blue-forearm-rear-word',rect:[2,116,133,163],source:[47,82,96,110],inkOnly:true},
    {id:'blue-forearm-rear-wrap-a',rect:[636,0,665,64],source:[610,98,634,126],inkOnly:true},
    {id:'blue-forearm-rear-wrap-b',rect:[40,437,86,477],source:[47,82,96,110],inkOnly:true},
    {id:'blue-forearm-rear-wrap-c',rect:[656,578,683,646],source:[47,82,96,110],inkOnly:true},
    {id:'blue-forearm-rear-wrap-d',rect:[918,474,931,540],source:[47,82,96,110],inkOnly:true},
    {id:'orange-forearm-test-roundel',rect:[224,39,253,68],source:[220,74,247,92],inkOnly:false},
    {id:'orange-rear-cuff-roundel',rect:[601,524,634,559],source:[602,568,628,590],inkOnly:false},
    {id:'orange-upper-arm-graffiti',rect:[99,523,180,599],source:[18,550,86,583],inkOnly:false},
    {id:'orange-upper-arm-graffiti-edge',rect:[177,877,238,894],source:[220,74,247,92],inkOnly:true}
  ]
};

function applyMarkedPaintRepairs(THREE,model){
  const seen=new Set();
  const vec=(v)=>'vec'+v.length+'('+v.map(n=>(n/1024).toFixed(8)).join(',')+')';
  model.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const material=mesh.material,patches=ROBOT_PAINT_REPAIRS[material.name];
    if(!patches||seen.has(material))return;
    seen.add(material);
    const previousCompile=material.onBeforeCompile,previousKey=material.customProgramCacheKey();
    material.userData.markedPaintRepairs=patches;
    material.onBeforeCompile=shader=>{
      previousCompile.call(material,shader);
      const patchCode=patches.map(p=>{
        const r=p.rect,s=p.source;
        return `// ${p.id}
          if(all(greaterThan(vMapUv,${vec(r.slice(0,2))}))&&all(lessThan(vMapUv,${vec(r.slice(2))}))){
            vec2 patchLocal=(vMapUv-${vec(r.slice(0,2))})/${vec([r[2]-r[0],r[3]-r[1]])};
            vec2 patchEdge=smoothstep(vec2(0.0),${vec([1.5/(r[2]-r[0])*1024,1.5/(r[3]-r[1])*1024])},patchLocal)*smoothstep(vec2(0.0),${vec([1.5/(r[2]-r[0])*1024,1.5/(r[3]-r[1])*1024])},1.0-patchLocal);
            vec2 patchSource=mix(${vec(s.slice(0,2))},${vec(s.slice(2))},patchLocal);
            vec3 patchPaint=texture2D(map,patchSource).rgb*diffuse;
            float patchCoverage=patchEdge.x*patchEdge.y;
            ${p.inkOnly?`float paintLuma=dot(patchPaint,vec3(0.299,0.587,0.114));
            float oldInk=dot(diffuseColor.rgb,vec3(0.299,0.587,0.114));
            // Extend over the thin dark outlines of faded ink, without filling bolts.
            for(int px=-1;px<=1;px++)for(int py=-1;py<=1;py++){
              vec2 probe=clamp(vMapUv+vec2(float(px),float(py))*0.00244140625,${vec(r.slice(0,2))},${vec(r.slice(2))});
              oldInk=max(oldInk,dot(texture2D(map,probe).rgb*diffuse,vec3(0.299,0.587,0.114)));
            }
            patchCoverage*=smoothstep(paintLuma+0.001,paintLuma+0.012,oldInk);`:''}
            diffuseColor.rgb=mix(diffuseColor.rgb,patchPaint,patchCoverage);
            recoatCoverage=patchCoverage;
            recoatSource=patchSource;
          }`;
      }).join('\n');
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        float recoatCoverage=0.0;
        vec2 recoatSource=vec2(0.0);
        #ifdef USE_MAP
          ${patchCode}
        #endif
      `);
      // Borrow the surrounding paint's surface response as well as its colour.
      // Original normal / AO maps, all geometry and the school emblem stay intact.
      shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
        #ifdef USE_ROUGHNESSMAP
          if(recoatCoverage>0.0)roughnessFactor=mix(roughnessFactor,roughness*texture2D(roughnessMap,recoatSource).g,recoatCoverage);
        #endif
      `);
      shader.fragmentShader=shader.fragmentShader.replace('#include <metalnessmap_fragment>',`#include <metalnessmap_fragment>
        #ifdef USE_METALNESSMAP
          if(recoatCoverage>0.0)metalnessFactor=mix(metalnessFactor,metalness*texture2D(metalnessMap,recoatSource).b,recoatCoverage);
        #endif
      `);
    };
    material.customProgramCacheKey=()=>previousKey+'|red-mark-recoat-v1';
    material.needsUpdate=true;
  });
}
