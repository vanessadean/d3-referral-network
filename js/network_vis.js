var Network, RadialPlacement, activate, root, doctor;
;

root = typeof exports !== "undefined" && exports !== null ? exports : this;

RadialPlacement = function() {
  var center, current, increment, place, placement, radialLocation, radius, setKeys, start, values;
  values = d3.map();
  increment = 20;
  radius = 200;
  center = {
    "x": 0,
    "y": 0
  };
  start = -120;
  current = start;
  radialLocation = function(center, angle, radius) {
    var x, y;
    x = center.x + radius * Math.cos(angle * Math.PI / 180);
    y = center.y + radius * Math.sin(angle * Math.PI / 180);
    return {
      "x": x,
      "y": y
    };
  };
  placement = function(key) {
    var value;
    value = values.get(key);
    if (!values.has(key)) {
      value = place(key);
    }
    return value;
  };
  place = function(key) {
    var value;
    value = radialLocation(center, current, radius);
    values.set(key, value);
    current += increment;
    return value;
  };
  setKeys = function(keys) {
    var firstCircleCount, firstCircleKeys, secondCircleKeys;
    values = d3.map();
    firstCircleCount = 360 / increment;
    if (keys.length < firstCircleCount) {
      increment = 360 / keys.length;
    }
    firstCircleKeys = keys.slice(0, firstCircleCount);
    firstCircleKeys.forEach(function(k) {
      return place(k);
    });
    secondCircleKeys = keys.slice(firstCircleCount);
    radius = radius + radius / 1.8;
    increment = 360 / secondCircleKeys.length;
    return secondCircleKeys.forEach(function(k) {
      return place(k);
    });
  };
  placement.keys = function(_) {
    if (!arguments.length) {
      return d3.keys(values);
    }
    setKeys(_);
    return placement;
  };
  placement.center = function(_) {
    if (!arguments.length) {
      return center;
    }
    center = _;
    return placement;
  };
  placement.radius = function(_) {
    if (!arguments.length) {
      return radius;
    }
    radius = _;
    return placement;
  };
  placement.start = function(_) {
    if (!arguments.length) {
      return start;
    }
    start = _;
    current = start;
    return placement;
  };
  placement.increment = function(_) {
    if (!arguments.length) {
      return increment;
    }
    increment = _;
    return placement;
  };
  return placement;
};

Network = function() {
  var allData, charge, curLinksData, curNodesData, filter, filterLinks, filterNodes, force, forceTick, groupCenters, height, hideDetails, layout, link, linkedByIndex, linksG, mapNodes, moveToRadialLayout, neighboring, network, node, nodeColors, nodeCounts, nodesG, radialTick, setFilter, setLayout, setupData, showDetails, sort, sortedPractices, strokeFor, tooltip, update, updateCenters, updateLinks, updateNodes, width;
  width = 960;
  height = 750;
  allData = [];
  curLinksData = [];
  curNodesData = [];
  linkedByIndex = {};
  nodesG = null;
  linksG = null;
  node = null;
  link = null;
  layout = "force";
  filter = "all";
  groupCenters = null;
  force = d3.layout.force();
  nodeColors = d3.scale.category20();
  colorsForLegend = [];
  tooltip = Tooltip("vis-tooltip", 230);
  charge = function(node) {
    return -Math.pow(node.radius, 2.0) / 2;
  };
  network = function(selection, data) {
    var vis;
    allData = setupData(data);
    vis = d3.select(selection).append("svg").attr("width", width).attr("height", height);
    linksG = vis.append("g").attr("id", "links");
    nodesG = vis.append("g").attr("id", "nodes");
    force.size([width, height]);
    setLayout("force");
    setFilter("all");
    return update();
  };
  update = function() {
    var practices;
    curNodesData = filterNodes(allData.nodes);
    curLinksData = filterLinks(allData.links, curNodesData);
    if (layout === "radial") {
      practices = sortedPractices(curNodesData, curLinksData);
      updateCenters(practices);
    }
    force.nodes(curNodesData);
    updateNodes();
    if (layout === "force") {
      force.links(curLinksData);
      updateLinks();
    } else {
      force.links([]);
      if (link) {
        link.data([]).exit().remove();
        link = null;
      }
    }
    return force.start();
  };
  network.toggleLayout = function(newLayout) {
    force.stop();
    setLayout(newLayout);
    return update();
  };
  network.toggleFilter = function(newFilter) {
    force.stop();
    setFilter(newFilter);
    return update();
  };
  network.updateData = function(newData) {
    allData = setupData(newData);
    link.remove();
    node.remove();
    return update();
  };
  setupData = function(data) {
    var circleRadius, countExtent, nodesMap;
    countExtent = d3.extent(data.nodes, function(d) {
      return d.total_referrals;
    });
    circleRadius = d3.scale.sqrt().range([3, 36]).domain(countExtent);
    data.nodes.forEach(function(n) {
      var randomnumber;
      n.x = randomnumber = Math.floor(Math.random() * width);
      n.y = randomnumber = Math.floor(Math.random() * height);
      return n.radius = circleRadius(n.total_referrals);
    });
    nodesMap = mapNodes(data.nodes);
    data.links.forEach(function(l) {
      l.source = nodesMap.get(l.source);
      l.target = nodesMap.get(l.target);
      return linkedByIndex[l.source.name + "," + l.target.name] = 1;
    });
    return data;
  };
  mapNodes = function(nodes) {
    var nodesMap;
    nodesMap = d3.map();
    nodes.forEach(function(n) {
      return nodesMap.set(n.name, n);
    });
    return nodesMap;
  };
  nodeCounts = function(nodes, attr) {
    var counts;
    counts = {};
    nodes.forEach(function(d) {
      var name;
      if (counts[name = d[attr]] == null) {
        counts[name] = 0;
      }
      return counts[d[attr]] += 1;
    });
    return counts;
  };
  neighboring = function(a, b) {
    return linkedByIndex[a.name + "," + b.name] || linkedByIndex[b.name + "," + a.name];
  };
  filterNodes = function(allNodes) {
    var all_referrals, cutoff, filteredNodes;
    filteredNodes = allNodes;
    if (filter === "most-active") {
      all_referrals = allNodes.map(function(d) {
        return d.total_referrals;
      }).sort(d3.ascending);
      cutoff = d3.quantile(all_referrals, 0.5);
      filteredNodes = allNodes.filter(function(n) {
        return n.total_referrals > cutoff;
      });
    } else if (filter === "no-premier") {
      filteredNodes = allNodes.filter(function(n) {
        return n.practice != "Premier Orthopaedics" || n.name.toLowerCase().split(" ")[1] == doctor || n.name.toLowerCase().split(" ")[1] == "baruch";
      });
    } else if (filter === "premier-only") {
      filteredNodes = allNodes.filter(function(n) {
        return n.practice == "Premier Orthopaedics";
      });
    }
    return filteredNodes;
  };
  sortedPractices = function(nodes, links) {
    var counts, practices;
    practices = [];
    if (sort === "links") {
      counts = {};
      links.forEach(function(l) {
        var name, name1;
        if (counts[name = l.source.practice] == null) {
          counts[name] = 0;
        }
        counts[l.source.practice] += 1;
        if (counts[name1 = l.target.practice] == null) {
          counts[name1] = 0;
        }
        return counts[l.target.practice] += 1;
      });
      nodes.forEach(function(n) {
        var name;
        return counts[name = n.practice] != null ? counts[name] : counts[name] = 0;
      });
      practices = d3.entries(counts).sort(function(a, b) {
        return b.value - a.value;
      });
      practices = practices.map(function(v) {
        return v.key;
      });
    } else {
      counts = nodeCounts(nodes, "practice");
      practices = d3.entries(counts).sort(function(a, b) {
        return b.value - a.value;
      });
      practices = practices.map(function(v) {
        return v.key;
      });
    }
    return practices;
  };
  updateCenters = function(practices) {
    if (layout === "radial") {
      return groupCenters = RadialPlacement().center({
        "x": width / 2,
        "y": height / 2 - 100
      }).radius(300).increment(18).keys(practices);
    }
  };
  filterLinks = function(allLinks, curNodes) {
    curNodes = mapNodes(curNodes);
    return allLinks.filter(function(l) {
      return curNodes.get(l.source.name) && curNodes.get(l.target.name);
    });
  };
  updateNodes = function() {
    node = nodesG.selectAll("circle.node").data(curNodesData, function(d) {
      return d.name;
    });
    node.enter().append("circle").attr("class", "node").attr("cx", function(d) {
      return d.x;
    }).attr("cy", function(d) {
      return d.y;
    }).attr("r", function(d) {
      return d.radius;
    }).style("fill", function(d) {
      return nodeColors(d.specialty);
    }).style("stroke", function(d) {
      return strokeFor(d);
    }).style("stroke-width", 1.0);
    node.on("mouseover", showDetails).on("mouseout", hideDetails);
    return node.exit().remove();
  };
  updateLinks = function() {
    link = linksG.selectAll("line.link").data(curLinksData, function(d) {
      return d.source.name + "_" + d.target.name;
    });
    link.enter().append("line").attr("class", "link").attr("stroke", "#ddd").attr("stroke-opacity", 0.8).attr("x1", function(d) {
      return d.source.x;
    }).attr("y1", function(d) {
      return d.source.y;
    }).attr("x2", function(d) {
      return d.target.x;
    }).attr("y2", function(d) {
      return d.target.y;
    });
    return link.exit().remove();
  };
  setLayout = function(newLayout) {
    layout = newLayout;
    if (layout === "force") {
      return force.on("tick", forceTick).charge(-500).linkDistance(150);
    } else if (layout === "radial") {
      return force.on("tick", radialTick).charge(charge);
    }
  };
  setFilter = function(newFilter) {
    return filter = newFilter;
  };
  forceTick = function(e) {
    node.attr("cx", function(d) {
      return d.x;
    }).attr("cy", function(d) {
      return d.y;
    });
    return link.attr("x1", function(d) {
      return d.source.x;
    }).attr("y1", function(d) {
      return d.source.y;
    }).attr("x2", function(d) {
      return d.target.x;
    }).attr("y2", function(d) {
      return d.target.y;
    });
  };
  radialTick = function(e) {
    node.each(moveToRadialLayout(e.alpha));
    node.attr("cx", function(d) {
      return d.x;
    }).attr("cy", function(d) {
      return d.y;
    });
    if (e.alpha < 0.03) {
      force.stop();
      return updateLinks();
    }
  };
  moveToRadialLayout = function(alpha) {
    var k;
    k = alpha * 0.1;
    return function(d) {
      var centerNode;
      centerNode = groupCenters(d.practice);
      d.x += (centerNode.x - d.x) * k;
      return d.y += (centerNode.y - d.y) * k;
    };
  };
  strokeFor = function(d) {
    return d3.rgb(nodeColors(d.specialty)).darker().toString();
  };
  showDetails = function(d, i) {
    var content;
    content = '<p class="main">' + d.name + '</span></p>';
    content += '<hr class="tooltip-hr">';
    content += '<p class="main">' + d.practice + '</span></p>';
    content += '<p class="main">' + d.specialty + '</span></p>';
    content += '<br><p class="main">referrals in this network: ' + d.total_referrals + '</span></p>';
    tooltip.showTooltip(content, d3.event);
    if (link) {
      link.attr("stroke", function(l) {
        if (l.source === d || l.target === d) {
          return "#555";
        } else {
          return "#ddd";
        }
      }).attr("stroke-opacity", function(l) {
        if (l.source === d || l.target === d) {
          return 1.0;
        } else {
          return 0.5;
        }
      });
    }
    node.style("stroke", function(n) {
      if (n.searched || neighboring(d, n)) {
        return "#555";
      } else {
        return strokeFor(n);
      }
    }).style("stroke-width", function(n) {
      if (n.searched || neighboring(d, n)) {
        return 2.0;
      } else {
        return 1.0;
      }
    });
    return d3.select(this).style("stroke", "black").style("stroke-width", 2.0);
  };
  hideDetails = function(d, i) {
    tooltip.hideTooltip();
    node.style("stroke", function(n) {
      if (!n.searched) {
        return strokeFor(n);
      } else {
        return "#555";
      }
    }).style("stroke-width", function(n) {
      if (!n.searched) {
        return 1.0;
      } else {
        return 2.0;
      }
    });
    if (link) {
      return link.attr("stroke", "#ddd").attr("stroke-opacity", 0.8);
    }
  };
  return network;
};

activate = function(group, link) {
  d3.selectAll("#" + group + " a").classed("active", false);
  return d3.select("#" + group + " #" + link).classed("active", true);
};

$(function() {
  var myNetwork;
  myNetwork = Network();
  doctor = "baruch";
  d3.selectAll("#layouts a").on("click", function(d) {
    var newLayout;
    newLayout = d3.select(this).attr("id");
    activate("layouts", newLayout);
    return myNetwork.toggleLayout(newLayout);
  });
  d3.selectAll("#filters a").on("click", function(d) {
    var newFilter;
    newFilter = d3.select(this).attr("id");
    activate("filters", newFilter);
    return myNetwork.toggleFilter(newFilter);
  });
  $("#doctor_select").on("change", function(e) {
    doctor = $(this).val();
    return d3.json("data/"+doctor+".json", function(json) {
      return myNetwork.updateData(json);
    });
  });
  return d3.json("data/"+doctor+".json", function(json) {
    return myNetwork("#vis", json);
  });
});
