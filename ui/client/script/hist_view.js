import {
  pallette,
  percentColToD3Rgb
} from './colors.js';

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
  return d3.scalePow().exponent(1.0)
    .domain(domain).nice()
    .range([svgArea.height, 0]);
}

const genXAxis = (x, svgArea) => {
  return g => g
    .attr('transform', `translate(0,${svgArea.height + 3})`)
    .attr('class', 'xaxis')
    .call(d3.axisBottom(x).ticks(2).tickSize(5).tickSizeOuter(0));
}

const genYAxis = (y, svgArea) => {
  return g => g
    .attr('class', 'yaxis')
    .call(d3.axisLeft(y).ticks(5).tickSize(2));
}

export const chart = (svgData, embType, offsetX, offsetY, w, h) => {
  svgData.svg.selectAll('*').remove();
  d3.select(`#${svgData.domId}`)
    .style('opacity', 1)
    .style('top', offsetY + "px")
    .style('left', offsetX + "px")
    .style('width', w + "px")
    .style('height', h + "px");

  const svgArea = svgData.svgArea;
  const svg = svgData.svg.attr('viewBox', [0, 0, svgArea.width, svgArea.height]);

  svg.append('path')
    .datum([{
      x: -svgArea.margin.left,
      y: svgArea.height + svgArea.margin.bottom
    }, {
      x: -5,
      y: svgArea.height + 10
    }])
    .attr('fill', 'none')
    .attr('stroke', '#555555')
    .attr('stroke-opacity', 0.95)
    .attr('stroke-width', 0.5)
    .attr('d', d3.line()
      .x(d => d.x)
      .y(d => d.y));
  svg.append('rect')
    .attr('x', -35)
    .attr('y', -svgArea.margin.top + 1)
    .attr('width', svgArea.width + svgArea.margin.right + 33 - 1)
    .attr('height', svgArea.height + svgArea.margin.top + 30 - 1)
    .style('fill', '#ffffff')
    .style('stroke', '#555555')
    .attr('stroke-opacity', 0.95)
    .attr('stroke-width', 0.5);

  const x = genX(undefined, svgArea, [svgData.data[0].valMin, svgData.data[0].valMax]);
  const xAxis = genXAxis(x, svgArea);
  const y = genY(undefined, svgArea, [0, svgData.data[0].freqMax]);
  const yAxis = genYAxis(y, svgArea);
  const unitW = svgArea.width / svgData.data[0].nBins;

  svg.append('g')
    .call(xAxis);
  svg.append('g')
    .call(yAxis);

  let xLabel = '';
  if (embType === 'Y_n_dt' || embType === 'Y_t_dn') {
    xLabel = 'variable PC value';
  } else if (embType === 'Y_d_nt' || embType === 'Y_t_nd') {
    xLabel = 'instance PC value';
  } else if (embType === 'Y_n_td' || embType === 'Y_d_tn') {
    xLabel = 'time step PC value';
  }

  svg.append('text')
    .attr('x', svgArea.width / 2)
    .attr('y', svgArea.height)
    .attr('dy', '2.5em')
    .style('text-anchor', 'middle')
    .text(xLabel);
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -svgArea.height / 2)
    .attr('dy', '-2.3em')
    .style('text-anchor', 'middle')
    .text('relative frequency');

  for (const [groupIdx, datum] of svgData.data.entries()) {
    // outline histogram
    const histOutLine = datum.relFreqs.reduce((acc, d, i) => {
      return acc.concat([{
        x: i * unitW,
        y: y(d)
      }, {
        x: (i + 1) * unitW,
        y: y(d)
      }]);
    }, [{
      x: 0,
      y: y(0)
    }]).concat([{
      x: svgArea.width,
      y: y(0)
    }]);
    svg.append('path')
      .datum(histOutLine)
      .attr('fill', percentColToD3Rgb(datum.color))
      .attr('fill-opacity', 0.3)
      .attr('stroke', percentColToD3Rgb(datum.color))
      .attr('stroke-width', 1.0)
      .attr('stroke-opacity', 0.8)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', d3.line()
        .x(d => d.x)
        .y(d => d.y));
  }

  return svg.node();
}