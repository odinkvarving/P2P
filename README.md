# P2P
Dette er README-filen til STUN-serveren

Navn: stun server

STUN-serveren vår tar imot forespørsler fra en peer.
Med denne forespørselen kan STUN-serveren tolke hvilken meldingstype forespørselen har og sjekke privat IP-adresse til peer.
Videre konstruerer STUN-serveren en respons som skal sendes tilbake til peer.
Denne responsen inneholder blant annet peers offentlige IP-adresse og UDP-port.
Ved hjelp av denne informasjonen kan peer sende sin lokale beskrivelse til en ekstern peer.
Ekstern peer sender forespørsel på samme måte, og får offentlige IP-adresse og UDP-port som respons.
Ved hjelp av denne informasjonen kan begge peerene opprette en forbindelse mellom seg, og overføre data til hverandre.
Vår STUN-server håndterer også om det er noe feil i forespørsel fra peer.

Implementert funksjonalitet

Fremtidig arbeid med oversikt over nåværende mangler

Eksterne avhengigheter med en kort beskrivelse av hver avhengighet og hva den er brukt til

Installasjonsinstruksjoner

Instruksjoner for å starte STUN-serveren

Hvordan en kan kjøre eventuelle tester

Eventuell lenke til API dokumentasjon

