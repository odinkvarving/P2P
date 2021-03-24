#include <iostream>
#ifndef HEADER_H
#define HEADER_H

bool checkIfRequest(char* buffer);

bool checkMagicCookie(char* buffer);

bool checkValidity(char* buffer);

uint16_t checkMessageType(char* buffer);

void XORMappedResponse(char *response);


void findXPort(uint16_t clientPort);

void findXAddress(uint32_t ip);

void stunResponse(char* buffer, char* response);


#endif













