fs = require('fs');
updater = require('./lib/IPupdater');

var conf = JSON.parse(fs.readFileSync('azoteUP.conf'));

var update = function() {
  updater.update(
    conf.account.email,
    conf.account.password,
    conf.hosts,
    function(result) {
      var res = result.map(function(el) {
        el.unshift((new Date()).toString());
        return el.join(';');
      }).join('\n');

      fs.writeFileSync('azoteUP.log.csv', fs.readFileSync('azoteUP.log.csv')+'\n'+res);
      console.log(res);
    }
  );
};

setInterval(update, 15*60*1000);
update();