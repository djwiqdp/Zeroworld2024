let scene, camera, renderer, canModel;
const canvasContainer = document.getElementById('canvas-container');
const ingrImage = document.getElementById('ingr');
const endOverlay = document.getElementById('end-overlay');
const scrollButton = document.getElementById('scroll-button');
const topButton = document.createElement('img'); // Create the top button

// Scroll to top on page load
window.scrollTo(0, 0);
window.addEventListener('beforeunload', () => window.scrollTo(0, 0));

// Scene and Camera Setup
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 45;

// Renderer Setup   
renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
canvasContainer.appendChild(renderer.domElement);

// Lighting Setup
const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);

const sideDirectionalLight = new THREE.DirectionalLight(0xffffff, 10);
sideDirectionalLight.position.set(10000, 100, 0);
sideDirectionalLight.castShadow = true;
scene.add(sideDirectionalLight);

const distantSideLight = new THREE.DirectionalLight(0xffffff, 10.0);
distantSideLight.position.set(-3000, 100, 1000);
distantSideLight.castShadow = true;
scene.add(distantSideLight);

const frontSpotLight = new THREE.SpotLight(0xffffff, 300, 300, Math.PI / 4, 0.5, 4);
frontSpotLight.position.set(100, 0, 1000);
frontSpotLight.castShadow = true;
scene.add(frontSpotLight);

const sideSpotLight = new THREE.SpotLight(0xffffff, 2, 200, Math.PI / 4, 0.5, 2);
sideSpotLight.position.set(10, 20, 500);
scene.add(sideSpotLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 12);
directionalLight.position.set(10, -50, 50);
scene.add(directionalLight);

// Load Can Model
const loader = new THREE.GLTFLoader();
loader.load('can.glb', function(gltf) {
    canModel = gltf.scene;
    canModel.scale.set(150, 150, 150);
    canModel.position.set(0, -10, 0);
    canModel.rotation.y = THREE.Math.degToRad(120);

    canModel.traverse((child) => {
        if (child.isMesh) {
            child.material.metalness = 0.95;
            child.material.roughness = 0.05;
            child.material.envMapIntensity = 2.5;
        }
    });

    scene.add(canModel);
    animate();
});

// Variables for scroll and rotation control
let isDragging = false;
let previousMouseX = 0;
let initialYRotation = THREE.Math.degToRad(120);
let targetYRotation = THREE.Math.degToRad(300);
let clock = new THREE.Clock();
const targetScrollMiddleBG2 = window.innerHeight * 1.5;
const targetScrollEndBG3 = window.innerHeight * 3;
const targetScrollStartOverlay = targetScrollEndBG3 + window.innerHeight * 0.2;
const floatAmplitudeY = 1.5;
const floatAmplitudeX = 20;
const floatAmplitudeZ = 0.5;
const floatFrequencyY = 1.0;
const floatFrequencyX = 0.75;
const floatFrequencyZ = 0.5;

// Scroll Animation Logic
function handleScroll() {
    const scrollY = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;

    if (!canModel) return;

    if (scrollY < targetScrollMiddleBG2) {
        const progress = Math.min(scrollY / targetScrollMiddleBG2, 1);
        canModel.rotation.y = initialYRotation + Math.PI * progress;
        ingrImage.style.opacity = '0';
        endOverlay.style.opacity = '0';
    } else if (scrollY < targetScrollEndBG3) {
        canModel.rotation.y = targetYRotation;
        ingrImage.style.opacity = '1';
    } else if (scrollY < targetScrollStartOverlay) {
        ingrImage.style.opacity = '0';
        endOverlay.style.opacity = '0';
    } else {
        endOverlay.style.opacity = '1';
    }

    // Show or hide scrollButton based on scroll position
    if (scrollY > 100) {
        scrollButton.style.opacity = '0'; // Hide icon1.png after scrolling down a bit
    } else {
        scrollButton.style.opacity = '1'; // Show icon1.png when at the top
    }

    // Show topButton at the bottom of the page
    if (scrollY + windowHeight >= scrollHeight - 10) {
        topButton.style.opacity = '1';
    } else {
        topButton.style.opacity = '0';
    }
}

// Mouse Interaction for y-axis Rotation
function onMouseMove(event) {
    if (isDragging && canModel) {
        const deltaX = event.clientX - previousMouseX;
        previousMouseX = event.clientX;

        canModel.rotation.y += deltaX * 0.01;
        canModel.rotation.y = Math.max(Math.min(canModel.rotation.y, targetYRotation), initialYRotation);
    }
}

function onMouseDown(event) {
    isDragging = true;
    previousMouseX = event.clientX;
}

function onMouseUp() {
    isDragging = false;
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    if (canModel) {
        const elapsedTime = clock.getElapsedTime();
        const scrollY = window.scrollY;

        if (scrollY < targetScrollMiddleBG2) {
            canModel.position.y = -7 + Math.sin(elapsedTime * floatFrequencyY) * floatAmplitudeY;
            canModel.position.z = Math.sin(elapsedTime * floatFrequencyZ) * floatAmplitudeZ * Math.sign(Math.sin(elapsedTime * 0.1));
            canModel.rotation.x = Math.abs(Math.sin(elapsedTime * 0.3) * 0.5);
        } else {
            canModel.position.y = -10 + Math.sin(elapsedTime * floatFrequencyY) * floatAmplitudeY;
            canModel.position.z = 0;
            canModel.rotation.x = 0;
        }

        canModel.rotation.y += 0.001;
    }

    handleScroll();
    renderer.render(scene, camera);
}

// Initial fade-in for scrollButton
scrollButton.style.opacity = '0';
scrollButton.style.transition = 'opacity 1000ms ease-in-out';
setTimeout(() => {
    scrollButton.style.opacity = '1';
}, 100);

// Create and set up the topButton (icon2.png)
topButton.src = 'icon2.png';
topButton.id = 'scroll-button';
topButton.style.position = 'fixed';
topButton.style.top = '85%';
topButton.style.left = '50%';
topButton.style.transform = 'translateX(-50%)';
topButton.style.width = '50px';
topButton.style.cursor = 'pointer';
topButton.style.zIndex = '5';
topButton.style.opacity = '0';
topButton.style.transition = 'opacity 1000ms ease-in-out';
document.body.appendChild(topButton);

// Scroll to top on topButton click
topButton.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Remove immediate action on scrollButton click
scrollButton.addEventListener('click', (event) => {
    event.preventDefault();
});

// Event Listeners
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
window.addEventListener('scroll', handleScroll);
canvasContainer.addEventListener('mousedown', onMouseDown);
window.addEventListener('mousemove', onMouseMove);
window.addEventListener('mouseup', onMouseUp);
document.addEventListener('fullscreenchange', handleFullScreenChange);

animate();


























































































































































