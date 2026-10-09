# river-state: see river-state.c for what it is and why.
#
#   make            build ./river-state
#   make install    copy it to ~/.local/bin (already on PATH via path.list;
#                   the waybar module and keybindings use the full path anyway)
#   make clean      remove the binary and the wayland-scanner output
#
# Needs gcc, make, pkg-config and wayland-devel (for wayland-scanner and
# wayland-client) - the same toolchain wideriver was built with. No sudo: it
# installs under $HOME.

PREFIX ?= $(HOME)/.local
PROTO = river-status-unstable-v1

CFLAGS ?= -O2 -g
CFLAGS += -std=gnu11 -Wall -Wextra -Wpedantic
PKG_CFLAGS := $(shell pkg-config --cflags wayland-client)
PKG_LIBS := $(shell pkg-config --libs wayland-client)

all: river-state

$(PROTO)-client-protocol.h: $(PROTO).xml
	wayland-scanner client-header $< $@

$(PROTO)-protocol.c: $(PROTO).xml
	wayland-scanner private-code $< $@

river-state: river-state.c $(PROTO)-protocol.c $(PROTO)-client-protocol.h
	$(CC) $(CFLAGS) $(PKG_CFLAGS) -I. -o $@ river-state.c $(PROTO)-protocol.c $(PKG_LIBS)

install: river-state
	install -Dm755 river-state $(PREFIX)/bin/river-state

clean:
	rm -f river-state $(PROTO)-protocol.c $(PROTO)-client-protocol.h

.PHONY: all install clean
