export const ANIME_SHADER = `
uniform sampler2D colorTexture;
uniform float time;
uniform float intensity;
uniform vec2 resolution;
in vec2 v_textureCoordinates;

void main() {
  vec4 color = texture(colorTexture, v_textureCoordinates);
  vec2 texelSize = 1.0 / resolution;

  // Sobel edge detection on luminance
  float tl = dot(texture(colorTexture, v_textureCoordinates + vec2(-texelSize.x, texelSize.y)).rgb, vec3(0.299, 0.587, 0.114));
  float t  = dot(texture(colorTexture, v_textureCoordinates + vec2(0.0, texelSize.y)).rgb, vec3(0.299, 0.587, 0.114));
  float tr = dot(texture(colorTexture, v_textureCoordinates + vec2(texelSize.x, texelSize.y)).rgb, vec3(0.299, 0.587, 0.114));
  float ml = dot(texture(colorTexture, v_textureCoordinates + vec2(-texelSize.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
  float mr = dot(texture(colorTexture, v_textureCoordinates + vec2(texelSize.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
  float bl = dot(texture(colorTexture, v_textureCoordinates + vec2(-texelSize.x, -texelSize.y)).rgb, vec3(0.299, 0.587, 0.114));
  float b  = dot(texture(colorTexture, v_textureCoordinates + vec2(0.0, -texelSize.y)).rgb, vec3(0.299, 0.587, 0.114));
  float br = dot(texture(colorTexture, v_textureCoordinates + vec2(texelSize.x, -texelSize.y)).rgb, vec3(0.299, 0.587, 0.114));

  float gx = -tl - 2.0*ml - bl + tr + 2.0*mr + br;
  float gy = -tl - 2.0*t - tr + bl + 2.0*b + br;
  float edgeMagnitude = length(vec2(gx, gy));

  // Posterize colors (quantize to N levels)
  float levels = 6.0;
  vec3 posterized = floor(color.rgb * levels + 0.5) / levels;

  // Boost saturation
  float lum = dot(posterized, vec3(0.299, 0.587, 0.114));
  vec3 saturated = mix(vec3(lum), posterized, 1.4);
  saturated = clamp(saturated, 0.0, 1.0);

  // Draw black outlines where edges are strong
  float edgeThreshold = 0.12 * intensity;
  float outline = smoothstep(edgeThreshold, edgeThreshold + 0.05, edgeMagnitude);
  vec3 result = mix(saturated, vec3(0.0), outline * 0.85);

  out_FragColor = vec4(result, 1.0);
}
`;
