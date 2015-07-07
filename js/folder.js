'use strict';

/**
 * Module dependencies
 */
var fs = require('fs');
var exec = require('child_process').exec;
var showdown  = require('showdown'),
    converter = new showdown.Converter();

var Promise = require("bluebird");
Promise.promisifyAll(fs);

// Variables that start with dom are DOM elements
var domMarkdown = document.getElementById('postMarkdown');
var domHtml = document.getElementById('postHTML');
var domTitle = document.getElementById('title');


// posts and pages are global because savePost is called from the DOM
// posts and pages could be stringified and passed in
// as long as we update the DOM when posts and pages

var posts = [];
var pages = [];

var config = {};
readJSONFile('output/_harp.json').then(function(val){
  config = val.globals;
  var postsPromise = loadPosts('output/' + config.blogBase);
  postsPromise.then(function(result){
    posts = result || [];
    show(posts, 'posts');
  });

  var pagesPromise = loadPosts('output/');
  pagesPromise.then(function(result){
    pages = result || [];
    show(pages, 'pages');
  });
});

// Global to hold the current post to display/edit
var post = {type: 'post', title: '', text: ''};

function readJSONFile(fileName){
  // TODO: don't check if file exists
  // TODO: just try to read it, and handle the error
  return fileExistsPromise(fileName).then(function(val){
    return val.filename;
  }).then(function(fileName){
    return fs.readFileAsync(fileName).then(function(val){
      return JSON.parse(val.toString());
    });
  }).catch(function(err) {
    return Promise.resolve({});
  });
}

function writeFile(fileName, data){
  fs.writeFileAsync(fileName, data).then(function(result){
    console.log('Saved: ' + fileName);
  }).catch(function(err){
    console.error(err);
  });
}

function updateView(){
  domTitle.value = post.title;
  domMarkdown.value = post.text;
  domHtml.innerHTML = converter.makeHtml(domMarkdown.value);
}

// Returns filename without the path or file extension
function getFileName(fileName){
  var startOfFileName = fileName.lastIndexOf('//') + 2;
  var endOfFileName = fileName.substring(startOfFileName, fileName.length).indexOf('.');
  endOfFileName += startOfFileName;
  return fileName.substring(startOfFileName, endOfFileName);
}

function getFromFile(dataJson, fileName, type){
  return fs.readFileAsync(fileName).then(function(val){
    var post = val.toString();
    var p;
    var url = getFileName(fileName);

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
    type = (directory === 'output/' + config.blogBase ? 'post' : 'page');
    return Promise.all([
      getFiles(directory),
      fs.readFileAsync(directory + '_data.json').then(function(val){
        return JSON.parse(val.toString());
      }).catch(function(err){
        // Create file
        fs.writeFileAsync(directory + '_data.json', '{}').then(function() {
          console.log(directory + '_data.json created.');
        });
      })
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
    // TODO: remove both .catch()?
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

function createDate(post){
  var date = new Date();
  return date.getFullYear() + '-' + date.getMonth() + '-' +  date.getDay();
}

function createId(post){
  if(post.id){
    return post.id;
  }
  return 'tag:' + config.domain + ',' + post.updated + ':' + config.blogBase + post.url
}

function addTags(post){
  // load Tags
  var tagPath = 'tags/';
  readJSONFile(tagPath + '_data.json')
  .then(function(dataJson){
    var added = false;
    for(var i in post.tags){
      dataJson[post.tags[i]] = dataJson[post.tags[i]] || [];
      added = false;
      // Update post if already in tag
      for(var j in dataJson[post.tags[i]]){
        if (dataJson[post.tags[i]][j].id === post.id){
          added = true;
          dataJson[post.tags[i]][j] = post;
        }
      }
      if(!added){
        dataJson[post.tags[i]].push(post);
      }
    }

    // write dataJson back to file
    writeFile(tagPath + '_data.json', JSON.stringify(dataJson));
  });
}

function addAuthors(post){
  // load Authors
  var authorPath = 'authors/';
  readJSONFile(authorPath + '_data.json')
  .then(function(dataJson){
    var added;
    for(var i in post.authors){
      dataJson[post.authors[i]] = dataJson[post.authors[i]] || [];
      added = false;
      for(var j in dataJson[post.authors[i]]){
        if (dataJson[post.authors[i]][j].id === post.id){
          added = true;
          dataJson[post.authors[i]][j] = post;
        }
      }
      if(!added){
        dataJson[post.authors[i]].push(post);
      }
    }
    // write dataJson back to file
    writeFile(authorPath + '_data.json', JSON.stringify(dataJson));
  });
}

function savePost(){
  if(post.title === '' && post.text === ''){
    return;
  }

  if(!post.updated){
    post.updated = createDate(post);
  }

  if(!post.url){
    post.url = post.title;
  }

  if(post.tags){
    addTags(post);
  }
  if(post.authors){
    addAuthors(post);
  }

  var path = (post.type === 'post' ? 'output/blog/' : 'output/');
  if(post.type === 'post' && !post.id){
    post.id = createId(post);
    posts.push(post);
  }
  else if(post.type === 'page' && !post.id){
    post.id = createId(post);
    pages.push(post);
  }

  // Write page contents to file
  writeFile(path + post.url + '.md', post.text);

  // read _data.json and update properties
  readJSONFile(path + '_data.json')
  .then(function(dataJson){
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
    if(postData.length === undefined){
      urlData = post.url;
    }

    var keys = Object.keys(post);
    for(var i in keys){
      postData[keys[i]] = post[keys[i]];
    }

    // If the url is change remove the object for the old url value
    if (post.url != urlData){
      delete dataJson[urlData];
    }

    dataJson[urlData] = postData;

    // write dataJson back to _data.json
    writeFile(path + '_data.json', JSON.stringify(dataJson));

    // Delete files that are not a key in dataJson
    var postFiles = getFiles(path).then(function(val){
      postFiles = val;
      var index;
      for(var i in postFiles){
        if(postFiles[i].indexOf('.md') < 0){
          continue;
        }

        index = getFileName(postFiles[i]);
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
    // TODO: does not work on Windows
    // TODO: cmd: "C:\Windows\system32\cmd.exe /s /c "./node_modules/harp/bin/harp compile output build""      exec('./node_modules/harp/bin/harp compile output build', function(error, stdout){
    exec('./node_modules/harp/bin/harp compile output build', function(error, stdout){
      console.error(error);
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

  // remove post from _data.json
  fs.readFileAsync(path + '_data.json').then(function(val){
    var dataJson = JSON.parse(val.toString());
    delete dataJson[post.url];

    // write dataJson back to _data.json
    writeFile(path + '_data.json', JSON.stringify(dataJson));

    var fileName = path + post.url + '.md';
    fs.unlinkAsync(fileName).then(function(val){
      post = {};
      post.title = '';
      post.text = '';

      updateView();
      console.log('successfully deleted ' + fileName);
    });
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
    for(var j in pages){
      if (pages[j].title === postTitle){
        post = pages[j];
        updateView();
      }
    }
  }
  populateSettings(false);
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

function removeActiveSelection(){
  var activeListItem = document.querySelectorAll('#posts > li > a, #pages > li > a');
  for(var j = 0; j < activeListItem.length; j++) {
    activeListItem[j].classList.remove('bg-blue', 'white');
  }
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
  var main = document.getElementById('main');
  if (main.style.display === 'none'){
    showSettings();
  }
  removeActiveSelection();
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

function showSettings(showGlobal){
  var main = document.getElementById('main');
  var settings = document.getElementById('settings');
  var savePost = document.getElementById('save-post');
  var saveGlobal = document.getElementById('save-global');
  if (main.style.display === 'none'){
    main.style.display = 'initial';
    settings.style.display = 'none';
  }
  else{
    main.style.display = 'none';
    settings.style.display = 'block';
    if(showGlobal){
      savePost.style.display = 'none';
      saveGlobal.style.display = 'block';
      populateSettings(true);
    }
    else{
      savePost.style.display = 'block';
      saveGlobal.style.display = 'none';
      populateSettings(false);
    }
  }
}

function addSetting(){
  var settings = document.getElementById('settings-table');
  settings.innerHTML += '<input type="text" value=""><input type="text" value=""><br>';
}

function saveSettings(showGlobal){
  var settings = document.getElementById('settings-table');
  var inputs = settings.getElementsByTagName('input');
  // every odd input is a key
  // the next input is the value
  var fileName = (showGlobal ? 'output/_harp.json': 'output/blog/_data.json');
  readJSONFile(fileName)
  .then(function(dataJson){
    var i = 0;
    while(i+1 < inputs.length){
      if(showGlobal){
        dataJson['globals'][inputs[i].value] = inputs[i+1].value;
      }
      else{
        // Cannot change id
        if(inputs[i].value !== 'id'){
          post[inputs[i].value] =
          dataJson[post.url][inputs[i].value] = inputs[i+1].value;
        }
      }
      i += 2;
    }

    if(showGlobal === false){
      if(post.tags){
        addTags(post);
      }
      if(post.authors){
        addAuthors(post);
      }
    }

    fs.writeFileAsync(fileName, JSON.stringify(dataJson));
  });
}

function populateSettings(showGlobal){
  var fileName = (showGlobal ? 'output/_harp.json': 'output/blog/_data.json');

  readJSONFile(fileName).then(function(dataJson){
    var keys;
    if(showGlobal){
      keys = Object.keys(dataJson['globals']);
    }
    else{
      keys = Object.keys(dataJson[post.url]);
    }
    var settings = document.getElementById('settings-table');
    settings.innerHTML = '';
    // TODO: make posts and authors a list

    for(var i in keys){
      if(!showGlobal){
        if (keys[i] !== 'text' && keys[i] !== 'id' && keys[i] !== 'type' && keys[i] !== 'updated'){
          settings.innerHTML += '<input type="text" value="' + keys[i] + '">' +
                                '<input type="text" value="' + dataJson[post.url][keys[i]] + '"><br>';
        }
      }
      else {
        settings.innerHTML += '<input type="text" value="' + keys[i] + '">' +
                              '<input type="text" value="' + dataJson['globals'][keys[i]] + '"><br>';
      }
    }
  });
}
