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

      var before = "";
      try {
        before =  fs.readFileSync('azoteUP.log.csv');
      } catch(e) {
        console.log('init '+'azoteUP.log.csv');
      }
      fs.writeFileSync('azoteUP.log.csv',before+'\n'+res);
      console.log(res);
    }
  );
};

setInterval(update, 15*60*1000);
update();