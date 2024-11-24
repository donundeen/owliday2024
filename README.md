# owliday2024
code for a hoootenanny

This project creates a choir of cellphones (or any device with a browser) that coordinate a performance of holiday spirit, fueled by data from ParetoAnywhere!


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

You may choose to edit index.node.js to set the values for:
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
