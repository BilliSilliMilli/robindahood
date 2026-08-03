import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { firebaseConfig, allowedEmails } from "./firebase-config.js";

const gate=document.getElementById("authGate"),shell=document.getElementById("appShell"),errorBox=document.getElementById("authError"),emailInput=document.getElementById("authEmail"),passwordInput=document.getElementById("authPassword"),signInBtn=document.getElementById("signInBtn"),resetBtn=document.getElementById("resetBtn"),signOutBtn=document.getElementById("signOutBtn"),signedInUser=document.getElementById("signedInUser");
const showError=m=>errorBox.textContent=m||"";
const configured=()=>firebaseConfig.apiKey&&!firebaseConfig.apiKey.includes("PASTE_")&&firebaseConfig.authDomain&&firebaseConfig.projectId;
if(!configured()){showError("Firebase is not configured yet. Complete firebase-config.js first.");signInBtn.disabled=true;resetBtn.disabled=true;}else{
 const app=initializeApp(firebaseConfig),auth=getAuth(app),authorized=e=>!allowedEmails.length||allowedEmails.map(x=>x.toLowerCase()).includes((e||"").toLowerCase());
 signInBtn.addEventListener("click",async()=>{showError("");try{const r=await signInWithEmailAndPassword(auth,emailInput.value.trim(),passwordInput.value);if(!authorized(r.user.email)){await signOut(auth);throw new Error("This account is not authorized.");}}catch(e){showError(e.message.replace("Firebase: ",""));}});
 resetBtn.addEventListener("click",async()=>{const email=emailInput.value.trim();if(!email)return showError("Enter your email first.");try{await sendPasswordResetEmail(auth,email);showError("Password reset email sent.");}catch(e){showError(e.message.replace("Firebase: ",""));}});
 signOutBtn?.addEventListener("click",()=>signOut(auth));
 onAuthStateChanged(auth,async user=>{if(user&&authorized(user.email)){gate.style.display="none";shell.style.display="block";signedInUser.textContent=user.email||"Signed in";}else{if(user)await signOut(auth);shell.style.display="none";gate.style.display="flex";signedInUser.textContent="";}});
}
