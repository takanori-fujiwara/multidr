import {
  pallette,
  percentColToD3Rgb
} from './colors.js';

import {
  genX,
  genY,
  genXAxis,
  genYAxis,
  cleanDatetime,
  setCategoryLegend
} from './d3_utils.js';

export const chart = (svgData, firstDrType, modelData) => {
  svgData.svg.selectAll('*').remove();
  const svgArea = svgData.svgArea;
  const svg = svgData.svg.attr('viewBox', [0, 0, svgArea.width, svgArea.height]);

  const datum = svgData.data;

  if (firstDrType === 'd') {
    datum.sort((a, b) => b.pc - a.pc);
  }

  const xData =
    datum.map(d => firstDrType === 'd' ? (datum.length > 10 ? d.x : modelData.variables.Y_d_nt[d.x].name) :
      (firstDrType === 't' ? d3.timeParse("%Y-%m-%d %H:%M:%S")(cleanDatetime(modelData.timePoints.Y_t_dn[d.x].time)) :
        (firstDrType === 'n' ? d.x : d.x)));

  const explainedVarRatio = Math.floor(modelData.firstDrInfo.explainedVarianceRatio[firstDrType] * 100) / 100;

  const x = genX(xData, svgArea, undefined, firstDrType);
  const xAxis = firstDrType === 'd' && datum.length <= 10 ?
    genXAxis(x, svgArea, datum.map(d => modelData.variables.Y_d_nt[d.x].name)) :
    genXAxis(x, svgArea);
  const yAbsMax = Math.max(...datum.map(elm => Math.abs(elm.pc)));
  const y = genY(undefined, svgArea, [-yAbsMax, yAbsMax]);
  const yAxis = genYAxis(y, svgArea);

  svg.append('g')
    .call(xAxis);
  svg.append('g')
    .call(yAxis);

  const unitW = (svgArea.width - 60) / datum.length > 30 ? 30 : (svgArea.width - 60) / datum.length;

  let chartType = 'bar';
  if (firstDrType === 't' || datum.length > 100) {
    chartType = 'line';
  }

  const drawChartContent = (chartType) => {
    if (chartType === 'line') {
      svg.append('path')
        .attr('class', `chartContentPc_${firstDrType}`)
        .datum(datum)
        .attr('fill', 'none')
        .attr('stroke', 'black')
        .attr('stroke-width', 2.0)
        .attr('stroke-opacity', 1.0)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('d', d3.line()
          .x((d, i) => x(xData[i]))
          .y(d => y(d.pc)));
      svg.append('g')
        .selectAll('circle')
        .data(datum)
        .enter().append('circle')
        .attr('class', `chartContentPc_${firstDrType}`)
        .attr('cx', (d, i) => x(xData[i]))
        .attr('cy', d => y(d.pc))
        .attr('r', 2)
        .style('fill', '#ffffff')
        .style('opacity', 1)
        .style('stroke', '#444444')
        .style('stroke-width', 1);
    } else {
      svg.append('g')
        .selectAll('rect')
        .data(datum)
        .enter().append('rect')
        .attr('class', `chartContentPc_${firstDrType}`)
        .attr('x', (d, i) => x(xData[i]) - unitW * 0.5)
        .attr('y', d => d.pc >= 0 ? y(d.pc) : y(0))
        .attr('width', unitW)
        .attr('height', d => d.pc >= 0 ? (y(0) - y(d.pc)) : (y(d.pc) - y(0)))
        .style('fill', '#444444')
        .style('opacity', 1);
    }
  };
  drawChartContent(chartType);

  svg.append('path')
    .datum([
      [xData[0], 0],
      [xData[xData.length - 1], 0]
    ])
    .attr('fill', 'none')
    .attr('stroke', 'black')
    .attr('stroke-width', 0.75)
    .attr('stroke-opacity', 1.0)
    .attr('stroke-linejoin', 'round')
    .attr('stroke-linecap', 'round')
    .attr('d', d3.line()
      .x(d => x(d[0]))
      .y(d => y(d[1])));

  svg.append('g')
    .selectAll('rect')
    .data(datum)
    .enter().append('rect')
    .attr('class', 'xSelectionArea')
    .attr('x', (d, i) => x(xData[i]) - unitW * 0.5)
    .attr('y', 0)
    .attr('width', unitW)
    .attr('height', svgArea.height)
    .style('fill', '#f6b7d2')
    .style('opacity', 0)
    .style('stroke', '#d42a2f')
    .style('stroke-width', 0)
    .on('mouseover', function(d, i) {
      if (!svgData.selectedX) {
        d3.select(this).style('opacity', 0.3);
        svg.append('text')
          .attr('id', 'selected_name')
          .attr('x', x(xData[i]) - unitW * 0.5)
          .text(() =>
            firstDrType === 'd' ? modelData.variables.Y_d_nt[d.x].name :
            (firstDrType === 't' ? cleanDatetime(modelData.timePoints.Y_t_dn[d.x].time) :
              (firstDrType === 'n' ? modelData.instances.Y_n_dt[d.x].name || JSON.stringify(modelData.instances.Y_n_dt[d.x].coord) : d.x)));
      }
    })
    .on('mouseout', function() {
      if (!svgData.selectedX) {
        d3.select(this).style('opacity', 0);
        svg.select('#selected_name').remove();
      }
    });

  let xLabel = '';
  if (firstDrType === 'n') {
    xLabel = 'instance';
  } else if (firstDrType === 'd') {
    xLabel = 'variable (sorted)';
  } else if (firstDrType === 't') {
    xLabel = 'time';
  }
  svg.append('text')
    .attr('x', svgArea.width / 2)
    .attr('y', svgArea.height)
    .attr('dy', '3.2em')
    .style('text-anchor', 'middle')
    .text(xLabel);
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -svgArea.height / 2)
    .attr('dy', '-4em')
    .style('text-anchor', 'middle')
    .text('weight');

  const switchChart = (d, i, o) => {
    chartType = chartType === 'bar' ? 'line' : 'bar';
    d3.selectAll(`.chartContentPc_${firstDrType}`).remove();
    drawChartContent(chartType);
  };

  svg.append('rect')
    .attr('class', 'scale y')
    .attr('x', -16 - 18)
    .attr('y', -18)
    .attr('rx', 3)
    .attr('ry', 3)
    .attr('width', 54)
    .attr('height', 12)
    .style('fill', '#FFFFFF')
    .style('stroke', '#888888')
    .style('cursor', 'pointer')
    .on('click', switchChart);
  svg.append('text')
    .attr('class', 'scale y')
    .attr('x', -7)
    .attr('y', -9)
    .style('text-anchor', 'middle')
    .style('font-size', 9)
    .style('fill', '#000000')
    .text(chartType === 'bar' ? 'to line chart' : 'to bar chart')
    .style('cursor', 'pointer')
    .on('click', switchChart);

  svg.append('text')
    .attr('class', 'scale y')
    .attr('x', svgArea.width - 85)
    .attr('y', -5)
    .style('text-anchor', 'middle')
    .style('font-size', 10)
    .style('fill', '#000000')
    .text(`Explained variance ratio: ${explainedVarRatio}`);

  return svg.node();
}