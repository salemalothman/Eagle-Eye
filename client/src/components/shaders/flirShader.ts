export const FLIR_SHADER = `
uniform sampler2D colorTexture;
uniform float time;
uniform float intensity;
uniform vec2 resolution;
in vec2 v_textureCoordinates;

vec3 thermalColormap(float t) {
  // Hot iron colormap: black -> dark blue -> purple -> red -> orange -> yellow -> white
  if (t < 0.15) return mix(vec3(0.0), vec3(0.0, 0.0, 0.3), t / 0.15);
  if (t < 0.30) return mix(vec3(0.0, 0.0, 0.3), vec3(0.4, 0.0, 0.5), (t - 0.15) / 0.15);
  if (t < 0.50) return mix(vec3(0.4, 0.0, 0.5), vec3(0.8, 0.1, 0.1), (t - 0.30) / 0.20);
  if (t < 0.70) return mix(vec3(0.8, 0.1, 0.1), vec3(1.0, 0.5, 0.0), (t - 0.50) / 0.20);
  if (t < 0.85) return mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 0.9, 0.2), (t - 0.70) / 0.15);
  return mix(vec3(1.0, 0.9, 0.2), vec3(1.0, 1.0, 1.0), (t - 0.85) / 0.15);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec4 color = texture(colorTexture, v_textureCoordinates);
  float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));

  // Apply thermal colormap
  vec3 thermal = thermalColormap(lum);

  // Sensor noise
  float noise = hash(v_textureCoordinates * 400.0 + vec2(time * 23.0)) * 0.04;
  thermal += noise;

  // Subtle scan lines
  float scanline = sin(v_textureCoordinates.y * resolution.y * 0.8) * 0.02;
  thermal -= scanline;

  // Targeting reticle
  vec2 screenPos = v_textureCoordinates;
  vec2 center = screenPos - 0.5;
  float aspect = resolution.x / resolution.y;
  center.x *= aspect;

  // Crosshair lines
  float crosshairThickness = 0.001;
  float crosshairGap = 0.03;
  float crosshairLen = 0.5;

  vec3 reticleColor = vec3(0.3, 0.9, 0.3);

  // Horizontal line
  if (abs(center.y) < crosshairThickness && abs(center.x) > crosshairGap && abs(center.x) < crosshairLen) {
    thermal = reticleColor;
  }
  // Vertical line
  if (abs(center.x) < crosshairThickness && abs(center.y) > crosshairGap && abs(center.y) < crosshairLen) {
    thermal = reticleColor;
  }

  // Circle reticle
  float dist = length(center);
  float circleRadius = 0.15;
  if (abs(dist - circleRadius) < 0.001) {
    thermal = reticleColor;
  }

  // Tick marks on circle every 30 degrees
  float angle = atan(center.y, center.x);
  for (int i = 0; i < 12; i++) {
    float tickAngle = float(i) * 3.14159 / 6.0;
    if (abs(mod(angle + 3.14159, 3.14159 * 2.0 / 12.0) - 3.14159 / 6.0) < 0.02) {
      if (dist > circleRadius - 0.01 && dist < circleRadius + 0.01) {
        thermal = reticleColor;
      }
    }
  }

  // Edge enhancement (simplified Sobel)
  float dx = texture(colorTexture, v_textureCoordinates + vec2(1.0/resolution.x, 0.0)).r
           - texture(colorTexture, v_textureCoordinates - vec2(1.0/resolution.x, 0.0)).r;
  float dy = texture(colorTexture, v_textureCoordinates + vec2(0.0, 1.0/resolution.y)).r
           - texture(colorTexture, v_textureCoordinates - vec2(0.0, 1.0/resolution.y)).r;
  float edge = length(vec2(dx, dy)) * 3.0;
  thermal += edge * 0.15 * vec3(1.0, 0.8, 0.5);

  out_FragColor = vec4(thermal, 1.0);
}
`;
