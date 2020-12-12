option=$(echo -e "duplicate\nextend\noff" | rofi -i -dmenu -no-custom -p "xrandr")

if [ "$option" == "duplicate" ]; then
  mons -d
  xrandr --output eDP-1 --scale 1x1
elif [ "$option" == "extend" ]; then
  mons -e right
  xrandr --output eDP-1 --scale 1x1
elif [ "$option" == "off" ]; then
  mons -o
  xrandr --output eDP-1 --scale 1x1
else
  exit
fi

sleep 3
/home/akshansh2000/.custom_scripts/polybar.sh
