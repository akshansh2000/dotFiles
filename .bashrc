#
# ~/.bashrc
#

[[ $- != *i* ]] && return

colors() {
	local fgc bgc vals seq0

	printf "Color escapes are %s\n" '\e[${value};...;${value}m'
	printf "Values 30..37 are \e[33mforeground colors\e[m\n"
	printf "Values 40..47 are \e[43mbackground colors\e[m\n"
	printf "Value  1 gives a  \e[1mbold-faced look\e[m\n\n"

	# foreground colors
	for fgc in {30..37}; do
		# background colors
		for bgc in {40..47}; do
			fgc=${fgc#37} # white
			bgc=${bgc#40} # black

			vals="${fgc:+$fgc;}${bgc}"
			vals=${vals%%;}

			seq0="${vals:+\e[${vals}m}"
			printf "  %-9s" "${seq0:-(default)}"
			printf " ${seq0}TEXT\e[m"
			printf " \e[${vals:+${vals+$vals;}}1mBOLD\e[m"
		done
		echo; echo
	done
}

[ -r /usr/share/bash-completion/bash_completion ] && . /usr/share/bash-completion/bash_completion

# Change the window title of X terminals
case ${TERM} in
	xterm*|rxvt*|Eterm*|aterm|kterm|gnome*|interix|konsole*)
		PROMPT_COMMAND='echo -ne "\033]0;${USER}@${HOSTNAME%%.*}:${PWD/#$HOME/\~}\007"'
		;;
	screen*)
		PROMPT_COMMAND='echo -ne "\033_${USER}@${HOSTNAME%%.*}:${PWD/#$HOME/\~}\033\\"'
		;;
esac

use_color=true

# Set colorful PS1 only on colorful terminals.
# dircolors --print-database uses its own built-in database
# instead of using /etc/DIR_COLORS.  Try to use the external file
# first to take advantage of user additions.  Use internal bash
# globbing instead of external grep binary.
safe_term=${TERM//[^[:alnum:]]/?}   # sanitize TERM
match_lhs=""
[[ -f ~/.dir_colors   ]] && match_lhs="${match_lhs}$(<~/.dir_colors)"
[[ -f /etc/DIR_COLORS ]] && match_lhs="${match_lhs}$(</etc/DIR_COLORS)"
[[ -z ${match_lhs}    ]] \
	&& type -P dircolors >/dev/null \
	&& match_lhs=$(dircolors --print-database)
[[ $'\n'${match_lhs} == *$'\n'"TERM "${safe_term}* ]] && use_color=true

if ${use_color} ; then
	# Enable colors for ls, etc.  Prefer ~/.dir_colors #64489
	if type -P dircolors >/dev/null ; then
		if [[ -f ~/.dir_colors ]] ; then
			eval $(dircolors -b ~/.dir_colors)
		elif [[ -f /etc/DIR_COLORS ]] ; then
			eval $(dircolors -b /etc/DIR_COLORS)
		fi
	fi

	if [[ ${EUID} == 0 ]] ; then
		PS1='\[\033[01;31m\][\h\[\033[01;36m\] \W\[\033[01;31m\]]\$\[\033[00m\] '
	else
		PS1='\[\033[01;32m\][\u@\h\[\033[01;37m\] \W\[\033[01;32m\]]\$\[\033[00m\] '
	fi

	alias ls='ls --color=auto'
	alias grep='grep --colour=auto'
	alias egrep='egrep --colour=auto'
	alias fgrep='fgrep --colour=auto'
else
	if [[ ${EUID} == 0 ]] ; then
		# show root@ when we don't have colors
		PS1='\u@\h \W \$ '
	else
		PS1='\u@\h \w \$ '
	fi
fi

unset use_color safe_term match_lhs sh

alias cp="cp -i"                          # confirm before overwriting something
alias df='df -h'                          # human-readable sizes
alias free='free -m'                      # show sizes in MB
alias np='nano -w PKGBUILD'
alias more=less

xhost +local:root > /dev/null 2>&1

complete -cf sudo

# Bash won't get SIGWINCH if another process is in the foreground.
# Enable checkwinsize so that bash will check the terminal size when
# it regains control.  #65623
# http://cnswww.cns.cwru.edu/~chet/bash/FAQ (E11)
shopt -s checkwinsize

shopt -s expand_aliases

# export QT_SELECT=4

# Enable history appending instead of overwriting.  #139609
shopt -s histappend

#
# # ex - archive extractor
# # usage: ex <file>
ex () {
  if [ -f $1 ] ; then
    case $1 in
      *.tar.bz2)   tar xjf $1   ;;
      *.tar.gz)    tar xzf $1   ;;
      *.bz2)       bunzip2 $1   ;;
      *.rar)       unrar x $1     ;;
      *.gz)        gunzip $1    ;;
      *.tar)       tar xf $1    ;;
      *.tbz2)      tar xjf $1   ;;
      *.tgz)       tar xzf $1   ;;
      *.zip)       unzip $1     ;;
      *.Z)         uncompress $1;;
      *.7z)        7z x $1      ;;
      *)           echo "'$1' cannot be extracted via ex()" ;;
    esac
  else
    echo "'$1' is not a valid file"
  fi
}

export PATH='~/flutter/bin':$PATH

alias py='python3'
alias python='python3'
alias chpl='/home/akshansh2000/Desktop/Repositories/chapel/bin/linux64-x86_64/chpl'
alias update='source ~/.bashrc'
alias open='xdg-open'
alias pls='sudo'
alias get='yes | sudo pacman -S'
alias remove='yes | sudo pacman -R'
alias hs='history | grep'
alias aux='ps aux | grep'
alias kx='kill -9'
alias fr='flutter run'
alias night='redshift -O 3000'
alias morning='redshift -x'
alias ls='ls -ACF --color=auto'
alias rs='Rscript'
alias rn='npx react-native'
alias rnr='rn run-android'

alias repo='cd ~/Desktop/Repositories'
alias win='cd /media/akshansh2000/18E633CBE633A7C0/Users/aksha'
alias top='cd `git rev-parse --show-toplevel`'
alias prac='cd ~/Documents/practice'

alias pop='~/Popcorn-Time'
alias studio='cd ~/android-studio/bin && ./studio.sh'
alias chrome='google-chrome-stable'
alias bashrc='open ~/.bashrc'
alias config='open ~/.config/i3/config'
alias adbscrcpy='scrcpy -b2M -m800'
# alias scrcpy='ADB=~/Android/Sdk/adb scrcpy'
alias pm='~/Postman/app/Postman &'
alias nexus='~/Android/Sdk/emulator/emulator -avd Nexus_S_API_29 -netdelay none -netspeed full &'

alias push='git push'
alias pull='git pull'
alias add='git add'
alias gadd='command git add .'
alias branch='git branch'
alias switch='git checkout'
alias status='git status'
alias commit='git commit -am'
alias gcommit='command git commit -m'
alias origin='git remote add origin'
alias rorigin='git remote remove origin'
alias upstream='git remote add upstream'
alias rupstream='git remote remove upstream'
alias remote='git remote -v'
alias clone='git clone'
alias log='git log'
alias fetch='git fetch'
alias merge='git merge'
alias gdiff='git diff'
alias reset='git reset'
alias stash='git stash'
alias gdiff='git diff'

function cd() {
  if [ $# -eq 0 ]; then
    builtin cd '/home/akshansh2000'
  else
    builtin cd "$1"
  fi
  
  ls -ACF
}

function ginit() {
  git init
  
  if [ $# -ne 0 ]; then
    origin "$1"
  fi
}

txtcyn='\[\e[0;96m\]'
txtred='\[\e[31m\]'
txtrst='\[\e[34m\]'
txtyel='\[\e[0;33m\]'
txtgry='\[\e[32m\]'
txtcmd='\[\e[37m\]'

pathC="${txtcyn}"
gitC="${txtred}"
pointerC="${txtgry}"
normalC="${txtrst}"
userC="${txtyel}"
otherC="${txtgry}"
commandC="${txtcmd}"

bold=$(tput bold)
normal=$(tput sgr0)

function gitBranch() {
    git branch 2> /dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/(\1)/'
}

function cwd() {
  base=${PWD##*/}
  if [ -z "$base" ]; then
    echo '/'
  elif [ "$base" == "akshansh2000" ]; then
    echo '~'
  else
    echo ${base}
  fi
}

export PS1="\n${userC}${bold}\u ${normal}${otherC}in ${pathC}\$(cwd) ${gitC}\$(gitBranch)\n${pointerC}> ${commandC}"

function build() {
  git clone "$1"
  repo_name=`echo "$1" | perl -nle 'm/([^\/]+(?=\.git))/; print $1'`
  
  builtin cd $repo_name
  yes | makepkg -si
  
  builtin cd '..'
  rm -rf $repo_name
}

function up() {
  if [ $# -eq 0 ]; then
    count=1
  else
    count="$1"
  fi
  
  i=0
  while [ $i -lt $count ]; do
    builtin cd '..'
    i=$((i+1))
  done
  
  ls -ACF
}

function num() {
  if [ $# -eq  0 ]; then
    ls | wc -l
  else
    ls "$1" | wc -l
  fi
}

function c() {
  file_name=`echo "$1" | perl -nle 'm/(.+(?=\.))/; print $1'`
  
  g++ -o "$file_name" "$1"
  
  if [ -f "$file_name" ]; then
    ./"$file_name" "${@:2}"
  fi
  
  rm "$file_name" 2> /dev/null
}

function ch() {
  file_name=`echo "$1" | perl -nle 'm/(.+(?=\.))/; print $1'`
  
  chpl -o "$file_name" "$1"
  
  if [ -f "$file_name" ]; then
    ./"$file_name" "${@:2}"
  fi
  
  rm "$file_name" 2> /dev/null
}

function h() {
  file_name=`echo "$1" | perl -nle 'm/(.+(?=\.))/; print $1'`
  
  ghc -o "$file_name" "$1"
  
  if [ -f "$file_name" ]; then
    ./"$file_name" "${@:2}"
  fi
  
  rm "$file_name" 2> /dev/null
  rm "$file_name.o" 2> /dev/null
  rm "$file_name.hi" 2> /dev/null
}

function gc() {
  builtin cd ~/Desktop/Repositories
  
  git clone "$1"
  
  repo_name=`echo "$1" | perl -nle 'm/([^\/]+(?=\.git))/; print $1'`
  cd $repo_name
}

export ANDROID_HOME=$HOME/Android/Sdk
# export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
# export PATH=$PATH:$ANDROID_HOME/tools/bin
# export PATH=$PATH:$ANDROID_HOME/platform-tools

export JAVA_HOME=/usr/lib/jvm/java-8-openjdk
export PATH=$PATH:$JAVA_HOME

export JFXRT_HOME=/usr/lib/jvm/java-8-openjdk/jre/lib/ext
export PATH=$PATH:$JFXRT_HOME

export CHROME_EXECUTABLE=/usr/bin/google-chrome-stable

export PATH=$PATH:/snap/bin

# export CHPL_HOME=/home/akshansh2000/Desktop/Repositories/chapel

export PATH=$PATH:/home/akshansh2000/.local/bin

# export BROWSER='/var/lib/snapd/snap/bin/brave'

export PKG_CONFIG_PATH='~/rtorrent-0.9.8'

export PATH='/home/akshansh2000/Downloads/autodock_vina_1_1_2_linux_x86/bin':'/home/akshansh2000/MGLTools-1.5.6/bin':$PATH

export PATH='/home/akshansh2000/flutter/bin/cache/dart-sdk/bin':$PATH

export TERMINAL=terminator

export LANGUAGE=en_IN.UTF-8
export LANG=en_IN.UTF-8
export LC_ALL=en_IN.UTF-8

