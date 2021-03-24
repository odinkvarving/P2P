#STUN
This is the README file for the STUN server

<h4>Name: stun server</h4>

<h4>Introduction</h4>
STUN-serveren vår tar imot forespørsler fra en peer.
Med denne forespørselen kan STUN-serveren tolke hvilken meldingstype forespørselen har og sjekke privat IP-adresse til peer.
Videre konstruerer STUN-serveren en respons som skal sendes tilbake til peer.
Denne responsen inneholder blant annet peers offentlige IP-adresse og UDP-port.
Ved hjelp av denne informasjonen kan peer sende sin lokale beskrivelse til en ekstern peer.
Ekstern peer sender forespørsel på samme måte, og får offentlige IP-adresse og UDP-port som respons.
Ved hjelp av denne informasjonen kan begge peerene opprette en forbindelse mellom seg, og overføre data til hverandre.
Vår STUN-server håndterer også om det er noe feil i forespørsel fra peer.

<h4>Implemented functionality</h4>

<h4>Work for the future with overview over missing pieces</h4>

<h4>External dependencies with a brief description of every dependency and what it is used for</h4>

<h4>Instructions for installation</h4>

<h4>Instructions for running the STUN server</h4>
For å kjøre STUN-serveren vår må man skrive noen kommandoer i kommandofeltet:
<ul>
  <li> & g++ -o main main.cpp stunOperations.cpp</li>
  <li> & ./main</li>
</ul>

<h4>How we can run eventual tests</h4>
To test our STUN server, we could purposely send a bad request, which will 

<h4>Link for API documentation</h4>

