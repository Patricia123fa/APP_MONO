import { Header } from '../components/Header'
import { Log } from '../components/Log'
import { Footer } from '../components/Footer'

export const Registro = ({ setIsAuth }) => {
  return (
    <div className="bg-[#fdc436] min-h-screen">
      <Header />
      <Log setIsAuth={setIsAuth} />
      <Footer />
    </div>
  )
}
