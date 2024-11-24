# owliday2024
code for a hoootenanny

This project creates a choir of cellphones (or any device with a browser) that coordinate a performance of holiday spirit, fueled by data from ParetoAnywhere!


# Prerequisites

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

With as many cell phones as you want, connect to the same network that this service is running on.

http://[YOUR IP]:8083/index.html

Enjoy the festivities!
