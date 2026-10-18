import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import Planner from "@/pages/Planner";
import { FavoritesProvider } from "@/lib/favorites";

function App() {
  return (
    <div className="App">
      <FavoritesProvider>
        <Planner />
      </FavoritesProvider>
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;
