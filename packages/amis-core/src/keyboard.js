const isff = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase().indexOf('firefox') > 0 : false;
const modifierMap = {
  16: 'shiftKey', 18: 'altKey', 17: 'ctrlKey', 91: 'metaKey', shiftKey: 16, ctrlKey: 17, altKey: 18, metaKey: 91
};
// Special Keys
const _keyMap = {
  backspace: 8,
  tab: 9,
  clear: 12,
  enter: 13,
  return: 13,
  esc: 27,
  escape: 27,
  space: 32,
  left: 37,
  up: 38,
  right: 39,
  down: 40,
  del: 46,
  delete: 46,
  ins: 45,
  insert: 45,
  home: 36,
  end: 35,
  pageup: 33,
  pagedown: 34,
  capslock: 20,
  num_0: 96,
  num_1: 97,
  num_2: 98,
  num_3: 99,
  num_4: 100,
  num_5: 101,
  num_6: 102,
  num_7: 103,
  num_8: 104,
  num_9: 105,
  num_multiply: 106,
  num_add: 107,
  num_enter: 108,
  num_subtract: 109,
  num_decimal: 110,
  num_divide: 111,
  f1: 112,
  f2: 113,
  f3: 114,
  f4: 115,
  f5: 116,
  f6: 117,
  f7: 118,
  f8: 119,
  f9: 120,
  f10: 121,
  f11: 122,
  f12: 123,
  ',': 188,
  '.': 190,
  '/': 191,
  '`': 192,
  '-': isff ? 173 : 189,
  '=': isff ? 61 : 187,
  ';': isff ? 59 : 186,
  '\'': 222,
  '[': 219,
  ']': 221,
  '\\': 220
};
// Modifier Keys
const _modifier = {
  shift: 16, ctrl: 17, alt: 18, command: 91
};

function getKeyStroke(event) {
  let _downKeys = [];
  let key = event.keyCode || event.which || event.charCode;
  // Gecko(Firefox)的command键值224，在Webkit(Chrome)中保持一致
  // Webkit左右 command 键值不一样
  if (key === 93 || key === 224) {
    key = 91;
  }
  ['ctrlKey', 'altKey', 'shiftKey', 'metaKey'].forEach(keyName => {
    const keyNum = modifierMap[keyName];
    if (event[keyName] && _downKeys.indexOf(keyNum) === -1) {
      _downKeys.push(keyNum);
    } else if (!event[keyName] && _downKeys.indexOf(keyNum) > -1) {
      _downKeys.splice(_downKeys.indexOf(keyNum), 1);
    } else if (keyName === 'metaKey' && event[keyName] && _downKeys.length === 3) {
      if (!(event.ctrlKey || event.shiftKey || event.altKey)) {
        _downKeys = _downKeys.slice(_downKeys.indexOf(keyNum));
      }
    }
  });
  if (_downKeys.indexOf(key) === -1 && key !== 229) _downKeys.push(key);

  if (event.getModifierState && !(event.altKey && !event.ctrlKey) && event.getModifierState('AltGraph')) {
    if (_downKeys.indexOf(17) === -1) {
      _downKeys.push(17);
    }
    if (_downKeys.indexOf(18) === -1) {
      _downKeys.push(18);
    }
  }
  const getKey = x => Object.keys(_keyMap).find(k => _keyMap[k] === x);
  const getModifier = x => Object.keys(_modifier).find(k => _modifier[k] === x);
  let result = _downKeys.map(c => getKey(c) || getModifier(c) || String.fromCharCode(c));
  return result.reduce((prev, current) => {
    return prev + '+' + current;
  }).toLowerCase();
}

export default {getKeyStroke};
