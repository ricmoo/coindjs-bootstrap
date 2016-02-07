CoinDJs - Bootstrap
===================

This is the *bootstrap* component of **CoinDJs**, a bitcoin (namecoin and ilk) full node and library.

Bootstrapping allows the peer-to-peer network to discover its initial set of peers to connect to, and has a couple methods:
- **DNS** - Connects to a set of trusted seed domain names to get a list of peers
- **IRC** - Connects to a given IRC (Internet Relay Chat) channel to announce and seek peers


Install
-------

```
npm install coindjs-bootstrap
```


Connecting to DNS Seeds
-----------------------

This is the method *bitcoind* uses today, which operates against a list of trusted DNS seeds included in the *bitcoind* source code.

```javascript
var bootstrap = require('./index.js');

var seeds = [
    "seed.bitcoin.sipa.be",
    "dnsseed.bluematt.me",
    "dnsseed.bitcoin.dashjr.org",
    "seed.bitcoinstats.com",
    "seed.bitnodes.io",
    "bitseed.xf2.org"
];

// Connect to several DNS seeds
var dnsBootstrap = new bootstrap.DNS(seeds, 8333);
dnsBootstrap.on('found', function(addresses) {
    console.log("Found: ", addresses);
});
dnsBootstrap.on('updated', function(addresses) {
    console.log("Updated:", addresses);
});

// Query a single DNS seed for some addresses
bootstrap.DNS.query(seeds[0], 8333, function (error, addresses) {
    console.log("Found:", addresses);
});
```


Connecting to IRC
-----------------

This method is no longer used by the *Bitcoin* network, but is still popular with alt-coins that were forked from *bitcoind* quite early on, such as *Namecoin*.
 
```javascript
// Bitcoin once upon a time used #bitcoin00 through #bitcoin99
// Namecoin still uses #nmaecoin00 through #namecoin1
function randomNamecoinChannel() {
    return '#namecoin0' + parseInt(Math.random() * 2);
}

// Connect to IRC and set our address
var ircBootstrap = new bootstrap.IRC(randomNamecoinChannel(), '127.0.0.1', 8334);

// We have found some addresses
ircBootstrap.on('found', function(addresses) {
    console.log("Found:", addresses);
});

// Updated is always triggered, even for the initial addresses
ircBootstrap.on('updated', function(users) {
    console.log("Updated:", users);
});

// Convert a nickname to an address
var nickname = 'u88qSoM5z6w9QqB';
console.log(bootstrap.IRC.nicknameToAddress(nickname));

// Convert an address to a nickname
var host = '127.0.0.1', port = 8334;
console.log(bootstrap.IRC.addressToNickname(host, port));

// Give the server a moment to run (it does not stop the node instance from terminating)
setTimeout(function() { }, 3000);
```


Found vs Updated events
-----------------------

The **found** event is emitted the first time any addresses are found; services which only care about any initial set of peers can listen for this event.

The **updated** event is emitted whenever any new addresses are found, including the above *found* event.


Testing
-------

For now, there is a `test.js` that does basic/manual sanity checks... More testing coming soon.


Donations?
----------

Obviously, it's all licensed under the MIT license, so use it as you wish; but if you'd like to buy me a coffee, I won't complain. =)

- Bitcoin - `1Fio5rkqduaH5p47Kb9nKSHyHn1swqQiJK`
- Dogecoin - `DMuMsChNgLb3kMqSJFqqYTfZNnbPZkcs3z`
- Testnet3 - `n2JD7JZ6y32C1DMvA5h7FzeBRNA15FQPdH`
