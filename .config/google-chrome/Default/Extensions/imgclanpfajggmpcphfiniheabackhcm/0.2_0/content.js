document.addEventListener("keydown", function (event) {
  if (event.target.nodeName == "INPUT" || event.target.nodeName == "TEXTAREA")
    return;

  if (event.key == "/") {
    let didFind = false;
    let elements = document.getElementsByTagName("input");

    for (let element of elements) {
      if (element.outerHTML.toLowerCase().includes("search")) {
        element.focus();
        element.select();
        event.preventDefault();

        didFind = true;
        break;
      }
    }

    if (!didFind && elements && elements.length) {
      elements[0].focus();
      elements[0].select();
      event.preventDefault();
    }
  }
});
