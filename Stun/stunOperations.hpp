#include <iostream>

bool checkIfRequest(char* buffer);

bool checkMagicCookie(char* buffer);

bool checkValidity(char* buffer);

uint16_t checkMessageType(char* buffer);

void XORMappedResponse(char *response);

void findXPort(unsigned short clientPort);

void findXAddress(unsigned int ip);

void successResponse(char* buffer, char* response);













