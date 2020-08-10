/* MODEL */
import * as m from './model.js';

/* UPDATE */
import * as u from './update.js';

/* VIEW */
import * as drView from './dr_view.js';

import {
  calcContainerWidth,
  calcContainerHeight
} from './d3_utils.js';


const genDrTitle = (firstDR, secondDR) => {
  return {
    'instance': {
      'left': `Instances\' similarities across time points:<br />\
    ${firstDR} along variables, then ${secondDR} along time points`,
      'right': `Instances\' similarities acorss variables:<br />\
    ${firstDR} along time points, then ${secondDR} along variables`
    },
    'variable': {
      'left': `Variables\' similarities across time points:<br />\
    ${firstDR} along instances, then ${secondDR} along time points`,
      'right': `Variables\' similarities across instances:<br />\
    ${firstDR} along time points, then ${secondDR} along instances`
    },
    'time': {
      'left': `Time points\' similarities across instances:<br />\
    ${firstDR} along variables, then ${secondDR} along instances`,
      'right': `Time points\' similarities across variables:<br />\
    ${firstDR} along instances, then ${secondDR} along variables`
    }
  };
}

const init = (dataKey, drType) => {
  //
  // change websocket URL based on your environment in model.js
  //
  const websocketUrl = m.websocketUrl;

  const drKey1 = drType === 'instance' ? 'Y_n_dt' : (drType === 'variable' ? 'Y_d_nt' : 'Y_t_dn');
  const drKey2 = drType === 'instance' ? 'Y_n_td' : (drType === 'variable' ? 'Y_d_tn' : 'Y_t_nd');

  fetch(`../data/${dataKey}.json`)
    .then(response => response.json())
    .then(d => {
      u.initModel(m, d.instances, d.variables, d.timePoints, d.siViewInfo, d.firstDrInfo, websocketUrl, dataKey);

      const drTitle = genDrTitle(m.data.firstDr, m.data.secondDr)[drType];
      document.querySelector('#dr_title1').innerHTML = drTitle.left;
      document.querySelector('#dr_title2').innerHTML = drTitle.right;

      u.initSvgInfo({
        'svgData': m.svgData.info,
        'domId': 'info_svg'
      }, {
        top: 20,
        right: 10,
        bottom: 50,
        left: 40
      });

      u.initSvgInfo({
        'svgData': m.svgData.fc,
        'domId': 'fc_svg_left'
      }, {
        top: 30,
        right: 10,
        bottom: 50,
        left: 55
      });

      u.initSvgInfo({
        'svgData': m.svgData.fc2,
        'domId': 'fc_svg_right'
      }, {
        top: 30,
        right: 10,
        bottom: 50,
        left: 55
      });

      u.initSvgInfo({
        'svgData': m.svgData.hist,
        'domId': 'hist_svg'
      }, {
        top: 10,
        right: 10,
        bottom: 40,
        left: 55
      });

      u.initSvgInfo({
        'svgData': m.svgData.pc,
        'domId': 'pc_svg_left'
      }, {
        top: 25,
        right: 10,
        bottom: 40,
        left: 55
      });

      u.initSvgInfo({
        'svgData': m.svgData.pc2,
        'domId': 'pc_svg_right'
      }, {
        top: 25,
        right: 10,
        bottom: 40,
        left: 55
      });

      u.initRendererInfo({
          'renderingData': m.renderingData.drs[drKey1],
          'canvasId': 'dr_canvas1',
          'embType': drKey1,
          'embTypes': [drKey1, drKey2]
        }, [{
          'renderingData': m.renderingData.drs[drKey2],
          'canvasId': 'dr_canvas2',
          'linking': {
            'source': 'colors',
            'target': 'colors'
          }
        }],
        m.wsInfo,
        m.svgData.info,
        m.svgData.fc,
        m.svgData.fc2,
        m.svgData.pc,
        m.svgData.pc2,
        m.svgData.hist,
        m.state,
        m.data);
      u.initRendererInfo({
          'renderingData': m.renderingData.drs[drKey2],
          'canvasId': 'dr_canvas2',
          'embType': drKey2,
          'embTypes': [drKey1, drKey2]
        }, [{
          'renderingData': m.renderingData.drs[drKey1],
          'canvasId': 'dr_canvas1',
          'linking': {
            'source': 'colors',
            'target': 'colors'
          }
        }],
        m.wsInfo,
        m.svgData.info,
        m.svgData.fc,
        m.svgData.fc2,
        m.svgData.pc,
        m.svgData.pc2,
        m.svgData.hist,
        m.state,
        m.data);

      u.render(m.renderingData.drs[drKey1]);
      u.render(m.renderingData.drs[drKey2]);

      drView.setEventLisners(m.renderingData.drs[drKey1]);
      drView.setEventLisners(m.renderingData.drs[drKey2]);
    });
}

fetch('../data/file_list.json')
  .then(response => response.json())
  .then(data => {
    for (const file of data.fileNames) {
      const option = document.createElement("option");
      option.text = file;
      option.value = file;
      document.querySelector('#file_selection').appendChild(option);
    }
    document.querySelector('#file_selection').value = data.fileNames[0];
    document.querySelector('#dr_type').value = 'instance';
    init(document.querySelector('#file_selection').value, 'instance');
  });

document.querySelector('#dr_type').onchange = () => {
  init(document.querySelector('#file_selection').value, document.querySelector('#dr_type').value);
};

document.querySelector('#file_selection').onchange = () => {
  init(document.querySelector('#file_selection').value, document.querySelector('#dr_type').value);
};

const updateViewWidths = (leftChecked, rightChecked) => {
  if (leftChecked && rightChecked) {
    document.querySelector('#fc_view_left').style.width = '45%';
    document.querySelector('#fc_view_right').style.width = '45%';
    document.querySelector('#pc_view_left').style.width = '45%';
    document.querySelector('#pc_view_right').style.width = '45%';
  } else if (leftChecked) {
    document.querySelector('#fc_view_left').style.width = '90%';
    document.querySelector('#fc_view_right').style.width = '0%';
    document.querySelector('#pc_view_left').style.width = '90%';
    document.querySelector('#pc_view_right').style.width = '0%';
  } else if (rightChecked) {
    document.querySelector('#fc_view_left').style.width = '0%';
    document.querySelector('#fc_view_right').style.width = '90%';
    document.querySelector('#pc_view_left').style.width = '0%';
    document.querySelector('#pc_view_right').style.width = '90%';
  } else {
    document.querySelector('#fc_view_left').style.width = '45%';
    document.querySelector('#fc_view_right').style.width = '45%';
    document.querySelector('#pc_view_left').style.width = '45%';
    document.querySelector('#pc_view_right').style.width = '45%';
  }
}

const fcViewSelectionChanged = () => {
  const leftChecked = document.querySelector('#checkbox_fc_view_left').checked;
  const rightChecked = document.querySelector('#checkbox_fc_view_right').checked;
  document.querySelector('#checkbox_pc_view_left').checked = leftChecked;
  document.querySelector('#checkbox_pc_view_right').checked = rightChecked;

  updateViewWidths(leftChecked, rightChecked);
  // TODO: need to update only chart width
  init(document.querySelector('#file_selection').value, document.querySelector('#dr_type').value);
};

const pcViewSelectionChanged = () => {
  const leftChecked = document.querySelector('#checkbox_pc_view_left').checked;
  const rightChecked = document.querySelector('#checkbox_pc_view_right').checked;
  document.querySelector('#checkbox_fc_view_left').checked = leftChecked;
  document.querySelector('#checkbox_fc_view_right').checked = rightChecked;

  updateViewWidths(leftChecked, rightChecked);
  // TODO: need to update only chart width
  init(document.querySelector('#file_selection').value, document.querySelector('#dr_type').value);
};

document.querySelector('#fc_view_selection').addEventListener('click', fcViewSelectionChanged, false);
document.querySelector('#pc_view_selection').addEventListener('click', pcViewSelectionChanged, false);