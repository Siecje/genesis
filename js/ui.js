'use strict';

// Register keyboard shortcuts
exports.saveShortcutOptions = {

  key : 'Ctrl+S',

  active : function() {

    console.log('Global desktop keyboard shortcut: ' + this.key + ' active.'); 
  },

  failed : function(msg) {

    // :(, fail to register the |key| or couldn't parse the |key|.
    console.log(msg);
  }
};

exports.newShortcutOptions = {

  key: 'Ctrl+N',

  active: function() {

    console.log('Global desktop keyboard shortcut: ' + this.key + 'active.');
  },
  failed: function(msg) {

    console.log(msg);
  }
};

exports.toggleRight = function(right, middle, toggle) {

  right.classList.toggle('hide');
  middle.classList.toggle('col-12');
  toggle.classList.toggle('icon-active');
};

exports.toggleLeft = function(left, middle, toggle) {

  left.classList.toggle('hide');
  middle.classList.toggle('sidebar-offset');
  toggle.classList.toggle('icon-active');
};