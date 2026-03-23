export const AI_SHADER = `
uniform sampler2D colorTexture;
uniform float time;
uniform float intensity;
uniform vec2 resolution;
in vec2 v_textureCoordinates;

void main() {
  vec2 uv = v_textureCoordinates;
  vec2 texel = 1.0 / resolution;

  // Sample neighbors for edge detection (Sobel approximation)
  float tl = dot(texture(colorTexture, uv + vec2(-texel.x,  texel.y)).rgb, vec3(0.299, 0.587, 0.114));
  float tm = dot(texture(colorTexture, uv + vec2(    0.0,   texel.y)).rgb, vec3(0.299, 0.587, 0.114));
  float tr = dot(texture(colorTexture, uv + vec2( texel.x,  texel.y)).rgb, vec3(0.299, 0.587, 0.114));
  float ml = dot(texture(colorTexture, uv + vec2(-texel.x,     0.0)).rgb, vec3(0.299, 0.587, 0.114));
  float mr = dot(texture(colorTexture, uv + vec2( texel.x,     0.0)).rgb, vec3(0.299, 0.587, 0.114));
  float bl = dot(texture(colorTexture, uv + vec2(-texel.x, -texel.y)).rgb, vec3(0.299, 0.587, 0.114));
  float bm = dot(texture(colorTexture, uv + vec2(    0.0,  -texel.y)).rgb, vec3(0.299, 0.587, 0.114));
  float br = dot(texture(colorTexture, uv + vec2( texel.x, -texel.y)).rgb, vec3(0.299, 0.587, 0.114));

  // Sobel operators
  float gx = -tl - 2.0*ml - bl + tr + 2.0*mr + br;
  float gy = -tl - 2.0*tm - tr + bl + 2.0*bm + br;
  float edge = sqrt(gx*gx + gy*gy);
  edge = clamp(edge * 3.0, 0.0, 1.0);

  // Base color with enhanced contrast
  vec4 color = texture(colorTexture, uv);
  vec3 base = color.rgb;
  base = pow(base, vec3(1.3));            // contrast boost
  base = clamp(base * 1.1, 0.0, 1.0);

  // Purple/magenta tint
  vec3 tinted = vec3(
    base.r * 0.85 + base.b * 0.15,
    base.g * 0.7,
    base.b * 0.85 + base.r * 0.2
  );

  // Overlay edges in bright cyan/magenta
  vec3 edgeColor = vec3(0.4, 0.9, 1.0) * edge * intensity;
  tinted += edgeColor;

  // Grid / scanline overlay
  float gridX = step(0.98, fract(uv.x * resolution.x / 4.0));
  float gridY = step(0.98, fract(uv.y * resolution.y / 4.0));
  float grid = max(gridX, gridY) * 0.08 * intensity;
  tinted += vec3(grid * 0.3, grid * 0.6, grid * 0.9);

  // Subtle horizontal scanlines
  float scanline = sin(uv.y * resolution.y * 1.0) * 0.5 + 0.5;
  scanline = pow(scanline, 4.0) * 0.06 * intensity;
  tinted -= vec3(scanline);

  tinted = clamp(tinted, 0.0, 1.0);

  out_FragColor = vec4(tinted, 1.0);
}
`;
