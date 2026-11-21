const $ = (id) => document.getElementById(id);
const conversation = $("conversation");
const input = $("command-input");
const state = $("system-state");
const micStatus = $("mic-status");
let recognition = null;
let listening = false;

function updateClock(){
  const now = new Date();
  $("clock").textContent = now.toLocaleTimeString();
  $("time-card").textContent = now.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
  $("date-card").textContent = now.toLocaleDateString([], {weekday:"long",month:"short",day:"numeric",year:"numeric"});
}
updateClock(); setInterval(updateClock,1000);
$("year").textContent = new Date().getFullYear();

function addMessage(who,text){
  const item=document.createElement("div");
  item.className="message "+(who==="YOU"?"user":"jarvis");
  const label=document.createElement("b"); label.textContent=who;
  const p=document.createElement("p"); p.textContent=text;
  item.append(label,p); conversation.appendChild(item); conversation.scrollTop=conversation.scrollHeight;
}
function speak(text){
  if(!("speechSynthesis" in window)){ addMessage("JARVIS M","Speech output is not supported in this browser."); return; }
  speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(text);
  utterance.rate=1; utterance.pitch=0.92; utterance.volume=1;
  const voices=speechSynthesis.getVoices();
  const preferred=voices.find(v=>/en-US/i.test(v.lang))||voices.find(v=>/^en/i.test(v.lang));
  if(preferred) utterance.voice=preferred;
  speechSynthesis.speak(utterance);
}
function reply(text,shouldSpeak=true){addMessage("JARVIS M",text);state.innerHTML='<span class="pulse"></span> RESPONSE READY';if(shouldSpeak)speak(text);}
function handleCommand(raw){
  const command=raw.trim(); if(!command)return;
  addMessage("YOU",command);
  const c=command.toLowerCase();
  let answer;
  if(/^(hi|hello|hey|good morning|good afternoon|good evening)/.test(c)){
    const hour=new Date().getHours();
    const greeting=hour<12?"Good morning":hour<18?"Good afternoon":"Good evening";
    answer=greeting+", Mr. Moshier. JARVIS M is online and ready to assist you.";
  }else if(c.includes("time")) answer="The current local time is "+new Date().toLocaleTimeString()+".";
  else if(c.includes("date")||c.includes("day")) answer="Today is "+new Date().toLocaleDateString([], {weekday:"long",year:"numeric",month:"long",day:"numeric"})+".";
  else if(c.includes("who are you")||c.includes("your name")) answer="I am JARVIS M, your personal browser-based assistant for Moshier Industries. I was created for Matthew Moshier.";
  else if(c.includes("what can you do")||c==="help"||c.includes("commands")) answer="I can greet you, tell you the time and date, speak responses, and open web searches. Try saying: what time is it, or search for robotics.";
  else if(c.startsWith("search for ")||c.startsWith("google ")){
    const query=command.replace(/^(search for |google )/i,"").trim();
    answer="Opening a web search for "+query+".";
    window.open("https://www.google.com/search?q="+encodeURIComponent(query),"_blank","noopener");
  }else if(c.includes("status")) answer="All local interface systems are online. Voice recognition depends on browser support and microphone permission.";
  else if(c.includes("thank")) answer="You're welcome, Mr. Moshier. Always at your service.";
  else answer="I heard you say: "+command+". This prototype does not have a connected AI language model yet. You can ask for the time, date, status, help, or a web search.";
  reply(answer);
}
$("command-form").addEventListener("submit",e=>{e.preventDefault();handleCommand(input.value);input.value="";input.focus();});
$("stop-button").addEventListener("click",()=>{if("speechSynthesis"in window)speechSynthesis.cancel();state.innerHTML='<span class="pulse"></span> STANDBY — AWAITING COMMAND';});
$("clear-button").addEventListener("click",()=>{conversation.replaceChildren();addMessage("JARVIS M","Communication log cleared. Ready for your next command.");});
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
if(SpeechRecognition){
  recognition=new SpeechRecognition();recognition.lang="en-US";recognition.continuous=false;recognition.interimResults=false;
  recognition.onstart=()=>{listening=true;micStatus.textContent="MICROPHONE LISTENING";state.innerHTML='<span class="pulse"></span> LISTENING — SPEAK NOW';$("voice-button").textContent="◉ LISTENING...";};
  recognition.onresult=e=>{const transcript=e.results[0][0].transcript;handleCommand(transcript);};
  recognition.onerror=e=>{micStatus.textContent="MICROPHONE: "+e.error.toUpperCase();state.innerHTML='<span class="pulse"></span> VOICE INPUT UNAVAILABLE';};
  recognition.onend=()=>{listening=false;micStatus.textContent="MICROPHONE IDLE";$("voice-button").textContent="◉ ACTIVATE VOICE";};
  $("voice-button").addEventListener("click",()=>{if(listening){recognition.stop();return;}try{recognition.start();}catch(err){micStatus.textContent="PLEASE WAIT, RETRY";}});
  $("voice-card").textContent="SUPPORTED";
}else{
  $("voice-card").textContent="NOT SUPPORTED";
  micStatus.textContent="VOICE INPUT NOT SUPPORTED";
  $("voice-button").disabled=true;$("voice-button").textContent="VOICE NOT SUPPORTED";
  $("voice-button").title="Try Chrome or Edge on HTTPS or localhost.";
}
