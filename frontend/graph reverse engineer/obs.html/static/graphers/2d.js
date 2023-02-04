// ENTRYPOINT
function run(args) {
    if (window.graphModule.graph_dependencies_loaded['2d'] == false){
        // load three dependencies in succession and then run initGraph(args)
        lazy_load_script(
            '//unpkg.com/force-graph', lazy_load_script, ["//unpkg.com/d3-force", lazy_load_script, ["https://d3js.org/d3.v4.min.js", initGraph, [args]]]
        )
        // tell obshtml that the dependencies have been loaded
        window.graphModule.graph_dependencies_loaded['2d'] = true;

    }
    else {
        // just run directly
        initGraph(args)
    }
}




// MAIN

function initGraph(args) {

    console.info('initing graph with args', args)

    // open div right before loading the graph to avoid opening an empty div
    args.graph_container.style.display = "block";

    // Load data then start graph
    fetch(args.data).then(res => res.json()).then(data => { // just going to that url and grabbing json

        console.info('got data, finally', data)

        // overwrites
        let g = window.graphModule.graphs[args.uid];
        g.actions['select_node'] = function(args, graph){
            return graph_select_node(args, graph)
        }

        g.graph = ForceGraph()
            (args.graph_container) // where to put graph
            .graphData(data)
            .width(args.width)
            .maxZoom(10)
            .height(args.height)
            .backgroundColor(g.colors.bg)
            .nodeLabel('name')
            .d3Force("charge", d3.forceManyBody().strength(args.coalesce_force))
            .nodeColor((node) => {return g.colors.node_inactive})
            .nodeCanvasObjectMode(() => 'after')
            .nodeCanvasObject((node, ctx, globalScale) => {
                // draw text only for nodes connected to the current node
                let isConnected = false;
                node.links.forEach(link => {
                    if (link == g.current_node_id){
                        isConnected = true;
                    }
                })
                // draw text
                if (isConnected){
                    const label = node.name;
                    const fontSize = 11 / globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;
                    const textWidth = ctx.measureText(label).width;                
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = g.colors.text;
                    ctx.fillText(label, node.x, node.y+8);
                }
                
                // color only main node & semiconnected
                if (node.id != g.current_node_id){
                    if (isConnected){
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI);
                        ctx.fillStyle = g.colors.node_semiactive;
                        ctx.fill();
                    }
                    return
                }

                // color node
                ctx.beginPath();
                ctx.arc(node.x, node.y, 4+1, 0, 2 * Math.PI);
                ctx.fillStyle = g.colors.node_active_border;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI);
                ctx.fillStyle = g.colors.node_active;
                ctx.fill();

            })
            .linkColor(link => {
                if (link.source.id == g.current_node_id){
                    return g.colors.link_active
                }
                if (link.target.id == g.current_node_id){
                    return g.colors.link_active
                }
                return g.colors.link_inactive
            })
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
            // HACK change dash type
            .linkLineDash(link => {
                if (link.type == 'inclusion'){
                    return [1,1]
                }
                return false;
            })
            // HACK what to do when click
            .onNodeClick(node => {
                args.node = node;
                g.actions['left_click'](args)
            })
            // HACK what to do when click
            .onNodeRightClick(node => {
                args.node = node;
                g.current_node_id = node.id
                g.actions['right_click'](args)
            })
            // HACK make certain node invisible
            .nodeVisibility (node => {
                return true
            })
            // HACK autocolor
            .nodeAutoColorBy (node => {
                // return true
                // return some color
            })
        
        setTimeout( () => g.graph.zoomToFit(1000, rem(3), function(n){return zoom_select(n, args)}), 1000 );
    });
}







// REACT TO CHANEGES

// switch node focus
function graph_select_node(args){
    console.log('graph select node from 2d')
    let g = window.graphModule.graphs[args.uid];
    g.current_node_id = args.node.id;

    g.graph.zoomToFit(1000, rem(3), function(n){return zoom_select(n, args)})
    return false;
}

// runs whenever zoom level changes (not mouse scroll)
function zoom_select(n, args){
    console.log('zoom select from 2d')
    let g = window.graphModule.graphs[args.uid];
    if (g == undefined){ // graph closed before settimeout got around to zooming
        return false
    }

    if (n.id == g.current_node_id){
        return true
    }
    for (let i=0;i<n.links.length;i++){
        if (n.links[i] == g.current_node_id){
            return true
        }
    }
    return false
}






// EXPORT

// export the run() method so that it can be called by obshtml
export { 
    run
};