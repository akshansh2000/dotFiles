#!/bin/bash

isMuted=`pulseaudio-ctl full-status | rev | cut -d' ' -f1 | rev`
if [ $isMuted == no ]; then
  echo %{F#ff2828}!
else
  echo %{F#aaaa00}
fi
