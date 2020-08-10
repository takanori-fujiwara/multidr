// TODO: change to functional way
const verticesToLinePolygons = (vertices, lineWidth) => {
  const polygons = [];
  for (let i = 0; i < vertices.length / 4; i++) {
    const x1 = vertices[i * 4 + 0];
    const y1 = vertices[i * 4 + 1];
    const x2 = vertices[i * 4 + 2];
    const y2 = vertices[i * 4 + 3];
    const x1x2 = x1 - x2;
    const y1y2 = y1 - y2;

    const d = Math.sqrt(x1x2 * x1x2 + y1y2 * y1y2);
    const unitNorm = d === 0 ? [1.0, 0.0] : [y1y2 / d, -x1x2 / d];

    polygons.push(x1 + 0.5 * lineWidth * unitNorm[0]);
    polygons.push(y1 + 0.5 * lineWidth * unitNorm[1]);
    polygons.push(x1 - 0.5 * lineWidth * unitNorm[0]);
    polygons.push(y1 - 0.5 * lineWidth * unitNorm[1]);
    polygons.push(x2 + 0.5 * lineWidth * unitNorm[0]);
    polygons.push(y2 + 0.5 * lineWidth * unitNorm[1]);

    polygons.push(x1 - 0.5 * lineWidth * unitNorm[0]);
    polygons.push(y1 - 0.5 * lineWidth * unitNorm[1]);
    polygons.push(x2 - 0.5 * lineWidth * unitNorm[0]);
    polygons.push(y2 - 0.5 * lineWidth * unitNorm[1]);
    polygons.push(x2 + 0.5 * lineWidth * unitNorm[0]);
    polygons.push(y2 + 0.5 * lineWidth * unitNorm[1]);
  }
  return polygons;
}

const verticesToVerticesWithArrows = (vertices, arrowWidth, arrowLength, strideRatio) => {
  const verticesWithArrows = [];
  for (let i = 0; i < vertices.length / 4; i++) {
    const x1 = vertices[i * 4 + 0];
    const y1 = vertices[i * 4 + 1];
    const x2 = vertices[i * 4 + 2];
    const y2 = vertices[i * 4 + 3];

    const x2x1 = x2 - x1;
    const y2y1 = y2 - y1;
    const d = Math.sqrt(x2x1 * x2x1 + y2y1 * y2y1);
    const unitNorm = d === 0 ? [1.0, 0.0] : [y2y1 / d, -x2x1 / d];
    const unitPara = d === 0 ? [1.0, 0.0] : [x2x1 / d, y2y1 / d];

    // line
    verticesWithArrows.push(x1);
    verticesWithArrows.push(y1);
    verticesWithArrows.push(x2);
    verticesWithArrows.push(y2);

    // arrow
    verticesWithArrows.push(x2 - d * strideRatio * unitPara[0]);
    verticesWithArrows.push(y2 - d * strideRatio * unitPara[1]);
    verticesWithArrows.push(x2 + 0.5 * arrowWidth * unitNorm[0] - (d * strideRatio + arrowLength) * unitPara[0]);
    verticesWithArrows.push(y2 + 0.5 * arrowWidth * unitNorm[1] - (d * strideRatio + arrowLength) * unitPara[1]);
    verticesWithArrows.push(x2 - d * strideRatio * unitPara[0]);
    verticesWithArrows.push(y2 - d * strideRatio * unitPara[1]);
    verticesWithArrows.push(x2 - 0.5 * arrowWidth * unitNorm[0] - (d * strideRatio + arrowLength) * unitPara[0]);
    verticesWithArrows.push(y2 - 0.5 * arrowWidth * unitNorm[1] - (d * strideRatio + arrowLength) * unitPara[1]);
  }
  return verticesWithArrows;
}

export const edgesToVertices = (edges, vertices) => {
  const vertexIndices = edges.map(elm => [elm.source, elm.target]).flat();
  const sourceTargetVertices = vertexIndices.map(elm => [vertices[elm * 2], vertices[elm * 2 + 1]]).flat();
  return sourceTargetVertices;
}

export const edgesToVerticesWithArrows = (edges, vertices, arrowWidth, arrowLength, strideRatio) => {
  const sourceTargetVertices = edgesToVertices(edges, vertices);
  return verticesToVerticesWithArrows(sourceTargetVertices, arrowWidth, arrowLength, strideRatio);
}

export const edgesToPolygons = (edges, vertices, lineWidth) => {
  const sourceTargetVertices = edgesToVertices(edges, vertices);
  return verticesToLinePolygons(sourceTargetVertices, lineWidth);
}

// TODO: make more generic for projection or use some library
export const screenToWorld = (screenPos, screenW, screenH, transform) => {
  const x_ = ((-1.0 + 2.0 * screenPos.x / screenW) - transform[12]);
  const y_ = ((1.0 - 2.0 * screenPos.y / screenH) - transform[13]);
  const a = transform[0];
  const b = transform[4];
  const c = transform[1];
  const d = transform[5];
  const adbc = a * d - b * c;

  const x = adbc === 0 ? Number.MAX_VALUE : (d * x_ - b * y_) / adbc;
  const y = adbc === 0 ? Number.MAX_VALUE : (-c * x_ + a * y_) / adbc;

  return {
    x: x,
    y: y
  };
}

const isInsideLasso = (pointVertex, lassoVertices) => {
  let result = false;

  const x = pointVertex[0];
  const y = pointVertex[1];
  let prevLsVertices = lassoVertices.slice(lassoVertices.length - 2);

  for (let i = 0; i < lassoVertices.length / 2; i++) {
    if (((lassoVertices[i * 2 + 1] < y && prevLsVertices[1] >= y) ||
        (prevLsVertices[1] < y && lassoVertices[i * 2 + 1] >= y)) &&
      (lassoVertices[i * 2] <= x || prevLsVertices[0] <= x)) {

      result ^= (lassoVertices[i * 2] +
        (y - lassoVertices[i * 2 + 1]) /
        (prevLsVertices[1] - lassoVertices[i * 2 + 1]) *
        (prevLsVertices[0] - lassoVertices[i * 2])) < x;
    }
    prevLsVertices = lassoVertices.slice(i * 2, i * 2 + 2);
  }

  return result;
}

export const insideLasso = (pointVertices, lassoVertices) => {
  const result = [];
  for (let i = 0; i < pointVertices.length / 2; i++) {
    result.push(isInsideLasso(pointVertices.slice(i * 2, i * 2 + 2), lassoVertices));
  }

  return result;
}

export const toTransformMat = (translate, rotate, scale) => {
  return new Float32Array([
    scale.x * Math.cos(rotate), scale.x * Math.sin(rotate), 0, 0,
    scale.y * -Math.sin(rotate), scale.y * Math.cos(rotate), 0, 0,
    0, 0, 1, 0,
    translate.x, translate.y, 0, 1
  ])
};

// // to use TCO, need to use Babel....
// const isInsideLasso = (pointVertex, lassoVertices) => {
//   let prevLsVertices = lassoVertices.slice(lassoVertices.length - 2, lassoVertices.length);
//   const x = pointVertex[0];
//   const y = pointVertex[1];
//
//   const isInLs = (lsVertices) => {
//     if (lsVertices.length < 2) {
//       return false;
//     } else {
//       if (((lsVertices[1] < y && prevLsVertices[1] >= y) ||
//           (prevLsVertices[1] < y && lsVertices[1] >= y)) &&
//         (lsVertices[0] <= x || prevLsVertices[0] <= x)) {
//         prevLsVertices = lsVertices.slice(0, 2);
//
//         return (lsVertices[0] +
//             (y - lsVertices[1]) /
//             (prevLsVertices[1] - lsVertices[1]) *
//             (prevLsVertices[0] - lsVertices[0])) < x ^
//           isInLs(lsVertices.slice(2));
//       } else {
//         prevLsVertices = lsVertices.slice(0, 2);
//         return isInLs(lsVertices.slice(2));
//       }
//     }
//   }
//
//   return isInLs(lassoVertices);
// }
//
// const insideLasso = (pointVertices, lassoVertices) => {
//   if (pointVertices.length === 0) {
//     return [];
//   } else {
//     return [isInsideLasso(pointVertices.slice(0, 2), lassoVertices)].concat(
//       insideLasso(pointVertices.slice(2), lassoVertices));
//   }
// }

export const toInfoForDrawPoints = renderingDataObj => [
  renderingDataObj.gl,
  renderingDataObj.shaders.point.v,
  renderingDataObj.shaders.point.f,
  renderingDataObj.vertices,
  renderingDataObj.sizes,
  renderingDataObj.colors,
  renderingDataObj.opacities,
  renderingDataObj.outerRingColors,
  renderingDataObj.outerRingOpacities,
  renderingDataObj.shapes
]

export const toInfoForDrawLines = renderingDataObj => [
  renderingDataObj.gl,
  renderingDataObj.shaders.line.v,
  renderingDataObj.shaders.line.f,
  renderingDataObj.lineVertices,
  renderingDataObj.lineColors,
  renderingDataObj.lineOpacities
]

export const toInfoForDrawFocus = renderingDataObj => [
  renderingDataObj.gl,
  renderingDataObj.shaders.focus.v,
  renderingDataObj.shaders.focus.f,
  renderingDataObj.focusVertices
]