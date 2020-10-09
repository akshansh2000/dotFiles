option=$(echo -e "nvim\nzsh\nxresources\ni3\nsxhkd\npolybar\ndunst\ni3lock\nbash\nxinit\nxmonad\nxmobar\nalacritty" | rofi -show drun -i -dmenu --no-custom -p "config" -theme slate) 

if [ $option == "zsh" ]; then
  urxvt -e nvim ~/.zshrc
elif [ $option == "i3" ]; then
  urxvt -e nvim ~/.config/i3/config
elif [ $option == "sxhkd" ]; then
  urxvt -e nvim ~/.config/sxhkd/sxhkdrc 
elif [ $option == "dunst" ]; then
  urxvt -e nvim ~/.config/dunst/dunstrc
elif [ $option == "i3lock" ]; then
  urxvt -e nvim ~/.config/i3lock/.i3lockrc
elif [ $option == "bash" ]; then
  urxvt -e nvim ~/.bashrc
elif [ $option == "xinit" ]; then
  urxvt -e nvim ~/.xinitrc
elif [ $option == "xmonad" ]; then
  urxvt -e nvim ~/.xmonad/xmonad.hs
elif [ $option == "xmobar" ]; then
  urxvt -e nvim ~/.config/xmobar/xmobar.hs
elif [ $option == "alacritty" ]; then
  urxvt -e nvim ~/.config/alacritty/alacritty.yml
elif [ $option == "polybar" ]; then
  urxvt -e nvim ~/.config/polybar/config
elif [ $option == "nvim" ]; then
  urxvt -e nvim ~/.config/nvim/init.vim
elif [ $option == "xresources" ]; then
  urxvt -e nvim ~/.Xresources
fi
