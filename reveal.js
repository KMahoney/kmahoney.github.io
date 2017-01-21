function reveal_fn(h, original_title) {
    return function (e) {
        e.preventDefault();
        var title = h.querySelector("h3");
        title.textContent = original_title;
        h.classList.remove("hidden");
    }
}

var hidden = document.querySelectorAll(".hidden");
for (var i = 0; i < hidden.length; i++) {
    var h = hidden[i];
    var title = h.querySelector("h3");
    var original_title = title.textContent;
    title.textContent = "▼ Click to Reveal: " + original_title;
    title.onclick = reveal_fn(h, original_title);
}
