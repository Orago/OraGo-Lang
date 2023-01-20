class sprites {
  constructor (){
    this.cache = {};
    this.loading = [];
  }

  has (url){
    return this.cache.hasOwnProperty(url);
  }

  get (url){
    return this.has(url) ? this.cache[url] : this.loadSingle(url);
  }

  loadSingle (url){
    const img = new Image();

    if (this.loading.includes(url)) return img;

    this.loading.push(url);

    img.src = url;

    img.onload = url => {
      this.loading = this.loading.filter(urlToRemove => urlToRemove === url);
    }
    
    this.cache[url] = img;

    return img;
  }
}

export default sprites;