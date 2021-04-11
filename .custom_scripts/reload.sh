#!/bin/bash

i3-msg "restart"
killall picom 2> /dev/null
sleep 0.2
picom &
~/.custom_scripts/polybar.sh
