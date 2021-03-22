#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <sys/types.h>
//#include <winsock2.h>
//#include <windows.h>
#include <sys/types.h> 
#include <sys/socket.h> 
#include <arpa/inet.h> 
#include <netinet/in.h> 
#include "./stunOperations.hpp"


class Socket {
public:
    int socketfd;
    char buffer[1024];
    struct sockaddr_in serverAddress, clientAddress;

    Socket() {
        //Initializing socket with domain = IPv4, type = UDP and protocol = 0 (not needed because only one protocol is supported)
        if((socketfd = socket(AF_INET, SOCK_DGRAM, 0)) < 0) {      
            perror("socket creation failed");
            exit(EXIT_FAILURE);
        }

        memset(&serverAddress, 0, sizeof(serverAddress));
        memset(&clientAddress, 0, sizeof(clientAddress));

        serverAddress.sin_family = AF_INET;
        serverAddress.sin_port = htons(8080);  //htons converts
        serverAddress.sin_addr.s_addr = INADDR_ANY;

        if( bind(socketfd, (const struct sockaddr *)&serverAddress, sizeof(serverAddress)) < 0) {
            perror("bind failed");
            exit(EXIT_FAILURE);
        }
    }

    void run() {
        socklen_t len;
        int bytesIn; 
  
        while(true) {
            len = sizeof(clientAddress);  //len is value/result 
            
            bytesIn = recvfrom(socketfd, (char *)buffer, 1024,  
                MSG_WAITALL, ( struct sockaddr *) &clientAddress, &len); 
            
            buffer[bytesIn] = '\0'; 
            printf("Client : %s\n", buffer);

            findXPort(htons(clientAddress.sin_port));
            findXAddress(ntohl(clientAddress.sin_addr.s_addr));
            
            char response[32];
                
            successResponse(buffer, response);
            sendto(socketfd, (char *)response, 32,  
            MSG_CONFIRM, (const struct sockaddr *) &clientAddress, len); 
            printf("Response : %s\n", response);  
        }  
    }
};

int main() {
    Socket serverSocket;
    serverSocket.run();

    return 0;
}
