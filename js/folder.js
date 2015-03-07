'use strict';

/**
 * Module dependencies
 */
var fs = require('fs');
var Showdown = require('showdown');
// Initialize Showdown converter
var converter = new Showdown.converter();

// Variables that start with dom are DOM elements
var domMarkdown = document.getElementById('postMarkdown');
var domHtml = document.getElementById('postHTML');
var domTitle = document.getElementById('title');

// TODO: use config value for posts directory
var posts = loadPosts('posts/');

// Global to hold the current post to display/edit
var post = {};

showPosts();

function updateView(){
  domTitle.value = post.title;
  domMarkdown.value = post.text;
  domHtml.innerHTML = converter.makeHtml(domMarkdown.value);
}

function getFieldFromFile(field, fileData){
  var lines = fileData.split('\n');
  for(var i in lines){
    if(lines[i].search(field) > -1){
      return lines[i].substring(lines[i].search(':')+1, lines[i].length).trim();
    }
  }
}

function getPostFromFile(fileData){
  // Post attributes and post content must be separated by a blank line
  var start = fileData.indexOf('\n\n');
  return fileData.substring(start+2, fileData.length-1);
}

function loadPosts(directory){
  var postFiles = getFiles(directory);
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
  var fileNames = [];
  var files = fs.readdirSync(dir);
  var name = '';
  for (var i in files){
    name = dir + '/' + files[i];
    if (!fs.statSync(name).isDirectory()){
      if(name.indexOf('.keep') < 0){
        fileNames.push(name);
      }
    }
  }
  return fileNames;
}

function savePost(){
  if(post.title === '' && post.text === ''){
    return;
  }
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
      }
  );

  showPosts();
}

function loadPost(postTitle){
  for(var i in posts){
    if (posts[i].title === postTitle){
      post = posts[i];
      updateView();
    }
  }
}

function showPosts(){
  if (posts.length === 0){
    return;
  }
  var elem = document.getElementById('posts');
  elem.innerHTML = '';
  for(var i in posts){
    elem.innerHTML += "<li><a href='#' onclick='loadPost(\"" + posts[i].title + "\")' class='small m0 px1 py1 block'>" + posts[i].title + "</a></li>";
  }
}

function newPost() {
  post = {title: '', text: ''};
  updateView();
}

// 'Keyup' only is recent browsers, in old ones you
// should use 'DOMContentModified'
domMarkdown.addEventListener('keyup', function() {
  // Keep post in sync
  post.text = domMarkdown.value;
  domHtml.innerHTML = converter.makeHtml(domMarkdown.value);
});

domTitle.addEventListener('keyup', function(){
  post.title = domTitle.value;
});
