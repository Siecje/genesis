'use strict';

/**
 * Module dependencies
 */
var fs = require('fs');
var Showdown = require('showdown');
// Initialize Showdown converter
var converter = new Showdown.converter();
var exec = require('child_process').exec;


// Variables that start with dom are DOM elements
var domMarkdown = document.getElementById('postMarkdown');
var domHtml = document.getElementById('postHTML');
var domTitle = document.getElementById('title');

// TODO: use config value for posts directory
var posts = loadPosts('output/blog/');

// Global to hold the current post to display/edit
var post = {};

showPosts();

function updateView(){
  domTitle.value = post.title;
  domMarkdown.value = post.text;
  domHtml.innerHTML = converter.makeHtml(domMarkdown.value);
}

function getFieldFromFileName(fileName){
  var startOfFileName = fileName.lastIndexOf('//') + 2;
  var endOfFileName = fileName.substring(startOfFileName, fileName.length).indexOf('.');
  endOfFileName += startOfFileName;
  return fileName.substring(startOfFileName, endOfFileName);
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
    if(postFiles[i].indexOf('.md') < 0){
      continue;
    }
    post = fs.readFileSync(postFiles[i], 'utf8', function (err, data) {
      if (err) {
        return console.log(err);
      }
      return data;
    });
    if(post){
      var lines = post.split('\n');
      var p = {};
      p.text = post;
      p.title = getFieldFromFileName(postFiles[i]);

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

  fs.writeFile('output/blog/' + post.title + '.md',
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
  exec('./node_modules/harp/bin/harp compile output build', function(error, stdout){
    console.log(error);
    console.log(stdout);
  });
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
