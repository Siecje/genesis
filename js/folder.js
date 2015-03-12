'use strict';
//postFiles.map(function(promise) { return promise.then(pLogicFn); })
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
  posts = result || [];
  show(posts, 'posts');
});
var pages = [];
var pagesPromise = loadPosts('output/');
pagesPromise.then(function(result){
  pages = result || [];
  show(pages, 'pages');
});

// Global to hold the current post to display/edit
var post = {type: 'post', title: '', text: ''};

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

function getFromFile(dataJson, fileName, type){
  return fs.readFileAsync(fileName).then(function(val){
    var post = val.toString();
    var p;
    var url = getFieldFromFileName(fileName);

    return {
      text: post,
      // url is the file name without extension
      url: url,
      type: type,
      id: dataJson[url].id,
      title: dataJson[url].title
    };
  });
}

function loadPosts(directory){
  var type;
  var posts = [];

  return Promise.try(function(){
    type = (directory === 'output/blog/' ? 'post' : 'page');
    return Promise.all([
      getFiles(directory),
      fs.readFileAsync(directory + '_data.json').then(function(val){
        return JSON.parse(val.toString());})
    ]);
  }).spread(function(postFiles, dataJson) {
      var postObject;
      var filePromises = [];
      for (var i in postFiles){
        if(postFiles[i].indexOf('.md') < 0){
          continue;
        }
        filePromises.push(getFromFile(dataJson, postFiles[i], type));
      }
      return Promise.all(filePromises);
    })
    .catch(SyntaxError, function(e) {
      console.error(e);
      console.error("invalid json in file");
    })
    .catch(function(e){
      console.error("unable to read file")
    });
}

function fileExistsPromise(fileName){
  return fs.statAsync(fileName).then(function(statData){
    return Promise.resolve({filename: fileName, statData: statData});
  });
}

function getFiles (dir){
  return Promise.try(function(){
    return fs.readdirAsync(dir);
  }).then(function(files) {
    var filePromises = [];
    var name = '';
    var  filePromise;

    for (var i in files){
      name = dir + '/' + files[i];
      filePromise = fileExistsPromise(name);

      filePromises.push(filePromise);
    }

    return Promise.all(filePromises);
  }).then(function(results) {
    var validItems = [];
    var name;
    var statData;

    for (var i in results) {
      name = results[i].filename;
      statData = results[i].statData;
      if(statData.isDirectory() === false){
        if(name.indexOf('.keep') < 0) {
          validItems.push(name);
        }
      }
    }
    return Promise.resolve(validItems);
  });
}

function savePost(){
  if(post.title === '' && post.text === ''){
    return;
  }

  if(!post.url){
    post.url = post.title;
  }

  var path = (post.type === 'post' ? 'output/blog/' : 'output/');
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
  fileExistsPromise(path + '_data.json').then(function(val){
    return val.filename;
  }).then(function(fileName){
    return fs.readFileAsync(fileName).then(function(val){
      return JSON.parse(val.toString());
    });
  }).catch(function(err) {
    /* You should check here whether the error is that the file doesn't exist... */
    return Promise.resolve({});
  }).then(function(dataJson){
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

    var keys = Object.keys(post);
    for(var i in keys){
      if(keys[i] !== 'text'){
        postData[keys[i]] = post[keys[i]];
      }
    }

    // If the url is change remove the object for the old url value
    if (post.url != urlData){
      delete dataJson[urlData];
    }

    dataJson[urlData] = postData;

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
    var postFiles = getFiles(path).then(function(val){
      postFiles = val;
      var index;
      for(var i in postFiles){
        if(postFiles[i].indexOf('.md') < 0){
          continue;
        }
        // get just the file name without full path or extension
        index = getFieldFromFileName(postFiles[i]);
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
    });

      show(posts, 'posts');
      show(pages, 'pages');
      exec('./node_modules/harp/bin/harp compile output build', function(error, stdout){
        console.log(error);
        console.log(stdout);
      });
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
  fs.unlinkAsync(fileName).then(function(val){
    post = {};
    post.title = '';
    post.text = '';

    updateView();
    console.log('successfully deleted ' + fileName);
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
  var elem = document.getElementById(elemId);
  elem.innerHTML = '';
  for(var i in items){
    if (items[i] === post){
      elem.innerHTML += "<li><a href='#' onclick='load(\"" + items[i].type + "\", \"" + items[i].title + "\");' class='small m0 px1 py1 block bg-blue white'>" + items[i].title + "</a></li>";
    }
    else{
      elem.innerHTML += "<li><a href='#' onclick='load(\"" + items[i].type + "\", \"" + items[i].title + "\");' class='small m0 px1 py1 block'>" + items[i].title + "</a></li>";
    }
  }
  highlight();
}

function removeActive(list, e, callback) {
  for(var j = 0; j < list.length; j++) {
    list[j].classList.remove('bg-blue', 'white');
  }
  callback(e);
}

function setActive(e) {
  e.currentTarget.classList.add('bg-blue', 'white');
}

function highlight(){
  var activeListItem = document.querySelectorAll('#posts > li > a, #pages > li > a');

  for(var i = 0; i < activeListItem.length; i++) {
    activeListItem[i].addEventListener('click', function(e) {
      removeActive(activeListItem, e, setActive);
    });
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
