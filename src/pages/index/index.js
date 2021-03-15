import './index.css';
import logger from '../../common/util';

const r = document.createElement('div');
r.className = 'test';
document.getElementById('app').appendChild(r);

const link = document.createElement('a');
link.innerText = '关于我';
link.href = '/about.html';
document.getElementById('app').appendChild(link);

console.log('home');
logger('123345');
