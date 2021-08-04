// ==UserScript==
// @name         Remove Locked Links - Real Debrid
// @namespace    https://akshansh2000.github.io
// @version      0.1
// @description  remove locked links list on Real-Debrid's torrents page
// @author       akshansh2000
// @match        https://real-debrid.com/torrents*
// @grant        none
// ==/UserScript==

let elements = document.getElementsByTagName("textarea");
for (let element of elements)
  element.setAttribute("rows", "1");
