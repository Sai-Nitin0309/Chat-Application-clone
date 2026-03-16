import { useState, useRef } from "react"
import chatting from "./images/Chatting.png"
import { useDispatch } from "react-redux"
import { addUser } from "./counterSlice"

const styles = `
@keyframes gradientBG {
  0% { background-position: 0% 0%;}
  25% { background-position: 100% 0%;}
  50% { background-position: 100% 100%;}
  75% { background-position: 0% 100%;}
  100% { background-position: 0% 0%;}
}

@keyframes riseBubble {
  0% { transform: translateY(0) scale(1); opacity:0.5;}
  50% { opacity:0.35;}
  100% { transform: translateY(-110vh) scale(1.2); opacity:0;}
}

@keyframes sway {
  0% { margin-left:0px;}
  25% { margin-left:30px;}
  75% { margin-left:-30px;}
  100% { margin-left:0px;}
}

.animated-bg{
  background:linear-gradient(135deg,#a8edea,#fed6e3,#c9b8f5,#89c4e1,#f9a8d4,#b9d4f5,#a8edea);
  background-size:400% 400%;
  animation:gradientBG 10s ease infinite;
}

.bubble{
  position:absolute;
  bottom:-150px;
  border-radius:50%;
  animation:riseBubble linear infinite,sway ease-in-out infinite;
  pointer-events:none;
}

.tilt-card{
  transition:transform .15s ease,box-shadow .15s ease;
  will-change:transform;
}
`

const risingBubbles = [
  { size:30,left:'5%',duration:7,swayDuration:3,delay:0,color:'rgba(168,237,234,0.5)'},
  { size:50,left:'12%',duration:10,swayDuration:4,delay:1.5,color:'rgba(249,168,212,0.45)'},
  { size:20,left:'22%',duration:6,swayDuration:2.5,delay:3,color:'rgba(137,196,225,0.5)'},
  { size:70,left:'35%',duration:13,swayDuration:5,delay:0.8,color:'rgba(201,184,245,0.4)'},
]

function Register(){

const dispatch = useDispatch()   // FIX

const [name,setName] = useState("")
const [email,setEmail] = useState("")
const [password,setPassword] = useState("")
const [confirmPassword,setConfirmPassword] = useState("")
const [image,setImage] = useState(null)

const cardRef = useRef(null)

function handleMouseMove(e){
const card = cardRef.current
if(!card) return

const rect = card.getBoundingClientRect()
const rotateX = ((e.clientY - rect.top - rect.height/2)/(rect.height/2))*-10
const rotateY = ((e.clientX - rect.left - rect.width/2)/(rect.width/2))*10

card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`
}

function handleMouseLeave(){
const card = cardRef.current
if(!card) return
card.style.transform = `perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)`
}

function handleImage(e){
const file = e.target.files[0]
if(file) setImage(URL.createObjectURL(file))
}

function handleSubmit(){

if(!name || !email || !password || !confirmPassword){
alert("Please fill all fields")
return
}

if(password !== confirmPassword){
alert("Passwords do not match")
return
}

const user = {
name,
email,
password,
image
}

dispatch(addUser(user))

alert("Registered Successfully")

setName("")
setEmail("")
setPassword("")
setConfirmPassword("")
setImage(null)
}

return(
<>
<style>{styles}</style>

<div className="animated-bg min-h-screen flex items-center justify-center relative overflow-hidden">

{risingBubbles.map((b,i)=>(
<div key={i} className="bubble"
style={{
width:b.size,
height:b.size,
left:b.left,
background:b.color,
animationDuration:`${b.duration}s,${b.swayDuration}s`,
animationDelay:`${b.delay}s,${b.delay}s`
}}/>
))}

<div
ref={cardRef}
className="tilt-card p-[2px] rounded-3xl bg-transparent border-2 relative z-10"
onMouseMove={handleMouseMove}
onMouseLeave={handleMouseLeave}
>

<div className="bg-transparent w-[520px] p-8 rounded-3xl">

<h1 className="text-center font-bold uppercase tracking-wide mb-5">
Welcome to Chat Application
</h1>

<div className="bg-white border rounded-xl overflow-hidden mb-6">
<img src={chatting} alt="chat" className="w-full h-[200px] object-contain"/>
</div>

<h2 className="text-center text-sm font-bold uppercase mb-4">
REGISTRATION FORM
</h2>

<div className="flex gap-4">

<div className="flex flex-col gap-3 flex-1">

<input
type="text"
placeholder="Enter your name"
value={name}
onChange={(e)=>setName(e.target.value)}
className="p-2 rounded-lg shadow outline-none"
/>

<input
type="email"
placeholder="Enter your valid mail id"
value={email}
onChange={(e)=>setEmail(e.target.value)}
className="p-2 rounded-lg shadow outline-none"
/>

<input
type="password"
placeholder="Enter your password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
className="p-2 rounded-lg shadow outline-none"
/>

<input
type="password"
placeholder="Confirm password"
value={confirmPassword}
onChange={(e)=>setConfirmPassword(e.target.value)}
className="p-2 rounded-lg shadow outline-none"
/>

</div>

<div className="w-40 flex flex-col gap-3">

<div className="bg-blue-100 h-[130px] rounded-xl flex items-center justify-center text-xs text-center cursor-pointer">

{image ? (
<img src={image} className="w-full h-full object-contain rounded-xl"/>
):(
<label className="cursor-pointer">
Drop your image
<input
type="file"
accept="image/png,image/jpeg"
onChange={handleImage}
className="hidden"
/>
</label>
)}

</div>

<button
onClick={handleSubmit}
className="bg-[#1a9bbf] text-white py-2 rounded-full font-bold tracking-wide hover:opacity-90"
>
REGISTER
</button>

</div>

</div>

</div>
</div>
</div>
</>
)
}

export default Register