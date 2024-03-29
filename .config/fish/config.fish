if status is-interactive
    # Commands to run in interactive sessions can go here
end

# if [ -z $DISPLAY ] && [ (tty) = "/dev/tty1" ]
#   startx
# end

abbr --add --global cat bat
abbr --add --global get sudo pacman -S --needed
abbr --add --global pls sudo
abbr --add --global l ls -AFl
abbr --add --global v nvim
abbr --add --global sv sudo nvim
abbr --add --global aux "ps aux | grep -i"
abbr --add --global td transmission-daemon
abbr --add --global tsm transmission-remote
abbr --add --global pixel ~/Programs/android-sdk/emulator/emulator @Pixel_4a_API_30
abbr --add --global rm rm -rf
abbr --add --global ar "aria2c -x 10 -s 10 -j 1 -i links"

function cd
  builtin cd $argv
  ls -AFl
end

function fish_greeting
end

source ~/.tokens
