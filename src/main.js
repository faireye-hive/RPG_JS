import './styles.css';
import { Game } from './engine/Game.js';
import { Interface } from './ui/Interface.js';

const canvas=document.getElementById('game');
const ui=new Interface();
const game=new Game(canvas,ui);
ui.connect(game);

// Somente durante desenvolvimento: facilitar auditoria sem acoplar subsistemas.
if(import.meta.env.DEV)window.__ETER_DEV__={game,ui};
