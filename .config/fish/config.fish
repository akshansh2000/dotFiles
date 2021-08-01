if status is-interactive
    # Commands to run in interactive sessions can go here
end

# if [ -z $DISPLAY ] && [ (tty) = "/dev/tty1" ]
#   startx
# end

abbr --add --global cat bat
abbr --add --global get sudo pacman -S
abbr --add --global pls sudo
abbr --add --global l ls -AFl
abbr --add --global v nvim
abbr --add --global sv sudo nvim
abbr --add --global aux "ps aux | grep -i"
abbr --add --global td transmission-daemon
abbr --add --global tsm transmission-remote
abbr --add --global nuk sudo nordvpn connect uk
abbr --add --global nde sudo nordvpn connect germany
abbr --add --global ndi sudo nordvpn disconnect

function cd
  builtin cd $argv
  ls -AFl
end

function fish_greeting
end

source ~/.tokens
