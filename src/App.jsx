import { useState } from "react"
import { Principal } from "./pages/Principal"
import { Registro } from "./pages/Registro"

function App() {
  // 1. Inicializamos el estado consultando el localStorage
  const [isAuth, setIsAuth] = useState(() => {
    const savedAuth = localStorage.getItem("isAuth");
    return savedAuth === "true"; // Retorna true si ya estaba guardado
  });

  return (
    <>
      {isAuth ? (
        <Principal setIsAuth={setIsAuth} /> 
      ) : (
        <Registro setIsAuth={setIsAuth} />
      )}
    </>
  )
}

// 2. Exportación obligatoria para que el proyecto cargue
export default App;

