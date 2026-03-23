export const SNOW_SHADER = `
uniform sampler2D colorTexture;
uniform float time;
uniform float intensity;
uniform vec2 resolution;
in vec2 v_textureCoordinates;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float sparkle(vec2 uv, float t) {
  vec2 grid = floor(uv * 120.0);
  float h = hash(grid + floor(t * 2.0));
  float threshold = 0.985;
  return h > threshold ? (h - threshold) / (1.0 - threshold) : 0.0;
}

void main() {
  vec4 color = texture(colorTexture, v_textureCoordinates);

  // Shift color temperature toward cold/blue
  vec3 cold = vec3(
    color.r * 0.9,    // reduce red ~10%
    color.g * 0.97,   // slight green reduction
    color.b * 1.2     // boost blue ~20%
  );

  // Desaturate partially (mix with grayscale at ~30%)
  float lum = dot(cold, vec3(0.299, 0.587, 0.114));
  vec3 desaturated = mix(cold, vec3(lum), 0.3 * intensity);

  // Slight brightness boost
  desaturated *= 1.1;

  // Frost sparkle noise overlay
  float sp = sparkle(v_textureCoordinates, time);
  desaturated += vec3(sp * 0.35 * intensity);

  // Subtle frost haze — lighten overall slightly
  desaturated = mix(desaturated, vec3(1.0), 0.04 * intensity);

  desaturated = clamp(desaturated, 0.0, 1.0);

  out_FragColor = vec4(desaturated, 1.0);
}
`;
