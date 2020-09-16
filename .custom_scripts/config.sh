option=$(echo -e "zsh\ni3\nsxhkd\npolybar\ndunst\ni3lock\nbash\nxinit\nxmonad\nxmobar\nalacritty" | rofi -show drun -i -dmenu --no-custom -p "config" -theme Arc-Dark)

if [ $option == "zsh" ]; then
  alacritty -e nvim ~/.zshrc
elif [ $option == "i3" ]; then
  alacritty -e nvim ~/.config/i3/config
elif [ $option == "sxhkd" ]; then
  alacritty -e nvim ~/.config/sxhkd/sxhkdrc 
elif [ $option == "dunst" ]; then
  alacritty -e nvim ~/.config/dunst/dunstrc
elif [ $option == "i3lock" ]; then
  alacritty -e nvim ~/.config/i3lock/.i3lockrc
elif [ $option == "bash" ]; then
  alacritty -e nvim ~/.bashrc
elif [ $option == "xinit" ]; then
  alacritty -e nvim ~/.xinitrc
elif [ $option == "xmonad" ]; then
  alacritty -e nvim ~/.xmonad/xmonad.hs
elif [ $option == "xmobar" ]; then
  alacritty -e nvim ~/.config/xmobar/xmobar.hs
elif [ $option == "alacritty" ]; then
  alacritty -e nvim ~/.config/alacritty/alacritty.yml
elif [ $option == "polybar" ]; then
  alacritty -e nvim ~/.config/polybar/config
fi
