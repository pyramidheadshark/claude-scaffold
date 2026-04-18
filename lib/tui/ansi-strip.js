'use strict';

const FG = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
const BG = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];

function convertSgr(codes) {
  if (!codes || codes === '0' || codes === '') return '{/}';
  const parts = codes.split(';');
  let out = '';
  let i = 0;
  while (i < parts.length) {
    const n = parseInt(parts[i], 10);
    if (isNaN(n) || n === 0)          out += '{/}';
    else if (n === 1)                 out += '{bold}';
    else if (n === 2)                 out += '{dim}';
    else if (n === 22)                out += '{/bold}';
    else if (n === 39 || n === 49)    out += '{/}';
    else if (n >= 30 && n <= 37)      out += `{${FG[n - 30]}-fg}`;
    else if (n >= 40 && n <= 47)      out += `{${BG[n - 40]}-bg}`;
    else if (n >= 90 && n <= 97)      out += `{bright${FG[n - 90]}-fg}`;
    else if (n >= 100 && n <= 107)    out += `{bright${BG[n - 100]}-bg}`;
    else if (n === 38 && parts[i + 1] === '5' && parts[i + 2] !== undefined) {
      out += `{${parseInt(parts[i + 2], 10)}-fg}`;
      i += 2;
    } else if (n === 48 && parts[i + 1] === '5' && parts[i + 2] !== undefined) {
      out += `{${parseInt(parts[i + 2], 10)}-bg}`;
      i += 2;
    }
    i++;
  }
  return out;
}

function processAnsi(str) {
  return str
    .replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, '')
    .replace(/\x1b[^[\]]/g, '')
    .replace(/\x1b\[([0-9;]*)m/g, (_, c) => convertSgr(c))
    .replace(/\x1b\[[0-9;?]*[ABCDEFGHJKSTfsu]/g, '')
    .replace(/\x1b\[[0-9;?]*[lh]/g, '')
    .replace(/\r/g, '');
}

function stripAnsi(str) {
  return str
    .replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '')
    .replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, '')
    .replace(/\x1b[^[\]]/g, '')
    .replace(/\r/g, '');
}

module.exports = { stripAnsi, processAnsi };
