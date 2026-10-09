config.load_autoconfig()

# Enable VA-API hardware video decode (needs the mesa-vaapi driver package
# installed at the OS level). This build of qt6-webengine's bundled Chromium
# doesn't have Wayland ozone support compiled in (--ozone-platform=wayland
# fails with "Invalid ozone platform"), so it runs through XWayland - that's
# fine, video decode accel is independent of the windowing backend.
c.qt.args = [
    "enable-features=VaapiVideoDecoder,VaapiVideoDecodeLinuxGL",
]

# close window if last tab closed
c.tabs.last_close = 'close'

# default search engine to google
c.url.searchengines = {"DEFAULT": "https://google.com/search?q={}"}

# start page
c.url.start_pages = "https://google.com"

