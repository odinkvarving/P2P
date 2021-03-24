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

<h3>Implementert funksjonalitet</h3>

<h3>Fremtidig arbeid med oversikt over nåværende mangler</h3>

<h3>Eksterne avhengigheter med en kort beskrivelse av hver avhengighet og hva den er brukt til</h3>

<h3>Installasjonsinstruksjoner</h3>

<h3>Instruksjoner for å starte STUN-serveren:</h3>


<h3>Hvordan en kan kjøre eventuelle tester</h3>

<h3>Eventuell lenke til API dokumentasjon</h3>

