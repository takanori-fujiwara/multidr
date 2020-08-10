import {
  pallette,
  colormap,
  percentColToD3Rgb,
  valToPercentColor
} from './colors.js';

import {
  setCategoryLegend
} from './d3_utils.js';

export const chart = (svgData, nClusters) => {
  svgData.svg.selectAll('*').remove();
  const svgArea = svgData.svgArea;
  const svg = svgData.svg.attr('viewBox', [0, 0, svgArea.width, svgArea.height]);

  const datum = svgData.data;
  let row = 0;
  let currentGroup = 0;
  svg.append('g')
    .selectAll('text')
    .data(datum)
    .enter()
    .append('text')
    .attr('x', (d, i) => -28 + Math.floor(i / 20) * 100)
    .attr('y', (d, i) => (i % 20) * 15 + 15)
    .text(d => d.name)
    .style('font-size', '10')
    .style('fill', d => percentColToD3Rgb(pallette[d.group]));

  const legends = []
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
  setCategoryLegend(`#info_view_legend`, legends, '*');

  return svg.node();
}