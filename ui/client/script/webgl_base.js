import {
  screenToWorld,
  toTransformMat
} from './webgl_utils.js';

export const initCanvas = canvasId => {
  const canvas = document.getElementById(canvasId);
  // const devicePixelRatio = window.devicePixelRatio || 1;
  const devicePixelRatio = 2;
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;

  return canvas;
}

export const initGl = canvas => {
  const gl = canvas.getContext('experimental-webgl', {
    alpha: true
  });

  if (gl) {
    var ext = gl.getExtension('OES_element_index_uint');
    ext = gl.getExtension('OES_standard_derivatives');
  }

  gl.enable(gl.BLEND);
  gl.viewport(0, 0, canvas.width, canvas.height);

  return gl
}

const initPointShaders = (gl, vertShaderCode, fragShaderCode) => {
  const vertShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertShader, vertShaderCode);
  gl.compileShader(vertShader);

  const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragShader, fragShaderCode);
  gl.compileShader(fragShader);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertShader);
  gl.attachShader(shaderProgram, fragShader);
  gl.linkProgram(shaderProgram);
  gl.useProgram(shaderProgram);

  return {
    program: shaderProgram,
    attrib: {
      position: gl.getAttribLocation(shaderProgram, 'aPosition'),
      color: gl.getAttribLocation(shaderProgram, 'aColor'),
      opacity: gl.getAttribLocation(shaderProgram, 'aOpacity'),
      outerRingColor: gl.getAttribLocation(shaderProgram, 'aOuterRingColor'),
      outerRingOpacity: gl.getAttribLocation(shaderProgram, 'aOuterRingOpacity'),
      size: gl.getAttribLocation(shaderProgram, 'aSize'),
      shape: gl.getAttribLocation(shaderProgram, 'aShape')
    },
    uniform: {
      transform: gl.getUniformLocation(shaderProgram, 'uTransform'),
      pointSizeMin: gl.getUniformLocation(shaderProgram, 'uPointSizeMin'),
      pointSizeMax: gl.getUniformLocation(shaderProgram, 'uPointSizeMax'),
      pointSizePow: gl.getUniformLocation(shaderProgram, 'uPointSizePow')
    }
  };
}

const initLineShaders = (gl, vertShaderCode, fragShaderCode) => {
  const vertShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertShader, vertShaderCode);
  gl.compileShader(vertShader);

  const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragShader, fragShaderCode);
  gl.compileShader(fragShader);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertShader);
  gl.attachShader(shaderProgram, fragShader);
  gl.linkProgram(shaderProgram);
  gl.useProgram(shaderProgram);

  return {
    program: shaderProgram,
    attrib: {
      position: gl.getAttribLocation(shaderProgram, 'aPosition'),
      color: gl.getAttribLocation(shaderProgram, 'aColor'),
      opacity: gl.getAttribLocation(shaderProgram, 'aOpacity'),
    },
    uniform: {
      transform: gl.getUniformLocation(shaderProgram, 'uTransform')
    }
  };
}

const initLassoShaders = (gl, vertShaderCode, fragShaderCode) => {
  const vertShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertShader, vertShaderCode);
  gl.compileShader(vertShader);

  const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragShader, fragShaderCode);
  gl.compileShader(fragShader);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertShader);
  gl.attachShader(shaderProgram, fragShader);
  gl.linkProgram(shaderProgram);
  gl.useProgram(shaderProgram);

  return {
    program: shaderProgram,
    attrib: {
      position: gl.getAttribLocation(shaderProgram, 'aPosition')
    },
    uniform: {
      transform: gl.getUniformLocation(shaderProgram, 'uTransform')
    }
  };
}

const bindBuffer = (gl, data) => {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  return buffer;
}

const bufferToAttrib = (gl, shader, attribUnitSize, attribName) => {
  gl.enableVertexAttribArray(shader.attrib[attribName]);
  gl.vertexAttribPointer(
    shader.attrib[attribName], // index
    attribUnitSize, // size
    gl.FLOAT, // type
    false, // normalized
    0, // stride
    0 // offset
  );
}

const setAttrib = (gl, shader, data, attribUnitSize, attribName) => {
  bindBuffer(gl, data);
  bufferToAttrib(gl, shader, attribUnitSize, attribName);
}

export const clearCanvas = gl => {
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
}

const updatePointSizeSetting =
  (gl, shader, pointSizeMin, pointSizeMax, pointSizePow) => {
    gl.uniform1f(shader.uniform.pointSizeMin, pointSizeMin);
    gl.uniform1f(shader.uniform.pointSizeMax, pointSizeMax);
    gl.uniform1f(shader.uniform.pointSizePow, pointSizePow);
  }

// TODO: make these functions more generic
export const genDrawPointsFunc = (gl, pointVsCode, pointFsCode, vertices, sizes, colors, opacities, ourterRingColors, outerRingOpacities, shapes) => {
  let draw = transform => {
    const shader = initPointShaders(gl, pointVsCode, pointFsCode);
    setAttrib(gl, shader, new Float32Array(vertices), 2, 'position');
    setAttrib(gl, shader, new Float32Array(sizes), 1, 'size');
    setAttrib(gl, shader, new Float32Array(colors), 3, 'color');
    setAttrib(gl, shader, new Float32Array(opacities), 1, 'opacity');
    setAttrib(gl, shader, new Float32Array(ourterRingColors), 3, 'outerRingColor');
    setAttrib(gl, shader, new Float32Array(outerRingOpacities), 1, 'outerRingOpacity');
    setAttrib(gl, shader, new Float32Array(shapes), 1, 'shape');
    updatePointSizeSetting(gl, shader, 2.0, 4.0, 1.0);

    gl.uniformMatrix4fv(shader.uniform.transform, false, transform);
    gl.drawArrays(gl.POINTS, 0, vertices.length / 2);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  return draw;
}

export const genDrawLinesFunc = (gl, lineVsCode, lineFsCode, vertices, colors, opacities) => {
  let draw = transform => {
    const shader = initLineShaders(gl, lineVsCode, lineFsCode);
    setAttrib(gl, shader, new Float32Array(vertices), 2, 'position');
    setAttrib(gl, shader, new Float32Array(colors), 3, 'color');
    setAttrib(gl, shader, new Float32Array(opacities), 1, 'opacity');
    gl.uniformMatrix4fv(shader.uniform.transform, false, transform);
    gl.drawArrays(gl.LINES, 0, vertices.length / 2);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  return draw;
}

export const genDrawLassoFunc = (gl, lassoVsCode, lassoFsCode, vertices) => {
  let draw = transform => {
    if (vertices.length > 0) {
      const shader = initLassoShaders(gl, lassoVsCode, lassoFsCode);
      setAttrib(gl, shader, new Float32Array(vertices), 2, 'position');
      gl.uniformMatrix4fv(shader.uniform.transform, false, transform);
      // gl.drawArrays(gl.LINE_STRIP, 0, vertices.length / 2);
      gl.drawArrays(gl.LINES, 0, vertices.length / 2);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
  }

  return draw;
}

export const genZoomFunc = (renderingDataObj, sensitiveness) => {
  let zoom = event => {
    if (event.deltaY > 0) {
      renderingDataObj.scale.x *= (1.00 + sensitiveness);
      renderingDataObj.scale.y *= (1.00 + sensitiveness);
    } else if (event.deltaY < 0) {
      renderingDataObj.scale.x *= (1.00 - sensitiveness);
      renderingDataObj.scale.y *= (1.00 - sensitiveness);
    }

    for (const [i, val] of toTransformMat(
        renderingDataObj.translate,
        renderingDataObj.rotate,
        renderingDataObj.scale).entries()) {
      renderingDataObj.transform[i] = val;
    }
  }

  return zoom;
}

export const genTranslateFunc = (renderingDataObj, sensitiveness) => {
  let mouseMovePos = {
    x: null,
    y: null
  };

  let pan = (event, initMouseMovePos) => {
    mouseMovePos = initMouseMovePos;

    renderingDataObj.translate.x += sensitiveness * (event.clientX - mouseMovePos.x);
    renderingDataObj.translate.y -= sensitiveness * (event.clientY - mouseMovePos.y);
    for (const [i, val] of toTransformMat(
        renderingDataObj.translate,
        renderingDataObj.rotate,
        renderingDataObj.scale).entries()) {
      renderingDataObj.transform[i] = val;
    }

    mouseMovePos.x = event.clientX;
    mouseMovePos.y = event.clientY;
  }

  return pan;
}

export const genRotateFunc = (renderingDataObj, boundingRect) => {
  let tilt = (event, mouseStartPos) => {
    const x1 = mouseStartPos.x / boundingRect.width;
    const x2 = event.x / boundingRect.width;
    const y1 = (boundingRect.top - mouseStartPos.y) / boundingRect.height;
    const y2 = (boundingRect.top - event.y) / boundingRect.height;
    const dx = x2 - x1 === 0 ? Number.MIN_VALUE : x2 - x1;
    const dy = y2 - y1;

    renderingDataObj.rotate -= Math.atan(dy / dx);
    for (const [i, val] of toTransformMat(
        renderingDataObj.translate,
        renderingDataObj.rotate,
        renderingDataObj.scale).entries()) {
      renderingDataObj.transform[i] = val;
    }
  }

  return tilt;
}

export const genLassoFunc = (renderingData) => {
  let lasso = (event, initLassoVertices) => {
    renderingData.lassoVertices = initLassoVertices;
    const rect = renderingData.canvas.getBoundingClientRect();
    const worldPos = screenToWorld({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      },
      renderingData.canvas.clientWidth,
      renderingData.canvas.clientHeight,
      renderingData.transform);
    if (renderingData.lassoVertices.length >= 4) {
      const prevX =
        renderingData.lassoVertices[renderingData.lassoVertices.length - 2];
      const prevY =
        renderingData.lassoVertices[renderingData.lassoVertices.length - 1];
      renderingData.lassoVertices.push(prevX);
      renderingData.lassoVertices.push(prevY);
    }
    renderingData.lassoVertices.push(worldPos.x);
    renderingData.lassoVertices.push(worldPos.y);
    renderingData.renderers.lasso = genDrawLassoFunc(
      renderingData.gl,
      renderingData.shaders.lasso.v,
      renderingData.shaders.lasso.f,
      renderingData.lassoVertices);
  }

  return lasso;
}

export const genCloseLassoFunc = (renderingData) => {
  let closeLasso = (event) => {
    const prevX =
      renderingData.lassoVertices[renderingData.lassoVertices.length - 2];
    const prevY =
      renderingData.lassoVertices[renderingData.lassoVertices.length - 1];

    renderingData.lassoVertices.push(prevX);
    renderingData.lassoVertices.push(prevY);
    renderingData.lassoVertices.push(renderingData.lassoVertices[0]);
    renderingData.lassoVertices.push(renderingData.lassoVertices[1]);
  }
  return closeLasso;
}