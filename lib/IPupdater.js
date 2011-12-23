ifconfig = require('ifconfig.me');
dns = require('dns');
zombie = require('zombie');

exports.update = function(email, password, hosts, callback) {
  var results = [];
  var _submit = function(status, _hosts, ip_reason, other) {
    _hosts = (typeof _hosts == "string") ? [_hosts] : _hosts;
    other = other || null;
    _hosts.forEach(function(host){
      results.push([status, host, ip_reason, other]);
    });

    if(results.length == hosts.length) {
      callback.call(this, results);
    }
  };

  try{
    ifconfig.getIP(
      function(ip) {
        var count = 0;
        var hosts_to_update = [];
        hosts.forEach(function(host) {
          dns.resolve4(host, function(e,addr) {
            count ++;
            if(addr === null || typeof addr == 'undefined' || addr.length === 0) {
              _submit('FAIL',host,'DNS look-up failed.');
              return;
            }
            var resolv = addr[0];
            if(resolv == ip) {
              _submit('OK',host,ip, resolv);
            } else {
              hosts_to_update.push({host : host, resolv : resolv});
            }
            if(count == hosts.length && hosts_to_update.length > 0) {
              var browser = new zombie();
              browser.loadCSS = true;
              browser.runScripts = false;
              browser.visit("http://www.azote.org/connexion.html", function(){
                if(!browser.success) {
                  _submit('FAIL',hosts_to_update,'Azote.org does not respond');
                  return;
                }
              browser
              .fill("email",email)
              .fill("pass", password)
              .pressButton("Envoyer", function(){
                if(!browser.success) {
                  _submit('FAIL',hosts_to_update,'Azote.org does not respond');
                  return;
                }
                var _next = function() {
                  if(hosts_to_update.length === 0) return;
                  var el = hosts_to_update.pop();
                  var host = el.host;
                  browser.visit("http://www.azote.org/index.html", function() {
                    if(!browser.success) {
                      _submit('FAIL',host,'Page load failed.');
                      _next();
                      return;
                    }
                    if(typeof browser.query('a[title="'+host+'"]') == "undefined") {
                      _submit('FAIL', host, 'is not in your hosts.'); 
                      _next();
                      return;
                    }
                    browser.clickLink('a[title="'+host+'"]', function(){
                      if(!browser.success) {
                        _submit('FAIL', host, 'Page load failed.');
                        _next();
                        return;
                      }
                      if(browser.query('input[name="ip"]').getAttribute("value") == ip) {
                        _submit('UPDATING', host, ip, el.resolv);
                        _next();
                        return;
                      }
                      browser
                      .fill('ip', ip)
                      .pressButton("Enregistrer les modifications", function() {
                        if(!browser.success) {
                          _submit('FAIL', host, 'Page load failed.');
                          _next();
                          return;
                        }
                        if(typeof browser.query('p.ok') == 'undefined') {
                          _submit('FAIL', host,'Registration failed');
                          _next();
                          return;
                        }
                        _submit('UPDATED', host, ip, el.resolv);
                        _next();
                      });
                      });
                    });
                };
                _next();
                });
              });
            }
          });  
        });
      },
      function(e) {
        _submit('FAIL', hosts, 'Can not get external IP');
      });
  } catch(e) {
    _submit('FAIL', hosts, 'Internal ERROR');
  }
};