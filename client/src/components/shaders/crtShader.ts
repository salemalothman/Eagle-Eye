export const CRT_SHADER = `
uniform sampler2D colorTexture;
uniform float time;
uniform float intensity;
uniform vec2 resolution;
in vec2 v_textureCoordinates;

vec2 barrelDistortion(vec2 uv, float k) {
  vec2 center = uv - 0.5;
  float r2 = dot(center, center);
  vec2 distorted = center * (1.0 + k * r2);
  return distorted + 0.5;
}

void main() {
  // Barrel distortion
  float curvature = 0.15 * intensity;
  vec2 uv = barrelDistortion(v_textureCoordinates, curvature);

  // Check if UV is out of bounds after distortion
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    out_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // Chromatic aberration - offset R and B channels
  float aberration = 0.002 * intensity;
  float r = texture(colorTexture, vec2(uv.x - aberration, uv.y)).r;
  float g = texture(colorTexture, uv).g;
  float b = texture(colorTexture, vec2(uv.x + aberration, uv.y)).b;
  vec3 color = vec3(r, g, b);

  // Scan lines
  float scanline = sin(uv.y * resolution.y * 1.5) * 0.5 + 0.5;
  scanline = pow(scanline, 1.5) * 0.15 + 0.85;
  color *= scanline;

  // Phosphor glow (slight green bias)
  float lum = dot(color, vec3(0.299, 0.587, 0.114));
  float glow = smoothstep(0.5, 1.0, lum) * 0.1;
  color += vec3(glow * 0.3, glow * 0.6, glow * 0.3);

  // Flicker
  float flicker = 1.0 + sin(time * 8.0) * 0.015;
  color *= flicker;

  // Vignette (stronger than NVG)
  vec2 center = v_textureCoordinates - 0.5;
  float vignette = 1.0 - dot(center, center) * 2.5;
  vignette = smoothstep(0.0, 1.0, vignette);
  color *= vignette;

  // CRT rounded border
  vec2 abs_center = abs(v_textureCoordinates - 0.5);
  float border = smoothstep(0.49, 0.48, max(abs_center.x, abs_center.y));
  color *= border;

  // Slight blue tint to darks (CRT phosphor characteristic)
  color += vec3(0.0, 0.0, 0.01) * (1.0 - lum);

  out_FragColor = vec4(color, 1.0);
}
`;
