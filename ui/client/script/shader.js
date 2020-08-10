export const pointVsCode = `
  attribute vec2 aPosition;
  attribute vec3 aColor;
  attribute vec3 aOuterRingColor;
  attribute lowp float aSize;
  attribute lowp float aOpacity;
  attribute lowp float aOuterRingOpacity;
  attribute lowp float aShape;

  uniform mat4 uTransform;
  uniform float uPointSizeMin;
  uniform float uPointSizeMax;
  uniform float uPointSizePow;

  varying lowp vec4 vColor;
  varying lowp vec4 vOuterRingColor;
  varying lowp float vShape;

  void main(void) {
    float pointScale = 5.0;
    float devicePixelRatio = 2.0;

    gl_Position = uTransform * vec4(aPosition, 0.0, 1.0);
    gl_PointSize = aSize * pointScale * devicePixelRatio * 0.5;
    vColor = vec4(aColor, 1.0) * aOpacity;
    vOuterRingColor = vec4(aOuterRingColor, 1.0) * aOuterRingOpacity;
    vShape = aShape;
  }
`;

export const pointFsCode = `
  #extension GL_OES_standard_derivatives : enable
  precision mediump float;
  varying lowp vec4 vColor;
  varying lowp vec4 vOuterRingColor;
  varying lowp float vShape;

  void main(void) {
    float filteredOut = 0.0;
    float selected = 0.0;

    vec4 bkg_color = vec4(0.0, 0.0, 0.0, 0.0);
    vec4 base_color = vec4(max(vColor.x, vColor.x * 1.2 * filteredOut),
                          max(vColor.y, vColor.x * 1.2 * filteredOut),
                          max(vColor.z, vColor.x * 1.2 * filteredOut),
                          vColor.a * max(0.3, (1.0 - filteredOut)));
    // vec4 center_color = vec4(1.15 * max(vColor.x, vColor.x * 1.2 * filteredOut),
    //                          1.15 * max(vColor.y, vColor.y * 1.2 * filteredOut),
    //                          1.15 * max(vColor.z, vColor.z * 1.2 * filteredOut),
    //                          vColor.a * max(0.3, (1.0 - filteredOut)));
    // vec4 border_color = vec4(0.07 * selected,
    //                          0.41 * selected,
    //                          0.82 * selected,
    //                          vColor.a * max(0.3, (1.0 - filteredOut)));
    vec4 center_color = base_color;
    vec4 border_color = base_color;
    vec4 outer_ring_color = vec4(max(vOuterRingColor.x, filteredOut * 0.95),
                                max(vOuterRingColor.y, filteredOut * 0.95),
                                max(vOuterRingColor.z, filteredOut * 0.95),
                                vOuterRingColor.a * max(0.3, (1.0 - filteredOut)));


    // vec2 c = 2.0 * gl_PointCoord - 1.0;
    vec2 c = 2.0 / (vShape + 1.0) * gl_PointCoord - 1.0 / (vShape + 1.0);
    float r = dot(c, c);
    float delta = fwidth(r);

    float dist_light = length(c - vec2(-0.5, -0.5));
    vec4 sphere = mix(center_color, base_color, dist_light);

    // to change border size and background color size change 3.0, 2.0, and 1.5
    float alpha = 1.0 - smoothstep(1.0 - 0.3, 1.0, r * (2.0 + selected * 1.5));
    vec4 border = mix(border_color, sphere, alpha);

    alpha = 1.0 - smoothstep(1.0 - 0.3, 1.0, r * (1.6 - selected * 1.5));
    vec4 border2 = mix(outer_ring_color, border, alpha);

    alpha = 1.0 - smoothstep(1.0 - 0.3, 1.0, r);
    gl_FragColor = mix(bkg_color, border2, alpha);
  }
`;

// WebGL2 still does not support geometry shader
export const lineVsCode = `
    attribute vec2 aPosition;
    attribute vec3 aColor;
    attribute lowp float aOpacity;

    uniform mat4 uTransform;

    varying lowp vec4 vColor;
    void main(void) {
        gl_Position = uTransform * vec4(aPosition, 0.0, 1.0);
        vColor = vec4(aColor, 1.0) * aOpacity;
    }
`;

export const lineFsCode = `
    #extension GL_OES_standard_derivatives : enable
    precision mediump float;
    varying lowp vec4 vColor;

    void main(void) {
        gl_FragColor = vColor;
    }
`;

export const lassoVsCode = `
    attribute vec2 aPosition;
    uniform mat4 uTransform;
    void main(void) {
      gl_Position = uTransform * vec4(aPosition, 0.0, 1.0);
    }
`;

export const lassoFsCode = `
    void main(void) {
        gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
    }
`;

export const focusVsCode = `
    attribute vec2 aPosition;
    uniform mat4 uTransform;
    void main(void) {
      gl_Position = uTransform * vec4(aPosition, 0.0, 1.0);
    }
`;

export const focusFsCode = `
    void main(void) {
        gl_FragColor = vec4(0.0, 0.0, 0.8, 1.0);
    }
`;