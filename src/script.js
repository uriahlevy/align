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

// Particle system setup
const particleCount = 1000; // Adjust for more or fewer particles
const particles = new Float32Array(particleCount * 3);
const particleSizes = new Float32Array(particleCount);

const textureLoader = new THREE.TextureLoader();
const loader = new THREE.FileLoader();

// Function to load shader
function loadShader(url) {
    return new Promise((resolve, reject) => {
        loader.load(url, data => resolve(data), null, reject);
    });
}

// Load texture and shaders
Promise.all([
    new Promise((resolve, reject) => {
        textureLoader.load('./particle_1.png', resolve, null, reject);
    }),
    loadShader('particleVertex.glsl'),
    loadShader('particleFragment.glsl')
])
    .then(([texture, vertexShader, fragmentShader]) => {
        const particleMaterial1 = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(0x00d0ff1a) },
                pointTexture: { value: texture }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true
        });

        const particleMaterial2 = particleMaterial1.clone();
        particleMaterial2.uniforms.color.value = new THREE.Color(0xff0000);

        const particleMaterial3 = particleMaterial1.clone();
        particleMaterial3.uniforms.color.value = new THREE.Color(0x0000ff);

        // Create particle systems
        const particleSystem1 = new THREE.Points(new THREE.BufferGeometry(), particleMaterial1);
        const particleSystem2 = new THREE.Points(new THREE.BufferGeometry(), particleMaterial2);
        const particleSystem3 = new THREE.Points(new THREE.BufferGeometry(), particleMaterial3);

        particleSystem1.position.y = 1;
        particleSystem2.position.y = -1;
        particleSystem3.position.y = 0;

        // Initialize particle positions and sizes
        for (let i = 0; i < particleCount; i++) {
            const x = (i / particleCount) * 5 - 2.5;
            particles[i * 3] = x;
            particles[i * 3 + 1] = 0;
            particles[i * 3 + 2] = 0;
            particleSizes[i] = 0.06;
        }

        particleSystem1.geometry.setAttribute('position', new THREE.BufferAttribute(particles.slice(), 3));
        particleSystem2.geometry.setAttribute('position', new THREE.BufferAttribute(particles.slice(), 3));
        particleSystem3.geometry.setAttribute('position', new THREE.BufferAttribute(particles.slice(), 3));

        particleSystem1.geometry.setAttribute('size', new THREE.BufferAttribute(particleSizes.slice(), 1));
        particleSystem2.geometry.setAttribute('size', new THREE.BufferAttribute(particleSizes.slice(), 1));
        particleSystem3.geometry.setAttribute('size', new THREE.BufferAttribute(particleSizes.slice(), 1));

        scene1.add(particleSystem1);
        scene1.add(particleSystem2);
        scene2.add(particleSystem3);

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

            updateParticleWave(particleSystem1, elapsedTime, phaseOffset1, 0.5);
            updateParticleWave(particleSystem2, elapsedTime, phaseOffset2, 0.5);
            const combinedAmplitude = updateCombinedParticleWave(particleSystem3, particleSystem1, particleSystem2);

            const cancellationPercentage = calculateCancellationPercentage(combinedAmplitude);
            updateStatusDisplay(cancellationPercentage);

            renderer1.render(scene1, camera1);
            renderer2.render(scene2, camera2);
            if (typeof window.animateBackground === 'function') {
                window.animateBackground(elapsedTime * 0.2);
            }
        }

        function updateParticleWave(particleSystem, time, phaseOffset, amplitude) {
            const positions = particleSystem.geometry.attributes.position.array;

            for (let i = 0; i < particleCount; i++) {
                const x = positions[i * 3];
                const y = Math.sin(x * 2 + time + phaseOffset) * amplitude;
                positions[i * 3 + 1] = y;
            }

            particleSystem.geometry.attributes.position.needsUpdate = true;
        }

        function updateCombinedParticleWave(particleSystem, particleSystem1, particleSystem2) {
            const positions = particleSystem.geometry.attributes.position.array;
            const positions1 = particleSystem1.geometry.attributes.position.array;
            const positions2 = particleSystem2.geometry.attributes.position.array;

            let maxAmplitudeThisFrame = 0;

            for (let i = 0; i < particleCount; i++) {
                const x = positions1[i * 3];
                const y = positions1[i * 3 + 1] + positions2[i * 3 + 1];
                positions[i * 3] = x;
                positions[i * 3 + 1] = y;
                positions[i * 3 + 2] = 0;

                maxAmplitudeThisFrame = Math.max(maxAmplitudeThisFrame, Math.abs(y));
            }

            particleSystem.geometry.attributes.position.needsUpdate = true;

            return maxAmplitudeThisFrame;
        }

        function calculateCancellationPercentage(currentAmplitude) {
            if (maxAmplitude === 0) return 100;
            const cancellationPercentage = 100 * (1 - currentAmplitude / maxAmplitude);
            let percentage = Math.min(100, Math.max(0, cancellationPercentage));
            // console.log(percentage);
            if (percentage < 0.1) {
                if (!audioPlayed) {
                    console.log("no cancellation, playing end audio");
                }
                playEndAudio();
            }
            return percentage;
        }

        function updateStatusDisplay(percentage) {
            statusDisplay.textContent = `Phase Cancellation: ${percentage.toFixed(2)}%`;
        }

        document.addEventListener('keydown', (event) => {
            const key = document.querySelector(`.key[data-key="${event.key}"]`);
            if (key) {
                key.classList.add('pressed');
                playAudioSample(typingSample)
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

        updateStatusDisplay(100);
        startAudio();
        if (typeof window.initRenderer === 'function') {
            window.initRenderer();
        }
        if (typeof window.initBackgroundScene === 'function') {
            window.initBackgroundScene();
        }
        requestAnimationFrame(animate)
        animate();
    })
    .catch(error => {
        console.error('An error occurred while loading assets:', error);
    });


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

let audioContext;
let audioBuffer;
let audioSource;
let audioPlayed = false;
const typingSample = new Audio('typing_cut.wav')

fetch('gbg_cut.wav')
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        return audioContext.decodeAudioData(arrayBuffer);
    })
    .then(decodedAudio => {
        audioBuffer = decodedAudio;
        console.log('Audio loaded and decoded');
    })
    .catch(error => console.error('Error loading audio:', error));

async function startAudio() {
    if (audioContext && audioContext.state !== 'running') {
        await audioContext.resume();
        console.log('Audio context resumed');
    }
}

function playEndAudio() {
    if (!audioPlayed && audioBuffer) {
        // if (audioSource) {
        //     audioSource.stop();
        // }
        audioSource = audioContext.createBufferSource();
        audioSource.buffer = audioBuffer;

        const gainNode = audioContext.createGain();
        // const duration = 2
        const startTime = 0;
        const duration = audioBuffer.duration - startTime;

        setTimeout(() => {
            const now = audioContext.currentTime;
            const fadeInDuration = 1.5;

            gainNode.gain.setValueAtTime(0.1, now);

            gainNode.gain.exponentialRampToValueAtTime(1, now + fadeInDuration);

            audioSource.connect(gainNode);
            gainNode.connect(audioContext.destination);

            audioSource.start(now, startTime, duration);

            let elapsed = 0;
            const interval = setInterval(() => {
                console.log(`Gain at ${elapsed / 10}s:`, gainNode.gain.value);
                elapsed += 1;
                if (elapsed > fadeInDuration * 10) clearInterval(interval);
            }, 100);
        }, 1000);

        audioPlayed = true;
    } else if (!audioBuffer) {
        console.log('Audio not yet loaded');
    } else {
        console.log('Audio already played');
    }
}

function playAudioSample(audio) {
    if (audio.paused) {
        audio.currentTime = 0;
        audio.play();
    } else {
        audio.currentTime = 0;
    }
}