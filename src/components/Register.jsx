import { useState, useRef } from "react"
import chatting from "../images/Chatting.png"
import { useDispatch } from "react-redux"
import { addUser } from "../counterSlice"
import { registerUserService } from "../services/userService"
import { useNavigate } from "react-router-dom"

const styles = `
@keyframes gradientBG {
  0% { background-position: 0% 0%;}
  25% { background-position: 100% 0%;}
  50% { background-position: 100% 100%;}
  75% { background-position: 0% 100%;}
  100% { background-position: 0% 0%;}
}

.animated-bg{
  background:linear-gradient(135deg,#a8edea,#fed6e3,#c9b8f5,#89c4e1,#f9a8d4,#b9d4f5,#a8edea);
  background-size:400% 400%;
  animation:gradientBG 10s ease infinite;
}

.tilt-card{
  transition:transform .15s ease,box-shadow .15s ease;
  will-change:transform;
}
`

function Register() {

  const dispatch = useDispatch()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [profileImage, setprofileImage] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const navigate = useNavigate()


  const cardRef = useRef(null)

  function handleMouseMove(e) {
    const card = cardRef.current
    if (!card) return

    const rect = card.getBoundingClientRect()
    const rotateX = ((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -10
    const rotateY = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 10

    card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`
  }

  function handleMouseLeave() {
    const card = cardRef.current
    if (!card) return
    card.style.transform = `perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)`
  }

  function handleImage(e) {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setprofileImage(URL.createObjectURL(file))
    }
  }

  // ✅ FINAL HANDLE SUBMIT
  async function handleSubmit() {

    if (!name || !email || !password || !confirmPassword) {
      alert("Please fill all fields")
      return
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match")
      return
    }

    const user = {
      name,
      email,
      password,
      profileImage: selectedFile
    }

    try {
      const response = await registerUserService(user)

      // store in Redux
      dispatch(addUser(response || user))

      alert("Registered Successfully")

      // clear form
      setName("")
      setEmail("")
      setPassword("")
      setConfirmPassword("")
      setprofileImage(null)
      setSelectedFile(null)
      navigate("/otp", { state: { email: email } })


    } catch (error) {
      console.error(error)
      const serverMessage = error.response?.data?.message || "Registration Failed";
      alert(serverMessage);
    }
  }

  return (
    <>
      <style>{styles}</style>

      <div className="animated-bg min-h-screen flex items-center justify-center">

        <div
          ref={cardRef}
          className="tilt-card p-[2px] rounded-3xl border-2"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >

          <div className="w-[520px] p-8 rounded-3xl">

            <h1 className="text-center font-bold mb-5">
              Welcome to Chat Application
            </h1>

            <div className="bg-white border rounded-xl overflow-hidden mb-6">
              <img src={chatting} alt="chat" className="w-full h-[200px] object-contain" />
            </div>

            <h2 className="text-center text-sm font-bold mb-4">
              REGISTRATION FORM
            </h2>

            <div className="flex gap-4">

              <div className="flex flex-col gap-3 flex-1">

                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="p-2 rounded-lg shadow outline-none"
                />

                <input
                  type="email"
                  placeholder="Enter your mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="p-2 rounded-lg shadow outline-none"
                />

                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="p-2 rounded-lg shadow outline-none"
                />

                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="p-2 rounded-lg shadow outline-none"
                />

              </div>

              <div className="w-40 flex flex-col gap-3">

                <div className="bg-blue-100 h-[130px] rounded-xl flex items-center justify-center">

                  {profileImage ? (
                    <img src={profileImage} className="w-full h-full object-contain rounded-xl" />
                  ) : (
                    <label className="cursor-pointer text-xs text-center">
                      Upload Image
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
                  className="bg-[#1a9bbf] text-white py-2 rounded-full font-bold"
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