#!/bin/bash

option=$(echo -e "toDo\ntoWatch\nflags" | rofi -show drun -i -dmenu -no-custom -p "taskell")
[ "$option" = "" ] || urxvt -e taskell ~/Documents/taskell/$option.md
