uniform sampler2D pointTexture;
uniform vec3 particleColor;
varying vec3 vColor;

void main() {
    vec4 textureColor = texture2D(pointTexture, gl_PointCoord);
    
    // Add glow effect
    float glow = 0.3; // Adjust glow intensity
    vec3 glowColor = particleColor + vec3(glow);
    
    gl_FragColor = vec4(glowColor, 1.0) * textureColor.a;
}