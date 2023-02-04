// general

async function fetchDataJson() {
    const response = await fetch('miserables.json');
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

function change_course_state (course_code, new_state) {

}

function node_clicked (node) {
    // TODO?
}

// ========== for drawing graph ========== 

let data

async function initGraph() {  
      
  data = await fetchDataJson()
  console.log(data)

  const Graph = ForceGraph()
    (document.getElementById('graph'))
    .graphData(data)
    .nodeId('id')
    .nodeVal('val')
    .nodeLabel('id')
    .nodeAutoColorBy('group')
    .linkSource('source')
    .linkTarget('target')

}

initGraph()