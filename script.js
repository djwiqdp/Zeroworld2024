let scene, camera, renderer, canModel;
const canvasContainer = document.getElementById('canvas-container');
const ingrImage = document.getElementById('ingr');
const endOverlay = document.getElementById('end-overlay'); // White overlay

// Scroll to top on page load
window.scrollTo(0, 0); // Force start at top
window.addEventListener('beforeunload', () => window.scrollTo(0, 0)); // Ensure scroll stays at top on refresh

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
const ambientLight = new THREE.AmbientLight(0xffffff, 2); // 기본적인 밝기 증가
scene.add(ambientLight);

// 옆면에서 가까운 주요 빛
const sideDirectionalLight = new THREE.DirectionalLight(0xffffff, 10); // 옆면의 밝기 강조
sideDirectionalLight.position.set(10000, 100, 0); // 옆에서 비추도록 위치 설정
sideDirectionalLight.castShadow = true;
scene.add(sideDirectionalLight);

// 옆면에서 멀리서 전체적으로 비추는 추가 빛 (더 넓은 영역 커버)
const distantSideLight = new THREE.DirectionalLight(0xffffff, 10.0); // 강도 증가로 넓은 영역 밝히기
distantSideLight.position.set(-3000, 100, 1000); // 더 멀리서 전체 장면 비추기
distantSideLight.castShadow = true;
scene.add(distantSideLight);

// 전면부를 강조하는 빛
const frontSpotLight = new THREE.SpotLight(0xffffff, 300, 300, Math.PI / 4, 0.5, 4);
frontSpotLight.position.set(100, 0, 1000); // 전면부 강조 조명
frontSpotLight.castShadow = true;
scene.add(frontSpotLight);

// 부드러운 사이드 조명
const sideSpotLight = new THREE.SpotLight(0xffffff, 2, 200, Math.PI / 4, 0.5, 2);
sideSpotLight.position.set(10, 20, 500); // 사이드 밝기 조정
scene.add(sideSpotLight);

// 추가적인 전방향 빛 조명
const directionalLight = new THREE.DirectionalLight(0xffffff, 12);
directionalLight.position.set(10, -50, 50); // 전체적인 밝기 조절
scene.add(directionalLight);

// Load Can Model with Initial Rotation and Slightly Reduced Size
const loader = new THREE.GLTFLoader();
loader.load('can.glb', function(gltf) {
    canModel = gltf.scene;
    canModel.scale.set(150, 150, 150); // Slightly smaller size for prominence
    canModel.position.set(0, -10, 0); // Lower starting position
    canModel.rotation.y = THREE.Math.degToRad(120); // Initial rotation of 120 degrees on the y-axis

    // Enhance material to make it brighter and more metallic
    canModel.traverse((child) => {
        if (child.isMesh) {
            child.material.metalness = 0.95; // High metalness for aluminum effect
            child.material.roughness = 0.05; // Very low roughness for a shiny appearance
            child.material.envMapIntensity = 2.5; // Further boost reflections for a vivid look
        }
    });

    scene.add(canModel);
    animate();
});

// Variables for scroll and rotation control
let isPaused = false;
let isDragging = false;
let previousMouseX = 0;
let initialYRotation = THREE.Math.degToRad(120);
let targetYRotation = THREE.Math.degToRad(300); // Target 180-degree rotation
let clock = new THREE.Clock();
const targetScrollMiddleBG2 = window.innerHeight * 1.5; // Middle of bg2
const targetScrollEndBG3 = window.innerHeight * 3; // End of bg3
const targetScrollStartOverlay = targetScrollEndBG3 + window.innerHeight * 0.2; // Start overlay slightly after bg3
const floatAmplitudeY = 1.5;
const floatAmplitudeX = 20;
const floatAmplitudeZ = 0.5;
const floatFrequencyY = 1.0;
const floatFrequencyX = 0.75;
const floatFrequencyZ = 0.5;

// Scroll Animation Logic
function handleScroll() {
    const scrollY = window.scrollY;

    if (!canModel) return;

    if (scrollY < targetScrollMiddleBG2) {
        const progress = Math.min(scrollY / targetScrollMiddleBG2, 1);
        canModel.rotation.y = initialYRotation + Math.PI * progress;
        ingrImage.style.opacity = '0'; // Hide ingr.png before middle of bg2
        endOverlay.style.opacity = '0'; // Hide overlay before reaching start overlay position
    } else if (scrollY < targetScrollEndBG3) {
        canModel.rotation.y = targetYRotation;
        ingrImage.style.opacity = '1'; // Show ingr.png
    } else if (scrollY < targetScrollStartOverlay) {
        ingrImage.style.opacity = '0'; // Hide ingr.png after bg3
        endOverlay.style.opacity = '0'; // Hide overlay until just after bg3
    } else {
        endOverlay.style.opacity = '1'; // Show overlay after bg3 ends
    }
}

// Fullscreen Mode Scroll Handling
function handleFullScreenChange() {
    if (document.fullscreenElement) {
        document.fullscreenElement.style.overflow = 'auto'; // 전체화면에서 스크롤 허용
        document.removeEventListener('scroll', handleScroll);
        document.fullscreenElement.addEventListener('scroll', handleScroll);
    } else {
        document.fullscreenElement?.removeEventListener('scroll', handleScroll);
        window.addEventListener('scroll', handleScroll);
    }
}


// Mouse Interaction for y-axis Rotation
function onMouseMove(event) {
    if (isDragging && canModel) {
        const deltaX = event.clientX - previousMouseX;
        previousMouseX = event.clientX;

        // Adjust rotation only on y-axis and clamp to 180 degrees from the starting point
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

// Animation Loop with Enhanced Floating and Reversed Z-Axis Movement
function animate() {
    requestAnimationFrame(animate);

    if (canModel) {
        const elapsedTime = clock.getElapsedTime();
        const scrollY = window.scrollY;

        // Apply y and z-axis tilting only when in bg1 section (top of the page)
        if (scrollY < targetScrollMiddleBG2) {
            // Floating effect with reversed z-axis movement
            canModel.position.y = -7 + Math.sin(elapsedTime * floatFrequencyY) * floatAmplitudeY;
            canModel.position.z = Math.sin(elapsedTime * floatFrequencyZ) * floatAmplitudeZ * Math.sign(Math.sin(elapsedTime * 0.1)); // Reversed z-axis movement
            canModel.rotation.x = Math.abs(Math.sin(elapsedTime * 0.3) * 0.5); // Forward tilting effect on x-axis
        } else {
            // Reset tilt and z-axis movement when scrolled past bg1
            canModel.position.y = -10 + Math.sin(elapsedTime * floatFrequencyY) * floatAmplitudeY;
            canModel.position.z = 0; // Centered z-axis when past bg1
            canModel.rotation.x = 0; // Reset tilt on x-axis
        }

        // Optional: slight y-axis rotation for dynamic effect
        canModel.rotation.y += 0.001; // Slow y-axis rotation for subtle spin
    }

    handleScroll();
    renderer.render(scene, camera);
}

// Scroll Button Logic
document.addEventListener("DOMContentLoaded", () => {
    const scrollButton = document.getElementById('scroll-button');
    const threshold = 50; // Set a threshold of 50 pixels near the bottom

    // Function to scroll to the bottom of the page, adjusting for different screen sizes
    function scrollToBottom() {
        const targetScrollPosition = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
        window.scrollTo({
            top: targetScrollPosition,
            behavior: 'smooth'
        });
    }

    // Function to scroll to the top of the page
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // Event listener to toggle scroll behavior based on icon
    scrollButton.addEventListener('click', () => {
        if (scrollButton.getAttribute('src') === 'icon1.png') {
            scrollToBottom();
        } else {
            scrollToTop();
        }
    });

    // Check scroll position to switch icons with a threshold
    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY + window.innerHeight;
        const pageHeight = document.documentElement.scrollHeight;

        // If close to the bottom, switch to icon2.png
        if (scrollPosition >= pageHeight - threshold) {
            scrollButton.setAttribute('src', 'icon2.png');
        } else {
            // Otherwise, show icon1.png
            scrollButton.setAttribute('src', 'icon1.png');
        }
    });
});

// Event Listeners for Mouse Control, Window Resizing, and Fullscreen Change
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























































































































































