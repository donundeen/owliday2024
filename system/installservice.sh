#!/bin/bash

sudo cp /home/pi/owliday2024/system/units/owliday2024.service /lib/systemd/user/
sudo systemctl daemon-reload
systemctl --user enable owliday2024.service 