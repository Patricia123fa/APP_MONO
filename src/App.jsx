
import React from 'react';
import './App.css';
import {Header} from './components/Header';
import SeleccionEmpleado from './components/SeleccionEmpleado';
import SeleccionProyecto from './components/SeleccionProyecto';
import { Footer } from './components/Footer';
import Calendario from './components/Calendario';
import SelectorHoras from './components/SelectorHoras';
import ExportarDatos from './components/Exportación';
function App() {
  return (
    <div className="bg-[#fdc436] min-h-screen p-8">
      <Header />
      <SeleccionEmpleado />
      <SeleccionProyecto />
      <Calendario/>
      <SelectorHoras />
      <ExportarDatos />
      <Footer/>
      
  
    </div>
  );
}

export default App;

