'use strict';

// Module dependencies
var Showdown = require('showdown');
var ui = require('./js/ui');
//var folders = require('./js/folder');
var gui = require('nw.gui');

var win = gui.Window.get();

// Native Mac Menu
var nativeMenuBar = new gui.Menu({ type: 'menubar' });
nativeMenuBar.createMacBuiltin('My App');
win.menu = nativeMenuBar;

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