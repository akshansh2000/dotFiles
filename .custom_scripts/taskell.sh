#!/bin/bash

option=$(for file in ~/Documents/taskell/*; do echo $(basename $file) | cut -d. -f1; done | rofi -show drun -i -dmenu -no-custom -p "taskell")
[ "$option" = "" ] || alacritty -e taskell ~/Documents/taskell/$option.md
