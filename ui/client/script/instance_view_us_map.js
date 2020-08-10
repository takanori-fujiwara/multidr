import {
  pallette,
  colormap,
  percentColToD3Rgb,
  valToPercentColor
} from './colors.js';

import {
  usMap
} from './us_map.js';

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

export const chart = (svgData, nClusters) => {
  usMap.objects.lower48 = {
    type: "GeometryCollection",
    geometries: usMap.objects.states.geometries.filter(d => true)
  };
  const projection = d3.geoAlbersUsa().scale(1280).translate([480, 300]);
  const geopath = d3.geoPath();

  svgData.svg.selectAll('*').remove();
  const svgArea = svgData.svgArea;
  const svg = svgData.svg.attr('viewBox', [0, 0, svgArea.width, svgArea.height]);

  const datum = svgData.data;

  const x = genX(datum.map(elm => elm.coord.x + 1), svgArea);
  const y = genY(datum.map(elm => elm.coord.y + 1), svgArea);

  const maxX = datum.reduce((maxVal, elm) => elm.coord.x > maxVal ? elm.coord.x : maxVal, 0);
  const maxY = datum.reduce((maxVal, elm) => elm.coord.y > maxVal ? elm.coord.y : maxVal, 0);
  const unitW = svgArea.width / maxX
  const unitH = svgArea.height / maxY;

  svg.append("path")
    .datum(topojson.merge(usMap, usMap.objects.lower48.geometries))
    .attr("fill", "#eeeeee")
    .attr("d", geopath)
    .attr("transform", `translate(-40, 70) scale(0.4)`);
  svg.append("path")
    .datum(topojson.mesh(usMap, usMap.objects.lower48, (a, b) => a !== b))
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-linejoin", "round")
    .attr("d", geopath)
    .attr("transform", `translate(-40, 70) scale(0.4)`);

  svg.append('g')
    .selectAll('circle')
    .data(datum)
    .enter()
    .append('circle')
    .attr('cx', d => {
      return projection([d.coord.y, d.coord.x])[0]
    })
    .attr('cy', d => projection([d.coord.y, d.coord.x])[1])
    .attr('r', 8)
    .attr('fill', d =>
      percentColToD3Rgb(pallette[d.group]))
    .attr("transform", `translate(-40, 70) scale(0.4)`)
    .on('mouseover', (d, i) => {
      svg.append('text')
        .attr('id', 'popup')
        .attr('x', x(d.coord.x))
        .attr('y', y(d.coord.y) - 5)
        .text(`(x:${d.coord.x}, y:${d.coord.y})`);
    })
    .on('mouseout', () => svg.select('#popup').remove())

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