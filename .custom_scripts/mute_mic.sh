#!/bin/bash

pulseaudio-ctl mute-input
isMuted=`pulseaudio-ctl full-status | cut -d' ' -f3`

if [ $isMuted == "no" ]; then
  result="Unmuted"
else
  result="Muted"
fi

# notify-send "Mic Input" $result
