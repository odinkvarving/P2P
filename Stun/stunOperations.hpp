#include <iostream>

bool checkIfRequest(char* buffer);

bool checkMagicCookie(char* buffer);

bool checkValidity(char* buffer);

uint16_t checkMessageType(char* buffer);

void XORMappedResponse(char *response);

void findXPort(uint16_t clientPort);

void findXAddress(uint32_t ip);

void successResponse(char* buffer, char* response);













