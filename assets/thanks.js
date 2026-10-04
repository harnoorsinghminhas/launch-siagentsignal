/* thanks.html: show the message for ?sku=. Whitelist only: an unknown or missing sku keeps the generic message. textContent is never written. */
(function () {
  var known = ['defense-playbook', 'reservation-pro', 'reservation-max', 'reservation-ultra'];
  var sku = '';
  try { sku = new URLSearchParams(window.location.search).get('sku') || ''; } catch (e) { sku = ''; }
  var want = known.indexOf(sku) !== -1 ? sku : 'generic';
  var sections = document.querySelectorAll('[data-thx] [data-sku]');
  for (var i = 0; i < sections.length; i++) {
    sections[i].hidden = sections[i].getAttribute('data-sku') !== want;
  }
})();
