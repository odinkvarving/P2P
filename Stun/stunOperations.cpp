#include <stdio.h>
#include <stdlib.h>
#include <iostream>

#define BINDING_REQUEST 0b0000000000000001
#define INDICATION 0b0000000000010001
#define SUCCESS_RESPONSE 0b0000000100000001
#define ERROR_RESPONSE 0b0000000100010001

#define ATTRIBUTE_LENGTH 0b00001100
#define SUCCESS_RESPONSE_ATTRIBUTE_LENGTH 0b00001000  
#define XORMAPPED_ADDRESS_TYPE 0b0000000000100000
#define ERROR_CODE_ADDRESS_TYPE 0b0000000000001001
#define ERROR_RESPONSE_ATTRIBUTE_LENGTH 0b00000100


uint16_t XPORT;
uint32_t X_ADDRESS;
/*
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1    
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |0 0| STUN Message Type |            Message Length             |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |                       Magic Cookie                            |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |                                                               |
 |                  Transaction ID (96 bits)                     |
 |                                                               |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |          Type                |             Length             |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |                      Value (variable) ....                    |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

*/

bool checkIfRequest(char* buffer) {
    bool request;
    if(buffer[3] == 0 && buffer[4] == 0) {
        request = true;
    }else {
        request = false;
    }
    return request;
}

bool checkMagicCookie(char* buffer) {
    bool valid;
    if(buffer[4] == 0x21 && buffer[5] == 0x12 && buffer[6] == 0xA4 && buffer[7] == 0x42) {
        valid = true;
    }else {
        valid = false;
    }
    return valid;
}

bool checkValidity(char* buffer) {
    bool valid;
   if(buffer[0] >> 6 == 0 && buffer[3] & 0x00000000 == 0 && checkMagicCookie(buffer)) {
       valid = true;
    }else {
        valid = false;
    }
    return valid;   
}

uint16_t checkMessageType(char* buffer) {
    if(checkValidity && checkIfRequest(buffer) && buffer[0] == 0 && buffer[1] == 1) {
        return BINDING_REQUEST;
    }else if(checkValidity && buffer[0] == 0 && buffer[1] == 17) {
        return INDICATION;
    }else if(checkValidity && buffer[0] == 1 && buffer[1] == 1) {
        return SUCCESS_RESPONSE;
    }else if(checkValidity && buffer[0] == 1 && buffer[1] == 17) {
        return ERROR_RESPONSE;
    }
    return 0;
}

void XORMappedResponse(char *response) {
    response[24] = 0b00000000;
    response[25] = 0b00000001;
    uint8_t port1 = XPORT >> 8;
    uint8_t port2 = XPORT & 255;
    response[26] = port1;
    response[27] = port2;
    uint8_t ip1 = X_ADDRESS >> 24;
    uint8_t ip2 = X_ADDRESS >> 16;
    uint8_t ip3 = X_ADDRESS >> 8;
    uint8_t ip4 = X_ADDRESS & 255;
    response[28] = ip1;
    response[29] = ip2;
    response[30] = ip3;
    response[31] = ip4;
}

void ErrorCode(char *response) {
    response[24] = 0b00000000;
    response[25] = 0b00000000;
    response[26] = 0b00000100;
    response[27] = (0b00000100 % 100);
    
    char reason[128] = "Bad Request: The request was malformed. Do not retry the request without modification from previous attempt.";
    
    for(int i = 28; i <= (28 + sizeof(reason)); i++) {
        for(int j = 0; j <= sizeof(reason); j++) {
            response[i] = reason[j];
        }
    }
}

void findXPort(uint16_t clientPort) {
     XPORT = clientPort ^ 0x2112;
}

void findXAddress(uint32_t ip) {
    X_ADDRESS = ip ^ 0x2112A442;
}

void successResponse(char* buffer, char* response) {
    bool request = checkValidity(buffer);
    
    if(request = true) {
        response[0] = SUCCESS_RESPONSE >> 8;
        response[1] = SUCCESS_RESPONSE & 255;
        response[2] = ATTRIBUTE_LENGTH >> 8;
        response[3] = ATTRIBUTE_LENGTH & 255;
        for(int i = 4; i < 20; i++) {
            response[i] = buffer[i];
        }
        response[20] = XORMAPPED_ADDRESS_TYPE >> 8;
        response[21] = XORMAPPED_ADDRESS_TYPE & 255;
        response[22] = SUCCESS_RESPONSE_ATTRIBUTE_LENGTH >> 8;
        response[23] = SUCCESS_RESPONSE_ATTRIBUTE_LENGTH & 255;
        XORMappedResponse(response);
    }else {
        response[0] = ERROR_RESPONSE >> 8;
        response[1] = ERROR_RESPONSE & 255;
        response[2] = ATTRIBUTE_LENGTH >> 8;
        response[3] = ATTRIBUTE_LENGTH & 255;
        for(int i = 4; i < 20; i++) {
            response[i] = buffer[i];
        }
        response[20] = ERROR_CODE_ADDRESS_TYPE >> 8;
        response[21] = ERROR_CODE_ADDRESS_TYPE & 255;
        char reason[128] = "Bad Request: The request was malformed. Do not retry the request without modification from previous attempt.";
        
        int length = sizeof(reason);
        response[22] = (ERROR_RESPONSE_ATTRIBUTE_LENGTH + length) >> 8;
        response[23] = (ERROR_RESPONSE_ATTRIBUTE_LENGTH + length) & 255;
        ErrorCode(response);
    }
}