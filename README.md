# P2P

<h2>STUN server</h2>

<h3>Introduction</h3>
<p>The STUN server works by first creating a new socket that is waiting for requests on a specified port. When a client sends a request to the server it will respond with either a 'success response' or an 'error response'. The success response contains the public IP-address of the client and which port it is using - which is the core purpose of the STUN server. If there is something wrong with the request (eg. the Magic cookie in the request is incorrect) the response will be an error response instead - with an appropriate error-code.</p>
<p>If two different clients use the stun-server to obtain their public IP-addresses, they can send packets back and forth to each other’s public IP without Network Address Translation.</p>

<h3>Implemented functionality</h3>
<p>The implemented functionality on this STUN server is sending a success response to the client that connects to the server - which contains the public IP-address and port that the client is using. The success response contains the XOR-MAPPED-ADDRESS attribute where we can find the family of the source IP-address, the source IP-address itself and the source UDP port of the client. The STUN server also responds with an error-code if there is something wrong with the incoming request - for example an error with the Magic Cookie or the message length. An error code and a reason phrase is provided for the client to understand the issue.</p>

<h3>Work for the future with overview over missing pieces</h3>
<p>There is a lot of functionality that could be added to the STUN server to make it more flexible and complete. The server could for example support both UDP and TCP so that it can receive packets from both types of connections. We could also add more error-codes corresponding to different kinds of errors one might run into while trying to communicate with the server - for example if the server receives a STUN packet containing an attribute it didn’t understand or if the request didn’t contain the correct credentials. 
We could also implement ways for the server to handle retransmissions from a client, different mechanisms for redirection to an alternate server, DNS discovery, authentication etc.</p>
<p>Another functionality that could be added to the STUN server is the use of an event loop for handling incoming requests. In this way we would have a more organized way of sending responses to the requests as they arrive, instead of continuously waiting.</p>

<h3>External dependencies with a brief description of every dependency and what it is used for</h3>
<p>Three dependencies we used in the STUN server are “sys/socket.h”, “arpa/inet.h” and “netinet/in.h”.</p>
<p>”sys/socket.h” is an internet protocol family. socklen_t is a type which is available by the use of “sys/socket.h”. By using this type, we can achieve the actual size of a peer’s source address.</p>
<p>”arpa/inet.h” and “netinet/in.h” are respectively a set of definitions for internet operations, and an internet protocol family. These were used to implement the sockaddr_in structure. With this structure, we can decide what kind of address the socket can communicate with, specify UDP-port and specify that the socket can be bound to all network interfaces on the host.</p>

<h3>Instructions for installation</h3>
<p>Below you can find the instructions for installing the STUN-server. If you are using Windows make sure that you have installed an editor or compiler that can handle C++ source-code.</p>
<b><p>Cloning the project</p></b>
<ol>
<li>Clone the git repository of the project linked here: https://github.com/odinkvarving/P2P to a folder in your local directory.</li>
<li>If you’re using Linux, simply CD to the location where you cloned the project to, then CD into the 'Stun' folder. If you’re using Windows, the simplest way is to enable Linux Subsystem for Windows (Windows 10) and using the command ‘bash’ inside cmd. This will open a bash-terminal, where you can run Linux commands. Follow steps described for Linux above.</li>
<li>Proceed to the next steps below.</li>
</ol>

<h3>Instructions for starting the STUN server</h3>
<p>To run our STUN server, there are two commands we need to run:</p>
<ol>
<li> & g++ -o main main.cpp stunOperations.cpp</li>
<li> & ./main </li>
</ol>
<p>These commands will compile and run our server code, which will start the STUN server.</p>

<h3>How we can run eventual tests</h3>
<p>To test our STUN server, we could either test for success or failure. Testing for success could be done by receiving a legal request from a peer. As we mentioned in the introduction, our STUN server will handle the request, and either send a success response or an error response. In this scenario, if our code is correct, the request will be handled and a success response will be sent back to the requesting peer.</p>
<p>An example of testing for failure is to purposely send a bad request, which will cause an error. As an example, we could send a request with an incorrect Magic Cookie. In this case, the peer will receive the error response. The test will be a success if the test causes error.</p>

<h2>WebRTC</h2>
<h3>Quick installation guide, which requires that the repo is cloned:</h3>
<ol>
   <li>Install Nodejs</li>
   <li>Go to WebRTC directory in cloned project</li>
   <li>Open CMD or enter terminal of WebRTC directory</li>
   <li>Run command: npm install</li>
</ol>

<h3>Quick startup guide, which requires that the previous points are followed:</h3>
<ol>
   <li>Go to WebRTC directory in cloned project</li>
   <li>Open CMD or enter terminal of WebRTC directory</li>
   <li>Run command: npm run build</li>
   <ul><li>This command will build our Vite project</li></ul>
   <li>Run command: npm run dev</li>
   <ul><li>This command will run the application</li></ul>
   <li>Open localhost:3000 (or "local-ip-address:3000")</li>
</ol>
