import React from 'react'
export const Main = () => (
  <div className="min-h-screen flex items-start justify-center bg-[#fdc436]">
    <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm bg-white/50 backdrop-blur-md rounded-xl p-8 shadow-lg">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-black drop-shadow-xl">Acceso</h1>
        <p className="mt-2 text-black drop-shadow-xl">Introduce contraseña para acceder</p>
      </div>
      <form action="#" method="POST" className="space-y-6">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-black">Contraseña</label>
          <div className="mt-2">
            <input 
              id="password" 
              type="password" 
              name="password" 
              required 
              autoComplete="current-password" 
              className="block w-full rounded-md bg-white px-3 py-2 text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e4201e]"
              placeholder="Introduce tu contraseña"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center text-sm text-black">
            <input type="checkbox" className="h-4 w-4 border-gray-300 bg-amber-300" />
            <span className="ml-2">Recordar contraseña</span>
          </label>
        </div>
        <div>
          <button 
            type="submit" 
            className="flex w-full justify-center rounded-md bg-gray-500 px-3 py-2 text-sm font-semibold text-white hover:bg-[#e4201e] focus:outline-none focus:ring-2 focus:ring-offset-2">
            Iniciar sesión
          </button>
        </div>
      </form>
  </div>
</div>
)

