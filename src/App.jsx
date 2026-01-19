import { useState } from "react"
import { Registro } from "./pages/Registro"
import { Principal } from "./pages/Principal"


function App() {
  const [isAuth, setIsAuth] = useState(false)
//SI LA CONTRASEÑA ES CORRECTA Y PASA A PANTALLA PRINCIPAL.
  return (
    <>
      {isAuth ? <Principal /> : <Registro setIsAuth={setIsAuth} />}
    </>
  )
}

export default App


