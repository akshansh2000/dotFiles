option=$(echo -e "zsh\ni3\nsxhkd\ndunst\ni3lock\nbash\nxinit\nxmonad\nxmobar\nalacritty" | rofi -i -dmenu --no-custom -p "config" -theme Arc-Dark)

if [ $option == "zsh" ]; then
  alacritty -e nvim ~/.zshrc
elif [ $option == "i3" ]; then
 alacritty -e nvim ~/.config/i3/config
fi
