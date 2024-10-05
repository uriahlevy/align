uniform sampler2D pointTexture;
varying vec3 vColor;

void main() {
    vec4 textureColor = texture2D(pointTexture, gl_PointCoord);
    vec3 neonBlue = vec3(0.3, 0.7, 2.0); // Adjust these values for your desired shade of neon blue
    
    // Add glow effect
    float glow = 0.3; // Adjust glow intensity
    vec3 glowColor = neonBlue + vec3(glow);
    
    gl_FragColor = vec4(glowColor, 1.0) * textureColor.a;
}