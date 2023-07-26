import { newNode as node } from './dom.js';
import brushCanvas from './brushCanvas.js';

const TO_RADIANS = Math.PI / 180;

function outOfBounds (x, y, w, h, canvasWidth, canvasHeight){
  return (
    0 > x + w ||
    0 > y + h ||
    canvasWidth  < x ||
    canvasHeight < y //
  )
}

class brush extends brushCanvas {
	container = node.div;
  ui = node.div;

	constructor(settings) {
		const fullFloatStyling = settings?.style ?? {
			position: 'absolute',
			top: 0,
			left: 0,
      width: '100%',
      height: '100%'
		};
		const inputCanvasEl = node.canvas.styles(fullFloatStyling);
  
		const inputCanvas = inputCanvasEl.node;

    super({
      ...settings,
      inputCanvas
    });

		this.el = inputCanvasEl;

		this.container(this.canvas, this.ui);
	}

	display(parent) {
		if (!parent?.contains(this.container.node))
			parent.append(this.container.node);
	}

  get createCanvas (){
    return brushCanvas;
  }

  clear (){
    super.clear();
  }
}
export {
  brush,
  brushCanvas
}
export default brush;