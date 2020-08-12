import {
  pallette
}
from './colors.js';

import {
  insideLasso,
  toTransformMat,
  toInfoForDrawPoints,
  toInfoForDrawLines,
  toInfoForDrawFocus
} from './webgl_utils.js';

import {
  initCanvas,
  initGl,
  clearCanvas,
  genDrawPointsFunc,
  genDrawLinesFunc,
  genZoomFunc,
  genTranslateFunc,
  genRotateFunc,
  genLassoFunc,
  genCloseLassoFunc
} from './webgl_base.js';

import {
  prepareSvg,
  prepareSvgArea,
  calcContainerWidth,
  calcContainerHeight
} from './d3_utils.js';

import * as fcView from './fc_view.js';
import * as pcView from './pc_view.js';
import * as histView from './hist_view.js';
import * as instanceViewDefault from './instance_view_default.js';
import * as instanceViewHpcLog from './instance_view_hpc_log.js';
import * as instanceViewUsMap from './instance_view_us_map.js';
import * as instanceViewNetwork from './instance_view_network.js';
import * as variableViewDefault from './variable_view_default.js';
import * as timeViewDefault from './time_view_default.js';
import * as timeViewCalendar from './time_view_calendar.js';
import * as timeViewClock from './time_view_clock.js';
import * as drView from './dr_view.js';

const siViews = {
  'instance': {
    'default': instanceViewDefault,
    'map': instanceViewUsMap,
    'network': instanceViewNetwork,
    'hpcLog': instanceViewHpcLog
  },
  'variable': {
    'default': variableViewDefault,
  },
  'time': {
    'default': timeViewDefault,
    'clock': timeViewClock,
    'calendar': timeViewCalendar
  }
}

export const initModel = (model, instances, variables, timePoints, siViewInfo, firstDrInfo, websocketUrl, dataKey) => {
  model.data.instances = instances;
  model.data.variables = variables;
  model.data.timePoints = timePoints;
  model.data.firstDrInfo = firstDrInfo;
  model.wsInfo.ws = new WebSocket(websocketUrl);
  model.wsInfo.dataKey = dataKey;

  model.state.instanceView = siViews.instance.default;
  model.state.variableView = siViews.variable.default;
  model.state.timeView = siViews.time.default;
  if (siViewInfo) {
    if (siViewInfo.instance) {
      model.state.instanceView = siViews.instance[siViewInfo.instance];
    }
    if (siViewInfo.variable) {
      model.state.variableView = siViews.variable[siViewInfo.variable];
    }
    if (siViewInfo.time) {
      model.state.timeView = siViews.time[siViewInfo.time];
    }
  }

  // sort by id
  for (const key of ['instances', 'variables', 'timePoints']) {
    for (const drType of Object.keys(model.data[key])) {
      model.data[key][drType].sort((a, b) => {
        return a.n - b.n
      });
    }
  }

  // instance data to DR rendering data
  for (const key of ['instances', 'variables', 'timePoints']) {
    for (const drType of Object.keys(model.data[key])) {
      model.renderingData.drs[drType] = model.renderingDataTemplate();
      const r = model.renderingData.drs[drType];
      const inst = model.data[key][drType];

      r.vertices = inst.map(elm => elm.embPos).flat();
      r.sizes = inst.map(elm => elm.size || r.defaultSize);
      r.colors = inst.map(elm => elm.color || r.defaultColor).flat();
      r.opacities = inst.map(elm => elm.opacity || r.defaultOpacity);
      r.outerRingColors = inst.map(elm => elm.outerRingColor || r.defaultOuterRingColor).flat();
      r.outerRingOpacities = inst.map(elm => elm.outerRingOpacity || r.defaultOuterRingOpacity);
      r.shapes = inst.map(elm => elm.shape || r.defaultShape);

      r.translate = Object.assign({}, r.defaultTranslate);
      r.rotate = r.defaultRotate;
      r.scale = Object.assign({}, r.defaultScale);
      r.transform = toTransformMat(r.translate, r.rotate, r.scale);
    }
  }
}

export const initRendererInfo = (targetView, linkedViews, wsInfo, infoSvgData,
  fcSvgData, fcSvgData2, pcSvgData, pcSvgData2, histSvgData, state, modelData
) => {
  const rd = targetView.renderingData;

  rd.canvas = initCanvas(targetView.canvasId);
  rd.gl = initGl(rd.canvas);

  rd.renderers.point = genDrawPointsFunc(...toInfoForDrawPoints(rd));

  if (rd.lineVertices.length === 0) {
    rd.renderers.line = () => {};
  } else {
    rd.renderers.line = genDrawLinesFunc(...toInfoForDrawLines(rd));
  }

  if (targetView.embType === 'Z_n_dt' || targetView.embType === 'Z_n_td') {
    if (modelData.instances.Z_n_dt.length != infoSvgData.data.length) {
      infoSvgData.data.length = 0;
      for (const instance of modelData.instances.Z_n_dt) {
        instance['group'] = 9
        infoSvgData.data.push(instance);
      };
    }
    state.instanceView.chart(infoSvgData, state.nGroups);
    drView.setLegend(state.nGroups);
  } else if (targetView.embType === 'Z_d_nt' || targetView.embType === 'Z_d_tn') {
    if (modelData.variables.Z_d_nt.length != infoSvgData.data.length) {
      infoSvgData.data.length = 0;
      for (const variable of modelData.variables.Z_d_nt) {
        variable['group'] = 9
        infoSvgData.data.push(variable);
      };
    }
    state.variableView.chart(infoSvgData);
  } else if (targetView.embType === 'Z_t_nd' || targetView.embType === 'Z_t_dn') {
    if (modelData.timePoints.Z_t_nd.length != infoSvgData.data.length) {
      infoSvgData.data.length = 0;
      for (const timePoint of modelData.timePoints.Z_t_nd) {
        timePoint['group'] = 9;
        infoSvgData.data.push(timePoint);
      };
    }
    state.timeView.chart(infoSvgData);
  }

  // reset selected points
  const _resetSelectedPoints = () => {
    const nPoints = rd.colors.length / 3;
    for (let i = 0; i < nPoints; i++) {
      rd.colors[i * 3] = rd.defaultColor[0];
      rd.colors[i * 3 + 1] = rd.defaultColor[1];
      rd.colors[i * 3 + 2] = rd.defaultColor[2];
    }

    state.nGroups = 0;
    state.groupIndices.length = 0;
    fcSvgData.data.length = 0;
    fcSvgData2.data.length = 0;

    for (let i = 0; i < infoSvgData.data.length; i++) {
      infoSvgData.data[i].group = 9;
    }

    if (targetView.embType === 'Z_n_dt' || targetView.embType === 'Z_n_td') {
      state.instanceView.chart(infoSvgData, state.nGroups);
    } else if (targetView.embType === 'Z_d_nt' || targetView.embType === 'Z_d_tn') {
      state.variableView.chart(infoSvgData, state.nGroups);
    } else if (targetView.embType === 'Z_t_nd' || targetView.embType === 'Z_t_dn') {
      state.timeView.chart(infoSvgData, state.nGroups);
    }
    drView.setLegend(state.nGroups);
  };
  _resetSelectedPoints();

  // mouse events
  rd.eventHandlers.wheel = event => {
    genZoomFunc(rd,
      rd.eventHandlers.wheelSensitiveness)(event);
    render(rd);
  }
  rd.eventHandlers.rightMove = (event, initMousePos) => {
    genTranslateFunc(rd,
      rd.eventHandlers.rightMoveSensitiveness)(event, initMousePos);
    render(rd);
  }

  rd.eventHandlers.leftDown = event => {
    rd.lassoVertices.length = 0;
    rd.opacities = rd.opacities.map(elm => rd.defaultOpacity);
    rd.renderers.point = genDrawPointsFunc(...toInfoForDrawPoints(rd));
    render(rd); // probably not necessary
  };
  rd.eventHandlers.leftMove = (event, initMousePos) => {
    genLassoFunc(rd)(event, initMousePos);
    render(rd);
  }
  rd.eventHandlers.leftUp = event => {
    if (rd.lassoVertices.length > 6) { // 6 >= 0 is to avoid unnecessary selection
      genCloseLassoFunc(rd)(event);
      const selected = insideLasso(rd.vertices, rd.lassoVertices);
      const selectedIndices = selected.flatMap((elm, idx) => elm ? idx : []);

      if (selectedIndices.length === 0) {
        _resetSelectedPoints();
      }

      for (const idx of selectedIndices) {
        rd.colors[idx * 3] = pallette[state.nGroups][0];
        rd.colors[idx * 3 + 1] = pallette[state.nGroups][1];
        rd.colors[idx * 3 + 2] = pallette[state.nGroups][2];
      }

      if (selectedIndices.length > 0) {
        // handle websockets actions
        wsInfo.ws.send(JSON.stringify({
          action: wsInfo.messageActions.addNewFcs,
          content: {
            'dataKey': wsInfo.dataKey,
            'embType': targetView.embTypes[0],
            'embType2': targetView.embTypes[1],
            'selected': selected
          }
        }));

        for (const selectedIndex of selectedIndices) {
          infoSvgData.data[selectedIndex].group = state.nGroups;
        }

        state.nGroups++;

        if (targetView.embType === 'Z_n_dt' || targetView.embType === 'Z_n_td') {
          state.instanceView.chart(infoSvgData, state.nGroups);
        } else if (targetView.embType === 'Z_d_nt' || targetView.embType === 'Z_d_tn') {
          state.variableView.chart(infoSvgData, state.nGroups);
        } else if (targetView.embType === 'Z_t_nd' || targetView.embType === 'Z_t_dn') {
          state.timeView.chart(infoSvgData, state.nGroups);
        }
        drView.setLegend(state.nGroups);

        state.embType = targetView.embTypes[0];
        state.embType2 = targetView.embTypes[1];
      }
    }

    rd.renderers.line = genDrawLinesFunc(...toInfoForDrawLines(rd));
    rd.renderers.point = genDrawPointsFunc(...toInfoForDrawPoints(rd));
    render(rd);

    // handle linked views
    for (const linkedView of linkedViews) {
      const lrd = linkedView.renderingData;
      const targetKey = linkedView.linking.target;
      const sourceKey = linkedView.linking.source;

      if (lrd[targetKey].length === rd[sourceKey].length) {
        lrd[targetKey] = rd[sourceKey];
      } else if (lrd[targetKey].length > rd[sourceKey].length) {
        const ratio = lrd[targetKey].length / rd[sourceKey].length;
        for (let i = 0; i < rd[sourceKey].length; i++) {
          for (let j = 0; j < ratio; j++) {
            lrd[targetKey][i * ratio + j] = rd[sourceKey][i];
          }
        }
      } else {
        const ratio = rd[sourceKey].length / lrd[targetKey].length;
        for (let i = 0; i < lrd[targetKey].length; i++) {
          for (let j = 0; j < ratio; j++) {
            lrd[targetKey][i] = rd[sourceKey][i * ratio + j];
          }
        }
      }

      lrd.renderers.line = genDrawLinesFunc(...toInfoForDrawLines(lrd));
      lrd.renderers.point = genDrawPointsFunc(...toInfoForDrawPoints(lrd));
      render(lrd);
    }
  };

  // handle message from ws
  wsInfo.ws.onmessage = function(wsEvent) {
    const data = JSON.parse(wsEvent.data);

    if (data.action === wsInfo.messageActions.addNewFcs) {
      fcSvgData.data.push(data.content.fcs.map((elm, idx) => {
        return {
          x: idx,
          fc: elm
        }
      }));
      fcSvgData2.data.push(data.content.fcs2.map((elm, idx) => {
        return {
          x: idx,
          fc: elm
        }
      }));
      state.groupIndices.push(data.content.indices);

      const firstDrType = state.embType.substring(state.embType.length - 2, state.embType.length - 1);
      const firstDrType2 = state.embType2.substring(state.embType2.length - 2, state.embType2.length - 1);
      pcSvgData.data = modelData.firstDrInfo.components[firstDrType].map((elm, idx) => {
        return {
          x: idx,
          pc: elm
        }
      });
      pcSvgData2.data = modelData.firstDrInfo.components[firstDrType2].map((elm, idx) => {
        return {
          x: idx,
          pc: elm
        }
      });

      fcView.chart(fcSvgData, state.embType, state.groupIndices, wsInfo, modelData, state.nGroups);
      fcView.chart(fcSvgData2, state.embType2, state.groupIndices, wsInfo, modelData, state.nGroups);
      pcView.chart(pcSvgData, firstDrType, modelData);
      pcView.chart(pcSvgData2, firstDrType2, modelData);
    } else if (data.action === wsInfo.messageActions.getHistInfo) {
      histSvgData.data.length = 0;

      histSvgData.data.push({
        'relFreqs': data.content.relFreqs.background,
        'color': pallette.gray,
        'freqMax': data.content.freqMax,
        'nBins': data.content.nBins,
        'valMin': data.content.valMin,
        'valMax': data.content.valMax
      });

      for (const [idx, tgFreq] of data.content.relFreqs.targets.entries()) {
        histSvgData.data.push({
          'relFreqs': tgFreq,
          'color': pallette[idx],
          'freqMax': data.content.freqMax,
          'nBins': data.content.nBins,
          'valMin': data.content.valMin,
          'valMax': data.content.valMax
        });
      }

      const histViewW = 150;
      const histViewH = 150;
      histView.chart(
        histSvgData,
        data.content.embType,
        data.content.pos[0] + fcSvgData.svgArea.margin.left + 10 + 1,
        data.content.pos[1] - histViewH - 1,
        histViewW, histViewH);
    }
  };
}

export const initSvgInfo = (targetView, margin) => {
  const sd = targetView.svgData;
  const domId = targetView.domId;

  sd.svgArea = prepareSvgArea(
    calcContainerWidth(`#${domId}`),
    calcContainerHeight(`#${domId}`), margin || {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    })
  sd.svg = prepareSvg(`#${domId}`, sd.svgArea);
  sd.domId = targetView.domId;
}

//
// Render functions
//
export const render = (renderingDataObj) => {
  const keysInOrder = ['line', 'point', 'lasso', 'focus']
  clearCanvas(renderingDataObj.gl);
  for (const key of keysInOrder) {
    renderingDataObj.renderers[key](renderingDataObj.transform);
  }
};