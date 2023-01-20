import bind from './_bind.js';



function colorImage(image, red = 0, green = 0, blue = 0) { // image is a canvas image
  const canvas = document.createElement('canvas');
	const c = canvas.getContext('2d');
	const { width, height } = image;

	canvas.width = width;
	canvas.height = height;
	
	c.drawImage(image, 0, 0);

	const myImg = c.getImageData(0, 0, width, height);

	for (let t = 0; t < myImg.data.length; t += 4) { 
		myImg.data[t] += red;
		myImg.data[t+1] += green;
		myImg.data[t+2] += blue;
	}

	c.clearRect(0, 0, width, height);

	c.putImageData(myImg, 0, 0);

	return canvas;
}

class brush {
  constructor (dimensions = [100, 100]){
    bind(this, {
      canvas: document.createElement('canvas')
    })
    
    this.canvas.width = dimensions[0];
    this.canvas.height = dimensions[1];

    this.ctx = this.canvas.getContext("2d");
  }

  center = () => ({
    x: this.canvas.width / 2,
    y: this.canvas.height / 2
  });

	dimensions = () => ({
		width: this.canvas.width,
		height: this.canvas.height
	})

  width  = () => this.canvas.width;
  height = () => this.canvas.height;

  /* Draw */
  image (
    image,
    [x = 0, y = 0, w = image.width, h = image.height] = [],
    [ newx = 0, newy = 0, neww = image.width, newh = image.height] = [],
    options = {}
	){
		const { tint, flip, rotation, center = {} } = options;
    const { ctx: c } = this;

		center.x ??= 0;
		center.y ??= 0;

    c.save();

    if (flip?.[0] == true){
      c.scale(-1, 1);
      newx *= -1;
      newx -= neww;
    }

    if (flip?.[1] == true){
      c.scale(1, -1);
      newy *= -1;
      newy -= newh;
    }

    c.translate(newx + center.x, newy + center.y);

		if (Array.isArray(tint)){
			image = colorImage(image, ...tint)
		}

		if (rotation){
			c.rotate(rotation * Math.PI / 180);
		}

    c.drawImage(image, x, y, w, h, - center.x, - center.y, neww, newh);

    c.restore();

    return this;
  }

  text = (values) => {
    const { ctx, canvas } = this;
    
    let {
      center,
      text, rotation, rerotate, DFR,
      color = "black", font = "Arial", size: s = 16
    } = values;

    let { x = 0, y = 0, w, h } = values;

    const setFont = size => ctx.font = size + "px " + font;

    setFont(s);
    
    let metrics = ctx.measureText(text)

    ctx.fillStyle = color;
    
    

    ctx.textAlign = center ? "center" : "start";

    if (typeof w == 'number'){
      s = 500;

      do {
        s--;
        setFont(s)
      } while ((metrics = ctx.measureText(text)).width > w);
    }

    if (!rotation) rotation = 0;

    ctx.save();
    ctx.beginPath();

    if (typeof h == 'number'){
      ctx.translate(x, y + metrics.actualBoundingBoxAscent + (h - metrics.actualBoundingBoxAscent) / 2);
    }
    else {
      ctx.translate(x, y);
    }
    ctx.fillText(text, 0, 0);
    ctx.fill();
    ctx.restore();
  }

  shape = (values) => {
    const ctx = this.ctx;
    let { tx, ty, tw, th, text, rotation, DFR, endX, endY, color, scale } = values;
    let { x, y, w, h } = values;

    color ??= 'pink';

    ctx.fillStyle = color;

    rotation ??= 0;

    if (endX && endY) rotation = Math.atan2(endY - y, endX - x) * 180 / Math.PI;
    
    ctx.save();
    ctx.beginPath();

    // ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);
    
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  circle = function(values) {
    const ctx = this.ctx;
    let { color, x, y, radius, stroke, strokeWidth } = values;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = color || "red";
    ctx.fill();

    if (stroke) {
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }

    ctx.restore();
  }

  gradient = (values) => {
    const ctx = this.ctx,
          gradient = ctx.createLinearGradient(values.gx || 0, values.gy || 0, values.gx1 || 0, values.gy1 || 0);
    
    gradient.addColorStop(0, values.colorStart || "black");
    gradient.addColorStop(1, values.colorEnd   || "white");

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(values.x, values.y, values.w, values.h);
  }

  getTextWidth = function (values){
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    ctx.font = ""
    
    this.text({ color: "white", font: values.font || "Tahoma", s: values.s || 20, text: "", x: -10000, y: -10000 });

    return this.ctx.measureText(values.text).width
  };

  clear = () => this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

  setSmoothing = (state) => {
		this.ctx.imageSmoothingEnabled = (state == true) ? true : false;

		return this;
	};

  resizable = () => {
    const resize = () => {
			let { canvas, setSmoothing } = this;
			let { documentElement: dE } = document;

			canvas.setAttribute("width", dE.clientWidth);
			canvas.setAttribute("height", dE.clientHeight);

			canvas.style.width = "100%";
			canvas.style.height = "100%";

			setSmoothing(false);
		}
		window.addEventListener("resize", resize);
    resize()

		return this;
	}
}

export default brush