import {
  pallette,
  colormap,
  percentColToD3Rgb,
  valToPercentColor
} from './colors.js';

import {
  setCategoryLegend
} from './d3_utils.js';

const toMinute = time => parseInt(time.slice(time.length - 2, time.length));
const toHour = time => parseInt(time.slice(time.length - 5, time.length - 3));
const toAngles = (time, interval = 5) => {
  const minute = toMinute(time);
  const hour = toHour(time);
  const totalMinute = (hour % 12) * 60 + minute;

  return {
    startAngle: (totalMinute - interval * 0.5) * 2.0 * Math.PI / 720,
    endAngle: (totalMinute + interval * 0.5) * 2.0 * Math.PI / 720
  };
}

export const chart = (svgData, nClusters) => {
  svgData.svg.selectAll('*').remove();
  const svgArea = svgData.svgArea;
  const svg = svgData.svg.attr('viewBox', [0, 0, svgArea.width, svgArea.height]);

  const datum = svgData.data;

  const arc = d3.arc()
    .innerRadius(svgArea.height / 4 - 30)
    .outerRadius(svgArea.height / 4 - 10);

  // AM clock
  svg.append('g')
    .append('path')
    .datum({
      startAngle: 0,
      endAngle: 2.0 * Math.PI
    })
    .style('fill', '#ffffff')
    .attr('d', arc)
    .attr("transform", "translate(" + svgArea.width / 2 + "," + (svgArea.height / 4 + 20) + ")");
  for (const hour of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0]) {
    svg.append('g')
      .append('text')
      .attr('x', (svgArea.height / 4 - 3) * Math.sin(hour * Math.PI / 6))
      .attr('y', -(svgArea.height / 4 - 3) * Math.cos(hour * Math.PI / 6))
      .text(hour)
      .attr("transform", "translate(" + (svgArea.width / 2 - 5) + "," + (svgArea.height / 4 + 22) + ")");
  }
  svg.append('g')
    .append('text')
    .attr('x', svgArea.width / 2 - svgArea.height / 4 - 30)
    .attr('y', svgArea.height / 4 + 22)
    .text('AM')

  // PM clock
  svg.append('g')
    .append('path')
    .datum({
      startAngle: 0,
      endAngle: 2.0 * Math.PI
    })
    .style('fill', '#ddd')
    .attr('d', arc)
    .attr("transform", "translate(" + svgArea.width / 2 + "," + (3 * svgArea.height / 4 + 40) + ")");
  for (const hour of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
    svg.append('g')
      .append('text')
      .attr('x', (svgArea.height / 4 - 3) * Math.sin(hour * Math.PI / 6))
      .attr('y', -(svgArea.height / 4 - 3) * Math.cos(hour * Math.PI / 6))
      .text(hour)
      .attr("transform", "translate(" + (svgArea.width / 2 - 5) + "," + (3 * svgArea.height / 4 + 42) + ")");
  }
  svg.append('g')
    .append('text')
    .attr('x', svgArea.width / 2 - svgArea.height / 4 - 30)
    .attr('y', (3 * svgArea.height / 4 + 40) + 2)
    .text('PM')

  for (const dat of datum) {
    if (toHour(dat.time) < 12) {
      svg.append('g')
        .append('path')
        .datum(toAngles(dat.time))
        .style('fill', percentColToD3Rgb(pallette[dat.group]))
        .attr('d', arc)
        .attr("transform", "translate(" + svgArea.width / 2 + "," + (svgArea.height / 4 + 20) + ")")
        .on('mouseover', () => {
          svg.append('text')
            .attr('id', 'popup')
            .attr('x', svgArea.width / 2 - 40)
            .attr('y', svgArea.height / 4 + 20)
            .style('vertical-align', 'middle')
            .style('text-align', 'center')
            .text(dat.time)
        })
        .on('mouseout', () => svg.select('#popup').remove());
    } else {
      svg.append('g')
        .append('path')
        .datum(toAngles(dat.time))
        .style('fill', percentColToD3Rgb(pallette[dat.group]))
        .attr('d', arc)
        .attr("transform", "translate(" + svgArea.width / 2 + "," + (3 * svgArea.height / 4 + 40) + ")")
        .on('mouseover', () => {
          svg.append('text')
            .attr('id', 'popup')
            .attr('x', svgArea.width / 2 - 40)
            .attr('y', 3 * svgArea.height / 4 + 40)
            .style('vertical-align', 'middle')
            .style('text-align', 'center')
            .text(dat.time)
        })
        .on('mouseout', () => svg.select('#popup').remove());
    }
  }

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