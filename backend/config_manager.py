import os

class ConfigurationManager:
    def __init__(self, initial_configs=None):
        self.configs = initial_configs or {}
    
    def get_server_config(self, server_id):
        return self.configs.get(server_id, {})
    
    def set_server_config(self, server_id, config):
        self.configs[server_id] = config
    
    def get_point_config(self, server_id, point_type, point_id):
        server_config = self.get_server_config(server_id)
        type_config = server_config.get(point_type, {})
        return type_config.get(point_id)
    
    def set_point_config(self, server_id, point_type, point_id, value):
        if server_id not in self.configs:
            self.configs[server_id] = {}
        
        if point_type not in self.configs[server_id]:
            self.configs[server_id][point_type] = {}
            
        self.configs[server_id][point_type][point_id] = value
    
    def delete_point_config(self, server_id, point_type, point_id):
        if (server_id in self.configs and 
            point_type in self.configs[server_id] and 
            point_id in self.configs[server_id][point_type]):
            del self.configs[server_id][point_type][point_id]
            return True
        return False
    
    def get_all_servers(self):
        return list(self.configs.keys())
    
    def get_all_point_types(self, server_id):
        server_config = self.get_server_config(server_id)
        return list(server_config.keys())