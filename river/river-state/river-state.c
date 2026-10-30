/*
 * river-state - a tiny river-status client for this rice.
 *
 *   river-state waybar   run forever, print one JSON line for a waybar
 *                        custom module whenever the answer changes
 *   river-state hidden   the same, for the hidden-windows indicator: how many
 *                        windows sit on the hidden tags (Super+U)
 *   river-state count TAGS   print how many views have exactly the tag
 *                        bitmask TAGS on the focused output, then exit
 *                        (e.g. `count 2147483648`: windows hidden while
 *                        fullscreen; unused since unhide stopped
 *                        re-fullscreening them, kept for later)
 *   river-state next     print the bitmask of the next tag, then exit
 *   river-state prev     print the bitmask of the previous tag, then exit
 *
 * Why it exists: river exposes its state only over the river-status Wayland
 * protocol, and riverctl cannot query it. Two things needed that state:
 *
 *   - The layout indicator in waybar. waybar's built-in river/layout module
 *     shows the layout name the layout client (wideriver) last committed, but
 *     river only asks for a layout when a tag has windows - so on an EMPTY tag
 *     the previous tag's symbol stays up. This prints empty text instead when
 *     the focused tags hold no views, and waybar hides a module whose text is
 *     empty.
 *   - Next/previous tag bindings. set-focused-tags takes an absolute bitmask,
 *     so stepping needs the current one.
 *   - The hidden-windows indicator (2026-10-30). Super+U "hides" a window by
 *     moving it to tag 31 or 32 (see river/hide.sh), which waybar's tag list
 *     never shows, so without
 *     a count a hidden window is easy to forget. view_tags lists every view's
 *     tags; titles aren't part of river-status, so it is a count, not a list.
 *
 * Tag stepping rules, as agreed 2026-09-25: tags 1..NUM_TAGS, wrapping at both
 * ends; every tag counts, occupied or not; with several tags visible the step
 * starts from the LOWEST one (so the combined view collapses to one tag).
 *
 * Output: the FOCUSED output (seat status). A waybar custom module is not told
 * which output its bar is on, so when docked both bars show the focused
 * output's layout. Next/prev acting on the focused output is correct anyway.
 *
 * Build: see the Makefile next to this file (needs wayland-devel for
 * wayland-scanner + wayland-client). The protocol XML is a copy of river's own.
 */
#define _GNU_SOURCE
#include <signal.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/prctl.h>
#include <unistd.h>

#include <wayland-client.h>

#include "river-status-unstable-v1-client-protocol.h"

/* Matches the `for i in $(seq 1 9)` tag bindings in keybindings.conf. */
#define NUM_TAGS 9
/* Where river/hide.sh puts windows: tag 31, or tag 32 for one that was
 * fullscreen. The last two of river's 32 tags. */
#define HIDDEN_TAG (1u << 30)
#define HIDDEN_FS_TAG (1u << 31)

struct output {
	struct wl_list link;
	uint32_t registry_name;
	struct wl_output *wl_output;
	struct zriver_output_status_v1 *status;
	uint32_t focused_tags;
	uint32_t *view_tags;    /* one entry per view on this output */
	size_t n_view_tags;
	char *layout_name;
};

static struct wl_list outputs;
static struct zriver_status_manager_v1 *status_manager;
static struct wl_seat *seat;
static struct zriver_seat_status_v1 *seat_status;
static struct wl_output *focused_wl_output;

/* --- output status ------------------------------------------------------ */

static void on_focused_tags(void *data, struct zriver_output_status_v1 *s,
		uint32_t tags) {
	(void)s;
	((struct output *)data)->focused_tags = tags;
}

static void on_view_tags(void *data, struct zriver_output_status_v1 *s,
		struct wl_array *tags) {
	(void)s;
	struct output *o = data;
	free(o->view_tags);
	o->n_view_tags = tags->size / sizeof(uint32_t);
	o->view_tags = o->n_view_tags ? malloc(tags->size) : NULL;
	if (o->view_tags)
		memcpy(o->view_tags, tags->data, tags->size);
	else
		o->n_view_tags = 0;
}

static void on_urgent_tags(void *data, struct zriver_output_status_v1 *s,
		uint32_t tags) {
	(void)data; (void)s; (void)tags;
}

static void on_layout_name(void *data, struct zriver_output_status_v1 *s,
		const char *name) {
	(void)s;
	struct output *o = data;
	free(o->layout_name);
	o->layout_name = strdup(name);
}

static void on_layout_name_clear(void *data, struct zriver_output_status_v1 *s) {
	(void)s;
	struct output *o = data;
	free(o->layout_name);
	o->layout_name = NULL;
}

static const struct zriver_output_status_v1_listener output_status_listener = {
	.focused_tags = on_focused_tags,
	.view_tags = on_view_tags,
	.urgent_tags = on_urgent_tags,
	.layout_name = on_layout_name,
	.layout_name_clear = on_layout_name_clear,
};

static void output_track(struct output *o) {
	if (o->status || !status_manager)
		return;
	o->status = zriver_status_manager_v1_get_river_output_status(
			status_manager, o->wl_output);
	zriver_output_status_v1_add_listener(o->status, &output_status_listener, o);
}

static void output_destroy(struct output *o) {
	if (o->wl_output == focused_wl_output)
		focused_wl_output = NULL;
	if (o->status)
		zriver_output_status_v1_destroy(o->status);
	wl_output_destroy(o->wl_output);
	wl_list_remove(&o->link);
	free(o->view_tags);
	free(o->layout_name);
	free(o);
}

/* --- seat status -------------------------------------------------------- */

static void on_focused_output(void *data, struct zriver_seat_status_v1 *s,
		struct wl_output *output) {
	(void)data; (void)s;
	focused_wl_output = output;
}

static void on_unfocused_output(void *data, struct zriver_seat_status_v1 *s,
		struct wl_output *output) {
	(void)data; (void)s;
	if (focused_wl_output == output)
		focused_wl_output = NULL;
}

static void on_focused_view(void *data, struct zriver_seat_status_v1 *s,
		const char *title) {
	(void)data; (void)s; (void)title;
}

static void on_mode(void *data, struct zriver_seat_status_v1 *s,
		const char *name) {
	(void)data; (void)s; (void)name;
}

static const struct zriver_seat_status_v1_listener seat_status_listener = {
	.focused_output = on_focused_output,
	.unfocused_output = on_unfocused_output,
	.focused_view = on_focused_view,
	.mode = on_mode,
};

/* --- registry ----------------------------------------------------------- */

static void on_global(void *data, struct wl_registry *registry, uint32_t name,
		const char *interface, uint32_t version) {
	(void)data;
	if (strcmp(interface, zriver_status_manager_v1_interface.name) == 0) {
		/* layout_name needs v4; river 0.3.7 offers it. */
		status_manager = wl_registry_bind(registry, name,
				&zriver_status_manager_v1_interface,
				version < 4 ? version : 4);
	} else if (strcmp(interface, wl_seat_interface.name) == 0 && !seat) {
		seat = wl_registry_bind(registry, name, &wl_seat_interface, 1);
	} else if (strcmp(interface, wl_output_interface.name) == 0) {
		struct output *o = calloc(1, sizeof(*o));
		if (!o)
			return;
		o->registry_name = name;
		o->wl_output = wl_registry_bind(registry, name, &wl_output_interface, 1);
		wl_list_insert(outputs.prev, &o->link);
		output_track(o);    /* no-op until the status manager is bound */
	}
}

/* Outputs come and go with docking (kanshi); drop them cleanly. */
static void on_global_remove(void *data, struct wl_registry *registry,
		uint32_t name) {
	(void)data; (void)registry;
	struct output *o, *tmp;
	wl_list_for_each_safe(o, tmp, &outputs, link) {
		if (o->registry_name == name) {
			output_destroy(o);
			return;
		}
	}
}

static const struct wl_registry_listener registry_listener = {
	.global = on_global,
	.global_remove = on_global_remove,
};

/* --- queries ------------------------------------------------------------ */

static struct output *current_output(void) {
	struct output *o;
	wl_list_for_each(o, &outputs, link) {
		if (o->wl_output == focused_wl_output)
			return o;
	}
	/* No focus event yet (or none at all): fall back to the first output. */
	if (!wl_list_empty(&outputs))
		return wl_container_of(outputs.next, o, link);
	return NULL;
}

static bool focused_tags_occupied(const struct output *o) {
	for (size_t i = 0; i < o->n_view_tags; i++) {
		if (o->view_tags[i] & o->focused_tags)
			return true;
	}
	return false;
}

/* --- waybar mode -------------------------------------------------------- */

static void json_string(FILE *f, const char *s) {
	fputc('"', f);
	for (; *s; s++) {
		unsigned char c = (unsigned char)*s;
		if (c == '"' || c == '\\')
			fprintf(f, "\\%c", c);
		else if (c < 0x20)
			fprintf(f, "\\u%04x", c);
		else
			fputc(c, f);    /* UTF-8 box drawing passes through as-is */
	}
	fputc('"', f);
}

static void emit_waybar(void) {
	static char *last;
	const struct output *o = current_output();
	const char *text = "";
	if (o && o->layout_name && focused_tags_occupied(o))
		text = o->layout_name;

	/* Only print on change: waybar redraws on every line it reads. */
	if (last && strcmp(last, text) == 0)
		return;
	free(last);
	last = strdup(text);

	/* Empty text makes waybar hide the module - that is the whole point. */
	fputs("{\"text\":", stdout);
	json_string(stdout, text);
	fputs(",\"class\":\"layout\"}\n", stdout);
	fflush(stdout);
}

/* --- hidden mode -------------------------------------------------------- */

/* Views whose tags are exactly `tags` - so a window made sticky with
 * Super+Shift+0 (all 32 bits, the hidden ones included), which is visible
 * everywhere, never counts as hidden. Focused output, like Super+Shift+U,
 * which unhides only from there. */
static size_t count_exact(const struct output *o, uint32_t tags) {
	size_t n = 0;
	for (size_t i = 0; o && i < o->n_view_tags; i++) {
		if (o->view_tags[i] == tags)
			n++;
	}
	return n;
}

static size_t hidden_count(const struct output *o) {
	return count_exact(o, HIDDEN_TAG) + count_exact(o, HIDDEN_FS_TAG);
}

static void emit_hidden(void) {
	static long last = -1;
	long n = (long)hidden_count(current_output());
	if (n == last)
		return;
	last = n;
	if (n == 0) {
		/* Empty text: waybar hides the module. */
		puts("{\"text\":\"\",\"class\":\"hidden\"}");
	} else {
		/* \uf070 = Font Awesome eye-slash, written as a JSON escape so the
		 * Private-Use glyph never has to exist as raw bytes in this file. */
		printf("{\"text\":\"\\uf070 %ld\",\"tooltip\":\"%ld hidden window%s - "
				"click or Super+Shift+U brings back the last one\","
				"\"class\":\"hidden\"}\n", n, n, n == 1 ? "" : "s");
	}
	fflush(stdout);
}

/* --- main --------------------------------------------------------------- */

static int usage(void) {
	fprintf(stderr, "usage: river-state waybar|hidden|next|prev|count TAGS\n");
	return 2;
}

int main(int argc, char **argv) {
	if (argc < 2)
		return usage();
	const char *mode = argv[1];
	bool waybar = strcmp(mode, "waybar") == 0;
	bool hidden = strcmp(mode, "hidden") == 0;
	bool next = strcmp(mode, "next") == 0;
	bool prev = strcmp(mode, "prev") == 0;
	bool count = strcmp(mode, "count") == 0;
	if (argc != (count ? 3 : 2) || (!waybar && !hidden && !next && !prev && !count))
		return usage();
	uint32_t count_tags = 0;
	if (count) {
		char *end;
		unsigned long v = strtoul(argv[2], &end, 0);
		if (*argv[2] == '\0' || *end != '\0' || v > UINT32_MAX)
			return usage();
		count_tags = (uint32_t)v;
	}

	struct wl_display *display = wl_display_connect(NULL);
	if (!display) {
		fprintf(stderr, "river-state: cannot connect to the Wayland display\n");
		return 1;
	}
	wl_list_init(&outputs);

	struct wl_registry *registry = wl_display_get_registry(display);
	wl_registry_add_listener(registry, &registry_listener, NULL);
	wl_display_roundtrip(display);

	if (!status_manager) {
		fprintf(stderr, "river-state: compositor has no zriver_status_manager_v1 (not river?)\n");
		return 1;
	}

	/* Outputs announced before the status manager still need tracking. */
	struct output *o;
	wl_list_for_each(o, &outputs, link)
		output_track(o);
	if (seat) {
		seat_status = zriver_status_manager_v1_get_river_seat_status(
				status_manager, seat);
		zriver_seat_status_v1_add_listener(seat_status, &seat_status_listener, NULL);
	}
	/* Second roundtrip delivers the initial state of everything above. */
	wl_display_roundtrip(display);

	if (count) {
		printf("%zu\n", count_exact(current_output(), count_tags));
		wl_display_disconnect(display);
		return 0;
	}

	if (next || prev) {
		const struct output *cur = current_output();
		uint32_t tags = cur ? cur->focused_tags : 1;
		int low = 0;    /* lowest focused tag among 1..NUM_TAGS, 0-based */
		for (int i = 0; i < NUM_TAGS; i++) {
			if (tags & (1u << i)) {
				low = i;
				break;
			}
		}
		int to = next ? (low + 1) % NUM_TAGS : (low + NUM_TAGS - 1) % NUM_TAGS;
		printf("%u\n", 1u << to);
		wl_display_disconnect(display);
		return 0;
	}

	/* Die with our parent. waybar runs us as `sh -c ...`, and on a restart it
	 * TERMs that sh but never us - so without this every waybar restart left
	 * an orphan (reparented to PID 1) that lingered until its next write hit
	 * the closed pipe (SIGPIPE). Seen 2026-09-29. The getppid() check covers
	 * the parent dying before prctl() took effect. If sh itself ever outlives
	 * waybar, the SIGPIPE-on-next-write behaviour is still the fallback. */
	pid_t parent = getppid();
	if (prctl(PR_SET_PDEATHSIG, SIGTERM) == 0 && getppid() != parent)
		return 0;

	void (*emit)(void) = hidden ? emit_hidden : emit_waybar;
	emit();
	while (wl_display_dispatch(display) != -1)
		emit();

	/* The compositor went away (session ending). waybar's restart-interval
	 * brings us back if this happens while the bar is still up. */
	return 1;
}
