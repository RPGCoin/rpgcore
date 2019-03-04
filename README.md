# RPGcore
----

This is RPGCoin's fork of Bitpay's Bitcore. It has a limited segwit support.


----
# Getting Started
## Deploying RPGcore full-stack manually:
## These instructions are for Ubuntu 18.04 Bionic
----
### Setup required build tools

```
sudo apt-get update && sudo apt-get upgrade
sudo apt-get -y install curl git make build-essential libzmq3-dev python2.7
```

### Install and Configure Node Version Manager (NVM)

```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash

export NVM_DIR="${XDG_CONFIG_HOME/:-$HOME/.}nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

source ~/.bashrc
```

#### Install node 10.5.0

```
nvm install 10.5.0
nvm use 10.5.0
```

#### To fully update node and npm and have them persist across reboots in one command…

```
nvm install node && nvm alias default node && npm update npm -g
```

#### to use nvm and node as sudo, paste the following in one code block

```
n=$(which node); \
n=${n%/bin/node}; \
chmod -R 755 $n/bin/*; \
sudo cp -r $n/{bin,lib,share} /usr/local
```

----
### Install and Configure Mongodb

#### Install mongodb

```
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 9DA31620334BD75D9DCB49F368818C72E52529D4
echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo service mongod start
```

#### Setup Mongodb User
To setup unique mongo credentials:

```
mongo
>use rpg-api-livenet
>db.createUser( { user: "test", pwd: "test1234", roles: [ "readWrite" ] } )
>exit
```

Note down these credentials for next step

----

### Install rpgcore

```
sudo ln -s /usr/bin/python2.7 /usr/bin/python
git clone https://github.com/RPGCoin/rpgcore.git
cd rpgcore && git checkout master
npm install -g --production
```
----

## Configuration

### rpgcore-node.json
Copy the following into a file named rpgcore-node.json and place it in ~/.rpgcore/ (be sure to customize username values(without angle brackets<>) and/or ports)

```json
{
  "network": "livenet",
  "port": 3001,
  "services": [
    "rpgd",
    "web",
    "insight-api",
    "insight-ui"
  ],
  "allowedOriginRegexp": "^https://<yourdomain>\\.<yourTLD>$",
  "messageLog": "",
  "servicesConfig": {
    "web": {
      "disablePolling": true,
      "enableSocketRPC": false
    },
    "insight-ui": {
      "routePrefix": "",
      "apiPrefix": "api"
    },
    "insight-api": {
      "routePrefix": "api",
      "coinTicker" : "https://api.coinmarketcap.com/v1/ticker/rpgcoin/?convert=USD",
      "coinShort": "RPG",
	    "db": {
		  "host": "127.0.0.1",
		  "port": "27017",
		  "database": "rpg-api-livenet",
		  "user": "test",
		  "password": "test1234"
	  }
    },
    "rpgd": {
      "sendTxLog": "/home/<yourusername>/.rpgcore/pushtx.log",
      "spawn": {
        "datadir": "/home/<yourusername>/.rpgcore/data",
        "exec": "/home/<yourusername>/rpgcore/node_modules/rpgcore-node/bin/rpgd",
        "rpcqueue": 1000,
        "rpcport": 7210,
        "zmqpubrawtx": "tcp://127.0.0.1:28332",
        "zmqpubhashblock": "tcp://127.0.0.1:28332"
      }
    }
  }
}
```

Quick note on allowing socket.io from other services. 
- If you would like to have a seperate services be able to query your api with live updates, remove the "allowedOriginRegexp": setting and change "disablePolling": to false. 
- "enableSocketRPC" should remain false unless you can control who is connecting to your socket.io service. 
- The allowed OriginRegexp does not follow standard regex rules. If you have a subdomain, the format would be(without angle brackets<>):

```
"allowedOriginRegexp": "^https://<yoursubdomain>\\.<yourdomain>\\.<yourTLD>$",
```

### rpg.conf

Copy the following into a file named rpg.conf and place it in ~/.rpgcore/data

```json
server=1
whitelist=127.0.0.1
txindex=1
addressindex=1
timestampindex=1
spentindex=1
zmqpubrawtx=tcp://127.0.0.1:28332
zmqpubhashblock=tcp://127.0.0.1:28332
rpcport=7210
rpcallowip=127.0.0.1
rpcuser=rpgcoin
rpcpassword=local321 #change to something unique
uacomment=rpgcore-sl

mempoolexpiry=72 # Default 336
rpcworkqueue=1100
maxmempool=2000
dbcache=1000
maxtxfee=1.0
dbmaxfilesize=64
```

### Configure RPCUsername and password

edit the file located at ~/rpgcore/node_modules/rpgd-rpc/lib/index.js
modify lines 9-12 to be sure your local ip, rpc port, username and password match what was configured earlier in rpgd.conf

```js
  this.host = opts.host || '127.0.0.1';
  this.port = opts.port || 7210;
  this.user = opts.user || 'user';
  this.pass = opts.pass || 'pass';
```

### Avoid a bug with the bindings.gyp in node-x21s

```
cd ~/rpgcore/node_modules/node-x21s
node-gyp configure
node-gyp build
cd ../../ && npm rebuild
```

----
## Launch your copy of rpgcore:
````
rpgcored
````
You can then view the RPGcoin block explorer at the location: `http://localhost:3001`

Create an Nginx proxy to forward port 80 and 443(with a snakeoil ssl cert)traffic:
----
IMPORTANT: this "nginx-rpgcore" config is not meant for production use
see this guide [here](https://www.nginx.com/blog/using-free-ssltls-certificates-from-lets-encrypt-with-nginx/) for production usage
````
sudo apt-get install -y nginx ssl-cert
````
copy the following into a file named "nginx-rpgcore" and place it in /etc/nginx/sites-available/
````
server {
    listen 80;
    listen 443 ssl;
        
    include snippets/snakeoil.conf;
    root /home/rpgcore/www;
    access_log /var/log/nginx/rpgcore-access.log;
    error_log /var/log/nginx/rpgcore-error.log;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 10;
        proxy_send_timeout 10;
        proxy_read_timeout 100; # 100s is timeout of Cloudflare
        send_timeout 10;
    }
    location /robots.txt {
       add_header Content-Type text/plain;
       return 200 "User-agent: *\nallow: /\n";
    }
    location /rpgcore-hostname.txt {
        alias /var/www/html/rpgcore-hostname.txt;
    }
}
````
Then enable your site:
````
sudo ln -s /etc/nginx/sites-available/nginx-rpgcore /etc/nginx/sites-enabled
sudo rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-available/default
sudo mkdir /etc/systemd/system/nginx.service.d
sudo printf "[Service]\nExecStartPost=/bin/sleep 0.1\n" | sudo tee /etc/systemd/system/nginx.service.d/override.conf
sudo systemctl daemon-reload
sudo systemctl restart nginx
````
Upgrading RPGcore full-stack manually:
----

- This will leave the local blockchain copy intact:
Shutdown the rpgcored application first, and backup your unique rpg.conf and rpgcore-node.json
````
cd ~/
rm -rf .npm .node-gyp rpgcore
rm .rpgcore/data/rpg.conf .rpgcore/rpgcore-node.json

#reboot

git clone https://github.com/RPGCoin/rpgcore.git
cd rpgcore && git checkout lightweight
npm install -g --production
````
(recreate your unique rpg.conf and rpgcore-node.json)

- This will redownload a new blockchain copy:
(Some updates may require you to reindex the blockchain data. If this is the case, redownloading the blockchain only takes 20 minutes)
Shutdown the rpgcored application first, and backup your unique rpg.conf and rpgcore-node.json
````
cd ~/
rm -rf .npm .node-gyp rpgcore
rm -rf .rpgcore

#reboot

git clone https://github.com/RPGCoin/rpgcore.git
cd rpgcore && git checkout lightweight
npm install -g --production
````
(recreate your unique rpg.conf and rpgcore-node.json)

Undeploying RPGcore full-stack manually:
----
````
nvm deactivate
nvm uninstall 10.5.0
rm -rf .npm .node-gyp rpgcore
rm .rpgcore/data/rpg.conf .rpgcore/rpgcore-node.json
mongo
>use rpg-api-livenet
>db.dropDatabase()
>exit
````

## Applications

- [Node](https://github.com/RPGCoin/rpgcore-node) - A full node with extended capabilities using RPGcoin Core
- [Insight API](https://github.com/RPGCoin/insight-api-rpg) - A blockchain explorer HTTP API
- [Insight UI](https://github.com/RPGCoin/insight-ui-rpg) - A blockchain explorer web user interface
- (to-do) [Wallet Service](https://github.com/RPGCoin/rpgcore-wallet-service) - A multisig HD service for wallets
- (to-do) [Wallet Client](https://github.com/RPGCoin/rpgcore-wallet-client) - A client for the wallet service
- (to-do) [CLI Wallet](https://github.com/RPGCoin/rpgcore-wallet) - A command-line based wallet client
- (to-do) [Angular Wallet Client](https://github.com/RPGCoin/angular-rpgcore-wallet-client) - An Angular based wallet client
- (to-do) [Copay](https://github.com/RPGCoin/copay) - An easy-to-use, multiplatform, multisignature, secure rpgcoin wallet

## Libraries

- [Lib](https://github.com/RPGCoin/rpgcore-lib) - All of the core RPGcoin primatives including transactions, private key management and others
- (to-do) [Payment Protocol](https://github.com/RPGCoin/rpgcore-payment-protocol) - A protocol for communication between a merchant and customer
- [P2P](https://github.com/RPGCoin/rpgcore-p2p) - The peer-to-peer networking protocol
- (to-do) [Mnemonic](https://github.com/RPGCoin/rpgcore-mnemonic) - Implements mnemonic code for generating deterministic keys
- (to-do) [Channel](https://github.com/RPGCoin/rpgcore-channel) - Micropayment channels for rapidly adjusting rpgcoin transactions
- [Message](https://github.com/RPGCoin/rpgcore-message) - RPGcoin message verification and signing
- (to-do) [ECIES](https://github.com/RPGCoin/rpgcore-ecies) - Uses ECIES symmetric key negotiation from public keys to encrypt arbitrarily long data streams.

## Security

We're using RPGcore in production, but please use common sense when doing anything related to finances! We take no responsibility for your implementation decisions.

## Contributing

Please send pull requests for bug fixes, code optimization, and ideas for improvement. For more information on how to contribute, please refer to our [CONTRIBUTING](https://github.com/RPGCoin/rpgcore/blob/master/CONTRIBUTING.md) file.

## License

Code released under [the MIT license](https://github.com/RPGCoin/rpgcore/blob/master/LICENSE).
