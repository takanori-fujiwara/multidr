import {
  percentColToD3Rgb,
  pallette
} from './colors.js';

import {
  setCategoryLegend
} from './d3_utils.js';

export const setEventLisners = (renderingDataObj) => {
  let setLassoLabel = genSetLassoLabel();

  // kill default right click
  renderingDataObj.canvas.addEventListener("contextmenu", event => {
    event.preventDefault();
  }, false);

  renderingDataObj.canvas.addEventListener('wheel', event => {
    renderingDataObj.eventHandlers.wheel(event);
  }, false);

  renderingDataObj.canvas.addEventListener('mousedown', event => {
      const mouseDownPos = {
        x: event.clientX,
        y: event.clientY
      };
      const lassoVertices = [];

      if (event.which === 1) { // left down
        renderingDataObj.eventHandlers.leftDown(event);

        // assign left move event
        renderingDataObj.canvas.onmousemove = e =>
          renderingDataObj.eventHandlers.leftMove(e, lassoVertices);
      } else if (event.which === 3) { // right down
        // assign right move event
        renderingDataObj.canvas.onmousemove = e =>
          renderingDataObj.eventHandlers.rightMove(e, mouseDownPos);
      }
    },
    false);

  renderingDataObj.canvas.addEventListener('mouseup', event => {
    // remove mouse move events
    renderingDataObj.canvas.onmousemove = null;

    if (renderingDataObj.lassoVertices.length > 6) {
      setLassoLabel({
        x: event.clientX,
        y: event.clientY
      });
    }
    renderingDataObj.eventHandlers.leftUp(event);
  }, false);
}

export const setLegend = nClusters => {
  const legends = [];
  for (let i = 0; i < nClusters; ++i) {
    legends.push({
      text: `Cluster ${i+1}`,
      fill: percentColToD3Rgb(pallette[i]),
      stroke: '#444444'
    });
  }
  legends.push({
    text: `Unselected`,
    fill: percentColToD3Rgb(pallette[9]),
    stroke: '#444444'
  });
  setCategoryLegend(`#dr_legend`, legends, '*');
}

export const genSetLassoLabel = () => {
  let currentLabel = 1;

  let setLassoLabel = (pos) => {
    const labelSize = 20;

    const labelSvg = d3.select('#tsne_view').append('svg')
      .attr('class', 'lasso_label')
      .style('top', pos.y - labelSize)
      .style('left', pos.x - labelSize)
      .style('width', labelSize)
      .style('height', labelSize);

    const labelArea = labelSvg.append('g')

    labelArea.append('circle')
      .attr('r', labelSize / 2 - 1)
      .attr('cx', labelSize / 2)
      .attr('cy', labelSize / 2)
      .attr('stroke-width', 1)
      .attr('stroke', '#444444')
      .style('fill', '#ffffff')
      .style('fill-opacity', 0.8);
    labelArea.append('text')
      .attr('x', labelSize / 2)
      .attr('y', labelSize / 2)
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'central')
      .text(currentLabel)
      .style('font-size', 15)
      .style('fill', '#444444');

    currentLabel++;
  }

  return setLassoLabel;
}