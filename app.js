(function() {

  'use strict';

  var converter = new Showdown.converter();

  var postMarkdown = document.getElementById('postMarkdown');

  var posts = loadPosts();
  var post = {};

  showPosts();

  function loadPosts(){
    return JSON.parse(localStorage.getItem('posts')) || [];
  }

  function savePost(){
    if (!post.id){
      post.id = uuid.v4();
    }

    var posts = JSON.parse(localStorage.getItem('posts')) || [];
    var found = false;
    for(var i=0;i<posts.length;i++){
      if (posts[i].id === post.id){
        found = true;
        posts[i].title = post.title;
        posts[i].text = post.text;
      }
    }
    if(!found){
      posts.push(post);
    }

    // Save it in localstorage
    // http://stackoverflow.com/questions/9382167/serializing-object-that-contains-cyclic-object-value
    var seen = [];
    localStorage.setItem('posts', JSON.stringify(posts, function(key, val) {
      if (val != null && typeof val == "object"){
        if (seen.indexOf(val) >= 0){
          return;
        }
        seen.push(val);
      }
      return val;
    }));
    showPosts();
  }
  // I don't know why it can't find savePost without this
  window.savePost = savePost;
  window.loadPost = loadPost;
  window.newPost = newPost;

  function loadPost(id){
    for(var i=0;i<posts.length;i++){
      if (posts[i].id === id){
        post.id = id;
        post.title = posts[i].title;
        post.text = posts[i].text;
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
    var elem = document.querySelector('#posts');
    elem.innerHTML = '';
    for(var i=0;i<posts.length;i++){
      elem.innerHTML += "<li><a href='#' onclick='loadPost(\"" + posts[i].id + "\")' class='small m0 px1 py1 block'>" + posts[i].title + "</a></li>";
    }
  }

  function newPost(){
    post.title = '';
    post.id = '';
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

  var title = document.getElementById('title');
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
