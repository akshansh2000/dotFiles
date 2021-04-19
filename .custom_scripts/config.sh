#!/bin/bash

option=$(echo -e "nvim\nspacevim\nzsh\nxresources\ni3\nsxhkd\nmpv\ncustom scripts\npolybar\ndunst\ni3lock\nrofi\nbash\nxinit\nxmonad\nxmobar\nalacritty" | rofi -show drun -i -dmenu --no-custom -p "config")

EDITOR='emacsclient -ncs emacsDaemon'

if [ "$option" == "zsh" ]; then
  $EDITOR ~/.zshrc
elif [ "$option" == "i3" ]; then
  $EDITOR ~/.config/i3/config
elif [ "$option" == "sxhkd" ]; then
  $EDITOR ~/.config/sxhkd/sxhkdrc 
elif [ "$option" == "dunst" ]; then
  $EDITOR ~/.config/dunst/dunstrc
elif [ "$option" == "i3lock" ]; then
  $EDITOR ~/.config/i3lock/.i3lockrc
elif [ "$option" == "bash" ]; then
  $EDITOR ~/.bashrc
elif [ "$option" == "xinit" ]; then
  $EDITOR ~/.xinitrc
elif [ "$option" == "xmonad" ]; then
  $EDITOR ~/.xmonad/xmonad.hs
elif [ "$option" == "xmobar" ]; then
  $EDITOR ~/.config/xmobar/xmobar.hs
elif [ "$option" == "alacritty" ]; then
  $EDITOR ~/.config/alacritty/alacritty.yml
elif [ "$option" == "polybar" ]; then
  $EDITOR ~/.config/polybar/config
elif [ "$option" == "nvim" ]; then
  $EDITOR ~/.config/nvim/init.vim
elif [ "$option" == "xresources" ]; then
  $EDITOR ~/.Xresources
elif [ "$option" == "rofi" ]; then
  $EDITOR ~/.config/rofi/config.rasi
elif [ "$option" == "custom scripts" ]; then
  ~/.custom_scripts/scripts_config.sh
elif [ "$option" == "spacevim" ]; then
  $EDITOR ~/.SpaceVim.d/init.toml
elif [ "$option" == "mpv" ]; then
  $EDITOR ~/.config/mpv/mpv.conf
fi
