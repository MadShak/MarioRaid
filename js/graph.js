var MK = window.MK = window.MK || {};

MK.buildRiverGraph = function (rowsRanges) {
  const segments = [];
  const rowSegIds = rowsRanges.map(() => []);

  rowsRanges.forEach((ranges, row) => {
    ranges.forEach((range) => {
      const id = segments.length;
      segments.push({ id, row, c0: range.c0, c1: range.c1 });
      rowSegIds[row].push(id);
    });
  });

  const edges = segments.map(() => []);
  const overlaps = (a, b) => a.c0 <= b.c1 && a.c1 >= b.c0;

  for (let row = 0; row < rowsRanges.length - 1; row++) {
    for (const idA of rowSegIds[row]) {
      for (const idB of rowSegIds[row + 1]) {
        if (overlaps(segments[idA], segments[idB])) {
          edges[idA].push({ to: idB });
        }
      }
    }
  }

  return { segments, edges, rowSegIds };
};

MK.bfsPath = function (graph, startId, goalId) {
  if (startId === -1 || goalId === -1) return null;
  if (startId === goalId) return [];
  const visited = new Set([startId]);
  const queue = [startId];
  const cameFrom = new Map();
  while (queue.length) {
    const cur = queue.shift();
    for (const e of graph.edges[cur]) {
      if (!visited.has(e.to)) {
        visited.add(e.to);
        cameFrom.set(e.to, cur);
        if (e.to === goalId) {
          const path = [];
          let node = goalId;
          while (node !== startId) {
            path.unshift(node);
            node = cameFrom.get(node);
          }
          return path;
        }
        queue.push(e.to);
      }
    }
  }
  return null;
};

MK.isChunkConnected = function (graph) {
  const rows = graph.rowSegIds;
  const firstRow = rows[0];
  const lastRow = rows[rows.length - 1];
  for (const start of firstRow) {
    for (const goal of lastRow) {
      if (start === goal || MK.bfsPath(graph, start, goal) !== null) return true;
    }
  }
  return false;
};

