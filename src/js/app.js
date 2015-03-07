(function() {
  'use strict';
  var fs = require('fs');
  var converter = new Showdown.converter();

  var postMarkdown = document.getElementById('postMarkdown');
  var title = document.getElementById('title');
  var post = {};
  var posts = loadPosts();

  // load previous post from localStorage
  var postTitle = localStorage.getItem('post') || '';
  if(postTitle){
    for(var i in posts){
      if (posts[i].title === postTitle){
        post = posts[i];
        postMarkdown.value = post.text;
        var postHTML = converter.makeHtml(postMarkdown.value);
        document.getElementById('postHTML').innerHTML = postHTML;
        title.value = post.title;
      }
    }
  }

  showPosts();

  function getFieldFromFile(field, fileData){
    var lines = fileData.split('\n');
    for(var i in lines){
      if(lines[i].search(field) > -1){
        return lines[i].substring(lines[i].search(':')+1, lines[i].length).trim();
      }
    }
  }

  function getPostFromFile(fileData){
    var start = 0;
    var lines = fileData.split('\n');
    for(var i in lines){
      if(lines[i].indexOf(':') < 0){
        start = i;
      }
    }

    return lines.splice(2, lines.length-1).join('\n');
  }

  function loadPosts(){
    // TODO: use config value for posts directory
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
        p.text = getPostFromFile(post);
        p.title = getFieldFromFile('title', post);

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
    if(posts.indexOf(post) < 0){
      posts.push(post);
    }

    fs.writeFile('posts/' + posts.indexOf(post) + 1  + '_' + post.title + '.md',
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
    localStorage.setItem('post', post.title);
    location.reload();
  }
  // I don't know why it can't find savePost without this
  window.savePost = savePost;
  window.loadPost = loadPost;
  window.newPost = newPost;

  function loadPost(postTitle){
    for(var i in posts){
      if (posts[i].title === postTitle){
        post = posts[i];

        localStorage.setItem('post', post.title);
        location.reload();
      }
    }
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

})();
