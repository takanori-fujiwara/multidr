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

const rackIdToCoord = rackId => {
  const X = rackId.substring(0, 1).charCodeAt(0) - 97;
  const Y = parseInt(rackId.substring(1)) - 1;
  const YwithAisleMargin = Y + Math.floor(Y / 15) * 3;

  return {
    X: X,
    Y: YwithAisleMargin
  }
};


export const chart = (svgData, nClusters) => {
  svgData.svg.selectAll('*').remove();
  const svgArea = svgData.svgArea;
  const svg = svgData.svg.attr('viewBox', [0, 0, svgArea.width, svgArea.height]);

  const datum = svgData.data;

  const x = genX(datum.map(elm => rackIdToCoord(elm.rack).X), svgArea);
  const y = genY(datum.map(elm => rackIdToCoord(elm.rack).Y), svgArea);
  const xAxis = genXAxis(x, svgArea);
  const yAxis = genYAxis(y, svgArea);

  const unitW = svgArea.width / datum.reduce((maxVal, elm) => rackIdToCoord(elm.rack).X > maxVal ? rackIdToCoord(elm.rack).X : maxVal, 0);
  const unitH = svgArea.height / datum.reduce((maxVal, elm) => rackIdToCoord(elm.rack).Y > maxVal ? rackIdToCoord(elm.rack).Y : maxVal, 0);
  const unit = Math.min(unitW, unitH);

  svg.append('g')
    .selectAll('rect')
    .data(datum)
    .enter()
    .append('rect')
    .attr('width', unitW - 1)
    .attr('height', unitH)
    .attr('x', d => x(rackIdToCoord(d.rack).X) - unitW * 0.5)
    .attr('y', d => y(rackIdToCoord(d.rack).Y) - unitH * 0.5)
    .attr('stroke', '#444444')
    .attr('stroke-width', 0.5)
    .attr('stroke-opacity', 1.0)
    .attr('fill', d =>
      percentColToD3Rgb(pallette[d.group]))
    .attr('opacity', d => d.group === 9 ? 0.5 : 1.0)
    .on('mouseover', (d, i) => {
      svg.append('text')
        .attr('id', 'popup')
        .attr('x', x(rackIdToCoord(d.rack).X) - 10)
        .attr('y', y(rackIdToCoord(d.rack).Y) - 5)
        .text(`(x:${d.coord.x}, y:${d.coord.y}, a:${d.coord.a})`);
    })
    .on('mouseout', () => svg.select('#popup').remove());

  const strageRacks = [];
  for (let i = 10; i < 34; i++) {
    const alphabet = i.toString(36)
    for (const yText of ['03', '08', '13', '18', '23', '28', '33', '38', '43']) {
      strageRacks.push(alphabet + yText);
    }
  }
  svg.append('g')
    .selectAll('rect')
    .data(strageRacks)
    .enter()
    .append('rect')
    .attr('width', unitW - 1)
    .attr('height', unitH)
    .attr('x', d => x(rackIdToCoord(d).X) - unitW * 0.5)
    .attr('y', d => y(rackIdToCoord(d).Y) - unitH * 0.5)
    .attr('stroke', '#444444')
    .attr('stroke-width', 0.5)
    .attr('stroke-opacity', 1.0)
    .attr('fill', '#444444');

  svg.append('g')
    .selectAll('text')
    .data([...new Set(datum.map(elm => elm.rack.substring(0, 1) + '01'))])
    .enter()
    .append('text')
    .attr('x', d => x(rackIdToCoord(d).X))
    .attr('y', svgArea.height + 12)
    .text(d => d.substring(0, 1).toUpperCase())
    .style('text-anchor', 'middle')
    .attr('alignment-baseline', 'middle')
    .style('font-size', '9')
    .style('fill', '#444444');

  svg.append('g')
    .selectAll('text')
    .data([...new Set(datum.map(elm => 'a' + elm.rack.substring(1)))])
    .enter()
    .append('text')
    .attr('x', -15)
    .attr('y', d => y(rackIdToCoord(d).Y))
    .text(d => d.substring(1))
    .style('text-anchor', 'middle')
    .attr('alignment-baseline', 'middle')
    .style('font-size', '9')
    .style('fill', '#444444');

  svg.append('text')
    .attr('x', svgArea.width / 2)
    .attr('y', svgArea.height)
    .attr('dy', '2.6em')
    .style('text-anchor', 'middle')
    .text('X-coord');
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -svgArea.height / 2)
    .attr('dy', '-2.5em')
    .style('text-anchor', 'middle')
    .text('Y-coord');

  setCategoryLegend(`#info_view_legend`, [], '*');

  return svg.node();
}