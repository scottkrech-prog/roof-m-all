(function(){
  var storageKey = 'rma-cookie-choice';
  var bannerId = 'rma-cookie-banner';
  function remember(choice){
    try{localStorage.setItem(storageKey, choice + ':' + new Date().toISOString());}catch(error){}
  }
  function hasChoice(){
    try{return !!localStorage.getItem(storageKey);}catch(error){return false;}
  }
  function hide(banner){
    banner.classList.remove('is-visible');
    banner.setAttribute('hidden','');
  }
  function show(){
    if(hasChoice() || document.getElementById(bannerId)){return;}
    var privacyPath = document.body && document.body.getAttribute('data-privacy-path') || 'privacy-policy.html';
    var banner = document.createElement('section');
    banner.className = 'cookie-banner';
    banner.id = bannerId;
    banner.setAttribute('aria-label','Cookie notice');
    banner.setAttribute('role','dialog');
    banner.setAttribute('aria-live','polite');
    banner.innerHTML = '<div class="cookie-banner__inner"><div class="cookie-banner__copy"><p class="cookie-banner__title">We use cookies to improve your visit.</p><p class="cookie-banner__text">Roof-M-All uses basic cookies and similar tools to keep the site working and understand what homeowners find useful. Read our <a href="'+ privacyPath +'">Privacy Policy</a>.</p></div><div class="cookie-banner__actions"><button class="cookie-banner__button cookie-banner__button--accept" type="button" data-cookie-choice="ok">OK</button></div></div>';
    document.body.appendChild(banner);
    requestAnimationFrame(function(){banner.classList.add('is-visible');});
    banner.addEventListener('click', function(event){
      var button = event.target.closest('[data-cookie-choice]');
      if(!button){return;}
      remember(button.getAttribute('data-cookie-choice'));
      hide(banner);
    });
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', show);
  }else{
    show();
  }
})();
