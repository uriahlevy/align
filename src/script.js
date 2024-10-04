import * as THREE from 'three'

let phaseCancellationPercentage = 0;

function updateStatusInput() {
    const statusInput = document.getElementById('statusInput');
    statusInput.value = phaseCancellationPercentage;
}

const sizes = {
    width: 700,
    height: 350  // Reduced height for each canvas
}

// Create two canvases
const canvas1 = document.getElementById('oscilloscope-canvas-1');
const canvas2 = document.getElementById('oscilloscope-canvas-2');

// Create two renderers
const renderer1 = new THREE.WebGLRenderer({
    canvas: canvas1,
    alpha: true,
    antialias: true
});
const renderer2 = new THREE.WebGLRenderer({
    canvas: canvas2,
    alpha: true,
    antialias: true
});

renderer1.setClearColor(0x000000, 0);
renderer2.setClearColor(0x000000, 0);

// Create two scenes
const scene1 = new THREE.Scene();
const scene2 = new THREE.Scene();

// Create two cameras
const camera1 = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 1000);
const camera2 = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 1000);

renderer1.setSize(sizes.width, sizes.height);
renderer2.setSize(sizes.width, sizes.height);

camera1.position.z = 6;
camera2.position.z = 6;

// Create geometries and materials
const geometry1 = new THREE.PlaneGeometry(5, 1, 100, 1);
const material1 = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
const plane1 = new THREE.Mesh(geometry1, material1);

const geometry2 = new THREE.PlaneGeometry(5, 1, 100, 1);
const material2 = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
const plane2 = new THREE.Mesh(geometry2, material2);

const geometry3 = new THREE.PlaneGeometry(5, 1, 100, 1);
const material3 = new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true });
const plane3 = new THREE.Mesh(geometry3, material3);

plane1.position.y = 1;
plane2.position.y = -1;
plane3.position.y = 0;  // Centered in the second canvas

// Add planes to scenes
scene1.add(plane1);
scene1.add(plane2);
scene2.add(plane3);

const statusDisplay = document.getElementById('statusDisplay');

let phaseOffset1 = 0;
let phaseOffset2 = Math.PI; // Start with π difference for initial cancellation
let maxAmplitude = 1;
const phaseStep = 0.05;
let startTime = Date.now();

function animate() {
    requestAnimationFrame(animate);

    const currentTime = Date.now();
    const elapsedTime = (currentTime - startTime) * 0.003;

    updateWave(geometry1, elapsedTime, phaseOffset1, 0.5);
    updateWave(geometry2, elapsedTime, phaseOffset2, 0.5);
    const combinedAmplitude = updateCombinedWave(geometry3, geometry1, geometry2);

    const cancellationPercentage = calculateCancellationPercentage(combinedAmplitude);
    updateStatusDisplay(cancellationPercentage);

    renderer1.render(scene1, camera1);
    renderer2.render(scene2, camera2);
}

function updateWave(geometry, time, phaseOffset, amplitude) {
    const positionAttribute = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positionAttribute.count; i++) {
        vertex.fromBufferAttribute(positionAttribute, i);
        vertex.y = Math.sin(vertex.x * 2 + time + phaseOffset) * amplitude;
        positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    positionAttribute.needsUpdate = true;
}

function updateCombinedWave(geometry, geometry1, geometry2) {
    const positionAttribute = geometry.attributes.position;
    const positionAttribute1 = geometry1.attributes.position;
    const positionAttribute2 = geometry2.attributes.position;
    const vertex = new THREE.Vector3();
    const vertex1 = new THREE.Vector3();
    const vertex2 = new THREE.Vector3();

    let maxAmplitudeThisFrame = 0;

    for (let i = 0; i < positionAttribute.count; i++) {
        vertex.fromBufferAttribute(positionAttribute, i);
        vertex1.fromBufferAttribute(positionAttribute1, i);
        vertex2.fromBufferAttribute(positionAttribute2, i);
        vertex.y = vertex1.y + vertex2.y;
        positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);

        maxAmplitudeThisFrame = Math.max(maxAmplitudeThisFrame, Math.abs(vertex.y));
    }

    positionAttribute.needsUpdate = true;

    // Update the overall max amplitude if necessary
    maxAmplitude = Math.max(maxAmplitude, maxAmplitudeThisFrame);

    return maxAmplitudeThisFrame;
}

function calculateCancellationPercentage(currentAmplitude) {
    // If maxAmplitude is 0, there's no wave, so we'll consider it 100% cancelled
    if (maxAmplitude === 0) return 100;

    // Calculate the percentage of cancellation
    const cancellationPercentage = 100 * (1 - currentAmplitude / maxAmplitude);

    // Ensure the percentage is between 0 and 100
    return Math.min(100, Math.max(0, cancellationPercentage));
}

function updateStatusDisplay(percentage) {
    statusDisplay.textContent = `Phase Cancellation: ${percentage.toFixed(2)}%`;
}

updateStatusDisplay(100);
animate();

window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight / 2;  // Half the height for each canvas

    renderer1.setSize(width, height);
    renderer2.setSize(width, height);

    camera1.aspect = width / height;
    camera2.aspect = width / height;

    camera1.updateProjectionMatrix();
    camera2.updateProjectionMatrix();
});

document.addEventListener('keydown', (event) => {
    const key = document.querySelector(`.key[data-key="${event.key}"]`);
    if (key) {
        key.classList.add('pressed');
        setTimeout(() => {
            key.classList.remove('pressed');
        }, 100);
    }
    switch (event.key.toLowerCase()) {
        case 'a':
            phaseOffset1 -= phaseStep;
            break;
        case 'd':
            phaseOffset1 += phaseStep;
            break;
        case 'j':
            phaseOffset2 -= phaseStep;
            break;
        case 'l':
            phaseOffset2 += phaseStep;
            break;
    }
});
