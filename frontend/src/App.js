import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import Planner from "@/pages/Planner";
import { FavoritesProvider } from "@/lib/favorites";
import { ProfileProvider, useProfile } from "@/lib/profile";
import { ProfileGate } from "@/components/ProfileGate";

const Main = () => {
  const { current } = useProfile();
  if (!current) return <ProfileGate />;
  return (
    <FavoritesProvider>
      <Planner key={current.id} />
    </FavoritesProvider>
  );
};

function App() {
  return (
    <div className="App">
      <ProfileProvider>
        <Main />
      </ProfileProvider>
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;
