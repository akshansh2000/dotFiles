#!/bin/bash

option=$(for file in ~/.custom_scripts/*; do if [ -x "$file" ]; then echo $(basename $file); fi | cut -d. -f1; done | rofi -i -dmenu -p "custom scripts" -no-custom)

if [ -f ~/.custom_scripts/$option.sh ]; then
  urxvt -e nvim ~/.custom_scripts/$option.sh
fi
