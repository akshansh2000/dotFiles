#!/bin/bash

isMuted=`pulseaudio-ctl full-status | cut -d' ' -f3`
if [ $isMuted == no ]; then
  echo %{F#ff2828}!
else
  echo %{F#aaaa00}
fi
