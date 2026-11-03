// Parse locally in a worker so the workspace stays responsive for long scripts.
importScripts('./vendor/mammoth.browser.min.js');
self.onmessage=async event=>{
  try{
    const result=await self.mammoth.extractRawText({arrayBuffer:event.data});
    self.postMessage({text:result.value});
  }catch{self.postMessage({error:'Invalid or unsupported Word document'});}
};
