#include "stunOperations.hpp"
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
#define ERROR_RESPONSE_ATTRIBUTE_LENGTH 0b00000100
#define ERROR_CODE_ADDRESS_TYPE 0b0000000000001001


uint16_t XPORT;
uint32_t X_ADDRESS;

/*
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1    
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |0 0| STUN Message Type        |     Message Length             |
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

//Function for checking if received array contains valid attributes for a stun-request (message length always zero)
bool checkIfRequest(char* buffer) {
    bool request;
    if(buffer[3] == 0 && buffer[4] == 0) {
        request = true;
    }else {
        request = false;
    }
    return request;
}

//Function for checking if Magic Cookie in received array contains the standard value 0x2112A442
bool checkMagicCookie(char* buffer) {
    bool valid;
    if(buffer[4] == 0x21 && buffer[5] == 0x12 && buffer[6] == 0xA4 && buffer[7] == 0x42) {
        valid = true;
    }else {
        valid = false;
    }
    return valid;
}

//Function for checking that 2 MSB = 0, first 8 bits in length = 0 and that Magic cookie is valid
bool checkValidity(char* buffer) {
    bool valid;
   if(buffer[0] >> 6 == 0 && buffer[3] & 0x00000000 == 0 && checkMagicCookie(buffer)) {
       valid = true;
    }else {
        valid = false;
    }
    return valid;   
}

//Function for checking the 'Message type' as specified in RFC Appendix A.
uint16_t checkMessageType(uint16_t msg_type) {
    
    if(((msg_type) & 0x0110) == 0x0000) {
        return BINDING_REQUEST;
    }else if(((msg_type) & 0x0110) == 0x0010) {
        return INDICATION;
    }else if(((msg_type) & 0x0110) == 0x0100) {
        return SUCCESS_RESPONSE;
    }else if(((msg_type) & 0x0110) == 0x0110) {
        return ERROR_RESPONSE;
    }
    return 0;
}

//Function for filling 'Value' part of Attribute header with correct bytes for XOR-MAPPED-ADDRESS
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

//Function for filling 'Value' part of Attribute header with correct bytes for ERROR-CODE 
void ErrorCode(char *response) {
    response[24] = 0b00000000;
    response[25] = 0b00000000;
    response[26] = 0b00000100;
    response[27] = (0b00000100 % 100);
    
    char reason[] = "Bad Request: The request was malformed. Do not retry the request without modification from previous attempt.";

    for(int i = 28; i <= (28 + sizeof(reason)); i++) {
        for(int j = 0; j <= sizeof(reason); j++) {
            response[i] = reason[j];
        }
    }
}

//Helper-function used for passing client's port found in recvfrom()-function in main - then initializing local variable 'XPORT' with this value
void findXPort(uint16_t clientPort) {
     XPORT = clientPort ^ 0x2112;
}

//Helper-function used for passing client's IP-address from recvfrom()-function in main - then initializing local variable 'X_ADDRESS' with this value
void findXAddress(uint32_t ip) {
    X_ADDRESS = ip ^ 0x2112A442;
}

//Main function for filling 'response' array with correct values corresponding to either a 'success response' or 'error response'
void stunResponse(char* buffer, char* response) {
    bool request = checkValidity(buffer);
    
    if(request = true) {
        response[0] = SUCCESS_RESPONSE >> 8;        //[0] and [1] - Message Type
        response[1] = SUCCESS_RESPONSE & 255;
        response[2] = ATTRIBUTE_LENGTH >> 8;        //[2] and [3] - Message Length 
        response[3] = ATTRIBUTE_LENGTH & 255;
        for(int i = 4; i < 20; i++) {
            response[i] = buffer[i];                //[4] to [19] - Magic Cookie and Transaction ID
        }
        response[20] = XORMAPPED_ADDRESS_TYPE >> 8;                //[20] and [21] - Type
        response[21] = XORMAPPED_ADDRESS_TYPE & 255;
        response[22] = SUCCESS_RESPONSE_ATTRIBUTE_LENGTH >> 8;     //[22] and [23] - Length
        response[23] = SUCCESS_RESPONSE_ATTRIBUTE_LENGTH & 255;
        XORMappedResponse(response);                               //[24] to [31] - Value
    //If any of the attributes in the received array are incorrect                             
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
        
        char reason[] = "Bad Request: The request was malformed. Do not retry the request without modification from previous attempt.";
        int length = sizeof(reason);
        
        response[22] = (ERROR_RESPONSE_ATTRIBUTE_LENGTH + length) >> 8;
        response[23] = (ERROR_RESPONSE_ATTRIBUTE_LENGTH + length) & 255;
        ErrorCode(response);
    }
}