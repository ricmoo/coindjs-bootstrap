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

// Query a DNS seed for some addresses
bootstrap.DNS.query("dnsseed.bluematt.me", 8333, function (error, addresses) {
    console.log("Found:", addresses);
});

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

// Give the server a moment to 
setTimeout(function() { }, 3000);

