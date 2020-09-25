touchpadId=`xinput list | \grep --color=auto --exclude-dir=.bzr --exclude-dir=CVS --exclude-dir=.git --exclude-dir=.hg --exclude-dir=.svn --exclude-dir=.idea --exclude-dir=.tox TouchPad | perl -nle 'm/((?<=id\=)\d+)/; print $1'`

tappingId=`xinput list-props $touchpadId | \grep --color=auto --exclude-dir=.bzr --exclude-dir=CVS --exclude-dir=.git --exclude-dir=.hg --exclude-dir=.svn --exclude-dir=.idea --exclude-dir=.tox Tapping\ Enabled\ \( | perl -nle 'm/((?<=\()\d+)/; print $1'`

xinput set-prop $touchpadId $tappingId 1
