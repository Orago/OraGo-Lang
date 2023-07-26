import { forceNumber } from './forceType.js';

function flipRotate(input, max = 360) {
  if (input < 0) input = -input + 180;

  const val = Math.floor((input % max / (max / 2)) * 100) / 100;
  const scaleForwards = (val <= .5 ? val : 1 - val) * 2;
  const scaleBackwards = (val <= 1.5 ? val - 1 : 1 - (val - 1)) * -2;

  return val <= 1 ? scaleForwards : scaleBackwards;
}

const clamp = (number, { min = -Infinity, max = Infinity } = {}) => Math.min(Math.max(number, min), max);

class brushCanvas {
  constructor (settings = {}){
    let { dimensions = [100, 100], inputCanvas, resolution } = settings instanceof Object ? settings : {};

    this.swapCanvas({
      canvas: inputCanvas ?? new OffscreenCanvas(...dimensions),
      dimensions
    });

    this.updateResolution(resolution);
  }

  updateResolution (resolution){
    const amount = forceNumber(resolution);

    this.resolution = clamp(amount, { min: 30, max: 100 });
  }

  swapCanvas ({ canvas, ctx = canvas.ctx ?? canvas.getContext('2d'), dimensions }){
    this.canvas = canvas;
    this.ctx = ctx;
    this.canvas.ctx = ctx;

    this.canvas.width = dimensions[0];
		this.canvas.height = dimensions[1];
  }

  //#region //* Functions / Utils *//
  center (){
    return {
      x: this.width / 2,
      y: this.height / 2
    }
  }

  dimensions () {
    return {
      width: this.width,
      height: this.height
    };
  }

  get width (){
    return this.canvas.width;
  };

  get height (){
    return this.canvas.height;
  };

  forceDimensions ({ width, height }){
    if (typeof width == 'number' && this.canvas.width != width)
      this.canvas.width = width;

    if (typeof height == 'number' && this.canvas.height != height)
      this.canvas.height = height;
  };

	/* Draw */
	image (
		image,
		[x = 0, y = 0, w = image?.width, h = image?.height] = [],
		[newx = 0, newy = 0, neww = image?.width, newh = image?.height] = [],
		options = {}
	) {

    if ((image instanceof Image || image instanceof HTMLCanvasElement || image instanceof OffscreenCanvas) && this.ctx){
      const { ctx: c } = this;

      if (!c || !image) return;

      let { flip, rotation, rotationX, rotationY, center = {}, debug = false } = options;

      if (typeof rotation != 'number') rotation = 0;

      x = Math.floor(x ?? 0);
      y = Math.floor(y ?? 0);
      w = Math.floor(w ?? image.width);
      h = Math.floor(h ?? image.height);

      center.x ??= neww / 2;
      center.y ??= newh / 2;

      c.save();

      if (flip?.[0] == true) {
        c.scale(-1, 1);

        newx = newx * -1 - neww;
      }

      if (flip?.[1] == true) {
        c.scale(1, -1);

        newy = (newy * -1) - newh;
      }

      if (rotation || rotationX || rotationY){
        c.translate(newx + center.x, newy + center.y);
        c.rotate(rotation * Math.PI / 180);

        if (typeof rotationX == 'number' && rotationX != 0) c.scale(flipRotate(rotationX, 360), 1);
        if (typeof rotationY == 'number' && rotationY != 0) c.scale(1, flipRotate(rotationY, 360));

        try {
          c.drawImage(image, x, y, w, h, - center.x, - center.y, neww, newh);
        }
        catch (err){}
      }
      else {
        try { c.drawImage(image, x, y, w, h, newx, newy, neww, newh); }
        catch (err) {}
      }

      c.restore();

    }

		return this;
	}

	text (values) {
    if (!this.ctx) return;

    const { ctx } = this;

    let {
      center,
      text,
      color = 'black', font = 'Arial', weight = 'normal', size: s = 16,
    } = values;

    let { x = 0, y = 0, h } = values;

    x = x | 0;
    y = y | 0;

    ctx.font = `${weight} ${s}px ${font}`;

    let metrics = ctx.measureText(text);

    ctx.fillStyle = color;
    ctx.textAlign = center ? 'center' : 'start';

    ctx.save();
    ctx.beginPath();

    if (typeof h == 'number') ctx.translate(x, y + metrics.actualBoundingBoxAscent + (h - metrics.actualBoundingBoxAscent) / 2);
    else ctx.translate(x, y);

    ctx.fillText(text, 0, 0);

    ctx.restore();
	}

	multiline(values = {}) {
		let {
			text,
			lineSpacing = 5,
			x = 0, y = 0,
			w,
			h,
			size: s
		} = values;

		const startY = y;
		const textItems = [];

		if (![w, s].map($ => typeof $ == 'number').includes(false)) {
			const words = text.split(' ');
			let line = '';

			y += (lineSpacing + s / 2);

			for (let n = 0; n < words.length; n++) {
				let testLine = line + words[n] + ' ';
				let metrics = this.getTextWidth({ ...values, text: testLine });

				if (metrics > w && n > 0) {
					textItems.push({ ...values, text: line, x, y, w: null, h: null })

					line = words[n] + ' ';
					y += (lineSpacing + s);
				}
				else line = testLine;
			}

			textItems.push({ ...values, text: line, x, y, w: null, h: null });
		}

		return {
			w,
			h: y - startY + lineSpacing,
			render: () => {
				for (let values of textItems)
					this.text(values)
			}
		}
	}

	shape = (values) => {
		if (!this.ctx) return;

    const { ctx } = this;

    let { rotation = 0, endX, endY, color = 'pink', center = {} } = values;
    let { x = 0, y = 0, w = 0, h = 0 } = values;

    x = x | 0;
    y = y | 0;
    w = w | 0;
    h = h | 0;

    center.x ??= w / 2;
    center.y ??= h / 2;

    ctx.fillStyle = color;

    if (endX && endY) rotation = Math.atan2(endY - y, endX - x) * 180 / Math.PI;

    ctx.save();
    ctx.beginPath();

    if (rotation){
      ctx.translate(x + center.x, y + center.y);
      ctx.rotate(rotation * Math.PI / 180);

      try {
        ctx.fillRect(- center.x, - center.y, w, h);
      }
      catch (err){}
    }
    else {
      try { ctx.fillRect(x, y, w, h);}
      catch (err) {}
    }
    
    ctx.restore();
	}

	circle (values) {
		if (!this.ctx) return;

    const { ctx } = this;
    const { color = 'grey', x = 0, y = 0, radius = 10, stroke, strokeWidth } = values;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();

    if (stroke) {
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }

    ctx.restore();
	}

	gradient ({
    shape = 'square',
    percent: { w: percentW = 0, h: percentH = 0 } = {},
    colorStart = 'black', colorEnd = 'white',
    x, y, w, h,
    radius = .5
  } = {}) {
    if (!this.ctx) return;

    const { ctx } = this;

    const [gx, gy] = [(x + w * percentW), (y + h * percentH)];
    let gradient

    if (shape == 'radial') gradient = ctx.createRadialGradient(gx, gy, 0, gx, gy, w * radius);
    else gradient = ctx.createLinearGradient(gx, gy, x + w, y + h);

    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
	}

	getTextWidth (values) {
		const c = document.createElement('canvas');
		const ctx = c.getContext('2d');

		ctx.font = "";

		this.text({
			color: 'white',
			font: values.font || 'Tahoma',
			size: values.size || 20,
			text: "",
			x: -10000,
			y: -10000
		});

		return this.ctx.measureText(values.text).width
	};

  clear () {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    return this;
  }

  clearRect (x, y, w, h) {
    this.ctx.clearRect(x, y, w, h);

    return this;
  }

	setSmoothing = (state) => {
		this.ctx.imageSmoothingEnabled = state == true;

		return this;
	};

  resizable = () => {
    const resize = () => {
			const { canvas, setSmoothing } = this;
			const { documentElement: dE } = document;

      if (HTMLCanvasElement && canvas instanceof HTMLCanvasElement && document.body.contains(canvas)){
        canvas.style.width = '100%';
			  canvas.style.height = '100%';
      }

			canvas.width = dE.clientWidth * clamp(this.resolution, { min: .5, max: 1 });
			canvas.height = dE.clientHeight * clamp(this.resolution, { min: .5, max: 1 });

			setSmoothing(false);
		}

    if ('addEventListener' in window)
      window.addEventListener('resize', resize);
		resize();
		return this;
	}

  get get () {
    return this;
  }

	get imgData (){
		return this.ctx.getImageData(0, 0, this.width, this.height);
	}
  //#endregion //* Functions / Utils *//
}

export default brushCanvas;