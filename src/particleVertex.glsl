uniform vec3 color;
attribute float size;
varying vec3 vColor;

void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (310.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition*0.001;
}