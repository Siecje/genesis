# Setup Development Environment

## Windows

### Installing Dependencies
Install the following by going to the website and downloading the installer and running it.

- [git](http://git-scm.com/download/win)
    - Install Git Bash and check ```Git Bash Here``` in context menu
- [io.js](https://iojs.org/en/index.html)
- [NW.js](http://nwjs.io/)
    - Download and extract

After you restart use ```Git Bash``` to navigate to where you want to checkout the source.
```bash
git clone https://github.com/siecje/genesis
cd genesis
npm install
```
### Building
To build Genesis navigate to where NW.js was extracted and right click in the folder and ```Git Bash Here```.

```bash
nw.exe ~/path/to/genesis/
```

##Linux

###Installing Dependencies

- [git](http://git-scm.com/)
- [io.js](https://iojs.org/en/index.html)
    - Recommended to use ```
    nvm install iojs```
- [NW.js](http://nwjs.io/)
    - Download and extract


```bash
git clone https://github.com/siecje/genesis
cd genesis
npm install
```

### Building
To build Genesis navigate to where NW.js was extracted

```bash
./nw ~/path/to/genesis/
```
