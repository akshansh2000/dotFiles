printf '\n%.0s' {1..200}
# tput cup $(tput lines) 0

# Enable Powerlevel10k instant prompt. Should stay close to the top of ~/.zshrc.
# Initialization code that may require console input (password prompts, [y/n]
# confirmations, etc.) must go above this block; everything else may go below.
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi

# fzf integration
source "/usr/share/fzf/completion.zsh"
source "/usr/share/fzf/key-bindings.zsh"

# If you come from bash you might have to change your $PATH.
# export PATH=$HOME/bin:/usr/local/bin:$PATH

# Path to your oh-my-zsh installation.
export ZSH="/home/akshansh2000/.oh-my-zsh"

# Set name of the theme to load --- if set to "random", it will
# load a random theme each time oh-my-zsh is loaded, in which case,
# to know which specific one was loaded, run: echo $RANDOM_THEME
# See https://github.com/ohmyzsh/ohmyzsh/wiki/Themes
ZSH_THEME="powerlevel10k/powerlevel10k"

# Set list of themes to pick from when loading at random
# Setting this variable when ZSH_THEME=random will cause zsh to load
# a theme from this variable instead of looking in $ZSH/themes/
# If set to an empty array, this variable will have no effect.
# ZSH_THEME_RANDOM_CANDIDATES=( "robbyrussell" "agnoster" )

# Uncomment the following line to use case-sensitive completion.
# CASE_SENSITIVE="true"

# Uncomment the following line to use hyphen-insensitive completion.
# Case-sensitive completion must be off. _ and - will be interchangeable.
# HYPHEN_INSENSITIVE="true"

# Uncomment the following line to disable bi-weekly auto-update checks.
# DISABLE_AUTO_UPDATE="true"

# Uncomment the following line to automatically update without prompting.
# DISABLE_UPDATE_PROMPT="true"

# Uncomment the following line to change how often to auto-update (in days).
# export UPDATE_ZSH_DAYS=13

# Uncomment the following line if pasting URLs and other text is messed up.
DISABLE_MAGIC_FUNCTIONS="true"

# Uncomment the following line to disable colors in ls.
# DISABLE_LS_COLORS="true"

# Uncomment the following line to disable auto-setting terminal title.
# DISABLE_AUTO_TITLE="true"

# Uncomment the following line to enable command auto-correction.
# ENABLE_CORRECTION="true"

# Uncomment the following line to display red dots whilst waiting for completion.
COMPLETION_WAITING_DOTS="true"

# Uncomment the following line if you want to disable marking untracked files
# under VCS as dirty. This makes repository status check for large repositories
# much, much faster.
# DISABLE_UNTRACKED_FILES_DIRTY="true"

# Uncomment the following line if you want to change the command execution time
# stamp shown in the history command output.
# You can set one of the optional three formats:
# "mm/dd/yyyy"|"dd.mm.yyyy"|"yyyy-mm-dd"
# or set a custom format using the strftime function format specifications,
# see 'man strftime' for details.
# HIST_STAMPS="mm/dd/yyyy"

# Would you like to use another custom folder than $ZSH/custom?
# ZSH_CUSTOM=/path/to/new-custom-folder

# Which plugins would you like to load?
# Standard plugins can be found in $ZSH/plugins/
# Custom plugins may be added to $ZSH_CUSTOM/plugins/
# Example format: plugins=(rails git textmate ruby lighthouse)
# Add wisely, as too many plugins slow down shell startup.
plugins=(
  git
  adb
  alias-finder
  colorize
  cp
  web-search
  gitignore
  zsh-autosuggestions
  colored-man-pages
  globalias
)

source $ZSH/oh-my-zsh.sh

# User configuration

# export MANPATH="/usr/local/man:$MANPATH"

# You may need to manually set your language environment
# export LANG=en_US.UTF-8

# Preferred editor for local and remote sessions
# if [[ -n $SSH_CONNECTION ]]; then
#   export EDITOR='vim'
# else
#   export EDITOR='mvim'
# fi

# Compilation flags
# export ARCHFLAGS="-arch x86_64"

# Set personal aliases, overriding those provided by oh-my-zsh libs,
# plugins, and themes. Aliases can be placed here, though oh-my-zsh
# users are encouraged to define aliases within the ZSH_CUSTOM folder.
# For a full list of active aliases, run `alias`.
#
# Example aliases
# alias zshconfig="mate ~/.zshrc"
# alias ohmyzsh="mate ~/.oh-my-zsh"

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

alias py="python3"
alias python="python3"
alias update="source ~/.zshrc"
alias upgrade="yes | sudo pacman -Syu"
alias open="xdg-open"
alias pls="sudo"
alias get="yes | sudo pacman -S --needed"
alias remove="yes | sudo pacman -R"
alias clean="yes | yay -Sc"
alias hs="history | grep"
alias aux="ps aux | grep"
alias kx="kill -9"
alias kxd="kill -9 `ps aux | grep lightcord | perl -nle 'm/(.*)lightcord\s*$/; print $1' | awk '{print $2}' | head -1`"
alias skx="sudo kill -9"
alias fr='flutter run'
alias fpg='flutter pub get'
alias fu='flutter upgrade'
alias night='redshift -O 3000'
alias morning='redshift -x'
alias ls='ls -ACF --color=auto'
alias rn='npx react-native'
alias rns='npx react-native start'
alias rnr='npx react-native run-android'
alias cp='cpv'
alias perm='stat -c "%a"'
alias rm='rm -rf'
alias cc='~/.custom_scripts/copy_config.sh && cd ~/Repositories/dotFiles'
alias fonts='display "$(fc-list | cut -d: -f1 | rofi -i -dmenu -p -no-custom fonts)"'

alias repo='cd ~/Repositories'
alias top='cd `git rev-parse --show-toplevel`'
alias prac='cd ~/Documents/practice'

alias pop='~/Popcorn\ Time/Popcorn-Time'
alias studio='cd ~/android-studio/bin && ./studio.sh'
alias chrome='google-chrome-stable'
alias zshrc='open ~/.zshrc'
alias adbscrcpy='scrcpy -b2M -m800'
# alias scrcpy='ADB=~/Android/Sdk/adb scrcpy'
alias pm='~/Postman/app/Postman &'
alias nexus='~/Android/Sdk/emulator/emulator -avd Nexus_S_API_29'
alias v='nvim'
alias sv='sudo nvim'

alias push='git push'
alias pull='git pull'
alias add='git add'
alias gadd='command git add -A'
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

function rmdep() {
  yes | sudo pacman -R `pacman -Qdt | perl -nle 'm/(.*(?=\s))/; print $1'`
}

function cd() {
  builtin cd "$@"
  ls
}

function ginit() {
  git init
  
  if [ $# -ne 0 ]; then
    origin "$1"
  fi
}

# function build() {
#   git clone "$1"
#   repo_name=`echo "$1" | perl -nle 'm/([^\/]+(?=\.git))/; print $1'`
#   
#   builtin cd $repo_name
#   yes | makepkg -si
#   
#   builtin cd '..'
#   rm -rf $repo_name
# }

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

function c() {
  file_name=`basename -s .cpp "$1"`
  g++ -std=c++17 -o "$file_name" "$@"
  
  if [ -f "$file_name" ]; then
    ./"$file_name" "${@:2}"
  fi
  
  rm "$file_name" 2> /dev/null
}

function rs() {
  file_name=`basename -s .rs "$1"`
  rustc $@

  if [ -f $file_name ]; then
    ./$file_name
  fi

  rm $file_name 2> /dev/null
}

function gcc() {
  builtin cd ~/Repositories
  git clone "$@"
  cd `basename -s .git "$1"`  
}

function temp() {
  sed -e 's/000//g' -e 's/^/ /g' -e 's/$/ °C/g' /sys/devices/platform/coretemp.0/hwmon/h*/temp{1,2,3,4}_input
}

function code() {
  if [ $1 = "." ]; then
    extension="null"
  else
    touch $1
    extension="$1:t:e"
  fi
  
  if [ $extension = "cpp" ]; then
    echo "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {}" > $1
  elif [ $extension = "c" ]; then
    echo "#include <stdio.h>\n\nint main() {}" > $1
  fi
  
  command code $1
}

function md5() {
  file_sum=`md5sum "$1"`
  compressed_sum=`echo "${file_sum% *}"`

  if [ $compressed_sum = "$2 " ]; then
    echo "checksum valid"
  else
    echo "couldn't verify checksum"
  fi
}

function sha1() {
  file_sum=`sha1sum "$1"`
  compressed_sum=`echo "${file_sum% *}"`

  if [ $compressed_sum = "$2 " ]; then
    echo "checksum valid"
  else
    echo "couldn't verify checksum"
  fi
}

function sha256() {
  file_sum=`sha256sum "$1"`
  compressed_sum=`echo "${file_sum% *}"`

  if [ $compressed_sum = "$2 " ]; then
    echo "checksum valid"
  else
    echo "couldn't verify checksum"
  fi
}

function perms() {
  sudo chmod $1 "$2"
}

function cat() {
  bat $@
}

function qr() {
  read string
  segno -s25 -o/tmp/qr.png "$string"
  feh --full-screen /tmp/qr.png
}

export PATH="/home/akshansh2000/flutter/bin":$PATH
export PATH='/home/akshansh2000/flutter/bin/cache/dart-sdk/bin':$PATH
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools
export CHROME_EXECUTABLE=/usr/bin/google-chrome-stable
export EDITOR=/sbin/nvim
export GOOGLE_CHROME_BIN=/usr/bin/google-chrome-stable
export QUTEBROWSER_BIN=/usr/bin/qutebrowser
export TERMINAL=/sbin/urxvt
# export BROWSER=$QUTEBROWSER_BIN
export PATH=$PATH:/home/akshansh2000/.local/bin
export PATH=$PATH:/snap/bin
export PATH=$PATH:/home/akshansh2000/.emacs.d/bin
export PATH=$PATH:/home/akshansh2000/.cargo/bin
export PATH=$PATH:/home/akshansh2000/.gem/ruby/2.7.0/bin

source $HOME/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
source $HOME/.oh-my-zsh/plugins/calc/calc.plugin.zsh
source $HOME/.oh-my-zsh/custom/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh

# ^e to enter vim edit mode
autoload edit-command-line; zle -N edit-command-line
bindkey '^[e' edit-command-line

# use vim keys in tab complete menu:
bindkey -M menuselect 'h' vi-backward-char
bindkey -M menuselect 'k' vi-up-line-or-history
bindkey -M menuselect 'l' vi-forward-char
bindkey -M menuselect 'j' vi-down-line-or-history

# ~/Repositories/Color-Scripts/color-scripts/$(command ls ~/Repositories/Color-Scripts/color-scripts | sort -R | head -1)

# To customize prompt, run `p10k configure` or edit ~/.p10k.zsh.
[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh
