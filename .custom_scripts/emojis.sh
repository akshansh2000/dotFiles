#!/bin/bash

emoji=$(echo -e "$(cat ~/.custom_scripts/emojis)" | rofi -i -dmenu --no-custom -p "emoji")
echo $emoji | cut -d' ' -f1 | xclip -selection clipboard
