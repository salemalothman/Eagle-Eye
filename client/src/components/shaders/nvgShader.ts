export const NVG_SHADER = `
uniform sampler2D colorTexture;
uniform float time;
uniform float intensity;
in vec2 v_textureCoordinates;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec4 color = texture(colorTexture, v_textureCoordinates);

  // Convert to luminance
  float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));

  // Light amplification (boost dark areas)
  lum = pow(lum, 0.6) * 1.8;
  lum = clamp(lum, 0.0, 1.0);

  // NVG green phosphor mapping
  vec3 nvg = vec3(lum * 0.08, lum * 0.95, lum * 0.12);

  // Grain noise
  float noise = hash(v_textureCoordinates * 500.0 + vec2(time * 37.0, time * 17.0));
  nvg += (noise - 0.5) * 0.06 * intensity;

  // Subtle scan lines
  float scanline = sin(v_textureCoordinates.y * 800.0) * 0.03;
  nvg -= scanline;

  // Radial vignette
  vec2 center = v_textureCoordinates - 0.5;
  float vignette = 1.0 - dot(center, center) * 2.0;
  vignette = smoothstep(0.0, 1.0, vignette);
  nvg *= vignette;

  // Bloom on bright areas
  float bloom = smoothstep(0.35, 0.9, lum) * 0.25;
  nvg += vec3(bloom * 0.05, bloom * 0.7, bloom * 0.08);

  // Slight green tint to very dark areas (simulate tube noise floor)
  nvg += vec3(0.0, 0.015, 0.0);

  out_FragColor = vec4(nvg, 1.0);
}
`;
