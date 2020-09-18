option=$(echo -e "duplicate\nextend\nextend and scale eDP-1\noff" | rofi -i -dmenu -no-custom -p "xrandr" -theme Arc-Dark)

if [ "$option" == "duplicate" ]; then
  mons -d
  xrandr --output eDP-1 --scale 1x1
elif [ "$option" == "extend" ]; then
  mons -e right
  xrandr --output eDP-1 --scale 1x1
elif [ "$option" == "extend and scale eDP-1" ]; then
  mons -e right
  xrandr --output eDP-1 --scale 0.6x0.6
elif [ "$option" == "off" ]; then
  mons -o
  xrandr --output eDP-1 --scale 1x1
else
  exit
fi

/home/akshansh2000/.custom_scripts/polybar.sh
