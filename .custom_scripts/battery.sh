while true; do
  sleep 30

  batteryLevel=`acpi -b | perl -nle 'm/(\d+(?=\%))/; print $1'` 
  batteryStatus=`acpi -b | perl -nle 'm/((?<=:\ ).+(?=,\ \d+\%))/; print $1'`

  if [ $batteryLevel -lt 20 -a $batteryStatus == "Discharging" ]; then
    i3-msg "fullscreen disable"
    notify-send -a "Power Level" "Battery Low ($batteryLevel%)" "You might want to plug in to a power source."
  fi
done
