#!/bin/bash

fileList=(
  .config/alacritty
  .config/dunst
  .config/fontconfig
  .config/i3
  .config/i3lock
  .config/mimeapps.list
  .config/nvim/init.vim
  .config/picom.conf
  .config/polybar
  .config/ranger
  .config/rofi
  .config/sxhkd
  .config/xmobar
  .custom_scripts
  .irssi
  .p10k.zsh
  restart_network.sh
  Pictures/wallpapers
  slate.rasi
  .SpaceVim.d/init.toml
  .xinitrc
  .xmonad
  .Xresources
  .zsh_history
  .zshrc
)

builtin cd
for file in ${fileList[@]}; do
  cp -r $file Repositories/dotFiles/$(dirname "$file") 2> /dev/null
done
