(function() {
  'use strict';
  var fs = require('fs');
  var gui = require('nw.gui');
  var win = gui.Window.get();

  var converter = new Showdown.converter();

  var postMarkdown = document.getElementById('postMarkdown');
  var title = document.getElementById('title');

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

  var posts = loadPosts();

  var post = JSON.parse(localStorage.getItem('post')) || {};

  showPosts();

  function getFieldFromFile(field, fileData){
    var lines = fileData.split('\n');
    for(var i in lines){
      if(lines[i].search(field) > -1){
        return lines[i].substring(lines[i].search(':')+1, lines[i].length);
      }
    }
  }

  function getPostFromFile(fileData){
    var postText = '';
    var start = 0;
    for(var i in fileData.split('\n')){
      if(fileData[i].indexOf(':') < 0){
        start = i;
      }
    }
    var lines = fileData.split('\n');
    return lines.slice(start,
        fileData.split('\n').length-1)
      .join('\n');
  }

  function loadPosts(){
    // TODO: use config value
    var postFiles = getFiles('posts/');
    var posts = [];
    var post = {};
    for (var i in postFiles){
      post = fs.readFileSync(postFiles[i], 'utf8', function (err, data) {
        if (err) {
          return console.log(err);
        }
        return data;
      });
      if(post){
        var lines = post.split('\n');
        var p = {};
        p.title = getFieldFromFile('title', post);
        p.text = getPostFromFile(post);
        posts.push(p);
      }
    }
    return posts;
  }

  function getFiles (dir){
    var files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files){
        var name = dir + '/' + files[i];
        if (!fs.statSync(name).isDirectory()){
          if(name.indexOf('.keep') < 0){
            files_.push(name);
          }
        }
    }
    return files_;
  }

  function savePost(){
    var postFiles = getFiles('posts/');
    var postNum = postFiles.length;

    fs.writeFile('posts/' + postNum + '_' + post.title + '.md',
      'title: ' + post.title + '\n\n' +
      post.text,
        function(err) {
          if(err) {
              console.log(err);
          } else {
              console.log("The file was saved!");
          }
    });

    showPosts();
    localStorage.setItem('post', JSON.stringify(post));
    location.reload();
  }
  // I don't know why it can't find savePost without this
  window.savePost = savePost;
  window.loadPost = loadPost;
  window.newPost = newPost;

  function loadPost(postTitle){
    var postFiles = getFiles('posts');

    for(var i in postFiles){
      if (postFiles[i] === postTitle){
        fs.readFile(postTitle, 'utf8', function (err, data) {
          if (err) {
            return console.log(err);
          }
          post.text = data;
          post.title = postTitle; // TODO: remove .md and convert - to spaces
        });
      }
    }
    postMarkdown.value = post.text;
    title.value = post.title;
    var postHTML = converter.makeHtml(postMarkdown.value);
    document.getElementById('postHTML').innerHTML = postHTML;
  }

  function editPost(post){
    postMarkdown.value = post.text;
  }

  function showPosts(){
    if (posts.length === 0){
      return;
    }
    var elem = document.querySelector('#posts');
    elem.innerHTML = '';
    for(var i in posts){
      elem.innerHTML += "<li><a href='#' onclick='loadPost(\"" + posts[i].title + "\")' class='small m0 px1 py1 block'>" + posts[i].title + "</a></li>";
    }
  }

  function newPost(){
    post.title = '';
    post.text = '';
    postMarkdown.value = post.text;
    document.getElementById('postHTML').innerHTML = '';
    title.value = post.title;
  }

  // 'Keyup' only is recent browsers, in old ones you
  // should use 'DOMContentModified'
  postMarkdown.addEventListener('keyup', function() {
    // Keep post in sync
    post.text = postMarkdown.value;
    var postHTML = converter.makeHtml(postMarkdown.value);
    document.getElementById('postHTML').innerHTML = postHTML;
  });

  title.addEventListener('keyup', function(){
    post.title = title.value;
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
