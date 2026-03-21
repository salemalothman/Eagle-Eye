export const BLOOM_SHADER = `
uniform sampler2D colorTexture;
uniform float time;
uniform float intensity;
uniform vec2 resolution;
in vec2 v_textureCoordinates;

void main() {
  vec2 uv = v_textureCoordinates;
  vec2 texel = 1.0 / resolution;
  vec4 color = texture(colorTexture, uv);

  // Extract bright areas
  float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  float threshold = 0.35;

  // Two-pass box blur for bloom (horizontal + vertical approximation)
  vec3 bloom = vec3(0.0);
  float total = 0.0;

  // 9-tap gaussian-like kernel
  float weights[5] = float[5](0.227, 0.194, 0.122, 0.054, 0.016);

  for (int i = -4; i <= 4; i++) {
    for (int j = -4; j <= 4; j++) {
      vec2 offset = vec2(float(i), float(j)) * texel * 2.0;
      vec3 sample_color = texture(colorTexture, uv + offset).rgb;
      float sample_lum = dot(sample_color, vec3(0.299, 0.587, 0.114));

      // Only bloom bright areas
      float bright = max(0.0, sample_lum - threshold);
      float w = weights[abs(i) < 5 ? abs(i) : 4] * weights[abs(j) < 5 ? abs(j) : 4];
      bloom += sample_color * bright * w;
      total += w;
    }
  }
  bloom /= total;

  // Combine: original + bloom glow
  vec3 result = color.rgb + bloom * 2.5 * intensity;

  // Slight blue tint to bloom for cinematic feel
  result += bloom * vec3(0.1, 0.15, 0.3) * intensity;

  // Tone mapping
  result = vec3(1.0) - exp(-result * 1.2);

  out_FragColor = vec4(clamp(result, 0.0, 1.0), 1.0);
}
`;
