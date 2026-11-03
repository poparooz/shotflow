export const SAMPLE = `第01集 · 雨停之前

人物：林夏、陈默

场景 01｜旧书店 · 内 · 雨夜
雨水沿着橱窗缓缓滑落。林夏推开旧书店的门，风铃轻响。
林夏（收起湿透的伞）：老板，那本书还在吗？
陈默从柜台后抬起头。他认出了她，却没有立刻回答。
陈默：我以为你不会再来了。
林夏的目光停在柜台上的旧信封。信封一角，写着她的名字。

场景 02｜书店门口 · 外 · 雨夜
林夏握着信封走出书店，停在屋檐下。
她拆开信封，一张泛黄的车票从里面滑落。
林夏（低声）：原来，你一直都记得。
陈默站在门内，没有追出去。两人隔着玻璃对望。
雨渐渐停了。林夏回头，第一次露出了笑容。`;

export const DEFAULT_SETTINGS = {
  videoMode:'图生视频', ratio:'9:16', style:'电影写实',
  stylePrefix:'电影写实摄影，细腻真实的皮肤和材质，电影画面质感',
  stylePrefixEn:'Cinematic photorealistic photography, realistic skin and material detail, film still quality',
  promptLanguage:'zh', pacing:'标准', density:'标准拆分', tone:'',
  negative:'文字、水印、字幕、畸形手指、面部扭曲、重复人物',
  negativeEn:'text, watermarks, subtitles, malformed fingers, distorted faces, duplicate people',
  cast:'林夏｜年轻女性，黑色及肩短发，米白色风衣，深色长裤\n陈默｜年轻男性，短黑发，深灰色针织衫，银框眼镜'
};
export const SIZES = ['大远景','全景','中景','近景','特写'];
export const ANGLES = ['平视','俯拍','仰拍','过肩','主观视角'];
export const MOVEMENTS = ['固定镜头','缓慢推进','缓慢拉远','横向跟拍','手持跟随','摇镜'];
export const FOCAL_LENGTHS = ['24mm广角','35mm','50mm','85mm人像','微距'];
export const DEPTHS = ['浅景深','深景深'];
export const STATUSES = ['待生成','已出图','已出视频','已确认'];
export const DEFAULT_SPACES = [
  {id:'real',name:'现实世界',descriptionZh:'暖黄低饱和，胶片颗粒，实景光源',descriptionEn:'Warm yellow low-saturation palette, film grain, practical lighting'},
  {id:'virtual',name:'虚拟空间',descriptionZh:'冷调高饱和，辉光，漂浮光粒子，稳定对称构图，角色带代表色轮廓光',descriptionEn:'Cool high-saturation palette, bloom, floating light particles, stable symmetrical composition, character rim lighting in each character’s representative color'}
];
export function uid(){return globalThis.crypto?.randomUUID?.() || `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;}
export function parseCast(text=''){return String(text).split('\n').map(x=>x.trim()).filter(Boolean).map(x=>{const [name,...rest]=x.split(/[｜|：:]/);return {name:name.trim(),description:rest.join('，').trim()};}).filter(x=>x.name);}
export function isHeading(line) {return /^(?:场景\s*[零一二三四五六七八九十\d]*[｜|：:\s]|第[零一二三四五六七八九十\d]+[场幕]|\d+[-—]\d+[\s、.：:]|(?:INT|EXT|内景|外景)[.．\s：:])/i.test(line) || /^(?:场次|地点)[：:]/.test(line);}
function pieces(text,limit) {
  if(text.length<=limit)return [text];
  const sentences=text.match(/[^。！？!?；;]+[。！？!?；;]?|[。！？!?；;]/g)||[text];
  const parts=sentences.flatMap(p=>p.length>limit?Array.from({length:Math.ceil(p.length/limit)},(_,i)=>p.slice(i*limit,(i+1)*limit)):[p]);
  const result=[]; let current='';
  for(const p of parts){if(current.length+p.length>limit && current){result.push(current);current='';}current+=p;}
  if(current)result.push(current);
  return result;
}
export function parseScript(text, settings=DEFAULT_SETTINGS) {
  if(!text.trim())return [];
  const cast=parseCast(settings.cast); const lines=text.replace(/\r/g,'').split('\n');
  for(const raw of lines){const line=raw.trim();if(isHeading(line)||/^第[零一二三四五六七八九十百\d]+集/.test(line)||/^(人物|角色|剧名)[：:]/.test(line))continue;const m=line.match(/^([^：:\n]{1,22})[：:]/);if(m){const name=m[1].replace(/[（(][^）)]*[）)]/g,'').trim();if(name&&!/^(画面|动作|镜头|音效|转场|说明|场景|字幕|旁白说明)$/.test(name)&&!cast.some(c=>c.name===name))cast.push({name,description:''});}}
  let scene='场景 01｜未命名场景',episodeName='第01集'; const shots=[]; let first=true;
  for(let raw of lines){
    const line=raw.trim();if(!line)continue;
    if(/^第[零一二三四五六七八九十百\d]+集/.test(line)){episodeName=line;scene='场景 01｜未命名场景';first=true;continue;}
    if(isHeading(line)){scene=line;first=true;continue;}
    if(/^(?:第[零一二三四五六七八九十\d]+集|剧名[：:]|人物[：:]|角色[：:])/.test(line))continue;
    const dialogueMatch=line.match(/^([^：:\n]{1,22})[：:]\s*(.+)$/);
    const speaker=dialogueMatch?.[1].replace(/[（(][^）)]*[）)]/g,'').trim();
    const isDialogue=dialogueMatch && !/^(画面|动作|镜头|音效|转场|说明|场景|字幕|旁白说明)$/.test(speaker);
    const body=isDialogue?dialogueMatch[2]:line;
    const split=pieces(body,settings.density==='细致拆分'?52:110);
    for(const [partIndex,part] of split.entries()){
      const source=split.length===1?line:(isDialogue?`${dialogueMatch[1]}：${part}`:part);
      const names=cast.filter(x=>source.includes(x.name)).map(x=>x.name);
      if(isDialogue && speaker && !names.includes(speaker))names.unshift(speaker);
      const detail=!isDialogue && /信封|车票|手机|照片|手指|泪水|眼眶|纸条|戒指|屏幕|一角|特写/.test(part);
      const size=isDialogue?'中景':first?'全景':detail?'特写':/目光|眼神|回头|微笑|笑容/.test(part)?'近景':'中景';
      const duration=isDialogue?Math.max(3,Math.ceil(part.length/(settings.pacing==='紧凑'?5:settings.pacing==='舒缓'?3.3:4.2))):settings.pacing==='紧凑'?3:settings.pacing==='舒缓'?6:4;
      const stage=isDialogue?dialogueMatch[1].match(/[（(]([^）)]*)[）)]/)?.[1]:'';
      const visual=isDialogue?`${speaker}的对白镜头${stage?`，${stage}`:''}。`:part.replace(/^(画面|动作|镜头)[：:]\s*/, '');
      shots.push({id:uid(),episodeName,scene,characters:names.join('、'),visual,dialogue:isDialogue?`${speaker}：${part}`:'',size,angle:'平视',movement:first&&!isDialogue?'缓慢推进':'固定镜头',duration,source,notes:split.length>1?`原段落已拆分 · ${partIndex+1}/${split.length}`:'',done:false,promptOverride:'',videoStart:'',videoAction:'',videoEnd:'',videoPromptOverride:''});
      first=false;
    }
  }
  return shots;
}

const text = value => typeof value==='string'?value:'';
const number = (value,fallback=4) => Math.max(1,Math.min(300,Number(value)||fallback));
const stringMap = value => value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.entries(value).filter(([key,v])=>key!=='__proto__'&&typeof v==='string')):{};
const safeIds = value => Array.isArray(value)?[...new Set(value.filter(v=>typeof v==='string'&&v))]:[];
const splitNames = value => text(value).split(/[、,，;；\n]/).map(v=>v.trim()).filter(Boolean);
const stylePresets = {'电影写实':DEFAULT_SETTINGS.stylePrefix,'日系动画':'日系动画风格，精致线稿，赛璐璐上色，富有表现力的人物','国风绘本':'国风绘本插画，细腻笔触，富有层次的色彩与构图'};
const styleEnPresets = {'电影写实':DEFAULT_SETTINGS.stylePrefixEn,'日系动画':'Japanese animation, delicate linework, cel shading, expressive characters','国风绘本':'Chinese illustrated storybook, delicate brushwork, layered colors and composition'};
const TERMS = {'大远景':'extreme wide shot','全景':'wide shot','中景':'medium shot','近景':'close shot','特写':'close-up','平视':'eye-level','俯拍':'high angle','仰拍':'low angle','过肩':'over-the-shoulder','主观视角':'point-of-view','固定镜头':'locked-off camera','缓慢推进':'slow dolly in','缓慢拉远':'slow dolly out','横向跟拍':'lateral tracking shot','手持跟随':'handheld tracking','摇镜':'smooth pan','真人':'live-action human','AI':'AI character','Q版AI':'chibi AI character','现实世界':'real world','虚拟空间':'virtual space'};
const englishTerm = (value,fallback) => TERMS[value] || (/^[\x00-\x7F]+$/.test(text(value))?value:fallback);
const englishContent = (specific,original,fallback) => text(specific).trim() || (text(original).trim()&&!/[\u3400-\u9fff]/u.test(original)?original:fallback);

export function normalizeShots(data){
  if(!Array.isArray(data)||data.length>3000)throw new Error('请提供不超过 3000 个镜头的 JSON 数组');
  const ids=new Set();
  return data.map((s,i)=>{
    if(!s||typeof s!=='object'||typeof s.visual!=='string'||!s.visual.trim())throw new Error(`第 ${i+1} 个镜头缺少 visual（画面描述）`);
    const generated=s.generatedPrompts===true;
    const status=STATUSES.includes(s.status)?s.status:s.done?'已确认':'待生成';
    let id=text(s.id)||uid();if(ids.has(id))id=uid();ids.add(id);
    const out={...s,id,episodeId:text(s.episodeId),episodeName:text(s.episodeName)||text(s.episode),sceneId:text(s.sceneId),scene:text(s.scene)||'场景 01｜未命名场景',sceneNumber:text(s.sceneNumber),spaceId:text(s.spaceId),space:text(s.space),characters:Array.isArray(s.characters)?s.characters.join('、'):text(s.characters),visual:text(s.visual),visualEn:text(s.visualEn),dialogue:text(s.dialogue),size:text(s.size)||'中景',angle:text(s.angle)||'平视',movement:text(s.movement)||'固定镜头',ratio:text(s.ratio),duration:number(s.duration),source:text(s.source),notes:text(s.notes),overlay:text(s.overlay),sound:text(s.sound),expression:text(s.expression),status,done:status==='已确认',promptOverride:text(s.promptOverride),promptOverrideEn:text(s.promptOverrideEn),videoStart:text(s.videoStart),videoAction:text(s.videoAction),videoEnd:text(s.videoEnd),videoPromptOverride:text(s.videoPromptOverride)||(!generated?text(s.videoPrompt):''),videoPromptOverrideEn:text(s.videoPromptOverrideEn),isIntro:!!s.isIntro};
    Object.assign(out,{frameMoment:text(s.frameMoment),frameMomentEn:text(s.frameMomentEn),composition:text(s.composition),compositionEn:text(s.compositionEn),environment:text(s.environment),environmentEn:text(s.environmentEn),focalLength:FOCAL_LENGTHS.includes(s.focalLength)?s.focalLength:'50mm',depthOfField:DEPTHS.includes(s.depthOfField)?s.depthOfField:'浅景深',characterPositions:stringMap(s.characterPositions),characterPositionsEn:stringMap(s.characterPositionsEn),negativePromptOverride:typeof s.negativePromptOverride==='string'?s.negativePromptOverride:(!generated&&typeof s.negativePrompt==='string'?s.negativePrompt:null),negativePromptOverrideEn:typeof s.negativePromptOverrideEn==='string'?s.negativePromptOverrideEn:(!generated&&typeof s.negativePromptEn==='string'?s.negativePromptEn:null)});
    // Missing characterIds indicates a legacy name list; an explicit [] means no characters.
    if(Array.isArray(s.characterIds))out.characterIds=safeIds(s.characterIds);else delete out.characterIds;
    return out;
  });
}

export function migrateProject(raw={}){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('项目数据格式不正确');
  const originalSettings=raw.settings&&typeof raw.settings==='object'?raw.settings:{};
  const settings={...DEFAULT_SETTINGS,...originalSettings};
  if(!Object.hasOwn(originalSettings,'stylePrefix')&&originalSettings.style)settings.stylePrefix=stylePresets[originalSettings.style]||originalSettings.style;
  if(!Object.hasOwn(originalSettings,'stylePrefixEn')&&originalSettings.style)settings.stylePrefixEn=styleEnPresets[originalSettings.style]||englishContent('',originalSettings.style,'Visual style follows the project reference');
  settings.promptLanguage=settings.promptLanguage==='en'?'en':'zh';
  const colors=['#d4ad70','#6aa1bf','#ad86c7','#78b39d','#c37f8d','#bfad69'];
  const hasLibrary=Array.isArray(raw.characters);
  let characters=(hasLibrary?raw.characters:parseCast(settings.cast)).filter(c=>c&&text(c.name).trim()).map((c,i)=>({id:text(c.id)||uid(),name:text(c.name).trim(),type:['真人','AI','Q版AI'].includes(c.type)?c.type:'真人',descriptionZh:text(c.descriptionZh)||text(c.description),descriptionEn:text(c.descriptionEn),referenceImage:/^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(text(c.referenceImage))?c.referenceImage:'',referenceOwnerIds:safeIds(c.referenceOwnerIds),color:/^#[0-9a-f]{6}$/i.test(text(c.color))?c.color:colors[i%colors.length]}));
  const charIds=new Set();characters.forEach(c=>{if(charIds.has(c.id))c.id=uid();charIds.add(c.id);});
  characters.forEach(c=>{c.referenceOwnerIds=c.type==='真人'?[]:c.referenceOwnerIds.filter(id=>id!==c.id&&charIds.has(id));});
  let spaces=(Array.isArray(raw.spaces)&&raw.spaces.length?raw.spaces:DEFAULT_SPACES).filter(s=>s&&text(s.name).trim()).map(s=>({id:text(s.id)||uid(),name:text(s.name).trim(),descriptionZh:s.descriptionZh==='暖黄低饱和，胶片颗粒，实景光源，手持感'?'暖黄低饱和，胶片颗粒，实景光源':text(s.descriptionZh),descriptionEn:s.descriptionEn==='Warm yellow low-saturation palette, film grain, practical lighting, a handheld feel'?'Warm yellow low-saturation palette, film grain, practical lighting':text(s.descriptionEn)}));
  if(!spaces.length)spaces=DEFAULT_SPACES.map(s=>({...s}));
  const spaceIds=new Set();spaces.forEach(s=>{if(spaceIds.has(s.id))s.id=uid();spaceIds.add(s.id);});
  const defaultSpace=spaces.find(s=>s.id==='real')||spaces[0];
  const shots=normalizeShots(Array.isArray(raw.shots)?raw.shots:[]);
  const episodes=(Array.isArray(raw.episodes)?raw.episodes:[]).filter(e=>e&&typeof e==='object').map(e=>({id:text(e.id)||uid(),name:text(e.name)||'未命名集',intro:e.intro&&text(e.intro.visual).trim()?normalizeShots([e.intro])[0]:null}));
  const epIds=new Set();episodes.forEach(e=>{if(epIds.has(e.id))e.id=uid();epIds.add(e.id);});
  const scenes=(Array.isArray(raw.scenes)?raw.scenes:[]).filter(s=>s&&typeof s==='object').map(s=>({id:text(s.id)||uid(),episodeId:text(s.episodeId),number:text(s.number)||'01',name:text(s.name)||'未命名场景',spaceId:spaceIds.has(s.spaceId)?s.spaceId:defaultSpace?.id||'real'}));
  const sceneIds=new Set();scenes.forEach(s=>{if(sceneIds.has(s.id))s.id=uid();sceneIds.add(s.id);});
  const getEpisode=shot=>{
    let episode=episodes.find(e=>e.id===shot.episodeId);
    if(!episode&&shot.episodeName)episode=episodes.find(e=>e.name===shot.episodeName);
    if(!episode&&shot.episodeName){episode={id:uid(),name:shot.episodeName,intro:null};episodes.push(episode);}
    if(!episode&&shot.episodeId){episode={id:shot.episodeId,name:`第${String(episodes.length+1).padStart(2,'0')}集`,intro:null};episodes.push(episode);}
    if(!episode)episode=episodes[0];
    if(!episode){episode={id:uid(),name:'第01集',intro:null};episodes.push(episode);}
    return episode;
  };
  const ensureCharacters=shot=>{
    if(Array.isArray(shot.characterIds)&&(!shot.characterIds.length||shot.characterIds.every(id=>characters.some(c=>c.id===id)))){shot.characterIds=shot.characterIds.filter(id=>characters.some(c=>c.id===id));}
    else {
      const names=splitNames(shot.characters);
      for(const name of names)if(!characters.some(c=>c.name===name))characters.push({id:uid(),name,type:'真人',descriptionZh:'',descriptionEn:'',referenceImage:'',referenceOwnerIds:[],color:colors[characters.length%colors.length]});
      shot.characterIds=characters.filter(c=>names.includes(c.name)).map(c=>c.id);
    }
    shot.characters=characters.filter(c=>shot.characterIds.includes(c.id)).map(c=>c.name).join('、');
  };
  shots.forEach(shot=>{
    const episode=getEpisode(shot);shot.episodeId=episode.id;shot.episodeName=episode.name;
    if(shot.isIntro){shot.sceneId='';shot.scene='通用片头';shot.sceneNumber='00';ensureCharacters(shot);episode.intro=shot;return;}
    let scene=scenes.find(s=>s.id===shot.sceneId&&s.episodeId===episode.id);
    const inferredNumber=shot.sceneNumber||shot.scene.match(/^(?:场景|场次)?\s*([\d零一二三四五六七八九十]+)(?:[｜|：:\s.、]|$)/)?.[1]||'';
    const inferredName=shot.scene.replace(/^(?:场景|场次)\s*[\d零一二三四五六七八九十]*[｜|：:\s]*/,'')||shot.scene;
    if(!scene)scene=scenes.find(s=>s.episodeId===episode.id&&((s.name===shot.scene||s.name===inferredName)&&(!inferredNumber||s.number===inferredNumber)));
    if(!scene){scene={id:shot.sceneId&&!scenes.some(s=>s.id===shot.sceneId)?shot.sceneId:uid(),episodeId:episode.id,number:inferredNumber||String(scenes.filter(s=>s.episodeId===episode.id).length+1).padStart(2,'0'),name:inferredName,spaceId:spaceIds.has(shot.sceneSpaceId)?shot.sceneSpaceId:spaces.find(s=>s.name===shot.sceneSpace)?.id||defaultSpace?.id||'real'};scenes.push(scene);}
    shot.sceneId=scene.id;shot.sceneNumber=scene.number;
    if(shot.space&&!spaceIds.has(shot.spaceId)){
      let found=spaces.find(s=>s.name===shot.space);
      if(!found&&shot.space){found={id:uid(),name:shot.space,descriptionZh:'',descriptionEn:''};spaces.push(found);spaceIds.add(found.id);}
      shot.spaceId=found?.id||'';
    }
    if(!spaceIds.has(shot.spaceId))shot.spaceId='';
    shot.space=shot.spaceId?spaces.find(s=>s.id===shot.spaceId)?.name||'':'';
    ensureCharacters(shot);
  });
  if(!episodes.length)episodes.push({id:uid(),name:'第01集',intro:null});
  scenes.forEach(s=>{if(!episodes.some(e=>e.id===s.episodeId))s.episodeId=episodes[0].id;});
  const usedShotIds=new Set(shots.filter(s=>!s.isIntro).map(s=>s.id));
  episodes.forEach(e=>{if(e.intro){if(usedShotIds.has(e.intro.id))e.intro.id=uid();usedShotIds.add(e.intro.id);Object.assign(e.intro,{episodeId:e.id,episodeName:e.name,sceneId:'',scene:'通用片头',sceneNumber:'00',isIntro:true,spaceId:spaceIds.has(e.intro.spaceId)?e.intro.spaceId:defaultSpace?.id||'real'});ensureCharacters(e.intro);}});
  settings.cast=characters.map(c=>`${c.name}｜${c.descriptionZh}`).join('\n');
  return {...raw,version:2,title:text(raw.title)||'未命名项目',script:text(raw.script),settings,characters,spaces,episodes,scenes,shots:shots.filter(s=>!s.isIntro),isDemo:!!raw.isDemo};
}

export function orderedShots(state){
  if(!Array.isArray(state.episodes)||!Array.isArray(state.scenes))return state.shots||[];
  const result=[],seen=new Set();
  const add=s=>{if(!seen.has(s.id)){seen.add(s.id);result.push(s);}};
  for(const ep of state.episodes){
    if(ep.intro){Object.assign(ep.intro,{episodeId:ep.id,episodeName:ep.name,isIntro:true,sceneId:'',scene:'通用片头',sceneNumber:'00'});add(ep.intro);}
    for(const scene of state.scenes.filter(s=>s.episodeId===ep.id))for(const shot of state.shots.filter(s=>s.episodeId===ep.id&&s.sceneId===scene.id))add(shot);
    for(const shot of state.shots.filter(s=>s.episodeId===ep.id))add(shot);
  }
  for(const shot of state.shots)add(shot);
  return result;
}
export function promptContext(state){return {...state.settings,characters:state.characters,spaces:state.spaces,scenes:state.scenes,episodes:state.episodes};}
export function selectedCharacters(shot,settings=DEFAULT_SETTINGS){
  if(Array.isArray(settings.characters)){
    if(Array.isArray(shot.characterIds))return settings.characters.filter(c=>shot.characterIds.includes(c.id));
    const names=splitNames(shot.characters);return settings.characters.filter(c=>names.includes(c.name));
  }
  return parseCast(settings.cast).filter(c=>(text(shot.characters)+' '+text(shot.visual)+' '+text(shot.source)).includes(c.name)).map(c=>({...c,id:c.name,descriptionZh:c.description,type:'真人',referenceOwnerIds:[]}));
}
export function referenceRequirements(shot,settings=DEFAULT_SETTINGS){
  const selected=selectedCharacters(shot,settings),all=settings.characters||selected,refs=[];
  const add=c=>{if(c&&!refs.some(r=>r.id===c.id))refs.push(c);};
  for(const c of selected){add(c);if(c.type!=='真人')for(const id of c.referenceOwnerIds||[])add(all.find(x=>x.id===id));}
  return refs;
}
function spaceFor(shot,settings){const spaces=settings.spaces||DEFAULT_SPACES;const inherited=settings.scenes?.find(s=>s.id===shot.sceneId)?.spaceId;return spaces.find(s=>s.id===(shot.spaceId||inherited)||(!shot.spaceId&&!inherited&&s.name===shot.space))||spaces.find(s=>s.id==='real')||spaces[0];}
function referenceLines(shot,settings,lang){
  const selected=selectedCharacters(shot,settings),all=settings.characters||selected,refs=referenceRequirements(shot,settings);
  const owners=selected.flatMap(c=>c.type==='真人'?[]:(c.referenceOwnerIds||[]).map(id=>({c,owner:all.find(x=>x.id===id)})).filter(x=>x.owner));
  const ownerText=owners.map(({c,owner})=>lang==='en'?`${c.name}: use ${owner.name}’s character reference portrait as reference`:`${c.name}：以${owner.name}定妆照为参考`).join('；');
  const refText=refs.length?(lang==='en'?`Upload character reference portraits: ${refs.map(c=>`${c.name}${c.referenceImage?' (reference stored in project)':' (reference image still needed)'}`).join('; ')}`:`请上传参考图：${refs.map(c=>`${c.name}定妆照${c.referenceImage?'':'（尚未上传）'}`).join('、')}`):'';
  return [ownerText,refText].filter(Boolean);
}
// Automatic prompt bodies contain only visible image content or visible video direction.
// Tool operation notes, references, dialogue and exclusions live in their own UI/export fields.
const CN_NOISE=/(?:风铃轻响|风铃.{0,5}(?:响|声)|脚步声|铃声|声响|声音|响起|轻响|轰鸣|音乐|音效|旁白|台词|心想|心里|内心|意识到|认出|想起|回忆起|明白|意识|决定|认为|觉得|担心|希望|知道了)/;
const EN_NOISE=/\b(?:sound(?:s|track)?|chime(?:s|d)?|ringing|voice.?over|music|audio|dialogue|narration|realiz(?:e|es|ed|ing)|recogniz(?:e|es|ed|ing)|remember(?:s|ed|ing)?|think(?:s|ing)?|thought)\b/i;
const CN_CAMERA=/(?:手持(?:感|摄影|机位|跟随|镜头|拍摄)|(?:镜头|相机|摄影机)(?:缓慢|平稳|快速|轻微)?(?:推进|拉远|推近|跟拍|跟随|摇镜|摇摄|推轨|变焦|移动|晃动)|(?:缓慢|平稳|快速)?(?:推进|拉远|推近|跟拍|摇镜|摇摄|推轨|变焦)|运镜)/;
const EN_CAMERA=/\b(?:handheld|camera\s+(?:moves?|movement|tracking|pans?|zooms?)|dolly|tracking\s+shot|panning|zoom(?:s|ing)?|camera\s+shake)\b/i;
const sentence=value=>text(value).replace(/[。.!！?？;；\s]+$/u,'').trim();
function removeLabels(value){return text(value).replace(/(?:^|[，,。\n；;])\s*(?:(?:场景|场次|镜头|镜号|shot|scene)\s*[#＃]?\s*[\d零一二三四五六七八九十百]+|第[\d零一二三四五六七八九十百]+集)\s*(?:[｜|:：.-]\s*)?/gi,'').replace(/【[^】]*】|\[(?:SCENE|ACTION|CAMERA|START|END|BASE IMAGE PROMPT|VIDEO SPEC|DIALOGUE|SOUND\s*\/\s*MUSIC|POST.PRODUCTION|CONTINUITY)\]/gi,'').replace(/(?:^|[\n。；，,])\s*(?:画面|场景|空间与光线|光线与色彩|动作过程|起始画面|结束画面|表情变化|镜头语言|音效|音乐|对白|旁白|字幕|后期叠加)\s*[：:]\s*/g,'').trim();}
function visibleParts(value,lang,{frozen=false}={}){
  let raw=removeLabels(value).replace(/[“”"「」][^“”"「」]*[“”"「」]/g,'');
  // A sequence becomes its first drawable action in image mode; video retains the sequence.
  if(frozen)raw=raw.split(lang==='en'?/\b(?:then|afterwards|subsequently|next|finally|before|after)\b/i:/(?:然后|随后|接着|继而|最后|紧接着|再(?:次)?(?:走|转|抬|低|伸|拿|看|说|跑|坐|站|推|开|关|把|将))/)[0];
  const parts=raw.split(/[。！？!?；;\n，,]/).map(p=>p.trim()).filter(Boolean).filter(p=>!(lang==='en'?EN_NOISE:CN_NOISE).test(p)).filter(p=>!CN_CAMERA.test(p)&&!EN_CAMERA.test(p)).filter(p=>!/(?:上传|参考图|定妆照|首帧|不生成文字|排除元素|reference (?:image|portrait)|upload|first frame|do not (?:generate|render) text)/i.test(p));
  return parts.map(p=>lang==='en'?(frozen?p.replace(/\b(?:gradually|slowly|suddenly|initially|first)\b\s*/gi,''):p).replace(/\bfor the first time\b/gi,'').trim():(frozen?p.replace(/(?:渐渐|逐渐|慢慢|缓缓|突然|先(?=[\u3400-\u9fff]))/g,''):p).replace(/(?:第一次|首次)/g,'').replace(/(?:的)?(?:对白|说话|台词)镜头/g,'').trim()).filter(Boolean);
}
function frozenMoment(shot,lang){
  const direct=lang==='en'?shot.frameMomentEn:shot.frameMoment;
  let source=direct|| (lang==='en'?englishContent(shot.visualEn,shot.visual,''):shot.visual);
  if(!direct){const candidates=text(source).split(/[。！？!?;；\n]/).filter(v=>visibleParts(v,lang,{frozen:true}).length);const names=splitNames(shot.characters);source=candidates.find(v=>names.some(name=>v.includes(name)))||candidates[0]||'';}
  const parts=visibleParts(source,lang,{frozen:true});
  // Explicit frozen descriptions may contain multiple simultaneous poses; a raw script falls back to one visible sentence.
  return parts.join(lang==='en'?', ':'，');
}
function cleanLighting(value,lang){
  return text(value).split(/[，,。.;；\n]/).map(p=>p.trim()).filter(Boolean).filter(p=>!CN_CAMERA.test(p)&&!EN_CAMERA.test(p)).filter(p=>!/(?:构图|composition|symmetrical framing)/i.test(p)).map(p=>lang==='en'?p.replace(/\b(?:slowly|gradually)\b\s*/gi,''):p.replace(/(?:渐渐|逐渐|慢慢|缓缓)/g,'')).filter(Boolean).join(lang==='en'?', ':'，');
}
function placeName(shot,settings,lang){
  const scene=settings.scenes?.find(s=>s.id===shot.sceneId);
  const source=lang==='en'?englishContent(shot.sceneEn||scene?.nameEn,scene?.name||shot.scene,''):scene?.name||shot.scene;
  return text(source).replace(/^(?:第[零一二三四五六七八九十百\d]+集[\s·｜|:：-]*)?(?:(?:场景|场次|scene)\s*[零一二三四五六七八九十百\d]*[\s｜|:：.-]*|\d+[-—]\d+[\s、.:：]*)/i,'').split(/[｜|·]/).map(s=>s.trim()).filter(s=>s&&!/^(?:内|外|内景|外景|日|夜|未命名场景|未命名|通用片头|INT\.?|EXT\.?)$/i.test(s)).join(lang==='en'?', ':'，');
}
function environmentText(shot,settings,lang){
  const explicit=lang==='en'?englishContent(shot.environmentEn,shot.environment,''):shot.environment;
  if(explicit)return visibleParts(explicit,lang).join(lang==='en'?', ':'，');
  const place=placeName(shot,settings,lang);
  const raw=visibleParts(lang==='en'?englishContent(shot.visualEn,shot.visual,''):shot.visual,lang).join(' ');
  const props=lang==='en'?[...new Set((raw.match(/\b(?:window|bookshelf|counter|envelope|ticket|glass|door|phone|screen|book|chair|table|bed|curtain|mirror|umbrella|photograph|ring|letter)\b/gi)||[]).map(v=>v.toLowerCase()))]:[...new Set(raw.match(/(?:橱窗|书架|柜台|信封|车票|玻璃|门口|门|手机|屏幕|座椅|桌子|书桌|床|窗帘|镜子|雨伞|伞|照片|戒指|纸条)/g)||[])];
  return [place,props.length?(lang==='en'?`${props.join(', ')} visible in the environment`:`环境中可见${props.join('、')}`):''].filter(Boolean).join(lang==='en'?', ':'，');
}
function compositionText(shot,settings,lang){
  const ratio=shot.ratio||settings.ratio||'9:16';
  const explicit=lang==='en'?englishContent(shot.compositionEn,shot.composition,''):shot.composition;
  const space=spaceFor(shot,settings),symmetric=!explicit&&/(?:对称构图|symmetrical composition)/i.test(lang==='en'?space?.descriptionEn||'':space?.descriptionZh||'');
  const composition=visibleParts(explicit,lang,{frozen:true}).join(lang==='en'?', ':'，')|| (symmetric?(lang==='en'?'symmetrical composition':'对称构图'):'');
  return lang==='en'?[englishTerm(shot.size,'medium shot'),englishTerm(shot.angle,'eye-level'),`${ratio} ${ratio==='9:16'?'vertical':ratio==='16:9'?'horizontal':'square'} composition`,composition].filter(Boolean).join(', '):[shot.size||'中景',shot.angle||'平视',`${ratio}${ratio==='9:16'?'竖幅':ratio==='16:9'?'横幅':'方形'}构图`,composition].filter(Boolean).join('，');
}
function positionFor(shot,character,index,count,lang){
  const map=lang==='en'?shot.characterPositionsEn:shot.characterPositions;
  const explicit=text(map?.[character.id]).trim();
  if(explicit)return sentence(explicit);
  if(count===1)return lang==='en'?'in the center of the frame':'画面中央';
  if(count===2)return lang==='en'?(index===0?'on the left side of the frame':'on the right side of the frame'):(index===0?'画面左侧':'画面右侧');
  if(count===3)return lang==='en'?['on the left side of the frame','in the center of the frame','on the right side of the frame'][index]:['画面左侧','画面中央','画面右侧'][index];
  return lang==='en'?`at position ${index+1} from left to right in the frame`:`画面中从左至右第${index+1}位`;
}
function appearanceText(shot,settings,lang){
  const cast=selectedCharacters(shot,settings);
  return cast.map((c,index)=>{
    const description=lang==='en'?englishContent(c.descriptionEn,c.descriptionZh||c.description,''):c.descriptionZh||c.description||'';
    const position=positionFor(shot,c,index,cast.length,lang);
    if(lang==='en')return [c.name,description,position].filter(Boolean).join(', ');
    const parts=text(description).split(/[，,；;。]/).map(s=>s.trim()).filter(Boolean),clothing=[],other=[];
    for(const part of parts){if(/(?:衣|衫|裙|裤|袍|外套|夹克|制服|卫衣|T恤|靴|鞋|套装|马甲|铠甲)/i.test(part)&&!/(?:皮肤|肌肤)/.test(part))clothing.push(part.replace(/^(?:身穿|穿着|穿|身着)/,''));else other.push(part);}
    const person=`${clothing.length?`穿${clothing.join('、')}的`:''}${c.name}`;
    return [person,...other,position?( /^(?:站|坐|靠|躺|蹲|位于|在|处于|画面)/.test(position)?position:`位于${position}`):''].filter(Boolean).join('，');
  }).join(lang==='en'?'; ':'；');
}
function styleText(settings,lang){
  const style=Object.hasOwn(settings,'stylePrefix')?settings.stylePrefix:stylePresets[settings.style]||settings.style;
  return cleanLighting(lang==='en'?englishContent(settings.stylePrefixEn,style,''):style,lang);
}
function lightText(shot,settings,lang){
  const space=spaceFor(shot,settings),cast=selectedCharacters(shot,settings);
  const base=lang==='en'?englishContent(space?.descriptionEn,space?.descriptionZh,''):space?.descriptionZh;
  const tone=lang==='en'?englishContent(settings.toneEn,settings.tone,''):settings.tone;
  const colored=(space?.id==='virtual'||space?.name==='虚拟空间')&&cast.length?(lang==='en'?cast.map(c=>`${c.name} rim light in ${c.color||'#d4ad70'}`).join(', '):cast.map(c=>`${c.name}带${c.color||'#d4ad70'}代表色轮廓光`).join('，')):'';
  return [cleanLighting(base,lang),cleanLighting(tone,lang),colored].filter(Boolean).join(lang==='en'?', ':'，');
}
export function negativePromptFor(shot,settings=DEFAULT_SETTINGS,lang=settings.promptLanguage||'zh'){
  const override=lang==='en'?shot.negativePromptOverrideEn:shot.negativePromptOverride;
  if(typeof override==='string')return override;
  return text(lang==='en'?settings.negativeEn:settings.negative);
}
export function promptHints(shot,settings=DEFAULT_SETTINGS,lang=settings.promptLanguage||'zh'){
  const en=lang==='en',hints=Array.isArray(settings.characters)?referenceLines(shot,settings,lang):[];
  if(shot.dialogue){hints.push(en?'Do not render dialogue as text in the image':'画面中不生成对白文字');hints.push(en?`Original dialogue: ${shot.dialogue}`:`原对白：${shot.dialogue}`);if(!text(en?shot.frameMomentEn:shot.frameMoment).trim())hints.push(en?'Add the speaker’s visible action and expression':'请补充说话时的动作和表情');}
  if(shot.overlay)hints.push(en?'Reserve screen/interface areas for post-production overlays; do not generate text':'预留屏幕/界面区域，不生成文字；聊天气泡、日志、弹窗与字幕留待后期叠加');
  if(settings.videoMode!=='文生视频')hints.push(en?'For image-to-video, upload the actual generated image result as the first frame':'图生视频时，使用实际生图结果作为首帧上传');
  return hints;
}
export function promptFor(shot,settings=DEFAULT_SETTINGS,lang=settings.promptLanguage||'zh'){
  const en=lang==='en',override=en?shot.promptOverrideEn:shot.promptOverride;
  if(text(override).trim())return override;
  const focal=FOCAL_LENGTHS.includes(shot.focalLength)?shot.focalLength:'50mm';
  const depth=DEPTHS.includes(shot.depthOfField)?shot.depthOfField:'浅景深';
  const lens=en?({'24mm广角':'24mm wide-angle lens','35mm':'35mm lens','50mm':'50mm lens','85mm人像':'85mm portrait lens','微距':'macro lens'}[focal]):`${focal}镜头`;
  const depthText=en?(depth==='深景深'?'deep depth of field':'shallow depth of field'):depth;
  const parts=[compositionText(shot,settings,lang),appearanceText(shot,settings,lang),frozenMoment(shot,lang),environmentText(shot,settings,lang),lightText(shot,settings,lang),[lens,depthText].join(en?', ':'，'),styleText(settings,lang)].map(sentence).filter(Boolean);
  return parts.join(en?'. ':'。')+(en?'.':'。');
}
function videoVisible(value,lang){return visibleParts(value,lang).join(lang==='en'?', ':'，');}
export function videoPromptFor(shot,settings=DEFAULT_SETTINGS,lang=settings.promptLanguage||'zh'){
  const en=lang==='en',override=en?shot.videoPromptOverrideEn:shot.videoPromptOverride;
  if(text(override).trim())return override;
  const ratio=shot.ratio||settings.ratio||'9:16';
  const start=videoVisible(en?englishContent(shot.videoStartEn,shot.videoStart,''):shot.videoStart,lang)||frozenMoment(shot,lang);
  const action=videoVisible(en?englishContent(shot.videoActionEn||shot.visualEn,shot.videoAction||shot.visual,''):shot.videoAction||shot.visual,lang);
  const end=videoVisible(en?englishContent(shot.videoEndEn,shot.videoEnd,''):shot.videoEnd,lang);
  const expression=videoVisible(en?englishContent(shot.expressionEn,shot.expression,''):shot.expression,lang)||(selectedCharacters(shot,settings).length?(en?'Natural subtle facial changes':'表情自然细微变化'):'');
  const movement=en?englishTerm(shot.movement,'locked-off camera'):shot.movement||'固定镜头';
  const distinctAction=action!==start?action:'';
  const transition=en?[start?`Starting with ${start}`:'',distinctAction,end&&end!==start&&end!==action?`ending with ${end}`:''].filter(Boolean).join(', '):[start?`从${start}开始`:'',distinctAction,end&&end!==start&&end!==action?`最终到${end}`:''].filter(Boolean).join('，');
  const parts=[`${ratio}${en?' aspect ratio':'画幅'}${styleText(settings,lang)?(en?', ':'，')+styleText(settings,lang):''}`,appearanceText(shot,settings,lang),transition,expression,en?movement:movement==='固定镜头'?'镜头保持固定':`镜头${movement}`,en?`Duration ${number(shot.duration)} seconds`:`时长 ${number(shot.duration)} 秒`].map(sentence).filter(Boolean);
  return parts.join(en?'. ':'。')+(en?'.':'。');
}

export function exportProject(state){
  const ctx=promptContext(state),rendered=s=>({...s,generatedPrompts:true,imagePrompt:promptFor(s,ctx),videoPrompt:videoPromptFor(s,ctx),imagePromptEn:promptFor(s,ctx,'en'),videoPromptEn:videoPromptFor(s,ctx,'en'),negativePrompt:negativePromptFor(s,ctx),negativePromptEn:negativePromptFor(s,ctx,'en')});
  return {...state,version:2,exportedAt:new Date().toISOString(),shots:state.shots.map(rendered),episodes:(state.episodes||[]).map(e=>({...e,intro:e.intro?rendered(e.intro):null}))};
}
const CSV_HEADERS=['集','场景号','场景名','空间','镜号','景别','机位','画幅','画面描述','出场角色','时长','运镜','对白','后期叠加','音效','生图提示词','视频提示词','状态','原文','备注','视频起始画面','视频动作过程','视频结束画面','表情变化','画面描述英文','动作英文','表情英文','集ID','场景ID','镜头ID','角色ID','空间ID','镜头画幅覆盖','通用片头','提示词来源','手工生图提示词','手工视频提示词','英文生图提示词覆盖','英文视频提示词覆盖','起始画面英文','结束画面英文','音效英文','后期叠加英文','场景英文','场景默认空间ID','场景默认空间','提示词语言','导出生图提示词基线','导出视频提示词基线','英文生图提示词','英文视频提示词','导出英文生图提示词基线','导出英文视频提示词基线','导出空间基线','导出画幅基线','导出角色基线','导出集基线','导出场景号基线','导出场景名基线','画面瞬间','画面瞬间英文','构图','构图英文','环境道具','环境道具英文','焦段','景深','角色位置','角色位置英文','反向提示词','英文反向提示词','反向提示词覆盖','英文反向提示词覆盖','导出反向提示词基线','导出英文反向提示词基线'];
function csvCell(value){let str=String(value??'');if(/^[\s]*[=+@\-]/.test(str))str="'"+str;return '"'+str.replace(/"/g,'""')+'"';}
export function toCSV(state){
  const ctx=promptContext(state);
  const rows=orderedShots(state).map((shot,index)=>{
    const ep=state.episodes?.find(e=>e.id===shot.episodeId),scene=state.scenes?.find(s=>s.id===shot.sceneId),space=spaceFor(shot,ctx);
    const characterNames=Array.isArray(ctx.characters)?selectedCharacters(shot,ctx).map(c=>c.name).join('、'):shot.characters;
    const image=promptFor(shot,ctx),video=videoPromptFor(shot,ctx),imageEn=promptFor(shot,ctx,'en'),videoEn=videoPromptFor(shot,ctx,'en');
    return [ep?.name||shot.episodeName||'第01集',shot.isIntro?'00':scene?.number||shot.sceneNumber||'',shot.isIntro?'通用片头':scene?.name||shot.scene,space?.name||shot.space||'',String(index+1).padStart(2,'0'),shot.size,shot.angle,shot.ratio||state.settings.ratio,shot.visual,characterNames,shot.duration,shot.movement,shot.dialogue,shot.overlay||'',shot.sound||'',image,video,shot.status|| (shot.done?'已确认':'待生成'),shot.source,shot.notes,shot.videoStart||'',shot.videoAction||'',shot.videoEnd||'',shot.expression||'',shot.visualEn||'',shot.videoActionEn||'',shot.expressionEn||'',shot.episodeId||'',shot.sceneId||'',shot.id||'',JSON.stringify(shot.characterIds||[]),shot.spaceId||'',shot.ratio||'',shot.isIntro?'是':'否','镜序自动',shot.promptOverride||'',shot.videoPromptOverride||'',shot.promptOverrideEn||'',shot.videoPromptOverrideEn||'',shot.videoStartEn||'',shot.videoEndEn||'',shot.soundEn||'',shot.overlayEn||'',shot.sceneEn||'',scene?.spaceId||'',state.spaces?.find(s=>s.id===scene?.spaceId)?.name||'',ctx.promptLanguage==='en'?'en':'zh',image,video,imageEn,videoEn,imageEn,videoEn,space?.name||shot.space||'',shot.ratio||state.settings.ratio,characterNames,ep?.name||shot.episodeName||'第01集',shot.isIntro?'00':scene?.number||shot.sceneNumber||'',shot.isIntro?'通用片头':scene?.name||shot.scene,shot.frameMoment||'',shot.frameMomentEn||'',shot.composition||'',shot.compositionEn||'',shot.environment||'',shot.environmentEn||'',shot.focalLength||'50mm',shot.depthOfField||'浅景深',JSON.stringify(shot.characterPositions||{}),JSON.stringify(shot.characterPositionsEn||{}),negativePromptFor(shot,ctx),negativePromptFor(shot,ctx,'en'),JSON.stringify(shot.negativePromptOverride??null),JSON.stringify(shot.negativePromptOverrideEn??null),negativePromptFor(shot,ctx),negativePromptFor(shot,ctx,'en')];
  });
  return '\uFEFF'+[CSV_HEADERS,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n');
}
export function parseCSV(input){
  const content=String(input).replace(/^\uFEFF/,'');
  const rows=[];let row=[],cell='',quoted=false,afterQuote=false;
  for(let i=0;i<content.length;i++){
    const char=content[i];
    if(quoted){if(char==='"'){if(content[i+1]==='"'){cell+='"';i++;}else{quoted=false;afterQuote=true;}}else cell+=char;continue;}
    if(char==='"'&&!cell&&!afterQuote){quoted=true;continue;}
    if(char===','){row.push(cell);cell='';afterQuote=false;continue;}
    if(char==='\r'||char==='\n'){if(char==='\r'&&content[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell='';afterQuote=false;continue;}
    if(afterQuote&&char.trim())throw new Error('CSV 引号结束后出现多余字符');
    if(!afterQuote)cell+=char;
  }
  if(quoted)throw new Error('CSV 引号未闭合，请检查文件格式');
  if(cell||row.length){row.push(cell);if(row.some(v=>v.trim()))rows.push(row);}
  if(rows.length<2)throw new Error('CSV 没有可导入的镜头');
  if(rows.length>3001)throw new Error('请提供不超过 3000 个镜头的 CSV');
  const headers=rows.shift().map(v=>v.trim());
  if(!headers.includes('画面描述')&&!headers.includes('visual'))throw new Error('CSV 缺少“画面描述”列');
  const output=rows.map((values,index)=>{
    const record=Object.fromEntries(headers.map((key,i)=>[key,values[i]??'']));
    const own=record['提示词来源']==='镜序自动';
    const read=(...keys)=>{const key=keys.find(k=>Object.hasOwn(record,k));let value=key?record[key]:'';if(own&&/^'[\s]*[=+@\-]/.test(value))value=value.slice(1);return value;};
    const sceneNumber=read('场景号','sceneNumber'),sceneName=read('场景名','场次','场景','scene');
    const shot={sceneSpaceId:read('场景默认空间ID','sceneSpaceId'),sceneSpace:read('场景默认空间','sceneSpace'),id:read('镜头ID','id'),episodeId:read('集ID','episodeId'),episodeName:read('集','episodeName','episode'),sceneId:read('场景ID','sceneId'),sceneNumber,scene:sceneNumber&&sceneName?`场景 ${sceneNumber}｜${sceneName}`:sceneName||'场景 01｜未命名场景',space:own&&!read('空间ID','spaceId')?'':read('空间','space'),spaceId:read('空间ID','spaceId'),characters:read('出场角色','人物','characters'),ratio:own?read('镜头画幅覆盖'):read('画幅','ratio'),visual:read('画面描述','visual'),size:read('景别','size'),angle:read('机位','angle'),duration:Number(read('时长','时长（秒）','duration'))||4,movement:read('运镜','movement'),dialogue:read('对白','dialogue'),overlay:read('后期叠加','overlay'),sound:read('音效','音效/音乐','sound'),status:read('状态','status'),source:read('原文','source'),notes:read('备注','notes'),videoStart:read('视频起始画面','videoStart'),videoAction:read('视频动作过程','videoAction'),videoEnd:read('视频结束画面','videoEnd'),expression:read('表情变化','expression'),visualEn:read('画面描述英文','visualEn'),videoActionEn:read('动作英文','videoActionEn'),expressionEn:read('表情英文','expressionEn'),videoStartEn:read('起始画面英文','videoStartEn'),videoEndEn:read('结束画面英文','videoEndEn'),soundEn:read('音效英文','soundEn'),overlayEn:read('后期叠加英文','overlayEn'),sceneEn:read('场景英文','sceneEn'),isIntro:['是','true','1'].includes(read('通用片头','isIntro')),promptOverride:own?read('手工生图提示词','promptOverride'):read('生图提示词','promptOverride'),videoPromptOverride:own?read('手工视频提示词','videoPromptOverride'):read('视频提示词','videoPromptOverride'),promptOverrideEn:read('英文生图提示词覆盖','promptOverrideEn'),videoPromptOverrideEn:read('英文视频提示词覆盖','videoPromptOverrideEn')};
    Object.assign(shot,{frameMoment:read('画面瞬间','frameMoment'),frameMomentEn:read('画面瞬间英文','frameMomentEn'),composition:read('构图','composition'),compositionEn:read('构图英文','compositionEn'),environment:read('环境道具','environment'),environmentEn:read('环境道具英文','environmentEn'),focalLength:read('焦段','focalLength')||'50mm',depthOfField:read('景深','depthOfField')||'浅景深'});
    for(const [column,key]of [['角色位置','characterPositions'],['角色位置英文','characterPositionsEn']]){const value=read(column,key);if(value){try{shot[key]=stringMap(JSON.parse(value));}catch{throw new Error(`第 ${index+2} 行的${column}格式有误`);}}}
    const parseNullable=(column,key)=>{if(Object.hasOwn(record,column)||Object.hasOwn(record,key)){const value=read(column,key);try{const parsed=JSON.parse(value);return typeof parsed==='string'?parsed:null;}catch{return value;}}return null;};
    shot.negativePromptOverride=own?parseNullable('反向提示词覆盖','negativePromptOverride'):(Object.hasOwn(record,'反向提示词')?read('反向提示词'):null);
    shot.negativePromptOverrideEn=own?parseNullable('英文反向提示词覆盖','negativePromptOverrideEn'):(Object.hasOwn(record,'英文反向提示词')?read('英文反向提示词'):null);
    if(own){
      // Baselines distinguish Excel edits to visible prompt columns from unchanged automatic output.
      // Edited visible columns win over the original override columns; unchanged exports stay live.
      const changed=(column,baseline)=>Object.hasOwn(record,column)&&Object.hasOwn(record,baseline)&&read(column)!==read(baseline);
      const currentEn=read('提示词语言')==='en';
      const imageChanged=changed('生图提示词','导出生图提示词基线'),videoChanged=changed('视频提示词','导出视频提示词基线');
      if(changed('反向提示词','导出反向提示词基线'))shot[currentEn?'negativePromptOverrideEn':'negativePromptOverride']=read('反向提示词');
      if(changed('英文反向提示词','导出英文反向提示词基线'))shot.negativePromptOverrideEn=read('英文反向提示词');
      if(changed('英文生图提示词','导出英文生图提示词基线'))shot.promptOverrideEn=read('英文生图提示词');
      if(changed('英文视频提示词','导出英文视频提示词基线'))shot.videoPromptOverrideEn=read('英文视频提示词');
      if(imageChanged)shot[currentEn?'promptOverrideEn':'promptOverride']=read('生图提示词');
      if(videoChanged)shot[currentEn?'videoPromptOverrideEn':'videoPromptOverride']=read('视频提示词');
    }
    const rawIds=read('角色ID','characterIds');
    if(rawIds){try{const ids=JSON.parse(rawIds);if(Array.isArray(ids)&&ids.length)shot.characterIds=ids;}catch{throw new Error(`第 ${index+2} 行的角色ID格式有误`);}}
    if(own){
      const changed=(column,baseline)=>Object.hasOwn(record,column)&&Object.hasOwn(record,baseline)&&read(column)!==read(baseline);
      if(changed('空间','导出空间基线')){shot.spaceId='';shot.space=read('空间');}
      if(changed('画幅','导出画幅基线'))shot.ratio=read('画幅');
      if(changed('出场角色','导出角色基线'))delete shot.characterIds;
      const episodeChanged=changed('集','导出集基线');
      const sceneChanged=changed('场景号','导出场景号基线')||changed('场景名','导出场景名基线');
      if(episodeChanged)shot.episodeId='';
      if(episodeChanged||sceneChanged)shot.sceneId='';
    }
    return shot;
  });
  return normalizeShots(output);
}
export function toVideoText(state){const ctx=promptContext(state);return `${state.title} · 视频提示词\n生成方式：${state.settings.videoMode||'图生视频'}\n\n`+orderedShots(state).map((s,i)=>`${s.episodeName||state.episodes?.find(e=>e.id===s.episodeId)?.name||''} · 镜头 ${String(i+1).padStart(2,'0')} · ${s.scene}\n${videoPromptFor(s,ctx)}`).join('\n\n--------------------\n\n');}
export function toMarkdown(state){const ctx=promptContext(state),shots=orderedShots(state);return `# ${state.title}\n\n画幅：${state.settings.ratio} · 风格：${state.settings.stylePrefix||state.settings.style} · 共 ${shots.length} 镜\n\n角色设定：\n${(state.characters||[]).map(c=>`${c.name}｜${c.descriptionZh}`).join('\n')||state.settings.cast||''}\n\n`+shots.map((s,i)=>`## ${state.episodes?.find(e=>e.id===s.episodeId)?.name||s.episodeName||'第01集'} · 镜头 ${String(i+1).padStart(2,'0')} · ${s.scene}\n\n${s.size} / ${s.angle} / ${s.movement} / ${s.duration} 秒 / ${s.status||'待生成'}\n\n**画面**：${s.visual}\n\n**对白**：${s.dialogue||'无'}\n\n**后期叠加**：${s.overlay||'无'}\n\n**音效/音乐**：${s.sound||'无'}\n\n**生图提示词**：\n${promptFor(s,ctx)}\n\n**视频提示词**：\n${videoPromptFor(s,ctx)}\n\n**原文**：${s.source}\n\n**备注**：${s.notes||'无'}\n`).join('\n---\n\n');}
export function aiInstruction(state,subset){
  const all=orderedShots(state),selected=Array.isArray(subset)?subset.map(item=>typeof item==='string'?all.find(s=>s.id===item):item).filter(Boolean):all;
  const ctx=promptContext(state);
  const shots=selected.map(s=>({id:s.id,scene:placeName(s,ctx,'zh'),visual:s.visual,dialogue:s.dialogue,frameMoment:s.frameMoment||'',characters:selectedCharacters(s,ctx).map(c=>({name:c.name,descriptionZh:c.descriptionZh||c.description||''})),source:s.source||''}));
  return `请只精修下面现有镜头的“画面瞬间”，把每个镜头改写成一幅可以直接画出的、固定在同一时刻的画面。不要重新拆分剧本，不增删镜头，不改 id，不添加原文没有的人物、物体或剧情事件。严格保留原有故事含义。\n\n要求：\n1. 每个 frameMoment 只描写一个可见的定格瞬间，写清出场人物此刻的姿势、动作停留状态和可见表情；同框多人分别写清其姿态。\n2. 删除声音、内心活动、认知和时间过程，例如“风铃轻响”“认出了她”“渐渐”“第一次”；不把这些词替换成未经原文支持的新动作。\n3. 对白只供理解上下文，不把对白写进 frameMoment；对白镜头必须补充原文支持的说话姿态与表情。信息不足时保守保留原文已有的可见姿势，不臆造情节。\n4. 不写场景编号、镜号、字段标签、提示词操作说明、负面词、运镜或视频时长，不写“先…再…”的动作过程。\n5. 同时给出忠实对应的英文 frameMomentEn。\n\n只返回 JSON 数组，每项只允许三个字段：[{"id":"必须沿用现有镜头 id","frameMoment":"一个可见的画面瞬间","frameMomentEn":"The same frozen visible moment in English"}]。\n\n项目：${state.title}\n完整剧本（仅供核对，不要重编）：\n${state.script||''}\n\n需要精修的现有镜头：\n${JSON.stringify(shots,null,2)}`;
}
