#!/bin/bash

fileList=(
  .config/alacritty
  .config/dunst
  .config/fontconfig
  .config/i3
  .config/i3lock
  .config/mimeapps.list
  .config/mpv/mpv.conf
  .config/mpv/input.conf
  .config/nvim/init.vim
  .config/picom.conf
  .config/polybar
  .config/qutebrowser
  .config/ranger
  .config/rofi
  .config/sxhkd
  .config/xmodmap
  .custom_scripts
  .gitconfig
  .irssi
  .p10k.zsh
  custom.rasi
  restart_network.sh
  Pictures/wallpapers
  .SpaceVim.d/init.toml
  .xinitrc
  .xprofile
  .Xresources
  .zshrc
)

builtin cd
for file in ${fileList[@]}; do
  cp -r $file Repositories/dotFiles/$(dirname "$file") 2> /dev/null
done
