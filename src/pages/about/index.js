import logger from '../../common/util';

const H1 = document.createElement('h1');
H1.innerText = '关于我';
document.getElementById('app').appendChild(H1);

console.log('about');
logger('123');
