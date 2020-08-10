import {
  pointVsCode,
  pointFsCode,
  lineVsCode,
  lineFsCode,
  lassoVsCode,
  lassoFsCode,
  focusVsCode,
  focusFsCode
} from './shader.js';

import {
  pallette
} from './colors.js';

//
// change websocket URL based on your environment
//
export const websocketUrl = `ws://localhost:9000`;

//
// Info from datasets
//
export const data = {
  instances: {},
  variables: {},
  timePoints: {},
  firstDrInfo: {},
  firstDr: 'First DR',
  secondDr: 'Second DR'
};

//
// Global State
//
export const state = {
  nGroups: 0,
  groupIndices: [],
  embType: undefined,
  embType2: undefined,
  instanceView: undefined,
  timeView: undefined,
  variableView: undefined
};

//
// WebSocket server
//
export const wsInfo = {
  ws: undefined,
  dataKey: undefined,
  messageActions: {
    addNewFcs: 0,
    getHistInfo: 1
  }
};

//
// Related to WebGL rendering
//
export const renderingDataTemplate = () => {
  return {
    // defaults
    defaultSize: 4, //2.5,
    defaultOpacity: 0.9,
    defaultOuterRingOpacity: 0.9,
    defaultShape: 0.0,
    defaultColor: pallette.gray,
    defaultOuterRingColor: [0.5, 0.5, 0.5],
    defaultWidth: 0.0,
    defaultLineOpacity: 0.5,
    defaultLineColor: pallette.gray,
    defaultTranslate: {
      x: 0.0,
      y: 0.0
    },
    defaultRotate: 0.0,
    defaultScale: {
      x: 0.9,
      y: 0.9
    },

    // data
    vertices: [0.0, 0.0],
    sizes: [0.0],
    colors: [0.0, 0.0, 0.0],
    opacities: [0.0],
    outerRingColors: [0.0, 0.0, 0.0],
    outerRingOpacities: [0.0],
    shapes: [0.0],
    lineVertices: [],
    lineColors: [],
    lineOpacities: [],
    lassoVertices: [],
    focusVertices: [],
    translate: {
      x: 0.0,
      y: 0.0
    },
    rotate: 0.0,
    scale: {
      x: 0.0,
      y: 0.0
    },
    transform: new Float32Array([
      1, 0, 0, 0, //
      0, 1, 0, 0, //
      0, 0, 1, 0, //
      0, 0, 0, 1 //
    ]),
    // renderer info
    canvas: undefined,
    gl: undefined,
    shaders: {
      focus: {
        v: focusVsCode,
        f: focusFsCode
      },
      lasso: {
        v: lassoVsCode,
        f: lassoFsCode
      },
      line: {
        v: lineVsCode,
        f: lineFsCode
      },
      point: {
        v: pointVsCode,
        f: pointFsCode
      },
    },
    renderers: {
      focus: () => {},
      lasso: () => {},
      line: () => {},
      point: () => {}
    },
    eventHandlers: {
      wheelSensitiveness: 0.05,
      wheel: () => {},
      leftDown: () => {},
      leftMove: () => {},
      leftUp: () => {},
      rightMoveSensitiveness: 0.002,
      rightMove: () => {},
      enter: () => {},
      out: () => {},
      click: () => {},
      shiftLeftUp: () => {}
    }
  }
};

export const renderingData = {
  drs: {}
};

export const svgDataTemplate = () => {
  return {
    domId: undefined,
    svg: undefined,
    svgArea: undefined,
    data: [],
    selectedX: undefined,
    selectedY: undefined
  }
};

export const svgData = {
  info: svgDataTemplate(),
  fc: svgDataTemplate(),
  fc2: svgDataTemplate(),
  hist: svgDataTemplate(),
  pc: svgDataTemplate(),
  pc2: svgDataTemplate()
}