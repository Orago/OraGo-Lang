import { flatLang, splitCommas, convertToType, isVariable, parseVariable, isArray, parseArray, trimSection } from './flatlang/index.js'
import { brush as brushTool, engine as brushEngine, keyboard, cursor } from './engine/main.js';
import scenes from './scenes/index.js';

let brush = new brushTool(),
		engine = new brushEngine(brush);

const gameObjects = {};

document.querySelector('#game').append(brush.canvas);
	

flatLang({
	functions: ({ langDict }) => ({
		brush: options => {
			if (options.includes('enable-smoothing')) brush.setSmoothing(true);
			if (options.includes('disable-smoothing')) brush.setSmoothing(false);
		},
		engine: options => {
			if (options.includes('allow-zoom')) brush.allowZoom();
			if (options.includes('resizable')) brush.resizable();
		},
		alert: options => {
			alert(...options)
		},
		gameObject: (options) => {
			const objectData = {};
			const renderData = [];

			for (let option of options){
				if (isVariable(option)){
					const [key, value] = parseVariable(option);
					
					if (key == 'render' && Array.isArray(value)){
						for (let optValue of value){
							let [method, ...opts] = splitCommas(optValue).map($ => convertToType(trimSection($))[0]);

							console.log(opts)

							if (method == 'shape'){
								renderData.push({
									method,
									color: opts[0],
									x: opts[1],
									y: opts[2],
									w: opts[3],
									h: opts[4]
								});
							}


						}

					}
					if (key == 'dimensions'){
						let [x, y, w, h] = splitCommas(value).map($ => convertToType($)[0]);
						objectData.x = x;
						objectData.y = y;
						objectData.w = w;
						objectData.h = h;
					}
					else 
						objectData[key] = value;
				}
			}

			if (!objectData.hasOwnProperty('id'))
				return console.error('Cannot Instance Game Object Without ID');
			
			if (gameObjects.hasOwnProperty(objectData?.id))
				gameObjects[objectData.id].pop();

			

			// const [x = 0, y = 0, w = 0, h = 0]
			gameObjects[objectData.id] = engine.object({
				...objectData,
				render: function (){
					const { canvas } = this;

					for (let { method, color, x, y, w, h} of renderData){
						console.log(x, y, w, h)

						if (method == 'shape'){
							canvas.shape({
								color: 'black',
								x: x == '~' ? this.x : x,
								y: y == '~' ? this.y : y,
								w: w == '~' ? this.w : w,
								h: h == '~' ? this.h : h
							});
						}
					}
				}
			}).push()
		}
	})
})`
engine,resizable

gameObject,(id = 'cool'),(dimensions=50,50,50,50),(
	render = ["'shape','red', ~, ~, ~, ~"]
)


`