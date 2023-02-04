data = [
  {"name": "Alice",     "age":  4, "height": 100, "weight": 17},
  {"name": "Bruno",     "age":  2, "height":  88, "weight": 12},
  {"name": "Charles",   "age": 85, "height": 177, "weight": 57},
  {"name": "Dédé",      "age": 25, "height": 168, "weight": 67},
  {"name": "Etienne",   "age": 42, "height": 182, "weight": 80},
  {"name": "Françoise", "age":  8, "height": 127, "weight": 25},
  {"name": "Gégé",      "age": 50, "height": 160, "weight": 83}
]
  
d3.select('div')
  .selectAll ('p')
  .data([1, 2, 3])
  .enter()
  .append('p')
  .text(dta => dta);

var svg = d3.select('svg')
        // .attr('width',  640)
        // .attr('height', 480)
        .append('circle')
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', 20)
        .style('fill', 'green');

d3.json('miserables.json', function(data) {
  console.log(data);
})