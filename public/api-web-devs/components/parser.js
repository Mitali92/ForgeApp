'use strict';

import Core from '../tools/core.js';
import Evented from "../components/evented.js";
import ChunkReader from "../components/chunkReader.js";
import SimulationDEVS from "../simulation/simulationDEVS.js";
import SimulationCA from "../simulation/simulationCA.js";
import SimulationIRR from "../simulation/simulationIRR.js";
import Model from "../simulation/model.js";

export default class Parser extends Evented { 
	
	ReadByChunk(file, delegate) {		
		return ChunkReader.ReadByChunk(file, "\n", (parsed, chunk, progress) => {
			if (!parsed) parsed = [];
		
			parsed = delegate(parsed, chunk);
			
			this.Emit("Progress", { progress: progress });
			
			return parsed;
		});
	}
	
	Parse(files) {
		var d = Core.Defer();

		var structure = files.find(function(f) { return f.name == 'structure.json'; });
		var messages = files.find(function(f) { return f.name == 'messages.log'; });
		var diagram = files.find(function(f) { return f.name == 'diagram.svg'; });
		var style = files.find(function(f) { return f.name == 'style.json'; });

		if (!structure || !messages) {
			d.Reject(new Error("A structure (.json) and messages (.log) file must be provided for the standardized DEVS parser."));
		
			return d.promise;
		}

		ChunkReader.Read(structure, this.ParseStructure.bind(this)).then(response => {
			this.structure = response;
			
			var type = this.structure.info.type;
			
			this.t = null;
						
			var p1 = this.ReadLog(messages);
			var p2 = ChunkReader.Read(diagram, (content) => content);
			var p3 = ChunkReader.Read(style, (content) => JSON.parse(content));
			
			Promise.all([p1, p2, p3]).then((data) => {			
				if (!data[0]) return d.Reject(new Error("Unable to parse the messages (.log) file."));
				
				var simulation = null;
				
				if (type == "DEVS") simulation = SimulationDEVS.FromJson(this.structure, data[0], data[1]);
				if (type == "Cell-DEVS") simulation = SimulationCA.FromJson(this.structure, data[0]);
				if (type == "Irregular Cell-DEVS") simulation = SimulationIRR.FromJson(this.structure, data[0]);
				
				d.Resolve({ simulation:simulation, style:data[2] || null });
			}, (error) => d.Reject(error));
		});
		
		return d.promise;
	}
	
	ParseStructure(file) {
		var json = JSON.parse(file);
		var index = {};
		var size;
		
		var models = json.nodes.map(n => {
			index[n.name] = n
						
			n.ports = [];
			n.links = [];
			
			// TODO: This doesn't work, size can be per model but the API uses a single size for the whole simulation.
			if (n.size) size = n.size;

			if (n.template) n.template = JSON.parse(n.template);
			
			return index[n.name];
		});
		
		if (!size) size = models.length;
		
		if (json.ports) json.ports.forEach(p => {
			if (p.template) p.template = JSON.parse(p.template);
			
			// When a DEVS model is connected to a Cell-DEVS model, there will be ports linked to the main model with coords, 
			// these are not in the models list. It has to be fixed someday.
			var model = index[p.model];
			
			if (!model) return;
			
			model.ports.push(p)
		});
		
		if (json.links) json.links.forEach(l => index[l.modelA].links.push(l));
		
		return {
			ports: json.ports, 
			info: json.info,
			models: models,
			size : size
		};
	}
	
	ReadLog(file) {
		return ChunkReader.ReadByChunk(file, "\n", (parsed, chunk, progress) => {
			if (parsed == null) parsed = [];
			
			parsed = this.ParseLogChunk(parsed, chunk);
			
			this.Emit("Progress", { progress: progress });
			
			return parsed;
		});
	}
	
	ParseLogChunk(parsed, chunk) {
		// If line has only one item, then it's a timestep. Otherwise, it's a simulation message, 
		// the format then depends on the whether it's a DEVS, Cell-DEVS or Irregular model
		var lines = chunk.split("\n");
		
		for (var i = 0; i < lines.length; i++) {
			var l = lines[i];
			var v = l.trim().split(",");
			
			if (v.length == 1) this.t = v[0];
			
			else if (this.structure.info.type == "Cell-DEVS") {
				var c = [+v[0],+v[1],+v[2]];
				var m = this.structure.models[0];
				var d = this.TemplateData(m.template, v.slice(3));
				
				// StateChangeMessages
				parsed.push({ time:this.t, cell:c, value:d });
			}
			else if (this.structure.info.type == "Irregular Cell-DEVS") {
				var m = this.structure.models[v[0]];
				var d = this.TemplateData(m.template, v.slice(1));
				
				// StateChangeMessages
				parsed.push({ time:this.t, model:m.name, value:d });
			}
			else if (this.structure.info.type != "Cell-DEVS") {
				var p = this.structure.ports[v[0]];
				var d = this.TemplateData(p.template, v.slice(1));
				
				// OutputMessages
				parsed.push({ time:this.t, model:p.model, port:p.name, value:d });
			}
		}
		
		return parsed;
	}
	
	TemplateData(template, values) {
		if (template.length != values.length) throw new Error("length mismatch between fields and message content. This is a required temporary measure until Cadmium outputs message information.");			
			
		var out = {};
		
		for (var i = 0; i < template.length; i++) {
			var f = template[i];
			
			if (values[i] != "") out[f] = values[i];
		}
		
		return out;
	}
}