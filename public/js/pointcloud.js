import Loader from '../api-web-devs/widgets/loader.js'
import DropZone from '../api-web-devs/ui/box-input-files.js';

let geometry;
let colorlegend = []

export default class PointCloudExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);
		this._group = null;
        this._button = null;

        this.pointSize = 50;

        // For PointCloud colouring and D3 legend
        // this.createColorScale()

        //options.globalOffset = new THREE.Vector3(0,0,0)
    }

    load() {
        console.log('Point Cloud extension loaded')
        console.log(urnModel)
        // var container =  document.getElementById("drop-zone")
        // window.dropzone = new DropZone(container);
        return true;
    }

    unload() {
        // Clean our UI elements if we added any
       if (this._group) {
          this._group.removeControl(this._button);
          if (this._group.getNumberOfControls() === 0) {
              this.viewer.toolbar.removeControl(this._group);
          }
      }
      console.log('PointCloudExtension has been unloaded');
      return true;
    }

    createColorScale(){

        var particle = [];
        var particleColor = [];
        var humans = [];
        var humansColor = [];
      
		
            if(simulation.Simulator == "Cadmium"){
                if(configuration["styles"].length != 0){

                        for(let i=0; i<configuration["styles"][2]["buckets"].length;i++){
                            humans.push(configuration["styles"][2]["buckets"][i].start);
                            humansColor.push("rgb(" + configuration["styles"][2]["buckets"][i].color + ")")
                        } 
        
                        for(let j=0; j<configuration["styles"][1]["buckets"].length;j++){
                            particle.push(configuration["styles"][1]["buckets"][j].start);
                            particleColor.push("rgb(" + configuration["styles"][1]["buckets"][j].color + ")")
                        }               
                    }
            }

            //for cd++ and lopez
            if(simulation.Simulator == "CDpp" || simulation.Simulator == "Lopez" ){
                if(style.length){
                    for(let k=0; k<style[0]["buckets"].length;k++){
                        particle.push(style[0]["buckets"][k].start);
                        particleColor.push("rgb(" + style[0]["buckets"][k].color + ")")
                    }
                }
            }

            if(particleColor.length<=0){
                return 0;
            }
            let percent = 0;
            let added = 100/particleColor.length;
            //colorlegend = [];
           //colorlegend.push({"offset":percent + "%","color":particleColor[0]}) 
            for(let  i = 1;i<particleColor.length;i++){
                percent += added;
                colorlegend.push({"offset":percent + "%","color":particleColor[i]})    
                //percent += added;         
            }
            
            this.colorScaleforHumans = d3
            .scaleLinear()
            .domain(humans)
            .range(humansColor);
                    
            this.colorScaleforParticles = d3
            .scaleLinear()
            .domain(particle)
            .range(particleColor);
        
    }

    _renderCloud(){
      
          this.pointsParticle = new THREE.PointCloud(
            this._generatePointCloudGeometry(),
            this._generateShaderMaterial()
            );

            if(urnModel == "dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZWdyYXRpb25odWJzL1NoYXJlZF9Qcm9qZWN0X0FFQyUyMEhhY2thdGhvbl84JTIwRmxvb3IucnZ0")
               this.pointsParticle.scale.set(configuration["3DBIMInfo"].dimensions[0],configuration["3DBIMInfo"].dimensions[1], configuration["3DBIMInfo"].dimensions[2]); //Ofc
            else
                this.pointsParticle.scale.set(simulation.Dimensions.x,simulation.Dimensions.y,simulation.Dimensions.z); //Ofc

          this.viewer.impl.createOverlayScene('particles');
          this.viewer.impl.addOverlay('particles', this.pointsParticle);
      
          this.pointsHuman = new THREE.PointCloud(
            this._generatePointCloudGeometry(),
            this._generateShaderMaterial()
            );
          this.pointsHuman.scale.set(simulation.Dimensions.x,simulation.Dimensions.y,simulation.Dimensions.z); //Ofc
          this.viewer.impl.createOverlayScene('humans');
          this.viewer.impl.addOverlay('humans', this.pointsHuman);
      
    }
    
    /**
     * Generates {@link https://github.com/mrdoob/three.js/blob/r71/src/core/BufferGeometry.js|BufferGeometry}
     * with (_width_ x _length_) positions and varying colors. The resulting geometry will span from -0.5 to 0.5
     * in X and Y directions, and the Z value and colors are computed as functions of the X and Y coordinates.
     *
     * Based on https://github.com/mrdoob/three.js/blob/r71/examples/webgl_interactive_raycasting_pointcloud.html.
     *
     * @param {number} width Number of points along the X axis.
     * @param {number} length Number of points along the Y axis.
     * @returns {BufferGeometry} Geometry that can be used by {@link https://github.com/mrdoob/three.js/blob/r71/src/objects/PointCloud.js|PointCloud}.
     */
    _generatePointCloudGeometry() {
        let geometry = new THREE.BufferGeometry();
        let numPoints = simulation.MaxX * simulation.MaxY;
		let positions = new Float32Array(numPoints * 3);
        let colors = new Float32Array(numPoints * 3);
        let color = new THREE.Color();
        let opacity = new Float32Array(numPoints * 2);

        var xaxisOffset=0;
        var yaxisOffset=0;
        var zaxisOffset=-7;

        if(configuration != null){
             xaxisOffset = configuration["3DBIMInfo"].offsets[0].x;//0.275;
             yaxisOffset = configuration["3DBIMInfo"].offsets[0].y//0.08;
             zaxisOffset = configuration["3DBIMInfo"].offsets[0].z;//-1.5;
        }
        
        for (var i = 0; i < simulation.Frames.length; i++){
            var frame = simulation.Frames[i];
            for (var j = 0; j < frame.StateMessages.length; j++) {
                var m = frame.StateMessages[j];

                let k = m.X * simulation.MaxY + m.Y;
                let u = m.X / simulation.MaxX - xaxisOffset;//xaxisOffset;
                let v = m.Y / simulation.MaxY - yaxisOffset;//yaxisOffset;

                positions[3 * k] = u;
                positions[3 * k + 1] = v;
                positions[3 * k + 2] = zaxisOffset;

                opacity[2 * k] = 30;
                opacity[2 * k + 1] = 0;

                color.setRGB(255/255, 255/255, 255/255);
                color.toArray(colors, k * 3);
            }
        }

		geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.addAttribute('uv', new THREE.BufferAttribute(opacity, 2));
        geometry.computeBoundingBox();
        geometry.isPoints = true; // This flag will force Forge Viewer to render the geometry as gl.POINTS
        
		return geometry;
    }

    _generateShaderMaterial() {

        const vShader = `uniform float size;
        varying vec3 vColor;
        varying vec2 vUv;
        void main() {
            vUv = uv;
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            gl_PointSize = size * ( size / (length(mvPosition.xyz) + 0.00001));
            gl_Position = projectionMatrix * mvPosition;
        }`

        const fShader = `varying vec3 vColor;
        varying vec2 vUv;
        uniform sampler2D sprite;
        void main() {
            gl_FragColor = vec4(vColor,vUv.y) ;//* texture2D( sprite, gl_PointCoord );
            if (gl_FragColor.x < 0.2) discard;
        }`

        return new THREE.ShaderMaterial( {
            uniforms: {
                size: { type: 'f', value: this.pointSize},
                //sprite: { type: 't', value: THREE.ImageUtils.loadTexture("./particle_1.png") },
            },
            vertexShader: vShader,
            fragmentShader: fShader,
            transparent: true,
            vertexColors: true,
        });
    }
	
	onToolbarCreated() {
        // Create a new toolbar group if it doesn't exist
        this._group = this.viewer.toolbar.getControl('allMyAwesomeExtensionsToolbar');
        if (!this._group) {
            this._group = new Autodesk.Viewing.UI.ControlGroup('allMyAwesomeExtensionsToolbar');
            this.viewer.toolbar.addControl(this._group);
        }

        // Loding Simulation button
        this._button = new Autodesk.Viewing.UI.Button('LoadingResultsButton');
        this._button.onClick = (ev) => {

            //conversion of simulation results using DEVS WEB API
            var loader = new Loader();
            loader.Load();

        };
        this._button.setToolTip('Load Simulation');
        this._button.addClass('loadSimulationIcon');
        this._group.addControl(this._button);

        //visulaize the simulation results button
        this._button = new Autodesk.Viewing.UI.Button('RunningSimulationButton');
        this._button.onClick = (ev) => {

            this.createColorScale();

            this._renderCloud();
            
            this._appearLegend();

            var i = 0;

            var interval = setInterval(() => {
                this._updatePointCloudGeometry(simulation.Frames[i]);
                if (++i == simulation.Frames.length) 
                    window.clearInterval(interval);
            }, 
            100);
        };

        this._button.setToolTip('Play Simulation');
        this._button.addClass('pointcloudIcon');
        this._group.addControl(this._button);
    }

    _updatePointCloudGeometry(frame) {

        this._updateParticles(frame)
        this.pointsParticle.geometry.attributes.uv.needsUpdate = true;
        this.pointsParticle.geometry.attributes.color.needsUpdate = true;
    
        this._updateSources(frame)
        this.pointsHuman.geometry.attributes.uv.needsUpdate = true;
        this.pointsHuman.geometry.attributes.color.needsUpdate = true;
    
        this.viewer.impl.invalidate(true, false, true);
        
    }

    _updateParticles(frame){
        var particleColors = this.pointsParticle.geometry.attributes.color.array;
        var uvs = this.pointsParticle.geometry.attributes.uv.array;

        for (var i = 0; i < frame.StateMessages.length; i++) {
            var m = frame.StateMessages[i];
           
            let k = m.X * simulation.MaxY + m.Y;
            let color;

            if(simulation.Simulator == "CDpp" || simulation.Simulator == "Lopez")
            {
                uvs[2 * k + 1] = 0.7;
                color = new THREE.Color(this.colorScaleforParticles(m.Value.out));//for cd++ and lopez
            }

            else if(simulation.Simulator == "Cadmium")
            {
                if(m.Value.type == -100 && m.Value.concentration != 0){               

                   // if(m.Value.type == -100){
                        uvs[2 * k + 1] = 0.7;   
                        //color = new THREE.Color(this.colorScaleforParticles(m.Value.concentration));
                   // }
                    // else{
                    //     color = new THREE.Color(this.colorScaleforHumans(m.Value.type));
                    //     uvs[2 * k + 1] = 0.7;
                    // }                      
                }
                else{
                      
                       uvs[2 * k + 1] = 0;
                }
                color = new THREE.Color(this.colorScaleforParticles(m.Value.concentration));
            }
            color.toArray(particleColors, k * 3);
        }   
    }

    _updateSources(frame) {
        var humancolors = this.pointsHuman.geometry.attributes.color.array;
        var uvss = this.pointsHuman.geometry.attributes.uv.array;

        for (var i = 0; i < frame.StateMessages.length; i++) {
            var m = frame.StateMessages[i];
           
            let k = m.X * simulation.MaxY + m.Y;

            let color;
            if(m.Value.type != -100){
                color = new THREE.Color(this.colorScaleforHumans(m.Value.type));
                uvss[2 * k + 1] = 0.7; 
            }
            else{
                color = new THREE.Color(0xffff00)
                uvss[2 * k + 1] = 0; 
            }
                

            color.toArray(humancolors, k * 3);
        }
        
    }

    _appearLegend(){
        
            // append a defs (for definition) element to your SVG
            var svgLegend = d3.select('#legend').append('svg');
            var defs = svgLegend.append('defs');
        
            // append a linearGradient element to the defs and give it a unique id
            var linearGradient = defs.append('linearGradient')
                .attr('id', 'linear-gradient');
        
            // horizontal gradient
            linearGradient
                .attr("x1", "0%")
                .attr("y1", "0%")
                .attr("x2", "100%")
                .attr("y2", "0%");
        
            // append multiple color stops by using D3's data/enter step
            //#FFFFBE for yellow sprite - particle_!
            linearGradient.selectAll("stop")
                .data(colorlegend
                    // [
                    //     {offset: "0%", color: "#0000FF"},
                    //      {offset: "36.36%", color: "#FFFFFF"},
                    //      {offset: "100%", color: "#FF0000"}
                    // ]
                )
                .enter().append("stop")
                .attr("offset", function(d) { 
                    return d.offset; 
                })
                .attr("stop-color", function(d) { 
                    return d.color; 
                });
        
            // append title
            svgLegend.append("text")
                .attr("class", "legendTitle")
                .attr("x", 0)
                .attr("y", 20)
                .style("text-anchor", "mid")
                .text("CO2 Concentration (ppm)");
        
            // draw the rectangle and fill with gradient
            svgLegend.append("rect")
                .attr("x", 0)
                .attr("y", 30)
                .attr("width", 300)
                .attr("height", 15)
                .style("fill", "url(#linear-gradient)");
        
                //create tick marks
                var xLeg = d3.scale.ordinal()
                .domain([100,500,1200])
                .range([0,100,290])

                var axisLeg = d3.axisBottom(xLeg);

                svgLegend
                    .attr("class", "axis")
                    .append("g")
                    .attr("transform", "translate(10, 40)")
                    .call(axisLeg);
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('PointCloudExtension', PointCloudExtension);