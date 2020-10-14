option=$(echo -e "battery\nconfig\ncopy_config\nexit\nmonitors\npolybar\ntemperature\nxinput" | rofi -i -dmenu -no-custom -p "custom scripts")

urxvt -e nvim ~/.custom_scripts/$option.sh
