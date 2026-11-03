import { CLASSES } from '../data/classes.js';
import { WEAPONS } from '../data/weapons.js';
import { formatTime, clamp } from '../core/math.js';
import { getProfile } from '../storage/Profile.js';

export class Interface {
  constructor(){
    this.el={};
    const ids=['menu','hud','level-screen','pause-screen','end-screen','best-label','best-kills',
      'hero-name','level-label','hp-fill','hp-label','xp-fill','xp-label','time-label','kills-label',
      'weapon-list','upgrade-options','level-up-number','end-kicker','end-title','end-description',
      'end-time','end-kills','end-level','sound-toggle'];
    for(const id of ids)this.el[id]=document.getElementById(id);
    this.classId='guardian';this.game=null;this.lastHud=0;this.lastWeapons='';
    document.querySelectorAll('[data-class]').forEach(btn=>btn.addEventListener('click',()=>{
      this.classId=btn.dataset.class;
      document.querySelectorAll('[data-class]').forEach(el=>el.classList.toggle('active',el.dataset.class===this.classId));
    }));
  }
  connect(game){
    this.game=game;
    const action=(id,fn)=>document.getElementById(id).addEventListener('click',fn);
    action('start-button',()=>game.start(this.classId));
    action('pause-button',()=>game.togglePause());
    action('resume-button',()=>game.togglePause());
    action('pause-restart',()=>game.start(game.lastClass));
    action('pause-menu',()=>game.backToMenu());
    action('again-button',()=>game.start(game.lastClass));
    action('end-menu',()=>game.backToMenu());
    action('sound-toggle',()=>{
      const enabled=game.audio.toggle();this.el['sound-toggle'].textContent=enabled?'♫':'×';
    });
    this.el['sound-toggle'].textContent=game.audio.enabled?'♫':'×';
    this.el['upgrade-options'].addEventListener('click',e=>{
      const button=e.target.closest('button[data-upgrade]');
      if(button)game.selectUpgrade(button.dataset.upgrade);
    });
    this.showMenu();
  }
  hideScreens(){
    for(const id of ['menu','level-screen','pause-screen','end-screen'])this.el[id].hidden=true;
  }
  showMenu(){
    this.hideScreens();this.el.hud.hidden=true;this.el.menu.hidden=false;
    const best=getProfile();
    this.el['best-label'].textContent=best.runs?formatTime(best.bestTime):'—';
    this.el['best-kills'].textContent=best.runs?best.bestKills+' inimigos derrotados • '+best.runs+' partidas':'Seu primeiro legado começa agora.';
  }
  showPlaying(){
    this.hideScreens();this.el.hud.hidden=false;
    if(this.game)this.update(this.game,true);
  }
  showPause(paused){
    this.el['pause-screen'].hidden=!paused;
    if(!paused)this.showPlaying();
  }
  showLevel(level,choices){
    this.game.currentChoices=choices;
    this.el['level-up-number'].textContent=level;
    const box=this.el['upgrade-options'];box.replaceChildren();
    for(const choice of choices){
      const button=document.createElement('button');button.className='upgrade-option';button.dataset.upgrade=choice.id;
      const icon=document.createElement('span');icon.className='upgrade-icon';icon.textContent=choice.glyph;
      const title=document.createElement('strong');title.textContent=choice.name;
      const desc=document.createElement('small');desc.textContent=choice.description;
      const tier=document.createElement('span');tier.className='upgrade-tier';tier.textContent=choice.tier;
      button.append(icon,title,desc,tier);box.appendChild(button);
    }
    this.el['level-screen'].hidden=false;this.el['pause-screen'].hidden=true;
    this.update(this.game,true);
  }
  showEnd(game,won){
    this.hideScreens();this.el.hud.hidden=true;this.el['end-screen'].hidden=false;
    this.el['end-kicker'].textContent=won?'✦ O ÉTER RECONHECE SUA VITÓRIA ✦':'✧ A NÉVOA REIVINDICOU UM HERÓI ✧';
    this.el['end-title'].textContent=won?'Lenda imortal':'A jornada terminou';
    this.el['end-description'].textContent=won?'Você resistiu a todas as ondas. O mundo ainda guarda novos segredos.':'Cada tentativa fortalece sua história. Volte mais preparado.';
    this.el['end-time'].textContent=formatTime(game.elapsed);
    this.el['end-kills'].textContent=game.kills;this.el['end-level'].textContent=game.player.level;
  }
  update(game,force=false){
    const now=performance.now();
    if(!force&&now-this.lastHud<110)return;
    this.lastHud=now;
    const p=game.player;
    this.el['hero-name'].textContent=CLASSES[p.classId].name;
    this.el['level-label'].textContent='NV. '+p.level;
    this.el['hp-fill'].style.width=clamp(p.hp/p.maxHp*100,0,100)+'%';
    this.el['hp-label'].textContent=Math.ceil(p.hp)+' / '+Math.ceil(p.maxHp)+' PV';
    this.el['xp-fill'].style.width=clamp(p.xp/p.nextXp*100,0,100)+'%';
    this.el['xp-label'].textContent=p.xp+' / '+p.nextXp;
    this.el['time-label'].textContent=formatTime(game.elapsed);
    this.el['kills-label'].textContent=game.kills;
    const signature=game.weapons.map(w=>w.id+':'+w.level).join('|');
    if(this.lastWeapons!==signature){
      this.lastWeapons=signature;
      const box=this.el['weapon-list'];box.replaceChildren();
      for(const w of game.weapons){
        const chip=document.createElement('div');chip.className='weapon-chip';chip.title=WEAPONS[w.id].name+' nível '+w.level;
        const icon=document.createElement('strong');icon.textContent=WEAPONS[w.id].glyph;
        const number=document.createElement('small');number.textContent='NV '+w.level;
        chip.append(icon,number);box.appendChild(chip);
      }
    }
  }
}
