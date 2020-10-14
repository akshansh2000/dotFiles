#!/bin/bash

output=`for i in /sys/class/hwmon/hwmon*/temp*_input; do echo "$(<$(dirname $i)/name): $(cat ${i%_*}_label 2>/dev/null || echo $(basename ${i%_*})) $(readlink -f $i)"; done`

temperatureFile=`echo $output | perl -nle 'm/((?<=Package id 0 ).+(?= coretemp: Core 0))/; print $1'`

temperature=`\cat $temperatureFile | cut -d0 -f1`
if [ $temperature -gt 65 ]; then
  echo %{F#f7805c}temp: $temperature
else
  echo %{F#94e3d7}temp: $temperature
fi
