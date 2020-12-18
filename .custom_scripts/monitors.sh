option=$(echo -e "duplicate\nextend\noff" | rofi -i -dmenu -no-custom -p "xrandr")

if [ "$option" == "duplicate" ]; then
  mons -d
  xrandr --output eDP-1 --scale 1x1
elif [ "$option" == "extend" ]; then
  mons -e right
  xrandr --output eDP-1 --scale 1x1

  sleep 3
  /home/akshansh2000/.custom_scripts/polybar.sh
elif [ "$option" == "off" ]; then
  mons -o
  xrandr --output eDP-1 --scale 1x1

  sleep 3
  /home/akshansh2000/.custom_scripts/polybar.sh
else
  exit
fi
