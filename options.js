var tcDefaults = {
  speed: 1.0,           // default 1x
  speedStep: 0.25,       // default 0.1x
  rewindTime: 10,       // default 10s
  advanceTime: 10,      // default 10s
  resetKeyCode:  106,    // default: R
  slowerKeyCode: 109,    // default: S
  fasterKeyCode: 107,    // default: D
  rewindKeyCode: 90,    // default: Z
  advanceKeyCode: 110,   // default: X
  displayKeyCode: 86,   // default: V
  rememberSpeed: true, // default: false
  blacklist: `
    www.instagram.com
    www.twitter.com
    vine.co
    reddit.com
    imgur.com
  `.replace(/^\s+|\s+$/gm,'')
};

var keyCodeAliases = {
  32:  'Space',
  96:  'Num 0',
  97:  'Num 1',
  98:  'Num 2',
  99:  'Num 3',
  100: 'Num 4',
  101: 'Num 5',
  102: 'Num 6',
  103: 'Num 7',
  104: 'Num 8',
  105: 'Num 9',
  106: 'Num *',
  107: 'Num +',
  109: 'Num -',
  110: 'Num .',
  111: 'Num /',
  186: ';',
  188: '<',
  189: '-',
  187: '+',
  190: '>',
  191: '/',
  192: '~',
  219: '[',
  220: '\\',
  221: ']',
  222: '\'',
}

function recordKeyPress(e) {
  if (
    (e.keyCode >= 48 && e.keyCode <= 57)    // Numbers 0-9
    || (e.keyCode >= 65 && e.keyCode <= 90) // Letters A-Z
    || keyCodeAliases[e.keyCode]            // Other character keys
  ) {
    e.target.value = keyCodeAliases[e.keyCode] || String.fromCharCode(e.keyCode);
    e.target.keyCode = e.keyCode;

    e.preventDefault();
    e.stopPropagation();
  } else if (e.keyCode === 8) { // Clear input when backspace pressed
    e.target.value = '';
  }
};

function inputFilterNumbersOnly(e) {
  var char = String.fromCharCode(e.keyCode);
  if (!/[\d\.]$/.test(char) || !/^\d+(\.\d*)?$/.test(e.target.value + char)) {
    e.preventDefault();
    e.stopPropagation();
  }
};

function inputFocus(e) {
   e.target.value = "";
};

function inputBlur(e) {
  e.target.value = keyCodeAliases[e.target.keyCode] || String.fromCharCode(e.target.keyCode);
};

function updateShortcutInputText(inputId, keyCode) {
  document.getElementById(inputId).value = keyCodeAliases[keyCode] || String.fromCharCode(keyCode);
  document.getElementById(inputId).keyCode = keyCode;
}

// Saves options to chrome.storage
function save_options() {

  var speedStep     = document.getElementById('speedStep').value;
  var rewindTime    = document.getElementById('rewindTime').value;
  var advanceTime   = document.getElementById('advanceTime').value;
  var resetKeyCode  = document.getElementById('resetKeyInput').keyCode;
  var rewindKeyCode = document.getElementById('rewindKeyInput').keyCode;
  var advanceKeyCode = document.getElementById('advanceKeyInput').keyCode;
  var slowerKeyCode = document.getElementById('slowerKeyInput').keyCode;
  var fasterKeyCode = document.getElementById('fasterKeyInput').keyCode;
  var displayKeyCode = document.getElementById('displayKeyInput').keyCode;
  var rememberSpeed = document.getElementById('rememberSpeed').checked;
  var blacklist     = document.getElementById('blacklist').value;

  speedStep     = isNaN(speedStep) ? tcDefaults.speedStep : Number(speedStep);
  rewindTime    = isNaN(rewindTime) ? tcDefaults.rewindTime : Number(rewindTime);
  advanceTime   = isNaN(advanceTime) ? tcDefaults.advanceTime : Number(advanceTime);
  resetKeyCode  = isNaN(resetKeyCode) ? tcDefaults.resetKeyCode : resetKeyCode;
  rewindKeyCode = isNaN(rewindKeyCode) ? tcDefaults.rewindKeyCode : rewindKeyCode;
  advanceKeyCode = isNaN(advanceKeyCode) ? tcDefaults.advanceKeyCode : advanceKeyCode;
  slowerKeyCode = isNaN(slowerKeyCode) ? tcDefaults.slowerKeyCode : slowerKeyCode;
  fasterKeyCode = isNaN(fasterKeyCode) ? tcDefaults.fasterKeyCode : fasterKeyCode;
  displayKeyCode = isNaN(displayKeyCode) ? tcDefaults.displayKeyCode : displayKeyCode;

  chrome.storage.sync.set({
    speedStep:      speedStep,
    rewindTime:     rewindTime,
    advanceTime:    advanceTime,
    resetKeyCode:   resetKeyCode,
    rewindKeyCode:  rewindKeyCode,
    advanceKeyCode: advanceKeyCode,
    slowerKeyCode:  slowerKeyCode,
    fasterKeyCode:  fasterKeyCode,
    displayKeyCode: displayKeyCode,
    rememberSpeed:  rememberSpeed,
    blacklist:      blacklist.replace(/^\s+|\s+$/gm,'')
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved';
    setTimeout(function() {
      status.textContent = '';
    }, 1000);
  });
}

// Restores options from chrome.storage
function restore_options() {
  chrome.storage.sync.get(tcDefaults, function(storage) {
    document.getElementById('speedStep').value = storage.speedStep.toFixed(2);
    document.getElementById('rewindTime').value = storage.rewindTime;
    document.getElementById('advanceTime').value = storage.advanceTime;
    updateShortcutInputText('resetKeyInput',  storage.resetKeyCode);
    updateShortcutInputText('rewindKeyInput', storage.rewindKeyCode);
    updateShortcutInputText('advanceKeyInput', storage.advanceKeyCode);
    updateShortcutInputText('slowerKeyInput', storage.slowerKeyCode);
    updateShortcutInputText('fasterKeyInput', storage.fasterKeyCode);
    updateShortcutInputText('displayKeyInput', storage.displayKeyCode);
    document.getElementById('rememberSpeed').checked = storage.rememberSpeed;
    document.getElementById('blacklist').value = storage.blacklist;
  });
}

function restore_defaults() {
  chrome.storage.sync.set(tcDefaults, function() {
    restore_options();
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Default options restored';
    setTimeout(function() {
      status.textContent = '';
    }, 1000);
  });
}

function initShortcutInput(inputId) {
  document.getElementById(inputId).addEventListener('focus', inputFocus);
  document.getElementById(inputId).addEventListener('blur', inputBlur);
  document.getElementById(inputId).addEventListener('keydown', recordKeyPress);
}

document.addEventListener('DOMContentLoaded', function () {
  restore_options();

  document.getElementById('save').addEventListener('click', save_options);
  document.getElementById('restore').addEventListener('click', restore_defaults);

  initShortcutInput('resetKeyInput');
  initShortcutInput('rewindKeyInput');
  initShortcutInput('advanceKeyInput');
  initShortcutInput('slowerKeyInput');
  initShortcutInput('fasterKeyInput');
  initShortcutInput('displayKeyInput');

  document.getElementById('rewindTime').addEventListener('keypress', inputFilterNumbersOnly);
  document.getElementById('advanceTime').addEventListener('keypress', inputFilterNumbersOnly);
  document.getElementById('speedStep').addEventListener('keypress', inputFilterNumbersOnly);
})
