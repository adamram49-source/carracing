// --- Scene setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// --- Camera ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5,10,7.5);
scene.add(dirLight);

// --- Track Path ---
const trackPoints = [
    new THREE.Vector3(0,0,0),
    new THREE.Vector3(5,0,-20),
    new THREE.Vector3(-5,0,-40),
    new THREE.Vector3(10,0,-60),
    new THREE.Vector3(0,0,-80),
    new THREE.Vector3(0,0,-100)
];

const trackCurve = new THREE.CatmullRomCurve3(trackPoints);
const trackGeometry = new THREE.TubeGeometry(trackCurve, 200, 5, 20, false);
const trackMaterial = new THREE.MeshStandardMaterial({color:0x333333});
const track = new THREE.Mesh(trackGeometry, trackMaterial);
scene.add(track);

// --- Obstacles ---
const obstacles = [];
for(let i=0; i<20; i++){
    const obsGeo = new THREE.BoxGeometry(1,1,1);
    const obsMat = new THREE.MeshStandardMaterial({color:0x00ff00});
    const obs = new THREE.Mesh(obsGeo, obsMat);
    const t = Math.random();
    const point = trackCurve.getPointAt(t);
    obs.position.set(point.x + (Math.random()-0.5)*4, 0.5, point.z);
    scene.add(obs);
    obstacles.push(obs);
}

// --- Car Player ---
const carGeometry = new THREE.BoxGeometry(1,0.5,2);
const carMaterial = new THREE.MeshStandardMaterial({color:0xff0000});
const car = new THREE.Mesh(carGeometry, carMaterial);
car.position.set(0,0.25,0);
scene.add(car);

// --- AI Cars ---
const aiCars = [];
for(let i=0;i<3;i++){
    const aiCar = new THREE.Mesh(carGeometry.clone(), new THREE.MeshStandardMaterial({color:Math.random()*0xffffff}));
    aiCar.position.set(0,0.25, -i*5-10);
    aiCars.push({mesh: aiCar, progress: i*0.02});
    scene.add(aiCar);
}

// --- Controls ---
const keys = {};
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

let speed = 0;
const maxSpeed = 0.4;
const accel = 0.02;
const turnSpeed = 0.03;

// --- Move player car ---
function moveCar(){
    if(keys['w']) speed += accel;
    else if(keys['s']) speed -= accel;
    else speed *= 0.95;
    if(speed>maxSpeed) speed=maxSpeed;
    if(speed<-maxSpeed) speed=-maxSpeed;

    if(keys['a']) car.rotation.y += turnSpeed*(speed/maxSpeed);
    if(keys['d']) car.rotation.y -= turnSpeed*(speed/maxSpeed);

    car.position.x -= Math.sin(car.rotation.y)*speed;
    car.position.z -= Math.cos(car.rotation.y)*speed;
}

// --- Move AI Cars ---
function moveAICars(){
    aiCars.forEach(ai=>{
        ai.progress += 0.001 + Math.random()*0.002;
        if(ai.progress>1) ai.progress=0;
        const point = trackCurve.getPointAt(ai.progress);
        ai.mesh.position.set(point.x,0.25,point.z);
        const tangent = trackCurve.getTangentAt(ai.progress);
        ai.mesh.rotation.y = Math.atan2(-tangent.x,-tangent.z);
    });
}

// --- Camera follow ---
function updateCamera(){
    const relativeOffset = new THREE.Vector3(0,5,10);
    const offset = relativeOffset.applyMatrix4(car.matrixWorld);
    camera.position.lerp(offset,0.1);
    camera.lookAt(car.position);
}

// --- Animate ---
function animate(){
    requestAnimationFrame(animate);
    moveCar();
    moveAICars();
    updateCamera();
    renderer.render(scene,camera);
}
animate();

// --- Resize ---
window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
