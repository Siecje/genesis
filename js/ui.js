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

  var rightSection = right;
  var middleSection = middle;
  var toggleButton = toggle;

  rightSection.classList.toggle('hide');
  middleSection.classList.toggle('col-12');
  toggleButton.classList.toggle('icon-active');
};

exports.toggleLeft = function(left, middle, toggle) {

  var leftSection = left;
  var middleSection = middle;
  var toggleButton = toggle;

  leftSection.classList.toggle('hide');
  middleSection.classList.toggle('sidebar-offset');
  toggleButton.classList.toggle('icon-active');
};