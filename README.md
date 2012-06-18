uncle-ben
=========

# install system dependencies
sudo aptitude install build-essential libssl-dev git-core mongodb libfreetype6 fontconfig nginx

# install nodejs
wget http://nodejs.org/dist/node-latest.tar.gz
tar xzf node-latest.tar.gz
cd node-v0.6.19/
./configure --prefix=/usr
make
sudo make install

# install phantomjs
cd ~
wget http://phantomjs.googlecode.com/files/phantomjs-1.5.0-linux-x86_64-dynamic.tar.gz
tar xzf phantomjs-1.5.0-linux-x86_64-dynamic.tar.gz
cd phantomjs/
ln -s ~/phantomjs/bin/phantomjs /usr/local/bin/phantomjs

# clone repo
cd ~
git clone https://github.com/xzyfer/uncle-ben.git

# install npm dependencies
npm install -d

# run webserver
nodemon app.js
