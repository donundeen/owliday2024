Owl-idays 2024
==============

This project creates a choir of cellphones (or any device with a browser) that coordinate a performance of holiday spirit, fueled by data from ParetoAnywhere!

What's Going On?
====================

Each star represents a raddec served up by Beaver, a Pareto Anywhere module that maintains an up-to-date hyperlocal context graph by consuming the real-time data stream from Pareto Anywhere APIs.

Pressing "Play!" launches a midi file, synced across all connected devices, __even those that join after the performance has started__.

When the performance starts, the midi channels are distributed to all of the connected devices, and instruments are picked at random, so no performance is the same twice, and everyone gets their own unique part to play. A Pareto Anywhere mascot appears for each voice in the midi file. Each mascot sings the notes for its assigned channel.

Around each mascot spin icons representing all the dynamb values captured by Pareto Anwhere and passed along through Beaver.

Why is this cool?
====================

There's some neat time-syncing code going on, so that multiple devices can have have really close to the same time. This is useful for playing midi files together, but could be useful for lots of other things.

The graphics make use of lots of BLE data, like Raddecs and Dynambs, in a way that's not just fun, but could also be useful for ambient displays, to increase awareness of the incredible amount of interesting and useful data floating around us all the time. 

Prerequisites
=============
- [Pareto Anywhere](https://github.com/reelyactive/pareto-anywhere) running somewhere on your network. Note the IP address and port, you'll need it for configuring the app.

- Some BLE devices nearby. Unless you live in a lead-lined cave in siberia, this should be no problem.

Installation
============

Clone this repository, then run the following commands:

```
cd owliday2024
npm install
cd bin
./installservice.sh
systemctl --user start owliday2024.service 
```

Now it should be running.

You may choose to edit index.js to set the values for:
```
DEFAULT_BEAVER_URL = IP ADDRESS OF PARETO ANYWHERE
DEFAULT_BEAVER_PORT = PORT OF PARETO ANYWHERE
```

If you don't, it will default to the same IP address as the service.

With as many cell phones as you want, connect to the same network that this service is running on.

http://[YOUR IP]:3003/index.html

If Beaver isn't running on the same server as this service, you can set the IP and port of Pareto Anywhere by selecting "Setup" and entering the values.

Tap "Play!" to start the performance.

Enjoy the festivities!


Customizing the performance
============================

**lib/owliday2024.js** : At the top of the file, you can change the midifile to play. Songs with lots of differerent parts are the most fun.

**web/js/index.js** : You can change the images for the singers, and the icons for the dynambs.

Contributing
------------

Discover [how to contribute](CONTRIBUTING.md) to this open source project which upholds a standard [code of conduct](CODE_OF_CONDUCT.md).


Security
--------

Consult our [security policy](SECURITY.md) for best practices using this open source software and to report vulnerabilities.


License
-------

MIT License

Copyright (c) 2024 [reelyActive](https://www.reelyactive.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.