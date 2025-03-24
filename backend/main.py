from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from typing import Union
import uvicorn
from dotenv import load_dotenv
import os
from lib.libiec60870server import IEC60870_5_104_server

load_dotenv()

FASTAPI_HOST = os.getenv("FASTAPI_HOST")
FASTAPI_PORT = int(os.getenv("FASTAPI_PORT"))

IEC_SERVER_HOST = os.getenv("IEC_104_SERVER_HOST")
IEC_SERVER_PORT = int(os.getenv("IEC_104_SERVER_PORT"))

CONFIG = {}
IEC_SERVER = IEC60870_5_104_server(IEC_SERVER_HOST, IEC_SERVER_PORT)

app = FastAPI()

if __name__ == "__main__":
    uvicorn.run(app, host=FASTAPI_HOST, port=FASTAPI_PORT)