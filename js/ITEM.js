/*globals ITEM:true*/
/*jshint unused:true,supernew:true*/
var ITEM = new function(){
  "use strict";
  var self = this;
  self.sort=0;
  self.sortArray=[];
  self.aPre=[];
  self.wPre=[];
  self.aSuf=[];
  self.wSuf=[];
  self.loadJSON=function(basedir){
    basedir=basedir||"";
    
    return $.when(
      $.getJSON(basedir+"json/materials.json",function(moo){self.materials=moo;}),
      $.getJSON(basedir+"json/artifacts.json",function(moo){self.artifacts=moo;}),
      $.getJSON(basedir+"json/cloaks.json",function(moo){self.cloaks=moo;}),
      $.getJSON(basedir+"json/weapons.json",function(moo){self.weapons=moo;}),
      $.getJSON(basedir+"json/armor.json",function(moo){self.armor=moo;}),
      $.getJSON(basedir+"json/amulets.json",function(moo){self.amulets=moo;}),
      $.getJSON(basedir+"json/potions.json",function(moo){self.potions=moo;}),
      $.getJSON(basedir+"json/prefixes.json").success(function(moo){
        self.prefixes=moo;
        self.aPre=_.keys(moo.aPrefixes);
        self.wPre=_.keys(moo.wPrefixes);
      }),
      
      $.getJSON(basedir+"json/suffixes.json").success(function(moo){
        self.suffixes=moo;
        self.aSuf=_.keys(moo.aSuffixes);
        self.wSuf=_.keys(moo.wSuffixes);
      })
    );
  };
  self.types=["weapon","potion","amulet","cloak","armor"];
  self.desc={dagger:"Daggers",sword:"Swords",shield:"Shields",staff:"Staves",wand:"Wands",heavy:"Heavy Armor",medium:"Medium Armor",light:"Light Armor",axe:"Axes",polearm:"Polearms"};
  
  self.resetBoardItems=function(x,y){
    var tmpArr=[],n=0;
    if(!x) x = PC.X;
    if(!y) y = PC.Y;
    tmpArr=WORLD.getTile(x,y).items;
    WORLD.getTile(x,y).items=[];
    for(n = 0;n<tmpArr.length;n++) if(typeof tmpArr[n]!=="undefined") WORLD.getTile(x,y).items.push(tmpArr[n]);
  };

  self.itemName=function(x,y){
    var aAn;
    if(!y){
      if(x<0) return("(Nothing)");
      else if(!items[x].idd) return items[x].uid;
      else return items[x].name;
    }
    else{
      var item=items[WORLD.getTile(x,y).items[0]];
      if(!item.idd){
        if(item.uid.match(/^[aeiou]/i)) aAn="an";
        else aAn="a";
        return("You see "+aAn+" "+item.uid+" on the ground.");
      }
      else if(item.artifact) return("The "+item.name+" is lying here.");
      else {
        if(item.name.match(/^[aeiou]/i)) aAn="an";
        else aAn="a";
        return ("There is "+aAn+" "+item.name+" lying on the ground.");
      }
    }
  };

  self.itemSorter=function(){
    var filterType=[
      null,
      ["head"],
      ["amulet"],
      ["cloak"],
      ["armor"],
      ["1hand","2hand"],
      ["shield"],
      ["bracers"],
      ["gauntlets"],
      ["boots"],
      ["potion"],
      ["scroll"]
    ][self.sort];
    
    self.sortArray= _.chain(PC.items)
                      .map(function(id){return items[id];})
                      .where({type:filterType})
                    .value();
  };
  
  self.itemId=function(x,y){
  if(!x) x = PC.X;
  if(!y) y = PC.Y;
  return WORLD.getTile(x,y).items;
};

self.itemCount=function(x,y){
  if(!x) x = PC.X;
  if(!y) y = PC.Y;
  return WORLD.getTile(x,y).items.length;
};

self.dropItem=function(){
  var dropped,msg="You have nothing to drop.";
  if(PC.items.length){
    dropped = ITEM.itemName(PC.items[curPos]);
    items[PC.items[curPos]].owned=0;
    self.setItem(PC.X,PC.Y,PC.items[curPos]);
    
    PC.items.splice(curPos,1);
    if(curPos>PC.items.length-1) curPos=PC.items.length-1;
    
    msg="You drop the "+dropped;
  }
  SCREEN.showInventory();
  SCREEN.gameMessage(msg);
};

self.unequipItem=function(){
  var part,msg;
  switch(curPos){
    case 0:
      part="head";
      msg="You try to unequip your head. It's quite obvious that you're not using it.";
    break;
    case 1:
      part="amulet";
      msg="lol amu";
    break;
    case 2:
      part="cloak";
      msg="lol cloks";
    break;
    case 3:
      part="body";
      msg="body lol";
    break;
    case 4:
      part="weapon";
      msg="no weapon";
    break;
    case 5:
      part="shield";
      msg="pewpew shields";
    break;
    case 6:
      part="bracers";
      msg="armarmor lol";
    break;
    case 7:
      part="gauntlets";
      msg="gloves, bitch lol";
    break;
    case 8:
      part="boots";
      msg="footsies lol";
    break;
  }
  if(PC.equip[part]==-1) msg=msg;
    else{
      msg="You unequip the "+ITEM.itemName(PC.equip[part]);
      PC.items.push(PC.equip[part]);
      items[PC.equip[part]].owned=1;
      items[PC.equip[part]].equip=0;
      PC.equip[part]=-1;
      ENTITY.updateArmor();
    }
    SCREEN.equipMenu();
    SCREEN.gameMessage(msg);
  };



self.equipItem=function(){
  var artifact,type,PCInfo=SETUP.professions[PC.prof],success=0,part,msg="You",i;
    type=self.sortArray[curPos].type;
    artifact=self.sortArray[curPos].artifact;
    switch(type[0]){
      default:
        msg+=" cannot equip that item.";
      break;
      
      case "head":
        part="head";
        if(PCInfo[type[1]]||type[1]=="*"||artifact) success=1;
        else msg+="r profession cannot equip "+self.desc[type[1]];
      break;
      
      case "amulet":
      case "cloak":
      case "bracers":
      case "boots":
      case "gauntlets":
        part=type[0];
        success=1;
      break;
      
      
      case "armor":
        part="body";
        if(PCInfo[type[1]]||type[1]=="*"||artifact) success=1;
        else msg+="r profession cannot equip "+self.desc[type[1]];
        
      break;
      
      case "1hand":
      case "2hand":
        part="weapon";
        if(PCInfo[type[1]]||artifact) success=1;
        else msg+="r profession cannot equip "+self.desc[type[1]];
      break;
      
      case "shield":
        part="shield";
        if(PC.equip.weapon!=-1&&items[PC.equip.weapon].type[0]=='2hand') msg+=" cannot equip a shiled whilst wielding a two-handed weapon.";
        else if(PCInfo.shield||artifact) success=1;
        else msg+="r profession cannot equip shields.";
      break;
      
    }
    if(success){
      if(PC.equip[part]>=0) {
        items[PC.equip[part]].equip=0;
        items[PC.equip[part]].owned=1;
        PC.items.push(PC.equip[part]);
        msg+=" unequip the "+ITEM.itemName(PC.equip[part])+" and";
      }
      PC.equip[part]=_.findKey(items,self.sortArray[curPos]);
      self.sortArray[curPos].equip=1;
      self.sortArray[curPos].owned=0;
      self.sortArray[curPos].idd=1;
      for(i=0;i<PC.items.length;i++) if(items[PC.items[i]]==self.sortArray[curPos]) PC.items.splice(i,1);
      msg+=" equip the "+ITEM.itemName(PC.equip[part])+".";
      self.sort=0;
      curPos=lastPos;
      ENTITY.updateArmor();
    }
    SCREEN.equipMenu();
    SCREEN.gameMessage(msg);
  
};

self.mobPickUp=function(e){
  var square=WORLD.getTile(mobs[e].X,mobs[e].Y);
  mobs[e].items.push(square.items[0]);
  if(ITEM.itemCount(mobs[e].X,mobs[e].Y)==1) square.items=[];
  else{
    square.items[0]=undefined;
    self.resetBoardItems(mobs[e].X,mobs[e].Y);
  }
};

self.pickUpItem=function(x){
  var iName;
  SCREEN.clearMessage();
  if(!ITEM.itemCount(PC.X,PC.Y)) SCREEN.gameMessage("Nothing here to pick up.");
  else if(ITEM.itemCount(PC.X,PC.Y)==1){
    iName=ITEM.itemName(ITEM.itemId(PC.X,PC.Y));
    items[ITEM.itemId(PC.X,PC.Y)].owned=1;
    PC.items.push(ITEM.itemId(PC.X,PC.Y)[0]);
    WORLD.getTile(PC.X,PC.Y).items=[];
    SCREEN.redrawBoard();
    SCREEN.gameMessage("You pick up the "+iName);
    flags.pickup=0;
  }
  else{
    if(!x){
      flags.pickup=1;
      curPos=0;
      SCREEN.drawMPU();
    }
    else {
      var theid=self.itemId()[x-1];
      items[theid].owned=1;
      PC.items.push(theid);
      delete WORLD.getTile(PC.X,PC.Y).items[x-1];
      self.resetBoardItems();
      if(curPos>self.itemCount()-1) curPos=self.itemCount()-1;
      SCREEN.drawMPU();
      SCREEN.gameMessage("You pick up the "+self.itemName(theid));
    }
  }
};


self.generateInitialItems=function(){
  var randx,randy,x;
  for(x = 1;x<=_.random(30,50);x++){
    randx=_.random(1,WORLD.width);
    randy=_.random(1,WORLD.height);
    if(WORLD.inRoom(randx,randy)&&WORLD.getTile(randx,randy).type=="floor"&&!WORLD.getTile(randx,randy).door) self.generateItem(randx,randy);
  }
};

self.drinkPotion=function(){
  
};

self.generateItem=function(x,y,z){
  var matArr=[],typeArr=[],theMat,theName="",theType,uid,whatIsIt,statAdd=[0,0,0,0,0],regen,kind,armor=0,i,tmpItem,prefix,suffix;
  if(z) whatIsIt=z;
  else whatIsIt=self.types[_.random(0,self.types.length-1)];
  
    if(_.random(0,1600-(WORLD.level*4))&&_.size(self.artifacts)&&!z){
      console.log("RELIC");
      tmpItem=_.sample(self.artifacts);
      delete self.artifacts[_.findKey(self.artifacts,tmpItem)];
    }
    
    else switch(whatIsIt){
      case "weapon":
        for(i in self.materials) if(self.materials[i].level<=WORLD.level+_.random(0,1)-1)matArr.push(i);
        typeArr=_.keys(self.weapons);
        theMat=matArr[_.random(0,matArr.length-1)];
        theType=typeArr[_.random(0,typeArr.length-1)];
        theName=self.materials[theMat].fName+" "+self.weapons[theType].fName;
        uid = self.weapons[theType].fName;
        tmpItem={name:theName,uid:uid,mat:theMat,type:self.weapons[theType].type};
        tmpItem.toHit=self.materials[theMat].toHit;
        tmpItem.toDmg=self.materials[theMat].toDmg;
        tmpItem.armor=0;
        tmpItem.die=self.weapons[theType].die;
        for(var n=0;n<5;n++) statAdd[n]+=self.materials[theMat].stats[n];
        tmpItem.stats=statAdd;
        if(!_.random(0,750-(WORLD.level*4)-self.materials[theMat].level)){
          prefix=self.wPre[_.random(0,self.wPre.length-1)];
          tmpItem.name=self.prefixes.wPrefixes[prefix].fName+" "+tmpItem.name;
        }
        
        if(!_.random(0,750-(WORLD.level*4)-self.materials[theMat].level)){
          suffix=self.wSuf[_.random(0,self.wSuf.length-1)];
          if(self.suffixes.wSuffixes[suffix][tmpItem.type[1]]||self.suffixes.wSuffixes[suffix].all){
          tmpItem.name+=" of "+self.suffixes.wSuffixes[suffix].fName;
          }
        }
        
      break;
     
      case "armor":
        for(i in self.materials) if(self.materials[i].level<=WORLD.level+_.random(0,1)-1)matArr.push(i);
        typeArr=_.keys(self.armor);
        theMat=matArr[_.random(0,matArr.length-1)];
        
        theType=typeArr[_.random(0,typeArr.length-1)];
        theName=self.materials[theMat].fName+" "+self.armor[theType].fName;
        uid = self.armor[theType].fName;
        tmpItem={name:theName,uid:uid,mat:theMat,type:self.armor[theType].type};
        tmpItem.toHit=0;
        tmpItem.toDmg=0;
        tmpItem.armor=self.materials[theMat].armor+self.armor[theType].armor;
        for(i=0;n<5;n++) statAdd[i]+=self.materials[theMat].stats[i];
        tmpItem.stats=statAdd;
        if(!_.random(0,750-(WORLD.level*4)-self.materials[theMat].level)){
          prefix=self.aPre[_.random(0,self.aPre.length-1)];
          tmpItem.name=self.prefixes.aPrefixes[prefix].fName+" "+tmpItem.name;
        }

        if(!_.random(0,750-(WORLD.level*4)-self.materials[theMat].level)){
          suffix=self.aSuf[_.random(0,self.aSuf.length-1)];
          if(self.suffixes.aSuffixes[suffix][tmpItem.type[0]]||self.suffixes.aSuffixes[suffix].all){
            tmpItem.name+=" of "+self.suffixes.aSuffixes[suffix].fName;
            //Buy the DLC to finish the if statement  
          }
        }
        
      break;
      
      case "potion":
        typeArr=_.keys(self.potions);
        kind=typeArr[_.random(0,typeArr.length-1)];
        theType=["potion",kind];
        theName="Potion of "+self.potions[kind];
        tmpItem={name:theName,uid:"Potion",type:theType};
      break;
      
      case "amulet":
        typeArr=_.keys(self.amulets);
        kind=typeArr[_.random(0,typeArr.length-1)];
        theType=["amulet",kind];
        theName="Amulet of "+self.amulets[kind].name;
        armor=self.amulets[kind].armor;
        statAdd=self.amulets[kind].stats;
        regen=self.amulets[kind].regen;
        tmpItem={name:theName,uid:"Amulet",type:theType,armor:armor,stats:statAdd,regen:regen};
      break;
      
       case "cloak":
        typeArr=_.keys(self.cloaks);
        kind=typeArr[_.random(0,typeArr.length-1)];
        theType=["cloak",kind];
        theName="Cloak of "+self.cloaks[kind].name;
        armor=self.cloaks[kind].armor;
        statAdd=self.cloaks[kind].stats;
        tmpItem={name:theName,uid:"Cloak",type:theType,armor:armor,stats:statAdd};
      break;

      case "scroll":
        tmpItem={};
      break;
      
    }
    
    if(!x||!y){
      tmpItem.owned=1;
      tmpItem.idd=1;
    }
    else {
      tmpItem.owned=0;
      tmpItem.idd=1;
    }
      
    tmpItem.equip=0;
    items.push(tmpItem);
    self.setItem(x,y,items.length-1);
};


  self.setItem=function(x,y,z){
    if(!x||!y) PC.items.unshift(z);
    else WORLD.getTile(x,y).items.unshift(z);
  };
};