class IEC60870ServerFactory:
    def __init__(self):
        self.servers = {}
    
    def create_server(self, server_id, ip="0.0.0.0", port=2404):
        if server_id in self.servers:
            return self.servers[server_id]
            
        server = IEC60870_5_104_server(ip)
        server.set_port(port)  # You'll need to add this method to the server class
        self.servers[server_id] = server
        return server
        
    def get_server(self, server_id):
        return self.servers.get(server_id)
        
    def remove_server(self, server_id):
        if server_id in self.servers:
            server = self.servers[server_id]
            server.stop()
            del self.servers[server_id]
            return True
        return False