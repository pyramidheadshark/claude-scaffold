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
    if (isNaN(n) || n === 0)        out += '{/}';
    else if (n === 1)               out += '{bold}';
    else if (n === 2)               out += '{dim}';
    else if (n === 22)              out += '{/bold}';
    else if (n === 39 || n === 49)  out += '{/}';
    else if (n >= 30 && n <= 37)    out += `{${FG[n - 30]}-fg}`;
    else if (n >= 40 && n <= 47)    out += `{${BG[n - 40]}-bg}`;
    else if (n >= 90 && n <= 97)    out += `{bright${FG[n - 90]}-fg}`;
    else if (n >= 100 && n <= 107)  out += `{bright${BG[n - 100]}-bg}`;
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
    // OSC: ESC ] ... BEL | ESC \
    .replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, '')
    // DCS / PM / APC / SOS string sequences
    .replace(/\x1b[PX_^][^\x1b]*\x1b\\/g, '')
    // SGR only (pure digits/semicolons before m, no > < ? prefix)
    .replace(/\x1b\[([0-9;]*)m/g, (_, c) => convertSgr(c))
    // Erase line / clear screen → newline so text doesn't merge
    .replace(/\x1b\[[\x30-\x3f]*[JK]/g, '\n')
    // Cursor right → space (separates horizontally positioned text chunks)
    .replace(/\x1b\[\d*C/g, ' ')
    // All other CSI sequences (param bytes 0x30-0x3F, intermediate 0x20-0x2F, final 0x40-0x7E)
    .replace(/\x1b\[[\x30-\x3f]*[\x20-\x2f]*[\x40-\x7e]/g, '')
    // Character set G0/G1: ESC ( X  or  ESC ) X
    .replace(/\x1b[()][0-9A-Za-z]/g, '')
    // Remaining 2-char ESC sequences: ESC + printable
    .replace(/\x1b[\x40-\x7e]/g, '')
    // CR without LF → just remove (will be replaced by proper newlines above)
    .replace(/\r(?!\n)/g, '')
    // Collapse 3+ consecutive blank lines into 2
    .replace(/\n{3,}/g, '\n\n');
}

function stripAnsi(str) {
  return str
    .replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '')
    .replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, '')
    .replace(/\x1b[^[\]]/g, '')
    .replace(/\r/g, '');
}

module.exports = { stripAnsi, processAnsi };
