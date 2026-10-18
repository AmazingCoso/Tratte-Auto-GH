import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import Planner from "@/pages/Planner";

function App() {
  return (
    <div className="App">
      <Planner />
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;
