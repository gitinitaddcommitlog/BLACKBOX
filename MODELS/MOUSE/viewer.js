// viewer.js
(function(){
  const cfg = window.APP_CONFIG || {};
  const modelBase64 = String(cfg.MODEL_BASE64 || '');
  const canvas = document.getElementById('canvas');
  const loading = document.getElementById('loading');

  // Renderer / scene / camera / controls
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.physicallyCorrectLights = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x071018);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);
  // Start with default camera position - NOT auto-centered
  camera.position.set(5, 5, 5);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;

  // Lighting setup
  const ambient = new THREE.AmbientLight(0xffffff, 0.45); scene.add(ambient);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 0.18); scene.add(hemi);

  const fillLights = [];
  const fillPositions = [
    new THREE.Vector3(1, 1, 1),
    new THREE.Vector3(-1, 1, 1),
    new THREE.Vector3(1, 1, -1),
    new THREE.Vector3(-1, 1, -1)
  ];
  fillPositions.forEach(pos=>{
    const l = new THREE.DirectionalLight(0xffffff, 0.2);
    l.position.copy(pos.normalize().multiplyScalar(10));
    l.castShadow = false;
    scene.add(l);
    fillLights.push(l);
  });

  const bottomFill = new THREE.DirectionalLight(0xffffff, 0.35);
  bottomFill.position.set(0, -1, 0).normalize().multiplyScalar(10);
  bottomFill.castShadow = false;
  scene.add(bottomFill);
  
  const bottomFill2 = new THREE.DirectionalLight(0xffffff, 0.18);
  bottomFill2.position.set(0.6, -0.8, 0.4).normalize().multiplyScalar(10);
  bottomFill2.castShadow = false;
  scene.add(bottomFill2);

  // UI elements - SET DEFAULTS TO LOWEST
  const brightnessEl = document.getElementById('brightness');
  const resetLightsBtn = document.getElementById('reset-lights');
  const presetStudio = document.getElementById('preset-studio');
  const presetProduct = document.getElementById('preset-product');
  const presetDramatic = document.getElementById('preset-dramatic');
  const recenterBtn = document.getElementById('recenter');
  const fullscreenBtn = document.getElementById('fullscreen');
  const screenshotBtn = document.getElementById('screenshot');
  const downloadBtn = document.getElementById('download-glb');
  const brightnessLabel = document.getElementById('brightness-label');
  const saturationEl = document.getElementById('saturation');
  const saturationLabel = document.getElementById('saturation-label');

  // Set initial values to LOWEST
  if(brightnessEl) brightnessEl.value = 1;    // Lowest brightness
  if(saturationEl) saturationEl.value = 0.5;  // Lowest saturation

  let currentModel = null;

  // Saturation control
  function updateSaturation(){
    const sat = saturationEl ? parseFloat(saturationEl.value) : 0.5;
    try{ if(canvas) canvas.style.filter = `saturate(${sat})`; }catch(e){}
    if(saturationLabel) saturationLabel.textContent = Math.round(sat * 100) + '%';
  }
  if(saturationEl) saturationEl.addEventListener('input', updateSaturation);

  function safeValue(el, defaultV){ return el ? parseFloat(el.value) : defaultV; }

  // Lighting update
  function updateLighting(){
    const slider = Math.max(1, safeValue(brightnessEl, 1));
    if(brightnessLabel) brightnessLabel.textContent = `${Math.round(slider)}%`;

    const t = (slider - 1) / 99;
    const POWER = 3.2;
    const MAX_EXPOSURE = 5000;
    const exposure = 1 + (MAX_EXPOSURE - 1) * Math.pow(t, POWER);
    renderer.toneMappingExposure = Math.min(MAX_EXPOSURE, Math.max(0.0001, exposure));

    ambient.intensity = Math.min(300, Math.max(0.05, renderer.toneMappingExposure * 0.02));
    hemi.intensity = Math.min(150, Math.max(0.03, renderer.toneMappingExposure * 0.006));
    const fillBase = Math.min(150, Math.max(0.06, renderer.toneMappingExposure * 0.003));
    fillLights.forEach(l => l.intensity = fillBase);
    const bottomBase = Math.min(300, Math.max(0.12, renderer.toneMappingExposure * 0.006));
    bottomFill.intensity = bottomBase;
    bottomFill2.intensity = Math.min(150, Math.max(0.08, renderer.toneMappingExposure * 0.003));
  }
  
  if(brightnessEl) brightnessEl.addEventListener('input', updateLighting);
  
  // PRESETS 
  if(presetStudio) presetStudio.addEventListener('click', ()=>{
    if(brightnessEl) brightnessEl.value = 30;
    if(saturationEl) saturationEl.value = 0.8;
    updateLighting(); updateSaturation();
  });
  
  if(presetProduct) presetProduct.addEventListener('click', ()=>{
    if(brightnessEl) brightnessEl.value = 80;
    if(saturationEl) saturationEl.value = 1.2;
    updateLighting(); updateSaturation();
  });
  
  if(presetDramatic) presetDramatic.addEventListener('click', ()=>{
    if(brightnessEl) brightnessEl.value = 15;
    if(saturationEl) saturationEl.value = 1.5;
    updateLighting(); updateSaturation();
  });

  // Reset lights - back to LOWEST values
  if(resetLightsBtn) resetLightsBtn.addEventListener('click', ()=> {
    if(brightnessEl) brightnessEl.value = 1;    // Back to lowest
    if(saturationEl) saturationEl.value = 0.5;  // Back to lowest
    updateLighting(); updateSaturation();
  });

  // Recenter model - now actually centers the model
  if(recenterBtn) recenterBtn.addEventListener('click', ()=> {
    if(currentModel) {
      const box = new THREE.Box3().setFromObject(currentModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      // Center the model at origin
      currentModel.position.set(-center.x, -center.y, -center.z);
      
      // Reset camera to reasonable distance based on model size
      const maxDim = Math.max(size.x, size.y, size.z);
      const distance = maxDim > 0 ? maxDim * 2 : 10;
      camera.position.set(distance, distance * 0.7, distance);
      camera.lookAt(0, 0, 0);
      controls.update();
    }
  });

  // Fullscreen
  if(fullscreenBtn) fullscreenBtn.addEventListener('click', ()=> {
    if (!document.fullscreenElement) {
      canvas.requestFullscreen().catch(err => {
        console.log(`Fullscreen error: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  });

  // Screenshot
  if(screenshotBtn) screenshotBtn.addEventListener('click', ()=> {
    renderer.render(scene, camera);
    canvas.toBlob(function(blob) {
      const link = document.createElement('a');
      link.download = 'screenshot.png';
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    });
  });

  // Download GLB
  if(downloadBtn) downloadBtn.addEventListener('click', ()=> {
    alert('GLB download would be implemented here with proper export logic');
  });

  // Model loading - NO AUTO-CENTERING OR AUTO-ZOOMING
  function loadModelFromBase64(b64){
    if(!b64){ if(loading) loading.textContent = 'No model provided'; return; }
    try{
      const bin = atob(b64);
      const len = bin.length;
      const bytes = new Uint8Array(len);
      for(let i=0;i<len;i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], {type:'model/gltf-binary'});
      const url = URL.createObjectURL(blob);
      const loader = new THREE.GLTFLoader();
      loader.load(url, gltf=>{
        const model = gltf.scene || gltf.scenes && gltf.scenes[0];
        if(!model){ if(loading) loading.textContent='No scene'; return; }

        model.traverse(child=>{
          if(!child.isMesh) return;
          child.castShadow = true; child.receiveShadow = true;
          
          if(child.material){
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(m=>{
              try{
                if(m.map) m.map.encoding = THREE.sRGBEncoding;
                if(m.emissiveMap) m.emissiveMap.encoding = THREE.sRGBEncoding;
                if(m.lightMap) m.lightMap.encoding = THREE.sRGBEncoding;
              }catch(e){}
              if(m.flatShading) m.flatShading = false;
              m.needsUpdate = true;
            });
          }
        });

        // JUST ADD THE MODEL TO SCENE - NO AUTO-CENTERING OR ZOOMING
        scene.add(model);
        currentModel = model;

        if(loading) loading.style.display = 'none';
        updateLighting();
        updateSaturation();

        URL.revokeObjectURL(url);
      }, undefined, err=>{
        console.error('GLTF load error', err);
        if(loading) loading.textContent = 'Load error';
      });
    }catch(e){
      console.error('decode failed', e);
      if(loading) loading.textContent = 'Invalid model';
    }
  }

  loadModelFromBase64(modelBase64);

  // Resize and animation
  window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function animate(){ 
    requestAnimationFrame(animate); 
    controls.update(); 
    renderer.render(scene, camera); 
  }
  animate();

  // Initial UI sync with LOWEST values
  updateLighting();
  updateSaturation();
})();
