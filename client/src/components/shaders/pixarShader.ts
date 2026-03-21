export const PIXAR_SHADER = `
uniform sampler2D colorTexture;
uniform float time;
uniform float intensity;
uniform vec2 resolution;
in vec2 v_textureCoordinates;

void main() {
  vec4 color = texture(colorTexture, v_textureCoordinates);

  // Warm, dreamy Pixar-like look: soft bloom + warm tones + vignette
  vec2 uv = v_textureCoordinates;

  // Soft glow / bloom simulation (box blur approx)
  vec2 texel = 1.0 / resolution;
  vec3 bloom = vec3(0.0);
  float samples = 0.0;
  for (float x = -2.0; x <= 2.0; x += 1.0) {
    for (float y = -2.0; y <= 2.0; y += 1.0) {
      vec3 s = texture(colorTexture, uv + vec2(x, y) * texel * 3.0).rgb;
      float w = max(0.0, dot(s, vec3(0.299, 0.587, 0.114)) - 0.4);
      bloom += s * w;
      samples += 1.0;
    }
  }
  bloom /= samples;

  // Warm color grading (shift toward orange/amber)
  vec3 warm = color.rgb;
  warm.r = pow(warm.r, 0.9);
  warm.g = pow(warm.g, 0.95);
  warm.b = pow(warm.b, 1.1);

  // Add subtle warm tint
  warm += vec3(0.03, 0.015, -0.01) * intensity;

  // Boost saturation slightly
  float lum = dot(warm, vec3(0.299, 0.587, 0.114));
  warm = mix(vec3(lum), warm, 1.2);

  // Add bloom
  warm += bloom * 0.6 * intensity;

  // Soft vignette
  vec2 vc = uv - 0.5;
  float vignette = 1.0 - dot(vc, vc) * 0.5;
  warm *= vignette;

  // Tone mapping
  warm = warm / (warm + vec3(1.0));
  warm = pow(warm, vec3(1.0 / 2.2));

  out_FragColor = vec4(clamp(warm, 0.0, 1.0), 1.0);
}
`;
