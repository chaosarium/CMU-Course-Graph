// ========== general ========== 

// global
let g = {}
g.current_node_id = "Myriel"

async function fetchDataJson(json_path) {
  const response = await fetch(json_path);
  const data = await response.json();
  return data;
}

// ========== for processing course data ========== 

function from_schema(raw) {
  // TODO return data format for force graph
}

// ========== for saving, retriving user data ========== 

function save_user_data() {
  // TODO
  return true
}

function load_user_data() {
  // TODO
  return {}
}

function clear_data() {
  // TODO
  return
}

// ========== for manipulating data ========== 

function filter() {
  // TODO
}

// ========== UI interaction ========== 

function change_course_state(course_code, new_state) {

}

function node_clicked(node) {
  // TODO?
}

// ========== for drawing graph ========== 

let data

async function initGraph() {

  data = await fetchDataJson('miserables-ext.json')
  console.log(data)

  // 2D graph
  const Graph = ForceGraph()
  (document.getElementById('graph'))
  .graphData(data)
  .nodeId('id')
  .nodeVal('val')
  .backgroundColor("#eee")
  .nodeLabel('id') // HACK will change to 'name'
  // .d3Force("charge", d3.forceManyBody().strength('-30'))
  .nodeColor((node) => {
    if (node.id == g.current_node_id) {
      return "blue"
    }
    if (node.state == "taken") {
      return "green"
    }
    if (node.state == "starred") {
      return "orange"
    }
    if (node.state == "gaol") {
      return "red"
    }
    return "grey"
  })
  .nodeCanvasObjectMode(() => 'after')
  // HACK draw text?
  // .nodeCanvasObject((node, ctx, globalScale) => {
  //   // draw text only for nodes connected to the current node
  //   let isConnected = false;
  //   node.links.forEach(link => {
  //       if (link == g.current_node_id){
  //           isConnected = true;
  //       }
  //   })
  //   // draw text
  //   if (isConnected){
  //       const label = node.name;
  //       const fontSize = 11 / globalScale;
  //       ctx.font = `${fontSize}px Sans-Serif`;
  //       const textWidth = ctx.measureText(label).width;                
  //       ctx.textAlign = 'center';
  //       ctx.textBaseline = 'middle';
  //       ctx.fillStyle = g.colors.text;
  //       ctx.fillText(label, node.x, node.y+8);
  //   }
    
  //   // color only main node & semiconnected
  //   if (node.id != g.current_node_id){
  //       if (isConnected){
  //           ctx.beginPath();
  //           ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI);
  //           ctx.fillStyle = g.colors.node_semiactive;
  //           ctx.fill();
  //       }
  //       return
  //   }

  //   // color node
  //   ctx.beginPath();
  //   ctx.arc(node.x, node.y, 4+1, 0, 2 * Math.PI);
  //   ctx.fillStyle = g.colors.node_active_border;
  //   ctx.fill();
  //   ctx.beginPath();
  //   ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI);
  //   ctx.fillStyle = g.colors.node_active;
  //   ctx.fill();

  // })
  .linkSource('source')
  .linkTarget('target')
  .linkDirectionalParticles("value")
  // HACK change speed here
  .linkDirectionalParticleSpeed(0.005)
  // HACK change dir particle size
  .linkDirectionalParticleWidth(link => {
    if (link.source.id == g.current_node_id || link.target.id == g.current_node_id){
        return 3
    }
    return 0
  })



}

initGraph()