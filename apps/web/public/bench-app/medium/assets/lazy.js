// lazy.js -- lazy modules incl. three.js scene

// mod-lazy-0001 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[1] = {
    id: 1,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0001';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '268');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  quaternion texture vector vector texture render shader matrix shader preview quaternion pipeline 
  //  camera route camera quaternion quaternion transform pipeline preview geometry modal frame 
  //  animation frame route matrix render mesh render pipeline feature feature lazy 
  //  preview animation render scene matrix quaternion material geometry vector feature texture 
  //  camera vector plugin view matrix route animation transform texture material mesh 
  //  mesh route shader view render modal render texture vector transform quaternion 
  //  frame material texture projection light modal vector geometry view feature view 
  //  pipeline matrix texture light texture camera camera render material route pipeline 
  //  mesh transform pipeline texture texture plugin animation feature render transform shader 
  //  projection transform shader feature modal modal camera matrix texture mesh animation 
  //  mesh scene shader light route quaternion quaternion texture camera transform pipeline 
  //  projection plugin view material material frame feature mesh texture animation mesh 
  //  quaternion shader render scene projection material route pipeline lazy material modal 
  //  shader animation vector projection animation matrix projection geometry plugin matrix matrix 
  //  scene transform scene pipeline material quaternion plugin route texture lazy quaternion 
  //  pipeline lazy lazy pipeline modal matrix feature camera transform feature view 
  //  mesh camera quaternion geometry mesh scene matrix projection mesh vector texture 
  //  light modal light plugin shader material preview preview quaternion light transform 
  //  animation light render geometry plugin plugin shader plugin animation render geometry 
  //  route plugin feature quaternion mesh preview vector pipeline projection transform frame 
  //  modal plugin frame projection texture feature plugin projection quaternion view lazy 
  //  projection projection feature animation quaternion frame feature matrix pipeline modal scene 
  //  camera scene pipeline frame route mesh light matrix quaternion material light 
  //  preview animation camera modal animation lazy light animation quaternion geometry matrix 
  //  animation lazy vector texture camera modal plugin camera feature frame vector 
  //  vector texture lazy lazy transform scene projection frame texture pipeline material 
  //  light shader transform camera plugin geometry animation view transform animation texture 
  //  pipeline geometry preview quaternion vector view transform light render frame camera 
  //  scene transform plugin scene vector pipeline geometry preview texture view view 
  //  quaternion texture lazy pipeline texture projection mesh mesh projection matrix vector 
  //  transform texture matrix quaternion quaternion render feature geometry shader animation route 
  //  plugin view texture view projection render transform projection route scene mesh 
  //  route animation geometry scene mesh matrix feature geometry modal projection animation 
  //  lazy light camera modal scene transform scene quaternion animation plugin modal 
  //  feature quaternion render light vector route material light animation pipeline transform 
  //  mesh camera animation texture view vector mesh vector modal transform shader 
  //  render animation preview material scene camera plugin transform modal quaternion texture 
  //  shader feature camera mesh transform transform pipeline quaternion quaternion mesh mesh 
  //  feature transform quaternion frame camera plugin camera vector transform lazy vector 
  //  animation camera lazy transform geometry pipeline camera animation shader shader vector 
  //  feature geometry render scene material vector view material lazy geometry plugin 
  //  pipeline lazy material material view shader vector shader texture lazy plugin 
  //  view lazy vector mesh animation view feature vector animation mesh lazy 
  //  material render render mesh scene route transform lazy render scene frame 
  //  texture route light vector scene shader route frame view projection matrix 
  //  shader geometry render plugin frame quaternion light route preview render lazy 
  //  view scene plugin matrix vector frame geometry frame light projection lazy 
  //  preview shader projection quaternion animation feature vector frame vector projection quaternion 
  //  feature vector lazy plugin vector geometry pipeline plugin feature projection lazy 
  //  material material light frame geometry modal scene scene mesh transform geometry 
  //  quaternion vector route route matrix modal quaternion geometry animation view transform 
  //  frame view material frame texture view quaternion material modal vector render 
  //  matrix plugin texture scene preview camera vector quaternion plugin feature animation 
  //  view geometry plugin vector mesh preview plugin quaternion light plugin scene 
  //  light scene route lazy route camera projection shader shader animation texture 
  //  matrix quaternion feature mesh material shader route view vector feature quaternion 
  //  mesh route lazy matrix projection view route light light view texture 
  //  frame pipeline mesh matrix view lazy route quaternion feature feature light 
  //  route scene vector matrix texture preview shader shader scene mesh preview 
  //  route route quaternion texture projection shader vector modal matrix view vector 
  //  projection quaternion light matrix modal shader quaternion view animation frame transform 
  //  pipeline matrix light pipeline mesh vector plugin route transform modal material 
  //  route plugin light transform texture modal modal route mesh modal render 
  //  preview plugin transform view geometry frame frame pipeline lazy render quaternion 
  //  transform modal animation shader texture shader scene scene route route mesh 
  //  camera route preview vector plugin modal texture plugin preview material shader 
  //  lazy animation lazy animation material light geometry modal quaternion animation scene 
  //  quaternion view view render projection quaternion quaternion shader scene render plugin 
  //  plugin material view route camera scene light light frame matrix transform 
  //  modal matrix animation mesh frame plugin plugin matrix camera modal transform 
  //  quaternion plugin material transform feature projection lazy view light transform render 
  //  lazy geometry geometry view quaternion modal preview transform route projection quaternion 
  //  light quaternion mesh modal projection route frame scene geometry preview projection 
  //  feature route quaternion render quaternion lazy modal camera transform vector route 
  //  mesh plugin matrix modal scene render material shader geometry route view 
  //  vector pipeline feature view vector quaternion render quaternion pipeline modal plugin 
  //  material texture material material pipeline texture view pipeline transform modal quaternion 
  //  texture projection view feature mesh shader projection animation animation scene scene 
  //  matrix mesh shader matrix light vector animation modal scene quaternion camera 
  //  view pipeline frame material render lazy render feature quaternion animation quaternion 
  //  render preview projection vector matrix lazy modal render view animation plugin 
  //  route view light feature transform mesh geometry material modal mesh quaternion 
  //  animation frame animation mesh pipeline vector frame geometry quaternion modal plugin 
  //  scene pipeline lazy quaternion mesh feature camera route vector shader shader 
  //  view light render projection frame transform material scene view route lazy 
  //  feature texture vector scene route view render matrix lazy matrix material 
  //  lazy geometry light geometry shader camera geometry camera light feature scene 
  //  pipeline modal preview material plugin matrix route projection material frame render 
  //  feature camera plugin texture matrix render quaternion frame view view shader 
  //  modal matrix matrix route camera projection matrix geometry geometry transform animation 
  //  preview mesh material transform preview geometry frame transform route mesh camera 
  //  modal frame matrix shader matrix shader vector view projection plugin matrix 
  //  light vector scene texture vector scene animation pipeline render modal matrix 
  //  route transform modal light render scene matrix lazy projection render projection 
  //  route scene modal light transform projection geometry light quaternion projection projection 
  //  texture transform render route route matrix matrix lazy geometry material texture 
  //  route projection pipeline projection feature animation preview transform projection plugin scene 
  //  animation light modal route geometry camera geometry transform projection geometry lazy 
  //  quaternion scene geometry animation texture material shader animation pipeline quaternion geometry 
  //  transform matrix lazy mesh plugin frame scene shader transform quaternion texture 
  //  render plugin projection render quaternion pipeline view view quaternion camera modal 
  //  geometry modal shader feature matrix mesh transform transform light lazy quaternion 
  //  route plugin route view frame lazy frame scene quaternion plugin camera 
  //  geometry mesh scene route feature quaternion animation route feature geometry scene 
  //  vector matrix quaternion feature shader light light preview view projection frame 
  //  animation texture plugin light view frame shader transform geometry plugin texture 
  //  route projection preview feature feature frame animation route render modal feature 
  //  feature light transform frame light shader render material render animation light 
  //  scene light vector preview texture route scene matrix mesh scene preview 
  //  vector camera material view lazy transform material view lazy quaternion material 
  //  lazy frame scene light pipeline preview camera preview quaternion scene frame 
  //  render frame route light lazy modal feature frame quaternion quaternion pipeline 
  //  render shader pipeline pipeline geometry feature quaternion plugin material lazy route 
  //  mesh preview view projection pipeline feature view frame route light animation 
  //  frame lazy scene scene light geometry mesh render feature light modal 
  //  route projection vector preview render transform scene camera route material material 
  //  animation feature camera material mesh matrix lazy lazy geometry transform matrix 
  //  lazy matrix shader animation geometry pipeline matrix projection shader camera texture 
  //  vector shader shader scene camera light light frame lazy modal mesh 
  //  plugin scene mesh matrix preview view animation material material light texture 
  //  quaternion texture transform scene camera lazy feature texture camera scene vector 
  //  projection route quaternion lazy vector geometry projection lazy animation shader route 
  //  scene preview camera pipeline quaternion geometry mesh shader plugin mesh transform 
  //  plugin route lazy frame preview frame mesh camera quaternion modal scene 
  //  camera vector plugin matrix modal plugin view render quaternion scene preview 
  //  pipeline texture transform light material shader texture feature route matrix frame 
  //  material shader matrix transform texture texture animation material preview feature frame 
  //  route quaternion material feature texture render texture camera texture geometry route 
  //  view scene mesh transform camera lazy pipeline shader modal lazy feature 
  //  projection preview projection feature modal modal matrix scene matrix scene view 
  //  pipeline pipeline modal light plugin camera view quaternion modal feature animation 
  //  shader light pipeline view quaternion light mesh view pipeline plugin camera 
  //  light route render scene scene pipeline pipeline route shader transform frame 
  //  matrix light texture lazy light plugin mesh texture animation frame pipeline 
  //  quaternion vector pipeline feature feature route feature render geometry animation modal 
  //  shader texture lazy mesh camera geometry shader render preview geometry texture 
  //  pipeline shader texture texture plugin feature material view route plugin texture 
  //  geometry modal preview modal quaternion projection plugin modal geometry modal view 
  //  matrix pipeline texture vector modal frame light view material vector plugin 
  //  camera route transform animation plugin light light geometry scene quaternion matrix 
  //  pipeline scene camera feature animation quaternion projection route projection geometry mesh 
  //  animation pipeline view scene modal camera geometry matrix view feature scene 
  //  animation preview geometry render material shader route geometry geometry view camera 
  //  transform vector plugin matrix transform route lazy feature shader
  */
})();

// mod-lazy-0002 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[2] = {
    id: 2,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0002';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '167');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  shader feature frame transform animation animation vector lazy camera feature matrix modal 
  //  light vector material matrix render vector route route material camera material 
  //  modal quaternion feature matrix animation transform shader quaternion geometry vector material 
  //  shader quaternion projection preview pipeline view view scene preview light light 
  //  camera vector geometry preview matrix texture preview view pipeline render view 
  //  feature plugin plugin matrix projection geometry frame mesh projection shader lazy 
  //  material feature vector transform light geometry route view plugin light quaternion 
  //  material texture matrix camera lazy route mesh texture vector vector lazy 
  //  scene camera lazy frame matrix texture transform feature lazy camera route 
  //  camera projection feature light shader geometry render lazy geometry material projection 
  //  plugin projection matrix light material geometry vector light light route shader 
  //  animation light plugin lazy matrix view light animation vector frame mesh 
  //  texture route camera plugin transform route plugin view light pipeline lazy 
  //  pipeline transform animation scene pipeline material vector scene vector lazy view 
  //  mesh texture mesh modal geometry scene scene feature light geometry transform 
  //  lazy transform pipeline render geometry shader transform render material projection texture 
  //  transform vector route lazy mesh route preview transform plugin quaternion mesh 
  //  modal route lazy shader mesh scene projection view matrix quaternion animation 
  //  lazy shader plugin view quaternion projection material matrix lazy texture vector 
  //  frame preview animation pipeline quaternion pipeline vector animation route frame feature 
  //  quaternion shader light shader light matrix transform light render render vector 
  //  mesh view feature view texture view preview render modal lazy geometry 
  //  quaternion plugin texture scene material feature view geometry feature light render 
  //  scene mesh quaternion frame mesh texture feature material mesh animation camera 
  //  texture modal geometry matrix pipeline mesh vector pipeline preview render shader 
  //  camera mesh shader camera modal route camera frame light route quaternion 
  //  plugin quaternion modal shader camera geometry view texture feature lazy frame 
  //  preview pipeline vector render texture light animation scene vector feature lazy 
  //  quaternion vector matrix texture route shader camera transform view pipeline texture 
  //  shader mesh quaternion pipeline frame lazy mesh render transform light shader 
  //  projection camera animation transform preview matrix pipeline transform route transform modal 
  //  mesh plugin modal frame shader feature light scene light view plugin 
  //  quaternion texture material shader route camera light shader plugin mesh projection 
  //  render material transform feature vector scene render frame vector light shader 
  //  frame preview render quaternion feature view quaternion texture modal transform animation 
  //  modal feature pipeline mesh preview scene material feature scene vector geometry 
  //  scene shader mesh projection preview modal frame camera shader modal route 
  //  route frame material mesh view geometry scene animation material material material 
  //  render preview render matrix shader route quaternion transform modal lazy modal 
  //  shader animation scene transform animation feature light preview shader preview mesh 
  //  light projection frame shader modal camera matrix feature preview projection animation 
  //  render frame view view projection view frame mesh matrix material material 
  //  geometry render camera camera modal view geometry projection light mesh projection 
  //  shader scene view transform frame feature vector view view route mesh 
  //  view vector vector light vector light geometry light animation quaternion frame 
  //  plugin modal texture matrix pipeline animation view modal quaternion projection frame 
  //  feature route quaternion frame matrix projection geometry material light view transform 
  //  modal frame transform view lazy matrix frame texture animation light modal 
  //  pipeline camera render transform route vector pipeline route mesh view render 
  //  modal feature mesh camera matrix frame vector scene feature view mesh 
  //  scene geometry modal mesh quaternion mesh texture animation material quaternion route 
  //  animation mesh vector shader shader lazy quaternion shader transform feature material 
  //  lazy lazy render light lazy plugin modal frame animation plugin view 
  //  feature light view quaternion frame scene texture light render geometry pipeline 
  //  projection pipeline geometry quaternion modal render view modal vector render projection 
  //  lazy vector vector transform matrix frame frame mesh view animation view 
  //  light matrix transform geometry texture render vector animation feature texture texture 
  //  route light feature transform animation render matrix view route feature light 
  //  lazy geometry vector shader camera vector scene vector scene plugin view 
  //  geometry pipeline feature mesh transform view scene plugin vector scene feature 
  //  scene matrix plugin transform texture frame plugin matrix light render transform 
  //  animation view animation render transform pipeline projection texture frame quaternion animation 
  //  modal geometry plugin feature light shader matrix render lazy feature geometry 
  //  feature projection scene matrix geometry mesh material feature matrix preview matrix 
  //  preview texture texture material render scene plugin mesh render matrix route 
  //  camera vector mesh preview geometry frame render material frame pipeline plugin 
  //  lazy lazy preview plugin geometry vector vector modal plugin mesh modal 
  //  vector lazy animation material texture light preview pipeline mesh preview animation 
  //  plugin render mesh texture view modal transform light mesh light camera 
  //  quaternion modal pipeline plugin modal camera render frame scene light plugin 
  //  lazy frame shader quaternion render feature plugin route lazy preview preview 
  //  lazy animation texture plugin matrix projection pipeline camera lazy quaternion plugin 
  //  route vector material view transform vector scene view modal route material 
  //  preview view preview plugin lazy lazy feature transform preview pipeline pipeline 
  //  plugin lazy preview render view geometry animation preview matrix camera projection 
  //  modal camera render vector quaternion pipeline vector pipeline view feature geometry 
  //  geometry transform feature modal frame material pipeline texture vector plugin view 
  //  mesh plugin vector feature light mesh matrix feature feature mesh route 
  //  route plugin geometry matrix animation modal animation feature light scene feature 
  //  lazy vector pipeline projection matrix camera route view light light camera 
  //  vector modal vector quaternion quaternion mesh material geometry frame render vector 
  //  geometry preview transform pipeline route material preview scene texture transform quaternion 
  //  plugin projection feature render lazy preview projection mesh frame light view 
  //  vector vector modal plugin render view view geometry shader render plugin 
  //  plugin light animation modal scene preview plugin render render frame projection 
  //  frame plugin shader matrix modal light vector scene route vector render 
  //  mesh vector modal mesh plugin quaternion shader lazy render modal render 
  //  light feature matrix preview render frame feature feature animation transform plugin 
  //  mesh pipeline feature camera vector texture projection frame camera texture shader 
  //  camera geometry light mesh vector view modal vector pipeline animation frame 
  //  view geometry frame route lazy feature transform vector mesh frame lazy 
  //  transform vector matrix matrix transform camera pipeline scene camera feature shader 
  //  light route mesh mesh pipeline animation feature transform animation frame shader 
  //  transform transform feature material material camera material texture feature render preview 
  //  projection preview lazy mesh feature mesh projection matrix quaternion plugin route 
  //  preview modal transform render view quaternion light quaternion preview material preview 
  //  lazy projection lazy animation material route feature texture frame feature texture 
  //  camera vector feature texture mesh transform scene projection quaternion feature scene 
  //  modal render render render quaternion feature frame view mesh feature quaternion 
  //  preview animation feature shader frame preview pipeline modal route quaternion animation 
  //  view frame camera scene preview preview material transform shader render pipeline 
  //  view modal geometry vector camera material frame camera mesh route material 
  //  modal pipeline geometry mesh scene modal preview matrix pipeline scene shader 
  //  shader pipeline light route scene plugin geometry pipeline material texture projection 
  //  light route plugin projection transform material geometry camera feature frame mesh 
  //  modal lazy mesh route texture vector texture geometry feature material light 
  //  feature texture preview route lazy animation modal transform view frame camera 
  //  quaternion material pipeline view pipeline mesh lazy material plugin shader lazy 
  //  camera plugin modal lazy modal pipeline projection transform pipeline pipeline view 
  //  frame render camera preview view scene transform texture scene material animation 
  //  projection material light transform light geometry light scene feature render render 
  //  geometry camera pipeline texture preview geometry frame quaternion scene animation projection 
  //  projection material projection pipeline shader shader pipeline camera preview scene scene 
  //  texture modal light animation animation light animation matrix shader render texture 
  //  geometry render frame camera view feature modal pipeline render projection lazy 
  //  animation light plugin transform matrix matrix quaternion scene camera light texture 
  //  matrix texture view scene light matrix material texture mesh animation texture 
  //  matrix feature scene mesh animation projection render render animation preview feature 
  //  geometry animation frame preview plugin plugin view pipeline texture plugin animation 
  //  lazy geometry pipeline modal feature light light quaternion lazy matrix route 
  //  feature plugin quaternion light animation pipeline scene matrix animation modal vector 
  //  quaternion route geometry mesh feature camera texture plugin pipeline shader scene 
  //  camera vector mesh transform preview lazy preview mesh modal quaternion render 
  //  pipeline mesh frame view frame quaternion camera quaternion matrix light scene 
  //  quaternion plugin matrix geometry modal mesh view animation projection pipeline frame 
  //  scene animation quaternion light scene preview view camera view view camera 
  //  mesh transform plugin scene modal scene scene animation light route material 
  //  view projection view view matrix projection matrix frame scene view feature 
  //  texture lazy feature route transform camera material route material material animation 
  //  view pipeline view frame route scene lazy camera preview geometry preview 
  //  modal view lazy lazy material frame matrix transform lazy vector view 
  //  modal scene preview quaternion vector quaternion scene matrix frame shader route 
  //  frame feature animation shader shader material animation plugin frame modal vector 
  //  modal route mesh shader transform animation lazy geometry texture light light 
  //  feature matrix projection scene lazy camera matrix frame quaternion texture view 
  //  view matrix render plugin modal shader route render geometry route frame 
  //  lazy transform texture frame render quaternion render frame lazy lazy quaternion 
  //  modal render transform frame pipeline quaternion scene render quaternion view lazy 
  //  mesh material preview feature pipeline scene render shader shader feature animation 
  //  frame scene mesh animation quaternion material scene vector animation plugin animation 
  //  material scene route animation matrix material plugin mesh pipeline shader plugin 
  //  mesh animation projection shader quaternion scene material pipeline quaternion route scene 
  //  modal geometry animation matrix vector matrix transform render pipeline plugin vector 
  //  geometry lazy feature vector texture scene feature light material shader matrix 
  //  camera light matrix projection texture animation shader quaternion route plugin mesh 
  //  pipeline view material geometry view animation vector modal lazy texture mesh 
  //  texture vector preview
  */
})();

// mod-lazy-0003 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[3] = {
    id: 3,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0003';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '318');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  matrix scene feature preview scene projection view quaternion view plugin view plugin 
  //  material route quaternion geometry feature scene plugin quaternion lazy transform plugin 
  //  route plugin view projection render transform view lazy frame matrix modal 
  //  light pipeline mesh camera matrix quaternion projection modal material vector geometry 
  //  pipeline scene projection route route frame feature render vector route vector 
  //  pipeline material view mesh quaternion preview shader quaternion quaternion camera route 
  //  view matrix scene mesh geometry scene plugin plugin projection texture animation 
  //  route render animation route animation scene material lazy light shader matrix 
  //  animation modal scene texture animation render texture frame shader matrix quaternion 
  //  feature feature geometry shader render feature animation light frame mesh camera 
  //  light light vector pipeline plugin matrix material camera lazy view render 
  //  feature feature shader modal camera plugin preview view render shader transform 
  //  scene scene matrix projection frame plugin view transform camera view pipeline 
  //  transform pipeline material light transform texture vector lazy modal transform preview 
  //  route view camera projection vector plugin camera modal matrix frame transform 
  //  matrix plugin quaternion view shader geometry frame texture material transform pipeline 
  //  route pipeline render preview feature matrix mesh scene route route modal 
  //  vector lazy light vector vector matrix vector mesh projection animation light 
  //  view frame preview transform feature render geometry texture lazy light quaternion 
  //  matrix projection feature projection frame scene geometry frame plugin preview lazy 
  //  plugin preview render projection camera frame pipeline material lazy projection lazy 
  //  pipeline material scene vector view pipeline quaternion view route mesh projection 
  //  light pipeline vector frame mesh scene geometry render light render transform 
  //  preview light render lazy preview frame vector vector view modal plugin 
  //  projection material vector mesh light animation quaternion route animation animation animation 
  //  geometry vector texture pipeline projection light render scene material vector render 
  //  preview feature route matrix plugin shader shader render preview shader lazy 
  //  transform vector plugin render light vector frame vector view camera animation 
  //  plugin vector mesh preview matrix light geometry camera texture lazy material 
  //  matrix frame matrix scene texture geometry scene view render modal projection 
  //  vector plugin lazy transform preview route matrix frame feature quaternion camera 
  //  modal matrix material shader frame quaternion feature modal feature view shader 
  //  texture feature plugin vector route shader vector vector frame lazy transform 
  //  render animation mesh pipeline camera plugin texture route plugin light transform 
  //  pipeline matrix transform view shader projection shader quaternion lazy vector material 
  //  projection material route scene frame render animation pipeline frame camera view 
  //  shader preview quaternion projection vector mesh matrix route view route material 
  //  plugin frame mesh preview shader lazy material camera frame pipeline view 
  //  quaternion quaternion mesh frame material render modal lazy feature plugin mesh 
  //  mesh camera mesh preview route material geometry modal transform view vector 
  //  shader view camera material matrix view preview render matrix camera feature 
  //  shader quaternion animation lazy quaternion geometry feature render frame preview vector 
  //  matrix render animation render frame texture plugin view frame plugin material 
  //  animation plugin vector camera geometry quaternion transform transform scene feature texture 
  //  scene texture camera quaternion preview vector pipeline scene feature vector preview 
  //  animation texture texture frame animation animation animation preview camera scene texture 
  //  vector quaternion frame transform material light material animation geometry camera projection 
  //  scene shader preview plugin modal transform light transform plugin plugin scene 
  //  modal scene animation route route shader material quaternion vector quaternion scene 
  //  shader quaternion projection geometry light scene shader render transform animation mesh 
  //  view frame vector geometry matrix material transform transform lazy quaternion texture 
  //  modal feature camera matrix texture route material material light preview geometry 
  //  vector texture view quaternion preview transform quaternion frame lazy view transform 
  //  matrix plugin geometry vector feature texture route view plugin animation material 
  //  quaternion feature quaternion shader modal modal plugin material mesh shader scene 
  //  plugin lazy vector view lazy shader geometry vector render transform projection 
  //  projection lazy quaternion render render transform camera view camera light quaternion 
  //  frame scene animation projection plugin feature shader mesh texture pipeline texture 
  //  view pipeline material transform mesh plugin pipeline matrix pipeline view lazy 
  //  geometry lazy plugin view lazy frame scene scene light animation feature 
  //  pipeline scene shader transform scene camera pipeline shader mesh projection vector 
  //  mesh render frame shader lazy light vector camera light feature feature 
  //  pipeline plugin preview route transform material view material matrix feature quaternion 
  //  feature matrix material feature projection animation light material pipeline shader transform 
  //  scene view quaternion preview frame lazy pipeline quaternion quaternion lazy projection 
  //  lazy view lazy lazy camera animation mesh preview pipeline route transform 
  //  scene texture view texture scene animation pipeline mesh modal vector camera 
  //  animation projection light render mesh matrix geometry preview route material preview 
  //  feature preview transform view geometry preview route lazy matrix feature plugin 
  //  matrix pipeline route plugin vector texture plugin projection modal light preview 
  //  frame animation mesh frame animation matrix camera route frame animation mesh 
  //  texture lazy material feature material frame pipeline camera pipeline light vector 
  //  feature route material scene preview pipeline pipeline geometry render projection route 
  //  animation scene scene pipeline pipeline modal transform view animation vector view 
  //  transform vector shader quaternion texture frame pipeline pipeline geometry geometry feature 
  //  route material shader view modal lazy route feature render view light 
  //  quaternion lazy quaternion render pipeline transform material projection texture mesh light 
  //  quaternion shader vector render animation material geometry mesh animation feature plugin 
  //  light preview render feature transform vector animation geometry transform lazy scene 
  //  matrix quaternion scene preview plugin modal pipeline view feature shader route 
  //  route animation projection frame transform scene view pipeline scene render vector 
  //  matrix texture view transform texture pipeline light preview geometry vector texture 
  //  mesh geometry mesh pipeline quaternion projection light transform light animation view 
  //  animation pipeline animation material lazy light matrix texture view route preview 
  //  view vector light light animation mesh animation camera route animation frame 
  //  light camera light vector texture geometry vector pipeline quaternion shader preview 
  //  view route animation material scene render matrix lazy geometry plugin texture 
  //  material quaternion light lazy quaternion texture modal animation projection modal feature 
  //  quaternion shader animation camera camera projection vector preview material geometry frame 
  //  projection camera route route scene render view light material projection animation 
  //  animation geometry feature material material modal camera camera matrix material preview 
  //  mesh transform route matrix feature scene preview geometry geometry geometry material 
  //  lazy projection geometry vector scene modal material transform matrix lazy route 
  //  pipeline shader lazy shader matrix vector modal quaternion vector feature vector 
  //  light render scene quaternion texture scene route camera scene feature transform 
  //  scene modal shader vector vector vector render mesh scene shader feature 
  //  frame matrix modal animation modal geometry feature material feature projection scene 
  //  matrix light pipeline vector feature vector render shader material light matrix 
  //  pipeline transform geometry route lazy light light scene pipeline plugin camera 
  //  pipeline feature plugin geometry shader animation frame matrix scene plugin vector 
  //  scene feature modal projection pipeline projection animation feature shader camera texture 
  //  view mesh texture render preview modal route camera lazy geometry route 
  //  route camera geometry transform mesh render matrix pipeline route preview modal 
  //  matrix frame render texture feature view projection scene transform geometry plugin 
  //  view matrix quaternion camera light frame view pipeline view route pipeline 
  //  lazy render matrix quaternion view shader feature projection mesh modal matrix 
  //  preview pipeline geometry transform feature light plugin scene view scene pipeline 
  //  mesh mesh texture transform pipeline camera render lazy lazy lazy frame 
  //  shader frame plugin vector transform lazy render mesh mesh camera pipeline 
  //  render quaternion mesh texture texture shader matrix frame material feature lazy 
  //  modal camera modal matrix feature light render geometry render matrix transform 
  //  light projection frame texture geometry route frame modal frame view pipeline 
  //  plugin animation lazy shader projection geometry animation animation matrix shader route 
  //  camera shader scene quaternion texture scene route pipeline shader frame feature 
  //  feature geometry material shader mesh plugin plugin material matrix pipeline feature 
  //  transform material camera lazy light vector light frame matrix animation modal 
  //  camera render transform camera scene scene route matrix matrix projection mesh 
  //  view projection plugin matrix preview route texture pipeline render vector geometry 
  //  pipeline shader preview render geometry pipeline modal vector frame preview plugin 
  //  modal view frame matrix animation preview quaternion preview camera lazy projection 
  //  mesh transform route vector pipeline camera pipeline view light camera vector 
  //  route modal transform plugin vector matrix route plugin preview view material 
  //  feature route view matrix plugin modal mesh lazy scene scene quaternion 
  //  mesh geometry plugin view preview light vector preview camera texture render 
  //  animation animation quaternion plugin material camera lazy feature preview plugin vector 
  //  animation modal mesh view vector material preview feature animation vector animation 
  //  scene texture feature pipeline shader feature light view projection plugin lazy 
  //  modal scene projection plugin route matrix scene shader matrix scene lazy 
  //  projection render shader route render vector projection feature camera geometry render 
  //  texture quaternion matrix material feature feature plugin shader frame mesh texture 
  //  lazy material route material quaternion modal vector scene transform render lazy 
  //  transform lazy texture quaternion scene vector frame render pipeline quaternion projection 
  //  feature route material matrix pipeline animation material render mesh material mesh 
  //  scene vector route camera vector scene frame scene texture light frame 
  //  modal transform matrix mesh camera matrix feature matrix transform modal feature 
  //  material animation view frame view transform texture view texture scene camera 
  //  plugin feature mesh route material animation transform preview route geometry animation 
  //  plugin texture preview animation transform matrix modal light view scene material 
  //  material view projection matrix plugin matrix animation lazy quaternion quaternion preview 
  //  plugin projection camera modal modal preview pipeline pipeline matrix material pipeline 
  //  projection matrix scene texture texture quaternion geometry texture texture mesh geometry 
  //  quaternion animation render projection plugin pipeline projection material geometry geometry vector 
  //  pipeline route transform plugin preview mesh mesh light render vector projection 
  //  light view transform route projection texture modal vector vector mesh scene 
  //  preview transform render
  */
})();

// mod-lazy-0004 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[4] = {
    id: 4,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0004';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '98');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  light animation quaternion route vector light frame plugin transform mesh transform material 
  //  pipeline camera frame mesh scene pipeline material animation projection quaternion light 
  //  view geometry camera view matrix texture vector shader vector geometry plugin 
  //  feature animation texture lazy vector material projection matrix modal light modal 
  //  animation view light preview shader light pipeline animation mesh frame texture 
  //  matrix lazy pipeline frame mesh pipeline quaternion projection view animation light 
  //  render projection view view scene animation pipeline plugin texture preview modal 
  //  pipeline material geometry scene light vector quaternion scene scene preview light 
  //  modal material camera modal feature texture light texture preview pipeline vector 
  //  vector projection mesh route mesh mesh lazy lazy route preview feature 
  //  transform frame view frame shader modal transform geometry feature projection feature 
  //  vector pipeline lazy pipeline modal shader camera plugin geometry lazy light 
  //  texture texture preview modal modal matrix frame animation camera mesh quaternion 
  //  plugin texture texture transform transform quaternion scene frame preview animation view 
  //  route modal view pipeline frame modal lazy pipeline pipeline light animation 
  //  plugin texture modal camera shader geometry modal lazy frame feature render 
  //  pipeline lazy view animation lazy animation texture scene texture mesh light 
  //  animation frame mesh animation geometry scene texture route route mesh texture 
  //  light modal transform camera camera pipeline scene mesh render vector modal 
  //  modal camera render plugin render route route frame texture shader preview 
  //  projection shader material transform route projection plugin feature modal frame scene 
  //  light shader modal frame camera modal transform lazy scene geometry geometry 
  //  texture quaternion vector view texture feature frame mesh render geometry vector 
  //  geometry geometry geometry shader matrix projection pipeline quaternion texture camera matrix 
  //  route preview transform pipeline texture plugin mesh frame mesh route vector 
  //  geometry modal lazy projection transform projection render transform render projection texture 
  //  quaternion render view matrix scene vector texture quaternion material quaternion view 
  //  vector transform texture transform pipeline scene texture projection render matrix frame 
  //  quaternion geometry pipeline plugin material transform quaternion view vector matrix shader 
  //  projection scene animation feature geometry animation quaternion matrix preview plugin quaternion 
  //  render geometry matrix lazy preview shader plugin material quaternion preview render 
  //  feature transform animation render lazy frame feature view material pipeline scene 
  //  material animation material texture pipeline projection plugin texture frame animation matrix 
  //  pipeline route light quaternion shader view camera light quaternion preview quaternion 
  //  view modal projection route geometry plugin shader quaternion lazy material plugin 
  //  modal texture geometry modal matrix pipeline material vector scene render scene 
  //  frame matrix pipeline pipeline pipeline geometry camera pipeline pipeline light vector 
  //  matrix shader plugin feature scene texture pipeline light pipeline camera transform 
  //  quaternion projection animation camera frame camera geometry frame quaternion vector quaternion 
  //  pipeline camera animation scene transform shader light scene plugin animation mesh 
  //  material mesh mesh texture animation feature modal material vector projection pipeline 
  //  animation preview feature route texture quaternion quaternion modal mesh material render 
  //  render view route quaternion pipeline pipeline preview lazy texture shader animation 
  //  frame light feature transform material lazy light texture frame quaternion camera 
  //  matrix matrix light geometry mesh vector animation lazy render camera matrix 
  //  vector route shader view lazy feature projection animation render frame view 
  //  preview projection render frame texture matrix modal mesh camera view texture 
  //  transform material view modal light camera texture texture mesh render projection 
  //  shader plugin scene pipeline preview quaternion route render feature lazy quaternion 
  //  route render geometry light material preview scene lazy frame frame transform 
  //  transform vector texture view geometry frame material lazy projection projection shader 
  //  mesh view feature render texture view shader scene mesh quaternion view 
  //  projection vector preview light lazy preview geometry frame mesh camera geometry 
  //  texture lazy scene animation mesh quaternion texture transform preview animation vector 
  //  lazy render animation scene shader texture route plugin shader render projection 
  //  scene quaternion view texture projection camera vector geometry camera modal lazy 
  //  projection material matrix shader animation quaternion projection geometry scene light light 
  //  view view transform vector preview scene texture geometry geometry render light 
  //  light lazy geometry transform preview animation view light vector transform lazy 
  //  shader view lazy route modal lazy preview matrix pipeline scene matrix 
  //  modal transform mesh scene shader scene vector render lazy camera projection 
  //  shader route feature material route mesh light animation frame feature geometry 
  //  light plugin frame camera transform texture vector vector render matrix animation 
  //  route preview camera projection render quaternion view projection light geometry plugin 
  //  geometry shader quaternion route preview route mesh transform route matrix scene 
  //  camera camera geometry mesh lazy camera matrix shader quaternion frame vector 
  //  modal projection view scene vector mesh material pipeline animation render animation 
  //  material pipeline matrix modal texture feature vector transform geometry quaternion geometry 
  //  material view transform modal camera camera render feature texture texture transform 
  //  transform light route animation material scene shader scene frame render projection 
  //  material light vector geometry mesh shader projection pipeline texture animation modal 
  //  projection material frame plugin preview preview mesh frame vector geometry pipeline 
  //  projection plugin modal mesh projection animation pipeline shader animation shader feature 
  //  feature transform animation mesh mesh plugin frame preview feature render view 
  //  geometry lazy frame shader frame animation preview mesh quaternion vector projection 
  //  mesh preview projection material shader preview transform vector light preview mesh 
  //  animation geometry pipeline frame lazy material projection feature geometry route plugin 
  //  vector light route projection preview shader material modal view geometry pipeline 
  //  projection lazy shader render matrix camera feature matrix scene render modal 
  //  mesh plugin feature scene transform render projection shader frame quaternion plugin 
  //  route frame preview pipeline view texture view pipeline preview quaternion frame 
  //  preview plugin lazy route matrix texture feature scene mesh quaternion vector 
  //  quaternion matrix modal transform projection frame scene pipeline animation route frame 
  //  modal pipeline modal view shader mesh shader material material mesh quaternion 
  //  frame render transform frame pipeline projection view texture feature geometry quaternion 
  //  transform light animation quaternion light frame feature frame preview matrix geometry 
  //  matrix view material material animation frame render transform plugin geometry projection 
  //  pipeline light plugin render light transform preview camera matrix scene vector 
  //  transform transform frame pipeline scene modal quaternion projection modal camera animation 
  //  preview lazy projection scene animation mesh plugin route feature preview feature 
  //  view texture plugin geometry shader material lazy view feature transform animation 
  //  view mesh projection mesh lazy preview render geometry quaternion modal matrix 
  //  scene matrix texture material pipeline shader quaternion camera mesh scene projection 
  //  scene projection transform material feature animation animation animation route light quaternion 
  //  plugin scene mesh geometry route matrix animation geometry render transform preview 
  //  animation render route render scene animation preview projection render light matrix 
  //  scene transform texture quaternion modal feature pipeline frame feature light quaternion 
  //  scene plugin modal projection lazy render transform camera camera vector frame 
  //  preview modal transform light camera vector render geometry view quaternion animation 
  //  route geometry quaternion geometry material lazy quaternion plugin material modal animation 
  //  material modal view quaternion lazy mesh camera mesh matrix projection pipeline 
  //  vector pipeline frame light lazy lazy geometry feature vector lazy geometry 
  //  vector texture quaternion vector preview feature scene light render light lazy 
  //  camera preview view view transform pipeline camera quaternion camera geometry geometry 
  //  projection shader pipeline preview projection modal feature geometry feature shader vector 
  //  texture view plugin lazy modal pipeline preview frame render texture lazy 
  //  pipeline animation view vector preview geometry modal vector material mesh modal 
  //  route view camera scene animation plugin mesh material animation route modal 
  //  geometry geometry feature camera route modal frame texture plugin geometry modal 
  //  geometry view route geometry projection preview projection projection matrix render animation 
  //  view mesh quaternion matrix vector animation preview feature render preview geometry 
  //  shader mesh texture pipeline pipeline vector animation transform geometry view camera 
  //  scene vector plugin render preview projection scene preview mesh preview material 
  //  shader modal lazy feature pipeline render shader pipeline shader route animation 
  //  view scene mesh preview projection pipeline frame texture texture plugin geometry 
  //  camera vector matrix vector feature quaternion material shader projection animation scene 
  //  scene render frame geometry plugin texture projection pipeline plugin lazy view 
  //  lazy preview quaternion feature quaternion preview camera matrix view lazy shader 
  //  frame render shader view texture shader modal vector preview transform mesh 
  //  camera vector pipeline animation frame view animation preview render matrix preview 
  //  render vector render camera camera light frame route lazy frame quaternion 
  //  plugin plugin light transform preview shader view frame material projection shader 
  //  preview lazy shader pipeline pipeline transform vector shader plugin preview animation 
  //  light feature frame pipeline material projection view projection animation view render 
  //  feature light transform material shader view camera matrix light transform shader 
  //  preview preview feature plugin geometry projection preview camera render vector matrix 
  //  route render pipeline frame quaternion vector texture modal shader projection lazy 
  //  render plugin light mesh vector texture projection frame texture render geometry 
  //  light modal lazy camera pipeline lazy pipeline light camera transform lazy 
  //  preview geometry scene render lazy texture feature view animation texture scene 
  //  transform render plugin geometry matrix vector texture material view texture scene 
  //  projection material view lazy route animation geometry lazy animation route view 
  //  projection quaternion mesh material vector render mesh feature vector route matrix 
  //  modal geometry camera camera lazy vector light projection shader material mesh 
  //  matrix material vector lazy lazy modal material view shader lazy camera 
  //  route frame light shader shader view scene transform projection preview matrix 
  //  lazy plugin material shader light transform matrix shader frame frame quaternion 
  //  quaternion pipeline feature matrix light light light pipeline scene quaternion mesh 
  //  mesh geometry transform transform geometry pipeline pipeline view vector scene modal 
  //  preview material matrix vector route matrix transform lazy matrix preview plugin 
  //  plugin render preview animation pipeline route lazy quaternion preview feature mesh 
  //  animation feature view pipeline vector projection matrix modal preview view material 
  //  matrix light frame lazy route projection geometry frame view texture geometry 
  //  shader
  */
})();

// mod-lazy-0005 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[5] = {
    id: 5,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0005';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '5');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  geometry quaternion view feature frame projection mesh pipeline projection geometry plugin light 
  //  pipeline lazy mesh mesh preview animation pipeline light mesh render feature 
  //  geometry feature projection quaternion preview lazy pipeline vector preview vector camera 
  //  scene modal feature transform render shader view light frame mesh scene 
  //  vector pipeline projection vector frame quaternion camera view mesh pipeline plugin 
  //  lazy render texture route texture lazy view light feature plugin material 
  //  preview frame geometry feature modal pipeline render feature frame light frame 
  //  scene vector geometry modal texture preview view frame plugin animation lazy 
  //  projection frame scene pipeline render projection projection feature matrix route feature 
  //  vector vector transform material pipeline geometry render material vector pipeline modal 
  //  lazy route quaternion texture vector texture route view light material animation 
  //  animation texture feature frame shader material render lazy route modal camera 
  //  mesh shader lazy light frame frame mesh vector frame frame pipeline 
  //  frame mesh geometry frame modal render texture mesh light plugin projection 
  //  camera transform transform render vector light projection transform vector render texture 
  //  render plugin camera material lazy feature projection quaternion render plugin route 
  //  plugin animation view shader vector animation texture frame quaternion frame render 
  //  projection animation animation preview camera mesh plugin preview scene camera geometry 
  //  lazy view view quaternion pipeline material preview plugin camera scene texture 
  //  scene matrix material camera pipeline preview shader light preview animation animation 
  //  lazy camera texture modal scene texture light animation lazy frame pipeline 
  //  animation scene vector scene pipeline camera geometry preview texture modal plugin 
  //  camera lazy render scene vector matrix render vector scene animation quaternion 
  //  feature plugin render shader view route pipeline animation projection frame matrix 
  //  material modal matrix quaternion texture quaternion lazy modal matrix projection material 
  //  frame preview vector plugin geometry feature vector shader view quaternion pipeline 
  //  mesh modal texture preview geometry frame render quaternion scene modal quaternion 
  //  pipeline projection animation camera view camera route animation render modal texture 
  //  transform render scene route modal mesh pipeline scene modal shader quaternion 
  //  light matrix pipeline modal route texture projection projection animation texture transform 
  //  plugin projection scene transform route quaternion camera light modal feature material 
  //  plugin camera route light lazy projection pipeline pipeline frame route texture 
  //  projection shader material vector frame frame mesh material mesh quaternion geometry 
  //  plugin shader modal shader preview vector modal projection camera projection pipeline 
  //  camera projection lazy material preview quaternion preview matrix vector projection camera 
  //  texture animation matrix material matrix geometry plugin transform animation mesh animation 
  //  mesh animation light mesh frame camera scene render material modal mesh 
  //  frame scene material matrix mesh render vector geometry projection view geometry 
  //  matrix lazy frame mesh matrix render matrix render quaternion shader preview 
  //  frame light transform lazy pipeline view matrix render lazy vector modal 
  //  route camera texture frame matrix scene route light vector mesh quaternion 
  //  plugin shader material scene modal pipeline lazy scene quaternion projection animation 
  //  shader scene modal plugin shader route feature plugin lazy lazy view 
  //  lazy projection plugin frame mesh camera feature route lazy lazy render 
  //  preview render scene plugin material preview view preview plugin modal texture 
  //  lazy vector feature projection light matrix geometry projection vector camera projection 
  //  shader material mesh quaternion mesh quaternion preview matrix vector shader preview 
  //  quaternion pipeline texture projection light scene scene projection preview transform animation 
  //  view feature view vector plugin animation lazy frame lazy view lazy 
  //  render light feature scene feature render vector modal geometry light route 
  //  quaternion transform texture route frame transform animation quaternion scene modal scene 
  //  mesh route projection route matrix pipeline mesh transform projection light feature 
  //  view material quaternion shader geometry quaternion matrix matrix scene transform view 
  //  scene matrix plugin render render modal pipeline light feature vector light 
  //  vector texture geometry view texture vector feature matrix projection geometry shader 
  //  light plugin lazy render plugin vector vector plugin matrix plugin route 
  //  render frame transform material vector geometry camera scene projection shader mesh 
  //  animation route view render feature vector texture mesh geometry geometry matrix 
  //  feature feature feature animation route animation view texture view projection matrix 
  //  frame scene geometry projection projection render feature texture mesh texture frame 
  //  scene frame projection quaternion vector texture material frame shader geometry projection 
  //  mesh view material vector light projection matrix material render scene frame 
  //  route animation modal shader animation route view lazy lazy geometry mesh 
  //  transform quaternion matrix plugin modal texture view route feature view projection 
  //  projection lazy modal pipeline quaternion scene matrix feature matrix light frame 
  //  scene mesh mesh plugin animation matrix geometry render quaternion projection route 
  //  view shader render projection view pipeline view projection modal vector feature 
  //  view preview vector camera render render vector geometry animation transform preview 
  //  plugin pipeline render transform projection animation camera animation feature texture camera 
  //  modal plugin matrix plugin scene scene view preview plugin vector route 
  //  light geometry light modal transform geometry preview shader transform geometry geometry 
  //  modal vector light frame modal route lazy projection pipeline animation transform 
  //  modal feature animation modal geometry lazy pipeline light modal feature view 
  //  camera matrix frame frame transform projection projection camera vector material texture 
  //  lazy matrix vector projection texture scene lazy plugin modal light animation 
  //  vector projection geometry camera texture camera geometry plugin view route route 
  //  preview scene material render quaternion projection shader matrix feature geometry lazy 
  //  mesh scene projection animation feature mesh material preview render light modal 
  //  scene projection animation texture frame render shader transform transform feature preview 
  //  view mesh quaternion feature preview vector geometry mesh modal light material 
  //  mesh texture lazy route pipeline pipeline matrix scene preview animation render 
  //  projection pipeline plugin render shader lazy mesh frame animation camera vector 
  //  pipeline quaternion light geometry plugin camera plugin preview transform material frame 
  //  lazy animation projection pipeline matrix geometry light render projection quaternion matrix 
  //  projection lazy material render preview render pipeline scene route geometry feature 
  //  pipeline modal render projection lazy vector matrix transform shader modal plugin 
  //  transform route preview route projection animation vector scene modal feature frame 
  //  modal matrix frame transform lazy camera texture vector feature pipeline geometry 
  //  plugin scene modal view render geometry matrix quaternion matrix shader lazy 
  //  projection light geometry light mesh transform matrix transform shader geometry quaternion 
  //  render animation route transform render view preview pipeline lazy geometry pipeline 
  //  pipeline vector vector preview light transform mesh texture light material material 
  //  mesh vector shader projection geometry animation camera projection material render animation 
  //  plugin vector route light lazy route lazy preview quaternion texture matrix 
  //  shader modal pipeline shader vector vector modal quaternion geometry camera modal 
  //  pipeline preview frame modal mesh texture mesh mesh frame quaternion transform 
  //  vector projection pipeline scene render animation preview texture lazy render frame 
  //  vector camera view projection shader material scene view view scene animation 
  //  material plugin feature projection camera transform render material projection shader geometry 
  //  render texture texture view scene light vector scene animation modal quaternion 
  //  render shader view animation shader camera view modal view modal frame 
  //  lazy mesh material frame pipeline projection projection transform animation render quaternion 
  //  projection mesh lazy texture material feature projection geometry light pipeline preview 
  //  lazy projection material light modal animation material texture render material geometry 
  //  transform animation geometry route camera material matrix render route camera preview 
  //  shader frame transform camera projection texture animation frame route quaternion material 
  //  route shader pipeline plugin lazy animation camera plugin projection vector texture 
  //  vector pipeline transform light camera render material projection modal animation vector 
  //  feature plugin quaternion shader animation camera scene scene mesh render lazy 
  //  shader lazy quaternion shader material plugin material camera matrix pipeline transform 
  //  modal projection vector projection animation projection quaternion scene light matrix scene 
  //  light vector matrix route render projection route plugin geometry vector render 
  //  vector preview pipeline feature vector feature frame feature vector preview material 
  //  frame light camera feature preview preview render camera feature preview feature 
  //  vector transform projection frame light quaternion vector frame render plugin plugin 
  //  feature modal mesh light frame mesh route scene lazy render lazy 
  //  pipeline view frame feature geometry feature scene render route texture view 
  //  mesh view feature shader plugin feature camera scene geometry lazy render 
  //  mesh mesh projection mesh vector pipeline mesh render shader light view 
  //  texture plugin preview view feature projection matrix lazy texture frame light 
  //  matrix pipeline plugin texture mesh material quaternion animation modal camera scene 
  //  render view modal frame view preview pipeline texture shader transform texture 
  //  light material geometry feature matrix lazy preview quaternion modal feature route 
  //  feature frame render animation view render mesh modal preview camera animation 
  //  matrix texture animation vector feature material camera light pipeline shader feature 
  //  lazy pipeline route geometry pipeline mesh frame view vector mesh transform 
  //  geometry frame vector animation modal modal camera light shader camera plugin 
  //  transform plugin projection render lazy vector camera preview lazy mesh render 
  //  geometry mesh animation material feature modal matrix camera route lazy geometry 
  //  matrix mesh texture view scene camera view mesh route render light 
  //  shader animation view vector modal quaternion vector route material light preview 
  //  lazy light scene pipeline preview shader transform material pipeline frame geometry 
  //  quaternion quaternion projection light plugin quaternion render frame plugin lazy route 
  //  pipeline transform vector vector matrix texture preview light vector material projection 
  //  material scene route render quaternion animation vector render shader animation modal 
  //  matrix animation material scene material camera route plugin animation projection preview 
  //  render plugin projection lazy render modal quaternion render shader plugin modal 
  //  transform geometry animation camera lazy frame render geometry quaternion texture quaternion 
  //  projection light matrix camera shader projection render quaternion quaternion scene lazy 
  //  route feature preview camera light transform texture pipeline vector camera quaternion 
  //  modal geometry geometry render quaternion pipeline light projection pipeline camera shader 
  //  quaternion feature matrix geometry plugin transform matrix animation texture projection preview 
  //  view texture geometry matrix transform mesh render shader render route pipeline 
  //  lazy projection mesh modal light pipeline feature mesh
  */
})();

// mod-lazy-0006 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[6] = {
    id: 6,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0006';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '210');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  texture light transform shader matrix preview texture lazy vector geometry light render 
  //  texture projection matrix route quaternion render material geometry view route plugin 
  //  animation animation geometry frame light light plugin light scene matrix camera 
  //  mesh modal view modal pipeline shader pipeline geometry shader pipeline pipeline 
  //  scene render mesh feature mesh material animation modal quaternion render quaternion 
  //  animation geometry matrix render preview geometry view feature feature frame preview 
  //  preview lazy pipeline material animation mesh lazy render lazy light texture 
  //  render matrix route quaternion transform matrix render vector preview light material 
  //  animation route vector pipeline pipeline scene shader modal transform feature camera 
  //  quaternion material route frame frame geometry view mesh lazy scene material 
  //  light route pipeline camera texture texture feature matrix texture material matrix 
  //  shader view geometry light render lazy animation route scene geometry modal 
  //  feature modal animation plugin geometry matrix mesh material vector pipeline camera 
  //  frame light view frame route light vector projection pipeline transform lazy 
  //  transform route view geometry light scene preview texture animation render matrix 
  //  mesh frame preview lazy mesh vector mesh quaternion scene frame render 
  //  geometry camera feature preview route transform plugin feature animation projection route 
  //  route pipeline material texture shader camera route scene vector lazy route 
  //  shader plugin feature vector camera plugin camera lazy route frame quaternion 
  //  vector animation frame animation light pipeline vector camera scene shader transform 
  //  material view frame render pipeline shader pipeline scene projection lazy light 
  //  lazy geometry camera animation texture preview matrix view render shader projection 
  //  view modal material preview modal texture plugin preview modal geometry matrix 
  //  animation quaternion transform animation plugin animation vector pipeline feature matrix view 
  //  render texture geometry vector camera geometry animation animation camera view light 
  //  material geometry quaternion preview scene matrix scene shader scene frame geometry 
  //  scene quaternion animation material animation vector plugin preview geometry route render 
  //  view feature feature texture feature feature lazy feature route vector modal 
  //  preview matrix frame camera modal feature vector transform projection frame route 
  //  camera light camera geometry material plugin quaternion feature scene view pipeline 
  //  quaternion view view preview light frame modal light modal lazy render 
  //  texture frame shader render quaternion modal geometry material animation lazy matrix 
  //  light texture vector texture projection feature geometry feature route render mesh 
  //  preview light mesh render light route animation projection mesh transform texture 
  //  vector animation preview feature route pipeline quaternion feature animation lazy light 
  //  texture scene matrix geometry camera lazy geometry material render plugin transform 
  //  texture modal pipeline texture frame transform animation shader render material camera 
  //  frame render modal vector view view transform plugin view projection camera 
  //  matrix pipeline preview preview projection transform pipeline vector feature quaternion view 
  //  plugin light plugin projection lazy render transform frame animation transform texture 
  //  transform route geometry light shader light material projection camera transform texture 
  //  quaternion frame route mesh vector projection view mesh transform shader material 
  //  transform vector camera vector matrix vector matrix material pipeline modal texture 
  //  shader camera matrix pipeline scene render light shader transform scene quaternion 
  //  plugin lazy preview texture material frame preview quaternion mesh render feature 
  //  scene view scene shader route transform render transform animation vector render 
  //  animation shader mesh preview scene camera quaternion matrix quaternion route geometry 
  //  scene pipeline animation quaternion modal render vector projection camera view material 
  //  mesh mesh light transform light quaternion lazy scene matrix animation frame 
  //  preview transform transform transform view route view view shader quaternion frame 
  //  mesh pipeline matrix preview render plugin view shader preview lazy vector 
  //  route mesh plugin light quaternion material shader light transform pipeline pipeline 
  //  projection camera quaternion feature scene geometry route lazy transform plugin pipeline 
  //  texture material preview transform pipeline projection plugin route matrix lazy modal 
  //  quaternion lazy projection pipeline vector matrix geometry animation light shader quaternion 
  //  view modal quaternion frame render route mesh preview transform scene quaternion 
  //  light route geometry feature texture view projection route pipeline projection texture 
  //  vector view texture preview quaternion render geometry scene route feature route 
  //  feature preview modal preview material light material quaternion plugin render texture 
  //  camera projection pipeline frame geometry geometry plugin light animation frame texture 
  //  plugin vector camera modal frame feature light light shader texture feature 
  //  modal projection scene light geometry pipeline animation lazy scene animation scene 
  //  material projection view render modal route mesh view texture light feature 
  //  frame quaternion texture material animation transform material transform camera frame view 
  //  plugin route quaternion geometry geometry feature transform preview transform feature modal 
  //  scene pipeline geometry scene animation animation animation quaternion preview material camera 
  //  light vector feature mesh texture transform animation camera lazy transform plugin 
  //  plugin animation camera scene vector lazy projection animation pipeline mesh vector 
  //  view vector shader matrix render view vector texture projection vector frame 
  //  matrix animation mesh material pipeline plugin modal preview transform texture preview 
  //  geometry view transform feature modal view quaternion texture plugin transform vector 
  //  route camera modal quaternion mesh shader material texture shader mesh camera 
  //  transform frame modal light scene pipeline material quaternion scene animation render 
  //  modal camera plugin view pipeline plugin preview route animation scene lazy 
  //  texture plugin light frame material scene light frame texture geometry vector 
  //  quaternion frame view light matrix animation view preview animation vector light 
  //  render material plugin preview lazy projection plugin frame feature geometry modal 
  //  camera light lazy plugin texture texture route matrix matrix view shader 
  //  view projection preview frame view lazy material texture pipeline plugin modal 
  //  matrix mesh mesh transform projection view matrix view render lazy quaternion 
  //  quaternion preview geometry lazy vector vector projection preview light view quaternion 
  //  camera feature camera pipeline plugin projection vector texture camera projection lazy 
  //  pipeline texture texture route lazy frame matrix feature quaternion light transform 
  //  scene material geometry quaternion matrix vector route frame transform mesh lazy 
  //  texture feature texture vector render material transform preview pipeline lazy geometry 
  //  vector projection modal mesh light light geometry transform feature pipeline quaternion 
  //  light render render geometry scene modal projection quaternion view modal shader 
  //  projection projection shader transform plugin projection modal scene plugin mesh matrix 
  //  scene scene preview scene material geometry quaternion frame quaternion render feature 
  //  feature shader lazy lazy frame route quaternion render texture preview camera 
  //  pipeline material render geometry quaternion material modal animation feature shader vector 
  //  modal feature animation mesh shader transform lazy scene geometry view feature 
  //  material matrix mesh transform light frame mesh texture mesh animation plugin 
  //  light animation matrix transform frame material mesh vector route light light 
  //  light pipeline preview texture frame transform geometry route transform feature camera 
  //  transform shader matrix feature shader route material animation camera scene plugin 
  //  material texture pipeline transform shader geometry view preview lazy lazy feature 
  //  camera preview matrix pipeline modal plugin feature animation matrix preview lazy 
  //  material texture camera mesh shader texture route transform scene shader camera 
  //  lazy mesh light lazy texture geometry light route animation route camera 
  //  feature mesh render route plugin camera transform plugin light preview frame 
  //  quaternion feature matrix feature light pipeline vector frame projection frame texture 
  //  texture frame shader camera shader material geometry material pipeline light view 
  //  texture lazy modal quaternion lazy pipeline route scene vector transform light 
  //  vector matrix geometry quaternion material camera transform scene projection material projection 
  //  geometry projection feature matrix route vector view geometry texture matrix matrix 
  //  modal projection projection lazy shader transform light geometry view vector vector 
  //  view mesh view pipeline feature lazy vector frame camera preview mesh 
  //  view quaternion material projection camera vector feature mesh quaternion feature texture 
  //  projection lazy matrix frame view modal matrix frame modal animation light 
  //  feature shader pipeline render modal matrix lazy shader render frame vector 
  //  material shader shader shader matrix camera animation route vector vector light 
  //  plugin texture material route animation texture texture texture vector geometry modal 
  //  shader projection view animation geometry preview route render matrix render vector 
  //  transform camera light vector pipeline matrix lazy feature route modal vector 
  //  animation scene feature transform transform light feature geometry lazy quaternion feature 
  //  frame route projection modal matrix feature animation feature material pipeline geometry 
  //  geometry animation material frame frame matrix view camera texture transform matrix 
  //  route frame camera pipeline modal material geometry light view shader frame 
  //  material scene light plugin mesh render pipeline light camera texture frame 
  //  lazy matrix modal mesh projection view vector quaternion plugin texture mesh 
  //  shader transform preview mesh transform view projection lazy lazy matrix matrix 
  //  modal pipeline preview route render view preview texture preview material lazy 
  //  matrix material transform matrix view scene view preview view shader vector 
  //  view scene vector view render modal light render route pipeline view 
  //  camera geometry material transform scene vector projection route route frame pipeline 
  //  route route preview pipeline lazy scene light mesh modal texture shader 
  //  texture vector render lazy texture pipeline preview render transform projection lazy 
  //  shader view quaternion lazy scene animation plugin texture scene matrix route 
  //  view shader matrix quaternion render animation texture shader route geometry plugin 
  //  quaternion vector light shader shader vector light texture transform light quaternion 
  //  feature plugin camera camera animation shader texture light material light geometry 
  //  lazy mesh vector projection transform shader material material quaternion pipeline quaternion 
  //  geometry quaternion pipeline frame geometry pipeline projection pipeline quaternion projection lazy 
  //  vector light preview geometry transform camera geometry geometry lazy vector feature 
  //  render scene vector camera pipeline light mesh preview render texture transform 
  //  material plugin plugin mesh camera render modal material modal projection material 
  //  quaternion camera route pipeline transform light plugin view preview plugin geometry 
  //  texture plugin vector lazy quaternion geometry route texture route vector lazy 
  //  lazy shader frame mesh view light camera matrix projection shader frame 
  //  route frame quaternion texture render view preview scene transform geometry vector 
  //  quaternion camera vector feature feature light plugin vector route mesh projection 
  //  light plugin matrix frame camera mesh shader matrix modal material preview 
  //  lazy vector material plugin plugin preview pipeline render lazy texture frame 
  //  scene preview
  */
})();

// mod-lazy-0007 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[7] = {
    id: 7,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0007';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '231');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  matrix feature scene transform animation shader modal animation vector quaternion view preview 
  //  view modal shader view mesh feature view modal view geometry modal 
  //  route projection route view matrix render preview frame modal matrix transform 
  //  feature mesh feature preview projection geometry camera geometry feature geometry material 
  //  pipeline geometry view material scene route view pipeline matrix vector camera 
  //  route shader view geometry matrix material feature render camera mesh render 
  //  modal matrix texture lazy lazy feature feature material modal quaternion vector 
  //  transform preview preview camera scene geometry lazy shader lazy transform preview 
  //  feature material feature quaternion route scene pipeline render feature projection geometry 
  //  route route plugin mesh shader modal shader vector feature vector projection 
  //  transform lazy animation camera camera material render texture shader feature pipeline 
  //  scene feature route scene material quaternion transform transform matrix mesh projection 
  //  geometry route texture modal texture route material texture render material vector 
  //  material quaternion vector modal geometry texture shader material matrix light transform 
  //  route matrix frame texture material pipeline mesh projection pipeline material geometry 
  //  frame geometry render scene camera shader material vector vector scene scene 
  //  quaternion camera light modal matrix pipeline view render modal lazy geometry 
  //  projection camera render preview light vector plugin camera light camera mesh 
  //  scene preview mesh modal matrix vector feature plugin projection lazy mesh 
  //  route light transform scene lazy preview animation light frame route pipeline 
  //  preview route transform mesh geometry texture preview projection feature view quaternion 
  //  pipeline pipeline plugin texture scene quaternion route matrix frame material matrix 
  //  view material projection transform matrix geometry frame render vector material shader 
  //  transform camera plugin feature preview texture view plugin view matrix material 
  //  mesh scene frame quaternion mesh shader quaternion light geometry frame material 
  //  render camera texture view mesh light geometry plugin mesh modal frame 
  //  material animation plugin vector geometry lazy mesh matrix view feature frame 
  //  preview quaternion plugin mesh render transform matrix transform render matrix shader 
  //  route feature frame animation material texture pipeline animation view transform scene 
  //  pipeline frame shader transform animation texture quaternion vector texture lazy texture 
  //  light frame material frame view mesh lazy quaternion frame preview quaternion 
  //  lazy matrix feature lazy scene geometry matrix preview material lazy view 
  //  vector route vector material light mesh view modal light animation frame 
  //  vector feature shader geometry route quaternion frame route material material geometry 
  //  camera light plugin matrix animation view matrix scene route preview light 
  //  quaternion camera render route frame preview vector light mesh scene shader 
  //  projection matrix vector pipeline plugin plugin mesh scene render matrix shader 
  //  camera animation mesh plugin shader shader plugin mesh quaternion frame transform 
  //  frame vector mesh light transform view vector vector lazy mesh frame 
  //  mesh frame transform projection pipeline quaternion geometry texture modal vector animation 
  //  shader light light feature mesh plugin shader route feature vector camera 
  //  animation geometry geometry material view material matrix shader light quaternion matrix 
  //  frame preview vector route camera preview route transform quaternion plugin feature 
  //  light light render light transform preview camera animation plugin modal transform 
  //  vector camera scene light geometry vector geometry quaternion shader matrix camera 
  //  material route scene route plugin view frame matrix quaternion route quaternion 
  //  preview quaternion route projection light lazy preview projection modal scene plugin 
  //  material render light feature texture feature modal quaternion vector vector preview 
  //  transform texture quaternion feature mesh route matrix pipeline pipeline render frame 
  //  preview projection preview quaternion pipeline plugin route route feature geometry quaternion 
  //  preview modal transform route render projection feature mesh light view transform 
  //  lazy animation geometry quaternion modal feature projection render plugin shader render 
  //  light shader render plugin transform feature geometry shader animation route plugin 
  //  shader feature scene lazy texture frame material projection vector pipeline vector 
  //  matrix light preview plugin scene mesh scene mesh geometry mesh mesh 
  //  modal preview geometry lazy quaternion preview preview render route scene vector 
  //  scene quaternion projection projection render feature camera camera quaternion geometry animation 
  //  preview preview modal geometry quaternion shader quaternion material camera feature geometry 
  //  scene transform vector light lazy render camera plugin geometry projection transform 
  //  scene camera pipeline vector material route feature texture modal modal lazy 
  //  render quaternion light scene route texture matrix vector plugin light quaternion 
  //  material shader quaternion lazy feature light shader render texture animation projection 
  //  camera render feature modal material plugin matrix shader texture preview mesh 
  //  light camera geometry geometry render transform transform preview render lazy preview 
  //  projection feature plugin plugin matrix texture matrix modal scene transform route 
  //  feature route scene light scene vector modal render geometry plugin feature 
  //  render route route animation projection light matrix animation projection feature preview 
  //  shader feature modal matrix animation camera texture frame preview route scene 
  //  material plugin matrix view vector vector transform feature modal material material 
  //  geometry texture vector light lazy shader light quaternion lazy vector vector 
  //  texture frame matrix scene plugin view preview feature quaternion camera quaternion 
  //  scene feature projection geometry transform pipeline texture geometry lazy geometry quaternion 
  //  modal projection animation route texture feature view frame scene animation texture 
  //  vector geometry geometry feature quaternion plugin preview matrix vector pipeline route 
  //  material modal vector scene camera pipeline view light plugin lazy vector 
  //  view texture preview view plugin mesh animation projection plugin view mesh 
  //  pipeline frame light texture plugin geometry matrix plugin mesh render preview 
  //  material matrix animation projection scene camera scene lazy feature frame lazy 
  //  plugin feature transform geometry plugin plugin matrix pipeline shader route matrix 
  //  vector feature plugin view mesh frame texture modal texture plugin quaternion 
  //  material transform matrix pipeline camera render preview material shader light view 
  //  preview feature render plugin projection transform plugin material mesh quaternion projection 
  //  scene feature modal frame plugin render frame material feature transform light 
  //  modal camera modal pipeline render matrix modal texture view camera shader 
  //  preview scene vector scene plugin matrix texture modal feature route camera 
  //  camera render view light vector material material light render frame geometry 
  //  camera feature shader light pipeline animation view feature scene pipeline vector 
  //  frame modal frame frame camera camera pipeline feature scene render material 
  //  projection scene transform matrix camera scene plugin lazy light material view 
  //  quaternion feature feature animation geometry quaternion render material modal mesh pipeline 
  //  light preview lazy light render transform lazy mesh shader route mesh 
  //  vector quaternion vector preview shader shader modal lazy vector modal lazy 
  //  mesh plugin vector material projection frame matrix camera preview lazy preview 
  //  modal matrix geometry quaternion feature frame quaternion animation render light vector 
  //  route texture light pipeline pipeline light scene plugin transform preview view 
  //  mesh projection projection transform preview lazy transform projection render frame render 
  //  transform animation geometry vector render frame geometry transform route shader preview 
  //  transform mesh animation geometry projection view lazy lazy preview quaternion modal 
  //  mesh geometry animation render pipeline frame light render transform projection scene 
  //  frame modal texture quaternion projection preview feature lazy light light frame 
  //  feature route vector light vector light camera lazy camera plugin pipeline 
  //  modal geometry pipeline lazy view pipeline projection view view animation quaternion 
  //  transform view vector matrix preview quaternion geometry material animation light quaternion 
  //  quaternion vector quaternion texture vector render plugin preview texture lazy material 
  //  vector camera geometry texture modal camera modal shader material projection camera 
  //  material quaternion vector modal quaternion plugin animation vector route frame animation 
  //  view geometry modal feature material camera modal plugin camera projection material 
  //  quaternion scene light geometry animation render mesh pipeline shader matrix quaternion 
  //  scene texture lazy plugin feature texture pipeline lazy scene modal transform 
  //  modal texture geometry pipeline projection render feature modal matrix animation material 
  //  vector mesh transform camera matrix light route scene animation shader animation 
  //  modal route pipeline transform frame matrix animation scene animation light transform 
  //  frame projection material modal plugin vector route pipeline transform matrix lazy 
  //  modal lazy projection frame material material render transform geometry geometry frame 
  //  preview mesh animation transform view projection route preview modal animation geometry 
  //  camera mesh route frame vector material route plugin texture feature route 
  //  projection mesh route preview transform plugin render modal lazy preview render 
  //  vector feature modal feature projection mesh shader modal lazy transform animation 
  //  projection frame feature shader camera route shader modal preview modal mesh 
  //  feature projection scene camera vector preview animation render render view shader 
  //  plugin texture view geometry light feature animation scene shader mesh scene 
  //  modal vector texture texture matrix feature light shader shader light transform 
  //  route scene modal matrix animation projection plugin geometry modal light matrix 
  //  pipeline light modal camera pipeline render feature transform projection shader texture 
  //  preview route plugin shader render projection light route quaternion geometry modal 
  //  transform material modal lazy animation camera render pipeline texture mesh feature 
  //  vector matrix light scene route quaternion preview preview plugin animation animation 
  //  camera shader mesh plugin quaternion pipeline material preview preview pipeline pipeline 
  //  projection render route vector shader pipeline scene material geometry preview shader 
  //  projection camera vector texture render render render frame matrix geometry view 
  //  animation texture preview animation material render matrix texture vector texture material 
  //  material camera camera geometry plugin frame modal frame preview geometry geometry 
  //  camera transform texture lazy matrix view texture projection light vector scene 
  //  render vector lazy projection texture quaternion shader view lazy scene view 
  //  preview pipeline mesh lazy plugin projection shader camera geometry preview render 
  //  plugin light lazy scene projection matrix feature modal view animation matrix 
  //  quaternion scene modal texture shader camera quaternion modal texture route render 
  //  material pipeline preview transform plugin matrix plugin quaternion animation material quaternion 
  //  view shader mesh vector material pipeline transform animation render matrix shader 
  //  projection pipeline geometry texture mesh projection shader route material view frame 
  //  view camera feature lazy camera shader quaternion mesh shader feature matrix 
  //  animation plugin lazy pipeline lazy transform preview transform preview camera lazy 
  //  transform light vector texture quaternion material shader animation frame light projection 
  //  scene route modal geometry transform plugin light plugin preview
  */
})();

// mod-lazy-0008 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[8] = {
    id: 8,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0008';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '120');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  transform transform route pipeline render camera material shader mesh render transform modal 
  //  frame shader mesh route transform animation geometry scene scene quaternion quaternion 
  //  transform geometry geometry matrix frame modal quaternion material feature render view 
  //  mesh lazy scene render transform texture frame material plugin plugin scene 
  //  scene render feature frame scene pipeline matrix quaternion render route modal 
  //  pipeline geometry matrix modal vector light camera shader texture route shader 
  //  quaternion transform modal camera modal preview mesh vector render modal frame 
  //  quaternion mesh frame material modal matrix mesh camera view preview render 
  //  transform transform light view route modal view texture vector texture projection 
  //  projection modal render vector animation pipeline geometry matrix view route render 
  //  feature scene animation shader matrix mesh geometry texture shader light projection 
  //  scene vector vector route render vector frame modal view texture modal 
  //  camera vector scene preview projection scene texture animation shader modal lazy 
  //  frame vector feature vector lazy animation projection geometry light animation camera 
  //  camera modal scene mesh material view matrix shader view shader plugin 
  //  pipeline lazy projection quaternion projection plugin animation quaternion matrix plugin scene 
  //  scene texture texture camera preview animation material render frame camera shader 
  //  feature pipeline lazy transform transform projection projection material geometry vector texture 
  //  mesh matrix lazy light view mesh view texture texture lazy view 
  //  lazy frame matrix pipeline scene animation texture frame preview mesh modal 
  //  geometry projection view animation scene feature material route animation projection material 
  //  projection feature view modal shader projection feature material preview render feature 
  //  texture route pipeline preview animation transform quaternion texture camera pipeline scene 
  //  render vector shader lazy texture transform light pipeline pipeline camera lazy 
  //  matrix geometry lazy mesh frame view frame preview plugin mesh animation 
  //  view animation material lazy projection matrix matrix view pipeline light mesh 
  //  modal feature render shader vector projection projection vector animation scene mesh 
  //  matrix mesh vector feature lazy shader plugin modal scene frame frame 
  //  preview texture light mesh texture lazy route modal lazy projection pipeline 
  //  route matrix camera preview scene feature shader render texture render matrix 
  //  render preview matrix camera frame modal quaternion vector frame scene texture 
  //  modal matrix mesh view feature projection matrix projection preview lazy quaternion 
  //  feature vector light pipeline animation shader route route pipeline light vector 
  //  projection preview material vector render preview scene feature vector preview view 
  //  frame view lazy matrix lazy matrix vector lazy frame feature plugin 
  //  preview projection mesh feature shader material frame feature scene matrix mesh 
  //  frame scene light modal scene frame matrix render vector feature shader 
  //  vector view transform geometry material material frame scene transform vector projection 
  //  feature render lazy shader feature geometry transform frame geometry animation pipeline 
  //  pipeline matrix render preview view mesh preview projection mesh vector texture 
  //  route frame scene view mesh route camera geometry quaternion pipeline geometry 
  //  plugin texture shader lazy material pipeline scene projection projection preview render 
  //  route plugin mesh matrix plugin feature animation scene modal matrix vector 
  //  geometry projection shader vector pipeline transform vector shader scene material animation 
  //  feature texture light vector lazy matrix quaternion geometry material frame material 
  //  transform route frame material lazy feature render frame transform transform texture 
  //  mesh projection lazy transform projection animation plugin texture shader geometry projection 
  //  scene geometry matrix plugin scene render feature quaternion transform frame animation 
  //  vector scene feature texture geometry vector projection mesh texture matrix feature 
  //  light matrix animation frame render preview geometry view render feature view 
  //  view shader modal modal quaternion geometry pipeline preview material feature view 
  //  scene lazy preview camera matrix shader preview material preview modal modal 
  //  transform scene projection lazy quaternion mesh animation pipeline render lazy light 
  //  material view quaternion view texture route scene geometry matrix matrix transform 
  //  texture pipeline preview geometry modal route projection matrix mesh texture geometry 
  //  matrix matrix render texture lazy preview feature transform lazy render preview 
  //  camera render quaternion view route camera material light mesh feature lazy 
  //  preview vector camera lazy mesh transform projection feature route render preview 
  //  light vector route vector preview geometry animation view mesh pipeline render 
  //  matrix vector mesh mesh preview feature plugin scene route render shader 
  //  vector scene mesh feature frame scene animation vector modal pipeline texture 
  //  route projection matrix animation transform view projection frame camera plugin mesh 
  //  transform quaternion view quaternion lazy animation frame modal frame scene matrix 
  //  lazy geometry material scene quaternion plugin light mesh quaternion frame pipeline 
  //  pipeline camera animation transform light shader projection transform pipeline modal texture 
  //  pipeline shader lazy camera frame material lazy material material light feature 
  //  animation transform animation pipeline modal projection frame geometry animation quaternion route 
  //  matrix plugin pipeline texture render animation animation mesh mesh transform view 
  //  render scene scene feature view frame animation projection transform pipeline animation 
  //  material plugin projection pipeline scene plugin frame plugin shader view route 
  //  route lazy light projection projection matrix view view feature mesh matrix 
  //  render projection route lazy view matrix preview pipeline light plugin projection 
  //  plugin plugin frame camera preview lazy route pipeline material material frame 
  //  scene geometry vector route modal light quaternion frame animation light scene 
  //  matrix feature geometry shader modal matrix pipeline lazy light geometry mesh 
  //  pipeline feature vector light frame plugin route plugin scene vector texture 
  //  geometry animation modal feature render scene vector preview animation transform lazy 
  //  render view render shader mesh lazy texture texture projection shader plugin 
  //  mesh material frame projection view lazy mesh frame pipeline route view 
  //  frame material texture projection scene quaternion view vector quaternion vector plugin 
  //  quaternion view render route light preview route feature feature route shader 
  //  projection view modal projection feature scene modal material matrix preview shader 
  //  matrix geometry pipeline frame matrix texture material mesh modal preview quaternion 
  //  geometry light preview transform quaternion feature geometry transform frame shader view 
  //  material pipeline matrix projection animation preview lazy plugin material light animation 
  //  material projection frame camera matrix geometry frame feature preview matrix preview 
  //  texture material animation texture camera pipeline geometry render scene route material 
  //  matrix plugin quaternion plugin shader scene pipeline pipeline matrix mesh mesh 
  //  view animation matrix animation matrix vector lazy vector matrix texture transform 
  //  camera camera plugin view view matrix modal projection texture vector vector 
  //  plugin plugin render material matrix vector plugin lazy view pipeline animation 
  //  view view camera matrix render geometry lazy view view lazy scene 
  //  frame plugin lazy scene route route route shader transform plugin mesh 
  //  modal shader frame feature projection frame quaternion projection texture plugin scene 
  //  material vector animation route projection material plugin view feature animation transform 
  //  lazy feature vector quaternion vector quaternion feature geometry route quaternion matrix 
  //  texture modal pipeline frame frame feature route vector texture modal light 
  //  animation vector material plugin plugin plugin texture view feature vector quaternion 
  //  quaternion modal matrix shader geometry vector render pipeline lazy scene view 
  //  vector projection camera frame texture pipeline animation route modal projection view 
  //  animation light quaternion quaternion projection quaternion pipeline projection animation lazy scene 
  //  light geometry projection light material geometry transform route frame modal mesh 
  //  view mesh quaternion view geometry view scene quaternion transform vector quaternion 
  //  feature camera material shader mesh projection camera frame animation quaternion route 
  //  animation quaternion render mesh camera pipeline matrix mesh pipeline shader transform 
  //  camera shader lazy preview geometry geometry quaternion vector feature vector preview 
  //  render light texture modal geometry animation mesh lazy matrix pipeline projection 
  //  mesh pipeline texture modal material plugin view view quaternion frame plugin 
  //  geometry route route geometry material modal scene camera animation route projection 
  //  view mesh pipeline view modal texture light material projection projection plugin 
  //  preview shader render geometry texture render projection geometry texture view pipeline 
  //  animation material light camera plugin lazy light material view feature route 
  //  projection pipeline render texture matrix feature shader shader texture quaternion animation 
  //  projection texture mesh material camera camera vector route route feature geometry 
  //  camera feature view material view quaternion render frame quaternion geometry geometry 
  //  light camera feature camera route camera scene shader camera texture lazy 
  //  plugin matrix scene lazy projection animation plugin material transform animation route 
  //  feature projection transform shader feature modal camera pipeline preview vector render 
  //  transform quaternion matrix preview lazy light quaternion projection shader transform modal 
  //  frame view geometry geometry camera light pipeline scene shader lazy animation 
  //  modal light texture animation preview lazy geometry pipeline camera frame route 
  //  matrix material texture vector scene feature camera animation matrix scene plugin 
  //  feature preview vector lazy vector projection projection frame route material plugin 
  //  feature frame animation mesh frame camera camera frame vector plugin route 
  //  quaternion route route route quaternion scene texture vector scene animation quaternion 
  //  feature light route modal projection frame vector texture geometry scene material 
  //  texture pipeline lazy transform animation shader shader scene material matrix feature 
  //  frame pipeline texture frame scene route geometry texture preview animation vector 
  //  scene material shader vector light frame modal geometry mesh camera mesh 
  //  material light route feature material material route projection projection preview feature 
  //  vector route texture render matrix lazy vector pipeline preview vector render 
  //  shader render route preview pipeline lazy feature lazy vector view vector 
  //  route texture lazy plugin texture camera vector geometry mesh texture shader 
  //  feature material scene animation shader render geometry transform feature frame shader 
  //  modal view preview preview feature mesh projection preview shader shader projection 
  //  texture animation texture camera lazy pipeline shader camera frame frame pipeline 
  //  shader vector render texture frame lazy render material light scene transform 
  //  shader light vector matrix mesh animation view preview route vector camera 
  //  frame texture quaternion feature lazy preview mesh camera shader light route 
  //  modal pipeline camera geometry lazy pipeline projection feature plugin geometry light 
  //  route feature camera quaternion scene light render render texture feature view 
  //  modal render vector quaternion quaternion matrix projection shader route modal modal 
  //  light animation pipeline material light quaternion lazy geometry lazy shader transform 
  //  preview pipeline material feature shader light modal modal render quaternion render 
  //  camera render light transform transform
  */
})();

// mod-lazy-0009 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[9] = {
    id: 9,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0009';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '64');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  route vector view matrix pipeline render transform quaternion lazy projection light modal 
  //  render scene route preview route shader view vector geometry frame preview 
  //  animation vector material pipeline animation matrix light modal mesh frame geometry 
  //  matrix matrix material mesh frame matrix material render material camera preview 
  //  projection projection geometry frame camera plugin view scene pipeline quaternion render 
  //  preview mesh light transform light render feature projection view matrix vector 
  //  view preview material scene material matrix vector plugin scene frame render 
  //  animation view route matrix camera geometry mesh matrix projection transform modal 
  //  projection animation plugin lazy feature render modal route matrix camera shader 
  //  plugin texture frame frame material camera matrix quaternion modal lazy light 
  //  preview animation lazy pipeline light light frame texture feature scene scene 
  //  view pipeline projection feature texture modal camera material camera shader lazy 
  //  pipeline mesh matrix texture vector texture projection material render quaternion projection 
  //  camera vector render vector render quaternion scene animation material scene render 
  //  view frame vector transform pipeline modal plugin material lazy frame preview 
  //  animation mesh plugin shader geometry scene texture texture mesh route matrix 
  //  matrix preview material texture light frame geometry view transform texture route 
  //  pipeline quaternion scene matrix mesh projection view animation feature vector frame 
  //  pipeline render render pipeline animation lazy projection view camera transform shader 
  //  geometry shader mesh preview geometry pipeline route matrix animation render quaternion 
  //  feature transform route view animation shader geometry modal quaternion plugin light 
  //  material shader vector camera vector shader matrix shader preview lazy view 
  //  transform feature projection render light geometry modal pipeline modal preview transform 
  //  geometry modal view camera vector mesh material transform modal quaternion mesh 
  //  modal render transform camera lazy scene frame modal material preview vector 
  //  transform render modal preview render animation animation modal scene vector matrix 
  //  pipeline modal plugin shader mesh scene geometry transform render camera modal 
  //  preview pipeline view texture quaternion frame shader frame pipeline plugin view 
  //  preview frame mesh lazy animation pipeline matrix mesh modal feature lazy 
  //  material light texture light vector texture mesh quaternion route feature mesh 
  //  render scene vector shader view quaternion light plugin lazy matrix feature 
  //  pipeline modal preview matrix vector texture lazy animation shader frame geometry 
  //  mesh pipeline shader plugin render render scene vector plugin matrix plugin 
  //  light scene render scene matrix frame geometry view render projection render 
  //  route view view feature projection material camera camera camera animation plugin 
  //  projection render feature lazy mesh vector scene modal lazy frame camera 
  //  matrix material render feature frame transform quaternion pipeline route shader camera 
  //  light lazy modal lazy shader quaternion route route light camera scene 
  //  shader lazy texture light lazy feature pipeline material camera preview feature 
  //  vector pipeline geometry scene matrix view view plugin camera pipeline texture 
  //  quaternion quaternion view transform transform texture projection quaternion view camera transform 
  //  light light render preview texture projection quaternion scene feature pipeline camera 
  //  pipeline route scene quaternion animation render pipeline lazy route material projection 
  //  scene material material quaternion shader texture plugin matrix mesh modal route 
  //  shader route scene view mesh modal preview geometry transform geometry frame 
  //  modal camera frame camera lazy render transform matrix geometry modal lazy 
  //  modal plugin quaternion frame projection shader view scene matrix mesh quaternion 
  //  vector lazy feature scene vector plugin light animation frame route render 
  //  lazy matrix render material light camera texture view animation modal material 
  //  geometry lazy view view geometry view route view render material material 
  //  transform lazy scene route lazy texture render animation render pipeline vector 
  //  render pipeline quaternion quaternion material animation mesh lazy matrix projection vector 
  //  camera matrix camera projection scene quaternion mesh quaternion material mesh route 
  //  texture animation scene route feature texture light shader render frame route 
  //  geometry projection render lazy vector route view geometry camera quaternion light 
  //  vector material modal transform animation light route route modal material mesh 
  //  mesh matrix camera feature mesh mesh matrix render animation projection transform 
  //  material vector material texture camera pipeline texture frame vector transform frame 
  //  material modal matrix camera render scene view geometry quaternion projection route 
  //  plugin preview geometry texture render modal camera material frame vector light 
  //  plugin texture animation view material render route transform render transform pipeline 
  //  quaternion shader vector texture matrix camera scene geometry pipeline pipeline geometry 
  //  camera camera light vector projection frame animation route lazy feature vector 
  //  light quaternion render material route shader frame modal scene projection render 
  //  camera vector shader camera shader lazy modal vector modal animation texture 
  //  vector projection transform render camera geometry matrix render vector matrix animation 
  //  vector light projection pipeline matrix transform texture geometry transform modal preview 
  //  render view route geometry scene vector plugin matrix material vector transform 
  //  animation modal preview route matrix lazy material scene plugin feature light 
  //  light preview scene mesh mesh plugin material pipeline pipeline animation route 
  //  lazy plugin pipeline preview texture transform preview texture animation route light 
  //  render quaternion projection projection transform texture scene geometry view light geometry 
  //  material texture vector material lazy lazy vector transform scene light texture 
  //  transform preview modal pipeline route light feature transform view projection material 
  //  render projection light scene feature frame route material modal shader projection 
  //  preview frame projection light light lazy light scene transform mesh pipeline 
  //  plugin preview route modal route projection transform geometry pipeline plugin animation 
  //  frame animation projection mesh view modal pipeline animation frame vector frame 
  //  feature pipeline render modal plugin view scene pipeline matrix shader view 
  //  material vector frame material projection plugin projection animation projection frame lazy 
  //  preview quaternion plugin view matrix pipeline transform geometry feature animation light 
  //  quaternion modal mesh render render light pipeline material pipeline animation camera 
  //  mesh geometry modal camera texture texture projection vector light vector feature 
  //  vector mesh light lazy transform texture view vector light render pipeline 
  //  texture animation pipeline lazy camera projection texture vector mesh render scene 
  //  projection view transform preview route lazy texture texture quaternion mesh scene 
  //  material texture transform feature material lazy shader camera animation modal vector 
  //  quaternion view render transform route route vector transform light shader camera 
  //  preview mesh light view modal geometry transform quaternion light geometry modal 
  //  mesh pipeline shader shader plugin mesh geometry frame route scene scene 
  //  view modal route camera material matrix geometry transform lazy modal mesh 
  //  camera shader view transform plugin preview matrix shader render view shader 
  //  mesh matrix material shader scene lazy animation material lazy shader vector 
  //  route animation animation matrix transform texture view frame lazy pipeline projection 
  //  lazy pipeline quaternion light route light material pipeline route camera texture 
  //  vector route render quaternion lazy scene projection matrix camera modal light 
  //  frame render matrix mesh material projection scene render material camera texture 
  //  render preview view pipeline render quaternion vector texture scene quaternion view 
  //  pipeline vector preview transform lazy vector feature projection lazy preview matrix 
  //  vector shader quaternion preview texture texture view quaternion animation feature camera 
  //  matrix route projection transform view pipeline geometry matrix quaternion transform geometry 
  //  material modal view preview matrix feature render plugin preview texture animation 
  //  frame quaternion mesh render pipeline view preview transform route preview modal 
  //  lazy modal preview render route shader preview texture frame view material 
  //  preview plugin material view matrix material projection texture texture frame frame 
  //  view frame geometry animation shader matrix scene view pipeline render modal 
  //  shader light vector transform shader shader shader texture geometry camera geometry 
  //  preview vector mesh mesh render plugin vector vector feature preview animation 
  //  frame animation plugin plugin camera feature projection geometry lazy preview view 
  //  mesh plugin projection plugin preview frame feature pipeline texture material material 
  //  scene pipeline scene geometry material projection animation transform matrix route lazy 
  //  route pipeline texture light render matrix quaternion render scene route projection 
  //  geometry lazy geometry animation plugin vector modal preview modal shader camera 
  //  projection camera plugin projection lazy camera preview transform pipeline preview pipeline 
  //  lazy modal texture modal lazy material light transform scene material animation 
  //  shader shader texture feature material geometry scene vector texture light scene 
  //  vector transform pipeline geometry mesh animation geometry quaternion mesh preview camera 
  //  frame transform mesh frame feature modal scene geometry quaternion geometry vector 
  //  projection modal geometry shader light view quaternion route vector modal route 
  //  plugin shader light plugin scene render geometry animation shader modal frame 
  //  vector feature matrix scene material shader light vector quaternion route render 
  //  quaternion texture light camera scene shader lazy feature material view camera 
  //  camera texture animation animation camera quaternion quaternion projection vector pipeline camera 
  //  modal frame pipeline texture material animation matrix quaternion quaternion lazy mesh 
  //  modal scene scene texture projection matrix lazy shader plugin feature preview 
  //  feature scene camera shader material lazy material lazy feature vector scene 
  //  feature route route render camera transform scene texture mesh render geometry 
  //  render transform scene mesh preview geometry transform geometry camera modal mesh 
  //  animation plugin matrix view feature quaternion matrix texture texture preview transform 
  //  light geometry view geometry plugin projection light modal shader modal mesh 
  //  scene pipeline scene route projection geometry projection camera lazy texture preview 
  //  geometry route texture projection render route geometry scene vector vector texture 
  //  feature material transform render animation camera texture transform feature transform camera 
  //  feature lazy scene route animation scene route transform feature texture matrix 
  //  render pipeline mesh pipeline scene mesh modal shader frame animation pipeline 
  //  camera shader vector matrix render plugin geometry texture quaternion camera animation 
  //  matrix mesh quaternion vector shader transform animation render camera plugin render 
  //  transform transform render plugin vector light shader matrix preview feature geometry 
  //  animation material camera light modal material plugin light light render transform 
  //  matrix geometry lazy transform view pipeline route frame render mesh animation 
  //  material preview render plugin vector shader mesh view pipeline route texture 
  //  lazy texture plugin camera projection projection transform plugin mesh projection frame 
  //  matrix camera quaternion texture vector animation plugin route view frame light 
  //  material vector route route matrix material camera camera geometry vector quaternion 
  //  matrix render geometry transform camera
  */
})();

// mod-lazy-0010 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[10] = {
    id: 10,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0010';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '115');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  pipeline modal modal view matrix scene mesh view light view texture vector 
  //  route view modal mesh pipeline material animation pipeline camera mesh plugin 
  //  quaternion mesh projection camera projection light animation shader preview lazy shader 
  //  view shader matrix lazy geometry geometry feature route view vector pipeline 
  //  camera feature texture route route light geometry camera preview quaternion frame 
  //  camera lazy pipeline texture modal plugin projection frame modal preview camera 
  //  frame lazy render modal pipeline light shader projection matrix mesh quaternion 
  //  preview preview plugin transform transform matrix light camera matrix route frame 
  //  quaternion view texture feature render scene render animation scene preview matrix 
  //  lazy camera shader material light projection geometry feature render camera render 
  //  transform view route animation route feature quaternion projection pipeline projection render 
  //  geometry material matrix material animation view view plugin projection shader vector 
  //  view transform matrix geometry projection pipeline animation matrix preview geometry geometry 
  //  frame render view projection animation modal geometry frame matrix lazy render 
  //  mesh route route preview preview texture animation preview quaternion view quaternion 
  //  lazy quaternion preview camera scene modal scene scene route transform shader 
  //  plugin feature preview projection lazy preview texture modal scene scene pipeline 
  //  modal feature animation animation transform plugin camera transform texture view matrix 
  //  lazy texture light camera view animation texture scene view plugin light 
  //  shader pipeline material projection frame quaternion preview feature preview animation transform 
  //  view feature preview view geometry route texture shader geometry camera view 
  //  shader render mesh texture mesh material render scene modal route geometry 
  //  modal quaternion route feature shader preview vector feature mesh frame modal 
  //  mesh lazy feature plugin feature geometry light modal camera geometry transform 
  //  matrix plugin view matrix geometry camera mesh lazy animation transform view 
  //  vector transform view modal texture quaternion render view texture vector material 
  //  render frame shader texture light transform lazy view feature modal vector 
  //  plugin transform matrix view lazy feature preview lazy view quaternion material 
  //  animation plugin quaternion animation geometry mesh matrix geometry projection preview matrix 
  //  route route route shader feature scene render transform material transform quaternion 
  //  pipeline quaternion lazy animation pipeline projection pipeline route light material animation 
  //  preview matrix mesh feature scene view mesh camera view vector projection 
  //  plugin transform lazy transform feature scene camera matrix scene plugin render 
  //  material preview quaternion mesh animation pipeline shader light texture render shader 
  //  feature mesh transform projection light feature plugin plugin matrix view shader 
  //  quaternion pipeline plugin plugin pipeline vector plugin view animation frame mesh 
  //  shader feature frame material material route transform pipeline preview lazy lazy 
  //  plugin transform preview texture mesh projection route quaternion shader mesh projection 
  //  matrix route geometry frame material quaternion light view shader material matrix 
  //  preview feature light light vector plugin render render transform mesh quaternion 
  //  geometry shader material shader transform mesh modal render render view pipeline 
  //  route animation matrix projection camera preview camera quaternion lazy feature feature 
  //  frame lazy projection material plugin view frame route route mesh animation 
  //  view preview view scene render projection camera scene animation scene view 
  //  lazy texture preview quaternion plugin shader shader quaternion quaternion lazy scene 
  //  vector preview feature transform light material camera mesh transform plugin modal 
  //  preview quaternion shader frame route render transform view route projection plugin 
  //  route quaternion scene plugin vector texture texture render render lazy light 
  //  quaternion geometry matrix quaternion projection render quaternion view frame matrix route 
  //  texture route matrix quaternion lazy camera geometry view preview feature view 
  //  plugin frame lazy modal render preview lazy projection lazy plugin lazy 
  //  geometry vector projection shader render texture quaternion camera quaternion plugin matrix 
  //  vector texture texture animation mesh scene shader preview vector material lazy 
  //  plugin transform light animation lazy animation camera plugin mesh modal scene 
  //  light matrix feature projection mesh projection camera geometry matrix mesh transform 
  //  transform route view geometry material material matrix mesh transform mesh vector 
  //  route shader frame view animation render lazy geometry light frame shader 
  //  vector pipeline transform shader modal texture route texture route pipeline shader 
  //  texture pipeline render geometry route render frame geometry scene view shader 
  //  matrix shader frame lazy camera camera plugin projection view preview texture 
  //  render transform plugin texture scene feature mesh pipeline lazy preview preview 
  //  lazy transform geometry preview pipeline render scene frame transform shader plugin 
  //  plugin feature modal matrix texture lazy shader render matrix projection geometry 
  //  camera animation pipeline vector feature scene animation transform animation transform camera 
  //  mesh light pipeline quaternion render camera mesh geometry light material texture 
  //  route camera feature lazy frame matrix render light render plugin mesh 
  //  pipeline camera plugin texture animation vector quaternion vector feature plugin render 
  //  view geometry view shader feature pipeline feature camera transform view light 
  //  vector shader render plugin shader texture quaternion camera plugin camera animation 
  //  shader shader frame route mesh preview modal mesh geometry feature view 
  //  quaternion route pipeline light quaternion projection mesh shader route vector mesh 
  //  animation render view render lazy feature feature preview vector geometry render 
  //  view modal pipeline material preview quaternion route scene view matrix route 
  //  transform animation route lazy geometry projection pipeline vector geometry quaternion pipeline 
  //  route texture geometry material animation texture matrix transform material render modal 
  //  route animation geometry lazy quaternion modal geometry frame feature shader route 
  //  modal route camera route plugin projection light transform light route light 
  //  projection modal view quaternion preview transform feature projection feature texture vector 
  //  view pipeline modal preview preview modal transform geometry geometry shader modal 
  //  geometry render modal route transform matrix animation pipeline shader texture animation 
  //  modal render preview transform geometry view view light view projection projection 
  //  shader feature vector pipeline lazy preview scene camera transform light lazy 
  //  geometry render matrix animation preview lazy geometry material transform quaternion light 
  //  route route feature preview vector projection plugin camera feature lazy render 
  //  texture shader material vector frame transform light shader preview modal render 
  //  mesh geometry render render route view frame light animation projection light 
  //  scene vector preview geometry modal quaternion route scene lazy lazy preview 
  //  vector route lazy preview texture pipeline scene geometry vector preview material 
  //  frame material vector projection animation geometry modal route modal feature vector 
  //  view route modal camera light light feature light projection shader projection 
  //  plugin mesh scene texture quaternion projection modal route mesh route plugin 
  //  light lazy animation mesh camera frame projection frame render shader light 
  //  feature quaternion quaternion mesh light plugin pipeline lazy preview vector light 
  //  preview quaternion plugin mesh material mesh route vector view animation animation 
  //  plugin light geometry geometry pipeline lazy preview frame camera texture feature 
  //  feature vector material texture modal camera quaternion quaternion quaternion plugin texture 
  //  scene camera geometry animation camera plugin route lazy quaternion light camera 
  //  projection light frame plugin modal shader projection render transform mesh light 
  //  geometry modal projection matrix projection matrix camera render vector scene lazy 
  //  projection route animation mesh texture scene view frame shader pipeline plugin 
  //  matrix texture preview transform frame modal transform feature animation preview transform 
  //  vector lazy preview render transform mesh modal animation view shader scene 
  //  vector feature material frame shader plugin shader quaternion lazy mesh transform 
  //  transform texture shader pipeline geometry lazy render animation preview geometry animation 
  //  matrix render material transform camera modal preview view camera animation projection 
  //  geometry view lazy pipeline preview plugin view geometry route preview view 
  //  scene view view projection vector material modal view projection plugin plugin 
  //  material scene geometry view view camera frame geometry feature geometry camera 
  //  preview shader camera render route scene texture route transform texture pipeline 
  //  texture vector lazy scene material texture plugin vector pipeline plugin pipeline 
  //  camera pipeline scene frame shader plugin texture matrix feature view preview 
  //  vector geometry shader transform animation camera view projection vector lazy pipeline 
  //  quaternion matrix mesh feature plugin transform light geometry vector geometry render 
  //  preview preview texture modal vector animation projection texture light transform vector 
  //  pipeline transform pipeline mesh scene render shader feature transform scene shader 
  //  preview camera matrix render lazy quaternion projection matrix view scene shader 
  //  feature feature camera matrix matrix render transform route plugin frame render 
  //  material shader mesh material animation matrix render camera projection quaternion feature 
  //  texture pipeline frame pipeline transform modal geometry route geometry quaternion preview 
  //  material feature mesh quaternion scene material projection transform view camera feature 
  //  matrix texture preview view scene light material transform route render texture 
  //  modal mesh material quaternion shader projection lazy texture preview feature render 
  //  transform projection transform frame pipeline vector render render projection route lazy 
  //  projection shader route shader view pipeline modal lazy camera preview route 
  //  lazy matrix light preview mesh mesh lazy projection plugin projection quaternion 
  //  projection mesh view geometry scene vector frame projection animation vector feature 
  //  feature camera light modal view texture projection scene lazy vector matrix 
  //  lazy preview route shader geometry modal plugin mesh preview projection light 
  //  camera camera light transform shader frame quaternion preview mesh material route 
  //  camera geometry plugin plugin transform scene mesh geometry texture shader lazy 
  //  vector pipeline preview light texture feature mesh camera projection matrix render 
  //  view light matrix matrix transform plugin lazy matrix preview plugin animation 
  //  scene animation view lazy animation lazy quaternion lazy frame vector render 
  //  geometry frame animation geometry animation modal geometry geometry geometry pipeline camera 
  //  material scene frame projection geometry transform texture modal projection projection render 
  //  feature view texture frame vector animation shader render light modal quaternion 
  //  pipeline vector quaternion plugin geometry light feature light feature camera mesh 
  //  animation lazy animation plugin light modal plugin matrix scene matrix animation 
  //  preview shader shader lazy mesh quaternion projection plugin quaternion pipeline frame 
  //  route route camera vector texture animation lazy pipeline camera light preview 
  //  lazy render feature view animation shader mesh modal modal material feature 
  //  modal frame camera modal quaternion geometry view matrix mesh mesh light 
  //  geometry plugin camera render render lazy scene geometry preview preview quaternion 
  //  transform transform render vector texture geometry render feature mesh shader camera 
  //  material route preview
  */
})();

// mod-lazy-0011 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[11] = {
    id: 11,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0011';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '139');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  render projection texture shader lazy render plugin texture camera feature view frame 
  //  material light view material feature pipeline view vector scene texture frame 
  //  quaternion lazy pipeline transform view pipeline texture vector light projection matrix 
  //  mesh matrix light frame feature plugin vector route animation texture scene 
  //  matrix transform transform projection shader mesh plugin view pipeline transform lazy 
  //  matrix texture scene animation camera shader scene vector light camera preview 
  //  light shader matrix lazy matrix feature texture animation shader light route 
  //  render mesh preview feature geometry matrix scene shader camera feature camera 
  //  mesh matrix modal mesh feature plugin texture transform feature shader plugin 
  //  mesh render quaternion material view lazy geometry modal mesh camera preview 
  //  transform mesh shader pipeline route vector material view mesh pipeline render 
  //  geometry pipeline geometry lazy route camera matrix quaternion camera route shader 
  //  preview feature quaternion geometry transform shader render vector view pipeline view 
  //  view route frame texture vector mesh vector feature material material material 
  //  light texture projection shader plugin preview lazy modal quaternion projection pipeline 
  //  feature geometry geometry plugin mesh lazy scene light pipeline lazy mesh 
  //  matrix light mesh transform animation plugin material transform scene light geometry 
  //  vector frame modal mesh modal view transform material transform camera view 
  //  feature mesh vector preview matrix plugin light frame camera animation feature 
  //  feature geometry animation render transform frame material pipeline vector light light 
  //  quaternion shader feature transform animation route texture scene animation matrix view 
  //  material geometry frame frame plugin transform plugin preview mesh matrix render 
  //  plugin lazy projection route mesh quaternion shader view vector route mesh 
  //  lazy frame plugin matrix plugin texture light texture light geometry light 
  //  scene route shader pipeline feature camera mesh plugin frame matrix plugin 
  //  camera feature route light route animation scene projection frame preview light 
  //  scene render plugin plugin feature frame lazy material geometry scene mesh 
  //  frame shader render preview frame camera material animation transform animation render 
  //  mesh preview route mesh animation vector lazy modal route projection matrix 
  //  feature projection view route render view quaternion shader route material plugin 
  //  animation vector preview plugin material frame texture geometry modal animation lazy 
  //  lazy geometry camera mesh shader geometry plugin matrix animation vector texture 
  //  vector shader matrix mesh preview frame transform scene transform lazy geometry 
  //  mesh light camera pipeline scene camera material vector animation mesh view 
  //  transform texture geometry plugin texture modal animation light preview shader lazy 
  //  geometry scene preview geometry vector shader lazy scene preview shader plugin 
  //  pipeline light transform camera scene frame projection light view scene modal 
  //  modal quaternion frame mesh shader projection frame camera projection lazy shader 
  //  quaternion frame pipeline route geometry route pipeline vector shader matrix shader 
  //  geometry light projection route plugin view plugin frame quaternion camera route 
  //  geometry route shader camera pipeline quaternion pipeline view camera pipeline quaternion 
  //  shader feature plugin render scene render geometry route quaternion lazy texture 
  //  projection preview matrix quaternion projection frame material transform shader feature transform 
  //  material projection animation scene modal view material frame light camera scene 
  //  render frame shader texture route feature transform pipeline lazy render route 
  //  scene material material shader matrix feature light light mesh preview geometry 
  //  quaternion matrix scene geometry preview feature plugin geometry quaternion view view 
  //  pipeline transform scene render animation lazy render texture matrix texture view 
  //  preview camera transform material camera mesh scene feature pipeline matrix scene 
  //  frame mesh geometry projection mesh plugin preview light texture projection material 
  //  lazy vector view scene projection texture light scene quaternion route transform 
  //  quaternion light animation texture mesh render quaternion modal feature geometry feature 
  //  camera texture view modal geometry quaternion mesh plugin modal shader geometry 
  //  lazy render geometry render feature animation quaternion scene modal quaternion camera 
  //  scene render projection feature material material quaternion render animation lazy preview 
  //  view preview pipeline frame camera texture scene material scene camera quaternion 
  //  texture frame scene route view modal animation matrix transform frame vector 
  //  feature pipeline projection camera texture frame geometry texture geometry material view 
  //  camera pipeline material lazy route animation camera feature camera camera quaternion 
  //  shader route projection matrix mesh quaternion mesh texture vector shader transform 
  //  quaternion preview frame projection texture transform camera feature modal matrix pipeline 
  //  texture feature camera transform preview matrix lazy transform preview render lazy 
  //  camera transform lazy texture scene animation scene material pipeline scene route 
  //  preview frame quaternion route render quaternion quaternion matrix vector view route 
  //  mesh geometry animation view material camera lazy texture material geometry light 
  //  plugin matrix animation transform preview render plugin preview mesh mesh mesh 
  //  pipeline geometry preview frame render vector scene preview feature preview scene 
  //  geometry quaternion route quaternion scene render modal modal render animation material 
  //  mesh feature quaternion pipeline light vector light camera lazy transform texture 
  //  mesh matrix lazy lazy material texture preview plugin preview vector pipeline 
  //  camera shader preview shader quaternion camera plugin view texture projection material 
  //  matrix pipeline quaternion route quaternion route light modal route feature light 
  //  view animation matrix quaternion frame scene lazy shader pipeline quaternion lazy 
  //  vector modal camera camera transform feature geometry lazy transform vector mesh 
  //  light plugin matrix shader material feature quaternion plugin mesh mesh shader 
  //  frame view light material render frame texture texture geometry modal frame 
  //  camera preview view transform shader quaternion mesh material route pipeline feature 
  //  plugin material preview camera animation matrix projection preview feature plugin transform 
  //  mesh material frame shader matrix feature projection matrix material projection pipeline 
  //  frame plugin texture matrix view camera transform light view shader material 
  //  material preview modal projection scene modal route scene matrix matrix frame 
  //  view scene feature animation camera light modal matrix projection mesh light 
  //  light shader mesh shader texture plugin scene route scene camera preview 
  //  render vector scene material render matrix shader view render preview preview 
  //  preview modal plugin scene lazy scene lazy preview frame projection lazy 
  //  frame transform matrix projection scene preview modal view plugin vector plugin 
  //  frame vector render frame scene route light shader animation feature animation 
  //  vector animation quaternion vector material view camera quaternion camera material light 
  //  modal animation light matrix light modal vector light animation shader transform 
  //  preview animation shader mesh camera frame animation render feature feature material 
  //  view projection feature preview pipeline matrix feature view projection scene feature 
  //  shader scene frame animation vector view shader plugin vector vector feature 
  //  route feature lazy material scene transform route mesh material render mesh 
  //  projection frame projection vector mesh quaternion material route camera preview camera 
  //  animation animation material view texture texture geometry material camera scene frame 
  //  projection camera transform view camera vector vector modal preview matrix view 
  //  frame plugin pipeline matrix camera preview scene route animation pipeline scene 
  //  quaternion light preview shader preview render projection animation animation modal view 
  //  quaternion geometry render scene vector shader feature camera projection texture camera 
  //  quaternion transform view geometry camera view texture frame route frame pipeline 
  //  preview view plugin camera pipeline vector lazy light camera texture scene 
  //  modal feature feature light route mesh scene lazy view view scene 
  //  matrix projection lazy animation shader mesh quaternion light frame transform light 
  //  vector camera render plugin quaternion lazy frame frame feature route projection 
  //  matrix frame plugin shader route geometry modal frame mesh lazy vector 
  //  material transform geometry geometry geometry pipeline material material shader render animation 
  //  render modal view pipeline view shader view scene light pipeline frame 
  //  transform vector mesh animation shader texture plugin modal light render lazy 
  //  render route pipeline lazy feature camera lazy plugin material transform mesh 
  //  texture modal plugin transform modal scene geometry vector scene projection frame 
  //  material view lazy render matrix route plugin vector texture camera scene 
  //  projection preview vector modal route modal projection light transform pipeline transform 
  //  transform preview camera light frame light matrix shader modal feature projection 
  //  lazy material material feature scene geometry view camera route vector mesh 
  //  projection mesh quaternion view lazy frame material material geometry pipeline scene 
  //  scene scene geometry frame light camera preview animation matrix camera vector 
  //  animation route scene geometry pipeline projection animation feature preview material mesh 
  //  lazy vector material preview shader geometry vector mesh vector geometry preview 
  //  vector animation shader matrix frame material light transform shader modal shader 
  //  light texture animation route camera shader material texture preview animation modal 
  //  view route material matrix matrix vector quaternion feature lazy preview pipeline 
  //  texture view view scene lazy scene pipeline transform vector geometry pipeline 
  //  vector view camera feature quaternion camera transform quaternion geometry mesh geometry 
  //  view lazy matrix view frame animation preview plugin render animation mesh 
  //  quaternion view lazy projection matrix feature light material frame geometry quaternion 
  //  mesh projection quaternion pipeline material animation projection render transform route texture 
  //  lazy geometry shader projection camera shader vector quaternion lazy material animation 
  //  frame geometry modal light transform lazy lazy texture camera transform animation 
  //  texture render view vector animation material vector geometry projection material texture 
  //  shader texture plugin route transform route pipeline route shader pipeline pipeline 
  //  lazy transform pipeline frame scene render geometry animation pipeline quaternion plugin 
  //  vector texture plugin frame route frame view scene matrix camera vector 
  //  lazy quaternion material modal feature light transform transform geometry quaternion plugin 
  //  render feature feature quaternion lazy lazy scene matrix feature light feature 
  //  frame shader plugin scene camera lazy shader lazy feature plugin texture 
  //  quaternion shader render animation feature feature view vector projection transform matrix 
  //  light matrix shader light animation route preview lazy lazy shader quaternion 
  //  transform render projection geometry transform lazy shader quaternion modal matrix scene 
  //  mesh preview material route animation view modal shader texture quaternion vector 
  //  plugin feature quaternion light camera material route geometry lazy material view 
  //  texture frame route view modal preview texture preview pipeline scene feature 
  //  transform geometry modal geometry texture matrix frame frame matrix view mesh 
  //  geometry vector render camera plugin render render geometry geometry view lazy 
  //  animation view mesh animation animation route light texture preview frame route 
  //  render plugin preview modal plugin modal plugin vector lazy camera vector 
  //  matrix mesh transform pipeline
  */
})();

// mod-lazy-0012 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[12] = {
    id: 12,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0012';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '214');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  matrix texture mesh preview feature light render scene preview texture render lazy 
  //  mesh animation route texture scene shader animation texture view transform transform 
  //  light modal route quaternion modal route animation scene render light view 
  //  scene plugin modal lazy modal camera lazy shader lazy feature mesh 
  //  route matrix lazy scene texture vector scene camera modal preview camera 
  //  render route quaternion geometry view feature camera geometry lazy mesh camera 
  //  texture transform camera projection scene geometry camera camera transform quaternion render 
  //  modal transform light quaternion view view shader route render light lazy 
  //  light render view modal mesh texture view render feature feature route 
  //  material plugin modal render transform view matrix projection camera shader geometry 
  //  render quaternion material quaternion light frame view quaternion matrix light vector 
  //  scene feature feature render material texture texture texture frame camera vector 
  //  geometry preview shader lazy material transform lazy animation geometry scene pipeline 
  //  feature camera frame geometry scene matrix light mesh lazy animation shader 
  //  render modal projection matrix matrix pipeline light preview transform geometry frame 
  //  modal preview render modal frame animation camera texture plugin transform vector 
  //  pipeline frame lazy pipeline pipeline camera modal geometry material projection animation 
  //  quaternion matrix texture frame scene projection feature lazy mesh modal pipeline 
  //  preview vector scene modal plugin lazy route mesh modal matrix pipeline 
  //  light geometry texture route quaternion geometry vector matrix camera scene route 
  //  texture scene view texture lazy material texture view route light transform 
  //  geometry quaternion light camera vector view transform render view light material 
  //  animation feature projection light frame preview light geometry pipeline scene scene 
  //  frame scene plugin projection matrix transform projection geometry quaternion animation scene 
  //  matrix feature texture feature render render scene geometry animation matrix scene 
  //  mesh projection projection mesh geometry quaternion animation frame lazy matrix shader 
  //  matrix plugin scene texture plugin light projection projection light modal vector 
  //  frame mesh animation plugin camera quaternion camera route transform material matrix 
  //  scene frame preview vector mesh shader matrix transform render modal mesh 
  //  plugin render vector pipeline feature modal material render route plugin feature 
  //  lazy render shader quaternion texture feature projection shader route mesh transform 
  //  plugin shader feature mesh camera view view geometry vector mesh route 
  //  route frame frame matrix lazy shader quaternion feature lazy quaternion texture 
  //  plugin route material animation route preview frame feature mesh texture geometry 
  //  route vector pipeline geometry animation pipeline render mesh camera render vector 
  //  texture geometry light shader light modal render quaternion matrix preview lazy 
  //  plugin scene texture render render matrix texture view transform pipeline shader 
  //  material quaternion render mesh material projection modal feature matrix quaternion scene 
  //  lazy camera view camera scene camera texture shader mesh preview render 
  //  light transform plugin camera animation route quaternion preview light route vector 
  //  feature route feature scene matrix preview route modal texture light transform 
  //  camera material frame projection modal transform feature animation scene texture light 
  //  quaternion view scene render pipeline shader preview transform shader matrix geometry 
  //  shader view mesh plugin light mesh texture animation vector feature light 
  //  plugin lazy geometry pipeline camera material modal route plugin transform feature 
  //  animation modal vector preview scene route view quaternion geometry frame frame 
  //  geometry light geometry vector texture mesh shader mesh modal transform transform 
  //  frame light camera view geometry render frame feature animation texture shader 
  //  frame pipeline view transform preview modal scene texture matrix preview transform 
  //  camera render transform view quaternion transform light geometry feature vector lazy 
  //  animation material shader route scene frame feature modal quaternion scene lazy 
  //  render modal modal material projection quaternion material animation pipeline plugin matrix 
  //  plugin texture camera geometry matrix frame plugin matrix scene shader modal 
  //  matrix shader vector render transform transform render mesh modal quaternion light 
  //  projection matrix plugin preview frame route transform lazy route modal quaternion 
  //  vector plugin render geometry texture material lazy pipeline matrix plugin scene 
  //  view scene plugin projection matrix lazy camera camera transform transform quaternion 
  //  projection preview shader geometry scene light pipeline material scene preview route 
  //  camera preview scene quaternion scene route light feature pipeline vector modal 
  //  camera texture plugin light shader shader lazy quaternion plugin view view 
  //  view modal view render preview mesh scene camera render preview feature 
  //  mesh camera vector matrix frame material frame light preview material render 
  //  light feature quaternion render transform modal frame view texture matrix lazy 
  //  vector mesh view geometry quaternion texture view vector mesh vector preview 
  //  transform matrix frame modal lazy preview frame scene matrix shader modal 
  //  scene animation view light feature scene material render material camera vector 
  //  animation preview shader lazy frame route pipeline modal route preview shader 
  //  frame vector projection animation pipeline mesh mesh plugin view render geometry 
  //  shader vector pipeline geometry plugin mesh view plugin feature plugin camera 
  //  shader camera texture pipeline preview modal frame feature feature shader modal 
  //  camera pipeline vector route lazy transform scene material matrix pipeline scene 
  //  render texture camera pipeline light quaternion pipeline geometry projection feature shader 
  //  quaternion render transform lazy preview mesh camera feature feature lazy light 
  //  frame scene feature animation shader view quaternion shader plugin pipeline animation 
  //  lazy animation preview light quaternion preview plugin transform preview quaternion preview 
  //  vector feature vector lazy animation view material preview projection preview mesh 
  //  pipeline feature transform projection route render animation frame frame scene lazy 
  //  light frame preview feature projection route shader pipeline modal geometry transform 
  //  feature light preview camera shader shader shader scene shader lazy mesh 
  //  vector lazy view plugin preview texture geometry preview matrix plugin material 
  //  pipeline vector texture modal material feature texture light route frame projection 
  //  projection material feature scene lazy projection transform lazy plugin modal animation 
  //  modal preview view pipeline animation texture lazy material plugin vector route 
  //  scene feature camera render scene light pipeline quaternion scene geometry scene 
  //  material plugin transform feature modal transform route frame view texture mesh 
  //  pipeline plugin matrix projection view render vector render preview texture pipeline 
  //  modal modal camera view animation frame preview quaternion transform frame animation 
  //  shader preview modal feature geometry route camera matrix geometry projection projection 
  //  light preview frame matrix texture preview view projection pipeline projection camera 
  //  material plugin lazy camera pipeline material material geometry mesh geometry material 
  //  pipeline projection pipeline view projection modal route material render frame texture 
  //  route projection route light shader plugin plugin route shader texture feature 
  //  matrix shader scene modal preview preview light projection material projection view 
  //  quaternion camera route mesh feature vector mesh route view quaternion light 
  //  geometry geometry matrix vector projection render material render preview pipeline light 
  //  matrix frame geometry light modal preview material camera vector mesh quaternion 
  //  mesh pipeline transform preview matrix route scene matrix feature light camera 
  //  preview transform matrix vector geometry lazy animation quaternion light preview matrix 
  //  mesh projection feature geometry shader texture frame quaternion route material camera 
  //  lazy shader scene material transform shader view frame view scene geometry 
  //  projection vector feature scene frame lazy quaternion render mesh shader route 
  //  render preview preview view light frame scene light modal scene vector 
  //  texture view light preview mesh light preview light transform animation mesh 
  //  render transform feature pipeline transform mesh lazy frame render lazy camera 
  //  quaternion matrix mesh plugin texture quaternion mesh frame pipeline shader texture 
  //  light shader shader modal quaternion texture preview preview feature render geometry 
  //  frame pipeline scene lazy animation transform texture lazy pipeline render route 
  //  matrix render pipeline modal scene view render preview feature scene lazy 
  //  matrix transform projection pipeline preview quaternion animation material mesh material pipeline 
  //  frame light transform material lazy route geometry animation light geometry shader 
  //  scene lazy shader plugin quaternion plugin lazy render lazy modal render 
  //  camera route geometry camera preview projection modal frame matrix projection animation 
  //  light projection animation plugin render texture animation lazy lazy texture preview 
  //  transform plugin light scene route preview transform quaternion view frame light 
  //  feature modal scene matrix frame feature quaternion texture camera matrix view 
  //  projection render texture geometry frame matrix lazy mesh geometry feature scene 
  //  feature preview geometry plugin camera render modal scene lazy transform quaternion 
  //  material matrix mesh frame animation modal frame render geometry quaternion feature 
  //  modal material texture preview projection preview feature lazy light route vector 
  //  scene shader animation render texture view preview matrix view texture texture 
  //  geometry view pipeline lazy quaternion preview quaternion scene transform quaternion preview 
  //  projection render feature geometry light matrix camera camera render feature shader 
  //  route transform matrix frame transform geometry feature scene shader mesh vector 
  //  vector quaternion projection scene animation shader render frame plugin geometry camera 
  //  material scene shader animation animation route feature material camera preview vector 
  //  shader pipeline lazy route projection feature modal plugin route animation lazy 
  //  vector light camera render shader frame route light render light view 
  //  geometry pipeline animation animation plugin camera animation texture texture view texture 
  //  matrix shader vector scene frame vector light pipeline shader view projection 
  //  view projection texture camera mesh matrix modal projection plugin route route 
  //  route matrix feature transform camera transform pipeline transform lazy projection lazy 
  //  shader camera scene projection pipeline frame modal plugin animation projection lazy 
  //  render scene mesh render view geometry frame lazy lazy pipeline feature 
  //  shader light render preview material modal pipeline render view lazy texture 
  //  frame quaternion light feature projection texture frame material camera render material 
  //  render lazy light camera frame geometry route projection animation vector preview 
  //  camera lazy mesh camera preview vector quaternion material frame geometry frame 
  //  pipeline preview mesh texture material quaternion modal projection feature mesh modal 
  //  render route view mesh route material scene light render plugin feature 
  //  material projection pipeline material shader matrix texture feature frame animation view 
  //  transform quaternion mesh preview route quaternion preview light animation quaternion vector 
  //  modal render matrix route transform texture frame mesh shader lazy light 
  //  route texture material shader animation projection scene pipeline shader render preview 
  //  render projection light camera matrix preview feature frame preview quaternion plugin 
  //  feature shader shader quaternion pipeline plugin shader render shader material frame 
  //  projection geometry shader scene transform
  */
})();

// mod-lazy-0013 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[13] = {
    id: 13,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0013';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '246');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  preview frame mesh route projection quaternion camera material plugin projection geometry mesh 
  //  lazy lazy geometry modal preview view vector transform matrix scene pipeline 
  //  plugin camera view view feature render texture projection view view animation 
  //  transform texture feature light light transform plugin render light frame route 
  //  matrix pipeline transform animation projection camera light feature mesh vector texture 
  //  matrix animation render shader shader mesh transform preview texture render route 
  //  camera material projection plugin lazy mesh pipeline camera mesh texture vector 
  //  geometry modal shader animation route mesh camera modal vector feature modal 
  //  lazy transform lazy lazy transform frame view pipeline preview route shader 
  //  projection view feature geometry light modal camera route material camera view 
  //  projection feature render view light animation material lazy feature modal transform 
  //  plugin preview scene pipeline animation geometry shader pipeline light feature geometry 
  //  geometry geometry preview light feature scene plugin pipeline quaternion preview material 
  //  feature material texture preview projection render animation vector lazy camera plugin 
  //  lazy feature transform scene animation shader mesh feature shader transform view 
  //  modal camera material pipeline texture quaternion material scene vector geometry feature 
  //  feature modal frame plugin matrix pipeline plugin plugin texture render camera 
  //  animation light mesh view vector shader render projection camera pipeline pipeline 
  //  lazy matrix pipeline scene transform modal pipeline vector texture texture matrix 
  //  light lazy modal route matrix view shader matrix material transform route 
  //  light route transform mesh animation shader preview camera shader texture camera 
  //  quaternion projection texture lazy frame texture geometry render render shader camera 
  //  scene shader animation mesh camera frame frame plugin matrix light modal 
  //  matrix route preview matrix shader light scene transform material lazy geometry 
  //  matrix pipeline texture pipeline texture frame preview lazy lazy mesh texture 
  //  transform shader vector pipeline transform camera pipeline texture preview material vector 
  //  texture geometry plugin plugin light camera animation texture quaternion vector texture 
  //  pipeline route preview frame modal projection geometry scene light preview feature 
  //  material feature frame scene shader material shader vector modal modal frame 
  //  projection frame render preview pipeline matrix scene lazy frame plugin light 
  //  quaternion lazy route texture pipeline camera light scene render animation animation 
  //  preview preview frame route projection quaternion camera route texture render view 
  //  preview animation material view scene material light mesh texture texture material 
  //  render feature camera camera feature matrix shader modal transform vector quaternion 
  //  render projection projection geometry lazy shader transform matrix projection projection render 
  //  camera pipeline texture geometry light feature scene geometry projection shader transform 
  //  transform frame scene scene route modal mesh modal frame frame pipeline 
  //  texture quaternion plugin camera shader matrix pipeline feature projection matrix lazy 
  //  geometry frame shader geometry mesh light mesh view render material transform 
  //  projection pipeline shader matrix scene shader shader modal route texture camera 
  //  shader render plugin scene scene matrix modal modal modal animation modal 
  //  projection mesh texture animation modal mesh quaternion quaternion render preview feature 
  //  matrix material vector scene matrix mesh scene matrix texture route vector 
  //  pipeline modal route mesh plugin preview shader mesh scene camera render 
  //  animation mesh matrix texture texture animation mesh matrix transform plugin material 
  //  transform lazy modal material plugin matrix preview projection lazy light frame 
  //  plugin mesh animation transform plugin route quaternion lazy mesh camera transform 
  //  frame quaternion modal camera feature projection quaternion transform plugin material geometry 
  //  frame scene view modal quaternion animation plugin feature geometry material feature 
  //  view plugin transform view vector render route texture quaternion transform quaternion 
  //  route geometry geometry feature projection view camera transform vector matrix material 
  //  texture route projection quaternion scene feature modal transform texture matrix render 
  //  pipeline render quaternion projection light texture frame material render pipeline animation 
  //  camera material animation light shader modal projection camera projection modal vector 
  //  render transform feature texture geometry frame geometry geometry mesh transform shader 
  //  matrix render geometry frame transform projection matrix feature texture light quaternion 
  //  animation matrix shader matrix frame modal mesh frame mesh shader material 
  //  quaternion view render render light material feature texture pipeline modal modal 
  //  vector matrix vector modal modal matrix mesh quaternion lazy camera lazy 
  //  material scene projection plugin frame light frame shader quaternion shader shader 
  //  camera texture light view plugin geometry shader light frame light transform 
  //  matrix scene material geometry projection render geometry animation vector material light 
  //  feature modal animation feature frame modal mesh mesh camera projection vector 
  //  plugin quaternion animation shader route projection mesh shader animation matrix matrix 
  //  preview mesh frame modal quaternion geometry plugin camera render preview animation 
  //  material transform material projection projection preview modal route animation preview pipeline 
  //  matrix matrix preview plugin shader material mesh view geometry lazy plugin 
  //  quaternion lazy quaternion shader view projection view quaternion transform texture animation 
  //  quaternion vector plugin vector matrix geometry animation texture render plugin material 
  //  shader view frame geometry pipeline shader projection material view feature pipeline 
  //  camera vector geometry camera scene preview geometry scene geometry route frame 
  //  render light route shader frame pipeline pipeline geometry route lazy preview 
  //  material material view matrix lazy quaternion shader feature preview texture mesh 
  //  transform render material feature scene feature projection light render scene frame 
  //  feature projection texture lazy material light camera mesh frame animation preview 
  //  projection pipeline feature plugin vector material light render projection scene modal 
  //  geometry feature route modal modal route geometry view route texture plugin 
  //  texture mesh camera matrix matrix scene frame texture route light scene 
  //  scene route feature route preview frame preview material frame view texture 
  //  transform camera geometry camera plugin mesh light lazy render frame pipeline 
  //  light view plugin material material feature matrix camera shader render projection 
  //  transform camera preview feature preview light geometry plugin route view transform 
  //  texture plugin scene light texture geometry shader vector preview quaternion pipeline 
  //  geometry light preview material preview geometry material projection mesh quaternion matrix 
  //  scene material render projection render plugin view feature texture mesh animation 
  //  matrix camera camera lazy light quaternion mesh vector pipeline plugin geometry 
  //  geometry light projection frame plugin transform mesh geometry modal geometry geometry 
  //  render frame shader matrix texture route vector animation pipeline geometry view 
  //  matrix feature matrix matrix animation projection transform transform projection mesh lazy 
  //  render route mesh feature modal route material quaternion light animation matrix 
  //  material frame mesh pipeline view transform projection matrix scene transform matrix 
  //  light mesh shader light render camera animation render view quaternion modal 
  //  animation frame pipeline plugin view preview matrix mesh view plugin light 
  //  camera material material projection material geometry scene geometry frame feature render 
  //  texture preview matrix scene modal frame scene lazy render render texture 
  //  scene route modal geometry mesh preview render matrix vector feature render 
  //  mesh matrix transform lazy scene pipeline frame animation projection preview frame 
  //  camera camera texture modal shader camera mesh projection view light plugin 
  //  render animation projection matrix geometry view route geometry preview transform animation 
  //  frame plugin render geometry view vector feature camera mesh lazy texture 
  //  modal matrix modal route view feature matrix lazy projection mesh shader 
  //  feature camera render geometry plugin light feature pipeline shader render modal 
  //  modal camera camera quaternion light frame route lazy quaternion preview feature 
  //  modal camera light modal pipeline scene material frame material texture matrix 
  //  pipeline preview transform plugin transform quaternion feature vector transform render modal 
  //  quaternion view feature light light quaternion pipeline lazy material geometry camera 
  //  shader route texture preview pipeline render texture transform plugin camera render 
  //  pipeline camera vector light matrix texture matrix pipeline view view shader 
  //  projection material light view mesh texture view view animation frame pipeline 
  //  mesh geometry camera shader view matrix pipeline feature plugin matrix lazy 
  //  animation mesh shader preview projection feature light plugin frame mesh scene 
  //  render material pipeline render shader transform light mesh camera transform feature 
  //  shader animation frame feature material lazy lazy route render camera view 
  //  preview view lazy matrix animation geometry pipeline transform transform material transform 
  //  route plugin material mesh geometry plugin texture view preview plugin scene 
  //  view matrix projection mesh pipeline animation feature light frame geometry light 
  //  mesh vector camera camera route render vector render material feature mesh 
  //  camera light route route lazy transform transform route pipeline lazy material 
  //  material lazy view preview plugin render modal animation transform pipeline vector 
  //  frame plugin material frame scene material plugin frame route pipeline preview 
  //  quaternion geometry geometry texture render frame material plugin route texture material 
  //  lazy lazy transform camera view shader route scene animation matrix view 
  //  render feature plugin shader render lazy plugin texture lazy feature camera 
  //  geometry feature modal texture render matrix matrix material plugin scene preview 
  //  frame shader matrix light geometry light quaternion mesh texture scene route 
  //  light vector projection scene light material projection light modal light pipeline 
  //  lazy lazy route frame camera texture matrix geometry quaternion shader plugin 
  //  shader light plugin route mesh lazy projection lazy light mesh camera 
  //  lazy shader render material lazy quaternion scene matrix route feature light 
  //  route lazy transform render vector route modal frame projection feature modal 
  //  light geometry matrix plugin feature lazy vector texture texture preview material 
  //  mesh frame shader animation mesh projection light feature camera frame lazy 
  //  quaternion geometry camera route matrix texture render vector projection frame camera 
  //  frame lazy shader frame feature camera preview vector texture frame mesh 
  //  scene scene light scene frame light render light render lazy animation 
  //  frame camera material light plugin texture projection texture feature geometry plugin 
  //  quaternion matrix pipeline light texture lazy quaternion frame plugin transform texture 
  //  view texture scene lazy animation route animation geometry modal material geometry 
  //  projection frame projection material projection render render animation transform frame projection 
  //  texture modal modal scene light vector light plugin route animation camera 
  //  quaternion frame geometry texture plugin feature feature light geometry frame quaternion 
  //  vector quaternion lazy pipeline view preview transform preview mesh scene mesh 
  //  view light render scene view transform geometry light lazy lazy route 
  //  feature preview camera plugin light route material geometry animation material pipeline 
  //  scene material scene route light plugin view texture pipeline lazy animation 
  //  mesh
  */
})();

// mod-lazy-0014 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[14] = {
    id: 14,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0014';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '47');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  texture pipeline render lazy feature projection vector scene preview transform lazy quaternion 
  //  frame lazy camera shader lazy animation feature frame shader plugin quaternion 
  //  plugin pipeline pipeline material animation transform lazy shader quaternion view lazy 
  //  render route material shader route feature geometry texture light route frame 
  //  mesh scene pipeline lazy projection transform view projection mesh frame projection 
  //  transform texture vector mesh geometry modal plugin vector transform pipeline vector 
  //  geometry light preview feature view projection lazy camera route feature animation 
  //  projection camera preview pipeline light transform material transform scene transform lazy 
  //  modal geometry camera mesh quaternion view modal frame feature feature view 
  //  view feature plugin vector route transform view feature modal projection scene 
  //  view texture modal geometry animation vector projection pipeline matrix projection lazy 
  //  shader preview projection modal lazy transform route matrix feature view animation 
  //  light render transform mesh plugin lazy animation pipeline vector vector route 
  //  transform texture mesh animation geometry pipeline view pipeline plugin animation render 
  //  plugin scene pipeline material route light matrix view preview transform light 
  //  matrix projection matrix quaternion preview preview route camera preview scene mesh 
  //  preview plugin view shader camera modal mesh mesh light light vector 
  //  feature transform route frame shader vector preview light geometry render plugin 
  //  route frame shader feature light mesh quaternion shader frame modal preview 
  //  pipeline material pipeline shader animation plugin route view route pipeline light 
  //  frame animation quaternion camera render geometry shader animation material animation material 
  //  quaternion vector lazy view plugin shader geometry pipeline transform light preview 
  //  projection feature scene scene lazy texture geometry camera pipeline scene geometry 
  //  camera shader lazy light frame vector texture lazy geometry light light 
  //  transform light view shader route lazy vector geometry modal preview animation 
  //  render projection modal preview plugin shader view vector plugin view shader 
  //  lazy view transform matrix render projection frame view geometry vector material 
  //  quaternion pipeline texture matrix geometry transform matrix feature feature light quaternion 
  //  light animation feature plugin pipeline render camera mesh texture route material 
  //  quaternion lazy preview vector transform lazy preview route matrix transform route 
  //  shader camera shader render camera preview plugin mesh render material render 
  //  vector render modal modal lazy pipeline scene texture matrix light lazy 
  //  light material texture view scene camera modal shader camera transform route 
  //  pipeline quaternion animation lazy vector feature camera animation modal mesh mesh 
  //  texture shader preview pipeline projection geometry matrix matrix plugin vector feature 
  //  camera lazy render shader pipeline transform quaternion camera transform camera shader 
  //  plugin projection mesh vector light preview preview scene plugin shader matrix 
  //  texture shader material camera transform vector scene projection preview lazy preview 
  //  transform view matrix shader mesh projection light scene render route pipeline 
  //  scene route transform texture pipeline quaternion projection camera transform frame light 
  //  transform lazy lazy mesh view animation animation matrix camera feature geometry 
  //  mesh lazy view material lazy modal shader projection transform vector animation 
  //  animation route matrix view vector frame material modal projection matrix route 
  //  camera view quaternion light pipeline vector light plugin view view lazy 
  //  scene lazy scene animation route matrix preview camera shader lazy modal 
  //  feature material matrix light quaternion plugin render transform scene material frame 
  //  frame transform lazy matrix frame render feature quaternion shader texture render 
  //  view pipeline lazy mesh animation quaternion camera plugin pipeline mesh plugin 
  //  frame matrix pipeline material mesh camera preview camera scene material modal 
  //  feature scene geometry projection frame geometry matrix render view projection geometry 
  //  shader texture texture transform pipeline matrix lazy light view animation frame 
  //  view mesh view mesh pipeline shader geometry scene mesh material modal 
  //  modal frame lazy preview route render projection matrix material preview route 
  //  lazy animation material frame quaternion projection projection frame lazy mesh lazy 
  //  plugin texture vector frame plugin mesh modal scene route geometry animation 
  //  route preview transform vector material route render transform geometry frame transform 
  //  frame animation feature preview route plugin scene mesh frame light geometry 
  //  projection transform preview transform preview frame quaternion mesh feature preview lazy 
  //  pipeline transform quaternion plugin shader frame frame scene mesh feature camera 
  //  plugin render vector frame mesh render projection transform camera animation preview 
  //  pipeline texture view preview mesh scene matrix preview texture material preview 
  //  shader projection modal shader plugin camera quaternion animation render shader scene 
  //  scene scene pipeline plugin mesh pipeline material scene route scene geometry 
  //  route feature scene pipeline modal scene material quaternion scene modal modal 
  //  texture animation texture vector route view pipeline route material material frame 
  //  feature animation preview modal modal route lazy frame light frame material 
  //  modal frame texture plugin matrix preview feature plugin modal modal mesh 
  //  mesh scene matrix pipeline transform render animation texture route route texture 
  //  projection feature feature scene camera matrix texture texture view geometry lazy 
  //  pipeline plugin plugin view vector matrix animation camera scene geometry preview 
  //  preview preview light material lazy material geometry camera quaternion texture preview 
  //  texture animation pipeline preview vector lazy vector transform lazy transform route 
  //  plugin view render feature mesh animation vector modal matrix frame frame 
  //  mesh texture pipeline scene quaternion transform camera plugin pipeline texture frame 
  //  feature transform transform matrix frame view geometry geometry pipeline light light 
  //  texture animation scene geometry light geometry vector route pipeline projection scene 
  //  projection transform mesh projection lazy shader geometry quaternion camera feature material 
  //  plugin camera texture route projection geometry projection material material projection camera 
  //  quaternion projection texture camera scene lazy matrix animation pipeline frame vector 
  //  transform camera texture quaternion frame preview material transform animation plugin scene 
  //  feature light animation view scene scene transform projection material texture view 
  //  shader frame render frame texture projection projection plugin texture render transform 
  //  frame projection view animation material projection quaternion light quaternion scene pipeline 
  //  texture pipeline modal lazy shader camera view transform matrix view modal 
  //  render pipeline route pipeline frame view render scene vector view vector 
  //  material render light mesh lazy pipeline matrix texture vector quaternion pipeline 
  //  quaternion pipeline vector geometry transform route matrix material mesh scene pipeline 
  //  route vector texture mesh texture route route matrix light shader material 
  //  mesh camera vector pipeline plugin lazy preview light plugin view preview 
  //  plugin texture light material light route quaternion geometry matrix vector lazy 
  //  mesh view render light shader material material matrix geometry transform animation 
  //  pipeline camera feature matrix geometry animation lazy camera preview vector animation 
  //  material modal modal feature view transform plugin matrix modal pipeline light 
  //  geometry material material pipeline transform scene route lazy modal frame camera 
  //  projection mesh render texture scene plugin transform shader frame texture mesh 
  //  mesh transform light vector view light scene camera feature quaternion modal 
  //  preview quaternion material route vector render matrix texture material geometry lazy 
  //  feature preview transform camera projection plugin vector transform plugin light geometry 
  //  render lazy animation feature vector projection geometry geometry view camera modal 
  //  projection matrix matrix material lazy modal mesh projection render camera texture 
  //  mesh pipeline lazy feature texture camera geometry quaternion matrix shader render 
  //  vector geometry route vector transform plugin render preview projection light view 
  //  vector scene camera lazy material scene preview view camera plugin transform 
  //  material light view preview texture lazy light light geometry pipeline plugin 
  //  camera scene animation light light projection light render modal animation light 
  //  texture plugin plugin quaternion projection mesh animation shader preview animation preview 
  //  projection shader feature view plugin plugin scene plugin feature light light 
  //  feature render feature texture camera quaternion lazy render geometry plugin lazy 
  //  geometry plugin transform plugin projection animation geometry texture matrix matrix material 
  //  quaternion lazy view camera route pipeline preview pipeline camera vector transform 
  //  geometry vector material matrix shader shader modal geometry matrix shader vector 
  //  quaternion matrix projection vector camera plugin view plugin projection preview vector 
  //  texture camera material projection lazy feature plugin modal modal camera scene 
  //  lazy mesh matrix feature pipeline geometry animation feature mesh camera mesh 
  //  lazy shader lazy geometry animation preview scene shader mesh matrix render 
  //  modal view projection feature frame modal shader geometry shader projection feature 
  //  plugin quaternion pipeline pipeline modal camera light frame animation render geometry 
  //  render texture vector camera pipeline frame plugin shader pipeline plugin route 
  //  modal geometry matrix vector camera pipeline projection projection material modal vector 
  //  plugin projection lazy lazy render scene texture lazy pipeline matrix modal 
  //  plugin route modal frame projection transform projection light light quaternion feature 
  //  transform pipeline animation route feature transform frame texture animation frame scene 
  //  render transform preview projection shader quaternion quaternion quaternion feature scene projection 
  //  projection animation view animation quaternion plugin camera route matrix texture shader 
  //  mesh material light mesh light mesh feature projection quaternion render plugin 
  //  frame render texture view scene geometry route shader mesh frame render 
  //  modal render material plugin transform pipeline animation modal scene scene shader 
  //  render pipeline lazy mesh mesh pipeline lazy feature projection feature modal 
  //  camera quaternion quaternion scene transform texture view pipeline texture scene matrix 
  //  shader matrix geometry pipeline projection quaternion texture transform frame light frame 
  //  render preview preview animation quaternion preview projection render preview light feature 
  //  feature projection route quaternion view vector lazy pipeline plugin transform plugin 
  //  quaternion plugin light feature material animation plugin mesh pipeline feature mesh 
  //  lazy feature modal plugin plugin render lazy projection shader matrix view 
  //  scene vector texture scene geometry vector view pipeline material view scene 
  //  scene lazy geometry preview shader mesh projection scene lazy view plugin 
  //  material mesh geometry render render animation vector material feature geometry pipeline 
  //  quaternion light feature render texture vector quaternion geometry render modal vector 
  //  feature material shader transform geometry route projection transform route feature frame 
  //  quaternion scene pipeline shader camera pipeline camera camera shader feature plugin 
  //  light texture material render quaternion quaternion projection material quaternion pipeline modal 
  //  scene pipeline render vector shader scene frame quaternion lazy plugin texture 
  //  mesh vector plugin material geometry material matrix quaternion mesh texture material 
  //  plugin shader projection light projection light material
  */
})();

// mod-lazy-0015 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[15] = {
    id: 15,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0015';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '311');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  shader material scene transform preview matrix route render pipeline transform scene material 
  //  mesh lazy vector render lazy render vector light mesh plugin frame 
  //  texture texture geometry quaternion quaternion feature projection modal view pipeline lazy 
  //  material modal quaternion vector light preview transform texture camera plugin feature 
  //  lazy material vector vector pipeline texture camera pipeline plugin frame feature 
  //  texture projection frame texture matrix mesh lazy mesh shader texture feature 
  //  lazy matrix modal scene modal camera projection geometry route matrix scene 
  //  camera animation mesh projection texture animation pipeline view matrix lazy projection 
  //  lazy view texture geometry scene plugin projection frame lazy shader geometry 
  //  plugin camera matrix animation lazy lazy material pipeline shader texture projection 
  //  geometry texture matrix feature camera route light matrix quaternion texture plugin 
  //  scene matrix route light modal light geometry transform camera camera transform 
  //  geometry pipeline light feature texture view transform vector modal texture animation 
  //  geometry matrix shader plugin feature quaternion frame feature mesh transform quaternion 
  //  texture render route quaternion modal frame vector render frame view mesh 
  //  modal preview light texture pipeline transform transform mesh route camera animation 
  //  matrix material feature preview vector feature transform modal route scene quaternion 
  //  light scene pipeline animation texture pipeline shader frame transform vector frame 
  //  render feature quaternion modal lazy matrix material material matrix plugin animation 
  //  matrix shader material camera material mesh render feature vector camera camera 
  //  route pipeline texture lazy modal frame scene mesh light shader pipeline 
  //  animation lazy projection light shader material geometry scene shader matrix frame 
  //  modal mesh light scene projection camera transform pipeline scene pipeline geometry 
  //  pipeline animation transform texture texture modal light quaternion transform geometry shader 
  //  projection modal feature view lazy quaternion route geometry texture frame view 
  //  modal view material modal feature modal shader scene render frame geometry 
  //  animation geometry quaternion vector lazy modal animation transform feature pipeline shader 
  //  material quaternion projection animation projection texture mesh route scene geometry view 
  //  plugin modal transform camera view camera animation render shader vector lazy 
  //  animation render camera preview scene projection texture pipeline light animation modal 
  //  transform mesh projection feature quaternion lazy render projection mesh pipeline light 
  //  feature animation route frame modal camera scene camera material plugin view 
  //  lazy mesh route texture matrix preview light preview route light material 
  //  animation camera modal shader projection light mesh render mesh texture route 
  //  plugin lazy preview mesh matrix shader route projection frame scene render 
  //  projection matrix mesh plugin transform texture matrix vector view matrix mesh 
  //  transform lazy plugin matrix view animation preview geometry texture texture vector 
  //  quaternion mesh quaternion matrix preview scene lazy view matrix camera render 
  //  frame geometry quaternion feature mesh animation camera light quaternion light projection 
  //  transform projection transform mesh plugin transform feature route lazy mesh feature 
  //  shader material shader vector mesh pipeline preview animation light vector view 
  //  light projection plugin mesh animation animation animation matrix camera pipeline vector 
  //  feature route projection pipeline lazy render lazy preview transform feature feature 
  //  light view route quaternion camera transform animation pipeline matrix view modal 
  //  transform animation geometry mesh scene render material plugin view plugin mesh 
  //  geometry frame transform view pipeline geometry camera material preview mesh modal 
  //  quaternion scene frame frame modal feature frame camera vector shader material 
  //  quaternion geometry vector view material route matrix feature feature material transform 
  //  pipeline material vector preview render vector mesh texture feature matrix camera 
  //  material scene frame modal mesh animation matrix shader lazy texture material 
  //  matrix animation view scene matrix material frame transform pipeline texture material 
  //  lazy light frame scene preview camera frame plugin transform frame view 
  //  texture projection animation mesh plugin view render animation plugin vector plugin 
  //  texture view animation modal light preview modal texture quaternion pipeline vector 
  //  lazy light route geometry light plugin projection material texture render pipeline 
  //  matrix texture render light mesh scene plugin feature material modal preview 
  //  frame view matrix projection modal material matrix camera feature lazy lazy 
  //  preview transform plugin quaternion scene scene shader route matrix frame quaternion 
  //  scene shader geometry quaternion render quaternion mesh scene material modal vector 
  //  preview shader scene texture transform light projection matrix camera light light 
  //  scene modal camera preview geometry texture mesh material animation modal preview 
  //  matrix matrix view projection shader plugin view light feature material camera 
  //  light projection mesh mesh vector modal light projection render frame vector 
  //  matrix plugin shader frame animation light material animation transform shader view 
  //  shader transform feature frame vector route feature view quaternion view quaternion 
  //  modal light projection render feature texture quaternion route light texture matrix 
  //  transform render modal transform view mesh route geometry plugin mesh vector 
  //  pipeline modal frame geometry light render texture modal modal projection view 
  //  mesh animation geometry light transform frame frame lazy projection feature preview 
  //  transform view pipeline projection material plugin pipeline geometry texture scene modal 
  //  lazy vector mesh plugin render animation quaternion vector transform quaternion camera 
  //  geometry shader projection lazy camera lazy pipeline view lazy geometry geometry 
  //  transform light quaternion feature lazy light light quaternion modal animation material 
  //  transform plugin quaternion projection plugin shader transform vector frame material preview 
  //  shader texture feature geometry transform projection matrix scene projection transform light 
  //  shader texture light matrix plugin projection animation material route route geometry 
  //  quaternion quaternion pipeline plugin matrix modal lazy plugin view pipeline quaternion 
  //  pipeline route matrix feature view render route frame transform camera camera 
  //  feature frame frame quaternion matrix scene lazy geometry route camera plugin 
  //  texture geometry preview mesh scene camera geometry route modal scene quaternion 
  //  quaternion quaternion render render light texture pipeline plugin render matrix feature 
  //  texture camera feature pipeline render quaternion quaternion lazy camera matrix transform 
  //  pipeline geometry mesh transform shader scene modal camera preview camera shader 
  //  shader light plugin feature projection plugin frame frame plugin animation camera 
  //  matrix scene lazy render texture scene material vector light plugin mesh 
  //  modal plugin transform frame texture preview material pipeline matrix render lazy 
  //  route mesh frame preview mesh feature texture modal transform matrix shader 
  //  route quaternion texture geometry preview pipeline animation shader vector scene matrix 
  //  light light matrix route transform plugin quaternion vector preview light geometry 
  //  mesh mesh mesh light transform matrix projection shader vector material matrix 
  //  shader scene shader plugin geometry scene matrix light shader feature projection 
  //  animation route camera mesh transform vector mesh render camera camera geometry 
  //  matrix render preview plugin shader camera route feature light feature modal 
  //  camera preview view animation view vector render route texture route camera 
  //  quaternion transform geometry mesh scene view shader preview material render feature 
  //  scene scene render plugin lazy frame texture transform camera mesh geometry 
  //  geometry quaternion transform plugin transform animation lazy route mesh projection quaternion 
  //  lazy route preview light pipeline shader frame geometry preview shader animation 
  //  render plugin modal pipeline feature pipeline geometry animation preview geometry projection 
  //  geometry feature pipeline pipeline scene mesh scene transform mesh render material 
  //  quaternion vector light vector modal plugin matrix geometry frame shader route 
  //  vector plugin view texture texture camera quaternion light modal geometry shader 
  //  animation geometry matrix frame animation animation scene preview modal material camera 
  //  camera scene view route shader texture render scene transform lazy lazy 
  //  render view lazy shader transform matrix scene frame quaternion view modal 
  //  light vector feature pipeline preview modal geometry render frame texture light 
  //  vector scene view shader projection scene transform mesh transform mesh feature 
  //  frame light preview lazy render matrix quaternion pipeline plugin render animation 
  //  feature vector geometry projection modal modal matrix vector matrix scene transform 
  //  frame mesh matrix frame pipeline view light camera lazy vector pipeline 
  //  camera quaternion route vector frame camera scene lazy modal modal matrix 
  //  animation animation geometry quaternion scene camera shader scene mesh texture lazy 
  //  vector material projection feature route preview matrix feature route plugin projection 
  //  transform render scene feature material feature light route animation feature shader 
  //  lazy view shader light feature preview transform frame matrix plugin render 
  //  render pipeline feature mesh modal pipeline shader vector plugin view modal 
  //  feature frame shader mesh preview vector animation pipeline frame route render 
  //  quaternion render light pipeline feature transform camera material frame plugin quaternion 
  //  texture lazy transform lazy material texture mesh animation vector route animation 
  //  frame animation mesh matrix modal light light scene route material transform 
  //  feature matrix material camera shader pipeline transform modal modal frame shader 
  //  transform lazy feature plugin scene view scene render animation camera modal 
  //  scene modal geometry texture feature light frame mesh vector animation texture 
  //  vector light pipeline texture geometry view mesh lazy mesh shader animation 
  //  modal geometry feature material matrix camera modal projection transform quaternion camera 
  //  texture camera render matrix light transform feature mesh route route material 
  //  shader route render matrix quaternion shader matrix quaternion matrix feature matrix 
  //  matrix geometry preview lazy modal preview modal render view quaternion scene 
  //  geometry preview scene frame lazy camera projection preview texture animation feature 
  //  lazy route scene matrix light material route plugin plugin camera pipeline 
  //  modal view render lazy frame vector lazy projection projection quaternion projection 
  //  preview modal frame route shader scene render light frame quaternion plugin 
  //  frame light animation lazy vector camera view preview texture shader pipeline 
  //  animation mesh lazy camera plugin light quaternion camera geometry texture light 
  //  material feature transform texture geometry quaternion view view pipeline matrix frame 
  //  plugin shader mesh matrix quaternion plugin pipeline texture animation camera plugin 
  //  pipeline vector pipeline scene matrix shader texture render light matrix texture 
  //  view pipeline feature scene transform vector mesh lazy vector route route 
  //  lazy light transform modal feature route material plugin geometry render camera 
  //  preview feature route quaternion pipeline render shader projection quaternion camera pipeline 
  //  route light animation route animation lazy projection feature frame preview mesh 
  //  animation quaternion vector geometry modal render frame matrix projection plugin render 
  //  frame frame quaternion view view pipeline scene geometry scene matrix view 
  //  frame vector modal shader vector route shader material camera vector pipeline 
  //  geometry camera texture scene geometry frame pipeline mesh render pipeline lazy 
  //  quaternion
  */
})();

// mod-lazy-0016 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[16] = {
    id: 16,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0016';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '164');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  projection scene light light scene vector scene shader route route route pipeline 
  //  light texture material feature mesh feature preview feature projection light vector 
  //  matrix scene mesh shader matrix modal feature vector camera projection modal 
  //  frame projection quaternion modal animation camera scene projection geometry animation render 
  //  frame geometry quaternion modal scene lazy plugin geometry preview frame material 
  //  route projection animation matrix lazy animation transform material texture light material 
  //  lazy matrix vector matrix preview shader render light render matrix lazy 
  //  view projection feature camera frame plugin mesh preview preview plugin texture 
  //  render lazy material route render shader shader matrix scene mesh camera 
  //  material geometry render pipeline pipeline geometry geometry matrix geometry mesh scene 
  //  route render frame light pipeline geometry modal matrix material vector render 
  //  preview texture matrix scene lazy scene geometry route lazy vector pipeline 
  //  render route modal animation shader shader light feature matrix shader scene 
  //  light geometry plugin vector feature modal view pipeline view lazy animation 
  //  feature matrix shader frame modal feature vector modal frame lazy animation 
  //  frame light geometry shader feature frame feature lazy transform matrix preview 
  //  texture feature mesh light vector view view shader camera camera light 
  //  geometry animation vector transform route plugin scene route view modal matrix 
  //  camera route pipeline lazy matrix animation frame view geometry light view 
  //  preview matrix camera mesh feature material route texture scene camera render 
  //  transform modal plugin texture view animation projection geometry vector matrix view 
  //  preview frame render animation modal vector material vector modal light camera 
  //  render preview quaternion preview material shader view shader scene render view 
  //  mesh view preview vector transform plugin shader feature route scene material 
  //  shader quaternion shader camera pipeline lazy light render preview quaternion camera 
  //  camera quaternion shader light preview camera vector light camera camera lazy 
  //  mesh animation shader transform scene scene shader texture route route animation 
  //  scene light pipeline matrix matrix frame quaternion geometry view frame frame 
  //  plugin transform camera vector light scene transform quaternion projection camera modal 
  //  render camera render camera quaternion shader preview shader scene matrix plugin 
  //  pipeline feature lazy shader pipeline preview preview frame pipeline shader frame 
  //  camera pipeline material animation light view material route feature preview projection 
  //  matrix lazy geometry plugin modal transform projection matrix modal light feature 
  //  preview scene material camera texture quaternion texture modal geometry material matrix 
  //  camera mesh preview vector matrix texture transform render animation material view 
  //  modal view view material projection camera pipeline projection texture shader animation 
  //  shader render render feature preview pipeline camera light mesh transform frame 
  //  plugin render route shader projection texture transform scene frame animation animation 
  //  modal feature route frame mesh render plugin camera lazy light material 
  //  modal lazy route light material transform texture lazy transform feature animation 
  //  scene pipeline scene texture vector scene plugin view light mesh camera 
  //  route render mesh material preview matrix shader vector frame texture projection 
  //  preview preview quaternion preview matrix animation feature vector texture light transform 
  //  modal light route preview frame plugin feature vector preview render mesh 
  //  light texture shader frame quaternion matrix material animation texture projection projection 
  //  quaternion modal matrix pipeline scene matrix material plugin frame lazy feature 
  //  render scene geometry shader lazy transform quaternion texture camera view scene 
  //  render material material lazy vector light shader scene shader transform material 
  //  matrix texture vector geometry lazy mesh material preview mesh quaternion projection 
  //  material projection plugin route quaternion camera geometry frame geometry mesh transform 
  //  feature matrix modal projection lazy scene preview route material plugin camera 
  //  scene plugin material render light feature projection transform vector view render 
  //  transform preview matrix view transform projection pipeline frame material texture render 
  //  light transform material modal texture scene view feature preview frame matrix 
  //  frame pipeline scene plugin texture animation shader material plugin route projection 
  //  vector transform matrix feature geometry view frame projection render vector projection 
  //  feature render route modal frame lazy matrix shader modal vector pipeline 
  //  animation route projection mesh projection render frame matrix geometry transform matrix 
  //  feature lazy view material camera lazy quaternion quaternion transform modal render 
  //  render vector scene camera preview mesh preview projection matrix material transform 
  //  render projection scene plugin projection shader quaternion pipeline projection vector render 
  //  route feature camera light route mesh light modal geometry light pipeline 
  //  texture feature feature frame modal camera render vector view mesh texture 
  //  preview animation projection render material plugin mesh animation texture geometry matrix 
  //  animation animation route scene light light vector material scene feature route 
  //  lazy material scene camera geometry route vector vector projection light scene 
  //  quaternion material texture camera modal camera mesh render transform quaternion texture 
  //  render render view projection matrix quaternion transform route geometry animation vector 
  //  geometry lazy plugin pipeline frame frame animation plugin texture matrix view 
  //  frame scene material transform feature matrix pipeline material material material route 
  //  preview view animation modal texture projection pipeline pipeline route texture transform 
  //  texture modal camera lazy camera pipeline geometry lazy pipeline projection transform 
  //  transform material geometry pipeline matrix pipeline texture matrix material frame camera 
  //  pipeline quaternion mesh feature route matrix modal pipeline pipeline view mesh 
  //  geometry view modal geometry camera transform view mesh pipeline route plugin 
  //  camera geometry transform vector light matrix material shader plugin matrix animation 
  //  pipeline projection geometry texture preview modal vector view view preview material 
  //  camera texture quaternion camera feature feature scene matrix render shader projection 
  //  modal quaternion modal render frame plugin vector render scene quaternion material 
  //  matrix shader shader quaternion transform scene scene mesh pipeline camera transform 
  //  camera mesh animation matrix route render camera material mesh transform mesh 
  //  geometry route projection preview modal render scene pipeline vector projection plugin 
  //  frame texture frame modal mesh light projection geometry lazy lazy feature 
  //  vector modal light projection preview light light pipeline camera shader quaternion 
  //  matrix transform texture animation scene route quaternion matrix geometry camera pipeline 
  //  transform preview matrix vector plugin plugin route camera feature feature vector 
  //  render shader geometry feature shader geometry projection pipeline route mesh projection 
  //  preview material pipeline view texture geometry transform quaternion feature projection shader 
  //  route geometry light material plugin pipeline material plugin view geometry render 
  //  transform geometry pipeline preview route render vector transform texture pipeline matrix 
  //  plugin modal matrix frame camera light lazy pipeline pipeline mesh plugin 
  //  texture plugin light matrix camera shader projection camera quaternion projection animation 
  //  route matrix plugin shader matrix render feature vector camera animation mesh 
  //  scene view render mesh transform projection view projection vector feature mesh 
  //  frame lazy plugin plugin geometry frame preview quaternion plugin matrix mesh 
  //  preview geometry mesh material texture frame mesh modal scene scene preview 
  //  frame route shader quaternion feature modal modal light feature vector transform 
  //  frame frame transform plugin texture texture frame vector geometry render view 
  //  frame light transform plugin route light animation transform mesh plugin camera 
  //  plugin pipeline modal preview scene quaternion feature route mesh animation preview 
  //  material frame animation animation quaternion plugin frame lazy render modal projection 
  //  scene frame mesh frame shader texture geometry modal light material plugin 
  //  geometry animation shader texture vector projection frame modal mesh mesh preview 
  //  matrix geometry projection animation mesh route mesh transform view route shader 
  //  lazy geometry matrix scene texture geometry material texture plugin vector shader 
  //  plugin scene feature preview view lazy feature lazy preview animation transform 
  //  geometry route shader material transform camera lazy transform material projection projection 
  //  plugin frame matrix quaternion pipeline projection camera geometry frame feature mesh 
  //  vector mesh frame frame texture shader projection shader quaternion feature frame 
  //  material camera light texture material preview transform mesh render lazy light 
  //  plugin preview quaternion plugin projection lazy vector scene route shader camera 
  //  modal frame lazy matrix mesh geometry camera mesh transform lazy lazy 
  //  quaternion material scene shader modal route light view render modal feature 
  //  modal mesh plugin route scene geometry shader light geometry material transform 
  //  frame lazy camera geometry feature light texture lazy preview plugin scene 
  //  vector feature texture render scene plugin view transform view transform preview 
  //  vector projection texture shader texture preview render pipeline camera geometry pipeline 
  //  route preview render preview vector vector quaternion projection lazy mesh vector 
  //  render route route shader animation modal light route route geometry quaternion 
  //  matrix feature geometry geometry frame shader vector mesh projection plugin lazy 
  //  view mesh vector plugin matrix matrix view vector camera vector light 
  //  modal render projection shader animation pipeline matrix camera render projection animation 
  //  material geometry quaternion projection material pipeline geometry render geometry material geometry 
  //  vector camera quaternion mesh transform light shader vector lazy route render 
  //  mesh route route animation matrix lazy light modal material vector camera 
  //  shader modal geometry transform quaternion quaternion projection transform feature vector geometry 
  //  modal shader material material render projection pipeline mesh texture preview mesh 
  //  route transform preview lazy pipeline animation geometry light render render modal 
  //  light feature feature projection feature material render animation light pipeline route 
  //  plugin pipeline scene matrix quaternion projection projection vector frame animation mesh 
  //  feature matrix pipeline preview feature quaternion render geometry render light camera 
  //  render animation frame preview shader vector matrix projection transform matrix modal 
  //  light lazy geometry scene feature plugin mesh route plugin animation light 
  //  shader projection material camera feature texture scene projection projection camera quaternion 
  //  texture shader matrix quaternion modal matrix quaternion scene pipeline matrix texture 
  //  matrix modal view geometry view pipeline modal modal modal texture feature 
  //  vector transform scene frame geometry view feature plugin view transform frame 
  //  geometry plugin vector vector view vector route feature scene lazy shader 
  //  shader preview texture vector route plugin route scene route pipeline transform 
  //  plugin material scene frame texture shader vector scene texture projection vector 
  //  vector feature texture transform quaternion scene quaternion vector shader projection vector 
  //  light light feature camera pipeline feature light route camera feature pipeline 
  //  view scene feature frame vector preview projection vector modal shader texture 
  //  render matrix transform lazy transform vector feature matrix light route texture 
  //  scene material
  */
})();

// mod-lazy-0017 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[17] = {
    id: 17,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0017';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '345');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  matrix render scene geometry geometry feature light texture camera lazy animation texture 
  //  quaternion pipeline matrix projection vector render mesh modal lazy material scene 
  //  animation view projection shader animation transform matrix preview route camera light 
  //  render animation preview shader lazy render view feature preview plugin plugin 
  //  matrix render light animation route pipeline transform plugin route transform texture 
  //  feature shader mesh light matrix transform light pipeline light camera shader 
  //  preview feature material camera animation route texture vector light scene modal 
  //  preview view preview plugin camera camera lazy plugin modal plugin frame 
  //  scene mesh transform transform quaternion transform matrix matrix vector scene animation 
  //  texture quaternion scene frame lazy transform scene shader frame view projection 
  //  transform material shader camera route preview feature quaternion scene feature render 
  //  lazy scene modal material modal material mesh route scene projection transform 
  //  light pipeline projection mesh vector transform plugin projection camera modal geometry 
  //  view geometry camera scene route shader shader quaternion quaternion material camera 
  //  shader light preview animation preview feature lazy light route plugin material 
  //  lazy modal pipeline view mesh transform feature view light frame frame 
  //  modal matrix camera lazy projection route modal matrix view quaternion animation 
  //  material lazy plugin route animation material shader shader frame feature shader 
  //  preview plugin transform transform quaternion frame animation render quaternion plugin quaternion 
  //  modal frame feature view shader matrix vector matrix animation transform pipeline 
  //  camera feature projection frame matrix frame frame texture camera frame vector 
  //  lazy view shader geometry texture light pipeline transform texture camera transform 
  //  plugin light projection plugin camera matrix material geometry route animation quaternion 
  //  matrix geometry matrix vector mesh transform quaternion transform plugin light material 
  //  mesh light light camera frame geometry texture frame quaternion plugin feature 
  //  modal transform scene scene shader light material camera projection material geometry 
  //  lazy pipeline transform animation feature frame material mesh plugin scene plugin 
  //  material light geometry vector view view plugin view geometry plugin quaternion 
  //  scene projection material preview shader render plugin shader scene shader camera 
  //  feature light matrix transform plugin projection preview preview pipeline material texture 
  //  frame lazy scene light matrix lazy frame modal frame scene shader 
  //  frame animation matrix shader plugin pipeline animation projection modal feature light 
  //  frame frame pipeline modal projection lazy feature light modal matrix transform 
  //  transform route pipeline projection animation transform plugin geometry frame shader plugin 
  //  camera matrix view lazy lazy transform material feature transform shader plugin 
  //  matrix view preview texture transform matrix geometry vector frame vector light 
  //  transform matrix texture mesh geometry geometry lazy modal route geometry camera 
  //  projection vector route geometry pipeline transform render projection route route geometry 
  //  geometry plugin vector view matrix route quaternion transform matrix route vector 
  //  matrix modal transform view plugin feature render animation feature scene frame 
  //  mesh feature geometry animation projection scene scene light scene geometry matrix 
  //  transform geometry material scene pipeline feature animation transform vector vector pipeline 
  //  feature camera texture plugin view vector lazy feature lazy mesh material 
  //  preview frame shader matrix shader matrix render route animation animation view 
  //  view animation camera transform modal animation matrix animation vector mesh shader 
  //  lazy vector projection geometry camera light view preview texture route animation 
  //  render quaternion light mesh camera scene plugin camera pipeline preview lazy 
  //  frame render frame route scene feature render feature pipeline plugin texture 
  //  vector pipeline matrix animation light feature material material camera lazy matrix 
  //  material texture shader frame mesh frame projection light vector vector shader 
  //  preview geometry route material lazy texture quaternion projection lazy camera transform 
  //  shader light modal plugin scene feature material camera projection light light 
  //  transform feature texture route render lazy view feature modal modal texture 
  //  modal animation lazy frame animation matrix plugin pipeline route frame scene 
  //  projection animation render texture texture preview shader modal light route route 
  //  camera vector mesh texture view quaternion animation plugin matrix plugin transform 
  //  route camera frame modal lazy feature material shader quaternion scene shader 
  //  transform feature modal quaternion material pipeline animation material feature feature mesh 
  //  pipeline animation animation pipeline matrix transform geometry matrix frame transform shader 
  //  projection mesh view transform preview camera scene animation plugin matrix route 
  //  render quaternion feature transform plugin preview route light material scene vector 
  //  scene feature frame lazy modal mesh vector route render plugin camera 
  //  scene feature feature geometry frame pipeline preview route view animation shader 
  //  mesh shader quaternion plugin modal render geometry route projection view vector 
  //  animation pipeline scene projection preview scene preview mesh preview geometry render 
  //  vector geometry shader material texture scene preview matrix route frame mesh 
  //  mesh vector render lazy geometry animation view quaternion feature pipeline camera 
  //  modal plugin route quaternion material scene transform camera quaternion pipeline vector 
  //  frame frame preview geometry light texture mesh view material geometry shader 
  //  lazy projection transform geometry shader preview vector route camera transform geometry 
  //  texture shader preview scene scene feature quaternion animation transform light frame 
  //  mesh scene quaternion transform view material matrix mesh matrix render lazy 
  //  camera material matrix lazy light texture projection view light pipeline animation 
  //  render preview texture pipeline render scene vector vector mesh vector projection 
  //  frame texture mesh material mesh view render transform light vector lazy 
  //  preview route projection route plugin material modal quaternion plugin shader view 
  //  mesh mesh transform mesh quaternion pipeline scene feature texture matrix transform 
  //  shader route view mesh modal pipeline matrix geometry route render render 
  //  lazy frame pipeline matrix quaternion transform material plugin transform texture lazy 
  //  vector route view animation plugin scene route plugin mesh camera geometry 
  //  quaternion mesh route plugin frame preview camera light render texture view 
  //  plugin scene plugin shader geometry camera frame shader transform vector vector 
  //  preview preview plugin matrix geometry route shader mesh render pipeline material 
  //  camera view lazy plugin transform light quaternion route plugin animation transform 
  //  projection shader route mesh animation animation shader feature render preview mesh 
  //  vector lazy shader light pipeline frame plugin projection scene pipeline quaternion 
  //  preview preview mesh transform mesh view quaternion scene view geometry modal 
  //  scene light scene matrix matrix camera light quaternion animation geometry pipeline 
  //  transform matrix animation camera plugin light projection view transform camera material 
  //  frame projection mesh projection geometry light scene quaternion preview render lazy 
  //  preview shader route feature vector projection animation render material scene vector 
  //  scene render preview modal transform scene feature material quaternion vector scene 
  //  camera geometry feature camera material vector projection mesh animation texture light 
  //  mesh modal matrix feature transform texture camera shader quaternion plugin scene 
  //  animation preview frame preview plugin vector render view material projection material 
  //  light frame transform camera lazy preview lazy material texture light frame 
  //  camera lazy plugin matrix vector route mesh light modal material transform 
  //  texture vector quaternion camera transform matrix mesh frame geometry transform camera 
  //  scene vector projection transform scene shader vector pipeline texture pipeline projection 
  //  animation render transform material quaternion quaternion quaternion route material mesh frame 
  //  animation animation transform texture quaternion transform animation scene modal scene camera 
  //  feature plugin plugin shader light projection modal shader render render scene 
  //  material mesh projection material feature mesh feature preview modal transform shader 
  //  feature geometry mesh mesh view animation frame material animation route pipeline 
  //  material camera vector plugin texture light texture transform mesh projection quaternion 
  //  vector preview animation render animation camera modal preview route lazy render 
  //  transform mesh lazy mesh pipeline frame geometry lazy matrix render geometry 
  //  geometry feature plugin lazy camera geometry render vector scene render light 
  //  pipeline vector route view plugin frame pipeline view texture shader preview 
  //  light feature quaternion projection pipeline plugin projection transform view vector vector 
  //  pipeline texture shader lazy lazy matrix mesh geometry render frame light 
  //  render matrix scene geometry preview lazy view lazy vector render frame 
  //  camera light pipeline lazy feature view material light feature mesh projection 
  //  pipeline transform feature geometry frame texture texture pipeline scene texture pipeline 
  //  modal preview render lazy scene preview shader light camera plugin material 
  //  animation projection pipeline material transform transform shader texture scene transform projection 
  //  pipeline route geometry quaternion animation render geometry quaternion quaternion texture camera 
  //  projection mesh pipeline camera material matrix route transform camera lazy frame 
  //  texture render render frame mesh view material shader feature animation geometry 
  //  frame frame transform animation texture mesh lazy pipeline projection lazy scene 
  //  preview modal light transform mesh scene preview route light preview frame 
  //  scene projection scene transform feature matrix frame projection quaternion mesh texture 
  //  preview transform view route pipeline route vector pipeline light texture mesh 
  //  quaternion plugin modal modal matrix route modal animation camera modal texture 
  //  lazy light mesh vector vector quaternion camera preview projection preview vector 
  //  animation modal shader pipeline light mesh texture plugin route matrix preview 
  //  camera shader lazy preview transform matrix render preview transform projection vector 
  //  frame camera texture material transform plugin camera transform material view camera 
  //  camera scene vector preview quaternion pipeline modal projection light projection projection 
  //  quaternion route matrix frame vector geometry camera route plugin quaternion frame 
  //  material light modal matrix transform lazy texture modal camera mesh render 
  //  projection plugin view preview vector render mesh texture light camera quaternion 
  //  pipeline view animation texture mesh view animation matrix plugin matrix modal 
  //  transform scene shader route light render scene preview scene frame mesh 
  //  animation animation shader projection material render pipeline matrix route route projection 
  //  transform mesh frame geometry modal material animation scene preview route lazy 
  //  scene projection camera mesh material geometry preview material camera projection shader 
  //  geometry frame scene route animation texture mesh scene feature texture animation 
  //  projection animation shader projection view transform scene material vector plugin vector 
  //  scene projection pipeline projection material material modal preview transform matrix view 
  //  shader preview geometry mesh frame material feature projection mesh shader transform 
  //  plugin transform modal plugin modal frame scene mesh modal scene pipeline 
  //  modal render feature scene projection shader light transform lazy camera camera 
  //  render animation scene matrix geometry view mesh pipeline shader
  */
})();

// mod-lazy-0018 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[18] = {
    id: 18,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0018';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '198');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  shader view texture transform route feature scene frame matrix animation light transform 
  //  quaternion texture camera shader quaternion mesh preview light view light preview 
  //  view preview frame matrix geometry vector route animation matrix matrix matrix 
  //  pipeline mesh lazy mesh geometry material route texture modal material pipeline 
  //  animation light texture animation render animation scene matrix geometry view vector 
  //  quaternion view preview lazy modal shader feature material quaternion light projection 
  //  modal view pipeline quaternion scene scene preview geometry feature matrix plugin 
  //  projection feature view geometry matrix camera camera projection transform pipeline quaternion 
  //  matrix vector modal geometry projection preview quaternion plugin material feature view 
  //  pipeline preview plugin view scene transform geometry lazy quaternion vector camera 
  //  transform mesh matrix light route plugin camera transform scene camera material 
  //  vector lazy animation lazy animation shader matrix texture modal texture plugin 
  //  route vector plugin shader light shader texture pipeline projection preview render 
  //  light material modal mesh material projection projection modal scene view modal 
  //  matrix lazy route feature matrix lazy matrix view geometry view geometry 
  //  mesh pipeline material route frame animation projection geometry render matrix light 
  //  route texture feature projection camera light light route pipeline mesh route 
  //  texture modal transform texture route scene material plugin shader shader mesh 
  //  render view animation modal frame render vector transform texture transform route 
  //  material modal animation modal shader shader view lazy feature preview projection 
  //  preview vector texture texture pipeline scene scene camera light view light 
  //  projection vector feature feature scene shader frame projection render texture camera 
  //  preview frame lazy camera frame frame pipeline plugin texture matrix pipeline 
  //  transform frame route modal texture frame preview animation matrix route texture 
  //  feature camera light render render camera pipeline preview matrix light geometry 
  //  pipeline light modal lazy plugin vector feature shader texture modal geometry 
  //  transform plugin texture pipeline render projection texture pipeline geometry shader matrix 
  //  light route render light route route mesh material lazy render feature 
  //  scene preview scene render camera preview light view render route pipeline 
  //  lazy matrix geometry matrix light light plugin geometry lazy modal texture 
  //  geometry view lazy transform plugin modal shader modal feature pipeline vector 
  //  modal route modal render feature texture vector frame geometry geometry material 
  //  modal shader route geometry light projection view shader matrix texture camera 
  //  pipeline quaternion scene geometry pipeline feature geometry preview transform vector lazy 
  //  plugin material shader pipeline route feature shader mesh quaternion modal light 
  //  quaternion scene mesh view pipeline modal modal scene plugin light view 
  //  shader animation pipeline preview matrix matrix render view camera pipeline route 
  //  pipeline pipeline material animation render pipeline light geometry mesh shader render 
  //  modal camera vector projection animation geometry material geometry feature frame feature 
  //  texture camera projection render mesh camera transform quaternion mesh pipeline modal 
  //  shader light shader route render lazy render shader render material quaternion 
  //  matrix pipeline render scene light lazy view projection mesh scene camera 
  //  frame geometry route camera camera projection mesh vector quaternion modal pipeline 
  //  transform plugin lazy route mesh material shader vector preview shader vector 
  //  view lazy material view view render view plugin plugin camera material 
  //  animation plugin material plugin camera frame render pipeline frame pipeline animation 
  //  view scene light plugin texture geometry preview camera render scene projection 
  //  animation material scene feature preview route transform render modal pipeline projection 
  //  route vector light projection camera route shader view preview projection route 
  //  vector light plugin modal shader shader view material mesh route camera 
  //  texture texture quaternion animation pipeline route quaternion projection geometry preview quaternion 
  //  geometry geometry matrix geometry route frame animation quaternion vector lazy texture 
  //  plugin route transform render plugin transform render scene projection route camera 
  //  lazy shader frame light vector quaternion shader quaternion projection light render 
  //  animation lazy material material vector view geometry projection modal pipeline view 
  //  modal view mesh modal feature light feature matrix material scene scene 
  //  scene mesh preview matrix mesh feature camera animation scene plugin matrix 
  //  preview animation light render pipeline matrix quaternion route animation scene shader 
  //  view mesh matrix plugin camera lazy view projection matrix shader view 
  //  modal lazy vector lazy scene mesh camera vector plugin frame projection 
  //  feature projection material route plugin render modal geometry texture texture render 
  //  preview route preview texture render frame feature preview mesh modal view 
  //  modal matrix light view light animation material frame geometry render quaternion 
  //  scene transform light transform material projection route light vector view modal 
  //  preview render scene quaternion view animation geometry feature animation preview vector 
  //  camera route preview texture lazy frame vector texture quaternion plugin shader 
  //  projection mesh mesh animation geometry material camera modal transform plugin scene 
  //  shader projection pipeline animation projection mesh vector view matrix render frame 
  //  plugin shader scene camera light shader projection animation light projection mesh 
  //  render light texture route material route feature modal geometry camera animation 
  //  mesh view projection camera texture shader camera material view matrix light 
  //  animation feature plugin lazy view pipeline view material transform shader feature 
  //  modal texture texture preview geometry view texture plugin material render modal 
  //  material mesh mesh vector quaternion render mesh route pipeline render texture 
  //  matrix frame feature camera light pipeline frame route frame scene vector 
  //  quaternion animation lazy matrix modal vector shader projection matrix feature material 
  //  modal preview view material material view light route projection preview camera 
  //  render animation projection scene pipeline animation render frame pipeline projection vector 
  //  light projection frame projection preview view matrix material pipeline route camera 
  //  camera texture quaternion transform lazy feature quaternion view material material mesh 
  //  animation light material pipeline transform vector camera plugin lazy pipeline projection 
  //  preview animation vector scene light route material shader render camera texture 
  //  texture quaternion view quaternion vector mesh route render geometry geometry view 
  //  frame scene scene feature quaternion feature camera texture geometry camera light 
  //  preview light shader preview mesh transform feature animation render shader geometry 
  //  frame route lazy mesh route modal quaternion transform projection scene animation 
  //  pipeline route matrix scene camera light render light shader transform lazy 
  //  scene frame matrix modal plugin plugin route transform quaternion pipeline matrix 
  //  texture geometry geometry plugin mesh view camera plugin route render geometry 
  //  feature view view frame shader material material light camera preview projection 
  //  scene light view light feature animation route view texture frame transform 
  //  mesh view view route quaternion plugin feature projection frame route render 
  //  route modal light transform feature view animation quaternion pipeline quaternion route 
  //  shader geometry matrix frame material camera quaternion shader vector vector material 
  //  matrix scene material texture projection camera matrix preview vector material texture 
  //  lazy lazy material camera scene matrix transform shader pipeline mesh frame 
  //  lazy frame render projection pipeline shader transform vector texture geometry camera 
  //  light scene geometry preview preview pipeline quaternion frame view modal pipeline 
  //  camera preview plugin lazy shader preview preview light texture transform preview 
  //  material mesh material mesh modal animation lazy route light projection matrix 
  //  transform modal shader frame pipeline view view scene light feature vector 
  //  lazy shader texture pipeline animation camera pipeline light preview matrix transform 
  //  frame geometry modal lazy transform shader feature matrix pipeline frame plugin 
  //  light matrix animation light mesh route texture texture projection mesh camera 
  //  geometry texture camera feature vector feature transform preview modal modal texture 
  //  route frame scene matrix modal vector material scene modal camera feature 
  //  frame frame matrix animation transform quaternion render scene preview modal matrix 
  //  shader route material route lazy matrix plugin texture vector material light 
  //  route vector frame scene pipeline preview animation frame geometry modal quaternion 
  //  modal route frame plugin geometry frame material material lazy view projection 
  //  camera shader animation quaternion animation route view render shader transform geometry 
  //  transform shader lazy animation material transform texture plugin render plugin projection 
  //  transform light geometry render animation feature mesh animation texture preview feature 
  //  lazy camera modal camera vector plugin transform modal animation geometry frame 
  //  material transform mesh preview preview projection animation projection render geometry lazy 
  //  scene feature preview projection scene plugin geometry mesh frame scene texture 
  //  mesh feature frame shader light shader texture plugin plugin route modal 
  //  frame modal vector light route scene render animation plugin material pipeline 
  //  preview view quaternion quaternion scene mesh quaternion transform preview vector route 
  //  projection texture pipeline shader geometry quaternion plugin matrix vector light route 
  //  plugin vector view scene light feature frame route mesh mesh projection 
  //  mesh route plugin lazy geometry geometry matrix shader transform feature texture 
  //  scene projection pipeline feature modal shader vector animation transform texture frame 
  //  scene plugin scene matrix vector lazy lazy mesh lazy modal scene 
  //  modal frame scene preview route view geometry material light light route 
  //  material quaternion vector mesh pipeline plugin animation animation geometry route vector 
  //  animation mesh scene vector light geometry material animation lazy animation mesh 
  //  render modal render shader camera animation shader shader scene material frame 
  //  view geometry geometry frame lazy shader material scene material quaternion texture 
  //  modal vector quaternion projection pipeline plugin vector texture lazy frame frame 
  //  transform lazy animation preview projection plugin material preview mesh mesh lazy 
  //  plugin pipeline transform preview material matrix plugin route frame frame projection 
  //  vector view modal camera material route projection lazy vector feature camera 
  //  camera vector shader quaternion preview light route matrix render mesh plugin 
  //  quaternion scene animation render quaternion quaternion feature quaternion matrix light mesh 
  //  frame frame scene light light scene preview matrix mesh vector quaternion 
  //  modal quaternion projection plugin plugin projection transform camera projection camera light 
  //  light camera vector feature plugin view vector route geometry lazy render 
  //  preview route feature animation light preview projection pipeline material plugin preview 
  //  camera animation transform vector render transform quaternion matrix frame mesh animation 
  //  plugin render lazy frame view light mesh material camera quaternion feature 
  //  pipeline projection material frame matrix vector shader render mesh camera pipeline 
  //  quaternion preview vector route scene lazy material modal frame route render 
  //  material animation quaternion light route render material geometry mesh view pipeline 
  //  scene quaternion frame vector scene material pipeline animation scene view texture 
  //  pipeline render frame projection
  */
})();

// mod-lazy-0019 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[19] = {
    id: 19,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0019';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '247');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  preview pipeline scene route modal shader render geometry view transform mesh transform 
  //  projection geometry pipeline camera route transform transform feature shader render render 
  //  geometry geometry view frame render route quaternion lazy feature quaternion mesh 
  //  texture pipeline preview texture render route texture matrix quaternion scene render 
  //  geometry view shader matrix light texture material camera light pipeline geometry 
  //  route quaternion transform shader modal projection shader matrix lazy quaternion vector 
  //  projection vector scene camera lazy geometry vector quaternion view matrix animation 
  //  view pipeline quaternion pipeline feature frame quaternion modal projection pipeline lazy 
  //  feature vector modal light light plugin render preview matrix light frame 
  //  light feature shader matrix camera material plugin vector vector pipeline shader 
  //  plugin plugin pipeline transform frame texture render render plugin route preview 
  //  texture transform view light matrix vector matrix frame animation quaternion texture 
  //  vector quaternion vector plugin feature shader material frame shader texture animation 
  //  texture render light quaternion projection scene pipeline feature vector plugin plugin 
  //  modal material matrix frame frame frame animation camera matrix material animation 
  //  plugin render texture animation geometry pipeline modal projection route animation feature 
  //  material frame lazy feature matrix lazy light frame light plugin preview 
  //  transform shader scene projection geometry plugin scene camera preview quaternion route 
  //  shader quaternion vector plugin feature geometry view feature preview pipeline render 
  //  material animation mesh animation frame shader view render geometry material projection 
  //  light camera texture lazy matrix vector camera light animation feature geometry 
  //  texture matrix feature geometry projection render matrix quaternion route material geometry 
  //  view feature frame mesh mesh frame preview vector plugin geometry animation 
  //  texture geometry matrix render vector shader geometry pipeline material modal route 
  //  plugin light light frame feature texture projection frame pipeline shader pipeline 
  //  transform texture mesh view view material camera projection transform preview route 
  //  vector frame light material lazy lazy material vector scene mesh view 
  //  geometry render light light vector view view quaternion quaternion render route 
  //  light frame texture shader plugin camera geometry frame lazy preview scene 
  //  route feature animation mesh quaternion camera transform light plugin plugin view 
  //  scene modal vector transform modal plugin mesh modal mesh scene transform 
  //  vector modal camera shader matrix route preview quaternion view light frame 
  //  quaternion texture plugin geometry vector animation transform modal material plugin vector 
  //  feature texture view pipeline render pipeline frame transform modal render mesh 
  //  vector material material mesh pipeline lazy transform view quaternion pipeline pipeline 
  //  geometry scene frame mesh geometry shader projection mesh animation lazy preview 
  //  quaternion geometry pipeline vector shader frame quaternion route lazy geometry view 
  //  material matrix feature transform lazy plugin lazy lazy route view mesh 
  //  light feature projection modal plugin texture mesh light animation projection shader 
  //  plugin mesh mesh geometry geometry matrix quaternion plugin modal frame pipeline 
  //  view light pipeline light geometry quaternion texture camera texture geometry material 
  //  render matrix quaternion material light feature preview feature plugin scene plugin 
  //  mesh scene mesh matrix geometry lazy view route camera plugin animation 
  //  texture texture light matrix matrix frame modal animation lazy render geometry 
  //  modal material camera projection scene preview animation plugin quaternion frame light 
  //  animation scene render projection scene transform scene scene texture shader route 
  //  scene geometry lazy projection render scene geometry light transform scene lazy 
  //  modal modal view feature light preview projection scene geometry geometry transform 
  //  camera pipeline plugin shader view transform geometry pipeline vector matrix pipeline 
  //  modal material geometry lazy projection vector matrix render transform feature transform 
  //  frame matrix material texture texture render pipeline feature geometry frame texture 
  //  texture animation matrix shader geometry mesh material plugin plugin preview texture 
  //  route lazy projection lazy projection route mesh camera route mesh modal 
  //  route geometry quaternion light scene animation material animation mesh mesh scene 
  //  shader feature frame shader texture mesh vector quaternion camera plugin shader 
  //  quaternion geometry transform lazy lazy matrix route projection preview camera vector 
  //  quaternion projection mesh modal light preview texture vector shader frame material 
  //  matrix pipeline lazy quaternion animation camera view animation mesh preview quaternion 
  //  frame lazy pipeline lazy route quaternion vector animation render modal lazy 
  //  preview texture transform geometry vector feature matrix lazy scene view lazy 
  //  transform preview pipeline pipeline geometry render scene light mesh mesh geometry 
  //  lazy frame scene light projection feature route quaternion pipeline camera animation 
  //  route lazy view route lazy pipeline preview material modal modal light 
  //  scene route preview view plugin vector mesh render lazy vector mesh 
  //  texture geometry light render modal frame light frame route matrix quaternion 
  //  modal light matrix material view projection texture preview camera lazy frame 
  //  geometry camera pipeline lazy route texture modal camera modal route vector 
  //  vector preview quaternion texture pipeline animation view lazy vector view material 
  //  plugin route camera matrix render plugin modal vector view geometry route 
  //  transform preview frame plugin modal geometry animation transform preview scene shader 
  //  render animation transform material matrix frame preview modal lazy matrix projection 
  //  preview mesh transform quaternion light render transform mesh preview texture transform 
  //  plugin mesh camera matrix render shader pipeline mesh pipeline projection frame 
  //  route plugin matrix plugin animation shader shader lazy animation render scene 
  //  frame scene lazy plugin route matrix animation feature lazy quaternion transform 
  //  animation mesh scene animation animation preview animation texture geometry view view 
  //  route transform texture transform animation modal modal quaternion scene route vector 
  //  preview route view mesh route modal pipeline modal route mesh camera 
  //  mesh quaternion plugin light texture material light material preview route render 
  //  vector render camera plugin animation preview geometry route preview texture route 
  //  modal pipeline render preview modal lazy animation geometry quaternion projection render 
  //  projection render light scene transform vector texture projection scene frame lazy 
  //  preview geometry projection camera scene transform quaternion preview camera modal feature 
  //  transform transform preview render vector matrix lazy frame material preview route 
  //  matrix feature lazy material scene geometry render plugin lazy route mesh 
  //  view preview plugin animation transform material geometry lazy matrix animation feature 
  //  render pipeline modal frame animation camera projection material material quaternion matrix 
  //  shader camera scene render transform quaternion matrix render matrix camera matrix 
  //  scene texture matrix transform preview quaternion transform quaternion mesh lazy texture 
  //  shader light transform vector vector modal quaternion pipeline preview modal quaternion 
  //  quaternion frame mesh texture light mesh render preview geometry quaternion lazy 
  //  mesh lazy frame mesh geometry frame scene feature preview animation plugin 
  //  render projection matrix light feature transform camera animation view mesh light 
  //  light render frame vector quaternion camera mesh feature feature route plugin 
  //  quaternion render camera texture matrix preview quaternion projection matrix plugin pipeline 
  //  texture camera plugin mesh matrix matrix scene feature plugin material view 
  //  texture view light geometry route quaternion quaternion vector mesh feature animation 
  //  feature preview feature render route shader route animation render view preview 
  //  feature quaternion view material plugin preview animation light transform modal render 
  //  light lazy scene quaternion light pipeline lazy animation lazy geometry pipeline 
  //  vector pipeline matrix geometry plugin preview pipeline shader texture projection geometry 
  //  view matrix lazy vector geometry scene lazy feature render projection quaternion 
  //  vector shader route projection preview modal pipeline geometry vector mesh lazy 
  //  shader pipeline quaternion scene geometry vector transform plugin quaternion geometry preview 
  //  camera texture animation animation animation render animation material vector scene mesh 
  //  render quaternion preview projection view scene geometry matrix modal mesh projection 
  //  vector scene texture transform matrix plugin preview texture pipeline vector view 
  //  matrix camera mesh scene vector light shader pipeline lazy matrix geometry 
  //  vector material animation feature geometry render light texture geometry pipeline render 
  //  preview feature render light preview projection shader vector geometry texture frame 
  //  matrix texture modal lazy quaternion modal render geometry render vector shader 
  //  mesh texture feature frame render projection matrix plugin projection frame render 
  //  frame transform vector pipeline vector view mesh plugin geometry shader view 
  //  geometry view mesh quaternion matrix plugin view preview quaternion quaternion pipeline 
  //  feature scene quaternion light light texture animation shader light render render 
  //  lazy render matrix material matrix texture route mesh matrix projection mesh 
  //  camera modal transform mesh light geometry projection view view lazy lazy 
  //  route vector frame pipeline camera material animation route camera scene camera 
  //  vector light camera quaternion mesh mesh transform material quaternion animation plugin 
  //  scene render feature shader shader vector projection frame texture geometry quaternion 
  //  pipeline camera geometry view material scene preview frame lazy material matrix 
  //  geometry preview transform material light matrix route shader projection route pipeline 
  //  texture animation scene matrix material view pipeline feature pipeline scene mesh 
  //  shader transform preview view lazy projection camera render light mesh frame 
  //  light matrix plugin geometry pipeline geometry animation geometry render scene route 
  //  scene transform scene modal light preview render animation lazy lazy vector 
  //  view render feature transform camera light render preview route geometry feature 
  //  texture transform plugin mesh modal shader feature preview lazy lazy camera 
  //  render matrix render view lazy animation frame mesh camera geometry lazy 
  //  geometry animation modal view light shader transform view plugin route route 
  //  shader texture plugin plugin material transform shader animation matrix feature quaternion 
  //  mesh texture lazy render animation shader pipeline preview matrix scene modal 
  //  animation pipeline quaternion texture render animation geometry pipeline scene plugin mesh 
  //  lazy light scene projection mesh mesh texture shader geometry animation plugin 
  //  geometry shader preview geometry camera light light matrix route transform preview 
  //  quaternion material pipeline mesh transform view render feature scene geometry shader 
  //  vector geometry feature vector light route matrix route vector light modal 
  //  texture transform feature texture feature preview animation feature animation lazy transform 
  //  geometry quaternion projection animation preview scene route vector vector animation mesh 
  //  matrix lazy geometry pipeline quaternion material quaternion feature render material plugin 
  //  quaternion lazy mesh pipeline texture material material frame pipeline texture matrix 
  //  quaternion feature camera view scene quaternion quaternion animation route quaternion modal 
  //  projection modal view preview vector matrix vector scene shader view geometry 
  //  lazy light camera camera vector preview feature lazy feature quaternion light 
  //  texture
  */
})();

// mod-lazy-0020 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[20] = {
    id: 20,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0020';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '354');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  material lazy camera frame matrix projection pipeline render material preview material mesh 
  //  quaternion plugin shader material matrix plugin render projection light frame render 
  //  view preview geometry pipeline transform render transform render render light view 
  //  texture pipeline camera quaternion modal feature geometry plugin matrix shader texture 
  //  mesh feature camera lazy camera transform scene shader plugin transform camera 
  //  material animation preview scene frame modal frame mesh geometry plugin lazy 
  //  projection projection pipeline feature view vector animation lazy geometry light modal 
  //  shader mesh camera modal modal animation light modal preview pipeline vector 
  //  scene preview lazy transform light lazy lazy mesh quaternion camera feature 
  //  route texture lazy scene light modal preview feature frame quaternion projection 
  //  matrix transform texture mesh frame geometry pipeline render projection vector camera 
  //  pipeline light feature pipeline lazy feature pipeline vector render material material 
  //  render pipeline shader lazy plugin quaternion mesh projection pipeline frame vector 
  //  texture quaternion view shader quaternion light texture light texture modal mesh 
  //  lazy animation material frame render frame quaternion pipeline camera frame material 
  //  camera texture route feature preview render feature matrix transform light view 
  //  shader modal projection quaternion preview light camera quaternion lazy feature geometry 
  //  quaternion route lazy matrix mesh scene render material render preview modal 
  //  projection matrix animation texture lazy light pipeline feature render render plugin 
  //  matrix route projection geometry preview material texture feature quaternion modal route 
  //  modal route animation scene material transform mesh view transform view quaternion 
  //  pipeline render projection projection frame lazy pipeline light camera route animation 
  //  transform modal view pipeline animation route transform matrix transform shader projection 
  //  route mesh route frame mesh shader route pipeline view quaternion lazy 
  //  route vector light plugin vector view material animation animation vector vector 
  //  geometry material shader feature view feature route pipeline preview transform preview 
  //  mesh lazy quaternion modal projection pipeline matrix view render matrix feature 
  //  plugin vector lazy material texture transform quaternion scene lazy feature pipeline 
  //  animation render feature geometry camera plugin pipeline geometry texture camera camera 
  //  matrix route pipeline feature frame projection frame matrix matrix modal feature 
  //  route feature feature material material preview view lazy preview camera material 
  //  frame feature render plugin mesh projection projection route view material pipeline 
  //  modal preview light light quaternion feature feature view animation lazy plugin 
  //  quaternion route frame pipeline quaternion view route feature pipeline mesh animation 
  //  preview modal mesh matrix material modal render quaternion vector material plugin 
  //  material feature animation feature view plugin quaternion view vector scene light 
  //  texture material modal geometry material animation pipeline matrix modal light lazy 
  //  modal animation material matrix plugin matrix view view matrix projection pipeline 
  //  matrix transform lazy feature texture shader material matrix matrix matrix view 
  //  feature preview matrix matrix lazy camera material preview geometry transform quaternion 
  //  lazy render texture texture frame route shader shader view camera mesh 
  //  quaternion feature feature projection quaternion lazy camera frame quaternion preview preview 
  //  preview texture geometry camera lazy camera scene modal render texture matrix 
  //  material texture transform lazy route scene projection material modal route camera 
  //  camera material geometry modal scene transform frame frame preview matrix shader 
  //  quaternion mesh texture projection scene texture vector route vector shader modal 
  //  vector camera matrix light quaternion projection route texture texture material feature 
  //  scene feature matrix matrix feature quaternion view matrix scene projection shader 
  //  transform shader lazy material material shader preview projection vector plugin render 
  //  modal feature material lazy projection feature texture quaternion route shader plugin 
  //  quaternion feature lazy light transform geometry view modal mesh feature vector 
  //  mesh route scene transform vector matrix preview matrix modal light plugin 
  //  quaternion shader vector mesh frame scene modal view scene route preview 
  //  modal route camera projection projection scene pipeline lazy projection feature light 
  //  scene shader geometry modal frame modal mesh texture camera transform quaternion 
  //  animation projection modal quaternion quaternion camera matrix animation pipeline texture texture 
  //  light mesh transform quaternion camera transform animation animation projection camera frame 
  //  frame pipeline animation preview feature view transform material vector vector shader 
  //  plugin view mesh pipeline frame transform route animation view view scene 
  //  modal preview material texture preview light light route camera camera render 
  //  plugin texture route plugin frame render plugin pipeline material view vector 
  //  mesh light frame feature route pipeline view transform projection mesh animation 
  //  route route modal feature frame route light preview route render matrix 
  //  material vector render pipeline feature material vector matrix quaternion animation lazy 
  //  material lazy pipeline material animation projection plugin texture lazy projection modal 
  //  geometry frame camera feature feature frame light lazy animation camera vector 
  //  plugin preview frame modal lazy scene matrix lazy shader quaternion texture 
  //  projection mesh quaternion geometry animation light projection frame feature route projection 
  //  camera feature shader transform pipeline vector projection quaternion scene route feature 
  //  scene mesh feature plugin camera frame vector frame quaternion plugin scene 
  //  modal frame mesh pipeline texture view plugin light projection projection plugin 
  //  shader mesh lazy pipeline render plugin plugin preview material scene matrix 
  //  lazy plugin quaternion pipeline render shader mesh modal pipeline texture material 
  //  frame lazy quaternion scene animation geometry scene route transform material quaternion 
  //  geometry matrix transform animation texture frame geometry light quaternion animation light 
  //  shader modal preview frame geometry geometry pipeline vector view pipeline vector 
  //  lazy route pipeline material animation modal feature camera animation matrix projection 
  //  pipeline matrix light route matrix mesh plugin pipeline camera preview quaternion 
  //  frame vector pipeline matrix material geometry matrix mesh quaternion light frame 
  //  projection feature animation plugin light feature frame scene projection preview modal 
  //  vector plugin matrix lazy scene preview shader light shader quaternion camera 
  //  transform material texture light preview animation frame mesh scene preview lazy 
  //  scene matrix quaternion quaternion quaternion pipeline light scene animation lazy feature 
  //  frame geometry route route shader quaternion transform mesh vector plugin frame 
  //  render material view plugin quaternion pipeline transform mesh plugin view scene 
  //  quaternion vector projection geometry route transform camera texture lazy camera matrix 
  //  camera material matrix lazy lazy preview matrix mesh plugin geometry lazy 
  //  geometry lazy transform view route material transform plugin material material scene 
  //  light animation transform transform route quaternion quaternion feature preview camera preview 
  //  render vector material plugin mesh animation geometry vector vector lazy lazy 
  //  feature geometry frame light geometry view feature shader plugin mesh shader 
  //  texture projection projection lazy view animation shader pipeline feature camera render 
  //  scene preview shader feature material plugin view quaternion vector lazy animation 
  //  scene projection material plugin camera scene texture route shader material matrix 
  //  frame plugin light lazy view mesh matrix plugin geometry pipeline view 
  //  lazy animation scene transform scene route transform matrix frame transform render 
  //  animation view lazy matrix texture modal feature modal modal light animation 
  //  vector animation vector scene mesh view view scene lazy view mesh 
  //  scene texture vector quaternion transform projection pipeline pipeline shader pipeline pipeline 
  //  material camera projection vector preview matrix geometry pipeline modal view matrix 
  //  texture vector modal material transform lazy texture route animation transform projection 
  //  preview plugin scene modal frame camera route lazy material frame material 
  //  light render scene light route feature route lazy lazy material scene 
  //  matrix texture quaternion modal light scene animation frame view feature lazy 
  //  mesh projection transform feature plugin animation camera camera mesh modal material 
  //  animation matrix pipeline modal plugin light view geometry animation geometry light 
  //  material projection geometry pipeline camera material projection plugin frame camera plugin 
  //  shader camera route view matrix frame route mesh feature route texture 
  //  render vector material camera shader route route vector preview route material 
  //  vector view transform projection mesh material preview texture shader view lazy 
  //  preview modal projection view texture scene modal feature material plugin render 
  //  mesh material mesh lazy quaternion camera frame projection lazy texture animation 
  //  route modal render transform mesh shader transform preview plugin mesh render 
  //  matrix matrix transform preview plugin quaternion plugin light mesh feature render 
  //  route plugin camera modal plugin lazy material projection mesh render scene 
  //  pipeline frame view projection feature lazy projection transform pipeline camera render 
  //  shader modal projection scene mesh lazy projection vector mesh camera texture 
  //  quaternion feature preview render light texture shader plugin scene mesh route 
  //  view texture preview light scene render matrix lazy quaternion projection texture 
  //  frame texture shader projection vector route feature lazy vector geometry light 
  //  preview render camera mesh animation texture vector texture transform camera plugin 
  //  view quaternion preview feature preview light mesh camera lazy mesh route 
  //  feature modal projection plugin geometry vector texture pipeline feature plugin plugin 
  //  lazy camera animation pipeline feature frame transform mesh view render plugin 
  //  projection preview texture material render scene frame quaternion texture matrix quaternion 
  //  vector plugin scene feature modal preview pipeline matrix scene modal animation 
  //  quaternion geometry quaternion quaternion frame material route plugin preview camera frame 
  //  scene lazy view scene frame route feature transform feature modal texture 
  //  vector projection scene light animation projection scene view vector transform preview 
  //  feature feature pipeline light texture route frame mesh shader mesh quaternion 
  //  lazy projection mesh pipeline mesh scene texture feature lazy vector frame 
  //  transform vector light transform modal quaternion camera camera modal preview pipeline 
  //  lazy modal render transform vector feature plugin shader transform animation camera 
  //  frame geometry projection modal view lazy lazy transform scene light transform 
  //  scene pipeline pipeline matrix feature modal frame feature preview light mesh 
  //  texture modal render vector lazy preview route lazy frame mesh animation 
  //  material mesh transform texture vector vector quaternion animation matrix feature view 
  //  frame lazy pipeline animation pipeline shader matrix pipeline frame render material 
  //  shader material quaternion view texture projection transform animation camera plugin shader 
  //  frame plugin mesh texture preview modal shader camera mesh transform mesh 
  //  plugin quaternion scene plugin preview modal pipeline texture modal modal quaternion 
  //  texture feature lazy matrix route projection quaternion pipeline matrix view projection 
  //  texture animation shader feature preview route plugin shader matrix vector geometry 
  //  camera projection animation render plugin scene feature frame vector vector quaternion 
  //  light frame preview
  */
})();

// mod-lazy-0021 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[21] = {
    id: 21,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0021';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '263');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  geometry camera light plugin frame animation pipeline feature view matrix camera light 
  //  mesh route render view material camera material mesh render geometry material 
  //  quaternion projection material animation vector matrix quaternion render modal projection pipeline 
  //  lazy pipeline scene quaternion route plugin view transform mesh plugin material 
  //  modal texture route view quaternion view scene transform shader shader animation 
  //  mesh texture shader pipeline feature camera lazy light texture geometry feature 
  //  lazy geometry geometry modal pipeline animation light scene transform preview view 
  //  projection pipeline light quaternion view animation camera feature light modal mesh 
  //  camera geometry mesh mesh light render frame modal projection modal light 
  //  view scene preview vector shader shader route camera scene quaternion render 
  //  render projection preview light plugin animation material feature animation scene light 
  //  preview camera quaternion scene plugin feature matrix matrix route route transform 
  //  scene light frame preview transform preview pipeline render projection lazy view 
  //  vector route preview scene texture transform preview vector lazy geometry matrix 
  //  render feature plugin mesh feature animation modal mesh pipeline geometry matrix 
  //  render texture frame texture camera preview route vector pipeline render modal 
  //  render modal lazy animation modal matrix scene quaternion route modal feature 
  //  lazy quaternion animation transform lazy quaternion geometry camera camera mesh material 
  //  quaternion plugin render geometry route feature modal vector camera feature projection 
  //  quaternion modal view frame projection geometry feature vector modal preview shader 
  //  projection light projection projection frame plugin vector vector preview render animation 
  //  plugin animation vector pipeline feature material material light projection mesh modal 
  //  matrix lazy scene shader material animation geometry modal animation camera render 
  //  render vector shader route feature frame light camera view shader animation 
  //  material feature lazy frame lazy frame lazy shader preview projection preview 
  //  pipeline material transform matrix matrix lazy preview quaternion preview texture shader 
  //  transform mesh light scene camera lazy plugin pipeline quaternion lazy projection 
  //  feature camera view scene texture quaternion transform render camera transform transform 
  //  geometry lazy projection plugin render matrix view quaternion feature light modal 
  //  matrix transform material texture matrix projection modal geometry transform shader geometry 
  //  matrix texture view view preview render quaternion vector vector view view 
  //  modal lazy view texture frame quaternion lazy matrix scene route frame 
  //  projection transform plugin transform lazy transform render modal plugin animation geometry 
  //  feature projection render frame lazy scene material mesh texture quaternion light 
  //  geometry matrix route projection modal render frame quaternion shader frame mesh 
  //  matrix view scene feature mesh frame transform vector frame shader animation 
  //  light render light matrix render projection plugin view modal preview feature 
  //  lazy texture view scene projection light lazy modal matrix matrix shader 
  //  render frame feature mesh preview frame pipeline transform material feature camera 
  //  quaternion transform transform lazy route geometry scene mesh light pipeline lazy 
  //  geometry transform texture view shader shader render camera plugin pipeline camera 
  //  plugin geometry vector preview animation frame modal geometry mesh mesh vector 
  //  view scene vector pipeline light light transform feature render modal scene 
  //  matrix scene view texture projection texture projection quaternion mesh plugin lazy 
  //  frame material preview shader scene projection quaternion texture matrix render pipeline 
  //  preview feature route route material preview scene mesh mesh projection route 
  //  lazy geometry material modal preview scene material geometry route route plugin 
  //  lazy frame light lazy lazy render animation animation pipeline frame mesh 
  //  mesh shader frame frame transform pipeline quaternion geometry quaternion mesh plugin 
  //  route vector geometry quaternion light pipeline plugin projection scene matrix camera 
  //  mesh preview vector preview camera geometry transform pipeline projection material pipeline 
  //  plugin scene quaternion route material scene frame material material matrix matrix 
  //  view quaternion vector vector projection render vector pipeline quaternion projection matrix 
  //  feature render transform feature texture scene vector shader lazy view material 
  //  frame light preview mesh lazy camera animation shader lazy shader feature 
  //  animation plugin lazy material modal view geometry geometry feature scene camera 
  //  lazy lazy light material matrix texture material pipeline vector feature mesh 
  //  lazy projection view view animation transform render view preview projection matrix 
  //  animation shader preview material frame feature matrix quaternion geometry preview camera 
  //  camera transform material projection mesh plugin shader material vector light material 
  //  material plugin vector material camera mesh projection scene projection route quaternion 
  //  animation matrix mesh matrix route lazy view lazy scene texture lazy 
  //  render feature feature texture material shader matrix feature material light mesh 
  //  view lazy scene preview light pipeline scene view view matrix route 
  //  shader scene lazy material texture material projection mesh feature camera mesh 
  //  animation animation vector pipeline animation animation material vector shader render animation 
  //  geometry light scene vector mesh vector preview geometry geometry vector transform 
  //  render animation shader plugin vector render frame quaternion frame shader material 
  //  preview shader preview plugin light scene vector feature geometry camera lazy 
  //  transform shader light frame render plugin view geometry material matrix shader 
  //  vector lazy light geometry animation camera texture material route view vector 
  //  modal quaternion feature route feature mesh feature transform material pipeline camera 
  //  material mesh feature shader view view camera texture matrix lazy matrix 
  //  projection transform feature preview geometry projection feature feature matrix modal lazy 
  //  texture projection lazy material render render geometry material feature texture projection 
  //  animation mesh geometry plugin texture view feature mesh frame projection projection 
  //  projection matrix render texture mesh transform scene preview route geometry quaternion 
  //  pipeline render geometry frame texture mesh pipeline shader matrix shader plugin 
  //  matrix material plugin render light camera transform vector lazy shader feature 
  //  scene transform vector scene view projection feature feature material matrix lazy 
  //  light texture frame view feature light mesh pipeline mesh vector route 
  //  geometry animation mesh frame plugin plugin mesh geometry camera animation geometry 
  //  matrix transform plugin plugin pipeline vector view render scene route texture 
  //  frame preview view lazy view preview pipeline mesh view mesh modal 
  //  transform plugin quaternion mesh quaternion mesh shader geometry render projection matrix 
  //  projection shader geometry plugin quaternion frame shader route material vector quaternion 
  //  pipeline render pipeline matrix route route scene animation quaternion texture modal 
  //  matrix vector vector feature geometry modal route feature matrix frame matrix 
  //  animation animation pipeline geometry light modal pipeline animation animation route transform 
  //  lazy vector render preview render matrix lazy geometry animation material quaternion 
  //  view render light modal geometry texture plugin animation projection matrix quaternion 
  //  feature quaternion modal view mesh route modal quaternion vector feature scene 
  //  view pipeline vector texture render modal camera lazy projection view projection 
  //  mesh view frame light render route animation feature preview vector scene 
  //  plugin transform geometry view preview plugin projection quaternion pipeline view pipeline 
  //  geometry scene vector projection matrix frame lazy geometry modal view scene 
  //  geometry plugin vector matrix scene plugin view modal transform geometry mesh 
  //  scene render modal matrix animation render geometry route projection frame texture 
  //  matrix vector projection light texture material mesh preview view transform material 
  //  scene transform projection scene render vector matrix shader lazy preview view 
  //  light material matrix frame animation material route shader scene vector projection 
  //  material route material shader plugin frame preview transform transform texture lazy 
  //  camera plugin animation modal light render feature preview scene route route 
  //  frame lazy lazy scene vector preview shader frame transform scene shader 
  //  frame texture camera modal scene material texture material quaternion animation geometry 
  //  geometry render scene pipeline quaternion feature lazy mesh mesh geometry frame 
  //  projection frame preview route material view modal preview matrix mesh modal 
  //  material mesh texture frame light modal mesh matrix matrix geometry material 
  //  camera vector route render projection scene scene animation plugin transform frame 
  //  view projection vector mesh vector frame view shader modal modal shader 
  //  frame mesh quaternion texture view route light plugin light animation light 
  //  modal modal camera quaternion route geometry transform camera feature transform preview 
  //  quaternion texture mesh scene matrix preview render geometry vector mesh route 
  //  route animation projection modal quaternion scene scene geometry modal scene mesh 
  //  animation feature pipeline material route texture geometry preview modal vector quaternion 
  //  frame animation route feature light pipeline light frame shader route camera 
  //  view plugin shader modal texture view light geometry shader material render 
  //  shader material quaternion scene quaternion matrix route texture projection geometry light 
  //  camera light light material route transform feature preview material frame vector 
  //  shader pipeline geometry light feature lazy route plugin transform lazy mesh 
  //  plugin vector render projection animation matrix plugin scene route preview material 
  //  light route projection shader light feature render pipeline route quaternion render 
  //  quaternion projection light view plugin route quaternion mesh light vector matrix 
  //  animation transform modal camera light frame texture pipeline mesh lazy material 
  //  frame quaternion transform view mesh shader preview mesh frame lazy mesh 
  //  modal pipeline plugin geometry preview shader projection transform lazy frame geometry 
  //  view plugin camera view material scene route preview route pipeline texture 
  //  geometry vector light render feature preview projection camera pipeline pipeline quaternion 
  //  frame scene texture lazy vector view route lazy transform geometry plugin 
  //  feature plugin frame plugin lazy quaternion texture mesh plugin quaternion modal 
  //  pipeline lazy shader texture transform matrix route modal feature render projection 
  //  material transform preview quaternion quaternion animation scene light view feature feature 
  //  plugin preview camera plugin projection preview transform material vector route feature 
  //  view pipeline matrix view geometry material quaternion geometry material texture quaternion 
  //  camera route view projection light scene view camera lazy matrix geometry 
  //  vector matrix projection preview light lazy feature camera feature geometry geometry 
  //  projection animation matrix lazy render material quaternion route projection geometry render 
  //  feature plugin transform camera quaternion frame geometry modal plugin render scene 
  //  render plugin frame quaternion preview render mesh animation route preview material 
  //  scene light animation mesh modal transform quaternion pipeline view feature frame 
  //  camera geometry geometry render matrix pipeline transform shader feature material feature 
  //  plugin mesh plugin camera animation route vector shader pipeline vector shader 
  //  texture matrix plugin vector scene matrix lazy feature projection animation shader 
  //  animation light transform texture transform mesh quaternion render mesh quaternion geometry 
  //  mesh lazy lazy animation animation
  */
})();

// mod-lazy-0022 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[22] = {
    id: 22,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0022';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '67');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  geometry texture geometry transform feature quaternion render projection projection lazy route render 
  //  scene animation view frame preview quaternion mesh light modal pipeline feature 
  //  light render shader mesh modal material feature transform shader material frame 
  //  animation preview scene frame light scene view feature texture view mesh 
  //  preview texture light render route transform transform projection route mesh shader 
  //  plugin mesh modal shader plugin preview pipeline preview camera lazy preview 
  //  pipeline feature view mesh pipeline shader texture light feature frame plugin 
  //  geometry geometry vector geometry scene material view frame vector modal transform 
  //  camera mesh matrix render scene geometry view matrix render scene camera 
  //  light geometry camera animation lazy render material render plugin lazy material 
  //  texture frame feature preview projection pipeline vector animation mesh material view 
  //  scene projection render pipeline pipeline scene transform animation pipeline matrix camera 
  //  plugin material modal shader frame mesh render plugin transform camera modal 
  //  preview animation projection geometry animation mesh route feature render feature scene 
  //  modal quaternion vector plugin feature animation mesh vector feature quaternion camera 
  //  lazy material preview pipeline matrix quaternion shader view shader material projection 
  //  mesh feature plugin plugin material preview matrix camera camera preview lazy 
  //  matrix quaternion geometry mesh lazy scene light lazy preview quaternion projection 
  //  shader material modal preview transform scene projection projection camera pipeline preview 
  //  preview texture quaternion quaternion animation material pipeline scene modal camera quaternion 
  //  shader matrix modal matrix feature scene shader view texture animation projection 
  //  render route preview material pipeline render shader route texture lazy view 
  //  frame route route plugin material feature camera projection frame geometry frame 
  //  route animation preview shader shader material scene texture vector view mesh 
  //  matrix mesh lazy pipeline texture view geometry plugin vector matrix shader 
  //  vector feature render animation scene lazy mesh camera shader scene mesh 
  //  lazy lazy animation route transform animation view route transform material geometry 
  //  modal lazy mesh scene feature plugin preview quaternion lazy render pipeline 
  //  route shader plugin preview render preview texture pipeline texture projection frame 
  //  quaternion animation plugin preview transform view view plugin matrix material route 
  //  modal material plugin quaternion vector projection render geometry transform shader quaternion 
  //  render shader shader matrix animation preview matrix geometry shader scene route 
  //  pipeline preview lazy matrix material preview geometry camera render matrix geometry 
  //  pipeline material matrix animation geometry plugin lazy texture preview render lazy 
  //  feature render lazy lazy shader route mesh plugin route modal vector 
  //  camera vector mesh vector mesh transform quaternion matrix scene modal projection 
  //  texture light scene camera transform camera render animation geometry geometry route 
  //  scene feature quaternion modal render matrix frame texture pipeline transform transform 
  //  render lazy pipeline animation quaternion lazy modal mesh route material transform 
  //  view quaternion feature geometry camera scene preview render vector shader render 
  //  shader render frame preview lazy route projection frame material animation pipeline 
  //  light light view shader pipeline projection animation view transform pipeline lazy 
  //  frame mesh view vector camera frame camera route modal modal transform 
  //  camera plugin light material animation route light modal light feature route 
  //  mesh transform frame mesh shader material mesh quaternion pipeline animation scene 
  //  frame matrix route projection preview modal pipeline mesh projection preview view 
  //  render light matrix scene scene pipeline view frame transform vector transform 
  //  animation lazy animation shader matrix pipeline feature modal render animation plugin 
  //  pipeline feature render shader preview light lazy transform matrix shader plugin 
  //  modal quaternion plugin matrix render route frame shader plugin shader texture 
  //  light lazy camera material render view geometry modal mesh quaternion modal 
  //  camera preview camera feature mesh lazy render modal shader mesh view 
  //  animation pipeline shader camera preview animation projection shader animation projection light 
  //  texture frame modal matrix animation mesh pipeline camera mesh light render 
  //  modal projection lazy lazy preview vector feature pipeline frame view preview 
  //  shader frame route lazy view feature scene feature pipeline modal transform 
  //  lazy matrix route pipeline material material mesh feature frame animation modal 
  //  frame vector transform vector camera route lazy material matrix route projection 
  //  modal light shader view scene scene camera view projection feature render 
  //  quaternion animation frame geometry light geometry preview render geometry frame animation 
  //  route texture texture view animation route scene camera geometry animation frame 
  //  matrix pipeline shader feature frame matrix scene modal modal material shader 
  //  light texture route camera mesh material scene quaternion modal render light 
  //  feature shader render matrix camera view view projection transform geometry animation 
  //  projection feature feature texture material vector transform render light vector modal 
  //  route route feature shader transform light animation modal transform lazy pipeline 
  //  feature transform quaternion modal transform modal feature render material route transform 
  //  preview camera texture camera plugin preview lazy frame light texture quaternion 
  //  plugin route vector light light shader render texture projection material camera 
  //  frame preview route texture scene scene shader scene matrix lazy projection 
  //  lazy matrix geometry light route modal modal preview plugin transform preview 
  //  pipeline quaternion feature texture route shader frame camera light camera projection 
  //  scene view shader texture frame render geometry modal frame transform material 
  //  pipeline render scene geometry shader plugin frame quaternion texture lazy vector 
  //  matrix route pipeline material matrix render modal light mesh scene modal 
  //  preview quaternion preview animation route vector light mesh route projection shader 
  //  geometry feature plugin view frame plugin material mesh transform pipeline view 
  //  view scene plugin lazy modal mesh render feature shader material route 
  //  view pipeline feature feature render preview pipeline modal pipeline matrix quaternion 
  //  pipeline light view preview projection route transform plugin projection vector camera 
  //  plugin route frame geometry route light scene pipeline scene animation pipeline 
  //  geometry pipeline shader material modal scene lazy view render vector lazy 
  //  geometry projection camera lazy route shader frame modal shader light render 
  //  view material pipeline modal texture lazy projection matrix shader geometry vector 
  //  render light pipeline preview preview shader view preview shader matrix mesh 
  //  render pipeline quaternion animation frame geometry camera frame texture feature feature 
  //  scene texture pipeline scene light transform quaternion vector frame geometry plugin 
  //  camera material shader mesh matrix preview preview light route material projection 
  //  feature camera quaternion preview transform modal geometry shader camera render frame 
  //  shader render texture mesh mesh material geometry scene transform shader render 
  //  route render transform frame route geometry shader route frame pipeline matrix 
  //  texture matrix render view preview view frame quaternion preview route mesh 
  //  vector scene lazy preview lazy mesh frame geometry scene lazy route 
  //  frame transform modal vector transform projection quaternion plugin feature projection frame 
  //  modal frame feature preview light modal render view shader view vector 
  //  feature light geometry projection quaternion texture lazy matrix lazy render shader 
  //  scene light quaternion mesh lazy material vector matrix light material scene 
  //  pipeline projection route view light matrix projection lazy vector feature matrix 
  //  view lazy material preview animation scene texture camera animation light matrix 
  //  matrix camera texture modal route view view mesh frame mesh pipeline 
  //  frame view frame projection shader modal lazy transform texture lazy quaternion 
  //  pipeline modal route matrix preview animation preview projection lazy projection modal 
  //  preview vector render mesh preview matrix render camera plugin shader camera 
  //  scene texture feature material feature geometry texture matrix quaternion feature route 
  //  material view view vector camera material scene frame modal pipeline camera 
  //  frame material lazy quaternion shader geometry mesh preview matrix projection view 
  //  animation modal shader pipeline quaternion animation light animation feature matrix transform 
  //  transform geometry frame quaternion animation mesh pipeline vector animation route frame 
  //  pipeline view light route quaternion pipeline render scene geometry pipeline camera 
  //  shader quaternion transform route preview shader render camera feature mesh material 
  //  render route feature camera pipeline matrix geometry plugin shader plugin modal 
  //  plugin mesh transform scene matrix material plugin shader feature mesh projection 
  //  route mesh frame modal shader projection camera feature render mesh scene 
  //  mesh plugin frame shader light shader feature matrix lazy material texture 
  //  view mesh vector geometry quaternion matrix render shader feature transform texture 
  //  material plugin mesh preview frame vector projection frame projection shader lazy 
  //  texture texture lazy quaternion feature lazy geometry vector matrix geometry view 
  //  material route geometry light mesh scene texture texture quaternion preview matrix 
  //  modal preview texture feature light vector light mesh mesh view lazy 
  //  feature pipeline material material lazy transform animation texture view frame mesh 
  //  plugin render scene matrix transform vector animation feature lazy modal animation 
  //  vector vector vector render mesh geometry shader camera transform route render 
  //  vector scene light material shader matrix feature frame vector modal lazy 
  //  texture mesh pipeline frame pipeline animation scene light matrix preview frame 
  //  mesh frame geometry preview route quaternion material render geometry render render 
  //  camera shader pipeline matrix camera route scene preview modal projection vector 
  //  material shader view pipeline matrix preview material frame light pipeline modal 
  //  feature light transform matrix frame pipeline route lazy light feature lazy 
  //  animation material matrix view material matrix plugin shader mesh lazy animation 
  //  lazy mesh feature projection animation view animation matrix pipeline feature quaternion 
  //  shader modal preview render quaternion light material geometry vector shader scene 
  //  pipeline quaternion matrix light frame modal modal route view lazy lazy 
  //  projection vector camera lazy geometry geometry feature scene geometry camera pipeline 
  //  frame shader light lazy scene scene matrix route camera route texture 
  //  modal projection material geometry vector shader mesh projection frame lazy shader 
  //  matrix shader animation camera render preview view geometry vector lazy material 
  //  material modal modal light camera geometry preview pipeline plugin mesh transform 
  //  scene feature camera transform mesh matrix mesh feature route plugin light 
  //  mesh camera lazy feature pipeline transform feature texture transform plugin matrix 
  //  preview mesh vector quaternion geometry render material transform pipeline preview matrix 
  //  shader feature plugin feature scene view mesh scene feature projection projection 
  //  view texture feature pipeline material vector route frame lazy render quaternion 
  //  camera projection render pipeline shader vector projection pipeline view mesh material 
  //  vector camera feature light mesh animation matrix animation render light preview 
  //  matrix preview frame scene plugin vector light light view frame preview 
  //  geometry shader transform mesh quaternion route light geometry plugin mesh texture 
  //  frame view geometry shader projection
  */
})();

// mod-lazy-0023 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[23] = {
    id: 23,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0023';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '113');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  modal pipeline render pipeline shader preview scene matrix plugin matrix feature scene 
  //  vector shader shader preview render shader transform pipeline render quaternion preview 
  //  plugin texture camera plugin render mesh feature geometry frame view texture 
  //  transform geometry modal lazy matrix projection frame plugin camera material vector 
  //  scene camera camera view plugin lazy feature route camera pipeline pipeline 
  //  pipeline matrix view preview frame matrix quaternion camera animation feature camera 
  //  lazy route animation render route frame frame geometry pipeline material geometry 
  //  texture camera render animation geometry camera mesh quaternion camera mesh quaternion 
  //  lazy feature geometry mesh mesh light transform scene frame modal plugin 
  //  material route frame preview lazy route vector texture animation plugin matrix 
  //  modal feature render modal camera shader shader plugin projection geometry geometry 
  //  scene render view mesh geometry geometry scene render camera feature render 
  //  render shader modal view texture modal frame light vector camera material 
  //  feature lazy vector quaternion light frame plugin view animation plugin modal 
  //  quaternion vector scene pipeline shader transform plugin geometry render light lazy 
  //  route matrix projection pipeline lazy geometry frame matrix camera pipeline mesh 
  //  preview projection matrix matrix transform shader texture lazy transform scene render 
  //  light lazy geometry camera preview matrix feature lazy modal preview projection 
  //  render render pipeline frame plugin frame vector texture plugin mesh animation 
  //  vector plugin geometry vector route vector pipeline transform material route vector 
  //  vector preview plugin animation projection route frame light pipeline vector material 
  //  shader scene quaternion matrix light light matrix frame quaternion transform feature 
  //  texture mesh animation camera projection transform modal modal transform light lazy 
  //  shader material mesh modal modal geometry render plugin plugin projection camera 
  //  animation light animation light shader geometry view texture quaternion material animation 
  //  route shader feature animation lazy quaternion quaternion scene mesh mesh camera 
  //  projection lazy quaternion lazy render material route material quaternion quaternion matrix 
  //  geometry feature shader view pipeline vector geometry lazy vector transform view 
  //  preview scene camera camera light scene geometry lazy animation matrix modal 
  //  plugin lazy scene matrix transform render material quaternion matrix frame render 
  //  projection quaternion matrix route material camera modal transform preview render lazy 
  //  plugin plugin vector lazy animation light shader transform view texture vector 
  //  modal quaternion lazy projection modal plugin pipeline modal feature render camera 
  //  shader matrix view shader vector view animation mesh quaternion mesh preview 
  //  camera lazy preview geometry route light pipeline geometry projection shader route 
  //  projection pipeline view view feature mesh transform mesh light frame light 
  //  scene pipeline projection camera transform projection projection geometry geometry plugin view 
  //  mesh lazy route vector pipeline view route view view route route 
  //  route animation material route view projection plugin geometry route pipeline pipeline 
  //  animation matrix material shader geometry camera plugin texture view texture preview 
  //  lazy projection frame mesh route projection material modal render geometry mesh 
  //  frame frame preview material shader projection shader mesh matrix view scene 
  //  lazy camera preview modal material light modal camera pipeline animation material 
  //  plugin render route matrix vector quaternion preview animation render route scene 
  //  quaternion pipeline plugin feature quaternion material view animation matrix feature render 
  //  render light route geometry shader shader scene material preview transform feature 
  //  render material route texture frame plugin render shader lazy feature transform 
  //  view light route shader texture preview geometry camera light plugin quaternion 
  //  frame route light projection modal view lazy modal render scene texture 
  //  geometry frame vector quaternion quaternion transform projection animation light route view 
  //  plugin vector geometry mesh mesh render view animation pipeline modal pipeline 
  //  mesh camera animation view geometry pipeline light lazy route material render 
  //  material modal modal modal geometry render texture frame lazy mesh route 
  //  view feature shader scene route camera projection modal vector quaternion view 
  //  preview projection mesh feature animation shader feature transform view frame mesh 
  //  lazy mesh lazy frame texture quaternion projection lazy texture animation transform 
  //  vector texture mesh vector transform render scene render texture preview frame 
  //  mesh camera lazy route light mesh scene quaternion view geometry view 
  //  material lazy matrix light projection feature plugin mesh lazy animation transform 
  //  material transform preview transform projection projection matrix modal feature animation projection 
  //  projection vector route pipeline material modal geometry camera modal render route 
  //  vector transform transform projection transform lazy light route quaternion shader frame 
  //  vector frame vector mesh geometry modal material modal modal camera preview 
  //  render transform plugin material shader view camera light route preview lazy 
  //  material pipeline scene scene view feature light geometry transform render light 
  //  route scene modal mesh projection quaternion route transform modal pipeline transform 
  //  preview pipeline geometry animation geometry shader frame mesh matrix mesh matrix 
  //  view render frame frame preview vector route shader material route preview 
  //  texture vector projection transform animation lazy material matrix vector texture shader 
  //  modal feature mesh preview vector projection transform light pipeline camera shader 
  //  scene feature plugin projection render lazy projection shader lazy pipeline render 
  //  feature light light preview texture light preview preview preview texture transform 
  //  feature render transform render pipeline geometry lazy mesh geometry quaternion matrix 
  //  feature geometry route frame scene texture material scene animation vector light 
  //  lazy route material matrix shader scene preview light projection geometry pipeline 
  //  material plugin quaternion scene frame material texture feature shader scene pipeline 
  //  light preview animation frame scene preview texture transform texture scene plugin 
  //  vector pipeline vector plugin render transform scene vector modal plugin plugin 
  //  mesh animation light light view transform texture material pipeline feature scene 
  //  quaternion plugin lazy camera transform scene feature texture transform route pipeline 
  //  transform matrix scene plugin material transform feature shader modal render geometry 
  //  mesh matrix lazy scene pipeline vector vector animation shader transform camera 
  //  plugin shader render preview preview modal vector lazy animation modal pipeline 
  //  plugin preview camera projection pipeline feature scene mesh mesh matrix matrix 
  //  frame quaternion view preview texture scene modal animation animation frame view 
  //  lazy matrix transform quaternion render geometry feature view shader shader shader 
  //  feature animation vector geometry preview render camera quaternion geometry animation modal 
  //  shader mesh shader route projection render render vector light plugin geometry 
  //  mesh frame camera render quaternion matrix material vector transform camera shader 
  //  vector plugin transform view material feature pipeline modal mesh preview route 
  //  camera vector projection frame feature preview pipeline scene view shader shader 
  //  mesh pipeline render preview projection plugin frame matrix feature lazy vector 
  //  light light texture vector lazy frame light render matrix render light 
  //  feature plugin transform mesh pipeline vector plugin quaternion matrix transform lazy 
  //  preview matrix render texture pipeline preview texture lazy texture preview camera 
  //  mesh transform render scene matrix route material transform vector material plugin 
  //  route material frame shader route modal shader mesh texture preview vector 
  //  shader transform feature light vector route modal shader scene scene mesh 
  //  lazy shader light mesh texture matrix shader lazy render shader material 
  //  pipeline texture view shader camera transform light quaternion frame lazy scene 
  //  pipeline camera route camera animation view route lazy material transform projection 
  //  camera material material light frame mesh material quaternion quaternion quaternion feature 
  //  route pipeline matrix matrix quaternion route frame modal route mesh matrix 
  //  lazy preview frame route material light quaternion light material view mesh 
  //  render render shader pipeline shader geometry pipeline shader camera preview vector 
  //  camera material pipeline feature quaternion transform scene pipeline light plugin transform 
  //  route geometry frame route plugin animation route camera matrix modal render 
  //  texture pipeline frame scene plugin light frame plugin geometry feature lazy 
  //  projection modal render modal camera modal vector render projection geometry camera 
  //  light scene modal lazy animation camera animation render animation feature modal 
  //  preview lazy projection mesh projection plugin plugin mesh modal texture vector 
  //  view vector plugin light frame quaternion transform pipeline pipeline vector matrix 
  //  shader lazy matrix shader vector mesh preview geometry scene scene texture 
  //  light scene matrix projection feature mesh geometry lazy plugin light texture 
  //  render vector shader modal modal lazy render geometry preview geometry shader 
  //  vector texture quaternion view mesh pipeline modal projection preview mesh matrix 
  //  frame mesh animation texture texture render quaternion frame lazy pipeline matrix 
  //  route shader light view quaternion mesh material texture preview render view 
  //  transform route view mesh feature feature vector lazy vector transform frame 
  //  mesh view camera render preview route frame transform render transform render 
  //  vector frame camera texture render quaternion modal light mesh projection matrix 
  //  projection light plugin light pipeline matrix shader pipeline render modal mesh 
  //  quaternion pipeline texture feature preview render render geometry route animation view 
  //  frame light quaternion route feature texture modal route mesh frame scene 
  //  lazy shader matrix material geometry modal geometry camera quaternion pipeline scene 
  //  view light modal view route quaternion transform shader camera vector frame 
  //  texture preview transform geometry light feature route frame render feature preview 
  //  light material route render light plugin route mesh matrix plugin texture 
  //  lazy animation animation vector texture transform frame material material matrix shader 
  //  transform light projection vector render quaternion shader view pipeline lazy scene 
  //  route preview render scene shader scene transform modal matrix geometry transform 
  //  modal shader view camera route light view geometry pipeline mesh texture 
  //  lazy lazy texture mesh pipeline transform frame animation transform material camera 
  //  mesh quaternion animation geometry projection vector pipeline scene matrix lazy camera 
  //  material projection projection geometry plugin plugin material feature lazy camera material 
  //  material geometry scene camera view mesh texture plugin projection plugin camera 
  //  render animation matrix view geometry projection geometry render preview render quaternion 
  //  geometry route mesh quaternion texture preview modal modal feature matrix route 
  //  pipeline render vector preview pipeline render texture matrix modal vector render 
  //  texture lazy transform animation geometry light pipeline lazy pipeline texture mesh 
  //  matrix plugin geometry vector render material material route plugin render projection 
  //  view shader render quaternion lazy modal material render shader projection mesh 
  //  matrix mesh transform shader projection view scene view animation shader feature 
  //  matrix light modal projection material plugin shader material preview plugin mesh 
  //  preview modal texture transform material modal camera transform route projection route 
  //  camera route lazy quaternion mesh quaternion route
  */
})();

// mod-lazy-0024 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[24] = {
    id: 24,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0024';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '204');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  shader lazy quaternion material plugin pipeline shader camera vector light material route 
  //  mesh route modal preview modal vector matrix view route geometry light 
  //  route pipeline route light preview render scene pipeline scene pipeline shader 
  //  view texture light vector lazy scene modal quaternion preview route render 
  //  texture texture vector frame plugin frame shader feature quaternion geometry modal 
  //  camera shader feature plugin pipeline scene feature animation frame geometry preview 
  //  light matrix lazy route matrix view camera plugin geometry route pipeline 
  //  animation view render scene animation modal shader camera matrix feature lazy 
  //  modal material frame light frame scene animation quaternion feature scene matrix 
  //  texture projection quaternion animation modal quaternion shader scene matrix frame material 
  //  render route render camera feature camera mesh view render transform animation 
  //  camera route mesh matrix matrix pipeline frame material camera feature preview 
  //  mesh camera vector projection plugin transform scene pipeline frame light light 
  //  pipeline pipeline feature frame light scene transform plugin modal render texture 
  //  preview modal quaternion preview frame scene transform quaternion modal scene matrix 
  //  lazy frame view plugin frame animation shader geometry plugin feature shader 
  //  shader scene material lazy animation route frame lazy shader animation route 
  //  matrix vector animation matrix modal quaternion modal light feature lazy preview 
  //  frame shader projection preview texture light matrix matrix geometry camera geometry 
  //  lazy geometry vector geometry pipeline plugin animation vector shader mesh preview 
  //  matrix frame projection route render frame geometry animation route matrix route 
  //  light vector view route transform camera view render scene lazy matrix 
  //  scene scene light animation camera animation pipeline modal transform texture frame 
  //  geometry transform view render projection scene projection pipeline shader light vector 
  //  feature pipeline preview shader animation preview route modal lazy light modal 
  //  camera camera animation projection geometry modal projection mesh feature view shader 
  //  camera shader frame vector geometry quaternion matrix render animation plugin transform 
  //  lazy matrix quaternion animation view lazy render matrix quaternion modal matrix 
  //  matrix vector view render pipeline quaternion mesh geometry quaternion geometry mesh 
  //  modal transform frame frame texture plugin route modal transform vector material 
  //  modal lazy frame matrix light pipeline pipeline shader vector render geometry 
  //  preview matrix transform texture vector camera texture quaternion texture matrix preview 
  //  feature render view modal matrix shader frame animation feature projection camera 
  //  mesh light texture camera feature light quaternion mesh quaternion mesh light 
  //  mesh projection render modal texture animation geometry vector shader light feature 
  //  modal plugin matrix matrix vector shader modal render frame feature camera 
  //  projection shader modal projection light preview pipeline pipeline geometry shader geometry 
  //  plugin geometry pipeline route frame quaternion lazy mesh projection mesh mesh 
  //  quaternion render view mesh render frame scene mesh frame quaternion feature 
  //  lazy mesh vector matrix texture modal plugin vector quaternion vector camera 
  //  modal material plugin geometry texture frame geometry feature camera quaternion plugin 
  //  frame scene scene plugin vector pipeline quaternion light animation preview mesh 
  //  preview vector preview modal material vector matrix lazy vector route shader 
  //  lazy shader light animation modal mesh feature texture lazy render modal 
  //  lazy pipeline pipeline matrix view view vector scene light transform animation 
  //  geometry frame pipeline texture texture scene frame shader pipeline scene matrix 
  //  preview mesh transform pipeline view route quaternion geometry mesh vector lazy 
  //  quaternion preview feature shader camera transform camera lazy texture light shader 
  //  vector shader mesh animation camera shader transform view transform light feature 
  //  vector geometry pipeline preview projection modal transform material plugin material geometry 
  //  modal matrix modal matrix projection material light geometry lazy route scene 
  //  light quaternion pipeline vector preview feature feature light mesh transform render 
  //  matrix geometry geometry preview view route vector pipeline preview light material 
  //  animation vector material transform vector vector render feature route feature quaternion 
  //  plugin feature animation matrix frame scene route scene pipeline plugin shader 
  //  vector pipeline shader scene scene camera quaternion light shader light animation 
  //  geometry view texture camera texture route animation view quaternion material texture 
  //  quaternion animation shader modal pipeline mesh view scene scene view route 
  //  camera quaternion vector plugin modal shader texture pipeline texture route lazy 
  //  quaternion animation feature animation pipeline feature quaternion shader lazy pipeline vector 
  //  matrix route feature feature scene plugin shader quaternion quaternion vector preview 
  //  texture frame render shader plugin quaternion preview render plugin preview camera 
  //  scene material transform transform render pipeline feature mesh route projection texture 
  //  light animation render preview frame camera quaternion shader texture preview view 
  //  camera quaternion view mesh pipeline plugin frame lazy material material frame 
  //  shader preview shader view camera light material shader camera animation preview 
  //  matrix frame geometry route quaternion vector vector preview frame vector light 
  //  vector feature view scene texture lazy camera quaternion geometry projection matrix 
  //  lazy feature animation projection plugin preview animation lazy lazy geometry texture 
  //  geometry route transform matrix quaternion quaternion feature scene render scene quaternion 
  //  modal view preview modal light vector animation pipeline render camera view 
  //  vector view lazy pipeline frame texture light geometry projection route camera 
  //  matrix quaternion light preview matrix animation geometry mesh camera projection route 
  //  view mesh material modal feature material light frame preview render geometry 
  //  scene matrix pipeline matrix mesh render animation light modal pipeline scene 
  //  transform route view quaternion quaternion feature quaternion modal vector modal geometry 
  //  quaternion matrix pipeline material frame preview animation vector lazy plugin transform 
  //  light material plugin plugin mesh scene plugin plugin scene projection vector 
  //  light matrix transform scene geometry modal mesh preview scene texture material 
  //  quaternion mesh modal vector animation scene lazy frame camera feature render 
  //  preview vector projection frame scene modal camera geometry camera transform matrix 
  //  preview vector view geometry camera transform light preview material scene route 
  //  animation modal frame texture matrix geometry mesh shader preview lazy animation 
  //  material feature camera view feature matrix view matrix plugin projection quaternion 
  //  plugin light projection shader mesh camera lazy pipeline texture preview geometry 
  //  render route lazy lazy material transform plugin transform route preview route 
  //  lazy preview scene matrix geometry lazy modal route shader view route 
  //  material quaternion geometry lazy camera route projection material matrix material render 
  //  shader modal preview lazy pipeline route animation preview mesh vector projection 
  //  light geometry render view preview render material plugin light preview transform 
  //  modal transform transform route feature render render material material mesh texture 
  //  feature projection render vector light view geometry route lazy light scene 
  //  preview vector light transform modal vector shader geometry mesh quaternion vector 
  //  light quaternion mesh mesh matrix feature pipeline matrix projection projection view 
  //  view animation view route material modal camera texture render lazy transform 
  //  modal frame plugin transform light vector light shader shader route texture 
  //  vector modal texture geometry render route modal frame modal animation texture 
  //  quaternion preview texture geometry plugin plugin feature pipeline scene matrix frame 
  //  pipeline view projection mesh preview light preview render geometry modal view 
  //  frame preview vector preview transform geometry route frame projection animation transform 
  //  shader texture shader plugin projection frame lazy frame animation projection geometry 
  //  projection route shader quaternion light view route light vector pipeline camera 
  //  material feature animation scene plugin texture texture quaternion feature texture frame 
  //  light plugin quaternion route lazy animation animation animation projection route texture 
  //  camera camera projection route shader view shader preview vector plugin pipeline 
  //  geometry lazy modal animation mesh route animation matrix mesh transform camera 
  //  pipeline projection material quaternion mesh quaternion light projection geometry animation scene 
  //  frame quaternion plugin render projection geometry lazy route transform preview material 
  //  transform texture plugin feature material view render projection camera projection pipeline 
  //  material texture light camera view quaternion frame frame feature quaternion frame 
  //  scene transform mesh mesh lazy vector matrix render scene lazy modal 
  //  matrix camera texture light transform lazy render transform camera feature preview 
  //  modal pipeline mesh pipeline frame render light transform vector geometry projection 
  //  route geometry matrix camera shader material projection light preview light frame 
  //  lazy camera shader view camera frame scene quaternion frame lazy transform 
  //  texture preview vector plugin frame animation feature shader modal frame view 
  //  preview render route route preview feature light projection preview texture projection 
  //  matrix light route camera mesh preview plugin scene shader quaternion transform 
  //  projection lazy light modal shader feature quaternion plugin modal route geometry 
  //  projection frame feature mesh matrix projection plugin animation light route mesh 
  //  view texture texture geometry geometry quaternion texture route transform view feature 
  //  animation light render modal mesh feature geometry animation feature view pipeline 
  //  route scene frame scene matrix route light quaternion plugin texture frame 
  //  lazy scene geometry scene quaternion material quaternion material modal quaternion material 
  //  plugin camera quaternion vector material texture transform light vector view transform 
  //  shader preview feature view geometry transform animation quaternion pipeline quaternion vector 
  //  plugin scene modal route scene plugin render mesh texture texture geometry 
  //  modal texture frame camera texture pipeline projection preview texture texture material 
  //  camera scene pipeline mesh mesh mesh frame lazy vector pipeline frame 
  //  preview mesh pipeline vector render feature pipeline route frame mesh scene 
  //  quaternion route texture view camera material material plugin plugin light plugin 
  //  quaternion matrix mesh projection frame feature shader scene geometry preview render 
  //  shader quaternion plugin light transform feature matrix geometry matrix transform shader 
  //  view modal animation vector transform matrix pipeline modal mesh matrix texture 
  //  preview transform animation lazy render light render material camera mesh render 
  //  route feature matrix view mesh vector feature render modal shader material 
  //  geometry lazy vector camera animation geometry transform pipeline quaternion plugin projection 
  //  transform projection frame matrix light pipeline shader scene light light feature 
  //  geometry vector modal plugin camera texture texture light feature shader route 
  //  material animation projection plugin shader scene preview light render quaternion feature 
  //  scene transform plugin projection light material route geometry shader animation shader 
  //  scene modal matrix plugin camera vector plugin animation modal animation transform 
  //  transform quaternion vector feature animation transform plugin quaternion projection lazy view 
  //  matrix material pipeline render material pipeline camera transform quaternion camera feature 
  //  shader texture plugin
  */
})();

// mod-lazy-0025 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[25] = {
    id: 25,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0025';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '88');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  mesh modal feature render route animation geometry scene shader matrix plugin geometry 
  //  plugin light lazy animation scene modal route preview preview shader light 
  //  route quaternion camera transform shader route vector light lazy transform transform 
  //  matrix projection pipeline feature preview shader route light mesh shader texture 
  //  projection transform plugin render geometry geometry lazy vector material camera lazy 
  //  plugin geometry projection scene quaternion animation render transform geometry render texture 
  //  vector scene light transform camera projection transform matrix matrix feature transform 
  //  mesh matrix shader shader plugin vector modal material transform shader modal 
  //  preview plugin texture route modal modal vector frame texture lazy vector 
  //  texture route scene material projection plugin plugin vector modal pipeline preview 
  //  vector scene animation frame render matrix geometry route light shader mesh 
  //  route light feature scene projection frame preview view vector transform plugin 
  //  modal lazy view animation frame light transform frame lazy mesh lazy 
  //  camera preview route transform modal texture material modal matrix lazy pipeline 
  //  texture transform vector vector lazy modal render geometry material animation render 
  //  pipeline projection preview projection shader matrix geometry geometry view view matrix 
  //  render matrix plugin preview transform lazy matrix matrix light light preview 
  //  projection geometry feature pipeline scene shader light mesh material mesh route 
  //  pipeline view route scene mesh render texture shader preview material mesh 
  //  feature scene transform frame transform scene view preview frame feature vector 
  //  view vector vector frame modal matrix plugin animation camera shader animation 
  //  lazy camera mesh vector transform preview light preview projection camera lazy 
  //  projection material scene preview projection scene modal plugin plugin scene route 
  //  modal vector render frame geometry view animation light material light light 
  //  transform mesh projection texture texture quaternion animation quaternion render geometry view 
  //  feature projection route mesh view mesh shader route feature projection projection 
  //  modal modal scene quaternion quaternion shader quaternion transform quaternion geometry vector 
  //  view geometry material material quaternion pipeline vector projection projection feature pipeline 
  //  feature feature plugin shader projection vector material feature matrix plugin transform 
  //  preview scene preview projection scene modal light mesh texture plugin modal 
  //  mesh feature preview modal feature light geometry projection route shader light 
  //  quaternion lazy feature camera lazy render frame transform shader mesh vector 
  //  feature feature quaternion view pipeline feature material matrix shader projection camera 
  //  projection geometry pipeline view matrix modal material scene render mesh vector 
  //  light route projection animation shader texture lazy light transform scene geometry 
  //  mesh light frame plugin preview scene shader geometry geometry material material 
  //  material lazy modal modal geometry vector quaternion geometry matrix quaternion pipeline 
  //  render light light modal render render projection view pipeline matrix mesh 
  //  quaternion texture texture light preview scene transform matrix preview view view 
  //  plugin animation modal mesh lazy transform vector transform material transform preview 
  //  pipeline geometry modal preview preview camera material shader projection light vector 
  //  route frame feature camera view route preview camera projection vector texture 
  //  pipeline view matrix camera matrix feature route pipeline quaternion vector frame 
  //  geometry light light quaternion plugin light animation geometry quaternion preview transform 
  //  animation camera route shader light scene light projection modal vector shader 
  //  material plugin quaternion view material pipeline geometry scene pipeline pipeline camera 
  //  render preview preview mesh route mesh route geometry lazy camera plugin 
  //  pipeline material geometry feature vector frame shader light material light preview 
  //  material pipeline geometry camera transform geometry render material light preview geometry 
  //  vector scene transform lazy camera transform view geometry pipeline view light 
  //  texture route quaternion texture feature lazy mesh scene animation render light 
  //  feature plugin pipeline frame preview animation geometry geometry plugin quaternion view 
  //  modal pipeline view vector projection pipeline geometry shader geometry texture lazy 
  //  pipeline lazy feature vector scene projection quaternion light shader light projection 
  //  geometry preview modal projection quaternion animation shader preview geometry preview scene 
  //  vector modal material plugin feature mesh modal animation scene plugin animation 
  //  view geometry mesh preview route geometry geometry material light pipeline animation 
  //  vector material material pipeline texture mesh frame route pipeline view animation 
  //  lazy preview camera light frame pipeline mesh geometry material preview view 
  //  pipeline feature shader matrix lazy render lazy projection quaternion quaternion vector 
  //  matrix material frame vector camera animation pipeline modal animation render lazy 
  //  feature route quaternion vector mesh view projection geometry render projection render 
  //  texture lazy geometry shader projection preview projection lazy scene texture scene 
  //  geometry projection preview pipeline preview matrix projection view quaternion mesh transform 
  //  geometry animation material vector frame transform scene geometry plugin camera vector 
  //  render animation light material geometry feature feature render scene shader lazy 
  //  view pipeline frame projection camera preview render geometry transform material quaternion 
  //  material view frame texture vector scene matrix geometry quaternion modal quaternion 
  //  vector animation plugin geometry material frame preview frame geometry vector scene 
  //  view geometry transform frame light animation vector light vector animation modal 
  //  mesh plugin quaternion projection route plugin projection lazy view plugin modal 
  //  quaternion matrix preview quaternion quaternion camera mesh shader preview pipeline pipeline 
  //  animation route route vector preview material animation shader render view preview 
  //  modal route render frame feature shader transform pipeline scene transform light 
  //  view render preview render scene transform scene preview material route vector 
  //  geometry scene pipeline feature texture geometry quaternion material render texture view 
  //  lazy quaternion vector light view feature transform render geometry camera view 
  //  quaternion vector route matrix feature projection preview texture transform texture scene 
  //  texture plugin camera route view pipeline shader feature render route projection 
  //  plugin camera feature lazy texture shader camera animation material transform scene 
  //  animation feature scene quaternion feature light light matrix matrix scene texture 
  //  lazy render camera transform quaternion light shader camera texture camera camera 
  //  render matrix view render modal camera modal shader scene modal view 
  //  plugin geometry projection plugin texture material view route camera frame scene 
  //  material pipeline shader lazy pipeline preview matrix feature scene modal vector 
  //  plugin mesh texture matrix transform quaternion frame matrix animation transform preview 
  //  feature animation route camera vector animation projection lazy projection matrix shader 
  //  lazy material view modal vector texture camera lazy transform preview plugin 
  //  frame route feature render render shader animation transform plugin material texture 
  //  transform scene camera geometry vector vector shader transform preview vector lazy 
  //  camera projection light pipeline mesh geometry light projection shader quaternion shader 
  //  scene plugin matrix vector projection quaternion modal animation light frame shader 
  //  texture vector lazy animation texture view camera feature pipeline light feature 
  //  modal view feature plugin frame texture camera texture view texture view 
  //  vector texture shader light feature lazy geometry projection scene pipeline light 
  //  route modal animation mesh quaternion material render shader light transform animation 
  //  matrix scene light vector pipeline projection texture animation material modal mesh 
  //  light mesh material animation render frame lazy camera render frame quaternion 
  //  material geometry pipeline mesh camera camera camera mesh view light preview 
  //  material view matrix material material quaternion pipeline texture geometry projection light 
  //  modal scene view matrix frame view geometry route matrix scene quaternion 
  //  vector texture view render material frame render texture texture transform pipeline 
  //  quaternion lazy view preview pipeline projection modal animation scene lazy view 
  //  modal quaternion vector lazy geometry material preview preview animation scene animation 
  //  preview render preview vector lazy matrix vector animation matrix render view 
  //  lazy view shader route geometry lazy geometry material route light texture 
  //  lazy mesh plugin matrix texture pipeline render frame transform plugin transform 
  //  render projection camera render mesh texture modal render light texture light 
  //  matrix render light feature pipeline material lazy preview vector plugin shader 
  //  render route mesh mesh transform quaternion material texture pipeline projection geometry 
  //  transform geometry animation feature camera feature plugin texture geometry animation vector 
  //  route route matrix matrix route modal material shader route preview scene 
  //  view feature mesh scene view light mesh projection lazy material texture 
  //  geometry animation render geometry frame view plugin shader shader camera feature 
  //  matrix scene scene feature transform render geometry transform material frame preview 
  //  mesh modal scene modal animation frame matrix route material scene mesh 
  //  preview transform feature preview camera route geometry material vector light vector 
  //  material lazy matrix mesh matrix route geometry material feature quaternion pipeline 
  //  scene pipeline render lazy frame shader render route modal projection pipeline 
  //  route vector feature vector modal pipeline projection pipeline modal mesh shader 
  //  texture camera material quaternion view render route mesh route material render 
  //  animation light light projection material frame light scene modal vector material 
  //  camera projection scene geometry scene texture transform view animation matrix texture 
  //  scene feature pipeline view mesh preview vector geometry scene vector view 
  //  quaternion route render animation animation pipeline frame matrix scene projection material 
  //  vector transform texture pipeline preview matrix animation animation matrix material scene 
  //  geometry matrix feature mesh texture view texture lazy feature lazy camera 
  //  render mesh light pipeline camera lazy material scene frame transform modal 
  //  route route modal transform texture light matrix lazy vector feature transform 
  //  transform lazy modal geometry frame feature modal frame feature projection light 
  //  mesh plugin light material projection geometry camera view frame vector scene 
  //  shader geometry quaternion scene plugin animation scene camera lazy texture shader 
  //  scene light texture route shader pipeline frame quaternion view projection camera 
  //  scene projection quaternion animation frame animation scene geometry pipeline frame feature 
  //  geometry light camera geometry mesh render pipeline transform animation render projection 
  //  animation shader transform lazy pipeline quaternion view view lazy material projection 
  //  vector plugin render feature geometry projection route matrix plugin pipeline vector 
  //  frame lazy plugin camera feature light projection feature animation mesh preview 
  //  frame texture modal render transform vector lazy feature camera mesh camera 
  //  material geometry view shader quaternion vector vector pipeline feature material vector 
  //  pipeline material shader light modal quaternion shader lazy material geometry vector 
  //  feature feature light pipeline geometry texture light modal light projection transform 
  //  animation shader modal render texture preview plugin texture transform modal modal 
  //  view pipeline render pipeline
  */
})();

// mod-lazy-0026 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[26] = {
    id: 26,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0026';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '133');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  pipeline modal camera view modal animation matrix frame lazy view scene transform 
  //  frame projection lazy mesh matrix modal transform frame modal vector view 
  //  scene preview animation geometry camera camera pipeline camera render quaternion vector 
  //  pipeline plugin material geometry vector preview modal quaternion material render route 
  //  camera feature render scene render view route animation scene matrix texture 
  //  mesh mesh modal modal render animation shader animation lazy projection transform 
  //  transform vector frame pipeline transform frame preview pipeline lazy transform modal 
  //  projection plugin camera frame animation plugin render route light projection render 
  //  route preview projection frame view shader shader render projection quaternion preview 
  //  camera frame projection render material frame frame frame shader transform matrix 
  //  shader render preview scene vector geometry preview animation scene modal matrix 
  //  vector material material feature vector quaternion pipeline scene scene render animation 
  //  shader matrix transform view quaternion feature frame transform animation material scene 
  //  mesh projection render shader mesh light quaternion material camera vector matrix 
  //  matrix frame vector preview texture animation feature vector mesh plugin feature 
  //  lazy projection light quaternion shader animation animation route preview frame frame 
  //  feature lazy vector vector shader light camera lazy preview scene modal 
  //  render geometry light frame material route view feature pipeline render plugin 
  //  scene material animation pipeline material pipeline light animation quaternion feature preview 
  //  material view animation feature frame scene camera light texture geometry texture 
  //  modal material light view scene quaternion quaternion animation preview lazy vector 
  //  preview modal scene modal view route shader shader plugin scene pipeline 
  //  transform animation texture lazy scene matrix vector modal material texture quaternion 
  //  mesh transform texture geometry projection quaternion scene modal texture material matrix 
  //  camera matrix projection feature light material lazy texture pipeline preview scene 
  //  quaternion projection route projection render route geometry geometry lazy pipeline render 
  //  modal mesh mesh lazy feature geometry plugin view plugin pipeline frame 
  //  scene projection frame route feature shader transform shader vector render animation 
  //  matrix animation mesh quaternion material view feature transform matrix scene quaternion 
  //  feature feature pipeline projection quaternion light scene route pipeline view lazy 
  //  light geometry animation pipeline frame frame modal camera route camera preview 
  //  pipeline pipeline lazy material quaternion preview animation vector matrix geometry camera 
  //  feature shader matrix plugin frame preview vector route texture preview animation 
  //  route mesh preview preview texture geometry plugin matrix transform camera modal 
  //  matrix transform scene transform modal lazy shader route view frame plugin 
  //  feature render scene quaternion preview shader modal matrix pipeline geometry quaternion 
  //  view light lazy vector mesh scene geometry matrix lazy quaternion vector 
  //  matrix camera frame plugin mesh preview plugin camera camera render plugin 
  //  feature matrix view quaternion preview quaternion view mesh light scene vector 
  //  view render camera projection feature view camera modal transform route feature 
  //  quaternion animation camera mesh geometry view modal preview material matrix vector 
  //  quaternion matrix material render modal lazy lazy texture lazy mesh mesh 
  //  frame material vector animation camera plugin shader matrix light scene animation 
  //  frame animation matrix vector render geometry route material frame scene camera 
  //  preview matrix animation texture plugin view animation render texture feature material 
  //  shader material texture scene preview projection lazy plugin matrix pipeline modal 
  //  view quaternion plugin geometry vector frame projection matrix shader route transform 
  //  vector route geometry camera lazy matrix plugin projection projection mesh lazy 
  //  projection shader modal camera render mesh texture mesh view camera camera 
  //  mesh light material modal quaternion preview quaternion texture preview route mesh 
  //  view feature scene geometry plugin pipeline camera scene mesh shader transform 
  //  animation scene lazy modal scene modal preview animation projection lazy view 
  //  shader geometry feature mesh camera geometry light pipeline route pipeline plugin 
  //  shader vector view shader light pipeline camera view projection material feature 
  //  feature light pipeline animation geometry projection projection preview shader material projection 
  //  feature transform transform view render matrix frame animation texture camera material 
  //  lazy modal route modal texture route render route view modal route 
  //  preview view matrix lazy view vector preview feature light route frame 
  //  geometry transform modal camera modal pipeline transform mesh camera texture animation 
  //  mesh frame material quaternion matrix quaternion projection scene projection shader mesh 
  //  scene quaternion material matrix preview modal render transform pipeline geometry frame 
  //  view matrix frame mesh animation render mesh frame projection plugin quaternion 
  //  preview preview frame matrix lazy material feature plugin feature mesh light 
  //  scene material texture mesh view shader shader texture projection render render 
  //  mesh route quaternion render view material animation animation preview mesh material 
  //  vector projection mesh light feature plugin pipeline projection preview projection route 
  //  quaternion texture route material route projection camera mesh frame route camera 
  //  camera frame mesh route camera material route texture preview pipeline camera 
  //  plugin lazy light camera texture modal plugin pipeline lazy matrix vector 
  //  plugin matrix view scene geometry mesh route camera matrix transform mesh 
  //  quaternion light projection material view feature transform matrix light feature animation 
  //  matrix light light vector modal quaternion projection mesh pipeline view feature 
  //  material view material transform modal camera feature projection feature mesh geometry 
  //  modal vector preview shader shader feature matrix projection camera pipeline mesh 
  //  quaternion lazy quaternion frame projection lazy preview quaternion plugin render route 
  //  pipeline camera mesh texture transform plugin texture route feature camera texture 
  //  matrix route light lazy modal texture light light view scene modal 
  //  geometry matrix texture projection pipeline pipeline light projection scene material modal 
  //  material frame shader pipeline mesh vector material quaternion preview view preview 
  //  mesh transform mesh frame texture view transform route texture quaternion modal 
  //  scene light light pipeline plugin route shader mesh render render plugin 
  //  transform pipeline material transform shader render shader light quaternion view animation 
  //  animation route material pipeline material transform preview camera lazy lazy quaternion 
  //  transform preview render vector camera texture plugin route plugin scene projection 
  //  plugin quaternion frame quaternion pipeline quaternion transform plugin animation preview animation 
  //  route scene feature scene scene mesh modal camera modal animation feature 
  //  preview animation mesh vector light feature pipeline material feature projection frame 
  //  lazy mesh light modal feature plugin route light quaternion lazy matrix 
  //  transform lazy pipeline quaternion projection texture feature mesh vector scene shader 
  //  projection frame preview plugin feature preview quaternion vector route texture preview 
  //  light animation pipeline pipeline modal geometry feature view texture animation camera 
  //  preview matrix lazy render geometry frame matrix plugin mesh frame matrix 
  //  feature texture quaternion shader projection camera material render matrix pipeline lazy 
  //  animation quaternion shader frame modal transform preview route texture texture preview 
  //  route pipeline pipeline plugin pipeline vector scene mesh material light quaternion 
  //  modal material feature view route light light material vector material preview 
  //  animation geometry matrix transform scene frame render feature route frame camera 
  //  pipeline camera projection light feature transform geometry camera pipeline modal transform 
  //  frame light shader pipeline light frame plugin plugin render vector modal 
  //  light modal frame vector view camera mesh pipeline material shader feature 
  //  render material view route vector view matrix material light matrix frame 
  //  scene projection texture transform projection plugin mesh preview scene preview transform 
  //  preview plugin transform mesh preview animation preview geometry light feature projection 
  //  quaternion vector modal matrix feature modal pipeline geometry shader feature material 
  //  render light plugin pipeline texture projection lazy route feature pipeline matrix 
  //  plugin route pipeline light vector matrix quaternion material plugin lazy quaternion 
  //  material scene preview geometry modal material transform pipeline plugin frame feature 
  //  render render vector render matrix render texture preview matrix quaternion projection 
  //  lazy light pipeline feature frame plugin modal projection projection texture projection 
  //  matrix camera scene scene feature scene vector shader scene scene render 
  //  frame geometry route frame animation preview render render projection projection view 
  //  matrix transform render material transform pipeline feature geometry plugin animation camera 
  //  matrix material modal geometry texture feature vector feature plugin pipeline pipeline 
  //  view geometry mesh transform preview transform shader pipeline camera geometry frame 
  //  shader render geometry frame feature preview route modal light route transform 
  //  mesh quaternion geometry preview shader projection texture frame lazy quaternion scene 
  //  lazy transform vector camera transform frame frame view route plugin scene 
  //  texture lazy animation animation view quaternion render preview light feature material 
  //  plugin lazy mesh preview transform animation scene camera texture plugin vector 
  //  camera quaternion modal frame scene animation camera geometry lazy render preview 
  //  scene render frame texture modal light lazy projection preview material view 
  //  plugin vector pipeline quaternion lazy vector modal scene preview matrix animation 
  //  preview lazy matrix lazy vector transform geometry light feature preview plugin 
  //  feature material view quaternion plugin quaternion projection shader camera pipeline geometry 
  //  projection view plugin camera animation matrix camera camera texture texture route 
  //  camera plugin matrix plugin feature render projection animation mesh texture projection 
  //  material animation projection frame camera quaternion matrix plugin projection modal texture 
  //  texture projection render render pipeline route route render vector view route 
  //  modal pipeline animation modal plugin feature preview projection transform modal vector 
  //  pipeline texture pipeline plugin lazy view animation lazy texture material feature 
  //  modal plugin camera camera route animation light scene feature material geometry 
  //  pipeline shader plugin lazy material texture view matrix light frame camera 
  //  plugin preview transform view route scene feature scene pipeline geometry camera 
  //  shader light view preview geometry mesh quaternion route quaternion vector route 
  //  lazy scene feature vector plugin vector geometry preview shader modal modal 
  //  modal render quaternion scene frame texture lazy lazy quaternion lazy plugin 
  //  texture feature transform transform quaternion pipeline matrix view animation material transform 
  //  texture shader vector plugin route camera plugin vector texture view preview 
  //  projection light render scene plugin view geometry camera light preview animation 
  //  modal mesh matrix camera modal matrix material animation pipeline mesh lazy 
  //  route transform quaternion shader matrix plugin route feature modal view feature 
  //  feature render render frame transform route shader render modal camera material 
  //  animation feature shader geometry light geometry transform light camera lazy animation 
  //  plugin animation quaternion light preview matrix route render preview
  */
})();

// mod-lazy-0027 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[27] = {
    id: 27,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0027';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '4');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  geometry pipeline texture material feature scene plugin matrix render feature matrix render 
  //  material pipeline mesh modal texture feature modal geometry view plugin material 
  //  light projection plugin vector route plugin matrix matrix modal projection frame 
  //  pipeline view camera shader modal preview route plugin animation camera light 
  //  pipeline shader pipeline quaternion material geometry render modal render render shader 
  //  camera lazy frame vector quaternion projection shader quaternion animation animation route 
  //  material quaternion modal mesh vector view animation view animation geometry mesh 
  //  route animation light animation frame plugin quaternion texture geometry plugin route 
  //  geometry view scene matrix route mesh camera camera pipeline vector quaternion 
  //  geometry preview animation feature matrix feature quaternion projection mesh lazy matrix 
  //  view modal scene mesh view texture mesh material lazy pipeline shader 
  //  frame material scene projection route lazy scene matrix light material preview 
  //  scene pipeline material texture light light lazy mesh modal lazy pipeline 
  //  modal route camera pipeline animation transform geometry projection feature route render 
  //  shader light geometry camera material view vector shader route animation shader 
  //  mesh light projection scene scene geometry material material light preview matrix 
  //  plugin texture texture render feature geometry vector projection pipeline matrix frame 
  //  animation material matrix light pipeline projection preview feature texture transform feature 
  //  texture projection camera projection render vector pipeline render animation quaternion route 
  //  modal view plugin lazy transform plugin shader animation camera light frame 
  //  projection vector render texture route geometry animation vector preview matrix modal 
  //  quaternion projection preview matrix scene preview preview view modal transform projection 
  //  vector matrix render shader quaternion scene pipeline shader texture mesh animation 
  //  material shader pipeline feature route feature modal material quaternion frame material 
  //  route light preview matrix animation camera projection vector geometry light quaternion 
  //  texture route matrix transform pipeline feature modal feature route quaternion transform 
  //  light frame geometry animation texture lazy lazy material frame shader view 
  //  modal lazy pipeline texture animation vector shader preview material camera route 
  //  view shader transform animation route geometry texture geometry plugin transform preview 
  //  shader mesh vector modal lazy render frame quaternion lazy pipeline matrix 
  //  pipeline transform scene matrix projection matrix quaternion geometry vector quaternion route 
  //  animation texture vector modal preview projection preview plugin preview pipeline shader 
  //  scene projection feature animation modal modal camera frame route modal feature 
  //  modal geometry projection mesh route light scene view plugin modal plugin 
  //  projection matrix vector scene quaternion animation transform route vector projection frame 
  //  frame pipeline modal animation geometry mesh route plugin modal route geometry 
  //  animation plugin plugin matrix route render matrix view camera animation feature 
  //  route render transform feature projection quaternion quaternion frame geometry frame preview 
  //  vector transform lazy camera projection modal texture material texture route mesh 
  //  frame mesh route render matrix shader lazy matrix transform shader vector 
  //  plugin animation geometry texture mesh mesh texture geometry lazy plugin geometry 
  //  vector texture modal feature projection view matrix quaternion pipeline vector frame 
  //  projection pipeline texture geometry route modal feature render projection quaternion camera 
  //  view mesh matrix mesh vector plugin matrix pipeline view frame quaternion 
  //  modal material mesh geometry lazy frame geometry texture matrix projection transform 
  //  projection camera lazy plugin geometry frame texture geometry matrix frame animation 
  //  matrix pipeline mesh projection quaternion pipeline mesh animation lazy texture pipeline 
  //  shader matrix transform frame geometry frame light animation light transform scene 
  //  pipeline pipeline quaternion geometry geometry pipeline preview vector render pipeline feature 
  //  texture geometry frame mesh lazy plugin material shader plugin transform frame 
  //  geometry route scene mesh mesh mesh geometry animation shader quaternion projection 
  //  shader geometry animation scene matrix frame route projection quaternion shader lazy 
  //  camera material preview pipeline geometry geometry view quaternion frame plugin matrix 
  //  transform animation view vector material pipeline view scene frame animation plugin 
  //  light plugin mesh feature scene preview camera plugin plugin lazy geometry 
  //  feature material vector scene animation matrix lazy quaternion pipeline feature matrix 
  //  texture matrix light plugin scene geometry modal animation quaternion quaternion transform 
  //  modal plugin pipeline render animation transform render preview geometry lazy matrix 
  //  mesh frame modal geometry material feature geometry plugin transform lazy light 
  //  quaternion quaternion light modal feature view transform plugin lazy preview shader 
  //  route vector render material quaternion geometry shader render shader pipeline light 
  //  light pipeline light shader feature shader pipeline quaternion texture mesh view 
  //  projection feature camera light preview pipeline route pipeline view scene plugin 
  //  quaternion transform texture modal pipeline light frame light frame route transform 
  //  mesh texture projection geometry camera transform plugin animation render matrix scene 
  //  vector pipeline projection quaternion scene geometry camera mesh preview geometry render 
  //  matrix render preview geometry geometry transform light light plugin shader view 
  //  scene pipeline texture material plugin vector texture geometry route vector route 
  //  texture route quaternion quaternion modal pipeline matrix matrix projection view route 
  //  feature texture view geometry plugin texture shader matrix texture mesh material 
  //  shader material mesh view view feature route plugin transform shader modal 
  //  mesh shader render quaternion feature plugin scene preview projection pipeline route 
  //  feature scene geometry vector pipeline shader material quaternion view shader geometry 
  //  texture feature pipeline camera route render mesh geometry texture transform view 
  //  frame animation frame projection lazy texture material pipeline view mesh frame 
  //  lazy preview render projection texture feature camera route lazy animation scene 
  //  shader preview quaternion material mesh render projection vector texture scene route 
  //  route projection render texture pipeline pipeline feature lazy route transform animation 
  //  camera lazy frame modal preview route texture shader pipeline geometry pipeline 
  //  lazy pipeline geometry camera geometry render vector view modal route modal 
  //  shader mesh plugin texture vector camera transform vector scene render view 
  //  plugin frame light preview material quaternion lazy plugin feature frame camera 
  //  projection plugin geometry render render vector shader plugin modal frame texture 
  //  modal vector projection transform camera mesh frame pipeline lazy scene pipeline 
  //  material view material camera frame lazy projection shader view pipeline shader 
  //  animation animation render render view vector pipeline feature animation animation geometry 
  //  animation modal frame quaternion projection quaternion preview transform vector quaternion material 
  //  geometry light camera camera route view route material mesh route quaternion 
  //  scene animation modal scene transform frame matrix texture view lazy animation 
  //  pipeline pipeline render shader quaternion material quaternion transform render geometry route 
  //  render view modal feature view light transform matrix scene material modal 
  //  animation route shader scene mesh animation feature plugin material material geometry 
  //  vector texture shader frame shader modal route frame matrix feature quaternion 
  //  render texture vector animation geometry texture render scene camera modal plugin 
  //  pipeline geometry plugin view plugin geometry material modal light lazy route 
  //  matrix frame vector quaternion shader preview material camera lazy render projection 
  //  route modal frame view frame scene light mesh transform modal material 
  //  scene mesh light light quaternion plugin quaternion feature plugin projection lazy 
  //  geometry vector view light geometry modal route render render plugin transform 
  //  lazy feature render vector view lazy lazy texture texture scene matrix 
  //  texture scene shader transform animation geometry preview lazy material shader light 
  //  view shader material geometry plugin animation projection scene modal feature feature 
  //  vector plugin render projection vector light pipeline matrix render camera modal 
  //  scene pipeline matrix vector feature projection projection feature shader texture transform 
  //  scene texture shader light camera vector vector light plugin shader scene 
  //  material lazy light route vector lazy projection light vector light frame 
  //  plugin mesh quaternion lazy quaternion quaternion route projection lazy render projection 
  //  vector feature projection plugin pipeline quaternion lazy modal material lazy transform 
  //  animation geometry mesh geometry projection preview texture quaternion projection lazy mesh 
  //  preview material geometry animation shader modal view texture lazy geometry projection 
  //  modal route quaternion lazy scene frame render preview shader texture feature 
  //  feature route texture route plugin light light pipeline shader transform preview 
  //  light geometry plugin geometry render preview quaternion lazy feature lazy texture 
  //  projection material material preview route view animation pipeline light preview material 
  //  material camera render scene light animation geometry preview plugin animation render 
  //  scene feature texture transform render route lazy lazy render render lazy 
  //  camera view projection matrix pipeline texture vector vector frame animation lazy 
  //  matrix light transform vector shader plugin shader transform modal preview route 
  //  matrix plugin vector render lazy mesh geometry scene preview pipeline shader 
  //  mesh projection vector quaternion geometry material pipeline matrix modal quaternion light 
  //  plugin scene vector material light transform lazy scene light preview projection 
  //  route animation feature route matrix animation feature material quaternion texture vector 
  //  matrix modal light texture projection animation vector material shader texture transform 
  //  view render preview route view texture shader feature vector camera route 
  //  camera preview plugin projection quaternion render quaternion pipeline quaternion vector preview 
  //  projection geometry route lazy light lazy projection matrix projection material matrix 
  //  projection projection texture feature feature geometry projection light modal scene light 
  //  vector vector render vector shader plugin matrix view route material lazy 
  //  mesh route geometry route lazy scene vector lazy vector pipeline texture 
  //  camera scene modal material frame material route pipeline lazy feature view 
  //  material preview material shader projection camera modal geometry transform frame scene 
  //  projection route transform preview lazy shader view render route modal material 
  //  transform material shader pipeline transform pipeline transform projection projection route shader 
  //  scene modal vector pipeline preview matrix quaternion pipeline shader light render 
  //  lazy light shader modal light geometry pipeline camera quaternion material light 
  //  pipeline matrix view lazy projection view frame render modal view preview 
  //  route lazy mesh matrix texture lazy mesh geometry material plugin lazy 
  //  route view texture feature vector shader material modal projection scene matrix 
  //  texture transform animation feature animation material scene render preview geometry route 
  //  modal lazy shader material shader transform camera projection animation vector lazy 
  //  quaternion modal camera frame geometry matrix lazy transform transform feature material 
  //  shader geometry modal lazy plugin camera scene texture animation route mesh 
  //  material render modal animation geometry render light frame lazy pipeline
  */
})();

// mod-lazy-0028 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[28] = {
    id: 28,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0028';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '102');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  pipeline mesh shader frame projection matrix animation render plugin mesh modal plugin 
  //  modal transform feature vector frame geometry matrix geometry light geometry transform 
  //  preview light route texture geometry view mesh plugin quaternion light lazy 
  //  transform texture pipeline matrix quaternion quaternion plugin feature route transform modal 
  //  route pipeline pipeline frame scene mesh camera transform animation shader texture 
  //  shader matrix shader geometry frame lazy frame feature matrix transform preview 
  //  projection transform camera pipeline vector vector mesh geometry route feature shader 
  //  material pipeline modal scene matrix projection feature vector route shader modal 
  //  feature route route light animation shader camera plugin modal plugin quaternion 
  //  mesh view animation transform pipeline feature scene scene light vector material 
  //  projection shader geometry light modal matrix modal lazy render material material 
  //  render feature frame geometry shader frame mesh plugin matrix view plugin 
  //  camera frame vector material pipeline light feature view mesh transform projection 
  //  lazy frame animation scene camera view mesh vector camera vector feature 
  //  plugin matrix geometry lazy camera quaternion vector vector camera texture geometry 
  //  shader vector feature animation scene scene shader material lazy camera preview 
  //  animation modal modal camera preview animation scene route preview lazy animation 
  //  frame texture route matrix render plugin render view animation preview modal 
  //  camera vector shader matrix render texture lazy mesh transform frame projection 
  //  modal modal animation preview shader shader geometry projection scene modal matrix 
  //  plugin route feature light feature preview animation render feature material scene 
  //  texture frame material quaternion scene texture route quaternion shader preview shader 
  //  material texture scene projection camera light scene feature quaternion preview pipeline 
  //  lazy animation render vector preview shader material texture plugin light mesh 
  //  texture projection lazy pipeline feature view lazy mesh transform scene geometry 
  //  camera material lazy texture plugin transform vector vector material camera preview 
  //  material animation pipeline preview texture texture mesh pipeline modal view pipeline 
  //  plugin transform shader render lazy scene lazy mesh material feature render 
  //  pipeline animation preview pipeline mesh frame quaternion material route scene texture 
  //  render feature scene quaternion quaternion transform pipeline pipeline transform pipeline lazy 
  //  modal preview vector modal preview scene render scene texture mesh material 
  //  lazy material mesh projection preview light matrix vector light pipeline material 
  //  transform feature preview route vector lazy render scene route plugin material 
  //  quaternion transform view matrix pipeline vector frame material scene pipeline feature 
  //  camera animation camera shader geometry scene transform matrix transform mesh mesh 
  //  shader matrix pipeline animation feature shader modal preview view scene preview 
  //  preview texture quaternion geometry modal preview light render pipeline route lazy 
  //  view projection lazy pipeline scene lazy light route render matrix projection 
  //  lazy quaternion shader preview feature preview projection preview scene camera geometry 
  //  mesh route feature render projection lazy texture plugin camera geometry route 
  //  route scene matrix shader quaternion feature pipeline material feature animation quaternion 
  //  projection modal quaternion projection projection scene projection material modal view render 
  //  modal camera matrix transform feature quaternion camera lazy feature projection lazy 
  //  render matrix light quaternion light render geometry geometry projection mesh preview 
  //  vector light matrix camera mesh projection geometry route preview feature frame 
  //  transform view feature preview pipeline frame mesh scene lazy plugin light 
  //  light view animation projection quaternion geometry mesh shader mesh plugin scene 
  //  render shader modal feature render plugin matrix frame mesh modal modal 
  //  pipeline scene quaternion shader transform pipeline feature feature transform vector geometry 
  //  feature matrix modal projection lazy render texture geometry material frame transform 
  //  quaternion shader render preview preview scene camera mesh vector geometry feature 
  //  projection lazy projection texture material mesh shader light mesh frame modal 
  //  light preview material pipeline preview render view transform render view animation 
  //  plugin modal quaternion frame render mesh projection shader view shader geometry 
  //  scene scene scene vector shader frame plugin pipeline feature transform vector 
  //  view modal transform lazy projection animation plugin texture route projection texture 
  //  projection material scene geometry geometry preview lazy plugin matrix animation mesh 
  //  light lazy modal view quaternion light transform mesh transform scene pipeline 
  //  scene matrix transform modal shader frame camera preview projection light preview 
  //  quaternion light quaternion scene scene mesh preview shader shader feature render 
  //  material pipeline preview lazy animation scene camera geometry vector quaternion matrix 
  //  pipeline quaternion matrix texture view modal transform render route route matrix 
  //  scene light shader texture shader animation animation quaternion matrix transform render 
  //  matrix preview render vector transform scene geometry render plugin material projection 
  //  camera feature frame material plugin render vector frame plugin scene material 
  //  vector projection pipeline material preview route quaternion geometry vector material light 
  //  lazy transform scene shader frame render shader frame plugin pipeline vector 
  //  geometry pipeline render render mesh pipeline animation modal route frame light 
  //  frame animation material material texture modal lazy material feature vector frame 
  //  vector pipeline matrix vector view shader projection transform matrix geometry geometry 
  //  quaternion feature scene render render projection plugin geometry camera texture material 
  //  geometry mesh matrix animation mesh vector geometry feature matrix feature geometry 
  //  quaternion plugin animation mesh feature frame route plugin plugin vector frame 
  //  frame route quaternion quaternion scene material modal feature preview view route 
  //  plugin transform mesh matrix mesh feature lazy camera projection feature pipeline 
  //  pipeline quaternion preview geometry shader quaternion feature pipeline camera view route 
  //  matrix projection animation transform pipeline shader route scene light matrix projection 
  //  pipeline render feature projection geometry transform light camera pipeline projection view 
  //  shader shader frame geometry projection preview modal texture lazy material view 
  //  modal shader modal material shader frame shader mesh quaternion pipeline texture 
  //  transform view view preview material projection projection route quaternion plugin preview 
  //  feature texture shader modal camera scene matrix scene feature plugin transform 
  //  texture shader transform feature modal render texture view matrix view geometry 
  //  lazy quaternion camera render mesh modal light frame light plugin transform 
  //  frame lazy animation pipeline modal projection matrix projection scene preview lazy 
  //  projection geometry texture view feature frame feature preview quaternion plugin route 
  //  transform pipeline vector feature animation frame pipeline mesh frame quaternion mesh 
  //  feature geometry modal projection quaternion vector transform quaternion shader mesh preview 
  //  matrix transform transform feature quaternion route route frame pipeline quaternion mesh 
  //  lazy frame lazy matrix shader scene texture shader scene plugin modal 
  //  matrix vector transform preview scene projection view route render modal geometry 
  //  animation feature route shader texture lazy transform shader render pipeline animation 
  //  light shader quaternion plugin mesh camera light vector transform modal vector 
  //  modal geometry quaternion light feature modal projection scene transform camera geometry 
  //  texture feature scene route projection light transform frame matrix mesh route 
  //  camera projection projection view mesh quaternion texture plugin transform transform transform 
  //  route quaternion scene modal preview vector quaternion quaternion projection vector geometry 
  //  camera animation quaternion lazy vector route view lazy texture pipeline matrix 
  //  light animation transform matrix quaternion mesh quaternion shader route geometry modal 
  //  projection frame projection shader preview material animation modal mesh matrix view 
  //  feature vector mesh plugin geometry feature modal material animation transform mesh 
  //  plugin material frame geometry camera modal preview geometry animation material route 
  //  pipeline scene projection frame camera preview modal modal render transform camera 
  //  texture feature route route preview projection frame pipeline feature mesh scene 
  //  mesh view preview render vector camera route preview render vector feature 
  //  shader matrix feature pipeline material frame light camera geometry plugin plugin 
  //  mesh scene animation pipeline mesh light plugin projection camera matrix scene 
  //  quaternion vector view modal geometry transform mesh matrix view projection frame 
  //  texture camera render preview lazy lazy pipeline plugin animation vector mesh 
  //  view preview projection quaternion modal vector animation view route render frame 
  //  material frame plugin mesh render light plugin shader matrix feature view 
  //  scene quaternion geometry lazy plugin material texture frame quaternion pipeline view 
  //  camera render scene transform shader scene vector quaternion mesh mesh material 
  //  material transform vector transform feature modal view modal route plugin scene 
  //  quaternion route vector geometry scene camera mesh scene geometry modal view 
  //  preview light render mesh camera light projection quaternion pipeline texture camera 
  //  scene shader geometry frame light camera texture light transform texture quaternion 
  //  render route mesh projection animation plugin plugin plugin matrix frame camera 
  //  projection transform frame view view material light quaternion mesh vector scene 
  //  light mesh modal matrix camera view shader camera frame feature transform 
  //  material animation render shader light material projection view lazy preview pipeline 
  //  camera lazy plugin pipeline feature geometry mesh plugin preview modal projection 
  //  vector projection modal preview geometry plugin quaternion transform feature route feature 
  //  vector projection frame route geometry frame render material modal frame projection 
  //  plugin projection modal lazy quaternion plugin pipeline lazy quaternion vector render 
  //  animation quaternion camera projection material render route shader pipeline geometry texture 
  //  camera route render camera modal preview material material preview geometry geometry 
  //  transform projection projection render route feature quaternion pipeline route camera pipeline 
  //  render light view camera quaternion pipeline material preview geometry route shader 
  //  render mesh shader projection camera vector transform modal render quaternion quaternion 
  //  lazy quaternion plugin view mesh quaternion preview texture view quaternion material 
  //  render geometry quaternion light feature lazy matrix shader view geometry quaternion 
  //  transform transform geometry light modal texture route scene texture camera render 
  //  geometry transform vector quaternion texture matrix camera texture route view vector 
  //  geometry geometry render geometry lazy shader vector feature texture route route 
  //  vector scene frame animation feature plugin render vector light animation view 
  //  feature light preview camera feature plugin texture lazy camera projection mesh 
  //  texture projection render route camera animation quaternion texture texture lazy shader 
  //  vector material mesh lazy shader shader modal geometry render transform camera 
  //  preview lazy camera light feature animation texture route render quaternion texture 
  //  route frame feature camera render view texture vector camera matrix quaternion 
  //  plugin plugin vector modal light preview scene mesh view render feature 
  //  render route route route scene lazy render material matrix frame mesh 
  //  texture transform
  */
})();

// mod-lazy-0029 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[29] = {
    id: 29,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0029';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '289');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  geometry geometry view preview animation route lazy animation preview texture preview vector 
  //  matrix preview frame projection pipeline modal light transform preview geometry material 
  //  transform projection camera plugin modal matrix material feature preview transform modal 
  //  projection transform feature route camera pipeline plugin texture transform modal modal 
  //  mesh quaternion projection feature modal view scene route lazy pipeline route 
  //  material render modal frame geometry mesh vector preview light animation material 
  //  view light feature shader animation modal scene pipeline pipeline lazy preview 
  //  geometry vector quaternion quaternion camera geometry shader transform pipeline camera view 
  //  pipeline render material feature material matrix animation light projection light vector 
  //  view route plugin texture vector vector animation preview light transform preview 
  //  transform preview camera matrix scene render geometry route preview feature route 
  //  render projection quaternion preview frame geometry matrix route view matrix geometry 
  //  animation modal light vector shader camera shader camera route lazy lazy 
  //  plugin animation modal scene render view matrix lazy quaternion quaternion transform 
  //  scene preview geometry lazy pipeline shader modal render preview feature material 
  //  lazy texture quaternion geometry vector feature pipeline transform frame vector shader 
  //  material material transform view mesh material vector lazy feature plugin render 
  //  pipeline frame pipeline lazy lazy mesh quaternion plugin quaternion render lazy 
  //  shader light lazy view render animation preview animation vector projection feature 
  //  light feature animation geometry pipeline render view quaternion texture geometry route 
  //  plugin camera preview texture pipeline preview texture light view geometry scene 
  //  modal matrix matrix mesh animation mesh animation scene feature transform mesh 
  //  transform matrix lazy light view light vector render mesh camera preview 
  //  projection preview modal scene view render camera projection camera scene camera 
  //  shader scene scene frame quaternion feature render projection plugin vector camera 
  //  mesh matrix camera plugin texture vector material light feature view view 
  //  texture projection frame pipeline light plugin matrix frame vector texture feature 
  //  transform modal route view geometry pipeline scene render frame geometry view 
  //  render lazy lazy lazy material frame quaternion vector view frame frame 
  //  modal mesh shader lazy preview route material mesh matrix vector camera 
  //  geometry pipeline feature scene texture lazy mesh quaternion vector geometry render 
  //  plugin render light lazy feature pipeline projection route lazy feature matrix 
  //  camera projection render animation shader route geometry scene animation geometry vector 
  //  modal projection route light route view shader vector modal pipeline vector 
  //  geometry material light scene animation material plugin projection scene frame frame 
  //  view projection pipeline texture preview texture view pipeline quaternion transform matrix 
  //  light preview scene frame transform light modal lazy geometry scene modal 
  //  vector shader render texture preview transform plugin transform matrix projection pipeline 
  //  texture vector plugin texture matrix projection modal camera shader modal frame 
  //  pipeline mesh texture shader preview scene projection scene view route quaternion 
  //  modal quaternion texture route modal light light plugin shader pipeline feature 
  //  modal route shader feature feature route transform quaternion quaternion geometry texture 
  //  material material lazy lazy view animation plugin feature modal geometry lazy 
  //  geometry preview camera route route plugin light scene geometry modal matrix 
  //  material modal transform animation camera texture texture preview transform scene frame 
  //  route pipeline transform shader view modal shader light plugin matrix material 
  //  shader feature view texture route route plugin feature scene lazy feature 
  //  camera shader transform route feature animation light projection modal modal route 
  //  pipeline feature mesh material texture transform quaternion preview animation view vector 
  //  animation modal transform mesh route animation lazy view animation modal shader 
  //  material geometry material animation frame lazy shader projection material plugin camera 
  //  preview pipeline matrix feature lazy scene plugin camera pipeline modal texture 
  //  matrix vector lazy transform view plugin scene quaternion frame transform feature 
  //  matrix mesh pipeline lazy frame texture pipeline pipeline transform render pipeline 
  //  transform animation plugin modal matrix scene view view lazy route animation 
  //  material light modal animation mesh texture light mesh plugin vector scene 
  //  preview mesh scene frame frame projection shader matrix modal modal preview 
  //  camera pipeline transform feature texture geometry projection quaternion render view projection 
  //  view frame vector lazy quaternion view preview frame projection mesh animation 
  //  plugin lazy material preview shader scene route projection pipeline material mesh 
  //  material matrix scene texture lazy matrix camera modal feature modal transform 
  //  animation light view preview route render feature feature mesh material quaternion 
  //  preview texture preview render vector light geometry camera quaternion plugin projection 
  //  mesh texture matrix frame modal matrix pipeline projection feature quaternion transform 
  //  material texture matrix geometry pipeline quaternion camera scene texture render texture 
  //  mesh material texture pipeline plugin scene animation render pipeline projection modal 
  //  vector route lazy vector texture geometry view route view preview projection 
  //  transform route route transform quaternion material camera feature route texture mesh 
  //  projection geometry feature modal pipeline light plugin quaternion quaternion render feature 
  //  camera plugin light matrix light camera mesh mesh light transform quaternion 
  //  lazy camera pipeline frame plugin shader lazy texture quaternion vector feature 
  //  texture light matrix shader feature render light light material quaternion view 
  //  material scene view route transform mesh material animation frame projection plugin 
  //  preview transform projection animation animation render light shader quaternion light preview 
  //  quaternion route transform mesh geometry scene light quaternion view frame mesh 
  //  frame quaternion pipeline view matrix vector material texture pipeline preview feature 
  //  preview shader shader mesh matrix material material animation vector material route 
  //  preview route modal animation vector route modal shader modal route texture 
  //  view render geometry animation feature route vector route plugin view material 
  //  plugin matrix animation route quaternion route route plugin pipeline geometry plugin 
  //  shader camera projection material texture material scene shader projection feature modal 
  //  frame modal plugin view frame geometry frame light matrix route preview 
  //  view quaternion lazy matrix shader view render geometry modal route geometry 
  //  view animation pipeline pipeline camera pipeline preview plugin shader transform render 
  //  view preview preview geometry scene preview projection route material lazy modal 
  //  render modal material modal mesh lazy modal light mesh animation transform 
  //  route pipeline scene material animation matrix material route geometry lazy camera 
  //  plugin transform geometry scene animation quaternion frame material matrix pipeline feature 
  //  scene texture material transform render projection matrix quaternion view projection animation 
  //  quaternion matrix plugin modal feature lazy pipeline preview route geometry transform 
  //  animation quaternion pipeline camera vector route render view modal matrix plugin 
  //  projection animation pipeline lazy scene projection route render scene animation modal 
  //  transform mesh modal modal frame mesh transform material texture projection light 
  //  plugin plugin view scene animation projection material vector geometry plugin quaternion 
  //  scene render view quaternion mesh mesh frame render transform transform vector 
  //  quaternion pipeline modal projection pipeline modal transform texture feature feature lazy 
  //  transform scene projection pipeline mesh mesh material vector plugin mesh vector 
  //  camera modal texture vector frame vector projection route route geometry quaternion 
  //  projection feature light frame vector matrix animation camera feature feature matrix 
  //  shader quaternion feature feature pipeline view mesh quaternion plugin matrix frame 
  //  render frame scene modal mesh transform texture lazy feature animation animation 
  //  texture route vector transform shader transform shader render modal mesh transform 
  //  material projection shader quaternion route geometry matrix preview material lazy preview 
  //  light lazy modal frame mesh geometry scene lazy plugin frame pipeline 
  //  lazy route animation mesh view preview plugin preview geometry mesh preview 
  //  quaternion modal scene render texture preview animation texture matrix scene camera 
  //  camera render transform render plugin transform camera preview shader view view 
  //  light camera lazy route feature matrix plugin render texture pipeline geometry 
  //  frame texture light geometry geometry material scene pipeline transform route render 
  //  transform light light light quaternion render quaternion route animation route pipeline 
  //  feature mesh view quaternion animation vector transform vector render projection projection 
  //  projection lazy scene light route texture projection frame plugin pipeline render 
  //  pipeline geometry camera preview feature feature view geometry pipeline geometry frame 
  //  projection texture material animation material material feature transform texture plugin view 
  //  frame shader feature animation vector vector mesh matrix view animation projection 
  //  texture matrix pipeline render modal projection feature frame lazy plugin lazy 
  //  projection pipeline vector preview material animation modal transform feature lazy geometry 
  //  pipeline frame camera light frame vector animation matrix preview preview plugin 
  //  matrix route feature preview scene scene material camera view scene mesh 
  //  scene matrix frame projection view animation feature geometry render scene projection 
  //  plugin route scene texture material scene modal transform animation geometry mesh 
  //  camera camera light matrix frame mesh vector matrix pipeline mesh scene 
  //  render preview mesh light shader preview shader animation view shader render 
  //  material animation route transform route lazy lazy mesh modal route modal 
  //  render material matrix texture matrix preview view vector scene frame route 
  //  material scene geometry vector plugin preview view route transform preview camera 
  //  matrix route shader preview matrix material plugin light render vector quaternion 
  //  lazy route lazy vector render quaternion transform preview frame scene mesh 
  //  modal material transform transform frame preview transform material material scene render 
  //  render transform geometry preview plugin plugin quaternion material vector animation matrix 
  //  animation route preview feature texture vector view vector preview projection projection 
  //  render camera matrix route render animation plugin route lazy frame geometry 
  //  camera material animation route animation feature transform texture mesh route quaternion 
  //  pipeline matrix material light projection material material pipeline view camera render 
  //  shader feature camera vector light projection material render texture camera animation 
  //  light feature feature render render quaternion plugin transform matrix plugin matrix 
  //  render scene projection matrix frame feature projection texture render lazy preview 
  //  plugin scene modal view route plugin projection camera feature matrix pipeline 
  //  route matrix preview geometry material frame shader quaternion lazy frame transform 
  //  preview plugin quaternion view geometry vector geometry quaternion plugin quaternion material 
  //  animation geometry animation modal view texture texture frame feature lazy texture 
  //  modal shader modal animation plugin transform projection preview render matrix frame 
  //  render view modal view route lazy projection matrix plugin scene projection 
  //  plugin matrix scene lazy render quaternion texture
  */
})();

// mod-lazy-0030 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[30] = {
    id: 30,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0030';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '263');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  projection projection matrix view geometry preview light geometry lazy scene transform route 
  //  render light modal light modal lazy scene camera shader shader shader 
  //  feature matrix modal quaternion material route vector quaternion render vector modal 
  //  scene geometry plugin plugin pipeline scene quaternion frame lazy quaternion vector 
  //  material frame feature animation view texture modal preview preview lazy material 
  //  preview pipeline feature shader pipeline matrix light quaternion projection feature render 
  //  material view transform modal material light camera texture modal plugin transform 
  //  transform camera light light render camera texture shader shader camera plugin 
  //  projection plugin feature scene light vector matrix vector geometry pipeline shader 
  //  camera lazy projection animation preview projection vector texture geometry shader transform 
  //  scene texture feature matrix preview plugin mesh camera transform plugin plugin 
  //  render shader material projection mesh light plugin quaternion animation frame matrix 
  //  light texture geometry feature transform preview feature feature projection geometry render 
  //  render lazy shader route mesh shader transform transform pipeline light matrix 
  //  render texture matrix modal scene mesh material geometry vector camera render 
  //  modal texture lazy route texture render feature animation route lazy route 
  //  route frame plugin route matrix projection render route frame shader light 
  //  plugin frame mesh matrix vector matrix pipeline scene pipeline texture texture 
  //  camera lazy feature shader light quaternion material plugin light geometry lazy 
  //  shader modal view vector transform camera material preview geometry plugin material 
  //  material geometry route light feature material feature quaternion preview modal pipeline 
  //  geometry light feature shader plugin texture material animation render material lazy 
  //  matrix quaternion vector shader texture camera pipeline modal route material render 
  //  feature projection animation geometry camera modal texture quaternion vector light matrix 
  //  feature mesh projection shader geometry scene vector animation animation texture animation 
  //  feature texture light matrix plugin matrix texture texture plugin animation projection 
  //  plugin shader light animation matrix modal light light feature vector modal 
  //  transform transform preview render transform geometry shader modal feature modal geometry 
  //  geometry texture projection matrix shader matrix plugin animation preview animation animation 
  //  preview plugin texture modal light animation pipeline animation route vector shader 
  //  pipeline render modal shader pipeline transform geometry texture feature feature plugin 
  //  pipeline preview shader frame scene route transform lazy texture modal feature 
  //  modal camera mesh quaternion projection lazy camera transform camera matrix preview 
  //  feature modal camera modal render animation lazy feature mesh preview modal 
  //  light frame scene material modal plugin modal plugin animation light material 
  //  mesh feature route geometry feature view quaternion animation animation feature plugin 
  //  light render camera matrix feature mesh texture preview view vector material 
  //  scene lazy animation modal feature projection vector vector transform projection view 
  //  preview material view vector plugin transform projection preview material lazy quaternion 
  //  preview transform mesh projection preview preview frame geometry geometry quaternion camera 
  //  camera route texture material modal transform preview transform mesh light lazy 
  //  camera feature pipeline material pipeline modal frame camera pipeline pipeline quaternion 
  //  render view shader plugin frame quaternion modal matrix matrix frame texture 
  //  mesh quaternion camera feature modal frame texture route frame view feature 
  //  lazy shader vector mesh modal pipeline pipeline matrix matrix quaternion scene 
  //  pipeline quaternion quaternion light material quaternion modal geometry scene scene quaternion 
  //  feature material projection animation transform geometry mesh pipeline light geometry route 
  //  projection vector feature feature lazy mesh projection geometry projection matrix render 
  //  modal shader light preview view lazy plugin material feature projection projection 
  //  shader projection light plugin shader shader texture texture plugin projection camera 
  //  light frame animation matrix view transform lazy projection feature transform feature 
  //  camera plugin lazy plugin frame matrix animation quaternion view plugin transform 
  //  animation animation vector camera scene transform projection projection frame plugin transform 
  //  route geometry mesh quaternion feature render render camera animation lazy animation 
  //  camera geometry matrix frame view scene mesh frame shader pipeline frame 
  //  mesh view mesh vector preview pipeline transform frame plugin plugin render 
  //  scene modal mesh material feature vector vector frame modal animation shader 
  //  scene render frame scene render matrix render matrix vector render view 
  //  render projection projection matrix camera frame shader mesh geometry preview shader 
  //  matrix shader material route texture light lazy animation projection preview geometry 
  //  transform scene preview transform transform matrix light route shader shader camera 
  //  transform quaternion vector preview lazy material geometry feature render modal preview 
  //  scene pipeline matrix material transform texture geometry material preview pipeline scene 
  //  frame preview geometry render mesh light view camera pipeline feature camera 
  //  material matrix geometry animation light animation feature camera material plugin preview 
  //  view animation view material mesh lazy scene animation projection view animation 
  //  projection view plugin quaternion texture animation vector frame material feature matrix 
  //  frame render modal material pipeline mesh pipeline view geometry light lazy 
  //  frame frame mesh texture material view frame animation route light camera 
  //  quaternion material animation shader animation shader matrix pipeline feature material geometry 
  //  light preview mesh animation feature transform transform matrix render feature quaternion 
  //  lazy pipeline matrix scene scene scene feature matrix transform feature transform 
  //  modal matrix projection route geometry geometry transform lazy frame geometry shader 
  //  shader shader feature camera plugin light geometry vector transform light quaternion 
  //  projection render preview projection view modal preview preview lazy quaternion lazy 
  //  transform quaternion modal route shader shader projection projection projection frame feature 
  //  texture scene scene modal route camera scene feature geometry view mesh 
  //  texture feature animation transform plugin projection material texture material modal material 
  //  feature animation mesh mesh view modal scene light quaternion light mesh 
  //  pipeline lazy scene projection light quaternion geometry preview route render animation 
  //  vector frame plugin mesh plugin geometry frame texture shader view route 
  //  matrix animation plugin projection preview feature preview frame render quaternion vector 
  //  animation plugin scene lazy projection render light transform lazy mesh geometry 
  //  scene plugin mesh lazy projection scene quaternion transform geometry lazy preview 
  //  preview geometry view quaternion view frame shader frame scene plugin quaternion 
  //  projection route render frame animation projection shader light shader view preview 
  //  feature pipeline plugin light view plugin geometry modal plugin modal texture 
  //  mesh pipeline feature feature preview scene frame lazy light scene vector 
  //  matrix frame modal geometry modal scene material vector shader quaternion lazy 
  //  texture frame mesh modal plugin lazy scene geometry plugin route scene 
  //  scene camera shader texture shader frame vector lazy quaternion pipeline camera 
  //  material plugin scene projection projection lazy quaternion preview pipeline scene render 
  //  projection preview matrix scene vector scene transform render projection light frame 
  //  material animation pipeline preview geometry transform frame matrix preview transform render 
  //  mesh animation light projection route camera render light scene camera quaternion 
  //  matrix lazy frame mesh modal material material frame preview vector geometry 
  //  transform plugin transform quaternion geometry light feature scene preview modal view 
  //  quaternion projection modal route projection feature light render light scene animation 
  //  view feature pipeline texture route plugin material view scene light material 
  //  render scene camera route lazy transform shader transform texture preview render 
  //  camera lazy preview vector shader camera plugin modal transform transform quaternion 
  //  frame route modal modal matrix quaternion view frame scene animation mesh 
  //  frame render render frame animation camera mesh view projection view scene 
  //  texture texture quaternion frame scene material plugin scene render shader projection 
  //  mesh mesh quaternion matrix light quaternion modal geometry material quaternion quaternion 
  //  mesh route matrix preview render vector scene geometry vector material camera 
  //  feature modal camera vector scene texture lazy mesh projection material animation 
  //  geometry mesh projection quaternion material quaternion matrix shader plugin mesh render 
  //  preview lazy material geometry modal light shader shader shader transform light 
  //  shader texture lazy render plugin view view route matrix matrix animation 
  //  material shader quaternion feature pipeline preview render matrix modal geometry modal 
  //  matrix texture view route modal material transform mesh animation preview frame 
  //  plugin camera preview modal plugin animation texture material camera texture light 
  //  shader pipeline shader matrix quaternion projection lazy route modal light camera 
  //  route geometry transform animation matrix preview plugin mesh matrix view geometry 
  //  modal render shader modal shader light geometry quaternion route material pipeline 
  //  matrix preview plugin projection lazy render geometry frame scene mesh mesh 
  //  quaternion plugin projection feature plugin pipeline projection quaternion camera modal route 
  //  quaternion transform matrix render camera transform material view route camera material 
  //  vector camera camera preview matrix pipeline material view render plugin scene 
  //  material feature pipeline transform render route matrix camera mesh render transform 
  //  texture projection feature projection shader light view projection view preview pipeline 
  //  feature material geometry preview geometry material geometry route plugin quaternion mesh 
  //  route frame texture animation shader scene vector transform shader projection texture 
  //  matrix transform lazy camera shader route camera projection shader pipeline transform 
  //  plugin modal camera render scene scene transform scene render quaternion matrix 
  //  texture route quaternion scene plugin camera camera route vector geometry light 
  //  feature route geometry projection preview projection vector transform view projection render 
  //  view plugin shader geometry frame modal material lazy quaternion geometry feature 
  //  matrix plugin transform camera scene texture mesh pipeline view geometry vector 
  //  scene pipeline preview texture transform light animation projection animation matrix matrix 
  //  pipeline geometry shader matrix plugin animation texture camera projection camera texture 
  //  material scene render camera quaternion pipeline light material vector vector plugin 
  //  view animation render modal geometry vector plugin texture material geometry matrix 
  //  view material plugin feature view render material frame modal view route 
  //  view projection preview vector scene plugin feature shader material texture render 
  //  view projection feature transform material vector texture modal view render light 
  //  feature light shader light camera shader preview light view plugin quaternion 
  //  transform modal transform matrix texture plugin pipeline light camera route material 
  //  view mesh matrix view lazy quaternion material plugin transform vector texture 
  //  transform shader shader matrix frame transform modal feature projection geometry projection 
  //  preview modal mesh light texture scene feature preview lazy view view 
  //  view modal projection matrix plugin view route texture vector render
  */
})();

// mod-lazy-0031 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[31] = {
    id: 31,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0031';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '119');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  plugin quaternion scene scene camera light material lazy quaternion transform pipeline material 
  //  transform frame shader view transform render geometry camera scene light lazy 
  //  matrix shader scene view light matrix geometry scene material render render 
  //  quaternion vector route geometry frame route view projection shader feature preview 
  //  transform camera geometry pipeline transform feature geometry shader transform lazy lazy 
  //  transform quaternion material texture matrix mesh pipeline matrix route quaternion matrix 
  //  preview matrix vector plugin texture scene transform material plugin preview camera 
  //  animation preview texture lazy projection feature view plugin transform quaternion preview 
  //  texture pipeline route scene mesh animation view feature geometry modal shader 
  //  route projection route render render scene pipeline material mesh view frame 
  //  plugin frame scene lazy matrix projection modal vector preview plugin view 
  //  frame shader lazy view view frame quaternion vector camera transform mesh 
  //  transform plugin light feature shader frame material route vector geometry material 
  //  frame animation plugin mesh camera mesh feature camera preview render transform 
  //  material scene view animation transform vector plugin render preview frame quaternion 
  //  material mesh render mesh view plugin matrix preview projection plugin render 
  //  vector frame pipeline matrix feature mesh shader material scene texture geometry 
  //  frame geometry quaternion view view texture shader render animation texture pipeline 
  //  animation projection mesh quaternion plugin vector view texture render quaternion quaternion 
  //  geometry transform modal view vector lazy camera route camera pipeline modal 
  //  route route projection preview quaternion view plugin projection route projection material 
  //  matrix modal animation render quaternion plugin texture camera frame light mesh 
  //  modal transform modal camera camera matrix plugin preview view plugin modal 
  //  plugin animation texture pipeline plugin feature render vector lazy modal geometry 
  //  modal shader vector preview frame lazy light shader preview projection plugin 
  //  geometry shader projection material projection light lazy animation camera mesh matrix 
  //  vector feature modal texture geometry quaternion camera frame route camera shader 
  //  view preview render lazy lazy frame mesh scene shader geometry camera 
  //  quaternion quaternion feature modal pipeline pipeline matrix light light transform light 
  //  lazy lazy plugin shader light transform feature preview pipeline vector route 
  //  texture shader mesh projection feature shader animation camera material matrix texture 
  //  render geometry vector mesh vector plugin lazy plugin route geometry geometry 
  //  render scene lazy modal plugin view feature scene material preview quaternion 
  //  geometry modal pipeline mesh view view camera pipeline lazy pipeline modal 
  //  lazy texture lazy texture plugin mesh plugin frame scene mesh light 
  //  feature shader plugin route light camera shader modal frame scene light 
  //  scene quaternion modal texture texture material pipeline render feature view projection 
  //  vector animation material quaternion camera frame modal geometry geometry plugin frame 
  //  shader animation lazy frame transform plugin modal vector pipeline lazy transform 
  //  view lazy lazy light material feature route render texture render projection 
  //  route frame route scene frame matrix quaternion light light quaternion vector 
  //  view shader preview route pipeline preview feature light modal feature plugin 
  //  material plugin plugin light mesh transform quaternion route scene animation texture 
  //  pipeline scene transform preview lazy modal shader shader quaternion projection route 
  //  preview material matrix route render view preview projection feature route shader 
  //  transform shader transform material pipeline preview shader mesh render projection frame 
  //  scene render material geometry plugin route plugin vector preview route modal 
  //  scene texture transform transform pipeline render light modal lazy preview projection 
  //  animation preview matrix shader frame vector render route frame mesh render 
  //  feature preview light animation lazy texture texture projection transform modal modal 
  //  transform render route matrix camera quaternion feature texture view scene scene 
  //  projection view render mesh projection texture lazy quaternion material lazy frame 
  //  scene vector material vector pipeline route render modal quaternion feature preview 
  //  render scene lazy pipeline geometry transform modal render modal render frame 
  //  view shader projection shader geometry lazy plugin projection vector texture texture 
  //  light frame shader feature geometry render projection material transform camera shader 
  //  vector quaternion camera quaternion frame vector lazy matrix transform lazy projection 
  //  vector quaternion matrix modal quaternion quaternion transform light render camera matrix 
  //  material shader view material vector route lazy material preview material quaternion 
  //  feature scene scene shader material projection route route scene route lazy 
  //  preview vector material render scene camera preview feature feature matrix view 
  //  texture quaternion geometry mesh frame plugin modal shader preview route pipeline 
  //  mesh projection feature preview texture shader transform quaternion view mesh geometry 
  //  vector light shader view preview lazy material render pipeline vector camera 
  //  quaternion mesh quaternion scene texture feature material geometry quaternion projection feature 
  //  pipeline lazy render render light mesh vector feature plugin render quaternion 
  //  matrix transform shader pipeline mesh animation mesh texture shader matrix transform 
  //  scene mesh shader transform frame mesh camera animation render render camera 
  //  view modal render texture shader texture shader camera render mesh view 
  //  frame projection plugin pipeline projection view modal geometry render view lazy 
  //  projection matrix modal shader camera plugin matrix camera animation pipeline material 
  //  render vector camera view pipeline camera vector camera mesh preview view 
  //  mesh frame frame scene route geometry plugin view modal render render 
  //  view modal camera preview modal texture plugin geometry feature route animation 
  //  animation material scene animation view render feature texture projection frame mesh 
  //  modal render feature feature preview pipeline matrix transform matrix matrix lazy 
  //  preview vector matrix lazy matrix matrix shader transform frame matrix mesh 
  //  material texture route material frame matrix vector scene pipeline modal frame 
  //  view route mesh projection geometry vector preview scene projection preview preview 
  //  mesh scene animation lazy lazy quaternion lazy modal matrix modal quaternion 
  //  material mesh plugin vector render animation pipeline plugin scene matrix route 
  //  animation matrix camera vector route scene route matrix render material camera 
  //  material mesh material feature projection modal lazy preview preview matrix lazy 
  //  scene material shader texture light feature camera scene mesh scene camera 
  //  vector quaternion material lazy route matrix geometry animation quaternion camera route 
  //  view modal quaternion frame texture feature quaternion quaternion scene matrix camera 
  //  mesh lazy transform material feature texture route lazy preview shader matrix 
  //  animation light lazy projection projection material texture lazy lazy feature mesh 
  //  transform projection preview pipeline preview route feature scene animation mesh projection 
  //  animation pipeline scene lazy route animation matrix matrix route modal frame 
  //  lazy light texture camera plugin modal vector camera texture animation lazy 
  //  vector shader mesh view pipeline matrix view projection matrix modal lazy 
  //  frame frame light feature quaternion camera frame shader lazy material plugin 
  //  mesh render plugin shader quaternion quaternion feature transform plugin quaternion transform 
  //  route light mesh light pipeline frame render view shader lazy material 
  //  geometry matrix vector feature camera geometry vector view pipeline light quaternion 
  //  view plugin material camera view route route feature projection camera view 
  //  view route scene projection feature vector modal vector pipeline mesh frame 
  //  lazy light feature quaternion scene render preview modal feature vector animation 
  //  scene preview quaternion projection geometry pipeline lazy plugin camera light scene 
  //  feature animation route route geometry light frame plugin plugin transform matrix 
  //  texture render lazy modal vector texture lazy camera light pipeline matrix 
  //  plugin feature transform pipeline modal frame matrix render geometry modal plugin 
  //  transform plugin matrix frame matrix camera route animation animation material modal 
  //  shader view lazy matrix plugin animation view plugin projection mesh pipeline 
  //  lazy plugin geometry preview scene shader light view scene texture pipeline 
  //  vector texture camera scene texture route material lazy vector scene transform 
  //  quaternion route route vector material lazy texture feature frame light transform 
  //  preview render material shader camera pipeline light mesh render render animation 
  //  preview light light texture frame lazy texture modal shader route frame 
  //  material plugin projection route animation route matrix feature matrix feature lazy 
  //  texture matrix frame light view camera transform geometry matrix lazy geometry 
  //  pipeline projection pipeline transform transform transform vector modal animation frame scene 
  //  animation texture camera modal route animation material matrix lazy quaternion texture 
  //  light preview animation route modal transform material projection transform plugin geometry 
  //  vector camera route feature quaternion scene plugin material pipeline geometry texture 
  //  plugin plugin matrix view mesh shader vector camera feature frame mesh 
  //  camera render pipeline feature view texture plugin view material shader lazy 
  //  geometry matrix transform geometry plugin frame route scene view route geometry 
  //  plugin vector vector camera preview texture preview light feature scene quaternion 
  //  shader pipeline matrix frame matrix camera geometry vector feature modal mesh 
  //  camera mesh mesh animation matrix light scene transform camera animation geometry 
  //  camera pipeline vector material pipeline render animation lazy animation light render 
  //  view camera quaternion view light preview lazy material matrix geometry texture 
  //  animation route frame route transform plugin render view transform light route 
  //  texture material texture animation mesh projection view vector transform render matrix 
  //  preview quaternion pipeline render camera lazy feature plugin route material vector 
  //  quaternion vector vector plugin view lazy geometry mesh light frame scene 
  //  render light geometry vector view vector animation camera view transform projection 
  //  shader frame matrix light quaternion vector animation texture preview scene quaternion 
  //  view shader quaternion mesh material preview material quaternion shader animation view 
  //  matrix frame transform transform pipeline projection light projection feature projection feature 
  //  modal feature view view light preview scene pipeline view route animation 
  //  projection plugin vector light modal quaternion camera vector route texture scene 
  //  plugin geometry view animation scene vector frame animation transform mesh feature 
  //  lazy render feature projection animation animation modal mesh camera geometry route 
  //  shader feature shader camera animation matrix pipeline modal plugin view texture 
  //  modal modal preview mesh vector vector mesh mesh texture vector geometry 
  //  frame lazy animation pipeline matrix projection pipeline light view view animation 
  //  frame light preview plugin camera view render plugin material frame camera 
  //  projection feature scene material projection texture render frame pipeline matrix mesh 
  //  scene pipeline geometry animation light transform material texture camera vector quaternion 
  //  lazy lazy plugin animation pipeline camera view vector feature view vector 
  //  plugin plugin pipeline mesh texture preview pipeline preview plugin frame render 
  //  projection mesh view projection feature pipeline frame material feature frame camera 
  //  matrix pipeline frame shader render view texture animation material render
  */
})();

// mod-lazy-0032 -- lazy plugin module
;(function () {
  var g = (typeof window !== 'undefined' ? window : globalThis);
  var bag = (g.__BENCH_LAZY_MODULES = g.__BENCH_LAZY_MODULES || {});
  bag[32] = {
    id: 32,
    render: function (root) {
      var el = document.createElement('div');
      el.textContent = 'lazy-0032';
      el.className = 'bench-module bench-module-lazy';
      el.style.setProperty('--h', '152');
      root.appendChild(el);
      return el;
    }
  };
  /* PAD:
  mesh scene modal scene view feature plugin transform preview quaternion geometry quaternion 
  //  frame scene mesh feature mesh plugin route matrix shader transform transform 
  //  frame matrix preview quaternion geometry vector plugin render preview matrix light 
  //  shader shader material vector feature modal quaternion route geometry camera matrix 
  //  texture geometry light transform projection render pipeline matrix quaternion vector texture 
  //  geometry vector light render preview vector pipeline material quaternion feature shader 
  //  modal matrix material texture texture plugin vector matrix plugin view material 
  //  shader feature quaternion scene vector shader pipeline lazy view preview frame 
  //  projection material route plugin mesh texture route scene texture transform frame 
  //  animation view light camera quaternion frame light pipeline material modal animation 
  //  view texture quaternion transform pipeline texture route light light view camera 
  //  modal feature mesh animation quaternion frame preview pipeline vector matrix plugin 
  //  preview scene frame frame shader light lazy pipeline projection preview mesh 
  //  geometry view camera route lazy projection modal matrix view animation light 
  //  camera camera animation lazy mesh geometry camera transform texture animation pipeline 
  //  plugin plugin pipeline texture transform animation lazy render light plugin route 
  //  matrix preview texture material material plugin scene mesh render matrix lazy 
  //  matrix transform preview shader light geometry material projection vector plugin pipeline 
  //  matrix frame vector material vector animation geometry route transform matrix plugin 
  //  view material transform scene texture transform feature geometry quaternion modal projection 
  //  feature frame transform pipeline matrix light feature transform material light camera 
  //  feature scene render material projection route mesh geometry scene projection vector 
  //  matrix geometry preview vector shader matrix texture mesh view texture feature 
  //  vector route mesh lazy mesh pipeline preview camera mesh projection light 
  //  scene shader lazy material geometry animation texture shader shader scene vector 
  //  shader material preview feature shader matrix vector texture feature view shader 
  //  feature frame camera quaternion route render projection pipeline vector lazy texture 
  //  matrix camera texture pipeline view plugin lazy vector animation camera projection 
  //  shader view transform feature projection mesh feature matrix frame transform plugin 
  //  animation scene transform matrix feature transform animation mesh render camera light 
  //  material light projection matrix vector feature lazy light material geometry light 
  //  transform lazy animation vector preview projection texture vector mesh camera preview 
  //  texture mesh plugin scene geometry geometry preview transform modal lazy material 
  //  mesh matrix feature modal projection scene modal geometry pipeline transform texture 
  //  preview frame camera plugin frame matrix lazy material plugin feature shader 
  //  view pipeline material mesh shader material modal projection route camera mesh 
  //  scene mesh modal view modal shader light lazy plugin view pipeline 
  //  feature plugin transform view modal texture scene light shader transform geometry 
  //  vector feature shader vector scene frame scene projection geometry matrix matrix 
  //  preview texture route mesh vector pipeline matrix preview render vector camera 
  //  quaternion plugin camera view matrix quaternion geometry render render modal matrix 
  //  transform view scene scene preview geometry frame transform route plugin animation 
  //  route route frame material feature shader mesh projection view scene animation 
  //  material matrix transform plugin projection lazy lazy plugin vector mesh view 
  //  frame view quaternion matrix material geometry plugin animation texture vector material 
  //  plugin route plugin plugin feature preview shader material light transform transform 
  //  vector transform lazy geometry route camera feature preview view view matrix 
  //  light plugin view route material modal route pipeline frame preview frame 
  //  matrix quaternion lazy animation animation transform material transform lazy camera modal 
  //  preview mesh animation material preview material mesh projection geometry matrix pipeline 
  //  preview animation material route feature shader vector view transform vector view 
  //  route texture preview shader render matrix light texture texture camera feature 
  //  lazy shader feature camera mesh geometry camera plugin transform projection transform 
  //  texture feature feature quaternion light geometry projection pipeline matrix scene vector 
  //  view route light modal geometry texture lazy pipeline pipeline quaternion quaternion 
  //  shader geometry quaternion material preview view pipeline geometry light pipeline lazy 
  //  texture route transform projection material animation transform frame mesh vector preview 
  //  route material view texture light projection plugin lazy preview scene mesh 
  //  pipeline camera plugin camera feature animation scene scene shader view matrix 
  //  frame animation mesh preview modal scene vector route render modal scene 
  //  camera texture feature mesh route geometry quaternion camera lazy vector matrix 
  //  geometry matrix camera material transform route transform geometry shader shader scene 
  //  feature route geometry projection material frame geometry texture texture light render 
  //  geometry matrix render mesh feature render plugin light geometry transform quaternion 
  //  frame texture light light shader feature scene quaternion view shader quaternion 
  //  vector animation render lazy view vector transform pipeline scene route animation 
  //  frame feature matrix frame mesh quaternion material shader view light mesh 
  //  matrix quaternion feature feature animation scene pipeline quaternion frame route material 
  //  plugin animation quaternion preview geometry shader matrix shader lazy geometry view 
  //  feature feature render transform camera route quaternion view lazy frame render 
  //  mesh material light scene lazy modal light geometry vector camera scene 
  //  camera plugin modal camera plugin geometry projection feature animation pipeline vector 
  //  render projection view mesh texture scene feature mesh camera camera light 
  //  animation camera render view modal light projection modal scene plugin light 
  //  quaternion material feature preview lazy matrix camera light lazy shader render 
  //  modal pipeline animation vector shader route vector matrix projection matrix plugin 
  //  modal view texture frame geometry pipeline preview camera route animation quaternion 
  //  preview plugin shader route texture geometry feature route vector lazy shader 
  //  transform light transform animation feature shader texture plugin shader preview matrix 
  //  feature light quaternion geometry light route camera geometry light feature geometry 
  //  vector transform view quaternion quaternion projection camera scene scene light scene 
  //  geometry matrix matrix material texture scene quaternion render feature animation lazy 
  //  animation transform view frame route scene texture route feature shader scene 
  //  render view animation lazy quaternion vector frame projection plugin matrix camera 
  //  modal matrix scene frame mesh shader animation material animation pipeline scene 
  //  matrix texture shader camera camera route quaternion scene vector frame preview 
  //  route geometry feature feature route material light transform material vector projection 
  //  view matrix render preview material transform vector vector geometry render frame 
  //  geometry geometry vector mesh shader feature preview quaternion camera preview view 
  //  vector feature frame light shader projection texture render modal light vector 
  //  texture material camera route frame matrix modal transform shader render shader 
  //  pipeline feature material projection shader quaternion plugin transform preview render quaternion 
  //  projection frame transform vector pipeline frame quaternion preview mesh preview lazy 
  //  geometry shader camera geometry geometry animation lazy render matrix shader material 
  //  vector feature scene vector animation feature feature projection view projection matrix 
  //  animation shader shader pipeline preview render preview vector route view animation 
  //  modal route animation animation modal view vector scene modal frame modal 
  //  preview material camera quaternion feature mesh lazy pipeline frame modal quaternion 
  //  vector frame quaternion view lazy scene pipeline transform mesh projection lazy 
  //  animation texture render geometry route vector route projection pipeline mesh view 
  //  texture camera mesh animation projection camera light lazy plugin vector camera 
  //  modal plugin light view plugin mesh texture lazy mesh material geometry 
  //  frame plugin transform preview view lazy plugin vector material light texture 
  //  projection geometry projection feature pipeline shader modal transform modal animation shader 
  //  plugin modal material material pipeline geometry plugin vector camera transform scene 
  //  frame quaternion mesh preview vector vector shader preview feature lazy modal 
  //  geometry frame modal texture plugin projection route vector lazy pipeline light 
  //  matrix route transform modal geometry material projection mesh pipeline view view 
  //  shader view texture route texture render animation feature preview plugin route 
  //  scene mesh lazy preview light feature matrix shader projection transform vector 
  //  camera shader camera vector shader shader matrix animation camera render vector 
  //  view shader render render feature matrix frame pipeline frame view transform 
  //  projection lazy camera lazy animation mesh frame scene modal material geometry 
  //  transform route view texture projection shader projection shader lazy scene route 
  //  camera render geometry scene shader frame scene vector animation vector pipeline 
  //  modal frame transform plugin mesh quaternion matrix geometry frame pipeline projection 
  //  material texture matrix geometry pipeline preview shader mesh vector feature vector 
  //  mesh pipeline mesh lazy quaternion shader mesh pipeline route geometry quaternion 
  //  preview scene lazy render render scene material projection shader texture material 
  //  view animation plugin light matrix geometry animation matrix material modal pipeline 
  //  preview shader matrix feature shader view light pipeline view geometry route 
  //  texture scene mesh quaternion texture camera camera feature material camera frame 
  //  pipeline geometry shader frame view preview shader frame shader animation view 
  //  view transform geometry mesh geometry view pipeline view texture camera pipeline 
  //  light texture light camera camera projection material mesh render frame material 
  //  preview feature frame animation render material lazy geometry light modal pipeline 
  //  route light pipeline vector shader pipeline view animation transform lazy plugin 
  //  matrix modal frame route projection scene projection animation animation camera mesh 
  //  scene route light shader vector render vector route view route camera 
  //  render preview pipeline preview vector frame modal mesh shader geometry matrix 
  //  geometry vector transform feature preview transform material geometry feature preview view 
  //  scene pipeline scene geometry texture shader projection lazy route view geometry 
  //  scene texture quaternion frame vector material geometry mesh lazy camera preview 
  //  lazy scene frame geometry quaternion vector view lazy vector pipeline view 
  //  material transform preview scene render vector vector animation route light matrix 
  //  scene projection matrix vector animation vector view material lazy scene scene 
  //  transform texture vector view shader projection plugin camera view geometry material 
  //  geometry scene transform pipeline view feature mesh lazy preview pipeline scene 
  //  vector frame material light mesh transform frame render texture matrix light 
  //  camera pipeline texture matrix matrix render mesh vector vector lazy frame 
  //  modal frame quaternion material feature render mesh texture vector transform pipeline 
  //  feature geometry route pipeline vector shader feature animation mesh preview preview 
  //  animation texture projection animation material geometry matrix texture feature animation transform 
  //  transform scene camera mesh view projection material plugin matrix pipeline vector 
  //  scene view view quaternion feature preview
  */
})();

"use strict";(()=>{var Ca="169";var Ml=0,Za=1,Sl=2;var Zo=1,bl=2,Ye=3,fn=0,_e=1,Je=2,un=0,jn=1,Ja=2,$a=3,Ka=4,El=5,wn=100,wl=101,Al=102,Tl=103,Rl=104,Cl=200,Pl=201,Il=202,Ll=203,dr=204,fr=205,Ul=206,Dl=207,Nl=208,Fl=209,Ol=210,Bl=211,zl=212,kl=213,Vl=214,pr=0,mr=1,gr=2,ii=3,_r=4,xr=5,vr=6,yr=7,Jo=0,Hl=1,Gl=2,dn=0,Wl=1,Xl=2,ql=3,Yl=4,Zl=5,Jl=6,$l=7;var $o=300,si=301,ri=302,Mr=303,Sr=304,As=306,br=1e3,Rn=1001,Er=1002,Re=1003,Kl=1004;var Ti=1005;var Ne=1006,Us=1007;var Cn=1008;var je=1009,Ko=1010,Qo=1011,yi=1012,Pa=1013,Pn=1014,$e=1015,bi=1016,Ia=1017,La=1018,ai=1020,jo=35902,tl=1021,el=1022,Fe=1023,nl=1024,il=1025,ti=1026,oi=1027,sl=1028,Ua=1029,rl=1030,Da=1031;var Na=1033,Ji=33776,$i=33777,Ki=33778,Qi=33779,wr=35840,Ar=35841,Tr=35842,Rr=35843,Cr=36196,Pr=37492,Ir=37496,Lr=37808,Ur=37809,Dr=37810,Nr=37811,Fr=37812,Or=37813,Br=37814,zr=37815,kr=37816,Vr=37817,Hr=37818,Gr=37819,Wr=37820,Xr=37821,ji=36492,qr=36494,Yr=36495,al=36283,Zr=36284,Jr=36285,$r=36286;var es=2300,Kr=2301,Ds=2302,Qa=2400,ja=2401,to=2402;var Ql=3200,jl=3201;var ol=0,tc=1,cn="",Te="srgb",gn="srgb-linear",Fa="display-p3",Ts="display-p3-linear",ns="linear",Qt="srgb",is="rec709",ss="p3";var Bn=7680;var eo=519,ec=512,nc=513,ic=514,ll=515,sc=516,rc=517,ac=518,oc=519,no=35044;var io="300 es",Ke=2e3,rs=2001,pn=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;let n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;let s=this._listeners[t];if(s!==void 0){let r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;let n=this._listeners[t.type];if(n!==void 0){t.target=this;let s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,t);t.target=null}}},ce=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var Ns=Math.PI/180,Qr=180/Math.PI;function Ei(){let i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(ce[i&255]+ce[i>>8&255]+ce[i>>16&255]+ce[i>>24&255]+"-"+ce[t&255]+ce[t>>8&255]+"-"+ce[t>>16&15|64]+ce[t>>24&255]+"-"+ce[e&63|128]+ce[e>>8&255]+"-"+ce[e>>16&255]+ce[e>>24&255]+ce[n&255]+ce[n>>8&255]+ce[n>>16&255]+ce[n>>24&255]).toLowerCase()}function ge(i,t,e){return Math.max(t,Math.min(e,i))}function lc(i,t){return(i%t+t)%t}function Fs(i,t,e){return(1-e)*i+e*t}function ui(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function me(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}var Vt=class i{constructor(t=0,e=0){i.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(ge(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*n-a*s+t.x,this.y=r*s+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Pt=class i{constructor(t,e,n,s,r,a,o,l,c){i.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c)}set(t,e,n,s,r,a,o,l,c){let h=this.elements;return h[0]=t,h[1]=s,h[2]=o,h[3]=e,h[4]=r,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],p=n[7],f=n[2],m=n[5],x=n[8],M=s[0],d=s[3],u=s[6],E=s[1],S=s[4],w=s[7],F=s[2],R=s[5],A=s[8];return r[0]=a*M+o*E+l*F,r[3]=a*d+o*S+l*R,r[6]=a*u+o*w+l*A,r[1]=c*M+h*E+p*F,r[4]=c*d+h*S+p*R,r[7]=c*u+h*w+p*A,r[2]=f*M+m*E+x*F,r[5]=f*d+m*S+x*R,r[8]=f*u+m*w+x*A,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8];return e*a*h-e*o*c-n*r*h+n*o*l+s*r*c-s*a*l}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8],p=h*a-o*c,f=o*l-h*r,m=c*r-a*l,x=e*p+n*f+s*m;if(x===0)return this.set(0,0,0,0,0,0,0,0,0);let M=1/x;return t[0]=p*M,t[1]=(s*c-h*n)*M,t[2]=(o*n-s*a)*M,t[3]=f*M,t[4]=(h*e-s*l)*M,t[5]=(s*r-o*e)*M,t[6]=m*M,t[7]=(n*l-c*e)*M,t[8]=(a*e-n*r)*M,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,a,o){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+t,-s*c,s*l,-s*(-c*a+l*o)+o+e,0,0,1),this}scale(t,e){return this.premultiply(Os.makeScale(t,e)),this}rotate(t){return this.premultiply(Os.makeRotation(-t)),this}translate(t,e){return this.premultiply(Os.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}},Os=new Pt;function cl(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function as(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function cc(){let i=as("canvas");return i.style.display="block",i}var so={};function ts(i){i in so||(so[i]=!0,console.warn(i))}function hc(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}function uc(i){let t=i.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function dc(i){let t=i.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}var ro=new Pt().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),ao=new Pt().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),di={[gn]:{transfer:ns,primaries:is,luminanceCoefficients:[.2126,.7152,.0722],toReference:i=>i,fromReference:i=>i},[Te]:{transfer:Qt,primaries:is,luminanceCoefficients:[.2126,.7152,.0722],toReference:i=>i.convertSRGBToLinear(),fromReference:i=>i.convertLinearToSRGB()},[Ts]:{transfer:ns,primaries:ss,luminanceCoefficients:[.2289,.6917,.0793],toReference:i=>i.applyMatrix3(ao),fromReference:i=>i.applyMatrix3(ro)},[Fa]:{transfer:Qt,primaries:ss,luminanceCoefficients:[.2289,.6917,.0793],toReference:i=>i.convertSRGBToLinear().applyMatrix3(ao),fromReference:i=>i.applyMatrix3(ro).convertLinearToSRGB()}},fc=new Set([gn,Ts]),Wt={enabled:!0,_workingColorSpace:gn,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(i){if(!fc.has(i))throw new Error(`Unsupported working color space, "${i}".`);this._workingColorSpace=i},convert:function(i,t,e){if(this.enabled===!1||t===e||!t||!e)return i;let n=di[t].toReference,s=di[e].fromReference;return s(n(i))},fromWorkingColorSpace:function(i,t){return this.convert(i,this._workingColorSpace,t)},toWorkingColorSpace:function(i,t){return this.convert(i,t,this._workingColorSpace)},getPrimaries:function(i){return di[i].primaries},getTransfer:function(i){return i===cn?ns:di[i].transfer},getLuminanceCoefficients:function(i,t=this._workingColorSpace){return i.fromArray(di[t].luminanceCoefficients)}};function ei(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Bs(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var zn,jr=class{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{zn===void 0&&(zn=as("canvas")),zn.width=t.width,zn.height=t.height;let n=zn.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=zn}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=as("canvas");e.width=t.width,e.height=t.height;let n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);let s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=ei(r[a]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){let e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(ei(e[n]/255)*255):e[n]=ei(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},pc=0,os=class{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:pc++}),this.uuid=Ei(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(zs(s[a].image)):r.push(zs(s[a]))}else r=zs(s);n.url=r}return e||(t.images[this.uuid]=n),n}};function zs(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?jr.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var mc=0,Ee=class i extends pn{constructor(t=i.DEFAULT_IMAGE,e=i.DEFAULT_MAPPING,n=Rn,s=Rn,r=Ne,a=Cn,o=Fe,l=je,c=i.DEFAULT_ANISOTROPY,h=cn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:mc++}),this.uuid=Ei(),this.name="",this.source=new os(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Vt(0,0),this.repeat=new Vt(1,1),this.center=new Vt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Pt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==$o)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case br:t.x=t.x-Math.floor(t.x);break;case Rn:t.x=t.x<0?0:1;break;case Er:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case br:t.y=t.y-Math.floor(t.y);break;case Rn:t.y=t.y<0?0:1;break;case Er:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};Ee.DEFAULT_IMAGE=null;Ee.DEFAULT_MAPPING=$o;Ee.DEFAULT_ANISOTROPY=1;var Zt=class i{constructor(t=0,e=0,n=0,s=1){i.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*e+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*e+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*e+a[7]*n+a[11]*s+a[15]*r,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r,l=t.elements,c=l[0],h=l[4],p=l[8],f=l[1],m=l[5],x=l[9],M=l[2],d=l[6],u=l[10];if(Math.abs(h-f)<.01&&Math.abs(p-M)<.01&&Math.abs(x-d)<.01){if(Math.abs(h+f)<.1&&Math.abs(p+M)<.1&&Math.abs(x+d)<.1&&Math.abs(c+m+u-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let S=(c+1)/2,w=(m+1)/2,F=(u+1)/2,R=(h+f)/4,A=(p+M)/4,O=(x+d)/4;return S>w&&S>F?S<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(S),s=R/n,r=A/n):w>F?w<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(w),n=R/s,r=O/s):F<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(F),n=A/r,s=O/r),this.set(n,s,r,e),this}let E=Math.sqrt((d-x)*(d-x)+(p-M)*(p-M)+(f-h)*(f-h));return Math.abs(E)<.001&&(E=1),this.x=(d-x)/E,this.y=(p-M)/E,this.z=(f-h)/E,this.w=Math.acos((c+m+u-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},ta=class extends pn{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new Zt(0,0,t,e),this.scissorTest=!1,this.viewport=new Zt(0,0,t,e);let s={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Ne,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);let r=new Ee(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];let a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,s=t.textures.length;n<s;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;let e=Object.assign({},t.texture.image);return this.texture.source=new os(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},tn=class extends ta{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}},ls=class extends Ee{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Re,this.minFilter=Re,this.wrapR=Rn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var ea=class extends Ee{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Re,this.minFilter=Re,this.wrapR=Rn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var mn=class{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,a,o){let l=n[s+0],c=n[s+1],h=n[s+2],p=n[s+3],f=r[a+0],m=r[a+1],x=r[a+2],M=r[a+3];if(o===0){t[e+0]=l,t[e+1]=c,t[e+2]=h,t[e+3]=p;return}if(o===1){t[e+0]=f,t[e+1]=m,t[e+2]=x,t[e+3]=M;return}if(p!==M||l!==f||c!==m||h!==x){let d=1-o,u=l*f+c*m+h*x+p*M,E=u>=0?1:-1,S=1-u*u;if(S>Number.EPSILON){let F=Math.sqrt(S),R=Math.atan2(F,u*E);d=Math.sin(d*R)/F,o=Math.sin(o*R)/F}let w=o*E;if(l=l*d+f*w,c=c*d+m*w,h=h*d+x*w,p=p*d+M*w,d===1-o){let F=1/Math.sqrt(l*l+c*c+h*h+p*p);l*=F,c*=F,h*=F,p*=F}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=p}static multiplyQuaternionsFlat(t,e,n,s,r,a){let o=n[s],l=n[s+1],c=n[s+2],h=n[s+3],p=r[a],f=r[a+1],m=r[a+2],x=r[a+3];return t[e]=o*x+h*p+l*m-c*f,t[e+1]=l*x+h*f+c*p-o*m,t[e+2]=c*x+h*m+o*f-l*p,t[e+3]=h*x-o*p-l*f-c*m,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let n=t._x,s=t._y,r=t._z,a=t._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(s/2),p=o(r/2),f=l(n/2),m=l(s/2),x=l(r/2);switch(a){case"XYZ":this._x=f*h*p+c*m*x,this._y=c*m*p-f*h*x,this._z=c*h*x+f*m*p,this._w=c*h*p-f*m*x;break;case"YXZ":this._x=f*h*p+c*m*x,this._y=c*m*p-f*h*x,this._z=c*h*x-f*m*p,this._w=c*h*p+f*m*x;break;case"ZXY":this._x=f*h*p-c*m*x,this._y=c*m*p+f*h*x,this._z=c*h*x+f*m*p,this._w=c*h*p-f*m*x;break;case"ZYX":this._x=f*h*p-c*m*x,this._y=c*m*p+f*h*x,this._z=c*h*x-f*m*p,this._w=c*h*p+f*m*x;break;case"YZX":this._x=f*h*p+c*m*x,this._y=c*m*p+f*h*x,this._z=c*h*x-f*m*p,this._w=c*h*p-f*m*x;break;case"XZY":this._x=f*h*p-c*m*x,this._y=c*m*p-f*h*x,this._z=c*h*x+f*m*p,this._w=c*h*p+f*m*x;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,n=e[0],s=e[4],r=e[8],a=e[1],o=e[5],l=e[9],c=e[2],h=e[6],p=e[10],f=n+o+p;if(f>0){let m=.5/Math.sqrt(f+1);this._w=.25/m,this._x=(h-l)*m,this._y=(r-c)*m,this._z=(a-s)*m}else if(n>o&&n>p){let m=2*Math.sqrt(1+n-o-p);this._w=(h-l)/m,this._x=.25*m,this._y=(s+a)/m,this._z=(r+c)/m}else if(o>p){let m=2*Math.sqrt(1+o-n-p);this._w=(r-c)/m,this._x=(s+a)/m,this._y=.25*m,this._z=(l+h)/m}else{let m=2*Math.sqrt(1+p-n-o);this._w=(a-s)/m,this._x=(r+c)/m,this._y=(l+h)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(ge(this.dot(t),-1,1)))}rotateTowards(t,e){let n=this.angleTo(t);if(n===0)return this;let s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let n=t._x,s=t._y,r=t._z,a=t._w,o=e._x,l=e._y,c=e._z,h=e._w;return this._x=n*h+a*o+s*c-r*l,this._y=s*h+a*l+r*o-n*c,this._z=r*h+a*c+n*l-s*o,this._w=a*h-n*o-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);let n=this._x,s=this._y,r=this._z,a=this._w,o=a*t._w+n*t._x+s*t._y+r*t._z;if(o<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,o=-o):this.copy(t),o>=1)return this._w=a,this._x=n,this._y=s,this._z=r,this;let l=1-o*o;if(l<=Number.EPSILON){let m=1-e;return this._w=m*a+e*this._w,this._x=m*n+e*this._x,this._y=m*s+e*this._y,this._z=m*r+e*this._z,this.normalize(),this}let c=Math.sqrt(l),h=Math.atan2(c,o),p=Math.sin((1-e)*h)/c,f=Math.sin(e*h)/c;return this._w=a*p+this._w*f,this._x=n*p+this._x*f,this._y=s*p+this._y*f,this._z=r*p+this._z*f,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},L=class i{constructor(t=0,e=0,n=0){i.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(oo.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(oo.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=t.elements,a=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(t){let e=this.x,n=this.y,s=this.z,r=t.x,a=t.y,o=t.z,l=t.w,c=2*(a*s-o*n),h=2*(o*e-r*s),p=2*(r*n-a*e);return this.x=e+l*c+a*p-o*h,this.y=n+l*h+o*c-r*p,this.z=s+l*p+r*h-a*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let n=t.x,s=t.y,r=t.z,a=e.x,o=e.y,l=e.z;return this.x=s*l-r*o,this.y=r*a-n*l,this.z=n*o-s*a,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return ks.copy(this).projectOnVector(t),this.sub(ks)}reflect(t){return this.sub(ks.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(ge(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){let s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},ks=new L,oo=new mn,In=class{constructor(t=new L(1/0,1/0,1/0),e=new L(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(Le.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(Le.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=Le.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let n=t.geometry;if(n!==void 0){let r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,Le):Le.fromBufferAttribute(r,a),Le.applyMatrix4(t.matrixWorld),this.expandByPoint(Le);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Ri.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Ri.copy(n.boundingBox)),Ri.applyMatrix4(t.matrixWorld),this.union(Ri)}let s=t.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Le),Le.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(fi),Ci.subVectors(this.max,fi),kn.subVectors(t.a,fi),Vn.subVectors(t.b,fi),Hn.subVectors(t.c,fi),nn.subVectors(Vn,kn),sn.subVectors(Hn,Vn),xn.subVectors(kn,Hn);let e=[0,-nn.z,nn.y,0,-sn.z,sn.y,0,-xn.z,xn.y,nn.z,0,-nn.x,sn.z,0,-sn.x,xn.z,0,-xn.x,-nn.y,nn.x,0,-sn.y,sn.x,0,-xn.y,xn.x,0];return!Vs(e,kn,Vn,Hn,Ci)||(e=[1,0,0,0,1,0,0,0,1],!Vs(e,kn,Vn,Hn,Ci))?!1:(Pi.crossVectors(nn,sn),e=[Pi.x,Pi.y,Pi.z],Vs(e,kn,Vn,Hn,Ci))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Le).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Le).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(He[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),He[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),He[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),He[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),He[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),He[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),He[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),He[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(He),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}},He=[new L,new L,new L,new L,new L,new L,new L,new L],Le=new L,Ri=new In,kn=new L,Vn=new L,Hn=new L,nn=new L,sn=new L,xn=new L,fi=new L,Ci=new L,Pi=new L,vn=new L;function Vs(i,t,e,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){vn.fromArray(i,r);let o=s.x*Math.abs(vn.x)+s.y*Math.abs(vn.y)+s.z*Math.abs(vn.z),l=t.dot(vn),c=e.dot(vn),h=n.dot(vn);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}var gc=new In,pi=new L,Hs=new L,Mi=class{constructor(t=new L,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let n=this.center;e!==void 0?n.copy(e):gc.setFromPoints(t).getCenter(n);let s=0;for(let r=0,a=t.length;r<a;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;pi.subVectors(t,this.center);let e=pi.lengthSq();if(e>this.radius*this.radius){let n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(pi,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Hs.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(pi.copy(t.center).add(Hs)),this.expandByPoint(pi.copy(t.center).sub(Hs))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}},Ge=new L,Gs=new L,Ii=new L,rn=new L,Ws=new L,Li=new L,Xs=new L,na=class{constructor(t=new L,e=new L(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Ge)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=Ge.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(Ge.copy(this.origin).addScaledVector(this.direction,e),Ge.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){Gs.copy(t).add(e).multiplyScalar(.5),Ii.copy(e).sub(t).normalize(),rn.copy(this.origin).sub(Gs);let r=t.distanceTo(e)*.5,a=-this.direction.dot(Ii),o=rn.dot(this.direction),l=-rn.dot(Ii),c=rn.lengthSq(),h=Math.abs(1-a*a),p,f,m,x;if(h>0)if(p=a*l-o,f=a*o-l,x=r*h,p>=0)if(f>=-x)if(f<=x){let M=1/h;p*=M,f*=M,m=p*(p+a*f+2*o)+f*(a*p+f+2*l)+c}else f=r,p=Math.max(0,-(a*f+o)),m=-p*p+f*(f+2*l)+c;else f=-r,p=Math.max(0,-(a*f+o)),m=-p*p+f*(f+2*l)+c;else f<=-x?(p=Math.max(0,-(-a*r+o)),f=p>0?-r:Math.min(Math.max(-r,-l),r),m=-p*p+f*(f+2*l)+c):f<=x?(p=0,f=Math.min(Math.max(-r,-l),r),m=f*(f+2*l)+c):(p=Math.max(0,-(a*r+o)),f=p>0?r:Math.min(Math.max(-r,-l),r),m=-p*p+f*(f+2*l)+c);else f=a>0?-r:r,p=Math.max(0,-(a*f+o)),m=-p*p+f*(f+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,p),s&&s.copy(Gs).addScaledVector(Ii,f),m}intersectSphere(t,e){Ge.subVectors(t.center,this.origin);let n=Ge.dot(this.direction),s=Ge.dot(Ge)-n*n,r=t.radius*t.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){let n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,a,o,l,c=1/this.direction.x,h=1/this.direction.y,p=1/this.direction.z,f=this.origin;return c>=0?(n=(t.min.x-f.x)*c,s=(t.max.x-f.x)*c):(n=(t.max.x-f.x)*c,s=(t.min.x-f.x)*c),h>=0?(r=(t.min.y-f.y)*h,a=(t.max.y-f.y)*h):(r=(t.max.y-f.y)*h,a=(t.min.y-f.y)*h),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),p>=0?(o=(t.min.z-f.z)*p,l=(t.max.z-f.z)*p):(o=(t.max.z-f.z)*p,l=(t.min.z-f.z)*p),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,Ge)!==null}intersectTriangle(t,e,n,s,r){Ws.subVectors(e,t),Li.subVectors(n,t),Xs.crossVectors(Ws,Li);let a=this.direction.dot(Xs),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;rn.subVectors(this.origin,t);let l=o*this.direction.dot(Li.crossVectors(rn,Li));if(l<0)return null;let c=o*this.direction.dot(Ws.cross(rn));if(c<0||l+c>a)return null;let h=-o*rn.dot(Xs);return h<0?null:this.at(h/a,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},ee=class i{constructor(t,e,n,s,r,a,o,l,c,h,p,f,m,x,M,d){i.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c,h,p,f,m,x,M,d)}set(t,e,n,s,r,a,o,l,c,h,p,f,m,x,M,d){let u=this.elements;return u[0]=t,u[4]=e,u[8]=n,u[12]=s,u[1]=r,u[5]=a,u[9]=o,u[13]=l,u[2]=c,u[6]=h,u[10]=p,u[14]=f,u[3]=m,u[7]=x,u[11]=M,u[15]=d,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){let e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){let e=this.elements,n=t.elements,s=1/Gn.setFromMatrixColumn(t,0).length(),r=1/Gn.setFromMatrixColumn(t,1).length(),a=1/Gn.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,n=t.x,s=t.y,r=t.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),p=Math.sin(r);if(t.order==="XYZ"){let f=a*h,m=a*p,x=o*h,M=o*p;e[0]=l*h,e[4]=-l*p,e[8]=c,e[1]=m+x*c,e[5]=f-M*c,e[9]=-o*l,e[2]=M-f*c,e[6]=x+m*c,e[10]=a*l}else if(t.order==="YXZ"){let f=l*h,m=l*p,x=c*h,M=c*p;e[0]=f+M*o,e[4]=x*o-m,e[8]=a*c,e[1]=a*p,e[5]=a*h,e[9]=-o,e[2]=m*o-x,e[6]=M+f*o,e[10]=a*l}else if(t.order==="ZXY"){let f=l*h,m=l*p,x=c*h,M=c*p;e[0]=f-M*o,e[4]=-a*p,e[8]=x+m*o,e[1]=m+x*o,e[5]=a*h,e[9]=M-f*o,e[2]=-a*c,e[6]=o,e[10]=a*l}else if(t.order==="ZYX"){let f=a*h,m=a*p,x=o*h,M=o*p;e[0]=l*h,e[4]=x*c-m,e[8]=f*c+M,e[1]=l*p,e[5]=M*c+f,e[9]=m*c-x,e[2]=-c,e[6]=o*l,e[10]=a*l}else if(t.order==="YZX"){let f=a*l,m=a*c,x=o*l,M=o*c;e[0]=l*h,e[4]=M-f*p,e[8]=x*p+m,e[1]=p,e[5]=a*h,e[9]=-o*h,e[2]=-c*h,e[6]=m*p+x,e[10]=f-M*p}else if(t.order==="XZY"){let f=a*l,m=a*c,x=o*l,M=o*c;e[0]=l*h,e[4]=-p,e[8]=c*h,e[1]=f*p+M,e[5]=a*h,e[9]=m*p-x,e[2]=x*p-m,e[6]=o*h,e[10]=M*p+f}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(_c,t,xc)}lookAt(t,e,n){let s=this.elements;return Me.subVectors(t,e),Me.lengthSq()===0&&(Me.z=1),Me.normalize(),an.crossVectors(n,Me),an.lengthSq()===0&&(Math.abs(n.z)===1?Me.x+=1e-4:Me.z+=1e-4,Me.normalize(),an.crossVectors(n,Me)),an.normalize(),Ui.crossVectors(Me,an),s[0]=an.x,s[4]=Ui.x,s[8]=Me.x,s[1]=an.y,s[5]=Ui.y,s[9]=Me.y,s[2]=an.z,s[6]=Ui.z,s[10]=Me.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],p=n[5],f=n[9],m=n[13],x=n[2],M=n[6],d=n[10],u=n[14],E=n[3],S=n[7],w=n[11],F=n[15],R=s[0],A=s[4],O=s[8],tt=s[12],g=s[1],y=s[5],H=s[9],z=s[13],G=s[2],J=s[6],B=s[10],Q=s[14],V=s[3],ot=s[7],lt=s[11],gt=s[15];return r[0]=a*R+o*g+l*G+c*V,r[4]=a*A+o*y+l*J+c*ot,r[8]=a*O+o*H+l*B+c*lt,r[12]=a*tt+o*z+l*Q+c*gt,r[1]=h*R+p*g+f*G+m*V,r[5]=h*A+p*y+f*J+m*ot,r[9]=h*O+p*H+f*B+m*lt,r[13]=h*tt+p*z+f*Q+m*gt,r[2]=x*R+M*g+d*G+u*V,r[6]=x*A+M*y+d*J+u*ot,r[10]=x*O+M*H+d*B+u*lt,r[14]=x*tt+M*z+d*Q+u*gt,r[3]=E*R+S*g+w*G+F*V,r[7]=E*A+S*y+w*J+F*ot,r[11]=E*O+S*H+w*B+F*lt,r[15]=E*tt+S*z+w*Q+F*gt,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],a=t[1],o=t[5],l=t[9],c=t[13],h=t[2],p=t[6],f=t[10],m=t[14],x=t[3],M=t[7],d=t[11],u=t[15];return x*(+r*l*p-s*c*p-r*o*f+n*c*f+s*o*m-n*l*m)+M*(+e*l*m-e*c*f+r*a*f-s*a*m+s*c*h-r*l*h)+d*(+e*c*p-e*o*m-r*a*p+n*a*m+r*o*h-n*c*h)+u*(-s*o*h-e*l*p+e*o*f+s*a*p-n*a*f+n*l*h)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8],p=t[9],f=t[10],m=t[11],x=t[12],M=t[13],d=t[14],u=t[15],E=p*d*c-M*f*c+M*l*m-o*d*m-p*l*u+o*f*u,S=x*f*c-h*d*c-x*l*m+a*d*m+h*l*u-a*f*u,w=h*M*c-x*p*c+x*o*m-a*M*m-h*o*u+a*p*u,F=x*p*l-h*M*l-x*o*f+a*M*f+h*o*d-a*p*d,R=e*E+n*S+s*w+r*F;if(R===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/R;return t[0]=E*A,t[1]=(M*f*r-p*d*r-M*s*m+n*d*m+p*s*u-n*f*u)*A,t[2]=(o*d*r-M*l*r+M*s*c-n*d*c-o*s*u+n*l*u)*A,t[3]=(p*l*r-o*f*r-p*s*c+n*f*c+o*s*m-n*l*m)*A,t[4]=S*A,t[5]=(h*d*r-x*f*r+x*s*m-e*d*m-h*s*u+e*f*u)*A,t[6]=(x*l*r-a*d*r-x*s*c+e*d*c+a*s*u-e*l*u)*A,t[7]=(a*f*r-h*l*r+h*s*c-e*f*c-a*s*m+e*l*m)*A,t[8]=w*A,t[9]=(x*p*r-h*M*r-x*n*m+e*M*m+h*n*u-e*p*u)*A,t[10]=(a*M*r-x*o*r+x*n*c-e*M*c-a*n*u+e*o*u)*A,t[11]=(h*o*r-a*p*r-h*n*c+e*p*c+a*n*m-e*o*m)*A,t[12]=F*A,t[13]=(h*M*s-x*p*s+x*n*f-e*M*f-h*n*d+e*p*d)*A,t[14]=(x*o*s-a*M*s-x*n*l+e*M*l+a*n*d-e*o*d)*A,t[15]=(a*p*s-h*o*s+h*n*l-e*p*l-a*n*f+e*o*f)*A,this}scale(t){let e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let n=Math.cos(e),s=Math.sin(e),r=1-n,a=t.x,o=t.y,l=t.z,c=r*a,h=r*o;return this.set(c*a+n,c*o-s*l,c*l+s*o,0,c*o+s*l,h*o+n,h*l-s*a,0,c*l-s*o,h*l+s*a,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,a){return this.set(1,n,r,0,t,1,a,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){let s=this.elements,r=e._x,a=e._y,o=e._z,l=e._w,c=r+r,h=a+a,p=o+o,f=r*c,m=r*h,x=r*p,M=a*h,d=a*p,u=o*p,E=l*c,S=l*h,w=l*p,F=n.x,R=n.y,A=n.z;return s[0]=(1-(M+u))*F,s[1]=(m+w)*F,s[2]=(x-S)*F,s[3]=0,s[4]=(m-w)*R,s[5]=(1-(f+u))*R,s[6]=(d+E)*R,s[7]=0,s[8]=(x+S)*A,s[9]=(d-E)*A,s[10]=(1-(f+M))*A,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){let s=this.elements,r=Gn.set(s[0],s[1],s[2]).length(),a=Gn.set(s[4],s[5],s[6]).length(),o=Gn.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),t.x=s[12],t.y=s[13],t.z=s[14],Ue.copy(this);let c=1/r,h=1/a,p=1/o;return Ue.elements[0]*=c,Ue.elements[1]*=c,Ue.elements[2]*=c,Ue.elements[4]*=h,Ue.elements[5]*=h,Ue.elements[6]*=h,Ue.elements[8]*=p,Ue.elements[9]*=p,Ue.elements[10]*=p,e.setFromRotationMatrix(Ue),n.x=r,n.y=a,n.z=o,this}makePerspective(t,e,n,s,r,a,o=Ke){let l=this.elements,c=2*r/(e-t),h=2*r/(n-s),p=(e+t)/(e-t),f=(n+s)/(n-s),m,x;if(o===Ke)m=-(a+r)/(a-r),x=-2*a*r/(a-r);else if(o===rs)m=-a/(a-r),x=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=p,l[12]=0,l[1]=0,l[5]=h,l[9]=f,l[13]=0,l[2]=0,l[6]=0,l[10]=m,l[14]=x,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,s,r,a,o=Ke){let l=this.elements,c=1/(e-t),h=1/(n-s),p=1/(a-r),f=(e+t)*c,m=(n+s)*h,x,M;if(o===Ke)x=(a+r)*p,M=-2*p;else if(o===rs)x=r*p,M=-1*p;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-f,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-m,l[2]=0,l[6]=0,l[10]=M,l[14]=-x,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}},Gn=new L,Ue=new ee,_c=new L(0,0,0),xc=new L(1,1,1),an=new L,Ui=new L,Me=new L,lo=new ee,co=new mn,ze=class i{constructor(t=0,e=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){let s=t.elements,r=s[0],a=s[4],o=s[8],l=s[1],c=s[5],h=s[9],p=s[2],f=s[6],m=s[10];switch(e){case"XYZ":this._y=Math.asin(ge(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,m),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(f,c),this._z=0);break;case"YXZ":this._x=Math.asin(-ge(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,m),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-p,r),this._z=0);break;case"ZXY":this._x=Math.asin(ge(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-p,m),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-ge(p,-1,1)),Math.abs(p)<.9999999?(this._x=Math.atan2(f,m),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(ge(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-p,r)):(this._x=0,this._y=Math.atan2(o,m));break;case"XZY":this._z=Math.asin(-ge(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(f,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,m),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return lo.makeRotationFromQuaternion(t),this.setFromRotationMatrix(lo,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return co.setFromEuler(this),this.setFromQuaternion(co,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};ze.DEFAULT_ORDER="XYZ";var cs=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},vc=0,ho=new L,Wn=new mn,We=new ee,Di=new L,mi=new L,yc=new L,Mc=new mn,uo=new L(1,0,0),fo=new L(0,1,0),po=new L(0,0,1),mo={type:"added"},Sc={type:"removed"},Xn={type:"childadded",child:null},qs={type:"childremoved",child:null},Pe=class i extends pn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:vc++}),this.uuid=Ei(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let t=new L,e=new ze,n=new mn,s=new L(1,1,1);function r(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new ee},normalMatrix:{value:new Pt}}),this.matrix=new ee,this.matrixWorld=new ee,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new cs,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return Wn.setFromAxisAngle(t,e),this.quaternion.multiply(Wn),this}rotateOnWorldAxis(t,e){return Wn.setFromAxisAngle(t,e),this.quaternion.premultiply(Wn),this}rotateX(t){return this.rotateOnAxis(uo,t)}rotateY(t){return this.rotateOnAxis(fo,t)}rotateZ(t){return this.rotateOnAxis(po,t)}translateOnAxis(t,e){return ho.copy(t).applyQuaternion(this.quaternion),this.position.add(ho.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(uo,t)}translateY(t){return this.translateOnAxis(fo,t)}translateZ(t){return this.translateOnAxis(po,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(We.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?Di.copy(t):Di.set(t,e,n);let s=this.parent;this.updateWorldMatrix(!0,!1),mi.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?We.lookAt(mi,Di,this.up):We.lookAt(Di,mi,this.up),this.quaternion.setFromRotationMatrix(We),s&&(We.extractRotation(s.matrixWorld),Wn.setFromRotationMatrix(We),this.quaternion.premultiply(Wn.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(mo),Xn.child=t,this.dispatchEvent(Xn),Xn.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Sc),qs.child=t,this.dispatchEvent(qs),qs.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),We.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),We.multiply(t.parent.matrixWorld)),t.applyMatrix4(We),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(mo),Xn.child=t,this.dispatchEvent(Xn),Xn.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){let a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(mi,t,yc),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(mi,Mc,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){let n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(t){let e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let p=l[c];r(t.shapes,p)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(t.materials,this.material[l]));s.material=o}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(r(t.animations,l))}}if(e){let o=a(t.geometries),l=a(t.materials),c=a(t.textures),h=a(t.images),p=a(t.shapes),f=a(t.skeletons),m=a(t.animations),x=a(t.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),p.length>0&&(n.shapes=p),f.length>0&&(n.skeletons=f),m.length>0&&(n.animations=m),x.length>0&&(n.nodes=x)}return n.object=s,n;function a(o){let l=[];for(let c in o){let h=o[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){let s=t.children[n];this.add(s.clone())}return this}};Pe.DEFAULT_UP=new L(0,1,0);Pe.DEFAULT_MATRIX_AUTO_UPDATE=!0;Pe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var De=new L,Xe=new L,Ys=new L,qe=new L,qn=new L,Yn=new L,go=new L,Zs=new L,Js=new L,$s=new L,Ks=new Zt,Qs=new Zt,js=new Zt,An=class i{constructor(t=new L,e=new L,n=new L){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),De.subVectors(t,e),s.cross(De);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){De.subVectors(s,e),Xe.subVectors(n,e),Ys.subVectors(t,e);let a=De.dot(De),o=De.dot(Xe),l=De.dot(Ys),c=Xe.dot(Xe),h=Xe.dot(Ys),p=a*c-o*o;if(p===0)return r.set(0,0,0),null;let f=1/p,m=(c*l-o*h)*f,x=(a*h-o*l)*f;return r.set(1-m-x,x,m)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,qe)===null?!1:qe.x>=0&&qe.y>=0&&qe.x+qe.y<=1}static getInterpolation(t,e,n,s,r,a,o,l){return this.getBarycoord(t,e,n,s,qe)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,qe.x),l.addScaledVector(a,qe.y),l.addScaledVector(o,qe.z),l)}static getInterpolatedAttribute(t,e,n,s,r,a){return Ks.setScalar(0),Qs.setScalar(0),js.setScalar(0),Ks.fromBufferAttribute(t,e),Qs.fromBufferAttribute(t,n),js.fromBufferAttribute(t,s),a.setScalar(0),a.addScaledVector(Ks,r.x),a.addScaledVector(Qs,r.y),a.addScaledVector(js,r.z),a}static isFrontFacing(t,e,n,s){return De.subVectors(n,e),Xe.subVectors(t,e),De.cross(Xe).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return De.subVectors(this.c,this.b),Xe.subVectors(this.a,this.b),De.cross(Xe).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return i.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return i.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return i.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return i.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return i.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let n=this.a,s=this.b,r=this.c,a,o;qn.subVectors(s,n),Yn.subVectors(r,n),Zs.subVectors(t,n);let l=qn.dot(Zs),c=Yn.dot(Zs);if(l<=0&&c<=0)return e.copy(n);Js.subVectors(t,s);let h=qn.dot(Js),p=Yn.dot(Js);if(h>=0&&p<=h)return e.copy(s);let f=l*p-h*c;if(f<=0&&l>=0&&h<=0)return a=l/(l-h),e.copy(n).addScaledVector(qn,a);$s.subVectors(t,r);let m=qn.dot($s),x=Yn.dot($s);if(x>=0&&m<=x)return e.copy(r);let M=m*c-l*x;if(M<=0&&c>=0&&x<=0)return o=c/(c-x),e.copy(n).addScaledVector(Yn,o);let d=h*x-m*p;if(d<=0&&p-h>=0&&m-x>=0)return go.subVectors(r,s),o=(p-h)/(p-h+(m-x)),e.copy(s).addScaledVector(go,o);let u=1/(d+M+f);return a=M*u,o=f*u,e.copy(n).addScaledVector(qn,a).addScaledVector(Yn,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},hl={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},on={h:0,s:0,l:0},Ni={h:0,s:0,l:0};function tr(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}var It=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Te){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Wt.toWorkingColorSpace(this,e),this}setRGB(t,e,n,s=Wt.workingColorSpace){return this.r=t,this.g=e,this.b=n,Wt.toWorkingColorSpace(this,s),this}setHSL(t,e,n,s=Wt.workingColorSpace){if(t=lc(t,1),e=ge(e,0,1),n=ge(n,0,1),e===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+e):n+e-n*e,a=2*n-r;this.r=tr(a,r,t+1/3),this.g=tr(a,r,t),this.b=tr(a,r,t-1/3)}return Wt.toWorkingColorSpace(this,s),this}setStyle(t,e=Te){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Te){let n=hl[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=ei(t.r),this.g=ei(t.g),this.b=ei(t.b),this}copyLinearToSRGB(t){return this.r=Bs(t.r),this.g=Bs(t.g),this.b=Bs(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Te){return Wt.fromWorkingColorSpace(he.copy(this),t),Math.round(ge(he.r*255,0,255))*65536+Math.round(ge(he.g*255,0,255))*256+Math.round(ge(he.b*255,0,255))}getHexString(t=Te){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Wt.workingColorSpace){Wt.fromWorkingColorSpace(he.copy(this),e);let n=he.r,s=he.g,r=he.b,a=Math.max(n,s,r),o=Math.min(n,s,r),l,c,h=(o+a)/2;if(o===a)l=0,c=0;else{let p=a-o;switch(c=h<=.5?p/(a+o):p/(2-a-o),a){case n:l=(s-r)/p+(s<r?6:0);break;case s:l=(r-n)/p+2;break;case r:l=(n-s)/p+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=Wt.workingColorSpace){return Wt.fromWorkingColorSpace(he.copy(this),e),t.r=he.r,t.g=he.g,t.b=he.b,t}getStyle(t=Te){Wt.fromWorkingColorSpace(he.copy(this),t);let e=he.r,n=he.g,s=he.b;return t!==Te?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(on),this.setHSL(on.h+t,on.s+e,on.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(on),t.getHSL(Ni);let n=Fs(on.h,Ni.h,e),s=Fs(on.s,Ni.s,e),r=Fs(on.l,Ni.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},he=new It;It.NAMES=hl;var bc=0,Ln=class extends pn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:bc++}),this.uuid=Ei(),this.name="",this.type="Material",this.blending=jn,this.side=fn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=dr,this.blendDst=fr,this.blendEquation=wn,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new It(0,0,0),this.blendAlpha=0,this.depthFunc=ii,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=eo,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Bn,this.stencilZFail=Bn,this.stencilZPass=Bn,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==jn&&(n.blending=this.blending),this.side!==fn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==dr&&(n.blendSrc=this.blendSrc),this.blendDst!==fr&&(n.blendDst=this.blendDst),this.blendEquation!==wn&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==ii&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==eo&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Bn&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Bn&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Bn&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(e){let r=s(t.textures),a=s(t.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,n=null;if(e!==null){let s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},hs=class extends Ln{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new It(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ze,this.combine=Jo,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}};var se=new L,Fi=new Vt,Ce=class{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=no,this.updateRanges=[],this.gpuType=$e,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Fi.fromBufferAttribute(this,e),Fi.applyMatrix3(t),this.setXY(e,Fi.x,Fi.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)se.fromBufferAttribute(this,e),se.applyMatrix3(t),this.setXYZ(e,se.x,se.y,se.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)se.fromBufferAttribute(this,e),se.applyMatrix4(t),this.setXYZ(e,se.x,se.y,se.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)se.fromBufferAttribute(this,e),se.applyNormalMatrix(t),this.setXYZ(e,se.x,se.y,se.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)se.fromBufferAttribute(this,e),se.transformDirection(t),this.setXYZ(e,se.x,se.y,se.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=ui(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=me(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=ui(e,this.array)),e}setX(t,e){return this.normalized&&(e=me(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=ui(e,this.array)),e}setY(t,e){return this.normalized&&(e=me(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=ui(e,this.array)),e}setZ(t,e){return this.normalized&&(e=me(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=ui(e,this.array)),e}setW(t,e){return this.normalized&&(e=me(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=me(e,this.array),n=me(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=me(e,this.array),n=me(n,this.array),s=me(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=me(e,this.array),n=me(n,this.array),s=me(s,this.array),r=me(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==no&&(t.usage=this.usage),t}};var us=class extends Ce{constructor(t,e,n){super(new Uint16Array(t),e,n)}};var ds=class extends Ce{constructor(t,e,n){super(new Uint32Array(t),e,n)}};var Qe=class extends Ce{constructor(t,e,n){super(new Float32Array(t),e,n)}},Ec=0,Ae=new ee,er=new Pe,Zn=new L,Se=new In,gi=new In,oe=new L,Un=class i extends pn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Ec++}),this.uuid=Ei(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(cl(t)?ds:us)(t,1):this.index=t,this}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Pt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return Ae.makeRotationFromQuaternion(t),this.applyMatrix4(Ae),this}rotateX(t){return Ae.makeRotationX(t),this.applyMatrix4(Ae),this}rotateY(t){return Ae.makeRotationY(t),this.applyMatrix4(Ae),this}rotateZ(t){return Ae.makeRotationZ(t),this.applyMatrix4(Ae),this}translate(t,e,n){return Ae.makeTranslation(t,e,n),this.applyMatrix4(Ae),this}scale(t,e,n){return Ae.makeScale(t,e,n),this.applyMatrix4(Ae),this}lookAt(t){return er.lookAt(t),er.updateMatrix(),this.applyMatrix4(er.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Zn).negate(),this.translate(Zn.x,Zn.y,Zn.z),this}setFromPoints(t){let e=[];for(let n=0,s=t.length;n<s;n++){let r=t[n];e.push(r.x,r.y,r.z||0)}return this.setAttribute("position",new Qe(e,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new In);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new L(-1/0,-1/0,-1/0),new L(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){let r=e[n];Se.setFromBufferAttribute(r),this.morphTargetsRelative?(oe.addVectors(this.boundingBox.min,Se.min),this.boundingBox.expandByPoint(oe),oe.addVectors(this.boundingBox.max,Se.max),this.boundingBox.expandByPoint(oe)):(this.boundingBox.expandByPoint(Se.min),this.boundingBox.expandByPoint(Se.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Mi);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new L,1/0);return}if(t){let n=this.boundingSphere.center;if(Se.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){let o=e[r];gi.setFromBufferAttribute(o),this.morphTargetsRelative?(oe.addVectors(Se.min,gi.min),Se.expandByPoint(oe),oe.addVectors(Se.max,gi.max),Se.expandByPoint(oe)):(Se.expandByPoint(gi.min),Se.expandByPoint(gi.max))}Se.getCenter(n);let s=0;for(let r=0,a=t.count;r<a;r++)oe.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(oe));if(e)for(let r=0,a=e.length;r<a;r++){let o=e[r],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)oe.fromBufferAttribute(o,c),l&&(Zn.fromBufferAttribute(t,c),oe.add(Zn)),s=Math.max(s,n.distanceToSquared(oe))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Ce(new Float32Array(4*n.count),4));let a=this.getAttribute("tangent"),o=[],l=[];for(let O=0;O<n.count;O++)o[O]=new L,l[O]=new L;let c=new L,h=new L,p=new L,f=new Vt,m=new Vt,x=new Vt,M=new L,d=new L;function u(O,tt,g){c.fromBufferAttribute(n,O),h.fromBufferAttribute(n,tt),p.fromBufferAttribute(n,g),f.fromBufferAttribute(r,O),m.fromBufferAttribute(r,tt),x.fromBufferAttribute(r,g),h.sub(c),p.sub(c),m.sub(f),x.sub(f);let y=1/(m.x*x.y-x.x*m.y);isFinite(y)&&(M.copy(h).multiplyScalar(x.y).addScaledVector(p,-m.y).multiplyScalar(y),d.copy(p).multiplyScalar(m.x).addScaledVector(h,-x.x).multiplyScalar(y),o[O].add(M),o[tt].add(M),o[g].add(M),l[O].add(d),l[tt].add(d),l[g].add(d))}let E=this.groups;E.length===0&&(E=[{start:0,count:t.count}]);for(let O=0,tt=E.length;O<tt;++O){let g=E[O],y=g.start,H=g.count;for(let z=y,G=y+H;z<G;z+=3)u(t.getX(z+0),t.getX(z+1),t.getX(z+2))}let S=new L,w=new L,F=new L,R=new L;function A(O){F.fromBufferAttribute(s,O),R.copy(F);let tt=o[O];S.copy(tt),S.sub(F.multiplyScalar(F.dot(tt))).normalize(),w.crossVectors(R,tt);let y=w.dot(l[O])<0?-1:1;a.setXYZW(O,S.x,S.y,S.z,y)}for(let O=0,tt=E.length;O<tt;++O){let g=E[O],y=g.start,H=g.count;for(let z=y,G=y+H;z<G;z+=3)A(t.getX(z+0)),A(t.getX(z+1)),A(t.getX(z+2))}}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Ce(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let f=0,m=n.count;f<m;f++)n.setXYZ(f,0,0,0);let s=new L,r=new L,a=new L,o=new L,l=new L,c=new L,h=new L,p=new L;if(t)for(let f=0,m=t.count;f<m;f+=3){let x=t.getX(f+0),M=t.getX(f+1),d=t.getX(f+2);s.fromBufferAttribute(e,x),r.fromBufferAttribute(e,M),a.fromBufferAttribute(e,d),h.subVectors(a,r),p.subVectors(s,r),h.cross(p),o.fromBufferAttribute(n,x),l.fromBufferAttribute(n,M),c.fromBufferAttribute(n,d),o.add(h),l.add(h),c.add(h),n.setXYZ(x,o.x,o.y,o.z),n.setXYZ(M,l.x,l.y,l.z),n.setXYZ(d,c.x,c.y,c.z)}else for(let f=0,m=e.count;f<m;f+=3)s.fromBufferAttribute(e,f+0),r.fromBufferAttribute(e,f+1),a.fromBufferAttribute(e,f+2),h.subVectors(a,r),p.subVectors(s,r),h.cross(p),n.setXYZ(f+0,h.x,h.y,h.z),n.setXYZ(f+1,h.x,h.y,h.z),n.setXYZ(f+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)oe.fromBufferAttribute(t,e),oe.normalize(),t.setXYZ(e,oe.x,oe.y,oe.z)}toNonIndexed(){function t(o,l){let c=o.array,h=o.itemSize,p=o.normalized,f=new c.constructor(l.length*h),m=0,x=0;for(let M=0,d=l.length;M<d;M++){o.isInterleavedBufferAttribute?m=l[M]*o.data.stride+o.offset:m=l[M]*h;for(let u=0;u<h;u++)f[x++]=c[m++]}return new Ce(f,h,p)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new i,n=this.index.array,s=this.attributes;for(let o in s){let l=s[o],c=t(l,n);e.setAttribute(o,c)}let r=this.morphAttributes;for(let o in r){let l=[],c=r[o];for(let h=0,p=c.length;h<p;h++){let f=c[h],m=t(f,n);l.push(m)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){let t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let n=this.attributes;for(let l in n){let c=n[l];t.data.attributes[l]=c.toJSON(t.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let p=0,f=c.length;p<f;p++){let m=c[p];h.push(m.toJSON(t.data))}h.length>0&&(s[l]=h,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(t.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let n=t.index;n!==null&&this.setIndex(n.clone(e));let s=t.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(e))}let r=t.morphAttributes;for(let c in r){let h=[],p=r[c];for(let f=0,m=p.length;f<m;f++)h.push(p[f].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;let a=t.groups;for(let c=0,h=a.length;c<h;c++){let p=a[c];this.addGroup(p.start,p.count,p.materialIndex)}let o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},_o=new ee,yn=new na,Oi=new Mi,xo=new L,Bi=new L,zi=new L,ki=new L,nr=new L,Vi=new L,vo=new L,Hi=new L,be=class extends Pe{constructor(t=new Un,e=new hs){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(s,t);let o=this.morphTargetInfluences;if(r&&o){Vi.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=o[l],p=r[l];h!==0&&(nr.fromBufferAttribute(p,t),a?Vi.addScaledVector(nr,h):Vi.addScaledVector(nr.sub(e),h))}e.add(Vi)}return e}raycast(t,e){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Oi.copy(n.boundingSphere),Oi.applyMatrix4(r),yn.copy(t.ray).recast(t.near),!(Oi.containsPoint(yn.origin)===!1&&(yn.intersectSphere(Oi,xo)===null||yn.origin.distanceToSquared(xo)>(t.far-t.near)**2))&&(_o.copy(r).invert(),yn.copy(t.ray).applyMatrix4(_o),!(n.boundingBox!==null&&yn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,yn)))}_computeIntersections(t,e,n){let s,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,p=r.attributes.normal,f=r.groups,m=r.drawRange;if(o!==null)if(Array.isArray(a))for(let x=0,M=f.length;x<M;x++){let d=f[x],u=a[d.materialIndex],E=Math.max(d.start,m.start),S=Math.min(o.count,Math.min(d.start+d.count,m.start+m.count));for(let w=E,F=S;w<F;w+=3){let R=o.getX(w),A=o.getX(w+1),O=o.getX(w+2);s=Gi(this,u,t,n,c,h,p,R,A,O),s&&(s.faceIndex=Math.floor(w/3),s.face.materialIndex=d.materialIndex,e.push(s))}}else{let x=Math.max(0,m.start),M=Math.min(o.count,m.start+m.count);for(let d=x,u=M;d<u;d+=3){let E=o.getX(d),S=o.getX(d+1),w=o.getX(d+2);s=Gi(this,a,t,n,c,h,p,E,S,w),s&&(s.faceIndex=Math.floor(d/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let x=0,M=f.length;x<M;x++){let d=f[x],u=a[d.materialIndex],E=Math.max(d.start,m.start),S=Math.min(l.count,Math.min(d.start+d.count,m.start+m.count));for(let w=E,F=S;w<F;w+=3){let R=w,A=w+1,O=w+2;s=Gi(this,u,t,n,c,h,p,R,A,O),s&&(s.faceIndex=Math.floor(w/3),s.face.materialIndex=d.materialIndex,e.push(s))}}else{let x=Math.max(0,m.start),M=Math.min(l.count,m.start+m.count);for(let d=x,u=M;d<u;d+=3){let E=d,S=d+1,w=d+2;s=Gi(this,a,t,n,c,h,p,E,S,w),s&&(s.faceIndex=Math.floor(d/3),e.push(s))}}}};function wc(i,t,e,n,s,r,a,o){let l;if(t.side===_e?l=n.intersectTriangle(a,r,s,!0,o):l=n.intersectTriangle(s,r,a,t.side===fn,o),l===null)return null;Hi.copy(o),Hi.applyMatrix4(i.matrixWorld);let c=e.ray.origin.distanceTo(Hi);return c<e.near||c>e.far?null:{distance:c,point:Hi.clone(),object:i}}function Gi(i,t,e,n,s,r,a,o,l,c){i.getVertexPosition(o,Bi),i.getVertexPosition(l,zi),i.getVertexPosition(c,ki);let h=wc(i,t,e,n,Bi,zi,ki,vo);if(h){let p=new L;An.getBarycoord(vo,Bi,zi,ki,p),s&&(h.uv=An.getInterpolatedAttribute(s,o,l,c,p,new Vt)),r&&(h.uv1=An.getInterpolatedAttribute(r,o,l,c,p,new Vt)),a&&(h.normal=An.getInterpolatedAttribute(a,o,l,c,p,new L),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let f={a:o,b:l,c,normal:new L,materialIndex:0};An.getNormal(Bi,zi,ki,f.normal),h.face=f,h.barycoord=p}return h}var Dn=class i extends Un{constructor(t=1,e=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let l=[],c=[],h=[],p=[],f=0,m=0;x("z","y","x",-1,-1,n,e,t,a,r,0),x("z","y","x",1,-1,n,e,-t,a,r,1),x("x","z","y",1,1,t,n,e,s,a,2),x("x","z","y",1,-1,t,n,-e,s,a,3),x("x","y","z",1,-1,t,e,n,s,r,4),x("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new Qe(c,3)),this.setAttribute("normal",new Qe(h,3)),this.setAttribute("uv",new Qe(p,2));function x(M,d,u,E,S,w,F,R,A,O,tt){let g=w/A,y=F/O,H=w/2,z=F/2,G=R/2,J=A+1,B=O+1,Q=0,V=0,ot=new L;for(let lt=0;lt<B;lt++){let gt=lt*y-z;for(let zt=0;zt<J;zt++){let Xt=zt*g-H;ot[M]=Xt*E,ot[d]=gt*S,ot[u]=G,c.push(ot.x,ot.y,ot.z),ot[M]=0,ot[d]=0,ot[u]=R>0?1:-1,h.push(ot.x,ot.y,ot.z),p.push(zt/A),p.push(1-lt/O),Q+=1}}for(let lt=0;lt<O;lt++)for(let gt=0;gt<A;gt++){let zt=f+gt+J*lt,Xt=f+gt+J*(lt+1),W=f+(gt+1)+J*(lt+1),$=f+(gt+1)+J*lt;l.push(zt,Xt,$),l.push(Xt,W,$),V+=6}o.addGroup(m,V,tt),m+=V,f+=Q}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};function li(i){let t={};for(let e in i){t[e]={};for(let n in i[e]){let s=i[e][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone():Array.isArray(s)?t[e][n]=s.slice():t[e][n]=s}}return t}function de(i){let t={};for(let e=0;e<i.length;e++){let n=li(i[e]);for(let s in n)t[s]=n[s]}return t}function Ac(i){let t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function ul(i){let t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Wt.workingColorSpace}var Tc={clone:li,merge:de},Rc=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Cc=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,ke=class extends Ln{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Rc,this.fragmentShader=Cc,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=li(t.uniforms),this.uniformsGroups=Ac(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?e.uniforms[s]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[s]={type:"m4",value:a.toArray()}:e.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}},fs=class extends Pe{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ee,this.projectionMatrix=new ee,this.projectionMatrixInverse=new ee,this.coordinateSystem=Ke}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},ln=new L,yo=new Vt,Mo=new Vt,ue=class extends fs{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=Qr*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(Ns*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Qr*2*Math.atan(Math.tan(Ns*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){ln.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(ln.x,ln.y).multiplyScalar(-t/ln.z),ln.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(ln.x,ln.y).multiplyScalar(-t/ln.z)}getViewSize(t,e){return this.getViewBounds(t,yo,Mo),e.subVectors(Mo,yo)}setViewOffset(t,e,n,s,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(Ns*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*s/l,e-=a.offsetY*n/c,s*=a.width/l,n*=a.height/c}let o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}},Jn=-90,$n=1,ia=class extends Pe{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new ue(Jn,$n,t,e);s.layers=this.layers,this.add(s);let r=new ue(Jn,$n,t,e);r.layers=this.layers,this.add(r);let a=new ue(Jn,$n,t,e);a.layers=this.layers,this.add(a);let o=new ue(Jn,$n,t,e);o.layers=this.layers,this.add(o);let l=new ue(Jn,$n,t,e);l.layers=this.layers,this.add(l);let c=new ue(Jn,$n,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[n,s,r,a,o,l]=e;for(let c of e)this.remove(c);if(t===Ke)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===rs)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,c,h]=this.children,p=t.getRenderTarget(),f=t.getActiveCubeFace(),m=t.getActiveMipmapLevel(),x=t.xr.enabled;t.xr.enabled=!1;let M=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,s),t.render(e,r),t.setRenderTarget(n,1,s),t.render(e,a),t.setRenderTarget(n,2,s),t.render(e,o),t.setRenderTarget(n,3,s),t.render(e,l),t.setRenderTarget(n,4,s),t.render(e,c),n.texture.generateMipmaps=M,t.setRenderTarget(n,5,s),t.render(e,h),t.setRenderTarget(p,f,m),t.xr.enabled=x,n.texture.needsPMREMUpdate=!0}},ps=class extends Ee{constructor(t,e,n,s,r,a,o,l,c,h){t=t!==void 0?t:[],e=e!==void 0?e:si,super(t,e,n,s,r,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},sa=class extends tn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new ps(s,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:Ne}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Dn(5,5,5),r=new ke({name:"CubemapFromEquirect",uniforms:li(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:_e,blending:un});r.uniforms.tEquirect.value=e;let a=new be(s,r),o=e.minFilter;return e.minFilter===Cn&&(e.minFilter=Ne),new ia(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e,n,s){let r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,s);t.setRenderTarget(r)}},ir=new L,Pc=new L,Ic=new Pt,Ze=class{constructor(t=new L(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){let s=ir.subVectors(n,e).cross(Pc.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){let n=t.delta(ir),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){let e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let n=e||Ic.getNormalMatrix(t),s=this.coplanarPoint(ir).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}},Mn=new Mi,Wi=new L,Si=class{constructor(t=new Ze,e=new Ze,n=new Ze,s=new Ze,r=new Ze,a=new Ze){this.planes=[t,e,n,s,r,a]}set(t,e,n,s,r,a){let o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(t){let e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=Ke){let n=this.planes,s=t.elements,r=s[0],a=s[1],o=s[2],l=s[3],c=s[4],h=s[5],p=s[6],f=s[7],m=s[8],x=s[9],M=s[10],d=s[11],u=s[12],E=s[13],S=s[14],w=s[15];if(n[0].setComponents(l-r,f-c,d-m,w-u).normalize(),n[1].setComponents(l+r,f+c,d+m,w+u).normalize(),n[2].setComponents(l+a,f+h,d+x,w+E).normalize(),n[3].setComponents(l-a,f-h,d-x,w-E).normalize(),n[4].setComponents(l-o,f-p,d-M,w-S).normalize(),e===Ke)n[5].setComponents(l+o,f+p,d+M,w+S).normalize();else if(e===rs)n[5].setComponents(o,p,M,S).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Mn.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Mn.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Mn)}intersectsSprite(t){return Mn.center.set(0,0,0),Mn.radius=.7071067811865476,Mn.applyMatrix4(t.matrixWorld),this.intersectsSphere(Mn)}intersectsSphere(t){let e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){let e=this.planes;for(let n=0;n<6;n++){let s=e[n];if(Wi.x=s.normal.x>0?t.max.x:t.min.x,Wi.y=s.normal.y>0?t.max.y:t.min.y,Wi.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(Wi)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function dl(){let i=null,t=!1,e=null,n=null;function s(r,a){e(r,a),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function Lc(i){let t=new WeakMap;function e(o,l){let c=o.array,h=o.usage,p=c.byteLength,f=i.createBuffer();i.bindBuffer(l,f),i.bufferData(l,c,h),o.onUploadCallback();let m;if(c instanceof Float32Array)m=i.FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?m=i.HALF_FLOAT:m=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)m=i.SHORT;else if(c instanceof Uint32Array)m=i.UNSIGNED_INT;else if(c instanceof Int32Array)m=i.INT;else if(c instanceof Int8Array)m=i.BYTE;else if(c instanceof Uint8Array)m=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)m=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:f,type:m,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:p}}function n(o,l,c){let h=l.array,p=l.updateRanges;if(i.bindBuffer(c,o),p.length===0)i.bufferSubData(c,0,h);else{p.sort((m,x)=>m.start-x.start);let f=0;for(let m=1;m<p.length;m++){let x=p[f],M=p[m];M.start<=x.start+x.count+1?x.count=Math.max(x.count,M.start+M.count-x.start):(++f,p[f]=M)}p.length=f+1;for(let m=0,x=p.length;m<x;m++){let M=p[m];i.bufferSubData(c,M.start*h.BYTES_PER_ELEMENT,h,M.start,M.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=t.get(o);l&&(i.deleteBuffer(l.buffer),t.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let h=t.get(o);(!h||h.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=t.get(o);if(c===void 0)t.set(o,e(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:s,remove:r,update:a}}var ms=class i extends Un{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};let r=t/2,a=e/2,o=Math.floor(n),l=Math.floor(s),c=o+1,h=l+1,p=t/o,f=e/l,m=[],x=[],M=[],d=[];for(let u=0;u<h;u++){let E=u*f-a;for(let S=0;S<c;S++){let w=S*p-r;x.push(w,-E,0),M.push(0,0,1),d.push(S/o),d.push(1-u/l)}}for(let u=0;u<l;u++)for(let E=0;E<o;E++){let S=E+c*u,w=E+c*(u+1),F=E+1+c*(u+1),R=E+1+c*u;m.push(S,w,R),m.push(w,F,R)}this.setIndex(m),this.setAttribute("position",new Qe(x,3)),this.setAttribute("normal",new Qe(M,3)),this.setAttribute("uv",new Qe(d,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.widthSegments,t.heightSegments)}},Uc=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Dc=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Nc=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Fc=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Oc=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Bc=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,zc=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,kc=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Vc=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,Hc=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Gc=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Wc=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Xc=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,qc=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Yc=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Zc=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Jc=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,$c=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Kc=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Qc=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,jc=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,th=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,eh=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,nh=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,ih=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,sh=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,rh=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,ah=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,oh=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,lh=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,ch="gl_FragColor = linearToOutputTexel( gl_FragColor );",hh=`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,uh=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,dh=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,fh=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,ph=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,mh=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,gh=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,_h=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,xh=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,vh=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,yh=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Mh=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Sh=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,bh=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Eh=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,wh=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Ah=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Th=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Rh=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Ch=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Ph=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Ih=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Lh=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Uh=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Dh=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Nh=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Fh=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Oh=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Bh=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,zh=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,kh=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Vh=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Hh=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Gh=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Wh=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Xh=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,qh=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Yh=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Zh=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Jh=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,$h=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Kh=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Qh=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,jh=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,tu=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,eu=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,nu=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,iu=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,su=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,ru=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,au=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,ou=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,lu=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,cu=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,hu=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,uu=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,du=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,fu=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,pu=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,mu=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,gu=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,_u=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,xu=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,vu=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,yu=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Mu=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Su=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,bu=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Eu=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,wu=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Au=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Tu=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Ru=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Cu=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Pu=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Iu=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Lu=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Uu=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Du=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Nu=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Fu=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Ou=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Bu=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,zu=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,ku=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Vu=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,Hu=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Gu=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Wu=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Xu=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,qu=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Yu=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Zu=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Ju=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,$u=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Ku=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Qu=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,ju=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,td=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ed=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,nd=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,id=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,sd=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,rd=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ad=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,od=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,ld=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,cd=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,hd=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,ud=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ct={alphahash_fragment:Uc,alphahash_pars_fragment:Dc,alphamap_fragment:Nc,alphamap_pars_fragment:Fc,alphatest_fragment:Oc,alphatest_pars_fragment:Bc,aomap_fragment:zc,aomap_pars_fragment:kc,batching_pars_vertex:Vc,batching_vertex:Hc,begin_vertex:Gc,beginnormal_vertex:Wc,bsdfs:Xc,iridescence_fragment:qc,bumpmap_pars_fragment:Yc,clipping_planes_fragment:Zc,clipping_planes_pars_fragment:Jc,clipping_planes_pars_vertex:$c,clipping_planes_vertex:Kc,color_fragment:Qc,color_pars_fragment:jc,color_pars_vertex:th,color_vertex:eh,common:nh,cube_uv_reflection_fragment:ih,defaultnormal_vertex:sh,displacementmap_pars_vertex:rh,displacementmap_vertex:ah,emissivemap_fragment:oh,emissivemap_pars_fragment:lh,colorspace_fragment:ch,colorspace_pars_fragment:hh,envmap_fragment:uh,envmap_common_pars_fragment:dh,envmap_pars_fragment:fh,envmap_pars_vertex:ph,envmap_physical_pars_fragment:wh,envmap_vertex:mh,fog_vertex:gh,fog_pars_vertex:_h,fog_fragment:xh,fog_pars_fragment:vh,gradientmap_pars_fragment:yh,lightmap_pars_fragment:Mh,lights_lambert_fragment:Sh,lights_lambert_pars_fragment:bh,lights_pars_begin:Eh,lights_toon_fragment:Ah,lights_toon_pars_fragment:Th,lights_phong_fragment:Rh,lights_phong_pars_fragment:Ch,lights_physical_fragment:Ph,lights_physical_pars_fragment:Ih,lights_fragment_begin:Lh,lights_fragment_maps:Uh,lights_fragment_end:Dh,logdepthbuf_fragment:Nh,logdepthbuf_pars_fragment:Fh,logdepthbuf_pars_vertex:Oh,logdepthbuf_vertex:Bh,map_fragment:zh,map_pars_fragment:kh,map_particle_fragment:Vh,map_particle_pars_fragment:Hh,metalnessmap_fragment:Gh,metalnessmap_pars_fragment:Wh,morphinstance_vertex:Xh,morphcolor_vertex:qh,morphnormal_vertex:Yh,morphtarget_pars_vertex:Zh,morphtarget_vertex:Jh,normal_fragment_begin:$h,normal_fragment_maps:Kh,normal_pars_fragment:Qh,normal_pars_vertex:jh,normal_vertex:tu,normalmap_pars_fragment:eu,clearcoat_normal_fragment_begin:nu,clearcoat_normal_fragment_maps:iu,clearcoat_pars_fragment:su,iridescence_pars_fragment:ru,opaque_fragment:au,packing:ou,premultiplied_alpha_fragment:lu,project_vertex:cu,dithering_fragment:hu,dithering_pars_fragment:uu,roughnessmap_fragment:du,roughnessmap_pars_fragment:fu,shadowmap_pars_fragment:pu,shadowmap_pars_vertex:mu,shadowmap_vertex:gu,shadowmask_pars_fragment:_u,skinbase_vertex:xu,skinning_pars_vertex:vu,skinning_vertex:yu,skinnormal_vertex:Mu,specularmap_fragment:Su,specularmap_pars_fragment:bu,tonemapping_fragment:Eu,tonemapping_pars_fragment:wu,transmission_fragment:Au,transmission_pars_fragment:Tu,uv_pars_fragment:Ru,uv_pars_vertex:Cu,uv_vertex:Pu,worldpos_vertex:Iu,background_vert:Lu,background_frag:Uu,backgroundCube_vert:Du,backgroundCube_frag:Nu,cube_vert:Fu,cube_frag:Ou,depth_vert:Bu,depth_frag:zu,distanceRGBA_vert:ku,distanceRGBA_frag:Vu,equirect_vert:Hu,equirect_frag:Gu,linedashed_vert:Wu,linedashed_frag:Xu,meshbasic_vert:qu,meshbasic_frag:Yu,meshlambert_vert:Zu,meshlambert_frag:Ju,meshmatcap_vert:$u,meshmatcap_frag:Ku,meshnormal_vert:Qu,meshnormal_frag:ju,meshphong_vert:td,meshphong_frag:ed,meshphysical_vert:nd,meshphysical_frag:id,meshtoon_vert:sd,meshtoon_frag:rd,points_vert:ad,points_frag:od,shadow_vert:ld,shadow_frag:cd,sprite_vert:hd,sprite_frag:ud},et={common:{diffuse:{value:new It(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Pt},alphaMap:{value:null},alphaMapTransform:{value:new Pt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Pt}},envmap:{envMap:{value:null},envMapRotation:{value:new Pt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Pt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Pt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Pt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Pt},normalScale:{value:new Vt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Pt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Pt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Pt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Pt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new It(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new It(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Pt},alphaTest:{value:0},uvTransform:{value:new Pt}},sprite:{diffuse:{value:new It(16777215)},opacity:{value:1},center:{value:new Vt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Pt},alphaMap:{value:null},alphaMapTransform:{value:new Pt},alphaTest:{value:0}}},Be={basic:{uniforms:de([et.common,et.specularmap,et.envmap,et.aomap,et.lightmap,et.fog]),vertexShader:Ct.meshbasic_vert,fragmentShader:Ct.meshbasic_frag},lambert:{uniforms:de([et.common,et.specularmap,et.envmap,et.aomap,et.lightmap,et.emissivemap,et.bumpmap,et.normalmap,et.displacementmap,et.fog,et.lights,{emissive:{value:new It(0)}}]),vertexShader:Ct.meshlambert_vert,fragmentShader:Ct.meshlambert_frag},phong:{uniforms:de([et.common,et.specularmap,et.envmap,et.aomap,et.lightmap,et.emissivemap,et.bumpmap,et.normalmap,et.displacementmap,et.fog,et.lights,{emissive:{value:new It(0)},specular:{value:new It(1118481)},shininess:{value:30}}]),vertexShader:Ct.meshphong_vert,fragmentShader:Ct.meshphong_frag},standard:{uniforms:de([et.common,et.envmap,et.aomap,et.lightmap,et.emissivemap,et.bumpmap,et.normalmap,et.displacementmap,et.roughnessmap,et.metalnessmap,et.fog,et.lights,{emissive:{value:new It(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ct.meshphysical_vert,fragmentShader:Ct.meshphysical_frag},toon:{uniforms:de([et.common,et.aomap,et.lightmap,et.emissivemap,et.bumpmap,et.normalmap,et.displacementmap,et.gradientmap,et.fog,et.lights,{emissive:{value:new It(0)}}]),vertexShader:Ct.meshtoon_vert,fragmentShader:Ct.meshtoon_frag},matcap:{uniforms:de([et.common,et.bumpmap,et.normalmap,et.displacementmap,et.fog,{matcap:{value:null}}]),vertexShader:Ct.meshmatcap_vert,fragmentShader:Ct.meshmatcap_frag},points:{uniforms:de([et.points,et.fog]),vertexShader:Ct.points_vert,fragmentShader:Ct.points_frag},dashed:{uniforms:de([et.common,et.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ct.linedashed_vert,fragmentShader:Ct.linedashed_frag},depth:{uniforms:de([et.common,et.displacementmap]),vertexShader:Ct.depth_vert,fragmentShader:Ct.depth_frag},normal:{uniforms:de([et.common,et.bumpmap,et.normalmap,et.displacementmap,{opacity:{value:1}}]),vertexShader:Ct.meshnormal_vert,fragmentShader:Ct.meshnormal_frag},sprite:{uniforms:de([et.sprite,et.fog]),vertexShader:Ct.sprite_vert,fragmentShader:Ct.sprite_frag},background:{uniforms:{uvTransform:{value:new Pt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ct.background_vert,fragmentShader:Ct.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Pt}},vertexShader:Ct.backgroundCube_vert,fragmentShader:Ct.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ct.cube_vert,fragmentShader:Ct.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ct.equirect_vert,fragmentShader:Ct.equirect_frag},distanceRGBA:{uniforms:de([et.common,et.displacementmap,{referencePosition:{value:new L},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ct.distanceRGBA_vert,fragmentShader:Ct.distanceRGBA_frag},shadow:{uniforms:de([et.lights,et.fog,{color:{value:new It(0)},opacity:{value:1}}]),vertexShader:Ct.shadow_vert,fragmentShader:Ct.shadow_frag}};Be.physical={uniforms:de([Be.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Pt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Pt},clearcoatNormalScale:{value:new Vt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Pt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Pt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Pt},sheen:{value:0},sheenColor:{value:new It(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Pt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Pt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Pt},transmissionSamplerSize:{value:new Vt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Pt},attenuationDistance:{value:0},attenuationColor:{value:new It(0)},specularColor:{value:new It(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Pt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Pt},anisotropyVector:{value:new Vt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Pt}}]),vertexShader:Ct.meshphysical_vert,fragmentShader:Ct.meshphysical_frag};var Xi={r:0,b:0,g:0},Sn=new ze,dd=new ee;function fd(i,t,e,n,s,r,a){let o=new It(0),l=r===!0?0:1,c,h,p=null,f=0,m=null;function x(E){let S=E.isScene===!0?E.background:null;return S&&S.isTexture&&(S=(E.backgroundBlurriness>0?e:t).get(S)),S}function M(E){let S=!1,w=x(E);w===null?u(o,l):w&&w.isColor&&(u(w,1),S=!0);let F=i.xr.getEnvironmentBlendMode();F==="additive"?n.buffers.color.setClear(0,0,0,1,a):F==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(i.autoClear||S)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function d(E,S){let w=x(S);w&&(w.isCubeTexture||w.mapping===As)?(h===void 0&&(h=new be(new Dn(1,1,1),new ke({name:"BackgroundCubeMaterial",uniforms:li(Be.backgroundCube.uniforms),vertexShader:Be.backgroundCube.vertexShader,fragmentShader:Be.backgroundCube.fragmentShader,side:_e,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(F,R,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),Sn.copy(S.backgroundRotation),Sn.x*=-1,Sn.y*=-1,Sn.z*=-1,w.isCubeTexture&&w.isRenderTargetTexture===!1&&(Sn.y*=-1,Sn.z*=-1),h.material.uniforms.envMap.value=w,h.material.uniforms.flipEnvMap.value=w.isCubeTexture&&w.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=S.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(dd.makeRotationFromEuler(Sn)),h.material.toneMapped=Wt.getTransfer(w.colorSpace)!==Qt,(p!==w||f!==w.version||m!==i.toneMapping)&&(h.material.needsUpdate=!0,p=w,f=w.version,m=i.toneMapping),h.layers.enableAll(),E.unshift(h,h.geometry,h.material,0,0,null)):w&&w.isTexture&&(c===void 0&&(c=new be(new ms(2,2),new ke({name:"BackgroundMaterial",uniforms:li(Be.background.uniforms),vertexShader:Be.background.vertexShader,fragmentShader:Be.background.fragmentShader,side:fn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=w,c.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,c.material.toneMapped=Wt.getTransfer(w.colorSpace)!==Qt,w.matrixAutoUpdate===!0&&w.updateMatrix(),c.material.uniforms.uvTransform.value.copy(w.matrix),(p!==w||f!==w.version||m!==i.toneMapping)&&(c.material.needsUpdate=!0,p=w,f=w.version,m=i.toneMapping),c.layers.enableAll(),E.unshift(c,c.geometry,c.material,0,0,null))}function u(E,S){E.getRGB(Xi,ul(i)),n.buffers.color.setClear(Xi.r,Xi.g,Xi.b,S,a)}return{getClearColor:function(){return o},setClearColor:function(E,S=1){o.set(E),l=S,u(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(E){l=E,u(o,l)},render:M,addToRenderList:d}}function pd(i,t){let e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=f(null),r=s,a=!1;function o(g,y,H,z,G){let J=!1,B=p(z,H,y);r!==B&&(r=B,c(r.object)),J=m(g,z,H,G),J&&x(g,z,H,G),G!==null&&t.update(G,i.ELEMENT_ARRAY_BUFFER),(J||a)&&(a=!1,w(g,y,H,z),G!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(G).buffer))}function l(){return i.createVertexArray()}function c(g){return i.bindVertexArray(g)}function h(g){return i.deleteVertexArray(g)}function p(g,y,H){let z=H.wireframe===!0,G=n[g.id];G===void 0&&(G={},n[g.id]=G);let J=G[y.id];J===void 0&&(J={},G[y.id]=J);let B=J[z];return B===void 0&&(B=f(l()),J[z]=B),B}function f(g){let y=[],H=[],z=[];for(let G=0;G<e;G++)y[G]=0,H[G]=0,z[G]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:y,enabledAttributes:H,attributeDivisors:z,object:g,attributes:{},index:null}}function m(g,y,H,z){let G=r.attributes,J=y.attributes,B=0,Q=H.getAttributes();for(let V in Q)if(Q[V].location>=0){let lt=G[V],gt=J[V];if(gt===void 0&&(V==="instanceMatrix"&&g.instanceMatrix&&(gt=g.instanceMatrix),V==="instanceColor"&&g.instanceColor&&(gt=g.instanceColor)),lt===void 0||lt.attribute!==gt||gt&&lt.data!==gt.data)return!0;B++}return r.attributesNum!==B||r.index!==z}function x(g,y,H,z){let G={},J=y.attributes,B=0,Q=H.getAttributes();for(let V in Q)if(Q[V].location>=0){let lt=J[V];lt===void 0&&(V==="instanceMatrix"&&g.instanceMatrix&&(lt=g.instanceMatrix),V==="instanceColor"&&g.instanceColor&&(lt=g.instanceColor));let gt={};gt.attribute=lt,lt&&lt.data&&(gt.data=lt.data),G[V]=gt,B++}r.attributes=G,r.attributesNum=B,r.index=z}function M(){let g=r.newAttributes;for(let y=0,H=g.length;y<H;y++)g[y]=0}function d(g){u(g,0)}function u(g,y){let H=r.newAttributes,z=r.enabledAttributes,G=r.attributeDivisors;H[g]=1,z[g]===0&&(i.enableVertexAttribArray(g),z[g]=1),G[g]!==y&&(i.vertexAttribDivisor(g,y),G[g]=y)}function E(){let g=r.newAttributes,y=r.enabledAttributes;for(let H=0,z=y.length;H<z;H++)y[H]!==g[H]&&(i.disableVertexAttribArray(H),y[H]=0)}function S(g,y,H,z,G,J,B){B===!0?i.vertexAttribIPointer(g,y,H,G,J):i.vertexAttribPointer(g,y,H,z,G,J)}function w(g,y,H,z){M();let G=z.attributes,J=H.getAttributes(),B=y.defaultAttributeValues;for(let Q in J){let V=J[Q];if(V.location>=0){let ot=G[Q];if(ot===void 0&&(Q==="instanceMatrix"&&g.instanceMatrix&&(ot=g.instanceMatrix),Q==="instanceColor"&&g.instanceColor&&(ot=g.instanceColor)),ot!==void 0){let lt=ot.normalized,gt=ot.itemSize,zt=t.get(ot);if(zt===void 0)continue;let Xt=zt.buffer,W=zt.type,$=zt.bytesPerElement,pt=W===i.INT||W===i.UNSIGNED_INT||ot.gpuType===Pa;if(ot.isInterleavedBufferAttribute){let ct=ot.data,Tt=ct.stride,Mt=ot.offset;if(ct.isInstancedInterleavedBuffer){for(let Dt=0;Dt<V.locationSize;Dt++)u(V.location+Dt,ct.meshPerAttribute);g.isInstancedMesh!==!0&&z._maxInstanceCount===void 0&&(z._maxInstanceCount=ct.meshPerAttribute*ct.count)}else for(let Dt=0;Dt<V.locationSize;Dt++)d(V.location+Dt);i.bindBuffer(i.ARRAY_BUFFER,Xt);for(let Dt=0;Dt<V.locationSize;Dt++)S(V.location+Dt,gt/V.locationSize,W,lt,Tt*$,(Mt+gt/V.locationSize*Dt)*$,pt)}else{if(ot.isInstancedBufferAttribute){for(let ct=0;ct<V.locationSize;ct++)u(V.location+ct,ot.meshPerAttribute);g.isInstancedMesh!==!0&&z._maxInstanceCount===void 0&&(z._maxInstanceCount=ot.meshPerAttribute*ot.count)}else for(let ct=0;ct<V.locationSize;ct++)d(V.location+ct);i.bindBuffer(i.ARRAY_BUFFER,Xt);for(let ct=0;ct<V.locationSize;ct++)S(V.location+ct,gt/V.locationSize,W,lt,gt*$,gt/V.locationSize*ct*$,pt)}}else if(B!==void 0){let lt=B[Q];if(lt!==void 0)switch(lt.length){case 2:i.vertexAttrib2fv(V.location,lt);break;case 3:i.vertexAttrib3fv(V.location,lt);break;case 4:i.vertexAttrib4fv(V.location,lt);break;default:i.vertexAttrib1fv(V.location,lt)}}}}E()}function F(){O();for(let g in n){let y=n[g];for(let H in y){let z=y[H];for(let G in z)h(z[G].object),delete z[G];delete y[H]}delete n[g]}}function R(g){if(n[g.id]===void 0)return;let y=n[g.id];for(let H in y){let z=y[H];for(let G in z)h(z[G].object),delete z[G];delete y[H]}delete n[g.id]}function A(g){for(let y in n){let H=n[y];if(H[g.id]===void 0)continue;let z=H[g.id];for(let G in z)h(z[G].object),delete z[G];delete H[g.id]}}function O(){tt(),a=!0,r!==s&&(r=s,c(r.object))}function tt(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:O,resetDefaultState:tt,dispose:F,releaseStatesOfGeometry:R,releaseStatesOfProgram:A,initAttributes:M,enableAttribute:d,disableUnusedAttributes:E}}function md(i,t,e){let n;function s(c){n=c}function r(c,h){i.drawArrays(n,c,h),e.update(h,n,1)}function a(c,h,p){p!==0&&(i.drawArraysInstanced(n,c,h,p),e.update(h,n,p))}function o(c,h,p){if(p===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,h,0,p);let m=0;for(let x=0;x<p;x++)m+=h[x];e.update(m,n,1)}function l(c,h,p,f){if(p===0)return;let m=t.get("WEBGL_multi_draw");if(m===null)for(let x=0;x<c.length;x++)a(c[x],h[x],f[x]);else{m.multiDrawArraysInstancedWEBGL(n,c,0,h,0,f,0,p);let x=0;for(let M=0;M<p;M++)x+=h[M];for(let M=0;M<f.length;M++)e.update(x,n,f[M])}}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function gd(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){let A=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(A){return!(A!==Fe&&n.convert(A)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(A){let O=A===bi&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(A!==je&&n.convert(A)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&A!==$e&&!O)}function l(A){if(A==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp",h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let p=e.logarithmicDepthBuffer===!0,f=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control");if(f===!0){let A=t.get("EXT_clip_control");A.clipControlEXT(A.LOWER_LEFT_EXT,A.ZERO_TO_ONE_EXT)}let m=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),x=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),M=i.getParameter(i.MAX_TEXTURE_SIZE),d=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),u=i.getParameter(i.MAX_VERTEX_ATTRIBS),E=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),S=i.getParameter(i.MAX_VARYING_VECTORS),w=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),F=x>0,R=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:p,reverseDepthBuffer:f,maxTextures:m,maxVertexTextures:x,maxTextureSize:M,maxCubemapSize:d,maxAttributes:u,maxVertexUniforms:E,maxVaryings:S,maxFragmentUniforms:w,vertexTextures:F,maxSamples:R}}function _d(i){let t=this,e=null,n=0,s=!1,r=!1,a=new Ze,o=new Pt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(p,f){let m=p.length!==0||f||n!==0||s;return s=f,n=p.length,m},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(p,f){e=h(p,f,0)},this.setState=function(p,f,m){let x=p.clippingPlanes,M=p.clipIntersection,d=p.clipShadows,u=i.get(p);if(!s||x===null||x.length===0||r&&!d)r?h(null):c();else{let E=r?0:n,S=E*4,w=u.clippingState||null;l.value=w,w=h(x,f,S,m);for(let F=0;F!==S;++F)w[F]=e[F];u.clippingState=w,this.numIntersection=M?this.numPlanes:0,this.numPlanes+=E}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(p,f,m,x){let M=p!==null?p.length:0,d=null;if(M!==0){if(d=l.value,x!==!0||d===null){let u=m+M*4,E=f.matrixWorldInverse;o.getNormalMatrix(E),(d===null||d.length<u)&&(d=new Float32Array(u));for(let S=0,w=m;S!==M;++S,w+=4)a.copy(p[S]).applyMatrix4(E,o),a.normal.toArray(d,w),d[w+3]=a.constant}l.value=d,l.needsUpdate=!0}return t.numPlanes=M,t.numIntersection=0,d}}function xd(i){let t=new WeakMap;function e(a,o){return o===Mr?a.mapping=si:o===Sr&&(a.mapping=ri),a}function n(a){if(a&&a.isTexture){let o=a.mapping;if(o===Mr||o===Sr)if(t.has(a)){let l=t.get(a).texture;return e(l,a.mapping)}else{let l=a.image;if(l&&l.height>0){let c=new sa(l.height);return c.fromEquirectangularTexture(i,a),t.set(a,c),a.addEventListener("dispose",s),e(c.texture,a.mapping)}else return null}}return a}function s(a){let o=a.target;o.removeEventListener("dispose",s);let l=t.get(o);l!==void 0&&(t.delete(o),l.dispose())}function r(){t=new WeakMap}return{get:n,dispose:r}}var ra=class extends fs{constructor(t=-1,e=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-t,a=n+t,o=s+e,l=s-e;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}},Qn=4,So=[.125,.215,.35,.446,.526,.582],Tn=20,sr=new ra,bo=new It,rr=null,ar=0,or=0,lr=!1,En=(1+Math.sqrt(5))/2,Kn=1/En,Eo=[new L(-En,Kn,0),new L(En,Kn,0),new L(-Kn,0,En),new L(Kn,0,En),new L(0,En,-Kn),new L(0,En,Kn),new L(-1,1,-1),new L(1,1,-1),new L(-1,1,1),new L(1,1,1)],gs=class{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,s=100){rr=this._renderer.getRenderTarget(),ar=this._renderer.getActiveCubeFace(),or=this._renderer.getActiveMipmapLevel(),lr=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);let r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,n,s,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=To(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Ao(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(rr,ar,or),this._renderer.xr.enabled=lr,t.scissorTest=!1,qi(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===si||t.mapping===ri?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),rr=this._renderer.getRenderTarget(),ar=this._renderer.getActiveCubeFace(),or=this._renderer.getActiveMipmapLevel(),lr=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:Ne,minFilter:Ne,generateMipmaps:!1,type:bi,format:Fe,colorSpace:gn,depthBuffer:!1},s=wo(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=wo(t,e,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=vd(r)),this._blurMaterial=yd(r,t,e)}return s}_compileMaterial(t){let e=new be(this._lodPlanes[0],t);this._renderer.compile(e,sr)}_sceneToCubeUV(t,e,n,s){let o=new ue(90,1,e,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],h=this._renderer,p=h.autoClear,f=h.toneMapping;h.getClearColor(bo),h.toneMapping=dn,h.autoClear=!1;let m=new hs({name:"PMREM.Background",side:_e,depthWrite:!1,depthTest:!1}),x=new be(new Dn,m),M=!1,d=t.background;d?d.isColor&&(m.color.copy(d),t.background=null,M=!0):(m.color.copy(bo),M=!0);for(let u=0;u<6;u++){let E=u%3;E===0?(o.up.set(0,l[u],0),o.lookAt(c[u],0,0)):E===1?(o.up.set(0,0,l[u]),o.lookAt(0,c[u],0)):(o.up.set(0,l[u],0),o.lookAt(0,0,c[u]));let S=this._cubeSize;qi(s,E*S,u>2?S:0,S,S),h.setRenderTarget(s),M&&h.render(x,o),h.render(t,o)}x.geometry.dispose(),x.material.dispose(),h.toneMapping=f,h.autoClear=p,t.background=d}_textureToCubeUV(t,e){let n=this._renderer,s=t.mapping===si||t.mapping===ri;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=To()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Ao());let r=s?this._cubemapMaterial:this._equirectMaterial,a=new be(this._lodPlanes[0],r),o=r.uniforms;o.envMap.value=t;let l=this._cubeSize;qi(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(a,sr)}_applyPMREM(t){let e=this._renderer,n=e.autoClear;e.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let a=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),o=Eo[(s-r-1)%Eo.length];this._blur(t,r-1,r,a,o)}e.autoClear=n}_blur(t,e,n,s,r){let a=this._pingPongRenderTarget;this._halfBlur(t,a,e,n,s,"latitudinal",r),this._halfBlur(a,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,a,o){let l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=3,p=new be(this._lodPlanes[s],c),f=c.uniforms,m=this._sizeLods[n]-1,x=isFinite(r)?Math.PI/(2*m):2*Math.PI/(2*Tn-1),M=r/x,d=isFinite(r)?1+Math.floor(h*M):Tn;d>Tn&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${d} samples when the maximum is set to ${Tn}`);let u=[],E=0;for(let A=0;A<Tn;++A){let O=A/M,tt=Math.exp(-O*O/2);u.push(tt),A===0?E+=tt:A<d&&(E+=2*tt)}for(let A=0;A<u.length;A++)u[A]=u[A]/E;f.envMap.value=t.texture,f.samples.value=d,f.weights.value=u,f.latitudinal.value=a==="latitudinal",o&&(f.poleAxis.value=o);let{_lodMax:S}=this;f.dTheta.value=x,f.mipInt.value=S-n;let w=this._sizeLods[s],F=3*w*(s>S-Qn?s-S+Qn:0),R=4*(this._cubeSize-w);qi(e,F,R,3*w,2*w),l.setRenderTarget(e),l.render(p,sr)}};function vd(i){let t=[],e=[],n=[],s=i,r=i-Qn+1+So.length;for(let a=0;a<r;a++){let o=Math.pow(2,s);e.push(o);let l=1/o;a>i-Qn?l=So[a-i+Qn-1]:a===0&&(l=0),n.push(l);let c=1/(o-2),h=-c,p=1+c,f=[h,h,p,h,p,p,h,h,p,p,h,p],m=6,x=6,M=3,d=2,u=1,E=new Float32Array(M*x*m),S=new Float32Array(d*x*m),w=new Float32Array(u*x*m);for(let R=0;R<m;R++){let A=R%3*2/3-1,O=R>2?0:-1,tt=[A,O,0,A+2/3,O,0,A+2/3,O+1,0,A,O,0,A+2/3,O+1,0,A,O+1,0];E.set(tt,M*x*R),S.set(f,d*x*R);let g=[R,R,R,R,R,R];w.set(g,u*x*R)}let F=new Un;F.setAttribute("position",new Ce(E,M)),F.setAttribute("uv",new Ce(S,d)),F.setAttribute("faceIndex",new Ce(w,u)),t.push(F),s>Qn&&s--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function wo(i,t,e){let n=new tn(i,t,e);return n.texture.mapping=As,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function qi(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function yd(i,t,e){let n=new Float32Array(Tn),s=new L(0,1,0);return new ke({name:"SphericalGaussianBlur",defines:{n:Tn,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Oa(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:un,depthTest:!1,depthWrite:!1})}function Ao(){return new ke({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Oa(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:un,depthTest:!1,depthWrite:!1})}function To(){return new ke({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Oa(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:un,depthTest:!1,depthWrite:!1})}function Oa(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Md(i){let t=new WeakMap,e=null;function n(o){if(o&&o.isTexture){let l=o.mapping,c=l===Mr||l===Sr,h=l===si||l===ri;if(c||h){let p=t.get(o),f=p!==void 0?p.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==f)return e===null&&(e=new gs(i)),p=c?e.fromEquirectangular(o,p):e.fromCubemap(o,p),p.texture.pmremVersion=o.pmremVersion,t.set(o,p),p.texture;if(p!==void 0)return p.texture;{let m=o.image;return c&&m&&m.height>0||h&&m&&s(m)?(e===null&&(e=new gs(i)),p=c?e.fromEquirectangular(o):e.fromCubemap(o),p.texture.pmremVersion=o.pmremVersion,t.set(o,p),o.addEventListener("dispose",r),p.texture):null}}}return o}function s(o){let l=0,c=6;for(let h=0;h<c;h++)o[h]!==void 0&&l++;return l===c}function r(o){let l=o.target;l.removeEventListener("dispose",r);let c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function a(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:a}}function Sd(i){let t={};function e(n){if(t[n]!==void 0)return t[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){let s=e(n);return s===null&&ts("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function bd(i,t,e,n){let s={},r=new WeakMap;function a(p){let f=p.target;f.index!==null&&t.remove(f.index);for(let x in f.attributes)t.remove(f.attributes[x]);for(let x in f.morphAttributes){let M=f.morphAttributes[x];for(let d=0,u=M.length;d<u;d++)t.remove(M[d])}f.removeEventListener("dispose",a),delete s[f.id];let m=r.get(f);m&&(t.remove(m),r.delete(f)),n.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,e.memory.geometries--}function o(p,f){return s[f.id]===!0||(f.addEventListener("dispose",a),s[f.id]=!0,e.memory.geometries++),f}function l(p){let f=p.attributes;for(let x in f)t.update(f[x],i.ARRAY_BUFFER);let m=p.morphAttributes;for(let x in m){let M=m[x];for(let d=0,u=M.length;d<u;d++)t.update(M[d],i.ARRAY_BUFFER)}}function c(p){let f=[],m=p.index,x=p.attributes.position,M=0;if(m!==null){let E=m.array;M=m.version;for(let S=0,w=E.length;S<w;S+=3){let F=E[S+0],R=E[S+1],A=E[S+2];f.push(F,R,R,A,A,F)}}else if(x!==void 0){let E=x.array;M=x.version;for(let S=0,w=E.length/3-1;S<w;S+=3){let F=S+0,R=S+1,A=S+2;f.push(F,R,R,A,A,F)}}else return;let d=new(cl(f)?ds:us)(f,1);d.version=M;let u=r.get(p);u&&t.remove(u),r.set(p,d)}function h(p){let f=r.get(p);if(f){let m=p.index;m!==null&&f.version<m.version&&c(p)}else c(p);return r.get(p)}return{get:o,update:l,getWireframeAttribute:h}}function Ed(i,t,e){let n;function s(f){n=f}let r,a;function o(f){r=f.type,a=f.bytesPerElement}function l(f,m){i.drawElements(n,m,r,f*a),e.update(m,n,1)}function c(f,m,x){x!==0&&(i.drawElementsInstanced(n,m,r,f*a,x),e.update(m,n,x))}function h(f,m,x){if(x===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,m,0,r,f,0,x);let d=0;for(let u=0;u<x;u++)d+=m[u];e.update(d,n,1)}function p(f,m,x,M){if(x===0)return;let d=t.get("WEBGL_multi_draw");if(d===null)for(let u=0;u<f.length;u++)c(f[u]/a,m[u],M[u]);else{d.multiDrawElementsInstancedWEBGL(n,m,0,r,f,0,M,0,x);let u=0;for(let E=0;E<x;E++)u+=m[E];for(let E=0;E<M.length;E++)e.update(u,n,M[E])}}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=p}function wd(i){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(e.calls++,a){case i.TRIANGLES:e.triangles+=o*(r/3);break;case i.LINES:e.lines+=o*(r/2);break;case i.LINE_STRIP:e.lines+=o*(r-1);break;case i.LINE_LOOP:e.lines+=o*r;break;case i.POINTS:e.points+=o*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function Ad(i,t,e){let n=new WeakMap,s=new Zt;function r(a,o,l){let c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,p=h!==void 0?h.length:0,f=n.get(o);if(f===void 0||f.count!==p){let tt=function(){A.dispose(),n.delete(o),o.removeEventListener("dispose",tt)};f!==void 0&&f.texture.dispose();let m=o.morphAttributes.position!==void 0,x=o.morphAttributes.normal!==void 0,M=o.morphAttributes.color!==void 0,d=o.morphAttributes.position||[],u=o.morphAttributes.normal||[],E=o.morphAttributes.color||[],S=0;m===!0&&(S=1),x===!0&&(S=2),M===!0&&(S=3);let w=o.attributes.position.count*S,F=1;w>t.maxTextureSize&&(F=Math.ceil(w/t.maxTextureSize),w=t.maxTextureSize);let R=new Float32Array(w*F*4*p),A=new ls(R,w,F,p);A.type=$e,A.needsUpdate=!0;let O=S*4;for(let g=0;g<p;g++){let y=d[g],H=u[g],z=E[g],G=w*F*4*g;for(let J=0;J<y.count;J++){let B=J*O;m===!0&&(s.fromBufferAttribute(y,J),R[G+B+0]=s.x,R[G+B+1]=s.y,R[G+B+2]=s.z,R[G+B+3]=0),x===!0&&(s.fromBufferAttribute(H,J),R[G+B+4]=s.x,R[G+B+5]=s.y,R[G+B+6]=s.z,R[G+B+7]=0),M===!0&&(s.fromBufferAttribute(z,J),R[G+B+8]=s.x,R[G+B+9]=s.y,R[G+B+10]=s.z,R[G+B+11]=z.itemSize===4?s.w:1)}}f={count:p,texture:A,size:new Vt(w,F)},n.set(o,f),o.addEventListener("dispose",tt)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,e);else{let m=0;for(let M=0;M<c.length;M++)m+=c[M];let x=o.morphTargetsRelative?1:1-m;l.getUniforms().setValue(i,"morphTargetBaseInfluence",x),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",f.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",f.size)}return{update:r}}function Td(i,t,e,n){let s=new WeakMap;function r(l){let c=n.render.frame,h=l.geometry,p=t.get(l,h);if(s.get(p)!==c&&(t.update(p),s.set(p,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),s.get(l)!==c&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){let f=l.skeleton;s.get(f)!==c&&(f.update(),s.set(f,c))}return p}function a(){s=new WeakMap}function o(l){let c=l.target;c.removeEventListener("dispose",o),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:r,dispose:a}}var _s=class extends Ee{constructor(t,e,n,s,r,a,o,l,c,h=ti){if(h!==ti&&h!==oi)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===ti&&(n=Pn),n===void 0&&h===oi&&(n=ai),super(null,s,r,a,o,l,h,n,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=o!==void 0?o:Re,this.minFilter=l!==void 0?l:Re,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}},fl=new Ee,Ro=new _s(1,1),pl=new ls,ml=new ea,gl=new ps,Co=[],Po=[],Io=new Float32Array(16),Lo=new Float32Array(9),Uo=new Float32Array(4);function hi(i,t,e){let n=i[0];if(n<=0||n>0)return i;let s=t*e,r=Co[s];if(r===void 0&&(r=new Float32Array(s),Co[s]=r),t!==0){n.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,i[a].toArray(r,o)}return r}function re(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function ae(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function Rs(i,t){let e=Po[t];e===void 0&&(e=new Int32Array(t),Po[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function Rd(i,t){let e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function Cd(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(re(e,t))return;i.uniform2fv(this.addr,t),ae(e,t)}}function Pd(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(re(e,t))return;i.uniform3fv(this.addr,t),ae(e,t)}}function Id(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(re(e,t))return;i.uniform4fv(this.addr,t),ae(e,t)}}function Ld(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(re(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),ae(e,t)}else{if(re(e,n))return;Uo.set(n),i.uniformMatrix2fv(this.addr,!1,Uo),ae(e,n)}}function Ud(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(re(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),ae(e,t)}else{if(re(e,n))return;Lo.set(n),i.uniformMatrix3fv(this.addr,!1,Lo),ae(e,n)}}function Dd(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(re(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),ae(e,t)}else{if(re(e,n))return;Io.set(n),i.uniformMatrix4fv(this.addr,!1,Io),ae(e,n)}}function Nd(i,t){let e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function Fd(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(re(e,t))return;i.uniform2iv(this.addr,t),ae(e,t)}}function Od(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(re(e,t))return;i.uniform3iv(this.addr,t),ae(e,t)}}function Bd(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(re(e,t))return;i.uniform4iv(this.addr,t),ae(e,t)}}function zd(i,t){let e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function kd(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(re(e,t))return;i.uniform2uiv(this.addr,t),ae(e,t)}}function Vd(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(re(e,t))return;i.uniform3uiv(this.addr,t),ae(e,t)}}function Hd(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(re(e,t))return;i.uniform4uiv(this.addr,t),ae(e,t)}}function Gd(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(Ro.compareFunction=ll,r=Ro):r=fl,e.setTexture2D(t||r,s)}function Wd(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||ml,s)}function Xd(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||gl,s)}function qd(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||pl,s)}function Yd(i){switch(i){case 5126:return Rd;case 35664:return Cd;case 35665:return Pd;case 35666:return Id;case 35674:return Ld;case 35675:return Ud;case 35676:return Dd;case 5124:case 35670:return Nd;case 35667:case 35671:return Fd;case 35668:case 35672:return Od;case 35669:case 35673:return Bd;case 5125:return zd;case 36294:return kd;case 36295:return Vd;case 36296:return Hd;case 35678:case 36198:case 36298:case 36306:case 35682:return Gd;case 35679:case 36299:case 36307:return Wd;case 35680:case 36300:case 36308:case 36293:return Xd;case 36289:case 36303:case 36311:case 36292:return qd}}function Zd(i,t){i.uniform1fv(this.addr,t)}function Jd(i,t){let e=hi(t,this.size,2);i.uniform2fv(this.addr,e)}function $d(i,t){let e=hi(t,this.size,3);i.uniform3fv(this.addr,e)}function Kd(i,t){let e=hi(t,this.size,4);i.uniform4fv(this.addr,e)}function Qd(i,t){let e=hi(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function jd(i,t){let e=hi(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function tf(i,t){let e=hi(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function ef(i,t){i.uniform1iv(this.addr,t)}function nf(i,t){i.uniform2iv(this.addr,t)}function sf(i,t){i.uniform3iv(this.addr,t)}function rf(i,t){i.uniform4iv(this.addr,t)}function af(i,t){i.uniform1uiv(this.addr,t)}function of(i,t){i.uniform2uiv(this.addr,t)}function lf(i,t){i.uniform3uiv(this.addr,t)}function cf(i,t){i.uniform4uiv(this.addr,t)}function hf(i,t,e){let n=this.cache,s=t.length,r=Rs(e,s);re(n,r)||(i.uniform1iv(this.addr,r),ae(n,r));for(let a=0;a!==s;++a)e.setTexture2D(t[a]||fl,r[a])}function uf(i,t,e){let n=this.cache,s=t.length,r=Rs(e,s);re(n,r)||(i.uniform1iv(this.addr,r),ae(n,r));for(let a=0;a!==s;++a)e.setTexture3D(t[a]||ml,r[a])}function df(i,t,e){let n=this.cache,s=t.length,r=Rs(e,s);re(n,r)||(i.uniform1iv(this.addr,r),ae(n,r));for(let a=0;a!==s;++a)e.setTextureCube(t[a]||gl,r[a])}function ff(i,t,e){let n=this.cache,s=t.length,r=Rs(e,s);re(n,r)||(i.uniform1iv(this.addr,r),ae(n,r));for(let a=0;a!==s;++a)e.setTexture2DArray(t[a]||pl,r[a])}function pf(i){switch(i){case 5126:return Zd;case 35664:return Jd;case 35665:return $d;case 35666:return Kd;case 35674:return Qd;case 35675:return jd;case 35676:return tf;case 5124:case 35670:return ef;case 35667:case 35671:return nf;case 35668:case 35672:return sf;case 35669:case 35673:return rf;case 5125:return af;case 36294:return of;case 36295:return lf;case 36296:return cf;case 35678:case 36198:case 36298:case 36306:case 35682:return hf;case 35679:case 36299:case 36307:return uf;case 35680:case 36300:case 36308:case 36293:return df;case 36289:case 36303:case 36311:case 36292:return ff}}var aa=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=Yd(e.type)}},oa=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=pf(e.type)}},la=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(t,e[o.id],n)}}},cr=/(\w+)(\])?(\[|\.)?/g;function Do(i,t){i.seq.push(t),i.map[t.id]=t}function mf(i,t,e){let n=i.name,s=n.length;for(cr.lastIndex=0;;){let r=cr.exec(n),a=cr.lastIndex,o=r[1],l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===s){Do(e,c===void 0?new aa(o,i,t):new oa(o,i,t));break}else{let p=e.map[o];p===void 0&&(p=new la(o),Do(e,p)),e=p}}}var ni=class{constructor(t,e){this.seq=[],this.map={};let n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){let r=t.getActiveUniform(e,s),a=t.getUniformLocation(e,r.name);mf(r,a,this)}}setValue(t,e,n,s){let r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){let s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,a=e.length;r!==a;++r){let o=e[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,s)}}static seqWithValue(t,e){let n=[];for(let s=0,r=t.length;s!==r;++s){let a=t[s];a.id in e&&n.push(a)}return n}};function No(i,t,e){let n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}var gf=37297,_f=0;function xf(i,t){let e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=s;a<r;a++){let o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}function vf(i){let t=Wt.getPrimaries(Wt.workingColorSpace),e=Wt.getPrimaries(i),n;switch(t===e?n="":t===ss&&e===is?n="LinearDisplayP3ToLinearSRGB":t===is&&e===ss&&(n="LinearSRGBToLinearDisplayP3"),i){case gn:case Ts:return[n,"LinearTransferOETF"];case Te:case Fa:return[n,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",i),[n,"LinearTransferOETF"]}}function Fo(i,t,e){let n=i.getShaderParameter(t,i.COMPILE_STATUS),s=i.getShaderInfoLog(t).trim();if(n&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let a=parseInt(r[1]);return e.toUpperCase()+`

`+s+`

`+xf(i.getShaderSource(t),a)}else return s}function yf(i,t){let e=vf(t);return`vec4 ${i}( vec4 value ) { return ${e[0]}( ${e[1]}( value ) ); }`}function Mf(i,t){let e;switch(t){case Wl:e="Linear";break;case Xl:e="Reinhard";break;case ql:e="Cineon";break;case Yl:e="ACESFilmic";break;case Jl:e="AgX";break;case $l:e="Neutral";break;case Zl:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}var Yi=new L;function Sf(){Wt.getLuminanceCoefficients(Yi);let i=Yi.x.toFixed(4),t=Yi.y.toFixed(4),e=Yi.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function bf(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(xi).join(`
`)}function Ef(i){let t=[];for(let e in i){let n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function wf(i,t){let e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(t,s),a=r.name,o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:i.getAttribLocation(t,a),locationSize:o}}return e}function xi(i){return i!==""}function Oo(i,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Bo(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var Af=/^[ \t]*#include +<([\w\d./]+)>/gm;function ca(i){return i.replace(Af,Rf)}var Tf=new Map;function Rf(i,t){let e=Ct[t];if(e===void 0){let n=Tf.get(t);if(n!==void 0)e=Ct[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return ca(e)}var Cf=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function zo(i){return i.replace(Cf,Pf)}function Pf(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function ko(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function If(i){let t="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===Zo?t="SHADOWMAP_TYPE_PCF":i.shadowMapType===bl?t="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===Ye&&(t="SHADOWMAP_TYPE_VSM"),t}function Lf(i){let t="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case si:case ri:t="ENVMAP_TYPE_CUBE";break;case As:t="ENVMAP_TYPE_CUBE_UV";break}return t}function Uf(i){let t="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case ri:t="ENVMAP_MODE_REFRACTION";break}return t}function Df(i){let t="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case Jo:t="ENVMAP_BLENDING_MULTIPLY";break;case Hl:t="ENVMAP_BLENDING_MIX";break;case Gl:t="ENVMAP_BLENDING_ADD";break}return t}function Nf(i){let t=i.envMapCubeUVHeight;if(t===null)return null;let e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:n,maxMip:e}}function Ff(i,t,e,n){let s=i.getContext(),r=e.defines,a=e.vertexShader,o=e.fragmentShader,l=If(e),c=Lf(e),h=Uf(e),p=Df(e),f=Nf(e),m=bf(e),x=Ef(r),M=s.createProgram(),d,u,E=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(d=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,x].filter(xi).join(`
`),d.length>0&&(d+=`
`),u=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,x].filter(xi).join(`
`),u.length>0&&(u+=`
`)):(d=[ko(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,x,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(xi).join(`
`),u=[ko(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,x,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+p:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==dn?"#define TONE_MAPPING":"",e.toneMapping!==dn?Ct.tonemapping_pars_fragment:"",e.toneMapping!==dn?Mf("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Ct.colorspace_pars_fragment,yf("linearToOutputTexel",e.outputColorSpace),Sf(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(xi).join(`
`)),a=ca(a),a=Oo(a,e),a=Bo(a,e),o=ca(o),o=Oo(o,e),o=Bo(o,e),a=zo(a),o=zo(o),e.isRawShaderMaterial!==!0&&(E=`#version 300 es
`,d=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+d,u=["#define varying in",e.glslVersion===io?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===io?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+u);let S=E+d+a,w=E+u+o,F=No(s,s.VERTEX_SHADER,S),R=No(s,s.FRAGMENT_SHADER,w);s.attachShader(M,F),s.attachShader(M,R),e.index0AttributeName!==void 0?s.bindAttribLocation(M,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(M,0,"position"),s.linkProgram(M);function A(y){if(i.debug.checkShaderErrors){let H=s.getProgramInfoLog(M).trim(),z=s.getShaderInfoLog(F).trim(),G=s.getShaderInfoLog(R).trim(),J=!0,B=!0;if(s.getProgramParameter(M,s.LINK_STATUS)===!1)if(J=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,M,F,R);else{let Q=Fo(s,F,"vertex"),V=Fo(s,R,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(M,s.VALIDATE_STATUS)+`

Material Name: `+y.name+`
Material Type: `+y.type+`

Program Info Log: `+H+`
`+Q+`
`+V)}else H!==""?console.warn("THREE.WebGLProgram: Program Info Log:",H):(z===""||G==="")&&(B=!1);B&&(y.diagnostics={runnable:J,programLog:H,vertexShader:{log:z,prefix:d},fragmentShader:{log:G,prefix:u}})}s.deleteShader(F),s.deleteShader(R),O=new ni(s,M),tt=wf(s,M)}let O;this.getUniforms=function(){return O===void 0&&A(this),O};let tt;this.getAttributes=function(){return tt===void 0&&A(this),tt};let g=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return g===!1&&(g=s.getProgramParameter(M,gf)),g},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(M),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=_f++,this.cacheKey=t,this.usedTimes=1,this.program=M,this.vertexShader=F,this.fragmentShader=R,this}var Of=0,ha=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){let e=t.vertexShader,n=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(n),a=this._getShaderCacheForMaterial(t);return a.has(s)===!1&&(a.add(s),s.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){let e=this.shaderCache,n=e.get(t);return n===void 0&&(n=new ua(t),e.set(t,n)),n}},ua=class{constructor(t){this.id=Of++,this.code=t,this.usedTimes=0}};function Bf(i,t,e,n,s,r,a){let o=new cs,l=new ha,c=new Set,h=[],p=s.logarithmicDepthBuffer,f=s.reverseDepthBuffer,m=s.vertexTextures,x=s.precision,M={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function d(g){return c.add(g),g===0?"uv":`uv${g}`}function u(g,y,H,z,G){let J=z.fog,B=G.geometry,Q=g.isMeshStandardMaterial?z.environment:null,V=(g.isMeshStandardMaterial?e:t).get(g.envMap||Q),ot=V&&V.mapping===As?V.image.height:null,lt=M[g.type];g.precision!==null&&(x=s.getMaxPrecision(g.precision),x!==g.precision&&console.warn("THREE.WebGLProgram.getParameters:",g.precision,"not supported, using",x,"instead."));let gt=B.morphAttributes.position||B.morphAttributes.normal||B.morphAttributes.color,zt=gt!==void 0?gt.length:0,Xt=0;B.morphAttributes.position!==void 0&&(Xt=1),B.morphAttributes.normal!==void 0&&(Xt=2),B.morphAttributes.color!==void 0&&(Xt=3);let W,$,pt,ct;if(lt){let pe=Be[lt];W=pe.vertexShader,$=pe.fragmentShader}else W=g.vertexShader,$=g.fragmentShader,l.update(g),pt=l.getVertexShaderID(g),ct=l.getFragmentShaderID(g);let Tt=i.getRenderTarget(),Mt=G.isInstancedMesh===!0,Dt=G.isBatchedMesh===!0,Yt=!!g.map,Nt=!!g.matcap,T=!!V,xe=!!g.aoMap,Lt=!!g.lightMap,Ot=!!g.bumpMap,bt=!!g.normalMap,$t=!!g.displacementMap,At=!!g.emissiveMap,b=!!g.metalnessMap,_=!!g.roughnessMap,U=g.anisotropy>0,q=g.clearcoat>0,Z=g.dispersion>0,X=g.iridescence>0,_t=g.sheen>0,nt=g.transmission>0,ht=U&&!!g.anisotropyMap,Bt=q&&!!g.clearcoatMap,K=q&&!!g.clearcoatNormalMap,ut=q&&!!g.clearcoatRoughnessMap,Et=X&&!!g.iridescenceMap,wt=X&&!!g.iridescenceThicknessMap,dt=_t&&!!g.sheenColorMap,Ut=_t&&!!g.sheenRoughnessMap,Rt=!!g.specularMap,Jt=!!g.specularColorMap,C=!!g.specularIntensityMap,rt=nt&&!!g.transmissionMap,k=nt&&!!g.thicknessMap,Y=!!g.gradientMap,it=!!g.alphaMap,at=g.alphaTest>0,Ft=!!g.alphaHash,ie=!!g.extensions,fe=dn;g.toneMapped&&(Tt===null||Tt.isXRRenderTarget===!0)&&(fe=i.toneMapping);let kt={shaderID:lt,shaderType:g.type,shaderName:g.name,vertexShader:W,fragmentShader:$,defines:g.defines,customVertexShaderID:pt,customFragmentShaderID:ct,isRawShaderMaterial:g.isRawShaderMaterial===!0,glslVersion:g.glslVersion,precision:x,batching:Dt,batchingColor:Dt&&G._colorsTexture!==null,instancing:Mt,instancingColor:Mt&&G.instanceColor!==null,instancingMorph:Mt&&G.morphTexture!==null,supportsVertexTextures:m,outputColorSpace:Tt===null?i.outputColorSpace:Tt.isXRRenderTarget===!0?Tt.texture.colorSpace:gn,alphaToCoverage:!!g.alphaToCoverage,map:Yt,matcap:Nt,envMap:T,envMapMode:T&&V.mapping,envMapCubeUVHeight:ot,aoMap:xe,lightMap:Lt,bumpMap:Ot,normalMap:bt,displacementMap:m&&$t,emissiveMap:At,normalMapObjectSpace:bt&&g.normalMapType===tc,normalMapTangentSpace:bt&&g.normalMapType===ol,metalnessMap:b,roughnessMap:_,anisotropy:U,anisotropyMap:ht,clearcoat:q,clearcoatMap:Bt,clearcoatNormalMap:K,clearcoatRoughnessMap:ut,dispersion:Z,iridescence:X,iridescenceMap:Et,iridescenceThicknessMap:wt,sheen:_t,sheenColorMap:dt,sheenRoughnessMap:Ut,specularMap:Rt,specularColorMap:Jt,specularIntensityMap:C,transmission:nt,transmissionMap:rt,thicknessMap:k,gradientMap:Y,opaque:g.transparent===!1&&g.blending===jn&&g.alphaToCoverage===!1,alphaMap:it,alphaTest:at,alphaHash:Ft,combine:g.combine,mapUv:Yt&&d(g.map.channel),aoMapUv:xe&&d(g.aoMap.channel),lightMapUv:Lt&&d(g.lightMap.channel),bumpMapUv:Ot&&d(g.bumpMap.channel),normalMapUv:bt&&d(g.normalMap.channel),displacementMapUv:$t&&d(g.displacementMap.channel),emissiveMapUv:At&&d(g.emissiveMap.channel),metalnessMapUv:b&&d(g.metalnessMap.channel),roughnessMapUv:_&&d(g.roughnessMap.channel),anisotropyMapUv:ht&&d(g.anisotropyMap.channel),clearcoatMapUv:Bt&&d(g.clearcoatMap.channel),clearcoatNormalMapUv:K&&d(g.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ut&&d(g.clearcoatRoughnessMap.channel),iridescenceMapUv:Et&&d(g.iridescenceMap.channel),iridescenceThicknessMapUv:wt&&d(g.iridescenceThicknessMap.channel),sheenColorMapUv:dt&&d(g.sheenColorMap.channel),sheenRoughnessMapUv:Ut&&d(g.sheenRoughnessMap.channel),specularMapUv:Rt&&d(g.specularMap.channel),specularColorMapUv:Jt&&d(g.specularColorMap.channel),specularIntensityMapUv:C&&d(g.specularIntensityMap.channel),transmissionMapUv:rt&&d(g.transmissionMap.channel),thicknessMapUv:k&&d(g.thicknessMap.channel),alphaMapUv:it&&d(g.alphaMap.channel),vertexTangents:!!B.attributes.tangent&&(bt||U),vertexColors:g.vertexColors,vertexAlphas:g.vertexColors===!0&&!!B.attributes.color&&B.attributes.color.itemSize===4,pointsUvs:G.isPoints===!0&&!!B.attributes.uv&&(Yt||it),fog:!!J,useFog:g.fog===!0,fogExp2:!!J&&J.isFogExp2,flatShading:g.flatShading===!0,sizeAttenuation:g.sizeAttenuation===!0,logarithmicDepthBuffer:p,reverseDepthBuffer:f,skinning:G.isSkinnedMesh===!0,morphTargets:B.morphAttributes.position!==void 0,morphNormals:B.morphAttributes.normal!==void 0,morphColors:B.morphAttributes.color!==void 0,morphTargetsCount:zt,morphTextureStride:Xt,numDirLights:y.directional.length,numPointLights:y.point.length,numSpotLights:y.spot.length,numSpotLightMaps:y.spotLightMap.length,numRectAreaLights:y.rectArea.length,numHemiLights:y.hemi.length,numDirLightShadows:y.directionalShadowMap.length,numPointLightShadows:y.pointShadowMap.length,numSpotLightShadows:y.spotShadowMap.length,numSpotLightShadowsWithMaps:y.numSpotLightShadowsWithMaps,numLightProbes:y.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:g.dithering,shadowMapEnabled:i.shadowMap.enabled&&H.length>0,shadowMapType:i.shadowMap.type,toneMapping:fe,decodeVideoTexture:Yt&&g.map.isVideoTexture===!0&&Wt.getTransfer(g.map.colorSpace)===Qt,premultipliedAlpha:g.premultipliedAlpha,doubleSided:g.side===Je,flipSided:g.side===_e,useDepthPacking:g.depthPacking>=0,depthPacking:g.depthPacking||0,index0AttributeName:g.index0AttributeName,extensionClipCullDistance:ie&&g.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ie&&g.extensions.multiDraw===!0||Dt)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:g.customProgramCacheKey()};return kt.vertexUv1s=c.has(1),kt.vertexUv2s=c.has(2),kt.vertexUv3s=c.has(3),c.clear(),kt}function E(g){let y=[];if(g.shaderID?y.push(g.shaderID):(y.push(g.customVertexShaderID),y.push(g.customFragmentShaderID)),g.defines!==void 0)for(let H in g.defines)y.push(H),y.push(g.defines[H]);return g.isRawShaderMaterial===!1&&(S(y,g),w(y,g),y.push(i.outputColorSpace)),y.push(g.customProgramCacheKey),y.join()}function S(g,y){g.push(y.precision),g.push(y.outputColorSpace),g.push(y.envMapMode),g.push(y.envMapCubeUVHeight),g.push(y.mapUv),g.push(y.alphaMapUv),g.push(y.lightMapUv),g.push(y.aoMapUv),g.push(y.bumpMapUv),g.push(y.normalMapUv),g.push(y.displacementMapUv),g.push(y.emissiveMapUv),g.push(y.metalnessMapUv),g.push(y.roughnessMapUv),g.push(y.anisotropyMapUv),g.push(y.clearcoatMapUv),g.push(y.clearcoatNormalMapUv),g.push(y.clearcoatRoughnessMapUv),g.push(y.iridescenceMapUv),g.push(y.iridescenceThicknessMapUv),g.push(y.sheenColorMapUv),g.push(y.sheenRoughnessMapUv),g.push(y.specularMapUv),g.push(y.specularColorMapUv),g.push(y.specularIntensityMapUv),g.push(y.transmissionMapUv),g.push(y.thicknessMapUv),g.push(y.combine),g.push(y.fogExp2),g.push(y.sizeAttenuation),g.push(y.morphTargetsCount),g.push(y.morphAttributeCount),g.push(y.numDirLights),g.push(y.numPointLights),g.push(y.numSpotLights),g.push(y.numSpotLightMaps),g.push(y.numHemiLights),g.push(y.numRectAreaLights),g.push(y.numDirLightShadows),g.push(y.numPointLightShadows),g.push(y.numSpotLightShadows),g.push(y.numSpotLightShadowsWithMaps),g.push(y.numLightProbes),g.push(y.shadowMapType),g.push(y.toneMapping),g.push(y.numClippingPlanes),g.push(y.numClipIntersection),g.push(y.depthPacking)}function w(g,y){o.disableAll(),y.supportsVertexTextures&&o.enable(0),y.instancing&&o.enable(1),y.instancingColor&&o.enable(2),y.instancingMorph&&o.enable(3),y.matcap&&o.enable(4),y.envMap&&o.enable(5),y.normalMapObjectSpace&&o.enable(6),y.normalMapTangentSpace&&o.enable(7),y.clearcoat&&o.enable(8),y.iridescence&&o.enable(9),y.alphaTest&&o.enable(10),y.vertexColors&&o.enable(11),y.vertexAlphas&&o.enable(12),y.vertexUv1s&&o.enable(13),y.vertexUv2s&&o.enable(14),y.vertexUv3s&&o.enable(15),y.vertexTangents&&o.enable(16),y.anisotropy&&o.enable(17),y.alphaHash&&o.enable(18),y.batching&&o.enable(19),y.dispersion&&o.enable(20),y.batchingColor&&o.enable(21),g.push(o.mask),o.disableAll(),y.fog&&o.enable(0),y.useFog&&o.enable(1),y.flatShading&&o.enable(2),y.logarithmicDepthBuffer&&o.enable(3),y.reverseDepthBuffer&&o.enable(4),y.skinning&&o.enable(5),y.morphTargets&&o.enable(6),y.morphNormals&&o.enable(7),y.morphColors&&o.enable(8),y.premultipliedAlpha&&o.enable(9),y.shadowMapEnabled&&o.enable(10),y.doubleSided&&o.enable(11),y.flipSided&&o.enable(12),y.useDepthPacking&&o.enable(13),y.dithering&&o.enable(14),y.transmission&&o.enable(15),y.sheen&&o.enable(16),y.opaque&&o.enable(17),y.pointsUvs&&o.enable(18),y.decodeVideoTexture&&o.enable(19),y.alphaToCoverage&&o.enable(20),g.push(o.mask)}function F(g){let y=M[g.type],H;if(y){let z=Be[y];H=Tc.clone(z.uniforms)}else H=g.uniforms;return H}function R(g,y){let H;for(let z=0,G=h.length;z<G;z++){let J=h[z];if(J.cacheKey===y){H=J,++H.usedTimes;break}}return H===void 0&&(H=new Ff(i,y,g,r),h.push(H)),H}function A(g){if(--g.usedTimes===0){let y=h.indexOf(g);h[y]=h[h.length-1],h.pop(),g.destroy()}}function O(g){l.remove(g)}function tt(){l.dispose()}return{getParameters:u,getProgramCacheKey:E,getUniforms:F,acquireProgram:R,releaseProgram:A,releaseShaderCache:O,programs:h,dispose:tt}}function zf(){let i=new WeakMap;function t(a){return i.has(a)}function e(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,l){i.get(a)[o]=l}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function kf(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.z!==t.z?i.z-t.z:i.id-t.id}function Vo(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function Ho(){let i=[],t=0,e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function a(p,f,m,x,M,d){let u=i[t];return u===void 0?(u={id:p.id,object:p,geometry:f,material:m,groupOrder:x,renderOrder:p.renderOrder,z:M,group:d},i[t]=u):(u.id=p.id,u.object=p,u.geometry=f,u.material=m,u.groupOrder=x,u.renderOrder=p.renderOrder,u.z=M,u.group=d),t++,u}function o(p,f,m,x,M,d){let u=a(p,f,m,x,M,d);m.transmission>0?n.push(u):m.transparent===!0?s.push(u):e.push(u)}function l(p,f,m,x,M,d){let u=a(p,f,m,x,M,d);m.transmission>0?n.unshift(u):m.transparent===!0?s.unshift(u):e.unshift(u)}function c(p,f){e.length>1&&e.sort(p||kf),n.length>1&&n.sort(f||Vo),s.length>1&&s.sort(f||Vo)}function h(){for(let p=t,f=i.length;p<f;p++){let m=i[p];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:o,unshift:l,finish:h,sort:c}}function Vf(){let i=new WeakMap;function t(n,s){let r=i.get(n),a;return r===void 0?(a=new Ho,i.set(n,[a])):s>=r.length?(a=new Ho,r.push(a)):a=r[s],a}function e(){i=new WeakMap}return{get:t,dispose:e}}function Hf(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new L,color:new It};break;case"SpotLight":e={position:new L,direction:new L,color:new It,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new L,color:new It,distance:0,decay:0};break;case"HemisphereLight":e={direction:new L,skyColor:new It,groundColor:new It};break;case"RectAreaLight":e={color:new It,position:new L,halfWidth:new L,halfHeight:new L};break}return i[t.id]=e,e}}}function Gf(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Vt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Vt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Vt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}var Wf=0;function Xf(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function qf(i){let t=new Hf,e=Gf(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new L);let s=new L,r=new ee,a=new ee;function o(c){let h=0,p=0,f=0;for(let tt=0;tt<9;tt++)n.probe[tt].set(0,0,0);let m=0,x=0,M=0,d=0,u=0,E=0,S=0,w=0,F=0,R=0,A=0;c.sort(Xf);for(let tt=0,g=c.length;tt<g;tt++){let y=c[tt],H=y.color,z=y.intensity,G=y.distance,J=y.shadow&&y.shadow.map?y.shadow.map.texture:null;if(y.isAmbientLight)h+=H.r*z,p+=H.g*z,f+=H.b*z;else if(y.isLightProbe){for(let B=0;B<9;B++)n.probe[B].addScaledVector(y.sh.coefficients[B],z);A++}else if(y.isDirectionalLight){let B=t.get(y);if(B.color.copy(y.color).multiplyScalar(y.intensity),y.castShadow){let Q=y.shadow,V=e.get(y);V.shadowIntensity=Q.intensity,V.shadowBias=Q.bias,V.shadowNormalBias=Q.normalBias,V.shadowRadius=Q.radius,V.shadowMapSize=Q.mapSize,n.directionalShadow[m]=V,n.directionalShadowMap[m]=J,n.directionalShadowMatrix[m]=y.shadow.matrix,E++}n.directional[m]=B,m++}else if(y.isSpotLight){let B=t.get(y);B.position.setFromMatrixPosition(y.matrixWorld),B.color.copy(H).multiplyScalar(z),B.distance=G,B.coneCos=Math.cos(y.angle),B.penumbraCos=Math.cos(y.angle*(1-y.penumbra)),B.decay=y.decay,n.spot[M]=B;let Q=y.shadow;if(y.map&&(n.spotLightMap[F]=y.map,F++,Q.updateMatrices(y),y.castShadow&&R++),n.spotLightMatrix[M]=Q.matrix,y.castShadow){let V=e.get(y);V.shadowIntensity=Q.intensity,V.shadowBias=Q.bias,V.shadowNormalBias=Q.normalBias,V.shadowRadius=Q.radius,V.shadowMapSize=Q.mapSize,n.spotShadow[M]=V,n.spotShadowMap[M]=J,w++}M++}else if(y.isRectAreaLight){let B=t.get(y);B.color.copy(H).multiplyScalar(z),B.halfWidth.set(y.width*.5,0,0),B.halfHeight.set(0,y.height*.5,0),n.rectArea[d]=B,d++}else if(y.isPointLight){let B=t.get(y);if(B.color.copy(y.color).multiplyScalar(y.intensity),B.distance=y.distance,B.decay=y.decay,y.castShadow){let Q=y.shadow,V=e.get(y);V.shadowIntensity=Q.intensity,V.shadowBias=Q.bias,V.shadowNormalBias=Q.normalBias,V.shadowRadius=Q.radius,V.shadowMapSize=Q.mapSize,V.shadowCameraNear=Q.camera.near,V.shadowCameraFar=Q.camera.far,n.pointShadow[x]=V,n.pointShadowMap[x]=J,n.pointShadowMatrix[x]=y.shadow.matrix,S++}n.point[x]=B,x++}else if(y.isHemisphereLight){let B=t.get(y);B.skyColor.copy(y.color).multiplyScalar(z),B.groundColor.copy(y.groundColor).multiplyScalar(z),n.hemi[u]=B,u++}}d>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=et.LTC_FLOAT_1,n.rectAreaLTC2=et.LTC_FLOAT_2):(n.rectAreaLTC1=et.LTC_HALF_1,n.rectAreaLTC2=et.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=p,n.ambient[2]=f;let O=n.hash;(O.directionalLength!==m||O.pointLength!==x||O.spotLength!==M||O.rectAreaLength!==d||O.hemiLength!==u||O.numDirectionalShadows!==E||O.numPointShadows!==S||O.numSpotShadows!==w||O.numSpotMaps!==F||O.numLightProbes!==A)&&(n.directional.length=m,n.spot.length=M,n.rectArea.length=d,n.point.length=x,n.hemi.length=u,n.directionalShadow.length=E,n.directionalShadowMap.length=E,n.pointShadow.length=S,n.pointShadowMap.length=S,n.spotShadow.length=w,n.spotShadowMap.length=w,n.directionalShadowMatrix.length=E,n.pointShadowMatrix.length=S,n.spotLightMatrix.length=w+F-R,n.spotLightMap.length=F,n.numSpotLightShadowsWithMaps=R,n.numLightProbes=A,O.directionalLength=m,O.pointLength=x,O.spotLength=M,O.rectAreaLength=d,O.hemiLength=u,O.numDirectionalShadows=E,O.numPointShadows=S,O.numSpotShadows=w,O.numSpotMaps=F,O.numLightProbes=A,n.version=Wf++)}function l(c,h){let p=0,f=0,m=0,x=0,M=0,d=h.matrixWorldInverse;for(let u=0,E=c.length;u<E;u++){let S=c[u];if(S.isDirectionalLight){let w=n.directional[p];w.direction.setFromMatrixPosition(S.matrixWorld),s.setFromMatrixPosition(S.target.matrixWorld),w.direction.sub(s),w.direction.transformDirection(d),p++}else if(S.isSpotLight){let w=n.spot[m];w.position.setFromMatrixPosition(S.matrixWorld),w.position.applyMatrix4(d),w.direction.setFromMatrixPosition(S.matrixWorld),s.setFromMatrixPosition(S.target.matrixWorld),w.direction.sub(s),w.direction.transformDirection(d),m++}else if(S.isRectAreaLight){let w=n.rectArea[x];w.position.setFromMatrixPosition(S.matrixWorld),w.position.applyMatrix4(d),a.identity(),r.copy(S.matrixWorld),r.premultiply(d),a.extractRotation(r),w.halfWidth.set(S.width*.5,0,0),w.halfHeight.set(0,S.height*.5,0),w.halfWidth.applyMatrix4(a),w.halfHeight.applyMatrix4(a),x++}else if(S.isPointLight){let w=n.point[f];w.position.setFromMatrixPosition(S.matrixWorld),w.position.applyMatrix4(d),f++}else if(S.isHemisphereLight){let w=n.hemi[M];w.direction.setFromMatrixPosition(S.matrixWorld),w.direction.transformDirection(d),M++}}}return{setup:o,setupView:l,state:n}}function Go(i){let t=new qf(i),e=[],n=[];function s(h){c.camera=h,e.length=0,n.length=0}function r(h){e.push(h)}function a(h){n.push(h)}function o(){t.setup(e)}function l(h){t.setupView(e,h)}let c={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:o,setupLightsView:l,pushLight:r,pushShadow:a}}function Yf(i){let t=new WeakMap;function e(s,r=0){let a=t.get(s),o;return a===void 0?(o=new Go(i),t.set(s,[o])):r>=a.length?(o=new Go(i),a.push(o)):o=a[r],o}function n(){t=new WeakMap}return{get:e,dispose:n}}var da=class extends Ln{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Ql,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},fa=class extends Ln{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}},Zf=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Jf=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function $f(i,t,e){let n=new Si,s=new Vt,r=new Vt,a=new Zt,o=new da({depthPacking:jl}),l=new fa,c={},h=e.maxTextureSize,p={[fn]:_e,[_e]:fn,[Je]:Je},f=new ke({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Vt},radius:{value:4}},vertexShader:Zf,fragmentShader:Jf}),m=f.clone();m.defines.HORIZONTAL_PASS=1;let x=new Un;x.setAttribute("position",new Ce(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let M=new be(x,f),d=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Zo;let u=this.type;this.render=function(R,A,O){if(d.enabled===!1||d.autoUpdate===!1&&d.needsUpdate===!1||R.length===0)return;let tt=i.getRenderTarget(),g=i.getActiveCubeFace(),y=i.getActiveMipmapLevel(),H=i.state;H.setBlending(un),H.buffers.color.setClear(1,1,1,1),H.buffers.depth.setTest(!0),H.setScissorTest(!1);let z=u!==Ye&&this.type===Ye,G=u===Ye&&this.type!==Ye;for(let J=0,B=R.length;J<B;J++){let Q=R[J],V=Q.shadow;if(V===void 0){console.warn("THREE.WebGLShadowMap:",Q,"has no shadow.");continue}if(V.autoUpdate===!1&&V.needsUpdate===!1)continue;s.copy(V.mapSize);let ot=V.getFrameExtents();if(s.multiply(ot),r.copy(V.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/ot.x),s.x=r.x*ot.x,V.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/ot.y),s.y=r.y*ot.y,V.mapSize.y=r.y)),V.map===null||z===!0||G===!0){let gt=this.type!==Ye?{minFilter:Re,magFilter:Re}:{};V.map!==null&&V.map.dispose(),V.map=new tn(s.x,s.y,gt),V.map.texture.name=Q.name+".shadowMap",V.camera.updateProjectionMatrix()}i.setRenderTarget(V.map),i.clear();let lt=V.getViewportCount();for(let gt=0;gt<lt;gt++){let zt=V.getViewport(gt);a.set(r.x*zt.x,r.y*zt.y,r.x*zt.z,r.y*zt.w),H.viewport(a),V.updateMatrices(Q,gt),n=V.getFrustum(),w(A,O,V.camera,Q,this.type)}V.isPointLightShadow!==!0&&this.type===Ye&&E(V,O),V.needsUpdate=!1}u=this.type,d.needsUpdate=!1,i.setRenderTarget(tt,g,y)};function E(R,A){let O=t.update(M);f.defines.VSM_SAMPLES!==R.blurSamples&&(f.defines.VSM_SAMPLES=R.blurSamples,m.defines.VSM_SAMPLES=R.blurSamples,f.needsUpdate=!0,m.needsUpdate=!0),R.mapPass===null&&(R.mapPass=new tn(s.x,s.y)),f.uniforms.shadow_pass.value=R.map.texture,f.uniforms.resolution.value=R.mapSize,f.uniforms.radius.value=R.radius,i.setRenderTarget(R.mapPass),i.clear(),i.renderBufferDirect(A,null,O,f,M,null),m.uniforms.shadow_pass.value=R.mapPass.texture,m.uniforms.resolution.value=R.mapSize,m.uniforms.radius.value=R.radius,i.setRenderTarget(R.map),i.clear(),i.renderBufferDirect(A,null,O,m,M,null)}function S(R,A,O,tt){let g=null,y=O.isPointLight===!0?R.customDistanceMaterial:R.customDepthMaterial;if(y!==void 0)g=y;else if(g=O.isPointLight===!0?l:o,i.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0){let H=g.uuid,z=A.uuid,G=c[H];G===void 0&&(G={},c[H]=G);let J=G[z];J===void 0&&(J=g.clone(),G[z]=J,A.addEventListener("dispose",F)),g=J}if(g.visible=A.visible,g.wireframe=A.wireframe,tt===Ye?g.side=A.shadowSide!==null?A.shadowSide:A.side:g.side=A.shadowSide!==null?A.shadowSide:p[A.side],g.alphaMap=A.alphaMap,g.alphaTest=A.alphaTest,g.map=A.map,g.clipShadows=A.clipShadows,g.clippingPlanes=A.clippingPlanes,g.clipIntersection=A.clipIntersection,g.displacementMap=A.displacementMap,g.displacementScale=A.displacementScale,g.displacementBias=A.displacementBias,g.wireframeLinewidth=A.wireframeLinewidth,g.linewidth=A.linewidth,O.isPointLight===!0&&g.isMeshDistanceMaterial===!0){let H=i.properties.get(g);H.light=O}return g}function w(R,A,O,tt,g){if(R.visible===!1)return;if(R.layers.test(A.layers)&&(R.isMesh||R.isLine||R.isPoints)&&(R.castShadow||R.receiveShadow&&g===Ye)&&(!R.frustumCulled||n.intersectsObject(R))){R.modelViewMatrix.multiplyMatrices(O.matrixWorldInverse,R.matrixWorld);let z=t.update(R),G=R.material;if(Array.isArray(G)){let J=z.groups;for(let B=0,Q=J.length;B<Q;B++){let V=J[B],ot=G[V.materialIndex];if(ot&&ot.visible){let lt=S(R,ot,tt,g);R.onBeforeShadow(i,R,A,O,z,lt,V),i.renderBufferDirect(O,null,z,lt,R,V),R.onAfterShadow(i,R,A,O,z,lt,V)}}}else if(G.visible){let J=S(R,G,tt,g);R.onBeforeShadow(i,R,A,O,z,J,null),i.renderBufferDirect(O,null,z,J,R,null),R.onAfterShadow(i,R,A,O,z,J,null)}}let H=R.children;for(let z=0,G=H.length;z<G;z++)w(H[z],A,O,tt,g)}function F(R){R.target.removeEventListener("dispose",F);for(let O in c){let tt=c[O],g=R.target.uuid;g in tt&&(tt[g].dispose(),delete tt[g])}}}var Kf={[pr]:mr,[gr]:vr,[_r]:yr,[ii]:xr,[mr]:pr,[vr]:gr,[yr]:_r,[xr]:ii};function Qf(i){function t(){let C=!1,rt=new Zt,k=null,Y=new Zt(0,0,0,0);return{setMask:function(it){k!==it&&!C&&(i.colorMask(it,it,it,it),k=it)},setLocked:function(it){C=it},setClear:function(it,at,Ft,ie,fe){fe===!0&&(it*=ie,at*=ie,Ft*=ie),rt.set(it,at,Ft,ie),Y.equals(rt)===!1&&(i.clearColor(it,at,Ft,ie),Y.copy(rt))},reset:function(){C=!1,k=null,Y.set(-1,0,0,0)}}}function e(){let C=!1,rt=!1,k=null,Y=null,it=null;return{setReversed:function(at){rt=at},setTest:function(at){at?pt(i.DEPTH_TEST):ct(i.DEPTH_TEST)},setMask:function(at){k!==at&&!C&&(i.depthMask(at),k=at)},setFunc:function(at){if(rt&&(at=Kf[at]),Y!==at){switch(at){case pr:i.depthFunc(i.NEVER);break;case mr:i.depthFunc(i.ALWAYS);break;case gr:i.depthFunc(i.LESS);break;case ii:i.depthFunc(i.LEQUAL);break;case _r:i.depthFunc(i.EQUAL);break;case xr:i.depthFunc(i.GEQUAL);break;case vr:i.depthFunc(i.GREATER);break;case yr:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}Y=at}},setLocked:function(at){C=at},setClear:function(at){it!==at&&(i.clearDepth(at),it=at)},reset:function(){C=!1,k=null,Y=null,it=null}}}function n(){let C=!1,rt=null,k=null,Y=null,it=null,at=null,Ft=null,ie=null,fe=null;return{setTest:function(kt){C||(kt?pt(i.STENCIL_TEST):ct(i.STENCIL_TEST))},setMask:function(kt){rt!==kt&&!C&&(i.stencilMask(kt),rt=kt)},setFunc:function(kt,pe,Ve){(k!==kt||Y!==pe||it!==Ve)&&(i.stencilFunc(kt,pe,Ve),k=kt,Y=pe,it=Ve)},setOp:function(kt,pe,Ve){(at!==kt||Ft!==pe||ie!==Ve)&&(i.stencilOp(kt,pe,Ve),at=kt,Ft=pe,ie=Ve)},setLocked:function(kt){C=kt},setClear:function(kt){fe!==kt&&(i.clearStencil(kt),fe=kt)},reset:function(){C=!1,rt=null,k=null,Y=null,it=null,at=null,Ft=null,ie=null,fe=null}}}let s=new t,r=new e,a=new n,o=new WeakMap,l=new WeakMap,c={},h={},p=new WeakMap,f=[],m=null,x=!1,M=null,d=null,u=null,E=null,S=null,w=null,F=null,R=new It(0,0,0),A=0,O=!1,tt=null,g=null,y=null,H=null,z=null,G=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),J=!1,B=0,Q=i.getParameter(i.VERSION);Q.indexOf("WebGL")!==-1?(B=parseFloat(/^WebGL (\d)/.exec(Q)[1]),J=B>=1):Q.indexOf("OpenGL ES")!==-1&&(B=parseFloat(/^OpenGL ES (\d)/.exec(Q)[1]),J=B>=2);let V=null,ot={},lt=i.getParameter(i.SCISSOR_BOX),gt=i.getParameter(i.VIEWPORT),zt=new Zt().fromArray(lt),Xt=new Zt().fromArray(gt);function W(C,rt,k,Y){let it=new Uint8Array(4),at=i.createTexture();i.bindTexture(C,at),i.texParameteri(C,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(C,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Ft=0;Ft<k;Ft++)C===i.TEXTURE_3D||C===i.TEXTURE_2D_ARRAY?i.texImage3D(rt,0,i.RGBA,1,1,Y,0,i.RGBA,i.UNSIGNED_BYTE,it):i.texImage2D(rt+Ft,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,it);return at}let $={};$[i.TEXTURE_2D]=W(i.TEXTURE_2D,i.TEXTURE_2D,1),$[i.TEXTURE_CUBE_MAP]=W(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),$[i.TEXTURE_2D_ARRAY]=W(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),$[i.TEXTURE_3D]=W(i.TEXTURE_3D,i.TEXTURE_3D,1,1),s.setClear(0,0,0,1),r.setClear(1),a.setClear(0),pt(i.DEPTH_TEST),r.setFunc(ii),Lt(!1),Ot(Za),pt(i.CULL_FACE),T(un);function pt(C){c[C]!==!0&&(i.enable(C),c[C]=!0)}function ct(C){c[C]!==!1&&(i.disable(C),c[C]=!1)}function Tt(C,rt){return h[C]!==rt?(i.bindFramebuffer(C,rt),h[C]=rt,C===i.DRAW_FRAMEBUFFER&&(h[i.FRAMEBUFFER]=rt),C===i.FRAMEBUFFER&&(h[i.DRAW_FRAMEBUFFER]=rt),!0):!1}function Mt(C,rt){let k=f,Y=!1;if(C){k=p.get(rt),k===void 0&&(k=[],p.set(rt,k));let it=C.textures;if(k.length!==it.length||k[0]!==i.COLOR_ATTACHMENT0){for(let at=0,Ft=it.length;at<Ft;at++)k[at]=i.COLOR_ATTACHMENT0+at;k.length=it.length,Y=!0}}else k[0]!==i.BACK&&(k[0]=i.BACK,Y=!0);Y&&i.drawBuffers(k)}function Dt(C){return m!==C?(i.useProgram(C),m=C,!0):!1}let Yt={[wn]:i.FUNC_ADD,[wl]:i.FUNC_SUBTRACT,[Al]:i.FUNC_REVERSE_SUBTRACT};Yt[Tl]=i.MIN,Yt[Rl]=i.MAX;let Nt={[Cl]:i.ZERO,[Pl]:i.ONE,[Il]:i.SRC_COLOR,[dr]:i.SRC_ALPHA,[Ol]:i.SRC_ALPHA_SATURATE,[Nl]:i.DST_COLOR,[Ul]:i.DST_ALPHA,[Ll]:i.ONE_MINUS_SRC_COLOR,[fr]:i.ONE_MINUS_SRC_ALPHA,[Fl]:i.ONE_MINUS_DST_COLOR,[Dl]:i.ONE_MINUS_DST_ALPHA,[Bl]:i.CONSTANT_COLOR,[zl]:i.ONE_MINUS_CONSTANT_COLOR,[kl]:i.CONSTANT_ALPHA,[Vl]:i.ONE_MINUS_CONSTANT_ALPHA};function T(C,rt,k,Y,it,at,Ft,ie,fe,kt){if(C===un){x===!0&&(ct(i.BLEND),x=!1);return}if(x===!1&&(pt(i.BLEND),x=!0),C!==El){if(C!==M||kt!==O){if((d!==wn||S!==wn)&&(i.blendEquation(i.FUNC_ADD),d=wn,S=wn),kt)switch(C){case jn:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Ja:i.blendFunc(i.ONE,i.ONE);break;case $a:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Ka:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",C);break}else switch(C){case jn:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Ja:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case $a:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Ka:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",C);break}u=null,E=null,w=null,F=null,R.set(0,0,0),A=0,M=C,O=kt}return}it=it||rt,at=at||k,Ft=Ft||Y,(rt!==d||it!==S)&&(i.blendEquationSeparate(Yt[rt],Yt[it]),d=rt,S=it),(k!==u||Y!==E||at!==w||Ft!==F)&&(i.blendFuncSeparate(Nt[k],Nt[Y],Nt[at],Nt[Ft]),u=k,E=Y,w=at,F=Ft),(ie.equals(R)===!1||fe!==A)&&(i.blendColor(ie.r,ie.g,ie.b,fe),R.copy(ie),A=fe),M=C,O=!1}function xe(C,rt){C.side===Je?ct(i.CULL_FACE):pt(i.CULL_FACE);let k=C.side===_e;rt&&(k=!k),Lt(k),C.blending===jn&&C.transparent===!1?T(un):T(C.blending,C.blendEquation,C.blendSrc,C.blendDst,C.blendEquationAlpha,C.blendSrcAlpha,C.blendDstAlpha,C.blendColor,C.blendAlpha,C.premultipliedAlpha),r.setFunc(C.depthFunc),r.setTest(C.depthTest),r.setMask(C.depthWrite),s.setMask(C.colorWrite);let Y=C.stencilWrite;a.setTest(Y),Y&&(a.setMask(C.stencilWriteMask),a.setFunc(C.stencilFunc,C.stencilRef,C.stencilFuncMask),a.setOp(C.stencilFail,C.stencilZFail,C.stencilZPass)),$t(C.polygonOffset,C.polygonOffsetFactor,C.polygonOffsetUnits),C.alphaToCoverage===!0?pt(i.SAMPLE_ALPHA_TO_COVERAGE):ct(i.SAMPLE_ALPHA_TO_COVERAGE)}function Lt(C){tt!==C&&(C?i.frontFace(i.CW):i.frontFace(i.CCW),tt=C)}function Ot(C){C!==Ml?(pt(i.CULL_FACE),C!==g&&(C===Za?i.cullFace(i.BACK):C===Sl?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):ct(i.CULL_FACE),g=C}function bt(C){C!==y&&(J&&i.lineWidth(C),y=C)}function $t(C,rt,k){C?(pt(i.POLYGON_OFFSET_FILL),(H!==rt||z!==k)&&(i.polygonOffset(rt,k),H=rt,z=k)):ct(i.POLYGON_OFFSET_FILL)}function At(C){C?pt(i.SCISSOR_TEST):ct(i.SCISSOR_TEST)}function b(C){C===void 0&&(C=i.TEXTURE0+G-1),V!==C&&(i.activeTexture(C),V=C)}function _(C,rt,k){k===void 0&&(V===null?k=i.TEXTURE0+G-1:k=V);let Y=ot[k];Y===void 0&&(Y={type:void 0,texture:void 0},ot[k]=Y),(Y.type!==C||Y.texture!==rt)&&(V!==k&&(i.activeTexture(k),V=k),i.bindTexture(C,rt||$[C]),Y.type=C,Y.texture=rt)}function U(){let C=ot[V];C!==void 0&&C.type!==void 0&&(i.bindTexture(C.type,null),C.type=void 0,C.texture=void 0)}function q(){try{i.compressedTexImage2D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function Z(){try{i.compressedTexImage3D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function X(){try{i.texSubImage2D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function _t(){try{i.texSubImage3D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function nt(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function ht(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function Bt(){try{i.texStorage2D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function K(){try{i.texStorage3D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function ut(){try{i.texImage2D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function Et(){try{i.texImage3D.apply(i,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function wt(C){zt.equals(C)===!1&&(i.scissor(C.x,C.y,C.z,C.w),zt.copy(C))}function dt(C){Xt.equals(C)===!1&&(i.viewport(C.x,C.y,C.z,C.w),Xt.copy(C))}function Ut(C,rt){let k=l.get(rt);k===void 0&&(k=new WeakMap,l.set(rt,k));let Y=k.get(C);Y===void 0&&(Y=i.getUniformBlockIndex(rt,C.name),k.set(C,Y))}function Rt(C,rt){let Y=l.get(rt).get(C);o.get(rt)!==Y&&(i.uniformBlockBinding(rt,Y,C.__bindingPointIndex),o.set(rt,Y))}function Jt(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),c={},V=null,ot={},h={},p=new WeakMap,f=[],m=null,x=!1,M=null,d=null,u=null,E=null,S=null,w=null,F=null,R=new It(0,0,0),A=0,O=!1,tt=null,g=null,y=null,H=null,z=null,zt.set(0,0,i.canvas.width,i.canvas.height),Xt.set(0,0,i.canvas.width,i.canvas.height),s.reset(),r.reset(),a.reset()}return{buffers:{color:s,depth:r,stencil:a},enable:pt,disable:ct,bindFramebuffer:Tt,drawBuffers:Mt,useProgram:Dt,setBlending:T,setMaterial:xe,setFlipSided:Lt,setCullFace:Ot,setLineWidth:bt,setPolygonOffset:$t,setScissorTest:At,activeTexture:b,bindTexture:_,unbindTexture:U,compressedTexImage2D:q,compressedTexImage3D:Z,texImage2D:ut,texImage3D:Et,updateUBOMapping:Ut,uniformBlockBinding:Rt,texStorage2D:Bt,texStorage3D:K,texSubImage2D:X,texSubImage3D:_t,compressedTexSubImage2D:nt,compressedTexSubImage3D:ht,scissor:wt,viewport:dt,reset:Jt}}function Wo(i,t,e,n){let s=jf(n);switch(e){case tl:return i*t;case nl:return i*t;case il:return i*t*2;case sl:return i*t/s.components*s.byteLength;case Ua:return i*t/s.components*s.byteLength;case rl:return i*t*2/s.components*s.byteLength;case Da:return i*t*2/s.components*s.byteLength;case el:return i*t*3/s.components*s.byteLength;case Fe:return i*t*4/s.components*s.byteLength;case Na:return i*t*4/s.components*s.byteLength;case Ji:case $i:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Ki:case Qi:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Ar:case Rr:return Math.max(i,16)*Math.max(t,8)/4;case wr:case Tr:return Math.max(i,8)*Math.max(t,8)/2;case Cr:case Pr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Ir:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Lr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Ur:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case Dr:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case Nr:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case Fr:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case Or:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case Br:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case zr:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case kr:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case Vr:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case Hr:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case Gr:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case Wr:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case Xr:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case ji:case qr:case Yr:return Math.ceil(i/4)*Math.ceil(t/4)*16;case al:case Zr:return Math.ceil(i/4)*Math.ceil(t/4)*8;case Jr:case $r:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function jf(i){switch(i){case je:case Ko:return{byteLength:1,components:1};case yi:case Qo:case bi:return{byteLength:2,components:1};case Ia:case La:return{byteLength:2,components:4};case Pn:case Pa:case $e:return{byteLength:4,components:1};case jo:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function tp(i,t,e,n,s,r,a){let o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Vt,h=new WeakMap,p,f=new WeakMap,m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function x(b,_){return m?new OffscreenCanvas(b,_):as("canvas")}function M(b,_,U){let q=1,Z=At(b);if((Z.width>U||Z.height>U)&&(q=U/Math.max(Z.width,Z.height)),q<1)if(typeof HTMLImageElement<"u"&&b instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&b instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&b instanceof ImageBitmap||typeof VideoFrame<"u"&&b instanceof VideoFrame){let X=Math.floor(q*Z.width),_t=Math.floor(q*Z.height);p===void 0&&(p=x(X,_t));let nt=_?x(X,_t):p;return nt.width=X,nt.height=_t,nt.getContext("2d").drawImage(b,0,0,X,_t),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+Z.width+"x"+Z.height+") to ("+X+"x"+_t+")."),nt}else return"data"in b&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+Z.width+"x"+Z.height+")."),b;return b}function d(b){return b.generateMipmaps&&b.minFilter!==Re&&b.minFilter!==Ne}function u(b){i.generateMipmap(b)}function E(b,_,U,q,Z=!1){if(b!==null){if(i[b]!==void 0)return i[b];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+b+"'")}let X=_;if(_===i.RED&&(U===i.FLOAT&&(X=i.R32F),U===i.HALF_FLOAT&&(X=i.R16F),U===i.UNSIGNED_BYTE&&(X=i.R8)),_===i.RED_INTEGER&&(U===i.UNSIGNED_BYTE&&(X=i.R8UI),U===i.UNSIGNED_SHORT&&(X=i.R16UI),U===i.UNSIGNED_INT&&(X=i.R32UI),U===i.BYTE&&(X=i.R8I),U===i.SHORT&&(X=i.R16I),U===i.INT&&(X=i.R32I)),_===i.RG&&(U===i.FLOAT&&(X=i.RG32F),U===i.HALF_FLOAT&&(X=i.RG16F),U===i.UNSIGNED_BYTE&&(X=i.RG8)),_===i.RG_INTEGER&&(U===i.UNSIGNED_BYTE&&(X=i.RG8UI),U===i.UNSIGNED_SHORT&&(X=i.RG16UI),U===i.UNSIGNED_INT&&(X=i.RG32UI),U===i.BYTE&&(X=i.RG8I),U===i.SHORT&&(X=i.RG16I),U===i.INT&&(X=i.RG32I)),_===i.RGB_INTEGER&&(U===i.UNSIGNED_BYTE&&(X=i.RGB8UI),U===i.UNSIGNED_SHORT&&(X=i.RGB16UI),U===i.UNSIGNED_INT&&(X=i.RGB32UI),U===i.BYTE&&(X=i.RGB8I),U===i.SHORT&&(X=i.RGB16I),U===i.INT&&(X=i.RGB32I)),_===i.RGBA_INTEGER&&(U===i.UNSIGNED_BYTE&&(X=i.RGBA8UI),U===i.UNSIGNED_SHORT&&(X=i.RGBA16UI),U===i.UNSIGNED_INT&&(X=i.RGBA32UI),U===i.BYTE&&(X=i.RGBA8I),U===i.SHORT&&(X=i.RGBA16I),U===i.INT&&(X=i.RGBA32I)),_===i.RGB&&U===i.UNSIGNED_INT_5_9_9_9_REV&&(X=i.RGB9_E5),_===i.RGBA){let _t=Z?ns:Wt.getTransfer(q);U===i.FLOAT&&(X=i.RGBA32F),U===i.HALF_FLOAT&&(X=i.RGBA16F),U===i.UNSIGNED_BYTE&&(X=_t===Qt?i.SRGB8_ALPHA8:i.RGBA8),U===i.UNSIGNED_SHORT_4_4_4_4&&(X=i.RGBA4),U===i.UNSIGNED_SHORT_5_5_5_1&&(X=i.RGB5_A1)}return(X===i.R16F||X===i.R32F||X===i.RG16F||X===i.RG32F||X===i.RGBA16F||X===i.RGBA32F)&&t.get("EXT_color_buffer_float"),X}function S(b,_){let U;return b?_===null||_===Pn||_===ai?U=i.DEPTH24_STENCIL8:_===$e?U=i.DEPTH32F_STENCIL8:_===yi&&(U=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):_===null||_===Pn||_===ai?U=i.DEPTH_COMPONENT24:_===$e?U=i.DEPTH_COMPONENT32F:_===yi&&(U=i.DEPTH_COMPONENT16),U}function w(b,_){return d(b)===!0||b.isFramebufferTexture&&b.minFilter!==Re&&b.minFilter!==Ne?Math.log2(Math.max(_.width,_.height))+1:b.mipmaps!==void 0&&b.mipmaps.length>0?b.mipmaps.length:b.isCompressedTexture&&Array.isArray(b.image)?_.mipmaps.length:1}function F(b){let _=b.target;_.removeEventListener("dispose",F),A(_),_.isVideoTexture&&h.delete(_)}function R(b){let _=b.target;_.removeEventListener("dispose",R),tt(_)}function A(b){let _=n.get(b);if(_.__webglInit===void 0)return;let U=b.source,q=f.get(U);if(q){let Z=q[_.__cacheKey];Z.usedTimes--,Z.usedTimes===0&&O(b),Object.keys(q).length===0&&f.delete(U)}n.remove(b)}function O(b){let _=n.get(b);i.deleteTexture(_.__webglTexture);let U=b.source,q=f.get(U);delete q[_.__cacheKey],a.memory.textures--}function tt(b){let _=n.get(b);if(b.depthTexture&&b.depthTexture.dispose(),b.isWebGLCubeRenderTarget)for(let q=0;q<6;q++){if(Array.isArray(_.__webglFramebuffer[q]))for(let Z=0;Z<_.__webglFramebuffer[q].length;Z++)i.deleteFramebuffer(_.__webglFramebuffer[q][Z]);else i.deleteFramebuffer(_.__webglFramebuffer[q]);_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer[q])}else{if(Array.isArray(_.__webglFramebuffer))for(let q=0;q<_.__webglFramebuffer.length;q++)i.deleteFramebuffer(_.__webglFramebuffer[q]);else i.deleteFramebuffer(_.__webglFramebuffer);if(_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer),_.__webglMultisampledFramebuffer&&i.deleteFramebuffer(_.__webglMultisampledFramebuffer),_.__webglColorRenderbuffer)for(let q=0;q<_.__webglColorRenderbuffer.length;q++)_.__webglColorRenderbuffer[q]&&i.deleteRenderbuffer(_.__webglColorRenderbuffer[q]);_.__webglDepthRenderbuffer&&i.deleteRenderbuffer(_.__webglDepthRenderbuffer)}let U=b.textures;for(let q=0,Z=U.length;q<Z;q++){let X=n.get(U[q]);X.__webglTexture&&(i.deleteTexture(X.__webglTexture),a.memory.textures--),n.remove(U[q])}n.remove(b)}let g=0;function y(){g=0}function H(){let b=g;return b>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+b+" texture units while this GPU supports only "+s.maxTextures),g+=1,b}function z(b){let _=[];return _.push(b.wrapS),_.push(b.wrapT),_.push(b.wrapR||0),_.push(b.magFilter),_.push(b.minFilter),_.push(b.anisotropy),_.push(b.internalFormat),_.push(b.format),_.push(b.type),_.push(b.generateMipmaps),_.push(b.premultiplyAlpha),_.push(b.flipY),_.push(b.unpackAlignment),_.push(b.colorSpace),_.join()}function G(b,_){let U=n.get(b);if(b.isVideoTexture&&bt(b),b.isRenderTargetTexture===!1&&b.version>0&&U.__version!==b.version){let q=b.image;if(q===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(q.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{Xt(U,b,_);return}}e.bindTexture(i.TEXTURE_2D,U.__webglTexture,i.TEXTURE0+_)}function J(b,_){let U=n.get(b);if(b.version>0&&U.__version!==b.version){Xt(U,b,_);return}e.bindTexture(i.TEXTURE_2D_ARRAY,U.__webglTexture,i.TEXTURE0+_)}function B(b,_){let U=n.get(b);if(b.version>0&&U.__version!==b.version){Xt(U,b,_);return}e.bindTexture(i.TEXTURE_3D,U.__webglTexture,i.TEXTURE0+_)}function Q(b,_){let U=n.get(b);if(b.version>0&&U.__version!==b.version){W(U,b,_);return}e.bindTexture(i.TEXTURE_CUBE_MAP,U.__webglTexture,i.TEXTURE0+_)}let V={[br]:i.REPEAT,[Rn]:i.CLAMP_TO_EDGE,[Er]:i.MIRRORED_REPEAT},ot={[Re]:i.NEAREST,[Kl]:i.NEAREST_MIPMAP_NEAREST,[Ti]:i.NEAREST_MIPMAP_LINEAR,[Ne]:i.LINEAR,[Us]:i.LINEAR_MIPMAP_NEAREST,[Cn]:i.LINEAR_MIPMAP_LINEAR},lt={[ec]:i.NEVER,[oc]:i.ALWAYS,[nc]:i.LESS,[ll]:i.LEQUAL,[ic]:i.EQUAL,[ac]:i.GEQUAL,[sc]:i.GREATER,[rc]:i.NOTEQUAL};function gt(b,_){if(_.type===$e&&t.has("OES_texture_float_linear")===!1&&(_.magFilter===Ne||_.magFilter===Us||_.magFilter===Ti||_.magFilter===Cn||_.minFilter===Ne||_.minFilter===Us||_.minFilter===Ti||_.minFilter===Cn)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(b,i.TEXTURE_WRAP_S,V[_.wrapS]),i.texParameteri(b,i.TEXTURE_WRAP_T,V[_.wrapT]),(b===i.TEXTURE_3D||b===i.TEXTURE_2D_ARRAY)&&i.texParameteri(b,i.TEXTURE_WRAP_R,V[_.wrapR]),i.texParameteri(b,i.TEXTURE_MAG_FILTER,ot[_.magFilter]),i.texParameteri(b,i.TEXTURE_MIN_FILTER,ot[_.minFilter]),_.compareFunction&&(i.texParameteri(b,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(b,i.TEXTURE_COMPARE_FUNC,lt[_.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(_.magFilter===Re||_.minFilter!==Ti&&_.minFilter!==Cn||_.type===$e&&t.has("OES_texture_float_linear")===!1)return;if(_.anisotropy>1||n.get(_).__currentAnisotropy){let U=t.get("EXT_texture_filter_anisotropic");i.texParameterf(b,U.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(_.anisotropy,s.getMaxAnisotropy())),n.get(_).__currentAnisotropy=_.anisotropy}}}function zt(b,_){let U=!1;b.__webglInit===void 0&&(b.__webglInit=!0,_.addEventListener("dispose",F));let q=_.source,Z=f.get(q);Z===void 0&&(Z={},f.set(q,Z));let X=z(_);if(X!==b.__cacheKey){Z[X]===void 0&&(Z[X]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,U=!0),Z[X].usedTimes++;let _t=Z[b.__cacheKey];_t!==void 0&&(Z[b.__cacheKey].usedTimes--,_t.usedTimes===0&&O(_)),b.__cacheKey=X,b.__webglTexture=Z[X].texture}return U}function Xt(b,_,U){let q=i.TEXTURE_2D;(_.isDataArrayTexture||_.isCompressedArrayTexture)&&(q=i.TEXTURE_2D_ARRAY),_.isData3DTexture&&(q=i.TEXTURE_3D);let Z=zt(b,_),X=_.source;e.bindTexture(q,b.__webglTexture,i.TEXTURE0+U);let _t=n.get(X);if(X.version!==_t.__version||Z===!0){e.activeTexture(i.TEXTURE0+U);let nt=Wt.getPrimaries(Wt.workingColorSpace),ht=_.colorSpace===cn?null:Wt.getPrimaries(_.colorSpace),Bt=_.colorSpace===cn||nt===ht?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Bt);let K=M(_.image,!1,s.maxTextureSize);K=$t(_,K);let ut=r.convert(_.format,_.colorSpace),Et=r.convert(_.type),wt=E(_.internalFormat,ut,Et,_.colorSpace,_.isVideoTexture);gt(q,_);let dt,Ut=_.mipmaps,Rt=_.isVideoTexture!==!0,Jt=_t.__version===void 0||Z===!0,C=X.dataReady,rt=w(_,K);if(_.isDepthTexture)wt=S(_.format===oi,_.type),Jt&&(Rt?e.texStorage2D(i.TEXTURE_2D,1,wt,K.width,K.height):e.texImage2D(i.TEXTURE_2D,0,wt,K.width,K.height,0,ut,Et,null));else if(_.isDataTexture)if(Ut.length>0){Rt&&Jt&&e.texStorage2D(i.TEXTURE_2D,rt,wt,Ut[0].width,Ut[0].height);for(let k=0,Y=Ut.length;k<Y;k++)dt=Ut[k],Rt?C&&e.texSubImage2D(i.TEXTURE_2D,k,0,0,dt.width,dt.height,ut,Et,dt.data):e.texImage2D(i.TEXTURE_2D,k,wt,dt.width,dt.height,0,ut,Et,dt.data);_.generateMipmaps=!1}else Rt?(Jt&&e.texStorage2D(i.TEXTURE_2D,rt,wt,K.width,K.height),C&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,K.width,K.height,ut,Et,K.data)):e.texImage2D(i.TEXTURE_2D,0,wt,K.width,K.height,0,ut,Et,K.data);else if(_.isCompressedTexture)if(_.isCompressedArrayTexture){Rt&&Jt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,rt,wt,Ut[0].width,Ut[0].height,K.depth);for(let k=0,Y=Ut.length;k<Y;k++)if(dt=Ut[k],_.format!==Fe)if(ut!==null)if(Rt){if(C)if(_.layerUpdates.size>0){let it=Wo(dt.width,dt.height,_.format,_.type);for(let at of _.layerUpdates){let Ft=dt.data.subarray(at*it/dt.data.BYTES_PER_ELEMENT,(at+1)*it/dt.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,k,0,0,at,dt.width,dt.height,1,ut,Ft,0,0)}_.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,k,0,0,0,dt.width,dt.height,K.depth,ut,dt.data,0,0)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,k,wt,dt.width,dt.height,K.depth,0,dt.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Rt?C&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,k,0,0,0,dt.width,dt.height,K.depth,ut,Et,dt.data):e.texImage3D(i.TEXTURE_2D_ARRAY,k,wt,dt.width,dt.height,K.depth,0,ut,Et,dt.data)}else{Rt&&Jt&&e.texStorage2D(i.TEXTURE_2D,rt,wt,Ut[0].width,Ut[0].height);for(let k=0,Y=Ut.length;k<Y;k++)dt=Ut[k],_.format!==Fe?ut!==null?Rt?C&&e.compressedTexSubImage2D(i.TEXTURE_2D,k,0,0,dt.width,dt.height,ut,dt.data):e.compressedTexImage2D(i.TEXTURE_2D,k,wt,dt.width,dt.height,0,dt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Rt?C&&e.texSubImage2D(i.TEXTURE_2D,k,0,0,dt.width,dt.height,ut,Et,dt.data):e.texImage2D(i.TEXTURE_2D,k,wt,dt.width,dt.height,0,ut,Et,dt.data)}else if(_.isDataArrayTexture)if(Rt){if(Jt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,rt,wt,K.width,K.height,K.depth),C)if(_.layerUpdates.size>0){let k=Wo(K.width,K.height,_.format,_.type);for(let Y of _.layerUpdates){let it=K.data.subarray(Y*k/K.data.BYTES_PER_ELEMENT,(Y+1)*k/K.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,Y,K.width,K.height,1,ut,Et,it)}_.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,K.width,K.height,K.depth,ut,Et,K.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,wt,K.width,K.height,K.depth,0,ut,Et,K.data);else if(_.isData3DTexture)Rt?(Jt&&e.texStorage3D(i.TEXTURE_3D,rt,wt,K.width,K.height,K.depth),C&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,K.width,K.height,K.depth,ut,Et,K.data)):e.texImage3D(i.TEXTURE_3D,0,wt,K.width,K.height,K.depth,0,ut,Et,K.data);else if(_.isFramebufferTexture){if(Jt)if(Rt)e.texStorage2D(i.TEXTURE_2D,rt,wt,K.width,K.height);else{let k=K.width,Y=K.height;for(let it=0;it<rt;it++)e.texImage2D(i.TEXTURE_2D,it,wt,k,Y,0,ut,Et,null),k>>=1,Y>>=1}}else if(Ut.length>0){if(Rt&&Jt){let k=At(Ut[0]);e.texStorage2D(i.TEXTURE_2D,rt,wt,k.width,k.height)}for(let k=0,Y=Ut.length;k<Y;k++)dt=Ut[k],Rt?C&&e.texSubImage2D(i.TEXTURE_2D,k,0,0,ut,Et,dt):e.texImage2D(i.TEXTURE_2D,k,wt,ut,Et,dt);_.generateMipmaps=!1}else if(Rt){if(Jt){let k=At(K);e.texStorage2D(i.TEXTURE_2D,rt,wt,k.width,k.height)}C&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,ut,Et,K)}else e.texImage2D(i.TEXTURE_2D,0,wt,ut,Et,K);d(_)&&u(q),_t.__version=X.version,_.onUpdate&&_.onUpdate(_)}b.__version=_.version}function W(b,_,U){if(_.image.length!==6)return;let q=zt(b,_),Z=_.source;e.bindTexture(i.TEXTURE_CUBE_MAP,b.__webglTexture,i.TEXTURE0+U);let X=n.get(Z);if(Z.version!==X.__version||q===!0){e.activeTexture(i.TEXTURE0+U);let _t=Wt.getPrimaries(Wt.workingColorSpace),nt=_.colorSpace===cn?null:Wt.getPrimaries(_.colorSpace),ht=_.colorSpace===cn||_t===nt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,ht);let Bt=_.isCompressedTexture||_.image[0].isCompressedTexture,K=_.image[0]&&_.image[0].isDataTexture,ut=[];for(let Y=0;Y<6;Y++)!Bt&&!K?ut[Y]=M(_.image[Y],!0,s.maxCubemapSize):ut[Y]=K?_.image[Y].image:_.image[Y],ut[Y]=$t(_,ut[Y]);let Et=ut[0],wt=r.convert(_.format,_.colorSpace),dt=r.convert(_.type),Ut=E(_.internalFormat,wt,dt,_.colorSpace),Rt=_.isVideoTexture!==!0,Jt=X.__version===void 0||q===!0,C=Z.dataReady,rt=w(_,Et);gt(i.TEXTURE_CUBE_MAP,_);let k;if(Bt){Rt&&Jt&&e.texStorage2D(i.TEXTURE_CUBE_MAP,rt,Ut,Et.width,Et.height);for(let Y=0;Y<6;Y++){k=ut[Y].mipmaps;for(let it=0;it<k.length;it++){let at=k[it];_.format!==Fe?wt!==null?Rt?C&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,it,0,0,at.width,at.height,wt,at.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,it,Ut,at.width,at.height,0,at.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Rt?C&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,it,0,0,at.width,at.height,wt,dt,at.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,it,Ut,at.width,at.height,0,wt,dt,at.data)}}}else{if(k=_.mipmaps,Rt&&Jt){k.length>0&&rt++;let Y=At(ut[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,rt,Ut,Y.width,Y.height)}for(let Y=0;Y<6;Y++)if(K){Rt?C&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,0,0,0,ut[Y].width,ut[Y].height,wt,dt,ut[Y].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,0,Ut,ut[Y].width,ut[Y].height,0,wt,dt,ut[Y].data);for(let it=0;it<k.length;it++){let Ft=k[it].image[Y].image;Rt?C&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,it+1,0,0,Ft.width,Ft.height,wt,dt,Ft.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,it+1,Ut,Ft.width,Ft.height,0,wt,dt,Ft.data)}}else{Rt?C&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,0,0,0,wt,dt,ut[Y]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,0,Ut,wt,dt,ut[Y]);for(let it=0;it<k.length;it++){let at=k[it];Rt?C&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,it+1,0,0,wt,dt,at.image[Y]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,it+1,Ut,wt,dt,at.image[Y])}}}d(_)&&u(i.TEXTURE_CUBE_MAP),X.__version=Z.version,_.onUpdate&&_.onUpdate(_)}b.__version=_.version}function $(b,_,U,q,Z,X){let _t=r.convert(U.format,U.colorSpace),nt=r.convert(U.type),ht=E(U.internalFormat,_t,nt,U.colorSpace);if(!n.get(_).__hasExternalTextures){let K=Math.max(1,_.width>>X),ut=Math.max(1,_.height>>X);Z===i.TEXTURE_3D||Z===i.TEXTURE_2D_ARRAY?e.texImage3D(Z,X,ht,K,ut,_.depth,0,_t,nt,null):e.texImage2D(Z,X,ht,K,ut,0,_t,nt,null)}e.bindFramebuffer(i.FRAMEBUFFER,b),Ot(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,q,Z,n.get(U).__webglTexture,0,Lt(_)):(Z===i.TEXTURE_2D||Z>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&Z<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,q,Z,n.get(U).__webglTexture,X),e.bindFramebuffer(i.FRAMEBUFFER,null)}function pt(b,_,U){if(i.bindRenderbuffer(i.RENDERBUFFER,b),_.depthBuffer){let q=_.depthTexture,Z=q&&q.isDepthTexture?q.type:null,X=S(_.stencilBuffer,Z),_t=_.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,nt=Lt(_);Ot(_)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,nt,X,_.width,_.height):U?i.renderbufferStorageMultisample(i.RENDERBUFFER,nt,X,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,X,_.width,_.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,_t,i.RENDERBUFFER,b)}else{let q=_.textures;for(let Z=0;Z<q.length;Z++){let X=q[Z],_t=r.convert(X.format,X.colorSpace),nt=r.convert(X.type),ht=E(X.internalFormat,_t,nt,X.colorSpace),Bt=Lt(_);U&&Ot(_)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Bt,ht,_.width,_.height):Ot(_)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Bt,ht,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,ht,_.width,_.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function ct(b,_){if(_&&_.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(i.FRAMEBUFFER,b),!(_.depthTexture&&_.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!n.get(_.depthTexture).__webglTexture||_.depthTexture.image.width!==_.width||_.depthTexture.image.height!==_.height)&&(_.depthTexture.image.width=_.width,_.depthTexture.image.height=_.height,_.depthTexture.needsUpdate=!0),G(_.depthTexture,0);let q=n.get(_.depthTexture).__webglTexture,Z=Lt(_);if(_.depthTexture.format===ti)Ot(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,q,0,Z):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,q,0);else if(_.depthTexture.format===oi)Ot(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,q,0,Z):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,q,0);else throw new Error("Unknown depthTexture format")}function Tt(b){let _=n.get(b),U=b.isWebGLCubeRenderTarget===!0;if(_.__boundDepthTexture!==b.depthTexture){let q=b.depthTexture;if(_.__depthDisposeCallback&&_.__depthDisposeCallback(),q){let Z=()=>{delete _.__boundDepthTexture,delete _.__depthDisposeCallback,q.removeEventListener("dispose",Z)};q.addEventListener("dispose",Z),_.__depthDisposeCallback=Z}_.__boundDepthTexture=q}if(b.depthTexture&&!_.__autoAllocateDepthBuffer){if(U)throw new Error("target.depthTexture not supported in Cube render targets");ct(_.__webglFramebuffer,b)}else if(U){_.__webglDepthbuffer=[];for(let q=0;q<6;q++)if(e.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer[q]),_.__webglDepthbuffer[q]===void 0)_.__webglDepthbuffer[q]=i.createRenderbuffer(),pt(_.__webglDepthbuffer[q],b,!1);else{let Z=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,X=_.__webglDepthbuffer[q];i.bindRenderbuffer(i.RENDERBUFFER,X),i.framebufferRenderbuffer(i.FRAMEBUFFER,Z,i.RENDERBUFFER,X)}}else if(e.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer),_.__webglDepthbuffer===void 0)_.__webglDepthbuffer=i.createRenderbuffer(),pt(_.__webglDepthbuffer,b,!1);else{let q=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Z=_.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,Z),i.framebufferRenderbuffer(i.FRAMEBUFFER,q,i.RENDERBUFFER,Z)}e.bindFramebuffer(i.FRAMEBUFFER,null)}function Mt(b,_,U){let q=n.get(b);_!==void 0&&$(q.__webglFramebuffer,b,b.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),U!==void 0&&Tt(b)}function Dt(b){let _=b.texture,U=n.get(b),q=n.get(_);b.addEventListener("dispose",R);let Z=b.textures,X=b.isWebGLCubeRenderTarget===!0,_t=Z.length>1;if(_t||(q.__webglTexture===void 0&&(q.__webglTexture=i.createTexture()),q.__version=_.version,a.memory.textures++),X){U.__webglFramebuffer=[];for(let nt=0;nt<6;nt++)if(_.mipmaps&&_.mipmaps.length>0){U.__webglFramebuffer[nt]=[];for(let ht=0;ht<_.mipmaps.length;ht++)U.__webglFramebuffer[nt][ht]=i.createFramebuffer()}else U.__webglFramebuffer[nt]=i.createFramebuffer()}else{if(_.mipmaps&&_.mipmaps.length>0){U.__webglFramebuffer=[];for(let nt=0;nt<_.mipmaps.length;nt++)U.__webglFramebuffer[nt]=i.createFramebuffer()}else U.__webglFramebuffer=i.createFramebuffer();if(_t)for(let nt=0,ht=Z.length;nt<ht;nt++){let Bt=n.get(Z[nt]);Bt.__webglTexture===void 0&&(Bt.__webglTexture=i.createTexture(),a.memory.textures++)}if(b.samples>0&&Ot(b)===!1){U.__webglMultisampledFramebuffer=i.createFramebuffer(),U.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,U.__webglMultisampledFramebuffer);for(let nt=0;nt<Z.length;nt++){let ht=Z[nt];U.__webglColorRenderbuffer[nt]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,U.__webglColorRenderbuffer[nt]);let Bt=r.convert(ht.format,ht.colorSpace),K=r.convert(ht.type),ut=E(ht.internalFormat,Bt,K,ht.colorSpace,b.isXRRenderTarget===!0),Et=Lt(b);i.renderbufferStorageMultisample(i.RENDERBUFFER,Et,ut,b.width,b.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+nt,i.RENDERBUFFER,U.__webglColorRenderbuffer[nt])}i.bindRenderbuffer(i.RENDERBUFFER,null),b.depthBuffer&&(U.__webglDepthRenderbuffer=i.createRenderbuffer(),pt(U.__webglDepthRenderbuffer,b,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(X){e.bindTexture(i.TEXTURE_CUBE_MAP,q.__webglTexture),gt(i.TEXTURE_CUBE_MAP,_);for(let nt=0;nt<6;nt++)if(_.mipmaps&&_.mipmaps.length>0)for(let ht=0;ht<_.mipmaps.length;ht++)$(U.__webglFramebuffer[nt][ht],b,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,ht);else $(U.__webglFramebuffer[nt],b,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,0);d(_)&&u(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(_t){for(let nt=0,ht=Z.length;nt<ht;nt++){let Bt=Z[nt],K=n.get(Bt);e.bindTexture(i.TEXTURE_2D,K.__webglTexture),gt(i.TEXTURE_2D,Bt),$(U.__webglFramebuffer,b,Bt,i.COLOR_ATTACHMENT0+nt,i.TEXTURE_2D,0),d(Bt)&&u(i.TEXTURE_2D)}e.unbindTexture()}else{let nt=i.TEXTURE_2D;if((b.isWebGL3DRenderTarget||b.isWebGLArrayRenderTarget)&&(nt=b.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(nt,q.__webglTexture),gt(nt,_),_.mipmaps&&_.mipmaps.length>0)for(let ht=0;ht<_.mipmaps.length;ht++)$(U.__webglFramebuffer[ht],b,_,i.COLOR_ATTACHMENT0,nt,ht);else $(U.__webglFramebuffer,b,_,i.COLOR_ATTACHMENT0,nt,0);d(_)&&u(nt),e.unbindTexture()}b.depthBuffer&&Tt(b)}function Yt(b){let _=b.textures;for(let U=0,q=_.length;U<q;U++){let Z=_[U];if(d(Z)){let X=b.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:i.TEXTURE_2D,_t=n.get(Z).__webglTexture;e.bindTexture(X,_t),u(X),e.unbindTexture()}}}let Nt=[],T=[];function xe(b){if(b.samples>0){if(Ot(b)===!1){let _=b.textures,U=b.width,q=b.height,Z=i.COLOR_BUFFER_BIT,X=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,_t=n.get(b),nt=_.length>1;if(nt)for(let ht=0;ht<_.length;ht++)e.bindFramebuffer(i.FRAMEBUFFER,_t.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ht,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,_t.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ht,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,_t.__webglMultisampledFramebuffer),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,_t.__webglFramebuffer);for(let ht=0;ht<_.length;ht++){if(b.resolveDepthBuffer&&(b.depthBuffer&&(Z|=i.DEPTH_BUFFER_BIT),b.stencilBuffer&&b.resolveStencilBuffer&&(Z|=i.STENCIL_BUFFER_BIT)),nt){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,_t.__webglColorRenderbuffer[ht]);let Bt=n.get(_[ht]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Bt,0)}i.blitFramebuffer(0,0,U,q,0,0,U,q,Z,i.NEAREST),l===!0&&(Nt.length=0,T.length=0,Nt.push(i.COLOR_ATTACHMENT0+ht),b.depthBuffer&&b.resolveDepthBuffer===!1&&(Nt.push(X),T.push(X),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,T)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Nt))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),nt)for(let ht=0;ht<_.length;ht++){e.bindFramebuffer(i.FRAMEBUFFER,_t.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ht,i.RENDERBUFFER,_t.__webglColorRenderbuffer[ht]);let Bt=n.get(_[ht]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,_t.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ht,i.TEXTURE_2D,Bt,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,_t.__webglMultisampledFramebuffer)}else if(b.depthBuffer&&b.resolveDepthBuffer===!1&&l){let _=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[_])}}}function Lt(b){return Math.min(s.maxSamples,b.samples)}function Ot(b){let _=n.get(b);return b.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&_.__useRenderToTexture!==!1}function bt(b){let _=a.render.frame;h.get(b)!==_&&(h.set(b,_),b.update())}function $t(b,_){let U=b.colorSpace,q=b.format,Z=b.type;return b.isCompressedTexture===!0||b.isVideoTexture===!0||U!==gn&&U!==cn&&(Wt.getTransfer(U)===Qt?(q!==Fe||Z!==je)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",U)),_}function At(b){return typeof HTMLImageElement<"u"&&b instanceof HTMLImageElement?(c.width=b.naturalWidth||b.width,c.height=b.naturalHeight||b.height):typeof VideoFrame<"u"&&b instanceof VideoFrame?(c.width=b.displayWidth,c.height=b.displayHeight):(c.width=b.width,c.height=b.height),c}this.allocateTextureUnit=H,this.resetTextureUnits=y,this.setTexture2D=G,this.setTexture2DArray=J,this.setTexture3D=B,this.setTextureCube=Q,this.rebindTextures=Mt,this.setupRenderTarget=Dt,this.updateRenderTargetMipmap=Yt,this.updateMultisampleRenderTarget=xe,this.setupDepthRenderbuffer=Tt,this.setupFrameBufferTexture=$,this.useMultisampledRTT=Ot}function ep(i,t){function e(n,s=cn){let r,a=Wt.getTransfer(s);if(n===je)return i.UNSIGNED_BYTE;if(n===Ia)return i.UNSIGNED_SHORT_4_4_4_4;if(n===La)return i.UNSIGNED_SHORT_5_5_5_1;if(n===jo)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Ko)return i.BYTE;if(n===Qo)return i.SHORT;if(n===yi)return i.UNSIGNED_SHORT;if(n===Pa)return i.INT;if(n===Pn)return i.UNSIGNED_INT;if(n===$e)return i.FLOAT;if(n===bi)return i.HALF_FLOAT;if(n===tl)return i.ALPHA;if(n===el)return i.RGB;if(n===Fe)return i.RGBA;if(n===nl)return i.LUMINANCE;if(n===il)return i.LUMINANCE_ALPHA;if(n===ti)return i.DEPTH_COMPONENT;if(n===oi)return i.DEPTH_STENCIL;if(n===sl)return i.RED;if(n===Ua)return i.RED_INTEGER;if(n===rl)return i.RG;if(n===Da)return i.RG_INTEGER;if(n===Na)return i.RGBA_INTEGER;if(n===Ji||n===$i||n===Ki||n===Qi)if(a===Qt)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Ji)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===$i)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Ki)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Qi)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Ji)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===$i)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Ki)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Qi)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===wr||n===Ar||n===Tr||n===Rr)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===wr)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Ar)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Tr)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Rr)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Cr||n===Pr||n===Ir)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Cr||n===Pr)return a===Qt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Ir)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===Lr||n===Ur||n===Dr||n===Nr||n===Fr||n===Or||n===Br||n===zr||n===kr||n===Vr||n===Hr||n===Gr||n===Wr||n===Xr)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Lr)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Ur)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Dr)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Nr)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Fr)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Or)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Br)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===zr)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===kr)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Vr)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Hr)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Gr)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Wr)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Xr)return a===Qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===ji||n===qr||n===Yr)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===ji)return a===Qt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===qr)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Yr)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===al||n===Zr||n===Jr||n===$r)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===ji)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Zr)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Jr)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===$r)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===ai?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}var pa=class extends ue{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}},hn=class extends Pe{constructor(){super(),this.isGroup=!0,this.type="Group"}},np={type:"move"},vi=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new hn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new hn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new L,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new L),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new hn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new L,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new L),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){a=!0;for(let M of t.hand.values()){let d=e.getJointPose(M,n),u=this._getHandJoint(c,M);d!==null&&(u.matrix.fromArray(d.transform.matrix),u.matrix.decompose(u.position,u.rotation,u.scale),u.matrixWorldNeedsUpdate=!0,u.jointRadius=d.radius),u.visible=d!==null}let h=c.joints["index-finger-tip"],p=c.joints["thumb-tip"],f=h.position.distanceTo(p.position),m=.02,x=.005;c.inputState.pinching&&f>m+x?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&f<=m-x&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(np)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let n=new hn;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}},ip=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,sp=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,ma=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){let s=new Ee,r=t.properties.get(s);r.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}getMesh(t){if(this.texture!==null&&this.mesh===null){let e=t.cameras[0].viewport,n=new ke({vertexShader:ip,fragmentShader:sp,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new be(new ms(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},ga=class extends pn{constructor(t,e){super();let n=this,s=null,r=1,a=null,o="local-floor",l=1,c=null,h=null,p=null,f=null,m=null,x=null,M=new ma,d=e.getContextAttributes(),u=null,E=null,S=[],w=[],F=new Vt,R=null,A=new ue;A.layers.enable(1),A.viewport=new Zt;let O=new ue;O.layers.enable(2),O.viewport=new Zt;let tt=[A,O],g=new pa;g.layers.enable(1),g.layers.enable(2);let y=null,H=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(W){let $=S[W];return $===void 0&&($=new vi,S[W]=$),$.getTargetRaySpace()},this.getControllerGrip=function(W){let $=S[W];return $===void 0&&($=new vi,S[W]=$),$.getGripSpace()},this.getHand=function(W){let $=S[W];return $===void 0&&($=new vi,S[W]=$),$.getHandSpace()};function z(W){let $=w.indexOf(W.inputSource);if($===-1)return;let pt=S[$];pt!==void 0&&(pt.update(W.inputSource,W.frame,c||a),pt.dispatchEvent({type:W.type,data:W.inputSource}))}function G(){s.removeEventListener("select",z),s.removeEventListener("selectstart",z),s.removeEventListener("selectend",z),s.removeEventListener("squeeze",z),s.removeEventListener("squeezestart",z),s.removeEventListener("squeezeend",z),s.removeEventListener("end",G),s.removeEventListener("inputsourceschange",J);for(let W=0;W<S.length;W++){let $=w[W];$!==null&&(w[W]=null,S[W].disconnect($))}y=null,H=null,M.reset(),t.setRenderTarget(u),m=null,f=null,p=null,s=null,E=null,Xt.stop(),n.isPresenting=!1,t.setPixelRatio(R),t.setSize(F.width,F.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(W){r=W,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(W){o=W,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(W){c=W},this.getBaseLayer=function(){return f!==null?f:m},this.getBinding=function(){return p},this.getFrame=function(){return x},this.getSession=function(){return s},this.setSession=async function(W){if(s=W,s!==null){if(u=t.getRenderTarget(),s.addEventListener("select",z),s.addEventListener("selectstart",z),s.addEventListener("selectend",z),s.addEventListener("squeeze",z),s.addEventListener("squeezestart",z),s.addEventListener("squeezeend",z),s.addEventListener("end",G),s.addEventListener("inputsourceschange",J),d.xrCompatible!==!0&&await e.makeXRCompatible(),R=t.getPixelRatio(),t.getSize(F),s.renderState.layers===void 0){let $={antialias:d.antialias,alpha:!0,depth:d.depth,stencil:d.stencil,framebufferScaleFactor:r};m=new XRWebGLLayer(s,e,$),s.updateRenderState({baseLayer:m}),t.setPixelRatio(1),t.setSize(m.framebufferWidth,m.framebufferHeight,!1),E=new tn(m.framebufferWidth,m.framebufferHeight,{format:Fe,type:je,colorSpace:t.outputColorSpace,stencilBuffer:d.stencil})}else{let $=null,pt=null,ct=null;d.depth&&(ct=d.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,$=d.stencil?oi:ti,pt=d.stencil?ai:Pn);let Tt={colorFormat:e.RGBA8,depthFormat:ct,scaleFactor:r};p=new XRWebGLBinding(s,e),f=p.createProjectionLayer(Tt),s.updateRenderState({layers:[f]}),t.setPixelRatio(1),t.setSize(f.textureWidth,f.textureHeight,!1),E=new tn(f.textureWidth,f.textureHeight,{format:Fe,type:je,depthTexture:new _s(f.textureWidth,f.textureHeight,pt,void 0,void 0,void 0,void 0,void 0,void 0,$),stencilBuffer:d.stencil,colorSpace:t.outputColorSpace,samples:d.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1})}E.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await s.requestReferenceSpace(o),Xt.setContext(s),Xt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return M.getDepthTexture()};function J(W){for(let $=0;$<W.removed.length;$++){let pt=W.removed[$],ct=w.indexOf(pt);ct>=0&&(w[ct]=null,S[ct].disconnect(pt))}for(let $=0;$<W.added.length;$++){let pt=W.added[$],ct=w.indexOf(pt);if(ct===-1){for(let Mt=0;Mt<S.length;Mt++)if(Mt>=w.length){w.push(pt),ct=Mt;break}else if(w[Mt]===null){w[Mt]=pt,ct=Mt;break}if(ct===-1)break}let Tt=S[ct];Tt&&Tt.connect(pt)}}let B=new L,Q=new L;function V(W,$,pt){B.setFromMatrixPosition($.matrixWorld),Q.setFromMatrixPosition(pt.matrixWorld);let ct=B.distanceTo(Q),Tt=$.projectionMatrix.elements,Mt=pt.projectionMatrix.elements,Dt=Tt[14]/(Tt[10]-1),Yt=Tt[14]/(Tt[10]+1),Nt=(Tt[9]+1)/Tt[5],T=(Tt[9]-1)/Tt[5],xe=(Tt[8]-1)/Tt[0],Lt=(Mt[8]+1)/Mt[0],Ot=Dt*xe,bt=Dt*Lt,$t=ct/(-xe+Lt),At=$t*-xe;if($.matrixWorld.decompose(W.position,W.quaternion,W.scale),W.translateX(At),W.translateZ($t),W.matrixWorld.compose(W.position,W.quaternion,W.scale),W.matrixWorldInverse.copy(W.matrixWorld).invert(),Tt[10]===-1)W.projectionMatrix.copy($.projectionMatrix),W.projectionMatrixInverse.copy($.projectionMatrixInverse);else{let b=Dt+$t,_=Yt+$t,U=Ot-At,q=bt+(ct-At),Z=Nt*Yt/_*b,X=T*Yt/_*b;W.projectionMatrix.makePerspective(U,q,Z,X,b,_),W.projectionMatrixInverse.copy(W.projectionMatrix).invert()}}function ot(W,$){$===null?W.matrixWorld.copy(W.matrix):W.matrixWorld.multiplyMatrices($.matrixWorld,W.matrix),W.matrixWorldInverse.copy(W.matrixWorld).invert()}this.updateCamera=function(W){if(s===null)return;let $=W.near,pt=W.far;M.texture!==null&&(M.depthNear>0&&($=M.depthNear),M.depthFar>0&&(pt=M.depthFar)),g.near=O.near=A.near=$,g.far=O.far=A.far=pt,(y!==g.near||H!==g.far)&&(s.updateRenderState({depthNear:g.near,depthFar:g.far}),y=g.near,H=g.far);let ct=W.parent,Tt=g.cameras;ot(g,ct);for(let Mt=0;Mt<Tt.length;Mt++)ot(Tt[Mt],ct);Tt.length===2?V(g,A,O):g.projectionMatrix.copy(A.projectionMatrix),lt(W,g,ct)};function lt(W,$,pt){pt===null?W.matrix.copy($.matrixWorld):(W.matrix.copy(pt.matrixWorld),W.matrix.invert(),W.matrix.multiply($.matrixWorld)),W.matrix.decompose(W.position,W.quaternion,W.scale),W.updateMatrixWorld(!0),W.projectionMatrix.copy($.projectionMatrix),W.projectionMatrixInverse.copy($.projectionMatrixInverse),W.isPerspectiveCamera&&(W.fov=Qr*2*Math.atan(1/W.projectionMatrix.elements[5]),W.zoom=1)}this.getCamera=function(){return g},this.getFoveation=function(){if(!(f===null&&m===null))return l},this.setFoveation=function(W){l=W,f!==null&&(f.fixedFoveation=W),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=W)},this.hasDepthSensing=function(){return M.texture!==null},this.getDepthSensingMesh=function(){return M.getMesh(g)};let gt=null;function zt(W,$){if(h=$.getViewerPose(c||a),x=$,h!==null){let pt=h.views;m!==null&&(t.setRenderTargetFramebuffer(E,m.framebuffer),t.setRenderTarget(E));let ct=!1;pt.length!==g.cameras.length&&(g.cameras.length=0,ct=!0);for(let Mt=0;Mt<pt.length;Mt++){let Dt=pt[Mt],Yt=null;if(m!==null)Yt=m.getViewport(Dt);else{let T=p.getViewSubImage(f,Dt);Yt=T.viewport,Mt===0&&(t.setRenderTargetTextures(E,T.colorTexture,f.ignoreDepthValues?void 0:T.depthStencilTexture),t.setRenderTarget(E))}let Nt=tt[Mt];Nt===void 0&&(Nt=new ue,Nt.layers.enable(Mt),Nt.viewport=new Zt,tt[Mt]=Nt),Nt.matrix.fromArray(Dt.transform.matrix),Nt.matrix.decompose(Nt.position,Nt.quaternion,Nt.scale),Nt.projectionMatrix.fromArray(Dt.projectionMatrix),Nt.projectionMatrixInverse.copy(Nt.projectionMatrix).invert(),Nt.viewport.set(Yt.x,Yt.y,Yt.width,Yt.height),Mt===0&&(g.matrix.copy(Nt.matrix),g.matrix.decompose(g.position,g.quaternion,g.scale)),ct===!0&&g.cameras.push(Nt)}let Tt=s.enabledFeatures;if(Tt&&Tt.includes("depth-sensing")){let Mt=p.getDepthInformation(pt[0]);Mt&&Mt.isValid&&Mt.texture&&M.init(t,Mt,s.renderState)}}for(let pt=0;pt<S.length;pt++){let ct=w[pt],Tt=S[pt];ct!==null&&Tt!==void 0&&Tt.update(ct,$,c||a)}gt&&gt(W,$),$.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:$}),x=null}let Xt=new dl;Xt.setAnimationLoop(zt),this.setAnimationLoop=function(W){gt=W},this.dispose=function(){}}},bn=new ze,rp=new ee;function ap(i,t){function e(d,u){d.matrixAutoUpdate===!0&&d.updateMatrix(),u.value.copy(d.matrix)}function n(d,u){u.color.getRGB(d.fogColor.value,ul(i)),u.isFog?(d.fogNear.value=u.near,d.fogFar.value=u.far):u.isFogExp2&&(d.fogDensity.value=u.density)}function s(d,u,E,S,w){u.isMeshBasicMaterial||u.isMeshLambertMaterial?r(d,u):u.isMeshToonMaterial?(r(d,u),p(d,u)):u.isMeshPhongMaterial?(r(d,u),h(d,u)):u.isMeshStandardMaterial?(r(d,u),f(d,u),u.isMeshPhysicalMaterial&&m(d,u,w)):u.isMeshMatcapMaterial?(r(d,u),x(d,u)):u.isMeshDepthMaterial?r(d,u):u.isMeshDistanceMaterial?(r(d,u),M(d,u)):u.isMeshNormalMaterial?r(d,u):u.isLineBasicMaterial?(a(d,u),u.isLineDashedMaterial&&o(d,u)):u.isPointsMaterial?l(d,u,E,S):u.isSpriteMaterial?c(d,u):u.isShadowMaterial?(d.color.value.copy(u.color),d.opacity.value=u.opacity):u.isShaderMaterial&&(u.uniformsNeedUpdate=!1)}function r(d,u){d.opacity.value=u.opacity,u.color&&d.diffuse.value.copy(u.color),u.emissive&&d.emissive.value.copy(u.emissive).multiplyScalar(u.emissiveIntensity),u.map&&(d.map.value=u.map,e(u.map,d.mapTransform)),u.alphaMap&&(d.alphaMap.value=u.alphaMap,e(u.alphaMap,d.alphaMapTransform)),u.bumpMap&&(d.bumpMap.value=u.bumpMap,e(u.bumpMap,d.bumpMapTransform),d.bumpScale.value=u.bumpScale,u.side===_e&&(d.bumpScale.value*=-1)),u.normalMap&&(d.normalMap.value=u.normalMap,e(u.normalMap,d.normalMapTransform),d.normalScale.value.copy(u.normalScale),u.side===_e&&d.normalScale.value.negate()),u.displacementMap&&(d.displacementMap.value=u.displacementMap,e(u.displacementMap,d.displacementMapTransform),d.displacementScale.value=u.displacementScale,d.displacementBias.value=u.displacementBias),u.emissiveMap&&(d.emissiveMap.value=u.emissiveMap,e(u.emissiveMap,d.emissiveMapTransform)),u.specularMap&&(d.specularMap.value=u.specularMap,e(u.specularMap,d.specularMapTransform)),u.alphaTest>0&&(d.alphaTest.value=u.alphaTest);let E=t.get(u),S=E.envMap,w=E.envMapRotation;S&&(d.envMap.value=S,bn.copy(w),bn.x*=-1,bn.y*=-1,bn.z*=-1,S.isCubeTexture&&S.isRenderTargetTexture===!1&&(bn.y*=-1,bn.z*=-1),d.envMapRotation.value.setFromMatrix4(rp.makeRotationFromEuler(bn)),d.flipEnvMap.value=S.isCubeTexture&&S.isRenderTargetTexture===!1?-1:1,d.reflectivity.value=u.reflectivity,d.ior.value=u.ior,d.refractionRatio.value=u.refractionRatio),u.lightMap&&(d.lightMap.value=u.lightMap,d.lightMapIntensity.value=u.lightMapIntensity,e(u.lightMap,d.lightMapTransform)),u.aoMap&&(d.aoMap.value=u.aoMap,d.aoMapIntensity.value=u.aoMapIntensity,e(u.aoMap,d.aoMapTransform))}function a(d,u){d.diffuse.value.copy(u.color),d.opacity.value=u.opacity,u.map&&(d.map.value=u.map,e(u.map,d.mapTransform))}function o(d,u){d.dashSize.value=u.dashSize,d.totalSize.value=u.dashSize+u.gapSize,d.scale.value=u.scale}function l(d,u,E,S){d.diffuse.value.copy(u.color),d.opacity.value=u.opacity,d.size.value=u.size*E,d.scale.value=S*.5,u.map&&(d.map.value=u.map,e(u.map,d.uvTransform)),u.alphaMap&&(d.alphaMap.value=u.alphaMap,e(u.alphaMap,d.alphaMapTransform)),u.alphaTest>0&&(d.alphaTest.value=u.alphaTest)}function c(d,u){d.diffuse.value.copy(u.color),d.opacity.value=u.opacity,d.rotation.value=u.rotation,u.map&&(d.map.value=u.map,e(u.map,d.mapTransform)),u.alphaMap&&(d.alphaMap.value=u.alphaMap,e(u.alphaMap,d.alphaMapTransform)),u.alphaTest>0&&(d.alphaTest.value=u.alphaTest)}function h(d,u){d.specular.value.copy(u.specular),d.shininess.value=Math.max(u.shininess,1e-4)}function p(d,u){u.gradientMap&&(d.gradientMap.value=u.gradientMap)}function f(d,u){d.metalness.value=u.metalness,u.metalnessMap&&(d.metalnessMap.value=u.metalnessMap,e(u.metalnessMap,d.metalnessMapTransform)),d.roughness.value=u.roughness,u.roughnessMap&&(d.roughnessMap.value=u.roughnessMap,e(u.roughnessMap,d.roughnessMapTransform)),u.envMap&&(d.envMapIntensity.value=u.envMapIntensity)}function m(d,u,E){d.ior.value=u.ior,u.sheen>0&&(d.sheenColor.value.copy(u.sheenColor).multiplyScalar(u.sheen),d.sheenRoughness.value=u.sheenRoughness,u.sheenColorMap&&(d.sheenColorMap.value=u.sheenColorMap,e(u.sheenColorMap,d.sheenColorMapTransform)),u.sheenRoughnessMap&&(d.sheenRoughnessMap.value=u.sheenRoughnessMap,e(u.sheenRoughnessMap,d.sheenRoughnessMapTransform))),u.clearcoat>0&&(d.clearcoat.value=u.clearcoat,d.clearcoatRoughness.value=u.clearcoatRoughness,u.clearcoatMap&&(d.clearcoatMap.value=u.clearcoatMap,e(u.clearcoatMap,d.clearcoatMapTransform)),u.clearcoatRoughnessMap&&(d.clearcoatRoughnessMap.value=u.clearcoatRoughnessMap,e(u.clearcoatRoughnessMap,d.clearcoatRoughnessMapTransform)),u.clearcoatNormalMap&&(d.clearcoatNormalMap.value=u.clearcoatNormalMap,e(u.clearcoatNormalMap,d.clearcoatNormalMapTransform),d.clearcoatNormalScale.value.copy(u.clearcoatNormalScale),u.side===_e&&d.clearcoatNormalScale.value.negate())),u.dispersion>0&&(d.dispersion.value=u.dispersion),u.iridescence>0&&(d.iridescence.value=u.iridescence,d.iridescenceIOR.value=u.iridescenceIOR,d.iridescenceThicknessMinimum.value=u.iridescenceThicknessRange[0],d.iridescenceThicknessMaximum.value=u.iridescenceThicknessRange[1],u.iridescenceMap&&(d.iridescenceMap.value=u.iridescenceMap,e(u.iridescenceMap,d.iridescenceMapTransform)),u.iridescenceThicknessMap&&(d.iridescenceThicknessMap.value=u.iridescenceThicknessMap,e(u.iridescenceThicknessMap,d.iridescenceThicknessMapTransform))),u.transmission>0&&(d.transmission.value=u.transmission,d.transmissionSamplerMap.value=E.texture,d.transmissionSamplerSize.value.set(E.width,E.height),u.transmissionMap&&(d.transmissionMap.value=u.transmissionMap,e(u.transmissionMap,d.transmissionMapTransform)),d.thickness.value=u.thickness,u.thicknessMap&&(d.thicknessMap.value=u.thicknessMap,e(u.thicknessMap,d.thicknessMapTransform)),d.attenuationDistance.value=u.attenuationDistance,d.attenuationColor.value.copy(u.attenuationColor)),u.anisotropy>0&&(d.anisotropyVector.value.set(u.anisotropy*Math.cos(u.anisotropyRotation),u.anisotropy*Math.sin(u.anisotropyRotation)),u.anisotropyMap&&(d.anisotropyMap.value=u.anisotropyMap,e(u.anisotropyMap,d.anisotropyMapTransform))),d.specularIntensity.value=u.specularIntensity,d.specularColor.value.copy(u.specularColor),u.specularColorMap&&(d.specularColorMap.value=u.specularColorMap,e(u.specularColorMap,d.specularColorMapTransform)),u.specularIntensityMap&&(d.specularIntensityMap.value=u.specularIntensityMap,e(u.specularIntensityMap,d.specularIntensityMapTransform))}function x(d,u){u.matcap&&(d.matcap.value=u.matcap)}function M(d,u){let E=t.get(u).light;d.referencePosition.value.setFromMatrixPosition(E.matrixWorld),d.nearDistance.value=E.shadow.camera.near,d.farDistance.value=E.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function op(i,t,e,n){let s={},r={},a=[],o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(E,S){let w=S.program;n.uniformBlockBinding(E,w)}function c(E,S){let w=s[E.id];w===void 0&&(x(E),w=h(E),s[E.id]=w,E.addEventListener("dispose",d));let F=S.program;n.updateUBOMapping(E,F);let R=t.render.frame;r[E.id]!==R&&(f(E),r[E.id]=R)}function h(E){let S=p();E.__bindingPointIndex=S;let w=i.createBuffer(),F=E.__size,R=E.usage;return i.bindBuffer(i.UNIFORM_BUFFER,w),i.bufferData(i.UNIFORM_BUFFER,F,R),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,S,w),w}function p(){for(let E=0;E<o;E++)if(a.indexOf(E)===-1)return a.push(E),E;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(E){let S=s[E.id],w=E.uniforms,F=E.__cache;i.bindBuffer(i.UNIFORM_BUFFER,S);for(let R=0,A=w.length;R<A;R++){let O=Array.isArray(w[R])?w[R]:[w[R]];for(let tt=0,g=O.length;tt<g;tt++){let y=O[tt];if(m(y,R,tt,F)===!0){let H=y.__offset,z=Array.isArray(y.value)?y.value:[y.value],G=0;for(let J=0;J<z.length;J++){let B=z[J],Q=M(B);typeof B=="number"||typeof B=="boolean"?(y.__data[0]=B,i.bufferSubData(i.UNIFORM_BUFFER,H+G,y.__data)):B.isMatrix3?(y.__data[0]=B.elements[0],y.__data[1]=B.elements[1],y.__data[2]=B.elements[2],y.__data[3]=0,y.__data[4]=B.elements[3],y.__data[5]=B.elements[4],y.__data[6]=B.elements[5],y.__data[7]=0,y.__data[8]=B.elements[6],y.__data[9]=B.elements[7],y.__data[10]=B.elements[8],y.__data[11]=0):(B.toArray(y.__data,G),G+=Q.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,H,y.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function m(E,S,w,F){let R=E.value,A=S+"_"+w;if(F[A]===void 0)return typeof R=="number"||typeof R=="boolean"?F[A]=R:F[A]=R.clone(),!0;{let O=F[A];if(typeof R=="number"||typeof R=="boolean"){if(O!==R)return F[A]=R,!0}else if(O.equals(R)===!1)return O.copy(R),!0}return!1}function x(E){let S=E.uniforms,w=0,F=16;for(let A=0,O=S.length;A<O;A++){let tt=Array.isArray(S[A])?S[A]:[S[A]];for(let g=0,y=tt.length;g<y;g++){let H=tt[g],z=Array.isArray(H.value)?H.value:[H.value];for(let G=0,J=z.length;G<J;G++){let B=z[G],Q=M(B),V=w%F,ot=V%Q.boundary,lt=V+ot;w+=ot,lt!==0&&F-lt<Q.storage&&(w+=F-lt),H.__data=new Float32Array(Q.storage/Float32Array.BYTES_PER_ELEMENT),H.__offset=w,w+=Q.storage}}}let R=w%F;return R>0&&(w+=F-R),E.__size=w,E.__cache={},this}function M(E){let S={boundary:0,storage:0};return typeof E=="number"||typeof E=="boolean"?(S.boundary=4,S.storage=4):E.isVector2?(S.boundary=8,S.storage=8):E.isVector3||E.isColor?(S.boundary=16,S.storage=12):E.isVector4?(S.boundary=16,S.storage=16):E.isMatrix3?(S.boundary=48,S.storage=48):E.isMatrix4?(S.boundary=64,S.storage=64):E.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",E),S}function d(E){let S=E.target;S.removeEventListener("dispose",d);let w=a.indexOf(S.__bindingPointIndex);a.splice(w,1),i.deleteBuffer(s[S.id]),delete s[S.id],delete r[S.id]}function u(){for(let E in s)i.deleteBuffer(s[E]);a=[],s={},r={}}return{bind:l,update:c,dispose:u}}var xs=class{constructor(t={}){let{canvas:e=cc(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:p=!1}=t;this.isWebGLRenderer=!0;let f;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");f=n.getContextAttributes().alpha}else f=a;let m=new Uint32Array(4),x=new Int32Array(4),M=null,d=null,u=[],E=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Te,this.toneMapping=dn,this.toneMappingExposure=1;let S=this,w=!1,F=0,R=0,A=null,O=-1,tt=null,g=new Zt,y=new Zt,H=null,z=new It(0),G=0,J=e.width,B=e.height,Q=1,V=null,ot=null,lt=new Zt(0,0,J,B),gt=new Zt(0,0,J,B),zt=!1,Xt=new Si,W=!1,$=!1,pt=new ee,ct=new ee,Tt=new L,Mt=new Zt,Dt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Yt=!1;function Nt(){return A===null?Q:1}let T=n;function xe(v,P){return e.getContext(v,P)}try{let v={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:p};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Ca}`),e.addEventListener("webglcontextlost",Y,!1),e.addEventListener("webglcontextrestored",it,!1),e.addEventListener("webglcontextcreationerror",at,!1),T===null){let P="webgl2";if(T=xe(P,v),T===null)throw xe(P)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(v){throw console.error("THREE.WebGLRenderer: "+v.message),v}let Lt,Ot,bt,$t,At,b,_,U,q,Z,X,_t,nt,ht,Bt,K,ut,Et,wt,dt,Ut,Rt,Jt,C;function rt(){Lt=new Sd(T),Lt.init(),Rt=new ep(T,Lt),Ot=new gd(T,Lt,t,Rt),bt=new Qf(T),Ot.reverseDepthBuffer&&bt.buffers.depth.setReversed(!0),$t=new wd(T),At=new zf,b=new tp(T,Lt,bt,At,Ot,Rt,$t),_=new xd(S),U=new Md(S),q=new Lc(T),Jt=new pd(T,q),Z=new bd(T,q,$t,Jt),X=new Td(T,Z,q,$t),wt=new Ad(T,Ot,b),K=new _d(At),_t=new Bf(S,_,U,Lt,Ot,Jt,K),nt=new ap(S,At),ht=new Vf,Bt=new Yf(Lt),Et=new fd(S,_,U,bt,X,f,l),ut=new $f(S,X,Ot),C=new op(T,$t,Ot,bt),dt=new md(T,Lt,$t),Ut=new Ed(T,Lt,$t),$t.programs=_t.programs,S.capabilities=Ot,S.extensions=Lt,S.properties=At,S.renderLists=ht,S.shadowMap=ut,S.state=bt,S.info=$t}rt();let k=new ga(S,T);this.xr=k,this.getContext=function(){return T},this.getContextAttributes=function(){return T.getContextAttributes()},this.forceContextLoss=function(){let v=Lt.get("WEBGL_lose_context");v&&v.loseContext()},this.forceContextRestore=function(){let v=Lt.get("WEBGL_lose_context");v&&v.restoreContext()},this.getPixelRatio=function(){return Q},this.setPixelRatio=function(v){v!==void 0&&(Q=v,this.setSize(J,B,!1))},this.getSize=function(v){return v.set(J,B)},this.setSize=function(v,P,D=!0){if(k.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}J=v,B=P,e.width=Math.floor(v*Q),e.height=Math.floor(P*Q),D===!0&&(e.style.width=v+"px",e.style.height=P+"px"),this.setViewport(0,0,v,P)},this.getDrawingBufferSize=function(v){return v.set(J*Q,B*Q).floor()},this.setDrawingBufferSize=function(v,P,D){J=v,B=P,Q=D,e.width=Math.floor(v*D),e.height=Math.floor(P*D),this.setViewport(0,0,v,P)},this.getCurrentViewport=function(v){return v.copy(g)},this.getViewport=function(v){return v.copy(lt)},this.setViewport=function(v,P,D,N){v.isVector4?lt.set(v.x,v.y,v.z,v.w):lt.set(v,P,D,N),bt.viewport(g.copy(lt).multiplyScalar(Q).round())},this.getScissor=function(v){return v.copy(gt)},this.setScissor=function(v,P,D,N){v.isVector4?gt.set(v.x,v.y,v.z,v.w):gt.set(v,P,D,N),bt.scissor(y.copy(gt).multiplyScalar(Q).round())},this.getScissorTest=function(){return zt},this.setScissorTest=function(v){bt.setScissorTest(zt=v)},this.setOpaqueSort=function(v){V=v},this.setTransparentSort=function(v){ot=v},this.getClearColor=function(v){return v.copy(Et.getClearColor())},this.setClearColor=function(){Et.setClearColor.apply(Et,arguments)},this.getClearAlpha=function(){return Et.getClearAlpha()},this.setClearAlpha=function(){Et.setClearAlpha.apply(Et,arguments)},this.clear=function(v=!0,P=!0,D=!0){let N=0;if(v){let I=!1;if(A!==null){let j=A.texture.format;I=j===Na||j===Da||j===Ua}if(I){let j=A.texture.type,st=j===je||j===Pn||j===yi||j===ai||j===Ia||j===La,ft=Et.getClearColor(),mt=Et.getClearAlpha(),yt=ft.r,St=ft.g,xt=ft.b;st?(m[0]=yt,m[1]=St,m[2]=xt,m[3]=mt,T.clearBufferuiv(T.COLOR,0,m)):(x[0]=yt,x[1]=St,x[2]=xt,x[3]=mt,T.clearBufferiv(T.COLOR,0,x))}else N|=T.COLOR_BUFFER_BIT}P&&(N|=T.DEPTH_BUFFER_BIT,T.clearDepth(this.capabilities.reverseDepthBuffer?0:1)),D&&(N|=T.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),T.clear(N)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",Y,!1),e.removeEventListener("webglcontextrestored",it,!1),e.removeEventListener("webglcontextcreationerror",at,!1),ht.dispose(),Bt.dispose(),At.dispose(),_.dispose(),U.dispose(),X.dispose(),Jt.dispose(),C.dispose(),_t.dispose(),k.dispose(),k.removeEventListener("sessionstart",ka),k.removeEventListener("sessionend",Va),_n.stop()};function Y(v){v.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),w=!0}function it(){console.log("THREE.WebGLRenderer: Context Restored."),w=!1;let v=$t.autoReset,P=ut.enabled,D=ut.autoUpdate,N=ut.needsUpdate,I=ut.type;rt(),$t.autoReset=v,ut.enabled=P,ut.autoUpdate=D,ut.needsUpdate=N,ut.type=I}function at(v){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",v.statusMessage)}function Ft(v){let P=v.target;P.removeEventListener("dispose",Ft),ie(P)}function ie(v){fe(v),At.remove(v)}function fe(v){let P=At.get(v).programs;P!==void 0&&(P.forEach(function(D){_t.releaseProgram(D)}),v.isShaderMaterial&&_t.releaseShaderCache(v))}this.renderBufferDirect=function(v,P,D,N,I,j){P===null&&(P=Dt);let st=I.isMesh&&I.matrixWorld.determinant()<0,ft=_l(v,P,D,N,I);bt.setMaterial(N,st);let mt=D.index,yt=1;if(N.wireframe===!0){if(mt=Z.getWireframeAttribute(D),mt===void 0)return;yt=2}let St=D.drawRange,xt=D.attributes.position,qt=St.start*yt,Kt=(St.start+St.count)*yt;j!==null&&(qt=Math.max(qt,j.start*yt),Kt=Math.min(Kt,(j.start+j.count)*yt)),mt!==null?(qt=Math.max(qt,0),Kt=Math.min(Kt,mt.count)):xt!=null&&(qt=Math.max(qt,0),Kt=Math.min(Kt,xt.count));let te=Kt-qt;if(te<0||te===1/0)return;Jt.setup(I,N,ft,D,mt);let ve,Ht=dt;if(mt!==null&&(ve=q.get(mt),Ht=Ut,Ht.setIndex(ve)),I.isMesh)N.wireframe===!0?(bt.setLineWidth(N.wireframeLinewidth*Nt()),Ht.setMode(T.LINES)):Ht.setMode(T.TRIANGLES);else if(I.isLine){let vt=N.linewidth;vt===void 0&&(vt=1),bt.setLineWidth(vt*Nt()),I.isLineSegments?Ht.setMode(T.LINES):I.isLineLoop?Ht.setMode(T.LINE_LOOP):Ht.setMode(T.LINE_STRIP)}else I.isPoints?Ht.setMode(T.POINTS):I.isSprite&&Ht.setMode(T.TRIANGLES);if(I.isBatchedMesh)if(I._multiDrawInstances!==null)Ht.renderMultiDrawInstances(I._multiDrawStarts,I._multiDrawCounts,I._multiDrawCount,I._multiDrawInstances);else if(Lt.get("WEBGL_multi_draw"))Ht.renderMultiDraw(I._multiDrawStarts,I._multiDrawCounts,I._multiDrawCount);else{let vt=I._multiDrawStarts,le=I._multiDrawCounts,Gt=I._multiDrawCount,Ie=mt?q.get(mt).bytesPerElement:1,On=At.get(N).currentProgram.getUniforms();for(let ye=0;ye<Gt;ye++)On.setValue(T,"_gl_DrawID",ye),Ht.render(vt[ye]/Ie,le[ye])}else if(I.isInstancedMesh)Ht.renderInstances(qt,te,I.count);else if(D.isInstancedBufferGeometry){let vt=D._maxInstanceCount!==void 0?D._maxInstanceCount:1/0,le=Math.min(D.instanceCount,vt);Ht.renderInstances(qt,te,le)}else Ht.render(qt,te)};function kt(v,P,D){v.transparent===!0&&v.side===Je&&v.forceSinglePass===!1?(v.side=_e,v.needsUpdate=!0,Ai(v,P,D),v.side=fn,v.needsUpdate=!0,Ai(v,P,D),v.side=Je):Ai(v,P,D)}this.compile=function(v,P,D=null){D===null&&(D=v),d=Bt.get(D),d.init(P),E.push(d),D.traverseVisible(function(I){I.isLight&&I.layers.test(P.layers)&&(d.pushLight(I),I.castShadow&&d.pushShadow(I))}),v!==D&&v.traverseVisible(function(I){I.isLight&&I.layers.test(P.layers)&&(d.pushLight(I),I.castShadow&&d.pushShadow(I))}),d.setupLights();let N=new Set;return v.traverse(function(I){if(!(I.isMesh||I.isPoints||I.isLine||I.isSprite))return;let j=I.material;if(j)if(Array.isArray(j))for(let st=0;st<j.length;st++){let ft=j[st];kt(ft,D,I),N.add(ft)}else kt(j,D,I),N.add(j)}),E.pop(),d=null,N},this.compileAsync=function(v,P,D=null){let N=this.compile(v,P,D);return new Promise(I=>{function j(){if(N.forEach(function(st){At.get(st).currentProgram.isReady()&&N.delete(st)}),N.size===0){I(v);return}setTimeout(j,10)}Lt.get("KHR_parallel_shader_compile")!==null?j():setTimeout(j,10)})};let pe=null;function Ve(v){pe&&pe(v)}function ka(){_n.stop()}function Va(){_n.start()}let _n=new dl;_n.setAnimationLoop(Ve),typeof self<"u"&&_n.setContext(self),this.setAnimationLoop=function(v){pe=v,k.setAnimationLoop(v),v===null?_n.stop():_n.start()},k.addEventListener("sessionstart",ka),k.addEventListener("sessionend",Va),this.render=function(v,P){if(P!==void 0&&P.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(w===!0)return;if(v.matrixWorldAutoUpdate===!0&&v.updateMatrixWorld(),P.parent===null&&P.matrixWorldAutoUpdate===!0&&P.updateMatrixWorld(),k.enabled===!0&&k.isPresenting===!0&&(k.cameraAutoUpdate===!0&&k.updateCamera(P),P=k.getCamera()),v.isScene===!0&&v.onBeforeRender(S,v,P,A),d=Bt.get(v,E.length),d.init(P),E.push(d),ct.multiplyMatrices(P.projectionMatrix,P.matrixWorldInverse),Xt.setFromProjectionMatrix(ct),$=this.localClippingEnabled,W=K.init(this.clippingPlanes,$),M=ht.get(v,u.length),M.init(),u.push(M),k.enabled===!0&&k.isPresenting===!0){let j=S.xr.getDepthSensingMesh();j!==null&&Cs(j,P,-1/0,S.sortObjects)}Cs(v,P,0,S.sortObjects),M.finish(),S.sortObjects===!0&&M.sort(V,ot),Yt=k.enabled===!1||k.isPresenting===!1||k.hasDepthSensing()===!1,Yt&&Et.addToRenderList(M,v),this.info.render.frame++,W===!0&&K.beginShadows();let D=d.state.shadowsArray;ut.render(D,v,P),W===!0&&K.endShadows(),this.info.autoReset===!0&&this.info.reset();let N=M.opaque,I=M.transmissive;if(d.setupLights(),P.isArrayCamera){let j=P.cameras;if(I.length>0)for(let st=0,ft=j.length;st<ft;st++){let mt=j[st];Ga(N,I,v,mt)}Yt&&Et.render(v);for(let st=0,ft=j.length;st<ft;st++){let mt=j[st];Ha(M,v,mt,mt.viewport)}}else I.length>0&&Ga(N,I,v,P),Yt&&Et.render(v),Ha(M,v,P);A!==null&&(b.updateMultisampleRenderTarget(A),b.updateRenderTargetMipmap(A)),v.isScene===!0&&v.onAfterRender(S,v,P),Jt.resetDefaultState(),O=-1,tt=null,E.pop(),E.length>0?(d=E[E.length-1],W===!0&&K.setGlobalState(S.clippingPlanes,d.state.camera)):d=null,u.pop(),u.length>0?M=u[u.length-1]:M=null};function Cs(v,P,D,N){if(v.visible===!1)return;if(v.layers.test(P.layers)){if(v.isGroup)D=v.renderOrder;else if(v.isLOD)v.autoUpdate===!0&&v.update(P);else if(v.isLight)d.pushLight(v),v.castShadow&&d.pushShadow(v);else if(v.isSprite){if(!v.frustumCulled||Xt.intersectsSprite(v)){N&&Mt.setFromMatrixPosition(v.matrixWorld).applyMatrix4(ct);let st=X.update(v),ft=v.material;ft.visible&&M.push(v,st,ft,D,Mt.z,null)}}else if((v.isMesh||v.isLine||v.isPoints)&&(!v.frustumCulled||Xt.intersectsObject(v))){let st=X.update(v),ft=v.material;if(N&&(v.boundingSphere!==void 0?(v.boundingSphere===null&&v.computeBoundingSphere(),Mt.copy(v.boundingSphere.center)):(st.boundingSphere===null&&st.computeBoundingSphere(),Mt.copy(st.boundingSphere.center)),Mt.applyMatrix4(v.matrixWorld).applyMatrix4(ct)),Array.isArray(ft)){let mt=st.groups;for(let yt=0,St=mt.length;yt<St;yt++){let xt=mt[yt],qt=ft[xt.materialIndex];qt&&qt.visible&&M.push(v,st,qt,D,Mt.z,xt)}}else ft.visible&&M.push(v,st,ft,D,Mt.z,null)}}let j=v.children;for(let st=0,ft=j.length;st<ft;st++)Cs(j[st],P,D,N)}function Ha(v,P,D,N){let I=v.opaque,j=v.transmissive,st=v.transparent;d.setupLightsView(D),W===!0&&K.setGlobalState(S.clippingPlanes,D),N&&bt.viewport(g.copy(N)),I.length>0&&wi(I,P,D),j.length>0&&wi(j,P,D),st.length>0&&wi(st,P,D),bt.buffers.depth.setTest(!0),bt.buffers.depth.setMask(!0),bt.buffers.color.setMask(!0),bt.setPolygonOffset(!1)}function Ga(v,P,D,N){if((D.isScene===!0?D.overrideMaterial:null)!==null)return;d.state.transmissionRenderTarget[N.id]===void 0&&(d.state.transmissionRenderTarget[N.id]=new tn(1,1,{generateMipmaps:!0,type:Lt.has("EXT_color_buffer_half_float")||Lt.has("EXT_color_buffer_float")?bi:je,minFilter:Cn,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Wt.workingColorSpace}));let j=d.state.transmissionRenderTarget[N.id],st=N.viewport||g;j.setSize(st.z,st.w);let ft=S.getRenderTarget();S.setRenderTarget(j),S.getClearColor(z),G=S.getClearAlpha(),G<1&&S.setClearColor(16777215,.5),S.clear(),Yt&&Et.render(D);let mt=S.toneMapping;S.toneMapping=dn;let yt=N.viewport;if(N.viewport!==void 0&&(N.viewport=void 0),d.setupLightsView(N),W===!0&&K.setGlobalState(S.clippingPlanes,N),wi(v,D,N),b.updateMultisampleRenderTarget(j),b.updateRenderTargetMipmap(j),Lt.has("WEBGL_multisampled_render_to_texture")===!1){let St=!1;for(let xt=0,qt=P.length;xt<qt;xt++){let Kt=P[xt],te=Kt.object,ve=Kt.geometry,Ht=Kt.material,vt=Kt.group;if(Ht.side===Je&&te.layers.test(N.layers)){let le=Ht.side;Ht.side=_e,Ht.needsUpdate=!0,Wa(te,D,N,ve,Ht,vt),Ht.side=le,Ht.needsUpdate=!0,St=!0}}St===!0&&(b.updateMultisampleRenderTarget(j),b.updateRenderTargetMipmap(j))}S.setRenderTarget(ft),S.setClearColor(z,G),yt!==void 0&&(N.viewport=yt),S.toneMapping=mt}function wi(v,P,D){let N=P.isScene===!0?P.overrideMaterial:null;for(let I=0,j=v.length;I<j;I++){let st=v[I],ft=st.object,mt=st.geometry,yt=N===null?st.material:N,St=st.group;ft.layers.test(D.layers)&&Wa(ft,P,D,mt,yt,St)}}function Wa(v,P,D,N,I,j){v.onBeforeRender(S,P,D,N,I,j),v.modelViewMatrix.multiplyMatrices(D.matrixWorldInverse,v.matrixWorld),v.normalMatrix.getNormalMatrix(v.modelViewMatrix),I.onBeforeRender(S,P,D,N,v,j),I.transparent===!0&&I.side===Je&&I.forceSinglePass===!1?(I.side=_e,I.needsUpdate=!0,S.renderBufferDirect(D,P,N,I,v,j),I.side=fn,I.needsUpdate=!0,S.renderBufferDirect(D,P,N,I,v,j),I.side=Je):S.renderBufferDirect(D,P,N,I,v,j),v.onAfterRender(S,P,D,N,I,j)}function Ai(v,P,D){P.isScene!==!0&&(P=Dt);let N=At.get(v),I=d.state.lights,j=d.state.shadowsArray,st=I.state.version,ft=_t.getParameters(v,I.state,j,P,D),mt=_t.getProgramCacheKey(ft),yt=N.programs;N.environment=v.isMeshStandardMaterial?P.environment:null,N.fog=P.fog,N.envMap=(v.isMeshStandardMaterial?U:_).get(v.envMap||N.environment),N.envMapRotation=N.environment!==null&&v.envMap===null?P.environmentRotation:v.envMapRotation,yt===void 0&&(v.addEventListener("dispose",Ft),yt=new Map,N.programs=yt);let St=yt.get(mt);if(St!==void 0){if(N.currentProgram===St&&N.lightsStateVersion===st)return qa(v,ft),St}else ft.uniforms=_t.getUniforms(v),v.onBeforeCompile(ft,S),St=_t.acquireProgram(ft,mt),yt.set(mt,St),N.uniforms=ft.uniforms;let xt=N.uniforms;return(!v.isShaderMaterial&&!v.isRawShaderMaterial||v.clipping===!0)&&(xt.clippingPlanes=K.uniform),qa(v,ft),N.needsLights=vl(v),N.lightsStateVersion=st,N.needsLights&&(xt.ambientLightColor.value=I.state.ambient,xt.lightProbe.value=I.state.probe,xt.directionalLights.value=I.state.directional,xt.directionalLightShadows.value=I.state.directionalShadow,xt.spotLights.value=I.state.spot,xt.spotLightShadows.value=I.state.spotShadow,xt.rectAreaLights.value=I.state.rectArea,xt.ltc_1.value=I.state.rectAreaLTC1,xt.ltc_2.value=I.state.rectAreaLTC2,xt.pointLights.value=I.state.point,xt.pointLightShadows.value=I.state.pointShadow,xt.hemisphereLights.value=I.state.hemi,xt.directionalShadowMap.value=I.state.directionalShadowMap,xt.directionalShadowMatrix.value=I.state.directionalShadowMatrix,xt.spotShadowMap.value=I.state.spotShadowMap,xt.spotLightMatrix.value=I.state.spotLightMatrix,xt.spotLightMap.value=I.state.spotLightMap,xt.pointShadowMap.value=I.state.pointShadowMap,xt.pointShadowMatrix.value=I.state.pointShadowMatrix),N.currentProgram=St,N.uniformsList=null,St}function Xa(v){if(v.uniformsList===null){let P=v.currentProgram.getUniforms();v.uniformsList=ni.seqWithValue(P.seq,v.uniforms)}return v.uniformsList}function qa(v,P){let D=At.get(v);D.outputColorSpace=P.outputColorSpace,D.batching=P.batching,D.batchingColor=P.batchingColor,D.instancing=P.instancing,D.instancingColor=P.instancingColor,D.instancingMorph=P.instancingMorph,D.skinning=P.skinning,D.morphTargets=P.morphTargets,D.morphNormals=P.morphNormals,D.morphColors=P.morphColors,D.morphTargetsCount=P.morphTargetsCount,D.numClippingPlanes=P.numClippingPlanes,D.numIntersection=P.numClipIntersection,D.vertexAlphas=P.vertexAlphas,D.vertexTangents=P.vertexTangents,D.toneMapping=P.toneMapping}function _l(v,P,D,N,I){P.isScene!==!0&&(P=Dt),b.resetTextureUnits();let j=P.fog,st=N.isMeshStandardMaterial?P.environment:null,ft=A===null?S.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:gn,mt=(N.isMeshStandardMaterial?U:_).get(N.envMap||st),yt=N.vertexColors===!0&&!!D.attributes.color&&D.attributes.color.itemSize===4,St=!!D.attributes.tangent&&(!!N.normalMap||N.anisotropy>0),xt=!!D.morphAttributes.position,qt=!!D.morphAttributes.normal,Kt=!!D.morphAttributes.color,te=dn;N.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(te=S.toneMapping);let ve=D.morphAttributes.position||D.morphAttributes.normal||D.morphAttributes.color,Ht=ve!==void 0?ve.length:0,vt=At.get(N),le=d.state.lights;if(W===!0&&($===!0||v!==tt)){let we=v===tt&&N.id===O;K.setState(N,v,we)}let Gt=!1;N.version===vt.__version?(vt.needsLights&&vt.lightsStateVersion!==le.state.version||vt.outputColorSpace!==ft||I.isBatchedMesh&&vt.batching===!1||!I.isBatchedMesh&&vt.batching===!0||I.isBatchedMesh&&vt.batchingColor===!0&&I.colorTexture===null||I.isBatchedMesh&&vt.batchingColor===!1&&I.colorTexture!==null||I.isInstancedMesh&&vt.instancing===!1||!I.isInstancedMesh&&vt.instancing===!0||I.isSkinnedMesh&&vt.skinning===!1||!I.isSkinnedMesh&&vt.skinning===!0||I.isInstancedMesh&&vt.instancingColor===!0&&I.instanceColor===null||I.isInstancedMesh&&vt.instancingColor===!1&&I.instanceColor!==null||I.isInstancedMesh&&vt.instancingMorph===!0&&I.morphTexture===null||I.isInstancedMesh&&vt.instancingMorph===!1&&I.morphTexture!==null||vt.envMap!==mt||N.fog===!0&&vt.fog!==j||vt.numClippingPlanes!==void 0&&(vt.numClippingPlanes!==K.numPlanes||vt.numIntersection!==K.numIntersection)||vt.vertexAlphas!==yt||vt.vertexTangents!==St||vt.morphTargets!==xt||vt.morphNormals!==qt||vt.morphColors!==Kt||vt.toneMapping!==te||vt.morphTargetsCount!==Ht)&&(Gt=!0):(Gt=!0,vt.__version=N.version);let Ie=vt.currentProgram;Gt===!0&&(Ie=Ai(N,P,I));let On=!1,ye=!1,Ps=!1,ne=Ie.getUniforms(),en=vt.uniforms;if(bt.useProgram(Ie.program)&&(On=!0,ye=!0,Ps=!0),N.id!==O&&(O=N.id,ye=!0),On||tt!==v){Ot.reverseDepthBuffer?(pt.copy(v.projectionMatrix),uc(pt),dc(pt),ne.setValue(T,"projectionMatrix",pt)):ne.setValue(T,"projectionMatrix",v.projectionMatrix),ne.setValue(T,"viewMatrix",v.matrixWorldInverse);let we=ne.map.cameraPosition;we!==void 0&&we.setValue(T,Tt.setFromMatrixPosition(v.matrixWorld)),Ot.logarithmicDepthBuffer&&ne.setValue(T,"logDepthBufFC",2/(Math.log(v.far+1)/Math.LN2)),(N.isMeshPhongMaterial||N.isMeshToonMaterial||N.isMeshLambertMaterial||N.isMeshBasicMaterial||N.isMeshStandardMaterial||N.isShaderMaterial)&&ne.setValue(T,"isOrthographic",v.isOrthographicCamera===!0),tt!==v&&(tt=v,ye=!0,Ps=!0)}if(I.isSkinnedMesh){ne.setOptional(T,I,"bindMatrix"),ne.setOptional(T,I,"bindMatrixInverse");let we=I.skeleton;we&&(we.boneTexture===null&&we.computeBoneTexture(),ne.setValue(T,"boneTexture",we.boneTexture,b))}I.isBatchedMesh&&(ne.setOptional(T,I,"batchingTexture"),ne.setValue(T,"batchingTexture",I._matricesTexture,b),ne.setOptional(T,I,"batchingIdTexture"),ne.setValue(T,"batchingIdTexture",I._indirectTexture,b),ne.setOptional(T,I,"batchingColorTexture"),I._colorsTexture!==null&&ne.setValue(T,"batchingColorTexture",I._colorsTexture,b));let Is=D.morphAttributes;if((Is.position!==void 0||Is.normal!==void 0||Is.color!==void 0)&&wt.update(I,D,Ie),(ye||vt.receiveShadow!==I.receiveShadow)&&(vt.receiveShadow=I.receiveShadow,ne.setValue(T,"receiveShadow",I.receiveShadow)),N.isMeshGouraudMaterial&&N.envMap!==null&&(en.envMap.value=mt,en.flipEnvMap.value=mt.isCubeTexture&&mt.isRenderTargetTexture===!1?-1:1),N.isMeshStandardMaterial&&N.envMap===null&&P.environment!==null&&(en.envMapIntensity.value=P.environmentIntensity),ye&&(ne.setValue(T,"toneMappingExposure",S.toneMappingExposure),vt.needsLights&&xl(en,Ps),j&&N.fog===!0&&nt.refreshFogUniforms(en,j),nt.refreshMaterialUniforms(en,N,Q,B,d.state.transmissionRenderTarget[v.id]),ni.upload(T,Xa(vt),en,b)),N.isShaderMaterial&&N.uniformsNeedUpdate===!0&&(ni.upload(T,Xa(vt),en,b),N.uniformsNeedUpdate=!1),N.isSpriteMaterial&&ne.setValue(T,"center",I.center),ne.setValue(T,"modelViewMatrix",I.modelViewMatrix),ne.setValue(T,"normalMatrix",I.normalMatrix),ne.setValue(T,"modelMatrix",I.matrixWorld),N.isShaderMaterial||N.isRawShaderMaterial){let we=N.uniformsGroups;for(let Ls=0,yl=we.length;Ls<yl;Ls++){let Ya=we[Ls];C.update(Ya,Ie),C.bind(Ya,Ie)}}return Ie}function xl(v,P){v.ambientLightColor.needsUpdate=P,v.lightProbe.needsUpdate=P,v.directionalLights.needsUpdate=P,v.directionalLightShadows.needsUpdate=P,v.pointLights.needsUpdate=P,v.pointLightShadows.needsUpdate=P,v.spotLights.needsUpdate=P,v.spotLightShadows.needsUpdate=P,v.rectAreaLights.needsUpdate=P,v.hemisphereLights.needsUpdate=P}function vl(v){return v.isMeshLambertMaterial||v.isMeshToonMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isShadowMaterial||v.isShaderMaterial&&v.lights===!0}this.getActiveCubeFace=function(){return F},this.getActiveMipmapLevel=function(){return R},this.getRenderTarget=function(){return A},this.setRenderTargetTextures=function(v,P,D){At.get(v.texture).__webglTexture=P,At.get(v.depthTexture).__webglTexture=D;let N=At.get(v);N.__hasExternalTextures=!0,N.__autoAllocateDepthBuffer=D===void 0,N.__autoAllocateDepthBuffer||Lt.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),N.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(v,P){let D=At.get(v);D.__webglFramebuffer=P,D.__useDefaultFramebuffer=P===void 0},this.setRenderTarget=function(v,P=0,D=0){A=v,F=P,R=D;let N=!0,I=null,j=!1,st=!1;if(v){let mt=At.get(v);if(mt.__useDefaultFramebuffer!==void 0)bt.bindFramebuffer(T.FRAMEBUFFER,null),N=!1;else if(mt.__webglFramebuffer===void 0)b.setupRenderTarget(v);else if(mt.__hasExternalTextures)b.rebindTextures(v,At.get(v.texture).__webglTexture,At.get(v.depthTexture).__webglTexture);else if(v.depthBuffer){let xt=v.depthTexture;if(mt.__boundDepthTexture!==xt){if(xt!==null&&At.has(xt)&&(v.width!==xt.image.width||v.height!==xt.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");b.setupDepthRenderbuffer(v)}}let yt=v.texture;(yt.isData3DTexture||yt.isDataArrayTexture||yt.isCompressedArrayTexture)&&(st=!0);let St=At.get(v).__webglFramebuffer;v.isWebGLCubeRenderTarget?(Array.isArray(St[P])?I=St[P][D]:I=St[P],j=!0):v.samples>0&&b.useMultisampledRTT(v)===!1?I=At.get(v).__webglMultisampledFramebuffer:Array.isArray(St)?I=St[D]:I=St,g.copy(v.viewport),y.copy(v.scissor),H=v.scissorTest}else g.copy(lt).multiplyScalar(Q).floor(),y.copy(gt).multiplyScalar(Q).floor(),H=zt;if(bt.bindFramebuffer(T.FRAMEBUFFER,I)&&N&&bt.drawBuffers(v,I),bt.viewport(g),bt.scissor(y),bt.setScissorTest(H),j){let mt=At.get(v.texture);T.framebufferTexture2D(T.FRAMEBUFFER,T.COLOR_ATTACHMENT0,T.TEXTURE_CUBE_MAP_POSITIVE_X+P,mt.__webglTexture,D)}else if(st){let mt=At.get(v.texture),yt=P||0;T.framebufferTextureLayer(T.FRAMEBUFFER,T.COLOR_ATTACHMENT0,mt.__webglTexture,D||0,yt)}O=-1},this.readRenderTargetPixels=function(v,P,D,N,I,j,st){if(!(v&&v.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ft=At.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&st!==void 0&&(ft=ft[st]),ft){bt.bindFramebuffer(T.FRAMEBUFFER,ft);try{let mt=v.texture,yt=mt.format,St=mt.type;if(!Ot.textureFormatReadable(yt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Ot.textureTypeReadable(St)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}P>=0&&P<=v.width-N&&D>=0&&D<=v.height-I&&T.readPixels(P,D,N,I,Rt.convert(yt),Rt.convert(St),j)}finally{let mt=A!==null?At.get(A).__webglFramebuffer:null;bt.bindFramebuffer(T.FRAMEBUFFER,mt)}}},this.readRenderTargetPixelsAsync=async function(v,P,D,N,I,j,st){if(!(v&&v.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ft=At.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&st!==void 0&&(ft=ft[st]),ft){let mt=v.texture,yt=mt.format,St=mt.type;if(!Ot.textureFormatReadable(yt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Ot.textureTypeReadable(St))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(P>=0&&P<=v.width-N&&D>=0&&D<=v.height-I){bt.bindFramebuffer(T.FRAMEBUFFER,ft);let xt=T.createBuffer();T.bindBuffer(T.PIXEL_PACK_BUFFER,xt),T.bufferData(T.PIXEL_PACK_BUFFER,j.byteLength,T.STREAM_READ),T.readPixels(P,D,N,I,Rt.convert(yt),Rt.convert(St),0);let qt=A!==null?At.get(A).__webglFramebuffer:null;bt.bindFramebuffer(T.FRAMEBUFFER,qt);let Kt=T.fenceSync(T.SYNC_GPU_COMMANDS_COMPLETE,0);return T.flush(),await hc(T,Kt,4),T.bindBuffer(T.PIXEL_PACK_BUFFER,xt),T.getBufferSubData(T.PIXEL_PACK_BUFFER,0,j),T.deleteBuffer(xt),T.deleteSync(Kt),j}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(v,P=null,D=0){v.isTexture!==!0&&(ts("WebGLRenderer: copyFramebufferToTexture function signature has changed."),P=arguments[0]||null,v=arguments[1]);let N=Math.pow(2,-D),I=Math.floor(v.image.width*N),j=Math.floor(v.image.height*N),st=P!==null?P.x:0,ft=P!==null?P.y:0;b.setTexture2D(v,0),T.copyTexSubImage2D(T.TEXTURE_2D,D,0,0,st,ft,I,j),bt.unbindTexture()},this.copyTextureToTexture=function(v,P,D=null,N=null,I=0){v.isTexture!==!0&&(ts("WebGLRenderer: copyTextureToTexture function signature has changed."),N=arguments[0]||null,v=arguments[1],P=arguments[2],I=arguments[3]||0,D=null);let j,st,ft,mt,yt,St;D!==null?(j=D.max.x-D.min.x,st=D.max.y-D.min.y,ft=D.min.x,mt=D.min.y):(j=v.image.width,st=v.image.height,ft=0,mt=0),N!==null?(yt=N.x,St=N.y):(yt=0,St=0);let xt=Rt.convert(P.format),qt=Rt.convert(P.type);b.setTexture2D(P,0),T.pixelStorei(T.UNPACK_FLIP_Y_WEBGL,P.flipY),T.pixelStorei(T.UNPACK_PREMULTIPLY_ALPHA_WEBGL,P.premultiplyAlpha),T.pixelStorei(T.UNPACK_ALIGNMENT,P.unpackAlignment);let Kt=T.getParameter(T.UNPACK_ROW_LENGTH),te=T.getParameter(T.UNPACK_IMAGE_HEIGHT),ve=T.getParameter(T.UNPACK_SKIP_PIXELS),Ht=T.getParameter(T.UNPACK_SKIP_ROWS),vt=T.getParameter(T.UNPACK_SKIP_IMAGES),le=v.isCompressedTexture?v.mipmaps[I]:v.image;T.pixelStorei(T.UNPACK_ROW_LENGTH,le.width),T.pixelStorei(T.UNPACK_IMAGE_HEIGHT,le.height),T.pixelStorei(T.UNPACK_SKIP_PIXELS,ft),T.pixelStorei(T.UNPACK_SKIP_ROWS,mt),v.isDataTexture?T.texSubImage2D(T.TEXTURE_2D,I,yt,St,j,st,xt,qt,le.data):v.isCompressedTexture?T.compressedTexSubImage2D(T.TEXTURE_2D,I,yt,St,le.width,le.height,xt,le.data):T.texSubImage2D(T.TEXTURE_2D,I,yt,St,j,st,xt,qt,le),T.pixelStorei(T.UNPACK_ROW_LENGTH,Kt),T.pixelStorei(T.UNPACK_IMAGE_HEIGHT,te),T.pixelStorei(T.UNPACK_SKIP_PIXELS,ve),T.pixelStorei(T.UNPACK_SKIP_ROWS,Ht),T.pixelStorei(T.UNPACK_SKIP_IMAGES,vt),I===0&&P.generateMipmaps&&T.generateMipmap(T.TEXTURE_2D),bt.unbindTexture()},this.copyTextureToTexture3D=function(v,P,D=null,N=null,I=0){v.isTexture!==!0&&(ts("WebGLRenderer: copyTextureToTexture3D function signature has changed."),D=arguments[0]||null,N=arguments[1]||null,v=arguments[2],P=arguments[3],I=arguments[4]||0);let j,st,ft,mt,yt,St,xt,qt,Kt,te=v.isCompressedTexture?v.mipmaps[I]:v.image;D!==null?(j=D.max.x-D.min.x,st=D.max.y-D.min.y,ft=D.max.z-D.min.z,mt=D.min.x,yt=D.min.y,St=D.min.z):(j=te.width,st=te.height,ft=te.depth,mt=0,yt=0,St=0),N!==null?(xt=N.x,qt=N.y,Kt=N.z):(xt=0,qt=0,Kt=0);let ve=Rt.convert(P.format),Ht=Rt.convert(P.type),vt;if(P.isData3DTexture)b.setTexture3D(P,0),vt=T.TEXTURE_3D;else if(P.isDataArrayTexture||P.isCompressedArrayTexture)b.setTexture2DArray(P,0),vt=T.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}T.pixelStorei(T.UNPACK_FLIP_Y_WEBGL,P.flipY),T.pixelStorei(T.UNPACK_PREMULTIPLY_ALPHA_WEBGL,P.premultiplyAlpha),T.pixelStorei(T.UNPACK_ALIGNMENT,P.unpackAlignment);let le=T.getParameter(T.UNPACK_ROW_LENGTH),Gt=T.getParameter(T.UNPACK_IMAGE_HEIGHT),Ie=T.getParameter(T.UNPACK_SKIP_PIXELS),On=T.getParameter(T.UNPACK_SKIP_ROWS),ye=T.getParameter(T.UNPACK_SKIP_IMAGES);T.pixelStorei(T.UNPACK_ROW_LENGTH,te.width),T.pixelStorei(T.UNPACK_IMAGE_HEIGHT,te.height),T.pixelStorei(T.UNPACK_SKIP_PIXELS,mt),T.pixelStorei(T.UNPACK_SKIP_ROWS,yt),T.pixelStorei(T.UNPACK_SKIP_IMAGES,St),v.isDataTexture||v.isData3DTexture?T.texSubImage3D(vt,I,xt,qt,Kt,j,st,ft,ve,Ht,te.data):P.isCompressedArrayTexture?T.compressedTexSubImage3D(vt,I,xt,qt,Kt,j,st,ft,ve,te.data):T.texSubImage3D(vt,I,xt,qt,Kt,j,st,ft,ve,Ht,te),T.pixelStorei(T.UNPACK_ROW_LENGTH,le),T.pixelStorei(T.UNPACK_IMAGE_HEIGHT,Gt),T.pixelStorei(T.UNPACK_SKIP_PIXELS,Ie),T.pixelStorei(T.UNPACK_SKIP_ROWS,On),T.pixelStorei(T.UNPACK_SKIP_IMAGES,ye),I===0&&P.generateMipmaps&&T.generateMipmap(vt),bt.unbindTexture()},this.initRenderTarget=function(v){At.get(v).__webglFramebuffer===void 0&&b.setupRenderTarget(v)},this.initTexture=function(v){v.isCubeTexture?b.setTextureCube(v,0):v.isData3DTexture?b.setTexture3D(v,0):v.isDataArrayTexture||v.isCompressedArrayTexture?b.setTexture2DArray(v,0):b.setTexture2D(v,0),bt.unbindTexture()},this.resetState=function(){F=0,R=0,A=null,bt.reset(),Jt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Ke}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorSpace=t===Fa?"display-p3":"srgb",e.unpackColorSpace=Wt.workingColorSpace===Ts?"display-p3":"srgb"}};var vs=class extends Pe{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ze,this.environmentIntensity=1,this.environmentRotation=new ze,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}};var ys=class extends Ee{constructor(t,e,n,s,r,a,o,l,c){super(t,e,n,s,r,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}};var Ms=class extends Ln{constructor(t){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new It(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new It(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=ol,this.normalScale=new Vt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ze,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}};function Zi(i,t,e){return!i||!e&&i.constructor===t?i:typeof t.BYTES_PER_ELEMENT=="number"?new t(i):Array.prototype.slice.call(i)}function lp(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}var ci=class{constructor(t,e,n,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,n=this._cachedIndex,s=e[n],r=e[n-1];n:{t:{let a;e:{i:if(!(t<s)){for(let o=n+2;;){if(s===void 0){if(t<r)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=s,s=e[++n],t<s)break t}a=e.length;break e}if(!(t>=r)){let o=e[1];t<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=e[--n-1],t>=r)break t}a=n,n=0;break e}break n}for(;n<a;){let o=n+a>>>1;t<e[o]?a=o:n=o+1}if(s=e[n],r=e[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=t*s;for(let a=0;a!==s;++a)e[a]=n[r+a];return e}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},_a=class extends ci{constructor(t,e,n,s){super(t,e,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Qa,endingEnd:Qa}}intervalChanged_(t,e,n){let s=this.parameterPositions,r=t-2,a=t+1,o=s[r],l=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case ja:r=t,o=2*e-n;break;case to:r=s.length-2,o=e+s[r]-s[r+1];break;default:r=t,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case ja:a=t,l=2*n-e;break;case to:a=1,l=n+s[1]-s[0];break;default:a=t-1,l=e}let c=(n-e)*.5,h=this.valueSize;this._weightPrev=c/(e-o),this._weightNext=c/(l-n),this._offsetPrev=r*h,this._offsetNext=a*h}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=this._offsetPrev,p=this._offsetNext,f=this._weightPrev,m=this._weightNext,x=(n-e)/(s-e),M=x*x,d=M*x,u=-f*d+2*f*M-f*x,E=(1+f)*d+(-1.5-2*f)*M+(-.5+f)*x+1,S=(-1-m)*d+(1.5+m)*M+.5*x,w=m*d-m*M;for(let F=0;F!==o;++F)r[F]=u*a[h+F]+E*a[c+F]+S*a[l+F]+w*a[p+F];return r}},xa=class extends ci{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=(n-e)/(s-e),p=1-h;for(let f=0;f!==o;++f)r[f]=a[c+f]*p+a[l+f]*h;return r}},va=class extends ci{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t){return this.copySampleValue_(t-1)}},Oe=class{constructor(t,e,n,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=Zi(e,this.TimeBufferType),this.values=Zi(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:Zi(t.times,Array),values:Zi(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(n.interpolation=s)}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new va(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new xa(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new _a(this.times,this.values,this.getValueSize(),t)}setInterpolation(t){let e;switch(t){case es:e=this.InterpolantFactoryMethodDiscrete;break;case Kr:e=this.InterpolantFactoryMethodLinear;break;case Ds:e=this.InterpolantFactoryMethodSmooth;break}if(e===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return es;case this.InterpolantFactoryMethodLinear:return Kr;case this.InterpolantFactoryMethodSmooth:return Ds}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]+=t}return this}scale(t){if(t!==1){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]*=t}return this}trim(t,e){let n=this.times,s=n.length,r=0,a=s-1;for(;r!==s&&n[r]<t;)++r;for(;a!==-1&&n[a]>e;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),t=!1);let n=this.times,s=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),t=!1);let a=null;for(let o=0;o!==r;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,o,l),t=!1;break}if(a!==null&&a>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,o,l,a),t=!1;break}a=l}if(s!==void 0&&lp(s))for(let o=0,l=s.length;o!==l;++o){let c=s[o];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,o,c),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===Ds,r=t.length-1,a=1;for(let o=1;o<r;++o){let l=!1,c=t[o],h=t[o+1];if(c!==h&&(o!==1||c!==t[0]))if(s)l=!0;else{let p=o*n,f=p-n,m=p+n;for(let x=0;x!==n;++x){let M=e[p+x];if(M!==e[f+x]||M!==e[m+x]){l=!0;break}}}if(l){if(o!==a){t[a]=t[o];let p=o*n,f=a*n;for(let m=0;m!==n;++m)e[f+m]=e[p+m]}++a}}if(r>0){t[a]=t[r];for(let o=r*n,l=a*n,c=0;c!==n;++c)e[l+c]=e[o+c];++a}return a!==t.length?(this.times=t.slice(0,a),this.values=e.slice(0,a*n)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),n=this.constructor,s=new n(this.name,t,e);return s.createInterpolant=this.createInterpolant,s}};Oe.prototype.TimeBufferType=Float32Array;Oe.prototype.ValueBufferType=Float32Array;Oe.prototype.DefaultInterpolation=Kr;var Nn=class extends Oe{constructor(t,e,n){super(t,e,n)}};Nn.prototype.ValueTypeName="bool";Nn.prototype.ValueBufferType=Array;Nn.prototype.DefaultInterpolation=es;Nn.prototype.InterpolantFactoryMethodLinear=void 0;Nn.prototype.InterpolantFactoryMethodSmooth=void 0;var ya=class extends Oe{};ya.prototype.ValueTypeName="color";var Ma=class extends Oe{};Ma.prototype.ValueTypeName="number";var Sa=class extends ci{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-e)/(s-e),c=t*o;for(let h=c+o;c!==h;c+=4)mn.slerpFlat(r,0,a,c-o,a,c,l);return r}},Ss=class extends Oe{InterpolantFactoryMethodLinear(t){return new Sa(this.times,this.values,this.getValueSize(),t)}};Ss.prototype.ValueTypeName="quaternion";Ss.prototype.InterpolantFactoryMethodSmooth=void 0;var Fn=class extends Oe{constructor(t,e,n){super(t,e,n)}};Fn.prototype.ValueTypeName="string";Fn.prototype.ValueBufferType=Array;Fn.prototype.DefaultInterpolation=es;Fn.prototype.InterpolantFactoryMethodLinear=void 0;Fn.prototype.InterpolantFactoryMethodSmooth=void 0;var ba=class extends Oe{};ba.prototype.ValueTypeName="vector";var Ea=class{constructor(t,e,n){let s=this,r=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this.itemStart=function(h){o++,r===!1&&s.onStart!==void 0&&s.onStart(h,a,o),r=!0},this.itemEnd=function(h){a++,s.onProgress!==void 0&&s.onProgress(h,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,p){return c.push(h,p),this},this.removeHandler=function(h){let p=c.indexOf(h);return p!==-1&&c.splice(p,2),this},this.getHandler=function(h){for(let p=0,f=c.length;p<f;p+=2){let m=c[p],x=c[p+1];if(m.global&&(m.lastIndex=0),m.test(h))return x}return null}}},cp=new Ea,wa=class{constructor(t){this.manager=t!==void 0?t:cp,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(t,e){let n=this;return new Promise(function(s,r){n.load(t,s,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}};wa.DEFAULT_MATERIAL_NAME="__DEFAULT";var bs=class extends Pe{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new It(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){let e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}};var hr=new ee,Xo=new L,qo=new L,Aa=class{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Vt(512,512),this.map=null,this.mapPass=null,this.matrix=new ee,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Si,this._frameExtents=new Vt(1,1),this._viewportCount=1,this._viewports=[new Zt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){let e=this.camera,n=this.matrix;Xo.setFromMatrixPosition(t.matrixWorld),e.position.copy(Xo),qo.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(qo),e.updateMatrixWorld(),hr.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(hr),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(hr)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}};var Yo=new ee,_i=new L,ur=new L,Ta=class extends Aa{constructor(){super(new ue(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new Vt(4,2),this._viewportCount=6,this._viewports=[new Zt(2,1,1,1),new Zt(0,1,1,1),new Zt(3,1,1,1),new Zt(1,1,1,1),new Zt(3,0,1,1),new Zt(1,0,1,1)],this._cubeDirections=[new L(1,0,0),new L(-1,0,0),new L(0,0,1),new L(0,0,-1),new L(0,1,0),new L(0,-1,0)],this._cubeUps=[new L(0,1,0),new L(0,1,0),new L(0,1,0),new L(0,1,0),new L(0,0,1),new L(0,0,-1)]}updateMatrices(t,e=0){let n=this.camera,s=this.matrix,r=t.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),_i.setFromMatrixPosition(t.matrixWorld),n.position.copy(_i),ur.copy(n.position),ur.add(this._cubeDirections[e]),n.up.copy(this._cubeUps[e]),n.lookAt(ur),n.updateMatrixWorld(),s.makeTranslation(-_i.x,-_i.y,-_i.z),Yo.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Yo)}},Es=class extends bs{constructor(t,e,n=0,s=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new Ta}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}};var ws=class extends bs{constructor(t,e){super(t,e),this.isAmbientLight=!0,this.type="AmbientLight"}};var Ba="\\[\\]\\.:\\/",hp=new RegExp("["+Ba+"]","g"),za="[^"+Ba+"]",up="[^"+Ba.replace("\\.","")+"]",dp=/((?:WC+[\/:])*)/.source.replace("WC",za),fp=/(WCOD+)?/.source.replace("WCOD",up),pp=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",za),mp=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",za),gp=new RegExp("^"+dp+fp+pp+mp+"$"),_p=["material","materials","bones","map"],Ra=class{constructor(t,e,n){let s=n||jt.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,s)}getValue(t,e){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(t,e)}setValue(t,e){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}},jt=class i{constructor(t,e,n){this.path=e,this.parsedPath=n||i.parseTrackName(e),this.node=i.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new i.Composite(t,e,n):new i(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(hp,"")}static parseTrackName(t){let e=gp.exec(t);if(e===null)throw new Error("PropertyBinding: Cannot parse trackName: "+t);let n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);_p.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===e||o.uuid===e)return o;let l=n(o.children);if(l)return l}return null},s=n(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)t[e++]=n[s]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,n=e.objectName,s=e.propertyName,r=e.propertyIndex;if(t||(t=i.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=e.objectIndex;switch(n){case"materials":if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let h=0;h<t.length;h++)if(t[h].name===c){c=h;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(c!==void 0){if(t[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}let a=t[s];if(a===void 0){let c=e.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",t);return}let o=this.Versioning.None;this.targetObject=t,t.needsUpdate!==void 0?o=this.Versioning.NeedsUpdate:t.matrixWorldNeedsUpdate!==void 0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};jt.Composite=Ra;jt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};jt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};jt.prototype.GetterByBindingType=[jt.prototype._getValue_direct,jt.prototype._getValue_array,jt.prototype._getValue_arrayElement,jt.prototype._getValue_toArray];jt.prototype.SetterByBindingTypeAndVersioning=[[jt.prototype._setValue_direct,jt.prototype._setValue_direct_setNeedsUpdate,jt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[jt.prototype._setValue_array,jt.prototype._setValue_array_setNeedsUpdate,jt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[jt.prototype._setValue_arrayElement,jt.prototype._setValue_arrayElement_setNeedsUpdate,jt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[jt.prototype._setValue_fromArray,jt.prototype._setValue_fromArray_setNeedsUpdate,jt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var yp=new Float32Array(1);typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Ca}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Ca);var vp=window.__BENCH_LAZY=window.__BENCH_LAZY??{};vp.initScene=(i,t)=>{let e=i.clientWidth||600,n=i.clientHeight||360,s=new vs;s.background=new It(921104);let r=new ue(60,e/n,.1,100);r.position.set(0,1.5,6),r.lookAt(0,0,0);let a=new xs({antialias:!0});a.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),a.setSize(e,n,!1),i.appendChild(a.domElement);let o=new ws(16777215,.6);s.add(o);let l=new Es(16777215,1.4);l.position.set(3,4,5),s.add(l);let c=new hn,h=Math.max(8,Math.min(t.length,36)),p=2.6,f=new Dn(.7,.7,.7),m=[];for(let u=0;u<h;u+=1){let E=u/h*Math.PI*2,S=t[u%t.length],w=S?new ys(S):null;w&&(w.colorSpace=Te,w.needsUpdate=!0);let F=new Ms({map:w,roughness:.4,metalness:.1,color:w?16777215:new It().setHSL(u/h,.6,.5)}),R=new be(f,F);R.position.set(Math.cos(E)*p,Math.sin(E*2)*.4,Math.sin(E)*p),R.rotation.y=-E,c.add(R),m.push(R)}s.add(c);let x=0,M=90;function d(){c.rotation.y=x/M*Math.PI*.5;for(let u=0;u<m.length;u+=1){let E=m[u];E&&(E.rotation.x+=.01,E.rotation.y+=.012)}a.render(s,r),x+=1,x<M?requestAnimationFrame(d):window.dispatchEvent(new CustomEvent("bench:lazy:scene-rendered"))}d()};})();
