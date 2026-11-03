import { WarriorStage } from './WarriorStage.js';

/** Lazy-loaded from the original Canvas game; fallback remains usable. */
export class WarriorSpriteRenderer {
  constructor(){
    // A modest fixed-resolution draw target avoids a full-screen WebGL pass.
    this.stage=new WarriorStage({width:192,height:232,studio:false});
    this.failed=false;
  }
  draw(ctx,actor,x,y,time,dt=1/60){
    if(this.failed)return false;
    try {
      this.stage.paint(ctx,actor,x,y,time,dt);
      return true;
    } catch(error) {
      console.warn('[Crônicas do Éter] Render 3D indisponível; usando desenho 2D.',error);
      this.failed=true;this.dispose();return false;
    }
  }
  dispose(){if(this.stage){this.stage.dispose();this.stage=null;}}
}
