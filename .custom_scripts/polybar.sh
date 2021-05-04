killall polybar 2> /dev/null

if type "xrandr"; then
  for m in $(xrandr --query | grep " connected" | cut -d" " -f1); do
    MONITOR=$m polybar -c /home/akshansh2000/.config/polybar/config --reload top &
    # MONITOR=$m polybar -c /home/akshansh2000/.config/polybar/config --reload bottom &
    MONITOR=$m polybar -c /home/akshansh2000/.config/polybar/config --reload top_underlay &
    # MONITOR=$m polybar -c /home/akshansh2000/.config/polybar/config --reload bottom_underlay &
  done
else
  polybar -c /home/akshansh2000/.config/polybar/config --reload top &
  polybar -c /home/akshansh2000/.config/polybar/config --reload bottom &
  polybar -c /home/akshansh2000/.config/polybar/config --reload top_underlay &
  polybar -c /home/akshansh2000/.config/polybar/config --reload bottom_underlay &
fi
