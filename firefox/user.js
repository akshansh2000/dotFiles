// user.js for the "personal" Firefox profile (0ckck67g.default-default only -
// krypton deliberately stays stock). Symlinked into the profile; Firefox reads
// it on every start and re-applies these values over prefs.js.
//
// Rules for what belongs here (decided 2026-09-30):
//   - Only prefs that define this rice, not ones toggled from Settings.
//   - NOTHING that Firefox Sync carries (services.sync.prefs.sync.<name> in
//     browser/omni.ja defaults/preferences/firefox.js) - e.g. startup.page,
//     startup.homepage, signon.rememberSignons, media.eme.enabled. Sync owns those.
//   - NOTHING an extension manages (see extension-settings.json in the
//     profile): uBlock Origin + Privacy Badger own network prediction
//     (dns prefetch, prefetch-next, speculative connections) and send_pings;
//     Tridactyl owns the new-tab override and containers.
//
// Removing a line here does NOT revert the pref - the value stays in prefs.js.
// Reset it in about:config as well.

// Load chrome/userChrome.css and chrome/userContent.css.
user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);

// Interface
user_pref("browser.tabs.closeWindowWithLastTab", false);
user_pref("browser.toolbars.bookmarks.visibility", "never");
user_pref("sidebar.revamp", true);
user_pref("sidebar.verticalTabs", true);

// Dark: browser chrome (0 = dark) and the colour scheme websites see (0 = dark).
user_pref("browser.theme.toolbar-theme", 0);
user_pref("layout.css.prefers-color-scheme.content-override", 0);

// Hardware video decoding through VA-API on the AMD iGPU (vainfo: H.264,
// HEVC, VP9; no AV1). The experimental Vulkan path
// (media.hardware-video-decoding-vulkan.enabled) was reset on purpose.
user_pref("media.ffmpeg.vaapi.enabled", true);
