import { newScene  } from '../util/newScene.js';

// import worldScene from './world.js';

export default newScene({
  open: ({ scene, openScene, brush, engine }) => {
  
    const renderer = engine.object({
      x: 0,
      y: 0,
      render: function (){
        const { canvas } = this;
        const text = `${engine?.renderRepeater?.frame?.fps} fps`;
          
        brush.text({
          text,
          color: 'blue',
          x: 50,
          y: 50
        });
      }
    }).push()

    scene.objects.push(renderer);

    const play_button = engine.object({
      button: true,
      y: 400,
      h: 100,
      update: function () {
        this.w = brush.width() / 3.5;
        this.x = (brush.width() - this.w) / 2;
      },
      render: function (){
        let { x, y, w, h } = this;

        brush.shape({
          color: 'blue',
          x, y, w, h
        });

        brush.text({
          text: 'Play',
          color: 'red',
          x: x + w / 2,
          y,
          w: w / 4,
          h,
          center: true
        });
      },
      onClick: () => {
        openScene('world')
      }
    }).push()

    scene.objects.push(play_button)
  },

  close: ({ scene }) => {
    for (let object of scene.objects) object.pop();
  }
});