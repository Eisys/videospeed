chrome.extension.sendMessage({}, function(response) {

  var tc = {
    settings: {
      speed: 1.0,          // default 1x
      speedStep: 0.25,      // default 0.1x
      rewindTime: 10,      // default 10s
      advanceTime: 10,     // default 10s
      resetKeyCode:  106,   // default: R
      slowerKeyCode: 109,   // default: S
      fasterKeyCode: 107,   // default: D
      rewindKeyCode: 90,   // default: Z
      advanceKeyCode: 88,  // default: X
      rememberSpeed: true  // default: false
    }
  };

  var controllerAnimation;
  chrome.storage.sync.get(tc.settings, function(storage) {
    tc.settings.speed = Number(storage.speed);
    tc.settings.speedStep = Number(storage.speedStep);
    tc.settings.rewindTime = Number(storage.rewindTime);
    tc.settings.advanceTime = Number(storage.advanceTime);
    tc.settings.resetKeyCode = Number(storage.resetKeyCode);
    tc.settings.rewindKeyCode = Number(storage.rewindKeyCode);
    tc.settings.slowerKeyCode = Number(storage.slowerKeyCode);
    tc.settings.fasterKeyCode = Number(storage.fasterKeyCode);
    tc.settings.advanceKeyCode = Number(storage.advanceKeyCode);
    tc.settings.rememberSpeed = Boolean(storage.rememberSpeed);
  });

  function defineVideoController() {
    tc.videoController = function(target, parent) {
      this.video = target;
      this.parent = target.parentElement || parent;
      this.document = target.ownerDocument;
      if (!tc.settings.rememberSpeed) {
        tc.settings.speed = 1.0;
      }
      this.initializeControls();

      target.addEventListener('play', function(event) {
        target.playbackRate = tc.settings.speed;
      });

      target.addEventListener('ratechange', function(event) {
        if (target.readyState === 0) {
          return;
        }
        var speed = this.getSpeed();
        this.speedIndicator.textContent = speed;
        tc.settings.speed = speed;
        chrome.storage.sync.set({'speed': speed});
      }.bind(this));

      target.playbackRate = tc.settings.speed;
    };

    tc.videoController.prototype.getSpeed = function() {
      return parseFloat(this.video.playbackRate).toFixed(2);
    }

    tc.videoController.prototype.remove = function() {
      this.parentElement.removeChild(this);
    }

    tc.videoController.prototype.initializeControls = function() {
      var document = this.document;

      var fragment = document.createDocumentFragment();
      var container = document.createElement('div');

      var shadow = container.createShadowRoot();
      shadow.innerHTML = '<style> @import "' +
        chrome.extension.getURL('shadow.css') +
        '"; </style>';

      var speedIndicator = document.createElement('span');
      var controls = document.createElement('span');
      var fasterButton = document.createElement('button');
      var slowerButton = document.createElement('button');
      var rewindButton = document.createElement('button');
      var advanceButton = document.createElement('button');
      var hideButton = document.createElement('button');

      rewindButton.innerHTML = '&laquo;';
      rewindButton.className = 'rw';
      rewindButton.addEventListener('click', function(e) {
        runAction('rewind', document);
      });

      fasterButton.textContent = '+';
      fasterButton.addEventListener('click', function(e) {
        runAction('faster', document);
      });

      slowerButton.textContent = '-';
      slowerButton.addEventListener('click', function(e) {
        runAction('slower', document);
      });

      advanceButton.innerHTML = '&raquo;';
      advanceButton.className = 'rw';
      advanceButton.addEventListener('click', function(e) {
        runAction('advance', document);
      });

      hideButton.textContent = 'x';
      hideButton.className = 'tc-hideButton';
      hideButton.addEventListener('click', function(e) {
        container.nextSibling.classList.add('vc-cancelled')
        container.remove();
      });

      controls.appendChild(rewindButton);
      controls.appendChild(slowerButton);
      controls.appendChild(fasterButton);
      controls.appendChild(advanceButton);
      controls.appendChild(hideButton);

      shadow.appendChild(speedIndicator);
      shadow.appendChild(controls);

      container.classList.add('tc-videoController');
      controls.classList.add('tc-controls');
      container.style.top = Math.max(this.video.offsetTop,0)+"px";
      container.style.left = Math.max(this.video.offsetLeft,0)+"px";

      fragment.appendChild(container);
      this.video.classList.add('tc-initialized');

      // Note: when triggered via a MutationRecord, it's possible that the
      // target is not the immediate parent. This appends the controller as
      // the first element of the target, which may not be the parent.
      this.parent.insertBefore(fragment, this.parent.firstChild);

      var speed = parseFloat(tc.settings.speed).toFixed(2);
      speedIndicator.textContent = speed;
      this.speedIndicator = speedIndicator;

      container.addEventListener('dblclick', function(e) {
        e.preventDefault();
        e.stopPropagation();
      }, true);

      container.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
      }, true);

      container.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
      }, true);

    }
  }

  function initializeWhenReady(document) {
    var readyStateCheckInterval = setInterval(function() {
      if (document.readyState === 'complete') {
        clearInterval(readyStateCheckInterval);
        initializeNow(document);
      }
    }, 10);
  }

  function initializeNow(document) {
      if (document === window.document) {
        defineVideoController();
      } else {
        var link = document.createElement('link');
        link.href = chrome.extension.getURL('inject.css');
        link.type = 'text/css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }

      document.addEventListener('keydown', function(event) {
        var keyCode = event.keyCode;

        // Ignore keydown event if typing in an input box
        if ((document.activeElement.nodeName === 'INPUT'
              && document.activeElement.getAttribute('type') === 'text')
            || document.activeElement.isContentEditable) {
          return false;
        }

        if (keyCode == tc.settings.rewindKeyCode) {
          runAction('rewind', document, true)
        } else if (keyCode == tc.settings.advanceKeyCode) {
          runAction('advance', document, true)
        } else if (keyCode == tc.settings.fasterKeyCode) {
          runAction('faster', document, true)
        } else if (keyCode == tc.settings.slowerKeyCode) {
          runAction('slower', document, true)
        } else if (keyCode == tc.settings.resetKeyCode) {
          runAction('reset', document, true)
        }

        return false;
      }, true);

      var forEach = Array.prototype.forEach;
      function checkForVideo(node, parent) {
        if (node.nodeName === 'VIDEO') {
          if (!node.classList.contains('tc-initialized')) {
            new tc.videoController(node, parent);
          }
        } else if (node.children != undefined) {
          for (var i = 0; i < node.children.length; i++) {
            checkForVideo(node.children[i],
                          node.children[i].parentNode || parent);
          }
        }
      }
      var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          forEach.call(mutation.addedNodes, function(node) {
            checkForVideo(node, node.parentNode || mutation.target);
          })
        });
      });
      observer.observe(document, { childList: true, subtree: true });

      var videoTags = document.getElementsByTagName('video');
      forEach.call(videoTags, function(video) {
        new tc.videoController(video);
      });

      var frameTags = document.getElementsByTagName('iframe');
      forEach.call(frameTags, function(frame) {
        // Ignore frames we don't have permission to access (different origin).
        try { var childDocument = frame.contentDocument } catch (e) { return }
        initializeWhenReady(childDocument);
      });
  }

  function runAction(action, document, keyboard = false) {
    var videoTags = document.getElementsByTagName('video');
    videoTags.forEach = Array.prototype.forEach;

    videoTags.forEach(function(v) {
      if (keyboard)
        showController(v);

      if (!v.classList.contains('vc-cancelled')) {
        if (action === 'rewind') {
          v.currentTime -= tc.settings.rewindTime;
        } else if (action === 'advance') {
          v.currentTime += tc.settings.advanceTime;
        } else if (action === 'faster') {
          // Maximum playback speed in Chrome is set to 16:
          // https://code.google.com/p/chromium/codesearch#chromium/src/media/blink/webmediaplayer_impl.cc&l=64
          var s = Math.min(v.playbackRate + tc.settings.speedStep, 16);
          v.playbackRate = Number(s.toFixed(2));
        } else if (action === 'slower') {
          // Audio playback is cut at 0.05:
          // https://code.google.com/p/chromium/codesearch#chromium/src/media/filters/audio_renderer_algorithm.cc&l=49
          var s = Math.max(v.playbackRate - tc.settings.speedStep, 0);
          v.playbackRate = Number(s.toFixed(2));
        } else if (action === 'reset') {
          v.playbackRate = 1.0;
        }
      }
    });
  }

  function showController(v) {
    var controller = v.closest('.tc-videoController ~ .tc-initialized')
      .parentElement.getElementsByClassName('tc-videoController')[0];

    controller.style.visibility = 'visible';
    if (controllerAnimation != null
        && controllerAnimation.playState != 'finished') {
      controllerAnimation.cancel();
    }

    // TODO : if controller is visible, do not start animation.
    controllerAnimation = controller.animate([
      {opacity: 0.7},
      {opacity: 0.5},
      {opacity: 0.0},
    ], {
      duration: 2000,
      iterations: 1,
      delay: 0
    });
  }

  initializeWhenReady(document);
});
