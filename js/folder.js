'use strict';

/**
 * Module dependencies
 */
var fs = require('fs');
var exec = require('child_process').exec;
var uuid = require('uuid');
var Showdown = require('showdown');

// Initialize Showdown converter
var converter = new Showdown.converter();

var Promise = require("bluebird");
Promise.promisifyAll(fs);

// Variables that start with dom are DOM elements
var domMarkdown = document.getElementById('postMarkdown');
var domHtml = document.getElementById('postHTML');
var domTitle = document.getElementById('title');

// TODO: use config value for posts directory
var posts = [];
var postsPromise = loadPosts('output/blog/');
postsPromise.then(function(result){
  posts = result;
  show(posts, 'posts');
});
var pages = [];
var pagesPromise = loadPosts('output/');
pagesPromise.then(function(result){
  pages = result;
  show(pages, 'pages');
});

// Global to hold the current post to display/edit
var post = {type: 'post'};

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

  var pinkyPromise = new Promise(function(resolve, reject){
    var dataJson = {};
    var filePromise = fs.readFileAsync(directory + '_data.json').then(JSON.parse).then(function(val) {
      dataJson = val;
      var post = {};
      var p = {};
      var lines;
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
          lines = post.split('\n');
          p = {};
          p.text = post;
          // p.url is the file name without extension
          p.url = getFieldFromFileName(postFiles[i]);
          p.type = type;
          p.id = dataJson[p.url].id;
          p.title = dataJson[p.url].title;

          posts.push(p);
        }
      }
      resolve(posts);
    })
    .catch(SyntaxError, function(e) {
      console.error("invalid json in file");
    })
    .catch(function(e){
      console.error("unable to read file")
    });
  });


  return pinkyPromise;
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

  if(!post.url){
    post.url = post.title;
  }

  var path = post.type === 'post' ? 'output/blog/' : 'output/';
  if(post.type === 'post' && !post.id){
    post.id = uuid.v4();
    posts.push(post);
  }
  else if(post.type === 'page' && !post.id){
    post.id = uuid.v4();
    pages.push(post);
  }

  // Write page contents to file
  fs.writeFile(path + post.url + '.md',
    post.text,
      function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log("Saved: " + path + post.url + '.md');
        }
      }
  );

  // read _data.json and update properties
  // TODO: code smell duplicated code with loadPosts
  var dataJson = {};
  fs.readFile(path + '_data.json', function(err, data) {
    if (err) {
      if (err.code === "ENOENT") {
        /* File doesn't exist, setting {} instead. */
        dataJson = {};
        //doneGettingJSON();
      } else {
        /* Some other kind of error happened - you need to handle it, somehow. */
      }
    }else {
      dataJson = JSON.parse(data);
      //return doneGettingJSON();
    }
  });

  // iterate through dataJson find the object with the id
  var postData = {};
  var urlData;
  for(var url in dataJson){
    if(dataJson[url].id === post.id){
      urlData = url;
      postData = dataJson[url];
    }
  }

  // If it is a new post not in data.json
  // TODO: is this the best way to check if postData === {}
  if(postData.length === undefined){
    urlData = post.url;
  }

  postData.title = post.title;
  postData.id = post.id;
  // If the url is change remove the object for the old url value
  if (post.url != urlData){
    delete dataJson[urlData];
  }

  dataJson[urlData] = postData;

  console.log(dataJson);
  console.log(JSON.stringify(dataJson));
  // write dataJson back to _data.json
  fs.writeFile(path + '_data.json',
    JSON.stringify(dataJson),
      function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log('Saved: ' + path + '_data.json');
        }
      }
  );

  // Delete files that are not a key in dataJson
  var postFiles = getFiles(path);
  var index;
  for(var i in postFiles){
    // get just the file name without full path or extension
    index = getFieldFromFileName(postFiles[i]);
    if(index === '_data'){
      continue;
    }
    if(!dataJson[index]){
      // Delete the file
      fs.unlink(postFiles[i], function (err) {
        if (err){
          throw err;
        }
        console.log('successfully deleted ' + postFiles[i]);
      });
    }
  }

  show(posts, 'posts');
  show(pages, 'pages');
  exec('./node_modules/harp/bin/harp compile output build', function(error, stdout){
    console.log(error);
    console.log(stdout);
  });
}

function deleteActivePost(){
  var path = post.type === 'post' ? 'output/blog/' : 'output/';
  var index;
  if(post.type === 'post'){
    index = posts.indexOf(post);
    posts.splice(index, 1);
    show(posts, 'posts');
  }
  else if(post.type === 'page'){
    index = pages.indexOf(post);
    pages.splice(index, 1);
    show(pages, 'pages');
  }

  var fileName = path + post.title + '.md';
  fs.unlinkSync(fileName);

  post = {};
  post.title = '';
  post.text = '';

  updateView();
  console.log('successfully deleted ' + fileName);
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
  var elem = document.getElementById(elemId);
  elem.innerHTML = '';
  for(var i in items){
    elem.innerHTML += "<li><a href='#' onclick='load(\"" + items[i].type + "\", \"" + items[i].title + "\")' class='small m0 px1 py1 block'>" + items[i].title + "</a></li>";
  }
}

function newItem(type) {
  post = {title: '', text: '', type: type};
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
