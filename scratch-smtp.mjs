import { SMTPServer } from "smtp-server"; import fs from "node:fs";
const out="/tmp/claude-0/-home-claude/779b3366-9889-550d-8743-c722d540338f/scratchpad/captured.txt"; fs.writeFileSync(out,"");
let n=0;
new SMTPServer({authOptional:true,hideSTARTTLS:true,onAuth(a,s,cb){cb(null,{user:"x"})},onData(st,se,cb){let d="";st.on("data",x=>d+=x);st.on("end",()=>{n++;fs.appendFileSync(out,`--EMAIL ${n}--\n`);cb()})}}).listen(2525,"127.0.0.1",()=>{});
setInterval(()=>{},1000);
