import {
  pallette,
  colormap,
  percentColToD3Rgb,
  valToPercentColor
} from './colors.js';


import {
  cleanDatetime,
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

const formatValue = d3.format("+.2%")
const formatClose = d3.format("$,.2f")
const formatDate = d3.utcFormat("%x")
const formatAbbrDay = d => "SMTWTFS" [d.getUTCDay()]
const formatDay = d3.timeFormat("%a");
const formatWeek = d3.timeFormat("%U");
const formatMonth = d3.timeFormat("%b");
const formatWeekOfMonth = d3.timeFormat("%b ")
const formatYear = d3.timeFormat("%Y");
const countDay = d => d.getUTCDay() === 0 ? d.getUTCDay() : (d.getUTCDay() + 6) % 7;

const firstDayOfWeekOfMonth = (d, dayOfWeek) => {
  if (!dayOfWeek) {
    dayOfWeek = 'Sun';
  }
  let result = 1;
  while (formatDay(new Date(formatYear(d), d.getMonth(), result)) !== dayOfWeek && result < 7) {
    result++;
  }
  return result;
};

const weekOfMonth = (d, baseDayOfWeek) => {
  if (!baseDayOfWeek) {
    baseDayOfWeek = 'Sun';
  }
  const firstDayOfWeek = firstDayOfWeekOfMonth(d, baseDayOfWeek)
  const result = 1 + Math.floor(Math.round((d - new Date(formatYear(d), d.getMonth(), firstDayOfWeek)) / 86400000) / 7);
  return firstDayOfWeek !== 1 ? result : result - 1;
}

export const chart = (svgData, nClusters) => {
  svgData.svg.selectAll('*').remove();
  const svgArea = svgData.svgArea;
  const svg = svgData.svg.attr('viewBox', [0, 0, svgArea.width, svgArea.height]);

  const datum = svgData.data;
  const dates = datum.map(elm => {
    return {
      date: d3.timeParse("%Y-%m-%d %H:%M:%S")(cleanDatetime(elm.time)),
      group: elm.group
    };
  });

  const height = 100;
  const cellSize = 11.5;
  // vertical
  // const x = d => d.getUTCDay() * cellSize + Math.floor(d.getMonth() / 3) * 80;
  // const y = d => (formatWeek(d) - Math.floor(d.getMonth() / 3) * 13) * cellSize + (d.getMonth() % 3) * (cellSize + 20);
  // horizontal
  const nMonthsInRow = 4
  const x = d => d.getUTCDay() * cellSize + d.getMonth() % nMonthsInRow * cellSize * 8;
  const y = d => weekOfMonth(d) * cellSize + Math.floor(d.getMonth() / nMonthsInRow) * (5 + 4) * cellSize;

  // prepare related calendar
  const relatedYear = dates[dates.length - 1].date.getFullYear();
  const relatedDates = d3.timeDay.range(new Date(relatedYear, 0, 1), new Date(relatedYear, 12, 30));
  svg.attr("transform", `translate(${10}, ${(svgArea.height / 4) - 30})`);
  svg.append('g')
    .selectAll('rect')
    .data(relatedDates)
    .enter().append('rect')
    .attr('class', 'calendar-cell')
    .attr('x', d => x(d))
    .attr('y', d => y(d))
    .attr('width', cellSize)
    .attr('height', cellSize)
    .style('fill', '#ffffff')
    .style('stroke', '#888888')
    .style('stroke-width', 1)
    .style('stroke-opacity', 1.0)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const weekNames = ['U', 'M', 'T', 'W', 'R', 'F', 'S']
  for (const [i, monthName] of monthNames.entries()) {
    const firstDate = new Date(relatedYear, i, 1);
    let firstDateOfSunday = new Date(relatedYear, i, firstDayOfWeekOfMonth(firstDate));
    if (firstDateOfSunday.getDate() === 1) {
      firstDateOfSunday.setDate(8);
    }
    const translateY = i < 12 ? -25 : -15;
    svg.append('g')
      .append('text')
      .attr('x', x(firstDateOfSunday))
      .attr('y', y(firstDateOfSunday) + translateY)
      .text(monthName);
    if (i < 12) {
      for (const [j, weekName] of weekNames.entries()) {
        const date = new Date(relatedYear, i, firstDateOfSunday.getDate() + j);
        svg.append('g')
          .append('text')
          .attr('x', x(date) + cellSize * 0.5)
          .attr('y', y(date) + translateY + 12)
          .text(weekName)
          .attr('text-anchor', 'middle')
          .style('font-size', '9')
          .style('fill', '#888888');
      }
    }
  }

  for (const date of dates) {
    const relatedMonth = date.date.getMonth()
    const relatedFirstDayOfWeek = date.date.getDate() - date.date.getUTCDay();
    // TODO: something wrong here (I'm not sure why I need to add 2 instead of 1)
    const datesOfWeek =
      (date.date.getDate() > 24 && date.date.getMonth() == 11) ? 31 - date.date.getDate() + 2 : 7;
    const relatedDates = d3.timeDay.range(
      new Date(relatedYear, relatedMonth, relatedFirstDayOfWeek),
      new Date(relatedYear, relatedMonth, relatedFirstDayOfWeek + datesOfWeek));
    const group = date.group;

    svg.append('g')
      .selectAll('rect')
      .data(relatedDates)
      .enter().append('rect')
      .attr('class', 'calendar-cell')
      .attr('x', d => x(d))
      .attr('y', d => y(d))
      .attr('width', cellSize)
      .attr('height', cellSize)
      .style('fill', d => percentColToD3Rgb(pallette[group]))
      .style('opacity', 0.7)
      .style('stroke', '#888888')
      .style('stroke-width', 1)
      .style('stroke-opacity', 1.0)
    svg.append('g')
      .selectAll('text')
      .data(relatedDates)
      .enter().append('text')
      .attr('class', 'calendar-cell-date')
      .attr('x', d => x(d) + cellSize * 0.5)
      .attr('y', d => y(d) + cellSize * 0.5 + 1)
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .text(d => d.getDate())
      .style('font-size', '7')
      .style('fill', '#444444')
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