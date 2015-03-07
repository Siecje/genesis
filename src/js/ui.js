(function() {
  'use strict';
  var gui = require('nw.gui');
  var win = gui.Window.get();

  // Register keyboard shortcuts
  var saveShortcutOptions = {
    key : 'Ctrl+S',
    active : function() {
      console.log('Global desktop keyboard shortcut: ' + this.key + ' active.'); 
    },
    failed : function(msg) {
      // :(, fail to register the |key| or couldn't parse the |key|.
      console.log(msg);
    }
  };

  var newShortcutOptions = {
    key: 'Ctrl+N',
    active: function() {
      console.log('Global desktop keyboard shortcut: ' + this.key + 'active.');
    },
    failed: function(msg) {
      console.log(msg);
    }
  };

  // Create a shortcut with |option|.
  var saveShortcut = new gui.Shortcut(saveShortcutOptions);
  var newShortcut = new gui.Shortcut(newShortcutOptions);

// Register global desktop shortcut, which can work without focus.
// gui.App.registerGlobalHotKey(saveShortcut);
// gui.App.registerGlobalHotKey(newShortcut);

  document.getElementById('minimize').addEventListener('click', function() {

    // Just minimize the window on click
    win.minimize();
  });

  document.getElementById('maximize').addEventListener('click', function() {

    // Maximizes the window
    win.maximize();
  });

  document.getElementById('close').addEventListener('click', function() {

    // Close the window
    win.close();
  });

  function toggleRight() {

    var rightSection = document.getElementById('rightSection');
    var middleSection = document.getElementById('middleSection');
    var toggleButton = document.getElementById('toggleRight');

    rightSection.classList.toggle('hide');
    middleSection.classList.toggle('col-12');
    toggleButton.classList.toggle('icon-active');
  }

  function toggleLeft() {

    var leftSection = document.getElementById('sidebar');
    var middleSection = document.getElementById('main');
    var toggleButton = document.getElementById('toggleLeft');

    leftSection.classList.toggle('hide');
    middleSection.classList.toggle('sidebar-offset');
    toggleButton.classList.toggle('icon-active');
  }

  document.getElementById('toggleRight').addEventListener('click', toggleRight);
  document.getElementById('toggleLeft').addEventListener('click', toggleLeft);
})();
