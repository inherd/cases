function renderCodeExplorer(freedom, data, elementId) {
  let margin = {top: 20, right: 20, bottom: 50, left: 50};
  const rootNode = d3.hierarchy(data);
  rootNode.descendants().forEach((node) => {
    node.data.hierarchNode = node;
  });
  let maxDepth = 10;
  const allNodes = rootNode
    .descendants()
    .filter((d) => d.depth <= maxDepth)
    .filter(
      (d) => d.children === undefined || d.depth === maxDepth
    );

  const max = d3.quantile(allNodes, 0.9975, d => {
    if (d.data.data && d.data.data.git && d.data.data.git.details.length) {
      return Math.abs(d.data.data.git.details.length)
    }
    return 0;
  });
  const average = d3.mean(allNodes, d => {
    if (d.data.data && d.data.data.git && d.data.data.git.details.length) {
      return Math.abs(d.data.data.git.details.length)
    }
    return 0;
  });

  let color = d3.scaleLinear()
    .domain([0, +max])
    .range(["#9be9a8", "red"])

  legend(
    {
      color,
      title: "Daily commits",
      ticks: 10,
      tickFormat: function (d) {
        return d;
      }
    },
    d3.select(elementId)
  )

  let svg = d3.select(elementId).append("svg")
    .attr("width", GraphConfig.width)
    .attr("height", GraphConfig.width)
    .attr("viewBox", [-GraphConfig.width / 2, -GraphConfig.height / 2, GraphConfig.width, GraphConfig.height,]);

  const voronoi = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  const labels = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  let createTooltip = function (el) {
    el
      .attr("class", "tooltip")
      .style("pointer-events", "none")
      .style("top", 0)
      .style("opacity", 0)
  }
  const tooltip = d3.select(document.createElement("div")).call(createTooltip);
  let element = document.getElementById("file-explorer");
  element.append(tooltip.node());


  function fillFn(d) {
    if (d.data.data && d.data.data.git && d.data.data.git.details.length) {
      return color(d.data.data.git.details.length)
    } else {
      return color(0);
    }
  }

  voronoi.selectAll('path')
    .data(allNodes)
    .enter()
    .append('path')
    .attr('d', d => `${d3.line()(d.data.layout.polygon)}z`)
    .attr('fill', fillFn)
    .attr("stroke", "#F5F5F2")
    .on("mouseover", function (event, d) {
      d3.select(this).attr("opacity", "0.5")
      let commits = 0;
      if (d.data.data && d.data.data.git) {
        commits = d.data.data.git.details.length;
      }
      tooltip
        .style("opacity", 1)
        .html(`<h2>${d.data.name}</h2>
<h4>${d.data.path}</h4>
<h4>line: ${d.data.value}</h4>
<h4>commits: ${commits}</h4>
`)
    })
    .on("mouseleave", function (event, d) {
      d3.select(this).attr("opacity", "1")
      tooltip.style("opacity", 0)
    })
    .transition()
    .duration(1000)
    .attr("stroke-width", d => {
      if (d.data.layout.algorithm === "circlePack") return 0;
      return d.depth < 4 ? 4 - d.depth : 1;
    })

  svg.on("mousemove", function (event, d) {
    let [x, y] = d3.pointer(event);

    tooltip
      .style("left", x + GraphConfig.width / 2 + "px")
      .style("top", y + GraphConfig.width / 2 + "px")
  });

  labels.selectAll('text')
    .data(allNodes.filter(d => {
      if (d.data.data && d.data.data.git) {
        if (d.data.data.git.details.length > average) {
          return true;
        }
      }

      return false;
    }))
    .enter()
    .append('text')
    .attr('class', d => `label-${d.id}`)
    .attr('text-anchor', 'middle')
    .attr("transform", d => {
      return "translate(" + [d.data.layout.center[0], d.data.layout.center[1] + 6] + ")"
    })
    .text(d => {
      if (d.data.data && d.data.data.git) {
        return d.data.name + ":" + d.data.data.git.details.length
      }
      return d.data.name;
    })
    .attr('cursor', 'default')
    .attr('pointer-events', 'none')
    .attr('fill', 'white')
}
