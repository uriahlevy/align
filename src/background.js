import * as THREE from 'three'

let renderer,scene,camera,waveObject;

function initRenderer() {
    if (isWebGLAvailable()) {
        try {
            renderer = new THREE.WebGLRenderer({
                canvas: document.getElementById('holographic-background'),
                alpha: true,
                antialias: true // Added for smoother lines
            });
        } catch (e) {
            console.warn("WebGL initialization failed, falling back to CSS3DRenderer");
            showWebGLInstructions();
            return false;
        }
    } else {
        console.warn("WebGL not supported, falling back to CSS3DRenderer");
        showWebGLInstructions();
        return false;
    }

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // For sharper rendering
    return true;
}

const vertexShader = `
    uniform float time;
    varying vec2 vUv;
    varying vec3 vPosition;

    void main() {
        vUv = uv;
        vPosition = position;
        
        vec3 pos = position;
        
        // Add more complex movement
        float wave = sin(pos.x * 2.0 + time) * cos(pos.y * 2.0 + time) * 0.1;
        pos.z += wave;
        
        // Add some swirling motion
        float angle = length(pos.xy) * 0.5 + time * 0.5;
        pos.xy += vec2(sin(angle), cos(angle)) * 0.1;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`;

const fragmentShader = `
    uniform sampler2D fabricTexture;
uniform float time;
varying vec2 vUv;

// Function to convert HSL to RGB
vec3 hsl2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
}

void main() {
    vec2 uv = vUv;
    
    // Animate the UV coordinates for a subtle movement effect
    uv.y += sin(uv.x * 10.0 + time * 0.5) * 0.04;
    uv.x += cos(uv.y * 10.0 + time * 0.5) * 0.04;
    
    // Sample the fabric texture
    vec4 fabricColor = texture2D(fabricTexture, uv);
    
    // Create radial gradient
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(uv, center) * 2.0;
    
    // Create eccentric color palette
    float hueShift = sin(time * 0.2) * 0.05; // Subtle hue shift over time
    vec3 color1 = hsl2rgb(vec3(0.55 + hueShift, 0.9, 0.6));  // Vibrant azure blue
    vec3 color2 = hsl2rgb(vec3(0.5 + hueShift, 0.9, 0.7));   // Bright sky blue
    vec3 color3 = hsl2rgb(vec3(0.6 + hueShift, 0.9, 0.5));   // Deep royal blue
    vec3 color4 = hsl2rgb(vec3(0.65 + hueShift, 0.8, 0.6));  // Vibrant indigo
    
    vec3 gradientColor;
    if (dist < 0.5) {
        gradientColor = mix(color1, color2, dist * 2.0);
    } else if (dist < 0.75) {
        gradientColor = mix(color2, color3, (dist - 0.5) * 4.0);
    } else {
        gradientColor = mix(color3, color4, (dist - 0.75) * 4.0);
    }
    
    // Blend the gradient color with the fabric texture
    vec3 finalColor = gradientColor * (fabricColor.rgb * 0.7 + 0.3);
    
    // Boost overall brightness and saturation
    finalColor = pow(finalColor, vec3(0.9)); // Increase brightness
    finalColor = mix(finalColor, vec3(dot(finalColor, vec3(0.299, 0.587, 0.114))), -0.2); // Boost saturation
    
    gl_FragColor = vec4(finalColor, 1.0);
}
`;

function isWebGLAvailable() {
    try {
        const canvas = document.createElement('canvas');
        let webglAvailable = !!(window.WebGLRenderingContext &&
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
            console.log('webgl available:', webglAvailable)
        return webglAvailable;
    } catch (e) {
        return false;
    }
}

function showWebGLInstructions() {
    const divToHide = document.querySelector('.container');
    if (divToHide) {
        divToHide.style.display = 'none';
    }
    const instructionsElement = document.getElementById('webgl-instructions');
    if (instructionsElement) {
        instructionsElement.style.display = 'block';
        const allElements = document.querySelectorAll('.key');
        // allElements.forEach(element => {
        //     element.classList.remove('active', 'pressed', 'invisible');
        //     element.style.opacity = 0;
        // });
        const container = document.querySelector('.container');
        container.style.opacity = 0;

    }
}

function initBackgroundScene() {
    console.log('animated background init')
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 0.5;

    const geometry = new THREE.PlaneGeometry(3, 3, 800, 800);
    const textureLoader = new THREE.TextureLoader();
    const fabricTexture = textureLoader.load('iridescent.jpg');

    const material = new THREE.ShaderMaterial({
        uniforms: {
            fabricTexture: {value: fabricTexture},
            time: {value: 0}
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
    });

    waveObject = new THREE.Mesh(geometry, material);
    scene.add(waveObject);
        
}

function animateBackground(time) {
    // Use the passed time parameter instead of calculating it here
    if (waveObject && waveObject.material.uniforms) {
        waveObject.material.uniforms.time.value = time;
    }
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

window.addEventListener('resize', () => {
    if (isWebGLAvailable()) {
        if (camera && renderer) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
        }
    }
});

window.initRenderer = initRenderer;
window.initBackgroundScene = initBackgroundScene;
window.animateBackground = animateBackground;