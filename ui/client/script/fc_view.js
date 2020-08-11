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

export const chart = (svgData, embType, groupIndices, wsInfo, modelData, nClusters) => {
  svgData.svg.selectAll('*').remove();
  const svgArea = svgData.svgArea;
  const svg = svgData.svg.attr('viewBox', [0, 0, svgArea.width, svgArea.height]);

  const secondDrType = embType.substring(embType.length - 1, embType.length);

  const data = svgData.data;
  let chartType = 'bar';
  if (secondDrType === 't' || data[0].length > 100) {
    chartType = 'line';
  }

  // TODO: clean this function
  const drawChart = (chartType) => {
    if (data.length > 0) {
      const datum = data[0];
      const xData =
        datum.map(d => secondDrType === 'd' ? (datum.length > 10 ? d.x : modelData.variables.Z_d_nt[d.x].name) :
          (secondDrType === 't' ? d3.timeParse("%Y-%m-%d %H:%M:%S")(cleanDatetime(modelData.timePoints.Z_t_dn[d.x].time)) :
            (secondDrType === 'n' ? d.x : d.x)));

      const x = genX(xData, svgArea, undefined, secondDrType);
      const xAxis = secondDrType === 'd' && datum.length <= 10 ?
        genXAxis(x, svgArea, datum.map(d => modelData.variables.Z_d_nt[d.x].name)) :
        genXAxis(x, svgArea);
      const y = genY(undefined, svgArea, [-1, 1]);
      const yAxis = genYAxis(y, svgArea);

      svg.append('g').attr('class', `chartContentFc_${embType}`)
        .call(xAxis)
        .selectAll("text")
        .attr("font-size", 10);
      svg.append('g').attr('class', `chartContentFc_${embType}`)
        .call(yAxis);

      const baseBarW = (svgArea.width - 60) / data[0].length > 30 ? 30 : (svgArea.width - 60) / datum.length;
      const circleR = (svgArea.width - 60) / data[0].length > 5 ? 5 : (svgArea.width - 60) / datum.length;

      for (const [idx, datum] of data.entries()) {
        const maxFc = Math.max(...(datum.map(elm => Math.abs(elm.fc))));
        const fcScaling = fc => fc / maxFc;

        // line chart
        if (chartType === 'line') {
          svg.append('path')
            .attr('class', `chartContentFc_${embType}`)
            .datum(datum)
            .attr('fill', 'none')
            .attr('stroke', percentColToD3Rgb(pallette[idx]))
            .attr('stroke-width', 2.0)
            .attr('stroke-opacity', 0.8)
            .attr('stroke-linejoin', 'round')
            .attr('stroke-linecap', 'round')
            .attr('d', d3.line()
              .x((d, i) => {
                return x(xData[i])
              })
              .y(d => y(fcScaling(d.fc))));
        } else {
          // bar chart
          const barW = baseBarW / data.length;
          const barXDelta = barW * (data.length - 1) * 0.5;
          svg.append('g')
            .selectAll('rect')
            .data(datum)
            .enter().append('rect')
            .attr('class', `chartContentFc_${embType}`)
            .attr('x', (d, i) => x(xData[i]) - barW * 0.5 - barXDelta + barW * idx)
            .attr('y', d => d.fc >= 0 ? y(fcScaling(d.fc)) : y(0))
            .attr('width', barW)
            .attr('height', d => d.fc >= 0 ?
              (y(0) - y(fcScaling(d.fc))) :
              (y(fcScaling(d.fc)) - y(0)))
            .style('fill', percentColToD3Rgb(pallette[idx]))
            .style('opacity', 0.8)
            .style('stroke', percentColToD3Rgb(pallette[idx]))
            .style('stroke-opacity', 0.8)
            .style('stroke-width', 0);
        }
      }

      svg.append('path').attr('class', `chartContentFc_${embType}`)
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

      const unitW = svgArea.width / data[0].length;
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
        .style('stroke-width', 1)
        .style('stroke-opacity', 0.0)
        .on('mouseover', function(d, i) {
          if (!svgData.selectedX) {
            d3.select(this).style('opacity', 0.3);
            svg.append('text')
              .attr('id', 'selected_name')
              .attr('x', x(xData[i]) + 10)
              .attr('y', svgArea.height)
              .text(() =>
                secondDrType === 'd' ? modelData.variables.Z_d_nt[i].name :
                (secondDrType === 't' ? cleanDatetime(modelData.timePoints.Z_t_dn[i].time) :
                  (secondDrType === 'n' ? JSON.stringify(modelData.instances.Z_n_dt[i].rack) : i)))
              .style('pointer-events', 'none');
            // handle websockets actions
            const bdRect = this.getBoundingClientRect();
            wsInfo.ws.send(JSON.stringify({
              action: wsInfo.messageActions.getHistInfo,
              content: {
                'dataKey': wsInfo.dataKey,
                'embType': embType,
                'groupRows': groupIndices,
                'selectedCol': d.x,
                'pos': [x(xData[i]) + d3.select(`#${svgData.domId}`).node().getBoundingClientRect().x - 10, y(1.5) + bdRect.y]
              }
            }));
          }
        })
        .on('mouseout', function() {
          if (!svgData.selectedX) {
            d3.select(this).style('opacity', 0);
            svg.select('#selected_name').remove();
          }
          d3.select('#hist_svg').style('opacity', 0);
        })
        .on('click', function(d) {
          if (!svgData.selectedX) {
            d3.select(this)
              .style('opacity', 0.3)
              .style('stroke-opacity', 0.5);
            svgData.selectedX = d.x;
          } else {
            d3.selectAll('.xSelectionArea')
              .style('opacity', 0)
              .style('stroke-opacity', 0.0);
            svgData.selectedX = null;
          }
        });

      let xLabel = '';
      if (secondDrType === 't') {
        xLabel = 'time';
      } else if (secondDrType === 'd') {
        xLabel = 'variable';
      } else if (secondDrType === 'n') {
        xLabel = 'instance'
      }
      svg.append('text')
        .attr('class', `chartContentFc_${embType}`)
        .attr('x', svgArea.width / 2)
        .attr('y', svgArea.height)
        .attr('dy', '3.2em')
        .style('text-anchor', 'middle')
        .text(xLabel);
      svg.append('text')
        .attr('class', `chartContentFc_${embType}`)
        .attr('transform', 'rotate(-90)')
        .attr('x', -svgArea.height / 2)
        .attr('dy', '-4em')
        .style('text-anchor', 'middle')
        .text('feature contribution');
    }
  };
  drawChart(chartType);

  const legends = []
  for (let i = 0; i < nClusters; ++i) {
    legends.push({
      text: `Cluster ${i+1}`,
      fill: percentColToD3Rgb(pallette[i]),
      stroke: '#444444'
    });
  }
  setCategoryLegend(`#fc_legend`, legends, '-');

  const switchChart = (d, i, o) => {
    chartType = chartType === 'bar' ? 'line' : 'bar';
    d3.selectAll(`.chartContentFc_${embType}`).remove();
    drawChart(chartType);
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

  return svg.node();
}