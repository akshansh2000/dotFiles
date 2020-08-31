option=$(echo -e "lock\nsuspend\nexit i3\nshut down" | rofi -i -dmenu -no-custom -p "exit session" -theme Arc-Dark)

if [ "$option" == "lock" ]; then
  i3lock
elif [ "$option" == "suspend" ]; then
  systemctl suspend
elif [ "$option" == "exit i3" ]; then
  i3-msg exit
elif [ "$option" == "shut down" ]; then
  shutdown now
fi
