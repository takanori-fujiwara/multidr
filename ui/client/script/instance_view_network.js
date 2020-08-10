import {
  pallette,
  colormap,
  percentColToD3Rgb,
  valToPercentColor
} from './colors.js';

import {
  setCategoryLegend
} from './d3_utils.js';

const genX = (data, svgArea, domain) => {
  if (domain === undefined) {
    domain = d3.extent(data);
  }
  return d3.scaleLinear()
    .domain(domain).nice()
    .range([0, svgArea.width]);
}

const genY = (data, svgArea, domain) => {
  if (domain === undefined) {
    domain = d3.extent(data);
  }
  return d3.scaleLinear()
    .domain(domain).nice()
    .range([svgArea.height, 0]);
}

const genW = (data, maxW, domain) => {
  if (domain === undefined) {
    domain = d3.extent(data);
  }
  return d3.scalePow().exponent(0.7)
    .domain(domain)
    .range([0, maxW]);
}

const genXAxis = (x, svgArea) => {
  return g => g
    .attr('transform', `translate(0,${svgArea.height + 6.5})`)
    .attr('class', 'xaxis')
    .call(d3.axisBottom(x).ticks(5).tickSizeOuter(0));
}

const genYAxis = (y, svgArea) => {
  return g => g
    .attr('class', 'yaxis')
    .call(d3.axisLeft(y).ticks(5));
}

export const chart = (svgData, nClusters) => {
  svgData.svg.selectAll('*').remove();
  const svgArea = svgData.svgArea;
  const svg = svgData.svg.attr('viewBox', [0, 0, svgArea.width, svgArea.height]);

  const datum = svgData.data;
  const x = genX(datum.map(elm => elm.coord.x), svgArea, [-1, 1]);
  const y = genY(datum.map(elm => elm.coord.y), svgArea, [-1, 1]);
  const w = genW(undefined, 1.0, [0, 100]);

  for (const dtm of datum) {
    const lineInfo = []
    for (let i = 0; i < dtm.linesX.length; i++) {
      lineInfo.push({
        'x2': dtm.linesX[i],
        'y2': dtm.linesY[i],
        'w': dtm.linesWeight[i]
      })
    }
    svg.append('g')
      .selectAll('line')
      .data(lineInfo)
      .enter()
      .append('line')
      .attr('x1', x(dtm.coord.x))
      .attr('y1', y(dtm.coord.y))
      .attr('x2', d => x(d.x2))
      .attr('y2', d => y(d.y2))
      .attr('stroke', '#888888')
      .attr('stroke-width', d => w(d.w))
      .attr('stroke-opacity', 0.5)
  }
  svg.append('g')
    .selectAll('circle')
    .data(datum)
    .enter()
    .append('circle')
    .attr('r', 4) // 4
    .attr('cx', d => x(d.coord.x))
    .attr('cy', d => y(d.coord.y))
    .attr('stroke', '#444444')
    .attr('stroke-width', 0.5)
    .attr('stroke-opacity', 1.0)
    .attr('fill', d =>
      percentColToD3Rgb(pallette[d.group]))
    .attr('opacity', 1.0)
    .on('mouseover', (d, i) => {
      svg.append('text')
        .attr('id', 'popup')
        .attr('x', x(d.coord.x) - 10)
        .attr('y', y(d.coord.y) - 5)
        .text(`x:${d.coord.x.toFixed(2)}, y:${d.coord.y.toFixed(2)}`);
    })
    .on('mouseout', () => svg.select('#popup').remove());

  setCategoryLegend(`#info_view_legend`, [], '*');

  return svg.node();
}