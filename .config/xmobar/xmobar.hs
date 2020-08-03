Config { 

   -- appearance
     font =         "xft:Mononoki:size=10:bold:antialias=true"
   , bgColor =      "#000000"
   , alpha =        100
   , fgColor =      "#646464"
   , position =     Top
   , border =       NoBorder
   , borderColor =  "#000000"

   -- layout
   , sepChar =  "%"   -- delineator between plugin names and straight text
   , alignSep = "}{"  -- separator between left-right alignment
   , template = "%battery% | %multicpu% | %coretemp% | %memory% | %dynnetwork% }{ %date% || %kbd% "

   -- general behavior
   , lowerOnStart =     True    -- send to bottom of window stack on start
   , hideOnStart =      False   -- start with window unmapped (hidden)
   , allDesktops =      True    -- show on all desktops
   , overrideRedirect = True    -- set the Override Redirect flag (Xlib)
   , pickBroadest =     False   -- choose widest display (multi-monitor)
   , persistent =       True    -- enable/disable hiding (True = disabled)

   -- plugins
   --   Numbers can be automatically colored according to their value. xmobar
   --   decides color based on a three-tier/two-cutoff system, controlled by
   --   command options:
   --     --Low sets the low cutoff
   --     --High sets the high cutoff
   --
   --     --low sets the color below --Low cutoff
   --     --normal sets the color between --Low and --High cutoffs
   --     --High sets the color above --High cutoff
   --
   --   The --template option controls how the plugin is displayed. Text
   --   color can be set by enclosing in <fc></fc> tags. For more details
   --   see http://projects.haskell.org/xmobar/#system-monitor-plugins.
   , commands = 

        -- weather monitor
        [ Run Weather "RJTT" [ "--template", "<skyCondition> | <fc=#4682B4><tempC></fc>°C | <fc=#4682B4><rh></fc>% | <fc=#4682B4><pressure></fc>hPa"
                             ] 36000

        -- network activity monitor (dynamic interface resolution)
        , Run DynNetwork     [ "--template" , "<dev>: <rx>kB/s|<tx>kB/s"
                             , "--Low"      , "1000"       -- units: B/s
                             , "--High"     , "5000"       -- units: B/s
                             , "--low"      , "darkgreen"
                             , "--normal"   , "darkorange"
                             , "--high"     , "darkred"
                             ] 10

        -- cpu activity monitor
        , Run MultiCpu       [ "--template" , "Cpu: <total0>%|<total1>%|<total2>%|<total3>%"
                             , "--Low"      , "30"         -- units: %
                             , "--High"     , "70"         -- units: %
                             , "--low"      , "darkgreen"
                             , "--normal"   , "darkorange"
                             , "--high"     , "darkred"
                             ] 10

        -- cpu core temperature monitor
        , Run CoreTemp       [ "--template" , "Temp: <core0>°C|<core1>°C|<core2>°C|<core3>°C"
                             , "--Low"      , "50"        -- units: °C
                             , "--High"     , "70"        -- units: °C
                             , "--low"      , "darkgreen"
                             , "--normal"   , "darkorange"
                             , "--high"     , "darkred"
                             ] 50
                          
        -- memory usage monitor
        , Run Memory         [ "--template" ,"Mem: <usedratio>%"
                             , "--Low"      , "50"        -- units: %
                             , "--High"     , "80"        -- units: %
                             , "--low"      , "darkgreen"
                             , "--normal"   , "darkorange"
                             , "--high"     , "darkred"
                             ] 10

	-- memory used (MB)
	-- , Run Memory         [ "--template" ,"Mem: <used>M"
        --                      , "--Low"      , "7936"      -- units: M
        --                      , "--High"     , "12700"     -- units: M
        --                      , "--low"      , "darkgreen"
        --                      , "--normal"   , "darkorange"
        --                      , "--high"     , "darkred"
        --                      ] 10

	-- memory free (MB)
        -- , Run Memory         [ "--template" ,"Mem: <free>M"
        --                      , "--Low"      , "3172"      -- units: M
        --                      , "--High"     , "7936"      -- units: M
        --                      , "--low"      , "darkred"
        --                      , "--normal"   , "darkorange"
        --                      , "--high"     , "darkgreen"
        --                      ] 10

        -- battery monitor
        , Run Battery        [ "--template" , "Batt: <acstatus>"
                             , "--Low"      , "20"        -- units: %
                             , "--High"     , "80"        -- units: %
                             , "--low"      , "darkred"
                             , "--normal"   , "darkorange"
                             , "--high"     , "darkgreen"

                             , "--" -- battery specific options
                                       -- discharging status
                                       , "-o"	, "<left>% (<timeleft>)"
                                       -- AC "on" status
                                       , "-O"	, "<fc=#dAA520>Charging (<left>%)</fc>"
                                       -- charged status
                                       , "-i"	, "<fc=#006000>Charged</fc>"
                             ] 50

        -- time and date indicator 
        --   (%F = y-m-d date, %a = day of week, %T = h:m:s time)
        , Run Date           "<fc=#ABABAB>%F (%a) %T</fc>" "date" 10

        -- keyboard layout indicator
        , Run Kbd            [ ("us(dvorak)" , "<fc=#00008B>DV</fc>")
                             , ("us"         , "<fc=#01917b>US</fc>")
                             ]
        ]
   }
