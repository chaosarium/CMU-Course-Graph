// ========== general ==========

// global
let g = {};
g.current_node_id = null
g.course_list = {}
g.current_mode = '2d'
g.color = {
  current_node: '#ffd16a',
  neighbors: '#f2d091',
  particle: '#ffd16a',
  taken: "#327472",
  star: "#ff8f07",
  plan: "#769af5",
  default_node: "#999999",
  current_node_outline: "#fff",
  link_active: "#f2d091", // around active node
  link_default: "#616161",
  neighbor_nodes_text: "#fff",
}

async function fetchDataJson(json_path) {
  const response = await fetch(json_path);
  const data = await response.json();
  return data;
}

function enterKeyPressed(event) {
  if (event.keyCode === 13) search_course()
}


// ========== for processing course data ==========

function backlink(data, course_to_push_to, curr_course) {
  // console.log('attempt push', course_to_push_to, curr_course, data.list.includes(course_to_push_to))
  // if (data.list.includes(course_to_push_to)) {
  //   for(i in data.nodes){
  //     node = data.nodes[i]
  //     // console.info(node)
  //     if(node.id == course_to_push_to) {
  //       // console.info("found course node", node);
  //       node.links.push(curr_course)
  //       // node.state = g.course_list[course]
  //     }
  //   }  
  // }
}

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
        if (typeof (p) == 'object') {
          for (course of p) {
            if (data.list.includes(course)) {
              node.links.push(course)
              backlink(data, course, node.id)
              // data.nodes[course].links.push(node.id)
              data.links.push({
                "target": node.id,
                "source": course,
                "value": 1,
                "type": "one_of_prereq",
                "rest_of_prereq_in_group": node.prereq,
              })
            }
          }
        }
        // p is single element
        if (typeof (p) == 'string') {
          course = p
          if (data.list.includes(course)) {
            node.links.push(course)
            backlink(data, course, node.id)
            data.links.push({
              "target": node.id,
              "source": course,
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
        if (typeof (c) == 'object') {
          for (course of c) {
            if (data.list.includes(course)) {
              node.links.push(course)
              backlink(data, course, node.id)
              data.links.push({
                "target": node.id,
                "source": course,
                "value": 1,
                "type": "one_of_coreq",
                "rest_of_coreq_in_group": node.coreq,
              })
            }
          }
        }
        // p is single element
        if (typeof (p) == 'string') {
          course = p
          if (data.list.includes(course)) {
            node.links.push(course)
            backlink(data, course, node.id)
            data.links.push({
              "target": node.id,
              "source": course,
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
          backlink(data, course, node.id)
          data.links.push({
            "target": node.id,
            "source": course,
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
  let path = "../../../dataproc/full_list.json"
  console.log(path)
  let raw = await fetchDataJson(path)
  console.log(raw)
  graph_from_schema(raw)
}
// testParse()

// ========== for saving, retriving user data ==========

// userdata shall look like {"courseNum": "state"}
// datatype state = taken | star | plan

function save_user_data() {
  if (g.course_list != undefined) {
    console.log(JSON.stringify(g.course_list))
    ls_set('course_list', JSON.stringify(g.course_list));
    update_course_states()
  } else {
    console.warn('nothing to save')
  }
}

function load_user_data() {
  let data = ls_get('course_list')
  if (data) {
    g.course_list = JSON.parse(data)
    console.info('loaded data')

    update_course_states()

    return data
  } else {
    data = {}
    g.course_list = data
    save_user_data()
    console.info('made new data')
    return data
  }
}

function clear_data() {
  // TODO
  return;
}

function handle_course_state_toggle(course_code, new_state) {
  if (course_code == null) {
    return
  }
  if (new_state == "null" || new_state == null) {
    $("#taken-button").removeClass("active")
    $("#star-button").removeClass('active')
    $("#plan-button").removeClass('active')
    return
  }
  if (new_state == g.course_list[course_code]) {
    $("#taken-button").removeClass("active")
    $("#star-button").removeClass('active')
    $("#plan-button").removeClass('active')
    delete g.course_list[course_code]
    save_user_data()
    return
  }
  g.course_list[course_code] = new_state
  if (new_state == 'taken') {
    $("#taken-button").removeClass("active")
    $("#star-button").removeClass('active')
    $("#plan-button").removeClass('active')

    $("#taken-button").addClass("active") 
  }
  if (new_state == 'star') { 
    $("#taken-button").removeClass("active")
    $("#star-button").removeClass('active')
    $("#plan-button").removeClass('active')

    $("#star-button").addClass('active') 
  }
  if (new_state == 'plan') {
    $("#taken-button").removeClass("active")
    $("#star-button").removeClass('active')
    $("#plan-button").removeClass('active')

    $("#plan-button").addClass('active') 
  }
  save_user_data()
}

function update_course_states() {
  for (const course in g.course_list) {
    //console.info("updating", course, g.course_list[course]);
    if (g.data?.list.includes(course)) {
      //console.info("real course");

      for (i in g.data?.nodes) {
        node = g.data?.nodes[i]
        // console.info(node)
        if (node.id == course) {
          //console.info("found course node", node);
          node.state = g.course_list[course]
        }
      }

    }
  }
  return
}

// global cache
var cacheAvailable = null;

// local storage stuff
function ls_test_available() {
  if (cacheAvailable != null) {
    return cacheAvailable
  }
  try {
    window.localStorage.setItem('testVal', 'testVal');
    window.localStorage.removeItem('testVal');
    cacheAvailable = true;
    return true;
  } catch (e) {
    cacheAvailable = false;
    return false;
  }
}

function ls_get(key) {
  if (ls_test_available() == false) {
    return false
  }
  return window.localStorage.getItem(key);
}
function ls_set(key, value) {
  if (ls_test_available() == false) {
    return false
  }
  return window.localStorage.setItem(key, value);
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
  console.log("searching course");
  let query = $('#search-box').val()
  let dash = query.indexOf('-')
  if (dash === -1) { query = query.slice(0, 2) + '-' + query.slice(2) }
  console.log(query)
  if (!g.data.list.includes(query)) {
    error("no such course");
    return;
  }
  go_to_node(query)
}

function go_to_node(course_code) {
  focus_node(course_code)
  update_course_info_pane(course_code)
}

// ========== UI update ==========


function createRequistes(someRequites) {
  result = ""
  console.log(someRequites, someRequites.length)
  if (someRequites.length === 0) return ""
  else {
    for (i = 0; i < someRequites.length; i++) {
      item = someRequites[i]
      if (item.length === 1) { result = result + item[0] }
      else {
        result = result + "(" + item.join(" or ") + ") "
      }
      if (i !== someRequites.length - 1) { result = result + ' and ' }
    }
  }
  console.log(result);
  return result;
}

function update_course_info_pane(course_code) {
  course = g.raw[course_code]
  prereq = createRequistes(course.prereq)
  coreq = course.coreq.join(' , ')
  antireq = createRequistes(course.antireq)

  $('#course-name-show').text(course.name)
  $('#course-code-show').text(course_code)
  $('#units-show').text(course.units)
  $('#desc-show').text(course.desc)
  $('#prereq-show').text(prereq)
  $('#coreq-show').text(coreq)
  $('#antireq-show').text(antireq)

  $("#taken-button").removeClass("active")
  $("#star-button").removeClass('active')
  $("#plan-button").removeClass('active')

  let action = g.course_list[course_code]
  console.log("current node is", action)

  if (action == 'taken') {
    $("#taken-button").addClass("active") 
  }
  if (action == 'star') { 
    $("#star-button").addClass('active') 
  }
  if (action == 'plan') { 
    $("#plan-button").addClass('active') 
  }

  $('#has-info-info').removeClass('d-none')
  $('#no-info-info').addClass('d-none')
}

// ========== for drawing graph ==========

async function initGraph() {
  let raw = await fetchDataJson('data/full_list.json')
  g.raw = raw

  g.data = graph_from_schema(raw)
  // g.data = await fetchDataJson("miserables-ext.json");
  // console.log(g.data);

  // 2D graph
  Graph = ForceGraph()(document.getElementById("graph"))
    .graphData(g.data)
    .nodeId("id")
    .nodeVal("val")
    .backgroundColor("#444")
    .nodeLabel("name")
    .d3Force("charge", d3.forceManyBody().strength(-10).theta(0.9).distanceMax(600))
    // .d3Force("link", d3.forceLink())
    .d3Force("center", d3.forceCenter(0.05))
    .nodeRelSize(4)
    .nodeColor((node) => {
      if (node.state == "taken") {
        return g.color.taken;
      }
      if (node.state == "star") {
        return g.color.star;
      }
      if (node.state == "plan") {
        return g.color.plan;
      }
      if (node.id == g.current_node_id) {
        return g.color.current_node;
      }
      return g.color.default_node;
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
        const label = node.name; // HACK will be name
        const fontSize = 11 / globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;
        const textWidth = ctx.measureText(label).width;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = g.color.neighbor_nodes_text; // curr node fill
        ctx.fillText(label, node.x, node.y + 8);
      }

      // color only main node & semiconnected
      if (node.id != g.current_node_id) {
        if (isConnected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI);
          ctx.fillStyle = g.color.neighbors;
          ctx.fill();
        }
        return;
      }

      var currNodeFill;
      if (node.state == "taken") {
        currNodeFill = g.color.taken;
      } else if (node.state == "star") {
        currNodeFill = g.color.star;
      } else if (node.state == "plan") {
        currNodeFill = g.color.plan;
      } else {
        currNodeFill = g.color.current_node;
      }


      // color node
      ctx.beginPath();
      ctx.arc(node.x, node.y, 4 + 1, 0, 2 * Math.PI);
      ctx.fillStyle = g.color.current_node_outline; // active border
      ctx.fill();
      ctx.beginPath();
      ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = currNodeFill; // active fill
      ctx.fill();
    })
    .linkColor((link) => {
      if (
        link.source.id == g.current_node_id ||
        link.target.id == g.current_node_id
      ) {
        return g.color.link_active;
      }
      return g.color.link_default;
    })
    .linkSource("source")
    .linkTarget("target")
    .linkDirectionalParticles(1)
    // HACK change speed here
    .linkDirectionalParticleSpeed(0.008)
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
      return 0; // we can play with that too
    })
    .linkDirectionalParticleColor((node) => {
      return g.color.particle;
    })
    .onNodeHover(null)
    .onBackgroundClick(() => {
      $('#has-info-info').addClass('d-none')
      $('#no-info-info').removeClass('d-none')
      g.current_node_id = null
      console.log("background_clicked")
    })

  g.Graph = Graph;
  load_user_data();
  update_course_states()
}

async function initGraph2() {
  let raw = await fetchDataJson('data/full_list.json')
  g.raw = raw

  g.data = graph_from_schema(raw)
  // g.data = await fetchDataJson("miserables-ext.json");
  // console.log(g.data);

  // 3D graph
  Graph = ForceGraph3D()(document.getElementById("graph"))
    .graphData(g.data)
    .nodeId("id")
    .nodeVal("val")
    // .backgroundColor("var(--graph-background)")
    .nodeLabel("name")
    // .d3Force("charge", d3.forceManyBody().strength(-10).theta(0.9).distanceMax(600))
    // // .d3Force("link", d3.forceLink())
    // .d3Force("center", d3.forceCenter(0.05))
    // .nodeRelSize(4)
    .nodeColor((node) => {
      if (node.id == g.current_node_id) {
        return g.color.current_node;
      }
      if (node.state == "taken") {
        return g.color.taken;
      }
      if (node.state == "star") {
        return g.color.star;
      }
      if (node.state == "plan") {
        return g.color.plan;
      }
      return g.color.default_node;
    })
    // .nodeCanvasObjectMode(() => "after")
    // // HACK draw text?
    // .nodeCanvasObject((node, ctx, globalScale) => {
    //   // draw text only for nodes connected to the current node
    //   let isConnected = false;
    //   if (node.id == g.current_node_id) {
    //     isConnected = true;
    //   }
    //   // loop through links to see if any connect to current
    //   if (node.links) {
    //     node.links.forEach((link) => {
    //       if (link == g.current_node_id) {
    //         isConnected = true;
    //       }
    //     });
    //   }
    //   // draw text
    //   if (isConnected) {
    //     const label = node.name; // HACK will be name
    //     const fontSize = 11 / globalScale;
    //     ctx.font = `${fontSize}px Sans-Serif`;
    //     const textWidth = ctx.measureText(label).width;
    //     ctx.textAlign = "center";
    //     ctx.textBaseline = "middle";
    //     ctx.fillStyle = g.color.neighbor_nodes_text; // curr node fill
    //     ctx.fillText(label, node.x, node.y + 8);
    //   }

    //   // color only main node & semiconnected
    //   if (node.id != g.current_node_id) {
    //     if (isConnected) {
    //       ctx.beginPath();
    //       ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI);
    //       ctx.fillStyle = g.color.neighbors;
    //       ctx.fill();
    //     }
    //     return;
    //   }

    //   var currNodeFill;
    //   if (node.state == "taken") {
    //     currNodeFill = g.color.taken;
    //   } else if (node.state == "star") {
    //     currNodeFill = g.color.star;
    //   } else if (node.state == "plan") {
    //     currNodeFill = g.color.plan;
    //   } else {
    //     currNodeFill = g.color.current_node;
    //   }


    //   // color node
    //   ctx.beginPath();
    //   ctx.arc(node.x, node.y, 4 + 1, 0, 2 * Math.PI);
    //   ctx.fillStyle = g.color.current_node_outline; // active border
    //   ctx.fill();
    //   ctx.beginPath();
    //   ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI);
    //   ctx.fillStyle = currNodeFill; // active fill
    //   ctx.fill();
    // })
    .linkColor((link) => {
      if (
        link.source.id == g.current_node_id ||
        link.target.id == g.current_node_id
      ) {
        return g.color.link_active;
      }
      return g.color.link_default;
    })
    .linkSource("source")
    .linkTarget("target")
    .linkDirectionalParticles(0)
    // HACK change speed here
    // .linkDirectionalParticleSpeed(0.008)
    // HACK change dir particle size
    // .linkDirectionalParticleWidth((link) => {
    //   if (
    //     link.source.id == g.current_node_id ||
    //     link.target.id == g.current_node_id
    //   ) {
    //     return 3;
    //   }
    //   return 0;
    // })
    // HACK when click
    .onNodeClick((node) => {
      g.current_node_id = node.id;
      update_course_info_pane(node.id)
    })
    // .linkLineDash((node) => {
    //   return false;
    // })
    // .linkWidth((node) => {
    //   return 1;
    // })
    // .linkLabel((node) => {
    //   return false; // can make hover explain for coreq, etc.
    // })
    // .linkDirectionalArrowLength((node) => {
    //   return 0; // we can play with that too
    // })
    // .linkDirectionalParticleColor((node) => {
    //   return g.color.particle;
    // })
    // .onNodeHover(null)
    .onBackgroundClick(() => {
      $('#has-info-info').addClass('d-none')
      $('#no-info-info').removeClass('d-none')
      g.current_node_id = null
      console.log("background_clicked")
    })

  g.Graph = Graph;
  load_user_data();
  update_course_states()
}

function toggleMode() {
  var curr = $("#toggledim").text()
  console.log(curr)

  if (curr == 'Enter 3D') {
    g.Graph.pauseAnimation()

    $("#toggledim").text("Enter 2D")
    initGraph2()
  }
  if (curr == 'Enter 2D') {
    g.Graph.pauseAnimation()

    $("#toggledim").text("Enter 3D")
    initGraph()
  }
}

initGraph();