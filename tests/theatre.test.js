const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {construireTheatre} = require('../tools/construire-theatre.js');

test('Théâtre : tous les imports restent dans la révision publiée et les blocs anciens se rechargent',async()=>{
  const out=fs.mkdtempSync(path.join(os.tmpdir(),'labo-theatre-'));
  try {
    const r=construireTheatre(out);
    const base=path.join(out,'theatre',r.revision);
    for (const f of r.fichiers.filter(f=>f.endsWith('.js') && !f.includes('/vendor/'))) {
      const texte=fs.readFileSync(path.join(base,f),'utf8');
      for (const [,rel] of texte.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
        const dep=path.resolve(path.dirname(path.join(base,f)),rel);
        assert(dep.startsWith(base+path.sep),'Import hors de la révision : '+rel);
        assert(fs.existsSync(dep),'Import absent : '+rel);
      }
    }
    const Blockly=require('blockly');
    const d=await import(pathToFileURL(path.join(base,'blocks/definitions.js')).href);
    const a=await import(pathToFileURL(path.join(base,'blocks/arduino.js')).href);
    d.defineBlocks(Blockly,{characters:()=>[{id:'loup',name:'Loup'}],sounds:()=>[],ledPins:()=>[9,10]});
    for(const niveau of [1,2,3]) assert(d.toolbox(niveau,[9,10]).contents.length>0);
    const ws=new Blockly.Workspace();
    try {
      Blockly.serialization.workspaces.load({blocks:{languageVersion:0,blocks:[{type:'quand_je_vois',fields:{PERSO:'loup'},next:{block:{type:'allumer_led',fields:{PIN:'9'}}}}]}},ws);
      assert.equal(ws.getAllBlocks(false).length,2);
      assert.match(a.generateArduino(Blockly,ws,{characterName:()=> 'Loup',soundName:()=>'',team:[],ledPins:[9]}).code,/digitalWrite/);
    } finally {ws.dispose();}
    assert.equal(construireTheatre(out).revision,r.revision,'La même source garde la même révision.');
  }finally{fs.rmSync(out,{recursive:true,force:true});}
});
