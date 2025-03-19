from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from typing import Dict, List, Optional, Union

app = FastAPI()
server_factory = IEC60870ServerFactory()

class ServerConfig(BaseModel):
    ip: str = "0.0.0.0"
    port: int = 2404
    
class DataPointConfig(BaseModel):
    type: str
    value: Union[int, bool, float]
    event: bool = False

@app.post("/servers/")
def create_server(server_id: str, config: ServerConfig):
    server = server_factory.create_server(server_id, config.ip, config.port)
    if server.start() == 0:
        return {"status": "success", "server_id": server_id}
    raise HTTPException(500, "Failed to start server")

@app.delete("/servers/{server_id}")
def delete_server(server_id: str):
    if server_factory.remove_server(server_id):
        return {"status": "success"}
    raise HTTPException(404, f"Server {server_id} not found")

@app.post("/servers/{server_id}/datapoints")
def add_datapoint(server_id: str, ioa: int, config: DataPointConfig):
    server = server_factory.get_server(server_id)
    if not server:
        raise HTTPException(404, f"Server {server_id} not found")
        
    type_map = {
        "MeasuredValueScaled": lib60870.MeasuredValueScaled,
        "SinglePointInformation": lib60870.SinglePointInformation,
        "DoublePointInformation": lib60870.DoublePointInformation,
        "SingleCommand": lib60870.SingleCommand,
        "DoubleCommand": lib60870.DoubleCommand
    }
    
    if config.type not in type_map:
        raise HTTPException(400, f"Unsupported data point type: {config.type}")
    
    if server.add_ioa(ioa, type_map[config.type], config.value, None, config.event) == 0:
        return {"status": "success", "ioa": ioa}
    
    raise HTTPException(400, f"IOA {ioa} already exists")

@app.put("/servers/{server_id}/datapoints/{ioa}")
def update_datapoint(server_id: str, ioa: int, value: Union[int, float, bool] = Body(...)):
    server = server_factory.get_server(server_id)
    if not server:
        raise HTTPException(404, f"Server {server_id} not found")
    
    if server.update_ioa(ioa, value) == 0:
        return {"status": "success"}
    
    raise HTTPException(404, f"IOA {ioa} not found")
  
  
def main():
    config_manager = ConfigurationManager("servers_config.json")
    
    # Load all configured servers
    for server_id, config in config_manager.configs.items():
        server = server_factory.create_server(
            server_id, 
            config.get("ip", "0.0.0.0"), 
            config.get("port", 2404)
        )
        
        # Add data points
        for data_type, points in config.get("datapoints", {}).items():
            for ioa, point_config in points.items():
                # Map data type string to actual type
                type_obj = getattr(lib60870, data_type)
                server.add_ioa(
                    int(ioa),
                    type_obj,
                    point_config.get("value", 0),
                    None,
                    point_config.get("event", False)
                )
        
        # Start the server
        server.start()
    
    # Start FastAPI with uvicorn
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    main()