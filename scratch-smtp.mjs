import { SMTPServer } from "smtp-server";
import fs from "node:fs";
const out="/tmp/claude-0/-home-claude/779b3366-9889-550d-8743-c722d540338f/scratchpad/captured.txt";
fs.writeFileSync(out,"");
new SMTPServer({authOptional:true,hideSTARTTLS:true,onAuth(a,s,cb){cb(null,{user:a.username||"x"})},onData(st,se,cb){let d="";st.on("data",x=>d+=x);st.on("end",()=>{fs.appendFileSync(out,d+"\n====\n");console.log("EMAIL");cb()})}}).listen(2525,"127.0.0.1",()=>console.log("[smtp] up"));
setInterval(()=>{},1000);
