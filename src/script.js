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
const camera1 = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 1000);
const camera2 = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 1000);

renderer1.setSize(sizes.width, sizes.height);
renderer2.setSize(sizes.width, sizes.height);

camera1.position.z = 6;
camera2.position.z = 6;

// Particle system setup
const particleCount = 2000; // Adjust for more or fewer particles
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
        const baseShaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
                pointTexture: { value: texture },
                particleColor: { value: new THREE.Color(0x00d0ff) },
                glowIntensity: { value: 0.2 } 
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true
        });
    
        // Create particle systems with individual colors
        const particleSystem1 = new THREE.Points(new THREE.BufferGeometry(), baseShaderMaterial.clone());
        particleSystem1.material.uniforms.particleColor.value = new THREE.Color(0x00d0ff); // Blue
    
        const particleSystem2 = new THREE.Points(new THREE.BufferGeometry(), baseShaderMaterial.clone());
        particleSystem2.material.uniforms.particleColor.value = new THREE.Color(0xff69b4); // Pink
    
        const particleSystem3 = new THREE.Points(new THREE.BufferGeometry(), baseShaderMaterial.clone());
        particleSystem3.material.uniforms.particleColor.value = new THREE.Color(0x8a2be2); // Purple
        particleSystem3.material.uniforms.glowIntensity.value = 0.5;

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
        const phaseStep = 0.15;
        let startTime = Date.now();
        let isAnimating = false;
        function animate() {
            if (!isAnimating) {
                return;
            }
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
                window.animateBackground(elapsedTime * 0.09);
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
                    continuousGlitchEffect();
                    console.log("no cancellation, playing end audio");
                }
                playEndAudio();
            }
            return percentage;
        }

        document.getElementById('powerSwitch').addEventListener('change', function () {
            const scanline = document.querySelector('.scanline');
            if (this.checked) {
                startAudio();
                isAnimating = true;
                playAudioSample(buzzShort);
                scanline.classList.add('active');
                updateStatusDisplay(100);
                
                if (typeof window.initRenderer === 'function') {
                    window.initRenderer();
                }
                if (typeof window.initBackgroundScene === 'function') {
                    window.initBackgroundScene();
                }
                requestAnimationFrame(animate)
                animate();
            } else {
                isAnimating = false;
                scanline.classList.remove('active');
                stopAudioSample(buzzLong)
                stopAudioSample(buzzShort)
                console.log('Power OFF');
            }
        });

        function updateStatusDisplay(percentage) {
            statusDisplay.textContent = `Phase Cancellation: ${percentage.toFixed(2)}%`;
        }

        document.addEventListener('keydown', (event) => {
            if (!isAnimating) return;
            playAudioSample(buzzLong);
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
    })
    .catch(error => {
        console.error('An error occurred while loading assets:', error);
    });


window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight / 2; 

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
const buzzLong = new Audio('long_buzz.wav')
const buzzShort = new Audio('short_buzz.wav')

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
        audioSource = audioContext.createBufferSource();
        audioSource.buffer = audioBuffer;

        const gainNode = audioContext.createGain();
        const startTime = 1;
        const duration = audioBuffer.duration - startTime;

        setTimeout(() => {
            const now = audioContext.currentTime;
            const fadeInDuration = 3.5;

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
        }, 200);

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

function stopAudioSample(audio) {
    if (audio.play) {
        audio.pause()
    }
}

function createGlitchOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'glitch-overlay';
    
    const screenElement = document.querySelector('.container');
    
    if (screenElement) {
        screenElement.appendChild(overlay);
    } else {
        console.error('Element with class "screen" not found');
    }
    
    return overlay;
}

function applyGlitchEffect(overlay) {
    overlay.style.opacity = '1';

    if (Math.random() < 0.8) {
        const hue = Math.floor(Math.random() * 360);
        overlay.style.backgroundColor = `hsl(${hue}, 100%, 80%)`;
        overlay.style.mixBlendMode = 'difference';
    } else {
        overlay.style.backgroundColor = 'black';
        overlay.style.mixBlendMode = 'overlay';
    }

    setTimeout(() => {
        overlay.style.opacity = '0';
    }, Math.random() * 50 + 20);
}

function continuousGlitchEffect() {
    const overlay = createGlitchOverlay();

    function glitchLoop() {
        if (Math.random() < 0.8) {
            applyGlitchEffect(overlay);
        }

        // Schedule next glitch attempt
        setTimeout(glitchLoop, Math.random() * 1500 + 100);
    }

    glitchLoop();
}