# PRD - Tratte Auto

## Problema originale
Inizialmente era stato chiesto un CRM vendite, poi l'utente ha incollato un HTML "Pianificatore Viaggio" e ha scelto: trasformarlo in un'app completa. Nessun login, stile chiaro e minimale, UI in italiano.

## Architettura
- Frontend React (pages/Planner.jsx, components/planner/*), Tailwind, sonner
- Backend FastAPI: server.py (CRUD /api/trips), routing.py (/api/route/legs, /api/route/excel)
- MongoDB collezione `trips`
- Servizi esterni gratuiti senza chiave: Nominatim (geocodifica), routing.openstreetmap.de (OSRM car/foot/bike), embed Google Maps per l'anteprima

## Implementato
- 2026-06: Partenza/tappe/destinazione, riordino tappe, mezzo di trasporto, apertura su Google Maps, copia/condividi link, anteprima mappa, viaggi salvati (salva/aggiorna/salva come nuovo/carica/duplica/elimina/cerca), barra azioni fissa su mobile
- 2026-06: GPS anche sulla destinazione; calcolo distanza/durata per tratta + totale; esportazione Excel (N°, Data, Partenza, Arrivo, km, min, Durata, riga TOTALE)
- 2026-06: GPS su ogni tappa intermedia
- 2026-06: Data per singola tratta (Excel), distanze salvate con ogni viaggio (badge km nell'elenco), report km mensile (riepilogo + Excel), suggerimenti indirizzi mentre si scrive (Photon), pulsante GPS integrato in ogni riga

## Implementato (cont.)
- 2026-06: Report mensile Excel: una riga per giorno (Data, Viaggio, Percorso, Distanza km), tolte colonne durata; rimosso selettore mezzo (sempre auto)
- 2026-06: Fix mobile: finestra suggerimenti indirizzi a tutta larghezza con testo a capo; pulsanti tappa spostati sulla riga dell'etichetta
- 2026-06: "Calcola tratte" salva automaticamente il viaggio in Viaggi salvati (nuovo o aggiorna quello caricato; nome automatico "Partenza → Destinazione" che si aggiorna se non personalizzato)
- 2026-06: Salvataggio automatico delle date (viaggio e singole tratte) quando si modificano su un viaggio salvato (PATCH /api/trips/{id}/dates)
- 2026-06: Luoghi preferiti (collezione `places`, CRUD /api/places): pannello gestione, pulsante "Preferiti" su ogni riga del percorso, preferiti in cima ai suggerimenti
- 2026-06: Rinominato "Tratte Auto"
- 2026-06: Profili senza password (collezione `profiles`, header X-Profile-Id): viaggi e report separati per persona, preferiti condivisi; eliminazione profilo con conferma scrivendo il nome

## Backlog
- P1: Ottimizzazione automatica dell'ordine delle tappe
- P2: Rimborso chilometrico (€/km) nel report mensile; esportazione PDF
