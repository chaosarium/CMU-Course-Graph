// ========== general ==========

// global
let g = {};
g.current_node_id = "Myriel";

async function fetchDataJson(json_path) {
  const response = await fetch(json_path);
  const data = await response.json();
  return data;
}

// ========== for processing course data ==========

function graph_from_schema(raw) {

  let data = {}
  data.list = [] // list of all courses
  data.nodes = [] // list of course objs
  // with id, name, links, desc, units, prereq, coreq, antireq, min-grade
  data.links = [] // list of link objs
  // with source, target, link type

  // 1st pass: build list and nodes
  for (const [code, course] of Object.entries(raw)) {
    data.list.push(code)
    data.nodes.push({
      'id': code,
      'plain-name': course.name,
      'name': code + ' ' + course.name,
      'links': [], 
      'desc': course.desc, 
      'units': course.units, 
      'prereq': course.prereq, 
      'coreq': course.coreq,  
      'antireq': course.antireq, 
      'min-grade': course['min-grade'],
    })
  }
  console.log('DONE FIRST PASS');
  console.log(data);
  
  function handle_req_list(reqs, req_type) {

  }

  // 2nd pass: build link index
  for (node of data.nodes) {
    // add all prereq to links and links
    if (node.prereq != []) {
      for (p of node.prereq) {
        // p is array of ORS
        if (typeof(p) == 'object') {
          for (course of p) {
            if (data.list.includes(course)) {
              node.links.push(course)
              data.links.push({
                "source": node.id,
                "target": course,
                "value": 1,
                "type": "one_of_prereq",
                "rest_of_prereq_in_group": node.prereq,
              })
            }
          }
        }
        // p is single element
        if (typeof(p) == 'string') {
          course = p
          if (data.list.includes(course)) {
            node.links.push(course)
            data.links.push({
              "source": node.id,
              "target": course,
              "value": 1,
              "type": "prereq"
            })
          }
        }
      }
    }
    if (node.coreq != []) {
      for (c of node.coreq) {
        // c is array of ORS
        if (typeof(c) == 'object') {
          for (course of c) {
            if (data.list.includes(course)) {
              node.links.push(course)
              data.links.push({
                "source": node.id,
                "target": course,
                "value": 1,
                "type": "one_of_coreq",
                "rest_of_coreq_in_group": node.coreq,
              })
            }
          }
        }
        // p is single element
        if (typeof(p) == 'string') {
          course = p
          if (data.list.includes(course)) {
            node.links.push(course)
            data.links.push({
              "source": node.id,
              "target": course,
              "value": 1,
              "type": "coreq"
            })
          }
        }
      }
    } if (node.antireq != []) {
      for (a of node.antireq) {
        course = a
        if (data.list.includes(course)) {
          node.links.push(course)
          data.links.push({
            "source": node.id,
            "target": course,
            "value": 1,
            "type": "antireq"
          })
        }
      }
    }
    // TODO cross listing
  }
  console.log('DONE SECOND PASS');
  console.log(data);
  return data
}

async function testParse() {
  console.log('PARSING')
  let raw = await fetchDataJson('../../../dataproc/full_list.json')
  console.log(raw)
  graph_from_schema(raw)
}
// testParse()

// ========== for saving, retriving user data ==========

function save_user_data() {
  // TODO
  return true;
}

function load_user_data() {
  // TODO
  return {};
}

function clear_data() {
  // TODO
  return;
}

// ========== for manipulating data ==========

function filter() {
  // TODO
}

function no_orphan(raw) {
  // TODO
  // output graph without orphan
}

// ========== UI interaction ==========

function change_course_state(course_code, new_state) { }

function focus_node(course_code) {
  if (!g.data.list.includes(course_code)) {
    console.error("no such course on graph");
    return;
  }
  g.current_node_id = course_code;
  zoom_to_node()
}

function zoom_to_node() {
  g.Graph.zoomToFit(500, 2, (node) => {
    return zoom_select(node);
  });

}

// helper func
function zoom_select(node) {
  console.log("zoom select from 2d");
  if (g.Graph == undefined) {
    return false;
  }

  if (node.id == g.current_node_id) {
    return true;
  }
  for (let i = 0; i < node.links?.length; i++) {
    if (node.links[i] == g.current_node_id) {
      return true;
    }
  }
  return false;
}

function search_course() {
  let query = $('#search-box').val()
  console.log(query)
  if (!g.data.list.includes(query)) {
    error("no such course");
    return;
  }
  focus_node(query)
  update_course_info_pane(query)
}

function go_to_node(course_code) {
  focus_node(course_code)
  update_course_info_pane(course_code)
}

// ========== UI update ==========

function update_course_info_pane(course_code) {
  course = g.raw[course_code]
  $('#course-name-show').text(course.name)
  $('#course-code-show').text(course_code)
  $('#units-show').text(course.units)
  $('#desc-show').text(course.desc)
  $('#prereq-show').text(course.prereq)
  $('#coreq-show').text(course.coreq)
  $('#antireq-show').text(course.antireq)
}

// ========== for drawing graph ==========

async function initGraph() {
  let raw = await fetchDataJson('../../../dataproc/full_list.json')
  g.raw = raw

  g.data = graph_from_schema(raw)
  // g.data = await fetchDataJson("miserables-ext.json");
  // console.log(g.data);

  // 2D graph
  Graph = ForceGraph()(document.getElementById("graph"))
    .graphData(g.data)
    .nodeId("id")
    .nodeVal("val")
    .backgroundColor("var(--graph-background)")
    .nodeLabel("id") // HACK will change to 'name'
    .d3Force("charge", d3.forceManyBody().strength(-30).theta(0.9).distanceMax(600))
    // .d3Force("link", d3.forceLink())
    .d3Force("center", d3.forceCenter(0.05))
    .nodeColor((node) => {
      if (node.id == g.current_node_id) {
        return "blue";
      }
      if (node.state == "taken") {
        return "green";
      }
      if (node.state == "starred") {
        return "orange";
      }
      if (node.state == "gaol") {
        return "red";
      }
      return "grey";
    })
    .nodeCanvasObjectMode(() => "after")
    // HACK draw text?
    .nodeCanvasObject((node, ctx, globalScale) => {
      // draw text only for nodes connected to the current node
      let isConnected = false;
      if (node.id == g.current_node_id) {
        isConnected = true;
      }
      // loop through links to see if any connect to current
      if (node.links) {
        node.links.forEach((link) => {
          if (link == g.current_node_id) {
            isConnected = true;
          }
        });
      }
      // draw text
      if (isConnected) {
        const label = node.id; // HACK will be name
        const fontSize = 11 / globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;
        const textWidth = ctx.measureText(label).width;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#123";
        ctx.fillText(label, node.x, node.y + 8);
      }

      // color only main node & semiconnected
      if (node.id != g.current_node_id) {
        if (isConnected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI);
          ctx.fillStyle = "pink";
          ctx.fill();
        }
        return;
      }

      // color node
      ctx.beginPath();
      ctx.arc(node.x, node.y, 4 + 1, 0, 2 * Math.PI);
      ctx.fillStyle = "#red"; // active border
      ctx.fill();
      ctx.beginPath();
      ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = "#cyan"; // active fill
      ctx.fill();
    })
    .linkColor((link) => {
      if (
        link.source.id == g.current_node_id ||
        link.target.id == g.current_node_id
      ) {
        return "red";
      }
      return "lightgrey";
    })
    .linkSource("source")
    .linkTarget("target")
    .linkDirectionalParticles("value")
    // HACK change speed here
    .linkDirectionalParticleSpeed(0.005)
    // HACK change dir particle size
    .linkDirectionalParticleWidth((link) => {
      if (
        link.source.id == g.current_node_id ||
        link.target.id == g.current_node_id
      ) {
        return 3;
      }
      return 0;
    })
    // HACK when click
    .onNodeClick((node) => {
      g.current_node_id = node.id;
      update_course_info_pane(node.id)
    })
    .linkLineDash((node) => {
      return false;
    })
    .linkWidth((node) => {
      return 1;
    })
    .linkLabel((node) => {
      return false; // can make hover explain for coreq, etc.
    })
    .linkDirectionalArrowLength((node) => {
      return 2; // we can play with that too
    })
    .linkDirectionalParticleColor((node) => {
      return "pink";
    })
    .onNodeHover(null);

  g.Graph = Graph;
}

initGraph();
