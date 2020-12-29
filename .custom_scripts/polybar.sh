killall polybar 2> /dev/null

if type "xrandr"; then
  for m in $(xrandr --query | grep " connected" | cut -d" " -f1); do
    MONITOR=$m polybar -c /home/akshansh2000/.config/polybar/config --reload top &
    MONITOR=$m polybar -c /home/akshansh2000/.config/polybar/config --reload bottom &
  done
else
  polybar -c /home/akshansh2000/.config/polybar/config --reload top &
  polybar -c /home/akshansh2000/.config/polybar/config --reload bottom &
fi
