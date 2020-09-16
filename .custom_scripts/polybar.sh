killall polybar 2> /dev/null

if type "xrandr"; then
  for m in $(xrandr --query | grep " connected" | cut -d" " -f1); do
    MONITOR=$m polybar -c /home/akshansh2000/.config/polybar/config --reload example &
  done
else
  polybar -c /home/akshansh2000/.config/polybar/config --reload example
fi
