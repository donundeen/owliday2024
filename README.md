# owliday2024
code for a hoootenanny

This project creates a choir of cellphones (or any device with a browser) that coordinate a performance of holiday spirit, fueled by data from ParetoAnywhere!

# What's Going On?

Each star represents a raddec served up by Beaver, a Pareto Anywhere module that maintains an up-to-date hyperlocal context graph by consuming the real-time data stream from Pareto Anywhere APIs.

Pressing "Play!" launches a midi file, synced across all connected devices, event those that join after the performance has started.

When the performance starts, the midi channels are distributed to all of the connected devices, and instruments are picked at random, so no performance is the same twice, and everyone gets their own unique part to play. A Pareto Anywhere mascot appears for each voice in the midi file. Each mascot sings the notes for its assigned channel.

Around each mascot spin icons representing all the dynamb values captured by Pareto Anwhere and passed along through Beaver.

# Prerequisites

- Pareto Anywhere running somewhere on your network. Note the IP address and port, you'll need it for configuring the app.

- Some BLE devices nearby. Unless you live in a lead-lined cave in siberia, this should be no problem.

# Installation

Clone this repo

```
cd owliday2024
npm install
cd system
./installservice.sh
systemctl --user enable owliday2024.service 
```

Now it should be running.

You may choose to edit index.js to set the values for:
```
DEFAULT_BEAVER_URL = IP ADDRESS OF PARETO ANYWHERE
DEFAULT_BEAVER_PORT = PORT OF PARETO ANYWHERE
```

Or you can set them in the web page before you start the graphics.

With as many cell phones as you want, connect to the same network that this service is running on.

http://[YOUR IP]:8083/index.html

Here, you can set the IP and port of Pareto Anywhere by selecting "Setup" and entering the values.

Tap "Play!" to start the performance.

Enjoy the festivities!
