'use strict';

// Module dependencies
var Showdown = require('showdown');
var ui = require('./js/ui');
//var folders = require('./js/folder');
var gui = require('nw.gui');
var liveServer = require('live-server');

var win = gui.Window.get();

// Native Mac Menu
var nativeMenuBar = new gui.Menu({ type: 'menubar' });
nativeMenuBar.createMacBuiltin('Genesis');
win.menu = nativeMenuBar;

// File menu
var file = new gui.Menu();
file.append(new gui.MenuItem({
  label: 'New Post',
  click : function () {
    newItem('post');
  }
}));

file.append(new gui.MenuItem({
  label: 'New Page',
  click : function () {
    newItem('page');
  }
}));

win.menu.insert(new gui.MenuItem({
        label: 'File',
        submenu: file
    }), 1);


/**
* Keyboard Shortcuts
*/

// Register keyboard shortcuts
var saveShortcut = new gui.Shortcut(ui.saveShortcutOptions);
var newShortcut = new gui.Shortcut(ui.newShortcutOptions);

// Resgiter the shortcut keys globally (!bad)
// gui.App.registerGlobalHotKey(saveShortcut);
// gui.App.registerGlobalHotKey(newShortcut);



/**
* Window Events/Event Listeners
*/

var rightSection = document.getElementById('rightSection');
var middleSection = document.getElementById('middleSection');
var toggleButtonRight = document.getElementById('toggleRight');
var leftSection = document.getElementById('sidebar');
var main = document.getElementById('main');
var toggleButtonLeft = document.getElementById('toggleLeft');

document.getElementById('toggleRight').addEventListener('click', function() {

  ui.toggleRight(rightSection, middleSection, toggleButtonRight);
});
document.getElementById('toggleLeft').addEventListener('click', function() {

  ui.toggleLeft(leftSection, main, toggleButtonLeft);
});

document.getElementById('minimize').addEventListener('click', function() {

  win.minimize();
});

document.getElementById('maximize').addEventListener('click', function() {

  win.maximize();
});

document.getElementById('close').addEventListener('click', function() {

  win.close();
});

document.getElementById('preview').addEventListener('click', function() {

  var previewButton = document.getElementById('preview');
  var icon = document.getElementById('previewIcon');

  if (!previewButton.classList.contains('icon-active')) {

    // Toggle the active state
    previewButton.classList.add('icon-active');
    icon.classList.add('blue');

    // Start a live server on click
    var params = {
      port: 8080, // Set the server port. Defaults to 8080. 
      host: '0.0.0.0', // Set the address to bind to. Defaults to 0.0.0.0. 
      root: './build', // Set root directory that's being server. Defaults to cwd. 
      noBrowser: false // When true, it won't load your browser by default. 
    };

    liveServer.start(params);
  } else {

    // This doesn't actually work, need to fix and send PR to @tapio
    previewButton.classList.remove('icon-active');
    icon.classList.remove('blue');
    liveServer.stop();
  }
});