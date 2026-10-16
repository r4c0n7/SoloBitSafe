(function () {
  var reiter = Array.prototype.slice.call(document.querySelectorAll('.reiter [role="tab"]'));
  function waehle(r, fokus) {
    reiter.forEach(function (x) {
      var an = x === r;
      x.setAttribute('aria-selected', an ? 'true' : 'false');
      x.tabIndex = an ? 0 : -1;
      document.getElementById(x.getAttribute('aria-controls')).hidden = !an;
    });
    if (fokus) r.focus();
  }
  reiter.forEach(function (r, i) {
    r.addEventListener('click', function () { waehle(r, false); });
    r.addEventListener('keydown', function (ev) {
      var d = ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      ev.preventDefault();
      waehle(reiter[(i + d + reiter.length) % reiter.length], true);
    });
  });

  document.querySelectorAll('[data-kopieren]').forEach(function (k) {
    var text = k.textContent;
    k.addEventListener('click', function () {
      var a = k.closest('.spende').querySelector('[data-adresse]').getAttribute('data-adresse');
      var fertig = function () {
        k.textContent = k.getAttribute('data-fertig');
        setTimeout(function () { k.textContent = text; }, 1800);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(a).then(fertig, function () {});
    });
  });
})();
