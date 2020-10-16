#!/bin/bash

option=$(echo -e "battery\nconfig\ncopy_config\nexit\nmonitors\npolybar\nscripts_config\ntemperature\nxinput" | rofi -i -dmenu -no-custom -p "custom scripts")

if [ -f ~/.custom_scripts/$option.sh ]; then
  urxvt -e nvim ~/.custom_scripts/$option.sh
fi
