export const NOIR_SHADER = `
uniform sampler2D colorTexture;
uniform float time;
uniform float intensity;
uniform vec2 resolution;
in vec2 v_textureCoordinates;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec4 color = texture(colorTexture, v_textureCoordinates);

  // Convert to grayscale using luminance weights
  float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));

  // Strong contrast curve for film noir look
  lum = pow(lum, 1.5);
  lum = clamp(lum, 0.0, 1.0);

  // Boost contrast further with S-curve
  lum = smoothstep(0.05, 0.95, lum);

  vec3 noir = vec3(lum);

  // Subtle film grain
  float grain = hash(v_textureCoordinates * 800.0 + vec2(time * 43.0, time * 19.0));
  noir += (grain - 0.5) * 0.04 * intensity;

  // Vignette darkening at edges
  vec2 center = v_textureCoordinates - 0.5;
  float vignette = 1.0 - dot(center, center) * 3.0;
  vignette = smoothstep(0.0, 1.0, vignette);
  noir *= vignette;

  // Slight warm tone in highlights, cool in shadows (classic noir feel)
  vec3 tinted = mix(
    vec3(noir.r * 0.95, noir.g * 0.95, noir.b * 1.05),  // cool shadows
    vec3(noir.r * 1.02, noir.g * 1.0, noir.b * 0.98),    // warm highlights
    lum
  );

  out_FragColor = vec4(tinted, 1.0);
}
`;
