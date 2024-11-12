#!/bin/bash

cp /home/pi/owliday2024/system/units/owliday2024.service /lib/systemd/user/
systemctl daemon-reload
systemctl --user enable owliday2024.service 