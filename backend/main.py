from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from typing import Union
from server_manager import ServerManager
from config_manager import ConfigurationManager
import uvicorn

app = FastAPI()
server_manager = ServerManager()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)