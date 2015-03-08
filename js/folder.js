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
var pages = loadPosts('output/');

// Global to hold the current post to display/edit
var post = {};

show(posts, 'posts');
show(pages, 'pages');

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
  var type = directory === 'output/blog/' ? 'post' : 'page';
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
      p.type = type;

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

  var path = post.type === 'post' ? 'output/blog/' : 'output/';
  if(post.type === 'post' && posts.indexOf(post) < 0){
    posts.push(post);
  }
  else if(post.type === 'page' && pages.indexOf(post) < 0){
    pages.push(post);
  }

  fs.writeFile(path + post.title + '.md',
    post.text,
      function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log("The file was saved!");
        }
      }
  );

  show(posts, 'posts');
  show(pages, 'pages');
  exec('./node_modules/harp/bin/harp compile output build', function(error, stdout){
    console.log(error);
    console.log(stdout);
  });
}

function load(type, postTitle){
  if (type === 'post'){
    for(var i in posts){
      if (posts[i].title === postTitle){
        post = posts[i];
        updateView();
      }
    }
  }
  else if(type === 'page'){
    for(var i in pages){
      if (pages[i].title === postTitle){
        post = pages[i];
        updateView();
      }
    }
  }
}

function show(items, elemId){
  if (items.length === 0){
    return;
  }
  var elem = document.getElementById(elemId);
  elem.innerHTML = '';
  for(var i in items){
    elem.innerHTML += "<li><a href='#' onclick='load(\"" + items[i].type + "\", \"" + items[i].title + "\")' class='small m0 px1 py1 block'>" + items[i].title + "</a></li>";
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
