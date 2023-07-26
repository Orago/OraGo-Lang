import { forceObject } from './forceType.js';
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

function cloneImage (image){
  const cloned = new Image();

  if (image instanceof HTMLImageElement){
    cloned.crossOrigin = image.crossOrigin ?? 'anonymous';
    cloned.src = image.src;
  }

  else if (image instanceof HTMLCanvasElement)
    cloned.src = canvas.toDataURL();

  return cloned;
}

class sprites {
  constructor (options){
    const { host = '' } = forceObject(options);
    this.host = host;
    this.cache = {};
    this.loading = [];
  }

  parseUrl(url){
    if (url.startsWith('/')) return this.host + url;

    return url;
  }

  clear (){
    this.cache = {};
    this.loading = [];
  }

  has (url){
    return this.cache.hasOwnProperty(url);
  }

  get (url, onLoad){
    url = this.parseUrl(url);

    const result = this.has(url) ? this.cache[url]?.img : this.loadSingle(url, onLoad).img;

    if (typeof onLoad == 'function')
      onLoad(result);

    if (this.has(url)){
      result.dispatchEvent(
        new Event('load')
      );
    }

    return result;
  }

  unset (url){
    if (this.has(url))
      delete this.cache[url];
  }

  loadSingle (url){
    const img = new Image();

    if (this.loading.includes(url)) return img;

    this.loading.push(url);
    
    img.crossOrigin = 'anonymous';
    img.src = url;

    img.addEventListener('load', url => this.loading = this.loading.filter(urlToRemove => urlToRemove === url))

    return this.cache[url] = { img };
  }

	async loadSinglePromise (url){
    const img = new Image();

		img.crossOrigin = 'anonymous';
		img.src = url;

		return new Promise((resolve, reject) => {
			img.onload = () => {
				this.cache[url] = { img };

				resolve(img);
			};
			
			img.onerror = reject;
		});
	}

	async promise (url){
    url = this.parseUrl(url);

		return this.has(url) ? this.cache[url].img : await this.loadSinglePromise(url);
	}
}

export default sprites;

export { cloneImage };