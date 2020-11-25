#!/bin/bash

if [ $(dunstctl is-paused) == "true" ]; then
  dunstctl set-paused false
  notify-send -a "dunstctl" "Notifications Enabled"
else
  notify-send -a "dunstctl" "Disabling notifications in 15 seconds"
  sleep 15
  dunstctl set-paused true
fi
