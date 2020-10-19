#!/bin/bash

option=$(echo -e "nvim\nspacevim\nzsh\nxresources\ni3\nsxhkd\ncustom scripts\npolybar\ndunst\ni3lock\nrofi\nbash\nxinit\nxmonad\nxmobar\nalacritty" | rofi -show drun -i -dmenu --no-custom -p "config")

term=$(which urxvt)

if [ "$option" == "zsh" ]; then
  $term -e nvim ~/.zshrc
elif [ "$option" == "i3" ]; then
  $term -e nvim ~/.config/i3/config
elif [ "$option" == "sxhkd" ]; then
  $term -e nvim ~/.config/sxhkd/sxhkdrc 
elif [ "$option" == "dunst" ]; then
  $term -e nvim ~/.config/dunst/dunstrc
elif [ "$option" == "i3lock" ]; then
  $term -e nvim ~/.config/i3lock/.i3lockrc
elif [ "$option" == "bash" ]; then
  $term -e nvim ~/.bashrc
elif [ "$option" == "xinit" ]; then
  $term -e nvim ~/.xinitrc
elif [ "$option" == "xmonad" ]; then
  $term -e nvim ~/.xmonad/xmonad.hs
elif [ "$option" == "xmobar" ]; then
  $term -e nvim ~/.config/xmobar/xmobar.hs
elif [ "$option" == "alacritty" ]; then
  $term -e nvim ~/.config/alacritty/alacritty.yml
elif [ "$option" == "polybar" ]; then
  $term -e nvim ~/.config/polybar/config
elif [ "$option" == "nvim" ]; then
  $term -e nvim ~/.config/nvim/init.vim
elif [ "$option" == "xresources" ]; then
  $term -e nvim ~/.Xresources
elif [ "$option" == "rofi" ]; then
  $term -e nvim ~/.config/rofi/config.rasi
elif [ "$option" == "custom scripts" ]; then
  ~/.custom_scripts/scripts_config.sh
elif [ "$option" == "spacevim" ]; then
  $term -e nvim ~/.SpaceVim.d/init.toml
fi
