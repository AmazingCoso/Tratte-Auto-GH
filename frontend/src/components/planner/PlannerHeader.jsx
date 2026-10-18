import { Compass, RotateCcw, Users } from "lucide-react";

export const PlannerHeader = ({ profile, currentTrip, onSwitchProfile, onReset }) => (
  <header className="flex items-start justify-between gap-4 mb-8 fade-up">
    <div>
      <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase text-slate-500 mb-3">
        <Compass className="w-4 h-4 text-blue-600" /> Pianificatore viaggi
      </div>
      <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight" data-testid="app-title">
        Tratte Auto
      </h1>
      <p className="mt-2 text-sm sm:text-base text-slate-500 max-w-md">
        <span className="sm:hidden block text-slate-700 font-medium mb-0.5" data-testid="current-profile-name-mobile">Ciao, {profile.name}</span>
        {currentTrip ? (
          <span data-testid="current-trip-label">Stai modificando: <b className="text-slate-800">{currentTrip.name}</b></span>
        ) : (
          "Componi il percorso, salva i tuoi viaggi e aprili su Google Maps."
        )}
      </p>
    </div>
    <div className="shrink-0 flex flex-col items-end gap-2">
      <button
        onClick={onSwitchProfile}
        data-testid="btn-switch-profile"
        className="flex items-center gap-2 h-11 pl-1.5 pr-3 rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-slate-300 transition-colors"
        aria-label={`Profilo: ${profile.name}. Cambia profilo`}
        title={profile.name}
      >
        <span className="w-8 h-8 rounded-full bg-slate-900 text-white font-heading font-semibold flex items-center justify-center">{profile.name.charAt(0).toUpperCase()}</span>
        <span className="hidden sm:inline max-w-[160px] truncate" data-testid="current-profile-name">{profile.name}</span>
        <Users className="w-4 h-4 text-slate-400" />
      </button>
      <button
        onClick={onReset}
        data-testid="btn-reset-planner"
        className="flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900 transition-colors"
      >
        <RotateCcw className="w-4 h-4" /> <span className="hidden sm:inline">Nuovo</span>
      </button>
    </div>
  </header>
);
