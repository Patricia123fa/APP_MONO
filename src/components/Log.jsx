import React, { useState } from "react"

export const Log = ({ setIsAuth }) => {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
//LOG CONTRASEÑA DE PRUEBA
  const PASSWORD_CORRECTA = "1234" 

  const handleSubmit = (e) => {
    e.preventDefault()

    if (password === PASSWORD_CORRECTA) {
      setIsAuth(true)
    } else {
      setError("❌ Contraseña incorrecta")
    }
  }
//LOS DEMÁS COMPONENTES VISUALES
  return (
    <div className="min-h-screen flex items-start justify-center bg-[#fdc436]">
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm bg-white/50 backdrop-blur-md rounded-xl p-8 shadow-lg">

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-black drop-shadow-xl">Acceso</h1>
          <p className="mt-2 text-black drop-shadow-xl">
            Introduce contraseña para acceder
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-black">
              Contraseña
            </label>
            <div className="mt-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md bg-white px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#e4201e]"
                placeholder="Introduce tu contraseña"
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            className="flex w-full justify-center rounded-md bg-gray-500 px-3 py-2 text-sm font-semibold text-white hover:bg-[#e4201e]"
          >
            Iniciar sesión
          </button>
        </form>

      </div>
    </div>
  )
}
