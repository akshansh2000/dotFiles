#!/bin/bash

option=$(echo -e "toDo\ntoWatch" | rofi -show drun -i -dmenu -no-custom -p "taskell")
urxvt -e taskell ~/Documents/taskell/$option.md
