import {
  colormap,
  percentColToD3Rgb
} from './colors.js';

export const calcContainerWidth = name => +d3.select(name).style('width').slice(0, -2)
export const calcContainerHeight = name => +d3.select(name).style('height').slice(0, -2)
const calcCellWidth = (width, colNames) => width / colNames.length;
const calcCellHeight = (height, rowNames) => height / rowNames.length;
export const calcCellSize = (width, height, colNames, rowNames, widthMax, heightMax) => [Math.min(calcCellWidth(width, colNames), widthMax), Math.min(calcCellHeight(height, rowNames), heightMax)];

export const prepareSvgArea = (windowWidth, windowHeight, margin) => {
  return {
    width: windowWidth - margin.left - margin.right,
    height: windowHeight - margin.top - margin.bottom,
    margin: margin
  }
}

export const prepareSvg = (id, svgArea) => {
  d3.select(id).selectAll('*').remove();
  const svg = d3.select(id)
    .append('svg')
    .attr('width', svgArea.width + svgArea.margin.left + svgArea.margin.right)
    .attr('height', svgArea.height + svgArea.margin.top + svgArea.margin.bottom)
    .append('g')
    .attr('transform',
      'translate(' + svgArea.margin.left + ',' + svgArea.margin.top + ')');

  return svg;
}

export const genX = (data, svgArea, domain, mode, padding) => {
  if (domain === undefined) {
    domain = d3.extent(data);
  }
  if (padding === undefined) {
    padding = {
      left: 20,
      right: 20
    };
  }

  let scaler = d3.scaleLinear().domain(domain).range([padding.left, svgArea.width - padding.right]);
  if (mode === 't') {
    scaler = d3.scaleTime().domain(domain).range([padding.left, svgArea.width - padding.right]);
  } else if (mode === 'd') {
    const ordinalDomain = []
    for (let i = 0; i < data.length; ++i) {
      const chartAreaWidth = svgArea.width - padding.left - padding.right;
      if (data.length > 0) {
        ordinalDomain.push(padding.left + chartAreaWidth * i / (data.length - 1));
      } else {
        ordinalDomain.push(padding.left + chartAreaWidth * i);
      }
    }
    scaler = d3.scaleOrdinal(data).range(ordinalDomain);
  }

  return scaler;
}

export const genY = (data, svgArea, domain) => {
  if (domain === undefined) {
    domain = d3.extent(data);
  }
  return d3.scaleLinear()
    .domain(domain).nice()
    .range([svgArea.height, 0]);
}

export const genXAxis = (x, svgArea, ticks, tickFormat) => {
  if (ticks) {
    return g => g
      .attr('transform', `translate(0,${svgArea.height + 6.5})`)
      .attr('class', 'xaxis')
      .call(d3.axisBottom(x).ticks(10).tickSizeOuter(0).tickValues(ticks));
  } else {
    // tickFormat = d3.timeFormat("%b");
    return g => g
      .attr('transform', `translate(0,${svgArea.height + 6.5})`)
      .attr('class', 'xaxis')
      .call(d3.axisBottom(x).ticks(10).tickSizeOuter(0).tickFormat(tickFormat));
  }
}

export const genYAxis = (y, svgArea) => {
  return g => g
    .attr('class', 'yaxis')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".1f")));
}

export const cleanDatetime = (str) => {
  let result = str

  // remove milisec
  if (str.indexOf('.') >= 0) {
    result = result.substring(0, str.indexOf('.'));
  }

  // add seconds if not exists
  const indicesOfColon = [];
  for (let i = 0; i < str.length; i++) {
    if (str[i] === ':') indicesOfColon.push(i);
  }
  let nColons = indicesOfColon.length;
  while (nColons < 2) {
    result = result.concat(':00');
    nColons++;
  }

  // change other formats
  result = result.replace('T', ' ');
  result = result.split("/").join("-");

  return result;
};

// for legend
export const setCategoryLegend = (svgId, legends, shape) => {
  d3.select(svgId).selectAll('*').remove();

  if (!shape) {
    shape = '*';
  }
  const legendArea = d3.select(svgId).append('g');
  const areaHeight = calcContainerHeight(svgId);
  const nLegends = legends.length;
  for (const [i, legend] of legends.entries()) {
    if (shape === "*") {
      legendArea.append('circle')
        .attr('r', 5)
        .attr('cx', 8)
        .attr('cy', areaHeight - 10 - 15 * (nLegends - i))
        .style('fill', legend.fill);
    } else if (shape === "-") {
      legendArea.append('rect')
        .attr('width', 10)
        .attr('height', 2)
        .attr('x', 4)
        .attr('y', areaHeight - 10 - 15 * (nLegends - i))
        .style('fill', legend.fill);
    }
    legendArea.append('text')
      .attr('x', 16)
      .attr('y', areaHeight - 6 - 15 * (nLegends - i))
      .text(legend.text)
      .style('font-size', 10)
      .style('fill', '#444444');
  }
}

export const setColormapLegend = (svgId, colormapInfo, legendsInfo) => {
  d3.select(svgId).selectAll('*').remove();

  const svgW = calcContainerWidth(svgId);
  const svgH = calcContainerHeight(svgId);

  const colors = colormap[colormapInfo.key];
  const colormapH = 10;
  const colormapW = 100;
  const unitW = colormapW / colors.length;

  const legendArea = d3.select(svgId).append('g');
  legendArea
    .append('rect')
    .attr('x', 2)
    .attr('y', 3)
    .attr('width', svgW - 1)
    .attr('height', svgH - 5)
    .attr('stroke-width', 1)
    .attr('fill', '#555555')
    .attr('opacity', 0.1);

  legendArea.selectAll('rect')
    .data(colors)
    .enter()
    .append('rect')
    .attr('x', (d, idx) => {
      return 10 + idx * unitW
    })
    .attr('y', svgH - 25)
    .attr('width', unitW)
    .attr('height', colormapH)
    .attr('stroke-width', 1)
    .attr('stroke', d => percentColToD3Rgb(d))
    .attr('fill', d => percentColToD3Rgb(d));
  legendArea.append('text')
    .attr('x', 10 + colormapW / 2)
    .attr('y', svgH - 27)
    .attr('text-anchor', 'middle')
    .style('fill', '#444444')
    .style('font-size', 10)
    .text(colormapInfo.title);
  legendArea.append('text')
    .attr('x', 10)
    .attr('y', svgH - 5)
    .attr('text-anchor', 'middle')
    .style('fill', '#444444')
    .style('font-size', 10)
    .text('min');
  legendArea.append('text')
    .attr('x', colormapW)
    .attr('y', svgH - 5)
    .attr('text-anchor', 'left')
    .style('fill', '#444444')
    .style('font-size', 10)
    .text('max');

  const nLegends = legendsInfo.length;
  for (const [i, legend] of legendsInfo.entries()) {
    legendArea.append('circle')
      .attr('class', legend.classname)
      .attr('r', legend.size)
      .attr('cx', 13)
      .attr('cy', 35 - 9 - 15 * (nLegends - 1 - i) + legend.size / 2)
      .style('fill', legend.fill)
      .style('stroke', legend.stroke);
    legendArea.append('text')
      .attr('class', legend.classname)
      .attr('x', 21)
      .attr('y', 35 - 7 - 15 * (nLegends - 1 - i) + legend.size / 2)
      .text(legend.text)
      .style('font-size', 10)
      .style('fill', '#444444');
  }
}

export const setTitle = (svgId, title) => {
  d3.select(svgId).selectAll('*').remove();

  const svgW = calcContainerWidth(svgId);
  const svgH = calcContainerHeight(svgId);

  const titleArea = d3.select(svgId).append('g');
  titleArea
    .append('text')
    .attr('x', svgW / 2)
    .attr('y', svgH - 2)
    .attr('text-anchor', 'middle')
    .style('fill', '#444444')
    .style('font-size', 10)
    .text(title);
}