const MAX_BYTES=25*1024*1024;
const SUPPORTED=/\.(docx|txt|md)$/i;
const DOCX_ERROR='无法读取这个 Word 文件。请确认文件可正常打开且未加密，然后用 Word / WPS 另存为 .docx 后重试。';

export async function readScriptFile(file,{extractWord=extractWordText}={}){
  if(!file||typeof file.name!=='string')throw new Error('请选择一个剧本文件');
  if(/\.doc$/i.test(file.name))throw new Error('旧版 .doc 暂不支持，请用 Word / WPS 打开后，另存为 .docx 再导入。');
  if(!SUPPORTED.test(file.name))throw new Error('请选择 Word（.docx）、TXT 或 MD 剧本文件');
  if(file.size>MAX_BYTES)throw new Error('文件超过 25 MB，请按集拆分后导入');
  const word=/\.docx$/i.test(file.name);
  let content;
  if(word){
    const buffer=await file.arrayBuffer(),signature=new Uint8Array(buffer,0,Math.min(4,buffer.byteLength));
    if(signature.length<4||signature[0]!==0x50||signature[1]!==0x4b||signature[2]!==3||signature[3]!==4)throw new Error(DOCX_ERROR);
    try{content=await extractWord(buffer);}catch(error){if(error?.code==='TIMEOUT')throw new Error('读取时间较长，已停止。请按集拆分，或用 Word / WPS 另存为新的 .docx 后重试。');throw new Error(DOCX_ERROR);}
  }else content=await file.text();
  const text=String(content??'').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
  if(!text.trim())throw new Error(word?'没有提取到可编辑文字。如果剧本由扫描图片组成，请先在 Word / WPS 中识别图片文字，再保存为 .docx。':'文件中没有剧本文字');
  return {text,title:file.name.replace(/\.(docx|txt|md)$/i,''),format:word?'Word':'文本'};
}

async function extractWordText(buffer){
  // The standalone offline edition embeds the same reader locally.
  if(globalThis.mammoth)return (await globalThis.mammoth.extractRawText({arrayBuffer:buffer})).value;
  if(typeof Worker!=='function')return extractOnPage(buffer);
  let worker;
  try{worker=new Worker(new URL('./word-worker.js',import.meta.url));}catch{return extractOnPage(buffer);}
  return new Promise((resolve,reject)=>{
    const finish=(callback,value)=>{clearTimeout(timeout);worker.terminate();callback(value);};
    const timeout=setTimeout(()=>{const error=new Error('Word import timed out');error.code='TIMEOUT';finish(reject,error);},30000);
    worker.onmessage=e=>e.data?.error?finish(reject,new Error(e.data.error)):finish(resolve,e.data?.text||'');
    worker.onerror=()=>{clearTimeout(timeout);worker.terminate();extractOnPage(buffer).then(resolve,reject);};
    const copy=buffer.slice(0);worker.postMessage(copy,[copy]);
  });
}

let readerPromise;
async function extractOnPage(buffer){
  if(!globalThis.mammoth){
    readerPromise??=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL('./vendor/mammoth.browser.min.js',import.meta.url).href;script.onload=resolve;script.onerror=()=>{script.remove();readerPromise=undefined;reject(new Error('Word reader unavailable'));};document.head.append(script);});
    await readerPromise;
  }
  return (await globalThis.mammoth.extractRawText({arrayBuffer:buffer})).value;
}
